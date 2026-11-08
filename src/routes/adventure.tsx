import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowRight, BookOpen, Gamepad2, KeyRound, Sparkles, RotateCcw, Bookmark, Hourglass } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeading, pageMeta } from '@/components/studio-layout';
import { useStudio } from '@/components/studio-context';
import { useServerFn } from '@tanstack/react-start';
import { startAdventure, advanceAdventure } from '@/lib/ai.functions';
import { SPARK_REWARDS } from '@/lib/sparks';

export const Route = createFileRoute('/adventure')({ head: () => pageMeta('Live Adventure', 'Step inside a living story — AI narrates a world around you and every choice changes the tale.'), component: Adventure });
function Adventure() {
  const { save, setSparks } = useStudio();
  const beginTale = useServerFn(startAdventure);
  const stepTale = useServerFn(advanceAdventure);
  const [started, setStarted] = useState(false);
  const [archetype, setArchetype] = useState('The Star-Wanderer');
  const [difficulty, setDifficulty] = useState('Dreamer');
  const [sessionId, setSessionId] = useState('');
  const [scene, setScene] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [path, setPath] = useState<string[]>([]);
  const [ended, setEnded] = useState(false);
  const [ending, setEnding] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const turn = path.length + 1;

  const begin = async () => {
    setLoading(true);
    try {
      const res = await beginTale({ data: { archetype, difficulty } });
      setSessionId(res.sessionId); setScene(res.scene); setChoices(res.choices);
      setPath([]); setEnded(false); setEnding(''); setStarted(true); setSaved(false);
    } catch {
      toast.error('The doorway would not open. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const choose = async (choice: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await stepTale({ data: { sessionId, choice } });
      setPath(prev => [...prev, choice]);
      setSparks(res.sparks);
      if (res.ended) { setEnded(true); setEnding(res.ending); }
      else { setScene(res.scene); setChoices(res.choices); }
    } catch {
      toast.error('The mists swallowed that step. Choose once more.');
    } finally {
      setLoading(false);
    }
  };

  const restart = () => { setStarted(false); setSessionId(''); setScene(''); setChoices([]); setPath([]); setEnded(false); setEnding(''); setSaved(false); };
  const certificate = `# The Unwritten Door\n\n${archetype} · ${difficulty}\n\n${path.map((choice, index) => `Chapter ${index + 1}: ${choice}`).join('\n\n')}\n\n${ending}\n\nBadge earned: Word Alchemist`;
  return <div className="tool-page"><PageHeading eyebrow="YOUR CHOICES. YOUR UNIVERSE." title="Live the story." description="A world narrated around you. Every choice writes a different tale." icon={Gamepad2} /><div className="game-stage">{!started ? <><span className="eyebrow">A LIVE TALE · NARRATED AS YOU PLAY</span><div className="narrative">Somewhere between the first word and the last, a world is waiting for you. Who will you become?</div><span className="field-label">Choose your archetype</span><div className="chip-list">{['The Alchemist', 'The Rogue Chronomancer', 'The Star-Wanderer'].map(value => <Button variant={archetype === value ? 'secondary' : 'outline'} key={value} onClick={() => setArchetype(value)} aria-pressed={archetype === value}>{value}</Button>)}</div><span className="field-label">Choose your journey</span><div className="chip-list">{['Dreamer', 'Adventurer'].map(value => <Button key={value} variant={difficulty === value ? 'secondary' : 'outline'} onClick={() => setDifficulty(value)}>{value}</Button>)}</div><Button variant="enchanted" className={`wide-action ${loading ? 'conjuring' : ''}`} onClick={() => void begin()} disabled={loading}><Sparkles />{loading ? 'Parting the mists…' : 'Enter the unwritten world'}<ArrowRight /></Button><span className="demo-note">Narrated live by AI · 25 sparks for every choice</span></>
    : ended ? <><span className="eyebrow"><Sparkles size={14} /> WORD ALCHEMIST · {path.length * SPARK_REWARDS.adventureChoice} SPARKS EARNED</span><h2 className="mt-4 text-4xl">An ending only you could write.</h2><div className="narrative">{ending}</div><div className="output-bottom"><Button variant="enchanted" disabled={saved} onClick={() => void (async () => { const ok = await save({ title: 'The Unwritten Door — My Adventure', kind: 'Story', genre: 'Interactive Fantasy', content: certificate }); if (ok) { setSaved(true); toast.success('Your story certificate is saved in the vault.'); } else toast.error('The vault refused the certificate. Try again.'); })()}><Bookmark />{saved ? 'Certificate saved' : 'Save story certificate'}</Button><Button variant="outline" onClick={restart}><RotateCcw />Write another destiny</Button></div></>
    : <><div className="game-meta"><span>TURN {turn} · {archetype.toUpperCase()} · {difficulty.toUpperCase()}</span><span>{SPARK_REWARDS.adventureChoice} sparks per choice</span></div><div className="narrative">{scene}</div>{loading ? <div className="choice-loading"><Hourglass size={16} /> The mists part…</div> : <div className="choice-list">{choices.map((choice, index) => <Button variant="glass" key={choice} disabled={loading} onClick={() => void choose(choice)}><span>{String.fromCharCode(65 + index)} &nbsp; {choice}</span><ArrowRight /></Button>)}</div>}<div className="inventory"><span><BookOpen size={15} /> A living tale</span>{path.length > 0 && <span><KeyRound size={15} /> {path[path.length - 1]}</span>}<span><Sparkles size={15} /> {path.length * SPARK_REWARDS.adventureChoice} sparks earned</span></div></>}</div></div>;
}

import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { BookOpen, Clapperboard, Sparkles, Shuffle, Copy, Download, Bookmark, ArrowRight, Maximize2, X, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeading, pageMeta } from '@/components/studio-layout';
import { useStudio } from '@/components/studio-context';
import { useServerFn } from '@tanstack/react-start';
import { generateStory } from '@/lib/ai.functions';
import { genres, twists, type IdeaMode } from '@/lib/story-engine';

type Idea = { title: string; sections: Record<string, string>; content: string };

export const Route = createFileRoute('/generator')({ validateSearch: (search: Record<string, unknown>): { seed?: string } => ({ seed: typeof search['seed'] === 'string' ? search['seed'] : '' }), head: () => pageMeta('Idea Generator', 'Create story hooks, screenplay scenes, three-act outlines and surprising twists in the Beyond A-Z writing studio.'), component: Generator });
function Generator() {
  const search = Route.useSearch();
  const { save, setSparks } = useStudio();
  const weaveStory = useServerFn(generateStory);
  const [seed, setSeed] = useState(search.seed || '');
  const [mode, setMode] = useState<IdeaMode>('Story');
  const [genre, setGenre] = useState(genres[0]);
  const [tone, setTone] = useState(50);
  const [twist, setTwist] = useState(twists[0] || 'A clock that ticks backwards');
  const [output, setOutput] = useState<Idea | null>(null);
  const [tab, setTab] = useState('Logline / Hook');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focus, setFocus] = useState(false);
  const [writing, setWriting] = useState('');
  const [panic, setPanic] = useState('Even the best stories begin with a blank page.');
  const generate = async () => {
    setLoading(true); setSaved(false);
    try {
      const result = await weaveStory({ data: { seed, genre: genre || 'High Fantasy', mode, twist: twist || twists[0] || '', tone } });
      setOutput(result.idea); setWriting(result.idea.content); setTab('Logline / Hook'); setSparks(result.sparks);
      if (result.source === 'offline') toast.info('The stardust drifted — woven from the offline archive instead. Try again for a live weave.');
    } catch {
      toast.error('The weave slipped through the portal. Try once more.');
    } finally {
      setLoading(false);
    }
  };
  const saveIdea = async () => {
    if (!output) return;
    const ok = await save({ title: output.title, kind: mode, genre: genre || '', content: writing || output.content });
    if (ok) { setSaved(true); toast.success('Your spark is safe in the Lore Vault.'); }
    else toast.error('The vault refused the spark. Try again.');
  };
  const exportIdea = () => { if (!output) return; const url = URL.createObjectURL(new Blob([writing || output.content], { type: 'text/markdown' })); const a = document.createElement('a'); a.href = url; a.download = `${output.title}.md`; a.click(); URL.revokeObjectURL(url); };
  return <div className="tool-page"><PageHeading eyebrow="THE FIRST WORD OF A NEW WORLD" title="Ignite your next story." description="A dream, a what-if, an impossible thought. Let’s see where it leads." icon={Sparkles} /><div className="studio-grid"><div className="control-panel"><div className="segmented" aria-label="Writing mode">{(['Story', 'Script'] as const).map(value => <Button key={value} variant={mode === value ? 'secondary' : 'ghost'} onClick={() => setMode(value)} aria-pressed={mode === value}>{value === 'Story' ? <BookOpen /> : <Clapperboard />}{value === 'Story' ? 'Story prose' : 'Script & screenplay'}</Button>)}</div><label className="field-label" htmlFor="story-seed">Your seed of an idea</label><textarea id="story-seed" className="studio-input" placeholder="What if a library held every story that was never written?" value={seed} onChange={e => setSeed(e.target.value)} /><span className="field-label">Choose a realm</span><div className="chip-list">{genres.map(value => <Button key={value} variant={genre === value ? 'secondary' : 'outline'} aria-pressed={genre === value} onClick={() => setGenre(value)}>{value}</Button>)}</div><label className="field-label" htmlFor="tone">Tone & atmosphere</label><input id="tone" className="tone-slider" type="range" min={0} max={100} value={tone} onChange={e => setTone(Number(e.target.value))} /><div className="tone-labels"><span>Dark & gritty</span><span>Light & whimsical</span></div><span className="field-label">A little unexpected magic</span><Button variant="outline" className="w-full h-auto whitespace-normal text-left text-xs justify-start" onClick={() => setTwist(twists[(twists.indexOf(twist) + 1) % twists.length] || twists[0] || '')}><Shuffle />{twist}</Button><Button variant="enchanted" className={`wide-action ${loading ? 'conjuring' : ''}`} onClick={() => void generate()} disabled={loading}><Sparkles />{loading ? 'Gathering the stardust…' : 'Conjure an Idea'}<ArrowRight /></Button><span className="demo-note">Every idea is woven live by AI · 10 sparks each</span></div><div className="output-area">{output ? <><div className="output-header"><div><span className="eyebrow">{mode} · {genre}</span><h2>{output.title}</h2></div><div className="icon-actions"><Button variant="ghost" size="icon" title="Copy draft" aria-label="Copy draft" onClick={async () => { try { await navigator.clipboard.writeText(writing || output.content); toast.success('Copied to clipboard.'); } catch { toast.error('Clipboard unavailable. Download your draft instead.'); } }}><Copy /></Button><Button variant="ghost" size="icon" title="Export Markdown" aria-label="Export Markdown" onClick={exportIdea}><Download /></Button><Button variant="ghost" size="icon" title="Focus writing" aria-label="Focus writing" onClick={() => setFocus(true)}><Maximize2 /></Button></div></div><div className="output-tabs">{Object.keys(output.sections).map(value => <Button key={value} variant={tab === value ? 'secondary' : 'ghost'} onClick={() => setTab(value)} aria-pressed={tab === value}>{value}</Button>)}</div><div className={`narrative ${mode === 'Script' && tab === 'Sample Scene' ? 'screenplay' : ''}`}>{output.sections[tab]}</div><div className="output-bottom"><Button variant="enchanted" onClick={() => void saveIdea()} disabled={saved}><Bookmark />{saved ? 'Saved to Lore Vault' : 'Save to Lore Vault'}</Button><Button variant="outline" asChild><Link to="/characters" search={{ name: 'Mira', seed }} >Weave this character<ArrowRight /></Link></Button></div></> : <div className="output-empty"><BookOpen /><span className="eyebrow">THE PAGE IS YOURS</span><h2>A universe, not yet written.</h2><p>Your next story is waiting just beyond the edge of an idea.</p></div>}</div></div><div className="block-break"><div><h3>Writer’s block? Take the side door.</h3><p>{panic}</p></div><Button variant="outline" onClick={() => { const prompts = ['A ghost applies for a job as a haunted-house inspector.', 'The moon has sent you an invoice. It is overdue.', 'Your shadow returns from holiday with a secret.', 'A dragon opens a bakery, but only sells apologies.']; setPanic(prompts[Math.floor(Math.random() * prompts.length)] || 'The moon has sent you an invoice.'); }}><Lightbulb />Surprise me</Button></div>{focus && <div className="focus-overlay"><div className="focus-header"><h2>{output?.title}</h2><div className="icon-actions"><Button variant="ghost" size="icon" onClick={() => void saveIdea()} title="Save writing" aria-label="Save writing"><Bookmark /></Button><Button variant="ghost" size="icon" onClick={() => setFocus(false)} title="Exit focus mode" aria-label="Exit focus mode"><X /></Button></div></div><textarea aria-label="Your story draft" value={writing} onChange={e => { setWriting(e.target.value); setSaved(false); }} /></div>}</div>;
}

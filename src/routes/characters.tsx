import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { WandSparkles, Bookmark, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeading, pageMeta } from '@/components/studio-layout';
import { useStudio } from '@/components/studio-context';
import { useServerFn } from '@tanstack/react-start';
import { generateCharacter, type WovenCharacter } from '@/lib/ai.functions';
import archivist from '@/assets/archivist.jpg';

export const Route = createFileRoute('/characters')({ validateSearch: (search: Record<string, unknown>): { name?: string; seed?: string } => ({ name: typeof search['name'] === 'string' ? search['name'] : '', seed: typeof search['seed'] === 'string' ? search['seed'] : '' }), head: () => pageMeta('Character Weaver', 'Create unforgettable character portraits and profiles with AI — appearance, flaws, motivations and hidden secrets.'), component: Characters });
function Characters() {
  const search = Route.useSearch();
  const { save, setSparks } = useStudio();
  const weaveCharacter = useServerFn(generateCharacter);
  const [name, setName] = useState(search.name || 'Mira');
  const [archetype, setArchetype] = useState('The reluctant hero');
  const [appearance, setAppearance] = useState('');
  const [style, setStyle] = useState('Cinematic Film Still');
  const [profile, setProfile] = useState<WovenCharacter | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const content = profile ? `# ${profile.name}\n\n${profile.archetype}\n\nAppearance: ${profile.appearance}\n\nMotivation: ${profile.motivation}\n\nHidden secret: ${profile.hiddenSecret}\n\nFatal flaw: ${profile.fatalFlaw}\n\nVisual direction: ${profile.style}\n\nVoice: ${profile.voice}` : '';
  const weave = async () => {
    setLoading(true); setSaved(false);
    try {
      const result = await weaveCharacter({ data: { name, archetype, appearance: appearance.trim() || 'An enigmatic figure lit by teal starlight and antique gold', style } });
      setProfile(result.character); setSparks(result.sparks);
      if (!result.character.imageUrl) toast.info('The portrait easel was shy — the lore arrived without a portrait. Try again for the image.');
    } catch {
      toast.error('The weave slipped through the portal. Try once more.');
    } finally {
      setLoading(false);
    }
  };
  return <div className="tool-page"><PageHeading eyebrow="SOME CHARACTERS REFUSE TO STAY ON THE PAGE" title="Give imagination a soul." description="A name, a face, a secret. AI paints them into your world." icon={WandSparkles} /><div className="studio-grid"><form className="control-panel" onSubmit={e => { e.preventDefault(); void weave(); }}><div><label className="field-label" htmlFor="character-name">Character name</label><input id="character-name" className="studio-input" value={name} onChange={e => setName(e.target.value)} required maxLength={60} /></div><div><label className="field-label" htmlFor="character-archetype">Archetype</label><input id="character-archetype" className="studio-input" value={archetype} onChange={e => setArchetype(e.target.value)} required maxLength={100} /></div><div><label className="field-label" htmlFor="character-appearance">Appearance details</label><textarea id="character-appearance" className="studio-input" rows={4} value={appearance} onChange={e => setAppearance(e.target.value)} placeholder="Silver braided hair, teal stormcloak, a scar over the left eye, carrying an unwritten book…" /></div><span className="field-label">Visual direction</span><div className="chip-list">{['Anime Fantasy', 'Dark Renaissance', 'Cinematic Film Still', 'Oil Painting'].map(value => <Button type="button" key={value} variant={style === value ? 'secondary' : 'outline'} onClick={() => setStyle(value)} aria-pressed={style === value}>{value}</Button>)}</div><Button variant="enchanted" type="submit" className={`wide-action ${loading ? 'conjuring' : ''}`} disabled={loading}><Sparkles />{loading ? 'Weaving a soul…' : 'Weave my character'}<ArrowRight /></Button><span className="demo-note">Portraits and lore are woven live by AI · 10 sparks each</span></form><div className="output-area"><img className="character-image" src={profile?.imageUrl || archivist} alt={profile ? `AI-painted portrait of ${profile.name}` : 'Illustrative fantasy concept of an archivist holding a glowing book'} width={1024} height={1024} /><div className="output-header mt-6"><div><span className="eyebrow">{profile ? profile.archetype : 'A SOUL WAITING TO BE WOVEN'}</span><h2>{profile ? profile.name : 'The keeper of unwritten stories'}</h2></div></div>{profile ? <><div className="character-details"><div><h4>MOTIVATION</h4><p>{profile.motivation}</p></div><div><h4>HIDDEN SECRET</h4><p>{profile.hiddenSecret}</p></div><div><h4>FATAL FLAW</h4><p>{profile.fatalFlaw}</p></div><div><h4>APPEARANCE</h4><p>{profile.appearance}</p></div><div><h4>VISUAL DIRECTION</h4><p>{profile.style}</p></div></div><div className="narrative">{profile.voice}</div><div className="output-bottom"><Button variant="enchanted" disabled={saved} onClick={() => void (async () => { const ok = await save({ title: profile.name, kind: 'Character', genre: profile.archetype, content }); if (ok) { setSaved(true); toast.success('Your character is saved in the Lore Vault.'); } else toast.error('The vault refused the soul. Try again.'); })()}><Bookmark />{saved ? 'Saved to Lore Vault' : 'Save to Lorebook'}</Button><Button variant="outline" asChild><Link to="/generator" search={{ seed: `A story about ${profile.name}, ${profile.archetype}, ${profile.appearance}` }}>Write their story<ArrowRight /></Link></Button></div></> : <p className="text-muted-foreground text-xs leading-7">A name, a face, a secret. The beginning of someone unforgettable — painted live by AI.</p>}</div></div></div>;
}

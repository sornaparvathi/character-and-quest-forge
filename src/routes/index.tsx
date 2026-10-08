import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Feather, Gamepad2, Sparkles, WandSparkles, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageMeta } from '@/components/studio-layout';
import portal from '@/assets/celestial-portal.jpg';

export const Route = createFileRoute('/')({ head: () => pageMeta('Story & Script Idea Generator', 'Step beyond the alphabet. Discover story and screenplay ideas, weave characters and explore your own adventure.'), component: Index });
const quotes = ['Between 26 letters hides an infinite multiverse.', 'Every unwritten story is a universe waiting to exist.', 'Ordinary letters. Extraordinary possibilities.'];
const realms = [
  { number: '01', icon: Feather, title: 'Ignite an idea', description: 'A whisper of a thought. A world of possibilities. Find the story waiting inside you.', link: '/generator', action: 'Open the generator', tone: 'teal' },
  { number: '02', icon: WandSparkles, title: 'Weave a character', description: 'Give your imagination a face. Create the heroes, misfits, and villains of your world.', link: '/characters', action: 'Meet your characters', tone: 'violet' },
  { number: '03', icon: Gamepad2, title: 'Live the adventure', description: 'Step inside the story. Choose your path, change your fate, and discover what lies beyond.', link: '/adventure', action: 'Begin your adventure', tone: 'gold' },
] as const;
function Index() {
  const [quote, setQuote] = useState(0);
  const [seed, setSeed] = useState('');
  const navigate = useNavigate();
  useEffect(() => { const timer = setInterval(() => setQuote(q => (q + 1) % quotes.length), 6500); return () => clearInterval(timer); }, []);
  return <>
    <section className="portal-hero">
      <img className="portal-background" src={portal} alt="An open spellbook beneath a golden portal in a celestial world" width={1920} height={1024} fetchPriority="high" />
      <div className="portal-shade" />
      <div className="hero-content"><span className="hero-eyebrow"><span /> A SANCTUARY FOR YOUR IMAGINATION <span /></span><h1>Story & Script<br /><em>Idea Generator</em></h1><p className="hero-subtitle">Beyond A to Z, a universe awaits.</p><p className="hero-description">Turn the spark of a thought into stories, characters, and worlds.<br className="desktop-break" /> Your imagination was never meant to stop at Z.</p><div className="hero-buttons"><Button variant="enchanted" size="lg" asChild><Link to="/generator"><Sparkles /> Ignite a Spark <ArrowRight /></Link></Button><Button variant="glass" size="lg" asChild><Link to="/adventure"><Gamepad2 /> Enter the Tale</Link></Button></div><div className="hero-quote"><Quote size={13} /><span key={quote}>{quotes[quote]}</span><div className="quote-dots">{quotes.map((_, index) => <Button variant="ghost" key={index} className={index === quote ? 'quote-dot selected' : 'quote-dot'} aria-label={`Show quote ${index + 1}`} onClick={() => setQuote(index)} />)}</div></div></div>
      <div className="hero-bottom"><span>✧ &nbsp; WHERE IMAGINATION BECOMES POSSIBILITY &nbsp; ✧</span><span className="scroll-line" /></div>
    </section>
    <section className="realm-section"><div className="section-heading"><span className="eyebrow">THE POSSIBILITIES ARE INFINITE</span><h2>One spark. <em>Endless worlds.</em></h2><p>Choose a doorway. See where your imagination takes you.</p></div><div className="realm-grid">{realms.map(realm => <Link to={realm.link} key={realm.number} className={`realm-card ${realm.tone}`}><div className="realm-top"><span className="realm-icon"><realm.icon size={24} /></span><span className="realm-number">{realm.number} /</span></div><h3>{realm.title}</h3><p>{realm.description}</p><span className="realm-link">{realm.action}<ArrowRight size={15} /></span></Link>)}</div></section>
    <section className="quick-section"><div><span className="eyebrow"><Sparkles size={13} /> EVERY GREAT STORY STARTS SOMEWHERE</span><h2>What’s your <em>first spark?</em></h2></div><form onSubmit={e => { e.preventDefault(); navigate({ to: '/generator', search: { seed } }); }} className="quick-form"><Sparkles size={20} /><input aria-label="Your first story spark" placeholder="A forgotten kingdom. A time heist. A wild dream…" value={seed} onChange={e => setSeed(e.target.value)} /><Button variant="enchanted" type="submit">Bring it to life <ChevronRight /></Button></form><div className="quick-suggestions"><span>A little inspiration:</span>{['A city above the clouds', 'The last time traveler', 'A library of lost dreams'].map(text => <Button key={text} variant="ghost" onClick={() => setSeed(text)}>{text}<ArrowRight size={12} /></Button>)}</div></section>
    <section className="philosophy"><BookOpen size={22} /><p>“The alphabet ends at Z.<br /><em>Your imagination doesn’t.</em>”</p><span>THE BEYOND A-Z PHILOSOPHY</span></section>
  </>;
}

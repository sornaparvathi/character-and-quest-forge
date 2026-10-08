import { Link } from '@tanstack/react-router';
import { useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, BookOpen, Feather, Gamepad2, Menu, Sparkles, UserRound, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useStudio } from './studio-context';
import logo from '@/assets/logo.png.asset.json';

const links = [{ to: '/', label: 'The Portal' }, { to: '/generator', label: 'Idea Generator' }, { to: '/characters', label: 'Character Weaver' }, { to: '/adventure', label: 'Your Adventure' }, { to: '/vault', label: 'Lore Vault' }] as const;
export function StudioLayout({ children }: { children: ReactNode }) {
  const { sparks, name, setName } = useStudio();
  const [menu, setMenu] = useState(false);
  const [circle, setCircle] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [sound, setSound] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const toggleSound = () => {
    if (sound) { void audio.current?.close(); audio.current = null; setSound(false); return; }
    const context = new AudioContext(); audio.current = context;
    const gain = context.createGain(); gain.gain.value = 0.015; gain.connect(context.destination);
    [130.81, 196, 261.63].forEach(frequency => { const oscillator = context.createOscillator(); oscillator.frequency.value = frequency; oscillator.connect(gain); oscillator.start(); });
    setSound(true);
  };
  return <div className="studio-shell">
    <header className="site-header">
      <Link to="/" className="brand"><img src={logo.url} alt="Beyond A-Z open book and imagination portal logo" width={48} height={48} /><span><strong>Beyond A-Z<span className="brand-star">✧</span></strong><small>TRANSCEND THE ALPHABET</small></span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{links.map(link => <Link key={link.to} to={link.to} activeOptions={{ exact: true }} activeProps={{ className: 'nav-active' }}>{link.label}</Link>)}</nav>
      <div className="header-actions"><span className="spark-count"><Sparkles size={13} /> {sparks} <span>Sparks</span></span><Button variant="ghost" size="icon" onClick={toggleSound} aria-label={sound ? 'Mute ambience' : 'Play ambience'} title={sound ? 'Mute ambience' : 'Play ambience'}>{sound ? <Volume2 /> : <VolumeX />}</Button><Button variant="outline" className="circle-button" onClick={() => { setDraftName(name); setCircle(true); }}><UserRound />{name || 'Enter the Circle'}</Button><Button variant="ghost" size="icon" className="mobile-toggle" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">{menu ? <X /> : <Menu />}</Button></div>
    </header>
    {menu && <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(link => <Link key={link.to} to={link.to} onClick={() => setMenu(false)}>{link.label}<ArrowUpRight size={16} /></Link>)}</nav>}
    <main>{children}</main>
    <footer className="site-footer"><span className="footer-brand"><Feather size={16} /> Beyond A-Z</span><span>26 letters. Infinite possibilities.</span><span>Made for the stories only you can tell <Sparkles size={12} /></span></footer>
    <Dialog open={circle} onOpenChange={setCircle}><DialogContent><DialogHeader><DialogTitle>Enter the Circle</DialogTitle><DialogDescription>Your own little corner of the multiverse. This preview keeps your name and drafts on this device; no online account is created.</DialogDescription></DialogHeader><form onSubmit={e => { e.preventDefault(); setName(draftName.trim()); setCircle(false); }} className="space-y-4"><label className="field-label" htmlFor="writer-name">Your writer name</label><input id="writer-name" className="studio-input" value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="What shall we call you?" required maxLength={40} /><Button type="submit" className="w-full"><Sparkles /> Enter my studio</Button></form></DialogContent></Dialog>
  </div>;
}
export function PageHeading({ eyebrow, title, description, icon: Icon = BookOpen }: { eyebrow: string; title: string; description: string; icon?: typeof BookOpen }) {
  return <div className="page-heading"><span className="eyebrow"><Icon size={14} /> {eyebrow}</span><h1>{title}</h1><p>{description}</p></div>;
}
export const pageMeta = (title: string, description: string) => ({ meta: [{ title: `${title} — Beyond A-Z` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} — Beyond A-Z` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] });
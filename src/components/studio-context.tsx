import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Entry } from '@/lib/story-engine';

type Studio = { entries: Entry[]; save: (entry: Omit<Entry, 'id' | 'created' | 'favorite'>) => void; remove: (id: string) => void; star: (id: string) => void; sparks: number; reward: (count: number) => void; name: string; setName: (name: string) => void };
const StudioContext = createContext<Studio | null>(null);
export function StudioProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [sparks, setSparks] = useState(0);
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('beyond-az-studio') || '{}');
      if (Array.isArray(stored.entries)) setEntries(stored.entries);
      if (typeof stored.sparks === 'number') setSparks(stored.sparks);
      if (typeof stored.name === 'string') setName(stored.name);
    } catch { /* An unreadable local archive starts fresh. */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem('beyond-az-studio', JSON.stringify({ entries, sparks, name })); }, [entries, sparks, name, ready]);
  const value: Studio = {
    entries, sparks, name, setName,
    save: entry => setEntries(prev => [{ ...entry, id: crypto.randomUUID(), created: new Date().toISOString(), favorite: false }, ...prev]),
    remove: id => setEntries(prev => prev.filter(e => e.id !== id)),
    star: id => setEntries(prev => prev.map(e => e.id === id ? { ...e, favorite: !e.favorite } : e)),
    reward: count => setSparks(prev => prev + count),
  };
  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}
export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error('Studio provider is required');
  return context;
}
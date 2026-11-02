import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth-context';

export type Entry = {
  id: string;
  title: string;
  kind: 'Story' | 'Script' | 'Character';
  genre: string;
  content: string;
  favorite: boolean;
  created: string;
};

type EntryRow = {
  id: string;
  title: string;
  kind: string;
  genre: string;
  content: string;
  favorite: boolean;
  created_at: string;
};

const asKind = (kind: string): Entry['kind'] => (kind === 'Script' || kind === 'Character' ? kind : 'Story');
const mapRow = (row: EntryRow): Entry => ({
  id: row.id,
  title: row.title,
  kind: asKind(row.kind),
  genre: row.genre,
  content: row.content,
  favorite: row.favorite,
  created: row.created_at,
});

type Studio = {
  entries: Entry[];
  sparks: number;
  name: string;
  save: (entry: Omit<Entry, 'id' | 'created' | 'favorite'>) => Promise<boolean>;
  remove: (id: string) => void;
  star: (id: string) => void;
  reward: (count: number) => void;
  setSparks: (total: number) => void;
  setName: (name: string) => void;
};

const StudioContext = createContext<Studio | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const { user, hydrated } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [sparks, setSparksState] = useState(0);
  const [name, setNameState] = useState('');

  useEffect(() => {
    if (!hydrated || !user) {
      setEntries([]);
      setSparksState(0);
      setNameState('');
      return;
    }
    let cancelled = false;
    void (async () => {
      const [profile, saved] = await Promise.all([
        supabase.from('profiles').select('display_name, sparks').maybeSingle(),
        supabase.from('entries').select('*').order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;
      if (profile.data) {
        setSparksState(profile.data.sparks);
        setNameState(profile.data.display_name);
      }
      if (saved.data) setEntries((saved.data as EntryRow[]).map(mapRow));
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, user]);

  const value: Studio = {
    entries,
    sparks,
    name,
    setSparks: total => setSparksState(total),
    setName: next => {
      setNameState(next);
      void (async () => {
        const { data } = await supabase.auth.getUser();
        if (data.user) await supabase.from('profiles').update({ display_name: next }).eq('id', data.user.id);
      })();
    },
    save: async entry => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { data, error } = await supabase
        .from('entries')
        .insert({ user_id: auth.user.id, title: entry.title, kind: entry.kind, genre: entry.genre, content: entry.content })
        .select()
        .single();
      if (error || !data) return false;
      setEntries(prev => [mapRow(data as EntryRow), ...prev]);
      return true;
    },
    remove: id => {
      setEntries(prev => prev.filter(entry => entry.id !== id));
      void supabase.from('entries').delete().eq('id', id);
    },
    star: id => {
      const entry = entries.find(item => item.id === id);
      if (!entry) return;
      const next = !entry.favorite;
      setEntries(prev => prev.map(item => (item.id === id ? { ...item, favorite: next } : item)));
      void supabase.from('entries').update({ favorite: next }).eq('id', id);
    },
    reward: count => {
      void supabase.rpc('award_sparks', { amount: count }).then(({ data }) => {
        if (typeof data === 'number') setSparksState(data);
      });
    },
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error('Studio provider is required');
  return context;
}

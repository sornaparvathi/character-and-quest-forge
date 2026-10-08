import { describe, expect, it } from 'vitest';
import { createIdea, filterEntries, type Entry } from './story-engine';
describe('Story studio', () => {
  it('uses the supplied seed, genre and plot twist in a three-act story', () => {
    const idea = createIdea('Cyberpunk Time Heist', 'Cyberpunk Noir', 'Story', 'A clock that ticks backwards', 20);
    expect(idea.sections['Logline / Hook']).toContain('Cyberpunk Time Heist');
    expect(idea.sections['Three-Act Synopsis']).toContain('ACT III');
    expect(idea.sections['Plot Twist']).toBe('A clock that ticks backwards');
    expect(idea.content).toContain('Cyberpunk Noir');
  });
  it('formats script mode as a screenplay scene', () => {
    expect(createIdea('Lost dreams', 'High Fantasy', 'Script', 'A secret', 50).sections['Sample Scene']).toContain('INT. FORBIDDEN ARCHIVE — NIGHT');
    expect(createIdea('Lost dreams', 'High Fantasy', 'Story', 'A secret', 50).sections['Sample Scene']).not.toContain('INT. FORBIDDEN ARCHIVE — NIGHT');
  });
  it('filters vault entries by type and case-insensitive search', () => {
    const entries: Entry[] = [{ id: '1', title: 'Lost Dreams', kind: 'Story', genre: 'Fantasy', content: 'An unwritten world', created: '2026-10-08', favorite: false }, { id: '2', title: 'Mira', kind: 'Character', genre: 'Archivist', content: 'Lost dreams', created: '2026-10-08', favorite: false }];
    expect(filterEntries(entries, 'LOST', 'Story').map(e => e.id)).toEqual(['1']);
    expect(filterEntries(entries, 'missing', 'All')).toEqual([]);
  });
});
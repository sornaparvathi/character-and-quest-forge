export type IdeaMode = 'Story' | 'Script';
export type Entry = { id: string; title: string; kind: 'Story' | 'Script' | 'Character'; genre: string; content: string; favorite: boolean; created: string };
export const genres = ['High Fantasy', 'Cosmic Horror', 'Cyberpunk Noir', 'Whimsical Magic', 'Psychological Thriller'];
export const twists = ['A clock that ticks backwards', 'The mentor has been the villain all along', 'Every memory belongs to someone else', 'The last door opens into yesterday'];
export function createIdea(seed: string, genre: string, mode: IdeaMode, twist: string, tone: number) {
  const theme = seed.trim() || 'a city that has forgotten how to dream';
  const title = theme.split(/\s+/).slice(0, 6).join(' ').replace(/\b\w/g, x => x.toUpperCase());
  const mood = tone < 40 ? 'haunting and dangerous' : tone > 65 ? 'playful and wondrous' : 'mysterious and hopeful';
  const hook = `In a ${mood} world of ${genre.toLowerCase()}, an apprentice archivist discovers ${theme}. With dawn approaching, they must choose between saving the only home they know and revealing the truth that could unravel it.`;
  const acts = `ACT I — THE DISCOVERY\nMira, an apprentice archivist, finds a message hidden inside a book no one remembers writing. It points to ${theme}. A stranger offers help, but asks for a memory in return.\n\nACT II — THE PRICE\nMira and the stranger follow a trail through a city where stories reshape reality. Each answer costs a piece of the past. Their alliance fractures when they discover: ${twist.toLowerCase()}.\n\nACT III — THE CHOICE\nAt the threshold between worlds, Mira refuses the ending written for her. She sacrifices the message, not her memories, and writes a new future. The city awakens—but one page remains blank.`;
  const characters = 'MIRA — An apprentice archivist who wants to belong. Her gift is noticing what everyone else overlooks; her flaw is trusting the written word more than herself.\n\nTHE STRANGER — A keeper of unwritten stories. Charming, guarded, and quietly afraid of being forgotten.\n\nTHE CURATOR — Guardian of the city’s official history. Believes a comforting lie is kinder than a dangerous truth.';
  const scene = mode === 'Script' ? 'INT. FORBIDDEN ARCHIVE — NIGHT\n\nDust hangs in the moonlight. MIRA opens a book. All the pages are blank except one.\n\nMIRA\nThis is my handwriting.\n\nTHE STRANGER (O.S.)\nNot yet.\n\nShe turns. A silhouette stands where the door used to be.' : 'The book was warm. That was the first thing Mira noticed—not its missing title, not the way the dust refused to settle on its cover. Warm, like something alive.\n\nOn the last page, in handwriting she knew better than her own face, were five words: Do not trust the ending.\n\nBehind her, the door quietly disappeared.';
  const sections: Record<string, string> = { 'Logline / Hook': hook, 'Three-Act Synopsis': acts, 'Key Characters': characters, 'Plot Twist': twist, 'Sample Scene': scene };
  const content = `# ${title}\n\n${mode} · ${genre}\n\n${Object.entries(sections).map(([name, text]) => `## ${name}\n${text}`).join('\n\n')}`;
  return { title, sections, content };
}
export function filterEntries(entries: Entry[], search: string, kind: string) {
  return entries.filter(entry => (kind === 'All' || entry.kind === kind) && `${entry.title} ${entry.genre} ${entry.content}`.toLowerCase().includes(search.toLowerCase()));
}
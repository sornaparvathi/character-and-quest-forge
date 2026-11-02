import { createServerFn } from '@tanstack/react-start';
import { generateResponse, generateImage } from '@lovable.dev/ai-gateway';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {} from '@/ai-gateway.types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { createIdea, type IdeaMode } from '@/lib/story-engine';
import { SPARK_REWARDS } from '@/lib/sparks';

type StudioContext = { supabase: SupabaseClient; userId: string };
type Sectioned = { title: string; sections: Record<string, string>; content: string };

const toneWords = (tone: number) =>
  tone < 40 ? 'dark, haunting and dangerous' : tone > 65 ? 'light, playful and wondrous' : 'mysterious and hopeful';

const STORY_SYSTEM = `You are the master story weaver of Beyond A-Z, a celestial creative studio. You turn a single seed of an idea into vivid, original story material. Reply with ONLY a JSON object (no markdown, no code fences) shaped exactly like:
{"title": "evocative title, five words or fewer", "logline": "two gripping sentences", "acts": "three paragraphs separated by blank lines, beginning with ACT I — , ACT II — , ACT III — in caps", "characters": "two or three short sketches separated by blank lines, each starting NAME — description", "twist": "one surprising sentence that weaves the requested twist in", "scene": "one scene"}
For mode "Story", "scene" is 2-3 paragraphs of evocative prose. For mode "Script", "scene" is a properly formatted screenplay scene: a slugline such as INT. LOCATION — TIME, then action lines, then CHARACTER NAMES in caps on their own line above their dialogue. Weave the requested genre, tone and twist through every part. Write for an adult creative audience; be specific, sensory and surprising.`;

const CHARACTER_SYSTEM = `You are Beyond A-Z's character weaver. Given a name, archetype, appearance and visual style, reply with ONLY a JSON object (no markdown, no fences):
{"motivation": "one sentence", "hiddenSecret": "one sentence", "fatalFlaw": "one sentence", "voice": "a single spoken line in quotation marks", "imagePrompt": "a rich one-paragraph portrait prompt for an illustrator: pose, costume, expression, lighting, background, honouring the stated appearance details"}
Be specific and cinematic. The imagePrompt must describe ONE character portrait and must not contain any text, lettering or words rendered inside the image.`;

const ADVENTURE_SYSTEM = `You are the live narrator of Beyond A-Z's interactive adventure. Write in second person, present tense ("You step into..."), so the player feels present inside the story. Each scene is 90-140 words, vivid and sensory. Reply with ONLY a JSON object (no markdown, no fences).
While the story continues: {"scene": "...", "choices": ["...", "...", "..."]} — exactly three distinct choices that meaningfully change what happens next.
When the story reaches its finale: {"ended": true, "ending": "a cinematic 120-200 word finale that resolves the player's journey"}`;

async function awardSparks(context: StudioContext, amount: number): Promise<number> {
  const { data } = await context.supabase.rpc('award_sparks', { amount });
  return typeof data === 'number' ? data : 0;
}

type ResponseText = { output_text?: unknown; output?: Array<{ content?: Array<{ type?: unknown; text?: unknown }> }> };

function extractText(response: unknown): string {
  const payload = response as ResponseText;
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text;
  const parts: string[] = [];
  for (const item of payload.output ?? []) {
    for (const piece of item.content ?? []) {
      if (typeof piece.text === 'string' && piece.text) parts.push(piece.text);
    }
  }
  return parts.join('');
}

function parseJsonLoose(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('The weave returned no readable pattern.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const pick = (value: unknown, fallback: string) => (typeof value === 'string' && value.trim() ? value.trim() : fallback);

function normalizeIdea(parsed: unknown, fallback: Sectioned): Sectioned {
  const raw = (parsed ?? {}) as Record<string, unknown>;
  const sections: Record<string, string> = {
    'Logline / Hook': pick(raw.logline, fallback.sections['Logline / Hook'] ?? ''),
    'Three-Act Synopsis': pick(raw.acts, fallback.sections['Three-Act Synopsis'] ?? ''),
    'Key Characters': pick(raw.characters, fallback.sections['Key Characters'] ?? ''),
    'Plot Twist': pick(raw.twist, fallback.sections['Plot Twist'] ?? ''),
    'Sample Scene': pick(raw.scene, fallback.sections['Sample Scene'] ?? ''),
  };
  const title = pick(raw.title, fallback.title).split(/\s+/).slice(0, 8).join(' ');
  const content = `# ${title}\n\n${Object.entries(sections).map(([name, text]) => `## ${name}\n${text}`).join('\n\n')}`;
  return { title, sections, content };
}

export const generateStory = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { seed: string; genre: string; mode: IdeaMode; tone: number; twist: string }) => input)
  .handler(async ({ data, context }) => {
    const fallback = createIdea(data.seed, data.genre, data.mode, data.twist, data.tone);
    let idea: Sectioned = fallback;
    let source: 'ai' | 'offline' = 'offline';
    try {
      const response = await generateResponse({
        model: 'openai/gpt-6-astra',
        instructions: STORY_SYSTEM,
        input: `Seed idea: ${data.seed.trim() || 'a city that has forgotten how to dream'}\nGenre: ${data.genre}\nMode: ${data.mode}\nTone: ${toneWords(data.tone)}\nPlot twist to weave in: ${data.twist}`,
      });
      idea = normalizeIdea(parseJsonLoose(extractText(response)), fallback);
      source = 'ai';
    } catch (error) {
      console.error('Story weave fell back to the offline archive:', error);
    }
    const sparks = await awardSparks(context as StudioContext, SPARK_REWARDS.story);
    return { idea, sparks, source };
  });

export type WovenCharacter = {
  id: string;
  name: string;
  archetype: string;
  appearance: string;
  style: string;
  motivation: string;
  hiddenSecret: string;
  fatalFlaw: string;
  voice: string;
  imageUrl: string | null;
};

export const generateCharacter = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; archetype: string; appearance: string; style: string }) => input)
  .handler(async ({ data, context }) => {
    const ctx = context as StudioContext;
    let details = {
      motivation: 'To find a place in a world that keeps rewriting itself.',
      hiddenSecret: 'They carry a story that has not happened yet.',
      fatalFlaw: 'They trust the written word more than themselves.',
      voice: '“If the ending is already written, then I’ll begin again.”',
      imagePrompt: `A cinematic portrait of ${data.name}, ${data.archetype}, ${data.appearance}. ${data.style} style, celestial teal and antique gold lighting.`,
    };
    try {
      const response = await generateResponse({
        model: 'openai/gpt-6-astra',
        instructions: CHARACTER_SYSTEM,
        input: `Name: ${data.name}\nArchetype: ${data.archetype}\nAppearance details: ${data.appearance}\nVisual style: ${data.style}`,
      });
      const raw = (parseJsonLoose(extractText(response)) ?? {}) as Record<string, unknown>;
      details = {
        motivation: pick(raw.motivation, details.motivation),
        hiddenSecret: pick(raw.hiddenSecret, details.hiddenSecret),
        fatalFlaw: pick(raw.fatalFlaw, details.fatalFlaw),
        voice: pick(raw.voice, details.voice),
        imagePrompt: pick(raw.imagePrompt, details.imagePrompt),
      };
    } catch (error) {
      console.error('Character weave fell back to the offline pattern:', error);
    }

    const imageUrl = await weavePortrait(ctx, data, details.imagePrompt);
    const { data: row, error } = await ctx.supabase
      .from('characters')
      .insert({
        user_id: ctx.userId,
        name: data.name,
        archetype: data.archetype,
        appearance: data.appearance,
        style: data.style,
        details: {
          motivation: details.motivation,
          hiddenSecret: details.hiddenSecret,
          fatalFlaw: details.fatalFlaw,
          voice: details.voice,
        },
        image_path: imageUrl ? null : null,
      })
      .select('id')
      .single();

    let savedPath: string | null = null;
    if (row?.id && imageUrl) {
      savedPath = imageUrl.path;
      await ctx.supabase.from('characters').update({ image_path: imageUrl.path }).eq('id', row.id);
    }

    const sparks = await awardSparks(ctx, SPARK_REWARDS.character);
    const character: WovenCharacter = {
      id: row?.id ?? crypto.randomUUID(),
      name: data.name,
      archetype: data.archetype,
      appearance: data.appearance,
      style: data.style,
      motivation: details.motivation,
      hiddenSecret: details.hiddenSecret,
      fatalFlaw: details.fatalFlaw,
      voice: details.voice,
      imageUrl: imageUrl?.url ?? null,
    };
    if (error) console.error('Character row failed to save:', error);
    return { character, sparks };
  });

type Portrait = { url: string; path: string } | null;

async function weavePortrait(
  ctx: StudioContext,
  data: { name: string; archetype: string; appearance: string; style: string },
  prompt: string,
): Promise<Portrait> {
  try {
    const response = await generateImage({
      model: 'openai/gpt-image-2.5-sunburst',
      prompt,
      size: '1024x1024',
      n: 1,
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) return null;
    const bytes = Uint8Array.from(atob(b64), char => char.charCodeAt(0));

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const bucket = supabaseAdmin.storage.from('character-art');
    const path = `${ctx.userId}/${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.png`;
    const { error } = await bucket.upload(path, bytes, { contentType: 'image/png', upsert: false });
    if (error) {
      console.error('Portrait upload failed:', error);
      return null;
    }
    const { data: signed } = await bucket.createSignedUrl(path, 60 * 60 * 24 * 7);
    return signed ? { url: signed.signedUrl, path } : null;
  } catch (error) {
    console.error('Portrait weave failed:', error);
    return null;
  }
}

export type AdventureStep = { scene: string; choices: string[]; ended: boolean; ending: string };

export const startAdventure = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { archetype: string; difficulty: string }) => input)
  .handler(async ({ data, context }) => {
    const ctx = context as StudioContext;
    const opening: AdventureStep = {
      scene: 'At midnight, a book appears on your doorstep. Its pages are empty, but a voice between the covers whispers your name. Beyond the street, a golden doorway hangs in the air. There is no wall around it. Only a choice.',
      choices: ['Open the book and follow its whisper', 'Step through the golden doorway', 'Ask the voice who wrote this story'],
      ended: false,
      ending: '',
    };
    const { data: row, error } = await ctx.supabase
      .from('adventure_sessions')
      .insert({
        user_id: ctx.userId,
        archetype: data.archetype,
        difficulty: data.difficulty,
        state: { turn: 1, history: [], lastScene: opening.scene },
      })
      .select('id')
      .single();
    if (error || !row) throw new Error('The doorway would not open. Try again.');

    let step = opening;
    try {
      const response = await generateResponse({
        model: 'openai/gpt-6-astra',
        instructions: ADVENTURE_SYSTEM,
        input: `Begin a new interactive adventure. The player is "${data.archetype}" on a ${data.difficulty === 'Adventurer' ? 'perilous, high-stakes' : 'wondrous, dreamlike'} journey that begins at a mysterious door that appears at midnight. Write the opening scene in second person, present tense, addressed to "you", and three choices.`,
      });
      const raw = (parseJsonLoose(extractText(response)) ?? {}) as Record<string, unknown>;
      const choices = Array.isArray(raw.choices) ? raw.choices.filter((c): c is string => typeof c === 'string').slice(0, 3) : [];
      step = {
        scene: pick(raw.scene, opening.scene),
        choices: choices.length === 3 ? choices : opening.choices,
        ended: false,
        ending: '',
      };
    } catch (error) {
      console.error('Adventure opening fell back to the offline threshold:', error);
    }
    await ctx.supabase.from('adventure_sessions').update({ state: { turn: 1, history: [], lastScene: step.scene } }).eq('id', row.id);
    return { sessionId: row.id as string, scene: step.scene, choices: step.choices };
  });

export const advanceAdventure = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string; choice: string }) => input)
  .handler(async ({ data, context }) => {
    const ctx = context as StudioContext;
    const { data: session } = await ctx.supabase
      .from('adventure_sessions')
      .select('id, archetype, difficulty, state')
      .eq('id', data.sessionId)
      .single();
    if (!session) throw new Error('This adventure slipped out of the ledger. Begin anew.');

    const state = (session.state ?? {}) as { turn?: number; history?: Array<{ choice: string }>; lastScene?: string };
    const turn = (state.turn ?? 1) + 1;
    const history = [...(state.history ?? []), { choice: data.choice }].slice(-6);
    const finale = turn >= 7;

    let step: AdventureStep;
    try {
      const response = await generateResponse({
        model: 'openai/gpt-6-astra',
        instructions: ADVENTURE_SYSTEM,
        input: `The player is "${session.archetype}" on a ${session.difficulty === 'Adventurer' ? 'perilous' : 'wondrous'} journey, now on turn ${turn} of 7.\nChoices so far: ${history.map(h => h.choice).join(' | ')}\nPrevious scene: ${state.lastScene ?? ''}\nThe player chose: "${data.choice}".\n${finale ? 'This choice leads to the finale — set "ended": true and write the ending.' : 'Continue with the next scene and three fresh choices.'}`,
      });
      const raw = (parseJsonLoose(extractText(response)) ?? {}) as Record<string, unknown>;
      const choices = Array.isArray(raw.choices) ? raw.choices.filter((c): c is string => typeof c === 'string').slice(0, 3) : [];
      const ended = raw.ended === true || finale;
      step = {
        scene: pick(raw.scene, 'The mists thicken around you, waiting.'),
        choices: ended ? [] : choices.length === 3 ? choices : ['Press on', 'Look closer', 'Wait and listen'],
        ended,
        ending: ended ? pick(raw.ending, pick(raw.scene, 'Your story closes like a book that will open again.')) : '',
      };
    } catch (error) {
      console.error('Adventure turn fell back to the offline mists:', error);
      step = finale
        ? { scene: '', choices: [], ended: true, ending: 'You step through the last doorway and the story exhales. Some endings are not found — they are made, and this one is yours.' }
        : { scene: 'The mists thicken around you, waiting.', choices: ['Press on', 'Look closer', 'Wait and listen'], ended: false, ending: '' };
    }

    await ctx.supabase
      .from('adventure_sessions')
      .update({
        state: { turn, history, lastScene: step.ended ? step.ending : step.scene },
        finished: step.ended,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    const sparks = await awardSparks(ctx, SPARK_REWARDS.adventureChoice);
    return { scene: step.scene, choices: step.choices, ended: step.ended, ending: step.ending, sparks, turn };
  });

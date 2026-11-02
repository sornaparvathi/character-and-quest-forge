import { describe, expect, it } from 'vitest';
import { SPARK_REWARDS } from './sparks';

describe('spark rewards', () => {
  it('awards 10 sparks for every story or script idea', () => {
    expect(SPARK_REWARDS.story).toBe(10);
  });

  it('awards 10 sparks for every woven character', () => {
    expect(SPARK_REWARDS.character).toBe(10);
  });

  it('awards 25 sparks for every adventure choice', () => {
    expect(SPARK_REWARDS.adventureChoice).toBe(25);
  });
});

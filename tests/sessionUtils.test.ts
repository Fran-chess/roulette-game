import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  isPlayerRegistered
} from '../src/utils/session';

describe('session utilities', () => {
  const baseSession = {
    status: 'pending_player_registration',
    nombre: 'John',
    email: 'john@example.com'
  } as any;

  it('detects registered player', () => {
    const session = { ...baseSession, status: 'player_registered' };
    assert.strictEqual(isPlayerRegistered(session), true);
  });

  it('returns false when player not registered', () => {
    const session = { ...baseSession, status: 'pending_player_registration' };
    assert.strictEqual(isPlayerRegistered(session), false);
  });
});

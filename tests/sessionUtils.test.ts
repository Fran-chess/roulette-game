import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  isPlayerRegistered,
  isSessionInProgress,
  isSessionPendingRegistration,
  isSessionPlayable
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

  it('detects session in progress', () => {
    const session = { ...baseSession, status: 'playing' };
    assert.strictEqual(isSessionInProgress(session), true);
  });

  it('detects pending registration', () => {
    const session = { ...baseSession, status: 'pending_player_registration' };
    assert.strictEqual(isSessionPendingRegistration(session), true);
  });

  it('detects playable session', () => {
    const session = { ...baseSession, status: 'playing' };
    assert.strictEqual(isSessionPlayable(session), true);
  });
});

import { createHash, randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getHouseholdState, updateHouseholdState } from '../repositories/household.repository.js';
import { attachFirstUserToLegacyHousehold, listUserHouseholds, listUserInvitations, profileDisplayName } from './household.service.js';

const scrypt = promisify(scryptCallback);
const RECOVERY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function publicUser(user) {
  const name = profileDisplayName(user);
  return {
    id: user.id,
    name,
    firstName: user.firstName || user.name?.split(/\s+/)[0] || '',
    lastName: user.lastName || user.name?.trim().split(/\s+/).slice(1).join(' ') || '',
    nickname: user.nickname || '',
    displayMode: user.displayMode || 'first_name',
    email: user.email,
    initials: name.trim().split(/\s+/).slice(0, 2).map((word) => word[0].toLocaleUpperCase('es-AR')).join(''),
    color: user.color || 'sage',
    avatarData: user.avatarData || null,
    theme: user.theme || 'light',
  };
}

function createRecoveryCode() {
  const raw = Array.from({ length: 16 }, () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)]).join('');
  return raw.match(/.{1,4}/g).join('-');
}

function normalizeRecoveryCode(code) {
  return code.replaceAll('-', '').replaceAll(' ', '').toUpperCase();
}

async function makePasswordHash(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [saltHex, keyHex] = (storedHash || '').split(':');
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function authResult(user) {
  return { user: publicUser(user) };
}

export async function registerAccount({ firstName, lastName, nickname = '', displayMode = 'first_name', email, password, joinCode = '' }) {
  const passwordHash = await makePasswordHash(password);
  const normalizedEmail = email.trim().toLocaleLowerCase('en-US');
  const recoveryCode = createRecoveryCode();
  const user = {
    id: randomUUID(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    nickname: nickname.trim(),
    displayMode,
    name: `${firstName.trim()} ${lastName.trim()}`,
    email: normalizedEmail,
    passwordHash,
    recoveryCodeHash: createHash('sha256').update(normalizeRecoveryCode(recoveryCode)).digest('hex'),
    color: 'sage',
    avatarData: null,
    theme: 'light',
    createdAt: new Date().toISOString(),
  };
  const created = await updateHouseholdState((state) => {
    if (state.users.some((existing) => existing.email === normalizedEmail)) return false;
    state.users.push(user);
    return true;
  });
  if (!created) return { conflict: true };
  await attachFirstUserToLegacyHousehold(user, { skipEmptyHousehold: Boolean(joinCode) });
  return {
    ...authResult(user),
    households: await listUserHouseholds(user.id),
    invitations: await listUserInvitations(user.id),
    recoveryCode,
  };
}

export async function recoverAccount({ email, recoveryCode, password }) {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLocaleLowerCase('en-US') : '';
  const normalizedCode = normalizeRecoveryCode(recoveryCode);
  const candidateHash = createHash('sha256').update(normalizedCode).digest();
  const nextRecoveryCode = createRecoveryCode();
  const nextPasswordHash = await makePasswordHash(password);
  return updateHouseholdState((state) => {
    const user = state.users.find((item) => {
      const storedHash = Buffer.from(item.recoveryCodeHash || ''.padEnd(64, '0'), 'hex');
      const matches = storedHash.length === candidateHash.length && timingSafeEqual(storedHash, candidateHash);
      return matches && (!normalizedEmail || item.email === normalizedEmail);
    });
    if (!user) return { invalid: true };
    user.passwordHash = nextPasswordHash;
    user.recoveryCodeHash = createHash('sha256').update(normalizeRecoveryCode(nextRecoveryCode)).digest('hex');
    state.sessions = state.sessions.filter((session) => session.userId !== user.id);
    return { ...authResult(user), recoveryCode: nextRecoveryCode };
  });
}

export async function rotateRecoveryCode(userId, password) {
  const state = await getHouseholdState();
  const user = state.users.find((item) => item.id === userId);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
  const recoveryCode = createRecoveryCode();
  await updateHouseholdState((nextState) => {
    const nextUser = nextState.users.find((item) => item.id === userId);
    if (nextUser) nextUser.recoveryCodeHash = createHash('sha256').update(normalizeRecoveryCode(recoveryCode)).digest('hex');
  });
  return recoveryCode;
}

export async function authenticateAccount(email, password) {
  const normalizedEmail = email.trim().toLocaleLowerCase('en-US');
  const state = await getHouseholdState();
  const user = state.users.find((item) => item.email === normalizedEmail);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
  return {
    ...authResult(user),
    households: await listUserHouseholds(user.id),
    invitations: await listUserInvitations(user.id),
  };
}

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  await updateHouseholdState((state) => {
    state.sessions = state.sessions.filter((session) => new Date(session.expiresAt).valueOf() > Date.now());
    state.sessions.push({ tokenHash: hashSessionToken(token), userId, expiresAt });
  });
  return token;
}

export async function getUserFromSession(token) {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const state = await getHouseholdState();
  const session = state.sessions.find((item) => item.tokenHash === tokenHash && new Date(item.expiresAt).valueOf() > Date.now());
  const user = session && state.users.find((item) => item.id === session.userId);
  return user ? publicUser(user) : null;
}

export async function deleteSession(token) {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  await updateHouseholdState((state) => {
    state.sessions = state.sessions.filter((session) => session.tokenHash !== tokenHash);
  });
}

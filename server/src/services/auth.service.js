import { createHash, randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getHouseholdState, updateHouseholdState } from '../repositories/household.repository.js';
import { attachFirstUserToLegacyHousehold, listUserHouseholds, listUserInvitations, profileDisplayName } from './household.service.js';
import { assertRecoveryDeliveryConfigured, sendPhoneChangeConfirmation, sendRecoveryCode } from './notification.service.js';

const scrypt = promisify(scryptCallback);
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
    phone: user.phone || '',
    phoneVerified: Boolean(user.phoneVerified),
    initials: name.trim().split(/\s+/).slice(0, 2).map((word) => word[0].toLocaleUpperCase('es-AR')).join(''),
    color: user.color || 'sage',
    avatarData: user.avatarData || null,
    theme: user.theme || 'light',
  };
}

function createOneTimeCode() {
  return String(randomInt(100_000, 1_000_000));
}

function hashOneTimeCode(code) {
  return createHash('sha256').update(String(code)).digest('hex');
}

function normalizePhone(phone) {
  return typeof phone === 'string' ? phone.replace(/[\s().-]/g, '') : '';
}

const challengeExpiry = () => new Date(Date.now() + 10 * 60_000).toISOString();

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
  const user = {
    id: randomUUID(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    nickname: nickname.trim(),
    displayMode,
    name: `${firstName.trim()} ${lastName.trim()}`,
    email: normalizedEmail,
    passwordHash,
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
  };
}

export async function startAccountRecovery({ channel, contact }) {
  assertRecoveryDeliveryConfigured(channel);
  const normalizedContact = channel === 'email'
    ? contact.trim().toLocaleLowerCase('en-US')
    : normalizePhone(contact);
  const state = await getHouseholdState();
  const user = channel === 'email'
    ? state.users.find((item) => item.email === normalizedContact)
    : state.users.find((item) => item.phoneVerified && normalizePhone(item.phone) === normalizedContact);
  const now = Date.now();
  const recentChallenges = state.authChallenges.filter((item) => item.purpose === 'recovery' && item.contact === normalizedContact && now - new Date(item.createdAt).valueOf() < 15 * 60_000);
  if (recentChallenges.length >= 3) return { rateLimited: true };
  const code = createOneTimeCode();
  const acknowledgementToken = randomBytes(32).toString('base64url');
  const challenge = {
    id: randomUUID(),
    purpose: 'recovery',
    userId: user?.id || null,
    channel,
    contact: normalizedContact,
    codeHash: hashOneTimeCode(code),
    acknowledgementTokenHash: hashOneTimeCode(acknowledgementToken),
    expiresAt: challengeExpiry(),
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  await updateHouseholdState((nextState) => {
    nextState.authChallenges = nextState.authChallenges.filter((item) => now - new Date(item.createdAt).valueOf() < 15 * 60_000);
    nextState.authChallenges.forEach((item) => {
      if (item.purpose === 'recovery' && item.contact === normalizedContact) item.invalidated = true;
    });
    nextState.authChallenges.push(challenge);
  });
  if (user) {
    try {
      await sendRecoveryCode({ channel, to: normalizedContact, code, challengeId: challenge.id, acknowledgementToken });
    } catch (error) {
      await updateHouseholdState((nextState) => {
        const failedChallenge = nextState.authChallenges.find((item) => item.id === challenge.id);
        if (failedChallenge) { failedChallenge.invalidated = true; failedChallenge.deliveryFailed = true; }
      });
      throw error;
    }
  }
  return { challengeId: challenge.id };
}

export async function acknowledgeAccountRecovery({ challengeId, token, decision }) {
  const candidateHash = Buffer.from(hashOneTimeCode(token), 'hex');
  return updateHouseholdState((state) => {
    const index = state.authChallenges.findIndex((item) => item.id === challengeId && ['recovery', 'phone-verification'].includes(item.purpose));
    if (index < 0) return { invalid: true };
    const challenge = state.authChallenges[index];
    const storedHash = Buffer.from(challenge.acknowledgementTokenHash || '', 'hex');
    const matches = storedHash.length === candidateHash.length && timingSafeEqual(storedHash, candidateHash);
    if (!matches || challenge.invalidated || new Date(challenge.expiresAt).valueOf() <= Date.now()) return { invalid: true };
    if (decision === 'no') {
      state.authChallenges.splice(index, 1);
      return { acknowledged: false, cancelled: true, purpose: challenge.purpose };
    }
    if (decision !== 'yes') return { invalid: true };
    challenge.acknowledged = true;
    return { acknowledged: true, purpose: challenge.purpose };
  });
}

export async function recoverAccount({ challengeId, code, password, decision }) {
  return updateHouseholdState(async (state) => {
    const index = state.authChallenges.findIndex((item) => item.id === challengeId && item.purpose === 'recovery');
    if (index < 0) return { invalid: true };
    const challenge = state.authChallenges[index];
    if (decision === 'no') {
      state.authChallenges.splice(index, 1);
      return { cancelled: true };
    }
    if (decision !== 'yes' || challenge.invalidated || !challenge.userId || new Date(challenge.expiresAt).valueOf() <= Date.now() || challenge.attempts >= 5) return { invalid: true };
    const storedHash = Buffer.from(challenge.codeHash, 'hex');
    const candidateHash = Buffer.from(hashOneTimeCode(code), 'hex');
    const matches = storedHash.length === candidateHash.length && timingSafeEqual(storedHash, candidateHash);
    if (!matches) {
      challenge.attempts += 1;
      return { invalid: true };
    }
    const user = state.users.find((item) => item.id === challenge.userId);
    if (!user) return { invalid: true };
    user.passwordHash = await makePasswordHash(password);
    user.recoveryCodeHash = '';
    state.sessions = state.sessions.filter((session) => session.userId !== user.id);
    state.authChallenges = state.authChallenges.filter((item) => item.userId !== user.id);
    return authResult(user);
  });
}

export async function startPhoneVerification(userId, phone) {
  assertRecoveryDeliveryConfigured('email');
  assertRecoveryDeliveryConfigured('phone');
  const normalizedPhone = normalizePhone(phone);
  if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) return { invalid: true };
  const state = await getHouseholdState();
  const existingUser = state.users.find((item) => item.phoneVerified && normalizePhone(item.phone) === normalizedPhone && item.id !== userId);
  if (existingUser) return { conflict: true };
  const recentChallenges = state.authChallenges.filter((item) => item.userId === userId && item.purpose === 'phone-verification' && Date.now() - new Date(item.createdAt).valueOf() < 15 * 60_000);
  if (recentChallenges.length >= 3) return { rateLimited: true };
  const code = createOneTimeCode();
  const acknowledgementToken = randomBytes(32).toString('base64url');
  const account = state.users.find((item) => item.id === userId);
  const challenge = { id: randomUUID(), purpose: 'phone-verification', userId, phone: normalizedPhone, codeHash: hashOneTimeCode(code), acknowledgementTokenHash: hashOneTimeCode(acknowledgementToken), expiresAt: challengeExpiry(), createdAt: new Date().toISOString(), attempts: 0 };
  await updateHouseholdState((nextState) => {
    const currentTime = Date.now();
    nextState.authChallenges = nextState.authChallenges.filter((item) => currentTime - new Date(item.createdAt).valueOf() < 15 * 60_000);
    nextState.authChallenges.forEach((item) => {
      if (item.userId === userId && item.purpose === 'phone-verification') item.invalidated = true;
    });
    nextState.authChallenges.push(challenge);
  });
  try {
    await sendRecoveryCode({ channel: 'phone', to: normalizedPhone, code, purpose: 'phone-verification' });
    await sendPhoneChangeConfirmation({ to: account.email, phone: normalizedPhone, challengeId: challenge.id, acknowledgementToken });
  } catch (error) {
    await updateHouseholdState((nextState) => {
      const failedChallenge = nextState.authChallenges.find((item) => item.id === challenge.id);
      if (failedChallenge) { failedChallenge.invalidated = true; failedChallenge.deliveryFailed = true; }
    });
    throw error;
  }
  return { challengeId: challenge.id };
}

export async function verifyPhone(userId, challengeId, code) {
  return updateHouseholdState((state) => {
    const challenge = state.authChallenges.find((item) => item.id === challengeId && item.userId === userId && item.purpose === 'phone-verification');
    if (!challenge || challenge.invalidated || new Date(challenge.expiresAt).valueOf() <= Date.now() || challenge.attempts >= 5) return { invalid: true };
    if (!challenge.acknowledged) return { awaitingConfirmation: true };
    const storedHash = Buffer.from(challenge.codeHash, 'hex');
    const candidateHash = Buffer.from(hashOneTimeCode(code), 'hex');
    const matches = storedHash.length === candidateHash.length && timingSafeEqual(storedHash, candidateHash);
    if (!matches) {
      challenge.attempts += 1;
      return { invalid: true };
    }
    const user = state.users.find((item) => item.id === userId);
    if (!user) return { invalid: true };
    const phoneAlreadyUsed = state.users.some((item) => item.id !== userId && item.phoneVerified && normalizePhone(item.phone) === challenge.phone);
    if (phoneAlreadyUsed) return { conflict: true };
    user.phone = challenge.phone;
    user.phoneVerified = true;
    state.authChallenges = state.authChallenges.filter((item) => item.id !== challengeId);
    return { user: publicUser(user) };
  });
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

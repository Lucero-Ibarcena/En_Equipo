import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomInt } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryDirectory = dirname(fileURLToPath(import.meta.url));
const dataFile = resolve(process.env.EN_EQUIPO_DATA_FILE || resolve(repositoryDirectory, '../../data/household.json'));
let mutationQueue = Promise.resolve();

const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function createInviteCode() {
  return Array.from({ length: 10 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
}

function createInitialState() {
  return {
    version: 3,
    users: [],
    sessions: [],
    joinRequests: [],
    invitations: [],
    households: [{
      id: 'casa-en-equipo',
      name: 'Nuestra casa',
      timezone: 'America/Argentina/Buenos_Aires',
      inviteCode: createInviteCode(),
      ownerId: null,
      members: [],
      tasks: [],
    }],
  };
}

function migrateLegacyState(legacyState) {
  const legacyHousehold = legacyState.household || { id: 'casa-en-equipo', name: 'Casa de los García', timezone: 'America/Argentina/Buenos_Aires' };
  const household = {
    ...legacyHousehold,
    inviteCode: createInviteCode(),
    ownerId: null,
    members: (legacyState.members || []).map((member) => ({ ...member, userId: null, role: 'member' })),
    tasks: legacyState.tasks || [],
  };
  return { version: 3, users: [], sessions: [], joinRequests: [], invitations: [], households: [household] };
}

async function readState() {
  try {
    const storedState = JSON.parse(await readFile(dataFile, 'utf8'));
    if ([2, 3].includes(storedState.version) && Array.isArray(storedState.households)) {
      let changed = false;
      if (!Array.isArray(storedState.joinRequests)) storedState.joinRequests = [];
      if (!Array.isArray(storedState.sessions)) storedState.sessions = [];
      if (!Array.isArray(storedState.users)) storedState.users = [];
      if (!Array.isArray(storedState.invitations)) storedState.invitations = [];
      for (const household of storedState.households) {
        if (!/^[0-9A-HJKMNP-TV-Z]{10}$/.test(household.inviteCode || '')) {
          household.inviteCode = createInviteCode();
          changed = true;
        }
      }
      if (storedState.version !== 3) { storedState.version = 3; changed = true; }
      if (changed) await writeState(storedState);
      return storedState;
    }
    const migratedState = migrateLegacyState(storedState);
    await writeState(migratedState);
    return migratedState;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const initialState = createInitialState();
    await writeState(initialState);
    return initialState;
  }
}

async function writeState(state) {
  await mkdir(dirname(dataFile), { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  await rename(temporaryFile, dataFile);
}

export async function getHouseholdState() {
  return readState();
}

export async function updateHouseholdState(update) {
  const operation = mutationQueue.then(async () => {
    const state = await readState();
    const result = await update(state);
    await writeState(state);
    return result;
  });
  mutationQueue = operation.catch(() => undefined);
  return operation;
}

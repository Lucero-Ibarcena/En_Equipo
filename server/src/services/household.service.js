// [SERVIDOR: LÓGICA DEL HOGAR] Aplica reglas de hogares, integrantes, categorías y tareas.
import { randomUUID } from 'node:crypto';
import { DEFAULT_CATEGORIES } from '../config/constants.js';
import {
  createInviteCode,
  getHouseholdState,
  updateHouseholdState,
} from '../repositories/household.repository.js';
const COLORS = [
  'sage',
  'blue',
  'peach',
  'plum',
  'teal',
  'rose',
  'gold',
  'lavender',
  'coral',
  'sky',
];
function initialsFor(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toLocaleUpperCase('es-AR'))
    .join('');
}
export function profileDisplayName(user) {
  const firstName = user.firstName || user.name?.trim().split(/\s+/)[0] || '';
  const lastName = user.lastName || user.name?.trim().split(/\s+/).slice(1).join(' ') || '';
  if (user.displayMode === 'nickname' && user.nickname?.trim()) return user.nickname.trim();
  if (user.displayMode === 'full_name') return `${firstName} ${lastName}`.trim();
  return firstName || user.nickname?.trim() || user.name?.trim() || 'Integrante';
}
function createAccountMember(user, role = 'member', colorIndex = 0) {
  return applyUserProfile(createMember(profileDisplayName(user), user.id, role, colorIndex), user);
}
function createMember(name, userId = null, role = 'member', colorIndex = 0) {
  return {
    id: randomUUID(),
    userId,
    name: name.trim(),
    initials: initialsFor(name),
    color: COLORS[colorIndex % COLORS.length],
    role,
  };
}
function applyUserProfile(member, user) {
  if (user) {
    member.color = user.color || member.color;
    member.avatarData = user.avatarData || null;
  }
  return member;
}
function getMembership(household, userId) {
  return household?.members.find((member) => member.userId === userId);
}
function householdSummary(household, membership) {
  return {
    id: household.id,
    name: household.name,
    inviteCode: household.inviteCode,
    role: membership.role,
    memberCount: household.members.length,
  };
}
export function getHouseholdCategories(household) {
  const saved = Array.isArray(household?.categories) ? household.categories : [];
  const byId = new Map(saved.map((category) => [category.id, category]));
  const hiddenIds = new Set(
    Array.isArray(household?.hiddenCategoryIds) ? household.hiddenCategoryIds : []
  );
  const builtIns = DEFAULT_CATEGORIES.filter((category) => !hiddenIds.has(category.id)).map(
    (category) => ({
      ...category,
      ...(byId.get(category.id) || {}),
    })
  );
  const custom = saved.filter(
    (category) =>
      typeof category?.id === 'string' && category.id.startsWith('custom-') && category.label
  );
  return [...builtIns, ...custom];
}

// [CATEGORÍAS] Crea una categoría del hogar y devuelve la lista visible actualizada.
export async function createHouseholdCategory(householdId, { label, icon }) {
  return updateHouseholdState((state) => {
    const household = state.households.find((item) => item.id === householdId);
    if (!household) return null;
    const categories = getHouseholdCategories(household);
    if (categories.length >= 30)
      return {
        limit: true,
      };
    if (
      categories.some(
        (category) => category.label.toLocaleLowerCase('es-AR') === label.toLocaleLowerCase('es-AR')
      )
    )
      return {
        duplicate: true,
      };
    const category = {
      id: `custom-${randomUUID()}`,
      label: label.trim(),
      shortLabel: label.trim(),
      icon,
      builtIn: false,
    };
    household.categories = [...categories, category];
    return {
      category,
      categories: getHouseholdCategories(household),
    };
  });
}

// [CATEGORÍAS] Edita el nombre o ícono de una categoría existente.
export async function updateHouseholdCategory(householdId, categoryId, changes) {
  return updateHouseholdState((state) => {
    const household = state.households.find((item) => item.id === householdId);
    if (!household) return null;
    const categories = getHouseholdCategories(household);
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return null;
    if (
      categories.some(
        (item) =>
          item.id !== categoryId &&
          item.label.toLocaleLowerCase('es-AR') === changes.label.toLocaleLowerCase('es-AR')
      )
    )
      return {
        duplicate: true,
      };
    const updated = {
      ...category,
      ...changes,
      label: changes.label.trim(),
      shortLabel: changes.label.trim(),
    };
    household.categories = categories.map((item) => (item.id === categoryId ? updated : item));
    return {
      category: updated,
      categories: getHouseholdCategories(household),
    };
  });
}

// [CATEGORÍAS] Elimina la categoría y todas las tareas asociadas de forma definitiva.
export async function deleteHouseholdCategory(householdId, categoryId) {
  return updateHouseholdState((state) => {
    const household = state.households.find((item) => item.id === householdId);
    if (!household) return null;
    const categories = getHouseholdCategories(household);
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return null;
    if (categories.length <= 1)
      return {
        lastCategory: true,
      };
    household.tasks = household.tasks.filter((task) => task.category !== categoryId);
    if (category.builtIn) {
      const hiddenIds = new Set(
        Array.isArray(household.hiddenCategoryIds) ? household.hiddenCategoryIds : []
      );
      hiddenIds.add(categoryId);
      household.hiddenCategoryIds = [...hiddenIds];
    } else {
      household.categories = (household.categories || []).filter((item) => item.id !== categoryId);
    }
    return {
      categories: getHouseholdCategories(household),
      deletedCategoryId: categoryId,
    };
  });
}
export async function listUserHouseholds(userId) {
  const state = await getHouseholdState();
  return state.households
    .map((household) => ({
      household,
      membership: getMembership(household, userId),
    }))
    .filter(({ membership }) => membership)
    .map(({ household, membership }) => householdSummary(household, membership));
}
export async function attachFirstUserToLegacyHousehold(user, { skipEmptyHousehold = false } = {}) {
  return updateHouseholdState((state) => {
    const legacyHousehold = state.households.find((household) => !household.ownerId);
    if (!legacyHousehold) return;
    if (
      skipEmptyHousehold &&
      legacyHousehold.members.length === 0 &&
      legacyHousehold.tasks.length === 0
    )
      return;
    const matchingMember = legacyHousehold.members.find(
      (member) =>
        [user.firstName, user.name].some(
          (name) =>
            name && member.name.toLocaleLowerCase('es-AR') === name.toLocaleLowerCase('es-AR')
        ) && !member.userId
    );
    if (matchingMember) {
      matchingMember.userId = user.id;
      matchingMember.role = 'owner';
      matchingMember.name = profileDisplayName(user);
      matchingMember.initials = initialsFor(matchingMember.name);
      applyUserProfile(matchingMember, user);
    } else {
      legacyHousehold.members.push(
        createAccountMember(user, 'owner', legacyHousehold.members.length)
      );
    }
    legacyHousehold.ownerId = user.id;
    const unlinkedIds = new Set(
      legacyHousehold.members.filter((member) => !member.userId).map((member) => member.id)
    );
    legacyHousehold.members = legacyHousehold.members.filter((member) => member.userId);
    for (const task of legacyHousehold.tasks)
      if (unlinkedIds.has(task.assigneeId)) task.assigneeId = null;
  });
}
export async function getHousehold(householdId, userId) {
  const state = await getHouseholdState();
  const household = state.households.find((item) => item.id === householdId);
  const membership = getMembership(household, userId);
  if (!membership) return null;
  return {
    household: {
      id: household.id,
      name: household.name,
      timezone: household.timezone,
      inviteCode: household.inviteCode,
      categories: getHouseholdCategories(household),
    },
    members: household.members.map((member) => ({
      id: member.id,
      name: member.name,
      initials: member.initials,
      color: member.color,
      avatarData: member.avatarData || null,
      role: member.role,
      isAccountMember: Boolean(member.userId),
      isCurrentUser: member.userId === userId,
    })),
    tasks: household.tasks,
    role: membership.role,
    joinRequests:
      membership.role === 'owner'
        ? state.joinRequests
            .filter((item) => item.householdId === householdId)
            .map(({ id, name, createdAt }) => ({
              id,
              name,
              createdAt,
            }))
        : [],
  };
}
export async function createHousehold(userId, name) {
  return updateHouseholdState((state) => {
    let inviteCode = createInviteCode();
    while (state.households.some((household) => household.inviteCode === inviteCode))
      inviteCode = createInviteCode();
    const user = state.users.find((item) => item.id === userId);
    const household = {
      id: randomUUID(),
      name: name.trim(),
      timezone: 'America/Argentina/Buenos_Aires',
      inviteCode,
      ownerId: userId,
      members: [createAccountMember(user, 'owner')],
      tasks: [],
      categories: DEFAULT_CATEGORIES.map((category) => ({
        ...category,
      })),
    };
    state.households.push(household);
    return householdSummary(household, household.members[0]);
  });
}

// [HOGARES] Actualiza el nombre visible del hogar sin cambiar sus datos compartidos.
export async function updateHouseholdName(householdId, name) {
  return updateHouseholdState((state) => {
    const household = state.households.find((item) => item.id === householdId);
    if (!household) return null;
    household.name = name.trim();
    return {
      id: household.id,
      name: household.name,
    };
  });
}
export async function searchHouseholds(query, userId) {
  const normalized = query.trim().toLocaleLowerCase('es-AR');
  if (normalized.length < 2) return [];
  const state = await getHouseholdState();
  return state.households
    .filter((household) => household.name.toLocaleLowerCase('es-AR').includes(normalized))
    .filter((household) => !getMembership(household, userId))
    .slice(0, 10)
    .map((household) => ({
      id: household.id,
      name: household.name,
      memberCount: household.members.length,
    }));
}
export async function requestHouseholdJoin(userId, householdId) {
  return updateHouseholdState((state) => {
    const household = state.households.find((item) => item.id === householdId);
    if (!household)
      return {
        notFound: true,
      };
    if (getMembership(household, userId))
      return {
        alreadyMember: true,
      };
    const existing = state.joinRequests.find(
      (item) => item.householdId === householdId && item.userId === userId
    );
    if (existing)
      return {
        pending: true,
      };
    const user = state.users.find((item) => item.id === userId);
    const request = {
      id: randomUUID(),
      householdId,
      userId,
      name: profileDisplayName(user),
      createdAt: new Date().toISOString(),
    };
    state.joinRequests.push(request);
    return {
      pending: true,
    };
  });
}
export async function resolveHouseholdJoinRequest(householdId, requestId, approved) {
  return updateHouseholdState((state) => {
    const requestIndex = state.joinRequests.findIndex(
      (item) => item.id === requestId && item.householdId === householdId
    );
    if (requestIndex < 0) return null;
    const [joinRequest] = state.joinRequests.splice(requestIndex, 1);
    if (!approved)
      return {
        approved: false,
      };
    const household = state.households.find((item) => item.id === householdId);
    const user = state.users.find((item) => item.id === joinRequest.userId);
    if (!household || !user || getMembership(household, user.id))
      return {
        approved: false,
      };
    const member = createAccountMember(user, 'member', household.members.length);
    household.members.push(member);
    return {
      approved: true,
      household: householdSummary(household, member),
    };
  });
}
export async function joinHousehold(userId, inviteCode) {
  return updateHouseholdState((state) => {
    const normalizedCode = inviteCode
      .replaceAll('-', '')
      .replaceAll(' ', '')
      .toLocaleUpperCase('en-US');
    const household = state.households.find((item) => item.inviteCode === normalizedCode);
    if (!household)
      return {
        notFound: true,
      };
    const existing = getMembership(household, userId);
    if (existing)
      return {
        alreadyMember: true,
        household: householdSummary(household, existing),
      };
    const user = state.users.find((item) => item.id === userId);
    const member = createAccountMember(user, 'member', household.members.length);
    household.members.push(member);
    return {
      household: householdSummary(household, member),
    };
  });
}
export async function updateProfile(userId, changes) {
  return updateHouseholdState((state) => {
    const user = state.users.find((item) => item.id === userId);
    if (!user) return null;
    if (typeof changes.firstName === 'string') user.firstName = changes.firstName.trim();
    if (typeof changes.lastName === 'string') user.lastName = changes.lastName.trim();
    if (typeof changes.nickname === 'string') user.nickname = changes.nickname.trim();
    if (typeof changes.displayMode === 'string') user.displayMode = changes.displayMode;
    if (user.firstName || user.lastName)
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (typeof changes.theme === 'string') user.theme = changes.theme;
    if (typeof changes.color === 'string') user.color = changes.color;
    if (changes.avatarData === null || typeof changes.avatarData === 'string')
      user.avatarData = changes.avatarData;
    user.initials = initialsFor(profileDisplayName(user));
    for (const household of state.households) {
      for (const member of household.members) {
        if (member.userId === userId) {
          member.name = profileDisplayName(user);
          member.initials = user.initials;
          member.color = user.color || member.color;
          member.avatarData = user.avatarData || null;
        }
      }
    }
    return {
      id: user.id,
      name: profileDisplayName(user),
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      displayMode: user.displayMode,
      email: user.email,
      phone: user.phone || '',
      phoneVerified: Boolean(user.phoneVerified),
      initials: user.initials,
      color: user.color || 'sage',
      avatarData: user.avatarData || null,
      theme: user.theme || 'light',
    };
  });
}
export async function inviteUserToHousehold(householdId, email, inviterId) {
  return updateHouseholdState((state) => {
    const household = state.households.find((item) => item.id === householdId);
    const user = state.users.find((item) => item.email === email.trim().toLocaleLowerCase('en-US'));
    if (!household || !user)
      return {
        sent: false,
      };
    if (getMembership(household, user.id))
      return {
        sent: true,
        alreadyMember: true,
      };
    const exists = state.invitations.some(
      (item) =>
        item.householdId === householdId && item.userId === user.id && item.status === 'pending'
    );
    if (!exists)
      state.invitations.push({
        id: randomUUID(),
        householdId,
        userId: user.id,
        inviterId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    return {
      sent: true,
    };
  });
}
export async function listUserInvitations(userId) {
  const state = await getHouseholdState();
  return state.invitations
    .filter((invitation) => invitation.userId === userId && invitation.status === 'pending')
    .map((invitation) => {
      const household = state.households.find((item) => item.id === invitation.householdId);
      const inviter = state.users.find((item) => item.id === invitation.inviterId);
      return household
        ? {
            id: invitation.id,
            householdId: household.id,
            householdName: household.name,
            invitedBy: inviter ? profileDisplayName(inviter) : 'Alguien del hogar',
            createdAt: invitation.createdAt,
          }
        : null;
    })
    .filter(Boolean);
}
export async function resolveHouseholdInvitation(userId, invitationId, decision) {
  return updateHouseholdState((state) => {
    const index = state.invitations.findIndex(
      (item) => item.id === invitationId && item.userId === userId && item.status === 'pending'
    );
    if (index < 0)
      return {
        notFound: true,
      };
    const [invitation] = state.invitations.splice(index, 1);
    if (decision === 'reject')
      return {
        accepted: false,
      };
    const household = state.households.find((item) => item.id === invitation.householdId);
    const user = state.users.find((item) => item.id === userId);
    if (!household || !user)
      return {
        notFound: true,
      };
    let membership = getMembership(household, userId);
    if (!membership) {
      membership = createAccountMember(user, 'member', household.members.length);
      household.members.push(membership);
    }
    return {
      accepted: true,
      household: householdSummary(household, membership),
    };
  });
}
export async function updateHouseholdMember(householdId, memberId, name) {
  return updateHouseholdState((state) => {
    const household = state.households.find((item) => item.id === householdId);
    const member = household?.members.find((item) => item.id === memberId);
    if (!member) return null;
    member.name = name.trim();
    member.initials = initialsFor(member.name);
    return member;
  });
}
export async function removeHouseholdMember(householdId, memberId) {
  return updateHouseholdState((state) => {
    const household = state.households.find((item) => item.id === householdId);
    if (!household) return null;
    const member = household.members.find((item) => item.id === memberId);
    if (!member) return null;
    if (member.userId === household.ownerId)
      return {
        owner: true,
      };
    household.members = household.members.filter((item) => item.id !== memberId);
    if (member.userId) {
      state.invitations = state.invitations.filter(
        (item) => !(item.householdId === householdId && item.userId === member.userId)
      );
      state.joinRequests = state.joinRequests.filter(
        (item) => !(item.householdId === householdId && item.userId === member.userId)
      );
    }
    for (const task of household.tasks) {
      if (task.assigneeId === memberId) task.assigneeId = null;
    }
    return {
      memberId,
      userId: member.userId,
    };
  });
}
export async function createTask(householdId, input) {
  return updateHouseholdState((state) => {
    const household = state.households.find((item) => item.id === householdId);
    const task = {
      id: randomUUID(),
      title: input.title.trim(),
      category: input.category,
      assigneeId: input.assigneeId || null,
      dueDate: input.dueDate || null,
      status: 'pending',
      folder: 'active',
      notes: input.notes?.trim() || '',
    };
    household.tasks.unshift(task);
    return task;
  });
}
export async function updateTask(householdId, id, changes) {
  return updateHouseholdState((state) => {
    const household = state.households.find((item) => item.id === householdId);
    const task = household?.tasks.find((item) => item.id === id);
    if (!task) return null;
    Object.assign(task, changes);
    if (typeof changes.title === 'string') task.title = changes.title.trim();
    if (typeof changes.notes === 'string') task.notes = changes.notes.trim();
    return task;
  });
}
export async function removeTask(householdId, id) {
  return updateHouseholdState((state) => {
    const household = state.households.find((item) => item.id === householdId);
    if (!household) return false;
    const originalLength = household.tasks.length;
    household.tasks = household.tasks.filter((task) => task.id !== id);
    return household.tasks.length !== originalLength;
  });
}

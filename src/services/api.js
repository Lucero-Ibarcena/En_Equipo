// [FRONTEND → API] Único punto de entrada HTTP del cliente a la API Express.
const API_BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.error || 'No pudimos completar la acción.');
    error.status = response.status;
    if (response.status === 401 && !['/auth/me', '/auth/login', '/auth/register'].includes(path)) {
      window.dispatchEvent(new Event('en-equipo:unauthorized'));
    }
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export const householdApi = {
  me: () => request('/auth/me'),
  register: (details) => request('/auth/register', { method: 'POST', body: JSON.stringify(details) }),
  login: (details) => request('/auth/login', { method: 'POST', body: JSON.stringify(details) }),
  startRecovery: (details) => request('/auth/recover/start', { method: 'POST', body: JSON.stringify(details) }),
  recover: (details) => request('/auth/recover', { method: 'POST', body: JSON.stringify(details) }),
  startPhoneVerification: (phone) => request('/auth/phone/start', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyPhone: (challengeId, code) => request('/auth/phone/verify', { method: 'POST', body: JSON.stringify({ challengeId, code }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  updateProfile: (profile) => request('/auth/profile', { method: 'PATCH', body: JSON.stringify(profile) }),
  resolveInvitation: (invitationId, decision) => request(`/auth/invitations/${encodeURIComponent(invitationId)}`, { method: 'POST', body: JSON.stringify({ decision }) }),
  listHouseholds: () => request('/households'),
  createHousehold: (name) => request('/households', { method: 'POST', body: JSON.stringify({ name }) }),
  renameHousehold: (householdId, name) => request(`/households/${encodeURIComponent(householdId)}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  joinHousehold: (inviteCode) => request('/households/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  discoverHouseholds: (query) => request(`/households/discover?q=${encodeURIComponent(query)}`),
  requestJoin: (householdId) => request(`/households/${encodeURIComponent(householdId)}/join-requests`, { method: 'POST' }),
  resolveJoinRequest: (householdId, requestId, decision) => request(`/households/${encodeURIComponent(householdId)}/join-requests/${encodeURIComponent(requestId)}`, { method: 'PATCH', body: JSON.stringify({ decision }) }),
  demo: () => request('/demo'),
  getHousehold: (householdId) => request(`/households/${encodeURIComponent(householdId)}`),
  createCategory: (householdId, category) => request(`/households/${encodeURIComponent(householdId)}/categories`, { method: 'POST', body: JSON.stringify(category) }),
  updateCategory: (householdId, categoryId, changes) => request(`/households/${encodeURIComponent(householdId)}/categories/${encodeURIComponent(categoryId)}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  deleteCategory: (householdId, categoryId) => request(`/households/${encodeURIComponent(householdId)}/categories/${encodeURIComponent(categoryId)}`, { method: 'DELETE' }),
  createMember: (householdId, email) => request(`/households/${encodeURIComponent(householdId)}/members`, { method: 'POST', body: JSON.stringify({ email }) }),
  updateMember: (householdId, memberId, name) => request(`/households/${encodeURIComponent(householdId)}/members/${encodeURIComponent(memberId)}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteMember: (householdId, memberId) => request(`/households/${encodeURIComponent(householdId)}/members/${encodeURIComponent(memberId)}`, { method: 'DELETE' }),
  createTask: (householdId, task) => request(`/households/${encodeURIComponent(householdId)}/tasks`, { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (householdId, id, changes) => request(`/households/${encodeURIComponent(householdId)}/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  deleteTask: (householdId, id) => request(`/households/${encodeURIComponent(householdId)}/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

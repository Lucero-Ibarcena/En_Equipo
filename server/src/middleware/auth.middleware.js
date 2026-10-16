// [SERVIDOR: PERMISOS] Comprueba la sesión y el acceso de cada persona a su hogar.
import { getHouseholdState } from '../repositories/household.repository.js';
import { getUserFromSession } from '../services/auth.service.js';
export function readSessionCookie(request) {
  const cookie = request.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('en_equipo_session='));
  if (!cookie) return '';
  try {
    return decodeURIComponent(cookie.slice('en_equipo_session='.length));
  } catch {
    return '';
  }
}
export async function requireAuth(request, response, next) {
  try {
    const token = readSessionCookie(request);
    const user = await getUserFromSession(token);
    if (!user)
      return response.status(401).json({
        error: 'Iniciá sesión para continuar.',
      });
    request.user = user;
    request.sessionToken = token;
    next();
  } catch (error) {
    next(error);
  }
}
export async function requireHouseholdMember(request, response, next) {
  try {
    const state = await getHouseholdState();
    const household = state.households.find((item) => item.id === request.params.householdId);
    const membership = household?.members.find((member) => member.userId === request.user.id);
    if (!household || !membership)
      return response.status(403).json({
        error: 'No pertenecés a ese hogar.',
      });
    request.household = household;
    request.householdMember = membership;
    next();
  } catch (error) {
    next(error);
  }
}
export function requireHouseholdOwner(request, response, next) {
  if (request.householdMember?.role !== 'owner')
    return response.status(403).json({
      error: 'Solo quien administra este hogar puede hacer ese cambio.',
    });
  next();
}

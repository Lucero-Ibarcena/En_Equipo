import { SESSION_MAX_AGE_SECONDS, authenticateAccount, createSession, deleteSession, getUserFromSession, recoverAccount, registerAccount, rotateRecoveryCode } from '../services/auth.service.js';
import { listUserHouseholds, listUserInvitations, resolveHouseholdInvitation, updateProfile } from '../services/household.service.js';
import { readSessionCookie } from '../middleware/auth.middleware.js';

const PROFILE_COLORS = ['sage', 'blue', 'peach', 'plum', 'teal', 'rose', 'gold', 'lavender', 'coral', 'sky'];

function setSessionCookie(request, response, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `en_equipo_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`);
}

function clearSessionCookie(request, response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `en_equipo_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

function validateCredentials({ firstName, lastName, nickname = '', displayMode = 'first_name', email, password }, includeName) {
  if (includeName && (typeof firstName !== 'string' || !firstName.trim())) return 'Escribí tu nombre.';
  if (includeName && (typeof lastName !== 'string' || !lastName.trim())) return 'Escribí tu apellido.';
  if (includeName && (firstName.trim().length > 50 || lastName.trim().length > 60)) return 'El nombre y el apellido deben tener menos de 60 caracteres.';
  if (includeName && (typeof nickname !== 'string' || nickname.trim().length > 40)) return 'El apodo debe tener menos de 40 caracteres.';
  if (includeName && !['first_name', 'full_name', 'nickname'].includes(displayMode)) return 'Elegí qué nombre querés mostrar.';
  if (includeName && displayMode === 'nickname' && !nickname.trim()) return 'Escribí un apodo para poder mostrarlo.';
  if (typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Escribí un correo electrónico válido.';
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) return 'La contraseña debe tener entre 8 y 128 caracteres.';
  return '';
}

export async function registerController(request, response, next) {
  try {
    const { firstName, lastName, nickname = '', displayMode = 'first_name', email, password, joinCode = '' } = request.body ?? {};
    if (typeof joinCode !== 'string' || joinCode.length > 12) return response.status(400).json({ error: 'El enlace para unirse no es válido.' });
    const validationError = validateCredentials({ firstName, lastName, nickname, displayMode, email, password }, true);
    if (validationError) return response.status(400).json({ error: validationError });
    const result = await registerAccount({ firstName, lastName, nickname, displayMode, email, password, joinCode });
    if (result.conflict) return response.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    const token = await createSession(result.user.id);
    setSessionCookie(request, response, token);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function loginController(request, response, next) {
  try {
    const { email, password } = request.body ?? {};
    const validationError = validateCredentials({ email, password }, false);
    if (validationError) return response.status(400).json({ error: validationError });
    const result = await authenticateAccount(email, password);
    if (!result) return response.status(401).json({ error: 'El correo o la contraseña no coinciden.' });
    const token = await createSession(result.user.id);
    setSessionCookie(request, response, token);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

export async function recoverController(request, response, next) {
  try {
    const { email, recoveryCode, password } = request.body ?? {};
    if ((email !== undefined && typeof email !== 'string') || typeof recoveryCode !== 'string') return response.status(400).json({ error: 'Ingresá el código de recuperación válido.' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return response.status(400).json({ error: 'La nueva contraseña debe tener entre 8 y 128 caracteres.' });
    const result = await recoverAccount({ email, recoveryCode, password });
    if (result.invalid) return response.status(400).json({ error: 'El correo o el código de recuperación no coinciden.' });
    const token = await createSession(result.user.id);
    setSessionCookie(request, response, token);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

export async function logoutController(request, response, next) {
  try {
    await deleteSession(readSessionCookie(request));
    clearSessionCookie(request, response);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function meController(request, response, next) {
  try {
    const user = await getUserFromSession(request.sessionToken);
    response.json({ user, households: await listUserHouseholds(user.id), invitations: await listUserInvitations(user.id) });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileController(request, response, next) {
  try {
    const { firstName, lastName, nickname, displayMode, theme, color, avatarData } = request.body ?? {};
    if (firstName !== undefined && (typeof firstName !== 'string' || !firstName.trim() || firstName.trim().length > 50)) return response.status(400).json({ error: 'Escribí un nombre de hasta 50 caracteres.' });
    if (lastName !== undefined && (typeof lastName !== 'string' || !lastName.trim() || lastName.trim().length > 60)) return response.status(400).json({ error: 'Escribí un apellido de hasta 60 caracteres.' });
    if (nickname !== undefined && (typeof nickname !== 'string' || nickname.trim().length > 40)) return response.status(400).json({ error: 'El apodo debe tener menos de 40 caracteres.' });
    if (displayMode !== undefined && !['first_name', 'full_name', 'nickname'].includes(displayMode)) return response.status(400).json({ error: 'Elegí qué nombre querés mostrar.' });
    if (displayMode === 'nickname' && !(nickname ?? request.user.nickname)?.trim()) return response.status(400).json({ error: 'Escribí un apodo para poder mostrarlo.' });
    if (theme !== undefined && !['light', 'dark'].includes(theme)) return response.status(400).json({ error: 'Elegí un tema válido.' });
    if (color !== undefined && !PROFILE_COLORS.includes(color)) return response.status(400).json({ error: 'Elegí un color de perfil válido.' });
    if (avatarData !== undefined && avatarData !== null && (typeof avatarData !== 'string' || avatarData.length > 700_000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(avatarData))) {
      return response.status(400).json({ error: 'La foto debe ser PNG, JPG o WebP y pesar menos de 512 KB.' });
    }
    const user = await updateProfile(request.user.id, { firstName, lastName, nickname, displayMode, theme, color, avatarData });
    response.json(user);
  } catch (error) {
    next(error);
  }
}

export async function resolveInvitationController(request, response, next) {
  try {
    const { decision } = request.body ?? {};
    if (!['accept', 'reject'].includes(decision)) return response.status(400).json({ error: 'Elegí aceptar o rechazar la invitación.' });
    const result = await resolveHouseholdInvitation(request.user.id, request.params.invitationId, decision);
    if (result.notFound) return response.status(404).json({ error: 'La invitación ya no está disponible.' });
    response.json({ ...result, households: await listUserHouseholds(request.user.id), invitations: await listUserInvitations(request.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function rotateRecoveryCodeController(request, response, next) {
  try {
    const { password } = request.body ?? {};
    if (typeof password !== 'string') return response.status(400).json({ error: 'Ingresá tu contraseña actual.' });
    const recoveryCode = await rotateRecoveryCode(request.user.id, password);
    if (!recoveryCode) return response.status(400).json({ error: 'La contraseña actual no coincide.' });
    response.json({ recoveryCode });
  } catch (error) {
    next(error);
  }
}

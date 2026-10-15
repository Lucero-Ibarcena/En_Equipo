import { SESSION_MAX_AGE_SECONDS, acknowledgeAccountRecovery, authenticateAccount, createSession, deleteSession, getUserFromSession, recoverAccount, registerAccount, startAccountRecovery, startPhoneVerification, verifyPhone } from '../services/auth.service.js';
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

export async function startRecoveryController(request, response, next) {
  try {
    const { channel, contact } = request.body ?? {};
    if (!['email', 'phone'].includes(channel) || typeof contact !== 'string') return response.status(400).json({ error: 'Elegí un medio de recuperación e ingresá el dato asociado a tu cuenta.' });
    if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())) return response.status(400).json({ error: 'Escribí un correo electrónico válido.' });
    if (channel === 'phone' && !/^\+[1-9]\d{7,14}$/.test(contact.replace(/[\s().-]/g, ''))) return response.status(400).json({ error: 'Escribí el teléfono con código de país, por ejemplo +54 9 11 1234 5678.' });
    const result = await startAccountRecovery({ channel, contact });
    if (result.rateLimited) return response.status(429).json({ error: 'Ya pediste varios códigos. Esperá unos minutos antes de volver a intentarlo.' });
    response.json({ challengeId: result.challengeId });
  } catch (error) {
    if (error.code === 'RECOVERY_DELIVERY_FAILED') return response.status(503).json({ error: error.message });
    next(error);
  }
}

export function recoveryConfirmationPageController(request, response) {
  const { id: challengeId, token, decision } = request.query;
  if (typeof challengeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(challengeId) || typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token) || !['yes', 'no'].includes(decision)) return response.status(400).type('html').send('<main><h1>El enlace no es válido</h1><p>Volvé a En Equipo y pedí un código nuevo.</p></main>');
  const heading = decision === 'yes' ? '¿Fuiste vos quien pidió esto?' : '¿Querés cancelar el intento?';
  const buttonLabel = decision === 'yes' ? 'Sí, fui yo' : 'No fui yo, cancelar';
  response.type('html').send(`<!doctype html><html lang="es-AR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>En Equipo · Confirmación</title><body style="font-family:system-ui,sans-serif;max-width:520px;margin:12vh auto;padding:24px;color:#334338"><h1>${heading}</h1><p>Confirmá esta acción para que En Equipo pueda continuar.</p><form action="/api/auth/recover/confirm" method="post"><input type="hidden" name="id" value="${challengeId}"><input type="hidden" name="token" value="${token}"><input type="hidden" name="decision" value="${decision}"><button style="padding:12px 18px;color:white;background:#416b57;border:0;border-radius:8px;font:inherit;font-weight:600" type="submit">${buttonLabel}</button></form></body></html>`);
}

export async function acknowledgeRecoveryController(request, response, next) {
  try {
    const { id: challengeId, token, decision } = request.body ?? {};
    if (typeof challengeId !== 'string' || typeof token !== 'string' || !['yes', 'no'].includes(decision)) return response.status(400).type('html').send('<main><h1>El enlace no es válido</h1><p>Volvé a En Equipo y pedí un código nuevo.</p></main>');
    const result = await acknowledgeAccountRecovery({ challengeId, token, decision });
    if (result.invalid) return response.status(400).type('html').send('<main><h1>El enlace venció</h1><p>Volvé a En Equipo y pedí un código nuevo.</p></main>');
    const message = result.cancelled
      ? result.purpose === 'phone-verification'
        ? '<h1>Cambio cancelado</h1><p>El teléfono de recuperación actual sigue asociado a tu cuenta.</p>'
        : '<h1>Solicitud cancelada</h1><p>No se cambió la contraseña. Si no reconocés este intento, no compartas el código recibido.</p>'
      : result.purpose === 'phone-verification'
        ? '<h1>Cambio confirmado</h1><p>Confirmaste que fuiste vos. Volvé a En Equipo e ingresá el código que llegó por SMS para completar el cambio.</p>'
        : '<h1>Solicitud confirmada</h1><p>Confirmaste que fuiste vos. Volvé a En Equipo para ingresar el código y elegir tu contraseña nueva.</p>';
    response.type('html').send(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>En Equipo · Recuperación</title><body style="font-family:system-ui,sans-serif;max-width:520px;margin:12vh auto;padding:24px;color:#334338">${message}</body></html>`);
  } catch (error) {
    next(error);
  }
}

export async function recoverController(request, response, next) {
  try {
    const { challengeId, code, password, decision } = request.body ?? {};
    if (typeof challengeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(challengeId) || !['yes', 'no'].includes(decision)) return response.status(400).json({ error: 'La solicitud de recuperación no es válida.' });
    if (decision === 'no') {
      await recoverAccount({ challengeId, decision });
      return response.json({ cancelled: true });
    }
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return response.status(400).json({ error: 'Ingresá el código de seis dígitos que te enviamos.' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return response.status(400).json({ error: 'La nueva contraseña debe tener entre 8 y 128 caracteres.' });
    const result = await recoverAccount({ challengeId, code, password, decision });
    if (result.invalid) return response.status(400).json({ error: 'El código no coincide, venció o ya se usó. Pedí uno nuevo para continuar.' });
    const token = await createSession(result.user.id);
    setSessionCookie(request, response, token);
    response.json({
      ...result,
      households: await listUserHouseholds(result.user.id),
      invitations: await listUserInvitations(result.user.id),
    });
  } catch (error) {
    next(error);
  }
}

export async function startPhoneVerificationController(request, response, next) {
  try {
    const { phone } = request.body ?? {};
    if (typeof phone !== 'string' || !/^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s().-]/g, ''))) return response.status(400).json({ error: 'Ingresá el teléfono con código de país, por ejemplo +54 9 11 1234 5678.' });
    const result = await startPhoneVerification(request.user.id, phone);
    if (result.invalid) return response.status(400).json({ error: 'Ingresá un número con código de país.' });
    if (result.conflict) return response.status(409).json({ error: 'Ese teléfono ya está verificado en otra cuenta.' });
    if (result.rateLimited) return response.status(429).json({ error: 'Ya pediste varios códigos. Esperá unos minutos antes de volver a intentarlo.' });
    response.json({ challengeId: result.challengeId });
  } catch (error) {
    if (error.code === 'RECOVERY_DELIVERY_FAILED') return response.status(503).json({ error: error.message });
    next(error);
  }
}

export async function verifyPhoneController(request, response, next) {
  try {
    const { challengeId, code } = request.body ?? {};
    if (typeof challengeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(challengeId) || typeof code !== 'string' || !/^\d{6}$/.test(code)) return response.status(400).json({ error: 'Ingresá el código de seis dígitos que te enviamos.' });
    const result = await verifyPhone(request.user.id, challengeId, code);
    if (result.invalid) return response.status(400).json({ error: 'El código no coincide o venció. Pedí uno nuevo para continuar.' });
    if (result.conflict) return response.status(409).json({ error: 'Ese teléfono ya está verificado en otra cuenta.' });
    if (result.awaitingConfirmation) return response.status(409).json({ error: 'Antes, confirmá este cambio desde el enlace que enviamos al correo de tu cuenta.' });
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

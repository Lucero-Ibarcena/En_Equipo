function unavailable(message) {
  const error = new Error(message);
  error.code = 'RECOVERY_DELIVERY_FAILED';
  return error;
}

export function assertRecoveryDeliveryConfigured(channel) {
  if (process.env.NODE_ENV === 'production' && !process.env.EN_EQUIPO_PUBLIC_URL) throw unavailable('Configurá EN_EQUIPO_PUBLIC_URL con la dirección pública de En Equipo.');
  if (channel === 'email' && process.env.RESEND_API_KEY && process.env.EN_EQUIPO_EMAIL_FROM) return;
  if (channel === 'phone' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) return;
  throw unavailable(channel === 'phone' ? 'La recuperación por SMS todavía no está configurada.' : 'La recuperación por correo todavía no está configurada.');
}

export async function sendPhoneChangeConfirmation({ to, phone, challengeId, acknowledgementToken }) {
  assertRecoveryDeliveryConfigured('email');
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EN_EQUIPO_EMAIL_FROM;
  const appUrl = (process.env.EN_EQUIPO_PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '');
  const yesUrl = `${appUrl}/api/auth/recover/confirm?id=${encodeURIComponent(challengeId)}&token=${encodeURIComponent(acknowledgementToken)}&decision=yes`;
  const noUrl = `${appUrl}/api/auth/recover/confirm?id=${encodeURIComponent(challengeId)}&token=${encodeURIComponent(acknowledgementToken)}&decision=no`;
  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'Confirmá el cambio de teléfono de En Equipo',
        text: `Se solicitó agregar o cambiar el teléfono de recuperación de tu cuenta por ${phone}. Si fuiste vos, confirmalo: ${yesUrl}. Si no fuiste vos, cancelá: ${noUrl}.`,
        html: `<div style="font-family:Arial,sans-serif;color:#334338;line-height:1.6"><h2>Confirmá el teléfono de recuperación</h2><p>Se pidió agregar o cambiar el teléfono de recuperación de tu cuenta por <strong>${phone}</strong>.</p><p>Para completar el cambio también hace falta el código que enviamos por SMS.</p><p><a href="${yesUrl}" style="display:inline-block;padding:10px 16px;margin-right:8px;color:white;background:#416b57;border-radius:7px;text-decoration:none">Sí, quiero cambiar el teléfono</a><a href="${noUrl}" style="display:inline-block;padding:10px 16px;color:#416b57;background:#f1f5ef;border-radius:7px;text-decoration:none">No fui yo</a></p><p>Si no reconocés este intento, cancelalo. El número actual seguirá asociado a tu cuenta.</p></div>`,
      }),
    });
  } catch {
    throw unavailable('No pudimos enviar el correo de confirmación. Probá de nuevo en unos minutos.');
  }
  if (!response.ok) throw unavailable('No pudimos enviar el correo de confirmación. Probá de nuevo en unos minutos.');
}

export async function sendRecoveryCode({ channel, to, code, purpose = 'recovery', challengeId, acknowledgementToken }) {
  const isPhoneVerification = purpose === 'phone-verification';
  const subject = isPhoneVerification ? 'Confirmá tu teléfono de En Equipo' : 'Código para recuperar tu cuenta de En Equipo';
  const instruction = isPhoneVerification
    ? 'Ingresá este código en En Equipo para confirmar tu teléfono:'
    : 'Ingresá este código en En Equipo para elegir una contraseña nueva:';
  if (channel === 'email') {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EN_EQUIPO_EMAIL_FROM;
    assertRecoveryDeliveryConfigured(channel);
    const appUrl = (process.env.EN_EQUIPO_PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '');
    const yesUrl = `${appUrl}/api/auth/recover/confirm?id=${encodeURIComponent(challengeId)}&token=${encodeURIComponent(acknowledgementToken)}&decision=yes`;
    const noUrl = `${appUrl}/api/auth/recover/confirm?id=${encodeURIComponent(challengeId)}&token=${encodeURIComponent(acknowledgementToken)}&decision=no`;
    let response;
    try { response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: isPhoneVerification
          ? `Tu código para confirmar el teléfono es ${code}. Vence en 10 minutos.`
          : `Tu código para recuperar la cuenta es ${code}. Vence en 10 minutos. ¿Pediste este cambio? Sí, fui yo: ${yesUrl} No fui yo: ${noUrl}.`,
        html: isPhoneVerification
          ? `<div style="font-family:Arial,sans-serif;color:#334338;line-height:1.6"><h2>Confirmá tu teléfono</h2><p>${instruction}</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>El código vence en 10 minutos.</p></div>`
          : `<div style="font-family:Arial,sans-serif;color:#334338;line-height:1.6"><h2>Recuperá tu cuenta</h2><p>${instruction}</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>El código vence en 10 minutos.</p><p>¿Fuiste vos quien pidió recuperar la cuenta?</p><p><a href="${yesUrl}" style="display:inline-block;padding:10px 16px;margin-right:8px;color:white;background:#416b57;border-radius:7px;text-decoration:none">Sí, fui yo</a><a href="${noUrl}" style="display:inline-block;padding:10px 16px;color:#416b57;background:#f1f5ef;border-radius:7px;text-decoration:none">No fui yo</a></p><p>Si no fuiste vos, la solicitud se cancela y tu contraseña no cambia.</p></div>`,
      }),
    }); } catch { throw unavailable('No pudimos enviar el correo. Probá de nuevo en unos minutos.'); }
    if (!response.ok) throw unavailable('No pudimos enviar el correo. Probá de nuevo en unos minutos.');
    return;
  }

  if (channel === 'phone') {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
    assertRecoveryDeliveryConfigured(channel);
    const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const appUrl = (process.env.EN_EQUIPO_PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '');
    const yesUrl = `${appUrl}/api/auth/recover/confirm?id=${encodeURIComponent(challengeId)}&token=${encodeURIComponent(acknowledgementToken)}&decision=yes`;
    const noUrl = `${appUrl}/api/auth/recover/confirm?id=${encodeURIComponent(challengeId)}&token=${encodeURIComponent(acknowledgementToken)}&decision=no`;
    const body = new URLSearchParams({
      To: to,
      From: TWILIO_FROM_NUMBER,
      Body: isPhoneVerification
        ? `En Equipo: tu código para confirmar el teléfono es ${code}. Vence en 10 minutos.`
        : `En Equipo: tu código para recuperar la cuenta es ${code}. Vence en 10 min. ¿Fuiste vos? ${yesUrl} ¿No fuiste vos? Cancelá: ${noUrl}`,
    });
    let response;
    try { response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }); } catch { throw unavailable('No pudimos enviar el SMS. Revisá el número o probá de nuevo.'); }
    if (!response.ok) throw unavailable('No pudimos enviar el SMS. Revisá el número o probá de nuevo.');
    return;
  }

  throw unavailable('Elegí un medio de recuperación válido.');
}

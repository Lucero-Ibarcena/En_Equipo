// [INTERFAZ: INVITAR AL HOGAR] Muestra el enlace, el código y el QR para compartir acceso.
import { useState } from 'react';
import { Check, Copy, Link, MessageCircle, QrCode, X } from 'lucide-react';
import HouseholdQrCode from './HouseholdQrCode.jsx';
import { createHouseholdJoinLink, formatInviteCode } from '../../../utils/qrCode.js';
export default function HouseholdInviteDialog({ open, household, onClose }) {
  const [copied, setCopied] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  if (!open || !household?.inviteCode) return null;
  const link = createHouseholdJoinLink(household.inviteCode);
  const phoneDigits = phone.replace(/\D/g, '');
  const phoneForSms = phone.trim().startsWith('+') ? `+${phoneDigits}` : phoneDigits;
  const smsHref =
    phoneDigits.length >= 8
      ? `sms:${phoneForSms}?body=${encodeURIComponent(
          `Sumate al hogar “${household.name}” en En Equipo: ${link}`
        )}`
      : '';
  const copy = async (value, key) => {
    setError('');
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setError('No pudimos copiarlo. Seleccioná el texto para copiarlo manualmente.');
    }
  };
  const shareLink = async () => {
    setError('');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Unirse a ${household.name}`,
          text: 'Te invito a organizar el hogar en equipo.',
          url: link,
        });
        return;
      } catch (shareError) {
        if (shareError.name === 'AbortError') return;
      }
    }
    await copy(link, 'link');
  };
  const isLocalAddress = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="task-dialog household-share-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="household-share-title"
      >
        <div className="task-dialog__top">
          <span className="household-share-dialog__mark">
            <QrCode size={19} />
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar invitación"
          >
            <X size={19} />
          </button>
        </div>
        <span className="eyebrow">INVITAR AL HOGAR</span>
        <h2 id="household-share-title">Sumar a alguien a {household.name}</h2>
        <p className="task-dialog__intro">
          Que abra este enlace desde su teléfono o escanee el QR con la cámara. Después de iniciar
          sesión, podrá entrar a este hogar.
        </p>
        <div className="household-share-dialog__qr">
          <HouseholdQrCode value={link} label={`Código QR para unirse a ${household.name}`} />
        </div>
        {isLocalAddress && (
          <p className="household-share-dialog__local-note">
            Estás usando una dirección local. Para que el QR abra en otro teléfono, abrí En Equipo
            con la dirección de red que muestra el servidor o publicá la app.
          </p>
        )}
        {/* [INVITACIÓN: RESPALDO 1] Código corto para entrar si no se puede escanear el QR. */}
        <div className="household-share-dialog__code">
          <span className="eyebrow">CÓDIGO DEL HOGAR</span>
          <code>{formatInviteCode(household.inviteCode)}</code>
        </div>
        <div className="household-share-dialog__actions">
          <button
            type="button"
            className="button button--outline"
            onClick={() => copy(formatInviteCode(household.inviteCode), 'code')}
          >
            {copied === 'code' ? <Check size={15} /> : <Copy size={15} />}
            {copied === 'code' ? 'Código copiado' : 'Copiar código'}
          </button>
          {/* [INVITACIÓN: RESPALDO 2] Enlace compartible si no se usa el QR o el código manual. */}
          <button type="button" className="button button--primary" onClick={shareLink}>
            <Link size={15} />
            {copied === 'link' ? 'Enlace copiado' : 'Compartir enlace'}
          </button>
        </div>
        {/* [INVITACIÓN: RESPALDO 3] SMS con el enlace listo para enviar. */}
        <div className="household-share-dialog__sms">
          <label className="form-field">
            <span>También podés preparar un SMS</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              spellCheck="false"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+54 9 11 1234 5678"
            />
          </label>
          {smsHref && (
            <a className="button button--outline" href={smsHref}>
              <MessageCircle size={15} />
              Abrir mensaje
            </a>
          )}
          <small>Se abre la app de mensajes con el enlace listo; vos confirmás el envío.</small>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}

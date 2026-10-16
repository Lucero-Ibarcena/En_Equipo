// [INTERFAZ: PERFIL] Permite editar los datos visibles, el tema, el color y las opciones de
// recuperación.
import { useEffect, useState } from 'react';
import { Check, ImagePlus, LogOut, Moon, Phone, Sun, X } from 'lucide-react';
import Avatar from '../../../components/common/Avatar.jsx';

// [PERFIL: PALETA] Los identificadores se conservan en los perfiles guardados.
const COLORS = [
  {
    id: 'sage',
    label: 'Salvia',
  },
  {
    id: 'blue',
    label: 'Azul',
  },
  {
    id: 'peach',
    label: 'Durazno',
  },
  {
    id: 'plum',
    label: 'Ciruela',
  },
  {
    id: 'teal',
    label: 'Turquesa',
  },
  {
    id: 'rose',
    label: 'Rosa',
  },
  {
    id: 'gold',
    label: 'Mostaza',
  },
  {
    id: 'lavender',
    label: 'Lavanda',
  },
  {
    id: 'coral',
    label: 'Coral',
  },
  {
    id: 'sky',
    label: 'Celeste',
  },
];
export default function ProfileDialog({
  open,
  user,
  onClose,
  onSubmit,
  onPhoneStart,
  onPhoneVerify,
  onPhoneVerified,
  onSignOut,
  saving,
}) {
  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(/\s+/)[0] || '');
  const [lastName, setLastName] = useState(
    user?.lastName || user?.name?.split(/\s+/).slice(1).join(' ') || ''
  );
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [displayMode, setDisplayMode] = useState(user?.displayMode || 'first_name');
  const [theme, setTheme] = useState(user?.theme || 'light');
  const [color, setColor] = useState(user?.color || 'sage');
  const [avatarData, setAvatarData] = useState(user?.avatarData || null);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneChallengeId, setPhoneChallengeId] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setFirstName(user?.firstName || user?.name?.split(/\s+/)[0] || '');
      setLastName(user?.lastName || user?.name?.split(/\s+/).slice(1).join(' ') || '');
      setNickname(user?.nickname || '');
      setDisplayMode(user?.displayMode || 'first_name');
      setTheme(user?.theme || 'light');
      setColor(user?.color || 'sage');
      setAvatarData(user?.avatarData || null);
      setPhone(user?.phone || '');
      setPhoneCode('');
      setPhoneChallengeId('');
      setError('');
    }
  }, [open, user?.id]);
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim(),
        displayMode,
        theme,
        color,
        avatarData,
      });
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    }
  };
  const previewName =
    displayMode === 'nickname' && nickname.trim()
      ? nickname.trim()
      : displayMode === 'full_name'
        ? `${firstName.trim()} ${lastName.trim()}`.trim()
        : firstName.trim();
  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 512 * 1024) {
      setError('Elegí una foto PNG, JPG o WebP de hasta 512 KB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarData(String(reader.result));
      setError('');
    };
    reader.onerror = () => setError('No pudimos leer esa imagen.');
    reader.readAsDataURL(file);
  };
  const handlePhoneStart = async () => {
    setError('');
    setPhoneBusy(true);
    try {
      const result = await onPhoneStart(phone.trim());
      setPhoneChallengeId(result.challengeId);
      setPhoneCode('');
    } catch (phoneError) {
      setError(phoneError.message);
    } finally {
      setPhoneBusy(false);
    }
  };
  const handlePhoneVerify = async () => {
    setError('');
    setPhoneBusy(true);
    try {
      const result = await onPhoneVerify(phoneChallengeId, phoneCode);
      onPhoneVerified(result.user);
      setPhoneChallengeId('');
      setPhoneCode('');
    } catch (phoneError) {
      setError(phoneError.message);
    } finally {
      setPhoneBusy(false);
    }
  };
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="task-dialog profile-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-dialog-title"
      >
        <div className="task-dialog__top">
          <span className="eyebrow">TU CUENTA</span>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={19} />
          </button>
        </div>
        <h2 id="profile-dialog-title">Tu perfil y preferencias</h2>
        <p className="task-dialog__intro">
          Tu cuenta es individual y puede formar parte de varios hogares.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="profile-avatar-editor">
            <Avatar
              member={{
                ...user,
                name: previewName,
                initials: previewName
                  .split(/\s+/)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase(),
                avatarData,
                color,
              }}
              size="large"
            />
            <label className="button button--outline profile-photo-button">
              <ImagePlus size={15} />
              Elegir foto
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhoto} />
            </label>
            {avatarData && (
              <button type="button" className="text-link" onClick={() => setAvatarData(null)}>
                Usar iniciales
              </button>
            )}
          </div>
          <div className="profile-name-fields">
            <label className="form-field">
              <span>Nombre/s</span>
              <input
                autoFocus
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  setError('');
                }}
                maxLength={50}
                required
              />
            </label>
            <label className="form-field">
              <span>Apellido/s</span>
              <input
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                  setError('');
                }}
                maxLength={60}
                required
              />
            </label>
          </div>
          <label className="form-field">
            <span>Apodo (opcional)</span>
            <input
              autoComplete="nickname"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value);
                setError('');
                if (!event.target.value.trim() && displayMode === 'nickname')
                  setDisplayMode('first_name');
              }}
              maxLength={40}
              placeholder="Como te dicen en casa"
            />
          </label>
          <label className="form-field">
            <span>Qué nombre ven los demás</span>
            <select value={displayMode} onChange={(event) => setDisplayMode(event.target.value)}>
              <option value="first_name">Solo mi nombre</option>
              <option value="full_name">Nombre/s y apellido/s</option>
              <option value="nickname" disabled={!nickname.trim()}>
                Mi apodo
              </option>
            </select>
            <small className="profile-name-hint">
              El apellido no se comparte si elegís solo tu nombre o apodo.
            </small>
          </label>
          <div className="profile-dialog__email">
            <span>Correo</span>
            <strong>{user?.email}</strong>
          </div>
          <section className="profile-phone" aria-labelledby="profile-phone-title">
            <div className="profile-phone__heading">
              <Phone size={16} />
              <strong id="profile-phone-title">Teléfono para recuperar la cuenta</strong>
            </div>
            {user?.phoneVerified && (
              <p className="profile-phone__verified">
                <Check size={14} />
                Verificado: {user.phone}
              </p>
            )}
            <label className="form-field">
              <span>Número con código de país</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+54 9 11 1234 5678"
              />
            </label>
            {!phoneChallengeId ? (
              <button
                className="button button--outline"
                type="button"
                onClick={handlePhoneStart}
                disabled={phoneBusy || !phone.trim()}
              >
                {phoneBusy
                  ? 'Enviando código…'
                  : user?.phoneVerified
                    ? 'Cambiar teléfono'
                    : 'Verificar teléfono'}
              </button>
            ) : (
              <div className="profile-phone__verify">
                <label className="form-field">
                  <span>Código de seis dígitos</span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={phoneCode}
                    onChange={(event) =>
                      setPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    maxLength={6}
                  />
                </label>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={handlePhoneVerify}
                  disabled={phoneBusy || phoneCode.length !== 6}
                >
                  {phoneBusy ? 'Verificando…' : 'Confirmar teléfono'}
                </button>
              </div>
            )}
            <small>
              {phoneChallengeId
                ? 'Para proteger el cambio, primero confirmalo desde el correo de tu cuenta y después ingresá el código que llegó por SMS.'
                : 'Si olvidás el correo, este número te permite recuperar la cuenta. Para cambiarlo, confirmamos el pedido por correo y por SMS.'}
            </small>
          </section>
          <fieldset className="profile-choice">
            <legend>Color de perfil</legend>
            <div className="profile-colors">
              {COLORS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`profile-color profile-color--${item.id}${
                    color === item.id ? ' profile-color--selected' : ''
                  }`}
                  onClick={() => setColor(item.id)}
                  aria-label={item.label}
                  aria-pressed={color === item.id}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className="profile-choice">
            <legend>Tema de la aplicación</legend>
            <div className="profile-theme-options">
              <button
                type="button"
                className={
                  theme === 'light' ? 'profile-theme profile-theme--selected' : 'profile-theme'
                }
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
              >
                <Sun size={16} />
                Claro
              </button>
              <button
                type="button"
                className={
                  theme === 'dark' ? 'profile-theme profile-theme--selected' : 'profile-theme'
                }
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
              >
                <Moon size={16} />
                Oscuro
              </button>
            </div>
          </fieldset>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="task-dialog__actions">
            <button
              className="button button--quiet profile-dialog__logout"
              type="button"
              onClick={onSignOut}
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
            <button className="button button--primary" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar perfil'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

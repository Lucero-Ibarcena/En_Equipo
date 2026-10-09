import { useEffect, useState } from 'react';
import { Eye, EyeOff, ImagePlus, LogOut, Moon, Sun, X } from 'lucide-react';
import Avatar from './Avatar.jsx';

const COLORS = [
  { id: 'sage', label: 'Salvia' },
  { id: 'blue', label: 'Azul' },
  { id: 'peach', label: 'Durazno' },
  { id: 'plum', label: 'Ciruela' },
  { id: 'teal', label: 'Turquesa' },
  { id: 'rose', label: 'Rosa' },
  { id: 'gold', label: 'Mostaza' },
  { id: 'lavender', label: 'Lavanda' },
  { id: 'coral', label: 'Coral' },
  { id: 'sky', label: 'Celeste' },
];

export default function ProfileDialog({ open, user, onClose, onSubmit, onRotateRecoveryCode, onSignOut, saving }) {
  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(/\s+/)[0] || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(/\s+/).slice(1).join(' ') || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [displayMode, setDisplayMode] = useState(user?.displayMode || 'first_name');
  const [theme, setTheme] = useState(user?.theme || 'light');
  const [color, setColor] = useState(user?.color || 'sage');
  const [avatarData, setAvatarData] = useState(user?.avatarData || null);
  const [error, setError] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryPasswordVisible, setRecoveryPasswordVisible] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setFirstName(user?.firstName || user?.name?.split(/\s+/)[0] || '');
      setLastName(user?.lastName || user?.name?.split(/\s+/).slice(1).join(' ') || '');
      setNickname(user?.nickname || '');
      setDisplayMode(user?.displayMode || 'first_name');
      setTheme(user?.theme || 'light');
      setColor(user?.color || 'sage');
      setAvatarData(user?.avatarData || null);
      setError('');
      setRecoveryCode('');
      setRecoveryPassword('');
      setRecoveryPasswordVisible(false);
    }
  }, [open, user?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), nickname: nickname.trim(), displayMode, theme, color, avatarData });
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const previewName = displayMode === 'nickname' && nickname.trim()
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
    reader.onload = () => { setAvatarData(String(reader.result)); setError(''); };
    reader.onerror = () => setError('No pudimos leer esa imagen.');
    reader.readAsDataURL(file);
  };

  const handleRotateCode = async () => {
    setError('');
    setRecovering(true);
    try {
      const result = await onRotateRecoveryCode(recoveryPassword);
      setRecoveryCode(result.recoveryCode);
      setRecoveryPassword('');
    } catch (rotateError) {
      setError(rotateError.message);
    } finally {
      setRecovering(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('No pudimos copiarlo. Seleccioná el código para copiarlo manualmente.');
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="task-dialog profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title">
        <div className="task-dialog__top"><span className="eyebrow">TU CUENTA</span><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></div>
        <h2 id="profile-dialog-title">Tu perfil y preferencias</h2>
        <p className="task-dialog__intro">Tu cuenta es individual y puede formar parte de varios hogares.</p>
        <form onSubmit={handleSubmit}>
          <div className="profile-avatar-editor">
            <Avatar member={{ ...user, name: previewName, initials: previewName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase(), avatarData, color }} size="large" />
            <label className="button button--outline profile-photo-button"><ImagePlus size={15} />Elegir foto<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhoto} /></label>
            {avatarData && <button type="button" className="text-link" onClick={() => setAvatarData(null)}>Usar iniciales</button>}
          </div>
          <div className="profile-name-fields">
            <label className="form-field"><span>Nombre</span><input autoFocus autoComplete="given-name" value={firstName} onChange={(event) => { setFirstName(event.target.value); setError(''); }} maxLength={50} required /></label>
            <label className="form-field"><span>Apellido/s</span><input autoComplete="family-name" value={lastName} onChange={(event) => { setLastName(event.target.value); setError(''); }} maxLength={60} required /></label>
          </div>
          <label className="form-field"><span>Apodo (opcional)</span><input autoComplete="nickname" value={nickname} onChange={(event) => { setNickname(event.target.value); setError(''); if (!event.target.value.trim() && displayMode === 'nickname') setDisplayMode('first_name'); }} maxLength={40} placeholder="Como te dicen en casa" /></label>
          <label className="form-field"><span>Qué nombre ven los demás</span><select value={displayMode} onChange={(event) => setDisplayMode(event.target.value)}>
            <option value="first_name">Solo mi nombre</option>
            <option value="full_name">Nombre y apellido/s</option>
            <option value="nickname" disabled={!nickname.trim()}>Mi apodo</option>
          </select><small className="profile-name-hint">El apellido no se comparte si elegís solo tu nombre o apodo.</small></label>
          <div className="profile-dialog__email"><span>Correo</span><strong>{user?.email}</strong></div>
          <fieldset className="profile-choice"><legend>Color de perfil</legend><div className="profile-colors">{COLORS.map((item) => <button type="button" key={item.id} className={`profile-color profile-color--${item.id}${color === item.id ? ' profile-color--selected' : ''}`} onClick={() => setColor(item.id)} aria-label={item.label} aria-pressed={color === item.id} />)}</div></fieldset>
          <fieldset className="profile-choice"><legend>Tema de la aplicación</legend><div className="profile-theme-options"><button type="button" className={theme === 'light' ? 'profile-theme profile-theme--selected' : 'profile-theme'} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}><Sun size={16} />Claro</button><button type="button" className={theme === 'dark' ? 'profile-theme profile-theme--selected' : 'profile-theme'} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}><Moon size={16} />Oscuro</button></div></fieldset>
          <div className="profile-recovery">
            <strong>Código de recuperación</strong>
            {recoveryCode ? <><p>Este código nuevo reemplaza al anterior. Guardalo; es el que vas a usar si olvidás tu contraseña.</p><code>{recoveryCode}</code><button type="button" className="button button--outline" onClick={copyCode}>{copied ? 'Copiado' : 'Copiar código'}</button></> : (
              <>
                <p>Este código te permite cambiar tu contraseña desde la pantalla de acceso sin conocer la contraseña anterior. Si lo perdiste o querés reemplazarlo, podés hacerlo mientras tengas la sesión abierta; el código viejo dejará de servir.</p>
                <div className="profile-recovery__form"><span className="password-input-wrap"><input type={recoveryPasswordVisible ? 'text' : 'password'} autoComplete="current-password" placeholder="Contraseña actual" value={recoveryPassword} onChange={(event) => setRecoveryPassword(event.target.value)} aria-label="Contraseña actual para reemplazar el código" /><button className="password-visibility" type="button" aria-label={recoveryPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={recoveryPasswordVisible} onClick={() => setRecoveryPasswordVisible((visible) => !visible)}>{recoveryPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></span><button type="button" className="button button--outline" onClick={handleRotateCode} disabled={recovering || !recoveryPassword}>{recovering ? 'Reemplazando…' : 'Reemplazar código'}</button></div>
              </>
            )}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="task-dialog__actions"><button className="button button--quiet profile-dialog__logout" type="button" onClick={onSignOut}><LogOut size={15} />Cerrar sesión</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar perfil'}</button></div>
        </form>
      </section>
    </div>
  );
}

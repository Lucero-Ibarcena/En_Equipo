import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import BrandMark from './BrandMark.jsx';
import { householdApi } from '../services/api.js';

export default function AuthScreen({ onAuthenticated, onReturnToGuest, pendingJoinCode = '' }) {
  const [mode, setMode] = useState('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [displayMode, setDisplayMode] = useState('first_name');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = mode === 'register'
        ? await householdApi.register({ firstName, lastName, nickname, displayMode, email, password, joinCode: pendingJoinCode })
        : mode === 'recover'
          ? await householdApi.recover({ email, recoveryCode, password })
          : await householdApi.login({ email, password });
      await onAuthenticated(result);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const setScreen = (nextMode) => {
    setMode(nextMode);
    setPasswordVisible(false);
    setError('');
  };

  const title = mode === 'login' ? 'Qué bueno verte.' : mode === 'register' ? 'Empecemos en equipo.' : 'Recuperá tu cuenta.';
  const description = mode === 'login'
    ? 'Iniciá sesión para guardar tus cambios y organizar tus hogares.'
    : mode === 'register'
      ? 'Creá una cuenta personal para guardar tus cambios y unirte a uno o más hogares.'
      : 'Ingresá el código de recuperación guardado y elegí una contraseña nueva. No necesitás la contraseña anterior.';

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <BrandMark />
        <button className="auth-card__back" type="button" onClick={onReturnToGuest}><ArrowLeft size={15} />Volver a probar la app</button>
        <div className="auth-card__intro">
          <span className="auth-card__icon"><LockKeyhole size={18} /></span>
          <span className="eyebrow">ORGANIZACIÓN COMPARTIDA</span>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && <>
            <div className="auth-name-fields">
              <label className="form-field"><span>Nombre</span><input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={50} required /></label>
              <label className="form-field"><span>Apellido/s</span><input autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={60} required /></label>
            </div>
            <label className="form-field"><span>Apodo (opcional)</span><input autoComplete="nickname" value={nickname} onChange={(event) => { setNickname(event.target.value); if (!event.target.value.trim() && displayMode === 'nickname') setDisplayMode('first_name'); }} maxLength={40} placeholder="Como te dicen en casa" /></label>
            <label className="form-field"><span>Qué nombre ven los demás</span><select value={displayMode} onChange={(event) => setDisplayMode(event.target.value)}>
              <option value="first_name">Solo mi nombre</option>
              <option value="full_name">Nombre y apellido/s</option>
              <option value="nickname" disabled={!nickname.trim()}>Mi apodo</option>
            </select><small className="auth-card__hint">Tu apellido queda privado si elegís solo tu nombre o apodo.</small></label>
          </>}
          <label className="form-field"><span>{mode === 'recover' ? 'Correo electrónico (opcional)' : 'Correo electrónico'}</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required={mode !== 'recover'} /></label>
          {mode === 'recover' && <label className="form-field"><span>Código de recuperación</span><input autoComplete="off" value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value.toUpperCase())} maxLength={19} placeholder="XXXX-XXXX-XXXX-XXXX" required /></label>}
          <label className="form-field">
            <span>{mode === 'recover' ? 'Nueva contraseña' : 'Contraseña'}</span>
            <span className="password-input-wrap">
              <input type={passwordVisible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required />
              <button className="password-visibility" type="button" aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)}>{passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </span>
          </label>
          {mode !== 'login' && <small className="auth-card__hint">Usá al menos 8 caracteres.</small>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button--primary auth-card__submit" type="submit" disabled={submitting}>
            {submitting ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Restablecer contraseña'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>
        {mode === 'login' && <p className="auth-card__switch"><button type="button" onClick={() => setScreen('recover')}>¿Olvidaste tu contraseña?</button></p>}
        <p className="auth-card__switch">
          {mode === 'register' ? '¿Ya tenés una cuenta?' : '¿Todavía no tenés cuenta?'}
          <button type="button" onClick={() => setScreen(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Iniciar sesión' : 'Crear cuenta'}</button>
        </p>
      </section>
    </main>
  );
}

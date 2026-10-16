// [INTERFAZ: ACCESO] Reúne el inicio de sesión, el registro y la recuperación de cuenta.
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import BrandMark from '../../../components/common/BrandMark.jsx';
import { householdApi } from '../../../services/api.js';
export default function AuthScreen({
  initialMode = 'login',
  onAuthenticated,
  onReturnToGuest,
  pendingJoinCode = '',
}) {
  const [mode, setMode] = useState(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [displayMode, setDisplayMode] = useState('first_name');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [recoveryChannel, setRecoveryChannel] = useState('email');
  const [recoveryContact, setRecoveryContact] = useState('');
  const [recoveryStep, setRecoveryStep] = useState('request');
  const [recoveryChallengeId, setRecoveryChallengeId] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);
  const [recoveryCancelled, setRecoveryCancelled] = useState(false);
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'recover') {
        if (recoveryCancelled) return;
        if (recoveryStep === 'request') {
          const result = await householdApi.startRecovery({
            channel: recoveryChannel,
            contact: recoveryContact.trim(),
          });
          setRecoveryChallengeId(result.challengeId);
          setRecoveryStep('verify');
          return;
        }
        if (!recoveryConfirmed) {
          setError('Confirmá si fuiste vos quien pidió recuperar la cuenta.');
          return;
        }
        if (password !== passwordConfirmation) {
          setError('Las contraseñas no coinciden.');
          return;
        }
        const result = await householdApi.recover({
          challengeId: recoveryChallengeId,
          code: recoveryOtp,
          password,
          decision: 'yes',
        });
        await onAuthenticated(result);
        return;
      }
      const result =
        mode === 'register'
          ? await householdApi.register({
              firstName,
              lastName,
              nickname,
              displayMode,
              email,
              password,
              joinCode: pendingJoinCode,
            })
          : await householdApi.login({
              email,
              password,
            });
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
    setRecoveryStep('request');
    setRecoveryChallengeId('');
    setRecoveryOtp('');
    setRecoveryConfirmed(false);
    setRecoveryCancelled(false);
    setPassword('');
    setPasswordConfirmation('');
    setError('');
  };
  const title =
    mode === 'login'
      ? 'Qué bueno verte.'
      : mode === 'register'
        ? 'Empecemos en equipo.'
        : 'Recuperá tu cuenta.';
  const description =
    mode === 'login'
      ? 'Iniciá sesión para guardar tus cambios y organizar tus hogares.'
      : mode === 'register'
        ? 'Creá una cuenta personal para guardar tus cambios y unirte a uno o más hogares.'
        : 'Recibí un código por correo o por un teléfono que ya hayas verificado. No necesitás tu contraseña anterior.';
  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <BrandMark />
        {onReturnToGuest && (
          <button className="auth-card__back" type="button" onClick={onReturnToGuest}>
            <ArrowLeft size={15} />
            Volver a la vista previa
          </button>
        )}
        <div className="auth-card__intro">
          <span className="auth-card__icon">
            <LockKeyhole size={18} />
          </span>
          <span className="eyebrow">ORGANIZACIÓN COMPARTIDA</span>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === 'recover' ? (
            recoveryCancelled ? (
              <div className="recovery-cancelled" role="status">
                <strong>Solicitud cancelada</strong>
                <span>
                  No se cambió la contraseña. Si no reconocés este intento, ignorá el código
                  recibido.
                </span>
                <button
                  className="button button--outline"
                  type="button"
                  onClick={() => setScreen('login')}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : recoveryStep === 'request' ? (
              <>
                <div
                  className="recovery-channel"
                  role="group"
                  aria-label="Elegir medio para recibir el código"
                >
                  <button
                    type="button"
                    className={
                      recoveryChannel === 'email'
                        ? 'recovery-channel__option recovery-channel__option--active'
                        : 'recovery-channel__option'
                    }
                    aria-pressed={recoveryChannel === 'email'}
                    onClick={() => setRecoveryChannel('email')}
                  >
                    Correo electrónico
                  </button>
                  <button
                    type="button"
                    className={
                      recoveryChannel === 'phone'
                        ? 'recovery-channel__option recovery-channel__option--active'
                        : 'recovery-channel__option'
                    }
                    aria-pressed={recoveryChannel === 'phone'}
                    onClick={() => setRecoveryChannel('phone')}
                  >
                    Teléfono verificado
                  </button>
                </div>
                <label className="form-field">
                  <span>
                    {recoveryChannel === 'email'
                      ? 'Correo de tu cuenta'
                      : 'Teléfono con código de país'}
                  </span>
                  <input
                    type={recoveryChannel === 'email' ? 'email' : 'tel'}
                    inputMode={recoveryChannel === 'phone' ? 'tel' : undefined}
                    autoComplete={recoveryChannel === 'email' ? 'email' : 'tel'}
                    value={recoveryContact}
                    onChange={(event) => setRecoveryContact(event.target.value)}
                    placeholder={recoveryChannel === 'phone' ? '+54 9 11 1234 5678' : ''}
                    maxLength={254}
                    required
                  />
                </label>
                {recoveryChannel === 'phone' && (
                  <small className="auth-card__hint">
                    El teléfono debe haberse verificado en tu perfil antes de perder el acceso.
                  </small>
                )}
              </>
            ) : (
              <>
                <p className="recovery-message" role="status">
                  Si el dato corresponde a una cuenta, te enviamos un código de seis dígitos. Revisá
                  también la carpeta de correo no deseado.
                </p>
                <label className="form-field">
                  <span>Código de seis dígitos</span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={recoveryOtp}
                    onChange={(event) =>
                      setRecoveryOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    maxLength={6}
                    required
                  />
                </label>
                <fieldset className="recovery-confirmation">
                  <legend>¿Fuiste vos quien pidió recuperar la cuenta?</legend>
                  <div>
                    <button
                      type="button"
                      className={
                        recoveryConfirmed ? 'button button--primary' : 'button button--outline'
                      }
                      aria-pressed={recoveryConfirmed}
                      onClick={() => {
                        setRecoveryConfirmed(true);
                        setError('');
                      }}
                    >
                      Sí, fui yo
                    </button>
                    <button
                      type="button"
                      className="button button--quiet"
                      onClick={async () => {
                        setSubmitting(true);
                        try {
                          await householdApi.recover({
                            challengeId: recoveryChallengeId,
                            decision: 'no',
                          });
                          setRecoveryCancelled(true);
                          setRecoveryConfirmed(false);
                          setError('');
                        } catch (cancelError) {
                          setError(cancelError.message);
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      No fui yo
                    </button>
                  </div>
                </fieldset>
                {recoveryConfirmed && (
                  <>
                    <label className="form-field">
                      <span>Nueva contraseña</span>
                      <span className="password-input-wrap">
                        <input
                          type={passwordVisible ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          minLength={8}
                          maxLength={128}
                          required
                        />
                        <button
                          className="password-visibility"
                          type="button"
                          aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          aria-pressed={passwordVisible}
                          onClick={() => setPasswordVisible((visible) => !visible)}
                        >
                          {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </span>
                    </label>
                    <label className="form-field">
                      <span>Repetí la nueva contraseña</span>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={passwordConfirmation}
                        onChange={(event) => setPasswordConfirmation(event.target.value)}
                        minLength={8}
                        maxLength={128}
                        required
                      />
                    </label>
                    <small className="auth-card__hint">
                      Usá al menos 8 caracteres. El código vence en 10 minutos.
                    </small>
                  </>
                )}
                <button
                  className="text-link recovery-resend"
                  type="button"
                  onClick={() => {
                    setRecoveryStep('request');
                    setRecoveryChallengeId('');
                    setRecoveryOtp('');
                    setRecoveryConfirmed(false);
                    setError('');
                  }}
                >
                  Volver y pedir otro código
                </button>
              </>
            )
          ) : (
            <>
              {mode === 'register' && (
                <>
                  <div className="auth-name-fields">
                    <label className="form-field">
                      <span>Nombre/s</span>
                      <input
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        maxLength={50}
                        required
                      />
                    </label>
                    <label className="form-field">
                      <span>Apellido/s</span>
                      <input
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
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
                        if (!event.target.value.trim() && displayMode === 'nickname')
                          setDisplayMode('first_name');
                      }}
                      maxLength={40}
                      placeholder="Como te dicen en casa"
                    />
                  </label>
                  <label className="form-field">
                    <span>Qué nombre ven los demás</span>
                    <select
                      value={displayMode}
                      onChange={(event) => setDisplayMode(event.target.value)}
                    >
                      <option value="first_name">Solo mi nombre</option>
                      <option value="full_name">Nombre/s y apellido/s</option>
                      <option value="nickname" disabled={!nickname.trim()}>
                        Mi apodo
                      </option>
                    </select>
                    <small className="auth-card__hint">
                      Tu apellido queda privado si elegís solo tu nombre o apodo.
                    </small>
                  </label>
                </>
              )}
              <label className="form-field">
                <span>Correo electrónico</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                  required
                />
              </label>
              <label className="form-field">
                <span>Contraseña</span>
                <span className="password-input-wrap">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    maxLength={128}
                    required
                  />
                  <button
                    className="password-visibility"
                    type="button"
                    aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                  >
                    {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>
              {mode === 'register' && (
                <small className="auth-card__hint">Usá al menos 8 caracteres.</small>
              )}
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {!recoveryCancelled && (
            <button
              className="button button--primary auth-card__submit"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? 'Un momento…'
                : mode === 'login'
                  ? 'Iniciar sesión'
                  : mode === 'register'
                    ? 'Crear cuenta'
                    : recoveryStep === 'request'
                      ? 'Enviar código'
                      : 'Cambiar contraseña'}
              {!submitting && <ArrowRight size={16} />}
            </button>
          )}
        </form>
        {mode === 'login' && (
          <p className="auth-card__switch">
            <button type="button" onClick={() => setScreen('recover')}>
              ¿Olvidaste tu contraseña o correo?
            </button>
          </p>
        )}
        {mode !== 'recover' ? (
          <p className="auth-card__switch">
            {mode === 'register' ? '¿Ya tenés una cuenta?' : '¿Todavía no tenés cuenta?'}
            <button
              type="button"
              onClick={() => setScreen(mode === 'register' ? 'login' : 'register')}
            >
              {mode === 'register' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </p>
        ) : (
          <p className="auth-card__switch">
            <button type="button" onClick={() => setScreen('login')}>
              Volver al inicio de sesión
            </button>
          </p>
        )}
      </section>
    </main>
  );
}

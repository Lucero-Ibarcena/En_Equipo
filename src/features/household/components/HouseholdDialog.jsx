// [INTERFAZ: HOGARES] Permite crear, buscar, renombrar o seleccionar hogares.
import { useEffect, useState } from 'react';
import { Check, Copy, HousePlus, KeyRound, Link, Search, X } from 'lucide-react';
import { householdApi } from '../../../services/api.js';
import HouseholdQrCode from './HouseholdQrCode.jsx';
import { createHouseholdJoinLink, formatInviteCode } from '../../../utils/qrCode.js';
export default function HouseholdDialog({
  open,
  required = false,
  activeHousehold,
  onClose,
  onComplete,
  onRename,
  onRefresh,
  onRefreshMemberships,
}) {
  const [mode, setMode] = useState('create');
  const [name, setName] = useState('');
  const [renameName, setRenameName] = useState('');
  const [renameMessage, setRenameMessage] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searched, setSearched] = useState(false);
  const [membershipMessage, setMembershipMessage] = useState('');
  const [refreshingMemberships, setRefreshingMemberships] = useState(false);
  useEffect(() => {
    if (open) {
      setMode('create');
      setName('');
      setRenameName(activeHousehold?.name || '');
      setRenameMessage('');
      setInviteCode('');
      setError('');
      setCopied(false);
      setCopiedLink(false);
      setSearchQuery('');
      setSearchResults([]);
      setSentRequests([]);
      setSearched(false);
      setMembershipMessage('');
    }
  }, [open, activeHousehold?.id]);
  useEffect(() => {
    if (!open || required) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, required, onClose]);
  if (!open) return null;
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'search') {
        const result = await householdApi.discoverHouseholds(searchQuery.trim());
        setSearchResults(result.households);
        setSearched(true);
        setMembershipMessage('');
        return;
      }
      const result =
        mode === 'create'
          ? await householdApi.createHousehold(name)
          : await householdApi.joinHousehold(inviteCode.trim());
      onComplete(result);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };
  const handleRename = async (event) => {
    event.preventDefault();
    setError('');
    setRenameMessage('');
    setSubmitting(true);
    try {
      const result = await onRename(renameName.trim());
      setRenameName(result.household.name);
      setRenameMessage('Nombre actualizado.');
    } catch (renameError) {
      setError(renameError.message);
    } finally {
      setSubmitting(false);
    }
  };
  const refreshMemberships = async () => {
    setRefreshingMemberships(true);
    setMembershipMessage('');
    try {
      const result = await onRefreshMemberships?.();
      if (result?.household) onComplete(result);
      else
        setMembershipMessage(
          'Todavía no hay una aprobación nueva. Podés volver a revisar más tarde.'
        );
    } catch (refreshError) {
      setError(refreshError.message);
    } finally {
      setRefreshingMemberships(false);
    }
  };
  const sendJoinRequest = async (householdId) => {
    setSubmitting(true);
    setError('');
    try {
      await householdApi.requestJoin(householdId);
      setSentRequests((current) => [...new Set([...current, householdId])]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };
  const resolveRequest = async (requestId, decision) => {
    setSubmitting(true);
    setError('');
    try {
      await householdApi.resolveJoinRequest(activeHousehold.id, requestId, decision);
      await onRefresh?.();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };
  const copyInviteCode = async () => {
    if (!activeHousehold?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(formatInviteCode(activeHousehold.inviteCode));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('No pudimos copiarlo. Podés seleccionar el código y copiarlo manualmente.');
    }
  };
  const copyInviteLink = async () => {
    if (!activeHousehold?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(createHouseholdJoinLink(activeHousehold.inviteCode));
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      setError('No pudimos copiar el enlace. Podés compartir el código manualmente.');
    }
  };
  const content = (
    <section
      className={`household-dialog${required ? ' household-dialog--setup' : ''}`}
      role={required ? 'region' : 'dialog'}
      aria-modal={required ? undefined : 'true'}
      aria-labelledby="household-dialog-title"
    >
      {!required && (
        <div className="task-dialog__top">
          <span className="eyebrow">TUS HOGARES</span>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={19} />
          </button>
        </div>
      )}
      {required && <span className="eyebrow">UN HOGAR PARA COMPARTIR</span>}
      <h2 id="household-dialog-title">
        {required ? 'Elegí dónde organizarte.' : 'Crear o sumar un hogar'}
      </h2>
      <p className="task-dialog__intro">
        Cada persona entra con su propia cuenta y puede participar en varios hogares.
      </p>
      <div className="household-dialog__tabs" role="tablist" aria-label="Elegir una opción">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'create'}
          className={
            mode === 'create'
              ? 'household-dialog__tab household-dialog__tab--active'
              : 'household-dialog__tab'
          }
          onClick={() => {
            setMode('create');
            setError('');
          }}
        >
          Crear hogar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'join'}
          className={
            mode === 'join'
              ? 'household-dialog__tab household-dialog__tab--active'
              : 'household-dialog__tab'
          }
          onClick={() => {
            setMode('join');
            setError('');
          }}
        >
          Con código
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'search'}
          className={
            mode === 'search'
              ? 'household-dialog__tab household-dialog__tab--active'
              : 'household-dialog__tab'
          }
          onClick={() => {
            setMode('search');
            setError('');
          }}
        >
          Buscar hogar
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        {mode === 'create' ? (
          <>
            <label className="form-field">
              <span>Nombre del hogar</span>
              <input
                autoFocus={required}
                autoComplete="organization"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Casa de los García"
                maxLength={60}
                required
              />
            </label>
            <p className="household-dialog__hint">
              <HousePlus size={15} /> Vas a administrar este hogar y podrás invitar cuentas o
              compartir un código y QR.
            </p>
          </>
        ) : mode === 'join' ? (
          <>
            <label className="form-field">
              <span>Código de invitación</span>
              <input
                autoComplete="off"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                placeholder="ABCDE-FGHIJ"
                maxLength={12}
                required
              />
            </label>
            <p className="household-dialog__hint">
              <KeyRound size={15} /> Pedile el código privado o escaneá el QR de alguien que ya
              forme parte de ese hogar.
            </p>
          </>
        ) : (
          <>
            <label className="form-field">
              <span>Nombre del hogar</span>
              <input
                autoComplete="off"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Escribí al menos 2 letras"
                minLength={2}
                maxLength={60}
                required
              />
            </label>
            <p className="household-dialog__hint">
              <Search size={15} /> El hogar debe aprobar tu solicitud antes de que puedas ver sus
              tareas.
            </p>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="task-dialog__actions">
          <button className="button button--primary" type="submit" disabled={submitting}>
            {submitting
              ? 'Buscando…'
              : mode === 'create'
                ? 'Crear hogar'
                : mode === 'join'
                  ? 'Unirme al hogar'
                  : 'Buscar hogares'}
          </button>
        </div>
      </form>
      {activeHousehold?.id && activeHousehold.role === 'owner' && (
        <form className="household-rename" onSubmit={handleRename}>
          <div>
            <strong>Nombre del hogar</strong>
            <p>Podés cambiar cómo aparece en la lista de hogares.</p>
          </div>
          <div className="household-rename__field">
            <label className="form-field">
              <span>Nombre</span>
              <input
                aria-label="Nombre del hogar"
                autoComplete="organization"
                value={renameName}
                onChange={(event) => {
                  setRenameName(event.target.value);
                  setRenameMessage('');
                }}
                maxLength={60}
                minLength={2}
                required
              />
            </label>
            <button
              className="button button--outline"
              type="submit"
              disabled={submitting || renameName.trim() === activeHousehold.name}
            >
              {submitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
          {renameMessage && (
            <small className="household-rename__message" role="status">
              {renameMessage}
            </small>
          )}
        </form>
      )}
      {mode === 'search' && searchResults.length > 0 && (
        <div className="household-search-results" aria-live="polite">
          {searchResults.map((result) => (
            <div className="household-search-result" key={result.id}>
              <span>
                <strong>{result.name}</strong>
                <small>
                  {result.memberCount}
                  {result.memberCount === 1 ? 'integrante' : 'integrantes'}
                </small>
              </span>
              <button
                className="button button--outline"
                type="button"
                disabled={submitting || sentRequests.includes(result.id)}
                onClick={() => sendJoinRequest(result.id)}
              >
                {sentRequests.includes(result.id) ? (
                  <>
                    <Check size={14} />
                    Solicitud enviada
                  </>
                ) : (
                  'Solicitar acceso'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
      {mode === 'search' && searched && searchResults.length === 0 && (
        <p className="household-search-empty">No encontramos hogares con ese nombre.</p>
      )}
      {mode === 'search' && sentRequests.length > 0 && (
        <div className="household-search-refresh">
          <p>
            Las solicitudes quedan pendientes hasta que quien administra cada hogar las apruebe.
          </p>
          <button
            className="button button--outline"
            type="button"
            onClick={refreshMemberships}
            disabled={refreshingMemberships}
          >
            {refreshingMemberships ? 'Actualizando…' : 'Actualizar acceso'}
          </button>
          {membershipMessage && <small role="status">{membershipMessage}</small>}
        </div>
      )}
      {activeHousehold?.joinRequests?.length > 0 && (
        <div className="household-requests">
          <span className="eyebrow">SOLICITUDES DE ACCESO</span>
          {activeHousehold.joinRequests.map((request) => (
            <div className="household-search-result" key={request.id}>
              <span>
                <strong>{request.name}</strong>
                <small>Quiere unirse a {activeHousehold.name}</small>
              </span>
              <div>
                <button
                  className="button button--outline"
                  type="button"
                  disabled={submitting}
                  onClick={() => resolveRequest(request.id, 'reject')}
                >
                  Rechazar
                </button>
                <button
                  className="button button--primary"
                  type="button"
                  disabled={submitting}
                  onClick={() => resolveRequest(request.id, 'approve')}
                >
                  Aprobar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeHousehold?.inviteCode && (
        <div className="household-invite">
          <div>
            <span className="eyebrow">INVITAR AL HOGAR ACTUAL</span>
            <strong>{activeHousehold.name}</strong>
          </div>
          <p>
            Compartilo solo con personas que quieras sumar. Cada cuenta debe aceptar o ingresar con
            este enlace.
          </p>
          <div className="household-invite__share">
            <HouseholdQrCode
              value={createHouseholdJoinLink(activeHousehold.inviteCode)}
              label={`QR para unirse a ${activeHousehold.name}`}
            />
            <div className="household-invite__details">
              <span className="eyebrow">CÓDIGO DEL HOGAR</span>
              <div className="household-invite__code">
                <code>{formatInviteCode(activeHousehold.inviteCode)}</code>
                <button type="button" className="button button--outline" onClick={copyInviteCode}>
                  <Copy size={14} />
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <button
                type="button"
                className="button button--outline household-invite__link"
                onClick={copyInviteLink}
              >
                <Link size={14} />
                {copiedLink ? 'Enlace copiado' : 'Copiar enlace para compartir'}
              </button>
              <small>
                El enlace abre la app y prepara el ingreso a este hogar después de iniciar sesión.
              </small>
            </div>
          </div>
        </div>
      )}
    </section>
  );
  if (required) return <main className="household-setup">{content}</main>;
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {content}
    </div>
  );
}

import { useState } from 'react';
import { Check, Mail, X } from 'lucide-react';

export default function HouseholdInvitationsDialog({ open, invitations, onClose, onDecision }) {
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  if (!open) return null;

  const decide = async (invitation, decision) => {
    setBusyId(invitation.id);
    setError('');
    try {
      await onDecision(invitation, decision);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="task-dialog invitation-dialog" role="dialog" aria-modal="true" aria-labelledby="invitations-title">
        <div className="task-dialog__top"><span className="auth-card__icon"><Mail size={18} /></span><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></div>
        <h2 id="invitations-title">Invitaciones a hogares</h2>
        <p className="task-dialog__intro">Cada hogar se suma a tu cuenta solo cuando aceptás su invitación.</p>
        {invitations.length ? <div className="invitation-list">{invitations.map((invitation) => (
          <article className="invitation-card" key={invitation.id}>
            <div><strong>{invitation.householdName}</strong><span>Te invita {invitation.invitedBy}</span></div>
            <div className="invitation-card__actions">
              <button className="button button--quiet" type="button" disabled={busyId === invitation.id} onClick={() => decide(invitation, 'reject')}>Ahora no</button>
              <button className="button button--primary" type="button" disabled={busyId === invitation.id} onClick={() => decide(invitation, 'accept')}>{busyId === invitation.id ? 'Un momento…' : <><Check size={14} />Aceptar</>}</button>
            </div>
          </article>
        ))}</div> : <p className="invitation-empty">No tenés invitaciones pendientes.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}

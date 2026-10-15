import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', confirmVariant = 'danger', onCancel, onConfirm, saving = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => { if (event.key === 'Escape' && !saving) onCancel(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, saving, onCancel]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onCancel(); }}>
      <section className="task-dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message">
        <div className="task-dialog__top"><span className="confirm-dialog__icon"><AlertTriangle size={18} /></span><button type="button" className="icon-button" onClick={onCancel} aria-label="Cerrar" disabled={saving}><X size={19} /></button></div>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message" className="task-dialog__intro">{message}</p>
        <div className="task-dialog__actions"><button className="button button--quiet" type="button" onClick={onCancel} disabled={saving}>Cancelar</button><button className={`button ${confirmVariant === 'primary' ? 'button--primary' : 'button--danger'}`} type="button" onClick={onConfirm} disabled={saving}>{saving ? 'Un momento…' : confirmLabel}</button></div>
      </section>
    </div>
  );
}

import { useState } from 'react';
import { Copy, KeyRound, X } from 'lucide-react';

export default function RecoveryCodeDialog({ code, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="task-dialog recovery-code-dialog" role="dialog" aria-modal="true" aria-labelledby="recovery-code-title">
        <div className="task-dialog__top"><span className="auth-card__icon"><KeyRound size={18} /></span><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></div>
        <h2 id="recovery-code-title">Guardá este código de recuperación</h2>
        <p className="task-dialog__intro">Si olvidás tu contraseña, usá este código en “¿Olvidaste tu contraseña?” para elegir una nueva. No necesitás recordar la contraseña anterior. Se muestra una sola vez; guardá el código más reciente fuera de la app.</p>
        <code className="recovery-code-dialog__code">{code}</code>
        <div className="task-dialog__actions"><button className="button button--outline" type="button" onClick={copy}><Copy size={15} />{copied ? 'Copiado' : 'Copiar código'}</button><button className="button button--primary" type="button" onClick={onClose}>Ya lo guardé</button></div>
      </section>
    </div>
  );
}

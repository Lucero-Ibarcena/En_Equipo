import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function MemberFormDialog({ open, initialMember, guest = false, onClose, onSubmit, saving }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialMember?.name || '');
      setEmail('');
      setError('');
      setSent(false);
    }
  }, [open, initialMember]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!guest && !initialMember && !email.trim()) {
      setError('Escribí el correo de la cuenta que querés invitar.');
      return;
    }
    try {
      await onSubmit(guest || initialMember ? name.trim() : email.trim());
      if (guest || initialMember) onClose();
      else setSent(true);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="task-dialog member-dialog" role="dialog" aria-modal="true" aria-labelledby="member-dialog-title">
        <div className="task-dialog__top"><span className="eyebrow">CRECER EN EQUIPO</span><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></div>
        <h2 id="member-dialog-title">{initialMember ? 'Editar integrante de prueba' : guest ? 'Sumar a alguien a la prueba' : sent ? 'Invitación enviada' : 'Invitar a una cuenta'}</h2>
        <p className="task-dialog__intro">{guest ? 'Este espacio es temporal: los nombres que agregues se usan solo para probar y no se guardan.' : sent ? 'Si el correo tiene una cuenta, la invitación aparecerá en la app para que esa persona la acepte. Si todavía no tiene cuenta, puede crearla y unirse con el código o QR.' : 'Cada persona debe tener su propia cuenta. Al invitar, no se agrega hasta que acepte desde su sesión.'}</p>
        {sent ? <div className="task-dialog__actions"><button type="button" className="button button--primary" onClick={onClose}>Listo</button></div> : <form onSubmit={handleSubmit}>
          {guest || initialMember
            ? <label className="form-field"><span>Nombre visible para la prueba</span><input autoFocus value={name} onChange={(event) => { setName(event.target.value); setError(''); }} placeholder="Ej. Alex" maxLength={50} required /></label>
            : <label className="form-field"><span>Correo de su cuenta</span><input autoFocus type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} placeholder="persona@correo.com" maxLength={254} required /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="task-dialog__actions"><button type="button" className="button button--quiet" onClick={onClose}>Cancelar</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Enviando…' : guest || initialMember ? initialMember ? 'Guardar nombre' : 'Agregar para probar' : 'Enviar invitación'}</button></div>
        </form>}
      </section>
    </div>
  );
}

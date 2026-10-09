import { useEffect, useState } from 'react';
import { Clock3, X } from 'lucide-react';
import { CATEGORIES } from '../features/household/householdUtils.js';
import TaskDatePicker from './TaskDatePicker.jsx';

const EMPTY_FORM = { title: '', category: 'chores', assigneeId: '', dueDate: '', notes: '' };

export default function TaskFormDialog({ open, members, initialCategory, initialTask, initialDraft, onClose, onSubmit, onDraftChange, saving, guest = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [draftId, setDraftId] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initialDraft ? {
        title: initialDraft.title || '',
        category: CATEGORIES[initialDraft.category] ? initialDraft.category : 'chores',
        assigneeId: initialDraft.assigneeId || '',
        dueDate: initialDraft.dueDate || '',
        notes: initialDraft.notes || '',
      } : initialTask ? {
        title: initialTask.title,
        category: initialTask.category,
        assigneeId: initialTask.assigneeId || '',
        dueDate: initialTask.dueDate || '',
        notes: initialTask.notes || '',
      } : { ...EMPTY_FORM, category: CATEGORIES[initialCategory] ? initialCategory : 'chores', assigneeId: members[0]?.id || '' });
      setDraftId(initialDraft?.id || globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}`);
      setFormError('');
    }
  }, [open, initialCategory, initialTask?.id, initialDraft?.id, members]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) { setFormError('Escribí qué hay que hacer.'); return; }
    try {
      await onSubmit({ ...form, title: form.title.trim(), dueDate: form.dueDate || null }, initialTask ? null : draftId);
    } catch (error) {
      setFormError(error.message);
    }
  };

  const updateField = (event) => {
    const nextForm = { ...form, [event.target.name]: event.target.value };
    setForm(nextForm);
    saveDraft(nextForm);
    setFormError('');
  };

  const saveDraft = (nextForm) => {
    if (initialTask || !draftId) return;
    const hasContent = Boolean(nextForm.title.trim() || nextForm.notes.trim() || nextForm.dueDate || nextForm.category !== (CATEGORIES[initialCategory] ? initialCategory : 'chores') || nextForm.assigneeId !== (members[0]?.id || ''));
    if (!hasContent) {
      onDraftChange?.(null, draftId);
      return;
    }
    onDraftChange?.({ ...nextForm, id: draftId, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
        <div className="task-dialog__top"><span className="eyebrow">ORGANIZAR EN EQUIPO</span><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></div>
        <h2 id="task-dialog-title">{initialTask ? 'Editar tarea' : 'Sumar una tarea'}</h2>
        <p className="task-dialog__intro">{initialTask ? 'Actualizá los datos para que el equipo esté al tanto.' : 'Sacala de tu cabeza y compartila con la casa.'}</p>
        <form onSubmit={handleSubmit}>
          <label className="form-field"><span>¿Qué hay que hacer?</span><input autoFocus name="title" value={form.title} onChange={updateField} placeholder="Ej. Comprar alimento para Mimo" maxLength={100} /></label>
          <div className="form-grid">
            <label className="form-field"><span>Tipo</span><select name="category" value={form.category} onChange={updateField}>{Object.entries(CATEGORIES).map(([id, category]) => <option key={id} value={id}>{category.label}</option>)}</select></label>
            <label className="form-field"><span>Responsable</span><select name="assigneeId" value={form.assigneeId || ''} onChange={updateField}><option value="">Sin asignar</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
          </div>
          <TaskDatePicker value={form.dueDate} onChange={(dueDate) => { const nextForm = { ...form, dueDate }; setForm(nextForm); saveDraft(nextForm); setFormError(''); }} />
          <label className="form-field"><span>Detalle <small>OPCIONAL</small></span><textarea name="notes" value={form.notes} onChange={updateField} rows="2" placeholder="Un dato que ayude a resolverlo" maxLength={300} /></label>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          {!initialTask && <p className="task-draft-hint"><Clock3 size={13} />{guest ? 'El borrador se conserva durante esta sesión de prueba.' : 'Se guarda automáticamente en Borradores, en este dispositivo.'}</p>}
          <div className="task-dialog__actions"><button type="button" className="button button--quiet" onClick={onClose}>{initialTask ? 'Cancelar' : 'Dejar para después'}</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : initialTask ? 'Guardar cambios' : 'Crear tarea'}</button></div>
        </form>
      </section>
    </div>
  );
}

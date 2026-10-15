import { Clock3, FileText, Pencil, Trash2 } from 'lucide-react';
import { CATEGORIES, formatTaskDate } from '../../household/householdUtils.js';

export default function TaskDraftItem({ draft, categories = CATEGORIES, onContinue, onDelete }) {
  const category = categories[draft.category] || CATEGORIES.chores;
  const savedAt = draft.updatedAt
    ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(draft.updatedAt))
    : 'recién';

  return (
    <article className="task-draft">
      <span className="task-draft__icon"><FileText size={17} /></span>
      <div className="task-draft__body">
        <h3>{draft.title?.trim() || 'Borrador sin título'}</h3>
        <p>{category.label}{draft.dueDate ? ` · ${formatTaskDate(draft.dueDate)}` : ''}{draft.notes ? ` · ${draft.notes}` : ''}</p>
        <span className="task-draft__saved"><Clock3 size={12} />Guardado automáticamente · {savedAt}</span>
      </div>
      <div className="task-draft__actions">
        <button type="button" className="button button--outline task-draft__continue" onClick={() => onContinue(draft)}><Pencil size={13} />Continuar</button>
        <button type="button" className="task-draft__delete" onClick={() => onDelete(draft)} aria-label={`Eliminar borrador ${draft.title || 'sin título'}`} title="Eliminar borrador"><Trash2 size={14} /></button>
      </div>
    </article>
  );
}

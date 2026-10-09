import { Archive, ArchiveRestore, Check, ChevronDown, Circle, Clock3, CreditCard, Pencil, RotateCcw, ShoppingBasket, Sparkles, Trash2, Wrench } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { CATEGORIES, STATUS_LABELS, formatTaskDate, toLocalDateKey } from '../features/household/householdUtils.js';

const CATEGORY_ICONS = { chores: Sparkles, shopping: ShoppingBasket, payments: CreditCard, repairs: Wrench };

export default function TaskItem({ task, member, onToggle, onEdit, onArchive, onDelete, onRestore, readOnly = false }) {
  const Icon = CATEGORY_ICONS[task.category] || Sparkles;
  const category = CATEGORIES[task.category] || CATEGORIES.chores;
  const complete = task.status === 'done';
  const folder = task.folder || 'active';
  const isActive = folder === 'active';
  const folderStatus = folder === 'archived' ? 'Archivada' : folder === 'trash' ? 'En papelera' : STATUS_LABELS[task.status];
  return (
    <article className={`task-item${complete ? ' task-item--done' : ''}`}>
      <button className={`task-item__check${complete ? ' task-item__check--done' : ''}`} onClick={() => onToggle(task)} disabled={readOnly || !isActive} title={readOnly ? 'Iniciá sesión para cambiar tareas' : !isActive ? 'Restaurá la tarea para cambiar su estado' : undefined} aria-label={complete ? `Marcar ${task.title} como pendiente` : `Marcar ${task.title} como lista`}>
        {complete ? <Check size={15} strokeWidth={2.8} /> : <Circle size={20} strokeWidth={1.65} />}
      </button>
      <span className={`task-item__category-icon task-item__category-icon--${task.category}`}><Icon size={16} strokeWidth={1.8} /></span>
      <div className="task-item__body">
        <h3>{task.title}</h3>
        <div className="task-item__meta"><span className="task-item__category-name">{category.label}</span><span className="task-item__meta-dot">·</span><span className={`task-item__due${!complete && task.dueDate && task.dueDate < toLocalDateKey() ? ' task-item__due--late' : ''}`}><Clock3 size={12} />{formatTaskDate(task.dueDate)}</span></div>
        {task.notes && <details className="task-item__notes"><summary><span>Ver detalle</span><ChevronDown size={13} /></summary><p>{task.notes}</p></details>}
      </div>
      <span className={`task-status task-status--${isActive ? task.status : folder}`}>{folderStatus}</span>
      <div className="task-item__assignee"><Avatar member={member} size="small" /><span>{member?.name || 'Sin asignar'}</span></div>
      {!readOnly && <div className="task-item__actions">
        {isActive && <button className="task-item__edit" onClick={() => onEdit(task)} aria-label={`Editar ${task.title}`} title="Editar tarea"><Pencil size={14} /></button>}
        {isActive && <button className="task-item__archive" onClick={() => onArchive(task)} aria-label={`Archivar ${task.title}`} title="Archivar tarea"><Archive size={14} /></button>}
        {folder === 'archived' && <button className="task-item__restore" onClick={() => onRestore(task)} aria-label={`Restaurar ${task.title}`} title="Restaurar tarea"><ArchiveRestore size={14} /></button>}
        {folder === 'trash' && <button className="task-item__restore" onClick={() => onRestore(task)} aria-label={`Restaurar ${task.title}`} title="Restaurar tarea"><RotateCcw size={14} /></button>}
        <button className={folder === 'trash' ? 'task-item__delete task-item__delete--permanent' : 'task-item__delete'} onClick={() => onDelete(task)} aria-label={`${folder === 'trash' ? 'Eliminar definitivamente' : 'Mover a la papelera'}: ${task.title}`} title={folder === 'trash' ? 'Eliminar definitivamente' : 'Mover a la papelera'}><Trash2 size={14} /></button>
      </div>}
    </article>
  );
}

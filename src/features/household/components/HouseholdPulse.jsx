import { ArrowRight, HeartHandshake, Leaf } from 'lucide-react';
import Avatar from '../../../components/common/Avatar.jsx';

export default function HouseholdPulse({ members, tasks, onNavigate, categories, preview = false, externalContent }) {
  const activeTasks = tasks.filter((task) => task.status !== 'done');
  const counts = members.map((member) => ({ member, count: activeTasks.filter((task) => task.assigneeId === member.id).length }));
  const maxCount = Math.max(1, ...counts.map((entry) => entry.count));
  const minCount = Math.min(...counts.map((entry) => entry.count));
  const balanced = activeTasks.length > 0 && maxCount - minCount <= 1;
  const shoppingTasks = tasks.filter((task) => task.category === 'shopping' && task.status !== 'done');

  if (preview) {
    return (
      <aside className="dashboard-aside dashboard-aside--preview" aria-label="API externa">
        {externalContent}
      </aside>
    );
  }

  return (
    <aside className="dashboard-aside" aria-label="Resumen de la casa">
      <section className="balance-card">
        <div className="balance-card__header"><span className="balance-card__icon"><HeartHandshake size={18} /></span><span className="eyebrow">EL EQUIPO</span><span className="balance-card__sparkle">✳</span></div>
        <h2>{activeTasks.length === 0 ? 'Todo está al día.' : balanced ? 'Vamos en equilibrio.' : 'Cada aporte cuenta.'}</h2>
        <p>{activeTasks.length === 0 ? 'No hay pendientes abiertos. Pueden descansar o sumar algo cuando haga falta.' : 'Las responsabilidades son más livianas cuando se comparten.'}</p>
        <div className="balance-card__people">{members.map((member) => <Avatar key={member.id} member={member} size="normal" />)}<span className="balance-card__people-label">{members.length} en casa</span></div>
        <div className="balance-card__divider" />
        <div className="balance-card__distribution"><div className="balance-card__distribution-title"><span>Reparto de pendientes</span><span>{activeTasks.length} tareas</span></div>
          {counts.map(({ member, count }) => <div className="distribution-row" key={member.id}><Avatar member={member} size="tiny" /><span>{member.name}</span><div className="distribution-row__track"><span style={{ width: count ? `${Math.max(9, (count / maxCount) * 100)}%` : '0%' }} /></div><strong>{count}</strong></div>)}
        </div>
      </section>

      {categories?.shopping && <section className="aside-card shopping-card">
        <div className="aside-card__heading"><div><span className="eyebrow">PARA LA PRÓXIMA SALIDA</span><h3>{categories?.shopping?.label || 'Lista de compras'}</h3></div><button className="round-arrow" aria-label={`Ver ${categories?.shopping?.label || 'lista de compras'}`} onClick={() => onNavigate('shopping')}><ArrowRight size={16} /></button></div>
        {shoppingTasks.length ? <div className="shopping-preview">{shoppingTasks.slice(0, 3).map((task) => <div className="shopping-preview__item" key={task.id}><span className="shopping-preview__check" /><span>{task.title}</span></div>)}{shoppingTasks.length > 3 && <span className="shopping-preview__more">+{shoppingTasks.length - 3} más en la lista</span>}</div> : <div className="shopping-empty"><Leaf size={16} /> La lista está al día.</div>}
        <button className="text-link" onClick={() => onNavigate('shopping')}>Abrir lista <ArrowRight size={14} /></button>
      </section>}

      {externalContent}
      <div className="gentle-reminder"><span>✿</span><p>No hace falta hacerlo todo hoy. Un paso compartido también cuenta.</p></div>
    </aside>
  );
}

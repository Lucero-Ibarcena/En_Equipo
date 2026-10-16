'use client';

// [INTERFAZ: LISTA DE TAREAS] Búsqueda, filtros, categorías, borradores y estados vacíos.
import { Check, LogIn, Plus, Search, X } from 'lucide-react';
import TaskDraftItem from '../../../tasks/components/TaskDraftItem.jsx';
import TaskItem from '../../../tasks/components/TaskItem.jsx';
export default function TaskBoard({
  guestMode,
  activeView,
  statusFilter,
  searchOpen,
  query,
  sectionTitle,
  visibleDrafts,
  visibleTasks,
  draftCount,
  archivedTaskCount,
  trashTaskCount,
  loading,
  categoryMap,
  members,
  completedCount,
  onQueryChange,
  onCloseSearch,
  onOpenSearch,
  onAddTask,
  onStatusFilterChange,
  onContinueDraft,
  onDeleteDraft,
  onNavigateToCategory,
  onToggleTask,
  onEditTask,
  onArchiveTask,
  onDeleteTask,
  onRestoreTask,
  onLogin,
  onNavigate,
}) {
  return (
    <section className="task-board" aria-labelledby="task-section-title">
      <div className="task-board__heading">
        <div>
          <span className="eyebrow">UN PASO A LA VEZ</span>
          <h2 id="task-section-title">
            {sectionTitle}
            <span className="task-board__count">
              {statusFilter === 'drafts' ? visibleDrafts.length : visibleTasks.length}
            </span>
          </h2>
        </div>
        <div className="task-board__heading-actions">
          {!guestMode &&
            (searchOpen ? (
              <label className="task-search task-search--inline">
                <Search size={15} aria-hidden="true" />
                <input
                  id="task-search-input"
                  autoFocus
                  aria-label="Buscar tareas"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Buscar"
                />
                <button
                  type="button"
                  className="task-search__close"
                  aria-label="Cerrar búsqueda"
                  onClick={onCloseSearch}
                >
                  <X size={15} />
                </button>
              </label>
            ) : (
              <button
                type="button"
                className="icon-button task-board__search-toggle"
                aria-label="Abrir búsqueda"
                aria-expanded={false}
                onClick={onOpenSearch}
              >
                <Search size={17} />
              </button>
            ))}
          <button className="button button--outline task-board__add" onClick={onAddTask}>
            <Plus size={16} />
            <span>Agregar</span>
          </button>
        </div>
      </div>
      {!guestMode && (
        <div className="task-toolbar">
          <div className="status-tabs" role="tablist" aria-label="Filtrar tareas por estado">
            {[
              {
                id: 'all',
                label: 'Todas',
              },
              {
                id: 'pending',
                label: 'Pendientes',
              },
              {
                id: 'upcoming',
                label: 'Próximos 7 días',
              },
              {
                id: 'done',
                label: 'Hechas',
              },
              {
                id: 'drafts',
                label: 'Borradores',
                count: draftCount,
              },
              {
                id: 'archived',
                label: 'Archivadas',
                count: archivedTaskCount,
              },
              {
                id: 'trash',
                label: 'Papelera',
                count: trashTaskCount,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={statusFilter === tab.id}
                className={`status-tab${statusFilter === tab.id ? ' status-tab--active' : ''}`}
                onClick={() => onStatusFilterChange(tab.id)}
              >
                {tab.label}
                {tab.count > 0 && <small className="status-tab__count">{tab.count}</small>}
              </button>
            ))}
          </div>
        </div>
      )}
      {loading ? (
        <div className="state-message">
          <span className="loading-spinner" />
          Cargando la casa…
        </div>
      ) : statusFilter === 'drafts' && visibleDrafts.length ? (
        <div className="task-drafts">
          {visibleDrafts.map((draft) => (
            <TaskDraftItem
              key={draft.id}
              draft={draft}
              categories={categoryMap}
              onContinue={onContinueDraft}
              onDelete={onDeleteDraft}
            />
          ))}
        </div>
      ) : visibleTasks.length ? (
        activeView === 'all' && !['archived', 'trash'].includes(statusFilter) ? (
          <div className="category-sections">
            {Object.entries(categoryMap).map(([categoryId, category]) => {
              const categoryTasks = visibleTasks.filter((task) => task.category === categoryId);
              return (
                <section className="category-section" key={categoryId} aria-label={category.label}>
                  <div className="category-section__heading">
                    <div>
                      <h3>{category.label}</h3>
                      <span>
                        {categoryTasks.length}
                        {categoryTasks.length === 1 ? 'tarea' : 'tareas'}
                      </span>
                    </div>
                    <button className="text-link" onClick={() => onNavigateToCategory(categoryId)}>
                      Ver sección <span>→</span>
                    </button>
                  </div>
                  {categoryTasks.length ? (
                    <div className="task-list">
                      {categoryTasks.slice(0, 3).map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          categories={categoryMap}
                          member={members.find((member) => member.id === task.assigneeId)}
                          onToggle={onToggleTask}
                          onEdit={onEditTask}
                          onArchive={onArchiveTask}
                          onDelete={onDeleteTask}
                          onRestore={onRestoreTask}
                          readOnly={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="category-section__empty">No hay tareas para este filtro.</p>
                  )}
                  {categoryTasks.length > 3 && (
                    <button
                      className="text-link category-section__more"
                      onClick={() => onNavigateToCategory(categoryId)}
                    >
                      Ver las {categoryTasks.length} tareas <span>→</span>
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="task-list">
            {visibleTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                categories={categoryMap}
                member={members.find((member) => member.id === task.assigneeId)}
                onToggle={onToggleTask}
                onEdit={onEditTask}
                onArchive={onArchiveTask}
                onDelete={onDeleteTask}
                onRestore={onRestoreTask}
                readOnly={false}
              />
            ))}
          </div>
        )
      ) : (
        <div className="empty-state">
          <span className="empty-state__icon">
            <Check size={22} />
          </span>
          <h3>
            {guestMode
              ? 'Todavía no hay tareas.'
              : query
                ? 'No encontramos eso'
                : statusFilter === 'drafts'
                  ? 'No hay borradores guardados.'
                  : statusFilter === 'archived'
                    ? 'No hay tareas archivadas.'
                    : statusFilter === 'trash'
                      ? 'La papelera está vacía.'
                      : statusFilter === 'done'
                        ? 'Todavía no hay tareas hechas.'
                        : statusFilter === 'upcoming'
                          ? 'No hay tareas para los próximos 7 días.'
                          : statusFilter === 'pending'
                            ? 'Todo está al día.'
                            : activeView === 'all'
                              ? 'Todavía no hay tareas.'
                              : 'No hay tareas en esta sección.'}
          </h3>
          <p>
            {guestMode
              ? 'Iniciá sesión o creá una cuenta para guardar tareas y compartirlas con tu hogar.'
              : query
                ? 'Probá con otra palabra.'
                : statusFilter === 'drafts'
                  ? 'Al escribir una tarea, queda guardada acá automáticamente hasta que la publiques.'
                  : statusFilter === 'archived'
                    ? 'Las tareas archivadas se pueden restaurar cuando vuelvan a hacer falta.'
                    : statusFilter === 'trash'
                      ? 'Las tareas que mandes a la papelera se pueden restaurar antes de eliminarlas definitivamente.'
                      : statusFilter === 'pending' || statusFilter === 'upcoming'
                        ? 'Podés revisar las tareas hechas o sumar algo nuevo.'
                        : 'Si aparece algo nuevo, pueden sumarlo en equipo.'}
          </p>
          {guestMode ? (
            <button className="button button--outline" onClick={onLogin}>
              <LogIn size={15} />
              Iniciar sesión
            </button>
          ) : (
            !query &&
            !['archived', 'trash', 'drafts'].includes(statusFilter) && (
              <button className="button button--outline" onClick={onAddTask}>
                <Plus size={15} />
                Sumar una tarea
              </button>
            )
          )}
        </div>
      )}
      {!loading && visibleTasks.length > 0 && statusFilter !== 'drafts' && (
        <div className="task-board__footer">
          <span>
            <span className="footer-check">
              <Check size={11} />
            </span>
            {completedCount} tareas resueltas entre todos
          </span>
          <button
            className="text-link"
            onClick={() => onNavigate(activeView === 'all' ? 'chores' : 'all')}
          >
            {activeView === 'all' ? 'Ver tareas del hogar' : 'Ver todo'}
            <span>→</span>
          </button>
        </div>
      )}
    </section>
  );
}

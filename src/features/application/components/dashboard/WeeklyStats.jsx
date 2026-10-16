// [INTERFAZ: RESUMEN SEMANAL] Tarjetas que llevan a pendientes, próximas y hechas.
export default function WeeklyStats({
  pendingCount,
  upcomingCount,
  completedCount,
  onSelectFilter,
}) {
  return (
    <section className="stats-grid" aria-label="Resumen semanal">
      <button
        type="button"
        className="stat-card stat-card--main"
        onClick={() => onSelectFilter('pending')}
        aria-label={`Ver ${pendingCount} tareas pendientes en casa`}
      >
        <span className="stat-card__deco stat-card__deco--circle" aria-hidden="true" />
        <span className="stat-card__label">Pendientes en casa</span>
        <span className="stat-card__value">
          {pendingCount}
          <small> por compartir</small>
        </span>
        <span className="stat-card__foot">
          <span className="stat-card__dot stat-card__dot--green" aria-hidden="true" /> Ver tareas
          pendientes <span aria-hidden="true">→</span>
        </span>
      </button>
      <button
        type="button"
        className="stat-card"
        onClick={() => onSelectFilter('upcoming')}
        aria-label={`Ver ${upcomingCount} tareas para los próximos siete días`}
      >
        <span className="stat-card__deco stat-card__deco--sun" aria-hidden="true" />
        <span className="stat-card__label">Para los próximos 7 días</span>
        <span className="stat-card__value">
          {upcomingCount}
          <small> pendientes</small>
        </span>
        <span className="stat-card__foot">
          <span className="stat-card__dot stat-card__dot--amber" aria-hidden="true" /> Ver próximas
          tareas <span aria-hidden="true">→</span>
        </span>
      </button>
      <button
        type="button"
        className="stat-card"
        onClick={() => onSelectFilter('done')}
        aria-label={`Ver ${completedCount} tareas hechas`}
      >
        <span className="stat-card__deco stat-card__deco--leaf" aria-hidden="true">
          ⌁
        </span>
        <span className="stat-card__label">Tareas hechas</span>
        <span className="stat-card__value">
          {completedCount}
          <small> en casa</small>
        </span>
        <span className="stat-card__foot">
          <span className="stat-card__dot stat-card__dot--blue" aria-hidden="true" /> Ver lo que ya
          se hizo <span aria-hidden="true">→</span>
        </span>
      </button>
    </section>
  );
}

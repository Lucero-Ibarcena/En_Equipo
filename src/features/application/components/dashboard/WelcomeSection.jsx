// [INTERFAZ: BIENVENIDA] Título, saludo y acceso para crear una tarea.
import { Plus } from 'lucide-react';
export default function WelcomeSection({ guestMode, greeting, displayUser, copy, onCreateTask }) {
  return (
    <section className="welcome-row">
      <div className="welcome-row__copy">
        <div className="eyebrow welcome-row__eyebrow">
          {guestMode ? 'TU ESPACIO' : `${greeting}, ${displayUser.name}`}
        </div>
        <h1>{copy.title}</h1>
        <p>
          {guestMode ? 'Revisá pendientes y organizá lo que necesita tu hogar.' : copy.subtitle}
        </p>
      </div>
      <button
        className="button button--primary create-button"
        onClick={onCreateTask}
        aria-label={guestMode ? 'Crear cuenta para agregar una tarea' : 'Agregar nueva tarea'}
      >
        <Plus size={17} strokeWidth={2.4} />
        <span>Nueva tarea</span>
      </button>
    </section>
  );
}

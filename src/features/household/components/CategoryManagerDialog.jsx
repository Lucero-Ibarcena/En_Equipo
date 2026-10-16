import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  CreditCard,
  HeartPulse,
  House,
  ListTodo,
  PawPrint,
  Pill,
  Plus,
  ShoppingBasket,
  Sparkles,
  Trash2,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react';
import { CATEGORY_ICON_OPTIONS } from '../householdUtils.js';
const ICONS = {
  CalendarDays,
  CreditCard,
  HeartPulse,
  House,
  ListTodo,
  PawPrint,
  Pill,
  ShoppingBasket,
  Sparkles,
  UsersRound,
  Wrench,
};

/** [INTERFAZ: GESTIÓN DE CATEGORÍAS] Permite crear, editar, cambiar íconos y confirmar borrados. */
export default function CategoryManagerDialog({
  open,
  categories,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  saving = false,
  guest = false,
}) {
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('HeartPulse');
  const [edits, setEdits] = useState({});
  const [error, setError] = useState('');
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }
    if (!wasOpen.current) {
      setEdits(
        Object.fromEntries(
          Object.entries(categories).map(([id, category]) => [
            id,
            {
              label: category.label,
              icon: category.icon,
            },
          ])
        )
      );
      setNewLabel('');
      setNewIcon('HeartPulse');
      setError('');
      wasOpen.current = true;
      return;
    }
    setEdits((current) =>
      Object.fromEntries(
        Object.entries(categories).map(([id, category]) => [
          id,
          current[id] || {
            label: category.label,
            icon: category.icon,
          },
        ])
      )
    );
  }, [open, categories]);
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, saving]);
  if (!open) return null;
  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    if (
      Object.values(categories).some(
        (category) =>
          category.label.trim().toLocaleLowerCase('es-AR') ===
          newLabel.trim().toLocaleLowerCase('es-AR')
      )
    ) {
      setError('Ya existe una categoría con ese nombre.');
      return;
    }
    try {
      await onCreate({
        label: newLabel.trim(),
        icon: newIcon,
      });
      setNewLabel('');
    } catch (createError) {
      setError(createError.message);
    }
  };
  const handleUpdate = async (id) => {
    setError('');
    if (
      Object.entries(categories).some(
        ([categoryId, category]) =>
          categoryId !== id &&
          category.label.trim().toLocaleLowerCase('es-AR') ===
            edits[id].label.trim().toLocaleLowerCase('es-AR')
      )
    ) {
      setError('Ya existe una categoría con ese nombre.');
      return;
    }
    try {
      await onUpdate(id, edits[id]);
    } catch (updateError) {
      setError(updateError.message);
    }
  };
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        className="task-dialog category-manager"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-manager-title"
      >
        <div className="task-dialog__top">
          <span className="eyebrow">ORGANIZACIÓN A TU MANERA</span>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={saving}
          >
            <X size={19} />
          </button>
        </div>
        <h2 id="category-manager-title">Categorías del hogar</h2>
        <p className="task-dialog__intro">
          Poné nombres que tengan sentido para ustedes. Las nuevas categorías estarán disponibles al
          crear tareas.
        </p>
        <form className="category-create" onSubmit={handleCreate}>
          <label className="form-field">
            <span>Nueva categoría</span>
            <input
              autoComplete="off"
              spellCheck="true"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="Ej. Cuidado de la familia"
              maxLength={32}
              minLength={2}
              required
            />
          </label>
          <label className="form-field">
            <span>Ícono</span>
            <select value={newIcon} onChange={(event) => setNewIcon(event.target.value)}>
              {CATEGORY_ICON_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button button--primary"
            type="submit"
            disabled={saving || newLabel.trim().length < 2}
          >
            <Plus size={15} />
            {saving ? 'Guardando…' : 'Agregar categoría'}
          </button>
        </form>
        {guest && (
          <p className="category-manager__guest">
            En la vista de prueba, estas categorías duran solo mientras esté abierta la sesión.
          </p>
        )}
        <div className="category-manager__list">
          {Object.entries(categories).map(([id, category]) => {
            const Icon = ICONS[edits[id]?.icon] || ListTodo;
            const changed =
              edits[id]?.label !== category.label || edits[id]?.icon !== category.icon;
            return (
              <div className="category-manager__row" key={id}>
                <span className="category-manager__icon">
                  <Icon size={17} />
                </span>
                <label className="form-field">
                  <span>{category.builtIn ? 'Categoría existente' : 'Categoría del hogar'}</span>
                  <input
                    spellCheck="true"
                    value={edits[id]?.label || ''}
                    onChange={(event) =>
                      setEdits((current) => ({
                        ...current,
                        [id]: {
                          ...current[id],
                          label: event.target.value,
                        },
                      }))
                    }
                    maxLength={32}
                  />
                </label>
                <label className="form-field category-manager__icon-select">
                  <span>Ícono</span>
                  <select
                    value={edits[id]?.icon || 'ListTodo'}
                    onChange={(event) =>
                      setEdits((current) => ({
                        ...current,
                        [id]: {
                          ...current[id],
                          icon: event.target.value,
                        },
                      }))
                    }
                  >
                    {CATEGORY_ICON_OPTIONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="category-manager__actions">
                  <button
                    type="button"
                    className="button button--outline category-manager__save"
                    disabled={!changed || saving || edits[id]?.label?.trim().length < 2}
                    onClick={() => handleUpdate(id)}
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    className="button button--quiet category-manager__delete"
                    disabled={saving || Object.keys(categories).length <= 1}
                    onClick={() => onDelete(category)}
                    aria-label={`Eliminar categoría ${category.label}`}
                    title="Eliminar categoría"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="task-dialog__actions">
          <button
            type="button"
            className="button button--quiet"
            onClick={onClose}
            disabled={saving}
          >
            Listo
          </button>
        </div>
      </section>
    </div>
  );
}

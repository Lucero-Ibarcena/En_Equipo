// [INTERFAZ: FECHA DE TAREA] Permite elegir y recorrer fechas de vencimiento.
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toLocalDateKey } from '../../household/householdUtils.js';
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
function parseDateKey(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12);
}
function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}
function formatSelectedDate(value) {
  const date = parseDateKey(value);
  if (!date) return 'Elegir una fecha';
  const text = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return text.charAt(0).toLocaleUpperCase('es-AR') + text.slice(1);
}
export default function TaskDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    monthStart(parseDateKey(value) || new Date())
  );
  const pickerRef = useRef(null);
  const todayKey = toLocalDateKey();
  useEffect(() => {
    const selectedDate = parseDateKey(value);
    if (selectedDate) setVisibleMonth(monthStart(selectedDate));
  }, [value]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);
  const days = useMemo(() => {
    const firstDay = monthStart(visibleMonth);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - mondayOffset);
    return Array.from(
      {
        length: 42,
      },
      (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return date;
      }
    );
  }, [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);
  const selectDate = (date) => {
    onChange(toLocalDateKey(date));
    setOpen(false);
  };
  const moveMonth = (amount) => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12)
    );
  };
  return (
    <div className="form-field form-field--date">
      <span className="form-field__date-label">
        <CalendarDays size={14} />
        ¿Para cuándo?
      </span>
      <div className="date-picker" ref={pickerRef}>
        <button
          type="button"
          className={`date-picker__trigger${value ? ' date-picker__trigger--selected' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span>{formatSelectedDate(value)}</span>
          <CalendarDays size={17} aria-hidden="true" />
        </button>
        {open && (
          <section
            className="date-picker__popover"
            role="dialog"
            aria-label="Elegí una fecha para la tarea"
          >
            <header className="date-picker__header">
              <button
                type="button"
                className="date-picker__nav"
                aria-label="Mes anterior"
                onClick={() => moveMonth(-1)}
              >
                <ChevronLeft size={17} />
              </button>
              <div className="date-picker__month">
                <strong>{monthLabel}</strong>
                <span>Un paso a la vez</span>
              </div>
              <button
                type="button"
                className="date-picker__nav"
                aria-label="Mes siguiente"
                onClick={() => moveMonth(1)}
              >
                <ChevronRight size={17} />
              </button>
            </header>
            <div className="date-picker__grid" role="group" aria-label={monthLabel}>
              {WEEKDAYS.map((day) => (
                <span className="date-picker__weekday" key={day} aria-hidden="true">
                  {day}
                </span>
              ))}
              {days.map((date) => {
                const dateKey = toLocalDateKey(date);
                const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === value;
                return (
                  <button
                    type="button"
                    key={dateKey}
                    className={`date-picker__day${
                      isCurrentMonth ? '' : ' date-picker__day--outside'
                    }${isToday ? ' date-picker__day--today' : ''}${
                      isSelected ? ' date-picker__day--selected' : ''
                    }`}
                    aria-label={new Intl.DateTimeFormat('es-AR', {
                      dateStyle: 'full',
                    }).format(date)}
                    aria-current={isToday ? 'date' : undefined}
                    aria-pressed={isSelected}
                    onClick={() => selectDate(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <footer className="date-picker__footer">
              <button
                type="button"
                className="date-picker__text-button"
                onClick={() => selectDate(new Date())}
              >
                Hoy
              </button>
              <button
                type="button"
                className="date-picker__text-button date-picker__clear"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                <X size={13} />
                Sin fecha
              </button>
            </footer>
          </section>
        )}
      </div>
    </div>
  );
}

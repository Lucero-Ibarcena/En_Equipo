'use client';

// [AVISOS: COMPONENTE] Presenta vencimientos, registra aperturas y lleva a cada tarea.
import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { toLocalDateKey } from '../../household/householdUtils.js';

// [AVISOS] Deriva avisos de las fechas de tareas y recuerda cuáles ya se abrieron.
export default function NotificationPopover({ tasks, userId, householdId, onNavigate }) {
  const [open, setOpen] = useState(false);
  const storageKey = householdId
    ? `en-equipo:notifications:${userId || 'vista'}:${householdId}`
    : '';
  const [noticeState, setNoticeState] = useState({
    key: '',
    records: {},
  });
  const todayKey = toLocalDateKey();
  const lastDay = new Date();
  lastDay.setDate(lastDay.getDate() + 7);
  const lastDayKey = toLocalDateKey(lastDay);
  const notices = useMemo(
    () =>
      tasks
        .filter((task) => task.status !== 'done' && task.dueDate && task.dueDate <= lastDayKey)
        .sort((first, second) => first.dueDate.localeCompare(second.dueDate))
        .map((task) => {
          const dueAtNoon = new Date(`${task.dueDate}T12:00:00`);
          const todayAtNoon = new Date(`${todayKey}T12:00:00`);
          const daysUntilDue = Math.round((dueAtNoon - todayAtNoon) / 86_400_000);
          const dueLabel = new Intl.DateTimeFormat('es-AR', {
            day: 'numeric',
            month: 'short',
          })
            .format(dueAtNoon)
            .replace('.', '');
          const status =
            daysUntilDue < 0
              ? `Vencida · ${dueLabel}`
              : daysUntilDue === 0
                ? `Vence hoy · ${dueLabel}`
                : daysUntilDue <= 2
                  ? `Vence pronto · ${dueLabel}`
                  : `Vence el ${dueLabel}`;
          return {
            task,
            id: `${task.id}:${task.dueDate}`,
            status,
          };
        }),
    [tasks, todayKey, lastDayKey]
  );
  useEffect(() => {
    if (!storageKey) {
      setNoticeState({
        key: '',
        records: {},
      });
      return;
    }
    let records = {};
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) records = parsed;
    } catch {
      records = {};
    }
    setNoticeState({
      key: storageKey,
      records,
    });
  }, [storageKey]);
  useEffect(() => {
    if (noticeState.key !== storageKey) return;
    setNoticeState((current) => {
      if (current.key !== storageKey) return current;
      let changed = false;
      const records = {
        ...current.records,
      };
      for (const notice of notices) {
        if (!records[notice.id]) {
          records[notice.id] = {
            receivedAt: new Date().toISOString(),
            readAt: null,
          };
          changed = true;
        }
      }
      return changed
        ? {
            ...current,
            records,
          }
        : current;
    });
  }, [notices, noticeState.key, storageKey]);

  // Al marcar una tarea como pendiente, genera un aviso nuevo sin marcarlo como leído.
  useEffect(() => {
    if (noticeState.key !== storageKey) return;
    const completedIds = new Set(
      tasks.filter((task) => task.status === 'done').map((task) => task.id)
    );
    if (!completedIds.size) return;
    setNoticeState((current) => {
      if (current.key !== storageKey) return current;
      const records = {
        ...current.records,
      };
      let changed = false;
      for (const id of Object.keys(records)) {
        const separator = id.lastIndexOf(':');
        if (separator > 0 && completedIds.has(id.slice(0, separator))) {
          delete records[id];
          changed = true;
        }
      }
      return changed
        ? {
            ...current,
            records,
          }
        : current;
    });
  }, [tasks, noticeState.key, storageKey]);
  useEffect(() => {
    if (!storageKey || noticeState.key !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(noticeState.records));
    } catch {
      // Los avisos siguen disponibles durante esta sesión aunque no haya espacio local.
    }
  }, [storageKey, noticeState]);
  const records = noticeState.key === storageKey ? noticeState.records : {};
  const unreadCount = notices.filter((notice) => !records[notice.id]?.readAt).length;
  const selectTask = (notice) => {
    setNoticeState((current) => {
      const currentRecords = current.key === storageKey ? current.records : {};
      return {
        key: storageKey,
        records: {
          ...currentRecords,
          [notice.id]: {
            ...currentRecords[notice.id],
            readAt: new Date().toISOString(),
          },
        },
      };
    });
    setOpen(false);
    onNavigate(notice.task);
  };
  return (
    <div className="notification-wrap">
      <button
        className="icon-button topbar__notification"
        aria-label={`Avisos de vencimientos${unreadCount ? `: ${unreadCount} sin leer` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={19} />
        {unreadCount > 0 && <span />}
      </button>
      {open && (
        <section className="notification-popover" aria-label="Avisos de tareas">
          <div className="notification-popover__heading">
            <strong>Para tener en cuenta</strong>
            <button onClick={() => setOpen(false)} aria-label="Cerrar avisos">
              ×
            </button>
          </div>
          {notices.length ? (
            notices.map((notice) => {
              const record = records[notice.id];
              const arrivedAt = record?.receivedAt ? new Date(record.receivedAt) : null;
              const receivedLabel =
                arrivedAt && !Number.isNaN(arrivedAt.valueOf())
                  ? new Intl.DateTimeFormat('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(arrivedAt)
                  : 'Registrado recién';
              return (
                <button
                  className={`notification-popover__item${
                    record?.readAt ? ' notification-popover__item--read' : ''
                  }`}
                  key={notice.id}
                  onClick={() => selectTask(notice)}
                >
                  <span className="notification-popover__dot" aria-hidden="true" />
                  <span className="notification-popover__copy">
                    <strong>{notice.task.title}</strong>
                    <small className="notification-popover__due">{notice.status}</small>
                    <small>Llegó el {receivedLabel}</small>
                    <small>{record?.readAt ? 'Ya la abriste' : 'Sin leer'}</small>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="notification-popover__empty">
              No hay fechas próximas. La casa está al día.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

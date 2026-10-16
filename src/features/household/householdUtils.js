// [HOGAR: DATOS COMPARTIDOS] Define categorías iniciales y funciones auxiliares de presentación.
export const CATEGORIES = {
  chores: {
    label: 'Tareas del hogar',
    shortLabel: 'Tareas',
    icon: 'Sparkles',
  },
  shopping: {
    label: 'Lista de compras',
    shortLabel: 'Compras',
    icon: 'ShoppingBasket',
  },
  payments: {
    label: 'Pagos',
    shortLabel: 'Pagos',
    icon: 'CreditCard',
  },
  repairs: {
    label: 'Reparaciones',
    shortLabel: 'Arreglos',
    icon: 'Wrench',
  },
};
export const CATEGORY_ICON_OPTIONS = [
  {
    id: 'HeartPulse',
    label: 'Salud',
  },
  {
    id: 'PawPrint',
    label: 'Mascotas',
  },
  {
    id: 'Pill',
    label: 'Medicamentos',
  },
  {
    id: 'CalendarDays',
    label: 'Agenda',
  },
  {
    id: 'ListTodo',
    label: 'Lista',
  },
  {
    id: 'Sparkles',
    label: 'Hogar',
  },
  {
    id: 'ShoppingBasket',
    label: 'Compras',
  },
  {
    id: 'CreditCard',
    label: 'Pagos',
  },
  {
    id: 'Wrench',
    label: 'Arreglos',
  },
  {
    id: 'UsersRound',
    label: 'Personas',
  },
  {
    id: 'House',
    label: 'Casa',
  },
];
export const NAV_ITEMS = [
  {
    id: 'all',
    label: 'Inicio',
    icon: 'House',
  },
  {
    id: 'chores',
    label: 'Tareas del hogar',
    icon: 'Sparkles',
  },
  {
    id: 'shopping',
    label: 'Lista de compras',
    icon: 'ShoppingBasket',
  },
  {
    id: 'payments',
    label: 'Pagos',
    icon: 'CreditCard',
  },
  {
    id: 'repairs',
    label: 'Reparaciones',
    icon: 'Wrench',
  },
];
export const STATUS_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  done: 'Listo',
};
export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
export function formatTaskDate(value) {
  if (!value) return 'Sin fecha';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const difference = Math.round((date - today) / 86_400_000);
  if (difference === 0) return 'Hoy';
  if (difference === 1) return 'Mañana';
  if (difference === -1) return 'Ayer';
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
  })
    .format(date)
    .replace('.', '');
}
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buen día';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

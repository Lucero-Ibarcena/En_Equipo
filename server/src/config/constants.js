export const DEFAULT_CATEGORIES = [
  { id: 'chores', label: 'Tareas del hogar', shortLabel: 'Tareas', icon: 'Sparkles', builtIn: true },
  { id: 'shopping', label: 'Lista de compras', shortLabel: 'Compras', icon: 'ShoppingBasket', builtIn: true },
  { id: 'payments', label: 'Pagos', shortLabel: 'Pagos', icon: 'CreditCard', builtIn: true },
  { id: 'repairs', label: 'Reparaciones', shortLabel: 'Arreglos', icon: 'Wrench', builtIn: true },
];
export const TASK_CATEGORIES = DEFAULT_CATEGORIES.map((category) => category.id);
export const CATEGORY_ICONS = ['Sparkles', 'ShoppingBasket', 'CreditCard', 'Wrench', 'HeartPulse', 'PawPrint', 'Pill', 'CalendarDays', 'ListTodo', 'UsersRound', 'House'];
export const TASK_STATUSES = ['pending', 'in_progress', 'done'];

export const CATEGORY_LABELS = {
  chores: 'Tareas del hogar',
  shopping: 'Compras',
  payments: 'Pagos',
  repairs: 'Reparaciones',
};

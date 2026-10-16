// [INTERFAZ: NAVEGACIÓN DEL HOGAR] Muestra secciones, integrantes y accesos de administración.
import {
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  HeartPulse,
  House,
  ListTodo,
  PawPrint,
  Pill,
  Plus,
  QrCode,
  Settings2,
  ShoppingBasket,
  Sparkles,
  Trash2,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import BrandMark from '../../../components/common/BrandMark.jsx';
import Avatar from '../../../components/common/Avatar.jsx';

// [ICONOS: RESPALDOS] La versión queda fijada, los SVG se incluyen al compilar y las claves
// desconocidas usan ListTodo.
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
export default function Sidebar({
  activeView,
  categories,
  onNavigate,
  onAddMember,
  onShowInvite,
  onManageCategories,
  onDeleteMember,
  onManageHouseholds,
  onSelectHousehold,
  household,
  households,
  members,
  householdRole,
  pendingCount,
  guest = false,
}) {
  const [householdMenuOpen, setHouseholdMenuOpen] = useState(false);
  const isOwner = !guest && householdRole === 'owner';
  const navItems = [
    {
      id: 'all',
      label: 'Inicio',
      icon: 'House',
    },
    ...Object.entries(categories || {}).map(([id, category]) => ({
      id,
      label: category.label,
      icon: category.icon,
    })),
  ];
  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="sidebar__top">
        <BrandMark />
        <button
          className="icon-button sidebar__mobile-close"
          aria-label="Cerrar menú"
          onClick={() => onNavigate(activeView)}
        >
          <span>×</span>
        </button>
      </div>
      <div className="home-switcher-wrap">
        <button
          className="home-switcher"
          aria-label={guest ? 'Iniciar sesión para administrar hogares' : 'Cambiar de hogar'}
          aria-expanded={householdMenuOpen}
          onClick={() => (guest ? onManageHouseholds() : setHouseholdMenuOpen((open) => !open))}
        >
          <span className="home-switcher__icon">
            <House size={17} />
          </span>
          <span className="home-switcher__copy">
            <strong>{household?.name || (guest ? 'Vista previa' : 'Nuestra casa')}</strong>
            <small>
              {guest
                ? 'Modo de muestra'
                : households?.length > 1
                  ? `${households.length} hogares`
                  : 'Hogar compartido'}
            </small>
          </span>
          <ChevronDown
            size={15}
            className={
              householdMenuOpen
                ? 'home-switcher__chevron home-switcher__chevron--open'
                : 'home-switcher__chevron'
            }
          />
        </button>
        {householdMenuOpen && !guest && (
          <div className="home-menu" aria-label="Tus hogares">
            <span className="home-menu__title">TUS HOGARES</span>
            {households?.map((item) => (
              <button
                key={item.id}
                className={`home-menu__item${
                  item.id === household?.id ? ' home-menu__item--active' : ''
                }`}
                onClick={() => {
                  onSelectHousehold(item.id);
                  setHouseholdMenuOpen(false);
                }}
              >
                <House size={15} />
                <span>{item.name}</span>
                {item.id === household?.id && <Check size={14} />}
              </button>
            ))}
            <button
              className="home-menu__manage"
              onClick={() => {
                onManageHouseholds();
                setHouseholdMenuOpen(false);
              }}
            >
              <UsersRound size={15} />
              Administrar hogares
            </button>
          </div>
        )}
      </div>
      <div className="sidebar__section-label">ORGANIZACIÓN</div>
      <nav className="sidebar__nav">
        {navItems.map(({ id, label, icon }) => {
          // [ICONOS: RESPALDO DE CATEGORÍA] Un nombre de ícono desconocido se reemplaza por una lista
          // reconocible.
          const Icon = ICONS[icon] || ListTodo;
          return (
            <button
              key={id}
              className={`nav-link${activeView === id ? ' nav-link--active' : ''}`}
              onClick={() => onNavigate(id)}
              aria-current={activeView === id ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {id === 'all' && pendingCount > 0 && (
                <span className="nav-link__count">{pendingCount}</span>
              )}
            </button>
          );
        })}
      </nav>
      {onManageCategories && isOwner && (
        <button className="sidebar__category-manage" type="button" onClick={onManageCategories}>
          <Settings2 size={15} />
          <span>Administrar categorías</span>
        </button>
      )}
      <div className="sidebar__people-heading">
        <span className="sidebar__section-label">{guest ? 'TU HOGAR' : 'EN CASA'}</span>
        <div className="sidebar__people-actions">
          {onShowInvite && (
            <button
              className="quiet-icon-button"
              aria-label="Mostrar invitación con código y QR"
              title="Compartir código o QR"
              onClick={onShowInvite}
            >
              <QrCode size={15} />
            </button>
          )}
          {isOwner && onAddMember && (
            <button
              className="quiet-icon-button"
              aria-label="Agregar integrante"
              title="Invitar integrante por correo"
              onClick={onAddMember}
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="people-list">
        {guest && <p className="sidebar__people-empty">Iniciá sesión para invitar integrantes.</p>}
        {members.map((member) => (
          <div className="people-list__person" key={member.id}>
            <Avatar member={member} size="small" />
            <span className="people-list__name">
              {member.name}
              {member.isCurrentUser && <small>Vos</small>}
            </span>
            {member.role !== 'owner' && (isOwner || member.isCurrentUser) && (
              <button
                className="people-list__action people-list__action--remove"
                aria-label={`${
                  member.isCurrentUser ? 'Salir del hogar' : `Quitar a ${member.name}`
                }`}
                title={member.isCurrentUser ? 'Salir del hogar' : 'Quitar del hogar'}
                onClick={() => onDeleteMember(member)}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
      {!guest && (
        <div className="sidebar__bottom">
          <div className="sidebar-tip">
            <p>
              Una casa más liviana se construye <strong>entre todos.</strong>
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

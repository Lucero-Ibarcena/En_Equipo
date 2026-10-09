import { Check, ChevronDown, CreditCard, House, Pencil, Plus, ShoppingBasket, Sparkles, Trash2, UsersRound, Wrench } from 'lucide-react';
import { useState } from 'react';
import BrandMark from './BrandMark.jsx';
import Avatar from './Avatar.jsx';
import { NAV_ITEMS } from '../features/household/householdUtils.js';

const ICONS = { House, Sparkles, ShoppingBasket, CreditCard, Wrench };

export default function Sidebar({ activeView, onNavigate, onAddMember, onEditMember, onDeleteMember, onManageHouseholds, onSelectHousehold, household, households, members, householdRole, pendingCount, guest = false }) {
  const [householdMenuOpen, setHouseholdMenuOpen] = useState(false);
  const isOwner = guest || householdRole === 'owner';

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="sidebar__top">
        <BrandMark />
        <button className="icon-button sidebar__mobile-close" aria-label="Cerrar menú" onClick={() => onNavigate(activeView)}><span>×</span></button>
      </div>

      <div className="home-switcher-wrap">
        <button className="home-switcher" aria-label={guest ? 'Iniciar sesión para administrar hogares' : 'Cambiar de hogar'} aria-expanded={householdMenuOpen} onClick={() => guest ? onManageHouseholds() : setHouseholdMenuOpen((open) => !open)}>
          <span className="home-switcher__icon"><House size={17} /></span>
          <span className="home-switcher__copy"><strong>{household?.name || 'Nuestra casa'}</strong><small>{households?.length > 1 ? `${households.length} hogares` : 'Hogar compartido'}</small></span>
          <ChevronDown size={15} className={householdMenuOpen ? 'home-switcher__chevron home-switcher__chevron--open' : 'home-switcher__chevron'} />
        </button>
        {householdMenuOpen && !guest && (
          <div className="home-menu" aria-label="Tus hogares">
            <span className="home-menu__title">TUS HOGARES</span>
            {households?.map((item) => (
              <button key={item.id} className={`home-menu__item${item.id === household?.id ? ' home-menu__item--active' : ''}`} onClick={() => { onSelectHousehold(item.id); setHouseholdMenuOpen(false); }}>
                <House size={15} /><span>{item.name}</span>{item.id === household?.id && <Check size={14} />}
              </button>
            ))}
            <button className="home-menu__manage" onClick={() => { onManageHouseholds(); setHouseholdMenuOpen(false); }}><UsersRound size={15} />Crear o unirme a otro hogar</button>
          </div>
        )}
      </div>

      <div className="sidebar__section-label">ORGANIZACIÓN</div>
      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ id, label, icon }) => {
          const Icon = ICONS[icon];
          return (
          <button key={id} className={`nav-link${activeView === id ? ' nav-link--active' : ''}`} onClick={() => onNavigate(id)} aria-current={activeView === id ? 'page' : undefined}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {id === 'all' && pendingCount > 0 && <span className="nav-link__count">{pendingCount}</span>}
          </button>
          );
        })}
      </nav>

      <div className="sidebar__people-heading"><span className="sidebar__section-label">EN CASA</span>{isOwner && <button className="quiet-icon-button" aria-label="Agregar integrante" title="Agregar integrante" onClick={onAddMember}><Plus size={16} /></button>}</div>
      <div className="people-list">
        {members.map((member) => (
          <div className="people-list__person" key={member.id}>
            <Avatar member={member} size="small" />
            <span className="people-list__name">{member.name}{member.isCurrentUser && <small>Vos</small>}</span>
            {(guest && isOwner && !member.isAccountMember) && <button className="people-list__action" aria-label={`Editar a ${member.name}`} title="Editar nombre de prueba" onClick={() => onEditMember(member)}><Pencil size={12} /></button>}
            {member.role !== 'owner' && (isOwner || member.isCurrentUser) && <button className="people-list__action people-list__action--remove" aria-label={`${member.isCurrentUser ? 'Salir del hogar' : `Quitar a ${member.name}`}`} title={member.isCurrentUser ? 'Salir del hogar' : 'Quitar del hogar'} onClick={() => onDeleteMember(member)}><Trash2 size={13} /></button>}
          </div>
        ))}
      </div>

      <div className="sidebar__bottom">
        <div className="sidebar-tip"><span className="sidebar-tip__sparkle">✳</span><p>Una casa más liviana se construye <strong>entre todos.</strong></p><span className="sidebar-tip__leaf">⌁</span></div>
      </div>
    </aside>
  );
}

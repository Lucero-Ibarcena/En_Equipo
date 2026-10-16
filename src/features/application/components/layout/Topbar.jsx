'use client';

// [INTERFAZ: CABECERA] Fecha, ayuda, avisos, tema y acceso al perfil.
import { CircleHelp, LogIn, Mail, Menu, Moon, Sun } from 'lucide-react';
import Avatar from '../../../../components/common/Avatar.jsx';
import NotificationPopover from '../../../notifications/components/NotificationPopover.jsx';
export default function Topbar({
  todayLabel,
  shortTodayLabel,
  guestMode,
  previewTheme,
  onTogglePreviewTheme,
  tasks,
  userId,
  householdId,
  onNavigateToTask,
  invitations,
  onOpenInvitations,
  user,
  displayUser,
  onOpenProfile,
  onOpenLogin,
  onOpenHelp,
  onOpenMobileMenu,
}) {
  return (
    <header className="topbar">
      <button
        className="icon-button mobile-menu-button"
        onClick={onOpenMobileMenu}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>
      <div className="topbar__date">
        <span className="topbar__date-dot" />
        <span className="topbar__date-label--long">{todayLabel}</span>
        <span className="topbar__date-label--short">{shortTodayLabel}</span>
      </div>
      <div className="topbar__actions">
        <button
          className="topbar__help"
          aria-label="Ayuda, guía y preguntas frecuentes"
          onClick={onOpenHelp}
        >
          <CircleHelp size={17} />
          <span>Ayuda</span>
        </button>
        {guestMode && (
          <button
            className="icon-button topbar__theme"
            type="button"
            aria-label={previewTheme === 'light' ? 'Probar el tema oscuro' : 'Probar el tema claro'}
            title={previewTheme === 'light' ? 'Probar el tema oscuro' : 'Probar el tema claro'}
            onClick={onTogglePreviewTheme}
          >
            {previewTheme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        )}
        <NotificationPopover
          tasks={tasks}
          userId={userId}
          householdId={householdId}
          onNavigate={onNavigateToTask}
        />
        {!guestMode && (
          <button
            className="icon-button topbar__notification"
            aria-label={`Invitaciones a hogares${
              invitations.length ? `: ${invitations.length} pendientes` : ''
            }`}
            title="Invitaciones a hogares"
            onClick={onOpenInvitations}
          >
            <Mail size={18} />
            {invitations.length > 0 && <span />}
          </button>
        )}
        <button
          className={`topbar__account${guestMode ? ' topbar__account--guest' : ''}`}
          aria-label={guestMode ? 'Iniciar sesión para guardar cambios' : `Cuenta de ${user.name}`}
          onClick={guestMode ? onOpenLogin : onOpenProfile}
          title={guestMode ? 'Iniciá sesión para guardar cambios' : 'Abrir cuenta'}
        >
          {guestMode ? (
            <>
              <LogIn size={15} className="topbar__account-icon" />
              <span>Iniciar sesión</span>
            </>
          ) : (
            <Avatar member={displayUser} size="small" />
          )}
        </button>
      </div>
    </header>
  );
}

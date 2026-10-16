'use client';

// [INTERFAZ: CUADROS DE DIÁLOGO] Reúne formularios y confirmaciones de la aplicación.
import ConfirmDialog from '../../../../components/common/ConfirmDialog.jsx';
import CategoryManagerDialog from '../../../household/components/CategoryManagerDialog.jsx';
import HouseholdDialog from '../../../household/components/HouseholdDialog.jsx';
import HouseholdInvitationsDialog from '../../../household/components/HouseholdInvitationsDialog.jsx';
import HouseholdInviteDialog from '../../../household/components/HouseholdInviteDialog.jsx';
import MemberFormDialog from '../../../household/components/MemberFormDialog.jsx';
import ProfileDialog from '../../../profile/components/ProfileDialog.jsx';
import HelpDialog from '../../../help/components/HelpDialog.jsx';
import TaskFormDialog from '../../../tasks/components/TaskFormDialog.jsx';
import { householdApi } from '../../../../services/api.js';
export default function ApplicationDialogs({ datos, estado, acciones }) {
  const {
    guestMode,
    household,
    households,
    activeHouseholdId,
    householdRole,
    tasks,
    taskDrafts,
    categoryMap,
    user,
    members,
    activeView,
    actionError,
  } = datos;
  const {
    taskDialogOpen,
    editingTask,
    editingDraft,
    savingTask,
    memberDialogOpen,
    editingMember,
    memberToRemove,
    removingMember,
    taskAction,
    savingTaskAction,
    householdDialogOpen,
    categoryManagerOpen,
    categoryToDelete,
    categoryDeleteError,
    savingCategory,
    householdInviteOpen,
    invitationsOpen,
    invitations,
    profileDialogOpen,
    savingProfile,
    helpDialogOpen,
    savingMember,
  } = estado;
  const {
    updateTaskDraft,
    closeTaskDialog,
    handleSaveTask,
    closeMemberDialog,
    handleSaveMember,
    confirmRemoveMember,
    closeTaskAction,
    confirmTaskAction,
    closeHouseholdDialog,
    handleHouseholdComplete,
    handleRenameHousehold,
    loadHousehold,
    handleRefreshMemberships,
    closeCategoryManager,
    handleCreateCategory,
    handleUpdateCategory,
    askToDeleteCategory,
    closeCategoryDeletion,
    confirmDeleteCategory,
    closeHouseholdInvite,
    closeInvitations,
    handleInvitationDecision,
    closeProfile,
    handleSaveProfile,
    handlePhoneVerified,
    handleSignOut,
    closeHelp,
    openNewTask,
    openMemberForm,
  } = acciones;
  const taskCountForCategory = tasks.filter(
    (task) => task.category === categoryToDelete?.id
  ).length;
  const draftCountForCategory = taskDrafts.filter(
    (draft) => draft.category === categoryToDelete?.id
  ).length;
  return (
    <>
      <TaskFormDialog
        open={taskDialogOpen}
        members={members}
        categories={categoryMap}
        initialCategory={activeView}
        initialTask={editingTask}
        initialDraft={editingDraft}
        onDraftChange={updateTaskDraft}
        onClose={closeTaskDialog}
        onSubmit={handleSaveTask}
        saving={savingTask}
        guest={guestMode}
      />
      <MemberFormDialog
        open={memberDialogOpen}
        initialMember={editingMember}
        guest={guestMode}
        onClose={closeMemberDialog}
        onSubmit={handleSaveMember}
        saving={savingMember}
      />
      <ConfirmDialog
        open={Boolean(memberToRemove)}
        title={
          memberToRemove?.isCurrentUser
            ? 'Salir de este hogar'
            : `Quitar a ${memberToRemove?.name || 'esta persona'}`
        }
        message={
          memberToRemove?.isCurrentUser
            ? `Vas a dejar de ver las tareas de “${
                household?.name || 'este hogar'
              }”. Podés volver a unirte con el código del hogar.`
            : `¿Querés quitar a ${memberToRemove?.name || 'esta persona'} de “${
                household?.name || 'este hogar'
              }”? Sus tareas asignadas quedarán sin responsable.`
        }
        confirmLabel={memberToRemove?.isCurrentUser ? 'Salir del hogar' : 'Quitar integrante'}
        onCancel={() => setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
        saving={removingMember}
      />
      <ConfirmDialog
        open={Boolean(taskAction)}
        title={
          taskAction?.type === 'archive'
            ? `Archivar “${taskAction.task.title}”?`
            : taskAction?.type === 'trash'
              ? `Mover “${taskAction.task.title}” a la papelera?`
              : taskAction?.type === 'permanent-delete'
                ? `Eliminar “${taskAction.task.title}” definitivamente?`
                : `Eliminar borrador “${taskAction?.draft?.title || 'sin título'}”?`
        }
        message={
          actionError ||
          (taskAction?.type === 'archive'
            ? 'La tarea saldrá de las listas habituales. Podés restaurarla cuando vuelva a hacer falta.'
            : taskAction?.type === 'trash'
              ? 'La tarea se moverá a la papelera. Podés restaurarla; para borrarla definitivamente habrá una confirmación final.'
              : taskAction?.type === 'permanent-delete'
                ? 'Esta es la confirmación final. La tarea se eliminará del hogar y no se podrá recuperar.'
                : 'Este borrador se eliminará de este dispositivo y no se podrá recuperar.')
        }
        confirmLabel={
          taskAction?.type === 'archive'
            ? 'Archivar tarea'
            : taskAction?.type === 'trash'
              ? 'Mover a papelera'
              : taskAction?.type === 'permanent-delete'
                ? 'Eliminar definitivamente'
                : 'Eliminar borrador'
        }
        confirmVariant={taskAction?.type === 'archive' ? 'primary' : 'danger'}
        onCancel={closeTaskAction}
        onConfirm={confirmTaskAction}
        saving={savingTaskAction}
      />
      <HouseholdDialog
        open={householdDialogOpen}
        activeHousehold={{
          ...households.find((item) => item.id === activeHouseholdId),
          joinRequests: household?.joinRequests || [],
        }}
        onClose={closeHouseholdDialog}
        onComplete={handleHouseholdComplete}
        onRename={handleRenameHousehold}
        onRefresh={loadHousehold}
        onRefreshMemberships={handleRefreshMemberships}
      />
      <CategoryManagerDialog
        open={categoryManagerOpen && !guestMode}
        categories={categoryMap}
        onClose={closeCategoryManager}
        onCreate={handleCreateCategory}
        onUpdate={handleUpdateCategory}
        onDelete={askToDeleteCategory}
        saving={savingCategory}
        guest={guestMode}
      />
      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title={`¿Eliminar “${categoryToDelete?.label || 'esta categoría'}”?`}
        message={
          categoryDeleteError ||
          `Se borrarán definitivamente ${taskCountForCategory} ${
            taskCountForCategory === 1 ? 'tarea' : 'tareas'
          } y ${draftCountForCategory} ${
            draftCountForCategory === 1 ? 'borrador' : 'borradores'
          } de esta categoría. No se podrán recuperar.`
        }
        confirmLabel="Eliminar categoría"
        onCancel={closeCategoryDeletion}
        onConfirm={confirmDeleteCategory}
        saving={savingCategory}
      />
      <HouseholdInviteDialog
        open={householdInviteOpen && !guestMode}
        household={household}
        onClose={closeHouseholdInvite}
      />
      <HouseholdInvitationsDialog
        open={invitationsOpen}
        invitations={invitations}
        onClose={closeInvitations}
        onDecision={handleInvitationDecision}
      />
      <ProfileDialog
        open={profileDialogOpen}
        user={user}
        onClose={closeProfile}
        onSubmit={handleSaveProfile}
        onPhoneStart={householdApi.startPhoneVerification}
        onPhoneVerify={householdApi.verifyPhone}
        onPhoneVerified={handlePhoneVerified}
        onSignOut={handleSignOut}
        saving={savingProfile}
      />
      <HelpDialog
        open={helpDialogOpen}
        onClose={closeHelp}
        onCreateTask={openNewTask}
        onAddMember={openMemberForm}
        onManageHouseholds={() => setHouseholdDialogOpen(true)}
        canManageMembers={!guestMode && householdRole === 'owner'}
        guest={guestMode}
      />
    </>
  );
}

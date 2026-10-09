import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Check, CircleHelp, Mail, Menu, Plus, Search, Sparkles } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import HelpDialog from '../components/HelpDialog.jsx';
import HouseholdPulse from '../components/HouseholdPulse.jsx';
import AuthScreen from '../components/AuthScreen.jsx';
import HouseholdDialog from '../components/HouseholdDialog.jsx';
import HouseholdInvitationsDialog from '../components/HouseholdInvitationsDialog.jsx';
import MemberFormDialog from '../components/MemberFormDialog.jsx';
import ProfileDialog from '../components/ProfileDialog.jsx';
import RecoveryCodeDialog from '../components/RecoveryCodeDialog.jsx';
import Sidebar from '../components/Sidebar.jsx';
import TaskFormDialog from '../components/TaskFormDialog.jsx';
import TaskItem from '../components/TaskItem.jsx';
import TaskDraftItem from '../components/TaskDraftItem.jsx';
import { CATEGORIES, getGreeting, toLocalDateKey } from '../features/household/householdUtils.js';
import { householdApi } from '../services/api.js';
import './app.css';

function getViewCopy(view) {
  const copyByView = {
    all: {
      title: 'El hogar, en equipo.',
      subtitle: 'Un espacio tranquilo para organizar lo que importa.',
      section: 'Lo que tenemos entre manos',
    },
    chores: {
      title: 'Tareas del hogar',
      subtitle: 'Las pequeñas cosas que hacen que la casa se sienta bien.',
      section: 'Tareas compartidas',
    },
    shopping: {
      title: 'Lista de compras',
      subtitle: 'Todo lo que hace falta, en un mismo lugar.',
      section: 'Pendiente para la próxima salida',
    },
    payments: {
      title: 'Pagos de la casa',
      subtitle: 'Fechas claras para que nada quede dando vueltas.',
      section: 'Próximos pagos',
    },
    repairs: {
      title: 'Arreglos y reparaciones',
      subtitle: 'Un lugar para registrar lo que la casa necesita.',
      section: 'Cosas para resolver',
    },
  };
  return copyByView[view] || copyByView.all;
}

function NotificationPopover({ tasks, onNavigate }) {
  const [open, setOpen] = useState(false);
  const lastDay = new Date(Date.now() + 7 * 86_400_000);
  const lastDayKey = toLocalDateKey(lastDay);
  const upcomingTasks = tasks
    .filter((task) => task.status !== 'done' && task.dueDate && task.dueDate <= lastDayKey)
    .slice(0, 4);

  const selectTask = (task) => {
    setOpen(false);
    onNavigate(task.category);
  };

  return (
    <div className="notification-wrap">
      <button
        className="icon-button topbar__notification"
        aria-label="Avisos de vencimientos"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={19} />
        {upcomingTasks.length > 0 && <span />}
      </button>
      {open && (
        <section className="notification-popover" aria-label="Avisos de tareas">
          <div className="notification-popover__heading">
            <strong>Para tener en cuenta</strong>
            <button onClick={() => setOpen(false)} aria-label="Cerrar avisos">×</button>
          </div>
          {upcomingTasks.length ? (
            upcomingTasks.map((task) => (
              <button className="notification-popover__item" key={task.id} onClick={() => selectTask(task)}>
                <span className="notification-popover__dot" />
                <span>
                  <strong>{task.title}</strong>
                  <small>{task.dueDate === toLocalDateKey() ? 'Vence hoy' : 'Vence pronto'}</small>
                </span>
              </button>
            ))
          ) : (
            <p className="notification-popover__empty">No hay fechas próximas. La casa está al día.</p>
          )}
        </section>
      )}
    </div>
  );
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [invitationsOpen, setInvitationsOpen] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState(() => new URLSearchParams(window.location.search).get('join') || '');
  const [households, setHouseholds] = useState([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState('');
  const [household, setHousehold] = useState(null);
  const [householdRole, setHouseholdRole] = useState('member');
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [taskDraftsState, setTaskDraftsState] = useState({ key: '', drafts: [] });
  const [taskAction, setTaskAction] = useState(null);
  const [savingTaskAction, setSavingTaskAction] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [householdDialogOpen, setHouseholdDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting);
  const taskDraftsKey = user && activeHouseholdId
    ? `en-equipo:task-drafts:${user.id}:${activeHouseholdId}`
    : guestMode
      ? `en-equipo:guest-task-drafts:${household?.id || 'demo'}`
      : '';
  const taskDrafts = taskDraftsState.key === taskDraftsKey ? taskDraftsState.drafts : [];

  useEffect(() => {
    if (!taskDraftsKey) {
      setTaskDraftsState({ key: '', drafts: [] });
      return;
    }
    let drafts = [];
    if (user) {
      try {
        const stored = JSON.parse(localStorage.getItem(taskDraftsKey) || '[]');
        if (Array.isArray(stored)) drafts = stored.filter((item) => item && typeof item.id === 'string');
      } catch {
        drafts = [];
      }
    }
    setTaskDraftsState({ key: taskDraftsKey, drafts });
  }, [taskDraftsKey, user?.id]);

  useEffect(() => {
    if (!user || !taskDraftsKey || taskDraftsState.key !== taskDraftsKey) return;
    try {
      localStorage.setItem(taskDraftsKey, JSON.stringify(taskDraftsState.drafts));
    } catch {
      setActionError('No pudimos guardar los borradores en este dispositivo. Revisá el espacio disponible del navegador.');
    }
  }, [user?.id, taskDraftsKey, taskDraftsState]);

  useEffect(() => {
    const updateGreeting = () => setGreeting(getGreeting());
    updateGreeting();
    const interval = window.setInterval(updateGreeting, 60_000);
    window.addEventListener('focus', updateGreeting);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', updateGreeting);
    };
  }, []);

  useEffect(() => {
    let current = true;
    householdApi.me().then(async (result) => {
      if (!current) return;
      let availableHouseholds = result.households;
      let joinedHouseholdId = '';
      if (pendingJoinCode) {
        try {
          const joined = await householdApi.joinHousehold(pendingJoinCode);
          availableHouseholds = joined.households;
          joinedHouseholdId = joined.household.id;
        } catch (joinError) {
          setActionError(`No pudimos usar el enlace del hogar: ${joinError.message}`);
        }
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('join');
        window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
        setPendingJoinCode('');
      }
      setUser(result.user);
      setHouseholds(availableHouseholds);
      setInvitations(result.invitations || []);
      setInvitationsOpen(availableHouseholds.length === 0 && Boolean(result.invitations?.length));
      const savedHouseholdId = localStorage.getItem('en-equipo:active-household');
      setActiveHouseholdId(joinedHouseholdId || (availableHouseholds.some((item) => item.id === savedHouseholdId)
        ? savedHouseholdId
        : availableHouseholds[0]?.id || ''));
    }).catch(async (error) => {
      if (!current) return;
      if (error.status === 401) {
        try {
          const demo = await householdApi.demo();
          if (!current) return;
          setHousehold(demo.household);
          setMembers(demo.members);
          setTasks(demo.tasks);
          setHouseholdRole('owner');
          setGuestMode(true);
        } catch (demoError) {
          if (current) setLoadError(demoError.message);
        }
      } else {
        setLoadError(error.message);
      }
    }).finally(() => {
      if (current) setAuthLoading(false);
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    const theme = user?.theme || (guestMode ? localStorage.getItem('en-equipo:guest-theme') : null) || 'light';
    document.documentElement.dataset.theme = theme;
  }, [user?.theme, guestMode]);

  useEffect(() => {
    if (activeHouseholdId) localStorage.setItem('en-equipo:active-household', activeHouseholdId);
    else localStorage.removeItem('en-equipo:active-household');
  }, [activeHouseholdId]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setHouseholds([]);
      setInvitations([]);
      setActiveHouseholdId('');
      setHousehold(null);
      setTaskDialogOpen(false);
      setMemberDialogOpen(false);
      setHouseholdDialogOpen(false);
      setProfileDialogOpen(false);
      setHelpDialogOpen(false);
    };
    window.addEventListener('en-equipo:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('en-equipo:unauthorized', handleUnauthorized);
  }, []);

  const loadHousehold = useCallback(async () => {
    if (!activeHouseholdId) {
      setHousehold(null);
      setMembers([]);
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const data = await householdApi.getHousehold(activeHouseholdId);
      setHousehold(data.household);
      setMembers(data.members);
      setTasks(data.tasks);
      setHouseholdRole(data.role);
    } catch (error) {
      setLoadError(error.message.includes('Failed to fetch')
        ? 'No pudimos conectar con la API. Revisá que el servidor esté iniciado.'
        : error.message);
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  useEffect(() => {
    if (user && activeHouseholdId) loadHousehold();
    else setLoading(false);
  }, [loadHousehold, user, activeHouseholdId]);

  const activeTasks = useMemo(() => tasks.filter((task) => (task.folder || 'active') === 'active'), [tasks]);
  const archivedTaskCount = useMemo(() => tasks.filter((task) => task.folder === 'archived' && (activeView === 'all' || task.category === activeView)).length, [tasks, activeView]);
  const trashTaskCount = useMemo(() => tasks.filter((task) => task.folder === 'trash' && (activeView === 'all' || task.category === activeView)).length, [tasks, activeView]);
  const draftCount = useMemo(() => taskDrafts.filter((draft) => activeView === 'all' || draft.category === activeView).length, [taskDrafts, activeView]);
  const pendingTasks = useMemo(() => activeTasks.filter((task) => task.status !== 'done'), [activeTasks]);
  const { todayKey, lastDayKey } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDay = new Date(today);
    lastDay.setDate(lastDay.getDate() + 7);
    return { todayKey: toLocalDateKey(today), lastDayKey: toLocalDateKey(lastDay) };
  }, []);
  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es-AR');
    return tasks
      .filter((task) => {
        if (statusFilter === 'archived') return task.folder === 'archived';
        if (statusFilter === 'trash') return task.folder === 'trash';
        if (statusFilter === 'drafts') return false;
        return (task.folder || 'active') === 'active';
      })
      .filter((task) => activeView === 'all' || task.category === activeView)
      .filter((task) => {
        if (statusFilter === 'pending') return task.status !== 'done';
        if (statusFilter === 'upcoming') return task.status !== 'done' && task.dueDate && task.dueDate >= todayKey && task.dueDate <= lastDayKey;
        if (statusFilter === 'done') return task.status === 'done';
        return true;
      })
      .filter((task) => !normalizedQuery || `${task.title} ${task.notes || ''}`.toLocaleLowerCase('es-AR').includes(normalizedQuery))
      .sort((first, second) => {
        if (first.status === 'done' && second.status !== 'done') return 1;
        if (first.status !== 'done' && second.status === 'done') return -1;
        return (first.dueDate || '9999-12-31').localeCompare(second.dueDate || '9999-12-31');
      });
  }, [tasks, activeView, statusFilter, todayKey, lastDayKey, query]);

  const visibleDrafts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es-AR');
    return statusFilter === 'drafts'
      ? taskDrafts.filter((draft) => (activeView === 'all' || draft.category === activeView)
        && (!normalizedQuery || `${draft.title || ''} ${draft.notes || ''}`.toLocaleLowerCase('es-AR').includes(normalizedQuery)))
      : [];
  }, [taskDrafts, activeView, statusFilter, query]);

  const nextWeekCount = useMemo(() => {
    return pendingTasks.filter((task) => task.dueDate && task.dueDate >= todayKey && task.dueDate <= lastDayKey).length;
  }, [pendingTasks, todayKey, lastDayKey]);

  const copy = getViewCopy(activeView);
  const sectionTitle = statusFilter === 'pending'
    ? 'Tareas pendientes'
    : statusFilter === 'upcoming'
      ? 'Para los próximos 7 días'
      : statusFilter === 'done'
        ? 'Tareas hechas'
        : statusFilter === 'archived'
          ? 'Tareas archivadas'
          : statusFilter === 'trash'
            ? 'Papelera'
            : statusFilter === 'drafts'
              ? 'Borradores'
              : copy.section;
  const rawTodayLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const todayLabel = rawTodayLabel.charAt(0).toLocaleUpperCase('es-AR') + rawTodayLabel.slice(1);
  const completedCount = activeTasks.filter((task) => task.status === 'done').length;

  const openNewTask = () => {
    setEditingTask(null);
    setEditingDraft(null);
    setTaskDialogOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setEditingDraft(null);
    setTaskDialogOpen(true);
  };

  const openDraft = (draft) => {
    setEditingTask(null);
    setEditingDraft(draft);
    setTaskDialogOpen(true);
  };

  const updateTaskDraft = (draft, removeId) => {
    if (!taskDraftsKey) return;
    setTaskDraftsState((current) => {
      const currentDrafts = current.key === taskDraftsKey ? current.drafts : [];
      const nextDrafts = removeId
        ? currentDrafts.filter((item) => item.id !== removeId)
        : [draft, ...currentDrafts.filter((item) => item.id !== draft.id)];
      return { key: taskDraftsKey, drafts: nextDrafts };
    });
  };

  const handleSaveTask = async (formData, draftId) => {
    setSavingTask(true);
    setActionError('');
    try {
      if (guestMode && editingTask) {
        const updated = { ...editingTask, ...formData };
        setTasks((current) => current.map((task) => task.id === updated.id ? updated : task));
        setActiveView(updated.category);
      } else if (guestMode) {
        const created = { ...formData, id: `local-${globalThis.crypto?.randomUUID?.() || Date.now()}`, status: 'pending', folder: 'active' };
        setTasks((current) => [created, ...current]);
        setActiveView(created.category);
      } else if (editingTask) {
        const updated = await householdApi.updateTask(activeHouseholdId, editingTask.id, formData);
        setTasks((current) => current.map((task) => task.id === updated.id ? updated : task));
        setActiveView(updated.category);
      } else {
        const created = await householdApi.createTask(activeHouseholdId, formData);
        setTasks((current) => [created, ...current]);
        setActiveView(created.category);
      }
      if (draftId) updateTaskDraft(null, draftId);
      setStatusFilter('all');
      setTaskDialogOpen(false);
      setEditingTask(null);
      setEditingDraft(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSavingTask(false);
    }
  };

  const handleSaveMember = async (name) => {
    setSavingMember(true);
    setActionError('');
    try {
      const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0].toLocaleUpperCase('es-AR')).join('');
      if (guestMode && editingMember) {
        setMembers((current) => current.map((item) => item.id === editingMember.id ? { ...item, name: name.trim(), initials } : item));
      } else if (guestMode) {
        const colors = ['sage', 'blue', 'peach', 'plum'];
        setMembers((current) => [...current, { id: `local-${globalThis.crypto?.randomUUID?.() || Date.now()}`, name: name.trim(), initials, color: colors[current.length % colors.length], role: 'member' }]);
      } else if (editingMember) {
        const member = await householdApi.updateMember(activeHouseholdId, editingMember.id, name);
        setMembers((current) => current.map((item) => item.id === member.id ? { ...item, ...member } : item));
      } else {
        await householdApi.createMember(activeHouseholdId, name);
      }
      if (guestMode || editingMember) {
        setMemberDialogOpen(false);
        setEditingMember(null);
      }
    } finally {
      setSavingMember(false);
    }
  };

  const handleAuthenticated = async (result) => {
    let availableHouseholds = result.households;
    let joinedHouseholdId = '';
    if (pendingJoinCode) {
      try {
        const joined = await householdApi.joinHousehold(pendingJoinCode);
        availableHouseholds = joined.households;
        joinedHouseholdId = joined.household.id;
      } catch (joinError) {
        setActionError(`No pudimos usar el enlace del hogar: ${joinError.message}`);
      }
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('join');
      window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
      setPendingJoinCode('');
    }
    setGuestMode(false);
    setUser(result.user);
    setHouseholds(availableHouseholds);
    setInvitations(result.invitations || []);
    setInvitationsOpen(availableHouseholds.length === 0 && Boolean(result.invitations?.length));
    setHousehold(null);
    setMembers([]);
    setTasks([]);
    setRecoveryCode(result.recoveryCode || '');
    const savedHouseholdId = localStorage.getItem('en-equipo:active-household');
    setActiveHouseholdId(joinedHouseholdId || (availableHouseholds.some((item) => item.id === savedHouseholdId)
      ? savedHouseholdId
      : availableHouseholds[0]?.id || ''));
    setLoadError('');
  };

  const handleBrowseDemo = async () => {
    setLoadError('');
    setLoading(true);
    try {
      const demo = await householdApi.demo();
      setHousehold(demo.household);
      setMembers(demo.members);
      setTasks(demo.tasks);
      setUser(null);
      setHouseholds([]);
      setActiveHouseholdId('');
      setHouseholdRole('owner');
      setGuestMode(true);
      setActiveView('all');
      setStatusFilter('all');
      setLoading(false);
    } catch (error) {
      setLoadError(error.message);
      setLoading(false);
      throw error;
    }
  };

  const handleOpenAuth = () => {
    setGuestMode(false);
  };

  const handleReturnToGuest = () => {
    setLoadError('');
    setGuestMode(true);
  };

  const handleHouseholdComplete = (result) => {
    setHouseholds(result.households);
    setHouseholdDialogOpen(false);
    setActiveHouseholdId(result.household.id);
    setActiveView('all');
    setStatusFilter('all');
    setQuery('');
  };

  const handleRefreshMemberships = async () => {
    const result = await householdApi.listHouseholds();
    const newlyJoined = result.households.find((item) => !households.some((existing) => existing.id === item.id));
    setHouseholds(result.households);
    return newlyJoined ? { household: newlyJoined, households: result.households } : null;
  };

  const handleSelectHousehold = (householdId) => {
    setHousehold(null);
    setMembers([]);
    setTasks([]);
    setTaskDialogOpen(false);
    setEditingTask(null);
    setEditingDraft(null);
    setActiveHouseholdId(householdId);
    setActiveView('all');
    setStatusFilter('all');
    setQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProfile = async (profile) => {
    setSavingProfile(true);
    try {
      const updatedUser = await householdApi.updateProfile(profile);
      setUser(updatedUser);
      setMembers((current) => current.map((member) => {
        if (!member.isCurrentUser) return member;
        return {
          ...member,
          ...(member.isCurrentUser ? { name: updatedUser.name, initials: updatedUser.initials } : {}),
          color: updatedUser.color,
          avatarData: updatedUser.avatarData,
        };
      }));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRotateRecoveryCode = async (password) => householdApi.rotateRecoveryCode(password);

  const handleSignOut = async () => {
    try {
      await householdApi.logout();
      setUser(null);
      setGuestMode(false);
      setHouseholds([]);
      setInvitations([]);
      setActiveHouseholdId('');
      setHousehold(null);
      setProfileDialogOpen(false);
      await handleBrowseDemo();
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleInvitationDecision = async (invitation, decision) => {
    const result = await householdApi.resolveInvitation(invitation.id, decision);
    setInvitations(result.invitations || []);
    setHouseholds(result.households || []);
    if (result.accepted && result.household) {
      setInvitationsOpen(false);
      handleHouseholdComplete({ household: result.household, households: result.households });
    }
  };

  const handleDeleteMember = async (member) => {
    const leaving = member.isCurrentUser;
    setActionError('');
    if (guestMode) {
      setMembers((current) => current.filter((item) => item.id !== member.id));
      setTasks((current) => current.map((task) => task.assigneeId === member.id ? { ...task, assigneeId: null } : task));
      return true;
    }
    try {
      await householdApi.deleteMember(activeHouseholdId, member.id);
      if (leaving) {
        const result = await householdApi.listHouseholds();
        setHouseholds(result.households);
        setHousehold(null);
        setActiveHouseholdId(result.households[0]?.id || '');
      } else {
        setMembers((current) => current.filter((item) => item.id !== member.id));
        setTasks((current) => current.map((task) => task.assigneeId === member.id ? { ...task, assigneeId: null } : task));
      }
      return true;
    } catch (error) {
      setActionError(error.message);
      return false;
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setRemovingMember(true);
    const removed = await handleDeleteMember(memberToRemove);
    setRemovingMember(false);
    if (removed) setMemberToRemove(null);
  };

  const handleToggleTask = async (task) => {
    if ((task.folder || 'active') !== 'active') return;
    setActionError('');
    const previousTask = task;
    const status = task.status === 'done' ? 'pending' : 'done';
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status } : item));
    if (guestMode) return;
    try {
      const updated = await householdApi.updateTask(activeHouseholdId, task.id, { status });
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      setTasks((current) => current.map((item) => item.id === previousTask.id ? previousTask : item));
      setActionError(error.message);
    }
  };

  const changeTaskFolder = async (task, folder) => {
    setActionError('');
    const previousTasks = tasks;
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, folder } : item));
    if (guestMode) return true;
    try {
      const updated = await householdApi.updateTask(activeHouseholdId, task.id, { folder });
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
      return true;
    } catch (error) {
      setTasks(previousTasks);
      setActionError(error.message);
      return false;
    }
  };

  const permanentlyDeleteTask = async (task) => {
    setActionError('');
    const previousTasks = tasks;
    setTasks((current) => current.filter((item) => item.id !== task.id));
    if (guestMode) return true;
    try {
      await householdApi.deleteTask(activeHouseholdId, task.id);
      return true;
    } catch (error) {
      setTasks(previousTasks);
      setActionError(error.message);
      return false;
    }
  };

  const askToArchiveTask = (task) => { setActionError(''); setTaskAction({ type: 'archive', task }); };
  const askToDeleteTask = (task) => { setActionError(''); setTaskAction({ type: task.folder === 'trash' ? 'permanent-delete' : 'trash', task }); };
  const askToDeleteDraft = (draft) => { setActionError(''); setTaskAction({ type: 'delete-draft', draft }); };

  const handleRestoreTask = async (task) => {
    setSavingTaskAction(true);
    const restored = await changeTaskFolder(task, 'active');
    setSavingTaskAction(false);
    if (restored) {
      setActiveView(task.category);
      setStatusFilter('all');
    }
  };

  const confirmTaskAction = async () => {
    if (!taskAction) return;
    setActionError('');
    setSavingTaskAction(true);
    let completed = false;
    if (taskAction.type === 'archive') completed = await changeTaskFolder(taskAction.task, 'archived');
    if (taskAction.type === 'trash') completed = await changeTaskFolder(taskAction.task, 'trash');
    if (taskAction.type === 'permanent-delete') completed = await permanentlyDeleteTask(taskAction.task);
    if (taskAction.type === 'delete-draft') {
      updateTaskDraft(null, taskAction.draft.id);
      completed = true;
    }
    setSavingTaskAction(false);
    if (completed) setTaskAction(null);
  };

  const handleNavigate = (view) => {
    setActiveView(view);
    setStatusFilter('all');
    setMobileNavOpen(false);
    setQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showTaskFilter = (filter) => {
    setActiveView('all');
    setStatusFilter(filter);
    setQuery('');
    setMobileNavOpen(false);
    requestAnimationFrame(() => document.getElementById('task-section-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const navigateToCategory = (category) => {
    setActiveView(category);
    setQuery('');
    setMobileNavOpen(false);
    requestAnimationFrame(() => document.getElementById('task-section-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  if (authLoading) {
    return <main className="auth-loading"><span className="loading-spinner" />Preparando tu espacio…</main>;
  }

  if (!user && !guestMode) return <AuthScreen onAuthenticated={handleAuthenticated} onReturnToGuest={handleReturnToGuest} pendingJoinCode={pendingJoinCode} />;

  if (user && !households.length) {
    return <><HouseholdDialog open required onComplete={handleHouseholdComplete} /><HouseholdInvitationsDialog open={invitationsOpen} invitations={invitations} onClose={() => setInvitationsOpen(false)} onDecision={handleInvitationDecision} /><RecoveryCodeDialog code={recoveryCode} onClose={() => setRecoveryCode('')} /></>;
  }

  const displayUser = user || { id: 'guest', name: '', initials: 'V', color: 'sage' };

  return (
    <div className={`app-shell${mobileNavOpen ? ' app-shell--nav-open' : ''}`}>
      {mobileNavOpen && (
        <button
          className="mobile-scrim"
          aria-label="Cerrar menú de navegación"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        onAddMember={() => { setEditingMember(null); setMemberDialogOpen(true); }}
        onEditMember={(member) => { setEditingMember(member); setMemberDialogOpen(true); }}
        onDeleteMember={(member) => setMemberToRemove(member)}
        onManageHouseholds={() => guestMode ? handleOpenAuth() : setHouseholdDialogOpen(true)}
        onSelectHousehold={handleSelectHousehold}
        household={household}
        households={households}
        members={members}
        householdRole={householdRole}
        pendingCount={pendingTasks.length}
        guest={guestMode}
      />

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu-button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <div className="topbar__date"><span className="topbar__date-dot" />{todayLabel}</div>
          <div className="topbar__actions">
            <button className="topbar__help" aria-label="Ayuda, guía y preguntas frecuentes" onClick={() => setHelpDialogOpen(true)}>
              <CircleHelp size={17} />
              <span>Ayuda</span>
            </button>
      <NotificationPopover tasks={activeTasks} onNavigate={handleNavigate} />
            {!guestMode && <button className="icon-button topbar__notification" aria-label={`Invitaciones a hogares${invitations.length ? `: ${invitations.length} pendientes` : ''}`} title="Invitaciones a hogares" onClick={() => setInvitationsOpen(true)}><Mail size={18} />{invitations.length > 0 && <span />}</button>}
            <button className={`topbar__account${guestMode ? ' topbar__account--guest' : ''}`} aria-label={guestMode ? 'Iniciar sesión para guardar cambios' : `Cuenta de ${user.name}`} onClick={guestMode ? handleOpenAuth : () => setProfileDialogOpen(true)} title={guestMode ? 'Iniciá sesión para guardar cambios' : 'Abrir cuenta'}>
              {guestMode ? <span>Iniciar sesión</span> : <Avatar member={displayUser} size="small" />}
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
          <div className="welcome-row__copy">
              <div className="eyebrow welcome-row__eyebrow">{guestMode ? `${greeting}, estás en casa` : `${greeting}, ${displayUser.name}`} <span>✳</span></div>
              <h1>{copy.title}</h1>
              <p>{copy.subtitle}</p>
            </div>
            <button className="button button--primary create-button" onClick={openNewTask}>
              <Plus size={17} strokeWidth={2.4} />
              <span>Nueva tarea</span>
            </button>
          </section>

          {loadError && (
            <section className="error-banner" role="alert">
              <span>{loadError}</span>
              <button className="text-link" onClick={loadHousehold}>Reintentar</button>
            </section>
          )}
          {actionError && (
            <section className="error-banner error-banner--action" role="alert">
              <span>{actionError}</span>
              <button aria-label="Cerrar mensaje" onClick={() => setActionError('')}>×</button>
            </section>
          )}

          <section className="stats-grid" aria-label="Resumen semanal">
            <button type="button" className="stat-card stat-card--main" onClick={() => showTaskFilter('pending')} aria-label={`Ver ${pendingTasks.length} tareas pendientes en casa`}>
              <span className="stat-card__label">Pendientes en casa</span>
              <span className="stat-card__value">{pendingTasks.length}<small> por compartir</small></span>
              <span className="stat-card__foot"><span className="stat-card__dot stat-card__dot--green" />Ver tareas pendientes <span aria-hidden="true">→</span></span>
              <span className="stat-card__deco stat-card__deco--circle" />
            </button>
            <button type="button" className="stat-card" onClick={() => showTaskFilter('upcoming')} aria-label={`Ver ${nextWeekCount} tareas para los próximos siete días`}>
              <span className="stat-card__label">Para los próximos 7 días</span>
              <span className="stat-card__value">{nextWeekCount}<small> pendientes</small></span>
              <span className="stat-card__foot"><span className="stat-card__dot stat-card__dot--amber" />Ver próximas tareas <span aria-hidden="true">→</span></span>
              <span className="stat-card__deco stat-card__deco--sun" />
            </button>
            <button type="button" className="stat-card" onClick={() => showTaskFilter('done')} aria-label={`Ver ${completedCount} tareas hechas`}>
              <span className="stat-card__label">Tareas hechas</span>
              <span className="stat-card__value">{completedCount}<small> en casa</small></span>
              <span className="stat-card__foot"><span className="stat-card__dot stat-card__dot--blue" />Ver lo que ya se hizo <span aria-hidden="true">→</span></span>
              <span className="stat-card__deco stat-card__deco--leaf">⌁</span>
            </button>
          </section>

          <div className="workspace-grid">
            <section className="task-board" aria-labelledby="task-section-title">
              <div className="task-board__heading">
                <div>
                  <span className="eyebrow">UN PASO A LA VEZ</span>
                  <h2 id="task-section-title">{sectionTitle}<span className="task-board__count">{statusFilter === 'drafts' ? visibleDrafts.length : visibleTasks.length}</span></h2>
                </div>
                <button className="button button--outline task-board__add" onClick={openNewTask}>
                  <Plus size={16} />
                  <span>Agregar</span>
                </button>
              </div>

              <div className="task-toolbar">
                <div className="status-tabs" role="tablist" aria-label="Filtrar tareas por estado">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'pending', label: 'Pendientes' },
                    { id: 'upcoming', label: 'Próximos 7 días' },
                    { id: 'done', label: 'Hechas' },
                    { id: 'drafts', label: 'Borradores', count: draftCount },
                    { id: 'archived', label: 'Archivadas', count: archivedTaskCount },
                    { id: 'trash', label: 'Papelera', count: trashTaskCount },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={statusFilter === tab.id}
                      className={`status-tab${statusFilter === tab.id ? ' status-tab--active' : ''}`}
                      onClick={() => { setStatusFilter(tab.id); setQuery(''); }}
                    >
                      {tab.label}{tab.count > 0 && <small className="status-tab__count">{tab.count}</small>}
                    </button>
                  ))}
                </div>
                <label className="task-search">
                  <Search size={15} />
                  <input
                    aria-label="Buscar tareas"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar"
                  />
                </label>
              </div>

              {loading ? (
                <div className="state-message"><span className="loading-spinner" />Cargando la casa…</div>
              ) : statusFilter === 'drafts' && visibleDrafts.length ? (
                <div className="task-drafts">
                  {visibleDrafts.map((draft) => <TaskDraftItem key={draft.id} draft={draft} onContinue={openDraft} onDelete={askToDeleteDraft} />)}
                </div>
              ) : visibleTasks.length ? (
                activeView === 'all' && !['archived', 'trash'].includes(statusFilter) ? (
                  <div className="category-sections">
                    {Object.entries(CATEGORIES).map(([categoryId, category]) => {
                      const categoryTasks = visibleTasks.filter((task) => task.category === categoryId);
                      return (
                        <section className="category-section" key={categoryId} aria-label={category.label}>
                          <div className="category-section__heading">
                            <div><h3>{category.label}</h3><span>{categoryTasks.length} {categoryTasks.length === 1 ? 'tarea' : 'tareas'}</span></div>
                            <button className="text-link" onClick={() => navigateToCategory(categoryId)}>Ver sección <span>→</span></button>
                          </div>
                          {categoryTasks.length ? (
                            <div className="task-list">
                              {categoryTasks.slice(0, 3).map((task) => (
                                <TaskItem
                                  key={task.id}
                                  task={task}
                                  member={members.find((member) => member.id === task.assigneeId)}
                                  onToggle={handleToggleTask}
                                  onEdit={openEditTask}
                                  onArchive={askToArchiveTask}
                                  onDelete={askToDeleteTask}
                                  onRestore={handleRestoreTask}
                                  readOnly={false}
                                />
                              ))}
                            </div>
                          ) : <p className="category-section__empty">No hay tareas para este filtro.</p>}
                          {categoryTasks.length > 3 && <button className="text-link category-section__more" onClick={() => navigateToCategory(categoryId)}>Ver las {categoryTasks.length} tareas <span>→</span></button>}
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <div className="task-list">
                    {visibleTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        member={members.find((member) => member.id === task.assigneeId)}
                        onToggle={handleToggleTask}
                        onEdit={openEditTask}
                        onArchive={askToArchiveTask}
                        onDelete={askToDeleteTask}
                        onRestore={handleRestoreTask}
                        readOnly={false}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="empty-state">
                  <span className="empty-state__icon"><Check size={22} /></span>
                  <h3>{query ? 'No encontramos eso' : statusFilter === 'drafts' ? 'No hay borradores guardados.' : statusFilter === 'archived' ? 'No hay tareas archivadas.' : statusFilter === 'trash' ? 'La papelera está vacía.' : statusFilter === 'done' ? 'Todavía no hay tareas hechas.' : statusFilter === 'upcoming' ? 'No hay tareas para los próximos 7 días.' : statusFilter === 'pending' ? 'Todo está al día.' : activeView === 'all' ? 'Todavía no hay tareas.' : 'No hay tareas en esta sección.'}</h3>
                  <p>{query ? 'Probá con otra palabra.' : statusFilter === 'drafts' ? 'Al escribir una tarea, queda guardada acá automáticamente hasta que la publiques.' : statusFilter === 'archived' ? 'Las tareas archivadas se pueden restaurar cuando vuelvan a hacer falta.' : statusFilter === 'trash' ? 'Las tareas que mandes a la papelera se pueden restaurar antes de eliminarlas definitivamente.' : statusFilter === 'pending' || statusFilter === 'upcoming' ? 'Podés revisar las tareas hechas o sumar algo nuevo.' : 'Si aparece algo nuevo, pueden sumarlo en equipo.'}</p>
                  {!query && !['archived', 'trash', 'drafts'].includes(statusFilter) && <button className="button button--outline" onClick={openNewTask}><Plus size={15} />Sumar una tarea</button>}
                </div>
              )}

              {!loading && visibleTasks.length > 0 && statusFilter !== 'drafts' && (
                <div className="task-board__footer">
                  <span><span className="footer-check"><Check size={11} /></span>{completedCount} tareas resueltas entre todos</span>
                  <button className="text-link" onClick={() => handleNavigate(activeView === 'all' ? 'chores' : 'all')}>
                    {activeView === 'all' ? 'Ver tareas del hogar' : 'Ver todo'} <span>→</span>
                  </button>
                </div>
              )}
            </section>

            <HouseholdPulse members={members} tasks={activeTasks} onNavigate={handleNavigate} />
          </div>

          <footer className="page-footer">
            <span><Sparkles size={13} />Lo compartido se siente más liviano.</span>
            <span>En Equipo · Hecho para convivir mejor</span>
          </footer>
        </div>
      </main>

      <TaskFormDialog
        open={taskDialogOpen}
        members={members}
        initialCategory={activeView}
        initialTask={editingTask}
        initialDraft={editingDraft}
        onDraftChange={updateTaskDraft}
        onClose={() => { setTaskDialogOpen(false); setEditingTask(null); setEditingDraft(null); }}
        onSubmit={handleSaveTask}
        saving={savingTask}
        guest={guestMode}
      />
      <MemberFormDialog
        open={memberDialogOpen}
        initialMember={editingMember}
        guest={guestMode}
        onClose={() => { setMemberDialogOpen(false); setEditingMember(null); }}
        onSubmit={handleSaveMember}
        saving={savingMember}
      />
      <ConfirmDialog
        open={Boolean(memberToRemove)}
        title={memberToRemove?.isCurrentUser ? 'Salir de este hogar' : `Quitar a ${memberToRemove?.name || 'esta persona'}`}
        message={memberToRemove?.isCurrentUser
          ? `Vas a dejar de ver las tareas de “${household?.name || 'este hogar'}”. Podés volver a unirte con el código del hogar.`
          : `¿Querés quitar a ${memberToRemove?.name || 'esta persona'} de “${household?.name || 'este hogar'}”? Sus tareas asignadas quedarán sin responsable.`}
        confirmLabel={memberToRemove?.isCurrentUser ? 'Salir del hogar' : 'Quitar integrante'}
        onCancel={() => setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
        saving={removingMember}
      />
      <ConfirmDialog
        open={Boolean(taskAction)}
        title={taskAction?.type === 'archive'
          ? `Archivar “${taskAction.task.title}”?`
          : taskAction?.type === 'trash'
            ? `Mover “${taskAction.task.title}” a la papelera?`
            : taskAction?.type === 'permanent-delete'
              ? `Eliminar “${taskAction.task.title}” definitivamente?`
              : `Eliminar borrador “${taskAction?.draft?.title || 'sin título'}”?`}
        message={actionError || (taskAction?.type === 'archive'
          ? 'La tarea saldrá de las listas habituales. Podés restaurarla cuando vuelva a hacer falta.'
          : taskAction?.type === 'trash'
            ? 'La tarea se moverá a la papelera. Podés restaurarla; para borrarla definitivamente habrá una confirmación final.'
            : taskAction?.type === 'permanent-delete'
              ? 'Esta es la confirmación final. La tarea se eliminará del hogar y no se podrá recuperar.'
              : 'Este borrador se eliminará de este dispositivo y no se podrá recuperar.')}
        confirmLabel={taskAction?.type === 'archive' ? 'Archivar tarea' : taskAction?.type === 'trash' ? 'Mover a papelera' : taskAction?.type === 'permanent-delete' ? 'Eliminar definitivamente' : 'Eliminar borrador'}
        confirmVariant={taskAction?.type === 'archive' ? 'primary' : 'danger'}
        onCancel={() => setTaskAction(null)}
        onConfirm={confirmTaskAction}
        saving={savingTaskAction}
      />
      <HouseholdDialog
        open={householdDialogOpen}
        activeHousehold={{ ...households.find((item) => item.id === activeHouseholdId), joinRequests: household?.joinRequests || [] }}
        onClose={() => setHouseholdDialogOpen(false)}
        onComplete={handleHouseholdComplete}
        onRefresh={loadHousehold}
        onRefreshMemberships={handleRefreshMemberships}
      />
      <HouseholdInvitationsDialog
        open={invitationsOpen}
        invitations={invitations}
        onClose={() => setInvitationsOpen(false)}
        onDecision={handleInvitationDecision}
      />
      <ProfileDialog
        open={profileDialogOpen}
        user={user}
        onClose={() => setProfileDialogOpen(false)}
        onSubmit={handleSaveProfile}
        onRotateRecoveryCode={handleRotateRecoveryCode}
        onSignOut={handleSignOut}
        saving={savingProfile}
      />
      <RecoveryCodeDialog code={recoveryCode} onClose={() => setRecoveryCode('')} />
      <HelpDialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        onCreateTask={openNewTask}
        onAddMember={() => { setEditingMember(null); setMemberDialogOpen(true); }}
        onManageHouseholds={() => setHouseholdDialogOpen(true)}
        canManageMembers={householdRole === 'owner'}
        guest={guestMode}
      />
    </div>
  );
}

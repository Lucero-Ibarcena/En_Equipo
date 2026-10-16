'use client';

// [INTERFAZ: APLICACIÓN] Coordina la navegación, los datos de pantalla y los cuadros de diálogo.
import { useCallback, useEffect, useMemo, useState } from 'react';
import HouseholdPulse from '../../household/components/HouseholdPulse.jsx';
import FraseDelDia from '../../motivacion/components/FraseDelDia.jsx';
import AuthScreen from '../../auth/components/AuthScreen.jsx';
import HouseholdDialog from '../../household/components/HouseholdDialog.jsx';
import HouseholdInvitationsDialog from '../../household/components/HouseholdInvitationsDialog.jsx';
import Sidebar from '../../household/components/Sidebar.jsx';
import WeatherCard from '../../external-api/components/WeatherCard.jsx';
import ApplicationDialogs from './dialogs/ApplicationDialogs.jsx';
import Topbar from './layout/Topbar.jsx';
import ApplicationMessages from './dashboard/ApplicationMessages.jsx';
import WelcomeSection from './dashboard/WelcomeSection.jsx';
import WeeklyStats from './dashboard/WeeklyStats.jsx';
import PageFooter from './dashboard/PageFooter.jsx';
import TaskBoard from './tasks/TaskBoard.jsx';
import { CATEGORIES, getGreeting, toLocalDateKey } from '../../household/householdUtils.js';
import { getViewCopy } from '../utils/viewCopy.js';
import { householdApi } from '../../../services/api.js';
export default function App({ initialJoinCode = '' }) {
  // [ESTADO: SESIÓN, HOGAR Y CONTROLES DE PANTALLA]
  const [authLoading, setAuthLoading] = useState(true);
  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [previewTheme, setPreviewTheme] = useState('light');
  const [user, setUser] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [invitationsOpen, setInvitationsOpen] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState(initialJoinCode);
  const [households, setHouseholds] = useState([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState('');
  const [household, setHousehold] = useState(null);
  const [householdRole, setHouseholdRole] = useState('member');
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationTaskId, setNotificationTaskId] = useState('');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [taskDraftsState, setTaskDraftsState] = useState({
    key: '',
    drafts: [],
  });
  const [taskAction, setTaskAction] = useState(null);
  const [savingTaskAction, setSavingTaskAction] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [householdDialogOpen, setHouseholdDialogOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryDeleteError, setCategoryDeleteError] = useState('');
  const [householdInviteOpen, setHouseholdInviteOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting);

  // [DATOS: BORRADORES] Mantiene borradores separados por persona y hogar.
  const taskDraftsKey =
    user && activeHouseholdId ? `en-equipo:task-drafts:${user.id}:${activeHouseholdId}` : '';
  const taskDrafts = taskDraftsState.key === taskDraftsKey ? taskDraftsState.drafts : [];
  useEffect(() => {
    if (!taskDraftsKey) {
      setTaskDraftsState({
        key: '',
        drafts: [],
      });
      return;
    }
    let drafts = [];
    if (user) {
      try {
        const stored = JSON.parse(localStorage.getItem(taskDraftsKey) || '[]');
        if (Array.isArray(stored))
          drafts = stored.filter((item) => item && typeof item.id === 'string');
      } catch {
        drafts = [];
      }
    }
    setTaskDraftsState({
      key: taskDraftsKey,
      drafts,
    });
  }, [taskDraftsKey, user?.id]);
  useEffect(() => {
    if (!user || !taskDraftsKey || taskDraftsState.key !== taskDraftsKey) return;
    try {
      localStorage.setItem(taskDraftsKey, JSON.stringify(taskDraftsState.drafts));
    } catch {
      setActionError(
        'No pudimos guardar los borradores en este dispositivo. ' +
          'Revisá el espacio disponible del navegador.'
      );
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
    householdApi
      .me()
      .then(async (result) => {
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
          window.history.replaceState(
            {},
            '',
            `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
          );
          setPendingJoinCode('');
        }
        setUser(result.user);
        setHouseholds(availableHouseholds);
        setInvitations(result.invitations || []);
        setInvitationsOpen(availableHouseholds.length === 0 && Boolean(result.invitations?.length));
        const savedHouseholdId = localStorage.getItem('en-equipo:active-household');
        setActiveHouseholdId(
          joinedHouseholdId ||
            (availableHouseholds.some((item) => item.id === savedHouseholdId)
              ? savedHouseholdId
              : availableHouseholds[0]?.id || '')
        );
      })
      .catch(async (error) => {
        if (!current) return;
        if (error.status === 401) {
          try {
            const demo = await householdApi.demo();
            if (!current) return;
            setHousehold({
              ...demo.household,
              categories: demo.categories,
            });
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
      })
      .finally(() => {
        if (current) setAuthLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    const theme = user?.theme || (guestMode ? previewTheme : 'light');
    document.documentElement.dataset.theme = theme;
  }, [user?.theme, guestMode, previewTheme]);
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
      setLoadError(
        error.message.includes('Failed to fetch')
          ? 'No pudimos conectar con la API. Revisá que el servidor esté iniciado.'
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);
  useEffect(() => {
    if (user && activeHouseholdId) loadHousehold();
    else setLoading(false);
  }, [loadHousehold, user, activeHouseholdId]);
  useEffect(() => {
    if (!notificationTaskId) return undefined;
    let highlightTimer;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`task-${notificationTaskId}`);
      if (!target) return;
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      target.classList.add('task-item--notification-target');
      highlightTimer = window.setTimeout(() => {
        target.classList.remove('task-item--notification-target');
        setNotificationTaskId('');
      }, 2200);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (highlightTimer) window.clearTimeout(highlightTimer);
    };
  }, [notificationTaskId, activeView, statusFilter, query, loading]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const tabs = document.querySelector('.status-tabs');
      const selected = tabs?.querySelector('[aria-selected="true"]');
      if (!tabs || !selected) return;
      const tabsBounds = tabs.getBoundingClientRect();
      const selectedBounds = selected.getBoundingClientRect();
      if (selectedBounds.left < tabsBounds.left)
        tabs.scrollBy({
          left: selectedBounds.left - tabsBounds.left - 8,
          behavior: 'smooth',
        });
      else if (selectedBounds.right > tabsBounds.right)
        tabs.scrollBy({
          left: selectedBounds.right - tabsBounds.right + 8,
          behavior: 'smooth',
        });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [statusFilter, guestMode]);

  // [DATOS: VISTAS Y FILTROS] Prepara conteos y listas visibles para el tablero.
  const activeTasks = useMemo(
    () => tasks.filter((task) => (task.folder || 'active') === 'active'),
    [tasks]
  );
  const categoryMap = useMemo(
    () =>
      Object.fromEntries(
        (
          household?.categories ||
          Object.entries(CATEGORIES).map(([id, category]) => ({
            id,
            ...category,
            builtIn: true,
          }))
        ).map((category) => [category.id, category])
      ),
    [household?.categories]
  );
  const archivedTaskCount = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.folder === 'archived' && (activeView === 'all' || task.category === activeView)
      ).length,
    [tasks, activeView]
  );
  const trashTaskCount = useMemo(
    () =>
      tasks.filter(
        (task) => task.folder === 'trash' && (activeView === 'all' || task.category === activeView)
      ).length,
    [tasks, activeView]
  );
  const draftCount = useMemo(
    () =>
      taskDrafts.filter((draft) => activeView === 'all' || draft.category === activeView).length,
    [taskDrafts, activeView]
  );
  const pendingTasks = useMemo(
    () => activeTasks.filter((task) => task.status !== 'done'),
    [activeTasks]
  );
  const { todayKey, lastDayKey } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDay = new Date(today);
    lastDay.setDate(lastDay.getDate() + 7);
    return {
      todayKey: toLocalDateKey(today),
      lastDayKey: toLocalDateKey(lastDay),
    };
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
        if (statusFilter === 'upcoming')
          return (
            task.status !== 'done' &&
            task.dueDate &&
            task.dueDate >= todayKey &&
            task.dueDate <= lastDayKey
          );
        if (statusFilter === 'done') return task.status === 'done';
        return true;
      })
      .filter(
        (task) =>
          !normalizedQuery ||
          `${task.title} ${task.notes || ''}`.toLocaleLowerCase('es-AR').includes(normalizedQuery)
      )
      .sort((first, second) => {
        if (first.status === 'done' && second.status !== 'done') return 1;
        if (first.status !== 'done' && second.status === 'done') return -1;
        return (first.dueDate || '9999-12-31').localeCompare(second.dueDate || '9999-12-31');
      });
  }, [tasks, activeView, statusFilter, todayKey, lastDayKey, query]);
  const visibleDrafts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es-AR');
    return statusFilter === 'drafts'
      ? taskDrafts.filter(
          (draft) =>
            (activeView === 'all' || draft.category === activeView) &&
            (!normalizedQuery ||
              `${draft.title || ''} ${draft.notes || ''}`
                .toLocaleLowerCase('es-AR')
                .includes(normalizedQuery))
        )
      : [];
  }, [taskDrafts, activeView, statusFilter, query]);
  const nextWeekCount = useMemo(() => {
    return pendingTasks.filter(
      (task) => task.dueDate && task.dueDate >= todayKey && task.dueDate <= lastDayKey
    ).length;
  }, [pendingTasks, todayKey, lastDayKey]);
  const copy = getViewCopy(activeView, categoryMap);
  const sectionTitle =
    statusFilter === 'pending'
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
  const rawShortTodayLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());
  const shortTodayLabel =
    rawShortTodayLabel.charAt(0).toLocaleUpperCase('es-AR') + rawShortTodayLabel.slice(1);
  const completedCount = activeTasks.filter((task) => task.status === 'done').length;

  // [ACCIONES: TAREAS] Crear, editar y guardar tareas o borradores.
  const openNewTask = () => {
    if (guestMode) {
      handleOpenAuth('login');
      return;
    }
    setEditingTask(null);
    setEditingDraft(null);
    setTaskDialogOpen(true);
  };
  const openEditTask = (task) => {
    if (guestMode) {
      handleOpenAuth('login');
      return;
    }
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
      return {
        key: taskDraftsKey,
        drafts: nextDrafts,
      };
    });
  };
  const handleSaveTask = async (formData, draftId) => {
    if (guestMode) {
      handleOpenAuth('login');
      return;
    }
    setSavingTask(true);
    setActionError('');
    try {
      if (editingTask) {
        const updated = await householdApi.updateTask(activeHouseholdId, editingTask.id, formData);
        setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
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
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } finally {
      setSavingTask(false);
    }
  };
  const handleSaveMember = async (name) => {
    if (guestMode) {
      handleOpenAuth('login');
      return;
    }
    setSavingMember(true);
    setActionError('');
    try {
      if (editingMember) {
        const member = await householdApi.updateMember(activeHouseholdId, editingMember.id, name);
        setMembers((current) =>
          current.map((item) =>
            item.id === member.id
              ? {
                  ...item,
                  ...member,
                }
              : item
          )
        );
      } else {
        await householdApi.createMember(activeHouseholdId, name);
      }
      if (editingMember) {
        setMemberDialogOpen(false);
        setEditingMember(null);
      }
    } finally {
      setSavingMember(false);
    }
  };

  // [ACCIONES: SESIÓN Y HOGARES] Entrada, salida y selección del hogar activo.
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
      window.history.replaceState(
        {},
        '',
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
      );
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
    const savedHouseholdId = localStorage.getItem('en-equipo:active-household');
    setActiveHouseholdId(
      joinedHouseholdId ||
        (availableHouseholds.some((item) => item.id === savedHouseholdId)
          ? savedHouseholdId
          : availableHouseholds[0]?.id || '')
    );
    setLoadError('');
  };
  const handleBrowseDemo = async () => {
    setLoadError('');
    setLoading(true);
    try {
      const demo = await householdApi.demo();
      setHousehold({
        ...demo.household,
        categories: demo.categories,
      });
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
  const handleOpenAuth = (mode = 'login') => {
    setAuthInitialMode(mode);
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
  const handleRenameHousehold = async (name) => {
    const result = await householdApi.renameHousehold(activeHouseholdId, name);
    setHouseholds(result.households);
    setHousehold((current) =>
      current?.id === activeHouseholdId
        ? {
            ...current,
            ...result.household,
          }
        : current
    );
    return result;
  };
  const handleRefreshMemberships = async () => {
    const result = await householdApi.listHouseholds();
    const newlyJoined = result.households.find(
      (item) => !households.some((existing) => existing.id === item.id)
    );
    setHouseholds(result.households);
    return newlyJoined
      ? {
          household: newlyJoined,
          households: result.households,
        }
      : null;
  };
  const handleSelectHousehold = (householdId) => {
    setHouseholdRole(households.find((item) => item.id === householdId)?.role || 'member');
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
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // [ACCIONES: PERFIL Y CATEGORÍAS] Actualiza datos personales y secciones del hogar.
  const handleSaveProfile = async (profile) => {
    setSavingProfile(true);
    try {
      const updatedUser = await householdApi.updateProfile(profile);
      setUser(updatedUser);
      setMembers((current) =>
        current.map((member) => {
          if (!member.isCurrentUser) return member;
          return {
            ...member,
            ...(member.isCurrentUser
              ? {
                  name: updatedUser.name,
                  initials: updatedUser.initials,
                }
              : {}),
            color: updatedUser.color,
            avatarData: updatedUser.avatarData,
          };
        })
      );
    } finally {
      setSavingProfile(false);
    }
  };
  const handlePhoneVerified = (updatedUser) => setUser(updatedUser);
  const saveCategory = async (categoryId, changes) => {
    if (guestMode) {
      handleOpenAuth('login');
      return;
    }
    setSavingCategory(true);
    try {
      const result = categoryId
        ? await householdApi.updateCategory(activeHouseholdId, categoryId, changes)
        : await householdApi.createCategory(activeHouseholdId, changes);
      setHousehold((current) => ({
        ...current,
        categories: result.categories || [
          ...Object.values(categoryMap).filter((item) => item.id !== result.category.id),
          result.category,
        ],
      }));
    } finally {
      setSavingCategory(false);
    }
  };
  const handleCreateCategory = (changes) => saveCategory('', changes);
  const handleUpdateCategory = (categoryId, changes) => saveCategory(categoryId, changes);

  // [CATEGORÍAS] Confirma el borrado definitivo de las tareas y borradores asociados.
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setCategoryDeleteError('');
    setSavingCategory(true);
    try {
      const result = await householdApi.deleteCategory(activeHouseholdId, categoryToDelete.id);
      setHousehold((current) => ({
        ...current,
        categories: result.categories,
      }));
      setTasks((current) => current.filter((task) => task.category !== result.deletedCategoryId));
      setTaskDraftsState((current) => ({
        ...current,
        drafts: current.drafts.filter((draft) => draft.category !== result.deletedCategoryId),
      }));
      setActiveView((current) => (current === result.deletedCategoryId ? 'all' : current));
      setCategoryToDelete(null);
    } catch (error) {
      setCategoryDeleteError(error.message);
    } finally {
      setSavingCategory(false);
    }
  };
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
      handleHouseholdComplete({
        household: result.household,
        households: result.households,
      });
    }
  };
  const handleDeleteMember = async (member) => {
    const leaving = member.isCurrentUser;
    setActionError('');
    if (guestMode) {
      setMembers((current) => current.filter((item) => item.id !== member.id));
      setTasks((current) =>
        current.map((task) =>
          task.assigneeId === member.id
            ? {
                ...task,
                assigneeId: null,
              }
            : task
        )
      );
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
        setTasks((current) =>
          current.map((task) =>
            task.assigneeId === member.id
              ? {
                  ...task,
                  assigneeId: null,
                }
              : task
          )
        );
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

  // [ACCIONES: ESTADO DE TAREAS] Completar, archivar, restaurar o eliminar.
  const handleToggleTask = async (task) => {
    if ((task.folder || 'active') !== 'active') return;
    setActionError('');
    const previousTask = task;
    const status = task.status === 'done' ? 'pending' : 'done';
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status,
            }
          : item
      )
    );
    if (guestMode) return;
    try {
      const updated = await householdApi.updateTask(activeHouseholdId, task.id, {
        status,
      });
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      setTasks((current) =>
        current.map((item) => (item.id === previousTask.id ? previousTask : item))
      );
      setActionError(error.message);
    }
  };
  const changeTaskFolder = async (task, folder) => {
    setActionError('');
    const previousTasks = tasks;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              folder,
            }
          : item
      )
    );
    if (guestMode) return true;
    try {
      const updated = await householdApi.updateTask(activeHouseholdId, task.id, {
        folder,
      });
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
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
  const askToArchiveTask = (task) => {
    setActionError('');
    setTaskAction({
      type: 'archive',
      task,
    });
  };
  const askToDeleteTask = (task) => {
    setActionError('');
    setTaskAction({
      type: task.folder === 'trash' ? 'permanent-delete' : 'trash',
      task,
    });
  };
  const askToDeleteDraft = (draft) => {
    setActionError('');
    setTaskAction({
      type: 'delete-draft',
      draft,
    });
  };
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
    if (taskAction.type === 'archive')
      completed = await changeTaskFolder(taskAction.task, 'archived');
    if (taskAction.type === 'trash') completed = await changeTaskFolder(taskAction.task, 'trash');
    if (taskAction.type === 'permanent-delete')
      completed = await permanentlyDeleteTask(taskAction.task);
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
    setSearchOpen(false);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  const handleNavigateToNotificationTask = (task) => {
    setActiveView(task.category);
    setStatusFilter('all');
    setQuery('');
    setSearchOpen(false);
    setMobileNavOpen(false);
    setNotificationTaskId(task.id);
  };
  const showTaskFilter = (filter) => {
    setActiveView('all');
    setStatusFilter(filter);
    setQuery('');
    setSearchOpen(false);
    setMobileNavOpen(false);
    requestAnimationFrame(() =>
      document.getElementById('task-section-title')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    );
  };
  const navigateToCategory = (category) => {
    setActiveView(category);
    setQuery('');
    setSearchOpen(false);
    setMobileNavOpen(false);
    requestAnimationFrame(() =>
      document.getElementById('task-section-title')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    );
  };

  // [INTERFAZ: ACCESO] Decide entre carga, inicio de sesión, configuración y tablero.
  if (authLoading) {
    return (
      <main className="auth-loading">
        <span className="loading-spinner" />
        Preparando tu espacio…
      </main>
    );
  }
  if (!user && !guestMode)
    return (
      <AuthScreen
        initialMode={authInitialMode}
        onAuthenticated={handleAuthenticated}
        onReturnToGuest={handleReturnToGuest}
        pendingJoinCode={pendingJoinCode}
      />
    );
  if (user && !households.length) {
    return (
      <>
        <HouseholdDialog open required onComplete={handleHouseholdComplete} />
        <HouseholdInvitationsDialog
          open={invitationsOpen}
          invitations={invitations}
          onClose={() => setInvitationsOpen(false)}
          onDecision={handleInvitationDecision}
        />
      </>
    );
  }
  const displayUser = user || {
    id: 'guest',
    name: '',
    initials: 'V',
    color: 'sage',
  };

  // [INTERFAZ: TABLERO] Compone navegación, resumen, tareas, avisos y diálogos.
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
        categories={categoryMap}
        onNavigate={handleNavigate}
        onShowInvite={
          !guestMode && household?.inviteCode ? () => setHouseholdInviteOpen(true) : undefined
        }
        onManageCategories={
          !guestMode && household ? () => setCategoryManagerOpen(true) : undefined
        }
        onAddMember={() => {
          setEditingMember(null);
          setMemberDialogOpen(true);
        }}
        onDeleteMember={(member) => setMemberToRemove(member)}
        onManageHouseholds={() => (guestMode ? handleOpenAuth() : setHouseholdDialogOpen(true))}
        onSelectHousehold={handleSelectHousehold}
        household={household}
        households={households}
        members={members}
        householdRole={householdRole}
        pendingCount={pendingTasks.length}
        guest={guestMode}
      />
      <main className="main-content">
        <Topbar
          todayLabel={todayLabel}
          shortTodayLabel={shortTodayLabel}
          guestMode={guestMode}
          previewTheme={previewTheme}
          onTogglePreviewTheme={() =>
            setPreviewTheme((current) => (current === 'light' ? 'dark' : 'light'))
          }
          tasks={activeTasks}
          userId={user?.id}
          householdId={activeHouseholdId}
          onNavigateToTask={handleNavigateToNotificationTask}
          invitations={invitations}
          onOpenInvitations={() => setInvitationsOpen(true)}
          user={user}
          displayUser={displayUser}
          onOpenProfile={() => setProfileDialogOpen(true)}
          onOpenLogin={() => handleOpenAuth('login')}
          onOpenHelp={() => setHelpDialogOpen(true)}
          onOpenMobileMenu={() => setMobileNavOpen(true)}
        />
        <div className="page-content">
          <WelcomeSection
            guestMode={guestMode}
            greeting={greeting}
            displayUser={displayUser}
            copy={copy}
            onCreateTask={openNewTask}
          />
          <FraseDelDia idHogar={household?.id || activeHouseholdId} />
          <ApplicationMessages
            loadError={loadError}
            actionError={actionError}
            onRetry={loadHousehold}
            onDismissActionError={() => setActionError('')}
          />
          {!guestMode && (
            <WeeklyStats
              pendingCount={pendingTasks.length}
              upcomingCount={nextWeekCount}
              completedCount={completedCount}
              onSelectFilter={showTaskFilter}
            />
          )}
          <div className="workspace-grid">
            <TaskBoard
              guestMode={guestMode}
              activeView={activeView}
              statusFilter={statusFilter}
              searchOpen={searchOpen}
              query={query}
              sectionTitle={sectionTitle}
              visibleDrafts={visibleDrafts}
              visibleTasks={visibleTasks}
              draftCount={draftCount}
              archivedTaskCount={archivedTaskCount}
              trashTaskCount={trashTaskCount}
              loading={loading}
              categoryMap={categoryMap}
              members={members}
              completedCount={completedCount}
              onQueryChange={setQuery}
              onCloseSearch={() => {
                setSearchOpen(false);
                setQuery('');
              }}
              onOpenSearch={() => setSearchOpen(true)}
              onAddTask={openNewTask}
              onStatusFilterChange={(filter) => {
                setStatusFilter(filter);
                setQuery('');
                setSearchOpen(false);
              }}
              onContinueDraft={openDraft}
              onDeleteDraft={askToDeleteDraft}
              onNavigateToCategory={navigateToCategory}
              onToggleTask={handleToggleTask}
              onEditTask={openEditTask}
              onArchiveTask={askToArchiveTask}
              onDeleteTask={askToDeleteTask}
              onRestoreTask={handleRestoreTask}
              onLogin={() => handleOpenAuth('login')}
              onNavigate={handleNavigate}
            />
            <HouseholdPulse
              members={members}
              tasks={activeTasks}
              categories={categoryMap}
              onNavigate={handleNavigate}
              preview={guestMode}
              externalContent={<WeatherCard />}
            />
          </div>
          {!guestMode && <PageFooter />}
        </div>
      </main>
      <ApplicationDialogs
        datos={{
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
        }}
        estado={{
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
        }}
        acciones={{
          updateTaskDraft,
          closeTaskDialog: () => {
            setTaskDialogOpen(false);
            setEditingTask(null);
            setEditingDraft(null);
          },
          handleSaveTask,
          closeMemberDialog: () => {
            setMemberDialogOpen(false);
            setEditingMember(null);
          },
          handleSaveMember,
          confirmRemoveMember,
          closeTaskAction: () => setTaskAction(null),
          confirmTaskAction,
          closeHouseholdDialog: () => setHouseholdDialogOpen(false),
          handleHouseholdComplete,
          handleRenameHousehold,
          loadHousehold,
          handleRefreshMemberships,
          closeCategoryManager: () => setCategoryManagerOpen(false),
          handleCreateCategory,
          handleUpdateCategory,
          askToDeleteCategory: (category) => {
            setCategoryDeleteError('');
            setCategoryToDelete(category);
          },
          closeCategoryDeletion: () => {
            setCategoryToDelete(null);
            setCategoryDeleteError('');
          },
          confirmDeleteCategory,
          closeHouseholdInvite: () => setHouseholdInviteOpen(false),
          closeInvitations: () => setInvitationsOpen(false),
          handleInvitationDecision,
          closeProfile: () => setProfileDialogOpen(false),
          handleSaveProfile,
          handlePhoneVerified,
          handleSignOut,
          closeHelp: () => setHelpDialogOpen(false),
          openNewTask,
          openMemberForm: () => {
            if (guestMode) handleOpenAuth('login');
            else {
              setEditingMember(null);
              setMemberDialogOpen(true);
            }
          },
        }}
      />
    </div>
  );
}

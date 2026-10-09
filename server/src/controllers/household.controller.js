import { TASK_CATEGORIES, TASK_STATUSES } from '../config/constants.js';
import {
  createHousehold,
  createTask,
  getHousehold,
  inviteUserToHousehold,
  joinHousehold,
  listUserHouseholds,
  removeHouseholdMember,
  removeTask,
  requestHouseholdJoin,
  resolveHouseholdJoinRequest,
  searchHouseholds,
  updateHouseholdMember,
  updateTask,
} from '../services/household.service.js';

const CODE_ALPHABET = /^[0-9A-HJKMNP-TV-Z]{10}$/;

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export async function listHouseholdsController(request, response, next) {
  try {
    response.json({ households: await listUserHouseholds(request.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function discoverHouseholdsController(request, response, next) {
  try {
    const query = typeof request.query.q === 'string' ? request.query.q : '';
    response.json({ households: await searchHouseholds(query, request.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function requestJoinController(request, response, next) {
  try {
    const result = await requestHouseholdJoin(request.user.id, request.params.householdId);
    if (result.notFound) return response.status(404).json({ error: 'No encontramos ese hogar.' });
    if (result.alreadyMember) return response.status(409).json({ error: 'Ya formás parte de ese hogar.' });
    response.status(202).json({ pending: true });
  } catch (error) {
    next(error);
  }
}

export async function resolveJoinRequestController(request, response, next) {
  try {
    const { decision } = request.body ?? {};
    if (!['approve', 'reject'].includes(decision)) return response.status(400).json({ error: 'Elegí aprobar o rechazar la solicitud.' });
    const result = await resolveHouseholdJoinRequest(request.params.householdId, request.params.requestId, decision === 'approve');
    if (!result) return response.status(404).json({ error: 'La solicitud ya no está disponible.' });
    response.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createHouseholdController(request, response, next) {
  try {
    const { name } = request.body ?? {};
    if (typeof name !== 'string' || !name.trim()) return response.status(400).json({ error: 'Escribí el nombre del hogar.' });
    if (name.trim().length > 60) return response.status(400).json({ error: 'El nombre no puede superar los 60 caracteres.' });
    const household = await createHousehold(request.user.id, name.trim());
    response.status(201).json({ household, households: await listUserHouseholds(request.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function joinHouseholdController(request, response, next) {
  try {
    const { inviteCode } = request.body ?? {};
    if (typeof inviteCode !== 'string' || !inviteCode.trim()) return response.status(400).json({ error: 'Escribí el código del hogar.' });
    const normalizedCode = inviteCode.replaceAll('-', '').replaceAll(' ', '').toLocaleUpperCase('en-US');
    if (!CODE_ALPHABET.test(normalizedCode)) return response.status(400).json({ error: 'El código debe tener 10 caracteres.' });
    const result = await joinHousehold(request.user.id, normalizedCode);
    if (result.notFound) return response.status(404).json({ error: 'No encontramos un hogar con ese código.' });
    response.status(201).json({ household: result.household, households: await listUserHouseholds(request.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function getHouseholdController(request, response, next) {
  try {
    const data = await getHousehold(request.params.householdId, request.user.id);
    if (!data) return response.status(404).json({ error: 'No encontramos ese hogar.' });
    response.json(data);
  } catch (error) {
    next(error);
  }
}

export async function createMemberController(request, response, next) {
  try {
    const { email } = request.body ?? {};
    if (typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return response.status(400).json({ error: 'Escribí un correo electrónico válido.' });
    await inviteUserToHousehold(request.params.householdId, email, request.user.id);
    response.status(202).json({ sent: true, message: 'Si hay una cuenta con ese correo, recibirá la invitación.' });
  } catch (error) {
    next(error);
  }
}

export async function updateMemberController(request, response, next) {
  try {
    const targetMember = request.household.members.find((member) => member.id === request.params.memberId);
    if (!targetMember) return response.status(404).json({ error: 'No encontramos a esa persona en este hogar.' });
    if (targetMember.userId) return response.status(403).json({ error: 'Cada persona administra el nombre que muestra desde su perfil.' });
    if (request.householdMember.role !== 'owner' && targetMember.userId !== request.user.id) {
      return response.status(403).json({ error: 'Solo podés cambiar tu propio nombre en el hogar.' });
    }
    const { name } = request.body ?? {};
    if (typeof name !== 'string' || !name.trim()) return response.status(400).json({ error: 'Escribí el nombre de la persona.' });
    if (name.trim().length > 50) return response.status(400).json({ error: 'El nombre no puede superar los 50 caracteres.' });
    const member = await updateHouseholdMember(request.params.householdId, request.params.memberId, name.trim());
    response.json(member);
  } catch (error) {
    next(error);
  }
}

export async function deleteMemberController(request, response, next) {
  try {
    const targetMember = request.household.members.find((member) => member.id === request.params.memberId);
    if (!targetMember) return response.status(404).json({ error: 'No encontramos a esa persona en este hogar.' });
    if (request.householdMember.role !== 'owner' && targetMember.userId !== request.user.id) {
      return response.status(403).json({ error: 'Solo podés salir de tu propia cuenta en este hogar.' });
    }
    const result = await removeHouseholdMember(request.params.householdId, request.params.memberId);
    if (result?.owner) return response.status(400).json({ error: 'La persona que administra el hogar no puede salir hasta transferir la administración.' });
    response.json({ removed: true, memberId: result.memberId });
  } catch (error) {
    next(error);
  }
}

export async function createTaskController(request, response, next) {
  try {
    const { title, category, assigneeId = null, dueDate = null, notes = '' } = request.body ?? {};
    if (typeof title !== 'string' || !title.trim()) return response.status(400).json({ error: 'El título de la tarea es obligatorio.' });
    if (!TASK_CATEGORIES.includes(category)) return response.status(400).json({ error: 'Elegí una categoría válida.' });
    if (assigneeId && !request.household.members.some((member) => member.id === assigneeId)) return response.status(400).json({ error: 'Elegí a una persona de la casa o dejá la tarea sin asignar.' });
    if (dueDate !== null && !isValidDate(dueDate)) return response.status(400).json({ error: 'La fecha no tiene un formato válido.' });
    if (typeof notes !== 'string') return response.status(400).json({ error: 'Las notas deben ser texto.' });
    response.status(201).json(await createTask(request.params.householdId, { title, category, assigneeId, dueDate, notes }));
  } catch (error) {
    next(error);
  }
}

export async function updateTaskController(request, response, next) {
  try {
    const { title, category, assigneeId, dueDate, status, folder, notes } = request.body ?? {};
    const changes = {};
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) return response.status(400).json({ error: 'El título no puede estar vacío.' });
      changes.title = title;
    }
    if (category !== undefined) {
      if (!TASK_CATEGORIES.includes(category)) return response.status(400).json({ error: 'Elegí una categoría válida.' });
      changes.category = category;
    }
    if (assigneeId !== undefined) {
      if (assigneeId !== null && assigneeId !== '' && !request.household.members.some((member) => member.id === assigneeId)) {
        return response.status(400).json({ error: 'Elegí a una persona de la casa o dejá la tarea sin asignar.' });
      }
      changes.assigneeId = assigneeId || null;
    }
    if (dueDate !== undefined) {
      if (dueDate !== null && !isValidDate(dueDate)) return response.status(400).json({ error: 'La fecha no tiene un formato válido.' });
      changes.dueDate = dueDate;
    }
    if (status !== undefined) {
      if (!TASK_STATUSES.includes(status)) return response.status(400).json({ error: 'Elegí un estado válido.' });
      changes.status = status;
    }
    if (folder !== undefined) {
      if (!['active', 'archived', 'trash'].includes(folder)) return response.status(400).json({ error: 'Elegí un lugar válido para la tarea.' });
      changes.folder = folder;
    }
    if (notes !== undefined) {
      if (typeof notes !== 'string') return response.status(400).json({ error: 'Las notas deben ser texto.' });
      changes.notes = notes;
    }
    if (Object.keys(changes).length === 0) return response.status(400).json({ error: 'No hay cambios para guardar.' });
    const task = await updateTask(request.params.householdId, request.params.id, changes);
    if (!task) return response.status(404).json({ error: 'No encontramos esa tarea.' });
    response.json(task);
  } catch (error) {
    next(error);
  }
}

export async function deleteTaskController(request, response, next) {
  try {
    const task = request.household.tasks.find((item) => item.id === request.params.id);
    if (!task) return response.status(404).json({ error: 'No encontramos esa tarea.' });
    if ((task.folder || 'active') !== 'trash') return response.status(409).json({ error: 'Primero mové la tarea a la papelera.' });
    const removed = await removeTask(request.params.householdId, request.params.id);
    if (!removed) return response.status(404).json({ error: 'No encontramos esa tarea.' });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}

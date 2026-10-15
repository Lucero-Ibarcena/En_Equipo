import { Router } from 'express';
import {
  createHouseholdController,
  createHouseholdCategoryController,
  deleteHouseholdCategoryController,
  createMemberController,
  createTaskController,
  deleteMemberController,
  deleteTaskController,
  discoverHouseholdsController,
  getHouseholdController,
  joinHouseholdController,
  listHouseholdsController,
  requestJoinController,
  resolveJoinRequestController,
  updateMemberController,
  updateHouseholdCategoryController,
  updateHouseholdNameController,
  updateTaskController,
} from '../controllers/household.controller.js';
import { requireAuth, requireHouseholdMember, requireHouseholdOwner } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/households', requireAuth, listHouseholdsController);
router.get('/households/discover', requireAuth, discoverHouseholdsController);
router.post('/households/:householdId/join-requests', requireAuth, requestJoinController);
router.patch('/households/:householdId/join-requests/:requestId', requireAuth, requireHouseholdMember, requireHouseholdOwner, resolveJoinRequestController);
router.post('/households', requireAuth, createHouseholdController);
router.post('/households/join', requireAuth, joinHouseholdController);
router.get('/households/:householdId', requireAuth, requireHouseholdMember, getHouseholdController);
router.patch('/households/:householdId', requireAuth, requireHouseholdMember, requireHouseholdOwner, updateHouseholdNameController);
// [API: CATEGORÍAS] Solo quien administra el hogar puede mantener sus categorías.
router.post('/households/:householdId/categories', requireAuth, requireHouseholdMember, requireHouseholdOwner, createHouseholdCategoryController);
router.patch('/households/:householdId/categories/:categoryId', requireAuth, requireHouseholdMember, requireHouseholdOwner, updateHouseholdCategoryController);
router.delete('/households/:householdId/categories/:categoryId', requireAuth, requireHouseholdMember, requireHouseholdOwner, deleteHouseholdCategoryController);
router.post('/households/:householdId/members', requireAuth, requireHouseholdMember, requireHouseholdOwner, createMemberController);
router.patch('/households/:householdId/members/:memberId', requireAuth, requireHouseholdMember, updateMemberController);
router.delete('/households/:householdId/members/:memberId', requireAuth, requireHouseholdMember, deleteMemberController);
router.post('/households/:householdId/tasks', requireAuth, requireHouseholdMember, createTaskController);
router.patch('/households/:householdId/tasks/:id', requireAuth, requireHouseholdMember, updateTaskController);
router.delete('/households/:householdId/tasks/:id', requireAuth, requireHouseholdMember, deleteTaskController);

export default router;

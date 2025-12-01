import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
    getTodos,
    getTodoById,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    getTodoStats
} from '../controllers/todo.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Basic CRUD routes
router.route('/')
    .get(getTodos)
    .post(createTodo);

router.route('/stats')
    .get(getTodoStats);

router.route('/:id')
    .get(getTodoById)
    .put(updateTodo)
    .delete(deleteTodo);

router.route('/:id/toggle')
    .patch(toggleTodoComplete);

export default router;

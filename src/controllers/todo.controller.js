import { Todo } from '../models/todo.model.js';
import { User } from '../models/user.model.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { protectRoute } from '../middleware/auth.middleware.js';

// Helper function to get user from database
const getUserFromAuth = async (clerkUserId) => {
    const user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
        throw new Error('User not found in database');
    }
    return user;
};

// Get all todos for the authenticated user
export const getTodos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, completed, priority, category } = req.query;
    
    const user = await getUserFromAuth(req.auth.userId);
    const filter = { createdBy: user._id };
    
    if (completed !== undefined) {
        filter.completed = completed === 'true';
    }
    
    if (priority) {
        filter.priority = priority;
    }
    
    if (category) {
        filter.category = category;
    }

    const todos = await Todo.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

    const total = await Todo.countDocuments(filter);

    res.json({
        todos,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// Get todo by ID
export const getTodoById = asyncHandler(async (req, res) => {
    const user = await getUserFromAuth(req.auth.userId);
    const todo = await Todo.findOne({ _id: req.params.id, createdBy: user._id });
    
    if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(todo);
});

// Create new todo
export const createTodo = asyncHandler(async (req, res) => {
    const { title, description, priority, category } = req.body;
    const user = await getUserFromAuth(req.auth.userId);

    const todo = await Todo.create({
        title,
        description,
        priority: priority || 'medium',
        category: category || 'general',
        createdBy: user._id
    });

    res.status(201).json(todo);
});

// Update todo
export const updateTodo = asyncHandler(async (req, res) => {
    const { title, description, completed, priority, category } = req.body;
    const user = await getUserFromAuth(req.auth.userId);

    const todo = await Todo.findOneAndUpdate(
        { _id: req.params.id, createdBy: user._id },
        { 
            title, 
            description, 
            completed, 
            priority, 
            category 
        },
        { new: true, runValidators: true }
    );

    if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(todo);
});

// Delete todo
export const deleteTodo = asyncHandler(async (req, res) => {
    const user = await getUserFromAuth(req.auth.userId);
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, createdBy: user._id });

    if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
});

// Toggle todo completion
export const toggleTodoComplete = asyncHandler(async (req, res) => {
    const user = await getUserFromAuth(req.auth.userId);
    const todo = await Todo.findOne({ _id: req.params.id, createdBy: user._id });

    if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
    }

    todo.completed = !todo.completed;
    await todo.save();

    res.json(todo);
});

// Get todo statistics
export const getTodoStats = asyncHandler(async (req, res) => {
    const user = await getUserFromAuth(req.auth.userId);
    const userId = user._id;

    const stats = await Todo.aggregate([
        { $match: { createdBy: userId } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: ['$completed', 1, 0] } },
                pending: { $sum: { $cond: ['$completed', 0, 1] } },
                highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
            }
        }
    ]);

    const categoryStats = await Todo.aggregate([
        { $match: { createdBy: userId } },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                completed: { $sum: { $cond: ['$completed', 1, 0] } }
            }
        }
    ]);

    const result = stats[0] || {
        total: 0,
        completed: 0,
        pending: 0,
        highPriority: 0
    };

    res.json({
        ...result,
        completionRate: result.total > 0 ? Math.round((result.completed / result.total) * 100) : 0,
        categoryStats
    });
});

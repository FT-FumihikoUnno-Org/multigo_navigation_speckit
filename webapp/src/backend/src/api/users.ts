import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { requireRole } from '../middleware/roles'; // Import requireRole
import { getAllUsers, updateUserRole } from '../services/userService'; // Import UserService functions

const userRouter = Router();

// Get current authenticated user
userRouter.get('/me', isAuthenticated, async (req, res) => {
  // Passport populates req.user after successful authentication
  if (req.user) {
    try {
      // In a real app, you might fetch fresh user data here if needed,
      // but for simplicity, we'll assume req.user has enough info from deserializeUser
      // For full role detail, fetch again or ensure deserializeUser includes it
      return res.json(req.user);
    } catch (error) {
      console.error('Error fetching user from DB (me endpoint):', error);
      return res.status(500).send('Internal Server Error');
    }
  }
  res.status(401).send('Not Authenticated');
});

// Admin-only: Get all users
userRouter.get('/users', isAuthenticated, requireRole('Administrator'), async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users (admin endpoint):', error);
    res.status(500).send('Internal Server Error');
  }
});

// Admin-only: Update user role
userRouter.put('/users/:id/role', isAuthenticated, requireRole('Administrator'), async (req, res) => {
  const { id } = req.params;
  const { roleName } = req.body;

  try {
    const updatedUser = await updateUserRole(parseInt(id), roleName);
    if (updatedUser) {
      res.json({ message: 'User role updated successfully', user: updatedUser });
    } else {
      res.status(404).send('User not found or role not updated');
    }
  } catch (error: any) {
    if (error.message === 'Invalid role name') {
      return res.status(400).send(error.message);
    }
    console.error('Error updating user role:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default userRouter;

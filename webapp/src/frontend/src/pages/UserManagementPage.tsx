// webapp/src/frontend/src/pages/UserManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import { User as UserType, Role } from '../context/AuthContext'; // Import User and Role types

import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Select, MenuItem, FormControl, InputLabel, Button, Typography, Box, CircularProgress
} from '@mui/material';

interface User extends UserType {} // Use the imported User type

const UserManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser, isAdmin } = useAuth(); // Get current user and admin status
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return; // Should not happen due to ProtectedRoute, but good practice

      setLoading(true);
      setError(null);
      try {
        const fetchedUsers = await apiService.getAllUsers();
        setUsers(fetchedUsers);
      } catch (err: any) {
        setError(err.message || t('error_fetching_users'));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, t]); // Re-fetch if admin status changes

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(true); // Show loading indicator during update
    setError(null);
    try {
      // Assuming the backend expects a single role name for simplicity in this example.
      // A real scenario might involve managing multiple roles.
      const updatedUser = await apiService.updateUserRole(userId, newRole);
      // Update the state to reflect the change
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? updatedUser : u));
      // Optionally show a success notification
    } catch (err: any) {
      setError(err.message || t('error_updating_role'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    // This case should ideally be handled by ProtectedRoute, but as a fallback:
    return (
      <Box sx={{ textAlign: 'center', mt: 5 }}>
        <Typography variant="h6">{t('access_denied')}</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', color: 'red', mt: 5 }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>{t('user_management_title')}</Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>{t('username')}</TableCell>
              <TableCell>{t('email')}</TableCell>
              <TableCell>{t('current_role')}</TableCell>
              <TableCell>{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell component="th" scope="row">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {/* Display current role, or a placeholder if multiple roles are complex */}
                  {user.roles.length > 0 ? user.roles[0].name : t('no_role')}
                </TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id={`role-select-label-${user.id}`}>{t('change_role')}</InputLabel>
                    <Select
                      labelId={`role-select-label-${user.id}`}
                      label={t('change_role')}
                      value={user.roles.length > 0 ? user.roles[0].name : ''} // Default to first role or empty
                      onChange={(e) => handleRoleChange(user.id, e.target.value as string)}
                      disabled={user.id === currentUser?.id} // Prevent self-role change for safety
                    >
                      {/* Assuming roles are Admin, Nurse, Caregiver */}
                      <MenuItem value="Administrator">{t('roles.Administrator')}</MenuItem>
                      <MenuItem value="Nurse">{t('roles.Nurse')}</MenuItem>
                      <MenuItem value="Caregiver">{t('roles.Caregiver')}</MenuItem>
                      <MenuItem value="">{t('no_role')}</MenuItem> {/* Option to remove role */}
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {users.length === 0 && !loading && !error && (
        <Typography sx={{ mt: 2 }}>{t('no_users_found')}</Typography>
      )}
    </Box>
  );
};

export default UserManagementPage;
import React, { useEffect, useState } from 'react';
import { Typography, Container, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useAuth } from '../../context/AuthContext'; // Adjust path based on actual structure
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface User {
  id: number;
  oidc_id: string;
  email: string;
  display_name: string;
  role: string;
}

const UserManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(); // Initialize useTranslation

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data: User[] = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('failedToFetchUsers'));
      }
    } catch (err) {
      setError(t('errorConnectingToServer'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleName: newRole }),
      });

      if (response.ok) {
        // Update the user list with the new role
        setUsers(prevUsers =>
          prevUsers.map(u => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('failedToUpdateRole'));
      }
    } catch (err) {
      setError(t('errorConnectingToServer'));
    }
  };

  if (loading) {
    return (
      <Container>
        <CircularProgress />
        <Typography>{t('loadingUsers')}</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('userManagementPage')} ({user?.display_name})
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('id')}</TableCell>
              <TableCell>{t('displayName')}</TableCell>
              <TableCell>{t('email')}</TableCell>
              <TableCell>{t('role')}</TableCell>
              <TableCell>{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(Array.isArray(users) ? users : []).map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.display_name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  <FormControl fullWidth>
                    <InputLabel id={`role-select-label-${u.id}`}>{t('role')}</InputLabel>
                    <Select
                      labelId={`role-select-label-${u.id}`}
                      value={u.role}
                      label={t('role')}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as string)}
                    >
                      <MenuItem value="Administrator">{t('administrator')}</MenuItem>
                      <MenuItem value="Nurse">{t('nurse')}</MenuItem>
                      <MenuItem value="Caregiver">{t('caregiver')}</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default UserManagementPage;

import { query } from '../config/database';

export interface User {
  id: number;
  oidc_id: string;
  email: string;
  display_name: string;
  role: string;
}

export const getAllUsers = async (): Promise<User[]> => {
  const { rows } = await query(
    `SELECT u.id, u.oidc_id, u.email, u.display_name, r.name as role
     FROM users u
     JOIN roles r ON u.role_id = r.id`
  );
  return rows;
};

export const updateUserRole = async (userId: number, roleName: string): Promise<User | null> => {
  const { rows: roleRows } = await query('SELECT id FROM roles WHERE name = $1', [roleName]);
  if (roleRows.length === 0) {
    throw new Error('Invalid role name');
  }
  const roleId = roleRows[0].id;

  const { rows } = await query(
    'UPDATE users SET role_id = $1 WHERE id = $2 RETURNING *',
    [roleId, userId]
  );

  if (rows.length > 0) {
    const updatedUser = rows[0];
    const { rows: userWithRole } = await query(
      `SELECT u.id, u.oidc_id, u.email, u.display_name, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [updatedUser.id]
    );
    return userWithRole[0];
  }
  return null;
};

import db from '../config/db';

export interface Role {
  id: number;
  name: string;
}

export const RoleSchema = {
  findAll: async (): Promise<Role[]> => {
    const query = 'SELECT * FROM roles;';
    const { rows } = await db.query(query, []);
    return rows;
  },

  findByName: async (name: string): Promise<Role | undefined> => {
    const query = 'SELECT * FROM roles WHERE name = $1;';
    const { rows } = await db.query(query, [name]);
    return rows[0];
  },

  assignRoleToUser: async (userId: number, roleId: number) => {
    const query = `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [userId, roleId]);
    return rows[0];
  },

  findRolesByUserId: async (userId: number): Promise<Role[]> => {
    const query = `
      SELECT r.id, r.name
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1;
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  }
};

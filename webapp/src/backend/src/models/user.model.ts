import db from '../config/db';

export interface User {
  id?: number;
  oauth_provider: string;
  oauth_id: string;
  email: string;
  display_name: string;
  created_at?: Date;
  updated_at?: Date;
}

export const UserSchema = {
  create: async (user: User) => {
    const query = `
      INSERT INTO users (oauth_provider, oauth_id, email, display_name)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const params = [user.oauth_provider, user.oauth_id, user.email, user.display_name];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  findByEmail: async (email: string): Promise<User | undefined> => {
    const query = 'SELECT * FROM users WHERE email = $1;';
    const { rows } = await db.query(query, [email]);
    return rows[0];
  },

  findById: async (id: number): Promise<User | undefined> => {
    const query = 'SELECT * FROM users WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  findAll: async (): Promise<User[]> => {
    const query = 'SELECT * FROM users;';
    const { rows } = await db.query(query, []);
    return rows;
  }
};

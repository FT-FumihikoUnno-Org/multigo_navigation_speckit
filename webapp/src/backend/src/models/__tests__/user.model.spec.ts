import { UserSchema } from '../user.model';
import db from '../../config/db';

jest.mock('../../config/db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  }
}));

describe('UserSchema', () => {
  afterEach(() => {
    (db.query as jest.Mock).mockClear();
  });

  it('should fetch all users via findAll', async () => {
    const mockUsers = [
      { id: 1, oauth_provider: 'google', oauth_id: '123', email: 'user1@example.com', display_name: 'User One' },
      { id: 2, oauth_provider: 'google', oauth_id: '456', email: 'user2@example.com', display_name: 'User Two' },
    ];
    (db.query as jest.Mock).mockResolvedValue({ rows: mockUsers });

    const users = await UserSchema.findAll();

    expect(db.query).toHaveBeenCalledWith('SELECT * FROM users;', []);
    expect(users).toEqual(mockUsers);
    expect(users.length).toBe(2);
  });
});

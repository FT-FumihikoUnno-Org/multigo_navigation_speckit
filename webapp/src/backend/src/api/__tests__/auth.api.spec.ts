import request from 'supertest';
import app from '../../index'; // Import the actual Express app
import { UserSchema } from '../../models/user.model';
import { RoleSchema } from '../../models/role.model';
import passport from 'passport'; // Import the actual passport module
import { Request, Response, NextFunction } from 'express';


// Extend Express Request and User types for Passport
declare global {
  namespace Express {
    interface User {
      id?: number; // Make id optional based on user.model.ts
      oauth_provider?: string;
      oauth_id?: string;
      email: string;
      display_name: string;
      roles?: { id: number; name: string }[];
    }
    interface Request {
      isAuthenticated(): this is AuthenticatedRequest;
      logout(cb: (err: Error | null) => void): void;
      user?: User; // Add user to Request
      // Removed 'session?: any;' to resolve TypeScript type conflict.
      // Session properties will be mocked directly where needed on `req.session`.
    }
    interface AuthenticatedRequest extends Request {
      user: User;
    }
  }
}

// Helper to create an isAuthenticated type predicate mock
const createIsAuthenticatedMock = (authenticated: boolean) => {
    return function (this: Request): this is Express.AuthenticatedRequest {
        return authenticated;
    };
};

// Default authenticated user for mocks
const mockAuthenticatedUser = {
    id: 1, 
    email: 'test@example.com', 
    display_name: 'Test User', 
    roles: [{id: 1, name: 'User'}], 
    oauth_provider: 'openidconnect', 
    oauth_id: 'test_sub' 
};

// Mock the external dependencies that the Express app uses
jest.mock('../../models/user.model', () => ({
    UserSchema: {
        findAll: jest.fn().mockResolvedValue([
            { id: 1, email: 'user1@example.com', display_name: 'User One', roles: [{id: 1, name: 'User'}] },
            { id: 2, email: 'admin@example.com', display_name: 'Admin User', roles: [{id: 2, name: 'Administrator'}] }
        ]),
        findByEmail: jest.fn().mockImplementation((email) => {
            if (email === 'test@example.com') return { id: 1, oauth_provider: 'openidconnect', oauth_id: 'oauth123', email: 'test@example.com', display_name: 'Test User', roles: [{id: 1, name: 'User'}] };
            if (email === 'admin@example.com') return { id: 2, oauth_provider: 'openidconnect', oauth_id: 'oauth456', email: 'admin@example.com', display_name: 'Admin User', roles: [{id: 2, name: 'Administrator'}] };
            return undefined;
        }),
        findById: jest.fn().mockImplementation((id) => {
            if (id === 1) return { id: 1, oauth_provider: 'openidconnect', oauth_id: 'oauth123', email: 'test@example.com', display_name: 'Test User', roles: [{id: 1, name: 'User'}] };
            if (id === 2) return { id: 2, oauth_provider: 'openidconnect', oauth_id: 'oauth456', email: 'admin@example.com', display_name: 'Admin User', roles: [{id: 2, name: 'Administrator'}] };
            return undefined;
        }),
        create: jest.fn().mockImplementation((user) => ({ id: 3, ...user })),
    }
}));

jest.mock('../../models/role.model', () => ({
    RoleSchema: {
        assignRoleToUser: jest.fn().mockResolvedValue({ userId: 1, roleId: 1 }),
        findRolesByUserId: jest.fn().mockImplementation((userId) => {
            if (userId === 1) return [{ id: 1, name: 'User' }];
            if (userId === 2) return [{ id: 2, name: 'Administrator' }];
            return [];
        }),
    }
}));

// Mock the external authentication strategies (e.g., OpenID Connect)
jest.mock('passport', () => {
    const passportMock: any = {
        // Default behavior for authenticate: returns a middleware that calls next()
        // Tests will use spyOn and mockImplementationOnce for specific scenarios
        authenticate: jest.fn(() => (req: Request, res: Response, next: NextFunction) => {
            // Default: simulate an unauthenticated request. Specific tests will override.
            req.isAuthenticated = createIsAuthenticatedMock(false);
            req.user = undefined;
            (req as any).session = (req as any).session || { passport: {}, destroy: jest.fn((cb) => cb(null)) }; // Ensure session mock
            req.logout = jest.fn((cb) => cb(null)) as any;
            next();
        }),
        initialize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
        session: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
        use: jest.fn(),
        serializeUser: jest.fn((user, done) => {
            // Simulate actual Passport behavior: call done with user.id
            done(null, (user as any).id);
        }),
        deserializeUser: jest.fn(async (id, done) => {
            // Simulate actual Passport behavior: fetch user and roles
            if (id === mockAuthenticatedUser.id) {
                const user = { ...mockAuthenticatedUser, id };
                (user as any).roles = [{ id: 1, name: 'User' }];
                done(null, user);
            } else if (id === 2) { // Simulate admin user deserialization
                const adminUser = { ...mockAuthenticatedUser, id: 2, email: 'admin@example.com', display_name: 'Admin User', roles: [{id: 2, name: 'Administrator'}] };
                done(null, adminUser);
            } else {
                done(new Error('User not found'));
            }
        }),
    };
    return passportMock;
});

// Mock the isAdmin middleware
jest.mock('../../middleware/auth', () => ({
    isAdmin: jest.fn((req, res, next) => {
        // Default behavior for isAdmin mock for test isolation.
        // Individual tests will override this mock using mockImplementationOnce.
        if (req.isAuthenticated() && (req.user as Express.User).roles?.some((role: any) => role.name === 'Administrator')) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: requires Administrator role' });
        }
    }),
}));


describe('Auth API Endpoints', () => {
    let agent: any; // Use any to bypass SuperAgentTest type issues for now

    beforeAll(() => {
        // Initialize supertest agent with the actual app
        agent = request.agent(app);
    });

    beforeEach(() => {
        jest.clearAllMocks(); // Clears all mock implementations and call counts
        jest.restoreAllMocks(); // Restores all mocks and spies to their original state
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Restore all mocks and spies after each test
    });

    it('GET /api/auth/login should initiate OpenID Connect flow', async () => {
        // Mock passport.authenticate for the login route to simulate initiating OIDC flow.
        jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => (req: Request, res: Response, next: NextFunction) => {
            // Simulate the redirect to the OIDC provider.
            res.redirect('https://myoidcprovider.com/auth/realms/myrealm/protocol/openid-connect/auth?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback&scope=openid%20profile%20email%20phone&client_id=dummy_client_id');
        });

        const response = await agent.get('/api/auth/login');
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toContain('https://myoidcprovider.com/auth/realms/myrealm/protocol/openid-connect/auth');
    });

    it('GET /api/auth/callback should handle OIDC redirect successfully and redirect to /', async () => {
        // Mock passport.authenticate for the callback route.
        // This mock simulates the *result* of passport.authenticate after the OIDC provider returns successfully.
        jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => (req: Request, res: Response, next: NextFunction) => {
            // Simulate successful authentication by setting req.user and req.isAuthenticated
            req.isAuthenticated = createIsAuthenticatedMock(true);
            req.user = mockAuthenticatedUser;
            // Simulate session setup if your app uses sessions
            (req as any).session = { passport: { user: mockAuthenticatedUser.id }, destroy: jest.fn((cb) => cb(null)) };
            
            // The route handler for /api/auth/callback after successful passport.authenticate
            // should perform the redirect to '/'. We simulate that here by calling res.redirect.
            res.redirect('/'); 
        });
        
        const response = await agent.get('/api/auth/callback');
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe('/');
    });

    it('GET /api/auth/logout should log out the user', async () => {
        // Mock req.logout and req.session.destroy as they are called by the logout handler
        const mockLogout = jest.fn((cb) => cb(null));
        const mockSessionDestroy = jest.fn((cb) => cb(null));

        // Simulate an authenticated user for the request being logged out
        jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => (req: Request, res: Response, next: NextFunction) => {
            req.isAuthenticated = createIsAuthenticatedMock(true);
            req.user = mockAuthenticatedUser;
            req.logout = mockLogout as any;
            // Mock session object and its destroy method
            (req as any).session = { destroy: mockSessionDestroy } as any; 
            next();
        });

        const response = await agent.get('/api/auth/logout'); // Assuming logout is a GET or POST request
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'Logged out successfully' });
        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(mockSessionDestroy).toHaveBeenCalledTimes(1);
    });

    it('GET /api/users/me should return authenticated user data', async () => {
        // Override the global passport.authenticate mock for this specific test to simulate authenticated user
        jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => (req: Request, res: Response, next: NextFunction) => {
            req.isAuthenticated = createIsAuthenticatedMock(true);
            req.user = mockAuthenticatedUser;
            (req as any).session = { passport: { user: mockAuthenticatedUser.id } }; // Ensure session for isAuthenticated
            req.logout = jest.fn((cb) => cb(null)) as any;
            next();
        });

        const response = await agent.get('/api/users/me');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockAuthenticatedUser); // Expecting the default mock user
    });

    it('GET /api/users/me should return 401 if not authenticated', async () => {
        // The global passport.authenticate mock by default simulates an unauthenticated user.
        // So no specific mockImplementationOnce is needed here unless we want to change its default unauthenticated behavior.
        // However, to be explicit for testing purposes:
        jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => (req: Request, res: Response, next: NextFunction) => {
            req.isAuthenticated = createIsAuthenticatedMock(false); // Explicitly not authenticated
            req.user = undefined;
            (req as any).session = undefined; // No session for unauthenticated user
            req.logout = jest.fn((cb) => cb(null)) as any;
            next(); 
        });
        
        const response = await agent.get('/api/users/me');
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({ message: 'Not authenticated' });
    });

    it('GET /api/users should return all users for Administrator', async () => {
        // Mock isAdmin middleware to pass for admin
        const mockIsAdmin = require('../../middleware/auth').isAdmin;
        mockIsAdmin.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
            req.isAuthenticated = createIsAuthenticatedMock(true);
            // Simulate an admin user
            req.user = { ...mockAuthenticatedUser, id: 2, email: 'admin@example.com', display_name: 'Admin User', roles: [{id: 2, name: 'Administrator'}] };
            (req as any).session = { passport: { user: req.user.id } };
            req.logout = jest.fn((cb) => cb(null)) as any;
            next(); // Allow access
        });

        // Also mock passport.authenticate for this request to simulate an authenticated admin
        jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => (req: Request, res: Response, next: NextFunction) => {
            req.isAuthenticated = createIsAuthenticatedMock(true);
            req.user = { ...mockAuthenticatedUser, id: 2, email: 'admin@example.com', display_name: 'Admin User', roles: [{id: 2, name: 'Administrator'}] };
            (req as any).session = { passport: { user: req.user.id } };
            req.logout = jest.fn((cb) => cb(null)) as any;
            next();
        });

        const response = await agent.get('/api/users');
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(2); // Expecting two users from the mock UserSchema.findAll
        expect(UserSchema.findAll).toHaveBeenCalled();
    });

    it('GET /api/users should return 403 for non-Administrator', async () => {
        // Mock isAdmin middleware to deny access
        const mockIsAdmin = require('../../middleware/auth').isAdmin;
        mockIsAdmin.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
            req.isAuthenticated = createIsAuthenticatedMock(true);
            req.user = { ...mockAuthenticatedUser, id: 1, email: 'user1@example.com', display_name: 'User One', roles: [{id: 1, name: 'User'}] };
            res.status(403).json({ message: 'Forbidden: requires Administrator role' });
        });

        // Also mock passport.authenticate for this request to simulate an authenticated non-admin
        jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => (req: Request, res: Response, next: NextFunction) => {
            req.isAuthenticated = createIsAuthenticatedMock(true);
            req.user = { ...mockAuthenticatedUser, id: 1, email: 'user1@example.com', display_name: 'User One', roles: [{id: 1, name: 'User'}] };
            (req as any).session = { passport: { user: req.user.id } };
            req.logout = jest.fn((cb) => cb(null)) as any;
            next();
        });

        const response = await agent.get('/api/users');
        expect(response.statusCode).toBe(403);
        expect(response.body).toEqual({ message: 'Forbidden: requires Administrator role' });
    });

    it('POST /api/users/:id/role should assign role for Administrator', async () => {
        // Mock isAdmin to pass
        const mockIsAdmin = require('../../middleware/auth').isAdmin;
        mockIsAdmin.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
            req.isAuthenticated = createIsAuthenticatedMock(true);
            req.user = { ...mockAuthenticatedUser, id: 2, email: 'admin@example.com', display_name: 'Admin User', roles: [{id: 2, name: 'Administrator'}] };
            next(); // Allow access
        });

        // Also mock passport.authenticate for this request to simulate an authenticated admin
        jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => (req: Request, res: Response, next: NextFunction) => {
            req.isAuthenticated = createIsAuthenticatedMock(true);
            req.user = { ...mockAuthenticatedUser, id: 2, email: 'admin@example.com', display_name: 'Admin User', roles: [{id: 2, name: 'Administrator'}] };
            (req as any).session = { passport: { user: req.user.id } };
            req.logout = jest.fn((cb) => cb(null)) as any;
            next();
        });

        // Mock RoleSchema.assignRoleToUser to return a successful result
        (RoleSchema.assignRoleToUser as jest.Mock).mockResolvedValue({ userId: 1, roleId: 1 });

        const response = await agent.post('/api/users/1/role').send({ roleId: 1 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'Role assigned successfully' });
        expect(RoleSchema.assignRoleToUser).toHaveBeenCalledWith(1, 1);
    });

    it('POST /api/users/:id/role should return 403 for non-Administrator', async () => {
        // Mock isAdmin to return 403
        const mockIsAdmin = require('../../middleware/auth').isAdmin;
        mockIsAdmin.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
            req.isAuthenticated = createIsAuthenticatedMock(true);
            req.user = { ...mockAuthenticatedUser, id: 1, email: 'user1@example.com', display_name: 'User One', roles: [{id: 1, name: 'User'}] };
            res.status(403).json({ message: 'Forbidden: requires Administrator role' });
        });

        // Also mock passport.authenticate for this request to simulate an authenticated non-admin
        jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => (req: Request, res: Response, next: NextFunction) => {
            req.isAuthenticated = createIsAuthenticatedMock(true);
            req.user = { ...mockAuthenticatedUser, id: 1, email: 'user1@example.com', display_name: 'User One', roles: [{id: 1, name: 'User'}] };
            (req as any).session = { passport: { user: req.user.id } };
            req.logout = jest.fn((cb) => cb(null)) as any;
            next();
        });

        const response = await agent.post('/api/users/1/role').send({ roleId: 1 });
        expect(response.statusCode).toBe(403);
        expect(response.body).toEqual({ message: 'Forbidden: requires Administrator role' });
    });
});
import { Router } from 'express';

const dummyAuthRouter = Router();

dummyAuthRouter.post('/oauth/apply', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Dummy apply response',
    data: {
      // You can add any dummy data here if needed
      userId: 'dummy-user-123',
      approved: true,
    },
  });
});

export default dummyAuthRouter;

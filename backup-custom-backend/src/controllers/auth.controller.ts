import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/error.middleware';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully',
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  });

  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.getProfile(req.userId!);

    res.json({
      success: true,
      data: user,
    });
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.updateProfile(req.userId!, req.body);

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  });

  // For testing authentication
  checkAuth = asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({
      success: true,
      data: {
        authenticated: true,
        user: req.user,
      },
    });
  });
}

export const authController = new AuthController();
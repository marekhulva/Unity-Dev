import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthRequest extends Request {
  userId?: string;
  user?: User;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  avatar?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateGoalDto {
  title: string;
  metric: string;
  deadline: Date | string;
  category?: string;
  color?: string;
  why?: string;
}

export interface CreateActionDto {
  title: string;
  time?: string;
  goalId?: string;
  date?: Date | string;
}

export interface CreatePostDto {
  type: 'checkin' | 'status' | 'photo' | 'audio';
  visibility: 'circle' | 'follow' | 'public';
  content: string;
  mediaUrl?: string;
  actionTitle?: string;
  goalTitle?: string;
  goalColor?: string;
  streak?: number;
}
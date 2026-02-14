import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const message = error.details.map((d: any) => d.message).join(', ');
      return next(new AppError(message, 400));
    }
    
    next();
  };
};

export const validateQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      const message = error.details.map((d: any) => d.message).join(', ');
      return next(new AppError(message, 400));
    }
    
    next();
  };
};

export const validateParams = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      const message = error.details.map((d: any) => d.message).join(', ');
      return next(new AppError(message, 400));
    }
    
    next();
  };
};
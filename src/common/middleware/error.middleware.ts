import type { Request, Response, NextFunction } from "express";
import logger from "../../config/logger.js";
import { AppError } from "../errors/AppError.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
  });

  const isAppError = err instanceof AppError;

  const statusCode = isAppError ? err.statusCode : 500;

  const message = isAppError
    ? err.message
    : "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
  });
};
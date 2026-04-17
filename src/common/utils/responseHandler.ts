/**
 * Standardized API response utilities
 * Ensures consistent response format across all endpoints
 */

import { Response } from "express";

/* ============ TYPES ============ */

interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  metadata?: {
    timestamp: string;
    path: string;
  };
}

interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  error?: string;
  metadata?: {
    timestamp: string;
    path: string;
  };
}

/* ============ SUCCESS RESPONSE BUILDERS ============ */

/**
 * Send success response with 200 status
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data }),
  } as SuccessResponse<T>);
};

/**
 * Send created response (201)
 */
export const sendCreated = <T>(
  res: Response,
  message: string,
  data?: T
): Response => {
  return res.status(201).json({
    success: true,
    message,
    ...(data && { data }),
  } as SuccessResponse<T>);
};

/**
 * Send accepted response (202)
 */
export const sendAccepted = <T>(
  res: Response,
  message: string,
  data?: T
): Response => {
  return res.status(202).json({
    success: true,
    message,
    ...(data && { data }),
  } as SuccessResponse<T>);
};

/**
 * Send no content response (204)
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).json({});
};

/* ============ ERROR RESPONSE BUILDERS ============ */

/**
 * Send error response with custom status code
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(error && { error }),
  } as ErrorResponse);
};

/**
 * Send bad request response (400)
 */
export const sendBadRequest = (
  res: Response,
  message = "Bad request"
): Response => {
  return sendError(res, message, 400);
};

/**
 * Send unauthorized response (401)
 */
export const sendUnauthorized = (
  res: Response,
  message = "Unauthorized"
): Response => {
  return sendError(res, message, 401);
};

/**
 * Send forbidden response (403)
 */
export const sendForbidden = (
  res: Response,
  message = "Forbidden"
): Response => {
  return sendError(res, message, 403);
};

/**
 * Send not found response (404)
 */
export const sendNotFound = (
  res: Response,
  message = "Not found"
): Response => {
  return sendError(res, message, 404);
};

/**
 * Send conflict response (409)
 */
export const sendConflict = (
  res: Response,
  message = "Conflict"
): Response => {
  return sendError(res, message, 409);
};

/**
 * Send rate limit response (429)
 */
export const sendRateLimited = (
  res: Response,
  message = "Too many requests"
): Response => {
  return sendError(res, message, 429);
};

/**
 * Send server error response (500)
 */
export const sendServerError = (
  res: Response,
  message = "Internal server error"
): Response => {
  return sendError(res, message, 500);
};

/* ============ PAGINATION ============ */

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalPages: number;
}

/**
 * Send paginated response
 */
export const sendPaginated = <T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message = "Success",
  statusCode = 200
): Response => {
  const totalPages = Math.ceil(total / pageSize);
  const hasMore = page < totalPages;

  return res.status(statusCode).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore,
      },
    },
  });
};

/* ============ HELPERS ============ */

/**
 * Serialize BigInt in response data
 */
export const serializeBigInt = (obj: any): any => {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

export default {
  sendSuccess,
  sendCreated,
  sendAccepted,
  sendNoContent,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendRateLimited,
  sendServerError,
  sendPaginated,
  serializeBigInt,
};

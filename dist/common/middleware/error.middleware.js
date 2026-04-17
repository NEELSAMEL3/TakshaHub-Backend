import logger from "../../config/logger";
import { AppError } from "../errors/AppError";
export const errorHandler = (err, req, res, next) => {
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
//# sourceMappingURL=error.middleware.js.map
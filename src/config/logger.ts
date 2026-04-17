import fs from "fs";
import path from "path";
import { createLogger, format, transports, config } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, errors, json } = format;

/**
 * Ensure logs directory exists
 */
const logDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Log level colors
 */
config.addColors({
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "cyan",
});

/**
 * Base format (reusable)
 */
const baseFormat = combine(
  errors({ stack: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" })
);

/**
 * Console format (dev only)
 */
const devConsoleFormat = printf(({ level, message, timestamp, stack }) => {
  const msg = stack || message;
  return `${timestamp} [${level.toUpperCase()}] ${msg}`;
});

/**
 * File format (structured logs)
 */
const fileFormat = combine(baseFormat, json());

/**
 * Create rotating file transport
 */
const createFileTransport = (file: string, level?: string) =>
  new DailyRotateFile({
    filename: path.join(logDir, file),
    datePattern: "YYYY-MM-DD",
    maxFiles: "14d",
    level,
    handleExceptions: true,
    handleRejections: true,
  });

/**
 * Common file transports
 */
const errorFile = createFileTransport("error.log", "error");
const combinedFile = createFileTransport("combined.log");
const exceptionFile = createFileTransport("exceptions.log");
const rejectionFile = createFileTransport("rejections.log");

/**
 * Base logger
 */
const logger = createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: fileFormat,

  exceptionHandlers: [exceptionFile],
  rejectionHandlers: [rejectionFile],

  transports: [],
});

const env = process.env.NODE_ENV;

/**
 * Production setup
 */
if (env === "production") {
  logger.add(errorFile);
  logger.add(combinedFile);

  // optional: minimal console logs in prod
  logger.add(
    new transports.Console({
      level: "warn",
      handleExceptions: true,
      handleRejections: true,
      format: combine(baseFormat, json()),
    })
  );
}

/**
 * Test setup
 */
else if (env === "test") {
  logger.add(createFileTransport("test.log"));
}

/**
 * Development setup
 */
else {
  logger.add(
    new transports.Console({
      level: "debug",
      handleExceptions: true,
      handleRejections: true,
      format: combine(colorize({ all: true }), devConsoleFormat),
    })
  );

  logger.add(errorFile);
  logger.add(combinedFile);
}

export default logger;
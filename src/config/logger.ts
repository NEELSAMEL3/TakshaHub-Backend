import { createLogger, format, transports, config } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize } = format;

// Custom colors for log levels (industry-style)
const customColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};
config.addColors(customColors);

// Custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
});

// Daily rotating file transports
const errorRotateTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '14d', // keep 14 days
});

const combinedRotateTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
});

// Environment-aware transport setup
if (process.env.NODE_ENV === 'production') {
  // Production: files only
  logger.add(errorRotateTransport);
  logger.add(combinedRotateTransport);
} else if (process.env.NODE_ENV === 'test') {
  // Test: separate file, no console
  logger.add(new DailyRotateFile({
    filename: 'logs/test-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '7d',
  }));
} else {
  // Development: console + files
  logger.add(new transports.Console({ format: combine(colorize({ all: true }), logFormat) }));
  logger.add(errorRotateTransport);
  logger.add(combinedRotateTransport);
}

export default logger;
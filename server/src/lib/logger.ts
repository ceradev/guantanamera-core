import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const transportRotate = new DailyRotateFile({
  dirname: "logs",
  filename: "api-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    transportRotate,
  ],
});

import { Response } from "express";

interface ErrorWithMessage extends Error {
  message: string;
}

export const successResponse = (
  res: Response,
  statusCode: number,
  message: string | object,
  data: object = {}
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string | object,
  error: ErrorWithMessage | string | null = null
): void => {
  const errMsg =
    typeof error === "string" ? error : error ? error.message : null;

  res.status(statusCode).json({
    success: false,
    message,
    error: errMsg,
  });
};

export default { successResponse, errorResponse };
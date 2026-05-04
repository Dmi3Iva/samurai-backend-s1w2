import { RequestHandler } from "express";
import { FieldValidationError, validationResult } from "express-validator";

export const inputValidationMiddleware: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const errorsMessages = errors
    .array({
      onlyFirstError: true,
    })
    .map((e) => ({ message: e.msg, field: (e as FieldValidationError).path }));

  res.status(400).send({
    errorsMessages,
  });
};

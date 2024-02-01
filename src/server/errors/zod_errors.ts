import { ZodError } from "zod";
import { FormErrors } from "../state";

export const ZodFormError = (errors: ZodError) => {
  const formError: FormErrors = {};

  errors.errors.map((err) => (formError[err.path[0]] = err.message));

  return formError;
};

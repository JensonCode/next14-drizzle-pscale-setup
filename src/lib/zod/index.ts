import { ZodEffects, ZodError, ZodObject } from "zod";

type Schema = ZodObject<any> | ZodEffects<ZodObject<any>>;

export const parseFormData = <ReturnType>(
  formData: FormData,
  schema?: Schema,
): { data: ReturnType | undefined; errors: ZodError | undefined } => {
  try {
    const form = Object.fromEntries(formData.entries());

    const data = (schema as Schema).parse(form) as ReturnType;

    return { data: data, errors: undefined };
  } catch (err) {
    return { data: undefined, errors: err as ZodError };
  }
};

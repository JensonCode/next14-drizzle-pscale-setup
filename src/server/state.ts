type path = string;
type message = string;

export type FormErrors = Record<path, message>;

export type FormState =
  | {
      state: "success";
      success: true;
      messgae: string;
    }
  | {
      state: "fail";
      success: false;
      errors: FormErrors;
    }
  | {
      state: "default";
    };

export const SuccessState = (msg: string): FormState => {
  return {
    state: "success",
    success: true,
    messgae: msg,
  };
};

export const FailState = (errors: FormErrors): FormState => {
  return {
    state: "fail",
    success: false,
    errors: errors,
  };
};

export const DefaultState = (): FormState => {
  return {
    state: "default",
  };
};

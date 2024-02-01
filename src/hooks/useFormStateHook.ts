"use client";
import { useFormState } from "react-dom";
import { DefaultState, FormState } from "@/server/state";

export const useFormStateHook = (
  action: (prev: FormState, data: FormData) => Promise<FormState>,
) => {
  const [formState, formAction] = useFormState(action, DefaultState());

  return { formState, formAction };
};

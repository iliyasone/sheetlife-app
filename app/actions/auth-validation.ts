export type RequiredFieldResult =
  | { success: true; value: string }
  | { success: false; message: string };

export function requireEmailField(formData: FormData): RequiredFieldResult {
  return requireTrimmedField(formData, "email", "Email is required.");
}

export function requireCodeField(formData: FormData): RequiredFieldResult {
  return requireTrimmedField(formData, "code", "Code is required.");
}

export function requireTrimmedField(
  formData: FormData,
  field: string,
  errorMessage: string,
): RequiredFieldResult {
  const rawValue = formData.get(field);
  if (typeof rawValue !== "string") {
    return { success: false, message: errorMessage };
  }

  const value = rawValue.trim();
  if (!value) {
    return { success: false, message: errorMessage };
  }

  return { success: true, value };
}


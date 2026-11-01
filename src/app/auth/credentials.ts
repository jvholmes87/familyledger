export type Credentials = {
  email: string;
  password: string;
};

export type ParseResult =
  | { success: true; data: Credentials }
  | { success: false; error: string };

const MIN_PASSWORD_LENGTH = 6;

/**
 * Validate and extract email/password from submitted form data. Pure and
 * framework-free so it can be unit-tested and reused across sign-in/sign-up.
 */
export function parseCredentials(formData: FormData): ParseResult {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email) {
    return { success: false, error: "Email is required." };
  }
  if (!email.includes("@")) {
    return { success: false, error: "Enter a valid email address." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  return { success: true, data: { email, password } };
}

import type { Dictionary } from "./dictionaries";

// Better Auth replies with English messages; we translate the common
// cases by their error code and use a generic message for the rest.
export function authErrorMessage(code: string, dict: Dictionary) {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return dict.auth.invalidCredentials;
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return dict.auth.userExists;
    case "INVALID_PASSWORD":
      return dict.auth.wrongPassword;
    case "PASSWORD_TOO_SHORT":
      return dict.auth.passwordTooShort;
    default:
      return dict.auth.generic;
  }
}

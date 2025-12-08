import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE = "sheetlife_access_token";
export const USER_EMAIL_COOKIE = "sheetlife_user_email";

export async function getAccessTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function getUserEmailFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(USER_EMAIL_COOKIE)?.value ?? null;
}

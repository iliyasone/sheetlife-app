"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, USER_EMAIL_COOKIE } from "@/lib/auth-cookies";
import { getCoreApiUrl } from "@/lib/config";
import { AuthFormState } from "./auth-state";
import { requireCodeField, requireEmailField } from "./auth-validation";

const CORE_API_URL = getCoreApiUrl();

export async function requestLoginCodeAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const emailResult = requireEmailField(formData);
  if (!emailResult.success) {
    return { ok: false, message: emailResult.message };
  }
  const email = emailResult.value;

  try {
    const res = await fetch(`${CORE_API_URL}/auth/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const details = await res.text();
      return {
        ok: false,
        message: `Failed to request code: ${res.status} ${res.statusText} – ${details}`,
      };
    }

    return { ok: true, message: "Magic code sent. Check your inbox." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function verifyLoginCodeAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const emailResult = requireEmailField(formData);
  if (!emailResult.success) {
    return { ok: false, message: emailResult.message };
  }

  const codeResult = requireCodeField(formData);
  if (!codeResult.success) {
    return { ok: false, message: codeResult.message };
  }

  const email = emailResult.value;
  const code = codeResult.value;


  try {
    const res = await fetch(`${CORE_API_URL}/auth/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    if (!res.ok) {
      const details = await res.text();
      return {
        ok: false,
        message: `Failed to verify code: ${res.status} ${res.statusText} – ${details}`,
      };
    }

    const data = (await res.json()) as {
      access_token: string;
      user: { email: string };
    };

    const cookieStore = await cookies();
    cookieStore.set(ACCESS_TOKEN_COOKIE, data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    cookieStore.set(USER_EMAIL_COOKIE, data.user.email, {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    revalidatePath("/");
    revalidatePath("/storages");

    return { ok: true, message: "Signed in successfully." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(USER_EMAIL_COOKIE);
  revalidatePath("/");
  revalidatePath("/storages");
}

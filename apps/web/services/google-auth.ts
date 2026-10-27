import { AuthError } from "./auth";

const API_URL = "/api";

export async function login() {
  try {
    const res = await fetch(`${API_URL}/v1/oauth/google`);

    if (!res.ok) {
      throw new Error("Failed to get Google login URL");
    }

    const data = await res.json();
    if (!res.ok) {
      throw new AuthError(
        data.error?.message || data.message || "Login failed.",
        data.error?.code,
      );
    }

    console.log("frontend return", data);
    return {
      success: true,
      url: data.url,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error: "Failed to sign in with Google",
    };
  }
}

const API_URL = "/api";
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
export const auth = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
  }) => {
    const res = await fetch(`${API_URL}/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new AuthError(
        result.error?.message || result.message || "Login failed.",
        result.error?.code,
      );
    }

    return result;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await fetch(`${API_URL}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new AuthError(
        result.error?.message || result.message || "Login failed.",
        result.error?.code,
      );
    }

    return result;
  },

  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_URL}/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new AuthError(
        result.error?.message || result.message || "Login failed.",
        result.error?.code,
      );
    }

    return result;
  },

  verifyEmail: async (token: string) => {
    const res = await fetch(
      `${API_URL}/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
      { credentials: "include" },
    );

    const result = await res.json();

    if (!res.ok) {
      throw new AuthError(
        result.error?.message || result.message || "Login failed.",
        result.error?.code,
      );
    }

    return result;
  },

  resendVerification: async (email: string) => {
    const res = await fetch(`${API_URL}/v1/auth/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new AuthError(
        result.error?.message || result.message || "Login failed.",
        result.error?.code,
      );
    }

    return result;
  },

  verifyOtp: async (email: string, otp: string) => {
    const res = await fetch(`${API_URL}/v1/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, otp }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new AuthError(
        result.error?.message || result.message || "Login failed.",
        result.error?.code,
      );
    }

    return result;
  },

  resetPassword: async (data: {
    email: string;
    otp: string;
    newPassword: string;
  }) => {
    const res = await fetch(`${API_URL}/v1/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new AuthError(
        result.error?.message || result.message || "Login failed.",
        result.error?.code,
      );
    }

    return result;
  },
};

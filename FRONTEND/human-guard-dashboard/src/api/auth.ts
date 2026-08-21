import axios from "axios";

const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://127.0.0.1:8000",
  timeout: 10000,
});

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type User = {
  id?: string;
  email: string;
  name?: string;
  role?: string;
};

export async function login(
  data: LoginRequest
): Promise<LoginResponse> {
  const body = new URLSearchParams();

  body.append("username", data.email);
  body.append("password", data.password);

  const response = await authApi.post(
    "/auth/login",
    body,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

export async function getMe(
  token: string
): Promise<User> {
  const response = await authApi.get(
    "/auth/me",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function firebaseLogin(
  idToken: string
): Promise<LoginResponse> {
  const response = await authApi.post(
    "/auth/google-firebase",
    {
      id_token: idToken,
    }
  );

  return response.data;
}
import { apiRequest, setToken, clearToken } from "./client";

export type User = {
  id: string;
  name: string;
  email: string;
};

type AuthResponse = {
  token: string;
  user: User;
};

export async function signup(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const response = await apiRequest<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  setToken(response.token);
  return response.user;
}

export async function login(
  email: string,
  password: string
): Promise<User> {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setToken(response.token);
  return response.user;
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/auth/me");
}

export function logout(): void {
  clearToken();
}
import { supabase } from "../lib/supabase";
import type { User } from "../contexts/AuthContext";

export type { User };

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error || !authData.session) {
    throw new Error(error?.message || "Invalid email or password");
  }

  const sbUser = authData.user;
  const mappedUser: User = {
    id: sbUser.id,
    email: sbUser.email || data.email,
    name:
      (sbUser.user_metadata?.name as string | undefined) ||
      (sbUser.user_metadata?.full_name as string | undefined) ||
      data.email.split("@")[0],
    role: (sbUser.app_metadata?.role as string | undefined) || "user",
  };

  return {
    access_token: authData.session.access_token,
    token_type: "bearer",
    user: mappedUser,
  };
}

export async function getMe(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email || "",
    name:
      (session.user.user_metadata?.name as string | undefined) ||
      (session.user.user_metadata?.full_name as string | undefined) ||
      session.user.email?.split("@")[0] ||
      "User",
    role: (session.user.app_metadata?.role as string | undefined) || "user",
  };
}

export async function logoutSupabase(): Promise<void> {
  await supabase.auth.signOut();
}

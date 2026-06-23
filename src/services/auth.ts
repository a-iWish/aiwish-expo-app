import { apiFetch } from './httpClient';
import { AuthResponse, User } from '../types/auth';

export interface RegisterParams {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export function registerRequest(params: RegisterParams): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: {
      email: params.email,
      password: params.password,
      full_name: params.fullName?.trim() ? params.fullName.trim() : null,
    },
  });
}

export function loginRequest(params: LoginParams): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email: params.email, password: params.password },
  });
}

export function fetchMe(): Promise<User> {
  return apiFetch<User>('/api/auth/me', { method: 'GET' });
}

export interface MessageResponse {
  detail: string;
}

export interface UpdateProfileParams {
  fullName?: string | null;
  email?: string;
}

export function updateProfileRequest(params: UpdateProfileParams): Promise<User> {
  const body: Record<string, unknown> = {};
  if (params.fullName !== undefined) {
    body.full_name = params.fullName?.trim() ? params.fullName.trim() : null;
  }
  if (params.email !== undefined) body.email = params.email.trim();
  return apiFetch<User>('/api/auth/me', { method: 'PATCH', body });
}

export function changePasswordRequest(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/auth/change-password', {
    method: 'POST',
    body: {
      current_password: params.currentPassword,
      new_password: params.newPassword,
    },
  });
}

export function resendVerificationRequest(): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/auth/resend-verification', {
    method: 'POST',
  });
}

export function forgotPasswordRequest(email: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email: email.trim() },
  });
}

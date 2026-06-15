import { request } from './api';
import {
  Activity,
  AuthResult,
  Comment,
  NewActivity,
  Page,
  Privacy,
  PublicUser,
  SelfUser,
  TrackPoint,
  Units,
} from './types';

function toQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export const authApi = {
  register: (body: { email: string; password: string; displayName: string }) =>
    request<AuthResult>('/auth/register', { method: 'POST', body, auth: false }),
  login: (body: { email: string; password: string }) =>
    request<AuthResult>('/auth/login', { method: 'POST', body, auth: false }),
  logout: (refreshToken: string) =>
    request<void>('/auth/logout', { method: 'POST', body: { refreshToken } }),
};

export const usersApi = {
  me: () => request<SelfUser>('/users/me'),
  updateMe: (body: Partial<{ displayName: string; weightKg: number; heightCm: number; units: Units; defaultPrivacy: Privacy }>) =>
    request<SelfUser>('/users/me', { method: 'PATCH', body }),
  get: (id: string) => request<PublicUser>(`/users/${id}`),
  search: (q: string) => request<PublicUser[]>(`/users/search${toQuery({ q })}`),
};

export const activitiesApi = {
  create: (body: NewActivity) => request<Activity>('/activities', { method: 'POST', body }),
  get: (id: string) => request<Activity>(`/activities/${id}`),
  list: (params: { userId?: string; before?: string; limit?: number } = {}) =>
    request<Page<Activity>>(`/activities${toQuery(params)}`),
  update: (id: string, body: Partial<{ title: string; privacy: Privacy }>) =>
    request<Activity>(`/activities/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => request<void>(`/activities/${id}`, { method: 'DELETE' }),
  points: (id: string) => request<TrackPoint[]>(`/activities/${id}/points`),
  gpx: (id: string) => request<string>(`/activities/${id}/gpx`, { raw: true }),
  kudo: (id: string) => request<{ kudoed: boolean }>(`/activities/${id}/kudos`, { method: 'POST' }),
  unkudo: (id: string) =>
    request<{ kudoed: boolean }>(`/activities/${id}/kudos`, { method: 'DELETE' }),
  kudos: (id: string) => request<PublicUser[]>(`/activities/${id}/kudos`),
};

export const commentsApi = {
  list: (activityId: string) => request<Comment[]>(`/activities/${activityId}/comments`),
  add: (activityId: string, body: string) =>
    request<Comment>(`/activities/${activityId}/comments`, { method: 'POST', body: { body } }),
  remove: (commentId: string) => request<void>(`/comments/${commentId}`, { method: 'DELETE' }),
};

export const followsApi = {
  follow: (userId: string) =>
    request<{ following: boolean }>(`/users/${userId}/follow`, { method: 'POST' }),
  unfollow: (userId: string) =>
    request<{ following: boolean }>(`/users/${userId}/follow`, { method: 'DELETE' }),
  followers: (userId: string) => request<PublicUser[]>(`/users/${userId}/followers`),
  following: (userId: string) => request<PublicUser[]>(`/users/${userId}/following`),
};

export const feedApi = {
  get: (params: { before?: string; limit?: number } = {}) =>
    request<Page<Activity>>(`/feed${toQuery(params)}`),
};

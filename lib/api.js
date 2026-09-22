const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.onwardworkspaces.com/api';

export class ApiError extends Error {
  constructor(status, data) {
    super(data?.error || `Request failed with status ${status}`);
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}) {
  let token = null;
  if (typeof window !== 'undefined') {
    token = window.localStorage.getItem('token');
  }

  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('onward-session-v2');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data;
}

const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (path, body) =>
    request(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: (path, body) =>
    request(path, {
      method: 'DELETE',
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    }),
};

export default api;

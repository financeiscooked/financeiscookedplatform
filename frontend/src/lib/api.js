const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || res.statusText);
  }
  return json;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: (path, body) => request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: (path) => request(path, { method: 'DELETE' }),
};

// Admin API - adds X-Admin-Key header
export function createAdminApi(adminKey) {
  const adminHeaders = { 'X-Admin-Key': adminKey };
  return {
    get: (path) => request(path, { headers: adminHeaders }),
    post: (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, headers: adminHeaders }),
    patch: (path, body) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, headers: adminHeaders }),
    put: (path, body) => request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, headers: adminHeaders }),
    del: (path) => request(path, { method: 'DELETE', headers: adminHeaders }),
  };
}

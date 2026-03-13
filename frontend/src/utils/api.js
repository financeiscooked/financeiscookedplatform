const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-production-0e40.up.railway.app/api';

export async function fetchEpisodes() {
  const res = await fetch(`${API_BASE}/episodes`);
  const data = await res.json();
  return data.ok ? data.data : [];
}

export async function fetchEpisode(slug) {
  const res = await fetch(`${API_BASE}/episodes/${slug}`);
  const data = await res.json();
  return data.ok ? data.data : null;
}

export async function castVote(slideId, direction) {
  const res = await fetch(`${API_BASE}/slides/${slideId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction }),
  });
  const data = await res.json();
  return data.ok ? data.data : null;
}

export async function fetchVotes(slug) {
  const res = await fetch(`${API_BASE}/episodes/${slug}/votes`);
  const data = await res.json();
  return data.ok ? data.data : {};
}

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'admin123';
const adminHeaders = { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY };

export async function finalizeSlide(slideId) {
  const res = await fetch(`${API_BASE}/slides/${slideId}/finalize`, {
    method: 'POST',
    headers: adminHeaders,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Finalize failed');
  return data.data;
}

export async function moveSlideToEpisode(slideId, targetEpisodeSlug, targetSegmentSlug) {
  const res = await fetch(`${API_BASE}/slides/${slideId}/move`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ targetEpisodeSlug, targetSegmentSlug }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Move failed');
  return data.data;
}

export async function deleteSlide(slideId) {
  const res = await fetch(`${API_BASE}/slides/${slideId}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Delete failed');
  return data.data;
}

export async function finalizeSegment(segmentUuid) {
  const res = await fetch(`${API_BASE}/segments/${segmentUuid}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'final' }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Finalize failed');
  return data.data;
}

export async function deleteSegment(segmentUuid) {
  const res = await fetch(`${API_BASE}/segments/${segmentUuid}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Delete failed');
  return data.data;
}

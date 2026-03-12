const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-production-0e40.up.railway.app';

export async function fetchEpisodes() {
  const res = await fetch(`${API_BASE}/api/episodes`);
  const data = await res.json();
  return data.ok ? data.data : [];
}

export async function fetchEpisode(slug) {
  const res = await fetch(`${API_BASE}/api/episodes/${slug}`);
  const data = await res.json();
  return data.ok ? data.data : null;
}

export async function castVote(slideId, direction) {
  const res = await fetch(`${API_BASE}/api/slides/${slideId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction }),
  });
  const data = await res.json();
  return data.ok ? data.data : null;
}

export async function fetchVotes(slug) {
  const res = await fetch(`${API_BASE}/api/episodes/${slug}/votes`);
  const data = await res.json();
  return data.ok ? data.data : {};
}

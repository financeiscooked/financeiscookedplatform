const DEFAULT_BASE_URL = 'https://backend-production-0e40.up.railway.app';

export class FinanceIsCookedClient {
  private baseUrl: string;
  private adminKey: string | undefined;

  constructor(baseUrl?: string, adminKey?: string) {
    this.baseUrl = baseUrl || process.env.FINANCEISCOOKED_API_URL || DEFAULT_BASE_URL;
    this.adminKey = adminKey || process.env.FINANCEISCOOKED_ADMIN_KEY;
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      params?: Record<string, string | number | undefined>;
      requiresAdmin?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params, requiresAdmin } = options;

    if (requiresAdmin && !this.adminKey) {
      throw new Error('Admin key required. Set FINANCEISCOOKED_ADMIN_KEY environment variable.');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (requiresAdmin && this.adminKey) {
      headers['X-Admin-Key'] = this.adminKey;
    }

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error ${response.status}: ${text}`);
    }

    return response.json();
  }

  // ── Episodes ──────────────────────────────────────────────

  async listEpisodes() {
    return this.request<any>('/api/episodes');
  }

  async getEpisode(slug: string) {
    return this.request<any>(`/api/episodes/${encodeURIComponent(slug)}`);
  }

  async createEpisode(data: { slug: string; title: string; date?: string; sortOrder?: number }) {
    return this.request<any>('/api/episodes', { method: 'POST', body: data, requiresAdmin: true });
  }

  async updateEpisode(slug: string, data: { title?: string; date?: string; sortOrder?: number }) {
    return this.request<any>(`/api/episodes/${encodeURIComponent(slug)}`, { method: 'PUT', body: data, requiresAdmin: true });
  }

  async deleteEpisode(slug: string) {
    return this.request<any>(`/api/episodes/${encodeURIComponent(slug)}`, { method: 'DELETE', requiresAdmin: true });
  }

  // ── Segments ──────────────────────────────────────────────

  async createSegment(episodeSlug: string, data: { slug: string; name: string; status?: string; sortOrder?: number }) {
    return this.request<any>(`/api/episodes/${encodeURIComponent(episodeSlug)}/segments`, { method: 'POST', body: data, requiresAdmin: true });
  }

  async updateSegment(id: string, data: { name?: string; status?: string; sortOrder?: number }) {
    return this.request<any>(`/api/segments/${encodeURIComponent(id)}`, { method: 'PUT', body: data, requiresAdmin: true });
  }

  async deleteSegment(id: string) {
    return this.request<any>(`/api/segments/${encodeURIComponent(id)}`, { method: 'DELETE', requiresAdmin: true });
  }

  // ── Slides ────────────────────────────────────────────────

  async createSlide(segmentId: string, data: {
    type: string; title: string; url?: string; notes?: string;
    details?: string; status?: string; bullets?: string[]; sortOrder?: number;
  }) {
    return this.request<any>(`/api/segments/${encodeURIComponent(segmentId)}/slides`, { method: 'POST', body: data, requiresAdmin: true });
  }

  async updateSlide(id: string, data: {
    type?: string; title?: string; url?: string; notes?: string;
    details?: string; status?: string; bullets?: string[]; sortOrder?: number;
  }) {
    return this.request<any>(`/api/slides/${encodeURIComponent(id)}`, { method: 'PUT', body: data, requiresAdmin: true });
  }

  async deleteSlide(id: string) {
    return this.request<any>(`/api/slides/${encodeURIComponent(id)}`, { method: 'DELETE', requiresAdmin: true });
  }

  async moveSlide(id: string, data: {
    targetSegmentId?: string;
    targetEpisodeSlug?: string;
    targetSegmentSlug?: string;
  }) {
    return this.request<any>(`/api/slides/${encodeURIComponent(id)}/move`, { method: 'POST', body: data, requiresAdmin: true });
  }

  async finalizeSlide(id: string) {
    return this.request<any>(`/api/slides/${encodeURIComponent(id)}/finalize`, { method: 'POST', requiresAdmin: true });
  }

  // ── Votes ─────────────────────────────────────────────────

  async castVote(slideId: string, direction: string) {
    return this.request<any>(`/api/slides/${encodeURIComponent(slideId)}/vote`, { method: 'POST', body: { direction } });
  }

  async getEpisodeVotes(episodeSlug: string) {
    return this.request<any>(`/api/episodes/${encodeURIComponent(episodeSlug)}/votes`);
  }

  // ── Admin ─────────────────────────────────────────────────

  async seedDatabase() {
    return this.request<any>('/api/admin/seed', { method: 'POST', requiresAdmin: true });
  }

  async getStats() {
    return this.request<any>('/api/admin/stats');
  }

  async healthCheck() {
    return this.request<any>('/api/health');
  }
}

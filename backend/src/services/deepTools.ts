import { registerToolHandler } from './toolExecutor.js';
import type { Tool } from './llm/types.js';

// ---------------------------------------------------------------------------
// Deep Tools — extended agent capabilities (web search, fetch, CSV export)
// ---------------------------------------------------------------------------

export const DEEP_TOOLS: Tool[] = [
  {
    name: 'deep__web_search',
    description: 'Search the web for information. Returns search results for a given query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'deep__web_fetch',
    description: 'Fetch the content of a web page by URL. Returns the text content (limited to 10,000 characters).',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'deep__csv_export',
    description: 'Export data as a CSV file. Returns the CSV content for the frontend to handle as a download.',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'The CSV data content (including headers)',
        },
        filename: {
          type: 'string',
          description: 'Suggested filename for the export (e.g. "report.csv")',
        },
      },
      required: ['data', 'filename'],
    },
  },
];

// ---------------------------------------------------------------------------
// Register deep__ prefix handler with tool executor
// ---------------------------------------------------------------------------
registerToolHandler('deep__', async (toolName, input, _context) => {
  switch (toolName) {
    case 'deep__web_search': {
      // Placeholder — web search not yet connected to a provider
      return JSON.stringify({
        message: 'Web search not configured. To enable, connect a search provider (e.g. Brave Search, Google Custom Search) in the platform settings.',
        query: input.query,
        results: [],
      });
    }

    case 'deep__web_fetch': {
      if (!input.url) {
        return JSON.stringify({ error: 'url is required' });
      }
      try {
        const response = await fetch(input.url, {
          headers: {
            'User-Agent': 'FinanceIsCooked-Agent/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          return JSON.stringify({
            error: `HTTP ${response.status}: ${response.statusText}`,
            url: input.url,
          });
        }

        let text = await response.text();
        // Limit to 10k characters
        if (text.length > 10_000) {
          text = text.substring(0, 10_000) + '\n...[truncated at 10,000 chars]';
        }

        return JSON.stringify({
          url: input.url,
          contentLength: text.length,
          content: text,
        });
      } catch (err: any) {
        return JSON.stringify({
          error: `Fetch failed: ${err.message || 'Unknown error'}`,
          url: input.url,
        });
      }
    }

    case 'deep__csv_export': {
      if (!input.data) {
        return JSON.stringify({ error: 'data is required' });
      }
      // Return the CSV data as-is — the frontend handles the download
      return JSON.stringify({
        type: 'csv_export',
        filename: input.filename || 'export.csv',
        data: input.data,
        message: `CSV export ready: ${input.filename || 'export.csv'}`,
      });
    }

    default:
      return JSON.stringify({ error: `Unknown deep tool: ${toolName}` });
  }
});

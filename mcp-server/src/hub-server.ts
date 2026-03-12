/**
 * financeiscooked MCP Server — Agent-in-a-Box Hub Integration
 *
 * Implements MCPServerInstance for bundled registration
 * in the agentinabox MCP Hub. Reuses the same api-client and tools
 * as the standalone index.ts server.
 *
 * Usage:
 *   import { financeisCookedServer } from './hub-server.js';
 *   await orchestrator.registerServer(financeisCookedServer);
 */

import { z } from 'zod';
import { FinanceIsCookedClient } from './api-client.js';
import { tools } from './tools.js';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
}

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: { server?: string; tool?: string; executionTime?: number };
}

interface MCPServerInstance {
  name: string;
  version: string;
  description: string;
  tools: MCPTool[];
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  executeTool(name: string, args: any): Promise<MCPResponse>;
  listTools(): Promise<MCPTool[]>;
}

export class FinanceIsCookedMCPServer implements MCPServerInstance {
  name = 'financeiscooked';
  version = '1.0.0';
  description = 'Manage financeiscooked show episodes, segments, slides, and votes';
  tools: MCPTool[] = [];

  private client: FinanceIsCookedClient | null = null;

  /**
   * Called by MCPServerManager to inject credentials from database.
   * token1 = optional custom base URL override
   */
  setTokens(tokens: { token1?: string; token2?: string; token3?: string; token4?: string; token5?: string }) {
    // No auth — public API. token1 can override the base URL.
    this.client = new FinanceIsCookedClient(tokens.token1);
  }

  async initialize(): Promise<void> {
    // Default client if setTokens not called
    if (!this.client) {
      this.client = new FinanceIsCookedClient();
    }
    this.tools = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
    console.log(`[financeiscooked] Initialized with ${this.tools.length} tools`);
  }

  async shutdown(): Promise<void> {
    console.log(`[financeiscooked] Shutting down`);
    this.client = null;
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<MCPResponse> {
    if (!this.client) {
      return { success: false, error: 'Server not initialized — call initialize() first' };
    }

    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      return { success: false, error: `Unknown tool: ${name}` };
    }

    const start = Date.now();
    try {
      const result = await tool.handler(this.client, args as any);
      return {
        success: true,
        data: result,
        metadata: {
          server: this.name,
          tool: name,
          executionTime: Date.now() - start,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: message,
        metadata: {
          server: this.name,
          tool: name,
          executionTime: Date.now() - start,
        },
      };
    }
  }

  async listTools(): Promise<MCPTool[]> {
    return this.tools;
  }
}

// Singleton export for hub registration
export const financeisCookedServer = new FinanceIsCookedMCPServer();

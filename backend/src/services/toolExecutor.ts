import type { LLMMessage, Tool, ToolCall, GenerateResult } from './llm/types.js';
import { getProviderForModel } from './llm/index.js';

const MAX_TOOL_OUTPUT_LENGTH = 20_000;
const MAX_TOOL_ITERATIONS = 10;

// ---------------------------------------------------------------------------
// Tool handler registry
// ---------------------------------------------------------------------------
type ToolHandler = (toolName: string, input: Record<string, any>, context: any) => Promise<string>;

const handlers = new Map<string, ToolHandler>();

/** Register a handler for tools matching a prefix (e.g. "deep__" handles deep__web_search, etc.) */
export function registerToolHandler(prefix: string, handler: ToolHandler) {
  handlers.set(prefix, handler);
}

async function executeToolCall(toolCall: ToolCall, context: any): Promise<string> {
  for (const [prefix, handler] of handlers.entries()) {
    if (toolCall.name.startsWith(prefix)) {
      try {
        let result = await handler(toolCall.name, toolCall.input, context);
        if (result.length > MAX_TOOL_OUTPUT_LENGTH) {
          result = result.substring(0, MAX_TOOL_OUTPUT_LENGTH) + '\n...[truncated]';
        }
        return result;
      } catch (err: any) {
        return `Error executing tool ${toolCall.name}: ${err.message || 'Unknown error'}`;
      }
    }
  }
  return `Tool not found: ${toolCall.name}`;
}

// ---------------------------------------------------------------------------
// executeWithTools — the tool calling loop
// ---------------------------------------------------------------------------
export async function executeWithTools(params: {
  messages: LLMMessage[];
  tools: Tool[];
  model: string;
  apiKey: string;
  context?: any;
}): Promise<{ result: GenerateResult; messages: LLMMessage[] }> {
  const { tools, model, apiKey, context } = params;
  const messages = [...params.messages];
  const provider = getProviderForModel(model);
  let iterations = 0;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const result = tools.length > 0
      ? await provider.generateWithTools(messages, tools, model, apiKey)
      : await provider.generate(messages, model, apiKey);

    if (result.type !== 'tool_use' || result.toolCalls.length === 0) {
      // Final text response
      return { result, messages };
    }

    // Add the assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: result.text || '',
      toolCalls: result.toolCalls,
    });

    // Execute each tool call and add results
    for (const toolCall of result.toolCalls) {
      const toolResult = await executeToolCall(toolCall, context);
      messages.push({
        role: 'tool',
        content: toolResult,
        toolCallId: toolCall.id,
      });
    }
  }

  // Max iterations reached — return what we have
  const finalResult = await provider.generate(messages, model, apiKey);
  return { result: finalResult, messages };
}

// ---------------------------------------------------------------------------
// streamWithTools — streaming version of the tool calling loop
// ---------------------------------------------------------------------------
export async function streamWithTools(params: {
  messages: LLMMessage[];
  tools: Tool[];
  model: string;
  apiKey: string;
  context?: any;
  onChunk: (chunk: { type: string; content: string }) => void;
}): Promise<{ result: GenerateResult; messages: LLMMessage[] }> {
  const { tools, model, apiKey, context, onChunk } = params;
  const messages = [...params.messages];
  const provider = getProviderForModel(model);
  let iterations = 0;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const result = await provider.stream(messages, model, apiKey, onChunk, tools);

    if (result.type !== 'tool_use' || result.toolCalls.length === 0) {
      return { result, messages };
    }

    // Add the assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: result.text || '',
      toolCalls: result.toolCalls,
    });

    // Execute each tool call and add results
    for (const toolCall of result.toolCalls) {
      const toolResult = await executeToolCall(toolCall, context);
      messages.push({
        role: 'tool',
        content: toolResult,
        toolCallId: toolCall.id,
      });
      onChunk({ type: 'tool', content: JSON.stringify({ id: toolCall.id, name: toolCall.name, result: toolResult.substring(0, 500) }) });
    }
  }

  // Max iterations reached
  const finalResult = await provider.stream(messages, model, apiKey, onChunk);
  return { result: finalResult, messages };
}

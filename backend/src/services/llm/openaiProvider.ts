import OpenAI from 'openai';
import type { LLMProvider, LLMMessage, Tool, ToolCall, GenerateResult, StreamChunk } from './types.js';

export class OpenAIProvider implements LLMProvider {
  id = 'openai';

  async generate(messages: LLMMessage[], model: string, apiKey: string): Promise<GenerateResult> {
    return this.generateWithTools(messages, [], model, apiKey);
  }

  async generateWithTools(
    messages: LLMMessage[],
    tools: Tool[],
    model: string,
    apiKey: string,
  ): Promise<GenerateResult> {
    const client = new OpenAI({ apiKey });

    const openaiMessages = this.toOpenAIMessages(messages);
    const openaiTools = tools.length > 0 ? this.toOpenAITools(tools) : undefined;

    const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model,
      max_tokens: 4096,
      messages: openaiMessages,
    };
    if (openaiTools && openaiTools.length > 0) {
      params.tools = openaiTools;
    }

    const response = await client.chat.completions.create(params);
    const choice = response.choices[0];
    const message = choice.message;

    const text = message.content || '';
    const toolCalls: ToolCall[] = (message.tool_calls || [])
      .filter((tc): tc is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall => tc.type === 'function')
      .map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments || '{}'),
      }));

    return {
      type: toolCalls.length > 0 ? 'tool_use' : 'text',
      text,
      toolCalls,
      stopReason: this.mapFinishReason(choice.finish_reason),
    };
  }

  async stream(
    messages: LLMMessage[],
    model: string,
    apiKey: string,
    onChunk: (chunk: StreamChunk) => void,
    tools?: Tool[],
  ): Promise<GenerateResult> {
    const client = new OpenAI({ apiKey });

    const openaiMessages = this.toOpenAIMessages(messages);
    const openaiTools = tools && tools.length > 0 ? this.toOpenAITools(tools) : undefined;

    const params: any = {
      model,
      max_tokens: 4096,
      messages: openaiMessages,
      stream: true,
    };
    if (openaiTools && openaiTools.length > 0) {
      params.tools = openaiTools;
    }

    const stream = await client.chat.completions.create(params);

    let fullText = '';
    let finishReason = 'end_turn';
    const toolCallAccumulators: Map<number, { id: string; name: string; arguments: string }> = new Map();

    for await (const chunk of stream as any) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      const delta = choice.delta;
      if (delta?.content) {
        fullText += delta.content;
        onChunk({ type: 'delta', content: delta.content });
      }

      // Accumulate tool call deltas
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCallAccumulators.has(tc.index)) {
            toolCallAccumulators.set(tc.index, {
              id: tc.id || '',
              name: tc.function?.name || '',
              arguments: '',
            });
          }
          const acc = toolCallAccumulators.get(tc.index)!;
          if (tc.id) acc.id = tc.id;
          if (tc.function?.name) acc.name = tc.function.name;
          if (tc.function?.arguments) acc.arguments += tc.function.arguments;
        }
      }

      if (choice.finish_reason) {
        finishReason = this.mapFinishReason(choice.finish_reason);
      }
    }

    // Build final tool calls
    const toolCalls: ToolCall[] = [];
    for (const [, acc] of toolCallAccumulators) {
      toolCalls.push({
        id: acc.id,
        name: acc.name,
        input: JSON.parse(acc.arguments || '{}'),
      });
    }

    onChunk({ type: 'final', content: fullText });

    return {
      type: toolCalls.length > 0 ? 'tool_use' : 'text',
      text: fullText,
      toolCalls,
      stopReason: finishReason,
    };
  }

  // --- Private helpers ---

  private toOpenAIMessages(
    messages: LLMMessage[],
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map((msg) => {
      if (msg.role === 'system') {
        return { role: 'system' as const, content: msg.content };
      }

      if (msg.role === 'user') {
        return { role: 'user' as const, content: msg.content };
      }

      if (msg.role === 'tool') {
        return {
          role: 'tool' as const,
          tool_call_id: msg.toolCallId || '',
          content: msg.content,
        };
      }

      // assistant
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        return {
          role: 'assistant' as const,
          content: msg.content || null,
          tool_calls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.input),
            },
          })),
        };
      }

      return { role: 'assistant' as const, content: msg.content };
    });
  }

  private toOpenAITools(tools: Tool[]): OpenAI.Chat.ChatCompletionTool[] {
    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }

  private mapFinishReason(reason: string | null): string {
    if (!reason) return 'end_turn';
    switch (reason) {
      case 'stop':
        return 'end_turn';
      case 'tool_calls':
        return 'tool_use';
      case 'length':
        return 'max_tokens';
      case 'content_filter':
        return 'content_filter';
      default:
        return reason;
    }
  }
}

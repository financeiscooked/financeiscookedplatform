import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMMessage, Tool, ToolCall, GenerateResult, StreamChunk } from './types.js';

export class ClaudeProvider implements LLMProvider {
  id = 'anthropic';

  async generate(messages: LLMMessage[], model: string, apiKey: string): Promise<GenerateResult> {
    return this.generateWithTools(messages, [], model, apiKey);
  }

  async generateWithTools(
    messages: LLMMessage[],
    tools: Tool[],
    model: string,
    apiKey: string,
  ): Promise<GenerateResult> {
    const client = new Anthropic({ apiKey });

    // Extract system messages
    const systemMessages = messages.filter((m) => m.role === 'system');
    const systemText = systemMessages.map((m) => m.content).join('\n\n');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const anthropicMessages = this.toAnthropicMessages(nonSystemMessages);
    const anthropicTools = tools.length > 0 ? this.toAnthropicTools(tools) : undefined;

    const params: any = {
      model,
      max_tokens: 4096,
      messages: anthropicMessages,
    };

    if (systemText) {
      params.system = systemText;
    }
    if (anthropicTools && anthropicTools.length > 0) {
      params.tools = anthropicTools;
    }

    const response = await client.messages.create(params);

    // Parse response
    const textBlocks = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text);

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    const toolCalls: ToolCall[] = toolUseBlocks.map((block) => ({
      id: block.id,
      name: block.name,
      input: block.input as Record<string, any>,
    }));

    return {
      type: toolCalls.length > 0 ? 'tool_use' : 'text',
      text: textBlocks.join('\n'),
      toolCalls,
      stopReason: response.stop_reason || 'end_turn',
    };
  }

  async stream(
    messages: LLMMessage[],
    model: string,
    apiKey: string,
    onChunk: (chunk: StreamChunk) => void,
    tools?: Tool[],
  ): Promise<GenerateResult> {
    const client = new Anthropic({ apiKey });

    const systemMessages = messages.filter((m) => m.role === 'system');
    const systemText = systemMessages.map((m) => m.content).join('\n\n');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const anthropicMessages = this.toAnthropicMessages(nonSystemMessages);
    const anthropicTools = tools && tools.length > 0 ? this.toAnthropicTools(tools) : undefined;

    const params: any = {
      model,
      max_tokens: 4096,
      messages: anthropicMessages,
      stream: true,
    };
    if (systemText) {
      params.system = systemText;
    }
    if (anthropicTools && anthropicTools.length > 0) {
      params.tools = anthropicTools;
    }

    let fullText = '';
    const toolCalls: ToolCall[] = [];
    let currentToolId = '';
    let currentToolName = '';
    let currentToolInput = '';

    const stream = client.messages.stream(params);

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        const block = (event as any).content_block;
        if (block?.type === 'tool_use') {
          currentToolId = block.id;
          currentToolName = block.name;
          currentToolInput = '';
          onChunk({ type: 'tool', content: JSON.stringify({ id: block.id, name: block.name }) });
        }
      } else if (event.type === 'content_block_delta') {
        const delta = event.delta as any;
        if (delta.type === 'text_delta') {
          fullText += delta.text;
          onChunk({ type: 'delta', content: delta.text });
        } else if (delta.type === 'input_json_delta') {
          currentToolInput += delta.partial_json || '';
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolId) {
          try {
            const input = currentToolInput ? JSON.parse(currentToolInput) : {};
            toolCalls.push({ id: currentToolId, name: currentToolName, input });
          } catch {
            toolCalls.push({ id: currentToolId, name: currentToolName, input: {} });
          }
          currentToolId = '';
          currentToolName = '';
          currentToolInput = '';
        }
      }
    }

    const finalMessage = await stream.finalMessage();

    onChunk({ type: 'final', content: fullText });

    return {
      type: toolCalls.length > 0 ? 'tool_use' : 'text',
      text: fullText,
      toolCalls,
      stopReason: finalMessage.stop_reason || 'end_turn',
    };
  }

  // --- Private helpers ---

  private toAnthropicMessages(messages: LLMMessage[]): Anthropic.MessageParam[] {
    const result: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === 'user') {
        result.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          // Assistant message with tool use blocks
          const content: any[] = [];
          if (msg.content) {
            content.push({ type: 'text', text: msg.content });
          }
          for (const tc of msg.toolCalls) {
            content.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.input,
            });
          }
          result.push({ role: 'assistant', content });
        } else {
          result.push({ role: 'assistant', content: msg.content });
        }
      } else if (msg.role === 'tool') {
        // Tool result — Anthropic expects this as a user message with tool_result block
        result.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.toolCallId || '',
              content: msg.content,
            },
          ],
        });
      }
    }

    return result;
  }

  private toAnthropicTools(tools: Tool[]): Anthropic.Tool[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
    }));
  }
}

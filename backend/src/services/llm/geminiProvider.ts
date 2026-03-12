import { GoogleGenerativeAI, type Content, type Part, type FunctionDeclarationsTool } from '@google/generative-ai';
import crypto from 'crypto';
import type { LLMProvider, LLMMessage, Tool, ToolCall, GenerateResult, StreamChunk } from './types.js';

export class GeminiProvider implements LLMProvider {
  id = 'google';

  async generate(messages: LLMMessage[], model: string, apiKey: string): Promise<GenerateResult> {
    return this.generateWithTools(messages, [], model, apiKey);
  }

  async generateWithTools(
    messages: LLMMessage[],
    tools: Tool[],
    model: string,
    apiKey: string,
  ): Promise<GenerateResult> {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Extract system messages
    const systemMessages = messages.filter((m) => m.role === 'system');
    const systemText = systemMessages.map((m) => m.content).join('\n\n');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const modelOptions: any = { model };
    if (systemText) {
      modelOptions.systemInstruction = systemText;
    }

    const genModel = genAI.getGenerativeModel(modelOptions);

    const contents = this.toGeminiContents(nonSystemMessages);
    const geminiTools = tools.length > 0 ? this.toGeminiTools(tools) : undefined;

    const requestParams: any = { contents };
    if (geminiTools) {
      requestParams.tools = geminiTools;
    }

    const result = await genModel.generateContent(requestParams);
    const response = result.response;

    return this.parseResponse(response);
  }

  async stream(
    messages: LLMMessage[],
    model: string,
    apiKey: string,
    onChunk: (chunk: StreamChunk) => void,
    tools?: Tool[],
  ): Promise<GenerateResult> {
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemMessages = messages.filter((m) => m.role === 'system');
    const systemText = systemMessages.map((m) => m.content).join('\n\n');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const modelOptions: any = { model };
    if (systemText) {
      modelOptions.systemInstruction = systemText;
    }

    const genModel = genAI.getGenerativeModel(modelOptions);

    const contents = this.toGeminiContents(nonSystemMessages);
    const geminiTools = tools && tools.length > 0 ? this.toGeminiTools(tools) : undefined;

    const requestParams: any = { contents };
    if (geminiTools) {
      requestParams.tools = geminiTools;
    }

    const result = await genModel.generateContentStream(requestParams);

    let fullText = '';

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullText += text;
        onChunk({ type: 'delta', content: text });
      }
    }

    onChunk({ type: 'final', content: fullText });

    const response = await result.response;
    const finishReason = response.candidates?.[0]?.finishReason || 'STOP';

    return {
      type: 'text',
      text: fullText,
      toolCalls: [],
      stopReason: this.mapStopReason(finishReason),
    };
  }

  // --- Private helpers ---

  private parseResponse(response: any): GenerateResult {
    const candidate = response.candidates?.[0];
    const parts: Part[] = candidate?.content?.parts || [];

    const textParts: string[] = [];
    const toolCalls: ToolCall[] = [];

    for (const part of parts) {
      if ('text' in part && part.text) {
        textParts.push(part.text);
      }
      if ('functionCall' in part && part.functionCall) {
        const fc = part.functionCall;
        toolCalls.push({
          id: crypto.randomUUID(),
          name: fc.name,
          input: (fc.args as Record<string, any>) || {},
        });
      }
    }

    const finishReason = candidate?.finishReason || 'STOP';

    return {
      type: toolCalls.length > 0 ? 'tool_use' : 'text',
      text: textParts.join('\n'),
      toolCalls,
      stopReason: this.mapStopReason(finishReason),
    };
  }

  private mapStopReason(reason: string): string {
    switch (reason) {
      case 'STOP':
        return 'end_turn';
      case 'MAX_TOKENS':
        return 'max_tokens';
      case 'SAFETY':
        return 'safety';
      case 'RECITATION':
        return 'recitation';
      default:
        return reason.toLowerCase();
    }
  }

  private toGeminiContents(messages: LLMMessage[]): Content[] {
    const result: Content[] = [];

    for (const msg of messages) {
      if (msg.role === 'user') {
        result.push({
          role: 'user',
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === 'assistant') {
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          // Assistant message with function calls
          const parts: Part[] = [];
          if (msg.content) {
            parts.push({ text: msg.content });
          }
          for (const tc of msg.toolCalls) {
            parts.push({
              functionCall: {
                name: tc.name,
                args: tc.input,
              },
            } as Part);
          }
          result.push({ role: 'model', parts });
        } else {
          result.push({
            role: 'model',
            parts: [{ text: msg.content }],
          });
        }
      } else if (msg.role === 'tool') {
        // Tool results go as user messages with functionResponse parts
        result.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: msg.toolCallId || 'unknown',
                response: { result: msg.content },
              },
            } as Part,
          ],
        });
      }
    }

    return result;
  }

  private toGeminiTools(tools: Tool[]): FunctionDeclarationsTool[] {
    return [
      {
        functionDeclarations: tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        })),
      },
    ] as FunctionDeclarationsTool[];
  }
}

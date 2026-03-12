import { ClaudeProvider } from './claudeProvider.js';
import { OpenAIProvider } from './openaiProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import type { LLMProvider } from './types.js';
export { AVAILABLE_MODELS } from './types.js';
export type { LLMMessage, Tool, ToolCall, GenerateResult, StreamChunk, LLMProvider } from './types.js';

const providers: Record<string, LLMProvider> = {
  anthropic: new ClaudeProvider(),
  openai: new OpenAIProvider(),
  google: new GeminiProvider(),
};

export function getProviderForModel(model: string): LLMProvider {
  if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) return providers.openai;
  if (model.startsWith('gemini-')) return providers.google;
  return providers.anthropic;
}

export function getProviderByName(name: string): LLMProvider {
  const p = providers[name];
  if (!p) throw new Error(`Unknown LLM provider: ${name}`);
  return p;
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrainCircuit, X, Plus, Send } from 'lucide-react';
import { api } from '../../lib/api';
import AgentSelector from './AgentSelector';
import ChatMessage from './ChatMessage';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function AgentChatPanel({ open, onClose }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load agents on mount
  useEffect(() => {
    if (!open) return;
    api.get('/agents').then((res) => {
      const list = res.data || res.agents || [];
      setAgents(list);
      if (list.length > 0 && !selectedAgentId) {
        setSelectedAgentId(list[0].id);
      }
    }).catch(() => {});
  }, [open]);

  // Start new chat when agent changes
  useEffect(() => {
    if (selectedAgentId && open) {
      startNewChat();
    }
  }, [selectedAgentId]);

  async function startNewChat() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setMessages([]);
    setStreaming(false);
    setConversationId(null);
    try {
      const res = await api.post('/chat/start', { agentId: selectedAgentId });
      setConversationId(res.data?.conversationId || res.conversationId);
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || !conversationId || streaming) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setStreaming(true);

    // Add empty assistant message that we'll stream into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/chat/${conversationId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.token || parsed.content || parsed.text) {
                const chunk = parsed.token || parsed.content || parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + chunk,
                    };
                  }
                  return updated;
                });
              }
              if (parsed.error) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content || `Error: ${parsed.error}`,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Not JSON, treat as plain text token
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + data,
                  };
                }
                return updated;
              });
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant' && !last.content) {
            updated[updated.length - 1] = {
              ...last,
              content: `Error: ${err.message}`,
            };
          }
          return updated;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 420,
        height: '100vh',
        zIndex: 1000,
        background: 'var(--bg-primary, #fff)',
        borderLeft: '1px solid var(--border-subtle, #e2e8f0)',
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease',
        boxShadow: open ? '-4px 0 24px rgba(0,0,0,0.12)' : 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrainCircuit size={20} style={{ color: 'var(--text-primary, #1e293b)' }} />
          <span
            style={{
              fontWeight: 600,
              fontSize: 16,
              color: 'var(--text-primary, #1e293b)',
            }}
          >
            AI Agent
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={startNewChat}
            title="New chat"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              color: 'var(--text-primary, #1e293b)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              color: 'var(--text-primary, #1e293b)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Agent selector */}
      <div style={{ padding: '12px 16px 8px' }}>
        <AgentSelector
          agents={agents}
          selectedId={selectedAgentId}
          onSelect={setSelectedAgentId}
          compact
        />
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary, #64748b)',
              fontSize: 14,
              padding: 32,
              textAlign: 'center',
            }}
          >
            Ask the AI agent anything about finance, crypto, or the show.
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            streaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          background: 'var(--bg-secondary, #f8fafc)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={streaming || !conversationId}
            style={{
              flex: 1,
              resize: 'none',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 14,
              lineHeight: 1.5,
              background: 'var(--bg-primary, #fff)',
              color: 'var(--text-primary, #1e293b)',
              outline: 'none',
              maxHeight: 120,
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim() || !conversationId}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: 'none',
              background:
                streaming || !input.trim()
                  ? 'var(--bg-subtle, #e2e8f0)'
                  : 'linear-gradient(135deg, #D94E2A, #F0A030)',
              color:
                streaming || !input.trim()
                  ? 'var(--text-secondary, #94a3b8)'
                  : '#fff',
              cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

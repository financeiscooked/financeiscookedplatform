import { useMemo } from 'react';

const styles = {
  wrapper: {
    display: 'flex',
    gap: 12,
    padding: '12px 16px',
    alignItems: 'flex-start',
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  avatarAssistant: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--bg-subtle, #f1f5f9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: 'var(--text-primary, #1e293b)',
    fontSize: 14,
    lineHeight: 1.6,
  },
  cursor: {
    display: 'inline-block',
    width: 2,
    height: 16,
    background: 'var(--text-primary, #1e293b)',
    marginLeft: 2,
    verticalAlign: 'text-bottom',
    animation: 'blink 1s step-end infinite',
  },
};

const keyframesInjected = { current: false };

function injectKeyframes() {
  if (keyframesInjected.current) return;
  keyframesInjected.current = true;
  const style = document.createElement('style');
  style.textContent = `@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
  document.head.appendChild(style);
}

export default function ChatMessage({ role, content, streaming }) {
  useMemo(() => {
    if (streaming) injectKeyframes();
  }, [streaming]);

  const isUser = role === 'user';

  return (
    <div style={styles.wrapper}>
      <div style={isUser ? styles.avatarUser : styles.avatarAssistant}>
        {isUser ? '\uD83D\uDC64' : '\uD83E\uDD16'}
      </div>
      <div style={styles.content}>
        {content}
        {streaming && <span style={styles.cursor} />}
      </div>
    </div>
  );
}

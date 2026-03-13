import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import AgentChatPanel from './AgentChatPanel';

export default function AgentChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AgentChatPanel open={open} onClose={() => setOpen(false)} />
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #D94E2A, #F0A030)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: open ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(217, 78, 42, 0.4)',
          zIndex: 999,
          transition: 'transform 0.2s',
        }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}

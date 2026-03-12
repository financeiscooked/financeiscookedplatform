export default function AgentSelector({ agents, selectedId, onSelect, compact }) {
  return (
    <select
      value={selectedId || ''}
      onChange={(e) => onSelect(e.target.value)}
      style={{
        width: '100%',
        padding: compact ? '6px 10px' : '10px 14px',
        fontSize: compact ? 13 : 14,
        border: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: 8,
        background: 'var(--bg-primary, #fff)',
        color: 'var(--text-primary, #1e293b)',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'auto',
      }}
    >
      {(!agents || agents.length === 0) && (
        <option value="" disabled>No agents available</option>
      )}
      {agents && agents.map((agent) => (
        <option key={agent.id} value={agent.id}>
          {agent.name}
        </option>
      ))}
    </select>
  );
}

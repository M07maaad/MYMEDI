// ─── Shared UI Components ─────────────────────────────────────

export function Card({ children, style = {}, glow, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#111827',
      border: `1px solid ${glow ? glow + '40' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 16,
      padding: 20,
      boxShadow: glow ? `0 0 24px ${glow}15` : 'none',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  )
}

export function Badge({ label, color = '#10D9A0' }) {
  return (
    <span style={{
      background: `${color}18`, color,
      borderRadius: 6, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
      border: `1px solid ${color}30`,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <div>
        <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: '#6B7A99', fontSize: 13, margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && <label style={{ color: '#9BA8BF', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>{label}</label>}
      <input {...props} style={{
        width: '100%', background: '#111827',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '14px 16px',
        color: '#F0F4FF', fontSize: 15,
        fontFamily: 'Cairo, sans-serif', outline: 'none',
        boxSizing: 'border-box',
        ...props.style,
      }} />
    </div>
  )
}

export function Button({ children, variant = 'primary', style = {}, ...props }) {
  const styles = {
    primary: { background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', color: '#000' },
    secondary: { background: 'rgba(16,217,160,0.12)', color: '#10D9A0', border: '1px solid rgba(16,217,160,0.3)' },
    danger: { background: 'rgba(255,107,107,0.12)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.3)' },
  }
  return (
    <button {...props} style={{
      border: 'none', borderRadius: 14, padding: '14px 24px',
      fontSize: 15, fontWeight: 800, cursor: 'pointer',
      fontFamily: 'Cairo, sans-serif', width: '100%',
      ...styles[variant], ...style,
    }}>{children}</button>
  )
}

export function LoadingSpinner({ color = '#10D9A0' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `3px solid rgba(255,255,255,0.1)`,
        borderTopColor: color,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
      <div style={{ color: '#F0F4FF', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{title}</div>
      {subtitle && <div style={{ color: '#6B7A99', fontSize: 14, marginBottom: 24 }}>{subtitle}</div>}
      {action}
    </div>
  )
}

export function ProgressRing({ percent, color = '#10D9A0', size = 64 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - percent / 100)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}

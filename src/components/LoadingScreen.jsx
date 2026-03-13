export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#070B14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{ fontSize: 48 }}>💊</div>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#10D9A0',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

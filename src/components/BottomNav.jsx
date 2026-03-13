import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/',             icon: '🏠', label: 'الرئيسية' },
  { path: '/medications',  icon: '💊', label: 'أدويتي'   },
  { path: '/schedule',     icon: '📅', label: 'الجدول'   },
  { path: '/interactions', icon: '⚠️', label: 'التفاعلات'},
  { path: '/profile',      icon: '👤', label: 'حسابي'    },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: '#0D1321',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', padding: '8px 0 14px',
      zIndex: 100,
    }}>
      {tabs.map(t => {
        const active = pathname === t.path
        return (
          <button key={t.path} onClick={() => navigate(t.path)}
            style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: active ? 700 : 400,
              color: active ? '#10D9A0' : '#6B7A99',
              transition: 'color 0.2s',
            }}>{t.label}</span>
            {active && (
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#10D9A0' }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}

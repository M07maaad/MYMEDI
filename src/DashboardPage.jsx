import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMedications } from '../hooks/useMedications'
import { Card, Badge, ProgressRing } from '../components/UI'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { medications, interactions, logDose, fetchDoseLogsToday } = useMedications()
  const [doseLogs, setDoseLogs] = useState([])
  const navigate = useNavigate()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء النور' : 'مساء الخير'
  const currentPeriod = hour < 12 ? 'صبح' : hour < 17 ? 'ظهر' : hour < 20 ? 'مساء' : 'ليل'

  useEffect(() => {
    fetchDoseLogsToday().then(setDoseLogs)
  }, [medications])

  // Calculate adherence
  const allDoses = medications.flatMap(m => m.dose_times.map(t => ({ ...m, period: t })))
  const takenCount = doseLogs.filter(l => l.was_taken).length
  const pct = allDoses.length ? Math.round((takenCount / allDoses.length) * 100) : 0

  // Upcoming doses for current period
  const takenIds = new Set(doseLogs.filter(l => l.was_taken && l.scheduled_time === currentPeriod).map(l => l.medication_id))
  const upcomingDoses = medications.filter(m => m.dose_times.includes(currentPeriod) && !takenIds.has(m.id))

  const lowStock = medications.filter(m => m.stock_count > 0 && m.stock_count <= 7)

  return (
    <div style={{ padding: '24px 20px 100px', direction: 'rtl', fontFamily: 'Cairo, sans-serif', minHeight: '100vh', background: '#070B14' }}>
      {/* Glow */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,217,160,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <p style={{ color: '#6B7A99', fontSize: 13, margin: 0 }}>{greeting} 👋</p>
          <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: '4px 0 0' }}>
            {profile?.full_name || 'مرحباً'}
          </h1>
        </div>
        <div onClick={() => navigate('/profile')} style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer' }}>
          👤
        </div>
      </div>

      {/* Adherence */}
      <Card glow="#10D9A0" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #0D1F1A, #0D1321)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#6B7A99', fontSize: 12, margin: '0 0 4px' }}>الالتزام اليومي</p>
            <h2 style={{ color: '#10D9A0', fontSize: 38, fontWeight: 800, margin: '0 0 4px' }}>{pct}%</h2>
            <p style={{ color: '#9BA8BF', fontSize: 13, margin: 0 }}>{takenCount} من {allDoses.length} جرعة</p>
          </div>
          <div style={{ position: 'relative' }}>
            <ProgressRing percent={pct} color="#10D9A0" size={72} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💊</div>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {(interactions.length > 0 || lowStock.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: interactions.length > 0 && lowStock.length > 0 ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 16 }}>
          {interactions.length > 0 && (
            <Card style={{ background: 'rgba(255,107,107,0.08)', cursor: 'pointer', padding: 16 }} onClick={() => navigate('/interactions')}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>⚠️</div>
              <div style={{ color: '#FF6B6B', fontWeight: 700, fontSize: 13 }}>تفاعل دوائي</div>
              <div style={{ color: '#6B7A99', fontSize: 11, marginTop: 2 }}>{interactions.length} تنبيه</div>
            </Card>
          )}
          {lowStock.length > 0 && (
            <Card style={{ background: 'rgba(251,191,36,0.08)', padding: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📦</div>
              <div style={{ color: '#FBBF24', fontWeight: 700, fontSize: 13 }}>مخزون منخفض</div>
              <div style={{ color: '#6B7A99', fontSize: 11, marginTop: 2 }}>{lowStock.map(m => m.trade_name || m.generic_name).join('، ')}</div>
            </Card>
          )}
        </div>
      )}

      {/* Upcoming doses */}
      {upcomingDoses.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: '#6B7A99', fontSize: 12, fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>جرعات الآن 🕐</p>
          {upcomingDoses.map((med) => (
            <Card key={med.id} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${med.color || '#10D9A0'}20`, border: `2px solid ${med.color || '#10D9A0'}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💊</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#F0F4FF', fontWeight: 700, fontSize: 15 }}>{med.trade_name || med.generic_name}</div>
                <div style={{ color: '#6B7A99', fontSize: 12 }}>{med.dose} — {med.with_food ? 'مع الأكل 🍽️' : 'على معدة فارغة'}</div>
              </div>
              <button onClick={() => logDose(med.id, currentPeriod, true).then(() => fetchDoseLogsToday().then(setDoseLogs))}
                style={{ background: 'rgba(16,217,160,0.12)', border: '1px solid rgba(16,217,160,0.3)', borderRadius: 10, padding: '8px 14px', color: '#10D9A0', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                أخذت ✓
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <p style={{ color: '#6B7A99', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>الإجراءات السريعة</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { icon: '💊', label: 'أضف دواء',    path: '/medications/add', color: '#10D9A0' },
          { icon: '📅', label: 'الجدول',       path: '/schedule',        color: '#38BDF8' },
          { icon: '🧪', label: 'تحاليلي',      path: '/labs',            color: '#FBBF24' },
          { icon: '📱', label: 'QR الطبي',     path: '/profile',         color: '#A78BFA' },
        ].map((a) => (
          <Card key={a.path} onClick={() => navigate(a.path)} style={{ cursor: 'pointer', textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ color: a.color, fontWeight: 700, fontSize: 13 }}>{a.label}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

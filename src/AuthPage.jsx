import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Input, Button } from '../components/UI'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'patient' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  async function handleSubmit() {
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        await signIn({ email: form.email, password: form.password })
      } else {
        await signUp({ email: form.email, password: form.password, fullName: form.fullName, role: form.role })
      }
      navigate('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 24px', direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
      {/* Glow */}
      <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,217,160,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>💊</div>
        <h1 style={{ color: '#F0F4FF', fontSize: 28, fontWeight: 900, margin: 0 }}>MediGuard</h1>
        <p style={{ color: '#6B7A99', fontSize: 14, marginTop: 6 }}>صديقك الدوائي الذكي</p>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', background: '#111827', borderRadius: 14, padding: 4, marginBottom: 32 }}>
        {[['login', 'تسجيل الدخول'], ['signup', 'حساب جديد']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, background: mode === m ? '#10D9A0' : 'transparent',
            border: 'none', borderRadius: 10, padding: '10px 0',
            color: mode === m ? '#000' : '#6B7A99',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {mode === 'signup' && (
        <>
          <Input label="الاسم الكامل" placeholder="مثال: أحمد محمد" value={form.fullName} onChange={e => update('fullName', e.target.value)} />

          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#9BA8BF', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>نوع الحساب</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[['patient', '🧑 مريض'], ['pharmacist', '👨‍⚕️ صيدلاني']].map(([r, label]) => (
                <button key={r} onClick={() => update('role', r)} style={{
                  flex: 1, background: form.role === r ? 'rgba(16,217,160,0.15)' : '#111827',
                  border: `1px solid ${form.role === r ? '#10D9A0' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 10, padding: '12px 0',
                  color: form.role === r ? '#10D9A0' : '#6B7A99',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                }}>{label}</button>
              ))}
            </div>
          </div>
        </>
      )}

      <Input label="البريد الإلكتروني" type="email" placeholder="example@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
      <Input label="كلمة المرور" type="password" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} />

      {error && (
        <div style={{ background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '12px 16px', color: '#FF6B6B', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
          {error}
        </div>
      )}

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? '...' : mode === 'login' ? 'دخول →' : 'إنشاء الحساب →'}
      </Button>
    </div>
  )
}

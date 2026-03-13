import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useMedications } from '../hooks/useMedications'

const S = {
  page:   { padding: '24px 20px 100px', direction: 'rtl', fontFamily: 'Cairo, sans-serif', minHeight: '100vh', background: '#070B14' },
  label:  { color: '#9BA8BF', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 },
  input:  { width: '100%', background: '#070B14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#F0F4FF', fontSize: 14, fontFamily: 'Cairo, sans-serif', outline: 'none', boxSizing: 'border-box' },
  btn:    { width: '100%', background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', border: 'none', borderRadius: 14, padding: '14px 0', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' },
  btnSec: { width: '100%', background: 'rgba(16,217,160,0.1)', border: '1px solid rgba(16,217,160,0.3)', borderRadius: 14, padding: '13px 0', color: '#10D9A0', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' },
}

export default function ProfilePage() {
  const { profile, signOut, updateProfile } = useAuth()
  const { medications } = useMedications()

  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const [form, setForm] = useState({
    full_name:  profile?.full_name  || '',
    age:        profile?.age        || '',
    weight:     profile?.weight     || '',
    height:     profile?.height     || '',
    blood_type: profile?.blood_type || '',
  })

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave() {
    setSaving(true); setError('')
    try {
      await updateProfile({
        full_name:  form.full_name,
        age:        form.age     ? parseInt(form.age)      : null,
        weight:     form.weight  ? parseFloat(form.weight) : null,
        height:     form.height  ? parseFloat(form.height) : null,
        blood_type: form.blood_type || null,
      })
      setEditing(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={S.page}>

      {/* ── Avatar + Name ───────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
          👤
        </div>
        <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>
          {profile?.full_name || 'المستخدم'}
        </h1>
        <span style={{ background: 'rgba(16,217,160,0.12)', color: '#10D9A0', borderRadius: 8, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
          {profile?.role === 'pharmacist' ? '👨‍⚕️ صيدلاني' : '🧑 مريض'}
        </span>
      </div>

      {/* ── Edit Mode ───────────────────────────────────────── */}
      {editing ? (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ color: '#10D9A0', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>✏️ تعديل البيانات</div>

          {[
            ['full_name', 'الاسم الكامل',  'text',   'أحمد محمد'],
            ['age',       'العمر',          'number', '25'],
            ['weight',    'الوزن (كجم)',    'number', '70'],
            ['height',    'الطول (سم)',     'number', '175'],
          ].map(([key, label, type, placeholder]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={S.label}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={e => update(key, e.target.value)}
                style={S.input}
              />
            </div>
          ))}

          {/* Blood Type */}
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>فصيلة الدم</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                <button key={bt} onClick={() => update('blood_type', bt)} style={{
                  background: form.blood_type === bt ? 'rgba(255,107,107,0.2)' : '#111827',
                  border: `1px solid ${form.blood_type === bt ? '#FF6B6B' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8, padding: '7px 14px',
                  color: form.blood_type === bt ? '#FF6B6B' : '#6B7A99',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                }}>{bt}</button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ color: '#FF6B6B', fontSize: 13, marginBottom: 12 }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{ ...S.btn, flex: 2 }}>
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات ✓'}
            </button>
            <button onClick={() => { setEditing(false); setError('') }} style={{ ...S.btnSec, flex: 1 }}>
              إلغاء
            </button>
          </div>
        </div>

      ) : (
        <>
          {/* ── Stats Grid ──────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              ['العمر',   profile?.age,        'سنة'],
              ['الوزن',   profile?.weight,      'كجم'],
              ['الطول',   profile?.height,      'سم'],
              ['الفصيلة', profile?.blood_type,  ''],
            ].map(([label, value, unit]) => (
              <div key={label} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ color: value ? '#10D9A0' : '#6B7A99', fontSize: 18, fontWeight: 800 }}>{value || '—'}</div>
                {unit && <div style={{ color: '#6B7A99', fontSize: 10 }}>{unit}</div>}
                <div style={{ color: '#9BA8BF', fontSize: 11, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── Edit Button ─────────────────────────────────── */}
          <button onClick={() => setEditing(true)} style={{ ...S.btnSec, marginBottom: 16 }}>
            ✏️ تعديل البيانات الشخصية
          </button>
        </>
      )}

      {/* ── Medications Count ───────────────────────────────── */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ color: '#9BA8BF', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>💊 الأدوية النشطة</div>
        <div style={{ color: '#F0F4FF', fontSize: 28, fontWeight: 800 }}>
          {medications.length} <span style={{ color: '#6B7A99', fontSize: 14, fontWeight: 400 }}>دواء</span>
        </div>
      </div>

      {/* ── QR Code ─────────────────────────────────────────── */}
      <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>📱</div>
        <div style={{ color: '#A78BFA', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>QR التاريخ الطبي</div>
        <p style={{ color: '#6B7A99', fontSize: 13, marginBottom: 16 }}>
          اعرضه للدكتور ليشوف تاريخك الطبي كامل فوراً
        </p>
        <button style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 12, padding: '11px 28px', color: '#A78BFA', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          عرض QR Code
        </button>
      </div>

      {/* ── Sign Out ────────────────────────────────────────── */}
      <button onClick={signOut} style={{ width: '100%', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 14, padding: '14px 0', color: '#FF6B6B', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
        تسجيل الخروج
      </button>

    </div>
  )
}

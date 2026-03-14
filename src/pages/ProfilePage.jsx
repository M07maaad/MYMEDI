import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useMedications } from '../hooks/useMedications'
import { supabase } from '../lib/supabase'

const S = {
  page:    { padding: '24px 20px 100px', direction: 'rtl', fontFamily: 'Cairo, sans-serif', minHeight: '100vh', background: '#070B14' },
  card:    { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 16 },
  label:   { color: '#9BA8BF', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 },
  input:   { width: '100%', background: '#070B14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#F0F4FF', fontSize: 14, fontFamily: 'Cairo, sans-serif', outline: 'none', boxSizing: 'border-box' },
  btn:     { width: '100%', background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', border: 'none', borderRadius: 14, padding: '14px 0', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' },
  btnSec:  { width: '100%', background: 'rgba(16,217,160,0.1)', border: '1px solid rgba(16,217,160,0.3)', borderRadius: 14, padding: '13px 0', color: '#10D9A0', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' },
  btnGhost:{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '13px 0', color: '#9BA8BF', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' },
}

// - QR Code generator بدون library -
// بيستخدم Google Charts API علشان يعمل QR حقيقي
function QRDisplay({ profile, medications, conditions }) {
  const lines = [
    'MediGuard ' + (profile?.full_name || ''),
    profile?.age        ? 'Age ' + profile.age         : '',
    profile?.blood_type ? 'Blood ' + profile.blood_type : '',
    profile?.weight     ? profile.weight + 'kg'         : '',
    conditions.map(c => c.name).join(', '),
    medications.slice(0, 5).map(m => m.trade_name || m.generic_name).join(', '),
  ].filter(Boolean)

  const qrText = lines.join(' | ')
  const qrUrl  = 'https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=' + encodeURIComponent(qrText)

  const meds = medications.slice(0, 10).map(m => {
    const name = m.trade_name || m.generic_name
    const dose = m.dose && m.dose !== '-' ? ' ' + m.dose : ''
    return name + dose
  })

  const htmlContent = [
    '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>ملف ' + (profile?.full_name || '') + ' الطبي</title>',
    '<style>',
    '* { margin:0; padding:0; box-sizing:border-box; }',
    'body { font-family: Arial,sans-serif; background:#070B14; color:#F0F4FF; padding:20px; direction:rtl; }',
    '.header { text-align:center; padding:28px; background:rgba(16,217,160,0.1); border-radius:16px; margin-bottom:16px; border:1px solid rgba(16,217,160,0.3); }',
    '.name { font-size:24px; font-weight:800; color:#10D9A0; }',
    '.date { font-size:12px; color:#6B7A99; margin-top:4px; }',
    '.stats { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; margin-bottom:16px; }',
    '.stat { background:#111827; border-radius:10px; padding:12px 6px; text-align:center; border:1px solid rgba(255,255,255,0.07); }',
    '.val { font-size:18px; font-weight:800; color:#10D9A0; }',
    '.lbl { font-size:10px; color:#6B7A99; margin-top:2px; }',
    '.blood { color:#FF6B6B !important; }',
    '.section { background:#111827; border-radius:12px; padding:16px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.07); }',
    '.sec-title { font-size:14px; font-weight:700; color:#9BA8BF; margin-bottom:10px; }',
    '.tag { display:inline-block; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:600; margin:3px; }',
    '.med { background:rgba(16,217,160,0.12); color:#10D9A0; border:1px solid rgba(16,217,160,0.2); }',
    '.cond { background:rgba(248,113,113,0.12); color:#FCA5A5; border:1px solid rgba(248,113,113,0.2); }',
    '.footer { text-align:center; padding:16px; color:#4B5563; font-size:11px; }',
    '</style></head><body>',
    '<div class="header">',
    '<div style="font-size:36px;margin-bottom:8px">🏥</div>',
    '<div class="name">' + (profile?.full_name || '') + '</div>',
    '<div class="date">MediGuard · ' + new Date().toLocaleDateString('ar-EG') + '</div>',
    '</div>',
    '<div class="stats">',
    '<div class="stat"><div class="val">' + (profile?.age || '--') + '</div><div class="lbl">العمر</div></div>',
    '<div class="stat"><div class="val">' + (profile?.weight || '--') + '</div><div class="lbl">كجم</div></div>',
    '<div class="stat"><div class="val">' + (profile?.height || '--') + '</div><div class="lbl">سم</div></div>',
    '<div class="stat"><div class="val blood">' + (profile?.blood_type || '--') + '</div><div class="lbl">الفصيلة</div></div>',
    '</div>',
  ].join('')

  const condHtml = conditions.length > 0
    ? '<div class="section"><div class="sec-title">🏥 الأمراض المزمنة</div>'
      + conditions.map(c => '<span class="tag cond">' + c.name + '</span>').join('')
      + '</div>'
    : ''

  const medHtml = meds.length > 0
    ? '<div class="section"><div class="sec-title">💊 الأدوية (' + meds.length + ')</div>'
      + meds.map(m => '<span class="tag med">' + m + '</span>').join('')
      + '</div>'
    : ''

  const fullHtml = htmlContent + condHtml + medHtml
    + '<div class="footer">تم إنشاؤه بواسطة MediGuard · للاستخدام الطبي فقط</div>'
    + '</body></html>'

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'inline-block', marginBottom: 16 }}>
        <img src={qrUrl} alt="QR" width={200} height={200} style={{ display: 'block' }}
          onError={e => { e.target.style.display = 'none' }} />
      </div>

      <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 14, padding: 18, textAlign: 'right', marginBottom: 16 }}>
        <div style={{ color: '#A78BFA', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📋 ملخص الملف الطبي</div>
        <div style={{ lineHeight: 2.2, fontSize: 14 }}>
          <div style={{ color: '#F0F4FF' }}>👤 {profile?.full_name}{profile?.age ? ' · ' + profile.age + ' سنة' : ''}</div>
          {profile?.blood_type && <div style={{ color: '#FF6B6B' }}>🩸 فصيلة الدم: <strong>{profile.blood_type}</strong></div>}
          {(profile?.weight || profile?.height) && (
            <div style={{ color: '#9BA8BF' }}>⚖️ {profile?.weight ? profile.weight + ' كجم' : ''}{profile?.height ? ' · ' + profile.height + ' سم' : ''}</div>
          )}
          {conditions.length > 0 && (
            <div style={{ color: '#FCA5A5' }}>🏥 {conditions.map(c => c.name).join('، ')}</div>
          )}
          {medications.length > 0 && (
            <div style={{ color: '#10D9A0' }}>💊 {medications.slice(0,5).map(m => m.trade_name || m.generic_name).join('، ')}{medications.length > 5 ? ' +' + (medications.length - 5) : ''}</div>
          )}
        </div>
      </div>

      <button onClick={() => {
        const blob = new Blob([fullHtml], { type: 'text/html' })
        const url  = URL.createObjectURL(blob)
        window.open(url, '_blank')
      }} style={{ width: '100%', background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', border: 'none', borderRadius: 14, padding: '14px 0', color: '#000', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', marginBottom: 8 }}>
        🔗 عرض الملف الطبي كامل
      </button>
      <div style={{ color: '#6B7A99', fontSize: 12 }}>اعرض الـ QR للدكتور أو اضغط عرض الملف كامل</div>
    </div>
  )
}


// - ProfilePage -
export default function ProfilePage() {
  const { profile, signOut, updateProfile, user } = useAuth()
  const { medications } = useMedications()

  const [editing,    setEditing]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [showQR,     setShowQR]     = useState(false)
  const [conditions, setConditions] = useState([])
  const [newCond,    setNewCond]    = useState('')
  const [addingCond, setAddingCond] = useState(false)

  const [form, setForm] = useState({
    full_name:  profile?.full_name  || '',
    age:        profile?.age        || '',
    weight:     profile?.weight     || '',
    height:     profile?.height     || '',
    blood_type: profile?.blood_type || '',
  })
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // جيب الأمراض من Supabase
  useEffect(() => {
    if (!user) return
    supabase.from('conditions').select('*').eq('user_id', user.id)
      .then(({ data }) => setConditions(data || []))
  }, [user])

  async function handleSave() {
    setSaving(true); setError('')
    try {
      await updateProfile({
        full_name:  form.full_name,
        age:        form.age    ? parseInt(form.age)      : null,
        weight:     form.weight ? parseFloat(form.weight) : null,
        height:     form.height ? parseFloat(form.height) : null,
        blood_type: form.blood_type || null,
      })
      setEditing(false)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function addCondition() {
    if (!newCond.trim() || !user) return
    setAddingCond(true)
    const { data, error } = await supabase
      .from('conditions').insert({ user_id: user.id, name: newCond.trim() })
      .select().single()
    if (!error && data) { setConditions(p => [...p, data]); setNewCond('') }
    setAddingCond(false)
  }

  async function removeCondition(id) {
    await supabase.from('conditions').delete().eq('id', id)
    setConditions(p => p.filter(c => c.id !== id))
  }

  return (
    <div style={S.page}>

      {/* -- Avatar + Name ------------------------------------ */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👤</div>
        <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>{profile?.full_name || 'المستخدم'}</h1>
        <span style={{ background: 'rgba(16,217,160,0.12)', color: '#10D9A0', borderRadius: 8, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
          {profile?.role === 'pharmacist' ? '👨‍⚕️ صيدلاني' : '🧑 مريض'}
        </span>
      </div>

      {/* -- Stats Grid ---------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[['العمر', profile?.age, 'سنة'], ['الوزن', profile?.weight, 'كجم'], ['الطول', profile?.height, 'سم'], ['الفصيلة', profile?.blood_type, '']].map(([l, v, u]) => (
          <div key={l} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ color: v ? '#10D9A0' : '#6B7A99', fontSize: 18, fontWeight: 800 }}>{v || '--'}</div>
            {u && <div style={{ color: '#6B7A99', fontSize: 10 }}>{u}</div>}
            <div style={{ color: '#9BA8BF', fontSize: 11, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Edit Button */}
      {!editing && (
        <button onClick={() => setEditing(true)} style={{ ...S.btnSec, marginBottom: 16 }}>
          ✏️ تعديل البيانات الشخصية
        </button>
      )}

      {/* Edit Form */}
      {editing && (
        <div style={S.card}>
          <div style={{ color: '#10D9A0', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>✏️ تعديل البيانات</div>
          {[['full_name','الاسم الكامل','text','أحمد محمد'], ['age','العمر','number','25'], ['weight','الوزن (كجم)','number','70'], ['height','الطول (سم)','number','175']].map(([key, lbl, type, ph]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={S.label}>{lbl}</label>
              <input type={type} placeholder={ph} value={form[key]} onChange={e => update(key, e.target.value)} style={S.input} />
            </div>
          ))}
          <div style={{ marginBottom: 18 }}>
            <label style={S.label}>فصيلة الدم</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => (
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
          {error && <div style={{ color: '#FF6B6B', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{ ...S.btn, flex: 2 }}>
              {saving ? 'جاري...' : 'حفظ ✓'}
            </button>
            <button onClick={() => { setEditing(false); setError('') }} style={{ ...S.btnGhost, flex: 1 }}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* -- الأمراض المزمنة والسابقة ------------------------ */}
      <div style={S.card}>
        <div style={{ color: '#F0F4FF', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>🏥 الأمراض المزمنة والسابقة</div>

        {/* Tags */}
        {conditions.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {conditions.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 20, padding: '6px 14px' }}>
                <span style={{ color: '#FCA5A5', fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                <button onClick={() => removeCondition(c.id)} style={{ background: 'none', border: 'none', color: '#6B7A99', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1, marginRight: 2 }}>×</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#4B5563', fontSize: 13, marginBottom: 14, fontStyle: 'italic' }}>
            لا يوجد أمراض مسجلة -- أضف أمراضك المزمنة أو الجراحات السابقة
          </div>
        )}

        {/* Add new condition */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newCond}
            onChange={e => setNewCond(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCondition()}
            placeholder="مثال: سكر النوع الثاني، ضغط الدم، قصور القلب..."
            style={{ ...S.input, flex: 1, padding: '10px 14px', fontSize: 13 }}
          />
          <button onClick={addCondition} disabled={addingCond || !newCond.trim()} style={{
            background: newCond.trim() ? 'rgba(16,217,160,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${newCond.trim() ? 'rgba(16,217,160,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, padding: '10px 18px',
            color: newCond.trim() ? '#10D9A0' : '#4B5563',
            fontWeight: 800, fontSize: 18, cursor: newCond.trim() ? 'pointer' : 'default', flexShrink: 0,
          }}>+</button>
        </div>

        {/* Quick suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {['سكر', 'ضغط', 'قلب', 'كلى', 'كبد', 'ربو', 'غدة درقية', 'نقرس'].map(s => (
            !conditions.find(c => c.name === s) && (
              <button key={s} onClick={() => { setNewCond(s); }} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '4px 12px', color: '#6B7A99',
                fontSize: 12, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
              }}>+ {s}</button>
            )
          ))}
        </div>
      </div>

      {/* -- Medications Count ------------------------------- */}
      <div style={S.card}>
        <div style={{ color: '#9BA8BF', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>💊 الأدوية النشطة</div>
        <div style={{ color: '#F0F4FF', fontSize: 28, fontWeight: 800 }}>
          {medications.length} <span style={{ color: '#6B7A99', fontSize: 14, fontWeight: 400 }}>دواء</span>
        </div>
      </div>

      {/* -- QR التاريخ الطبي -------------------------------- */}
      <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showQR ? 20 : 0 }}>
          <div>
            <div style={{ color: '#A78BFA', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>📱 QR التاريخ الطبي</div>
            <div style={{ color: '#6B7A99', fontSize: 12 }}>اعرضه للدكتور -- فيه ملفك الطبي كامل</div>
          </div>
          <button onClick={() => setShowQR(p => !p)} style={{
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 12, padding: '10px 18px', color: '#A78BFA',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
          }}>
            {showQR ? 'إخفاء' : 'عرض QR'}
          </button>
        </div>

        {showQR && (
          <QRDisplay
            profile={profile}
            medications={medications}
            conditions={conditions}
          />
        )}
      </div>

      {/* Sign out */}
      <button onClick={signOut} style={{ width: '100%', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 14, padding: '14px 0', color: '#FF6B6B', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
        تسجيل الخروج
      </button>
    </div>
  )
}

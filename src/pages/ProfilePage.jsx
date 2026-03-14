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

// - QR Code generator &#1576;&#1583;&#1608;&#1606; library -
// &#1576;&#1610;&#1587;&#1578;&#1582;&#1583;&#1605; Google Charts API &#1593;&#1604;&#1588;&#1575;&#1606; &#1610;&#1593;&#1605;&#1604; QR &#1581;&#1602;&#1610;&#1602;&#1610;
function QRDisplay({ profile, medications, conditions }) {
  // &#1576;&#1606;&#1576;&#1606;&#1610; URL &#1601;&#1610;&#1607; &#1575;&#1604;&#1605;&#1604;&#1601; &#1575;&#1604;&#1591;&#1576;&#1610; &#1603;&#1575;&#1605;&#1604;
  const medicalData = {
    n:  profile?.full_name  || '',
    a:  profile?.age        || '',
    b:  profile?.blood_type || '',
    w:  profile?.weight     || '',
    h:  profile?.height     || '',
    c:  conditions.map(c => c.name),
    m:  medications.slice(0, 10).map(m => `${m.trade_name || m.generic_name}${m.dose && m.dose !== '-' ? ' ' + m.dose : ''}`),
    d:  new Date().toLocaleDateString('ar-EG'),
  }

  // &#1576;&#1606;&#1593;&#1605;&#1604; &#1589;&#1601;&#1581;&#1577; HTML &#1576;&#1587;&#1610;&#1591;&#1577; &#1578;&#1592;&#1607;&#1585; &#1575;&#1604;&#1605;&#1604;&#1601; &#1575;&#1604;&#1591;&#1576;&#1610;
  const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>&#1605;&#1604;&#1601; ${medicalData.n} &#1575;&#1604;&#1591;&#1576;&#1610; -- MediGuard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #070B14; color: #F0F4FF; padding: 20px; direction: rtl; }
  .header { text-align: center; padding: 32px 20px; background: linear-gradient(135deg,rgba(16,217,160,0.15),rgba(14,165,233,0.15)); border-radius: 20px; margin-bottom: 20px; border: 1px solid rgba(16,217,160,0.3); }
  .logo { font-size: 40px; margin-bottom: 8px; }
  .name { font-size: 26px; font-weight: 800; color: #10D9A0; margin-bottom: 4px; }
  .date { font-size: 13px; color: #6B7A99; }
  .stats { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .stat { background: #111827; border-radius: 12px; padding: 14px 8px; text-align: center; border: 1px solid rgba(255,255,255,0.07); }
  .stat-val { font-size: 20px; font-weight: 800; color: #10D9A0; }
  .stat-lbl { font-size: 11px; color: #6B7A99; margin-top: 2px; }
  .section { background: #111827; border-radius: 14px; padding: 18px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.07); }
  .section-title { font-size: 15px; font-weight: 700; color: #9BA8BF; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .tag { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin: 4px; }
  .tag-med { background: rgba(16,217,160,0.12); color: #10D9A0; border: 1px solid rgba(16,217,160,0.2); }
  .tag-cond { background: rgba(248,113,113,0.12); color: #FCA5A5; border: 1px solid rgba(248,113,113,0.2); }
  .footer { text-align: center; padding: 20px; color: #4B5563; font-size: 12px; }
  .blood { background: rgba(255,107,107,0.15); color: #FF6B6B; border-radius: 8px; padding: 4px 12px; font-weight: 800; display: inline-block; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">&#127973;</div>
  <div class="name">${medicalData.n}</div>
  <div class="date">&#1570;&#1582;&#1585; &#1578;&#1581;&#1583;&#1610;&#1579;: ${medicalData.d}</div>
</div>
<div class="stats">
  <div class="stat"><div class="stat-val">${medicalData.a || '--'}</div><div class="stat-lbl">&#1575;&#1604;&#1593;&#1605;&#1585;</div></div>
  <div class="stat"><div class="stat-val">${medicalData.w || '--'}</div><div class="stat-lbl">&#1575;&#1604;&#1608;&#1586;&#1606; &#1603;&#1580;&#1605;</div></div>
  <div class="stat"><div class="stat-val">${medicalData.h || '--'}</div><div class="stat-lbl">&#1575;&#1604;&#1591;&#1608;&#1604; &#1587;&#1605;</div></div>
  <div class="stat"><div class="stat-val"><span class="blood">${medicalData.b || '--'}</span></div><div class="stat-lbl">&#1601;&#1589;&#1610;&#1604;&#1577; &#1575;&#1604;&#1583;&#1605;</div></div>
</div>
${medicalData.c.length > 0 ? `
<div class="section">
  <div class="section-title">&#127973; &#1575;&#1604;&#1571;&#1605;&#1585;&#1575;&#1590; &#1575;&#1604;&#1605;&#1586;&#1605;&#1606;&#1577; &#1608;&#1575;&#1604;&#1587;&#1575;&#1576;&#1602;&#1577;</div>
  ${medicalData.c.map(c => `<span class="tag tag-cond">${c}</span>`).join('')}
</div>` : ''}
${medicalData.m.length > 0 ? `
<div class="section">
  <div class="section-title">&#128138; &#1575;&#1604;&#1571;&#1583;&#1608;&#1610;&#1577; &#1575;&#1604;&#1581;&#1575;&#1604;&#1610;&#1577; (${medicalData.m.length})</div>
  ${medicalData.m.map(m => `<span class="tag tag-med">${m}</span>`).join('')}
</div>` : ''}
<div class="footer">&#1578;&#1605; &#1573;&#1606;&#1588;&#1575;&#1572;&#1607; &#1576;&#1608;&#1575;&#1587;&#1591;&#1577; MediGuard &#183; &#1604;&#1604;&#1575;&#1587;&#1578;&#1582;&#1583;&#1575;&#1605; &#1575;&#1604;&#1591;&#1576;&#1610; &#1601;&#1602;&#1591;</div>
</body>
</html>`

  // &#1606;&#1581;&#1608;&#1604; HTML &#1604;&#1600; data URL
  const encoded = encodeURIComponent(htmlContent)
  const dataUrl  = `data:text/html;charset=utf-8,${encoded}`

  // QR Code &#1576;&#1610;&#1601;&#1578;&#1581; &#1575;&#1604;&#1600; data URL &#1583;&#1610;
  // &#1576;&#1606;&#1587;&#1578;&#1582;&#1583;&#1605; QR Server API &#1605;&#1580;&#1575;&#1606;&#1610;
  const qrText   = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent).slice(0, 500)}`
  // &#1576;&#1605;&#1575; &#1573;&#1606; &#1575;&#1604;&#1600; data URL &#1591;&#1608;&#1610;&#1604;&#1577; &#1580;&#1583;&#1575;&#1611; &#1604;&#1604;&#1600; QR&#1548; &#1607;&#1606;&#1593;&#1605;&#1604; &#1589;&#1601;&#1581;&#1577; &#1605;&#1604;&#1582;&#1589; &#1576;&#1587;&#1610;&#1591;&#1577;
  const shortSummary = [
    `&#128100; ${medicalData.n}`,
    medicalData.a ? `&#1575;&#1604;&#1593;&#1605;&#1585;: ${medicalData.a}` : '',
    medicalData.b ? `&#1601;&#1589;&#1610;&#1604;&#1577;: ${medicalData.b}` : '',
    medicalData.c.length ? `&#1571;&#1605;&#1585;&#1575;&#1590;: ${medicalData.c.join('&#1548; ')}` : '',
    medicalData.m.length ? `&#1571;&#1583;&#1608;&#1610;&#1577;: ${medicalData.m.slice(0,5).join('&#1548; ')}` : '',
    `MediGuard - ${medicalData.d}`,
  ].filter(Boolean).join('\n')

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortSummary)}&bgcolor=ffffff&color=000000`

  return (
    <div style={{ textAlign: 'center' }}>
      {/* QR Image */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'inline-block', marginBottom: 16 }}>
        <img src={qrUrl} alt="QR Code" width={200} height={200}
          style={{ display: 'block', borderRadius: 8 }}
          onError={e => { e.target.style.display = 'none' }} />
      </div>

      {/* Medical Summary Card */}
      <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 14, padding: 18, textAlign: 'right', marginBottom: 16 }}>
        <div style={{ color: '#A78BFA', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>&#128203; &#1605;&#1604;&#1582;&#1589; &#1575;&#1604;&#1605;&#1604;&#1601; &#1575;&#1604;&#1591;&#1576;&#1610;</div>
        <div style={{ lineHeight: 2.2, fontSize: 14 }}>
          <div style={{ color: '#F0F4FF' }}>&#128100; {profile?.full_name} {profile?.age && `&#183; ${profile.age} &#1587;&#1606;&#1577;`}</div>
          {profile?.blood_type && <div style={{ color: '#FF6B6B' }}>&#129656; &#1601;&#1589;&#1610;&#1604;&#1577; &#1575;&#1604;&#1583;&#1605;: <strong>{profile.blood_type}</strong></div>}
          {(profile?.weight || profile?.height) && (
            <div style={{ color: '#9BA8BF' }}>&#9878;&#65039; {profile?.weight && `${profile.weight} &#1603;&#1580;&#1605;`} {profile?.height && `&#183; ${profile.height} &#1587;&#1605;`}</div>
          )}
          {conditions.length > 0 && (
            <div style={{ color: '#FCA5A5' }}>&#127973; {conditions.map(c => c.name).join('&#1548; ')}</div>
          )}
          {medications.length > 0 && (
            <div style={{ color: '#10D9A0' }}>&#128138; {medications.slice(0,5).map(m => m.trade_name || m.generic_name).join('&#1548; ')}{medications.length > 5 && ` +${medications.length-5}`}</div>
          )}
        </div>
      </div>

      {/* View Full Profile Button */}
      <button onClick={() => {
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url  = URL.createObjectURL(blob)
        window.open(url, '_blank')
      }} style={{ ...S.btnSec, marginBottom: 8 }}>
        &#128279; &#1593;&#1585;&#1590; &#1575;&#1604;&#1605;&#1604;&#1601; &#1575;&#1604;&#1591;&#1576;&#1610; &#1603;&#1575;&#1605;&#1604;
      </button>
      <div style={{ color: '#4B5563', fontSize: 12, textAlign: 'center' }}>&#1575;&#1593;&#1585;&#1590; &#1575;&#1604;&#1600; QR &#1604;&#1604;&#1583;&#1603;&#1578;&#1608;&#1585; &#1571;&#1608; &#1575;&#1590;&#1594;&#1591; &#1593;&#1585;&#1590; &#1575;&#1604;&#1605;&#1604;&#1601; &#1603;&#1575;&#1605;&#1604;</div>
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

  // &#1580;&#1610;&#1576; &#1575;&#1604;&#1571;&#1605;&#1585;&#1575;&#1590; &#1605;&#1606; Supabase
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
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>&#128100;</div>
        <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>{profile?.full_name || '&#1575;&#1604;&#1605;&#1587;&#1578;&#1582;&#1583;&#1605;'}</h1>
        <span style={{ background: 'rgba(16,217,160,0.12)', color: '#10D9A0', borderRadius: 8, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
          {profile?.role === 'pharmacist' ? '&#128104;&#8205;&#9877;&#65039; &#1589;&#1610;&#1583;&#1604;&#1575;&#1606;&#1610;' : '&#129489; &#1605;&#1585;&#1610;&#1590;'}
        </span>
      </div>

      {/* -- Stats Grid ---------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[['&#1575;&#1604;&#1593;&#1605;&#1585;', profile?.age, '&#1587;&#1606;&#1577;'], ['&#1575;&#1604;&#1608;&#1586;&#1606;', profile?.weight, '&#1603;&#1580;&#1605;'], ['&#1575;&#1604;&#1591;&#1608;&#1604;', profile?.height, '&#1587;&#1605;'], ['&#1575;&#1604;&#1601;&#1589;&#1610;&#1604;&#1577;', profile?.blood_type, '']].map(([l, v, u]) => (
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
          &#9999;&#65039; &#1578;&#1593;&#1583;&#1610;&#1604; &#1575;&#1604;&#1576;&#1610;&#1575;&#1606;&#1575;&#1578; &#1575;&#1604;&#1588;&#1582;&#1589;&#1610;&#1577;
        </button>
      )}

      {/* Edit Form */}
      {editing && (
        <div style={S.card}>
          <div style={{ color: '#10D9A0', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>&#9999;&#65039; &#1578;&#1593;&#1583;&#1610;&#1604; &#1575;&#1604;&#1576;&#1610;&#1575;&#1606;&#1575;&#1578;</div>
          {[['full_name','&#1575;&#1604;&#1575;&#1587;&#1605; &#1575;&#1604;&#1603;&#1575;&#1605;&#1604;','text','&#1571;&#1581;&#1605;&#1583; &#1605;&#1581;&#1605;&#1583;'], ['age','&#1575;&#1604;&#1593;&#1605;&#1585;','number','25'], ['weight','&#1575;&#1604;&#1608;&#1586;&#1606; (&#1603;&#1580;&#1605;)','number','70'], ['height','&#1575;&#1604;&#1591;&#1608;&#1604; (&#1587;&#1605;)','number','175']].map(([key, lbl, type, ph]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={S.label}>{lbl}</label>
              <input type={type} placeholder={ph} value={form[key]} onChange={e => update(key, e.target.value)} style={S.input} />
            </div>
          ))}
          <div style={{ marginBottom: 18 }}>
            <label style={S.label}>&#1601;&#1589;&#1610;&#1604;&#1577; &#1575;&#1604;&#1583;&#1605;</label>
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
              {saving ? '&#1580;&#1575;&#1585;&#1610;...' : '&#1581;&#1601;&#1592; &#10003;'}
            </button>
            <button onClick={() => { setEditing(false); setError('') }} style={{ ...S.btnGhost, flex: 1 }}>
              &#1573;&#1604;&#1594;&#1575;&#1569;
            </button>
          </div>
        </div>
      )}

      {/* -- &#1575;&#1604;&#1571;&#1605;&#1585;&#1575;&#1590; &#1575;&#1604;&#1605;&#1586;&#1605;&#1606;&#1577; &#1608;&#1575;&#1604;&#1587;&#1575;&#1576;&#1602;&#1577; ------------------------ */}
      <div style={S.card}>
        <div style={{ color: '#F0F4FF', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>&#127973; &#1575;&#1604;&#1571;&#1605;&#1585;&#1575;&#1590; &#1575;&#1604;&#1605;&#1586;&#1605;&#1606;&#1577; &#1608;&#1575;&#1604;&#1587;&#1575;&#1576;&#1602;&#1577;</div>

        {/* Tags */}
        {conditions.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {conditions.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 20, padding: '6px 14px' }}>
                <span style={{ color: '#FCA5A5', fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                <button onClick={() => removeCondition(c.id)} style={{ background: 'none', border: 'none', color: '#6B7A99', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1, marginRight: 2 }}>&#215;</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#4B5563', fontSize: 13, marginBottom: 14, fontStyle: 'italic' }}>
            &#1604;&#1575; &#1610;&#1608;&#1580;&#1583; &#1571;&#1605;&#1585;&#1575;&#1590; &#1605;&#1587;&#1580;&#1604;&#1577; -- &#1571;&#1590;&#1601; &#1571;&#1605;&#1585;&#1575;&#1590;&#1603; &#1575;&#1604;&#1605;&#1586;&#1605;&#1606;&#1577; &#1571;&#1608; &#1575;&#1604;&#1580;&#1585;&#1575;&#1581;&#1575;&#1578; &#1575;&#1604;&#1587;&#1575;&#1576;&#1602;&#1577;
          </div>
        )}

        {/* Add new condition */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newCond}
            onChange={e => setNewCond(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCondition()}
            placeholder="&#1605;&#1579;&#1575;&#1604;: &#1587;&#1603;&#1585; &#1575;&#1604;&#1606;&#1608;&#1593; &#1575;&#1604;&#1579;&#1575;&#1606;&#1610;&#1548; &#1590;&#1594;&#1591; &#1575;&#1604;&#1583;&#1605;&#1548; &#1602;&#1589;&#1608;&#1585; &#1575;&#1604;&#1602;&#1604;&#1576;..."
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
          {['&#1587;&#1603;&#1585;', '&#1590;&#1594;&#1591;', '&#1602;&#1604;&#1576;', '&#1603;&#1604;&#1609;', '&#1603;&#1576;&#1583;', '&#1585;&#1576;&#1608;', '&#1594;&#1583;&#1577; &#1583;&#1585;&#1602;&#1610;&#1577;', '&#1606;&#1602;&#1585;&#1587;'].map(s => (
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
        <div style={{ color: '#9BA8BF', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>&#128138; &#1575;&#1604;&#1571;&#1583;&#1608;&#1610;&#1577; &#1575;&#1604;&#1606;&#1588;&#1591;&#1577;</div>
        <div style={{ color: '#F0F4FF', fontSize: 28, fontWeight: 800 }}>
          {medications.length} <span style={{ color: '#6B7A99', fontSize: 14, fontWeight: 400 }}>&#1583;&#1608;&#1575;&#1569;</span>
        </div>
      </div>

      {/* -- QR &#1575;&#1604;&#1578;&#1575;&#1585;&#1610;&#1582; &#1575;&#1604;&#1591;&#1576;&#1610; -------------------------------- */}
      <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showQR ? 20 : 0 }}>
          <div>
            <div style={{ color: '#A78BFA', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>&#128241; QR &#1575;&#1604;&#1578;&#1575;&#1585;&#1610;&#1582; &#1575;&#1604;&#1591;&#1576;&#1610;</div>
            <div style={{ color: '#6B7A99', fontSize: 12 }}>&#1575;&#1593;&#1585;&#1590;&#1607; &#1604;&#1604;&#1583;&#1603;&#1578;&#1608;&#1585; -- &#1601;&#1610;&#1607; &#1605;&#1604;&#1601;&#1603; &#1575;&#1604;&#1591;&#1576;&#1610; &#1603;&#1575;&#1605;&#1604;</div>
          </div>
          <button onClick={() => setShowQR(p => !p)} style={{
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 12, padding: '10px 18px', color: '#A78BFA',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
          }}>
            {showQR ? '&#1573;&#1582;&#1601;&#1575;&#1569;' : '&#1593;&#1585;&#1590; QR'}
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
        &#1578;&#1587;&#1580;&#1610;&#1604; &#1575;&#1604;&#1582;&#1585;&#1608;&#1580;
      </button>
    </div>
  )
}

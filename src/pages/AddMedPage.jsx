import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedications } from '../hooks/useMedications'
import { AddMedPage, ProfilePage } from './pages/AddMedPage_ProfilePage'
import { recognizeDrugFromImage, fileToBase64 } from '../lib/gemini'
import { Card, Button, Input } from '../components/UI'

const PERIODS = ['صبح', 'ظهر', 'مساء', 'ليل']
const COLORS = ['#10D9A0', '#FF6B6B', '#38BDF8', '#FBBF24', '#A78BFA', '#F97316']

export default function AddMedPage() {
  const navigate = useNavigate()
  const { addMedication } = useMedications()
  const fileRef = useRef()

  const [step, setStep] = useState(1)
  const [mode, setMode] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    generic_name: '', trade_name: '', dose: '',
    dose_times: [], with_food: true,
    stock_count: 30, color: COLORS[0],
  })
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const togglePeriod = (p) => update('dose_times', form.dose_times.includes(p) ? form.dose_times.filter(x => x !== p) : [...form.dose_times, p])

  async function handleImagePick(e) {
    const file = e.target.files[0]
    if (!file) return
    setScanning(true); setError('')
    try {
      const base64 = await fileToBase64(file)
      const result = await recognizeDrugFromImage(base64, file.type)
      setAiResult(result)
      setForm(p => ({
        ...p,
        generic_name: result.generic_name || '',
        trade_name: result.trade_name || '',
        dose: result.dose || '',
      }))
      setStep(3)
    } catch (e) {
      setError('تعذّر التعرف على الدواء — جرّب الإدخال اليدوي')
      setStep(2); setMode('manual')
    } finally {
      setScanning(false)
    }
  }

  async function handleSave() {
    if (!form.generic_name || !form.dose || form.dose_times.length === 0) {
      setError('من فضلك أكمل بيانات الدواء'); return
    }
    setSaving(true); setError('')
    try {
      await addMedication(form)
      navigate('/medications')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Step 1: Choose mode
  if (step === 1) return (
    <div style={pageStyle}>
      <BackBtn onClick={() => navigate('/medications')} />
      <h1 style={titleStyle}>إضافة دواء جديد 💊</h1>
      <p style={subStyle}>اختار طريقة الإضافة</p>

      <Card style={{ marginBottom: 16, cursor: 'pointer', border: '1px solid rgba(16,217,160,0.4)', background: 'rgba(16,217,160,0.06)' }}
        onClick={() => { setMode('camera'); setStep(2) }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 44 }}>📸</div>
          <div>
            <div style={{ color: '#10D9A0', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>صوّر الدواء</div>
            <div style={{ color: '#6B7A99', fontSize: 13, marginBottom: 8 }}>صوّر العلبة والـ AI هيتعرف عليه تلقائياً</div>
            <span style={{ background: 'rgba(16,217,160,0.15)', color: '#10D9A0', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Gemini AI ✨ مجاني</span>
          </div>
        </div>
      </Card>

      <Card style={{ cursor: 'pointer' }} onClick={() => { setMode('manual'); setStep(3) }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 44 }}>✏️</div>
          <div>
            <div style={{ color: '#F0F4FF', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>إدخال يدوي</div>
            <div style={{ color: '#6B7A99', fontSize: 13 }}>اكتب اسم الدواء والجرعة بنفسك</div>
          </div>
        </div>
      </Card>
    </div>
  )

  // Step 2: Camera
  if (step === 2 && mode === 'camera') return (
    <div style={pageStyle}>
      <BackBtn onClick={() => setStep(1)} />
      <h1 style={titleStyle}>صوّر الدواء 📸</h1>

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={handleImagePick} style={{ display: 'none' }} />

      <div onClick={() => fileRef.current?.click()}
        style={{ border: '2px dashed rgba(16,217,160,0.4)', borderRadius: 20, padding: 56, textAlign: 'center', marginBottom: 24, background: 'rgba(16,217,160,0.04)', cursor: 'pointer' }}>
        {scanning ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }} className="pulse">🤖</div>
            <p style={{ color: '#10D9A0', fontWeight: 700 }}>جاري التعرف على الدواء...</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📸</div>
            <p style={{ color: '#9BA8BF', fontSize: 14, marginBottom: 20 }}>اضغط لتصوير أو اختيار صورة الدواء</p>
            <Button variant="secondary" style={{ width: 'auto', padding: '10px 28px' }}>اختار صورة</Button>
          </>
        )}
      </div>

      {error && <ErrorBox msg={error} />}
    </div>
  )

  // Step 3: Form (manual or after AI)
  return (
    <div style={pageStyle}>
      <BackBtn onClick={() => setStep(mode === 'camera' ? 2 : 1)} />
      <h1 style={titleStyle}>{aiResult ? '✅ تم التعرف على الدواء' : 'تفاصيل الدواء ✏️'}</h1>

      {aiResult && (
        <Card glow="#10D9A0" style={{ marginBottom: 24, background: 'rgba(16,217,160,0.06)' }}>
          <div style={{ color: '#10D9A0', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🤖 تم التعرف بدقة {Math.round(aiResult.confidence * 100)}%</div>
          <div style={{ color: '#F0F4FF', fontWeight: 800, fontSize: 18 }}>{aiResult.trade_name}</div>
          <div style={{ color: '#6B7A99', fontSize: 13 }}>{aiResult.generic_name} — {aiResult.dose}</div>
        </Card>
      )}

      <Input label="الاسم العلمي*" placeholder="مثال: Metformin" value={form.generic_name} onChange={e => update('generic_name', e.target.value)} />
      <Input label="الاسم التجاري" placeholder="مثال: جلوكوفاج" value={form.trade_name} onChange={e => update('trade_name', e.target.value)} />
      <Input label="الجرعة*" placeholder="مثال: 500mg" value={form.dose} onChange={e => update('dose', e.target.value)} />
      <Input label="عدد الحبوب في المخزون" type="number" value={form.stock_count} onChange={e => update('stock_count', parseInt(e.target.value) || 0)} />

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>مواعيد الجرعة*</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {PERIODS.map(p => {
            const sel = form.dose_times.includes(p)
            return (
              <button key={p} onClick={() => togglePeriod(p)} style={{
                flex: 1, background: sel ? 'rgba(16,217,160,0.15)' : '#111827',
                border: `1px solid ${sel ? '#10D9A0' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 10, padding: '10px 0',
                color: sel ? '#10D9A0' : '#6B7A99',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
              }}>{p}</button>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>مع أكل ولا لا؟</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[[true, 'مع الأكل 🍽️'], [false, 'معدة فارغة']].map(([val, lbl]) => (
            <button key={String(val)} onClick={() => update('with_food', val)} style={{
              flex: 1, background: form.with_food === val ? 'rgba(16,217,160,0.15)' : '#111827',
              border: `1px solid ${form.with_food === val ? '#10D9A0' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 10, padding: '12px 0',
              color: form.with_food === val ? '#10D9A0' : '#6B7A99',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={labelStyle}>لون الدواء</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => update('color', c)} style={{
              width: 36, height: 36, borderRadius: '50%', background: c, border: `3px solid ${form.color === c ? '#fff' : 'transparent'}`,
              cursor: 'pointer', transition: 'border 0.2s',
            }} />
          ))}
        </div>
      </div>

      {error && <ErrorBox msg={error} />}
      <Button onClick={handleSave} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ الدواء ✓'}</Button>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────
const pageStyle = { padding: '24px 20px 100px', direction: 'rtl', fontFamily: 'Cairo, sans-serif', minHeight: '100vh', background: '#070B14' }
const titleStyle = { color: '#F0F4FF', fontSize: 22, fontWeight: 800, marginBottom: 8, marginTop: 0 }
const subStyle = { color: '#6B7A99', fontSize: 14, marginBottom: 28 }
const labelStyle = { color: '#9BA8BF', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }

function BackBtn({ onClick }) {
  return <button onClick={onClick} style={{ background: 'none', border: 'none', color: '#6B7A99', fontSize: 14, cursor: 'pointer', marginBottom: 20, fontFamily: 'Cairo, sans-serif', padding: 0 }}>← رجوع</button>
}
function ErrorBox({ msg }) {
  return <div style={{ background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '12px 16px', color: '#FF6B6B', fontSize: 13, marginBottom: 16 }}>{msg}</div>
}

// ─── MedicationsPage ─────────────────────────────────────────
import { useNavigate } from 'react-router-dom'
import { useMedications } from '../hooks/useMedications'
import { Card, Badge, EmptyState, LoadingSpinner, PageHeader } from '../components/UI'

export function MedicationsPage() {
  const navigate = useNavigate()
  const { medications, interactions, deleteMedication, loading } = useMedications()

  if (loading) return <div style={pageStyle}><LoadingSpinner /></div>

  return (
    <div style={pageStyle}>
      <PageHeader title="أدويتي 💊" subtitle={`${medications.length} دواء نشط`}
        action={<button onClick={() => navigate('/medications/add')} style={addBtnStyle}>+ إضافة</button>} />

      {medications.length === 0 ? (
        <EmptyState icon="💊" title="لا يوجد أدوية" subtitle="ابدأ بإضافة أدويتك الآن"
          action={<button onClick={() => navigate('/medications/add')} style={addBtnStyle}>إضافة دواء</button>} />
      ) : medications.map(med => {
        const hasInteraction = interactions.some(i => i.drug1_name === med.generic_name || i.drug2_name === med.generic_name)
        return (
          <Card key={med.id} glow={med.color} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${med.color}25`, border: `2px solid ${med.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💊</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ color: '#F0F4FF', fontWeight: 800, fontSize: 16 }}>{med.trade_name || med.generic_name}</div>
                    <div style={{ color: '#6B7A99', fontSize: 12 }}>{med.generic_name} — {med.dose}</div>
                  </div>
                  {hasInteraction && <Badge label="⚠️ تفاعل" color="#FF6B6B" />}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {med.dose_times.map(t => <Badge key={t} label={t} color={med.color} />)}
                  <span style={{ marginRight: 'auto', color: med.stock_count <= 7 ? '#FBBF24' : '#6B7A99', fontSize: 12 }}>📦 {med.stock_count} متبقية</span>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ─── SchedulePage ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useMedications as useMeds2 } from '../hooks/useMedications'

export function SchedulePage() {
  const { medications, logDose, fetchDoseLogsToday } = useMeds2()
  const [doseLogs, setDoseLogs] = useState([])
  const periodIcons = { صبح: '🌅', ظهر: '☀️', مساء: '🌤️', ليل: '🌙' }

  useEffect(() => { fetchDoseLogsToday().then(setDoseLogs) }, [medications])

  const isTaken = (medId, period) => doseLogs.some(l => l.medication_id === medId && l.scheduled_time === period && l.was_taken)

  async function handleTake(med, period) {
    await logDose(med.id, period, true)
    fetchDoseLogsToday().then(setDoseLogs)
  }

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: 0 }}>الجدول اليومي 📅</h1>
        <p style={{ color: '#6B7A99', fontSize: 13, margin: '4px 0 0' }}>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {['صبح', 'ظهر', 'مساء', 'ليل'].map(period => {
        const periodMeds = medications.filter(m => m.dose_times.includes(period))
        if (periodMeds.length === 0) return null
        const takenInPeriod = periodMeds.filter(m => isTaken(m.id, period)).length
        return (
          <div key={period} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{periodIcons[period]}</span>
              <span style={{ color: '#9BA8BF', fontWeight: 700, fontSize: 14 }}>{period}</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <Badge label={`${takenInPeriod}/${periodMeds.length}`} color="#10D9A0" />
            </div>
            {periodMeds.map(med => {
              const taken = isTaken(med.id, period)
              return (
                <Card key={med.id} style={{ marginBottom: 10, opacity: taken ? 0.65 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: taken ? `${med.color}25` : '#111827', border: `2px solid ${taken ? med.color : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: taken ? 18 : 14 }}>
                      {taken ? '✓' : '💊'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: taken ? '#6B7A99' : '#F0F4FF', fontWeight: 700, textDecoration: taken ? 'line-through' : 'none' }}>{med.trade_name || med.generic_name}</div>
                      <div style={{ color: '#6B7A99', fontSize: 12 }}>{med.dose} — {med.with_food ? 'مع الأكل 🍽️' : 'على معدة فارغة'}</div>
                    </div>
                    {!taken && (
                      <button onClick={() => handleTake(med, period)} style={{ background: 'rgba(16,217,160,0.12)', border: '1px solid rgba(16,217,160,0.3)', borderRadius: 10, padding: '8px 14px', color: '#10D9A0', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>أخذت</button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ─── InteractionsPage ─────────────────────────────────────────
import { useMedications as useMeds3 } from '../hooks/useMedications'
import { Card as C2, Badge as B2 } from '../components/UI'

export function InteractionsPage() {
  const { medications, interactions } = useMeds3()
  const safeNames = new Set([...interactions.flatMap(i => [i.drug1_name, i.drug2_name])])
  const safeMeds = medications.filter(m => !safeNames.has(m.generic_name))

  return (
    <div style={pageStyle}>
      <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>التفاعلات الدوائية ⚠️</h1>
      <p style={{ color: '#6B7A99', fontSize: 13, marginBottom: 24 }}>فحص تلقائي لكل أدويتك</p>

      {interactions.length === 0 ? (
        <C2 style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <div style={{ color: '#10D9A0', fontWeight: 800, fontSize: 18 }}>لا توجد تفاعلات</div>
          <div style={{ color: '#6B7A99', fontSize: 14, marginTop: 8 }}>أدويتك آمنة مع بعضها</div>
        </C2>
      ) : interactions.map((inter, i) => (
        <C2 key={i} glow="#FF6B6B" style={{ marginBottom: 16, background: 'rgba(255,107,107,0.06)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div>
              <div style={{ color: '#FF6B6B', fontWeight: 800, fontSize: 16 }}>{inter.drug1_name} + {inter.drug2_name}</div>
              <B2 label={`خطورة ${inter.severity}`} color={inter.severity === 'خطير' ? '#FF6B6B' : inter.severity === 'متوسط' ? '#FBBF24' : '#38BDF8'} />
            </div>
          </div>
          <p style={{ color: '#9BA8BF', fontSize: 14, lineHeight: 1.8, margin: '0 0 14px' }}>{inter.description}</p>
          {inter.alternative && (
            <div style={{ background: 'rgba(16,217,160,0.08)', border: '1px solid rgba(16,217,160,0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ color: '#10D9A0', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>💡 البديل المقترح</div>
              <div style={{ color: '#9BA8BF', fontSize: 13 }}>{inter.alternative}</div>
            </div>
          )}
        </C2>
      ))}

      {safeMeds.length > 0 && (
        <>
          <p style={{ color: '#6B7A99', fontSize: 12, fontWeight: 700, margin: '24px 0 12px' }}>الأدوية الآمنة ✅</p>
          {safeMeds.map(med => (
            <C2 key={med.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${med.color}20`, border: `2px solid ${med.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💊</div>
                <div style={{ flex: 1, color: '#F0F4FF', fontWeight: 700 }}>{med.trade_name || med.generic_name}</div>
                <B2 label="آمن ✓" color="#10D9A0" />
              </div>
            </C2>
          ))}
        </>
      )}
    </div>
  )
}

// ─── LabsPage ─────────────────────────────────────────────────
import { useRef as useRef2, useState as useState2 } from 'react'
import { useLabResults } from '../hooks/useLabResults'

export function LabsPage() {
  const { labs, loading, addLabResult } = useLabResults()
  const [showForm, setShowForm] = useState2(false)
  const [form, setForm] = useState2({ test_name: '', result_value: '', unit: '', normal_range: '', test_date: new Date().toISOString().split('T')[0], is_abnormal: false })
  const [file, setFile] = useState2(null)
  const [saving, setSaving] = useState2(false)
  const fileRef2 = useRef2()

  async function handleSave() {
    if (!form.test_name || !form.test_date) return
    setSaving(true)
    try {
      await addLabResult(form, file)
      setShowForm(false)
      setForm({ test_name: '', result_value: '', unit: '', normal_range: '', test_date: new Date().toISOString().split('T')[0], is_abnormal: false })
      setFile(null)
    } finally { setSaving(false) }
  }

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: 0 }}>تحاليلي 🧪</h1>
        <button onClick={() => setShowForm(!showForm)} style={addBtnStyle}>{showForm ? 'إلغاء' : '+ إضافة'}</button>
      </div>

      {showForm && (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          {[['test_name','اسم التحليل*','مثال: HbA1c'], ['result_value','النتيجة','مثال: 7.2'], ['unit','الوحدة','مثال: %'], ['normal_range','المعدل الطبيعي','مثال: 4.0 - 5.6']].map(([k,l,p]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <label style={{ color: '#9BA8BF', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>{l}</label>
              <input placeholder={p} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                style={{ width: '100%', background: '#070B14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px', color: '#F0F4FF', fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: '#9BA8BF', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>تاريخ التحليل</label>
            <input type="date" value={form.test_date} onChange={e => setForm(p => ({ ...p, test_date: e.target.value }))}
              style={{ width: '100%', background: '#070B14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px', color: '#F0F4FF', fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }} />
          </div>
          <input ref={fileRef2} type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
          <button onClick={() => fileRef2.current?.click()} style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 0', width: '100%', color: '#6B7A99', fontSize: 13, cursor: 'pointer', marginBottom: 14, fontFamily: 'Cairo, sans-serif' }}>
            {file ? `📎 ${file.name}` : '+ إرفاق صورة أو PDF'}
          </button>
          <button onClick={handleSave} disabled={saving} style={{ ...addBtnStyle, width: '100%', padding: '13px 0', fontSize: 15 }}>{saving ? 'جاري الحفظ...' : 'حفظ التحليل'}</button>
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#6B7A99' }}>جاري التحميل...</div>
        : labs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🧪</div>
            <div style={{ color: '#F0F4FF', fontWeight: 700, fontSize: 16 }}>لا يوجد تحاليل</div>
            <div style={{ color: '#6B7A99', fontSize: 13, marginTop: 6 }}>أضف أول تحليل ليك</div>
          </div>
        ) : labs.map(lab => (
          <div key={lab.id} style={{ background: '#111827', border: `1px solid ${lab.is_abnormal ? 'rgba(255,107,107,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: 16, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#F0F4FF', fontWeight: 700, fontSize: 15 }}>{lab.test_name}</div>
              <div style={{ color: '#6B7A99', fontSize: 12, marginTop: 3 }}>{new Date(lab.test_date).toLocaleDateString('ar-EG')} {lab.normal_range && `· طبيعي: ${lab.normal_range}`}</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: lab.is_abnormal ? '#FF6B6B' : '#10D9A0', fontWeight: 800, fontSize: 18 }}>{lab.result_value} <span style={{ fontSize: 12, fontWeight: 400 }}>{lab.unit}</span></div>
              {lab.is_abnormal && <div style={{ color: '#FF6B6B', fontSize: 11 }}>غير طبيعي</div>}
            </div>
          </div>
        ))
      }
    </div>
  )
}

// ─── ProfilePage ──────────────────────────────────────────────

// ─── OnboardingPage ───────────────────────────────────────────
import { useState as useState4 } from 'react'
import { useNavigate as useNav4 } from 'react-router-dom'

export function OnboardingPage() {
  const [step, setStep4] = useState4(0)
  const navigate4 = useNav4()
  const steps = [
    { icon: '💊', title: 'أدويتك في مكان واحد', sub: 'سجّل كل أدويتك مرة واحدة وخليّ MediGuard يتولى الباقي' },
    { icon: '⚠️', title: 'كشف التفاعلات فوراً',  sub: 'نظام ذكي يكشف أي تعارض بين أدويتك ويقترح البديل الآمن' },
    { icon: '🧪', title: 'تاريخك الطبي كامل',    sub: 'ارفع تحاليلك وشارك بروفايلك مع دكتورك بـ QR واحد' },
  ]
  const s = steps[step]
  return (
    <div style={{ minHeight: '100vh', background: '#070B14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,217,160,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', maxWidth: 340, position: 'relative' }}>
        <div style={{ fontSize: 80, marginBottom: 24, filter: 'drop-shadow(0 0 20px rgba(16,217,160,0.4))' }}>{s.icon}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F4FF', marginBottom: 12, lineHeight: 1.4 }}>{s.title}</h1>
        <p style={{ color: '#9BA8BF', fontSize: 15, lineHeight: 1.8, marginBottom: 48 }}>{s.sub}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
          {steps.map((_, i) => <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? '#10D9A0' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />)}
        </div>
        <button onClick={() => step < steps.length - 1 ? setStep4(step + 1) : navigate4('/auth')}
          style={{ width: '100%', background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', border: 'none', borderRadius: 14, padding: '16px 0', color: '#000', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          {step < steps.length - 1 ? 'التالي ←' : 'ابدأ الآن 🚀'}
        </button>
        {step < steps.length - 1 && (
          <button onClick={() => navigate4('/auth')} style={{ background: 'none', border: 'none', color: '#6B7A99', marginTop: 16, cursor: 'pointer', fontSize: 14, fontFamily: 'Cairo, sans-serif' }}>تخطي</button>
        )}
      </div>
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────
const pageStyle = { padding: '24px 20px 100px', direction: 'rtl', fontFamily: 'Cairo, sans-serif', minHeight: '100vh', background: '#070B14' }
const addBtnStyle = { background: '#10D9A0', border: 'none', borderRadius: 12, padding: '10px 18px', color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }

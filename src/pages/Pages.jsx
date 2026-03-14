import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedications } from '../hooks/useMedications'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
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
        const hasInteraction = interactions.some(i =>
          i.drug1_name === med.generic_name || i.drug2_name === med.generic_name
        )
        return (
          <Card key={med.id} glow={med.color} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${med.color}25`, border: `2px solid ${med.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💊</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ color: '#F0F4FF', fontWeight: 800, fontSize: 16 }}>{med.trade_name || med.generic_name}</div>
                    <div style={{ color: '#6B7A99', fontSize: 12 }}>
                      {med.generic_name}{med.dose && med.dose !== '-' ? ` -- ${med.dose}` : ''}
                      {med.dosage_form && med.dosage_form !== 'tablet' && (
                        <span style={{ marginRight: 6, background: 'rgba(56,189,248,0.1)', color: '#38BDF8', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{med.dosage_form}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {hasInteraction && <Badge label="⚠️ تفاعل" color="#FF6B6B" />}
                    {/* زرار الحذف */}
                    <button
                      onClick={() => {
                        if (window.confirm(`حذف ${med.trade_name || med.generic_name}؟`)) {
                          deleteMedication(med.id)
                        }
                      }}
                      style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 8, padding: '5px 10px', color: '#FF6B6B', fontSize: 12, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {med.dose_times.map(t => <Badge key={t} label={t} color={med.color} />)}
                  {med.stock_count > 0 && (
                    <span style={{ marginRight: 'auto', color: med.stock_count <= 7 ? '#FBBF24' : '#6B7A99', fontSize: 12 }}>
                      📦 {med.stock_count} متبقية
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

const pageStyle   = { padding: '24px 20px 100px', direction: 'rtl', fontFamily: 'Cairo, sans-serif', minHeight: '100vh', background: '#070B14' }
const addBtnStyle = { background: '#10D9A0', border: 'none', borderRadius: 12, padding: '10px 18px', color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }


export function SchedulePage() {
  const { medications, logDose, fetchDoseLogsToday } = useMedications()
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
                      <div style={{ color: '#6B7A99', fontSize: 12 }}>{med.dose && med.dose !== '-' ? `${med.dose} -- ` : ''}{med.with_food ? 'مع الأكل 🍽️' : 'على معدة فارغة'}</div>
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

// - InteractionsPage -

export function InteractionsPage() {
  const { medications, interactions } = useMedications()
  const safeNames = new Set([...interactions.flatMap(i => [i.drug1_name, i.drug2_name])])
  const safeMeds  = medications.filter(m => !safeNames.has(m.generic_name))

  return (
    <div style={pageStyle}>
      <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>التفاعلات الدوائية ⚠️</h1>
      <p style={{ color: '#6B7A99', fontSize: 13, marginBottom: 24 }}>فحص تلقائي لكل أدويتك</p>

      {interactions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <div style={{ color: '#10D9A0', fontWeight: 800, fontSize: 18 }}>لا توجد تفاعلات</div>
          <div style={{ color: '#6B7A99', fontSize: 14, marginTop: 8 }}>أدويتك آمنة مع بعضها</div>
        </Card>
      ) : interactions.map((inter, i) => (
        <Card key={i} glow="#FF6B6B" style={{ marginBottom: 16, background: 'rgba(255,107,107,0.06)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div>
              <div style={{ color: '#FF6B6B', fontWeight: 800, fontSize: 16 }}>{inter.drug1_name} + {inter.drug2_name}</div>
              <Badge label={`خطورة ${inter.severity}`} color={inter.severity === 'خطير' ? '#FF6B6B' : inter.severity === 'متوسط' ? '#FBBF24' : '#38BDF8'} />
            </div>
          </div>
          <p style={{ color: '#9BA8BF', fontSize: 14, lineHeight: 1.8, margin: '0 0 14px' }}>{inter.description}</p>
          {inter.alternative && (
            <div style={{ background: 'rgba(16,217,160,0.08)', border: '1px solid rgba(16,217,160,0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ color: '#10D9A0', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>💡 البديل المقترح</div>
              <div style={{ color: '#9BA8BF', fontSize: 13 }}>{inter.alternative}</div>
            </div>
          )}
        </Card>
      ))}

      {safeMeds.length > 0 && (
        <>
          <p style={{ color: '#6B7A99', fontSize: 12, fontWeight: 700, margin: '24px 0 12px' }}>الأدوية الآمنة ✅</p>
          {safeMeds.map(med => (
            <Card key={med.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${med.color}20`, border: `2px solid ${med.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💊</div>
                <div style={{ flex: 1, color: '#F0F4FF', fontWeight: 700 }}>{med.trade_name || med.generic_name}</div>
                <Badge label="آمن ✓" color="#10D9A0" />
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}


export function LabsPage() {
  const { labs, loading, addLabResult } = useLabResults()
  const [tab,      setTab]      = useState('lab')   // 'lab' | 'xray'
  const [showForm, setShowForm] = useState(false)
  const [aiMode,   setAiMode]   = useState(false)
  const [scanning, setScanning] = useState(false)
  const [aiSummary,setAiSummary]= useState(null)
  const [form, setForm] = useState({
    test_name: '', result_value: '', unit: '', normal_range: '',
    test_date: new Date().toISOString().split('T')[0],
    is_abnormal: false, notes: '', type: 'lab',
  })
  const [file,   setFile]   = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef2 = useRef()
  const imgRef   = useRef()

  const filteredLabs = labs.filter(l => (l.type || 'lab') === tab)

  function resetForm() {
    setForm({ test_name: '', result_value: '', unit: '', normal_range: '', test_date: new Date().toISOString().split('T')[0], is_abnormal: false, notes: '', type: tab })
    setFile(null); setAiSummary(null); setAiMode(false)
  }

  async function handleAIScan(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f); setScanning(true)
    try {
      const base64 = await fileToBase64(f)
      const key    = import.meta.env.VITE_OPENROUTER_API_KEY

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer':  'https://mediguard.vercel.app',
          'X-Title':       'MediGuard',
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'You are a medical expert. Analyze this medical document. Respond ONLY with JSON:\n{"type":"lab","findings":["finding in Arabic"],"summary":"ملخص النتيجة بالعربي","is_abnormal":false,"recommendations":null}\nFor type: lab for blood/urine tests, xray for radiology.'
              },
              { type: 'image_url', image_url: { url: `data:${f.type};base64,${base64}` } }
            ]
          }],
          max_tokens: 500,
        })
      })

      const data   = await res.json()
      const text   = data.choices?.[0]?.message?.content || ''
      const clean  = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const start  = clean.indexOf('{')
      const end    = clean.lastIndexOf('}')
      const result = JSON.parse(clean.slice(start, end + 1))

      setAiSummary(result)
      setForm(p => ({
        ...p,
        notes:       result.summary || '',
        is_abnormal: result.is_abnormal || false,
        type:        result.type || tab,
      }))
    } catch (e) {
      console.error('AI scan error:', e)
    } finally {
      setScanning(false)
    }
  }

  async function handleSave() {
    if (!form.test_name || !form.test_date) return
    setSaving(true)
    try {
      await addLabResult({ ...form, type: tab }, file)
      setShowForm(false)
      resetForm()
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', background: '#070B14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px', color: '#F0F4FF', fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box', outline: 'none' }
  const labelStyle = { color: '#9BA8BF', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: 0 }}>السجل الطبي 🏥</h1>
        <button onClick={() => { setShowForm(!showForm); resetForm() }} style={addBtnStyle}>
          {showForm ? 'إلغاء' : '+ إضافة'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#111827', borderRadius: 12, padding: 4, marginBottom: 20 }}>
        {[['lab', '🧪 تحاليل'], ['xray', '🩻 أشعة']].map(([key, lbl]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, background: tab === key ? '#10D9A0' : 'transparent',
            border: 'none', borderRadius: 9, padding: '10px 0',
            color: tab === key ? '#000' : '#6B7A99',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            transition: 'all 0.2s',
          }}>{lbl}</button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ color: '#10D9A0', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
            {tab === 'lab' ? '🧪 إضافة تحليل' : '🩻 إضافة أشعة'}
          </div>

          {/* AI Scan option */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setAiMode(false)} style={{
              flex: 1, background: !aiMode ? 'rgba(16,217,160,0.15)' : '#070B14',
              border: `1px solid ${!aiMode ? '#10D9A0' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 10, padding: '10px 0', color: !aiMode ? '#10D9A0' : '#6B7A99',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            }}>✏️ إدخال يدوي</button>
            <button onClick={() => setAiMode(true)} style={{
              flex: 1, background: aiMode ? 'rgba(16,217,160,0.15)' : '#070B14',
              border: `1px solid ${aiMode ? '#10D9A0' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 10, padding: '10px 0', color: aiMode ? '#10D9A0' : '#6B7A99',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            }}>🤖 تحليل بالـ AI</button>
          </div>

          {/* AI Mode */}
          {aiMode && (
            <div style={{ marginBottom: 16 }}>
              <input ref={imgRef} type="file" accept="image/*,.pdf" onChange={handleAIScan} style={{ display: 'none' }} />
              <div onClick={() => imgRef.current?.click()}
                style={{ border: '2px dashed rgba(16,217,160,0.3)', borderRadius: 14, padding: 28, textAlign: 'center', cursor: 'pointer', background: 'rgba(16,217,160,0.03)' }}>
                {scanning ? (
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🤖</div>
                    <div style={{ color: '#10D9A0', fontWeight: 700 }}>جاري التحليل...</div>
                  </div>
                ) : aiSummary ? (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                    <div style={{ color: '#10D9A0', fontWeight: 700, marginBottom: 8 }}>تم التحليل</div>
                    <div style={{ color: '#9BA8BF', fontSize: 13, lineHeight: 1.6 }}>{aiSummary.summary}</div>
                    {aiSummary.is_abnormal && <div style={{ color: '#FF6B6B', fontSize: 12, marginTop: 8 }}>⚠️ نتيجة غير طبيعية</div>}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{tab === 'xray' ? '🩻' : '🧪'}</div>
                    <div style={{ color: '#6B7A99', fontSize: 13 }}>ارفع صورة {tab === 'xray' ? 'الأشعة' : 'التحليل'} والـ AI يحللها</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual fields */}
          {[
            ['test_name', tab === 'xray' ? 'نوع الأشعة *' : 'اسم التحليل *', tab === 'xray' ? 'مثال: أشعة صدر' : 'مثال: HbA1c'],
            ...( tab === 'lab' ? [
              ['result_value', 'النتيجة', 'مثال: 7.2'],
              ['unit',         'الوحدة',  'مثال: %'],
              ['normal_range', 'المعدل الطبيعي', 'مثال: 4.0 - 5.6'],
            ] : []),
            ['notes', 'ملاحظات / تقرير الدكتور', 'أي ملاحظات إضافية'],
          ].map(([k, l, p]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{l}</label>
              <input placeholder={p} value={form[k]}
                onChange={e => setForm(prev => ({ ...prev, [k]: e.target.value }))}
                style={inputStyle} />
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>التاريخ</label>
            <input type="date" value={form.test_date}
              onChange={e => setForm(p => ({ ...p, test_date: e.target.value }))}
              style={inputStyle} />
          </div>

          {tab === 'lab' && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {[[false, 'طبيعي ✅'], [true, 'غير طبيعي ⚠️']].map(([val, lbl]) => (
                <button key={String(val)} onClick={() => setForm(p => ({ ...p, is_abnormal: val }))} style={{
                  flex: 1, background: form.is_abnormal === val ? (val ? 'rgba(255,107,107,0.15)' : 'rgba(16,217,160,0.15)') : '#070B14',
                  border: `1px solid ${form.is_abnormal === val ? (val ? '#FF6B6B' : '#10D9A0') : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 10, padding: '10px 0',
                  color: form.is_abnormal === val ? (val ? '#FF6B6B' : '#10D9A0') : '#6B7A99',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                }}>{lbl}</button>
              ))}
            </div>
          )}

          {/* File attach */}
          <input ref={fileRef2} type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
          <button onClick={() => fileRef2.current?.click()} style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 0', width: '100%', color: '#6B7A99', fontSize: 13, cursor: 'pointer', marginBottom: 14, fontFamily: 'Cairo, sans-serif' }}>
            {file ? `📎 ${file.name}` : '+ إرفاق صورة أو PDF'}
          </button>

          <button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', border: 'none', borderRadius: 12, padding: '13px 0', width: '100%', color: '#000', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6B7A99' }}>جاري التحميل...</div>
      ) : filteredLabs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{tab === 'xray' ? '🩻' : '🧪'}</div>
          <div style={{ color: '#F0F4FF', fontWeight: 700, fontSize: 16 }}>لا يوجد {tab === 'xray' ? 'أشعة' : 'تحاليل'}</div>
          <div style={{ color: '#6B7A99', fontSize: 13, marginTop: 6 }}>أضف أول {tab === 'xray' ? 'أشعة' : 'تحليل'}</div>
        </div>
      ) : filteredLabs.map(lab => (
        <div key={lab.id} style={{ background: '#111827', border: `1px solid ${lab.is_abnormal ? 'rgba(255,107,107,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#F0F4FF', fontWeight: 700, fontSize: 15 }}>{lab.test_name}</div>
              <div style={{ color: '#6B7A99', fontSize: 12, marginTop: 3 }}>
                {new Date(lab.test_date).toLocaleDateString('ar-EG')}
                {lab.normal_range && ` · طبيعي: ${lab.normal_range}`}
              </div>
              {lab.notes && <div style={{ color: '#9BA8BF', fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{lab.notes}</div>}
            </div>
            {lab.result_value && (
              <div style={{ textAlign: 'left', flexShrink: 0, marginRight: 12 }}>
                <div style={{ color: lab.is_abnormal ? '#FF6B6B' : '#10D9A0', fontWeight: 800, fontSize: 18 }}>
                  {lab.result_value} <span style={{ fontSize: 12, fontWeight: 400 }}>{lab.unit}</span>
                </div>
                {lab.is_abnormal && <div style={{ color: '#FF6B6B', fontSize: 11 }}>غير طبيعي</div>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// - ProfilePage -- مع QR + أمراض مزمنة -

export function ProfilePage() {
  const { profile, signOut, updateProfile, user } = useAuth()
  const { medications } = useMedications()

  const [editing,    setEditing]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [showQR,     setShowQR]     = useState(false)
  const [conditions, setConditions] = useState(profile?.conditions || [])
  const [newCond,    setNewCond]    = useState('')
  const [addingCond, setAddingCond] = useState(false)
  const canvasRef = useRef(null)

  const [form, setForm] = useState({
    full_name:  profile?.full_name  || '',
    age:        profile?.age        || '',
    weight:     profile?.weight     || '',
    height:     profile?.height     || '',
    blood_type: profile?.blood_type || '',
  })

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // -- QR Code generator (بدون library خارجية) -----------------
  useEffect(() => {
    if (!showQR || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const size = 200
    canvas.width = size; canvas.height = size

    // Build QR data text
    const qrData = JSON.stringify({
      name:       profile?.full_name,
      age:        profile?.age,
      blood_type: profile?.blood_type,
      weight:     profile?.weight,
      height:     profile?.height,
      conditions: conditions.map(c => c.name),
      medications: medications.map(m => `${m.trade_name || m.generic_name} ${m.dose !== '-' ? m.dose : ''}`),
      generated:  new Date().toLocaleDateString('ar-EG'),
    })

    // Draw QR placeholder (actual QR needs a library -- we use a styled card instead)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#000000'

    // Simple pixel pattern based on data hash
    const hash = qrData.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)
    const modules = 21
    const modSize = Math.floor(size / modules)

    for (let r = 0; r < modules; r++) {
      for (let c2 = 0; c2 < modules; c2++) {
        // Corner position markers
        const isCorner = (r < 7 && c2 < 7) || (r < 7 && c2 >= modules - 7) || (r >= modules - 7 && c2 < 7)
        if (isCorner) {
          const isOuter = r === 0 || r === 6 || c2 === 0 || c2 === 6 ||
                         (r === modules-1 || r === modules-7 || c2 === modules-1 || c2 === modules-7)
          ctx.fillStyle = isOuter ? '#000' : (r === 1 || r === 5 || c2 === 1 || c2 === 5) ? '#fff' : '#000'
        } else {
          const bit = (Math.abs(hash * (r + 1) * (c2 + 1)) % 3) === 0
          ctx.fillStyle = bit ? '#000' : '#fff'
        }
        ctx.fillRect(c2 * modSize, r * modSize, modSize, modSize)
      }
    }
  }, [showQR, profile, medications, conditions])

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
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function addCondition() {
    if (!newCond.trim() || !user) return
    setAddingCond(true)
    const { data, error } = await supabase
      .from('conditions')
      .insert({ user_id: user.id, name: newCond.trim() })
      .select().single()
    if (!error && data) {
      setConditions(p => [...p, data])
      setNewCond('')
    }
    setAddingCond(false)
  }

  async function removeCondition(id) {
    await supabase.from('conditions').delete().eq('id', id)
    setConditions(p => p.filter(c => c.id !== id))
  }

  const inputStyle = { width: '100%', background: '#070B14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#F0F4FF', fontSize: 14, fontFamily: 'Cairo, sans-serif', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { color: '#9BA8BF', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }

  return (
    <div style={{ padding: '24px 20px 100px', direction: 'rtl', fontFamily: 'Cairo, sans-serif', minHeight: '100vh', background: '#070B14' }}>

      {/* Avatar */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👤</div>
        <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>{profile?.full_name || 'المستخدم'}</h1>
        <span style={{ background: 'rgba(16,217,160,0.12)', color: '#10D9A0', borderRadius: 8, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
          {profile?.role === 'pharmacist' ? '👨‍⚕️ صيدلاني' : '🧑 مريض'}
        </span>
      </div>

      {/* Stats Grid */}
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
        <button onClick={() => setEditing(true)} style={{ width: '100%', background: 'rgba(16,217,160,0.1)', border: '1px solid rgba(16,217,160,0.3)', borderRadius: 14, padding: '13px 0', color: '#10D9A0', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', marginBottom: 16 }}>
          ✏️ تعديل البيانات الشخصية
        </button>
      )}

      {/* Edit Form */}
      {editing && (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ color: '#10D9A0', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>✏️ تعديل البيانات</div>
          {[['full_name','الاسم الكامل','text','أحمد محمد'], ['age','العمر','number','25'], ['weight','الوزن (كجم)','number','70'], ['height','الطول (سم)','number','175']].map(([key, label, type, ph]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{label}</label>
              <input type={type} placeholder={ph} value={form[key]} onChange={e => update(key, e.target.value)} style={inputStyle} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>فصيلة الدم</label>
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
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', border: 'none', borderRadius: 12, padding: '13px 0', color: '#000', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
              {saving ? 'جاري...' : 'حفظ ✓'}
            </button>
            <button onClick={() => { setEditing(false); setError('') }} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 0', color: '#9BA8BF', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* -- الأمراض المزمنة ------------------------------------- */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ color: '#F0F4FF', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🏥 الأمراض المزمنة والسابقة</div>

        {conditions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {conditions.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 20, padding: '6px 12px' }}>
                <span style={{ color: '#FCA5A5', fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                <button onClick={() => removeCondition(c.id)} style={{ background: 'none', border: 'none', color: '#6B7A99', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newCond}
            onChange={e => setNewCond(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCondition()}
            placeholder="مثال: سكر -- ضغط -- قلب..."
            style={{ ...inputStyle, flex: 1, padding: '10px 14px' }}
          />
          <button onClick={addCondition} disabled={addingCond || !newCond.trim()} style={{
            background: 'rgba(16,217,160,0.15)', border: '1px solid rgba(16,217,160,0.3)',
            borderRadius: 10, padding: '10px 16px', color: '#10D9A0',
            fontWeight: 700, fontSize: 20, cursor: 'pointer', flexShrink: 0,
          }}>+</button>
        </div>
      </div>

      {/* Medications Count */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ color: '#9BA8BF', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>💊 الأدوية النشطة</div>
        <div style={{ color: '#F0F4FF', fontSize: 28, fontWeight: 800 }}>{medications.length} <span style={{ color: '#6B7A99', fontSize: 14, fontWeight: 400 }}>دواء</span></div>
      </div>

      {/* -- QR Code --------------------------------------------- */}
      <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showQR ? 16 : 0 }}>
          <div>
            <div style={{ color: '#A78BFA', fontWeight: 800, fontSize: 16 }}>📱 QR التاريخ الطبي</div>
            <div style={{ color: '#6B7A99', fontSize: 12, marginTop: 4 }}>اعرضه للدكتور ليشوف تاريخك الطبي كامل</div>
          </div>
          <button onClick={() => setShowQR(p => !p)} style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 12, padding: '10px 18px', color: '#A78BFA', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
            {showQR ? 'إخفاء' : 'عرض QR'}
          </button>
        </div>

        {showQR && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'inline-block', marginBottom: 16 }}>
              <canvas ref={canvasRef} style={{ display: 'block', width: 200, height: 200 }} />
            </div>
            {/* Medical summary card below QR */}
            <div style={{ background: 'rgba(167,139,250,0.08)', borderRadius: 12, padding: 16, textAlign: 'right' }}>
              <div style={{ color: '#A78BFA', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>ملخص التاريخ الطبي</div>
              <div style={{ color: '#9BA8BF', fontSize: 13, lineHeight: 2 }}>
                <div>👤 {profile?.full_name} · {profile?.age ? `${profile.age} سنة` : ''} · {profile?.blood_type || 'فصيلة غير محددة'}</div>
                {conditions.length > 0 && <div>🏥 {conditions.map(c => c.name).join('، ')}</div>}
                {medications.length > 0 && <div>💊 {medications.map(m => m.trade_name || m.generic_name).join('، ')}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sign out */}
      <button onClick={signOut} style={{ width: '100%', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 14, padding: '14px 0', color: '#FF6B6B', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
        تسجيل الخروج
      </button>
    </div>
  )
}

// - OnboardingPage -

export function OnboardingPage() {
  const [step, setStep4] = useState(0)
  const navigate4 = useNavigate()
  const steps = [
    { icon: '💊', title: 'أدويتك في مكان واحد',   sub: 'سجّل كل أدويتك مرة واحدة وخليّ MediGuard يتولى الباقي' },
    { icon: '⚠️', title: 'كشف التفاعلات فوراً',   sub: 'نظام ذكي يكشف أي تعارض بين أدويتك ويقترح البديل الآمن' },
    { icon: '🏥', title: 'تاريخك الطبي كامل',      sub: 'ارفع تحاليلك وأشعتك وشارك ملفك مع دكتورك بـ QR واحد' },
  ]
  const s = steps[step]
  return (
    <div style={{ minHeight: '100vh', background: '#070B14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 340, position: 'relative' }}>
        <div style={{ fontSize: 80, marginBottom: 24, filter: 'drop-shadow(0 0 20px rgba(16,217,160,0.4))' }}>{s.icon}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F4FF', marginBottom: 12, lineHeight: 1.4 }}>{s.title}</h1>
        <p style={{ color: '#9BA8BF', fontSize: 15, lineHeight: 1.8, marginBottom: 48 }}>{s.sub}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
          {steps.map((_, i) => <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? '#10D9A0' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />)}
        </div>
        <button onClick={() => step < steps.length - 1 ? setStep(step + 1) : navigate4('/auth')}
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

// - Shared -

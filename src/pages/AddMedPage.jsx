import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useMedications } from '../hooks/useMedications'
import { recognizeDrugFromImage, suggestDrugSchedule, fileToBase64 } from '../lib/gemini'

const S = {
  page:   { padding: '24px 20px 100px', direction: 'rtl', fontFamily: 'Cairo, sans-serif', minHeight: '100vh', background: '#070B14' },
  label:  { color: '#9BA8BF', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 },
  input:  { width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 16px', color: '#F0F4FF', fontSize: 15, fontFamily: 'Cairo, sans-serif', outline: 'none', boxSizing: 'border-box' },
  card:   { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 },
  btn:    { width: '100%', background: 'linear-gradient(135deg, #10D9A0, #0EA5E9)', border: 'none', borderRadius: 14, padding: '14px 0', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' },
  btnSec: { width: '100%', background: 'rgba(16,217,160,0.1)', border: '1px solid rgba(16,217,160,0.3)', borderRadius: 14, padding: '13px 0', color: '#10D9A0', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' },
  back:   { background: 'none', border: 'none', color: '#6B7A99', fontSize: 14, cursor: 'pointer', marginBottom: 20, fontFamily: 'Cairo, sans-serif', padding: 0 },
}

const PERIODS = ['صبح', 'ظهر', 'مساء', 'ليل']
const COLORS  = ['#10D9A0', '#FF6B6B', '#38BDF8', '#FBBF24', '#A78BFA', '#F97316']

// الأشكال اللي عندها كمية محددة (حبوب/كبسولات)
const COUNTABLE_FORMS = ['tablet', 'tab', 'capsule', 'cap', 'lozenge', 'troche']

function needsStockAndDose(form) {
  if (!form) return true
  return COUNTABLE_FORMS.some(f => form.toLowerCase().includes(f))
}

// ─── Drug Search ──────────────────────────────────────────────
function DrugSearch({ onSelect }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase.rpc('search_drugs', { search_term: query })
      setResults(data || [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer.current)
  }, [query])

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={S.label}>ابحث عن الدواء 🔍</label>
      <div style={{ position: 'relative' }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="اكتب اسم الدواء..." style={{ ...S.input, paddingRight: 42 }}
          autoComplete="off" />
        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>
          {loading ? '⏳' : '🔍'}
        </span>
      </div>

      {results.length > 0 && (
        <div style={{ background: '#0D1321', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, marginTop: 6, maxHeight: 240, overflowY: 'auto' }}>
          {results.map((drug, i) => (
            <div key={drug.id}
              onClick={() => { onSelect(drug); setQuery(''); setResults([]) }}
              style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: i < results.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,217,160,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#F0F4FF', fontWeight: 700, fontSize: 14 }}>{drug.tradename}</div>
                  <div style={{ color: '#6B7A99', fontSize: 12 }}>
                    {drug.activeingredient}
                    {drug.form && <span style={{ background: 'rgba(16,217,160,0.1)', color: '#10D9A0', borderRadius: 4, padding: '1px 6px', fontSize: 11, marginRight: 6 }}>{drug.form}</span>}
                  </div>
                </div>
                {drug.company && <div style={{ color: '#4B5563', fontSize: 11, flexShrink: 0 }}>{drug.company}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && !loading && (
        <div style={{ padding: '10px 16px', color: '#6B7A99', fontSize: 13, textAlign: 'center' }}>
          مش موجود في القاعدة — اكتبه يدوياً 👇
        </div>
      )}
    </div>
  )
}

// ─── AI Schedule Badge ────────────────────────────────────────
function AIScheduleBadge({ suggestion, onApply }) {
  if (!suggestion) return null
  return (
    <div style={{ background: 'rgba(16,217,160,0.06)', border: '1px solid rgba(16,217,160,0.25)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span>🤖</span>
        <span style={{ color: '#10D9A0', fontWeight: 700, fontSize: 13 }}>اقتراح AI للمواعيد</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {suggestion.suggested_times.map(t => (
          <span key={t} style={{ background: 'rgba(16,217,160,0.15)', color: '#10D9A0', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>{t}</span>
        ))}
        <span style={{ background: suggestion.with_food ? 'rgba(251,191,36,0.12)' : 'rgba(56,189,248,0.12)', color: suggestion.with_food ? '#FBBF24' : '#38BDF8', borderRadius: 8, padding: '4px 12px', fontSize: 13 }}>
          {suggestion.with_food ? 'مع الأكل 🍽️' : 'معدة فارغة'}
        </span>
      </div>
      {suggestion.reasoning && <p style={{ color: '#9BA8BF', fontSize: 12, margin: '0 0 8px', lineHeight: 1.6 }}>💡 {suggestion.reasoning}</p>}
      {suggestion.warning   && <p style={{ color: '#FF6B6B',  fontSize: 12, margin: '0 0 8px' }}>⚠️ {suggestion.warning}</p>}
      <button onClick={onApply} style={{ ...S.btnSec, padding: '9px 0', fontSize: 13 }}>تطبيق الاقتراح ✓</button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function AddMedPage() {
  const navigate = useNavigate()
  const { addMedication } = useMedications()
  const fileRef = useRef()

  const [step,            setStep]            = useState(1)
  const [mode,            setMode]            = useState(null)
  const [scanning,        setScanning]        = useState(false)
  const [aiResult,        setAiResult]        = useState(null)
  const [aiSchedule,      setAiSchedule]      = useState(null)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState('')

  const [form, setForm] = useState({
    generic_name: '',
    trade_name:   '',
    dose:         '',
    dosage_form:  'tablet',  // يتحدد تلقائي من قاعدة البيانات أو AI
    dose_times:   [],
    with_food:    true,
    stock_count:  30,
    color:        COLORS[0],
  })

  const update       = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const togglePeriod = p => update('dose_times',
    form.dose_times.includes(p)
      ? form.dose_times.filter(x => x !== p)
      : [...form.dose_times, p]
  )

  // يحدد تلقائي هل يظهر خانة الجرعة والكمية ولا لأ
  const showStockAndDose = needsStockAndDose(form.dosage_form)

  // لما يختار دواء من قاعدة البيانات — يملأ البيانات تلقائي
  function handleDrugSelect(drug) {
    const detectedForm = drug.form || 'tablet'
    setForm(p => ({
      ...p,
      generic_name: drug.activeingredient || '',
      trade_name:   drug.tradename        || '',
      dosage_form:  detectedForm,
      // لو مش tablet/capsule ما نحتاجش جرعة
      dose: needsStockAndDose(detectedForm) ? p.dose : '',
    }))
    setAiSchedule(null)
  }

  async function fetchAISchedule() {
    if (!form.generic_name) return
    setLoadingSchedule(true)
    setAiSchedule(null)
    setError('')
    try {
      const suggestion = await suggestDrugSchedule(form.generic_name, form.trade_name, form.dose)
      setAiSchedule(suggestion)
    } catch (e) {
      setError('تعذر الحصول على اقتراح — حدد المواعيد يدوياً')
    } finally {
      setLoadingSchedule(false)
    }
  }

  function applyAISchedule() {
    if (!aiSchedule) return
    update('dose_times', aiSchedule.suggested_times)
    update('with_food',  aiSchedule.with_food)
  }

  async function handleImagePick(e) {
    const file = e.target.files[0]
    if (!file) return
    setScanning(true); setError('')
    try {
      const base64 = await fileToBase64(file)
      const result = await recognizeDrugFromImage(base64, file.type)
      setAiResult(result)
      const detectedForm = result.dosage_form || 'tablet'
      setForm(p => ({
        ...p,
        generic_name: result.generic_name || '',
        trade_name:   result.trade_name   || '',
        dose:         needsStockAndDose(detectedForm) ? (result.dose || '') : '',
        dosage_form:  detectedForm,
      }))
      if (result.schedule_suggestion) {
        setAiSchedule({
          suggested_times: result.schedule_suggestion.suggested_times || ['صبح'],
          with_food:       result.schedule_suggestion.with_food ?? true,
          reasoning:       result.schedule_suggestion.notes || '',
          warning:         null,
        })
      }
      setStep(3)
    } catch (e) {
      setError(e.message)
      setStep(3); setMode('manual')
    } finally {
      setScanning(false)
    }
  }

  async function handleSave() {
    if (!form.generic_name) { setError('أدخل اسم الدواء'); return }
    if (form.dose_times.length === 0) { setError('اختر مواعيد الجرعة'); return }
    if (showStockAndDose && !form.dose) { setError('أدخل الجرعة'); return }
    setSaving(true); setError('')
    try {
      await addMedication({
        generic_name: form.generic_name,
        trade_name:   form.trade_name,
        dose:         showStockAndDose ? form.dose : '-',
        dosage_form:  form.dosage_form,
        dose_times:   form.dose_times,
        with_food:    form.with_food,
        stock_count:  showStockAndDose ? form.stock_count : 0,
        color:        form.color,
      })
      navigate('/medications')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Step 1: اختيار طريقة الإضافة ──────────────────────────
  if (step === 1) return (
    <div style={S.page}>
      <button onClick={() => navigate('/medications')} style={S.back}>← رجوع</button>
      <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>إضافة دواء 💊</h1>
      <p style={{ color: '#6B7A99', fontSize: 14, margin: '0 0 28px' }}>اختار طريقة الإضافة</p>

      <div onClick={() => { setMode('camera'); setStep(2) }}
        style={{ ...S.card, marginBottom: 16, cursor: 'pointer', border: '1px solid rgba(16,217,160,0.35)', background: 'rgba(16,217,160,0.03)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 44 }}>📸</span>
          <div>
            <div style={{ color: '#10D9A0', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>صوّر الدواء</div>
            <div style={{ color: '#6B7A99', fontSize: 13, marginBottom: 8 }}>الـ AI يتعرف على الدواء ويقترح المواعيد تلقائياً</div>
            <span style={{ background: 'rgba(16,217,160,0.15)', color: '#10D9A0', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Gemini AI ✨</span>
          </div>
        </div>
      </div>

      <div onClick={() => { setMode('manual'); setStep(3) }} style={{ ...S.card, cursor: 'pointer' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 44 }}>🔍</span>
          <div>
            <div style={{ color: '#F0F4FF', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>بحث يدوي</div>
            <div style={{ color: '#6B7A99', fontSize: 13 }}>ابحث في قاعدة الأدوية المصرية (26,000+ دواء)</div>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Step 2: كاميرا ─────────────────────────────────────────
  if (step === 2) return (
    <div style={S.page}>
      <button onClick={() => setStep(1)} style={S.back}>← رجوع</button>
      <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: '0 0 24px' }}>صوّر الدواء 📸</h1>
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={handleImagePick} style={{ display: 'none' }} />

      <div onClick={() => !scanning && fileRef.current?.click()}
        style={{ border: '2px dashed rgba(16,217,160,0.4)', borderRadius: 20, padding: 56, textAlign: 'center', background: 'rgba(16,217,160,0.03)', cursor: scanning ? 'default' : 'pointer', marginBottom: 20 }}>
        {scanning ? (
          <div>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🤖</div>
            <p style={{ color: '#10D9A0', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>جاري التعرف على الدواء...</p>
            <p style={{ color: '#6B7A99', fontSize: 13, margin: 0 }}>Gemini AI بيحلل الصورة</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📸</div>
            <p style={{ color: '#9BA8BF', fontSize: 14, marginBottom: 20 }}>اضغط لتصوير العلبة</p>
            <span style={{ background: 'rgba(16,217,160,0.1)', border: '1px solid rgba(16,217,160,0.3)', borderRadius: 12, padding: '10px 24px', color: '#10D9A0', fontWeight: 700, fontSize: 14 }}>اختار صورة</span>
          </div>
        )}
      </div>
      {error && <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12, padding: '12px 16px', color: '#FF6B6B', fontSize: 13 }}>{error}</div>}
    </div>
  )

  // ── Step 3: الفورم ─────────────────────────────────────────
  return (
    <div style={S.page}>
      <button onClick={() => setStep(mode === 'camera' ? 2 : 1)} style={S.back}>← رجوع</button>
      <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: '0 0 20px' }}>
        {aiResult ? `✅ ${aiResult.trade_name || 'تم التعرف'}` : 'تفاصيل الدواء'}
      </h1>

      {/* AI confidence badge */}
      {aiResult && (
        <div style={{ ...S.card, marginBottom: 20, background: 'rgba(16,217,160,0.04)', border: '1px solid rgba(16,217,160,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#F0F4FF', fontWeight: 800, fontSize: 16 }}>{aiResult.trade_name}</div>
              <div style={{ color: '#6B7A99', fontSize: 13 }}>{aiResult.generic_name}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#10D9A0', fontSize: 22, fontWeight: 800 }}>{Math.round((aiResult.confidence || 0.9) * 100)}%</div>
              <div style={{ color: '#6B7A99', fontSize: 11 }}>دقة التعرف</div>
            </div>
          </div>
          {/* شكل الدواء المكتشف */}
          {aiResult.dosage_form && (
            <div style={{ marginTop: 10, padding: '6px 12px', background: 'rgba(16,217,160,0.1)', borderRadius: 8, display: 'inline-block' }}>
              <span style={{ color: '#10D9A0', fontSize: 13, fontWeight: 700 }}>
                📋 {aiResult.dosage_form} {!showStockAndDose && '· لا يحتاج عدد حبوب'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <DrugSearch onSelect={handleDrugSelect} />

      {/* شكل الدواء المكتشف — للإدخال اليدوي */}
      {!aiResult && form.dosage_form && form.dosage_form !== 'tablet' && (
        <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#38BDF8', fontSize: 13 }}>
            📋 شكل الدواء: <strong>{form.dosage_form}</strong>
            {!showStockAndDose && ' — لا يحتاج عدد حبوب'}
          </span>
        </div>
      )}

      {/* AI Schedule button */}
      {loadingSchedule ? (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#10D9A0', fontSize: 13, marginBottom: 20 }}>
          🤖 AI بيحدد المواعيد...
        </div>
      ) : aiSchedule ? (
        <AIScheduleBadge suggestion={aiSchedule} onApply={applyAISchedule} />
      ) : (
        <button onClick={fetchAISchedule} disabled={!form.generic_name}
          style={{ ...S.btnSec, marginBottom: 20, opacity: form.generic_name ? 1 : 0.4 }}>
          🤖 اقترح مواعيد بالـ AI
        </button>
      )}

      {/* الاسم العلمي */}
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>الاسم العلمي *</label>
        <input placeholder="مثال: Metformin" value={form.generic_name}
          onChange={e => update('generic_name', e.target.value)} style={S.input} />
      </div>

      {/* الاسم التجاري */}
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>الاسم التجاري</label>
        <input placeholder="مثال: جلوكوفاج" value={form.trade_name}
          onChange={e => update('trade_name', e.target.value)} style={S.input} />
      </div>

      {/* الجرعة والكمية — بس لو tablet/capsule */}
      {showStockAndDose && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>الجرعة *</label>
            <input placeholder="مثال: 500mg" value={form.dose}
              onChange={e => update('dose', e.target.value)} style={S.input} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>عدد الحبوب/الكبسولات المتبقية</label>
            <input type="number" min="0" value={form.stock_count}
              onChange={e => update('stock_count', parseInt(e.target.value) || 0)} style={S.input} />
          </div>
        </>
      )}

      {/* مواعيد الجرعة */}
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>مواعيد الجرعة *</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {PERIODS.map(p => {
            const sel = form.dose_times.includes(p)
            return (
              <button key={p} onClick={() => togglePeriod(p)} style={{
                flex: 1, background: sel ? 'rgba(16,217,160,0.15)' : '#111827',
                border: `1px solid ${sel ? '#10D9A0' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, padding: '10px 0',
                color: sel ? '#10D9A0' : '#6B7A99',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
              }}>{p}</button>
            )
          })}
        </div>
      </div>

      {/* مع أكل ولا لأ */}
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>وقت الأخذ</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[[true, 'مع الأكل 🍽️'], [false, 'معدة فارغة']].map(([val, lbl]) => (
            <button key={String(val)} onClick={() => update('with_food', val)} style={{
              flex: 1, background: form.with_food === val ? 'rgba(16,217,160,0.15)' : '#111827',
              border: `1px solid ${form.with_food === val ? '#10D9A0' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10, padding: '12px 0',
              color: form.with_food === val ? '#10D9A0' : '#6B7A99',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* اللون */}
      <div style={{ marginBottom: 28 }}>
        <label style={S.label}>لون مميز للدواء</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => update('color', c)} style={{
              width: 36, height: 36, borderRadius: '50%', background: c, cursor: 'pointer',
              border: `3px solid ${form.color === c ? '#fff' : 'transparent'}`,
              transition: 'border 0.2s',
            }} />
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12, padding: '12px 16px', color: '#FF6B6B', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}
      <button onClick={handleSave} disabled={saving} style={S.btn}>
        {saving ? 'جاري الحفظ...' : 'حفظ الدواء ✓'}
      </button>
    </div>
  )
}

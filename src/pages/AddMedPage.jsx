import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useMedications } from '../hooks/useMedications'
import { suggestDrugSchedule, fileToBase64 } from '../lib/gemini'

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
const COUNTABLE = ['tablet', 'tab', 'capsule', 'cap', 'lozenge']

function needsStockAndDose(form) {
  if (!form) return true
  return COUNTABLE.some(f => form.toLowerCase().includes(f))
}

function parseJSON(raw) {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const start = clean.indexOf('[') !== -1 && clean.indexOf('[') < clean.indexOf('{') ? clean.indexOf('[') : clean.indexOf('{')
  if (start === -1) throw new Error('No JSON')
  // Try array first
  const arrStart = clean.indexOf('[')
  const arrEnd   = clean.lastIndexOf(']')
  if (arrStart !== -1 && arrEnd !== -1) {
    try { return JSON.parse(clean.slice(arrStart, arrEnd + 1)) } catch {}
  }
  const objStart = clean.indexOf('{')
  const objEnd   = clean.lastIndexOf('}')
  return JSON.parse(clean.slice(objStart, objEnd + 1))
}

// - Drug Search -
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
          placeholder="اكتب اسم الدواء..." style={{ ...S.input, paddingRight: 42 }} autoComplete="off" />
        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>
          {loading ? '⏳' : '🔍'}
        </span>
      </div>
      {results.length > 0 && (
        <div style={{ background: '#0D1321', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, marginTop: 6, maxHeight: 240, overflowY: 'auto' }}>
          {results.map((drug, i) => (
            <div key={drug.id} onClick={() => { onSelect(drug); setQuery(''); setResults([]) }}
              style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,217,160,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ color: '#F0F4FF', fontWeight: 700, fontSize: 14 }}>{drug.tradename}</div>
              <div style={{ color: '#6B7A99', fontSize: 12 }}>
                {drug.activeingredient}
                {drug.form && <span style={{ background: 'rgba(16,217,160,0.1)', color: '#10D9A0', borderRadius: 4, padding: '1px 6px', fontSize: 11, marginRight: 6 }}>{drug.form}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && !loading && (
        <div style={{ padding: '10px 16px', color: '#6B7A99', fontSize: 13, textAlign: 'center' }}>مش موجود -- اكتبه يدوياً 👇</div>
      )}
    </div>
  )
}

// - Single Drug Form -
function DrugForm({ form, onChange, onSave, saving, error, aiSchedule, loadingSchedule, onFetchSchedule, onApplySchedule, onRemove, index, total }) {
  const showStock = needsStockAndDose(form.dosage_form)
  const toggle = p => onChange('dose_times', form.dose_times.includes(p) ? form.dose_times.filter(x => x !== p) : [...form.dose_times, p])

  return (
    <div style={{ ...S.card, marginBottom: 20, border: total > 1 ? '1px solid rgba(16,217,160,0.2)' : '1px solid rgba(255,255,255,0.07)' }}>
      {total > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ color: '#10D9A0', fontWeight: 700, fontSize: 14 }}>💊 دواء {index + 1} من {total}</div>
          <button onClick={onRemove} style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 8, padding: '5px 12px', color: '#FF6B6B', fontSize: 12, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إزالة ×</button>
        </div>
      )}

      {/* شكل الدواء المكتشف */}
      {form.dosage_form && (
        <div style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 10, padding: '8px 14px', marginBottom: 14, fontSize: 13, color: '#38BDF8' }}>
          📋 {form.dosage_form} {!showStock && '· لا يحتاج عدد حبوب'}
        </div>
      )}

      {/* AI Schedule */}
      {loadingSchedule ? (
        <div style={{ textAlign: 'center', padding: '10px 0', color: '#10D9A0', fontSize: 13, marginBottom: 14 }}>🤖 AI بيحدد المواعيد...</div>
      ) : aiSchedule ? (
        <div style={{ background: 'rgba(16,217,160,0.06)', border: '1px solid rgba(16,217,160,0.2)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ color: '#10D9A0', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🤖 اقتراح AI</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {aiSchedule.suggested_times.map(t => <span key={t} style={{ background: 'rgba(16,217,160,0.15)', color: '#10D9A0', borderRadius: 8, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>{t}</span>)}
            <span style={{ background: aiSchedule.with_food ? 'rgba(251,191,36,0.12)' : 'rgba(56,189,248,0.12)', color: aiSchedule.with_food ? '#FBBF24' : '#38BDF8', borderRadius: 8, padding: '3px 10px', fontSize: 13 }}>
              {aiSchedule.with_food ? 'مع الأكل 🍽️' : 'معدة فارغة'}
            </span>
          </div>
          {aiSchedule.reasoning && <div style={{ color: '#9BA8BF', fontSize: 12, marginBottom: 8 }}>💡 {aiSchedule.reasoning}</div>}
          {aiSchedule.warning   && <div style={{ color: '#FF6B6B',  fontSize: 12, marginBottom: 8 }}>⚠️ {aiSchedule.warning}</div>}
          <button onClick={onApplySchedule} style={{ ...S.btnSec, padding: '8px 0', fontSize: 13 }}>تطبيق ✓</button>
        </div>
      ) : (
        <button onClick={onFetchSchedule} disabled={!form.generic_name}
          style={{ ...S.btnSec, marginBottom: 14, opacity: form.generic_name ? 1 : 0.4, padding: '10px 0', fontSize: 13 }}>
          🤖 اقترح مواعيد
        </button>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ ...S.label, fontSize: 12 }}>الاسم العلمي *</label>
        <input placeholder="Metformin" value={form.generic_name} onChange={e => onChange('generic_name', e.target.value)} style={{ ...S.input, padding: '11px 14px', fontSize: 14 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ ...S.label, fontSize: 12 }}>الاسم التجاري</label>
        <input placeholder="جلوكوفاج" value={form.trade_name} onChange={e => onChange('trade_name', e.target.value)} style={{ ...S.input, padding: '11px 14px', fontSize: 14 }} />
      </div>

      {showStock && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...S.label, fontSize: 12 }}>الجرعة</label>
            <input placeholder="500mg" value={form.dose} onChange={e => onChange('dose', e.target.value)} style={{ ...S.input, padding: '11px 14px', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...S.label, fontSize: 12 }}>عدد الحبوب المتبقية</label>
            <input type="number" min="0" value={form.stock_count} onChange={e => onChange('stock_count', parseInt(e.target.value) || 0)} style={{ ...S.input, padding: '11px 14px', fontSize: 14 }} />
          </div>
        </>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ ...S.label, fontSize: 12 }}>مواعيد الجرعة *</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map(p => {
            const sel = form.dose_times.includes(p)
            return <button key={p} onClick={() => toggle(p)} style={{ flex: 1, background: sel ? 'rgba(16,217,160,0.15)' : '#0D1321', border: `1px solid ${sel ? '#10D9A0' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '9px 0', color: sel ? '#10D9A0' : '#6B7A99', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>{p}</button>
          })}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[[true, 'مع الأكل 🍽️'], [false, 'معدة فارغة']].map(([val, lbl]) => (
            <button key={String(val)} onClick={() => onChange('with_food', val)} style={{ flex: 1, background: form.with_food === val ? 'rgba(16,217,160,0.12)' : '#0D1321', border: `1px solid ${form.with_food === val ? '#10D9A0' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '10px 0', color: form.with_food === val ? '#10D9A0' : '#6B7A99', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ ...S.label, fontSize: 12 }}>لون مميز</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {COLORS.map(c => <button key={c} onClick={() => onChange('color', c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${form.color === c ? '#fff' : 'transparent'}` }} />)}
        </div>
      </div>

      {error && <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '10px 14px', color: '#FF6B6B', fontSize: 13, marginTop: 12 }}>{error}</div>}
    </div>
  )
}

function emptyForm() {
  return { generic_name: '', trade_name: '', dose: '', dosage_form: 'tablet', dose_times: [], with_food: true, stock_count: 30, color: COLORS[0] }
}

// - Main -
export default function AddMedPage() {
  const navigate = useNavigate()
  const { addMedication } = useMedications()
  const fileRef = useRef()

  const [step,     setStep]     = useState(1)
  const [mode,     setMode]     = useState(null)
  const [scanning, setScanning] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState([])

  // قائمة أدوية -- كل صورة ممكن ترجع أكتر من دواء
  const [drugs,      setDrugs]      = useState([emptyForm()])
  const [schedules,  setSchedules]  = useState([null])
  const [loadingSch, setLoadingSch] = useState([false])

  function updateDrug(idx, key, val) {
    setDrugs(p => p.map((d, i) => i === idx ? { ...d, [key]: val } : d))
  }
  function removeDrug(idx) {
    setDrugs(p => p.filter((_, i) => i !== idx))
    setSchedules(p => p.filter((_, i) => i !== idx))
    setLoadingSch(p => p.filter((_, i) => i !== idx))
  }

  // -- AI: ابحث عن كل دواء في الـ DB --------------------------
  async function searchDrugInDB(name) {
    const { data } = await supabase.rpc('search_drugs', { search_term: name })
    return data?.[0] || null
  }

  // -- AI: اقرأ الصورة وارجع قائمة الأدوية ------------------
  async function handleImagePick(e) {
    const file = e.target.files[0]
    if (!file) return
    setScanning(true)
    try {
      const base64 = await fileToBase64(file)
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
                text: `You are an expert pharmacist. Look at this image carefully -- it may contain ONE or MULTIPLE medications.
List ALL medications you can identify.
Respond ONLY with a JSON array, no other text:
[
  {
    "generic_name": "scientific name",
    "trade_name": "brand name on box",
    "dose": "strength e.g. 500mg",
    "dosage_form": "tablet|capsule|syrup|injection|cream|drops|inhaler|suppository|other",
    "confidence": 0.9
  }
]
If only one medication, still return an array with one item.`
              },
              { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } }
            ]
          }],
          max_tokens: 800,
        }),
      })

      const data   = await res.json()
      const text   = data.choices?.[0]?.message?.content || ''
      const parsed = parseJSON(text)
      const list   = Array.isArray(parsed) ? parsed : [parsed]

      // لكل دواء، ابحث عنه في الـ DB
      const enriched = await Promise.all(list.map(async (drug) => {
        const dbDrug = await searchDrugInDB(drug.trade_name || drug.generic_name)
        return {
          generic_name: dbDrug?.activeingredient || drug.generic_name || '',
          trade_name:   dbDrug?.tradename        || drug.trade_name   || '',
          dose:         drug.dose                || '',
          dosage_form:  dbDrug?.form             || drug.dosage_form  || 'tablet',
          dose_times:   [],
          with_food:    true,
          stock_count:  30,
          color:        COLORS[Math.floor(Math.random() * COLORS.length)],
        }
      }))

      setDrugs(enriched)
      setSchedules(new Array(enriched.length).fill(null))
      setLoadingSch(new Array(enriched.length).fill(false))
      setStep(3)
    } catch (e) {
      console.error('AI error:', e)
      setDrugs([emptyForm()])
      setStep(3); setMode('manual')
    } finally {
      setScanning(false)
    }
  }

  function handleDrugSelect(drug) {
    setDrugs([{
      generic_name: drug.activeingredient || '',
      trade_name:   drug.tradename        || '',
      dose:         '',
      dosage_form:  drug.form             || 'tablet',
      dose_times:   [],
      with_food:    true,
      stock_count:  30,
      color:        COLORS[0],
    }])
    setSchedules([null])
    setLoadingSch([false])
  }

  async function fetchSchedule(idx) {
    const drug = drugs[idx]
    if (!drug.generic_name) return
    setLoadingSch(p => p.map((v, i) => i === idx ? true : v))
    try {
      const s = await suggestDrugSchedule(drug.generic_name, drug.trade_name, drug.dose)
      setSchedules(p => p.map((v, i) => i === idx ? s : v))
    } catch {}
    finally { setLoadingSch(p => p.map((v, i) => i === idx ? false : v)) }
  }

  function applySchedule(idx) {
    const s = schedules[idx]
    if (!s) return
    updateDrug(idx, 'dose_times', s.suggested_times)
    updateDrug(idx, 'with_food',  s.with_food)
  }

  async function handleSaveAll() {
    const errs = drugs.map((d, i) => {
      if (!d.generic_name) return `دواء ${i+1}: أدخل الاسم`
      if (d.dose_times.length === 0) return `دواء ${i+1}: اختر المواعيد`
      return null
    })
    setErrors(errs)
    if (errs.some(Boolean)) return
    setSaving(true)
    try {
      for (const drug of drugs) {
        const showStock = needsStockAndDose(drug.dosage_form)
        await addMedication({
          generic_name: drug.generic_name,
          trade_name:   drug.trade_name,
          dose:         showStock ? drug.dose : '-',
          dosage_form:  drug.dosage_form,
          dose_times:   drug.dose_times,
          with_food:    drug.with_food,
          stock_count:  showStock ? drug.stock_count : 0,
          color:        drug.color,
        })
      }
      navigate('/medications')
    } catch (e) {
      setErrors([e.message])
    } finally {
      setSaving(false)
    }
  }

  // -- Step 1 ------------------------------------------------
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
            <div style={{ color: '#10D9A0', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>صوّر الأدوية</div>
            <div style={{ color: '#6B7A99', fontSize: 13, marginBottom: 8 }}>الـ AI يتعرف على كل الأدوية في الصورة ويضيفهم مرة واحدة</div>
            <span style={{ background: 'rgba(16,217,160,0.15)', color: '#10D9A0', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>يقرأ أكتر من دواء ✨</span>
          </div>
        </div>
      </div>

      <div onClick={() => { setMode('manual'); setDrugs([emptyForm()]); setSchedules([null]); setLoadingSch([false]); setStep(3) }}
        style={{ ...S.card, cursor: 'pointer' }}>
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

  // -- Step 2: كاميرا ----------------------------------------
  if (step === 2) return (
    <div style={S.page}>
      <button onClick={() => setStep(1)} style={S.back}>← رجوع</button>
      <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: '0 0 24px' }}>صوّر الأدوية 📸</h1>
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={handleImagePick} style={{ display: 'none' }} />
      <div onClick={() => !scanning && fileRef.current?.click()}
        style={{ border: '2px dashed rgba(16,217,160,0.4)', borderRadius: 20, padding: 56, textAlign: 'center', background: 'rgba(16,217,160,0.03)', cursor: scanning ? 'default' : 'pointer', marginBottom: 20 }}>
        {scanning ? (
          <div>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🤖</div>
            <p style={{ color: '#10D9A0', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>AI بيتعرف على الأدوية...</p>
            <p style={{ color: '#6B7A99', fontSize: 13, margin: 0 }}>بيبحث عن كل دواء في قاعدة البيانات</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📸</div>
            <p style={{ color: '#9BA8BF', fontSize: 14, marginBottom: 8 }}>صوّر كل الأدوية مع بعض</p>
            <p style={{ color: '#6B7A99', fontSize: 12, marginBottom: 20 }}>الـ AI هيقرأهم كلهم ويضيفهم تلقائي</p>
            <span style={{ background: 'rgba(16,217,160,0.1)', border: '1px solid rgba(16,217,160,0.3)', borderRadius: 12, padding: '10px 24px', color: '#10D9A0', fontWeight: 700, fontSize: 14 }}>اختار صورة</span>
          </div>
        )}
      </div>
    </div>
  )

  // -- Step 3: الفورم ----------------------------------------
  return (
    <div style={S.page}>
      <button onClick={() => setStep(mode === 'camera' ? 2 : 1)} style={S.back}>← رجوع</button>

      {drugs.length > 1 ? (
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: '#F0F4FF', fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>
            ✅ الـ AI لقى {drugs.length} أدوية
          </h1>
          <p style={{ color: '#6B7A99', fontSize: 13, margin: 0 }}>راجع بيانات كل دواء وحدد المواعيد</p>
        </div>
      ) : (
        <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 800, margin: '0 0 20px' }}>تفاصيل الدواء</h1>
      )}

      {/* Drug Search -- للإدخال اليدوي */}
      {mode === 'manual' && (
        <DrugSearch onSelect={handleDrugSelect} />
      )}

      {/* Drug Forms */}
      {drugs.map((drug, idx) => (
        <DrugForm
          key={idx}
          index={idx}
          total={drugs.length}
          form={drug}
          onChange={(k, v) => updateDrug(idx, k, v)}
          onRemove={() => removeDrug(idx)}
          aiSchedule={schedules[idx]}
          loadingSchedule={loadingSch[idx]}
          onFetchSchedule={() => fetchSchedule(idx)}
          onApplySchedule={() => applySchedule(idx)}
          error={errors[idx]}
          saving={false}
        />
      ))}

      {/* Add more manually */}
      <button onClick={() => { setDrugs(p => [...p, emptyForm()]); setSchedules(p => [...p, null]); setLoadingSch(p => [...p, false]) }}
        style={{ ...S.btnSec, marginBottom: 16 }}>
        + إضافة دواء آخر
      </button>

      {errors.filter(Boolean).length > 0 && (
        <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12, padding: '12px 16px', color: '#FF6B6B', fontSize: 13, marginBottom: 16 }}>
          {errors.filter(Boolean).join(' · ')}
        </div>
      )}

      <button onClick={handleSaveAll} disabled={saving} style={S.btn}>
        {saving ? 'جاري الحفظ...' : drugs.length > 1 ? `حفظ ${drugs.length} أدوية ✓` : 'حفظ الدواء ✓'}
      </button>
    </div>
  )
}

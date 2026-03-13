// ─── OpenRouter API — بديل Gemini مجاني ──────────────────────
// الموديل: google/gemini-2.0-flash-exp:free
// مجاني 100% على openrouter.ai

const MODEL = 'google/gemini-2.0-flash-exp:free'
const URL   = 'https://openrouter.ai/api/v1/chat/completions'

function getKey() {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!key) throw new Error('VITE_OPENROUTER_API_KEY غير موجود في .env')
  return key
}

async function callAI(messages, maxTokens = 500) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${getKey()}`,
      'HTTP-Referer':  'https://mediguard.vercel.app',
      'X-Title':       'MediGuard',
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'OpenRouter API error')
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('لم يرد الـ AI')
  return text
}

function parseJSON(raw) {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const start = clean.indexOf('{')
  const end   = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON in response')
  return JSON.parse(clean.slice(start, end + 1))
}

// ─── تعرف على الدواء من صورة ─────────────────────────────────
export async function recognizeDrugFromImage(imageBase64, mimeType = 'image/jpeg') {
  const text = await callAI([{
    role: 'user',
    content: [
      {
        type: 'text',
        text: `You are an expert pharmacist. Analyze this medication image.
Respond ONLY with this JSON, no other text:
{
  "generic_name": "scientific name in English",
  "trade_name": "brand name on box",
  "dose": "strength e.g. 500mg",
  "dosage_form": "tablet|capsule|syrup|injection|cream|drops|inhaler|suppository|other",
  "schedule_suggestion": {
    "suggested_times": ["صبح"],
    "with_food": true,
    "notes": "سبب التوقيت"
  },
  "confidence": 0.9
}
suggested_times values: صبح / ظهر / مساء / ليل only.
If unclear set confidence 0.2.`
      },
      {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${imageBase64}` }
      }
    ]
  }], 600)

  try { return parseJSON(text) }
  catch { throw new Error('تعذر قراءة الصورة — تأكد إن الصورة واضحة') }
}

// ─── اقتراح مواعيد الدواء ────────────────────────────────────
export async function suggestDrugSchedule(genericName, tradeName, dose) {
  const text = await callAI([{
    role: 'user',
    content: `Clinical pharmacist. Medication: ${genericName} (${tradeName || ''}) ${dose || ''}
Respond ONLY with this JSON, no other text:
{
  "suggested_times": ["صبح"],
  "with_food": true,
  "reasoning": "سبب قصير بالعربي",
  "warning": null
}
suggested_times: صبح/ظهر/مساء/ليل only. QD=["صبح"] BID=["صبح","ليل"] TID=["صبح","ظهر","ليل"]`
  }], 250)

  try { return parseJSON(text) }
  catch { return { suggested_times: ['صبح'], with_food: true, reasoning: 'جرعة يومية صباحية', warning: null } }
}

// ─── تحليل صورة تحليل/أشعة ───────────────────────────────────
export async function analyzeLabImage(imageBase64, mimeType = 'image/jpeg') {
  const text = await callAI([{
    role: 'user',
    content: [
      {
        type: 'text',
        text: `Medical expert. Analyze this medical document (lab result or X-ray).
Respond ONLY with this JSON:
{
  "type": "lab",
  "findings": ["finding in Arabic"],
  "summary": "ملخص بالعربي",
  "is_abnormal": false,
  "recommendations": "توصية أو null"
}`
      },
      {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${imageBase64}` }
      }
    ]
  }], 400)

  try { return parseJSON(text) }
  catch { return { type: 'lab', findings: [], summary: 'تعذر التحليل', is_abnormal: false, recommendations: null } }
}

// ─── تحويل ملف لـ base64 ─────────────────────────────────────
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('فشل قراءة الملف'))
    reader.readAsDataURL(file)
  })
}

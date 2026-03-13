// ─── Gemini API ───────────────────────────────────────────────
// gemini-2.0-flash-lite — الأسرع في الـ free tier

const MODEL = 'gemini-2.0-flash-lite'
const BASE  = 'https://generativelanguage.googleapis.com/v1beta/models'

function getUrl() {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) throw new Error('VITE_GEMINI_API_KEY غير موجود في ملف .env')
  return `${BASE}/${MODEL}:generateContent?key=${key}`
}

async function callGemini(parts, maxTokens = 400) {
  const res = await fetch(getUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Gemini API error')
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('لم يرد الـ AI بأي نتيجة')
  return text
}

function parseJSON(raw) {
  return JSON.parse(raw.replace(/```json\s*|\s*```/g, '').trim())
}

export async function recognizeDrugFromImage(imageBase64, mimeType = 'image/jpeg') {
  const text = await callGemini([
    {
      text: `You are an expert pharmacist. Analyze this medication image.
Respond ONLY with valid JSON (no markdown, no extra text):
{
  "generic_name": "scientific name in English",
  "trade_name": "brand name on box",
  "dose": "strength e.g. 500mg",
  "dosage_form": "tablet|capsule|syrup|injection|cream|drops|inhaler|patch|suppository|other",
  "schedule_suggestion": {
    "suggested_times": ["صبح"],
    "with_food": true,
    "notes": "سبب التوقيت"
  },
  "confidence": 0.9
}
Use only these values for suggested_times: صبح / ظهر / مساء / ليل
If image is unclear, set confidence 0.1 and fill what you can.`
    },
    { inline_data: { mime_type: mimeType, data: imageBase64 } }
  ], 500)

  try { return parseJSON(text) }
  catch { throw new Error('تعذر قراءة رد الـ AI — حاول مرة أخرى') }
}

export async function suggestDrugSchedule(genericName, tradeName, dose) {
  const text = await callGemini([{
    text: `Clinical pharmacist. Medication: ${genericName} (${tradeName || ''}) ${dose || ''}
Respond ONLY with JSON (no markdown):
{
  "suggested_times": ["صبح"],
  "with_food": true,
  "reasoning": "سبب قصير بالعربي",
  "warning": null
}
suggested_times options: صبح / ظهر / مساء / ليل only.`
  }], 250)

  try { return parseJSON(text) }
  catch { return { suggested_times: ['صبح'], with_food: true, reasoning: 'الجرعة اليومية الصباحية', warning: null } }
}

export async function analyzeLabImage(imageBase64, mimeType = 'image/jpeg') {
  const text = await callGemini([
    {
      text: `You are a medical expert. Analyze this medical document (lab result or X-ray report).
Respond ONLY with JSON (no markdown):
{
  "type": "lab|xray",
  "findings": ["finding 1 in Arabic", "finding 2"],
  "summary": "ملخص النتيجة بالعربي",
  "is_abnormal": false,
  "recommendations": "توصية طبية أو null"
}`
    },
    { inline_data: { mime_type: mimeType, data: imageBase64 } }
  ], 400)

  try { return parseJSON(text) }
  catch { return { type: 'lab', findings: [], summary: 'تعذر تحليل الصورة', is_abnormal: false, recommendations: null } }
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('فشل قراءة الملف'))
    reader.readAsDataURL(file)
  })
}

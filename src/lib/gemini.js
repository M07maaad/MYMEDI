// ─── Gemini API — gemini-2.5-flash-lite (Free Tier 2026) ──────
// 1,000 requests/day | 15 req/min | مجاني 100%

const MODEL = 'gemini-2.0-flash-exp'
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
  // Remove markdown code blocks if present
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  // Find first { to last }
  const start = clean.indexOf('{')
  const end   = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found')
  return JSON.parse(clean.slice(start, end + 1))
}

// ─── تعرف على الدواء من صورة ─────────────────────────────────
export async function recognizeDrugFromImage(imageBase64, mimeType = 'image/jpeg') {
  const text = await callGemini([
    {
      text: `You are an expert pharmacist. Analyze this medication image carefully.
Respond ONLY with this exact JSON structure, no other text:
{
  "generic_name": "scientific name in English",
  "trade_name": "brand name visible on packaging",
  "dose": "strength like 500mg or 10mg/5ml",
  "dosage_form": "tablet or capsule or syrup or injection or cream or drops or inhaler or suppository or other",
  "schedule_suggestion": {
    "suggested_times": ["صبح"],
    "with_food": true,
    "notes": "brief reason in Arabic"
  },
  "confidence": 0.9
}
For suggested_times use ONLY: صبح / ظهر / مساء / ليل
If unclear, set confidence to 0.2 and fill what you can see.`
    },
    { inline_data: { mime_type: mimeType, data: imageBase64 } }
  ], 600)

  try {
    return parseJSON(text)
  } catch {
    throw new Error('تعذر قراءة الصورة — تأكد إن الصورة واضحة وتظهر العلبة كاملة')
  }
}

// ─── اقتراح مواعيد الدواء بالـ AI ────────────────────────────
export async function suggestDrugSchedule(genericName, tradeName, dose) {
  const text = await callGemini([{
    text: `You are a clinical pharmacist. For this medication: ${genericName} (${tradeName || ''}) ${dose || ''}

What is the standard dosing schedule? Respond ONLY with this JSON, no other text:
{
  "suggested_times": ["صبح"],
  "with_food": true,
  "reasoning": "سبب التوقيت بالعربي — جملة واحدة بسيطة",
  "warning": null
}

Rules:
- suggested_times: use ONLY values from ["صبح", "ظهر", "مساء", "ليل"]
- Once daily (QD) → ["صبح"]
- Twice daily (BID) → ["صبح", "ليل"]  
- Three times daily (TID) → ["صبح", "ظهر", "ليل"]
- Four times daily (QID) → ["صبح", "ظهر", "مساء", "ليل"]
- warning: important drug-specific warning in Arabic, or null`
  }], 300)

  try {
    return parseJSON(text)
  } catch {
    return {
      suggested_times: ['صبح'],
      with_food: true,
      reasoning: 'جرعة يومية صباحية',
      warning: null
    }
  }
}

// ─── تحليل صورة تحليل/أشعة ───────────────────────────────────
export async function analyzeLabImage(imageBase64, mimeType = 'image/jpeg') {
  const text = await callGemini([
    {
      text: `You are a medical expert. Analyze this medical document image (lab result or X-ray or scan report).
Respond ONLY with this JSON, no other text:
{
  "type": "lab",
  "findings": ["finding in Arabic", "finding 2"],
  "summary": "ملخص النتيجة بالعربي في جملتين",
  "is_abnormal": false,
  "recommendations": "توصية مختصرة بالعربي أو null"
}
For type: use "lab" for blood/urine tests, "xray" for radiology reports.`
    },
    { inline_data: { mime_type: mimeType, data: imageBase64 } }
  ], 500)

  try {
    return parseJSON(text)
  } catch {
    return {
      type: 'lab',
      findings: [],
      summary: 'تعذر تحليل الصورة — حاول مرة أخرى',
      is_abnormal: false,
      recommendations: null
    }
  }
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

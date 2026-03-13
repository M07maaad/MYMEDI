// ─── Gemini Vision API — Fixed Version ───────────────────────
// المشكلة الأساسية: الـ API key بيتبعت في الـ URL مش في الـ headers
// والـ model name لازم يكون صح

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`

export async function recognizeDrugFromImage(imageBase64, mimeType = 'image/jpeg') {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('Gemini API key غير موجود — تأكد من ملف .env')
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: `You are a pharmacy expert. Look at this medication image carefully.
Extract the following information and respond ONLY with valid JSON, no markdown, no explanation:
{
  "generic_name": "the scientific/generic drug name in English",
  "trade_name": "the brand/trade name shown on the box",
  "dose": "the strength like 500mg or 10mg",
  "dosage_form": "tablet or capsule or syrup or injection",
  "schedule_suggestion": {
    "times_per_day": 1,
    "suggested_times": ["صبح"],
    "with_food": true,
    "notes": "any important timing notes in Arabic"
  },
  "confidence": 0.9
}
If you cannot read the medication clearly, set confidence to 0.1 and fill what you can see.`
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
      }
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Gemini API Error:', errorData)
    throw new Error(`Gemini Error: ${errorData.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) throw new Error('لم يرد الـ AI بأي نتيجة')

  try {
    // Remove any markdown code blocks if present
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    throw new Error('تعذر قراءة رد الـ AI')
  }
}

// ─── AI Schedule Suggestion ───────────────────────────────────
// بتبعت اسم الدواء والـ AI يرد بالمواعيد المناسبة
export async function suggestDrugSchedule(genericName, tradeName, dose) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key غير موجود')

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a clinical pharmacist. For this medication:
Drug: ${genericName} (${tradeName || ''}) ${dose || ''}

Provide the standard dosing schedule. Respond ONLY with this JSON, no markdown:
{
  "suggested_times": ["صبح"],
  "with_food": true,
  "reasoning": "سبب التوقيت بالعربي في جملة واحدة قصيرة",
  "warning": "أي تحذير مهم بالعربي أو null"
}

Rules for suggested_times: use only values from ["صبح", "ظهر", "مساء", "ليل"]
Examples:
- Once daily morning drug → ["صبح"]  
- Twice daily → ["صبح", "ليل"]
- Three times daily → ["صبح", "ظهر", "ليل"]
- With meals → with_food: true`
        }]
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
    })
  })

  if (!response.ok) throw new Error('فشل الاتصال بالـ AI')

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('لم يرد الـ AI')

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    // Default fallback
    return { suggested_times: ['صبح'], with_food: true, reasoning: 'مرة يومياً الصبح', warning: null }
  }
}

// ─── Convert file to base64 ───────────────────────────────────
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('فشل قراءة الملف'))
    reader.readAsDataURL(file)
  })
}

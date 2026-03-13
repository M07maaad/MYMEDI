// ─── Gemini Vision API — Drug Recognition ────────────────────
// Uses Gemini 1.5 Flash (FREE tier: 1500 requests/day)

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

export async function recognizeDrugFromImage(imageBase64, mimeType = 'image/jpeg') {
  const prompt = `
    You are a pharmacist assistant. Analyze this medication image and extract:
    1. Generic name (الاسم العلمي)
    2. Trade name (الاسم التجاري)  
    3. Dose/strength (الجرعة)
    4. Dosage form (شكل الدواء: tablet/capsule/syrup)
    
    Respond ONLY with this JSON (no markdown, no explanation):
    {
      "generic_name": "",
      "trade_name": "",
      "dose": "",
      "dosage_form": "",
      "confidence": 0.0
    }
    
    If you cannot identify the medication, set confidence to 0.
  `

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
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
        maxOutputTokens: 200,
      }
    })
  })

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) throw new Error('No response from Gemini')

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    throw new Error('Could not parse drug information')
  }
}

// Convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

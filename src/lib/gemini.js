// OpenRouter API - free tier
const MODEL = 'openrouter/auto'
const URL   = 'https://openrouter.ai/api/v1/chat/completions'

function getKey() {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!key) throw new Error('VITE_OPENROUTER_API_KEY missing')
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
  if (!res.ok) throw new Error(data.error?.message || 'OpenRouter error')
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('لم يرد الـ AI')
  return text
}

function parseJSON(raw) {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const arrS = clean.indexOf('['), arrE = clean.lastIndexOf(']')
  const objS = clean.indexOf('{'), objE = clean.lastIndexOf('}')
  if (arrS !== -1 && arrE !== -1 && arrS < objS) {
    try { return JSON.parse(clean.slice(arrS, arrE + 1)) } catch {}
  }
  return JSON.parse(clean.slice(objS, objE + 1))
}

export async function recognizeDrugFromImage(imageBase64, mimeType = 'image/jpeg') {
  const text = await callAI([{
    role: 'user',
    content: [
      { type: 'text', text: `You are an expert pharmacist. Look at this image - it may have ONE or MULTIPLE medications.
List ALL medications visible. Respond ONLY with JSON array, no other text:
[{"generic_name":"scientific name","trade_name":"brand name","dose":"500mg","dosage_form":"tablet|capsule|syrup|injection|cream|drops|inhaler|suppository|other","confidence":0.9}]
If only one med, still return array with one item.` },
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
    ]
  }], 800)
  try {
    const result = parseJSON(text)
    return Array.isArray(result) ? result : [result]
  } catch {
    throw new Error('تعذر قراءة الصورة')
  }
}

export async function suggestDrugSchedule(genericName, tradeName, dose) {
  const text = await callAI([{
    role: 'user',
    content: `Clinical pharmacist. Drug: ${genericName} (${tradeName || ''}) ${dose || ''}
Respond ONLY with JSON:
{"suggested_times":["صبح"],"with_food":true,"reasoning":"سبب بالعربي","warning":null}
suggested_times: صبح/ظهر/مساء/ليل only. QD=["صبح"] BID=["صبح","ليل"] TID=["صبح","ظهر","ليل"]`
  }], 250)
  try { return parseJSON(text) }
  catch { return { suggested_times: ['صبح'], with_food: true, reasoning: 'جرعة يومية', warning: null } }
}

export async function analyzeLabImage(imageBase64, mimeType = 'image/jpeg') {
  const text = await callAI([{
    role: 'user',
    content: [
      { type: 'text', text: `Medical expert. Analyze this medical document.
Respond ONLY with JSON:
{"type":"lab","findings":["نتيجة"],"summary":"ملخص","is_abnormal":false,"recommendations":null}
type: lab for blood/urine, xray for radiology.` },
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
    ]
  }], 500)
  try { return parseJSON(text) }
  catch { return { type: 'lab', findings: [], summary: 'تعذر التحليل', is_abnormal: false, recommendations: null } }
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('فشل قراءة الملف'))
    reader.readAsDataURL(file)
  })
}

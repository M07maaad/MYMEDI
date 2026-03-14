// - OpenRouter API -- &#1576;&#1583;&#1610;&#1604; Gemini &#1605;&#1580;&#1575;&#1606;&#1610; -
// &#1575;&#1604;&#1605;&#1608;&#1583;&#1610;&#1604;: google/gemini-2.0-flash-exp:free
// &#1605;&#1580;&#1575;&#1606;&#1610; 100% &#1593;&#1604;&#1609; openrouter.ai

const MODEL = 'openrouter/free'
const URL   = 'https://openrouter.ai/api/v1/chat/completions'

function getKey() {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!key) throw new Error('VITE_OPENROUTER_API_KEY &#1594;&#1610;&#1585; &#1605;&#1608;&#1580;&#1608;&#1583; &#1601;&#1610; .env')
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
  if (!text) throw new Error('&#1604;&#1605; &#1610;&#1585;&#1583; &#1575;&#1604;&#1600; AI')
  return text
}

function parseJSON(raw) {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const start = clean.indexOf('{')
  const end   = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON in response')
  return JSON.parse(clean.slice(start, end + 1))
}

// - &#1578;&#1593;&#1585;&#1601; &#1593;&#1604;&#1609; &#1575;&#1604;&#1583;&#1608;&#1575;&#1569; &#1605;&#1606; &#1589;&#1608;&#1585;&#1577; -
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
    "suggested_times": ["&#1589;&#1576;&#1581;"],
    "with_food": true,
    "notes": "&#1587;&#1576;&#1576; &#1575;&#1604;&#1578;&#1608;&#1602;&#1610;&#1578;"
  },
  "confidence": 0.9
}
suggested_times values: &#1589;&#1576;&#1581; / &#1592;&#1607;&#1585; / &#1605;&#1587;&#1575;&#1569; / &#1604;&#1610;&#1604; only.
If unclear set confidence 0.2.`
      },
      {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${imageBase64}` }
      }
    ]
  }], 600)

  try { return parseJSON(text) }
  catch { throw new Error('&#1578;&#1593;&#1584;&#1585; &#1602;&#1585;&#1575;&#1569;&#1577; &#1575;&#1604;&#1589;&#1608;&#1585;&#1577; -- &#1578;&#1571;&#1603;&#1583; &#1573;&#1606; &#1575;&#1604;&#1589;&#1608;&#1585;&#1577; &#1608;&#1575;&#1590;&#1581;&#1577;') }
}

// - &#1575;&#1602;&#1578;&#1585;&#1575;&#1581; &#1605;&#1608;&#1575;&#1593;&#1610;&#1583; &#1575;&#1604;&#1583;&#1608;&#1575;&#1569; -
export async function suggestDrugSchedule(genericName, tradeName, dose) {
  const text = await callAI([{
    role: 'user',
    content: `Clinical pharmacist. Medication: ${genericName} (${tradeName || ''}) ${dose || ''}
Respond ONLY with this JSON, no other text:
{
  "suggested_times": ["&#1589;&#1576;&#1581;"],
  "with_food": true,
  "reasoning": "&#1587;&#1576;&#1576; &#1602;&#1589;&#1610;&#1585; &#1576;&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;",
  "warning": null
}
suggested_times: &#1589;&#1576;&#1581;/&#1592;&#1607;&#1585;/&#1605;&#1587;&#1575;&#1569;/&#1604;&#1610;&#1604; only. QD=["&#1589;&#1576;&#1581;"] BID=["&#1589;&#1576;&#1581;","&#1604;&#1610;&#1604;"] TID=["&#1589;&#1576;&#1581;","&#1592;&#1607;&#1585;","&#1604;&#1610;&#1604;"]`
  }], 250)

  try { return parseJSON(text) }
  catch { return { suggested_times: ['&#1589;&#1576;&#1581;'], with_food: true, reasoning: '&#1580;&#1585;&#1593;&#1577; &#1610;&#1608;&#1605;&#1610;&#1577; &#1589;&#1576;&#1575;&#1581;&#1610;&#1577;', warning: null } }
}

// - &#1578;&#1581;&#1604;&#1610;&#1604; &#1589;&#1608;&#1585;&#1577; &#1578;&#1581;&#1604;&#1610;&#1604;/&#1571;&#1588;&#1593;&#1577; -
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
  "summary": "&#1605;&#1604;&#1582;&#1589; &#1576;&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;",
  "is_abnormal": false,
  "recommendations": "&#1578;&#1608;&#1589;&#1610;&#1577; &#1571;&#1608; null"
}`
      },
      {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${imageBase64}` }
      }
    ]
  }], 400)

  try { return parseJSON(text) }
  catch { return { type: 'lab', findings: [], summary: '&#1578;&#1593;&#1584;&#1585; &#1575;&#1604;&#1578;&#1581;&#1604;&#1610;&#1604;', is_abnormal: false, recommendations: null } }
}

// - &#1578;&#1581;&#1608;&#1610;&#1604; &#1605;&#1604;&#1601; &#1604;&#1600; base64 -
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('&#1601;&#1588;&#1604; &#1602;&#1585;&#1575;&#1569;&#1577; &#1575;&#1604;&#1605;&#1604;&#1601;'))
    reader.readAsDataURL(file)
  })
}

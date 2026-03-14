import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useLabResults() {
const { user } = useAuth()
const [labs,    setLabs]    = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => { if (user) fetchLabs() }, [user])

async function fetchLabs() {
const { data } = await supabase
.from('lab_results')
.select('*')
.eq('user_id', user.id)
.order('test_date', { ascending: false })
setLabs(data || [])
setLoading(false)
}

async function addLabResult(labData, file = null) {
let fileUrl = null

```
if (file) {
  const fileName = `${user.id}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('lab-files').upload(fileName, file)
  if (!uploadError) {
    const { data: { publicUrl } } = supabase.storage
      .from('lab-files').getPublicUrl(fileName)
    fileUrl = publicUrl
  }
}

// بنحدد الـ columns اللي هنبعتها بالظبط
const insertData = {
  user_id:      user.id,
  test_name:    labData.test_name,
  test_date:    labData.test_date,
  result_value: labData.result_value || null,
  unit:         labData.unit         || null,
  normal_range: labData.normal_range || null,
  is_abnormal:  labData.is_abnormal  || false,
  file_url:     fileUrl,
}

// نضيف notes و type لو الـ columns موجودة
if (labData.notes !== undefined) insertData.notes = labData.notes
if (labData.type  !== undefined) insertData.type  = labData.type

const { data, error } = await supabase
  .from('lab_results')
  .insert(insertData)
  .select()
  .single()

if (error) throw error
setLabs(prev => [data, ...prev])
return data
```

}

async function deleteLabResult(id) {
await supabase.from('lab_results').delete().eq('id', id)
setLabs(prev => prev.filter(l => l.id !== id))
}

return { labs, loading, addLabResult, deleteLabResult, refetch: fetchLabs }
}

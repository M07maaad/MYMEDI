import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useLabResults() {
  const { user } = useAuth()
  const [labs, setLabs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchLabs()
  }, [user])

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

    // Upload file to Supabase Storage if provided
    if (file) {
      const fileName = `${user.id}/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lab-files')
        .upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('lab-files')
        .getPublicUrl(fileName)
      fileUrl = publicUrl
    }

    const { data, error } = await supabase
      .from('lab_results')
      .insert({ ...labData, user_id: user.id, file_url: fileUrl })
      .select()
      .single()

    if (error) throw error
    setLabs(prev => [data, ...prev])
    return data
  }

  async function deleteLabResult(id) {
    await supabase.from('lab_results').delete().eq('id', id)
    setLabs(prev => prev.filter(l => l.id !== id))
  }

  return { labs, loading, addLabResult, deleteLabResult, refetch: fetchLabs }
}

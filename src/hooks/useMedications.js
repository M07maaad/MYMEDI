import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useMedications() {
  const { user } = useAuth()
  const [medications, setMedications] = useState([])
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMedications()
    }
  }, [user])

  async function fetchMedications() {
    setLoading(true)
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMedications(data)
      await checkInteractions(data)
    }
    setLoading(false)
  }

  async function checkInteractions(meds) {
    if (meds.length < 2) return setInteractions([])

    const names = meds.map(m => m.generic_name).filter(Boolean)
    const found = []

    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        // بنستخدم الـ function اللي عملناها في Supabase
        // بتبحث بـ ilike علشان تتعرف على الأسماء بغض النظر عن الحروف
        const { data } = await supabase
          .rpc('check_drug_interaction', {
            drug_a: names[i],
            drug_b: names[j]
          })
        if (data?.length > 0) found.push(...data)
      }
    }
    setInteractions(found)
  }

  async function addMedication(medData) {
    const { data, error } = await supabase
      .from('medications')
      .insert({ ...medData, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setMedications(prev => [data, ...prev])
    await checkInteractions([...medications, data])
    return data
  }

  async function deleteMedication(id) {
    await supabase.from('medications').update({ is_active: false }).eq('id', id)
    const updated = medications.filter(m => m.id !== id)
    setMedications(updated)
    await checkInteractions(updated)
  }

  async function logDose(medicationId, scheduledTime, wasTaken = true) {
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('dose_logs')
      .upsert({
        medication_id: medicationId,
        user_id: user.id,
        scheduled_time: scheduledTime,
        was_taken: wasTaken,
        taken_at: wasTaken ? new Date().toISOString() : null,
        date: today,
      }, { onConflict: 'medication_id,scheduled_time,date' })
    if (error) throw error
    await fetchDoseLogsToday()
  }

  async function fetchDoseLogsToday() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('dose_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
    return data || []
  }

  async function updateStock(medicationId, newStock) {
    await supabase
      .from('medications')
      .update({ stock_count: newStock })
      .eq('id', medicationId)
    setMedications(prev =>
      prev.map(m => m.id === medicationId ? { ...m, stock_count: newStock } : m)
    )
  }

  return {
    medications,
    interactions,
    loading,
    addMedication,
    deleteMedication,
    logDose,
    fetchDoseLogsToday,
    updateStock,
    refetch: fetchMedications,
  }
}

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Global context - fetch once, use everywhere
const MedicationsContext = createContext(null)

export function MedicationsProvider({ children }) {
  const { user } = useAuth()
  const [medications,  setMedications]  = useState([])
  const [interactions, setInteractions] = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (user) fetchMedications()
    else { setMedications([]); setInteractions([]); setLoading(false) }
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
    const allNames = meds.flatMap(m => [m.generic_name || '', m.trade_name || '']).filter(Boolean)
    const { data } = await supabase.rpc('check_interactions_bulk', { drug_names: allNames })
    setInteractions(data || [])
  }

  async function addMedication(medData) {
    const { data, error } = await supabase
      .from('medications')
      .insert({ ...medData, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    const updated = [data, ...medications]
    setMedications(updated)
    await checkInteractions(updated)
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
        medication_id:  medicationId,
        user_id:        user.id,
        scheduled_time: scheduledTime,
        was_taken:      wasTaken,
        taken_at:       wasTaken ? new Date().toISOString() : null,
        date:           today,
      }, { onConflict: 'medication_id,scheduled_time,date' })
    if (error) throw error
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
    await supabase.from('medications').update({ stock_count: newStock }).eq('id', medicationId)
    setMedications(prev => prev.map(m => m.id === medicationId ? { ...m, stock_count: newStock } : m))
  }

  return (
    <MedicationsContext.Provider value={{
      medications, interactions, loading,
      addMedication, deleteMedication,
      logDose, fetchDoseLogsToday, updateStock,
      refetch: fetchMedications,
    }}>
      {children}
    </MedicationsContext.Provider>
  )
}

export const useMedications = () => useContext(MedicationsContext)

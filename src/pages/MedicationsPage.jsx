import { useNavigate } from ‘react-router-dom’
import { useMedications } from ‘../hooks/useMedications’
import { Card, Badge, EmptyState, LoadingSpinner, PageHeader } from ‘../components/UI’

export function MedicationsPage() {
const navigate = useNavigate()
const { medications, interactions, deleteMedication, loading } = useMedications()

if (loading) return <div style={pageStyle}><LoadingSpinner /></div>

return (
<div style={pageStyle}>
<PageHeader title=“أدويتي 💊” subtitle={`${medications.length} دواء نشط`}
action={<button onClick={() => navigate(’/medications/add’)} style={addBtnStyle}>+ إضافة</button>} />

```
  {medications.length === 0 ? (
    <EmptyState icon="💊" title="لا يوجد أدوية" subtitle="ابدأ بإضافة أدويتك الآن"
      action={<button onClick={() => navigate('/medications/add')} style={addBtnStyle}>إضافة دواء</button>} />
  ) : medications.map(med => {
    const hasInteraction = interactions.some(i =>
      i.drug1_name === med.generic_name || i.drug2_name === med.generic_name
    )
    return (
      <Card key={med.id} glow={med.color} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${med.color}25`, border: `2px solid ${med.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💊</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ color: '#F0F4FF', fontWeight: 800, fontSize: 16 }}>{med.trade_name || med.generic_name}</div>
                <div style={{ color: '#6B7A99', fontSize: 12 }}>
                  {med.generic_name}{med.dose && med.dose !== '-' ? ` — ${med.dose}` : ''}
                  {med.dosage_form && med.dosage_form !== 'tablet' && (
                    <span style={{ marginRight: 6, background: 'rgba(56,189,248,0.1)', color: '#38BDF8', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{med.dosage_form}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {hasInteraction && <Badge label="⚠️ تفاعل" color="#FF6B6B" />}
                {/* زرار الحذف */}
                <button
                  onClick={() => {
                    if (window.confirm(`حذف ${med.trade_name || med.generic_name}؟`)) {
                      deleteMedication(med.id)
                    }
                  }}
                  style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 8, padding: '5px 10px', color: '#FF6B6B', fontSize: 12, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
                >
                  حذف
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {med.dose_times.map(t => <Badge key={t} label={t} color={med.color} />)}
              {med.stock_count > 0 && (
                <span style={{ marginRight: 'auto', color: med.stock_count <= 7 ? '#FBBF24' : '#6B7A99', fontSize: 12 }}>
                  📦 {med.stock_count} متبقية
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  })}
</div>
```

)
}

const pageStyle   = { padding: ‘24px 20px 100px’, direction: ‘rtl’, fontFamily: ‘Cairo, sans-serif’, minHeight: ‘100vh’, background: ‘#070B14’ }
const addBtnStyle = { background: ‘#10D9A0’, border: ‘none’, borderRadius: 12, padding: ‘10px 18px’, color: ‘#000’, fontWeight: 800, fontSize: 14, cursor: ‘pointer’, fontFamily: ‘Cairo, sans-serif’ }

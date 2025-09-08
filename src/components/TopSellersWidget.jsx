import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#8884d8','#82ca9d','#ffc658','#ff7f50','#00bcd4','#a1887f','#8bc34a']

export default function TopSellersWidget() {
  const [items, setItems] = useState([])
  const [err, setErr] = useState(null)

  useEffect(()=>{
    apiGet('/top-sellers')
      .then(d=> setItems(d.items || []))
      .catch(e=> setErr(e.message))
  },[])

  if (err) return <div className="text-red-600">Errore: {err}</div>
  if (!items.length) return <p className="text-sm text-gray-500">Nessun dato top-sellers per il mese.</p>

  return (
    <div style={{width:'100%', height:260}}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={items} dataKey="value" nameKey="label" outerRadius={100} label>
            {items.map((_, i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
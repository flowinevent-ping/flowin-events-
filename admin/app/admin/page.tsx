'use client'
import { useEffect } from 'react'

export default function AdminPage() {
  useEffect(() => {
    // Redirect vers le HTML statique du dashboard SA
    window.location.href = '/static/dashboard.html'
  }, [])
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:12}}>⚡</div>
        <div style={{fontWeight:700,color:'#1a1a2e'}}>Chargement Flowin...</div>
      </div>
    </div>
  )
}

'use client'
import { useEffect } from 'react'

export default function LandingPage() {
  useEffect(() => { window.location.href = '/landing/index.html' }, [])
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0A2A2A',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center',color:'#fff'}}>
        <div style={{fontSize:40,marginBottom:12}}>✨</div>
        <div style={{fontWeight:700}}>Flowin</div>
      </div>
    </div>
  )
}

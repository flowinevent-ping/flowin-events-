'use client'
export default function Error({reset}:{reset:()=>void}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0D1B2A',color:'#fff',fontFamily:'sans-serif',textAlign:'center',padding:24}}>
      <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:8}}>Une erreur s&apos;est produite</div>
      <button onClick={reset} style={{background:'#3B5CC4',color:'#fff',border:'none',borderRadius:12,padding:'12px 24px',fontWeight:700,fontSize:14,cursor:'pointer',marginTop:12}}>
        Réessayer
      </button>
    </div>
  )
}

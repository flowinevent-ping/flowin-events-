export default function NotFound() {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0D1B2A',color:'#fff',fontFamily:'sans-serif',textAlign:'center',padding:24}}>
      <div style={{fontSize:64,marginBottom:16}}>🌸</div>
      <div style={{fontSize:28,fontWeight:800,marginBottom:8}}>404</div>
      <div style={{fontSize:16,color:'rgba(255,255,255,.5)',marginBottom:24}}>Page introuvable</div>
      <a href="/" style={{background:'#00B4A0',color:'#fff',padding:'12px 24px',borderRadius:12,textDecoration:'none',fontWeight:700,fontSize:14}}>
        Retour à l&apos;accueil
      </a>
    </div>
  )
}

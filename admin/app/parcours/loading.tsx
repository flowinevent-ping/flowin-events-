export default function Loading() {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)'}}>
      <div style={{fontSize:48,marginBottom:16,animation:'pulse 1s infinite'}}>🎮</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:'#D4537E'}}>Chargement...</div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

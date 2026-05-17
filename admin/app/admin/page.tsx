export default function AdminPage() {
  return (
    <html lang="fr" style={{margin:0,padding:0,height:'100%'}}>
      <body style={{margin:0,padding:0,height:'100%'}}>
        <iframe
          src="/static/dashboard.html"
          style={{
            width:'100vw',
            height:'100vh',
            border:'none',
            display:'block'
          }}
          title="Flowin Dashboard SA"
        />
      </body>
    </html>
  )
}

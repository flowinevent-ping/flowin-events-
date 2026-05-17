import { redirect } from 'next/navigation'

// Redirect vers le dashboard SA HTML statique
export default function AdminPage() {
  redirect('/static/dashboard.html')
}

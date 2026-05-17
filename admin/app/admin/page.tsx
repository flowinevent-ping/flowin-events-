import { redirect } from 'next/navigation'
// Le dashboard SA est servi en HTML statique via /static/dashboard.html
export default function AdminPage() {
  redirect('/static/dashboard.html')
}

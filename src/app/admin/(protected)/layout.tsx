import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import { isAdminEmail } from '@/lib/admin-auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  if (!isAdminEmail(user.email)) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar userEmail={user.email ?? ''} />

      {/* Main content — pt-12 on mobile for fixed top bar, ml-60 on desktop */}
      <main className="flex-1 lg:ml-60 min-w-0 pt-28 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}

import { DashboardNav } from '@/components/layout/dashboard-nav'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav />
      <main className="lg:pl-64">
        <div className="p-6">{children}</div>
      </main>
      <Toaster />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { getSessionFromCookies } from '@/lib/auth'
import AppShell from '@/components/layout/AppShell'

export default async function EvolucaoListaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies()
  if (!session) redirect('/login')
  return <AppShell>{children}</AppShell>
}

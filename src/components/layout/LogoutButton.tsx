'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
    toast.success('Sessão encerrada')
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-sm font-medium">
      Sair
    </Button>
  )
}

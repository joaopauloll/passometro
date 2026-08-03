'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  pacienteId: string
  statusAtual: string
}

const opcoes = [
  { value: 'INTERNADO', label: 'Internado' },
  { value: 'ALTA_ORTOPEDIA', label: 'Alta Ortopedia' },
  { value: 'ALTA_HOSPITALAR', label: 'Alta Hospitalar' },
]

export default function AlterarStatusButton({ pacienteId, statusAtual }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function mudarStatus(novoStatus: string | null) {
    if (!novoStatus || novoStatus === statusAtual) return
    const res = await fetch(`/api/pacientes/${pacienteId}?status=${novoStatus}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Status atualizado')
      router.refresh()
    }
    setOpen(false)
  }

  return (
    <Select onValueChange={mudarStatus} defaultValue={statusAtual}>
      <SelectTrigger className="w-auto text-sm border-gray-300">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function RelatorioCopiarButton({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    toast.success('Relatório copiado!')
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Button onClick={copiar} className="cursor-pointer bg-blue-600 hover:bg-blue-700">
      {copiado ? '✓ Copiado!' : '📋 Copiar texto'}
    </Button>
  )
}

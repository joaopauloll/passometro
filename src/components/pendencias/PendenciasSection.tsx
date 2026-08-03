'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { corPendencia } from '@/lib/evolucao'

type Pendencia = {
  id: string
  descricao: string
  tipo: string
  concluida: boolean
  createdAt: string
}

type Props = {
  pendencias: Pendencia[]
  pacienteId: string
}

export default function PendenciasSection({ pendencias: inicial, pacienteId }: Props) {
  const [pendencias, setPendencias] = useState(inicial)
  const [novaDescricao, setNovaDescricao] = useState('')
  const [adicionando, setAdicionando] = useState(false)

  const abertas = pendencias.filter((p) => !p.concluida)
  const concluidas = pendencias.filter((p) => p.concluida)

  async function togglePendencia(pendenciaId: string, concluida: boolean) {
    const res = await fetch(`/api/pacientes/${pacienteId}/pendencias`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pendenciaId, concluida }),
    })
    if (res.ok) {
      const atualizada = await res.json()
      setPendencias((prev) => prev.map((p) => (p.id === pendenciaId ? atualizada : p)))
      toast.success(concluida ? 'Pendência concluída!' : 'Pendência reaberta')
    }
  }

  async function adicionarPendencia() {
    if (!novaDescricao.trim()) return
    const res = await fetch(`/api/pacientes/${pacienteId}/pendencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao: novaDescricao, tipo: 'OUTRO' }),
    })
    if (res.ok) {
      const nova = await res.json()
      setPendencias((prev) => [nova, ...prev])
      setNovaDescricao('')
      setAdicionando(false)
      toast.success('Pendência adicionada')
    }
  }

  return (
    <Card className={`border ${abertas.length > 0 ? 'border-amber-200' : 'border-gray-200'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">
            Pendências {abertas.length > 0 && (
              <span className="ml-1 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {abertas.length}
              </span>
            )}
          </CardTitle>
          <button
            onClick={() => setAdicionando(!adicionando)}
            className="text-xs text-blue-600 hover:underline"
          >
            + Adicionar
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Adicionar nova */}
        {adicionando && (
          <div className="flex gap-2 mb-3">
            <Input
              value={novaDescricao}
              onChange={(e) => setNovaDescricao(e.target.value)}
              placeholder="Descrever pendência…"
              className="flex-1 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && adicionarPendencia()}
              autoFocus
            />
            <Button size="sm" onClick={adicionarPendencia}>OK</Button>
          </div>
        )}

        {/* Abertas */}
        {abertas.length === 0 && concluidas.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">Sem pendências</p>
        )}

        {abertas.map((p) => (
          <div key={p.id} className="flex items-start gap-2 group">
            <button
              onClick={() => togglePendencia(p.id, true)}
              className="mt-0.5 w-4 h-4 border-2 border-amber-400 rounded flex-shrink-0 hover:bg-amber-100 transition-colors"
              title="Marcar como concluída"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-800 leading-tight">{p.descricao}</p>
              <span className={`text-xs px-1 py-0.5 rounded border ${corPendencia(p.tipo)}`}>
                {p.tipo}
              </span>
            </div>
          </div>
        ))}

        {/* Concluídas (colapsadas) */}
        {concluidas.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
              {concluidas.length} concluída{concluidas.length > 1 ? 's' : ''}
            </summary>
            <div className="mt-2 space-y-1.5">
              {concluidas.map((p) => (
                <div key={p.id} className="flex items-start gap-2 opacity-50">
                  <button
                    onClick={() => togglePendencia(p.id, false)}
                    className="mt-0.5 w-4 h-4 border-2 border-green-400 rounded flex-shrink-0 bg-green-100"
                    title="Reabrir pendência"
                  >
                    <span className="text-green-600 text-xs">✓</span>
                  </button>
                  <p className="text-xs text-gray-600 line-through leading-tight">{p.descricao}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}

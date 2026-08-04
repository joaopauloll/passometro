'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

type Evolucao = {
  id: string
  data: string
  textoGerado: string | null
  altaHoje: boolean | null
  altaPrevista: boolean | null
}

type Props = {
  evolucoes: Evolucao[]
  pacienteId: string
}

export default function EvolucoesList({ evolucoes, pacienteId }: Props) {
  const [expandido, setExpandido] = useState<string | null>(null)

  if (evolucoes.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">
            Histórico de Evoluções ({evolucoes.length})
          </CardTitle>
          <Link
            href={`/pacientes/${pacienteId}/evolucao/nova`}
            className="inline-flex items-center gap-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md transition-colors"
          >
            + Nova evolução
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {evolucoes.map((ev, idx) => (
          <div key={ev.id} className="border border-gray-100 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandido(expandido === ev.id ? null : ev.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">
                  {format(new Date(ev.data), "dd/MM/yyyy")}
                </span>
                {idx === 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Última</span>
                )}
                {ev.altaHoje && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Alta</span>
                )}
              </div>
              <span className="text-gray-400 text-xs">{expandido === ev.id ? '▲' : '▼'}</span>
            </button>

            {expandido === ev.id && ev.textoGerado && (
              <div className="px-3 pb-3 border-t border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed mt-2">{ev.textoGerado}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(ev.textoGerado!) }}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md transition-colors"
                  >
                    📋 Copiar texto
                  </button>
                  <Link
                    href={`/pacientes/${pacienteId}/evolucao/${ev.id}/editar`}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 hover:bg-amber-200 text-amber-700 px-2.5 py-1 rounded-md transition-colors"
                  >
                    ✏️ Editar
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

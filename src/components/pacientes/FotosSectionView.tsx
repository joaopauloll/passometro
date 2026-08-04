'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Foto = {
  id: string
  tipo: string
  url: string
  dataFoto: string | null
  descricao: string | null
}

type Props = {
  pacienteId: string
  fotos: Foto[]
  onFotaDeletada?: (id: string) => void
}

export default function FotosSectionView({ pacienteId, fotos: iniciais, onFotaDeletada }: Props) {
  const [fotos, setFotos] = useState(iniciais)
  const [expandida, setExpandida] = useState<string | null>(null)

  async function deletar(id: string) {
    if (!confirm('Remover esta imagem?')) return
    await fetch(`/api/pacientes/${pacienteId}/fotos?fotoId=${id}`, { method: 'DELETE' })
    setFotos(prev => prev.filter(f => f.id !== id))
    onFotaDeletada?.(id)
  }

  const radios = fotos.filter(f => f.tipo === 'RADIOGRAFIA')
  const lesoes = fotos.filter(f => f.tipo === 'LESAO_PELE')

  if (fotos.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">
          Imagens ({fotos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {radios.length > 0 && (
          <GrupoFotos titulo="🩻 Radiografias" fotos={radios} onDelete={deletar} onExpand={setExpandida} />
        )}
        {lesoes.length > 0 && (
          <GrupoFotos titulo="🩹 Lesões de pele" fotos={lesoes} onDelete={deletar} onExpand={setExpandida} />
        )}
      </CardContent>

      {expandida && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandida(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img
              src={fotos.find(f => f.id === expandida)?.url || ''}
              alt="Imagem expandida"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setExpandida(null)}
              className="absolute top-2 right-2 bg-white text-slate-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

function GrupoFotos({ titulo, fotos, onDelete, onExpand }: {
  titulo: string
  fotos: Foto[]
  onDelete: (id: string) => void
  onExpand: (id: string) => void
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 mb-2">{titulo}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fotos.map(f => (
          <div key={f.id} className="relative group cursor-pointer">
            <img
              src={f.url}
              alt={f.descricao || titulo}
              onClick={() => onExpand(f.id)}
              className="w-full h-28 object-cover rounded-lg border border-slate-200 shadow-sm group-hover:opacity-90 transition-opacity"
            />
            {f.dataFoto && (
              <p className="text-[10px] text-slate-500 mt-1 text-center">
                {format(new Date(f.dataFoto), 'dd/MM/yyyy')}
              </p>
            )}
            {f.descricao && (
              <p className="text-[10px] text-slate-400 text-center truncate px-1">{f.descricao}</p>
            )}
            <button
              onClick={() => onDelete(f.id)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

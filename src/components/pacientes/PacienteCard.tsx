'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Paciente = {
  id: string
  nome: string
  leito: string
  registroHospitalar: string
  dataInternacao: string
  diagnostico: string
  cid: string | null
  cirurgioes: string
  tipoStatus: string
  status: string
  temInfeccao: boolean
  dataNascimento: string | null
  pendencias: { id: string; descricao: string; tipo: string; concluida: boolean }[]
  evolucoes: { id: string; altaHoje: boolean | null; altaPrevista: boolean | null }[]
  cirurgias: { id: string; dataCirurgia: string; nomeCirurgia: string }[]
}

type Props = {
  paciente: Paciente
  onStatusChange: () => void
}

export default function PacienteCard({ paciente, onStatusChange }: Props) {
  const pendenciasAbertas = paciente.pendencias.filter((p) => !p.concluida)
  const diasInternado = differenceInDays(new Date(), new Date(paciente.dataInternacao))
  const ultimaEvolucao = paciente.evolucoes[0]
  const altaHoje = ultimaEvolucao?.altaHoje === true
  const cirurgioes: string[] = (() => {
    try { return JSON.parse(paciente.cirurgioes) } catch { return [] }
  })()

  async function mudarStatus(novoStatus: string) {
    await fetch(`/api/pacientes/${paciente.id}?status=${novoStatus}`, { method: 'DELETE' })
    onStatusChange()
  }

  return (
    <Card className="hover:shadow-md transition-shadow border border-gray-200 bg-white">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/pacientes/${paciente.id}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block"
            >
              {paciente.nome}
            </Link>
            <p className="text-sm text-gray-500 mt-0.5">
              Leito <span className="font-medium text-gray-700">{paciente.leito}</span>
              {' · '}
              <span>{diasInternado}d internado</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
            {paciente.temInfeccao && (
              <Badge variant="destructive" className="text-xs">Infecção</Badge>
            )}
            {altaHoje && (
              <Badge className="text-xs bg-green-100 text-green-800 border-green-200">Alta hoje</Badge>
            )}
          </div>
        </div>

        {/* Diagnóstico */}
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {paciente.diagnostico}
          {paciente.cid && <span className="text-gray-400 ml-1">({paciente.cid})</span>}
        </p>

        {/* Status */}
        <div className="flex items-center gap-2 mb-3">
          <Badge
            variant="outline"
            className={`text-xs ${paciente.tipoStatus === 'POS_OPERATORIO' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
          >
            {paciente.tipoStatus === 'POS_OPERATORIO' ? 'Pós-Op' : 'Pré-Op'}
          </Badge>
          {cirurgioes.length > 0 && (
            <span className="text-xs text-gray-500 truncate">Dr. {cirurgioes[0]}</span>
          )}
        </div>

        {/* Pendências */}
        {pendenciasAbertas.length > 0 && (
          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs font-medium text-amber-800 mb-1">
              {pendenciasAbertas.length} pendência{pendenciasAbertas.length > 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-1">
              {pendenciasAbertas.slice(0, 3).map((p) => (
                <span key={p.id} className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  {p.tipo}
                </span>
              ))}
              {pendenciasAbertas.length > 3 && (
                <span className="text-xs text-amber-600">+{pendenciasAbertas.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {/* Ações rápidas */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Link
            href={`/pacientes/${paciente.id}`}
            className="text-xs text-blue-600 hover:underline"
          >
            Ver detalhes
          </Link>
          <div className="flex gap-1">
            {paciente.status === 'INTERNADO' && (
              <>
                <button
                  onClick={() => mudarStatus('ALTA_ORTOPEDIA')}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                  Alta Orto.
                </button>
                <button
                  onClick={() => mudarStatus('ALTA_HOSPITALAR')}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                  Alta Hosp.
                </button>
              </>
            )}
            {paciente.status === 'ALTA_ORTOPEDIA' && (
              <button
                onClick={() => mudarStatus('ALTA_HOSPITALAR')}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                Alta Hospitalar
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

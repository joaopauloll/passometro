'use client'

import Link from 'next/link'
import { differenceInDays } from 'date-fns'

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
  const altaHoje = paciente.evolucoes[0]?.altaHoje === true
  const altaPrevista = paciente.evolucoes[0]?.altaPrevista === true
  const cirurgioes: string[] = (() => {
    try { return JSON.parse(paciente.cirurgioes) } catch { return [] }
  })()

  const accentColor = paciente.temInfeccao
    ? 'border-l-red-500'
    : altaHoje
    ? 'border-l-green-500'
    : paciente.tipoStatus === 'POS_OPERATORIO'
    ? 'border-l-blue-500'
    : 'border-l-slate-300'

  async function mudarStatus(novoStatus: string) {
    await fetch(`/api/pacientes/${paciente.id}?status=${novoStatus}`, { method: 'DELETE' })
    onStatusChange()
  }

  return (
    <div className={`bg-white rounded-xl border-l-4 ${accentColor} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
      <div className="p-4">
        {/* Header: nome + leito */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <Link
              href={`/pacientes/${paciente.id}`}
              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors leading-tight block truncate"
            >
              {paciente.nome}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
              {paciente.leito}
            </span>
          </div>
        </div>

        {/* Diagnóstico */}
        <p className="text-[13px] text-slate-500 line-clamp-2 leading-snug mb-3">
          {paciente.diagnostico}
          {paciente.cid && <span className="text-slate-400 ml-1">· {paciente.cid}</span>}
        </p>

        {/* Tags de status */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            paciente.tipoStatus === 'POS_OPERATORIO'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {paciente.tipoStatus === 'POS_OPERATORIO' ? 'Pós-Op' : 'Pré-Op'}
          </span>
          {paciente.temInfeccao && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              ⚠ Infecção
            </span>
          )}
          {altaHoje && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Alta hoje
            </span>
          )}
          {!altaHoje && altaPrevista && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Alta prevista
            </span>
          )}
          <span className="text-[11px] text-slate-400 px-1 py-0.5">
            {diasInternado}d internado
          </span>
        </div>

        {/* Cirurgião */}
        {cirurgioes.length > 0 && (
          <p className="text-[12px] text-slate-500 mb-3 truncate">
            <span className="text-slate-400">Dr.</span> {cirurgioes[0]}
          </p>
        )}

        {/* Pendências */}
        {pendenciasAbertas.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-amber-700">
                {pendenciasAbertas.length} pendência{pendenciasAbertas.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {pendenciasAbertas.slice(0, 4).map((p) => (
                <span key={p.id} className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  {p.tipo}
                </span>
              ))}
              {pendenciasAbertas.length > 4 && (
                <span className="text-[10px] text-amber-500">+{pendenciasAbertas.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Rodapé: ações */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
          <Link
            href={`/pacientes/${paciente.id}`}
            className="inline-flex items-center gap-1 text-[12px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            Ver detalhes
            <span className="text-[10px] opacity-80">→</span>
          </Link>
          <div className="flex gap-1">
            {paciente.status === 'INTERNADO' && (
              <>
                <button
                  onClick={() => mudarStatus('ALTA_ORTOPEDIA')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
                >
                  Alta Orto.
                </button>
                <button
                  onClick={() => mudarStatus('ALTA_HOSPITALAR')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
                >
                  Alta Hosp.
                </button>
              </>
            )}
            {paciente.status === 'ALTA_ORTOPEDIA' && (
              <button
                onClick={() => mudarStatus('ALTA_HOSPITALAR')}
                className="text-[11px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
              >
                Alta Hospitalar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


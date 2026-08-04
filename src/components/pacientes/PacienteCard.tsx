'use client'

import { useState } from 'react'
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
  const [expandido, setExpandido] = useState(false)

  const pendenciasAbertas = paciente.pendencias.filter((p) => !p.concluida)
  const diasInternado = differenceInDays(new Date(), new Date(paciente.dataInternacao))
  const altaHoje = paciente.evolucoes[0]?.altaHoje === true
  const altaPrevista = paciente.evolucoes[0]?.altaPrevista === true
  const cirurgioes: string[] = (() => {
    try { return JSON.parse(paciente.cirurgioes) } catch { return [] }
  })()

  // const accentColor = paciente.temInfeccao
  //   ? 'border-l-red-500'
  //   : altaHoje
  //   ? 'border-l-green-500'
  //   : paciente.tipoStatus === 'POS_OPERATORIO'
  //   ? 'border-l-blue-500'
  //   : 'border-l-slate-200'
  const accentColor = 'border-l-slate-200'

  async function mudarStatus(novoStatus: string) {
    await fetch(`/api/pacientes/${paciente.id}?status=${novoStatus}`, { method: 'DELETE' })
    onStatusChange()
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${accentColor} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>
      {/* ── Header row (always visible, click to toggle) ── */}
      <button
        type="button"
        onClick={() => setExpandido(!expandido)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/60 transition-colors"
      >
        {/* Leito badge */}
        <span className="flex-shrink-0 text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md min-w-[40px] text-center">
          {paciente.leito}
        </span>

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm leading-tight">{paciente.nome}</span>
            {/* Status badges */}
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              paciente.tipoStatus === 'POS_OPERATORIO' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {paciente.tipoStatus === 'POS_OPERATORIO' ? 'Pós-Op' : 'Pré-Op'}
            </span>
            {paciente.temInfeccao && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 flex-shrink-0">⚠ Infecção</span>
            )}
            {altaHoje && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">Alta hoje</span>
            )}
            {!altaHoje && altaPrevista && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex-shrink-0">Alta prevista</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
            {cirurgioes.length > 0 && <span>Dr. {cirurgioes[0]}</span>}
            {cirurgioes.length > 0 && <span>·</span>}
            <span>{diasInternado}d internado</span>
            {pendenciasAbertas.length > 0 && (
              <>
                <span>·</span>
                <span className="text-amber-600 font-medium">{pendenciasAbertas.length} pendência{pendenciasAbertas.length > 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>

        {/* Expand arrow */}
        <span className="text-slate-400 text-xs flex-shrink-0 transition-transform duration-200" style={{ transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>

      {/* ── Expanded section ── */}
      {expandido && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {/* Diagnóstico */}
          <p className="text-sm text-slate-700 leading-snug">
            {paciente.diagnostico}
            {paciente.cid && <span className="text-slate-400 ml-1 text-xs">· {paciente.cid}</span>}
          </p>

          {/* Cirurgias recentes */}
          {paciente.cirurgias.length > 0 && (
            <p className="text-xs text-slate-500">
              🔪 {paciente.cirurgias[0].nomeCirurgia}
              <span className="text-slate-400 ml-1">({new Date(paciente.cirurgias[0].dataCirurgia).toLocaleDateString('pt-BR')})</span>
            </p>
          )}

          {/* Pendências */}
          {pendenciasAbertas.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <div className="flex flex-wrap gap-1">
                {pendenciasAbertas.slice(0, 5).map((p) => (
                  <span key={p.id} className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                    {p.tipo}
                  </span>
                ))}
                {pendenciasAbertas.length > 5 && (
                  <span className="text-[10px] text-amber-500">+{pendenciasAbertas.length - 5}</span>
                )}
              </div>
              <p className="text-[10px] text-amber-600 mt-1 font-medium">{pendenciasAbertas.length} pendência{pendenciasAbertas.length > 1 ? 's' : ''} em aberto</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <Link
              href={`/pacientes/${paciente.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              onClick={e => e.stopPropagation()}
            >
              Ver prontuário →
            </Link>
            <div className="flex gap-1">
              {paciente.status === 'INTERNADO' && (
                <>
                  <button onClick={e => { e.stopPropagation(); mudarStatus('ALTA_ORTOPEDIA') }}
                    className="text-[11px] text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors">
                    Alta Orto.
                  </button>
                  <button onClick={e => { e.stopPropagation(); mudarStatus('ALTA_HOSPITALAR') }}
                    className="text-[11px] text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors">
                    Alta Hosp.
                  </button>
                </>
              )}
              {paciente.status === 'ALTA_ORTOPEDIA' && (
                <button onClick={e => { e.stopPropagation(); mudarStatus('ALTA_HOSPITALAR') }}
                  className="text-[11px] text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors">
                  Alta Hospitalar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

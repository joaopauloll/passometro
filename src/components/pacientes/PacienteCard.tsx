'use client'

import { useState } from 'react'
import Link from 'next/link'
import { differenceInDays } from 'date-fns'
import {
  ChevronDown,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Stethoscope,
  Scissors,
  Clock,
  LogOut,
  UserCheck,
} from 'lucide-react'

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
    try {
      return JSON.parse(paciente.cirurgioes)
    } catch {
      return []
    }
  })()

  async function mudarStatus(novoStatus: string) {
    await fetch(`/api/pacientes/${paciente.id}?status=${novoStatus}`, { method: 'DELETE' })
    onStatusChange()
  }

  // Função intermediária para confirmar a ação antes de mudar o status
  const handleMudarStatus = (novoStatus: string, nomeDaAlta: string) => {
    if (window.confirm(`Tem certeza que deseja confirmar a ${nomeDaAlta} para o paciente ${paciente.nome}?`)) {
      mudarStatus(novoStatus)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-blue-100/60 shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-5 text-slate-800">
      {/* ── Bloco Principal (Visível) ── */}
      <div className="flex items-start gap-3 sm:gap-4">
        {/* 1. Leito em destaque à esquerda */}
        <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex flex-col items-center justify-center shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-blue-100">
            Leito
          </span>
          <span className="text-lg sm:text-xl font-bold leading-tight">{paciente.leito}</span>
        </div>

        {/* 2. Informações e Ações agrupadas */}
        <div className="flex-1 flex justify-between gap-3 min-w-0">
          
          {/* Dados do Paciente (Meio) */}
          <div className="space-y-2 min-w-0 py-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">
                {paciente.nome}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                RH: {paciente.registroHospitalar}
              </span>
            </div>

            {/* Micro Chips de Status */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  paciente.tipoStatus === 'POS_OPERATORIO'
                    ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                    : 'bg-slate-50 text-slate-600 border-slate-200/60'
                }`}
              >
                {paciente.tipoStatus === 'POS_OPERATORIO' ? 'Pós-Op' : 'Pré-Op'}
              </span>

              {paciente.temInfeccao && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                  <AlertTriangle className="w-3 h-3 text-rose-500" /> Infecção
                </span>
              )}

              {altaHoje && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Alta Hoje
                </span>
              )}

              {!altaHoje && altaPrevista && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/60">
                  <Calendar className="w-3 h-3 text-sky-500" /> Alta Prevista
                </span>
              )}
            </div>

            {/* Subtítulo informativo */}
            <div className="flex items-center gap-3 text-[11px] sm:text-xs text-slate-500 flex-wrap pt-0.5">
              {cirurgioes.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-500" /> Dr. {cirurgioes[0]}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> {diasInternado}d internado
              </span>
              {pendenciasAbertas.length > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5" /> {pendenciasAbertas.length} pendência
                  {pendenciasAbertas.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* 3. Ações (Lado Direito) */}
          <div className="flex flex-col items-end justify-between flex-shrink-0 py-0.5">
            <div className="flex items-center gap-1.5">
              {paciente.status === 'INTERNADO' && (
                <>
                  <button
                    type="button"
                    title="Dar Alta Ortopédica"
                    onClick={() => handleMudarStatus('ALTA_ORTOPEDIA', 'Alta Ortopédica')}
                    className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl transition-colors"
                  >
                    <UserCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </button>
                  <button
                    type="button"
                    title="Dar Alta Hospitalar"
                    onClick={() => handleMudarStatus('ALTA_HOSPITALAR', 'Alta Hospitalar')}
                    className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </button>
                </>
              )}

              {paciente.status === 'ALTA_ORTOPEDIA' && (
                <button
                  type="button"
                  title="Dar Alta Hospitalar"
                  onClick={() => handleMudarStatus('ALTA_HOSPITALAR', 'Alta Hospitalar')}
                  className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
              )}

              <Link
                href={`/pacientes/${paciente.id}`}
                title="Ver Prontuário"
                className="p-1.5 sm:p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors active:scale-95 ml-1"
              >
                <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </Link>
            </div>

            {/* Botão de Expandir */}
            <button
              type="button"
              onClick={() => setExpandido(!expandido)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-blue-600 transition-colors mt-2"
            >
              <span className="hidden sm:inline">{expandido ? 'Ocultar' : 'Detalhes'}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandido ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Detalhes Expansíveis (Animação nativa Tailwind) ── */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expandido ? 'grid-rows-[1fr] opacity-100 pt-4 mt-2 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden space-y-4">
          {/* Resumo em 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Coluna 1: Diagnóstico */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
              <p className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                Diagnóstico
              </p>
              <p className="text-slate-800 font-medium leading-relaxed">
                {paciente.diagnostico}
                {paciente.cid && (
                  <span className="text-slate-400 font-normal ml-1">({paciente.cid})</span>
                )}
              </p>
            </div>

            {/* Coluna 2: Cirurgia Recente */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
              <p className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                Cirurgia Recente
              </p>
              {paciente.cirurgias.length > 0 ? (
                <p className="text-slate-800 font-medium leading-relaxed inline-flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-slate-500" />
                  {paciente.cirurgias[0].nomeCirurgia}
                  <span className="text-slate-400 font-normal">
                    ({new Date(paciente.cirurgias[0].dataCirurgia).toLocaleDateString('pt-BR')})
                  </span>
                </p>
              ) : (
                <p className="text-slate-400 italic">Nenhuma cirurgia registrada</p>
              )}
            </div>
          </div>

          {/* Bloco de Pendências (chips micro) */}
          {pendenciasAbertas.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 space-y-2">
              <p className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Pendências em Aberto ({pendenciasAbertas.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pendenciasAbertas.slice(0, 5).map((p) => (
                  <span
                    key={p.id}
                    className="text-[10px] font-medium bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/50"
                  >
                    {p.tipo}
                  </span>
                ))}
                {pendenciasAbertas.length > 5 && (
                  <span className="text-[10px] font-medium bg-amber-200/50 text-amber-800 px-2 py-0.5 rounded-md">
                    +{pendenciasAbertas.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
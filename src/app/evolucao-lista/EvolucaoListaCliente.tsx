'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getEspecialidadePorCirurgiao, ESPECIALIDADES } from '@/lib/cirurgioes'

type PacienteInfo = {
  id: string
  nome: string
  leito: string
  diagnostico: string
  cid: string | null
  cirurgioes: string
  subespecialidade: string | null
  status: string
  tipoStatus: string
  dataInternacao: string
}

type Evolucao = {
  id: string
  data: string
  textoGerado: string | null
  altaHoje: boolean | null
  altaPrevista: boolean | null
  estavel: boolean | null
  febre: boolean | null
  paciente: PacienteInfo
}

type Props = { evolucoes: Evolucao[] }

const TIPO_LABELS: Record<string, string> = {
  RISCO_CIRURGICO: 'Risco Cirúrgico',
  INFECTOLOGIA: 'Infectologia',
  ALTA: 'Alta',
  EXAME: 'Exame',
  CLINICA: 'Clínica',
  RX: 'RX',
  OUTRO: 'Outro',
}

type EvolucaoComPaciente = Evolucao & { especialidade: string; cirurgiao: string }

export default function EvolucaoListaCliente({ evolucoes }: Props) {
  const [busca, setBusca] = useState('')
  const [espSelecionada, setEspSelecionada] = useState<string>('Todas')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // Enriquecer cada evolucao com especialidade/cirurgiao
  const evolucoesEnriquecidas: EvolucaoComPaciente[] = useMemo(() => {
    return evolucoes.map(ev => {
      const cirurgioes: string[] = (() => {
        try { return JSON.parse(ev.paciente.cirurgioes) } catch { return [] }
      })()
      const cirurgiao = cirurgioes[0] || 'Sem cirurgião'
      const especialidade = ev.paciente.subespecialidade || getEspecialidadePorCirurgiao(cirurgiao)
      return { ...ev, especialidade, cirurgiao }
    })
  }, [evolucoes])

  // Filtrar
  const filtradas = useMemo(() => {
    const buscaLower = busca.toLowerCase()
    return evolucoesEnriquecidas.filter(ev => {
      if (espSelecionada !== 'Todas' && ev.especialidade !== espSelecionada) return false
      if (busca && !ev.paciente.nome.toLowerCase().includes(buscaLower) &&
          !ev.paciente.diagnostico.toLowerCase().includes(buscaLower) &&
          !ev.cirurgiao.toLowerCase().includes(buscaLower)) return false
      return true
    })
  }, [evolucoesEnriquecidas, busca, espSelecionada])

  // Agrupar: especialidade → cirurgião → pacienteId → evoluções[]
  const grupos = useMemo(() => {
    const map = new Map<string, Map<string, Map<string, { paciente: PacienteInfo; evs: EvolucaoComPaciente[] }>>>()
    for (const ev of filtradas) {
      if (!map.has(ev.especialidade)) map.set(ev.especialidade, new Map())
      const espMap = map.get(ev.especialidade)!
      if (!espMap.has(ev.cirurgiao)) espMap.set(ev.cirurgiao, new Map())
      const cirMap = espMap.get(ev.cirurgiao)!
      if (!cirMap.has(ev.paciente.id)) cirMap.set(ev.paciente.id, { paciente: ev.paciente, evs: [] })
      cirMap.get(ev.paciente.id)!.evs.push(ev)
    }
    return map
  }, [filtradas])

  const especialidades = ['Todas', ...Object.keys(ESPECIALIDADES)]

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciador de Evoluções</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtradas.length} evoluções · {grupos.size} especialidades</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar paciente, diagnóstico ou cirurgião..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap gap-1.5">
          {especialidades.map(esp => (
            <button
              key={esp}
              onClick={() => setEspSelecionada(esp)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                espSelecionada === esp
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {esp}
            </button>
          ))}
        </div>
      </div>

      {/* Grupos por especialidade */}
      {grupos.size === 0 ? (
        <div className="text-center py-16 text-slate-400">Nenhuma evolução encontrada.</div>
      ) : (
        <div className="space-y-8">
          {Array.from(grupos.entries()).map(([esp, cirMap]) => (
            <div key={esp}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-slate-800">{esp}</h2>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">{Array.from(cirMap.values()).reduce((acc, m) => acc + m.size, 0)} paciente(s)</span>
              </div>

              <div className="space-y-5">
                {Array.from(cirMap.entries()).map(([cir, pacMap]) => (
                  <div key={cir} className="pl-4 border-l-2 border-slate-200">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Dr. {cir}</p>
                    <div className="space-y-3">
                      {Array.from(pacMap.values()).map(({ paciente, evs }) => (
                        <div key={paciente.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                          {/* Cabeçalho do paciente */}
                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-900 text-sm">{paciente.nome}</span>
                                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Leito {paciente.leito}</span>
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                  paciente.tipoStatus === 'POS_OPERATORIO' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {paciente.tipoStatus === 'POS_OPERATORIO' ? 'Pós-Op' : 'Pré-Op'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{paciente.diagnostico}{paciente.cid ? ` · ${paciente.cid}` : ''}</p>
                            </div>
                            <Link
                              href={`/pacientes/${paciente.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                            >
                              Ver paciente
                            </Link>
                          </div>

                          {/* Timeline de evoluções */}
                          <div className="divide-y divide-slate-100">
                            {evs.map((ev, idx) => (
                              <div key={ev.id}>
                                <button
                                  onClick={() => toggle(ev.id)}
                                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                      ev.febre ? 'bg-red-400' : ev.estavel ? 'bg-green-400' : 'bg-blue-400'
                                    }`} />
                                    <span className="text-sm font-medium text-slate-700">
                                      {format(new Date(ev.data), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                    {idx === 0 && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Última</span>}
                                    {ev.altaHoje && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Alta</span>}
                                    {ev.febre && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Febre</span>}
                                  </div>
                                  <span className="text-slate-400 text-xs">{expandidos.has(ev.id) ? '▲' : '▼'}</span>
                                </button>

                                {expandidos.has(ev.id) && ev.textoGerado && (
                                  <div className="px-4 pb-3 border-t border-slate-100 bg-slate-50/50">
                                    <p className="text-sm text-slate-700 leading-relaxed mt-3 whitespace-pre-wrap font-mono text-xs">{ev.textoGerado}</p>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(ev.textoGerado!)}
                                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded-md transition-colors"
                                    >
                                      📋 Copiar texto
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PacienteCard from './PacienteCard'

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
  contadores: { internados: number; altaOrtopedia: number; altaHospitalar: number }
}

const STATUS_MAP: Record<string, string> = {
  INTERNADO: 'internado',
  ALTA_ORTOPEDIA: 'alta-ortopedia',
  ALTA_HOSPITALAR: 'alta-hospitalar',
}

export default function PacienteListaCliente({ contadores }: Props) {
  const [tabAtiva, setTabAtiva] = useState('INTERNADO')
  const [busca, setBusca] = useState('')
  const [filtroLeito, setFiltroLeito] = useState('')
  const [filtroCirurgiao, setFiltroCirurgiao] = useState('')
  const [filtroSubesp, setFiltroSubesp] = useState('')
  const [filtroTipoStatus, setFiltroTipoStatus] = useState('')
  const [filtroEspecial, setFiltroEspecial] = useState('todos')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const fetchPacientes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ status: tabAtiva, busca, leito: filtroLeito })
    if (filtroCirurgiao) params.set('cirurgiao', filtroCirurgiao)
    if (filtroSubesp) params.set('subespecialidade', filtroSubesp)
    if (filtroTipoStatus) params.set('tipoStatus', filtroTipoStatus)
    if (filtroEspecial === 'infectados') params.set('infeccao', 'true')
    if (filtroEspecial === 'alta-hoje') params.set('altaHoje', 'true')
    if (filtroEspecial === 'aguardando-risco') params.set('aguardandoRisco', 'true')
    if (filtroEspecial === 'aguardando-cirurgia') params.set('aguardandoCirurgia', 'true')
    try {
      const res = await fetch(`/api/pacientes?${params}`)
      const data = await res.json()
      setPacientes(Array.isArray(data) ? data : [])
    } catch {
      setPacientes([])
    } finally {
      setLoading(false)
    }
  }, [tabAtiva, busca, filtroLeito, filtroCirurgiao, filtroSubesp, filtroTipoStatus, filtroEspecial])

  useEffect(() => {
    fetchPacientes()
  }, [fetchPacientes])

  const statusLabel: Record<string, string> = {
    INTERNADO: `Internados (${contadores.internados})`,
    ALTA_ORTOPEDIA: `Alta Ortopedia (${contadores.altaOrtopedia})`,
    ALTA_HOSPITALAR: `Alta Hospitalar (${contadores.altaHospitalar})`,
  }

  const temFiltrosAtivos = busca || filtroLeito || filtroCirurgiao || filtroSubesp || filtroTipoStatus || filtroEspecial !== 'todos'

  return (
    <div>
      <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <TabsList className="w-fit">
            {Object.keys(statusLabel).map((s) => (
              <TabsTrigger key={s} value={s} className="text-xs sm:text-sm">
                {statusLabel[s]}
              </TabsTrigger>
            ))}
          </TabsList>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-all font-medium ${temFiltrosAtivos ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
          >
            {temFiltrosAtivos ? '● ' : ''}Filtros {mostrarFiltros ? '▲' : '▼'}
          </button>
        </div>

        {/* Filtros */}
        <div className={`mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 ${mostrarFiltros ? '' : 'hidden'}`}>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Buscar por nome, diagnóstico ou registro…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="sm:max-w-xs bg-white"
            />
            <Input
              placeholder="Leito…"
              value={filtroLeito}
              onChange={(e) => setFiltroLeito(e.target.value)}
              className="sm:max-w-32 bg-white"
            />
            <Input
              placeholder="Cirurgião…"
              value={filtroCirurgiao}
              onChange={(e) => setFiltroCirurgiao(e.target.value)}
              className="sm:max-w-40 bg-white"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={filtroSubesp} onValueChange={(v) => setFiltroSubesp(v === '__todos' ? '' : (v || ''))}>
              <SelectTrigger className="sm:max-w-44 bg-white">
                <SelectValue placeholder="Subespecialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__todos">Todas</SelectItem>
                {['Quadril','Joelho','Ombro','Cotovelo','Mão e Punho','Pé e Tornozelo','Coluna','Trauma','Oncologia','Pediatria','Tumores'].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroTipoStatus} onValueChange={(v) => setFiltroTipoStatus(v === '__todos' ? '' : (v || ''))}>
              <SelectTrigger className="sm:max-w-44 bg-white">
                <SelectValue placeholder="Pré / Pós-op" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__todos">Todos</SelectItem>
                <SelectItem value="PRE_OPERATORIO">Pré-operatório</SelectItem>
                <SelectItem value="POS_OPERATORIO">Pós-operatório</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroEspecial} onValueChange={(v) => v && setFiltroEspecial(v)}>
              <SelectTrigger className="sm:max-w-52 bg-white">
                <SelectValue placeholder="Filtros especiais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendencias">Com pendências</SelectItem>
                <SelectItem value="infectados">Infectados</SelectItem>
                <SelectItem value="alta-hoje">Alta hoje</SelectItem>
                <SelectItem value="aguardando-risco">Aguardando risco cirúrgico</SelectItem>
                <SelectItem value="aguardando-cirurgia">Aguardando cirurgia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {Object.keys(statusLabel).map((s) => (
          <TabsContent key={s} value={s}>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Carregando…</div>
            ) : pacientes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Nenhum paciente encontrado</p>
                {s === 'INTERNADO' && (
                  <Link
                    href="/pacientes/novo"
                    className="mt-3 inline-block text-sm text-blue-600 hover:underline"
                  >
                    Cadastrar primeiro paciente →
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {pacientes
                  .filter((p) => {
                    if (filtroEspecial === 'pendencias')
                      return p.pendencias.filter((pe) => !pe.concluida).length > 0
                    return true
                  })
                  .map((p) => (
                    <PacienteCard key={p.id} paciente={p} onStatusChange={fetchPacientes} />
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

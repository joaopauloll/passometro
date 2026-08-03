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
  const [filtroEspecial, setFiltroEspecial] = useState('todos')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPacientes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: tabAtiva,
      busca,
      leito: filtroLeito,
      ...(filtroEspecial === 'infectados' && { infeccao: 'true' }),
      ...(filtroEspecial === 'alta-hoje' && { altaHoje: 'true' }),
    })
    try {
      const res = await fetch(`/api/pacientes?${params}`)
      const data = await res.json()
      setPacientes(Array.isArray(data) ? data : [])
    } catch {
      setPacientes([])
    } finally {
      setLoading(false)
    }
  }, [tabAtiva, busca, filtroLeito, filtroEspecial])

  useEffect(() => {
    fetchPacientes()
  }, [fetchPacientes])

  const statusLabel: Record<string, string> = {
    INTERNADO: `Internados (${contadores.internados})`,
    ALTA_ORTOPEDIA: `Alta Ortopedia (${contadores.altaOrtopedia})`,
    ALTA_HOSPITALAR: `Alta Hospitalar (${contadores.altaHospitalar})`,
  }

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
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <Input
            placeholder="Buscar por nome, diagnóstico ou registro…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="sm:max-w-xs bg-white"
          />
          <Input
            placeholder="Filtrar por leito…"
            value={filtroLeito}
            onChange={(e) => setFiltroLeito(e.target.value)}
            className="sm:max-w-40 bg-white"
          />
          <Select value={filtroEspecial} onValueChange={(v) => v && setFiltroEspecial(v)}>
            <SelectTrigger className="sm:max-w-48 bg-white">
              <SelectValue placeholder="Filtros especiais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendencias">Com pendências</SelectItem>
              <SelectItem value="infectados">Infectados</SelectItem>
              <SelectItem value="alta-hoje">Alta hoje</SelectItem>
            </SelectContent>
          </Select>
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

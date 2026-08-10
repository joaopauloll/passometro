import { prisma } from '@/lib/prisma'
import { getSessionFromCookies } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import PendenciasTab from '@/components/pendencias/PendenciasTab'
import EvolucoesList from '@/components/evolucao/EvolucoesList'
import AlterarStatusButton from '@/components/pacientes/AlterarStatusButton'
import FotosSectionView from '@/components/pacientes/FotosSectionView'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export default async function PacienteDetailPage({ params }: Params) {
  const session = await getSessionFromCookies()
  if (!session) redirect('/login')

  const { id } = await params

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      cirurgias: { orderBy: { dataCirurgia: 'desc' } },
      evolucoes: {
        orderBy: { data: 'desc' },
        take: 10,
        include: { pendencias: true },
      },
      pendencias: {
        orderBy: [{ concluida: 'asc' }, { createdAt: 'desc' }],
      },
      fotos: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!paciente) notFound()

  const cirurgioes: string[] = (() => {
    try { return JSON.parse(paciente.cirurgioes) } catch { return [] }
  })()

  const diasInternado = differenceInDays(new Date(), new Date(paciente.dataInternacao))

  let idadePaciente: number | null = null
  if (paciente.dataNascimento) {
    const hoje = new Date()
    const nasc = new Date(paciente.dataNascimento)
    idadePaciente = hoje.getFullYear() - nasc.getFullYear()
    const m = hoje.getMonth() - nasc.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idadePaciente--
  }

  const pendenciasAbertas = paciente.pendencias.filter((p) => !p.concluida)
  const ultimaEvolucao = paciente.evolucoes[0]

  const statusLabels: Record<string, string> = {
    INTERNADO: 'Internado',
    ALTA_ORTOPEDIA: 'Alta Ortopedia',
    ALTA_HOSPITALAR: 'Alta Hospitalar',
  }

  const statusColors: Record<string, string> = {
    INTERNADO: 'bg-blue-100 text-blue-800 border-blue-200',
    ALTA_ORTOPEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ALTA_HOSPITALAR: 'bg-green-100 text-green-800 border-green-200',
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
          ← Enfermaria
        </Link>
      </div>

      {/* Header do paciente */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{paciente.nome}</h1>
            <Badge className={`border ${statusColors[paciente.status]}`}>
              {statusLabels[paciente.status]}
            </Badge>
            {paciente.temInfeccao && (
              <Badge variant="destructive">Infecção</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
            <span>Leito <strong className="text-gray-700">{paciente.leito}</strong></span>
            <span>·</span>
            <span>Reg. <strong className="text-gray-700">{paciente.registroHospitalar}</strong></span>
            <span>·</span>
            <span><strong className="text-gray-700">{diasInternado}</strong> dias internado</span>
            {idadePaciente !== null && (
              <>
                <span>·</span>
                <span><strong className="text-gray-700">{idadePaciente}</strong> anos</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/pacientes/${id}/evolucao/nova`}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            + Nova Evolução
          </Link>
          <Link
            href={`/pacientes/${id}/editar`}
            className="text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Editar
          </Link>
          <Link
            href={`/pacientes/${id}/relatorio`}
            className="text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Relatório
          </Link>
          <Link
            href={`/pacientes/${id}/calendario`}
            className="text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Calendário
          </Link>
          <AlterarStatusButton pacienteId={id} statusAtual={paciente.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Diagnóstico */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-gray-900">{paciente.diagnostico}</p>
              <div className="flex gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                {paciente.cid && <span>CID: <strong>{paciente.cid}</strong></span>}
                {paciente.subespecialidade && <span>· {paciente.subespecialidade}</span>}
                <span>·</span>
                <span className="font-medium text-blue-700">
                  {paciente.tipoStatus === 'POS_OPERATORIO' ? 'Pós-operatório' : 'Pré-operatório'}
                </span>
              </div>
              {cirurgioes.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="text-gray-400">Cirurgião: </span>
                  {cirurgioes.join(', ')}
                </div>
              )}
              <div className="mt-1 text-sm text-gray-600">
                <span className="text-gray-400">Internação: </span>
                {format(new Date(paciente.dataInternacao), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </CardContent>
          </Card>

          {/* Cirurgias */}
          {paciente.cirurgias.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Cirurgias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paciente.cirurgias.map((c) => (
                  <div key={c.id} className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{c.nomeCirurgia}</p>
                      <p className="text-xs text-gray-500">
                        Dr. {c.cirurgiao} · {format(new Date(c.dataCirurgia), "dd/MM/yyyy")}
                        {c.hospitalExterno && ` · ${c.hospitalExterno}`}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* História clínica */}
          {(paciente.comorbidades || paciente.medicacoes || paciente.alergias) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">História Clínica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {paciente.comorbidades && (
                  <div>
                    <span className="font-medium text-gray-600">Comorbidades: </span>
                    <span className="text-gray-800">{paciente.comorbidades}</span>
                  </div>
                )}
                {paciente.medicacoes && (
                  <div>
                    <span className="font-medium text-gray-600">Medicações: </span>
                    <span className="text-gray-800">{paciente.medicacoes}</span>
                  </div>
                )}
                {paciente.alergias && (
                  <div className="flex items-start gap-1">
                    <span className="font-medium text-red-600">⚠ Alergias: </span>
                    <span className="text-red-700 font-medium">{paciente.alergias}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Última evolução - texto gerado */}
          {ultimaEvolucao?.textoGerado && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                  Última Evolução — {format(new Date(ultimaEvolucao.data), "dd/MM/yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-800 leading-relaxed">{ultimaEvolucao.textoGerado}</p>
                <Link
                  href={`/pacientes/${id}/evolucao/nova`}
                  className="mt-3 inline-block text-xs text-blue-600 hover:underline"
                >
                  Registrar evolução de hoje →
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Histórico de evoluções */}
          <EvolucoesList evolucoes={paciente.evolucoes.map(e => ({...e, data: e.data.toISOString(), pendencias: e.pendencias.map(p => ({...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString()}))}))} pacienteId={id} />

          {/* Fotos */}
          {paciente.fotos.length > 0 && (
            <FotosSectionView
              pacienteId={id}
              fotos={paciente.fotos.map(f => ({
                ...f,
                dataFoto: f.dataFoto?.toISOString() ?? null,
                createdAt: f.createdAt.toISOString(),
              }))}
            />
          )}
        </div>

        {/* Sidebar — pendências */}
        <div className="space-y-4">
          <PendenciasTab
            pendencias={paciente.pendencias.map(p => ({...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString()}))}
            pacienteId={id}
          />
        </div>
      </div>
    </div>
  )
}

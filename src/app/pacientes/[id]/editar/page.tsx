import { prisma } from '@/lib/prisma'
import { getSessionFromCookies } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import PacienteForm from '@/components/pacientes/PacienteForm'

type Params = { params: Promise<{ id: string }> }

export default async function EditarPacientePage({ params }: Params) {
  const session = await getSessionFromCookies()
  if (!session) redirect('/login')

  const { id } = await params

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: { cirurgias: true, fotos: { orderBy: { createdAt: 'asc' } } },
  })

  if (!paciente) notFound()

  const cirurgioes: string[] = (() => {
    try { return JSON.parse(paciente.cirurgioes) } catch { return [''] }
  })()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/pacientes/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
          ← {paciente.nome}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Editar Paciente</h1>
      </div>

      <PacienteForm
        modo="editar"
        fotosSalvas={paciente.fotos.map(f => ({
          id: f.id, tipo: f.tipo, url: f.url,
          dataFoto: f.dataFoto?.toISOString() ?? null,
          descricao: f.descricao,
        }))}
        inicial={{
          id,
          nome: paciente.nome,
          leito: paciente.leito,
          registroHospitalar: paciente.registroHospitalar,
          cpf: paciente.cpf || '',
          dataInternacao: paciente.dataInternacao.toISOString(),
          dataNascimento: paciente.dataNascimento?.toISOString() || '',
          diagnostico: paciente.diagnostico,
          cid: paciente.cid || '',
          subespecialidade: paciente.subespecialidade || '',
          cirurgioes,
          tipoStatus: paciente.tipoStatus,
          comorbidades: paciente.comorbidades || '',
          comorbidadesJson: paciente.comorbidadesJson ?? undefined,
          prevCirurgiasOrto: paciente.prevCirurgiasOrto,
          prevCirurgiasJson: paciente.prevCirurgiasJson ?? undefined,
          medicacoes: paciente.medicacoes || '',
          medicamentosJson: paciente.medicamentosJson ?? undefined,
          temAlergia: paciente.temAlergia,
          alergias: paciente.alergias || '',
          hemoglobinaAdm: paciente.hemoglobinaAdm != null ? String(paciente.hemoglobinaAdm) : undefined,
          plaquetasAdm: paciente.plaquetasAdm != null ? String(paciente.plaquetasAdm) : undefined,
          inrAdm: paciente.inrAdm != null ? String(paciente.inrAdm) : undefined,
          pps: paciente.pps != null ? String(paciente.pps) : undefined,
          temInfeccao: paciente.temInfeccao,
          infeccaoJson: paciente.infeccaoJson ?? undefined,
          altaOrtopediaData: paciente.altaOrtopediaData?.toISOString() ?? '',
          altaHospitalarData: paciente.altaHospitalarData?.toISOString() ?? '',
          previsaoAltaOrto: paciente.previsaoAltaOrto ?? '',
          clinicaMedico: paciente.clinicaMedico ?? '',
          aguardaClinica: paciente.aguardaClinica,
          riscoJson: paciente.riscoJson ?? undefined,
          compSolturaAssetica: paciente.compSolturaAssetica,
          compLuxacao: paciente.compLuxacao,
          compFalhaImplante: paciente.compFalhaImplante,
          compPseudoartrose: paciente.compPseudoartrose,
          compOutro: paciente.compOutro || '',
          traumaMecanismo: paciente.traumaMecanismo || '',
          traumaData: paciente.traumaData?.toISOString() || '',
          traumaTempo: paciente.traumaTempo || '',
          cirurgias: paciente.cirurgias.map((c) => ({
            nomeCirurgia: c.nomeCirurgia,
            cirurgiao: c.cirurgiao,
            dataCirurgia: c.dataCirurgia.toISOString().split('T')[0],
            hospitalExterno: c.hospitalExterno || '',
          })),
        }}
      />
    </div>
  )
}

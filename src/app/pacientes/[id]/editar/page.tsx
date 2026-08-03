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
    include: { cirurgias: true },
  })

  if (!paciente) notFound()

  const cirurgioes: string[] = (() => {
    try { return JSON.parse(paciente.cirurgioes) } catch { return [''] }
  })()

  return (
    <div>
      <div className="mb-6">
        <Link href={`/pacientes/${id}`} className="text-sm text-blue-600 hover:underline">
          ← Voltar para {paciente.nome}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Editar Paciente</h1>
      </div>

      <PacienteForm
        modo="editar"
        inicial={{
          id,
          nome: paciente.nome,
          leito: paciente.leito,
          registroHospitalar: paciente.registroHospitalar,
          dataInternacao: paciente.dataInternacao.toISOString(),
          dataNascimento: paciente.dataNascimento?.toISOString() || '',
          diagnostico: paciente.diagnostico,
          cid: paciente.cid || '',
          subespecialidade: paciente.subespecialidade || '',
          cirurgioes,
          tipoStatus: paciente.tipoStatus,
          comorbidades: paciente.comorbidades || '',
          medicacoes: paciente.medicacoes || '',
          alergias: paciente.alergias || '',
          temInfeccao: paciente.temInfeccao,
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

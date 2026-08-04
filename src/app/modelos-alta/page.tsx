import { prisma } from '@/lib/prisma'
import { getSessionFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ModelosAltaCliente from './ModelosAltaCliente'

export const dynamic = 'force-dynamic'

export default async function ModelosAltaPage() {
  const session = await getSessionFromCookies()
  if (!session) redirect('/login')

  const pacientes = await prisma.paciente.findMany({
    where: { status: { in: ['INTERNADO', 'ALTA_ORTOPEDIA'] } },
    orderBy: { nome: 'asc' },
    select: {
      id: true, nome: true, leito: true, diagnostico: true, cid: true,
      cirurgioes: true, subespecialidade: true, comorbidades: true,
      medicacoes: true, dataNascimento: true, dataInternacao: true,
      traumaMecanismo: true, traumaData: true, temAlergia: true, alergias: true,
      cirurgias: { orderBy: { dataCirurgia: 'desc' }, take: 3 },
    },
  })

  const serialized = pacientes.map(p => ({
    ...p,
    dataInternacao: p.dataInternacao.toISOString(),
    dataNascimento: p.dataNascimento?.toISOString() ?? null,
    traumaData: p.traumaData?.toISOString() ?? null,
    createdAt: undefined,
    updatedAt: undefined,
    cirurgias: p.cirurgias.map(c => ({
      ...c,
      dataCirurgia: c.dataCirurgia.toISOString(),
      createdAt: undefined,
    })),
  }))

  return <ModelosAltaCliente pacientes={serialized} />
}

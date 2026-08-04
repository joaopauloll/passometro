import { prisma } from '@/lib/prisma'
import { getSessionFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EvolucaoListaCliente from './EvolucaoListaCliente'

export const dynamic = 'force-dynamic'

export default async function EvolucaoListaPage() {
  const session = await getSessionFromCookies()
  if (!session) redirect('/login')

  const evolucoes = await prisma.evolucao.findMany({
    orderBy: { data: 'desc' },
    include: {
      paciente: {
        select: {
          id: true,
          nome: true,
          leito: true,
          diagnostico: true,
          cid: true,
          cirurgioes: true,
          subespecialidade: true,
          status: true,
          tipoStatus: true,
          dataInternacao: true,
        },
      },
    },
  })

  // Serializar datas
  const serialized = evolucoes.map(ev => ({
    ...ev,
    data: ev.data.toISOString(),
    paciente: {
      ...ev.paciente,
      dataInternacao: ev.paciente.dataInternacao.toISOString(),
    },
  }))

  return <EvolucaoListaCliente evolucoes={serialized} />
}

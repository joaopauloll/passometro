import { prisma } from '@/lib/prisma'
import { getSessionFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PendenciasGlobalCliente from './PendenciasGlobalCliente'

export const dynamic = 'force-dynamic'

export default async function PendenciasPage() {
  const session = await getSessionFromCookies()
  if (!session) redirect('/login')

  const pendencias = await prisma.pendencia.findMany({
    orderBy: [{ concluida: 'asc' }, { createdAt: 'asc' }],
    include: {
      paciente: {
        select: {
          id: true,
          nome: true,
          leito: true,
          diagnostico: true,
          cirurgioes: true,
          subespecialidade: true,
          status: true,
        },
      },
    },
  })

  const serialized = pendencias.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: undefined,
  }))

  return <PendenciasGlobalCliente pendencias={serialized} />
}

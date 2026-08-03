import { prisma } from '@/lib/prisma'
import { getSessionFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PacienteListaCliente from '@/components/pacientes/PacienteListaCliente'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSessionFromCookies()
  if (!session) redirect('/login')

  // Carrega contadores para cada tab
  const [internados, altaOrtopedia, altaHospitalar] = await Promise.all([
    prisma.paciente.count({ where: { status: 'INTERNADO' } }),
    prisma.paciente.count({ where: { status: 'ALTA_ORTOPEDIA' } }),
    prisma.paciente.count({ where: { status: 'ALTA_HOSPITALAR' } }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Enfermaria</h1>
        <p className="text-gray-500 text-sm mt-1">Gerenciamento dos pacientes internados</p>
      </div>

      <PacienteListaCliente
        contadores={{ internados, altaOrtopedia, altaHospitalar }}
      />
    </div>
  )
}

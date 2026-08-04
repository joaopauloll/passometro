import { prisma } from '@/lib/prisma'
import { getSessionFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { subDays } from 'date-fns'
import PacienteListaCliente from '@/components/pacientes/PacienteListaCliente'
import DashboardMetricas from '@/components/dashboard/DashboardMetricas'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSessionFromCookies()
  if (!session) redirect('/login')

  const agora = new Date()
  const d1 = subDays(agora, 1)
  const d3 = subDays(agora, 3)

  // Todos os contadores em paralelo
  const [
    internados, altaOrtopedia, altaHospitalar,
    aguardandoCirurgia, comInfeccao, pendenciasAtivas,
    altaHojeCount, quadrilD2,
  ] = await Promise.all([
    prisma.paciente.count({ where: { status: 'INTERNADO' } }),
    prisma.paciente.count({ where: { status: 'ALTA_ORTOPEDIA' } }),
    prisma.paciente.count({ where: { status: 'ALTA_HOSPITALAR' } }),
    prisma.paciente.count({ where: { status: 'INTERNADO', tipoStatus: 'PRE_OPERATORIO' } }),
    prisma.paciente.count({ where: { status: 'INTERNADO', temInfeccao: true } }),
    prisma.pendencia.count({ where: { concluida: false } }),
    // Alta hoje: última evolução com altaHoje = true
    prisma.paciente.count({
      where: {
        status: 'INTERNADO',
        evolucoes: { some: { altaHoje: true, data: { gte: subDays(agora, 1) } } },
      },
    }),
    // Quadril D2-D3: pacientes pós-op de quadril com cirurgia entre 1 e 3 dias atrás
    prisma.paciente.count({
      where: {
        status: 'INTERNADO',
        tipoStatus: 'POS_OPERATORIO',
        subespecialidade: 'Quadril',
        cirurgias: { some: { dataCirurgia: { gte: d3, lte: d1 } } },
      },
    }),
  ])

  // ATJ 48h: busca cirurgias ATJ das últimas 48h
  const atj48h = await prisma.cirurgia.count({
    where: {
      dataCirurgia: { gte: subDays(agora, 2) },
      nomeCirurgia: { contains: 'ATJ' },
      paciente: { status: 'INTERNADO' },
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enfermaria</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ortopedia · {internados} paciente{internados !== 1 ? 's' : ''} internado{internados !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <DashboardMetricas
        internados={internados}
        aguardandoCirurgia={aguardandoCirurgia}
        comInfeccao={comInfeccao}
        pendenciasAtivas={pendenciasAtivas}
        altaHoje={altaHojeCount}
        quadrilD2={quadrilD2}
        atj48h={atj48h}
      />

      <PacienteListaCliente
        contadores={{ internados, altaOrtopedia, altaHospitalar }}
      />
    </div>
  )
}


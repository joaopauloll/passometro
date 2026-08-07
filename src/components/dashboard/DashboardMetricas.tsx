import Link from 'next/link'
import {
  Bed,
  Clock3,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Bone,
} from 'lucide-react'

type Props = {
  internados: number
  aguardandoCirurgia: number
  comInfeccao: number
  pendenciasAtivas: number
  altaHoje: number
  quadrilD2: number
  atj48h: number
}

type Metrica = {
  label: string
  descricao: string
  valor: number
  href?: string
  alerta?: boolean
  icon: React.ElementType
  iconColor: string
}

export default function DashboardMetricas({
  internados,
  aguardandoCirurgia,
  comInfeccao,
  pendenciasAtivas,
  altaHoje,
  quadrilD2,
  atj48h,
}: Props) {
  const metricas: Metrica[] = [
    {
      label: 'Internados',
      descricao: 'Pacientes na enfermaria',
      valor: internados,
      icon: Bed,
      iconColor: 'text-blue-600',
    },
    {
      label: 'Pré-operatório',
      descricao: 'Aguardando cirurgia',
      valor: aguardandoCirurgia,
      icon: Clock3,
      iconColor: 'text-amber-600',
    },
    {
      label: 'Infecção',
      descricao: 'Pacientes com infecção',
      valor: comInfeccao,
      alerta: comInfeccao > 0,
      icon: AlertTriangle,
      iconColor: comInfeccao > 0 ? 'text-red-600' : 'text-slate-400',
    },
    {
      label: 'Pendências',
      descricao: 'Pendências abertas',
      valor: pendenciasAtivas,
      href: '/pendencias',
      icon: ClipboardList,
      iconColor: pendenciasAtivas > 0 ? 'text-orange-600' : 'text-slate-400',
    },
    {
      label: 'Alta Hoje',
      descricao: 'Prontos para alta',
      valor: altaHoje,
      icon: CheckCircle2,
      iconColor: altaHoje > 0 ? 'text-emerald-600' : 'text-slate-400',
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 mb-8">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {metricas.map((m) => {
          const Icon = m.icon

          const card = (
            <div
              className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                p-4 sm:p-5
                shadow-sm
                hover:shadow-md
                hover:-translate-y-0.5
                transition-all
                duration-200
                h-full
              "
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
                    {m.label}
                  </p>

                  <p className="mt-2 sm:mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {m.valor}
                  </p>

                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 leading-snug">
                    {m.descricao}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 sm:p-2.5">
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${m.iconColor}`} />
                  </div>

                  {m.alerta && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-red-700">
                      Alerta
                    </span>
                  )}
                </div>
              </div>
            </div>
          )

          return m.href ? (
            <Link key={m.label} href={m.href} className="block h-full">
              {card}
            </Link>
          ) : (
            <div key={m.label} className="h-full">
              {card}
            </div>
          )
        })}
      </div>

      {/* Alertas clínicos */}
      {(quadrilD2 > 0 || atj48h > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {quadrilD2 > 0 && (
            <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="rounded-xl bg-sky-50 border border-sky-100 p-2 sm:p-2.5 flex-shrink-0">
                  <Bone className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                    Quadril D2–D3
                  </h3>

                  <p className="mt-1 text-xs sm:text-sm text-slate-600">
                    <strong>{quadrilD2}</strong> paciente{quadrilD2 > 1 ? 's' : ''} em D2–D3
                    pós-operatório.
                  </p>

                  <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                    Avaliar possibilidade de alta.
                  </p>
                </div>
              </div>
            </div>
          )}

          {atj48h > 0 && (
            <div className="bg-white border border-violet-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="rounded-xl bg-violet-50 border border-violet-100 p-2 sm:p-2.5 flex-shrink-0">
                  <Bone className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                    ATJ 48 horas
                  </h3>

                  <p className="mt-1 text-xs sm:text-sm text-slate-600">
                    <strong>{atj48h}</strong> ATJ com 48h de pós-operatório.
                  </p>

                  <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                    Revisar critérios de alta.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
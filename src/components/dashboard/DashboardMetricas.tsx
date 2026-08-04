import Link from 'next/link'

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
  valor: number
  cor: string
  href?: string
  alerta?: boolean
  icone: string
}

export default function DashboardMetricas({
  internados, aguardandoCirurgia, comInfeccao,
  pendenciasAtivas, altaHoje, quadrilD2, atj48h,
}: Props) {
  const metricas: Metrica[] = [
    {
      label: 'Internados',
      valor: internados,
      cor: 'bg-blue-50 text-blue-700 border-blue-200',
      icone: '🏥',
    },
    {
      label: 'Aguardando Cirurgia',
      valor: aguardandoCirurgia,
      cor: 'bg-amber-50 text-amber-700 border-amber-200',
      icone: '⏳',
    },
    {
      label: 'Com Infecção',
      valor: comInfeccao,
      cor: comInfeccao > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200',
      alerta: comInfeccao > 0,
      icone: '⚠️',
    },
    {
      label: 'Pendências Ativas',
      valor: pendenciasAtivas,
      cor: pendenciasAtivas > 0 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-600 border-slate-200',
      href: '/pendencias',
      icone: '📋',
    },
    {
      label: 'Alta Hoje',
      valor: altaHoje,
      cor: altaHoje > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200',
      icone: '✅',
    },
  ]

  return (
    <div className="space-y-4 mb-7">
      {/* Métricas principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metricas.map(m => {
          const card = (
            <div className={`rounded-xl border p-3 ${m.cor} ${m.href ? 'hover:shadow-sm transition-shadow cursor-pointer' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{m.icone}</span>
                {m.alerta && <span className="text-xs font-bold animate-pulse">!</span>}
              </div>
              <p className="text-2xl font-bold tabular-nums">{m.valor}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{m.label}</p>
            </div>
          )
          return m.href ? (
            <Link key={m.label} href={m.href}>{card}</Link>
          ) : (
            <div key={m.label}>{card}</div>
          )
        })}
      </div>

      {/* Alertas especiais */}
      {(quadrilD2 > 0 || atj48h > 0) && (
        <div className="flex flex-wrap gap-3">
          {quadrilD2 > 0 && (
            <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-800 rounded-lg px-4 py-2.5 text-sm font-medium">
              <span>🦴</span>
              <span>
                <strong>{quadrilD2}</strong> paciente{quadrilD2 !== 1 ? 's' : ''} de quadril no{' '}
                D2–D3 pós-op — avaliar alta
              </span>
            </div>
          )}
          {atj48h > 0 && (
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg px-4 py-2.5 text-sm font-medium">
              <span>🦵</span>
              <span>
                <strong>{atj48h}</strong> ATJ com 48h — avaliar alta
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

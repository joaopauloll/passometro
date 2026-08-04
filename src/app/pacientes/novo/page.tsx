import { getSessionFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PacienteForm from '@/components/pacientes/PacienteForm'
import Link from 'next/link'

export default async function NovoPacientePage() {
  const session = await getSessionFromCookies()
  if (!session) redirect('/login')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
          ← Enfermaria
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Novo Paciente</h1>
        <p className="text-gray-500 text-sm mt-1">Preencha os dados do paciente a ser internado</p>
      </div>

      <PacienteForm modo="criar" />
    </div>
  )
}

import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-blue-600 text-lg">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            Passômetro
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/pacientes/novo"
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              + Novo Paciente
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}

import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'
import NavLinks from '@/components/layout/NavLinks'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white text-sm font-black tracking-tight">P</span>
            </div>
            <span className="font-bold text-slate-800 text-[17px] tracking-tight hidden sm:block">Passômetro</span>
          </Link>

          {/* Nav links (desktop inline + mobile dropdown) */}
          <div className="flex-1 flex items-center">
            <NavLinks />
          </div>

          {/* Right actions (desktop only) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/pacientes/novo"
              className="hidden md:inline-flex text-sm font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              + Novo Paciente
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-7">
        {children}
      </main>
    </div>
  )
}

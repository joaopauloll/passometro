'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/layout/LogoutButton'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Enfermaria' },
  { href: '/evolucao-lista', label: 'Evoluções' },
  { href: '/pendencias', label: 'Pendências' },
  { href: '/modelos-alta', label: 'Modelos de Alta' },
  { href: '/configuracoes', label: 'Configurações' },
]

export default function NavLinks() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    if (mobileOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mobileOpen])

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-0.5 flex-1">
        {NAV_LINKS.map(link => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] px-3 py-1.5 rounded-lg transition-colors font-medium ${
                active
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {link.label}
              {active && <span className="sr-only">(página atual)</span>}
            </Link>
          )
        })}
      </nav>

      {/* Mobile hamburger */}
      <div ref={menuRef} className="md:hidden relative">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
          className="flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors gap-1.5"
        >
          <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

        {mobileOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
            {NAV_LINKS.map(link => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />}
                  {link.label}
                </Link>
              )
            })}
            <div className="border-t border-slate-100 px-4 py-3">
              <Link href="/pacientes/novo"
                className="block text-center text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                + Novo Paciente
              </Link>
            </div>
            <div className="border-t border-slate-100 px-4 py-3">
              <LogoutButton />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

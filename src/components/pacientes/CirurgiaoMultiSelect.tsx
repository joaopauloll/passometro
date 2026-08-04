'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ESPECIALIDADES } from '@/lib/cirurgioes'
import { createPortal } from 'react-dom'

type Props = {
  value: string[]
  onChange: (value: string[]) => void
}

export default function CirurgiaoMultiSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const todosCirurgioes = Object.values(ESPECIALIDADES).flat()
  const [outroTexto, setOutroTexto] = useState(
    value.find(v => !todosCirurgioes.includes(v)) || ''
  )

  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    })
  }, [])

  useEffect(() => {
    if (open) {
      calcPosition()
      // Focus search input without triggering scroll
      const timer = setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 10)
      return () => clearTimeout(timer)
    }
  }, [open, calcPosition])

  useEffect(() => {
    function handleClose(e: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    function handleScroll() { if (open) calcPosition() }
    document.addEventListener('mousedown', handleClose)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClose)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, calcPosition])

  function toggle(nome: string) {
    if (value.includes(nome)) onChange(value.filter(v => v !== nome))
    else onChange([...value.filter(v => todosCirurgioes.includes(v)), nome])
  }

  function handleOutroChange(texto: string) {
    setOutroTexto(texto)
    const conhecidos = value.filter(v => todosCirurgioes.includes(v))
    onChange(texto.trim() ? [...conhecidos, texto.trim()] : conhecidos)
  }

  const dropdown = open ? (
    <div ref={containerRef} style={dropdownStyle}
      className="bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
      <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
        <input
          ref={searchRef}
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar cirurgião…"
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {Object.entries(ESPECIALIDADES).map(([esp, lista]) => {
        const listaFiltrada = lista.filter(c => !busca || c.toLowerCase().includes(busca.toLowerCase()))
        if (listaFiltrada.length === 0) return null
        return (
          <div key={esp}>
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50">{esp}</div>
            {listaFiltrada.map(cirurgiao => (
              <label key={cirurgiao} className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors">
                <input type="checkbox" checked={value.includes(cirurgiao)} onChange={() => toggle(cirurgiao)}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                <span className="text-sm text-slate-800">{cirurgiao}</span>
              </label>
            ))}
          </div>
        )
      })}
      <div className="border-t border-slate-100">
        <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50">Outro</div>
        <div className="px-3 py-2">
          <input type="text" value={outroTexto} onChange={e => handleOutroChange(e.target.value)}
            placeholder="Nome não listado…"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
    </div>
  ) : null

  return (
    <div>
      <button ref={triggerRef} type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white hover:bg-slate-50 transition-colors text-left">
        <span className={value.length === 0 ? 'text-slate-400' : 'text-slate-800'}>
          {value.length === 0 ? 'Selecionar cirurgião(s)…' : value.join(', ')}
        </span>
        <span className="text-slate-400 ml-2 flex-shrink-0">{open ? '▴' : '▾'}</span>
      </button>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map(v => (
            <span key={v} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {v}
              <button type="button" onClick={() => toggle(v)} className="hover:text-red-600 leading-none ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}
      {typeof document !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </div>
  )
}



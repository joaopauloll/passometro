'use client'

import { useState, useRef, useEffect } from 'react'
import { ESPECIALIDADES } from '@/lib/cirurgioes'

type Props = {
  value: string[]
  onChange: (value: string[]) => void
}

export default function CirurgiaoMultiSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [outroTexto, setOutroTexto] = useState(
    value.find(v => !Object.values(ESPECIALIDADES).flat().includes(v)) || ''
  )
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const todosCirurgioes = Object.values(ESPECIALIDADES).flat()
  const filtrados = busca
    ? todosCirurgioes.filter(c => c.toLowerCase().includes(busca.toLowerCase()))
    : todosCirurgioes

  function toggle(nome: string) {
    if (value.includes(nome)) {
      onChange(value.filter(v => v !== nome))
    } else {
      // Remove any "outro" text entry if selecting a known surgeon
      const semOutro = value.filter(v => todosCirurgioes.includes(v))
      onChange([...semOutro, nome])
    }
  }

  function handleOutroChange(texto: string) {
    setOutroTexto(texto)
    // Remove existing "outro" entry and add new one if not empty
    const conhecidos = value.filter(v => todosCirurgioes.includes(v))
    if (texto.trim()) {
      onChange([...conhecidos, texto.trim()])
    } else {
      onChange(conhecidos)
    }
  }

  const temOutro = value.some(v => !todosCirurgioes.includes(v))

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <span className={value.length === 0 ? 'text-slate-400' : 'text-slate-800'}>
          {value.length === 0
            ? 'Selecionar cirurgião(s)…'
            : value.join(', ')}
        </span>
        <span className="text-slate-400 ml-2 flex-shrink-0">▾</span>
      </button>

      {/* Tags dos selecionados */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map(v => (
            <span key={v} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {v}
              <button type="button" onClick={() => toggle(v)} className="hover:text-red-600 leading-none">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {/* Busca */}
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <input
              autoFocus
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar cirurgião…"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lista por especialidade */}
          {Object.entries(ESPECIALIDADES).map(([esp, lista]) => {
            const listaFiltrada = lista.filter(c =>
              !busca || c.toLowerCase().includes(busca.toLowerCase())
            )
            if (listaFiltrada.length === 0) return null
            return (
              <div key={esp}>
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50 sticky top-12">
                  {esp}
                </div>
                {listaFiltrada.map(cirurgiao => (
                  <label key={cirurgiao} className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={value.includes(cirurgiao)}
                      onChange={() => toggle(cirurgiao)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                    />
                    <span className="text-sm text-slate-800">{cirurgiao}</span>
                  </label>
                ))}
              </div>
            )
          })}

          {/* Outro */}
          <div className="border-t border-slate-100">
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50">
              Outro
            </div>
            <div className="px-3 py-2">
              <input
                type="text"
                value={outroTexto}
                onChange={e => handleOutroChange(e.target.value)}
                placeholder="Nome do cirurgião não listado…"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

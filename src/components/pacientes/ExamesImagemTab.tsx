'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'

const SISTEMAS = {
  WBSRAD: { url: 'https://www.wbsrad.com.br/site/', login: 'hospitalmemorial@exame.com.br', senha: '123456', label: 'Hospital Memorial (WBSRad)' },
  EPACS: { url: 'https://app.epacs.com.br/router/login/', login: 'medicocmt1@gmail.com', senha: 'medico', label: 'Walfredo Gurgel (EPACS)' },
}
const TIPOS = ['RX', 'TC', 'RM', 'ECO', 'ECG', 'OUTRO']

type ExameImagem = {
  id: string; tipo: string; descricao: string | null
  dataRealizacao: string | null; sitio: string | null
  achados: string | null; linkTipo: string | null; linkUrl: string | null
}

type Props = { exames: ExameImagem[]; pacienteId: string }

export default function ExamesImagemTab({ exames: iniciais, pacienteId }: Props) {
  const [exames, setExames] = useState(iniciais)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tipo: 'RX', descricao: '', dataRealizacao: '',
    sitio: '', achados: '', linkTipo: '', linkUrl: '',
  })
  const [showSistema, setShowSistema] = useState<keyof typeof SISTEMAS | null>(null)

  async function salvar() {
    setSaving(true)
    const res = await fetch(`/api/pacientes/${pacienteId}/exames-imagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const novo = await res.json()
      setExames([{ ...novo }, ...exames])
      setForm({ tipo: 'RX', descricao: '', dataRealizacao: '', sitio: '', achados: '', linkTipo: '', linkUrl: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function remover(id: string) {
    await fetch(`/api/pacientes/${pacienteId}/exames-imagem?exameId=${id}`, { method: 'DELETE' })
    setExames(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(SISTEMAS) as (keyof typeof SISTEMAS)[]).map(k => (
            <button key={k} onClick={() => setShowSistema(showSistema === k ? null : k)}
              className="text-xs font-medium bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg transition-colors">
              🔗 {SISTEMAS[k].label.split('(')[0].trim()}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          + Novo Exame
        </button>
      </div>

      {showSistema && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-slate-700">{SISTEMAS[showSistema].label}</p>
          <p className="text-xs text-slate-600">
            URL: <a href={SISTEMAS[showSistema].url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{SISTEMAS[showSistema].url}</a>
          </p>
          <p className="text-xs text-slate-600">Login: <code className="bg-slate-200 px-1 rounded">{SISTEMAS[showSistema].login}</code></p>
          <p className="text-xs text-slate-600">Senha: <code className="bg-slate-200 px-1 rounded">{SISTEMAS[showSistema].senha}</code></p>
          <a href={SISTEMAS[showSistema].url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mt-1">
            Abrir sistema ↗
          </a>
        </div>
      )}

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Tipo de exame *</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Data de realização</label>
              <input type="date" value={form.dataRealizacao} onChange={e => setForm({ ...form, dataRealizacao: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Sítio examinado</label>
              <input value={form.sitio} onChange={e => setForm({ ...form, sitio: e.target.value })}
                placeholder="Ex: Quadril esquerdo, Tórax"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Descrição</label>
              <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: RX AP e perfil pré-op"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 block mb-1">Achados principais</label>
              <textarea rows={3} value={form.achados} onChange={e => setForm({ ...form, achados: e.target.value })}
                placeholder="Descrever os achados principais do exame…"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Sistema de imagem</label>
              <select value={form.linkTipo} onChange={e => setForm({ ...form, linkTipo: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Não informado</option>
                <option value="WBSRAD">Hospital Memorial (WBSRad)</option>
                <option value="EPACS">Walfredo Gurgel (EPACS)</option>
                <option value="EXTERNO">Outro/Externo</option>
              </select>
            </div>
            {form.linkTipo === 'EXTERNO' && (
              <div>
                <label className="text-xs text-slate-500 block mb-1">Link do exame</label>
                <input type="url" value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="https://…"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100">Cancelar</button>
            <button onClick={salvar} disabled={saving}
              className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {exames.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Nenhum exame de imagem registrado.</p>
      ) : (
        <div className="space-y-3">
          {exames.map(e => {
            const sistema = e.linkTipo && e.linkTipo !== 'EXTERNO' ? SISTEMAS[e.linkTipo as keyof typeof SISTEMAS] : null
            return (
              <div key={e.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{e.tipo}</span>
                      {e.dataRealizacao && <span className="text-xs text-slate-500">{format(new Date(e.dataRealizacao), 'dd/MM/yyyy')}</span>}
                      {e.sitio && <span className="text-xs text-slate-600 font-medium">· {e.sitio}</span>}
                      {e.descricao && <span className="text-xs text-slate-500">· {e.descricao}</span>}
                    </div>
                    {e.achados && <p className="text-sm text-slate-700 mb-2">{e.achados}</p>}
                    {sistema && (
                      <a href={sistema.url} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline">
                        🔗 Acessar {sistema.label.split('(')[0].trim()}
                      </a>
                    )}
                    {e.linkTipo === 'EXTERNO' && e.linkUrl && (
                      <a href={e.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">🔗 Acessar exame</a>
                    )}
                  </div>
                  <button onClick={() => remover(e.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

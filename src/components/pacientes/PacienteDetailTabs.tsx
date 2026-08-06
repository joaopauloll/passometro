'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PendenciasSection from '@/components/pendencias/PendenciasSection'
import EvolucoesList from '@/components/evolucao/EvolucoesList'
import FotosSectionView from '@/components/pacientes/FotosSectionView'
import ExamesImagemTab from '@/components/pacientes/ExamesImagemTab'
import {
  gerarPrescricaoPDF, gerarAtestadoPDF, gerarAtestadoAcompanhantePDF,
  gerarLaudoPDF, gerarSolicitacaoFisioterapiaPDF, carregarLogoBase64,
  type PacienteParaPDF, type ConfiguracaoPDF,
} from '@/lib/pdfUtils'

// ─── Types ──────────────────────────────────────────────────────────────────

type Evolucao = {
  id: string; data: string; textoGerado: string | null
  altaHoje: boolean | null; altaPrevista: boolean | null
  hemoglobina: number | null; plaquetas: number | null; inr: number | null
  leucocitos: number | null; pcr: number | null; vhs: number | null
  creatinina: number | null; ureia: number | null
  pendencias: { id: string; descricao: string; tipo: string; concluida: boolean; createdAt: string; updatedAt: string }[]
}

type Cirurgia = { id: string; nomeCirurgia: string; cirurgiao: string; dataCirurgia: string; hospitalExterno: string | null }
type Parecer = { id: string; especialidade: string; data: string; descricao: string; medico: string | null }
type Foto = { id: string; tipo: string; url: string; dataFoto: string | null; descricao: string | null }
type Pendencia = { id: string; descricao: string; tipo: string; concluida: boolean; createdAt: string; updatedAt: string }
type Cultura = { id: string; dataColeta: string; sitio: string; resultado: string | null; dataResult: string | null }
type ExameImagem = { id: string; tipo: string; descricao: string | null; dataRealizacao: string | null; sitio: string | null; achados: string | null; linkTipo: string | null; linkUrl: string | null }

type Paciente = {
  id: string; nome: string; leito: string; registroHospitalar: string
  cpf: string | null; dataInternacao: string; dataNascimento: string | null
  diagnostico: string; cid: string | null; subespecialidade: string | null
  cirurgioes: string; tipoStatus: string; status: string
  comorbidades: string | null; medicacoes: string | null; alergias: string | null
  temInfeccao: boolean; temAlergia: boolean
  traumaMecanismo: string | null; traumaData: string | null; traumaTempo: string | null
  pps: number | null
}

type Props = {
  paciente: Paciente
  evolucoes: Evolucao[]
  cirurgias: Cirurgia[]
  pareceres: Parecer[]
  fotos: Foto[]
  pendencias: Pendencia[]
  culturas: Cultura[]
  examesImagem: ExameImagem[]
  diasInternado: number
  idadePaciente: number | null
  cirurgioesList: string[]
}

type Tab = 'resumo' | 'evolucoes' | 'cirurgias' | 'pareceres' | 'laboratorio' | 'imagens' | 'exames-imagem' | 'alta' | 'pendencias'

const TABS: { id: Tab; label: string; count?: (p: Props) => number }[] = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'evolucoes', label: 'Evoluções', count: p => p.evolucoes.length },
  { id: 'cirurgias', label: 'Cirurgias', count: p => p.cirurgias.length },
  { id: 'pareceres', label: 'Pareceres', count: p => p.pareceres.length },
  { id: 'laboratorio', label: 'Laboratório' },
  { id: 'imagens', label: 'Fotos', count: p => p.fotos.length },
  { id: 'exames-imagem', label: 'Exames de Imagem', count: p => p.examesImagem.length },
  { id: 'alta', label: 'Alta' },
  { id: 'pendencias', label: 'Pendências', count: p => p.pendencias.filter(x => !x.concluida).length },
]

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PacienteDetailTabs(props: Props) {
  const { paciente, evolucoes, cirurgias, pareceres, fotos, pendencias, culturas, examesImagem, diasInternado, idadePaciente, cirurgioesList } = props
  const [tab, setTab] = useState<Tab>('resumo')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0.5 overflow-x-auto border-b border-slate-200 mb-5 -mx-1 px-1">
        {TABS.map(t => {
          const count = t.count?.(props)
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {t.label}
              {count != null && count > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'resumo' && <ResumoTab {...props} />}
      {tab === 'evolucoes' && <EvolucaoTab evolucoes={evolucoes} pacienteId={paciente.id} />}
      {tab === 'cirurgias' && <CirurgiasTab cirurgias={cirurgias} pacienteId={paciente.id} />}
      {tab === 'pareceres' && <ParecerTab pareceres={pareceres} pacienteId={paciente.id} />}
      {tab === 'laboratorio' && <LaboratorioTab evolucoes={evolucoes} culturas={culturas} pacienteId={paciente.id} />}
      {tab === 'imagens' && <ImagensTab fotos={fotos} pacienteId={paciente.id} />}
      {tab === 'exames-imagem' && <ExamesImagemTab exames={examesImagem} pacienteId={paciente.id} />}
      {tab === 'alta' && <AltaTab paciente={paciente} cirurgias={cirurgias} cirurgioesList={cirurgioesList} />}
      {tab === 'pendencias' && (
        <PendenciasSection
          pendencias={pendencias}
          pacienteId={paciente.id}
        />
      )}
    </div>
  )
}

// ─── Resumo Tab ──────────────────────────────────────────────────────────────

function ResumoTab({ paciente, evolucoes, diasInternado, idadePaciente, cirurgioesList }: Props) {
  const ultimaEvolucao = evolucoes[0]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-semibold text-slate-900 text-base">{paciente.diagnostico}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500">
            {paciente.cid && <span>CID: <strong className="text-slate-700">{paciente.cid}</strong></span>}
            {paciente.subespecialidade && <span>· {paciente.subespecialidade}</span>}
            <span className={`font-semibold ${paciente.tipoStatus === 'POS_OPERATORIO' ? 'text-blue-700' : 'text-amber-700'}`}>
              · {paciente.tipoStatus === 'POS_OPERATORIO' ? 'Pós-Op' : 'Pré-Op'}
            </span>
          </div>
          {cirurgioesList.length > 0 && <p className="text-slate-600">Cirurgião: {cirurgioesList.join(', ')}</p>}
          <p className="text-slate-500">Internação: {format(new Date(paciente.dataInternacao), "d/MM/yyyy", { locale: ptBR })} · {diasInternado}d internado</p>
          {paciente.traumaMecanismo && <p className="text-slate-500">Trauma: {paciente.traumaMecanismo}{paciente.traumaData ? ` em ${format(new Date(paciente.traumaData), 'dd/MM/yyyy')}` : ''}</p>}
        </CardContent>
      </Card>

      {(paciente.comorbidades || paciente.medicacoes || paciente.temAlergia) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">História Clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {paciente.comorbidades && (
              <div><span className="font-medium text-slate-600">Comorbidades: </span><span>{paciente.comorbidades}{paciente.pps != null ? ` · PPS ${paciente.pps}%` : ''}</span></div>
            )}
            {paciente.medicacoes && (
              <div><span className="font-medium text-slate-600">Medicações: </span><span>{paciente.medicacoes}</span></div>
            )}
            {paciente.temAlergia && paciente.alergias && (
              <div className="flex items-start gap-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <span className="font-bold text-red-700">⚠ ALERGIA: </span>
                <span className="text-red-700 font-medium">{paciente.alergias}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {ultimaEvolucao?.textoGerado && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">
              Última Evolução — {format(new Date(ultimaEvolucao.data), "dd/MM/yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-800 leading-relaxed">{ultimaEvolucao.textoGerado}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Evoluções Tab ────────────────────────────────────────────────────────────

function EvolucaoTab({ evolucoes, pacienteId }: { evolucoes: Evolucao[]; pacienteId: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link href={`/pacientes/${pacienteId}/evolucao/nova`}
          className="inline-flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          + Nova Evolução
        </Link>
      </div>
      <EvolucoesList evolucoes={evolucoes} pacienteId={pacienteId} />
    </div>
  )
}

// ─── Cirurgias Tab ────────────────────────────────────────────────────────────

function CirurgiasTab({ cirurgias, pacienteId }: { cirurgias: Cirurgia[]; pacienteId: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link href={`/pacientes/${pacienteId}/editar`}
          className="inline-flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          + Adicionar cirurgia (via Editar)
        </Link>
      </div>
      {cirurgias.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Nenhuma cirurgia registrada.</p>
      ) : (
        <div className="space-y-3">
          {cirurgias.map(c => (
            <Card key={c.id}>
              <CardContent className="py-3 px-4">
                <p className="font-semibold text-slate-900">{c.nomeCirurgia}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Dr. {c.cirurgiao} · {format(new Date(c.dataCirurgia), "dd/MM/yyyy")}
                  {c.hospitalExterno && ` · ${c.hospitalExterno}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Pareceres Tab ────────────────────────────────────────────────────────────

function ParecerTab({ pareceres: iniciais, pacienteId }: { pareceres: Parecer[]; pacienteId: string }) {
  const [pareceres, setPareceres] = useState(iniciais)
  const [form, setForm] = useState({ especialidade: '', data: new Date().toISOString().split('T')[0], descricao: '', medico: '' })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function salvar() {
    if (!form.especialidade || !form.descricao) return
    setSaving(true)
    const res = await fetch(`/api/pacientes/${pacienteId}/pareceres`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const novo = await res.json()
      setPareceres([{ ...novo, data: novo.data }, ...pareceres])
      setForm({ especialidade: '', data: new Date().toISOString().split('T')[0], descricao: '', medico: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function remover(id: string) {
    if (!confirm('Remover este parecer?')) return
    await fetch(`/api/pacientes/${pacienteId}/pareceres?parecerId=${id}`, { method: 'DELETE' })
    setPareceres(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          + Novo Parecer
        </button>
      </div>

      {showForm && (
        <Card className="border-blue-200">
          <CardContent className="py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Especialidade *</label>
                <input value={form.especialidade} onChange={e => setForm({ ...form, especialidade: e.target.value })}
                  placeholder="Ex: Cardiologia" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Data *</label>
                <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-500 block mb-1">Médico parecerista</label>
                <input value={form.medico} onChange={e => setForm({ ...form, medico: e.target.value })}
                  placeholder="Dr(a). nome" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-500 block mb-1">Descrição *</label>
                <textarea rows={4} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Resumo do parecer…"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100">Cancelar</button>
              <button onClick={salvar} disabled={saving} className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {pareceres.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Nenhum parecer registrado.</p>
      ) : (
        <div className="space-y-3">
          {pareceres.map(p => (
            <Card key={p.id} className="group">
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{p.especialidade}</span>
                      <span className="text-xs text-slate-500">{format(new Date(p.data), 'dd/MM/yyyy')}</span>
                      {p.medico && <span className="text-xs text-slate-500">· Dr(a). {p.medico}</span>}
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{p.descricao}</p>
                  </div>
                  <button onClick={() => remover(p.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                    ✕
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Laboratório Tab ──────────────────────────────────────────────────────────

function LaboratorioTab({ evolucoes, culturas: iniciais, pacienteId }: {
  evolucoes: Evolucao[]; culturas: Cultura[]; pacienteId: string
}) {
  const [culturas, setCulturas] = useState(iniciais)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formCultura, setFormCultura] = useState({ dataColeta: '', sitio: '', resultado: '', dataResult: '' })

  const comLabs = evolucoes.filter(e =>
    e.hemoglobina != null || e.plaquetas != null || e.inr != null ||
    e.leucocitos != null || e.pcr != null || e.vhs != null ||
    e.creatinina != null || e.ureia != null
  )

  const alerta = (v: number | null, min: number, max: number) => {
    if (v == null) return 'text-slate-500'
    if (v < min || v > max) return 'text-red-600 font-bold'
    return 'text-green-700'
  }

  async function salvarCultura() {
    if (!formCultura.dataColeta || !formCultura.sitio) return
    setSaving(true)
    const res = await fetch(`/api/pacientes/${pacienteId}/culturas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formCultura),
    })
    if (res.ok) {
      const nova = await res.json()
      setCulturas([{ ...nova, dataColeta: nova.dataColeta, dataResult: nova.dataResult }, ...culturas])
      setFormCultura({ dataColeta: '', sitio: '', resultado: '', dataResult: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function removerCultura(id: string) {
    await fetch(`/api/pacientes/${pacienteId}/culturas?culturaId=${id}`, { method: 'DELETE' })
    setCulturas(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Exames laboratoriais */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Exames laboratoriais</h3>
        {comLabs.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">Nenhum resultado laboratorial registrado nas evoluções.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Data</th>
                  {[
                    ['Hb', '12–16'], ['Plt', '150–400k'], ['INR', '0.8–1.2'],
                    ['Leuc', '4–11k'], ['PCR', '<5'], ['VHS', '<20'],
                    ['Creat', '0.7–1.2'], ['Ureia', '15–40'],
                  ].map(([h, ref]) => (
                    <th key={h} className="px-3 py-2 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">
                      {h}<br /><span className="text-[10px] font-normal text-slate-400">{ref}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comLabs.map(e => (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 text-xs font-medium text-slate-700">{format(new Date(e.data), 'dd/MM')}</td>
                    <td className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.hemoglobina, 12, 16)}`}>{e.hemoglobina ?? '—'}</td>
                    <td className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.plaquetas, 150, 400)}`}>{e.plaquetas ?? '—'}</td>
                    <td className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.inr, 0.8, 1.2)}`}>{e.inr ?? '—'}</td>
                    <td className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.leucocitos, 4, 11)}`}>{e.leucocitos ?? '—'}</td>
                    <td className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.pcr, 0, 5)}`}>{e.pcr ?? '—'}</td>
                    <td className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.vhs, 0, 20)}`}>{e.vhs ?? '—'}</td>
                    <td className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.creatinina, 0.7, 1.2)}`}>{e.creatinina ?? '—'}</td>
                    <td className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.ureia, 15, 40)}`}>{e.ureia ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Culturas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Culturas</h3>
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
            + Nova Cultura
          </button>
        </div>

        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Data da coleta *</label>
                <input type="date" value={formCultura.dataColeta} onChange={e => setFormCultura({ ...formCultura, dataColeta: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Sítio coletado *</label>
                <input value={formCultura.sitio} onChange={e => setFormCultura({ ...formCultura, sitio: e.target.value })}
                  placeholder="Ex: Hemocultura, Urocultura, Swab de ferida"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Data do resultado</label>
                <input type="date" value={formCultura.dataResult} onChange={e => setFormCultura({ ...formCultura, dataResult: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Resultado</label>
                <input value={formCultura.resultado} onChange={e => setFormCultura({ ...formCultura, resultado: e.target.value })}
                  placeholder="Ex: S. aureus MRSA, Negativo"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100">Cancelar</button>
              <button onClick={salvarCultura} disabled={saving}
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {culturas.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">Nenhuma cultura registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Coleta</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Sítio</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Resultado</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Data resultado</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {culturas.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 group">
                    <td className="px-3 py-2 text-xs font-medium text-slate-700">{format(new Date(c.dataColeta), 'dd/MM/yyyy')}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{c.sitio}</td>
                    <td className={`px-3 py-2 text-xs font-medium ${c.resultado ? (c.resultado.toLowerCase().includes('negat') ? 'text-green-700' : 'text-red-700') : 'text-slate-400'}`}>
                      {c.resultado || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {c.dataResult ? format(new Date(c.dataResult), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => removerCultura(c.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Imagens Tab ──────────────────────────────────────────────────────────────

function ImagensTab({ fotos, pacienteId }: { fotos: Foto[]; pacienteId: string }) {
  const [fotosList, setFotosList] = useState(fotos)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href={`/pacientes/${pacienteId}/editar`}
          className="inline-flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          + Adicionar imagens (via Editar)
        </Link>
      </div>
      {fotosList.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Nenhuma imagem registrada.</p>
      ) : (
        <FotosSectionView
          pacienteId={pacienteId}
          fotos={fotosList}
          onFotaDeletada={id => setFotosList(prev => prev.filter(f => f.id !== id))}
        />
      )}
    </div>
  )
}

// ─── Alta Tab ────────────────────────────────────────────────────────────────

function AltaTab({ paciente, cirurgias, cirurgioesList }: {
  paciente: Paciente; cirurgias: Cirurgia[]; cirurgioesList: string[]
}) {
  const [config, setConfig] = useState<ConfiguracaoPDF>({})
  useEffect(() => {
    fetch('/api/configuracoes').then(r => r.json()).then(async (data) => {
      let logoBase64: string | undefined
      if (data.hospitalLogotipoUrl) {
        logoBase64 = await carregarLogoBase64(data.hospitalLogotipoUrl).catch(() => undefined)
      }
      setConfig({ ...data, hospitalLogotipoBase64: logoBase64 })
    }).catch(() => {})
  }, [])

  const pac: PacienteParaPDF = {
    nome: paciente.nome,
    cpf: paciente.cpf,
    dataNascimento: paciente.dataNascimento,
    dataInternacao: paciente.dataInternacao,
    diagnostico: paciente.diagnostico,
    cid: paciente.cid,
    cirurgioes: cirurgioesList,
    medicacoes: paciente.medicacoes,
    alergias: paciente.alergias,
    traumaMecanismo: paciente.traumaMecanismo,
    traumaData: paciente.traumaData,
    cirurgias: cirurgias.map(c => ({ nomeCirurgia: c.nomeCirurgia, cirurgiao: c.cirurgiao, dataCirurgia: c.dataCirurgia })),
  }

  // Prescription state
  const [prescOpts, setPrescOpts] = useState({
    usaDipirona: true, usaTramadol: true, usaTamarine: true,
    diasRivaroxabana: 30, usaCefadroxila: true, extras: ['', ''],
  })

  // Atestado state
  const [diasAfastamento, setDiasAfastamento] = useState(90)
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0])

  // Fisioterapia state
  const nomeCirurgia = cirurgias[0]?.nomeCirurgia || ''
  const [indicacaoFisio, setIndicacaoFisio] = useState(
    nomeCirurgia
      ? `Reabilitação pós-operatória de ${nomeCirurgia}. Iniciar fisioterapia motora com mobilização ativa e passiva do membro operado, treino de marcha com andador, fortalecimento muscular progressivo e orientações domiciliares.`
      : 'Fisioterapia motora pós-operatória com mobilização progressiva, fortalecimento muscular e treino de marcha.'
  )

  return (
    <div className="space-y-5">

      {/* Prescrição */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">💊 Prescrição de Alta</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {([
              ['usaDipirona', 'Dipirona 1g'],
              ['usaTramadol', 'Tramadol 50mg'],
              ['usaTamarine', 'Tamarine geleia'],
              ['usaCefadroxila', 'Cefadroxila 500mg'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="checkbox" checked={prescOpts[key]} onChange={e => setPrescOpts({ ...prescOpts, [key]: e.target.checked })} className="accent-blue-600 h-4 w-4" />
                {label}
              </label>
            ))}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600 whitespace-nowrap">Rivaroxabana</label>
              <select value={prescOpts.diasRivaroxabana} onChange={e => setPrescOpts({ ...prescOpts, diasRivaroxabana: Number(e.target.value) })}
                className="text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>Não</option>
                <option value={15}>15 dias</option>
                <option value={30}>30 dias</option>
              </select>
            </div>
          </div>
          {prescOpts.extras.map((e, i) => (
            <input key={i} value={e} onChange={ev => {
              const n = [...prescOpts.extras]; n[i] = ev.target.value
              setPrescOpts({ ...prescOpts, extras: n })
            }} placeholder={`Medicamento extra ${i + 1}…`}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          ))}
          <button onClick={() => gerarPrescricaoPDF(pac, prescOpts, config)}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            ⬇ Gerar Prescrição PDF
          </button>
        </CardContent>
      </Card>

      {/* Atestado */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">📄 Atestado Médico</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Dias de afastamento</label>
              <input type="number" min={1} value={diasAfastamento} onChange={e => setDiasAfastamento(Number(e.target.value))}
                className="w-24 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Data de emissão</label>
              <input type="date" value={dataEmissao} onChange={e => setDataEmissao(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
              <button onClick={() => gerarAtestadoPDF(pac, diasAfastamento, new Date(dataEmissao).toLocaleDateString('pt-BR'), config)}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              ⬇ Gerar Atestado PDF
            </button>
              <button onClick={() => gerarLaudoPDF(pac, diasAfastamento, config)}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors">
              ⬇ Gerar Laudo Médico PDF
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Atestado Acompanhante */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">👤 Atestado de Acompanhante</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 mb-3">Emite um atestado em branco para o acompanhante (espaço para preenchimento manual).</p>
          <button onClick={() => gerarAtestadoAcompanhantePDF(config)}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors">
            ⬇ Gerar Atestado Acompanhante
          </button>
        </CardContent>
      </Card>

      {/* Fisioterapia */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">🏃 Solicitação de Fisioterapia</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <textarea rows={4} value={indicacaoFisio} onChange={e => setIndicacaoFisio(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <button onClick={() => gerarSolicitacaoFisioterapiaPDF(pac, indicacaoFisio, config)}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
            ⬇ Gerar Solicitação PDF
          </button>
        </CardContent>
      </Card>
      
      {/* Relatório */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            📄 Relatório Médico
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-xs text-slate-500 mb-3">
            Gera um relatório completo do paciente contendo identificação, diagnóstico,
            histórico, cirurgias, exames e evolução clínica.
          </p>

          <Link
            href={`/pacientes/${paciente.id}/relatorio`}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ⬇ Gerar Relatório
          </Link>
        </CardContent>
      </Card>

      {/* Calendário */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            📅 Calendário do Paciente
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-xs text-slate-500 mb-3">
            Gera um calendário com os principais eventos da internação, incluindo
            cirurgias, evoluções e demais registros do paciente.
          </p>

          <Link
            href={`/pacientes/${paciente.id}/calendario`}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ⬇ Gerar Calendário
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { differenceInDays, differenceInYears, addDays, format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MEDICAMENTOS_SUSPENSO, MEDICAMENTOS_COMUNS, PPS_NIVEIS } from '@/lib/medicamentos'
import CirurgiaoMultiSelect from '@/components/pacientes/CirurgiaoMultiSelect'
import FotoUploadSection, { type FotoPendente, type FotaSalva } from '@/components/pacientes/FotoUploadSection'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Cirurgia = { nomeCirurgia: string; cirurgiao: string; dataCirurgia: string; hospitalExterno?: string }
type CirurgiaPrevia = { nome: string; quando: string; cirurgiao: string }
type MedicamentoUso = { codigo: string; dataUltimoUso: string }

type ComorbidadesData = {
  has: boolean; dm2: boolean; tabagismo: boolean; etilismo: boolean
  avc: boolean; iam: boolean; drc: boolean; osteoporose: boolean
  obesidade: boolean; demencia: boolean; hipercolesterolemia: boolean
  hipotireoidismo: boolean; hipertireoidismo: boolean; cancer: boolean
  artrose: boolean; doencaAutoimune: boolean; outros: string
}

type InfeccaoData = {
  febre: boolean; antibiotico: string; antibioticoDias: string
  antibioticoPrevio: string; culturas: boolean; culturasResult: string; dreno: boolean
}

type RiscoData = {
  concluido: boolean
  data: string
  cardiologista: string
  nivel: 'leve' | 'moderado' | 'alto' | ''
  indicaUTI: boolean
  faltaEco: boolean; dataEco: string; resultadoEco: string
  faltaEcg: boolean; dataEcg: string
}

type FormValues = {
  nome: string; leito: string; registroHospitalar: string; cpf: string
  dataInternacao: string; dataNascimento: string
  diagnostico: string; cid: string; subespecialidade: string
  cirurgioes: string[]; tipoStatus: string
  comorbidades: string; comorbidadesJson: ComorbidadesData
  prevCirurgiasOrto: boolean; prevCirurgiasJson: CirurgiaPrevia[]
  temAlergia: boolean; alergias: string
  medicamentosJson: MedicamentoUso[]
  medicamentosComuns: string[]
  medicamentosOutros: string
  medicacoes: string
  hemoglobinaAdm: string; plaquetasAdm: string; inrAdm: string
  pps: string
  temInfeccao: boolean; infeccaoJson: InfeccaoData
  compSolturaAssetica: boolean; compLuxacao: boolean
  compFalhaImplante: boolean; compPseudoartrose: boolean; compOutro: string
  traumaMecanismo: string; traumaData: string; traumaTempo: string
  cirurgias: Cirurgia[]
  // Alta e follow-up
  altaOrtopediaData: string
  altaHospitalarData: string
  previsaoAltaOrto: string
  // Clínica médica
  clinicaMedico: string
  aguardaClinica: boolean
  // Risco cirúrgico
  riscoJson: RiscoData
}

const DEFAULT_COMORBIDADES: ComorbidadesData = {
  has: false, dm2: false, tabagismo: false, etilismo: false,
  avc: false, iam: false, drc: false, osteoporose: false,
  obesidade: false, demencia: false, hipercolesterolemia: false,
  hipotireoidismo: false, hipertireoidismo: false, cancer: false,
  artrose: false, doencaAutoimune: false, outros: ''
}
const DEFAULT_INFECCAO: InfeccaoData = {
  febre: false, antibiotico: '', antibioticoDias: '',
  antibioticoPrevio: '', culturas: false, culturasResult: '', dreno: false
}
const DEFAULT_RISCO: RiscoData = {
  concluido: false, data: '', cardiologista: '', nivel: '', indicaUTI: false,
  faltaEco: false, dataEco: '', resultadoEco: '', faltaEcg: false, dataEcg: '',
}
const CLINICA_MEDICOS = [
  'Marcus Ferreira', 'Tais Moura', 'Tatiana Gonçalves', 'Heloisa Abdon', 'Ana Clara Noronha',
]

const SUBESPECIALIDADES = [
  'Quadril', 'Joelho', 'Ombro', 'Cotovelo', 'Mão e Micro',
  'Pé e Tornozelo', 'Coluna', 'Trauma', 'Oncológica', 'Infantil'
]
const COMORBIDADES_OPCOES = [
  { key: 'has', label: 'HAS' }, { key: 'dm2', label: 'DM2' },
  { key: 'tabagismo', label: 'Tabagismo' }, { key: 'etilismo', label: 'Etilismo' },
  { key: 'avc', label: 'AVC prévio' }, { key: 'iam', label: 'IAM prévio' },
  { key: 'drc', label: 'DRC' }, { key: 'osteoporose', label: 'Osteoporose' },
  { key: 'obesidade', label: 'Obesidade' }, { key: 'demencia', label: 'Demência' },
  { key: 'hipercolesterolemia', label: 'Hipercolesterolemia' },
  { key: 'hipotireoidismo', label: 'Hipotireoidismo' },
  { key: 'hipertireoidismo', label: 'Hipertireoidismo' },
  { key: 'cancer', label: 'Câncer' },
  { key: 'artrose', label: 'Artrose' },
  { key: 'doencaAutoimune', label: 'Doença Autoimune' },
] as const

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcularIdade(dataNascimento: string): string {
  if (!dataNascimento) return ''
  try {
    const anos = differenceInYears(new Date(), new Date(dataNascimento + 'T12:00:00'))
    return `${anos} ano${anos !== 1 ? 's' : ''}`
  } catch { return '' }
}

function calcularTempoInternacao(dataInternacao: string): string {
  if (!dataInternacao) return ''
  try {
    const dias = differenceInDays(new Date(), new Date(dataInternacao + 'T12:00:00'))
    if (dias < 0) return ''
    if (dias === 0) return 'Internação hoje'
    return `${dias} dia${dias !== 1 ? 's' : ''} internado`
  } catch { return '' }
}

function formatarCPF(valor: string): string {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 3) return nums
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`
}

function parseSafe<T>(json: string | undefined | null, fallback: T): T {
  if (!json) return fallback
  try { return JSON.parse(json) as T } catch { return fallback }
}

// ─── Props ───────────────────────────────────────────────────────────────────

type InitialValues = Omit<Partial<FormValues>, 'comorbidadesJson' | 'infeccaoJson' | 'prevCirurgiasJson' | 'medicamentosJson' | 'hemoglobinaAdm' | 'plaquetasAdm' | 'inrAdm' | 'pps' | 'riscoJson'> & {
  id?: string
  comorbidadesJson?: string
  infeccaoJson?: string
  prevCirurgiasJson?: string
  medicamentosJson?: string
  hemoglobinaAdm?: number | string | null
  plaquetasAdm?: number | string | null
  inrAdm?: number | string | null
  pps?: number | string | null
  riscoJson?: string
  altaOrtopediaData?: string | null
  altaHospitalarData?: string | null
}

type Props = { inicial?: InitialValues; modo: 'criar' | 'editar'; fotosSalvas?: FotaSalva[] }

// ─── Componente ──────────────────────────────────────────────────────────────

export default function PacienteForm({ inicial, modo, fotosSalvas }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const fotosPendentesRef = useRef<FotoPendente[]>([])
  const [usaMedicamentos, setUsaMedicamentos] = useState(
    !!(inicial?.medicamentosJson || inicial?.medicamentosComuns?.length || inicial?.medicamentosOutros || inicial?.medicacoes)
  )

  const [form, setForm] = useState<FormValues>({
    nome: inicial?.nome || '',
    leito: inicial?.leito || '',
    registroHospitalar: inicial?.registroHospitalar || '',
    cpf: inicial?.cpf || '',
    dataInternacao: inicial?.dataInternacao?.split('T')[0] || new Date().toISOString().split('T')[0],
    dataNascimento: inicial?.dataNascimento?.split('T')[0] || '',
    diagnostico: inicial?.diagnostico || '',
    cid: inicial?.cid || '',
    subespecialidade: inicial?.subespecialidade || '',
    cirurgioes: inicial?.cirurgioes || [''],
    tipoStatus: inicial?.tipoStatus || 'PRE_OPERATORIO',
    comorbidades: inicial?.comorbidades || '',
    comorbidadesJson: parseSafe<ComorbidadesData>(inicial?.comorbidadesJson, DEFAULT_COMORBIDADES),
    prevCirurgiasOrto: inicial?.prevCirurgiasOrto || false,
    prevCirurgiasJson: parseSafe<CirurgiaPrevia[]>(inicial?.prevCirurgiasJson, []),
    temAlergia: inicial?.temAlergia || false,
    alergias: inicial?.alergias || '',
    medicamentosJson: parseSafe<MedicamentoUso[]>(inicial?.medicamentosJson, []),
    medicamentosComuns: inicial?.medicamentosComuns || [],
    medicamentosOutros: inicial?.medicamentosOutros || '',
    medicacoes: inicial?.medicacoes || '',
    hemoglobinaAdm: inicial?.hemoglobinaAdm != null ? String(inicial.hemoglobinaAdm) : '',
    plaquetasAdm: inicial?.plaquetasAdm != null ? String(inicial.plaquetasAdm) : '',
    inrAdm: inicial?.inrAdm != null ? String(inicial.inrAdm) : '',
    pps: inicial?.pps != null ? String(inicial.pps) : '',
    temInfeccao: inicial?.temInfeccao || false,
    infeccaoJson: parseSafe<InfeccaoData>(inicial?.infeccaoJson, DEFAULT_INFECCAO),
    compSolturaAssetica: inicial?.compSolturaAssetica || false,
    compLuxacao: inicial?.compLuxacao || false,
    compFalhaImplante: inicial?.compFalhaImplante || false,
    compPseudoartrose: inicial?.compPseudoartrose || false,
    compOutro: inicial?.compOutro || '',
    traumaMecanismo: inicial?.traumaMecanismo || '',
    traumaData: inicial?.traumaData?.split?.('T')?.[0] || '',
    traumaTempo: inicial?.traumaTempo || '',
    cirurgias: inicial?.cirurgias || [],
    altaOrtopediaData: inicial?.altaOrtopediaData?.split?.('T')?.[0] || '',
    altaHospitalarData: inicial?.altaHospitalarData?.split?.('T')?.[0] || '',
    previsaoAltaOrto: inicial?.previsaoAltaOrto || '',
    clinicaMedico: inicial?.clinicaMedico || '',
    aguardaClinica: inicial?.aguardaClinica || false,
    riscoJson: parseSafe<RiscoData>(inicial?.riscoJson, DEFAULT_RISCO),
  })

  // ─── Alertas laboratoriais ────────────────────────────────────────────────

  const alertaHb = useMemo(() => {
    const v = parseFloat(form.hemoglobinaAdm)
    if (isNaN(v)) return null
    if (v < 10) return { msg: `Hb baixa (${v} g/dL) — pendência pré-op`, cor: 'text-red-700 bg-red-50 border-red-200' }
    return { msg: `Hb adequada (${v} g/dL)`, cor: 'text-green-700 bg-green-50 border-green-200' }
  }, [form.hemoglobinaAdm])

  const alertaPlaq = useMemo(() => {
    const v = parseFloat(form.plaquetasAdm)
    if (isNaN(v)) return null
    if (v < 100) return { msg: `Plaquetas baixas (${v}k) — pendência pré-op`, cor: 'text-red-700 bg-red-50 border-red-200' }
    return { msg: `Plaquetas adequadas (${v}k)`, cor: 'text-green-700 bg-green-50 border-green-200' }
  }, [form.plaquetasAdm])

  const alertaINR = useMemo(() => {
    const v = parseFloat(form.inrAdm)
    if (isNaN(v)) return null
    if (v > 1.5) return { msg: `INR alargado (${v}) — pendência pré-op`, cor: 'text-red-700 bg-red-50 border-red-200' }
    return { msg: `INR normal (${v})`, cor: 'text-green-700 bg-green-50 border-green-200' }
  }, [form.inrAdm])

  // ─── Alertas de suspensão de medicamentos ────────────────────────────────

  const medicamentosAlert = useMemo(() => {
    if (form.tipoStatus !== 'PRE_OPERATORIO') return []
    return form.medicamentosJson.map(m => {
      const info = MEDICAMENTOS_SUSPENSO.find(s => s.codigo === m.codigo)
      if (!info || !m.dataUltimoUso) return null
      const ultimoUso = new Date(m.dataUltimoUso + 'T12:00:00')
      const deveSuspender = addDays(ultimoUso, info.diasSuspensao)
      const jaPassou = deveSuspender <= new Date()
      return { nome: info.nome, obs: info.obs, deveSuspender, jaPassou }
    }).filter(Boolean)
  }, [form.medicamentosJson, form.tipoStatus])

  // ─── Helpers de lista ──────────────────────────────────────────────────────

  function atualizarCirurgiao(idx: number, valor: string) {
    const novos = [...form.cirurgioes]; novos[idx] = valor
    setForm({ ...form, cirurgioes: novos })
  }
  function adicionarCirurgiao() { setForm({ ...form, cirurgioes: [...form.cirurgioes, ''] }) }
  function removerCirurgiao(idx: number) {
    const novos = form.cirurgioes.filter((_, i) => i !== idx)
    setForm({ ...form, cirurgioes: novos.length ? novos : [''] })
  }
  function adicionarCirurgia() {
    setForm({ ...form, cirurgias: [...form.cirurgias, { nomeCirurgia: '', cirurgiao: '', dataCirurgia: '', hospitalExterno: '' }] })
  }
  function atualizarCirurgia(idx: number, campo: keyof Cirurgia, valor: string) {
    setForm({ ...form, cirurgias: form.cirurgias.map((c, i) => i === idx ? { ...c, [campo]: valor } : c) })
  }
  function removerCirurgia(idx: number) {
    setForm({ ...form, cirurgias: form.cirurgias.filter((_, i) => i !== idx) })
  }
  function adicionarCirurgiaPrevia() {
    setForm({ ...form, prevCirurgiasJson: [...form.prevCirurgiasJson, { nome: '', quando: '', cirurgiao: '' }] })
  }
  function atualizarCirurgiaPrevia(idx: number, campo: keyof CirurgiaPrevia, valor: string) {
    setForm({ ...form, prevCirurgiasJson: form.prevCirurgiasJson.map((c, i) => i === idx ? { ...c, [campo]: valor } : c) })
  }
  function removerCirurgiaPrevia(idx: number) {
    setForm({ ...form, prevCirurgiasJson: form.prevCirurgiasJson.filter((_, i) => i !== idx) })
  }
  function toggleMedicamento(codigo: string) {
    const atual = form.medicamentosJson.find(m => m.codigo === codigo)
    if (atual) {
      setForm({ ...form, medicamentosJson: form.medicamentosJson.filter(m => m.codigo !== codigo) })
    } else {
      setForm({ ...form, medicamentosJson: [...form.medicamentosJson, { codigo, dataUltimoUso: '' }] })
    }
  }
  function atualizarMedicamento(codigo: string, dataUltimoUso: string) {
    setForm({ ...form, medicamentosJson: form.medicamentosJson.map(m => m.codigo === codigo ? { ...m, dataUltimoUso } : m) })
  }
  function setComorbidade(key: keyof ComorbidadesData, valor: boolean | string) {
    setForm({ ...form, comorbidadesJson: { ...form.comorbidadesJson, [key]: valor } })
  }
  function setInfeccao(key: keyof InfeccaoData, valor: boolean | string) {
    setForm({ ...form, infeccaoJson: { ...form.infeccaoJson, [key]: valor } })
  }
  function setRisco(key: keyof RiscoData, valor: boolean | string) {
    setForm({ ...form, riscoJson: { ...form.riscoJson, [key]: valor } })
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      ...form,
      cpf: form.cpf || null,
      cirurgioes: form.cirurgioes.filter(Boolean),
      cirurgias: form.tipoStatus === 'POS_OPERATORIO' ? form.cirurgias.filter(c => c.nomeCirurgia) : [],
      traumaData: form.traumaData || null,
      comorbidadesJson: JSON.stringify(form.comorbidadesJson),
      prevCirurgiasJson: form.prevCirurgiasOrto ? JSON.stringify(form.prevCirurgiasJson) : null,
      medicamentosJson: form.medicamentosJson.length ? JSON.stringify(form.medicamentosJson) : null,
      // Merge medicamentosComuns + outros into medicacoes for storage
      medicacoes: [
        ...form.medicamentosComuns,
        ...(form.medicamentosOutros ? [form.medicamentosOutros] : []),
        ...(form.medicacoes ? [form.medicacoes] : []),
      ].filter(Boolean).join(', ') || null,
      infeccaoJson: form.temInfeccao ? JSON.stringify(form.infeccaoJson) : null,
      hemoglobinaAdm: form.hemoglobinaAdm ? parseFloat(form.hemoglobinaAdm) : null,
      plaquetasAdm: form.plaquetasAdm ? parseFloat(form.plaquetasAdm) : null,
      inrAdm: form.inrAdm ? parseFloat(form.inrAdm) : null,
      pps: form.pps ? parseInt(form.pps) : null,
      altaOrtopediaData: form.altaOrtopediaData || null,
      altaHospitalarData: form.altaHospitalarData || null,
      previsaoAltaOrto: form.previsaoAltaOrto || null,
      clinicaMedico: form.clinicaMedico || null,
      aguardaClinica: form.aguardaClinica,
      riscoJson: JSON.stringify(form.riscoJson),
    }

    try {
      const url = modo === 'criar' ? '/api/pacientes' : `/api/pacientes/${inicial?.id}`
      const method = modo === 'criar' ? 'POST' : 'PUT'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro desconhecido')
      }
      const paciente = await res.json()

      // Upload fotos pendentes (só no modo criar, onde não há pacienteId ainda)
      if (modo === 'criar' && fotosPendentesRef.current.length > 0) {
        await Promise.all(fotosPendentesRef.current.map(async foto => {
          const fd = new FormData()
          fd.append('file', foto.file)
          fd.append('tipo', foto.tipo)
          if (foto.dataFoto) fd.append('dataFoto', foto.dataFoto)
          if (foto.descricao) fd.append('descricao', foto.descricao)
          await fetch(`/api/pacientes/${paciente.id}/fotos`, { method: 'POST', body: fd })
        }))
      }

      toast.success(modo === 'criar' ? 'Paciente cadastrado!' : 'Dados atualizados!')
      router.push(`/pacientes/${paciente.id}`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const idade = calcularIdade(form.dataNascimento)
  const tempoInternacao = calcularTempoInternacao(form.dataInternacao)

  function calcularDPO(dataCirurgia: string): string {
    if (!dataCirurgia) return ''
    try {
      const diff = differenceInDays(new Date(), new Date(dataCirurgia + 'T12:00:00'))
      if (diff < 0) return ''
      if (diff === 0) return '0° DPO (dia da cirurgia)'
      return `${diff}° DPO`
    } catch { return '' }
  }

  function calcularDiasAlta(dataAlta: string, label: string): string {
    if (!dataAlta) return ''
    try {
      const diff = differenceInDays(new Date(), new Date(dataAlta + 'T12:00:00'))
      if (diff < 0) return `Alta prevista em ${Math.abs(diff)} dia${Math.abs(diff) !== 1 ? 's' : ''}`
      if (diff === 0) return `${label} hoje`
      return `${label} há ${diff} dia${diff !== 1 ? 's' : ''}`
    } catch { return '' }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl mx-auto">

      {/* 1. Dados Básicos */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Dados do Paciente</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input id="nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" value={form.cpf} onChange={e => setForm({ ...form, cpf: formatarCPF(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="registro">Registro hospitalar *</Label>
            <Input id="registro" value={form.registroHospitalar} onChange={e => setForm({ ...form, registroHospitalar: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="leito">Leito *</Label>
            <Input id="leito" value={form.leito} onChange={e => setForm({ ...form, leito: e.target.value })} placeholder="Ex: 201A" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataInternacao">Data de internação *</Label>
            <Input id="dataInternacao" type="date" value={form.dataInternacao} onChange={e => setForm({ ...form, dataInternacao: e.target.value })} required />
            {tempoInternacao && <p className="text-xs text-blue-600 font-medium mt-1">🏥 {tempoInternacao}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataNascimento">Data de nascimento</Label>
            <Input id="dataNascimento" type="date" value={form.dataNascimento} onChange={e => setForm({ ...form, dataNascimento: e.target.value })} />
            {idade && <p className="text-xs text-slate-500 font-medium mt-1">👤 {idade}</p>}
          </div>
        </CardContent>
      </Card>

      {/* 2. Diagnóstico */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Diagnóstico</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="diagnostico">Diagnóstico *</Label>
            <Input id="diagnostico" value={form.diagnostico} onChange={e => setForm({ ...form, diagnostico: e.target.value })} placeholder="Ex: Fratura transtrocantérica do fêmur direito" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cid">CID-10</Label>
            <Input id="cid" value={form.cid} onChange={e => setForm({ ...form, cid: e.target.value })} placeholder="Ex: S72.1" />
          </div>
          <div className="space-y-1.5">
            <Label>Subespecialidade</Label>
            <Select value={form.subespecialidade} onValueChange={v => v && setForm({ ...form, subespecialidade: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
              <SelectContent>{SUBESPECIALIDADES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Cirurgião(s) responsável(is)</Label>
            <CirurgiaoMultiSelect
              value={form.cirurgioes.filter(Boolean)}
              onChange={v => setForm({ ...form, cirurgioes: v.length ? v : [''] })}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Status cirúrgico *</Label>
            <div className="flex gap-4">
              {[{ value: 'PRE_OPERATORIO', label: 'Pré-operatório' }, { value: 'POS_OPERATORIO', label: 'Pós-operatório' }].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipoStatus" value={opt.value} checked={form.tipoStatus === opt.value} onChange={() => setForm({ ...form, tipoStatus: opt.value })} className="accent-blue-600" />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Cirurgias realizadas (pós-op) */}
      {form.tipoStatus === 'POS_OPERATORIO' && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Cirurgias realizadas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {form.cirurgias.map((c, idx) => (
              <div key={idx} className="p-3 border border-slate-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Cirurgia {idx + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removerCirurgia(idx)}>✕</Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Nome da cirurgia</Label>
                    <Input value={c.nomeCirurgia} onChange={e => atualizarCirurgia(idx, 'nomeCirurgia', e.target.value)} placeholder="Ex: Artroplastia Total do Quadril (ATQ)" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cirurgião</Label>
                    <Input value={c.cirurgiao} onChange={e => atualizarCirurgia(idx, 'cirurgiao', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data da cirurgia</Label>
                    <Input type="date" value={c.dataCirurgia} onChange={e => atualizarCirurgia(idx, 'dataCirurgia', e.target.value)} />
                    {c.dataCirurgia && (
                      <p className="text-xs font-semibold text-blue-700 mt-1">
                        {calcularDPO(c.dataCirurgia)}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Hospital externo (se aplicável)</Label>
                    <Input value={c.hospitalExterno || ''} onChange={e => atualizarCirurgia(idx, 'hospitalExterno', e.target.value)} placeholder="Deixar em branco se foi neste hospital" />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={adicionarCirurgia}>+ Adicionar cirurgia</Button>
          </CardContent>
        </Card>
      )}

      {/* 4. Comorbidades */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Comorbidades</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COMORBIDADES_OPCOES.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox checked={form.comorbidadesJson[key]} onCheckedChange={v => setComorbidade(key, Boolean(v))} />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comorbOutros">Outras comorbidades</Label>
            <Input id="comorbOutros" value={form.comorbidadesJson.outros} onChange={e => setComorbidade('outros', e.target.value)} placeholder="Ex: Insuficiência cardíaca, DPOC…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comorbidades">Detalhes adicionais (livre)</Label>
            <Textarea id="comorbidades" value={form.comorbidades} onChange={e => setForm({ ...form, comorbidades: e.target.value })} placeholder="Informações adicionais sobre comorbidades…" rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* 5. Cirurgias ortopédicas prévias */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Cirurgias ortopédicas prévias</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox checked={form.prevCirurgiasOrto} onCheckedChange={v => setForm({ ...form, prevCirurgiasOrto: Boolean(v), prevCirurgiasJson: Boolean(v) ? form.prevCirurgiasJson : [] })} />
            <span className="text-sm font-medium">Paciente tem cirurgias ortopédicas prévias</span>
          </label>
          {form.prevCirurgiasOrto && (
            <div className="space-y-3">
              {form.prevCirurgiasJson.map((c, idx) => (
                <div key={idx} className="p-3 border border-slate-200 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Cirurgia prévia {idx + 1}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removerCirurgiaPrevia(idx)}>✕</Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Procedimento</Label>
                      <Input value={c.nome} onChange={e => atualizarCirurgiaPrevia(idx, 'nome', e.target.value)} placeholder="Ex: ATQ direito" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Quando (data/ano)</Label>
                      <Input value={c.quando} onChange={e => atualizarCirurgiaPrevia(idx, 'quando', e.target.value)} placeholder="Ex: jan/2020" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cirurgião</Label>
                      <Input value={c.cirurgiao} onChange={e => atualizarCirurgiaPrevia(idx, 'cirurgiao', e.target.value)} placeholder="Nome" />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={adicionarCirurgiaPrevia}>+ Adicionar cirurgia prévia</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Medicamentos de uso contínuo */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Medicamentos de uso contínuo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {(['sim', 'nao'] as const).map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="radio" name="usaMedicamentos" value={v}
                  checked={usaMedicamentos === (v === 'sim')}
                  onChange={() => {
                    setUsaMedicamentos(v === 'sim')
                    if (v === 'nao') setForm({ ...form, medicamentosJson: [], medicamentosComuns: [], medicamentosOutros: '', medicacoes: '' })
                  }}
                  className="accent-blue-600" />
                <span className="text-sm font-medium">{v === 'sim' ? 'Sim' : 'Não'}</span>
              </label>
            ))}
          </div>

          {usaMedicamentos && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Marque os medicamentos com suspensão pré-operatória obrigatória e informe a data do último uso.</p>
          <div className="space-y-2">
            {MEDICAMENTOS_SUSPENSO.map(med => {
              const usado = form.medicamentosJson.find(m => m.codigo === med.codigo)
              return (
                <div key={med.codigo} className={`rounded-lg border p-3 transition-colors ${usado ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox checked={!!usado} onCheckedChange={() => toggleMedicamento(med.codigo)} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{med.nome}</p>
                      <p className="text-xs text-amber-700 font-medium">Suspender: {med.obs}</p>
                      {usado && (
                        <div className="mt-2 flex items-center gap-2">
                          <Label className="text-xs whitespace-nowrap text-slate-600">Último uso:</Label>
                          <Input type="date" value={usado.dataUltimoUso} onChange={e => atualizarMedicamento(med.codigo, e.target.value)} className="h-7 text-xs py-0 w-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {medicamentosAlert.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">Status de suspensão:</p>
              {medicamentosAlert.map((a, i) => a && (
                <div key={i} className={`text-xs px-3 py-2 rounded-lg font-medium border ${a.jaPassou ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {a.jaPassou ? '✅' : '⚠️'} {a.nome} — {a.obs} — {a.jaPassou ? 'suspensão concluída' : `deve suspender até ${format(a.deveSuspender, 'dd/MM/yyyy')}`}
                </div>
              ))}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="medicacoes">Outros medicamentos (livre)</Label>
            <Textarea id="medicacoes" value={form.medicacoes} onChange={e => setForm({ ...form, medicacoes: e.target.value })} placeholder="Losartana 50mg, Sinvastatina 40mg…" rows={2} />
          </div>
          {/* Medicamentos comuns (sem suspensão) */}
          <div className="space-y-2 mt-2 border-t border-slate-100 pt-3">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Medicamentos comuns de uso contínuo</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MEDICAMENTOS_COMUNS.map(med => (
                <label key={med} className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={form.medicamentosComuns.includes(med)}
                    onCheckedChange={v => {
                      const atual = form.medicamentosComuns
                      setForm({ ...form, medicamentosComuns: v ? [...atual, med] : atual.filter(m => m !== med) })
                    }}
                  />
                  <span className="text-sm">{med}</span>
                </label>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="medicamentosOutros" className="text-xs text-slate-500">Outros (sem suspensão pré-op)</Label>
              <Input id="medicamentosOutros" value={form.medicamentosOutros} onChange={e => setForm({ ...form, medicamentosOutros: e.target.value })} placeholder="Nome da medicação…" />
            </div>
          </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. Alergias */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Alergias a medicamentos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox checked={form.temAlergia} onCheckedChange={v => setForm({ ...form, temAlergia: Boolean(v), alergias: Boolean(v) ? form.alergias : '' })} />
            <span className="text-sm font-medium">Paciente tem alergia a medicamentos</span>
          </label>
          {form.temAlergia && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl">
              <p className="text-xs font-bold text-red-700 mb-2">⚠️ ALERTA — será exibido no prontuário e bloqueará medicamentos conflitantes na prescrição</p>
              <Label htmlFor="alergias" className="text-xs text-red-700">Medicamento(s) com alergia (separar por vírgula)</Label>
              <Input id="alergias" value={form.alergias} onChange={e => setForm({ ...form, alergias: e.target.value })} placeholder="Ex: Dipirona, penicilina, sulfa" className="mt-1 border-red-300 focus:ring-red-500" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 8. Alertas laboratoriais */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Exames laboratoriais — Admissão</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="hb">Hemoglobina (g/dL)</Label>
            <Input id="hb" type="number" step="0.1" value={form.hemoglobinaAdm} onChange={e => setForm({ ...form, hemoglobinaAdm: e.target.value })} placeholder="Ex: 11.5" />
            {alertaHb && <p className={`text-xs font-medium mt-1 px-2 py-1 rounded border ${alertaHb.cor}`}>{alertaHb.msg}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plaq">Plaquetas (mil/μL)</Label>
            <Input id="plaq" type="number" step="1" value={form.plaquetasAdm} onChange={e => setForm({ ...form, plaquetasAdm: e.target.value })} placeholder="Ex: 180" />
            {alertaPlaq && <p className={`text-xs font-medium mt-1 px-2 py-1 rounded border ${alertaPlaq.cor}`}>{alertaPlaq.msg}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inr">INR</Label>
            <Input id="inr" type="number" step="0.01" value={form.inrAdm} onChange={e => setForm({ ...form, inrAdm: e.target.value })} placeholder="Ex: 1.1" />
            {alertaINR && <p className={`text-xs font-medium mt-1 px-2 py-1 rounded border ${alertaINR.cor}`}>{alertaINR.msg}</p>}
          </div>
        </CardContent>
      </Card>

      {/* 9. Infecção */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Infecção ortopédica</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox checked={form.temInfeccao} onCheckedChange={v => setForm({ ...form, temInfeccao: Boolean(v) })} />
            <span className="text-sm font-medium text-red-700">Paciente com infecção ortopédica</span>
          </label>
          {form.temInfeccao && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox checked={form.infeccaoJson.febre} onCheckedChange={v => setInfeccao('febre', Boolean(v))} />
                <span className="text-sm font-medium">Está tendo febre</span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Antibiótico atual</Label>
                  <Input value={form.infeccaoJson.antibiotico} onChange={e => setInfeccao('antibiotico', e.target.value)} placeholder="Ex: Vancomicina 1g EV 12/12h" />
                </div>
                <div className="space-y-1.5">
                  <Label>Início do antibiótico</Label>
                  <Input type="date" value={form.infeccaoJson.antibioticoDias} onChange={e => setInfeccao('antibioticoDias', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Antibióticos prévios</Label>
                  <Input value={form.infeccaoJson.antibioticoPrevio} onChange={e => setInfeccao('antibioticoPrevio', e.target.value)} placeholder="Ex: Cefazolina, Ciprofloxacino" />
                </div>
                <div className="space-y-1.5">
                  <Label>Resultado das culturas</Label>
                  <Input value={form.infeccaoJson.culturasResult} onChange={e => setInfeccao('culturasResult', e.target.value)} placeholder="Ex: S. aureus MRSA" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox checked={form.infeccaoJson.culturas} onCheckedChange={v => setInfeccao('culturas', Boolean(v))} />
                  <span className="text-sm">Culturas solicitadas</span>
                </label>
                {form.tipoStatus === 'POS_OPERATORIO' && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox checked={form.infeccaoJson.dreno} onCheckedChange={v => setInfeccao('dreno', Boolean(v))} />
                    <span className="text-sm">Tem dreno (registrar valor nas evoluções)</span>
                  </label>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 10. Complicações */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Complicações</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'compSolturaAssetica', label: 'Soltura asséptica' },
            { key: 'compLuxacao', label: 'Luxação' },
            { key: 'compFalhaImplante', label: 'Falha de implante' },
            { key: 'compPseudoartrose', label: 'Pseudoartrose' },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox checked={Boolean(form[item.key as keyof FormValues])} onCheckedChange={v => setForm({ ...form, [item.key]: Boolean(v) })} />
              <span className="text-sm">{item.label}</span>
            </label>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="compOutro">Outra complicação</Label>
            <Input id="compOutro" value={form.compOutro} onChange={e => setForm({ ...form, compOutro: e.target.value })} placeholder="Descrever…" />
          </div>
        </CardContent>
      </Card>

      {/* 11. Trauma */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Trauma</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="traumaMecanismo">Mecanismo do trauma</Label>
            <Input id="traumaMecanismo" value={form.traumaMecanismo} onChange={e => setForm({ ...form, traumaMecanismo: e.target.value })} placeholder="Ex: Queda da própria altura, acidente de trânsito…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="traumaData">Data do trauma</Label>
            <Input id="traumaData" type="date" value={form.traumaData} onChange={e => setForm({ ...form, traumaData: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="traumaTempo">Tempo do trauma</Label>
            <Input id="traumaTempo" value={form.traumaTempo} onChange={e => setForm({ ...form, traumaTempo: e.target.value })} placeholder="Ex: 3 dias, 2 semanas…" />
          </div>
        </CardContent>
      </Card>

      {/* 12. PPS */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">PPS — Escala de Performance Paliativa</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">Avalia o estado funcional. Quando calculado, será exibido nas comorbidades do prontuário.</p>
          <Select value={form.pps} onValueChange={v => setForm({ ...form, pps: v ?? '' })}>
            <SelectTrigger><SelectValue placeholder="Selecionar nível PPS…" /></SelectTrigger>
            <SelectContent>
              {PPS_NIVEIS.map(n => <SelectItem key={n.valor} value={String(n.valor)}>{n.desc}</SelectItem>)}
            </SelectContent>
          </Select>
          {form.pps && (
            <p className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">PPS: {form.pps}%</p>
          )}
        </CardContent>
      </Card>

      {/* 13. Alta e follow-up (pós-op) */}
      {form.tipoStatus === 'POS_OPERATORIO' && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Alta e follow-up</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Data de alta da Ortopedia</Label>
              <Input type="date" value={form.altaOrtopediaData} onChange={e => setForm({ ...form, altaOrtopediaData: e.target.value })} />
              {form.altaOrtopediaData && <p className="text-xs text-blue-600 font-medium">{calcularDiasAlta(form.altaOrtopediaData, 'Alta da Ortopedia')}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Data de alta hospitalar</Label>
              <Input type="date" value={form.altaHospitalarData} onChange={e => setForm({ ...form, altaHospitalarData: e.target.value })} />
              {form.altaHospitalarData && <p className="text-xs text-green-600 font-medium">{calcularDiasAlta(form.altaHospitalarData, 'Alta hospitalar')}</p>}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Previsão de alta da Ortopedia</Label>
              <Input value={form.previsaoAltaOrto} onChange={e => setForm({ ...form, previsaoAltaOrto: e.target.value })} placeholder="Ex: 2 dias após cirurgia, 3° DPO…" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 14. Clínica médica */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Acompanhamento pela Clínica Médica</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox checked={form.aguardaClinica} onCheckedChange={v => setForm({ ...form, aguardaClinica: Boolean(v), clinicaMedico: Boolean(v) ? '' : form.clinicaMedico })} />
            <span className="text-sm font-medium text-amber-700">Aguarda avaliação da clínica médica (gerar pendência)</span>
          </label>
          {!form.aguardaClinica && (
            <div className="space-y-1.5">
              <Label>Médico(a) da Clínica Médica</Label>
              <Select value={form.clinicaMedico} onValueChange={v => setForm({ ...form, clinicaMedico: (v === '__nenhum' ? '' : v) ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Selecionar ou deixar em branco…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__nenhum">Sem acompanhamento</SelectItem>
                  {CLINICA_MEDICOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 15. Risco cirúrgico */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Risco Cirúrgico (Cardiologia)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {(['concluido', 'pendente'] as const).map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="radio" name="riscoConcluido" checked={form.riscoJson.concluido === (v === 'concluido')}
                  onChange={() => setRisco('concluido', v === 'concluido')} className="accent-blue-600" />
                <span className="text-sm font-medium">{v === 'concluido' ? 'Concluído' : 'Pendente'}</span>
              </label>
            ))}
          </div>

          {form.riscoJson.concluido && (
            <div className="space-y-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Data da avaliação</Label>
                  <Input type="date" value={form.riscoJson.data} onChange={e => setRisco('data', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cardiologista</Label>
                  <Input value={form.riscoJson.cardiologista} onChange={e => setRisco('cardiologista', e.target.value)} placeholder="Dr(a). Nome" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nível de risco</Label>
                <div className="flex gap-3">
                  {(['leve', 'moderado', 'alto'] as const).map(n => (
                    <label key={n} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="radio" name="riscoNivel" value={n} checked={form.riscoJson.nivel === n}
                        onChange={() => setRisco('nivel', n)} className="accent-blue-600" />
                      <span className={`text-sm capitalize font-medium ${n === 'alto' ? 'text-red-700' : n === 'moderado' ? 'text-amber-700' : 'text-green-700'}`}>{n}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox checked={form.riscoJson.indicaUTI} onCheckedChange={v => setRisco('indicaUTI', Boolean(v))} />
                <span className="text-sm font-semibold text-red-700">⚠️ Indicação de UTI pós-operatória</span>
              </label>
            </div>
          )}

          {!form.riscoJson.concluido && (
            <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox checked={form.riscoJson.faltaEco} onCheckedChange={v => setRisco('faltaEco', Boolean(v))} />
                    <span className="text-sm">Falta realizar Ecocardiograma</span>
                  </label>
                  {!form.riscoJson.faltaEco && (
                    <div className="mt-2 space-y-2 pl-6">
                      <div className="space-y-1">
                        <Label className="text-xs">Data do ECO</Label>
                        <Input type="date" value={form.riscoJson.dataEco} onChange={e => setRisco('dataEco', e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Resultado do ECO</Label>
                        <Input value={form.riscoJson.resultadoEco} onChange={e => setRisco('resultadoEco', e.target.value)} placeholder="Ex: FE 60%, sem alterações" className="h-8 text-sm" />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox checked={form.riscoJson.faltaEcg} onCheckedChange={v => setRisco('faltaEcg', Boolean(v))} />
                    <span className="text-sm">Falta realizar ECG</span>
                  </label>
                  {!form.riscoJson.faltaEcg && (
                    <div className="mt-2 pl-6">
                      <Label className="text-xs">Data do ECG</Label>
                      <Input type="date" value={form.riscoJson.dataEcg} onChange={e => setRisco('dataEcg', e.target.value)} className="h-8 text-sm mt-1" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 16. Fotos (radiografias e lesões) */}
      <FotoUploadSection
        pacienteId={modo === 'editar' ? inicial?.id : undefined}
        fotosSalvas={fotosSalvas}
        onFotosPendentes={fotos => { fotosPendentesRef.current = fotos }}
      />

      {/* Botões */}
      <div className="flex gap-3 justify-end pb-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
          {loading ? 'Salvando…' : modo === 'criar' ? 'Cadastrar Paciente' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  )
}

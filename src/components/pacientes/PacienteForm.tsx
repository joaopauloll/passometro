'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

type Cirurgia = {
  nomeCirurgia: string
  cirurgiao: string
  dataCirurgia: string
  hospitalExterno?: string
}

type PacienteFormValues = {
  nome: string
  leito: string
  registroHospitalar: string
  dataInternacao: string
  dataNascimento: string
  diagnostico: string
  cid: string
  subespecialidade: string
  cirurgioes: string[]
  tipoStatus: string
  comorbidades: string
  medicacoes: string
  alergias: string
  temInfeccao: boolean
  cirurgias: Cirurgia[]
}

const SUBESPECIALIDADES = [
  'Quadril', 'Joelho', 'Ombro', 'Cotovelo', 'Mão e Punho', 'Pé e Tornozelo',
  'Coluna', 'Trauma', 'Oncologia', 'Pediatria', 'Tumores'
]

type Props = {
  inicial?: Partial<PacienteFormValues> & { id?: string }
  modo: 'criar' | 'editar'
}

export default function PacienteForm({ inicial, modo }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState<PacienteFormValues>({
    nome: inicial?.nome || '',
    leito: inicial?.leito || '',
    registroHospitalar: inicial?.registroHospitalar || '',
    dataInternacao: inicial?.dataInternacao?.split('T')[0] || new Date().toISOString().split('T')[0],
    dataNascimento: inicial?.dataNascimento?.split('T')[0] || '',
    diagnostico: inicial?.diagnostico || '',
    cid: inicial?.cid || '',
    subespecialidade: inicial?.subespecialidade || '',
    cirurgioes: inicial?.cirurgioes || [''],
    tipoStatus: inicial?.tipoStatus || 'PRE_OPERATORIO',
    comorbidades: inicial?.comorbidades || '',
    medicacoes: inicial?.medicacoes || '',
    alergias: inicial?.alergias || '',
    temInfeccao: inicial?.temInfeccao || false,
    cirurgias: inicial?.cirurgias || [],
  })

  function atualizarCirurgiao(idx: number, valor: string) {
    const novos = [...form.cirurgioes]
    novos[idx] = valor
    setForm({ ...form, cirurgioes: novos })
  }

  function adicionarCirurgiao() {
    setForm({ ...form, cirurgioes: [...form.cirurgioes, ''] })
  }

  function removerCirurgiao(idx: number) {
    const novos = form.cirurgioes.filter((_, i) => i !== idx)
    setForm({ ...form, cirurgioes: novos.length ? novos : [''] })
  }

  function adicionarCirurgia() {
    setForm({
      ...form,
      cirurgias: [...form.cirurgias, { nomeCirurgia: '', cirurgiao: '', dataCirurgia: '', hospitalExterno: '' }],
    })
  }

  function atualizarCirurgia(idx: number, campo: keyof Cirurgia, valor: string) {
    const novas = form.cirurgias.map((c, i) => (i === idx ? { ...c, [campo]: valor } : c))
    setForm({ ...form, cirurgias: novas })
  }

  function removerCirurgia(idx: number) {
    setForm({ ...form, cirurgias: form.cirurgias.filter((_, i) => i !== idx) })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      ...form,
      cirurgioes: form.cirurgioes.filter(Boolean),
      cirurgias: form.tipoStatus === 'POS_OPERATORIO' ? form.cirurgias.filter((c) => c.nomeCirurgia) : [],
    }

    try {
      const url = modo === 'criar' ? '/api/pacientes' : `/api/pacientes/${inicial?.id}`
      const method = modo === 'criar' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro desconhecido')
      }

      const paciente = await res.json()
      toast.success(modo === 'criar' ? 'Paciente cadastrado!' : 'Dados atualizados!')
      router.push(`/pacientes/${paciente.id}`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Dados básicos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados do Paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="leito">Leito *</Label>
            <Input id="leito" value={form.leito} onChange={(e) => setForm({ ...form, leito: e.target.value })} placeholder="Ex: 201A" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="registro">Registro hospitalar *</Label>
            <Input id="registro" value={form.registroHospitalar} onChange={(e) => setForm({ ...form, registroHospitalar: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataInternacao">Data de internação *</Label>
            <Input id="dataInternacao" type="date" value={form.dataInternacao} onChange={(e) => setForm({ ...form, dataInternacao: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataNascimento">Data de nascimento</Label>
            <Input id="dataNascimento" type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Diagnóstico */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="diagnostico">Diagnóstico *</Label>
            <Input id="diagnostico" value={form.diagnostico} onChange={(e) => setForm({ ...form, diagnostico: e.target.value })} placeholder="Ex: Fratura transtrocantérica do fêmur direito" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cid">CID-10</Label>
            <Input id="cid" value={form.cid} onChange={(e) => setForm({ ...form, cid: e.target.value })} placeholder="Ex: S72.1" />
          </div>
          <div className="space-y-1.5">
            <Label>Subespecialidade</Label>
            <Select value={form.subespecialidade} onValueChange={(v) => v && setForm({ ...form, subespecialidade: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar…" />
              </SelectTrigger>
              <SelectContent>
                {SUBESPECIALIDADES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Cirurgiões */}
          <div className="sm:col-span-2 space-y-2">
            <Label>Cirurgião(s) responsável(is)</Label>
            {form.cirurgioes.map((c, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={c}
                  onChange={(e) => atualizarCirurgiao(idx, e.target.value)}
                  placeholder="Nome do cirurgião"
                  className="flex-1"
                />
                {form.cirurgioes.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removerCirurgiao(idx)}>✕</Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={adicionarCirurgiao}>
              + Adicionar cirurgião
            </Button>
          </div>

          {/* Pré/Pós-op */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Status cirúrgico *</Label>
            <div className="flex gap-4">
              {[
                { value: 'PRE_OPERATORIO', label: 'Pré-operatório' },
                { value: 'POS_OPERATORIO', label: 'Pós-operatório' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoStatus"
                    value={opt.value}
                    checked={form.tipoStatus === opt.value}
                    onChange={() => setForm({ ...form, tipoStatus: opt.value })}
                    className="accent-blue-600"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cirurgias (se pós-op) */}
      {form.tipoStatus === 'POS_OPERATORIO' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cirurgias realizadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.cirurgias.map((c, idx) => (
              <div key={idx} className="p-3 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Cirurgia {idx + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removerCirurgia(idx)}>✕</Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Nome da cirurgia</Label>
                    <Input value={c.nomeCirurgia} onChange={(e) => atualizarCirurgia(idx, 'nomeCirurgia', e.target.value)} placeholder="Ex: Artroplastia Total do Quadril" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cirurgião</Label>
                    <Input value={c.cirurgiao} onChange={(e) => atualizarCirurgia(idx, 'cirurgiao', e.target.value)} placeholder="Nome do cirurgião" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data da cirurgia</Label>
                    <Input type="date" value={c.dataCirurgia} onChange={(e) => atualizarCirurgia(idx, 'dataCirurgia', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Hospital externo (se aplicável)</Label>
                    <Input value={c.hospitalExterno || ''} onChange={(e) => atualizarCirurgia(idx, 'hospitalExterno', e.target.value)} placeholder="Deixar em branco se foi neste hospital" />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={adicionarCirurgia}>
              + Adicionar cirurgia
            </Button>
          </CardContent>
        </Card>
      )}

      {/* História clínica */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">História Clínica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="comorbidades">Comorbidades</Label>
            <Textarea id="comorbidades" value={form.comorbidades} onChange={(e) => setForm({ ...form, comorbidades: e.target.value })} placeholder="HAS, DM2, IRC…" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="medicacoes">Medicações de uso contínuo</Label>
            <Textarea id="medicacoes" value={form.medicacoes} onChange={(e) => setForm({ ...form, medicacoes: e.target.value })} placeholder="Losartana 50mg, Metformina 850mg…" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="alergias">Alergias</Label>
            <Input id="alergias" value={form.alergias} onChange={(e) => setForm({ ...form, alergias: e.target.value })} placeholder="Dipirona, penicilina…" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="infeccao"
              checked={form.temInfeccao}
              onCheckedChange={(v) => setForm({ ...form, temInfeccao: Boolean(v) })}
            />
            <Label htmlFor="infeccao" className="cursor-pointer text-red-700 font-medium">
              Paciente com infecção ortopédica
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? 'Salvando…' : modo === 'criar' ? 'Cadastrar Paciente' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Config = {
  hospitalNome: string
  hospitalLogotipoUrl: string
  hospitalEndereco: string
  hospitalTelefone: string
  ambulatorioEndereco: string
  ambulatorioTelefone: string
}

const DEFAULT: Config = {
  hospitalNome: 'Hospital Memorial',
  hospitalLogotipoUrl: '',
  hospitalEndereco: '',
  hospitalTelefone: '',
  ambulatorioEndereco: '',
  ambulatorioTelefone: '',
}

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<Config>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/configuracoes')
      .then(r => r.json())
      .then(data => setForm({
        hospitalNome: data.hospitalNome || '',
        hospitalLogotipoUrl: data.hospitalLogotipoUrl || '',
        hospitalEndereco: data.hospitalEndereco || '',
        hospitalTelefone: data.hospitalTelefone || '',
        ambulatorioEndereco: data.ambulatorioEndereco || '',
        ambulatorioTelefone: data.ambulatorioTelefone || '',
      }))
      .finally(() => setLoading(false))
  }, [])

  async function uploadLogo(file: File) {
    setUploadingLogo(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/configuracoes/logo', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setForm(f => ({ ...f, hospitalLogotipoUrl: url + '?t=' + Date.now() }))
      toast.success('Logotipo atualizado!')
    } else {
      toast.error('Erro ao enviar logotipo')
    }
    setUploadingLogo(false)
  }

  async function salvar() {
    setSaving(true)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-16 text-slate-400">Carregando…</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm mt-0.5">Dados do hospital e ambulatório usados nos documentos</p>
      </div>

      <div className="space-y-5">
        {/* Hospital */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">🏥 Hospital</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome do hospital *</Label>
              <Input value={form.hospitalNome} onChange={e => setForm({ ...form, hospitalNome: e.target.value })} placeholder="Ex: Hospital Memorial" />
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label>Logotipo</Label>
              <div className="flex items-center gap-4">
                {form.hospitalLogotipoUrl ? (
                  <img src={form.hospitalLogotipoUrl.split('?')[0]} alt="Logo" className="h-16 w-auto rounded-lg border border-slate-200 object-contain p-1 bg-white" />
                ) : (
                  <div className="h-16 w-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">Sem logo</div>
                )}
                <div>
                  <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}>
                    {uploadingLogo ? 'Enviando…' : '📎 Enviar logotipo'}
                  </Button>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG ou SVG. Máx 2MB.</p>
                  <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden" onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input value={form.hospitalEndereco} onChange={e => setForm({ ...form, hospitalEndereco: e.target.value })} placeholder="Rua, número, bairro, cidade - UF, CEP" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.hospitalTelefone} onChange={e => setForm({ ...form, hospitalTelefone: e.target.value })} placeholder="(XX) XXXXX-XXXX" />
            </div>
          </CardContent>
        </Card>

        {/* Ambulatório */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">🏢 Ambulatório</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Endereço do ambulatório</Label>
              <Input value={form.ambulatorioEndereco} onChange={e => setForm({ ...form, ambulatorioEndereco: e.target.value })} placeholder="Rua, número, sala, bairro, cidade - UF" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone para agendamento</Label>
              <Input value={form.ambulatorioTelefone} onChange={e => setForm({ ...form, ambulatorioTelefone: e.target.value })} placeholder="(XX) XXXXX-XXXX" />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-dashed border-slate-300">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Preview do cabeçalho PDF</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs text-slate-700">
              <div className="flex items-center gap-3 mb-2">
                {form.hospitalLogotipoUrl && (
                  <img src={form.hospitalLogotipoUrl.split('?')[0]} alt="Logo" className="h-10 w-auto object-contain" />
                )}
                <div>
                  <p className="font-bold text-sm">{form.hospitalNome || 'Nome do Hospital'}</p>
                  <p className="text-slate-500">Ortopedia e Traumatologia</p>
                  {form.hospitalEndereco && <p className="text-slate-500">{form.hospitalEndereco}</p>}
                  {form.hospitalTelefone && <p className="text-slate-500">Tel: {form.hospitalTelefone}</p>}
                </div>
              </div>
              <div className="border-b border-slate-300 my-2" />
              <p className="font-bold text-center text-sm uppercase">TÍTULO DO DOCUMENTO</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={salvar} disabled={saving} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
            {saving ? 'Salvando…' : '💾 Salvar configurações'}
          </Button>
        </div>
      </div>
    </div>
  )
}

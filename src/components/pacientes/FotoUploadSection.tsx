'use client'

import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export type FotoPendente = {
  file: File
  tipo: 'RADIOGRAFIA' | 'LESAO_PELE'
  dataFoto: string
  descricao: string
  previewUrl: string
}

export type FotaSalva = {
  id: string
  tipo: string
  url: string
  dataFoto: string | null
  descricao: string | null
}

type Props = {
  pacienteId?: string // undefined when creating (form not yet saved)
  fotosSalvas?: FotaSalva[]
  onFotosPendentes?: (fotos: FotoPendente[]) => void
  onFotaDeletada?: (id: string) => void
}

export default function FotoUploadSection({
  pacienteId, fotosSalvas = [], onFotosPendentes, onFotaDeletada,
}: Props) {
  const [pendentes, setPendentes] = useState<FotoPendente[]>([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [tipo, setTipo] = useState<'RADIOGRAFIA' | 'LESAO_PELE'>('RADIOGRAFIA')
  const [dataFoto, setDataFoto] = useState('')
  const [descricao, setDescricao] = useState('')

  function handleFiles(files: FileList | null) {
    if (!files) return
    const novas: FotoPendente[] = Array.from(files).map(file => ({
      file,
      tipo,
      dataFoto,
      descricao,
      previewUrl: URL.createObjectURL(file),
    }))
    const updated = [...pendentes, ...novas]
    setPendentes(updated)
    onFotosPendentes?.(updated)
  }

  function removerPendente(idx: number) {
    const updated = pendentes.filter((_, i) => i !== idx)
    setPendentes(updated)
    onFotosPendentes?.(updated)
  }

  async function uploadFoto(foto: FotoPendente) {
    if (!pacienteId) return
    const fd = new FormData()
    fd.append('file', foto.file)
    fd.append('tipo', foto.tipo)
    if (foto.dataFoto) fd.append('dataFoto', foto.dataFoto)
    if (foto.descricao) fd.append('descricao', foto.descricao)
    await fetch(`/api/pacientes/${pacienteId}/fotos`, { method: 'POST', body: fd })
  }

  async function uploadAll() {
    if (!pacienteId || pendentes.length === 0) return
    setUploading(true)
    try {
      await Promise.all(pendentes.map(uploadFoto))
      setPendentes([])
      onFotosPendentes?.([])
      window.location.reload()
    } finally {
      setUploading(false)
    }
  }

  async function deletarSalva(id: string) {
    if (!pacienteId) return
    await fetch(`/api/pacientes/${pacienteId}/fotos?fotoId=${id}`, { method: 'DELETE' })
    onFotaDeletada?.(id)
  }

  const radios = fotosSalvas.filter(f => f.tipo === 'RADIOGRAFIA')
  const lesoes = fotosSalvas.filter(f => f.tipo === 'LESAO_PELE')
  const pendsRadio = pendentes.filter(f => f.tipo === 'RADIOGRAFIA')
  const pendsLesao = pendentes.filter(f => f.tipo === 'LESAO_PELE')

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Imagens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Controles de upload */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2">
              {(['RADIOGRAFIA', 'LESAO_PELE'] as const).map(t => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="radio" name="tipoFoto" value={t} checked={tipo === t} onChange={() => setTipo(t)} className="accent-blue-600" />
                  <span className="text-sm">{t === 'RADIOGRAFIA' ? '🩻 Radiografia' : '🩹 Lesão de pele'}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Data da imagem</Label>
              <Input type="date" value={dataFoto} onChange={e => setDataFoto(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Descrição</Label>
              <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: AP e perfil pré-op…" className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 text-sm font-medium bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              📎 Selecionar arquivo(s)
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
            {pacienteId && pendentes.length > 0 && (
              <button
                type="button"
                onClick={uploadAll}
                disabled={uploading}
                className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {uploading ? 'Enviando…' : `Enviar ${pendentes.length} foto${pendentes.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
          {!pacienteId && pendentes.length > 0 && (
            <p className="text-xs text-amber-600 font-medium">As fotos serão enviadas automaticamente ao salvar o paciente.</p>
          )}
        </div>

        {/* Preview pendentes */}
        {pendsRadio.length > 0 && (
          <FotoGrupo titulo="🩻 Radiografias (aguardando envio)" fotos={pendsRadio.map((f, i) => ({
            id: `pend-r-${i}`, url: f.previewUrl, dataFoto: f.dataFoto, descricao: f.descricao, isPendente: true, idx: i,
          }))} onRemovePendente={removerPendente} />
        )}
        {pendsLesao.length > 0 && (
          <FotoGrupo titulo="🩹 Lesões de pele (aguardando envio)" fotos={pendsLesao.map((f, i) => ({
            id: `pend-l-${i}`, url: f.previewUrl, dataFoto: f.dataFoto, descricao: f.descricao, isPendente: true, idx: pendentes.indexOf(f),
          }))} onRemovePendente={removerPendente} />
        )}

        {/* Fotos salvas */}
        {radios.length > 0 && (
          <FotoGrupo titulo="🩻 Radiografias" fotos={radios.map(f => ({
            id: f.id, url: f.url, dataFoto: f.dataFoto, descricao: f.descricao,
          }))} onDelete={pacienteId ? deletarSalva : undefined} />
        )}
        {lesoes.length > 0 && (
          <FotoGrupo titulo="🩹 Lesões de pele" fotos={lesoes.map(f => ({
            id: f.id, url: f.url, dataFoto: f.dataFoto, descricao: f.descricao,
          }))} onDelete={pacienteId ? deletarSalva : undefined} />
        )}

        {fotosSalvas.length === 0 && pendentes.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Nenhuma imagem adicionada.</p>
        )}
      </CardContent>
    </Card>
  )
}

type FotoItem = {
  id: string
  url: string
  dataFoto?: string | null
  descricao?: string | null
  isPendente?: boolean
  idx?: number
}

function FotoGrupo({ titulo, fotos, onDelete, onRemovePendente }: {
  titulo: string
  fotos: FotoItem[]
  onDelete?: (id: string) => void
  onRemovePendente?: (idx: number) => void
}) {
  const [expandida, setExpandida] = useState<string | null>(null)

  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 mb-2">{titulo}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fotos.map(f => (
          <div key={f.id} className="relative group">
            <button
              type="button"
              onClick={() => setExpandida(expandida === f.id ? null : f.id)}
              className="block w-full"
            >
              <img
                src={f.url}
                alt={f.descricao || 'Imagem'}
                className="w-full h-28 object-cover rounded-lg border border-slate-200 shadow-sm group-hover:opacity-90 transition-opacity"
              />
            </button>
            {f.dataFoto && (
              <p className="text-[10px] text-slate-500 mt-1 text-center">
                {format(new Date(f.dataFoto), 'dd/MM/yyyy')}
              </p>
            )}
            {f.descricao && (
              <p className="text-[10px] text-slate-400 text-center truncate px-1">{f.descricao}</p>
            )}
            {/* Delete/remove button */}
            {(onDelete || onRemovePendente) && (
              <button
                type="button"
                onClick={() => f.isPendente && f.idx !== undefined ? onRemovePendente?.(f.idx) : onDelete?.(f.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal de imagem expandida */}
      {expandida && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandida(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={fotos.find(f => f.id === expandida)?.url || ''}
              alt="Imagem expandida"
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setExpandida(null)}
              className="absolute top-2 right-2 bg-white text-slate-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

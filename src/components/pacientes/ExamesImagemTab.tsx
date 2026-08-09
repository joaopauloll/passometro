'use client'

import React, { useState } from "react"
import { format } from "date-fns"
import { Plus, Trash2, Image as ImageIcon, ExternalLink, Eye, X, Calendar, FileText, Activity } from "lucide-react"

// Importe seus componentes e o ImageLightbox que criamos
import ImageLightbox from "@/components/ImageLightbox"
import FotoUploadSection, { FotoPendente, FotoSalva } from "@/components/pacientes/FotoUploadSection" // Ajuste o caminho se necessário
import FotoUpload from "@/components/FotoUpload"

// --- Constantes adaptadas para o seu sistema ---
const HOSPITAIS_EXAMES = [
  { id: 'WBSRAD', nome: 'Hospital Memorial (WBSRad)', url: 'https://www.wbsrad.com.br/site/', login: 'hospitalmemorial@exame.com.br', senha: '123456' },
  { id: 'EPACS', nome: 'Walfredo Gurgel (EPACS)', url: 'https://app.epacs.com.br/router/login/', login: 'medicocmt1@gmail.com', senha: 'medico' }
]

const TIPOS_EXAME = [
  { value: "radiografia", label: "Radiografia (RX)" },
  { value: "tc", label: "Tomografia Computadorizada (TC)" },
  { value: "rm", label: "Ressonância Magnética (RM)" },
  { value: "usg", label: "Ultrassonografia (USG)" },
  { value: "ecg", label: "Eletrocardiograma (ECG)" },
  { value: "eco", label: "Ecocardiograma" }
]

const EXAMES_ALTA_COMPLEXIDADE = ["tc", "rm", "usg", "ecg", "eco"]

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
const textareaCls = inputCls + " resize-none"

// --- Tipagens ---
type Props = {
  pacienteId: string
  examesIniciais: any[]
  fotosIniciais: any[]
  evolucoes: any[] 
}

export default function ImagensEExamesTab({ pacienteId, examesIniciais, fotosIniciais, evolucoes = [] }: Props) {
  // --- Estados ---
  const [exames, setExames] = useState(examesIniciais || [])
  const [fotos, setFotos] = useState<FotoSalva[]>(fotosIniciais || [])
  
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  
  const [mostrarUploadRx, setMostrarUploadRx] = useState(false)
  const [mostrarUploadLesao, setMostrarUploadLesao] = useState(false)
  const [mostrarUploadCurativo, setMostrarUploadCurativo] = useState(false)
  
  // Lightbox moderno
  const [lightbox, setLightbox] = useState({ images: [] as any[], index: 0, open: false })
  
  const [novo, setNovo] = useState({
    data: new Date().toISOString().slice(0, 10),
    tipo_exame: "tc",
    lateralidade: "nao_aplicavel",
    sitio: "",
    achados: "",
    laudo: "",
    hospital_origem: "WBSRAD",
  })

  // --- Filtros e Lógicas de Visualização ---
  const fotosRx = fotos.filter(f => f.tipo === "radiografia" || f.tipo === "RADIOGRAFIA")
  const fotosLesao = fotos.filter(f => f.tipo === "lesao" || f.tipo === "LESAO_PELE")
  const fotosCurativo = fotos.filter(f => f.tipo === "curativo")

  // Linha do Tempo Curativos (Mescla Fotos independentes com Fotos de Evoluções)
  const fotosCurativoUrls = new Set(fotosCurativo.map(f => f.url))
  const timelineCurativos = [
    ...fotosCurativo.map(f => ({ url: f.url, data: f.dataFoto || (f as any).data_realizacao, descricao: f.descricao, id: f.id, origem: "foto" })),
    ...(evolucoes).filter(e => e.curativo_foto_url && !fotosCurativoUrls.has(e.curativo_foto_url)).map(e => ({ url: e.curativo_foto_url, data: e.data, descricao: "Curativo (evolução)", id: e.id, origem: "evolucao" })),
  ].sort((a, b) => (b.data || "").localeCompare(a.data || ""))

  const examesAltaComplexidade = exames.filter(e => EXAMES_ALTA_COMPLEXIDADE.includes(e.tipo_exame))

  // --- Funções de API ---
  const salvarExame = async () => {
    if (!novo.data || !novo.sitio) return
    setSaving(true)
    const res = await fetch(`/api/pacientes/${pacienteId}/exames-imagem`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novo),
    })
    if (res.ok) {
      const data = await res.json()
      setExames([data, ...exames])
      setNovo({ data: new Date().toISOString().slice(0, 10), tipo_exame: "tc", lateralidade: "nao_aplicavel", sitio: "", achados: "", laudo: "", hospital_origem: "WBSRAD" })
      setShowForm(false)
    }
    setSaving(false)
  }

  const removerExame = async (id: string) => {
    await fetch(`/api/pacientes/${pacienteId}/exames-imagem?exameId=${id}`, { method: 'DELETE' })
    setExames(exames.filter(e => e.id !== id))
  }

  const removerFoto = async (fotoId: string) => {
    await fetch(`/api/pacientes/${pacienteId}/fotos?fotoId=${fotoId}`, { method: 'DELETE' })
    setFotos(fotos.filter(f => f.id !== fotoId))
  }

  const atualizarFoto = async (fotoId: string, dados: any) => {
    await fetch(`/api/pacientes/${pacienteId}/fotos`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fotoId, ...dados }),
    })
    setFotos(fotos.map(f => f.id === fotoId ? { ...f, ...dados } : f))
  }

  const hospitalInfo = (id: string) => HOSPITAIS_EXAMES.find(h => h.id === id)
  const labelTipoExame = (val: string) => TIPOS_EXAME.find(t => t.value === val)?.label || val

  // --- Renderização ---
  return (
    <div className="space-y-6">
      
      {/* 1. Links dos Sistemas */}
      <div className="flex justify-end">
        <button onClick={() => setShowLinks(!showLinks)} 
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm transition-all">
          <ExternalLink className="w-4 h-4" /> Sistemas de Imagem
        </button>
      </div>
      {showLinks && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Acessar resultados online:</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {HOSPITAIS_EXAMES.map(h => (
              <div key={h.id} className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-800">{h.nome}</span>
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded">
                    <ExternalLink className="w-3 h-3" /> Abrir
                  </a>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p><span className="font-medium">Login:</span> <code className="bg-slate-100 px-1 rounded">{h.login}</code></p>
                  <p><span className="font-medium">Senha:</span> <code className="bg-slate-100 px-1 rounded">{h.senha}</code></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Radiografias (Fotos) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-slate-400" /> Radiografias ({fotosRx.length})
          </h3>
          <button onClick={() => setMostrarUploadRx(!mostrarUploadRx)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors">
            {mostrarUploadRx ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{mostrarUploadRx ? "Fechar Upload" : "Adicionar"}
          </button>
        </div>
        {mostrarUploadRx && (
          <div className="mb-4">
            <FotoUpload 
              pacienteId={pacienteId}
              tipo="RADIOGRAFIA"
              fotos={fotosRx} // <--- CORREÇÃO AQUI
              onChange={(novasRadiografias) => {
                // Pegamos todas as fotos que NÃO são radiografia (lesões, curativos)
                const outrasFotos = fotos.filter(f => f.tipo !== 'RADIOGRAFIA' && f.tipo !== 'radiografia');
                
                // Juntamos as outras fotos com a nova lista atualizada de radiografias
                setFotos([...outrasFotos, ...novasRadiografias]); 
              }}
            />
          </div>
        )}
        
        {fotosRx.length === 0 && !mostrarUploadRx ? <p className="text-sm text-slate-400 py-2">Nenhuma radiografia anexada.</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotosRx.map((f, idx) => (
              <FotoCard 
                key={f.id} 
                foto={f} 
                onDelete={() => removerFoto(f.id)} 
                onUpdate={(dados: any) => atualizarFoto(f.id, dados)} 
                onClick={() => setLightbox({ images: fotosRx.map(x => ({ url: x.url, descricao: x.descricao || '', data: x.dataFoto || (x as any).data_realizacao })), index: idx, open: true })} 
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Lesões de Pele (Fotos) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-slate-400" /> Lesões de pele ({fotosLesao.length})
          </h3>
          <button onClick={() => setMostrarUploadLesao(!mostrarUploadLesao)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors">
            {mostrarUploadLesao ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{mostrarUploadLesao ? "Fechar Upload" : "Adicionar"}
          </button>
        </div>
        {mostrarUploadLesao && (
          <div className="mb-4">
            <FotoUpload 
              pacienteId={pacienteId}
              tipo="LESAO_PELE"
              fotos={fotosLesao} // <-- Certifique-se de criar/passar a variável filtrada
              onChange={(novasLesoes) => {
                // Filtra para manter tudo que NÃO é lesão de pele
                const outrasFotos = fotos.filter(f => f.tipo !== 'LESAO_PELE' && f.tipo !== 'lesao_pele');
                
                // Atualiza o estado unindo as outras fotos com as novas lesões
                setFotos([...outrasFotos, ...novasLesoes]); 
                
                // Opcional: Se você ainda controla a visibilidade (modal) externamente
                setMostrarUploadLesao(false);
              }}
            />
          </div>
        )}
        
        {fotosLesao.length === 0 && !mostrarUploadLesao ? <p className="text-sm text-slate-400 py-2">Nenhuma foto de lesão anexada.</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotosLesao.map((f, idx) => (
              <FotoCard 
                key={f.id} 
                foto={f} 
                onDelete={() => removerFoto(f.id)} 
                onUpdate={(dados: any) => atualizarFoto(f.id, dados)} 
                onClick={() => setLightbox({ images: fotosLesao.map(x => ({ url: x.url, descricao: x.descricao || '', data: x.dataFoto || (x as any).data_realizacao })), index: idx, open: true })} 
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Exames de Alta Complexidade (Laudos Textuais) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" /> Exames de Imagem (Laudos)
          </h3>
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Novo Laudo
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-5">ECG, Tomografia, Ressonância, Ultrassonografia, etc.</p>

        {showForm && (
          <div className="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de exame *</label>
                <select className={inputCls} value={novo.tipo_exame} onChange={e => setNovo({ ...novo, tipo_exame: e.target.value })}>
                  {TIPOS_EXAME.filter(t => t.value !== "radiografia").map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Data da realização *</label>
                <input type="date" className={inputCls} value={novo.data} onChange={e => setNovo({ ...novo, data: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sítio/Região examinada *</label>
                <input className={inputCls} value={novo.sitio} onChange={e => setNovo({ ...novo, sitio: e.target.value })} placeholder="ex: Joelho esquerdo, Tórax..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sistema / Origem</label>
                <select className={inputCls} value={novo.hospital_origem} onChange={e => setNovo({ ...novo, hospital_origem: e.target.value })}>
                  {HOSPITAIS_EXAMES.map(h => <option key={h.id} value={h.id}>{h.nome}</option>)}
                  <option value="outro">Outro / Externo</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Lateralidade</label>
                <div className="flex gap-2 flex-wrap">
                  {[["nao_aplicavel","Não se aplica"],["direita","Direita"],["esquerda","Esquerda"],["bilateral","Bilateral"]].map(([v,l]) => (
                    <button key={v} type="button" onClick={() => setNovo({ ...novo, lateralidade: v })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${novo.lateralidade === v ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição / Laudo</label>
              <textarea className={textareaCls} rows={4} value={novo.laudo} onChange={e => setNovo({ ...novo, laudo: e.target.value })} placeholder="Descreva o laudo ou os achados principais..." />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={salvarExame} disabled={!novo.data || !novo.sitio || saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar Laudo'}
              </button>
            </div>
          </div>
        )}

        {examesAltaComplexidade.length === 0 && !showForm ? (
          <p className="text-sm text-slate-400 py-2">Nenhum laudo registrado.</p>
        ) : (
          <div className="space-y-3">
            {examesAltaComplexidade.map(e => {
              const hosp = hospitalInfo(e.hospital_origem);
              return (
                <div key={e.id} className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-200 transition-colors group shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700">{labelTipoExame(e.tipo_exame)}</span>
                        <span className="text-sm font-semibold text-slate-800">{e.sitio}</span>
                        {e.lateralidade !== 'nao_aplicavel' && <span className="text-xs text-slate-500 capitalize">({e.lateralidade})</span>}
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">{format(new Date(e.data), 'dd/MM/yyyy')}</span>
                        {hosp && <span className="text-xs font-medium px-2 py-1 rounded border border-slate-200 text-slate-600">{hosp.nome}</span>}
                      </div>
                      {e.laudo && <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">{e.laudo}</p>}
                      {hosp && <a href={hosp.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-3"><ExternalLink className="w-3 h-3" /> Acessar sistema de origem</a>}
                    </div>
                    <button onClick={() => removerExame(e.id)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Linha do Tempo de Curativos */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" /> Linha do tempo de curativos ({timelineCurativos.length})
          </h3>
          <button onClick={() => setMostrarUploadCurativo(!mostrarUploadCurativo)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors">
            {mostrarUploadCurativo ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{mostrarUploadCurativo ? "Fechar Upload" : "Adicionar"}
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-5">Acompanhamento visual (Fotos avulsas + Fotos das Evoluções Diárias).</p>
        
        {mostrarUploadCurativo && (
          <div className="mb-4">
            <FotoUpload 
              pacienteId={pacienteId}
              tipo="CURATIVO"
              fotos={fotosCurativo} // <-- Certifique-se de criar/passar a variável filtrada
              onChange={(novosCurativos) => {
                // Filtra para manter tudo que NÃO é curativo
                const outrasFotos = fotos.filter(f => f.tipo !== 'CURATIVO' && f.tipo !== 'curativo');
                
                // Atualiza o estado unindo as outras fotos com os novos curativos
                setFotos([...outrasFotos, ...novosCurativos]); 
                
                // Opcional: Se você ainda controla a visibilidade (modal) externamente
                setMostrarUploadCurativo(false);
              }}
            />
          </div>
        )}
        
        {timelineCurativos.length === 0 && !mostrarUploadCurativo ? (
          <p className="text-sm text-slate-400 py-2">Nenhuma foto de curativo registrada.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {timelineCurativos.map((item, idx) => (
              <div key={idx} className="shrink-0 w-48">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                  <img src={item.url} alt={item.descricao || "Curativo"} className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightbox({ images: timelineCurativos, index: idx, open: true })} />
                  
                  {item.origem === "foto" && (
                    <button onClick={() => removerFoto(item.id)} className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-50 shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {item.origem === "evolucao" && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded bg-blue-600 text-white shadow-sm">Evolução</span>
                  )}
                </div>
                <div className="p-2 space-y-1.5 mt-1">
                  {item.origem === "foto" ? (
                    <input type="date" value={item.data ? item.data.slice(0,10) : ""} onChange={(e) => atualizarFoto(item.id, { dataFoto: e.target.value })} className="w-full px-2 py-1 rounded text-xs text-slate-700 border border-slate-200 bg-white" />
                  ) : (
                    item.data && <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium px-1"><Calendar className="w-3 h-3 text-slate-400" />{format(new Date(item.data), 'dd/MM/yyyy')}</div>
                  )}
                  {item.descricao && <div className="text-xs text-slate-500 truncate px-1" title={item.descricao}>{item.descricao}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal Moderno */}
      {lightbox.open && (
        <ImageLightbox
          images={lightbox.images}
          currentIndex={lightbox.index}
          onClose={() => setLightbox({ ...lightbox, open: false })}
          onNavigate={(index: number) => setLightbox({ ...lightbox, index })}
        />
      )}
    </div>
  )
}

// --- Componente auxiliar de Card de Foto ---
function FotoCard({ foto, onDelete, onUpdate, onClick }: { foto: any, onDelete: () => void, onUpdate: (d: any) => void, onClick: () => void }) {
  const dataString = foto.dataFoto || foto.data_realizacao || ""
  return (
    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
      <div className="relative">
        <img src={foto.url} alt={foto.descricao || ""} className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={onClick} />
        <button onClick={onDelete} className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-50 shadow-sm">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex-1 space-y-2">
        <input 
          type="date" 
          value={dataString ? dataString.slice(0, 10) : ""} 
          onChange={(e) => onUpdate({ dataFoto: e.target.value })} 
          className="w-full px-2 py-1 rounded text-xs text-slate-700 border border-slate-200 bg-white" 
        />
        {foto.descricao && <div className="text-xs text-slate-500 truncate" title={foto.descricao}>{foto.descricao}</div>}
      </div>
    </div>
  )
}
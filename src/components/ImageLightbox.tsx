'use client'

import React, { useEffect } from "react"
import { X, ChevronLeft, ChevronRight, Calendar } from "lucide-react"

// Tipagem para aceitar tanto imagens do painel de fotos quanto da linha do tempo
type LightboxImage = {
  url: string
  descricao?: string
  data_realizacao?: string // Padrão do banco de fotos
  data?: string            // Padrão da evolução
}

type Props = {
  images: LightboxImage[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function ImageLightbox({ images, currentIndex, onClose, onNavigate }: Props) {
  
  // Controle de teclado (Esc para sair, Setas para navegar)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1)
      if (e.key === "ArrowRight" && currentIndex < images.length - 1) onNavigate(currentIndex + 1)
    }
    window.addEventListener("keydown", handleKey)
    // Impede a rolagem da página quando o lightbox estiver aberto
    document.body.style.overflow = 'hidden'
    
    return () => {
      window.removeEventListener("keydown", handleKey)
      document.body.style.overflow = 'unset'
    }
  }, [currentIndex, images.length, onClose, onNavigate])

  if (!images || images.length === 0) return null
  const img = images[currentIndex]
  if (!img) return null

  // Normaliza o campo de data, dependendo de qual tabela a imagem veio
  const dataFormatada = img.data_realizacao || img.data

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 transition-all"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Botão Fechar (Canto superior direito) */}
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 p-2.5 rounded-xl text-slate-400 bg-black/20 hover:text-white hover:bg-white/10 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Fechar visualização"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navegação Lateral */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); if (currentIndex > 0) onNavigate(currentIndex - 1); }}
            className="absolute left-2 md:left-6 p-3 rounded-full text-slate-300 bg-black/20 hover:text-white hover:bg-white/10 border border-white/10 transition-all disabled:opacity-0 disabled:pointer-events-none z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
            disabled={currentIndex === 0}
            aria-label="Imagem anterior"
          >
            <ChevronLeft className="w-8 h-8 -ml-1" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); if (currentIndex < images.length - 1) onNavigate(currentIndex + 1); }}
            className="absolute right-2 md:right-6 p-3 rounded-full text-slate-300 bg-black/20 hover:text-white hover:bg-white/10 border border-white/10 transition-all disabled:opacity-0 disabled:pointer-events-none z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
            disabled={currentIndex === images.length - 1}
            aria-label="Próxima imagem"
          >
            <ChevronRight className="w-8 h-8 -mr-1" />
          </button>
        </>
      )}

      {/* Container da Imagem Central e Metadados */}
      <div 
        className="max-w-[95vw] max-h-[90vh] flex flex-col items-center select-none" 
        onClick={(e) => e.stopPropagation()} // Impede que o clique na imagem feche o modal
      >
        <img 
          src={img.url} 
          alt={img.descricao || "Visualização do paciente"} 
          className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10" 
          draggable={false}
        />
        
        {/* Painel inferior de informações (Descrição, Data e Contador) */}
        <div className="bg-slate-800/80 backdrop-blur border border-white/10 rounded-2xl px-6 py-4 mt-4 text-center max-w-2xl w-full shadow-2xl flex flex-col items-center">
          {img.descricao && (
            <div className="font-medium text-slate-100 text-sm md:text-base mb-2">
              {img.descricao}
            </div>
          )}
          
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium">
            {dataFormatada && (
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-600/50">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(dataFormatada + "T00:00:00").toLocaleDateString("pt-BR")}
              </div>
            )}
            <div className="text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 font-semibold tracking-wide">
              {currentIndex + 1} DE {images.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
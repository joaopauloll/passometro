'use client'

import { gerarRelatorioPDF } from '@/lib/pdfUtils'

type Props = {
  nomeArquivo?: string
  texto?: string  // when provided, generates a real PDF; otherwise falls back to print dialog
}

export default function DownloadPDFButton({ nomeArquivo = 'documento', texto }: Props) {
  async function handleDownload() {
    if (texto) {
      await gerarRelatorioPDF(nomeArquivo, texto)
    } else {
      const titleAnterior = document.title
      document.title = nomeArquivo
      window.print()
      document.title = titleAnterior
    }
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 text-sm font-medium bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Baixar PDF
    </button>
  )
}

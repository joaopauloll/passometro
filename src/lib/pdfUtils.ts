// PDF generation utilities using jsPDF (loaded dynamically to avoid SSR)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any

export type ConfiguracaoPDF = {
    hospitalNome?: string
    hospitalLogotipoUrl?: string
    hospitalLogotipoBase64?: string  // pre-fetched for PDF embed
    hospitalEndereco?: string
    hospitalTelefone?: string
    ambulatorioEndereco?: string
    ambulatorioTelefone?: string
}

export type PacienteParaPDF = {
    nome: string
    cpf?: string | null
    dataNascimento?: string | null
    dataInternacao: string
    diagnostico: string
    cid?: string | null
    cirurgioes: string[]
    medicacoes?: string | null
    alergias?: string | null
    traumaMecanismo?: string | null
    traumaData?: string | null
    cirurgias: { nomeCirurgia: string; cirurgiao: string; dataCirurgia: string }[]
}

type PrescricaoOpts = {
    usaDipirona: boolean
    usaTramadol: boolean
    usaTamarine: boolean
    diasRivaroxabana: number
    usaCefadroxila: boolean
    extras: string[]
}

async function novoDoc(): Promise<Doc> {
    const { jsPDF } = await import('jspdf')
    return new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
}

function cabecalho(doc: Doc, titulo: string, config?: ConfiguracaoPDF): number {
    const nomeHospital = config?.hospitalNome || 'Hospital Memorial'
    let logoWidth = 0
    if (config?.hospitalLogotipoBase64) {
        try {
            doc.addImage(config.hospitalLogotipoBase64, 'PNG', 15, 8, 44, 14)
            logoWidth = 24
        } catch { /* skip if logo fails */ }
    }
    const textX = 105
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(nomeHospital.toUpperCase(), textX, 13, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Ortopedia e Traumatologia', textX, 18, { align: 'center' })
    if (config?.hospitalEndereco) {
        doc.text(config.hospitalEndereco, textX, 22, { align: 'center' })
    }
    if (config?.hospitalTelefone) {
        doc.text(`Tel: ${config.hospitalTelefone}`, textX, config?.hospitalEndereco ? 26 : 22, { align: 'center' })
    }
    doc.setTextColor(0, 0, 0)
    const lineY = config?.hospitalEndereco ? 30 : (config?.hospitalTelefone ? 27 : 22)
    doc.setLineWidth(0.5)
    doc.line(15, lineY, 195, lineY)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    const titleY = lineY + 6
    doc.text(titulo, textX, titleY, { align: 'center' })
    doc.setLineWidth(0.2)
    doc.line(15, titleY + 3, 195, titleY + 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    return titleY + 8
}

function footer(doc: Doc, config?: ConfiguracaoPDF) {
    const pageCount = doc.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        // Linha separadora
        doc.setDrawColor(180)
        doc.setLineWidth(0.2)
        doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18)

        doc.setFontSize(8)
        doc.setTextColor(120)

        // Informações do ambulatório/hospital
        const info = [
            config?.ambulatorioEndereco,
            config?.ambulatorioTelefone
                ? `Tel: ${config.ambulatorioTelefone}`
                : undefined
        ]
            .filter(Boolean)
            .join(' • ')

        if (info) {
            doc.text(info, pageWidth / 2, pageHeight - 12, {
                align: 'center'
            })
        }

        // Número da página
        doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth - 15,
            pageHeight - 5,
            { align: 'right' }
        )

        doc.setTextColor(0)
    }
}

function addTexto(doc: Doc, texto: string, y: number, bold = false, fontSize = 10): number {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const linhas = doc.splitTextToSize(texto, 175)
    doc.text(linhas, 15, y)
    return y + linhas.length * (fontSize * 0.4 + 1.5)
}

export async function gerarPrescricaoPDF(pac: PacienteParaPDF, opts: PrescricaoOpts, config?: ConfiguracaoPDF) {
    const doc = await novoDoc()
    let y = cabecalho(doc, 'PRESCRIÇÃO MÉDICA', config)

    y = addTexto(doc, `Data: ${new Date().toLocaleDateString('pt-BR')}`, y)
    y = addTexto(doc, `Paciente: ${pac.nome}`, y, true)
    if (pac.cpf) y = addTexto(doc, `CPF: ${pac.cpf}`, y)
    y += 3

    if (pac.alergias) {
        doc.setTextColor(200, 0, 0)
        y = addTexto(doc, `ALERGIA: ${pac.alergias}`, y, true)
        doc.setTextColor(0, 0, 0)
        y += 2
    }

    y = addTexto(doc, 'Rx:', y, true)
    y += 1

    const itens: string[] = []
    if (opts.usaDipirona) itens.push('[  ] Dipirona 1g — 1 comprimido de 6/6h se dor (via oral)')
    itens.push('[  ] Paracetamol 750mg — 1 comprimido de 6/6h (se alergia a dipirona) (via oral)')
    if (opts.usaTramadol) itens.push('[  ] Tramadol 50mg — 10 comprimidos — 8/8h se dor refratária (via oral)')
    if (opts.usaTamarine) itens.push('[  ] Tamarine geleia — 1 colher de sopa 1x/dia por 10 dias (via oral)')
    if (opts.diasRivaroxabana > 0) itens.push(`[  ] Rivaroxabana 10mg — 1 comprimido/dia por ${opts.diasRivaroxabana} dias — profilaxia TEV (via oral)`)
    if (opts.usaCefadroxila) itens.push('[  ] Cefadroxila 500mg — 1 comprimido de 12/12h por 7 dias (via oral)')
    opts.extras.forEach(e => { if (e) itens.push(`[  ] ${e}`) })

    for (const item of itens) {
        y = addTexto(doc, item, y)
        y += 1
    }

    y += 8
    doc.line(15, y, 80, y)
    y += 4
    addTexto(doc, pac.cirurgioes[0] ? `Dr(a). ${pac.cirurgioes[0]}` : 'Médico Responsável', y)

    footer(doc, config)
    doc.save(`prescricao-${pac.nome.replace(/\s+/g, '-')}.pdf`)
}

export async function gerarAtestadoPDF(pac: PacienteParaPDF, diasAfastamento: number, dataEmissao: string, config?: ConfiguracaoPDF) {
    const doc = await novoDoc()
    let y = cabecalho(doc, 'ATESTADO MÉDICO', config)

    y = addTexto(doc, `Atesto que o(a) Sr(a). ${pac.nome}`, y, true)
    if (pac.cpf) y = addTexto(doc, `CPF: ${pac.cpf}`, y)
    y += 2
    y = addTexto(doc, `encontra-se em tratamento médico nesta instituição, necessitando de afastamento das atividades laborais por ${diasAfastamento} dias a contar de ${dataEmissao}.`, y)
    y += 3
    if (pac.cid) y = addTexto(doc, `CID-10: ${pac.cid}`, y)
    y = addTexto(doc, `Diagnóstico: ${pac.diagnostico}`, y)
    y += 12
    doc.line(15, y, 80, y)
    y += 4
    addTexto(doc, pac.cirurgioes[0] ? `Dr(a). ${pac.cirurgioes[0]}` : 'Médico Responsável', y)

    footer(doc, config)
    doc.save(`atestado-${pac.nome.replace(/\s+/g, '-')}.pdf`)
}

export async function gerarAtestadoAcompanhantePDF(config?: ConfiguracaoPDF) {
    const doc = await novoDoc()
    let y = cabecalho(doc, 'ATESTADO MÉDICO — ACOMPANHANTE', config)

    y += 5
    y = addTexto(doc, 'Atesto que _______________________________________, CPF ___________________,', y)
    y += 2
    y = addTexto(doc, 'esteve presente nesta unidade hospitalar em ___/___/______', y)
    y = addTexto(doc, 'acompanhando paciente internado(a) para tratamento médico-cirúrgico.', y)
    y += 5
    y = addTexto(doc, 'CID: Z63.6 — Acompanhamento de pessoa doente internada', y)
    y += 12
    y = addTexto(doc, 'Data: ___/___/______', y)
    y += 10
    doc.line(15, y, 80, y)
    y += 4
    addTexto(doc, 'Assinatura e carimbo do médico', y)

    footer(doc, config)
    doc.save('atestado-acompanhante.pdf')
}

export async function gerarLaudoPDF(pac: PacienteParaPDF, diasAfastamento = 90, config?: ConfiguracaoPDF) {
    const doc = await novoDoc()
    let y = cabecalho(doc, 'LAUDO MÉDICO', config)

    y = addTexto(doc, `Paciente: ${pac.nome}`, y, true)
    if (pac.cpf) y = addTexto(doc, `CPF: ${pac.cpf}`, y)
    if (pac.dataNascimento) {
        y = addTexto(doc, `Data de nascimento: ${new Date(pac.dataNascimento).toLocaleDateString('pt-BR')}`, y)
    }
    y += 3

    if (pac.traumaMecanismo) {
        y = addTexto(doc, `História da doença: ${pac.traumaMecanismo}${pac.traumaData ? ' em ' + new Date(pac.traumaData).toLocaleDateString('pt-BR') : ''}.`, y)
        y += 2
    }

    y = addTexto(doc, `Data de internação: ${new Date(pac.dataInternacao).toLocaleDateString('pt-BR')}.`, y)
    y = addTexto(doc, `Diagnóstico: ${pac.diagnostico}${pac.cid ? ' (CID-10: ' + pac.cid + ')' : ''}.`, y)
    y += 2

    if (pac.cirurgias.length > 0) {
        const c = pac.cirurgias[0]
        y = addTexto(doc, `Tratamento cirúrgico: ${c.nomeCirurgia} realizado em ${new Date(c.dataCirurgia).toLocaleDateString('pt-BR')}, Dr(a). ${c.cirurgiao}.`, y)
        y += 2
    }

    y = addTexto(doc, `Tempo de afastamento necessário: ${diasAfastamento} dias.`, y)
    y += 12
    doc.line(15, y, 80, y)
    y += 4
    addTexto(doc, pac.cirurgioes[0] ? `Dr(a). ${pac.cirurgioes[0]}` : 'Médico Responsável', y)

    footer(doc, config)
    doc.save(`laudo-${pac.nome.replace(/\s+/g, '-')}.pdf`)
}

export async function gerarSolicitacaoFisioterapiaPDF(pac: PacienteParaPDF, indicacao: string, config?: ConfiguracaoPDF) {
    const doc = await novoDoc()
    let y = cabecalho(doc, 'SOLICITAÇÃO DE FISIOTERAPIA', config)

    y = addTexto(doc, `Paciente: ${pac.nome}`, y, true)
    y = addTexto(doc, `Diagnóstico: ${pac.diagnostico}${pac.cid ? ' (' + pac.cid + ')' : ''}.`, y)
    y += 3
    y = addTexto(doc, 'Indicação:', y, true)
    y = addTexto(doc, indicacao, y)
    y += 5
    y = addTexto(doc, 'Objetivos: reabilitação funcional pós-operatória, analgesia, ganho de ADM, fortalecimento muscular e treino de marcha.', y)
    y += 12
    doc.line(15, y, 80, y)
    y += 4
    addTexto(doc, pac.cirurgioes[0] ? `Dr(a). ${pac.cirurgioes[0]}` : 'Médico Solicitante', y)

    footer(doc, config)
    doc.save(`fisioterapia-${pac.nome.replace(/\s+/g, '-')}.pdf`)
}

export async function carregarLogoBase64(url: string): Promise<string | undefined> {
    try {
        const res = await fetch(url)
        const blob = await res.blob()
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => resolve(undefined)
            reader.readAsDataURL(blob)
        })
    } catch {
        return undefined
    }
}

export async function gerarRelatorioPDF(nomeArquivo: string, texto: string) {
    const doc = await novoDoc()
    let y = 15
    doc.setFontSize(10)
    const linhas: string[] = doc.splitTextToSize(texto, 175)
    for (const linha of linhas) {
        doc.text(linha, 15, y)
        y += 5
        if (y > 280) {
            doc.addPage()
            y = 15
        }
    }
    footer(doc)
    doc.save(`${nomeArquivo}.pdf`)
}

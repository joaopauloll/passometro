import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ pacienteId: string }> } // Ajustado de 'id' para 'pacienteId' para bater com a pasta

const SISTEMAS_IMAGEM = {
    WBSRAD: { url: 'https://www.wbsrad.com.br/site/', login: 'hospitalmemorial@exame.com.br', senha: '123456' },
    EPACS: { url: 'https://app.epacs.com.br/router/login/', login: 'medicocmt1@gmail.com', senha: 'medico' },
}

export { SISTEMAS_IMAGEM }

export async function GET(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { pacienteId } = await params
    // Se seu ID no banco for Int, descomente a linha abaixo:
    // const formattedId = isNaN(Number(pacienteId)) ? pacienteId : Number(pacienteId)

    const exames = await prisma.exameImagem.findMany({
        where: { pacienteId: pacienteId }, // Use 'formattedId' se usar Int
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(exames)
}

export async function POST(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { pacienteId } = await params
    // Se seu ID no banco for Int, descomente a linha abaixo:
    // const formattedId = isNaN(Number(pacienteId)) ? pacienteId : Number(pacienteId)

    const { tipo, descricao, dataRealizacao, sitio, achados, linkTipo, linkUrl, lateralidade } = await req.json()

    const exame = await prisma.exameImagem.create({
        data: {
            pacienteId: pacienteId, // Use 'formattedId' se usar Int
            tipo: tipo || 'OUTRO',
            lateralidade: lateralidade || null,
            descricao: descricao || null,
            dataRealizacao: dataRealizacao ? new Date(dataRealizacao) : null,
            sitio: sitio || null,
            achados: achados || null,
            linkTipo: linkTipo || null,
            linkUrl: linkUrl || null,
        },
    })
    return NextResponse.json(exame, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const exameId = searchParams.get('exameId')

    if (!exameId) return NextResponse.json({ error: 'exameId obrigatório' }, { status: 400 })

    // Se o ID do exame no banco for Int, converta para número:
    const formattedExameId = isNaN(Number(exameId)) ? exameId : Number(exameId)

    await prisma.exameImagem.delete({
        where: { id: formattedExameId as any }
    })

    return NextResponse.json({ ok: true })
}
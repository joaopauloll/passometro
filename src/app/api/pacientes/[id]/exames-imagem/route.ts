import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

const SISTEMAS_IMAGEM = {
    WBSRAD: { url: 'https://www.wbsrad.com.br/site/', login: 'hospitalmemorial@exame.com.br', senha: '123456' },
    EPACS: { url: 'https://app.epacs.com.br/router/login/', login: 'medicocmt1@gmail.com', senha: 'medico' },
}

export { SISTEMAS_IMAGEM }

export async function GET(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { id } = await params
    const exames = await prisma.exameImagem.findMany({
        where: { pacienteId: id },
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(exames)
}

export async function POST(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { id } = await params
    const { tipo, descricao, dataRealizacao, sitio, achados, linkTipo, linkUrl } = await req.json()
    const exame = await prisma.exameImagem.create({
        data: {
            pacienteId: id,
            tipo: tipo || 'OUTRO',
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
    await prisma.exameImagem.delete({ where: { id: exameId } })
    return NextResponse.json({ ok: true })
}

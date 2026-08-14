import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

// 1. O tipo DEVE bater com o nome da pasta dinâmica: [id]
type Params = { params: Promise<{ id: string }> }

const SISTEMAS_IMAGEM = {
    WBSRAD: { url: 'https://www.wbsrad.com.br/site/', login: 'hospitalmemorial@exame.com.br', senha: '123456' },
    EPACS: { url: 'https://app.epacs.com.br/router/login/', login: 'medicocmt1@gmail.com', senha: 'medico' },
}

export { SISTEMAS_IMAGEM }

export async function GET(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // 2. Extrai "id" diretamente
    const { id } = await params

    const exames = await prisma.exameImagem.findMany({
        where: { pacienteId: id }, // Usa o "id" recuperado
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(exames)
}

export async function POST(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params

    const { tipo, laudo, dataRealizacao, sitio, linkTipo, lateralidade } = await req.json()

    try {
        const exame = await prisma.exameImagem.create({
            data: {
                pacienteId: id,
                tipoExame: tipo || 'OUTRO',
                lateralidade: lateralidade || 'nao_aplicavel',
                laudo: laudo || null,
                data: dataRealizacao ? new Date(dataRealizacao) : new Date(),
                sitio: sitio || 'Não especificado',
                hospitalOrigem: linkTipo || 'memorial',
            },
        })
        return NextResponse.json(exame, { status: 201 })
    } catch (error) {
        console.error('[ERRO SALVAR EXAME IMAGEM]', error)
        return NextResponse.json({ error: 'Erro interno ao salvar exame de imagem.' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const exameId = body.id

    if (!exameId) {
        return NextResponse.json(
            { error: 'id do exame obrigatório' },
            { status: 400 },
        )
    }

    const existente = await prisma.exameImagem.findFirst({
        where: {
            id: exameId,
            pacienteId: id,
        },
    })

    if (!existente) {
        return NextResponse.json(
            { error: 'Exame de imagem não encontrado' },
            { status: 404 },
        )
    }

    const exame = await prisma.exameImagem.update({
        where: { id: exameId },
        data: {
            // AQUI: Mapeamento rigoroso para os nomes do schema.prisma
            tipoExame: body.tipo || 'OUTRO',
            lateralidade: body.lateralidade || 'nao_aplicavel',
            laudo: body.laudo || null,
            data: body.dataRealizacao ? new Date(body.dataRealizacao) : new Date(),
            sitio: body.sitio || 'Não especificado',
            hospitalOrigem: body.linkTipo || 'memorial',
        },
    })

    return NextResponse.json(exame)
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = req.nextUrl
    const exameId = searchParams.get('exameId')

    if (!exameId) {
        return NextResponse.json(
            { error: 'exameId obrigatório' },
            { status: 400 },
        )
    }

    const exame = await prisma.exameImagem.findFirst({
        where: {
            id: exameId,
            pacienteId: id,
        },
    })

    if (!exame) {
        return NextResponse.json(
            { error: 'Exame de imagem não encontrado' },
            { status: 404 },
        )
    }

    await prisma.exameImagem.delete({
        where: { id: exameId },
    })

    return NextResponse.json({ ok: true })
}
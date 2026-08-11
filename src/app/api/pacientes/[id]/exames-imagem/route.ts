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

    // 3. Extrai "id" diretamente
    const { id } = await params

    const { tipo, descricao, dataRealizacao, sitio, achados, linkTipo, linkUrl, lateralidade } = await req.json()

    try {
        const exame = await prisma.exameImagem.create({
            data: {
                pacienteId: id, // 4. Vincula o pacienteId com a variável "id"
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
            tipo: body.tipo || 'OUTRO',
            lateralidade: body.lateralidade || null,
            descricao: body.descricao || null,
            dataRealizacao: body.dataRealizacao
                ? new Date(body.dataRealizacao)
                : null,
            sitio: body.sitio || null,
            achados: body.achados || null,
            linkTipo: body.linkTipo || null,
            linkUrl: body.linkUrl || null,
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
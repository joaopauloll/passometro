import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { id } = await params
    const culturas = await prisma.cultura.findMany({
        where: { pacienteId: id },
        orderBy: { dataColeta: 'desc' },
    })
    return NextResponse.json(culturas)
}

export async function POST(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { id } = await params
    const { dataColeta, sitio, resultado, dataResult } = await req.json()
    const cultura = await prisma.cultura.create({
        data: {
            pacienteId: id,
            dataColeta: new Date(dataColeta),
            sitio,
            resultado: resultado || null,
            dataResult: dataResult ? new Date(dataResult) : null,
        },
    })
    return NextResponse.json(cultura, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const culturaId = body.id

    if (!culturaId) {
        return NextResponse.json(
            { error: 'id da cultura obrigatório' },
            { status: 400 },
        )
    }

    const existente = await prisma.cultura.findFirst({
        where: {
            id: culturaId,
            pacienteId: id,
        },
    })

    if (!existente) {
        return NextResponse.json(
            { error: 'Cultura não encontrada' },
            { status: 404 },
        )
    }

    const cultura = await prisma.cultura.update({
        where: { id: culturaId },
        data: {
            dataColeta: new Date(body.dataColeta),
            sitio: body.sitio,
            resultado: body.resultado || null,
            dataResult: body.dataResult
                ? new Date(body.dataResult)
                : null,
        },
    })

    return NextResponse.json(cultura)
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = req.nextUrl
    const culturaId = searchParams.get('culturaId')

    if (!culturaId) {
        return NextResponse.json(
            { error: 'culturaId obrigatório' },
            { status: 400 },
        )
    }

    const cultura = await prisma.cultura.findFirst({
        where: {
            id: culturaId,
            pacienteId: id,
        },
    })

    if (!cultura) {
        return NextResponse.json(
            { error: 'Cultura não encontrada' },
            { status: 404 },
        )
    }

    await prisma.cultura.delete({
        where: { id: culturaId },
    })

    return NextResponse.json({ ok: true })
}

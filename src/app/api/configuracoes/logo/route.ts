import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'svg']
    if (!allowed.includes(ext)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })

    const filename = `logo.${ext}`
    const dir = path.join(process.cwd(), 'uploads', 'hospital')
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))

    const url = `/api/uploads/hospital/${filename}`
    await prisma.configuracao.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', hospitalLogotipoUrl: url },
        update: { hospitalLogotipoUrl: url },
    })

    return NextResponse.json({ url })
}

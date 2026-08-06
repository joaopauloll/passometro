import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'

const MIME: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif',
}

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads')

type Params = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return new NextResponse('Não autorizado', { status: 401 })

    const { path: parts } = await params

    // Block path traversal attempts
    if (parts.some(p => p.includes('..'))) {
        return new NextResponse('Proibido', { status: 403 })
    }

    const filePath = path.join(UPLOADS_ROOT, ...parts)

    // Ensure the resolved path stays inside the uploads directory
    if (!filePath.startsWith(UPLOADS_ROOT + path.sep) && filePath !== UPLOADS_ROOT) {
        return new NextResponse('Proibido', { status: 403 })
    }

    try {
        const buffer = await readFile(filePath)
        const ext = parts.at(-1)?.split('.').pop()?.toLowerCase() || ''
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': MIME[ext] || 'application/octet-stream',
                'Cache-Control': 'private, max-age=3600',
            },
        })
    } catch {
        return new NextResponse('Arquivo não encontrado', { status: 404 })
    }
}

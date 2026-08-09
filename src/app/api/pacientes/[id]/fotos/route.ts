import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

type Params = { params: Promise<{ id: string }> }

// GET /api/pacientes/[id]/fotos
export async function GET(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const fotos = await prisma.foto.findMany({
        where: { pacienteId: id },
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(fotos)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { id: pacienteId } = await params;
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) return NextResponse.json({ error: 'Arquivo ausente' }, { status: 400 });

        // 1. Criar o nome do arquivo e diretório
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // O diretório deve estar dentro de public para ser acessível pelo navegador
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pacientes', pacienteId);
        const fileName = `${randomUUID()}${path.extname(file.name)}`;
        const filePath = path.join(uploadDir, fileName);

        // 2. Garantir que a pasta existe e salvar o arquivo
        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);

        // 3. Salvar o caminho relativo no banco (ex: /uploads/pacientes/id/arquivo.png)
        const urlRelativa = `/uploads/pacientes/${pacienteId}/${fileName}`;

        const novaFoto = await prisma.foto.create({
            data: {
                pacienteId: pacienteId,
                url: urlRelativa, // Agora salvamos o caminho real!
                tipo: String(formData.get('tipo')),
                lateralidade: formData.get('lateralidade') ? String(formData.get('lateralidade')) : null,
                descricao: formData.get('descricao') ? String(formData.get('descricao')) : null,
                dataFoto: formData.get('dataFoto') ? new Date(String(formData.get('dataFoto'))) : new Date(),
            }
        });

        return NextResponse.json(novaFoto, { status: 201 });

    } catch (error: any) {
        console.error("ERRO NO BACKEND", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
// export async function POST(req: NextRequest, { params }: Params) {
//     const session = await getSessionFromRequest(req)
//     if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

//     const { id } = await params

//     try {
//         const formData = await req.formData()
//         const file = formData.get('file') as File | null
//         if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

//         const tipo = (formData.get('tipo') as string) || 'RADIOGRAFIA'
//         const dataFotoStr = formData.get('dataFoto') as string | null
//         const descricao = (formData.get('descricao') as string) || null
//         const lateralidade = (formData.get('lateralidade') as string) || null

//         const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
//         const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif']
//         if (!allowed.includes(ext)) {
//             return NextResponse.json({ error: 'Formato não permitido. Use JPG, PNG ou WEBP.' }, { status: 400 })
//         }

//         const filename = `${randomUUID()}.${ext}`
//         const dir = path.join(process.cwd(), 'uploads', 'pacientes', id)
//         await mkdir(dir, { recursive: true })

//         const bytes = await file.arrayBuffer()
//         await writeFile(path.join(dir, filename), Buffer.from(bytes))

//         const url = `/api/uploads/pacientes/${id}/${filename}`

//         const foto = await prisma.foto.create({
//             data: {
//                 pacienteId: id,
//                 tipo,
//                 lateralidade: lateralidade || null,
//                 url,
//                 dataFoto: dataFotoStr ? new Date(dataFotoStr) : null,
//                 descricao,
//             },
//         })

//         return NextResponse.json(foto, { status: 201 })
//     } catch (err) {
//         console.error('[POST /api/pacientes/[id]/fotos]', err)
//         return NextResponse.json({ error: 'Erro ao salvar foto' }, { status: 500 })
//     }
// }

// DELETE /api/pacientes/[id]/fotos?fotoId=xxx
export async function DELETE(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const fotoId = searchParams.get('fotoId')
    if (!fotoId) return NextResponse.json({ error: 'fotoId obrigatório' }, { status: 400 })

    try {
        await prisma.foto.delete({ where: { id: fotoId } })
        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
    }
}

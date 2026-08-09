'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, AlertCircle, X, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { corPendencia } from '@/lib/evolucao'

type Pendencia = {
id: string
descricao: string
tipo: string
concluida: boolean
createdAt: string
}

type PendenciaPadrao = {
label: string
tipo: string
}

/**

* Pendências padrão exibidas como atalhos.
*
* Ajuste essa lista conforme as pendências utilizadas
* na rotina da enfermaria.
  */
  const PENDENCIAS_PADRAO: PendenciaPadrao[] = [
  { label: 'Aguardar risco cirúrgico', tipo: 'RISCO_CIRURGICO' },
  { label: 'Aguardar avaliação da Infectologia', tipo: 'INFECTOLOGIA' },
  { label: 'Aguardar avaliação clínica', tipo: 'CLINICA' },
  { label: 'Aguardar exame', tipo: 'EXAME' },
  { label: 'Aguardar RX', tipo: 'RX' },
  { label: 'Alta', tipo: 'ALTA' },
  ]

type Props = {
pendencias: Pendencia[]
pacienteId: string
}

export default function PendenciasSection({
pendencias: inicial,
pacienteId,
}: Props) {
const [pendencias, setPendencias] = useState(inicial)
const [novaDescricao, setNovaDescricao] = useState('')
const [adicionando, setAdicionando] = useState(false)
const [loading, setLoading] = useState(false)

const abertas = pendencias.filter((p) => !p.concluida)
const concluidas = pendencias.filter((p) => p.concluida)

/**

* Verifica se uma pendência padrão já está ativa.
*
* Pendências concluídas não impedem que a mesma pendência
* seja adicionada novamente.
  */
  function isPendenciaAtiva(descricao: string) {
  return pendencias.some(
  (p) => !p.concluida && p.descricao === descricao
  )
  }

async function togglePendencia(
pendenciaId: string,
concluida: boolean
) {
if (loading) return

setLoading(true)

try {
  const res = await fetch(
    `/api/pacientes/${pacienteId}/pendencias`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pendenciaId,
        concluida,
      }),
    }
  )

  if (!res.ok) {
    throw new Error('Não foi possível atualizar a pendência')
  }

  const atualizada: Pendencia = await res.json()

  setPendencias((prev) =>
    prev.map((p) =>
      p.id === pendenciaId ? atualizada : p
    )
  )

  toast.success(
    concluida
      ? 'Pendência concluída!'
      : 'Pendência reaberta'
  )
} catch {
  toast.error('Não foi possível atualizar a pendência')
} finally {
  setLoading(false)
}


}

async function removerPendencia(pendenciaId: string) {
if (loading) return


setLoading(true)

try {
  const res = await fetch(
    `/api/pendencias`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pendenciaId,
      }),
    }
  )

  if (!res.ok) {
    throw new Error('Não foi possível remover a pendência')
  }

  setPendencias((prev) =>
    prev.filter((p) => p.id !== pendenciaId)
  )

  toast.success('Pendência removida')
} catch {
  toast.error('Não foi possível remover a pendência')
} finally {
  setLoading(false)
}


}

async function adicionarPendenciaPadrao(
item: PendenciaPadrao
) {
if (loading || isPendenciaAtiva(item.label)) return


setLoading(true)

try {
  const res = await fetch(
    `/api/pacientes/${pacienteId}/pendencias`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        descricao: item.label,
        tipo: item.tipo,
      }),
    }
  )

  if (!res.ok) {
    throw new Error('Não foi possível adicionar a pendência')
  }

  const nova: Pendencia = await res.json()

  setPendencias((prev) => [nova, ...prev])

  toast.success('Pendência adicionada')
} catch {
  toast.error('Não foi possível adicionar a pendência')
} finally {
  setLoading(false)
}


}

async function adicionarOutraPendencia() {
const descricao = novaDescricao.trim()


if (!descricao || loading) return

setLoading(true)

try {
  const res = await fetch(
    `/api/pacientes/${pacienteId}/pendencias`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        descricao,
        tipo: 'OUTRO',
      }),
    }
  )

  if (!res.ok) {
    throw new Error('Não foi possível adicionar a pendência')
  }

  const nova: Pendencia = await res.json()

  setPendencias((prev) => [nova, ...prev])
  setNovaDescricao('')
  setAdicionando(false)

  toast.success('Pendência adicionada')
} catch {
  toast.error('Não foi possível adicionar a pendência')
} finally {
  setLoading(false)
}


}

return (
<Card
className={`border ${
        abertas.length > 0
          ? 'border-amber-200'
          : 'border-slate-200'
      }`}
> <CardHeader className="pb-3"> <div className="flex items-center justify-between gap-2"> <CardTitle className="text-sm font-semibold text-slate-800">
Pendências


        {abertas.length > 0 && (
          <span className="ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-bold text-amber-700">
            {abertas.length}
          </span>
        )}
      </CardTitle>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setAdicionando((prev) => !prev)}
        className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Adicionar
      </Button>
    </div>
  </CardHeader>

  <CardContent className="space-y-4">

    {/* =========================================================
        PENDÊNCIAS PADRÃO
    ========================================================= */}

    <div>
      <p className="mb-2 text-xs font-medium text-slate-500">
        Adicionar pendência padrão
      </p>

      <div className="flex flex-wrap gap-1.5">
        {PENDENCIAS_PADRAO.map((item) => {
          const checked = isPendenciaAtiva(item.label)

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => adicionarPendenciaPadrao(item)}
              disabled={loading || checked}
              className={`
                inline-flex items-center gap-1.5
                rounded-lg border
                px-2.5 py-1.5
                text-left text-xs font-medium
                transition-all
                disabled:cursor-not-allowed
                ${
                  checked
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                }
              `}
            >
              <span
                className={`
                  flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border
                  ${
                    checked
                      ? 'border-amber-400 bg-amber-400'
                      : 'border-slate-300 bg-white'
                  }
                `}
              >
                {checked && (
                  <Check className="h-2.5 w-2.5 text-white" />
                )}
              </span>

              {item.label}
            </button>
          )
        })}
      </div>
    </div>

    {/* =========================================================
        OUTRA PENDÊNCIA
    ========================================================= */}

    {adicionando && (
      <div className="flex gap-2">
        <Input
          value={novaDescricao}
          onChange={(e) => setNovaDescricao(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              adicionarOutraPendencia()
            }
          }}
          placeholder="Descrever outra pendência..."
          className="h-9 flex-1 text-sm"
          autoFocus
          disabled={loading}
        />

        <Button
          type="button"
          size="sm"
          onClick={adicionarOutraPendencia}
          disabled={loading || !novaDescricao.trim()}
          className="h-9"
        >
          Adicionar
        </Button>
      </div>
    )}

    {/* =========================================================
        LISTA
    ========================================================= */}

    {abertas.length === 0 && concluidas.length === 0 ? (
      <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center">
        <p className="text-xs text-slate-400">
          Nenhuma pendência registrada.
        </p>
      </div>
    ) : (
      <div className="space-y-4">

        {/* =====================================================
            ABERTAS
        ===================================================== */}

        {abertas.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Pendências ativas
              </span>

              <span className="text-[10px] font-medium text-amber-600">
                {abertas.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {abertas.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-center gap-2.5 rounded-lg border border-amber-100 bg-amber-50/60 p-2.5 transition-colors hover:bg-amber-50"
                >
                  <button
                    type="button"
                    onClick={() =>
                      togglePendencia(p.id, true)
                    }
                    disabled={loading}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-amber-300 transition-colors hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Marcar como concluída"
                  />

                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-slate-700">
                      {p.descricao}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase ${corPendencia(
                      p.tipo
                    )}`}
                  >
                    {p.tipo}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      removerPendencia(p.id)
                    }
                    disabled={loading}
                    className="shrink-0 text-slate-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed"
                    title="Remover pendência"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================
            CONCLUÍDAS
        ===================================================== */}

        {concluidas.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Concluídas
              </span>

              <span className="text-[10px] font-medium text-slate-400">
                {concluidas.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {concluidas.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5"
                >
                  <button
                    type="button"
                    onClick={() =>
                      togglePendencia(p.id, false)
                    }
                    disabled={loading}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-green-500 bg-green-500 transition-colors hover:bg-green-600 hover:border-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Reabrir pendência"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </button>

                  <span className="min-w-0 flex-1 text-xs text-slate-400 line-through">
                    {p.descricao}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      removerPendencia(p.id)
                    }
                    disabled={loading}
                    className="shrink-0 text-slate-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed"
                    title="Remover pendência"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    )}
  </CardContent>
</Card>


)
}

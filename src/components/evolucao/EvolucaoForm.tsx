'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { gerarTextoEvolucao, gerarPendencias } from '@/lib/evolucao'
import type { EvolucaoFormData } from '@/types'

type TriOption = 'sim' | 'nao' | null
function tri(v: TriOption): boolean | undefined {
  if (v === 'sim') return true
  if (v === 'nao') return false
  return undefined
}
function fromBool(v: boolean | null | undefined): TriOption {
  if (v === true) return 'sim'
  if (v === false) return 'nao'
  return null
}

function TriSwitch({
  label,
  value,
  onChange,
  simLabel = 'Sim',
  naoLabel = 'Não',
  className = '',
}: {
  label: string
  value: TriOption
  onChange: (v: TriOption) => void
  simLabel?: string
  naoLabel?: string
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(value === 'sim' ? null : 'sim')}
          className={`px-3 py-1.5 transition-colors ${value === 'sim' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          {simLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(value === 'nao' ? null : 'nao')}
          className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${value === 'nao' ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          {naoLabel}
        </button>
      </div>
    </div>
  )
}

type Props = {
  pacienteId: string
  isPosOperatorio: boolean
  idadePaciente?: number | null
  nomePaciente: string
}

export default function EvolucaoForm({ pacienteId, isPosOperatorio, idadePaciente, nomePaciente }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [textoPreview, setTextoPreview] = useState('')

  // Estado geral
  const [estavel, setEstavel] = useState<TriOption>(null)
  const [febre, setFebre] = useState<TriOption>(null)
  const [semDor, setSemDor] = useState<TriOption>(null)
  const [dorControlada, setDorControlada] = useState<TriOption>(null)

  // Eliminações
  const [diurese, setDiurese] = useState<'espontanea' | 'svd' | 'anurico' | ''>('')
  const [ultimaEvacuacao, setUltimaEvacuacao] = useState('')

  // Exame físico
  const [perfusao, setPerfusao] = useState<TriOption>(null)
  const [sensibilidade, setSensibilidade] = useState<TriOption>(null)
  const [movimento, setMovimento] = useState<TriOption>(null)

  // Imobilização
  const [usaGesso, setUsaGesso] = useState<TriOption>(null)
  const [qualGesso, setQualGesso] = useState('')

  // Curativo
  const [possuiCurativo, setPossuiCurativo] = useState<TriOption>(null)
  const [curativoLimpo, setCurativoLimpo] = useState<TriOption>(null)
  const [secInfecciosa, setSecInfecciosa] = useState<TriOption>(null)
  const [secSanguinolenta, setSecSanguinolenta] = useState<TriOption>(null)

  // Pós-op
  const [rxRealizado, setRxRealizado] = useState<TriOption>(null)
  const [rxSatisfatorio, setRxSatisfatorio] = useState<TriOption>(null)
  const [rxEnviado, setRxEnviado] = useState<TriOption>(null)

  // Cardio (≥55 anos)
  const [cardioPendente, setCardioPendente] = useState<TriOption>(null)
  const [cardiologistaLiberou, setCardiologistaLiberou] = useState<TriOption>(null)
  const [solicitouEco, setSolicitouEco] = useState<TriOption>(null)
  const [ecoReady, setEcoReady] = useState<TriOption>(null)
  const [necessitaUTI, setNecessitaUTI] = useState<TriOption>(null)

  // Laboratórios
  const [hemoglobina, setHemoglobina] = useState('')
  const [plaquetas, setPlaquetas] = useState('')
  const [inr, setInr] = useState('')

  // Clínica médica
  const [acompClinico, setAcompClinico] = useState<TriOption>(null)
  const [nomeClinico, setNomeClinico] = useState('')

  // Alta
  const [altaPrevista, setAltaPrevista] = useState<TriOption>(null)
  const [altaHoje, setAltaHoje] = useState<TriOption>(null)
  const [chkReceita, setChkReceita] = useState(false)
  const [chkRelatorio, setChkRelatorio] = useState(false)
  const [chkOrientacoes, setChkOrientacoes] = useState(false)
  const [chkAtestado, setChkAtestado] = useState(false)
  const [chkRetorno, setChkRetorno] = useState(false)
  const [chkRX, setChkRX] = useState(false)

  // Observações
  const [observacoes, setObservacoes] = useState('')

  const getDados = useCallback((): EvolucaoFormData => ({
    estavel: tri(estavel),
    febre: tri(febre),
    semDor: tri(semDor),
    dorControlada: tri(dorControlada),
    diurese: diurese || undefined,
    ultimaEvacuacao: ultimaEvacuacao || undefined,
    perfusaoPreservada: tri(perfusao),
    sensibilidadePreservada: tri(sensibilidade),
    movimentoPreservado: tri(movimento),
    usaGesso: tri(usaGesso),
    qualGesso: qualGesso || undefined,
    possuiCurativo: tri(possuiCurativo),
    curativoLimpo: tri(curativoLimpo),
    secrecaoInfecciosa: tri(secInfecciosa),
    secrecaoSanguinolenta: tri(secSanguinolenta),
    rxPosOpRealizado: tri(rxRealizado),
    rxSatisfatorio: tri(rxSatisfatorio),
    rxEnviadoCirurgiao: tri(rxEnviado),
    cardioPendente: tri(cardioPendente),
    cardiologistaLiberou: tri(cardiologistaLiberou),
    solicitouEco: tri(solicitouEco),
    ecoReady: tri(ecoReady),
    necessitaUTI: tri(necessitaUTI),
    hemoglobina: hemoglobina ? parseFloat(hemoglobina) : null,
    plaquetas: plaquetas ? parseFloat(plaquetas) : null,
    inr: inr ? parseFloat(inr) : null,
    acompClinico: tri(acompClinico),
    nomeClinico: nomeClinico || undefined,
    altaPrevista: tri(altaPrevista),
    altaHoje: tri(altaHoje),
    chkReceita,
    chkRelatorio,
    chkOrientacoes,
    chkAtestado,
    chkRetorno,
    chkRX,
    observacoes: observacoes || undefined,
  }), [
    estavel, febre, semDor, dorControlada, diurese, ultimaEvacuacao,
    perfusao, sensibilidade, movimento, usaGesso, qualGesso,
    possuiCurativo, curativoLimpo, secInfecciosa, secSanguinolenta,
    rxRealizado, rxSatisfatorio, rxEnviado, cardioPendente, cardiologistaLiberou,
    solicitouEco, ecoReady, necessitaUTI, hemoglobina, plaquetas, inr,
    acompClinico, nomeClinico, altaPrevista, altaHoje,
    chkReceita, chkRelatorio, chkOrientacoes, chkAtestado, chkRetorno, chkRX, observacoes
  ])

  // Atualiza preview automaticamente
  useEffect(() => {
    const dados = getDados()
    const texto = gerarTextoEvolucao(dados, isPosOperatorio, idadePaciente ?? undefined)
    setTextoPreview(texto)
  }, [getDados, isPosOperatorio, idadePaciente])

  const pendenciasPreview = useCallback(() => {
    return gerarPendencias(getDados(), isPosOperatorio, idadePaciente ?? undefined)
  }, [getDados, isPosOperatorio, idadePaciente])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const dados = getDados()
      const res = await fetch(`/api/pacientes/${pacienteId}/evolucoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })

      if (!res.ok) throw new Error('Erro ao salvar evolução')

      toast.success('Evolução registrada!')
      router.push(`/pacientes/${pacienteId}`)
      router.refresh()
    } catch {
      toast.error('Erro ao registrar evolução')
    } finally {
      setLoading(false)
    }
  }

  const mostraCardio = idadePaciente != null && idadePaciente >= 55

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">

      {/* Estado geral */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Estado Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TriSwitch label="Estável hemodinamicamente?" value={estavel} onChange={setEstavel} />
          <TriSwitch label="Febril?" value={febre} onChange={setFebre} simLabel="Sim" naoLabel="Afebril" />
          <TriSwitch label="Sem dor?" value={semDor} onChange={setSemDor} />
          {semDor !== 'sim' && (
            <TriSwitch label="Dor controlada?" value={dorControlada} onChange={setDorControlada} />
          )}
        </CardContent>
      </Card>

      {/* Eliminações */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Eliminações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Diurese</Label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'espontanea', label: 'Espontânea' },
                { value: 'svd', label: 'SVD' },
                { value: 'anurico', label: 'Anúrico' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDiurese(diurese === opt.value ? '' : opt.value as typeof diurese)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    diurese === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="evacuacao" className="text-sm">Última evacuação (ex: "há 2 dias")</Label>
            <Input
              id="evacuacao"
              value={ultimaEvacuacao}
              onChange={(e) => setUltimaEvacuacao(e.target.value)}
              placeholder="há 1 dia, hoje…"
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exame físico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Exame Físico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TriSwitch label="Perfusão distal preservada?" value={perfusao} onChange={setPerfusao} />
          <TriSwitch label="Sensibilidade preservada?" value={sensibilidade} onChange={setSensibilidade} />
          <TriSwitch label="Movimento preservado?" value={movimento} onChange={setMovimento} />
        </CardContent>
      </Card>

      {/* Imobilização */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Imobilização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TriSwitch label="Usa gesso?" value={usaGesso} onChange={setUsaGesso} />
          {usaGesso === 'sim' && (
            <div className="space-y-1.5">
              <Label className="text-sm">Qual gesso?</Label>
              <Input
                value={qualGesso}
                onChange={(e) => setQualGesso(e.target.value)}
                placeholder="Ex: Gessado coxopodálico, tipoia…"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Curativo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Curativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TriSwitch label="Possui curativo?" value={possuiCurativo} onChange={setPossuiCurativo} />
          {possuiCurativo === 'sim' && (
            <>
              <TriSwitch label="Curativo limpo?" value={curativoLimpo} onChange={setCurativoLimpo} />
              <TriSwitch label="Secreção infecciosa?" value={secInfecciosa} onChange={setSecInfecciosa} />
              <TriSwitch label="Secreção sanguinolenta?" value={secSanguinolenta} onChange={setSecSanguinolenta} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Pós-operatório */}
      {isPosOperatorio && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Pós-Operatório</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TriSwitch label="RX pós-op realizado?" value={rxRealizado} onChange={setRxRealizado} />
            {rxRealizado === 'sim' && (
              <>
                <TriSwitch label="RX satisfatório?" value={rxSatisfatorio} onChange={setRxSatisfatorio} />
                <TriSwitch label="Enviado ao cirurgião?" value={rxEnviado} onChange={setRxEnviado} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cardiovascular (≥55 anos) */}
      {mostraCardio && (
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-600 font-medium uppercase tracking-wide">
              ⚠ Avaliação Cardiovascular (paciente ≥ 55 anos)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TriSwitch label="Risco cardiovascular pendente?" value={cardioPendente} onChange={setCardioPendente} />
            <TriSwitch label="Cardiologista liberou?" value={cardiologistaLiberou} onChange={setCardiologistaLiberou} />
            <TriSwitch label="Solicitou ecocardiograma?" value={solicitouEco} onChange={setSolicitouEco} />
            {solicitouEco === 'sim' && (
              <TriSwitch label="Eco pronto?" value={ecoReady} onChange={setEcoReady} />
            )}
            <TriSwitch label="Necessita UTI pós-op?" value={necessitaUTI} onChange={setNecessitaUTI} />
          </CardContent>
        </Card>
      )}

      {/* Laboratórios */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Laboratórios (opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Hb (g/dL)</Label>
              <Input
                type="number" step="0.1" min="0" max="25"
                value={hemoglobina}
                onChange={(e) => setHemoglobina(e.target.value)}
                placeholder="12.5"
                className={hemoglobina && parseFloat(hemoglobina) < 10 ? 'border-red-400' : ''}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Plaquetas (mil/µL)</Label>
              <Input
                type="number" min="0"
                value={plaquetas}
                onChange={(e) => setPlaquetas(e.target.value)}
                placeholder="150"
                className={plaquetas && parseFloat(plaquetas) < 100 ? 'border-red-400' : ''}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">INR</Label>
              <Input
                type="number" step="0.1" min="0"
                value={inr}
                onChange={(e) => setInr(e.target.value)}
                placeholder="1.0"
                className={inr && parseFloat(inr) > 1.5 ? 'border-orange-400' : ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clínica médica */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Clínica Médica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TriSwitch label="Em acompanhamento pela clínica médica?" value={acompClinico} onChange={setAcompClinico} />
          {acompClinico === 'sim' && (
            <div className="space-y-1.5">
              <Label className="text-sm">Nome do clínico</Label>
              <Input
                value={nomeClinico}
                onChange={(e) => setNomeClinico(e.target.value)}
                placeholder="Dr(a). nome"
                className="max-w-xs"
              />
            </div>
          )}
          {acompClinico === 'nao' && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ⚠ Necessário realizar prescrição clínica.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alta */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Planejamento de Alta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TriSwitch label="Alta prevista?" value={altaPrevista} onChange={setAltaPrevista} />
          <TriSwitch label="Alta hoje?" value={altaHoje} onChange={setAltaHoje} />

          {altaHoje === 'sim' && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-green-800 mb-2">Checklist de alta:</p>
              {[
                { key: 'chkReceita', label: 'Receita', val: chkReceita, set: setChkReceita },
                { key: 'chkRelatorio', label: 'Relatório médico', val: chkRelatorio, set: setChkRelatorio },
                { key: 'chkOrientacoes', label: 'Orientações ao paciente', val: chkOrientacoes, set: setChkOrientacoes },
                { key: 'chkAtestado', label: 'Atestado', val: chkAtestado, set: setChkAtestado },
                { key: 'chkRetorno', label: 'Pedido de retorno', val: chkRetorno, set: setChkRetorno },
                { key: 'chkRX', label: 'Pedido de Raio-X', val: chkRX, set: setChkRX },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.val}
                    onChange={(e) => item.set(e.target.checked)}
                    className="accent-green-600 w-4 h-4"
                  />
                  <span className={`text-sm ${item.val ? 'line-through text-gray-400' : 'text-green-800'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observações livres */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Informações adicionais para o texto da evolução…"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Preview do texto gerado */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-blue-700 font-medium uppercase tracking-wide">
              📋 Texto de Evolução (gerado automaticamente)
            </CardTitle>
            {textoPreview && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(textoPreview)
                  toast.success('Texto copiado!')
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Copiar
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {textoPreview ? (
            <p className="text-sm text-gray-800 leading-relaxed">{textoPreview}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Preencha os campos acima para gerar o texto automaticamente…</p>
          )}
        </CardContent>
      </Card>

      {/* Pendências que serão geradas */}
      {pendenciasPreview().length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-700 font-medium uppercase tracking-wide">
              ⚠ Pendências que serão geradas ({pendenciasPreview().length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {pendenciasPreview().map((p, i) => (
                <li key={i} className="text-xs text-amber-800 flex items-center gap-1.5">
                  <span>•</span>
                  <span>{p.descricao}</span>
                  <span className="text-amber-500">({p.tipo})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Botões */}
      <div className="flex gap-3 justify-end pb-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? 'Salvando…' : 'Registrar Evolução'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ESPECIALIDADES } from '@/lib/cirurgioes'
import { verificarAlergiaPrescricao } from '@/lib/medicamentos'

type Cirurgia = {
  id: string
  nomeCirurgia: string
  cirurgiao: string
  dataCirurgia: string
}

type Paciente = {
  id: string
  nome: string
  leito: string
  diagnostico: string
  cid: string | null
  cirurgioes: string
  subespecialidade: string | null
  comorbidades: string | null
  medicacoes: string | null
  dataNascimento: string | null
  dataInternacao: string
  traumaMecanismo: string | null
  traumaData: string | null
  temAlergia: boolean
  alergias: string | null
  cirurgias: Cirurgia[]
}

type Opts = {
  podePisar: boolean
  cargaCompleta: boolean
  usaAndador: boolean
  podeDobrarJoelho: boolean
  podeSentar: boolean
  podeTrocarCurativo: boolean
  podeRetirarSutura: boolean
  podeDeitarDeLado: boolean
  temFisioterapia: boolean
  recomendacoesFisio: string
  // Órtese
  temOrtese: boolean
  tipoOrtese: string
  instrucaoOrtese: string
  // Prescrição
  diasRivaroxabana: 15 | 30
  usaCefadroxila: boolean
  usaTramadol: boolean
  // Retorno
  diasRetorno: number
  telefoneAgendamento: string
  enderecoAmbulatorio: string
  // Laudo
  afastamentoDias: number
  cpfPaciente: string
  dataAlta: string
}

const DEFAULT_OPTS: Opts = {
  podePisar: true, cargaCompleta: false, usaAndador: true,
  podeDobrarJoelho: true, podeSentar: true,
  podeTrocarCurativo: true, podeRetirarSutura: true, podeDeitarDeLado: false,
  temFisioterapia: false, recomendacoesFisio: '',
  temOrtese: false, tipoOrtese: '', instrucaoOrtese: '',
  diasRivaroxabana: 30, usaCefadroxila: true, usaTramadol: true,
  diasRetorno: 30, telefoneAgendamento: '',
  enderecoAmbulatorio: 'Hospital Memorial, Ambulatório de Ortopedia',
  afastamentoDias: 90, cpfPaciente: '',
  dataAlta: format(new Date(), 'yyyy-MM-dd'),
}

type Aba = 'orientacoes' | 'prescricao' | 'laudo' | 'atestado'

function gerarOrientacoes(pac: Paciente, opts: Opts): string {
  const linhas: string[] = []
  linhas.push(`ORIENTAÇÕES DE ALTA`)
  linhas.push(`Paciente: ${pac.nome}`)
  linhas.push(`Data: ${format(new Date(opts.dataAlta), 'dd/MM/yyyy')}`)
  linhas.push('')
  linhas.push('RECOMENDAÇÕES:')
  if (opts.podePisar) {
    linhas.push(`✅ Pode pisar: SIM — ${opts.cargaCompleta ? 'Carga total' : opts.usaAndador ? 'Carga parcial com andador/muletas' : 'Carga parcial'}`)
  } else {
    linhas.push('❌ Pode pisar: NÃO — Sem apoio no membro operado')
  }
  linhas.push(`${opts.podeDobrarJoelho ? '✅' : '❌'} Pode dobrar o joelho: ${opts.podeDobrarJoelho ? 'SIM' : 'NÃO'}`)
  linhas.push(`${opts.podeSentar ? '✅' : '❌'} Pode sentar: ${opts.podeSentar ? 'SIM' : 'NÃO'}`)
  linhas.push(`${opts.podeTrocarCurativo ? '✅' : '❌'} Pode trocar o curativo: ${opts.podeTrocarCurativo ? 'SIM' : 'NÃO'}`)
  linhas.push(`${opts.podeRetirarSutura ? '✅' : '❌'} Pode retirar suturas: ${opts.podeRetirarSutura ? 'SIM — com 15 dias no posto de saúde' : 'NÃO — aguardar retorno com cirurgião'}`)
  linhas.push(`${opts.podeDeitarDeLado ? '✅' : '❌'} Pode deitar de lado: ${opts.podeDeitarDeLado ? 'SIM' : 'NÃO'}`)
  if (opts.temFisioterapia) {
    linhas.push(`✅ Fisioterapia: SIM`)
    if (opts.recomendacoesFisio) linhas.push(`   ${opts.recomendacoesFisio}`)
  } else {
    linhas.push('➡️  Fisioterapia: aguardar orientação no retorno')
  }
  if (opts.temOrtese) {
    linhas.push(`🦾 Órtese: ${opts.tipoOrtese || 'conforme indicação'}`)
    if (opts.instrucaoOrtese) linhas.push(`   ${opts.instrucaoOrtese}`)
    linhas.push('   ⚠️ Trazer no retorno ao cirurgião.')
  }
  linhas.push('')
  linhas.push('CUIDADOS COM O CURATIVO:')
  linhas.push('Trocar diariamente. Lavar com água e sabão neutro, secar bem com gaze, passar álcool 70% líquido e refazer com gaze e micropore. De preferência com profissional de saúde.')
  linhas.push('')
  linhas.push('⚠️  SINAIS DE ALARME — buscar pronto-socorro se:')
  linhas.push('Febre, dor que não melhora com analgésicos simples, inchaço, extremidades arroxeadas, saída de secreção esverdeada pela ferida ou outros sinais de alarme.')
  linhas.push('')
  linhas.push(`RETORNO: em ${opts.diasRetorno} dias no ambulatório do ${opts.enderecoAmbulatorio}.`)
  if (opts.telefoneAgendamento) linhas.push(`Agendamento pelo telefone: ${opts.telefoneAgendamento}`)
  return linhas.join('\n')
}

function gerarPrescricao(pac: Paciente, opts: Opts): string {
  const alergias = pac.alergias || ''
  const conflitos = verificarAlergiaPrescricao(alergias)
  const linhas: string[] = []
  linhas.push(`PRESCRIÇÃO MÉDICA — 2 VIAS`)
  linhas.push(`Paciente: ${pac.nome}`)
  linhas.push(`Data: ${format(new Date(opts.dataAlta), 'dd/MM/yyyy')}`)
  if (pac.temAlergia && alergias) {
    linhas.push('')
    linhas.push(`⚠️ ALERGIA REGISTRADA: ${alergias}`)
    if (conflitos.length > 0) {
      linhas.push(`🚫 CONFLITO — REVISAR ANTES DE EMITIR: ${conflitos.join(', ')}`)
    }
  }
  linhas.push('')
  linhas.push('Rx:')
  linhas.push('[ ] Dipirona 1g — 1 comprimido de 6/6h se dor (via oral)')
  linhas.push('    OU Paracetamol 750mg — 1 comprimido de 6/6h se alergia à dipirona (via oral)')
  if (opts.usaTramadol) {
    linhas.push('[ ] Tramadol 50mg — 10 comprimidos — até de 8/8h se dor refratária a dipirona (via oral)')
  }
  linhas.push('[ ] Tamarine geleia — 1 colher de sopa 1x/dia por 10 dias (via oral)')
  linhas.push(`[ ] Rivaroxabana 10mg — 1 comprimido ao dia por ${opts.diasRivaroxabana} dias — profilaxia para trombos (via oral)`)
  if (opts.usaCefadroxila) {
    linhas.push('[ ] Cefadroxila 500mg — 1 comprimido de 12/12h por 7 dias (via oral)')
  }
  return linhas.join('\n')
}

function gerarLaudo(pac: Paciente, opts: Opts): string {
  const cirurgioes: string[] = (() => { try { return JSON.parse(pac.cirurgioes) } catch { return [] } })()
  const ultimaCirurgia = pac.cirurgias[0]
  const linhas: string[] = []
  linhas.push('LAUDO MÉDICO')
  linhas.push('')
  linhas.push(`Paciente: ${pac.nome}`)
  linhas.push(`CPF: ${opts.cpfPaciente || '___________________'}`)
  linhas.push('')
  if (pac.traumaMecanismo) {
    linhas.push(`História do Trauma: ${pac.traumaMecanismo}${pac.traumaData ? ` em ${format(new Date(pac.traumaData), 'dd/MM/yyyy')}` : ''}.`)
  }
  linhas.push(`Data de internação: ${format(new Date(pac.dataInternacao), 'dd/MM/yyyy')}.`)
  linhas.push(`Diagnóstico: ${pac.diagnostico}${pac.cid ? ` (CID-10: ${pac.cid})` : ''}.`)
  if (ultimaCirurgia) {
    linhas.push(`Data da cirurgia: ${format(new Date(ultimaCirurgia.dataCirurgia), 'dd/MM/yyyy')} — ${ultimaCirurgia.nomeCirurgia}${cirurgioes.length > 0 ? ` — Dr(a). ${cirurgioes[0]}` : ''}.`)
  }
  linhas.push(`Data de alta da ortopedia: ${format(new Date(opts.dataAlta), 'dd/MM/yyyy')}.`)
  linhas.push('')
  linhas.push(`Tempo de afastamento necessário: ${opts.afastamentoDias} dias a partir da data da cirurgia.`)
  linhas.push('')
  linhas.push('_______________________________')
  linhas.push(cirurgioes.length > 0 ? `Dr(a). ${cirurgioes[0]}` : 'Médico Responsável')
  linhas.push(format(new Date(opts.dataAlta), 'dd/MM/yyyy'))
  return linhas.join('\n')
}

function gerarAtestado(pac: Paciente, opts: Opts): string {
  const linhas: string[] = []
  linhas.push('ATESTADO MÉDICO')
  linhas.push('')
  linhas.push(`CID: Z63.6 — Acompanhamento de pessoa doente internada`)
  linhas.push('')
  linhas.push(`Atesto que _____________________, CPF _____________________,`)
  linhas.push(`esteve presente nesta unidade hospitalar em _____/_____/_____ acompanhando`)
  linhas.push(`a paciente ${pac.nome}, internada para tratamento cirúrgico.`)
  linhas.push('')
  linhas.push('')
  linhas.push('_______________________________')
  linhas.push('Médico Responsável')
  return linhas.join('\n')
}

type Props = { pacientes: Paciente[] }

export default function ModelosAltaCliente({ pacientes }: Props) {
  const [pacienteId, setPacienteId] = useState<string>('')
  const [opts, setOpts] = useState<Opts>(DEFAULT_OPTS)
  const [aba, setAba] = useState<Aba>('orientacoes')
  const [copiado, setCopiado] = useState(false)

  const paciente = pacientes.find(p => p.id === pacienteId) ?? null

  function set<K extends keyof Opts>(key: K, value: Opts[K]) {
    setOpts(prev => ({ ...prev, [key]: value }))
  }

  const texto = useMemo(() => {
    if (!paciente) return ''
    switch (aba) {
      case 'orientacoes': return gerarOrientacoes(paciente, opts)
      case 'prescricao': return gerarPrescricao(paciente, opts)
      case 'laudo': return gerarLaudo(paciente, opts)
      case 'atestado': return gerarAtestado(paciente, opts)
    }
  }, [paciente, opts, aba])

  async function copiar() {
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const ABAS: { id: Aba; label: string }[] = [
    { id: 'orientacoes', label: 'Orientações' },
    { id: 'prescricao', label: 'Receituário' },
    { id: 'laudo', label: 'Laudo Médico' },
    { id: 'atestado', label: 'Atestado Acompanhante' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Modelos de Alta</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gere documentos de alta para impressão ou cópia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: configuração */}
        <div className="lg:col-span-1 space-y-4">
          {/* Seletor de paciente */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Paciente</label>
            <select
              value={pacienteId}
              onChange={e => setPacienteId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Selecionar paciente —</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} · Leito {p.leito}
                </option>
              ))}
            </select>
          </div>

          {paciente && (
            <>
              {/* Alerta de alergia */}
              {paciente.temAlergia && paciente.alergias && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-700">⚠️ ALERGIA: {paciente.alergias}</p>
                  {verificarAlergiaPrescricao(paciente.alergias).length > 0 && (
                    <p className="text-xs text-red-600 mt-1">🚫 Conflito com: {verificarAlergiaPrescricao(paciente.alergias).join(', ')}</p>
                  )}
                </div>
              )}
              {/* Dados básicos */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block">Dados do documento</label>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">CPF do paciente</label>
                  <input type="text" value={opts.cpfPaciente} onChange={e => set('cpfPaciente', e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Data da alta</label>
                  <input type="date" value={opts.dataAlta} onChange={e => set('dataAlta', e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Afastamento (dias)</label>
                  <input type="number" min={0} value={opts.afastamentoDias} onChange={e => set('afastamentoDias', Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Orientações */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Orientações</label>
                {([
                  ['podePisar', 'Pode pisar'],
                  ['cargaCompleta', 'Carga completa (se pode pisar)'],
                  ['usaAndador', 'Com andador/muletas'],
                  ['podeDobrarJoelho', 'Pode dobrar o joelho'],
                  ['podeSentar', 'Pode sentar'],
                  ['podeTrocarCurativo', 'Pode trocar curativo'],
                  ['podeRetirarSutura', 'Retirar sutura com 15d no posto'],
                  ['podeDeitarDeLado', 'Pode deitar de lado'],
                  ['temFisioterapia', 'Fisioterapia indicada'],
                ] as [keyof Opts, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={!!opts[key]} onChange={e => set(key, e.target.checked as Opts[typeof key])}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                    {label}
                  </label>
                ))}
                {opts.temFisioterapia && (
                  <textarea
                    rows={3}
                    placeholder="Protocolo de fisioterapia..."
                    value={opts.recomendacoesFisio}
                    onChange={e => set('recomendacoesFisio', e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                  />
                )}
              </div>

              {/* Órtese */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Órtese pós-operatória</label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={opts.temOrtese} onChange={e => set('temOrtese', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                  Indicada órtese
                </label>
                {opts.temOrtese && (
                  <div className="space-y-2 mt-1">
                    <select value={opts.tipoOrtese} onChange={e => set('tipoOrtese', e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Selecionar tipo —</option>
                      <option value="Robofoot">Robofoot</option>
                      <option value="Brace longo">Brace longo</option>
                      <option value="Tipoia">Tipoia</option>
                      <option value="Outra">Outra</option>
                    </select>
                    <textarea rows={3} placeholder="Instruções de uso da órtese…" value={opts.instrucaoOrtese}
                      onChange={e => set('instrucaoOrtese', e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                )}
              </div>

              {/* Prescrição */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Receituário</label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={opts.usaTramadol} onChange={e => set('usaTramadol', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                  Tramadol
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={opts.usaCefadroxila} onChange={e => set('usaCefadroxila', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                  Cefadroxila 7d
                </label>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Rivaroxabana (dias)</label>
                  <select value={opts.diasRivaroxabana} onChange={e => set('diasRivaroxabana', Number(e.target.value) as 15 | 30)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={15}>15 dias</option>
                    <option value={30}>30 dias</option>
                  </select>
                </div>
              </div>

              {/* Retorno */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block">Retorno</label>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Dias para retorno</label>
                  <input type="number" min={1} value={opts.diasRetorno} onChange={e => set('diasRetorno', Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Telefone de agendamento</label>
                  <input type="tel" value={opts.telefoneAgendamento} onChange={e => set('telefoneAgendamento', e.target.value)}
                    placeholder="(XX) XXXXX-XXXX"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Local do ambulatório</label>
                  <input type="text" value={opts.enderecoAmbulatorio} onChange={e => set('enderecoAmbulatorio', e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Coluna direita: preview do documento */}
        <div className="lg:col-span-2">
          {!paciente ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 h-64 flex items-center justify-center text-slate-400">
              Selecione um paciente para gerar os documentos
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Abas */}
              <div className="flex border-b border-slate-200 overflow-x-auto">
                {ABAS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setAba(id)}
                    className={`text-sm font-medium px-4 py-3 whitespace-nowrap transition-colors ${
                      aba === id
                        ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="p-5">
                <div className="flex justify-end mb-3 gap-2">
                  <button onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors">
                    🖨️ Imprimir
                  </button>
                  <button onClick={copiar}
                    className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      copiado ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}>
                    {copiado ? '✅ Copiado!' : '📋 Copiar texto'}
                  </button>
                </div>
                <pre className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 rounded-lg p-4 border border-slate-200 min-h-[400px]">
                  {texto}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

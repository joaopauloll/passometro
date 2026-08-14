import React from "react";
import Calendar6Months from "./Calendar6Months";
import { formatDate } from "@/lib/examesConstants";
import { assinaturaDocumento } from "@/lib/medicos";

// ==========================================
// TIPAGENS
// ==========================================
interface Config {
  hospitalNome?: string;
  hospitalLogotipoUrl?: string;
  hospitalLogotipoBase64?: string;
  hospitalEndereco?: string;
  hospitalTelefone?: string;
  ambulatorioEndereco?: string;
  ambulatorioTelefone?: string;
}

interface Cirurgia {
  cirurgiao?: string;
  lateralidade?: string;
  diagnostico?: string;
  nome_cirurgia?: string;
  data_cirurgia?: string;
  cid?: string;
}

interface Paciente {
  nome: string;
  diagnostico?: string;
  data_internacao?: string;
}

interface Med {
  texto: string;
  controle?: boolean;
  alternativa?: boolean;
  quantidade?: string;
}

interface Modelo {
  retorno_telefone?: string;
  retorno_endereco?: string;
  carga_tipo?: string;
  pode_pisar?: boolean;
  pode_dobrar_joelho?: boolean;
  pode_sentar?: boolean;
  pode_deitar_lado?: boolean;
  pode_fisioterapia?: boolean;
  pode_trocar_curativo?: boolean;
  pode_retirar_suturas?: boolean;
  ortese_tipo?: string;
  ortese_outra?: string;
  ortese_instrucoes?: string;
  orientacoes_gerais?: string;
  trocar_curativo_como?: string;
  sinais_alarme?: string;
  retorno_dias?: number | string;
}

const DEFAULT_HOSPITAL = "HOSPITAL MEMORIAL SÃO FRANCISCO";
const DEFAULT_ADDRESS =
  "Av. Gov. Juvenal Lamartine, 979, Tirol, Natal - RN, 59.022-020";
const DEFAULT_PHONE = "(84) 3133-4200";
const DEFAULT_EMAIL = "memorial@memorialnatal.com.br";

export const PAGE_STYLE: React.CSSProperties = {
  width: "794px",
  minHeight: "1123px",
  padding: "64px 60px 56px",
  background: "#fff",
  fontFamily: "Arial, sans-serif",
  color: "#1e293b",
  fontSize: "13px",
  lineHeight: "1.6",
  boxSizing: "border-box",
};

// ==========================================
// COMPONENTES COM CORES "HTML2CANVAS SAFE"
// ==========================================

export function DocHeader({
  config,
  cirurgiao,
}: {
  config?: Config;
  cirurgiao?: string;
}) {
  const med = assinaturaDocumento(cirurgiao);

  return (
    <div
      className="flex justify-between items-start border-b-2 pb-2 mb-6"
      style={{ borderColor: "#cbd5e1" }}
    >
      <div className="flex items-center gap-3">
        {config?.hospitalLogotipoBase64 || config?.hospitalLogotipoUrl ? (
          <img
            src={config.hospitalLogotipoBase64 || config.hospitalLogotipoUrl}
            alt="Logo"
            className="w-56 h-16 object-contain"
            crossOrigin="anonymous"
          />
        ) : (
          <div
            className="w-16 h-16 rounded flex items-center justify-center"
            style={{ backgroundColor: "#dc2626" }}
          >
            <div className="text-white font-bold text-[10px] text-center leading-tight">
              HOSPITAL
              <br />
              MEMORIAL
            </div>
          </div>
        )}
        {/* <div>
          <div className="font-bold text-[13px]" style={{ color: "#1e293b" }}>
            {config?.hospitalNome || "Hospital Memorial"}
          </div>
          <div className="text-[10px]" style={{ color: "#64748b" }}>
            Ortopedia e Traumatologia
          </div>
        </div> */}
      </div>

      <div className="text-right max-w-xs">
        <div className="font-bold text-[13px]" style={{ color: "#1e293b" }}>
          {med?.nome_completo || cirurgiao || "Médico"}
        </div>
        <div
          className="text-[9px] leading-relaxed"
          style={{ color: "#64748b" }}
        >
          {med?.especialidade}
        </div>
        <div className="text-[9px]" style={{ color: "#64748b" }}>
          Membro titular da SBOT
        </div>
      </div>
    </div>
  );
}

export function DocFooter({
  cirurgiao,
  data,
  config,
}: {
  cirurgiao?: string;
  data?: string;
  config?: Config;
}) {
  const med = assinaturaDocumento(cirurgiao);
  const crmLine =
    med?.crm && med.crm !== "—"
      ? `CRM ${med.crm}${med.teot ? ` | TEOT ${med.teot}` : ""}`
      : "";

  return (
    <div className="mt-12 text-center">
      <div
        className="border-t w-[280px] mx-auto mb-1"
        style={{ borderColor: "#64748b" }}
      ></div>
      <div
        className="text-[12px] italic font-bold"
        style={{ color: "#1e293b" }}
      >
        {med?.nome_completo || cirurgiao || "Médico responsável"}
      </div>
      <div className="text-[10px] italic" style={{ color: "#475569" }}>
        {med?.especialidade}
      </div>
      {crmLine && (
        <div className="text-[10px] italic" style={{ color: "#475569" }}>
          {crmLine}
        </div>
      )}
      <div
        className="mt-4 text-[9px] border-t pt-2"
        style={{ color: "#94a3b8", borderColor: "#e2e8f0" }}
      >
        {[
          (config?.hospitalNome || DEFAULT_HOSPITAL).toUpperCase(),
          config?.hospitalEndereco || DEFAULT_ADDRESS,
          `Tel.: ${config?.hospitalTelefone || DEFAULT_PHONE}`,
          DEFAULT_EMAIL,
        ]
          .filter(Boolean)
          .join(" | ")}
        {config?.ambulatorioEndereco || config?.ambulatorioTelefone ? (
          <>
            <br />
            Ambulatório:{" "}
            {[
              config.ambulatorioEndereco,
              config.ambulatorioTelefone
                ? `Tel.: ${config.ambulatorioTelefone}`
                : undefined,
            ]
              .filter(Boolean)
              .join(" | ")}
          </>
        ) : null}
      </div>
    </div>
  );
}

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-3 py-1.5 font-bold text-[14px] uppercase tracking-wide mb-4 text-center"
      style={{ backgroundColor: "#e2e8f0", color: "#1e293b" }}
    >
      {children}
    </div>
  );
}

// ... as funções auxiliares de meds (parseMed, etc) continuam iguais ...
function parseMed(texto: string) {
  const parts = (texto || "").split(" — ");
  const nome = parts[0] || texto;
  const instrucoes = parts.slice(1).join(" — ");
  return { nome, instrucoes };
}

function numeroPorExtenso(n: number | string) {
  const map: Record<string, string> = {
    30: "TRINTA",
    45: "QUARENTA E CINCO",
    60: "SESSENTA",
    90: "NOVENTA",
    120: "CENTO E VINTE",
    180: "CENTO E OITENTA",
  };
  return map[String(n)] || String(n);
}

function gerarRecomendacoesModelo(modelo: Modelo) {
  const recs: string[] = [];
  if (modelo.carga_tipo === "nenhuma")
    recs.push(
      modelo.pode_pisar
        ? "Repouso absoluto, sem apoio no membro operado."
        : "Não deambular — repouso absoluto sem apoio no membro operado.",
    );
  else if (modelo.carga_tipo === "parcial_andador")
    recs.push("Apoio parcial no membro operado com uso de andador.");
  else if (modelo.carga_tipo === "parcial_muletas")
    recs.push("Apoio parcial no membro operado com uso de muletas.");
  else if (modelo.carga_tipo === "total" && modelo.pode_pisar)
    recs.push("Apoio total permitido no membro operado.");
  else if (!modelo.pode_pisar)
    recs.push("Não pisar / não apoiar o membro operado.");

  if (modelo.pode_dobrar_joelho === false)
    recs.push("Não dobrar o joelho operado.");
  if (modelo.pode_sentar === false)
    recs.push("Evitar sentar-se por longos períodos.");
  if (modelo.pode_deitar_lado === false)
    recs.push("Não deitar sobre o lado operado.");
  if (modelo.pode_fisioterapia)
    recs.push("Iniciar fisioterapia conforme prescrição específica.");
  if (modelo.pode_trocar_curativo)
    recs.push("Permitida a troca do curativo conforme orientação.");
  if (modelo.pode_retirar_suturas)
    recs.push("Retirada de suturas conforme retorno ambulatorial.");

  if (modelo.ortese_tipo && modelo.ortese_tipo !== "nenhuma") {
    const orteseLabel =
      modelo.ortese_tipo === "outra"
        ? modelo.ortese_outra || "órtese"
        : modelo.ortese_tipo;
    recs.push(
      `Uso de órtese: ${orteseLabel}.${modelo.ortese_instrucoes ? " " + modelo.ortese_instrucoes : ""}`,
    );
  }
  return recs;
}

export function CartaoRetornoPage({
  config,
  paciente,
  cirurgia,
  modelo,
  rxRetorno,
  rxQual,
  data,
}: any) {
  const cirurgiao = cirurgia?.cirurgiao;
  const lateralidade =
    cirurgia?.lateralidade && cirurgia.lateralidade !== "nao_aplicavel"
      ? ` (${cirurgia.lateralidade})`
      : "";

  return (
    <div>
      <DocHeader config={config} cirurgiao={cirurgiao} />
      <div className="text-center mb-5">
        <div className="text-[22px] font-bold tracking-[1px]">
          CARTÃO DE RETORNO E ORIENTAÇÕES:
        </div>
      </div>
      <div className="mb-4 text-[13px] leading-loose">
        <div>
          <strong>MÉDICO:</strong> {(cirurgiao || "—").toUpperCase()}
        </div>
        <div>
          <strong>PACIENTE:</strong> {paciente.nome}
        </div>
        <div className="italic underline font-bold mt-1">DIAGNÓSTICO:</div>
        <div className="italic pl-2">
          {(cirurgia?.diagnostico || paciente.diagnostico || "—") +
            lateralidade}
        </div>
        <div className="italic mt-1">
          <strong>Cirurgia:</strong> {cirurgia?.nome_cirurgia || "—"}
          {cirurgia?.data_cirurgia
            ? ` — ${formatDate(cirurgia.data_cirurgia)}`
            : ""}
        </div>
      </div>
      <div className="mb-3 text-[13px]">
        <div>
          Agendar o retorno no ambulatório do Memorial em{" "}
          <strong className="border-b border-black w-32 inline-block"></strong>.
        </div>
        <ul className="mt-2 pl-6 leading-loose list-disc">
          <li>
            <strong>
              TELEFONE: {modelo?.retorno_telefone || "3133-4200 (OPÇÃO 4)"}.
            </strong>
          </li>
          <li>
            <strong>
              ENDEREÇO:{" "}
              {modelo?.retorno_endereco ||
                "Rua José Barreira Lima Verde, 90 - Tirol, Natal - RN, 59022-010"}
              .
            </strong>
          </li>
        </ul>
      </div>
      <div className="mb-4 text-[13px]">
        <span>
          Fazer RX no retorno? ({rxRetorno ? " X " : "   "}) Sim (
          {!rxRetorno ? " X " : "   "}) Não
        </span>
        {rxRetorno && rxQual && <div className="mt-1">Qual? {rxQual}</div>}
      </div>
      <div className="mt-4">
        <Calendar6Months />
      </div>
      <DocFooter cirurgiao={cirurgiao} data={data} config={config} />
    </div>
  );
}

export function PrescricaoPage({
  config,
  paciente,
  cirurgia,
  meds,
  data,
}: any) {
  const cirurgiao = cirurgia?.cirurgiao;
  const oralMeds = meds.filter((m: Med) => !m.controle);
  const palavrasExterno = [
    "uso externo",
    "muleta",
    "andador",
    "brace",
    "tipoia",
  ];
  const externoMeds = meds.filter((m: Med) =>
    palavrasExterno.some((palavra) => m.texto?.toLowerCase().includes(palavra)),
  );
  const oralOnly = oralMeds.filter(
    (m: Med) =>
      !palavrasExterno.some((palavra) =>
        m.texto?.toLowerCase().includes(palavra),
      ),
  );

  let num = 0;

  return (
    <div>
      <DocHeader config={config} cirurgiao={cirurgiao} />
      <div className="mb-4 text-[12px]">
        <div>
          <strong>Nome:</strong> {paciente.nome}
        </div>
        <div>
          <strong>Data:</strong> {data}
        </div>
      </div>

      <div
        className="text-white px-2.5 py-1 font-bold text-[12px] mb-3"
        style={{ backgroundColor: "#334155" }}
      >
        USO ORAL
      </div>

      <div className="mb-4 text-[12px]">
        {oralOnly.length > 0 ? (
          oralOnly.map((med: Med, i: number) => {
            const { nome, instrucoes } = parseMed(med.texto);
            const label = med.alternativa ? "OU" : `${++num})`;
            return (
              <div key={i} className="mb-3 pl-2">
                <div className="flex items-baseline gap-1">
                  <span className="font-bold min-w-[24px]">{label}</span>
                  <span className="font-bold">{nome.toUpperCase()}</span>
                  <span
                    className="border-b flex-1 mb-0.5 mx-1"
                    style={{ borderColor: "#334155" }}
                  ></span>
                  <span className="font-bold min-w-[60px] text-right">
                    {med.quantidade || "1 caixa"}
                  </span>
                </div>
                {instrucoes && (
                  <div className="pl-7 flex-1 leading-relaxed mt-1">
                    Tomar {instrucoes}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="pl-2" style={{ color: "#94a3b8" }}>
            Nenhuma medicação oral.
          </div>
        )}
      </div>

      {externoMeds.length > 0 && (
        <div className="mb-4 text-[12px]">
          <div
            className="text-white px-2.5 py-1 font-bold text-[12px] mb-3"
            style={{ backgroundColor: "#334155" }}
          >
            USO EXTERNO
          </div>
          {externoMeds.map((med: Med, i: number) => (
            <div key={i} className="mb-1 pl-2">
              {i + 1}) {med.texto.toUpperCase()}
            </div>
          ))}
        </div>
      )}
      <DocFooter cirurgiao={cirurgiao} data={data} config={config} />
    </div>
  );
}

export function OrientacoesPage({
  config,
  paciente,
  cirurgia,
  modelo,
  data,
}: any) {
  if (!modelo) return null;
  const cirurgiao = cirurgia?.cirurgiao;
  const lateralidade =
    cirurgia?.lateralidade && cirurgia.lateralidade !== "nao_aplicavel"
      ? ` ${cirurgia.lateralidade.toUpperCase()}`
      : "";
  const recomendacoes = gerarRecomendacoesModelo(modelo);

  return (
    <div>
      <DocHeader config={config} cirurgiao={cirurgiao} />
      <SecaoTitulo>Relatório Pós Operatório e Orientações</SecaoTitulo>

      <div className="mb-4 text-[12px] leading-loose">
        <div>
          Paciente: <strong>{paciente.nome}</strong>
        </div>
        <div>
          Cirurgia realizada:{" "}
          <strong>
            {(cirurgia?.nome_cirurgia || "—").toUpperCase()}
            {lateralidade}
          </strong>
        </div>
        <div>
          Cirurgião: <strong>{cirurgiao || "—"}</strong>
          {cirurgiao
            ? ` – CRM RN ${assinaturaDocumento(cirurgiao)?.crm || "—"}`
            : ""}
        </div>
        <div>Intercorrências: Não houve.</div>
        {cirurgia?.data_cirurgia && (
          <div>
            Data da cirurgia:{" "}
            <strong>{formatDate(cirurgia.data_cirurgia)}</strong>
          </div>
        )}
      </div>

      <div className="font-bold underline text-center mb-3 text-[14px]">
        ORIENTAÇÕES DE ALTA:
      </div>

      {recomendacoes.length > 0 && (
        <div className="text-[12px] leading-relaxed mb-3">
          <div className="font-bold mb-1.5">Restrições e cuidados:</div>
          <ul className="pl-5 m-0 list-disc">
            {recomendacoes.map((r, i) => (
              <li key={i} className="mb-1">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {modelo.orientacoes_gerais && (
        <div className="text-[12px] whitespace-pre-wrap leading-relaxed mb-3">
          {modelo.orientacoes_gerais}
        </div>
      )}
      {modelo.trocar_curativo_como && (
        <div className="text-[12px] whitespace-pre-wrap leading-relaxed mb-3">
          <div className="font-bold mb-1">
            Cuidados com a ferida operatória:
          </div>
          {modelo.trocar_curativo_como}
        </div>
      )}
      {modelo.sinais_alarme && (
        <div className="text-[12px] whitespace-pre-wrap leading-relaxed mb-3">
          <div className="font-bold mb-1">
            Sinais de alarme — procurar atendimento:
          </div>
          {modelo.sinais_alarme}
        </div>
      )}
      {modelo.retorno_dias && (
        <div className="text-[12px] leading-relaxed mb-3">
          <strong>Retorno ambulatorial:</strong> em {modelo.retorno_dias} dias.
        </div>
      )}
      <DocFooter cirurgiao={cirurgiao} data={data} config={config} />
    </div>
  );
}

export function ReceitaControlePage({
  config,
  paciente,
  cirurgia,
  medsControle,
  data,
  via,
}: any) {
  if (!medsControle || medsControle.length === 0) return null;
  const cirurgiao = cirurgia?.cirurgiao;
  const viaLabel = via === 2 ? "2ª VIA – PACIENTE" : "1ª VIA – FARMÁCIA";

  return (
    <div>
      <DocHeader config={config} cirurgiao={cirurgiao} />
      <div className="text-center italic font-bold text-[16px] mb-5">
        RECEITUÁRIO DE CONTROLE ESPECIAL
      </div>

      <div
        className="grid grid-cols-2 border mb-5"
        style={{ borderColor: "#334155" }}
      >
        <div
          className="p-2 border-r text-[10px]"
          style={{ borderColor: "#334155" }}
        >
          <div className="font-bold">EMITENTE:</div>
          <div className="font-bold">
            {config?.hospitalNome || DEFAULT_HOSPITAL}
          </div>
          <div>{config?.hospitalEndereco || DEFAULT_ADDRESS}</div>
          <div>Tel.: {config?.hospitalTelefone || DEFAULT_PHONE}</div>
          <div>{DEFAULT_EMAIL}</div>
        </div>
        <div className="p-2 text-[11px] flex flex-col justify-center items-center">
          <div className="font-bold text-[14px]" style={{ color: "#1e293b" }}>
            {viaLabel}
          </div>
        </div>
      </div>

      <div className="mb-4 text-[12px] leading-loose">
        <div>
          PACIENTE: <strong>{paciente.nome}</strong>
        </div>
      </div>

      <div className="font-bold mb-2 text-[12px]">USO ORAL:</div>
      <div className="mb-5 text-[12px]">
        {medsControle.map((med: Med, i: number) => {
          const { nome, instrucoes } = parseMed(med.texto);
          return (
            <div key={i} className="mb-3">
              <div className="flex items-baseline gap-1">
                <span className="font-bold">{nome.toUpperCase()}</span>
                <span
                  className="border-b flex-1 mb-0.5 mx-1"
                  style={{ borderColor: "#334155" }}
                ></span>
                <span className="font-bold min-w-[60px] text-right">
                  {med.quantidade || "1 caixa"}
                </span>
              </div>
              {instrucoes && (
                <div className="pl-2 mt-1 leading-relaxed">
                  Tomar {instrucoes.toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-2 text-[12px]">Natal, {data}</div>
      <DocFooter cirurgiao={cirurgiao} data={data} config={config} />

      <div
        className="grid grid-cols-2 border mt-5 text-[10px]"
        style={{ borderColor: "#334155" }}
      >
        <div className="p-2 border-r" style={{ borderColor: "#334155" }}>
          <div className="font-bold text-center mb-1.5">
            IDENTIFICAÇÃO DO COMPRADOR
          </div>
          <div className="leading-relaxed">
            Nome: ........................................................
            <br />
            ........................................................................
            <br />
            Ident.: .......................... Órg. Emissor: ...........
            <br />
            End.:
            ................................................................
            <br />
            ........................................................................
            <br />
            Cidade: ...................................... UF: ...............
            <br />
            Telefone: .......................................................
          </div>
        </div>
        <div className="p-2">
          <div className="font-bold text-center mb-1.5">
            IDENTIFICAÇÃO DO FORNECEDOR
          </div>
          <div className="mt-10 text-center">
            _____________________ ____/__/___
            <br />
            ASSINATURA DO FARMACÊUTICO DATA:
          </div>
        </div>
      </div>
    </div>
  );
}

export function FisioterapiaPage({
  config,
  paciente,
  cirurgia,
  sessoes,
  indicacao,
  data,
}: any) {
  const cirurgiao = cirurgia?.cirurgiao;
  const lateralidade =
    cirurgia?.lateralidade && cirurgia.lateralidade !== "nao_aplicavel"
      ? ` (${cirurgia.lateralidade})`
      : "";

  return (
    <div>
      <DocHeader config={config} cirurgiao={cirurgiao} />
      <SecaoTitulo>Solicitação de Fisioterapia</SecaoTitulo>

      <div className="mb-4 text-[12px] leading-loose">
        <div>
          <strong>Nome:</strong> {paciente.nome}
        </div>
        <div>
          <strong>Data:</strong> {data}
        </div>
      </div>

      <div className="mb-4 text-[12px]">
        <div className="italic mb-2">Solicito:</div>
        <div className="flex items-baseline gap-1">
          <span>FISIOTERAPIA MOTORA</span>
          <span
            className="border-b flex-1 mb-0.5 mx-1"
            style={{ borderColor: "#334155" }}
          ></span>
          <span className="font-bold">{sessoes} sessões</span>
        </div>
      </div>

      <div className="mb-4 text-[12px]">
        <div className="italic mb-1.5">Indicação clínica:</div>
        <div className="whitespace-pre-wrap leading-relaxed">
          {indicacao ||
            `Pós-operatório de ${cirurgia?.nome_cirurgia || "procedimento"}${lateralidade}`}
        </div>
      </div>

      <DocFooter cirurgiao={cirurgiao} data={data} config={config} />
    </div>
  );
}

export function LaudoPage({
  config,
  paciente,
  cirurgia,
  laudo,
  diasAfastamento,
  data,
}: any) {
  const cirurgiao = cirurgia?.cirurgiao;
  const lateralidade =
    cirurgia?.lateralidade && cirurgia.lateralidade !== "nao_aplicavel"
      ? ` ${cirurgia.lateralidade}`
      : "";

  return (
    <div>
      <DocHeader config={config} cirurgiao={cirurgiao} />
      <SecaoTitulo>Atestado Médico e Relatório</SecaoTitulo>

      <div className="text-[12px] leading-loose mb-5">
        <p className="indent-10 text-justify">
          Atesto que o(a) paciente Sr(a){" "}
          <strong>
            <u>{paciente.nome}</u>
          </strong>{" "}
          foi submetido(a) a tratamento cirúrgico nesta unidade hospitalar,
          devendo afastar-se do trabalho por um período de{" "}
          <strong>
            {diasAfastamento || "___"} (
            {diasAfastamento ? numeroPorExtenso(diasAfastamento) : "___"})
          </strong>{" "}
          dias, a contar de{" "}
          <strong>
            {paciente.data_internacao
              ? formatDate(paciente.data_internacao)
              : "____________"}
          </strong>{" "}
          (DATA DA INTERNAÇÃO HOSPITALAR E CIRURGIA) por motivo de doença.
          (CID-10: Z54.0 {cirurgia?.cid || "—"})
        </p>
        <p className="mt-2">Natal, {data}</p>
      </div>

      <div className="text-[12px] leading-relaxed mb-4 whitespace-pre-wrap">
        {laudo ||
          `PACIENTE SUBMETIDO(A) A ${(cirurgia?.nome_cirurgia || "PROCEDIMENTO CIRÚRGICO")?.toUpperCase()}${lateralidade?.toUpperCase()} EM ____________, COM PROGNÓSTICO ESPERADO DE RECUPERAÇÃO EM ${diasAfastamento || "___"} DIAS.`}
      </div>

      <DocFooter cirurgiao={cirurgiao} data={data} config={config} />
    </div>
  );
}

export function AtestadoAcompanhantePage({
  config,
  paciente,
  cirurgia,
  data,
}: any) {
  const cirurgiao = cirurgia?.cirurgiao;

  return (
    <div>
      <DocHeader config={config} cirurgiao={cirurgiao} />
      <SecaoTitulo>Atestado para Acompanhante de Pessoa Doente</SecaoTitulo>

      <div className="text-[13px] leading-[2.4] mb-5 text-justify">
        <p className="indent-10">
          Atesto, para os devidos fins, que o(a) Sr(a){" "}
          <strong className="border-b border-black w-64 inline-block align-bottom leading-[1px]"></strong>
          , portador(a) do documento de identidade nº{" "}
          <strong className="border-b border-black w-24 inline-block align-bottom leading-[1px]"></strong>
          , órgão emissor{" "}
          <strong className="border-b border-black w-16 inline-block align-bottom leading-[1px]"></strong>
          , CPF nº{" "}
          <strong className="border-b border-black w-32 inline-block align-bottom leading-[1px]"></strong>
          , residente no endereço{" "}
          <strong className="border-b border-black w-64 inline-block align-bottom leading-[1px]"></strong>
          , acompanhou o(a) paciente{" "}
          <strong>
            <u>{paciente.nome}</u>
          </strong>
          , internado(a) nesta unidade hospitalar.
        </p>
        <p className="indent-10 mt-3">
          O acompanhamento ocorreu no período de{" "}
          <strong>____/____/______</strong> a <strong>____/____/______</strong>,
          totalizando{" "}
          <strong className="border-b border-black w-12 inline-block align-bottom leading-[1px]"></strong>{" "}
          dias de internação, sendo necessário o acompanhante para auxiliar nos
          cuidados e assistência ao(a) paciente.
        </p>
        <p className="indent-10 mt-3 italic" style={{ color: "#475569" }}>
          (CID-10: Z74.3 — Necessidade de assistência contínua / acompanhante de
          pessoa doente)
        </p>
      </div>

      <div className="mt-8 text-[12px]">Natal, {data}</div>
      <DocFooter cirurgiao={cirurgiao} data={data} config={config} />
    </div>
  );
}

export function RelatorioINSSPage({
  config,
  paciente,
  cirurgia,
  relatorio,
  data,
}: any) {
  const cirurgiao = cirurgia?.cirurgiao;

  return (
    <div>
      <DocHeader config={config} cirurgiao={cirurgiao} />
      <SecaoTitulo>Relatório Médico para Fins Previdenciários</SecaoTitulo>
      <div className="text-[12px] leading-relaxed whitespace-pre-wrap text-justify">
        <div className="mb-4">
          <strong>Paciente:</strong> {paciente.nome}
          {paciente.cpf ? ` | CPF: ${paciente.cpf}` : ""}
        </div>
        {relatorio || "Relatório não gerado."}
      </div>
      <div className="mt-6 text-[12px]">Natal, {data}</div>
      <DocFooter cirurgiao={cirurgiao} data={data} config={config} />
    </div>
  );
}

import { formatDate } from "@/lib/examesConstants";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import PrintButton from "@/components/relatorio/PrintButton";
import DownloadPDFButton from "@/components/shared/DownloadPDFButton";

type Params = { params: Promise<{ id: string }> };

export default async function CalendarioPage({ params }: Params) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { id } = await params;

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      cirurgias: { orderBy: { dataCirurgia: "asc" } },
    },
  });

  if (!paciente) notFound();

  const cirurgioes: string[] = (() => {
    try {
      return JSON.parse(paciente.cirurgioes);
    } catch {
      return [];
    }
  })();

  const primeiraCirurgia = paciente.cirurgias[0];
  const diasInternado = differenceInDays(
    new Date(),
    new Date(paciente.dataInternacao),
  );

  return (
    <>
      {/* Estilos de impressão */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page {
            margin: 0;
            padding: 20mm;
            font-family: Arial, sans-serif;
            font-size: 11pt;
            color: #000;
          }
          body { background: white !important; }
          .print-border { border: 1px solid #999 !important; }
        }
        @media screen {
          .print-page { max-width: 210mm; margin: 0 auto; }
          .print-header { max-width: 210mm; margin: 0 auto; }
        }
      `}</style>

      {/* Barra de ações (não imprime) */}
      <div className="no-print print-header pb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/pacientes/${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            ← {paciente.nome}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Calendário de Tratamento
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Clique em "Imprimir" para gerar a folha para o paciente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <DownloadPDFButton
            nomeArquivo={`calendario-${paciente.nome.replace(/\s+/g, "-")}`}
          />
        </div>
      </div>

      {/* Conteúdo imprimível */}
      <div className="print-page bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        {/* Cabeçalho */}
        <div className="border-b-2 border-blue-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-blue-700">
                CALENDÁRIO DE TRATAMENTO
              </h2>
              {cirurgioes.length > 0 && (
                <p className="text-sm font-medium mt-1">
                  Dr(a). {cirurgioes.join(" / Dr(a). ")}
                </p>
              )}
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>Data: {format(new Date(), "dd/MM/yyyy")}</p>
            </div>
          </div>
        </div>

        {/* Dados do paciente */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-6 text-sm">
          <div>
            <span className="font-semibold">Paciente:</span> {paciente.nome}
          </div>
          <div>
            <span className="font-semibold">Registro:</span>{" "}
            {paciente.registroHospitalar}
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Diagnóstico:</span>{" "}
            {paciente.diagnostico}
            {paciente.cid ? ` (${paciente.cid})` : ""}
          </div>
          {primeiraCirurgia && (
            <div className="col-span-2">
              <span className="font-semibold">Cirurgia realizada:</span>{" "}
              {primeiraCirurgia.nomeCirurgia}
            </div>
          )}
        </div>

        {/* Linha do tempo */}
        <div className="mb-8">
          <h3 className="font-bold text-sm uppercase text-gray-500 mb-4">
            Linha do Tempo
          </h3>
          <div className="relative">
            {/* Linha vertical */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200" />

            <div className="space-y-4">
              {/* Trauma */}
              {paciente.traumaData && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-orange-400 flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-orange-600 text-xs font-bold">T</span>
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold text-sm">Trauma</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(paciente.traumaData), "dd/MM/yyyy")}
                    </p>
                    {paciente.traumaMecanismo && (
                      <p className="text-xs text-gray-500">
                        {paciente.traumaMecanismo}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Internação */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center flex-shrink-0 z-10">
                  <span className="text-blue-600 text-xs font-bold">I</span>
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-sm">Internação</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(paciente.dataInternacao), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              {/* Cirurgias */}
              {paciente.cirurgias.map((c, idx) => (
                <div key={c.id} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-green-700 text-xs font-bold">C</span>
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold text-sm">
                      Cirurgia {paciente.cirurgias.length > 1 ? idx + 1 : ""}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(c.dataCirurgia.toISOString())}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.nomeCirurgia} — Dr(a). {c.cirurgiao}
                    </p>
                  </div>
                </div>
              ))}

              {/* Alta */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-purple-400 flex items-center justify-center flex-shrink-0 z-10">
                  <span className="text-purple-600 text-xs font-bold">A</span>
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-sm">Alta hospitalar</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(), "dd/MM/yyyy")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {diasInternado} dias de internamento
                  </p>
                </div>
              </div>

              {/* Retorno */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-400 flex items-center justify-center flex-shrink-0 z-10">
                  <span className="text-gray-600 text-xs font-bold">R</span>
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-sm">Retorno ambulatorial</p>
                  <div className="mt-1 border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-400 min-w-48 print-border">
                    Data: ___/___/______
                  </div>
                  <div className="mt-1 border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-400 min-w-48 print-border">
                    Horário: ___:___h
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RX de retorno */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-sm uppercase text-blue-700 mb-2">
            Raio-X de Retorno
          </h3>
          <div className="text-sm text-gray-700">
            <p>
              ☐ Sim — Incidências:{" "}
              <span className="border-b border-gray-400 inline-block min-w-48">
                ______________________________
              </span>
            </p>
            <p className="mt-1">☐ Não necessita</p>
          </div>
        </div>

        {/* Recomendações gerais */}
        <div className="mb-6">
          <h3 className="font-bold text-sm uppercase text-gray-500 mb-2">
            Recomendações
          </h3>
          <div className="space-y-1 text-sm">
            <p>• Retornar ao ambulatório na data marcada</p>
            <p>
              • Em caso de febre, aumento da dor ou alteração no curativo,
              procurar pronto-socorro
            </p>
            {paciente.alergias && (
              <p>
                • <strong>Alergia:</strong> {paciente.alergias}
              </p>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="border-t border-gray-200 pt-4 mt-8">
          <div className="flex justify-between items-end">
            <div className="text-sm text-gray-500">
              <p className="text-xs">
                Documento gerado em{" "}
                {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 w-48 mb-1" />
              <p className="text-xs text-gray-500">
                Assinatura e carimbo do médico
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

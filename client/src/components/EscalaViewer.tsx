import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Table, Download } from 'lucide-react';

interface Military {
  patente: string;
  nome: string;
  turno: string;
  linha_original: string;
}

interface EscalaData {
  cabecalho: {
    unidade?: string;
    periodo?: string;
    data?: string;
    escala?: string;
  };
  turnos: {
    pernoite: Military[];
    manha: Military[];
    tarde: Military[];
    diario: Military[];
  };
  observacoes: string[];
  estatisticas: {
    total_militares: number;
    por_turno: {
      pernoite: number;
      manha: number;
      tarde: number;
      diario: number;
    };
  };
}

interface EscalaViewerProps {
  pdfUrl?: string;
  extractedData?: EscalaData;
  fileName: string;
}

const EscalaViewer: React.FC<EscalaViewerProps> = ({ pdfUrl, extractedData, fileName }) => {
  const [viewMode, setViewMode] = useState<'pdf' | 'table'>('table');

  const nomesTurnos = {
    pernoite: 'Serviço de Pernoite (00:00 - 06:00)',
    manha: 'Serviço da Manhã (06:00 - 12:00)',
    tarde: 'Serviço da Tarde (12:00 - 18:00)',
    diario: 'Serviço Diário (Administrativo)'
  };

  const renderPdfView = () => (
    <div className="h-full w-full">
      <iframe
        src={pdfUrl}
        className="w-full h-[600px] border-0 rounded-lg"
        title={`PDF: ${fileName}`}
      />
    </div>
  );

  const renderTableView = () => {
    if (!extractedData) {
      return (
        <div className="text-center p-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Dados não extraídos automaticamente</p>
          <p className="text-sm">Use o modo PDF para visualizar</p>
        </div>
      );
    }

    return (
      <div className="escala-militar-container space-y-6">
        {/* Cabeçalho */}
        <div className="escala-header text-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">ESCALA DE SERVIÇO</h2>
          {extractedData.cabecalho.unidade && (
            <p className="text-lg font-semibold text-blue-800 mb-1">
              {extractedData.cabecalho.unidade}
            </p>
          )}
          {extractedData.cabecalho.periodo && (
            <p className="text-sm text-gray-600">
              Período: {extractedData.cabecalho.periodo}
            </p>
          )}
          {extractedData.cabecalho.data && (
            <p className="text-sm text-gray-600">
              Data: {extractedData.cabecalho.data}
            </p>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {extractedData.estatisticas.total_militares}
            </div>
            <div className="text-xs text-blue-800">Total</div>
          </div>
          {Object.entries(extractedData.estatisticas.por_turno).map(([turno, count]) => (
            <div key={turno} className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-green-600">{count}</div>
              <div className="text-xs text-green-800 capitalize">{turno}</div>
            </div>
          ))}
        </div>

        {/* Turnos */}
        <div className="turnos-container space-y-6">
          {Object.entries(nomesTurnos).map(([turno, nomeCompleto]) => {
            const militares = extractedData.turnos[turno as keyof typeof extractedData.turnos];
            
            if (!militares || militares.length === 0) return null;

            return (
              <Card key={turno} className="border-2 border-blue-200">
                <CardHeader className="bg-blue-600 text-white">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {nomeCompleto}
                    <span className="bg-blue-500 px-2 py-1 rounded text-sm">
                      {militares.length} militar{militares.length !== 1 ? 'es' : ''}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 w-32">
                            Posto/Graduação
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Nome Completo
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {militares.map((militar, index) => (
                          <tr
                            key={index}
                            className={`border-b hover:bg-gray-50 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-mono font-bold">
                                {militar.patente}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {militar.nome}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Observações */}
        {extractedData.observacoes && extractedData.observacoes.length > 0 && (
          <Card className="border-2 border-orange-200">
            <CardHeader className="bg-orange-100">
              <CardTitle className="text-lg text-orange-800">Observações</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2">
                {extractedData.observacoes.map((obs, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    {obs}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Rodapé oficial */}
        <div className="text-center text-xs text-gray-500 border-t pt-4 mt-8">
          <p>Documento gerado automaticamente pelo Sistema de Visualização da Marinha</p>
          <p>Conforme padrões estabelecidos pela Pagadoria</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Controles de visualização */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800">{fileName}</h3>
        <div className="flex gap-2">
          {extractedData && (
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center gap-2"
            >
              <Table className="h-4 w-4" />
              Tabela
            </Button>
          )}
          {pdfUrl && (
            <Button
              variant={viewMode === 'pdf' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('pdf')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              PDF Original
            </Button>
          )}
          {pdfUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(pdfUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'pdf' ? renderPdfView() : renderTableView()}
      </div>
    </div>
  );
};

export default EscalaViewer;
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema de Extração de Dados de Escalas Militares PDF
Extrai automaticamente dados de PDFs de escalas e organiza em formato estruturado
"""

import pdfplumber
import re
import json
import sys
from typing import Dict, List, Optional, Tuple
import pandas as pd

class EscalaMilitarExtractor:
    def __init__(self):
        self.turnos = {
            'pernoite': [],
            'manha': [],
            'tarde': [],
            'diario': []
        }
        self.cabecalho = {}
        self.observacoes = []
        
    def extrair_cabecalho(self, texto: str) -> Dict[str, str]:
        """Extrai informações do cabeçalho da escala"""
        cabecalho = {}
        
        # Padrões comuns em escalas militares
        padroes = {
            'unidade': r'(?:COMANDO|QUARTEL|BATALHÃO|REGIMENTO|COMPANHIA)[^\n]*',
            'periodo': r'(?:PERÍODO|PERIODO)[:\s]*([^\n]+)',
            'data': r'(?:DATA|DE)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
            'escala': r'(?:ESCALA|SERVIÇO)[^\n]*'
        }
        
        for chave, padrao in padroes.items():
            match = re.search(padrao, texto, re.IGNORECASE)
            if match:
                cabecalho[chave] = match.group(0).strip()
                
        return cabecalho
    
    def identificar_turno(self, linha: str) -> Optional[str]:
        """Identifica o turno baseado no texto da linha"""
        linha_lower = linha.lower()
        
        if any(palavra in linha_lower for palavra in ['pernoite', 'noite', '00:00', '24:00']):
            return 'pernoite'
        elif any(palavra in linha_lower for palavra in ['manhã', 'manha', '06:00', '08:00']):
            return 'manha'
        elif any(palavra in linha_lower for palavra in ['tarde', '12:00', '14:00', '18:00']):
            return 'tarde'
        elif any(palavra in linha_lower for palavra in ['diário', 'diario', 'administrativo']):
            return 'diario'
            
        return None
    
    def extrair_militar(self, linha: str) -> Optional[Dict[str, str]]:
        """Extrai informações de um militar da linha"""
        # Padrões para identificar militares
        padroes_patente = r'(1º\s*TEN|2º\s*TEN|1º\s*SGT|2º\s*SGT|3º\s*SGT|CB|SD|MN|CC|SO|1SG|2SG|3SG)'
        
        # Busca por padrão: PATENTE NOME
        match = re.search(f'{padroes_patente}[\\s]+([A-ZÁÀÃÂÉÊÍÓÔÕÚÇ\\s]+)', linha, re.IGNORECASE)
        
        if match:
            patente = match.group(1).strip()
            nome = match.group(2).strip()
            
            # Limpeza do nome (remove caracteres extras)
            nome = re.sub(r'[^A-ZÁÀÃÂÉÊÍÓÔÕÚÇ\s]', '', nome).strip()
            
            if len(nome) > 2:  # Nome válido
                return {
                    'patente': patente,
                    'nome': nome,
                    'linha_original': linha.strip()
                }
        
        return None
    
    def processar_pdf(self, caminho_pdf: str) -> Dict:
        """Processa o PDF da escala e extrai todos os dados"""
        try:
            with pdfplumber.open(caminho_pdf) as pdf:
                texto_completo = ""
                
                # Extrai texto de todas as páginas
                for pagina in pdf.pages:
                    texto_completo += pagina.extract_text() + "\n"
                
                # Extrai cabeçalho
                self.cabecalho = self.extrair_cabecalho(texto_completo)
                
                # Processa linha por linha
                linhas = texto_completo.split('\n')
                turno_atual = None
                
                for linha in linhas:
                    linha = linha.strip()
                    if not linha:
                        continue
                    
                    # Verifica se é uma linha de turno
                    novo_turno = self.identificar_turno(linha)
                    if novo_turno:
                        turno_atual = novo_turno
                        continue
                    
                    # Extrai militar se houver turno atual
                    if turno_atual:
                        militar = self.extrair_militar(linha)
                        if militar:
                            militar['turno'] = turno_atual
                            self.turnos[turno_atual].append(militar)
                    
                    # Verifica se é observação
                    if any(palavra in linha.lower() for palavra in ['obs:', 'observação', 'observacao', 'nota:']):
                        self.observacoes.append(linha)
                
                return self.gerar_resultado()
                
        except Exception as e:
            return {"erro": f"Erro ao processar PDF: {str(e)}"}
    
    def gerar_resultado(self) -> Dict:
        """Gera resultado estruturado"""
        return {
            "cabecalho": self.cabecalho,
            "turnos": self.turnos,
            "observacoes": self.observacoes,
            "estatisticas": {
                "total_militares": sum(len(militares) for militares in self.turnos.values()),
                "por_turno": {turno: len(militares) for turno, militares in self.turnos.items()}
            }
        }
    
    def gerar_html_tabela(self, dados: Dict) -> str:
        """Gera HTML da tabela estilizada"""
        html = f"""
        <div class="escala-militar-container">
            <div class="escala-header">
                <h2>Escala de Serviço</h2>
                {f"<p><strong>{dados['cabecalho'].get('unidade', '')}</strong></p>" if dados['cabecalho'].get('unidade') else ""}
                {f"<p>Período: {dados['cabecalho'].get('periodo', '')}</p>" if dados['cabecalho'].get('periodo') else ""}
            </div>
            
            <div class="turnos-container">
        """
        
        nomes_turnos = {
            'pernoite': 'Serviço de Pernoite',
            'manha': 'Serviço da Manhã', 
            'tarde': 'Serviço da Tarde',
            'diario': 'Serviço Diário'
        }
        
        for turno, nome_turno in nomes_turnos.items():
            militares = dados['turnos'].get(turno, [])
            if militares:
                html += f"""
                <div class="turno-section">
                    <h3 class="turno-title">{nome_turno}</h3>
                    <table class="militares-table">
                        <thead>
                            <tr>
                                <th>Posto/Graduação</th>
                                <th>Nome</th>
                            </tr>
                        </thead>
                        <tbody>
                """
                
                for militar in militares:
                    html += f"""
                            <tr>
                                <td class="patente">{militar['patente']}</td>
                                <td class="nome">{militar['nome']}</td>
                            </tr>
                    """
                
                html += """
                        </tbody>
                    </table>
                </div>
                """
        
        if dados['observacoes']:
            html += """
                <div class="observacoes-section">
                    <h3>Observações</h3>
                    <ul>
            """
            for obs in dados['observacoes']:
                html += f"<li>{obs}</li>"
            html += """
                    </ul>
                </div>
            """
        
        html += """
            </div>
        </div>
        """
        
        return html

def main():
    """Função principal para uso via linha de comando"""
    if len(sys.argv) != 2:
        print("Uso: python pdf_extractor.py <caminho_do_pdf>")
        sys.exit(1)
    
    caminho_pdf = sys.argv[1]
    extrator = EscalaMilitarExtractor()
    resultado = extrator.processar_pdf(caminho_pdf)
    
    # Saída como JSON para integração com Node.js
    print(json.dumps(resultado, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
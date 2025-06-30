/**
 * Sistema de Automação BONO
 * Converte páginas HTML do portal da Marinha em PDF automaticamente
 * Usa wkhtmltopdf para renderização precisa
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { storage } from './storage.js';
import puppeteer from 'puppeteer';

interface BonoConfig {
  url: string;
  outputDir: string;
  filename: string;
  wkhtmltopdfOptions: string[];
}

export class BonoAutomation {
  private config: BonoConfig;
  private isRunning: boolean = false;

  constructor() {
    this.config = {
      url: 'https://bono.marinha.mil.br/bono/issue/view/278',
      outputDir: './uploads',
      filename: `bono-${new Date().toISOString().split('T')[0]}.pdf`,
      wkhtmltopdfOptions: [
        '--page-size', 'A4',
        '--orientation', 'Portrait',
        '--margin-top', '10mm',
        '--margin-bottom', '10mm',
        '--margin-left', '10mm',
        '--margin-right', '10mm',
        '--encoding', 'UTF-8',
        '--javascript-delay', '2000',
        '--load-error-handling', 'ignore',
        '--load-media-error-handling', 'ignore'
      ]
    };
  }

  /**
   * Verifica se wkhtmltopdf está instalado
   */
  async checkWkhtmltopdf(): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn('wkhtmltopdf', ['--version']);
      
      process.on('close', (code) => {
        resolve(code === 0);
      });
      
      process.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Instala wkhtmltopdf no sistema
   */
  async installWkhtmltopdf(): Promise<boolean> {
    console.log('📦 Instalando wkhtmltopdf...');
    
    return new Promise((resolve) => {
      // Para sistemas Linux/Ubuntu
      const process = spawn('apt-get', ['update', '&&', 'apt-get', 'install', '-y', 'wkhtmltopdf'], {
        shell: true,
        stdio: 'inherit'
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          console.log('✅ wkhtmltopdf instalado com sucesso');
          resolve(true);
        } else {
          console.log('❌ Falha na instalação do wkhtmltopdf');
          resolve(false);
        }
      });
    });
  }

  /**
   * Converte URL HTML para PDF
   */
  async convertHtmlToPdf(url: string, outputPath: string): Promise<boolean> {
    if (this.isRunning) {
      console.log('⚠️ Conversão já em andamento...');
      return false;
    }

    this.isRunning = true;
    console.log(`🔄 Convertendo ${url} para PDF...`);

    return new Promise((resolve) => {
      const args = [
        ...this.config.wkhtmltopdfOptions,
        url,
        outputPath
      ];

      const process = spawn('wkhtmltopdf', args);
      
      let errorOutput = '';
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        this.isRunning = false;
        
        if (code === 0) {
          console.log(`✅ PDF gerado com sucesso: ${outputPath}`);
          resolve(true);
        } else {
          console.log(`❌ Erro na conversão: ${errorOutput}`);
          resolve(false);
        }
      });

      process.on('error', (error) => {
        this.isRunning = false;
        console.log(`❌ Erro no processo: ${error.message}`);
        resolve(false);
      });
    });
  }

  /**
   * Baixa o BONO atual e adiciona ao sistema
   */
  async downloadCurrentBono(): Promise<boolean> {
    try {
      // Verificar se wkhtmltopdf está disponível
      const hasWkhtmltopdf = await this.checkWkhtmltopdf();
      if (!hasWkhtmltopdf) {
        console.log('❌ wkhtmltopdf não encontrado');
        const installed = await this.installWkhtmltopdf();
        if (!installed) {
          return false;
        }
      }

      // Garantir que o diretório existe
      await fs.mkdir(this.config.outputDir, { recursive: true });

      // Gerar nome do arquivo único
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `bono-auto-${timestamp}.pdf`;
      const outputPath = path.join(this.config.outputDir, filename);

      // Converter HTML para PDF
      const success = await this.convertHtmlToPdf(this.config.url, outputPath);
      
      if (success) {
        // Verificar se o arquivo foi criado
        try {
          const stats = await fs.stat(outputPath);
          if (stats.size > 0) {
            // Adicionar ao sistema como documento BONO
            await this.addBonoToSystem(filename, outputPath);
            console.log(`🎉 BONO automatizado adicionado: ${filename}`);
            return true;
          }
        } catch (error) {
          console.log('❌ Arquivo PDF não foi criado corretamente');
        }
      }

      return false;
    } catch (error) {
      console.log(`❌ Erro no download automático: ${error}`);
      return false;
    }
  }

  /**
   * Adiciona BONO automatizado ao sistema de documentos
   */
  private async addBonoToSystem(filename: string, filepath: string): Promise<void> {
    try {
      const document = {
        title: `BONO Automático - ${new Date().toLocaleDateString('pt-BR')}`,
        url: `/uploads/${filename}`,
        type: 'bono' as const,
        active: true
      };

      await storage.createDocument(document);
      console.log('📋 BONO automático adicionado ao sistema');
    } catch (error) {
      console.log(`❌ Erro ao adicionar BONO ao sistema: ${error}`);
    }
  }

  /**
   * Agenda download automático diário
   */
  startDailySchedule(): void {
    // Executar imediatamente uma vez
    this.downloadCurrentBono();

    // Agendar para executar todos os dias às 06:00
    const scheduleDaily = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(6, 0, 0, 0);
      
      const msUntilTomorrow = tomorrow.getTime() - now.getTime();
      
      setTimeout(() => {
        this.downloadCurrentBono();
        scheduleDaily(); // Reagendar para o próximo dia
      }, msUntilTomorrow);
    };

    scheduleDaily();
    console.log('⏰ Agendamento diário do BONO ativado (06:00 todos os dias)');
  }

  /**
   * Download manual do BONO
   */
  async manualDownload(): Promise<{ success: boolean; message: string; filename?: string }> {
    try {
      const success = await this.downloadCurrentBono();
      
      if (success) {
        return {
          success: true,
          message: 'BONO baixado e adicionado com sucesso',
          filename: this.config.filename
        };
      } else {
        return {
          success: false,
          message: 'Falha no download do BONO'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro: ${error}`
      };
    }
  }

  /**
   * Configurar URL personalizada
   */
  setBonoUrl(url: string): void {
    this.config.url = url;
    console.log(`🔗 URL do BONO atualizada: ${url}`);
  }

  /**
   * Status do sistema
   */
  getStatus(): {
    isRunning: boolean;
    currentUrl: string;
    nextScheduled: string;
  } {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);

    return {
      isRunning: this.isRunning,
      currentUrl: this.config.url,
      nextScheduled: tomorrow.toISOString()
    };
  }
}

// Instância global
export const bonoAutomation = new BonoAutomation();
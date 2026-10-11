// src/app/pages/home/home.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { AtividadeService } from '../../services/atividade.service';
import { Atividade } from '../../model/atividade.model';
import { Usuario } from '../../model/usuario.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage implements OnInit {
  // Dados do usuário (vêm da API)
  usuario: Usuario | null = null;
  nomeUsuario: string = 'Carregando...';
  streakDias: number = 0;
  xpTotal: number = 0;
  nivel: number = 1;

  // XP para próximo nível (fixo em 1000 por nível)
  xpPorNivel: number = 1000;
  xpAtualNivel: number = 0;
  xpProximoNivel: number = 1000;
  progressoXP: number = 0;

  // Atividades recentes (vêm da API)
  atividadesRecentes: Atividade[] = [];
  carregando: boolean = true;

  // Nome do dia
  saudacao: string = '';

  constructor(
    private authService: AuthService,
    private atividadeService: AtividadeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.definirSaudacao();
    this.carregarDadosUsuario();
  }

  /**
   * Define a saudação com base na hora do dia
   */
  definirSaudacao() {
    const hora = new Date().getHours();
    if (hora < 12) {
      this.saudacao = 'Bom dia';
    } else if (hora < 18) {
      this.saudacao = 'Boa tarde';
    } else {
      this.saudacao = 'Boa noite';
    }
  }

  /**
   * Carrega os dados do usuário logado (da API via AuthService)
   */
  carregarDadosUsuario() {
    this.usuario = this.authService.currentUser;

    if (this.usuario) {
      this.nomeUsuario = this.usuario.nome || 'Usuário';
      this.streakDias = this.usuario.sequenciaDias || 0;
      this.xpTotal = this.usuario.xpTotal || 0;
      this.nivel = this.usuario.nivelUsuario || 1;

      this.calcularProgressoXP();

      if (this.usuario.id) {
        this.carregarAtividadesRecentes(this.usuario.id);
      }
    } else {
      this.nomeUsuario = 'Usuário';
      this.carregando = false;
    }
  }

  /**
   * Calcula o progresso de XP para o próximo nível
   */
  calcularProgressoXP() {
    const xpTotalAteNivel = (this.nivel - 1) * this.xpPorNivel;
    this.xpAtualNivel = this.xpTotal - xpTotalAteNivel;
    this.xpProximoNivel = this.xpPorNivel;
    this.progressoXP = (this.xpAtualNivel / this.xpProximoNivel) * 100;

    if (this.progressoXP > 100) {
      this.progressoXP = 100;
    }
  }

  /**
   * Carrega as atividades recentes das turmas do usuário (da API)
   */
  carregarAtividadesRecentes(usuarioId: number) {
    this.atividadeService.listarPorUsuario(usuarioId).subscribe({
      next: (atividades) => {
        this.atividadesRecentes = atividades
          .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
          .slice(0, 5);
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.atividadesRecentes = [];
      }
    });
  }

  /**
   * Retorna o tempo relativo (ex: "2h atrás", "ontem")
   */
  getTempoRelativo(data: string): string {
    const agora = new Date();
    const dataObj = new Date(data);
    const diffMs = agora.getTime() - dataObj.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHoras < 24) return `${diffHoras} h atrás`;
    if (diffDias === 1) return 'Ontem';
    if (diffDias < 7) return `${diffDias} dias atrás`;
    return dataObj.toLocaleDateString('pt-BR');
  }

  /**
   * Navega para uma tela
   */
  navegarPara(tela: string) {
    this.router.navigate([`/${tela}`]);
  }

  /**
   * Mostra mensagem "Em breve" para notificações
   */
  mostrarNotificacoes() {
    console.log('Notificações - Em breve');
  }

  /**
   * Retorna as iniciais do usuário para o avatar
   */
  getIniciais(): string {
    if (!this.nomeUsuario || this.nomeUsuario === 'Carregando...') return 'U';
    const partes = this.nomeUsuario.trim().split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Retorna o XP que falta para o próximo nível
   */
  getXpFaltando(): number {
    return this.xpProximoNivel - this.xpAtualNivel;
  }

  /**
   * Ícone da atividade baseado no título
   */
  getIconeAtividade(titulo: string): string {
    const lower = titulo.toLowerCase();
    if (lower.includes('quiz')) return '📚';
    if (lower.includes('tarefa') || lower.includes('entregue')) return '✅';
    if (lower.includes('evoluiu') || lower.includes('planta')) return '🌱';
    return '📝';
  }

  /**
   * Cor de fundo do ícone da atividade
   */
  getCorAtividade(titulo: string): string {
    const lower = titulo.toLowerCase();
    if (lower.includes('quiz')) return '#D8F3DC';
    if (lower.includes('tarefa') || lower.includes('entregue')) return '#B7E4C7';
    if (lower.includes('evoluiu') || lower.includes('planta')) return '#95D5B2';
    return '#F0FAF3';
  }
}
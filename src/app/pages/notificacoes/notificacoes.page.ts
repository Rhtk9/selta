// src/app/pages/notificacoes/notificacoes.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  waterOutline,
  ribbonOutline,
  leafOutline,
  bookOutline,
  alertCircleOutline,
  closeOutline,
  notificationsOutline
} from 'ionicons/icons';

import { AuthService } from '../../core/services/auth.service';
import { PlantaUsuarioService } from '../../services/planta-usuario';
import { AtividadeService } from '../../services/atividade.service';
import { NotificacaoService } from '../../services/notificacao.service';
import { ConfiguracoesAlerta, Notificacao, TipoNotificacao } from '../../model/notificacao.model';
import { PlantaUsuario } from '../../model/planta-usuario.model';

@Component({
  selector: 'app-notificacoes',
  templateUrl: './notificacoes.page.html',
  styleUrls: ['./notificacoes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NotificacoesPage implements OnInit, OnDestroy {

  // ============ ESTADO ============
  notificacoes: Notificacao[] = [];
  notificacoesFiltradas: Notificacao[] = [];
  filtroAtivo: string = 'todas';
  isLoading = true;

  filtros = [
    { id: 'todas', label: 'Todas' },
    { id: 'alerta', label: 'Alertas' },
    { id: 'conquista', label: 'Conquistas' },
    { id: 'planta', label: 'Planta' },
    { id: 'aula', label: 'Aulas' }
  ];

  // ============ CONFIGURAÇÕES ============
  config: ConfiguracoesAlerta = new ConfiguracoesAlerta();

  // Refresh automático
  private intervalId: any;

  constructor(
    private authService: AuthService,
    private plantaService: PlantaUsuarioService,
    private atividadeService: AtividadeService,
    private notificacaoService: NotificacaoService,
    private toastController: ToastController
  ) {
    addIcons({
      waterOutline,
      ribbonOutline,
      leafOutline,
      bookOutline,
      alertCircleOutline,
      closeOutline,
      notificationsOutline
    });
  }

  // ============ LIFECYCLE ============
  ngOnInit() {
    this.config = { ...this.notificacaoService.config };
    this.carregarNotificacoes();

    // Atualiza a cada 30 segundos
    this.intervalId = setInterval(() => {
      console.log('🔍 Verificando novas notificações...');
      this.carregarNotificacoes();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // ============ CARREGAR ============
  async carregarNotificacoes() {
    const usuario = this.authService.currentUser;
    if (!usuario?.id) {
      this.isLoading = false;
      return;
    }

    try {
      const [plantas, atividades] = await Promise.all([
        this.plantaService.listarPorUsuario(usuario.id).toPromise().catch(() => []) as Promise<PlantaUsuario[]>,
        this.atividadeService.listarPorUsuario(usuario.id).toPromise().catch(() => []) as Promise<any[]>
      ]);

      const streak = usuario.sequenciaDias || 0;

      const lista = this.notificacaoService.gerarNotificacoes(
        plantas || [],
        atividades || [],
        streak
      );

      this.notificacoes = lista;
      this.notificacaoService.setNotificacoes(lista);
      this.aplicarFiltro();
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // ============ FILTROS ============
  setFiltro(filtro: string) {
    this.filtroAtivo = filtro;
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    if (this.filtroAtivo === 'todas') {
      this.notificacoesFiltradas = [...this.notificacoes];
    } else {
      this.notificacoesFiltradas = this.notificacoes.filter(
        n => n.tipo === this.filtroAtivo
      );
    }
  }

  // ============ GETTERS ============
  get naoLidas(): number {
    return this.notificacoes.filter(n => !n.lida).length;
  }

  // ============ AÇÕES ============
  descartar(n: Notificacao, event: Event) {
    event.stopPropagation();
    this.notificacaoService.limparNotificacao(n.id);
    this.notificacoes = this.notificacoes.filter(x => x.id !== n.id);
    this.aplicarFiltro();
    this.mostrarToast('Notificação removida', 'secondary');
  }

  abrirNotificacao(n: Notificacao) {
    this.notificacaoService.marcarComoLida(n.id);
    this.notificacoes = this.notificacoes.map(x =>
      x.id === n.id ? { ...x, lida: true } : x
    );
    this.aplicarFiltro();
  }

  marcarTodasComoLidas() {
    this.notificacaoService.marcarTodasComoLidas();
    this.notificacoes = this.notificacoes.map(n => ({ ...n, lida: true }));
    this.aplicarFiltro();
    this.mostrarToast('Todas as notificações foram lidas', 'success');
  }

  // ============ CONFIGURAÇÕES ============
  toggleConfig(campo: keyof ConfiguracoesAlerta) {
    const novoValor = !this.config[campo];
    this.config = { ...this.config, [campo]: novoValor };
    this.notificacaoService.atualizarConfig({ [campo]: novoValor });
    this.carregarNotificacoes();
  }

  // ============ HELPERS ============
  getIcone(tipo: TipoNotificacao): string {
    switch (tipo) {
      case 'planta': return 'water-outline';
      case 'conquista': return 'ribbon-outline';
      case 'aula': return 'book-outline';
      case 'xp': return 'leaf-outline';
      case 'alerta': return 'alert-circle-outline';
      default: return 'notifications-outline';
    }
  }

  getCorIcone(tipo: TipoNotificacao): string {
    switch (tipo) {
      case 'planta': return 'azul';
      case 'conquista': return 'amarelo';
      case 'aula': return 'verde';
      case 'xp': return 'roxo';
      case 'alerta': return 'laranja';
      default: return 'cinza';
    }
  }

  tempoRelativo(data: Date): string {
    const agora = new Date();
    const diff = Math.floor((agora.getTime() - data.getTime()) / 1000);

    if (diff < 60) return 'agora mesmo';
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} dia${Math.floor(diff / 86400) === 1 ? '' : 's'} atrás`;
    return data.toLocaleDateString('pt-BR');
  }

  private mostrarToast(message: string, color: string = 'primary') {
    this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
      mode: 'ios'
    }).then(t => t.present());
  }
}
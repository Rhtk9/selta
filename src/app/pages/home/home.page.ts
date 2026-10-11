import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  calendarOutline,
  documentTextOutline,
  flameOutline,
  flashOutline,
  leafOutline,
  notificationsOutline,
  peopleOutline,
  shareSocialOutline,
  starOutline
} from 'ionicons/icons';

import { AuthService } from '../../core/services/auth.service';
import { AtividadeService } from '../../services/atividade.service';
import { PlantaUsuarioService } from '../../services/planta-usuario';
import { ProfessorTurmaService } from '../../services/professor-turma.service';
import { TurmaService } from '../../services/turma.service';
import { Atividade } from '../../model/atividade.model';
import { PlantaUsuario } from '../../model/planta-usuario.model';
import { ProfessorTurma } from '../../model/professor-turma.model';
import { Turma } from '../../model/turma.model';
import { Usuario } from '../../model/usuario.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink]
})
export class HomePage implements OnInit {
  usuario: Usuario | null = null;
  nomeUsuario = 'Usuário';
  streakDias = 0;
  xpTotal = 0;
  nivel = 1;
  xpAtualNivel = 0;
  xpMaximoNivel = 100;
  progressoXP = 0;

  plantas: PlantaUsuario[] = [];
  ultimaPlanta: PlantaUsuario | null = null;
  plantasDisponiveis = false;

  atividadesRecentes: Atividade[] = [];
  proximasAtividades: Atividade[] = [];
  atividadesDisponiveis = false;
  carregando = true;

  turmas: Turma[] = [];
  turmasDisponiveis = false;
  turmasProfessoras = new Set<number>();

  saudacao = '';

  constructor(
    private authService: AuthService,
    private atividadeService: AtividadeService,
    private plantaUsuarioService: PlantaUsuarioService,
    private professorTurmaService: ProfessorTurmaService,
    private turmaService: TurmaService,
    private router: Router
  ) {
    addIcons({
      arrowForwardOutline,
      calendarOutline,
      documentTextOutline,
      flameOutline,
      flashOutline,
      leafOutline,
      notificationsOutline,
      peopleOutline,
      shareSocialOutline,
      starOutline
    });
  }

  ngOnInit(): void {
    this.definirSaudacao();
    this.carregarDadosUsuario();
  }

  definirSaudacao(): void {
    const hora = new Date().getHours();
    this.saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  }

  carregarDadosUsuario(): void {
    this.usuario = this.authService.currentUser;
    this.nomeUsuario = this.usuario?.nome || 'Usuário';
    this.streakDias = this.usuario?.sequenciaDias || 0;
    this.xpTotal = this.usuario?.xpTotal || 0;
    this.nivel = this.usuario?.nivelUsuario || 1;
    this.calcularProgressoXP();

    const usuarioId = this.usuario?.id;
    if (!usuarioId) {
      this.carregando = false;
      return;
    }

    this.carregarPlantas(usuarioId);
    this.carregarAtividadesRecentes(usuarioId);
    this.carregarTurmas(usuarioId);
    this.carregarTurmasProfessoras(usuarioId);
  }

  private carregarPlantas(usuarioId: number): void {
    this.plantaUsuarioService.listarPorUsuario(usuarioId).subscribe({
      next: (plantas) => {
        this.plantas = plantas || [];
        this.plantasDisponiveis = true;
        this.carregarUltimaPlanta();
      },
      error: () => {
        this.plantas = [];
        this.ultimaPlanta = null;
        this.plantasDisponiveis = false;
      }
    });
  }

  private carregarUltimaPlanta(): void {
    try {
      const id = Number(localStorage.getItem('grow:ultima-planta'));
      this.ultimaPlanta = Number.isFinite(id)
        ? this.plantas.find(planta => planta.id === id) || null
        : null;
    } catch {
      this.ultimaPlanta = null;
    }
  }

  carregarAtividadesRecentes(usuarioId: number): void {
    this.atividadeService.listarPorUsuario(usuarioId).subscribe({
      next: (atividades) => {
        const lista = atividades || [];
        this.atividadesRecentes = lista
          .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
          .slice(0, 5);
        this.proximasAtividades = this.filtrarProximasAtividades(lista);
        this.atividadesDisponiveis = true;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.atividadesRecentes = [];
        this.proximasAtividades = [];
        this.atividadesDisponiveis = false;
      }
    });
  }

  private filtrarProximasAtividades(atividades: Atividade[]): Atividade[] {
    return atividades
      .filter(atividade => {
        const dias = this.getDiasParaEntrega(atividade.dataEntrega);
        return dias >= 0 && dias <= 7;
      })
      .sort((a, b) => {
        const dataA = this.converterData(a.dataEntrega)?.getTime() || 0;
        const dataB = this.converterData(b.dataEntrega)?.getTime() || 0;
        return dataA - dataB;
      });
  }

  private carregarTurmas(usuarioId: number): void {
    this.turmaService.listarPorUsuario(usuarioId).subscribe({
      next: (turmas) => {
        this.turmas = turmas || [];
        this.turmasDisponiveis = true;
      },
      error: () => {
        this.turmas = [];
        this.turmasDisponiveis = false;
      }
    });
  }

  private carregarTurmasProfessoras(usuarioId: number): void {
    this.professorTurmaService.listarPorUsuario(usuarioId).subscribe({
      next: (vinculos: ProfessorTurma[]) => {
        this.turmasProfessoras = new Set((vinculos || []).map(vinculo => vinculo.turmaId));
      },
      error: () => {
        this.turmasProfessoras = new Set<number>();
      }
    });
  }

  get plantasPrecisandoAgua(): number {
    return this.plantas.filter(planta => planta.aguaAtual < 30).length;
  }

  get resumoPlantas(): string {
    const quantidade = this.plantasPrecisandoAgua;
    if (quantidade === 0) return 'Tudo em dia! Continue focado';
    const texto = quantidade === 1 ? 'planta precisa' : 'plantas precisam';
    return `💧 ${quantidade} ${texto} de água`;
  }

  get resumoPrazos(): string {
    const quantidade = this.proximasAtividades.length;
    if (quantidade === 0) return 'Tudo em dia! Continue focado';
    const texto = quantidade === 1 ? 'tarefa chegando' : 'tarefas chegando';
    return `📚 ${quantidade} ${texto}`;
  }

  calcularProgressoXP(): void {
    const nivelAtual = Math.max(1, this.nivel);
    const xpAcumuladoAteNivel = 100 * ((nivelAtual - 1) * nivelAtual) / 2;
    this.xpAtualNivel = Math.max(0, this.xpTotal - xpAcumuladoAteNivel);
    this.xpMaximoNivel = 100 * nivelAtual;
    this.progressoXP = Math.min(100, (this.xpAtualNivel / this.xpMaximoNivel) * 100);
  }

  getInicial(): string {
    return this.nomeUsuario.trim().charAt(0).toLocaleUpperCase() || 'U';
  }

  precisaRegar(planta: PlantaUsuario): boolean {
    if (planta.aguaAtual < 30 || !planta.ultimaRega) return true;
    const ultimaRega = this.converterData(planta.ultimaRega);
    return !ultimaRega || Date.now() - ultimaRega.getTime() >= 24 * 60 * 60 * 1000;
  }

  getAguaPercentual(planta: PlantaUsuario): number {
    return Math.max(0, Math.min(100, planta.aguaAtual || 0));
  }

  getDiasParaEntrega(data: string): number {
    const entrega = this.converterData(data);
    if (!entrega) return Number.POSITIVE_INFINITY;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diaEntrega = new Date(entrega.getFullYear(), entrega.getMonth(), entrega.getDate());
    return Math.round((diaEntrega.getTime() - hoje.getTime()) / (24 * 60 * 60 * 1000));
  }

  getUrgenciaClass(atividade: Atividade): string {
    const dias = this.getDiasParaEntrega(atividade.dataEntrega);
    if (dias <= 2) return 'urgency-high';
    if (dias <= 5) return 'urgency-medium';
    return 'urgency-low';
  }

  formatarDataEntrega(data: string): string {
    const dataEntrega = this.converterData(data);
    return dataEntrega
      ? dataEntrega.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      : '';
  }

  private converterData(valor?: string): Date | null {
    if (!valor) return null;

    const dataBrasileira = /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T,]+(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(valor);
    if (dataBrasileira) {
      const dia = Number(dataBrasileira[1]);
      const mes = Number(dataBrasileira[2]);
      const ano = Number(dataBrasileira[3]);
      const hora = Number(dataBrasileira[4] || 0);
      const minuto = Number(dataBrasileira[5] || 0);
      const segundo = Number(dataBrasileira[6] || 0);
      const dataLocal = new Date(ano, mes - 1, dia, hora, minuto, segundo);
      if (dataLocal.getFullYear() !== ano || dataLocal.getMonth() !== mes - 1 || dataLocal.getDate() !== dia) {
        return null;
      }
      return dataLocal;
    }

    const dataSomente = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    const data = dataSomente
      ? new Date(Number(dataSomente[1]), Number(dataSomente[2]) - 1, Number(dataSomente[3]))
      : new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }

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

  navegarPara(tela: string): void {
    void this.router.navigateByUrl(tela.startsWith('/') ? tela : `/${tela}`);
  }

  getIconeAtividade(titulo: string): string {
    const lower = titulo.toLowerCase();
    if (lower.includes('quiz')) return '📚';
    if (lower.includes('tarefa') || lower.includes('entregue')) return '✅';
    if (lower.includes('evoluiu') || lower.includes('planta')) return '🌱';
    return '📝';
  }

  getCorAtividade(titulo: string): string {
    const lower = titulo.toLowerCase();
    if (lower.includes('quiz')) return '#D8F3DC';
    if (lower.includes('tarefa') || lower.includes('entregue')) return '#B7E4C7';
    if (lower.includes('evoluiu') || lower.includes('planta')) return '#95D5B2';
    return '#F0FAF3';
  }
}
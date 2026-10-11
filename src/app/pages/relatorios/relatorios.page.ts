// src/app/pages/relatorios/relatorios.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  flashOutline,
  flameOutline,
  checkmarkCircleOutline,
  ribbonOutline,
  trendingUpOutline,
  trendingDownOutline,
  leafOutline,
    schoolOutline
} from 'ionicons/icons';

import { AuthService } from '../../core/services/auth.service';
import { PlantaUsuarioService } from '../../services/planta-usuario';
import { RegistroService } from '../../services/registro';
import { UsuarioRecompensaService } from '../../services/usuario-recompensa.service';
import { UsuarioTarefaService } from '../../services/usuario-tarefa.service';
import { AtividadeService } from '../../services/atividade.service';
import { FaseService } from '../../services/fase.service';
import { RecompensaService } from '../../services/recompensa.service';

import { Usuario } from '../../model/usuario.model';
import { PlantaUsuario } from '../../model/planta-usuario.model';
import { Registro } from '../../model/registro.model';
import { FasePlanta } from '../../model/fase-planta.model';
import { UsuarioTarefa } from '../../model/usuario-tarefa.model';

interface StatCard {
  icone: string;
  cor: 'verde' | 'laranja' | 'azul' | 'amarelo';
  valor: string;
  titulo: string;
  sub: string;
}

interface AulaTurma {
  nome: string;
  concluidas: number;
  total: number;
}

interface CuidadoPlanta {
  plantaId: number;
  apelido: string;
  mediaQualidade: number; // 0-100
  totalRegistros: number;
}

interface Badge {
  nome: string;
  descricao: string;
  icone: string;
  desbloqueada: boolean;
}

interface SemanaXP {
  label: string;
  valor: number;
}

@Component({
  selector: 'app-relatorios',
  templateUrl: './relatorios.page.html',
  styleUrls: ['./relatorios.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RelatoriosPage implements OnInit {

  // ============ ESTADO ============
  usuario: Usuario | null = null;
  isLoading: boolean = true;

  // Cards do topo
  stats: StatCard[] = [];

  // XP por semana
  xpPorSemana: SemanaXP[] = [];
  maxXpSemana: number = 1;
  variacaoXpSemanal: number = 0;

  // Aulas por turma
  aulasPorTurma: AulaTurma[] = [];

  // Qualidade do cuidado por planta
  cuidadosPorPlanta: CuidadoPlanta[] = [];

  // Badges
  badges: Badge[] = [];

  // Plantas
  plantas: PlantaUsuario[] = [];
  progressoPlantas: { [plantaId: number]: number } = {};

  constructor(
    private authService: AuthService,
    private plantaService: PlantaUsuarioService,
    private registroService: RegistroService,
    private usuarioRecompensaService: UsuarioRecompensaService,
    private usuarioTarefaService: UsuarioTarefaService,
    private atividadeService: AtividadeService,
    private faseService: FaseService,
    private recompensaService: RecompensaService
  ) {
    addIcons({
      flashOutline,
      flameOutline,
      checkmarkCircleOutline,
      ribbonOutline,
      trendingUpOutline,
      trendingDownOutline,
      leafOutline,
        schoolOutline
    });
  }

  // ============ LIFECYCLE ============
  ngOnInit() {
    this.carregarDados();
  }

  async carregarDados() {
    this.isLoading = true;
    this.usuario = this.authService.currentUser;

    if (!this.usuario?.id) {
      this.isLoading = false;
      return;
    }

    try {
      // 1) Busca tudo em paralelo
      const [plantas, recompensasUsuario, todasRecompensas, tarefasUsuario] = await Promise.all([
        this.plantaService.listarPorUsuario(this.usuario.id).toPromise().catch(() => []) as Promise<PlantaUsuario[]>,
        this.usuarioRecompensaService.listarPorUsuario(this.usuario.id).toPromise().catch(() => []) as Promise<any[]>,
        this.recompensaService.listarTodas().toPromise().catch(() => []) as Promise<any[]>,
        this.usuarioTarefaService.listarPorUsuario(this.usuario.id).toPromise().catch(() => []) as Promise<UsuarioTarefa[]>
      ]);

      this.plantas = plantas || [];
      const tarefas = tarefasUsuario || [];

      // 2) Registros das plantas (pra XP por semana e qualidade)
      const registros = await this.carregarTodosRegistros();

      // 3) Monta cada seção
      await this.carregarXPporSemana(registros);
      await this.carregarAulasPorTurma(tarefas);
      this.montarCuidadosPorPlanta(registros);
      this.montarStatsTopo(recompensasUsuario || [], tarefas);
      this.montarBadges(todasRecompensas || [], recompensasUsuario || [], tarefas);
      await this.carregarProgressoPlantas();

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // ============ REGISTROS ============
  private async carregarTodosRegistros(): Promise<Registro[]> {
    if (this.plantas.length === 0) return [];

    const promises = this.plantas.map(p =>
      this.registroService.listarPorPlanta(p.id).toPromise().catch(() => []) as Promise<Registro[]>
    );
    const listas = await Promise.all(promises);

    // Substitui .flat() (compatível com ES2018)
    return listas.reduce<Registro[]>((acc, lista) => acc.concat(lista), []);
  }

  // ============ XP POR SEMANA ============
  private async carregarXPporSemana(registros: Registro[]) {
    const hoje = new Date();
    const semanas: SemanaXP[] = [];

    for (let i = 6; i >= 0; i--) {
      const fim = new Date(hoje);
      fim.setDate(fim.getDate() - i * 7);
      const inicio = new Date(fim);
      inicio.setDate(inicio.getDate() - 6);

      const total = registros
        .filter(r => {
          const d = new Date(r.dataRegistro);
          return d >= inicio && d <= fim;
        })
        .reduce((s, r) => s + (r.xpRecebido || 0), 0);

      semanas.push({ label: `S${7 - i}`, valor: total });
    }

    this.xpPorSemana = semanas;
    this.maxXpSemana = Math.max(...semanas.map(s => s.valor), 1);

    const ult = semanas[semanas.length - 1].valor;
    const penult = semanas[semanas.length - 2]?.valor || 0;
    this.variacaoXpSemanal = penult > 0
      ? Math.round(((ult - penult) / penult) * 100)
      : (ult > 0 ? 100 : 0);
  }

  // ============ AULAS POR TURMA ============
  private async carregarAulasPorTurma(tarefas: UsuarioTarefa[]) {
    if (tarefas.length === 0) {
      this.aulasPorTurma = [];
      return;
    }

    // Busca todas as atividades envolvidas
    const atividadeIds = [...new Set(tarefas.map(t => t.atividadeId))];
    const atividades = await Promise.all(
      atividadeIds.map(id => this.atividadeService.buscarPorId(id).toPromise().catch(() => null))
    );

    // Agrupa por turma
    const porTurma = new Map<number, { nome: string; total: number; concluidas: number }>();

    tarefas.forEach(t => {
      const atv = atividades.find((a: any) => a?.id === t.atividadeId);
      if (!atv) return;

      const turmaId = atv.turmaId;
      const turmaNome = atv.turmaNome || `Turma ${turmaId}`;

      const entry = porTurma.get(turmaId) || { nome: turmaNome, total: 0, concluidas: 0 };
      entry.total++;
      if (t.concluida) entry.concluidas++;
      porTurma.set(turmaId, entry);
    });

    this.aulasPorTurma = Array.from(porTurma.values())
      .map(t => ({
        nome: t.nome,
        concluidas: t.concluidas,
        total: t.total
      }))
      .sort((a, b) => b.total - a.total);
  }

  // ============ QUALIDADE DO CUIDADO POR PLANTA ============
  private montarCuidadosPorPlanta(registros: Registro[]) {
    if (this.plantas.length === 0 || registros.length === 0) {
      this.cuidadosPorPlanta = [];
      return;
    }

    this.cuidadosPorPlanta = this.plantas.map(planta => {
      const regs = registros.filter(r => r.plantaUsuarioId === planta.id);

      if (regs.length === 0) {
        return {
          plantaId: planta.id,
          apelido: planta.apelido,
          mediaQualidade: 0,
          totalRegistros: 0
        };
      }

      // qualidadeCuidado vai de 0 a 10 → multiplica por 10 pra virar %
      const soma = regs.reduce((s, r) => s + (r.qualidadeCuidado || 0), 0);
      const media10 = soma / regs.length;
      const media100 = Math.round(media10 * 10);

      return {
        plantaId: planta.id,
        apelido: planta.apelido,
        mediaQualidade: media100,
        totalRegistros: regs.length
      };
    }).filter(c => c.totalRegistros > 0);
  }

  // ============ STATS TOPO ============
  private montarStatsTopo(recompensasUsuario: any[], tarefas: UsuarioTarefa[]) {
    if (!this.usuario) return;

    const xpTotal = this.usuario.xpTotal || 0;
    const streak = this.usuario.sequenciaDias || 0;
    const badges = recompensasUsuario.length;
    const aulasConcluidas = tarefas.filter(t => t.concluida).length;

    // XP ganho essa semana (último item do gráfico)
    const xpSemana = this.xpPorSemana.length > 0
      ? this.xpPorSemana[this.xpPorSemana.length - 1].valor
      : 0;

    this.stats = [
      {
        icone: 'flash-outline',
        cor: 'verde',
        valor: xpTotal.toLocaleString('pt-BR'),
        titulo: 'XP Total',
        sub: xpSemana > 0 ? `+${xpSemana} esta semana` : 'Comece a cuidar das plantas!'
      },
      {
        icone: 'flame-outline',
        cor: 'laranja',
        valor: `${streak}`,
        titulo: 'Dias streak',
        sub: streak > 0 ? 'Continue assim!' : 'Cuidado todos os dias'
      },
      {
        icone: 'checkmark-circle-outline',
        cor: 'azul',
        valor: `${aulasConcluidas}`,
        titulo: 'Aulas concluídas',
        sub: `${tarefas.length} atividades no total`
      },
      {
        icone: 'ribbon-outline',
        cor: 'amarelo',
        valor: `${badges}`,
        titulo: 'Badges ganhos',
        sub: badges > 0 ? 'Continue colecionando!' : 'Nenhum ainda'
      }
    ];
  }

  // ============ BADGES ============
  private montarBadges(catalogo: any[], desbloqueadas: any[], tarefas: UsuarioTarefa[]) {
    const idsDesbloqueadas = new Set(desbloqueadas.map(r => r.recompensaId));
    const aulasConcluidas = tarefas.filter(t => t.concluida).length;
    const streak = this.usuario?.sequenciaDias || 0;

    // Se o catálogo do backend estiver vazio, usa o fallback coerente com o banco
    if (!catalogo || catalogo.length === 0) {
      this.badges = [
        {
          nome: 'Primeiro Broto',
          descricao: 'Adote sua primeira planta',
          icone: '🌱',
          desbloqueada: this.plantas.length > 0
        },
        {
          nome: 'Estudante Dedicado',
          descricao: 'Conclua 5 atividades',
          icone: '📚',
          desbloqueada: aulasConcluidas >= 5
        },
        {
          nome: 'Sequência de Ouro',
          descricao: '7 dias seguidos de estudo',
          icone: '🔥',
          desbloqueada: streak >= 7
        },
        {
          nome: 'Colecionador',
          descricao: 'Tenha 3 plantas adotadas',
          icone: '🌸',
          desbloqueada: this.plantas.length >= 3
        },
        {
          nome: 'Jardineiro Expert',
          descricao: 'Planta no nível 10',
          icone: '🌳',
          desbloqueada: this.plantas.some(p => (p.nivel || 1) >= 10)
        },
        {
          nome: 'Mestre BioGrow',
          descricao: 'Alcance 5000 XP',
          icone: '🏆',
          desbloqueada: (this.usuario?.xpTotal || 0) >= 5000
        }
      ];
      return;
    }

    // Se tem catálogo real, usa as regras por nome/tipo
    const iconesPadrao = ['🌱', '📚', '🔥', '🌸', '🌳', '🏆', '💎', '⭐'];
    this.badges = catalogo.slice(0, 6).map((r, i) => ({
      nome: r.nome,
      descricao: r.descricao || 'Conquista do BioGrow',
      icone: iconesPadrao[i % iconesPadrao.length],
      desbloqueada: idsDesbloqueadas.has(r.id)
    }));
  }

  // ============ PROGRESSO DAS PLANTAS ============
  private async carregarProgressoPlantas() {
    for (const planta of this.plantas) {
      try {
        const fase = await this.faseService.buscarPorId(planta.faseId).toPromise() as FasePlanta;
        const xpNec = fase?.xpNecessario || 1;
        this.progressoPlantas[planta.id] = Math.min(100, Math.round(((planta.xpAtual || 0) / xpNec) * 100));
      } catch {
        this.progressoPlantas[planta.id] = 0;
      }
    }
  }

  // ============ HELPERS ============
  getCorPercentual(pct: number): string {
    if (pct >= 85) return '#2D6A4F';
    if (pct >= 60) return '#F5A623';
    return '#E67E22';
  }

  getAlturaBarra(valor: number): number {
    return Math.max(4, Math.round((valor / this.maxXpSemana) * 100));
  }

  getPercentualConclusao(aula: AulaTurma): number {
    if (aula.total === 0) return 0;
    return Math.round((aula.concluidas / aula.total) * 100);
  }
}
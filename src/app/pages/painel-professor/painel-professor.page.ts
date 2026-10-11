import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { ProfessorTurmaService } from '../../services/professor-turma.service';
import { UsuarioTurmaService } from '../../services/usuario-turma.service';
import { UsuarioService } from '../../services/usuario.service';
import { PlantaUsuarioService } from '../../services/planta-usuario';
import { FaseService } from '../../services/fase.service';
import { AtividadeService } from '../../services/atividade.service';
import { AuthService } from '../../core/services/auth.service';

import { ProfessorTurma } from '../../model/professor-turma.model';
import { Usuario } from '../../model/usuario.model';
import { Atividade } from '../../model/atividade.model';

interface AlunoCard {
  usuario: Usuario;
  faseNivel: number;
  faseNome: string;
  progresso: number; // %
  saude: number; // %
  atencao: boolean;
  motivoAtencao: string;
}

type Aba = 'alunos' | 'atividades' | 'relatorio';

@Component({
  selector: 'app-painel-professor',
  templateUrl: './painel-professor.page.html',
  styleUrls: ['./painel-professor.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class PainelProfessorPage implements OnInit {

  turmasProfessor: ProfessorTurma[] = [];
  turmaSelecionada: ProfessorTurma | null = null;

  abaAtiva: Aba = 'alunos';

  alunos: AlunoCard[] = [];
  atividades: Atividade[] = [];

  qtdAlunos = 0;
  progressoMedio = 0;
  streakMedio = 0;
  qtdAtencao = 0;

  isLoadingTurmas = true;
  isLoadingAlunos = false;
  isLoadingAtividades = false;

  constructor(
    private professorTurmaService: ProfessorTurmaService,
    private usuarioTurmaService: UsuarioTurmaService,
    private usuarioService: UsuarioService,
    private plantaUsuarioService: PlantaUsuarioService,
    private faseService: FaseService,
    private atividadeService: AtividadeService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.carregarTurmasProfessor();
  }

  private get professorId(): number | null {
    return this.authService.currentUser?.id ?? null;
  }

  // ---------- Turmas em que o usuário logado é professor ----------
  async carregarTurmasProfessor() {
    this.isLoadingTurmas = true;
    const id = this.professorId;

    if (!id) {
      this.isLoadingTurmas = false;
      return;
    }

    try {
      this.turmasProfessor = await this.professorTurmaService.listarPorUsuario(id).toPromise() || [];
      if (this.turmasProfessor.length > 0) {
        this.selecionarTurma(this.turmasProfessor[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar turmas do professor:', error);
    } finally {
      this.isLoadingTurmas = false;
    }
  }

  selecionarTurma(vinculo: ProfessorTurma) {
    this.turmaSelecionada = vinculo;
    this.abaAtiva = 'alunos';
    this.carregarAlunosDaTurma(vinculo.turmaId);
    this.carregarAtividadesDaTurma(vinculo.turmaId);
  }

  selecionarAba(aba: Aba) {
    this.abaAtiva = aba;
  }

  // ---------- Alunos da turma selecionada ----------
  async carregarAlunosDaTurma(turmaId: number) {
    this.isLoadingAlunos = true;
    this.alunos = [];

    try {
      const vinculos = await this.usuarioTurmaService.listarPorTurma(turmaId).toPromise() || [];
      const ativos = vinculos.filter(v => v.ativo);
      this.qtdAlunos = ativos.length;

      const cards = await Promise.all(ativos.map(v => this.montarAlunoCard(v.usuarioId)));
      this.alunos = cards.filter((c): c is AlunoCard => !!c);

      this.progressoMedio = this.media(this.alunos.map(a => a.progresso));
      this.streakMedio = this.media(this.alunos.map(a => a.usuario.sequenciaDias || 0));
      this.qtdAtencao = this.alunos.filter(a => a.atencao).length;
    } catch (error) {
      console.error('Erro ao carregar alunos da turma:', error);
    } finally {
      this.isLoadingAlunos = false;
    }
  }

  private async montarAlunoCard(usuarioId: number): Promise<AlunoCard | null> {
    try {
      const usuario = await this.usuarioService.buscarPorId(usuarioId).toPromise();
      if (!usuario) return null;

      const plantas = await this.plantaUsuarioService.listarPorUsuario(usuarioId).toPromise() || [];
      let progresso = 0;
      let saude = 0;
      let faseNivel = 0;
      let faseNome = '—';

      if (plantas.length > 0) {
        const planta = [...plantas].sort((a, b) => b.xpAtual - a.xpAtual)[0];
        saude = planta.saude;
        faseNivel = planta.nivel;
        faseNome = planta.faseNome || planta.especieNomePopular || '';

        try {
          const fase = await this.faseService.buscarPorId(planta.faseId).toPromise();
          const xpNecessario = fase?.xpNecessario || 0;
          progresso = xpNecessario > 0
            ? Math.min(100, Math.round((planta.xpAtual / xpNecessario) * 100))
            : 0;
        } catch {
          progresso = 0;
        }
      }

      const streak = usuario.sequenciaDias || 0;
      const atencao = saude < 40 || streak === 0;
      const motivoAtencao = saude < 40
        ? 'Planta com saúde baixa'
        : (streak === 0 ? 'Sem sequência de estudo ativa' : '');

      return { usuario, faseNivel, faseNome, progresso, saude, atencao, motivoAtencao };
    } catch (error) {
      console.error(`Erro ao montar card do aluno ${usuarioId}:`, error);
      return null;
    }
  }

  // ---------- Atividades da turma selecionada ----------
  async carregarAtividadesDaTurma(turmaId: number) {
    this.isLoadingAtividades = true;
    try {
      const lista = await this.atividadeService.listarPorTurma(turmaId).toPromise() || [];
      this.atividades = lista.sort(
        (a, b) => new Date(b.dataEntrega).getTime() - new Date(a.dataEntrega).getTime()
      );
    } catch (error) {
      console.error('Erro ao carregar atividades da turma:', error);
    } finally {
      this.isLoadingAtividades = false;
    }
  }

  // ---------- Helpers ----------
  private media(valores: number[]): number {
    if (valores.length === 0) return 0;
    return Math.round(valores.reduce((s, v) => s + v, 0) / valores.length);
  }

  getIniciais(nome?: string): string {
    if (!nome) return '?';
    const partes = nome.trim().split(' ');
    const primeiras = partes[0]?.[0] || '';
    const ultimas = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeiras + ultimas).toUpperCase();
  }

  corBarra(valor: number): string {
    if (valor >= 70) return 'success';
    if (valor >= 40) return 'warning';
    return 'danger';
  }

  isAtividadeVencida(dataEntrega: string): boolean {
    return new Date(dataEntrega).getTime() < Date.now();
  }
}

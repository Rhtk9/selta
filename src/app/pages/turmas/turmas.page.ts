// src/app/pages/turmas/turmas.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

import { addIcons } from 'ionicons';
import {
  star,
  starOutline,
  exitOutline,
  arrowForwardCircleOutline,
  addOutline,
  logInOutline,
  schoolOutline,
  personOutline,
  pricetagOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

import { TurmaService } from '../../services/turma.service';
import { UsuarioTurmaService } from '../../services/usuario-turma.service';
import { ProfessorTurmaService } from '../../services/professor-turma.service';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../core/services/auth.service';

import { Turma } from '../../model/turma.model';
import { UsuarioTurma } from '../../model/usuario-turma.model';

@Component({
  selector: 'app-turmas',
  templateUrl: './turmas.page.html',
  styleUrls: ['./turmas.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class TurmasPage implements OnInit {

  // ============ ESTADO ============
  turmas: Turma[] = [];
  turmasFiltradas: Turma[] = [];
  vinculos: UsuarioTurma[] = [];
  turmasVinculadas: Set<number> = new Set();
  favoritosVinculados: Set<number> = new Set();
  professoresVinculados: Set<number> = new Set();
  professoresPorTurma: Map<number, string> = new Map();

  isLoading = false;
  termoBusca = '';
  usuarioId!: number;
  isProfessor = false;

  // Modal criar turma
  modalCriarTurma = false;
  novaTurma = { nome: '', nivelEnsino: '', descricao: '' };

  private atividadesPorTurma: { [key: number]: string[] } = {};

  constructor(
    private turmaService: TurmaService,
    private usuarioTurmaService: UsuarioTurmaService,
    private professorTurmaService: ProfessorTurmaService,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      star,
      starOutline,
      exitOutline,
      arrowForwardCircleOutline,
      addOutline,
      logInOutline,
      schoolOutline,
      personOutline,
      pricetagOutline,
      checkmarkCircleOutline
    });
  }

  // ============ LIFECYCLE ============
  ngOnInit() {
    const user = this.authService.currentUser;
    if (user) {
      this.usuarioId = user.id || 0;
      this.carregarDados();
    } else {
      console.warn('Usuário não autenticado');
    }
  }

  // ============ CARREGAR DADOS ============
  async carregarDados() {
    this.isLoading = true;
    try {
      // 1) Vínculos do usuário como aluno
      this.vinculos = await this.usuarioTurmaService.listarPorUsuario(this.usuarioId).toPromise() || [];
      this.turmasVinculadas = new Set(this.vinculos.map(v => v.turmaId));
      this.favoritosVinculados = new Set(
        this.vinculos.filter(v => v.favorito).map(v => v.turmaId)
      );

      // 2) Turmas onde o usuário é professor
      const professores = await this.professorTurmaService.listarPorUsuario(this.usuarioId).toPromise() || [];
      this.professoresVinculados = new Set(professores.map(p => p.turmaId));

      // 3) Todas as turmas
      this.turmas = await this.turmaService.listarTodas().toPromise() || [];

      // 4) Nome do professor de cada turma
      for (const turma of this.turmas) {
        await this.buscarProfessorDaTurma(turma);
      }

      this.aplicarFiltro();
      this.isProfessor = this.professoresVinculados.size > 0;

    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      this.mostrarToast('Erro ao carregar turmas', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async buscarProfessorDaTurma(turma: Turma) {
    try {
      const professores = await this.professorTurmaService.listarPorTurma(turma.id!).toPromise() || [];
      if (professores.length > 0) {
        const professor = await this.usuarioService.buscarPorId(professores[0].usuarioId).toPromise();
        if (professor) {
          this.professoresPorTurma.set(turma.id!, professor.nome);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar professor da turma:', error);
    }
  }

  // ============ FILTROS ============
  getNomeProfessor(turmaId: number): string {
    return this.professoresPorTurma.get(turmaId) || 'Não definido';
  }

  aplicarFiltro() {
    if (!this.termoBusca.trim()) {
      this.turmasFiltradas = [...this.turmas];
    } else {
      const termo = this.termoBusca.toLowerCase().trim();
      this.turmasFiltradas = this.turmas.filter(t =>
        t.nome?.toLowerCase().includes(termo) ||
        t.descricao?.toLowerCase().includes(termo) ||
        t.codigo?.toLowerCase().includes(termo)
      );
    }
  }

  onBuscar(event: any) {
    this.termoBusca = event.detail.value;
    this.aplicarFiltro();
  }

  // ============ HELPERS ============
  isVinculado(turmaId: number): boolean {
    return this.turmasVinculadas.has(turmaId) || this.professoresVinculados.has(turmaId);
  }

  isProfessorDaTurma(turmaId: number): boolean {
    return this.professoresVinculados.has(turmaId);
  }

  isFavorita(turmaId: number): boolean {
    return this.favoritosVinculados.has(turmaId);
  }

  getCorTurma(index: number): string {
    const cores = ['#2ECC71', '#3498DB', '#9B59B6', '#E67E22', '#1ABC9C'];
    return cores[index % cores.length];
  }

  getProgresso(turma: Turma): number {
    return Math.min(100, (turma.quantidadeAtividades || 0) * 10);
  }

  getNextActivity(turma: Turma): string | null {
    const progresso = this.getProgresso(turma);
    const atividades = this.atividadesPorTurma[turma.id!] || [];
    if (atividades.length === 0) return null;

    const index = Math.min(
      Math.floor((progresso / 100) * atividades.length),
      atividades.length - 1
    );
    return atividades[index] || null;
  }

  verAtividades(turma: Turma) {
    this.router.navigate(['/atividades', turma.id]);
  }

  // ============ FAVORITAR / DESFAVORITAR ============
  async favoritarTurma(turma: Turma) {
    const vinculo = this.vinculos.find(v => v.turmaId === turma.id);

    if (!vinculo || !vinculo.id) {
      this.mostrarToast('Você precisa estar vinculado a esta turma para favoritar', 'warning');
      return;
    }

    const turmaId = turma.id!;
    const eraFavorita = this.favoritosVinculados.has(turmaId);
    const novoEstado = !eraFavorita;

    // 🎯 Atualização otimista — UI muda antes da resposta
    if (novoEstado) {
      this.favoritosVinculados.add(turmaId);
    } else {
      this.favoritosVinculados.delete(turmaId);
    }
    this.favoritosVinculados = new Set(this.favoritosVinculados);

    try {
      // 👇 chama o endpoint correto de acordo com o estado
      if (novoEstado) {
        await this.usuarioTurmaService.favoritar(vinculo.id).toPromise();
      } else {
        await this.usuarioTurmaService.desfavoritar(vinculo.id).toPromise();
      }

      this.mostrarToast(
        novoEstado ? 'Turma favoritada! ⭐' : 'Turma desfavoritada',
        novoEstado ? 'success' : 'secondary'
      );
    } catch (error) {
      // 🔄 Rollback
      if (novoEstado) {
        this.favoritosVinculados.delete(turmaId);
      } else {
        this.favoritosVinculados.add(turmaId);
      }
      this.favoritosVinculados = new Set(this.favoritosVinculados);

      console.error('Erro ao favoritar turma:', error);
      this.mostrarToast('Erro ao favoritar turma', 'danger');
    }
  }

  // ============ SAIR DA TURMA ============
  async sairTurma(turma: Turma) {
    if (this.isProfessorDaTurma(turma.id!)) {
      this.mostrarToast('Professores não podem sair da turma!', 'danger');
      return;
    }

    const vinculo = this.vinculos.find(v => v.turmaId === turma.id);
    if (!vinculo || !vinculo.id) {
      this.mostrarToast('Você não está vinculado a esta turma', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Sair da Turma',
      message: `Tem certeza que deseja sair da turma "${turma.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          role: 'destructive',
          handler: async () => {
            this.isLoading = true;
            try {
              await this.usuarioTurmaService.excluir(vinculo.id!).toPromise();
              this.mostrarToast('Você saiu da turma', 'secondary');
              await this.carregarDados();
            } catch (error) {
              console.error('Erro ao sair:', error);
              this.mostrarToast('Erro ao sair da turma', 'danger');
            } finally {
              this.isLoading = false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // ============ MODAL CRIAR TURMA ============
  abrirCriarTurma() {
    this.novaTurma = { nome: '', nivelEnsino: '', descricao: '' };
    this.modalCriarTurma = true;
  }

  fecharModalCriarTurma() {
    this.modalCriarTurma = false;
    this.novaTurma = { nome: '', nivelEnsino: '', descricao: '' };
  }

  async confirmarCriarTurma() {
    const nome = this.novaTurma.nome?.trim();
    const nivel = this.novaTurma.nivelEnsino?.trim();

    if (!nome) {
      this.mostrarToast('Digite o nome da turma', 'warning');
      return;
    }
    if (!nivel) {
      this.mostrarToast('Selecione o nível de ensino', 'warning');
      return;
    }

    this.isLoading = true;
    try {
      const payload = {
        nome: nome,
        descricao: this.novaTurma.descricao?.trim() || '',
        nivelEnsino: nivel,
        ano: new Date().getFullYear(),
        usuarioId: this.usuarioId
        // disciplinaId não é enviado (opcional)
      };

      console.log('Criando turma:', payload);

      const turmaCriada = await this.turmaService.criar(payload as any).toPromise();

      if (turmaCriada?.id) {
        this.mostrarToast(`Turma criada! Código: ${turmaCriada.codigo}`, 'success');
        this.fecharModalCriarTurma();
        await this.carregarDados();
      }
    } catch (error: any) {
      console.error('Erro ao criar turma:', error);
      const mensagem = error.error?.message || 'Erro ao criar turma';
      this.mostrarToast(mensagem, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // ============ ENTRAR EM TURMA ============
  async abrirEntrarTurma() {
    const alert = await this.alertController.create({
      header: 'Entrar em turma',
      subHeader: 'Digite o código da turma',
      message: 'Peça o código ao seu professor',
      inputs: [
        {
          name: 'codigo',
          type: 'text',
          placeholder: 'Ex: ABC123',
          attributes: { autofocus: true }
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Entrar',
          handler: async (data) => {
            if (!data.codigo) {
              this.mostrarToast('Digite o código da turma', 'warning');
              return false;
            }
            await this.entrarTurma(data.codigo);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async entrarTurma(codigo: string) {
    this.isLoading = true;
    try {
      const turmas = await this.turmaService.listarTodas().toPromise() || [];
      const turma = turmas.find(t =>
        t.codigo?.toUpperCase() === codigo.trim().toUpperCase()
      );

      if (!turma || !turma.id) {
        this.mostrarToast('Turma não encontrada com este código', 'danger');
        this.isLoading = false;
        return;
      }

      if (this.isVinculado(turma.id)) {
        this.mostrarToast('Você já está vinculado a esta turma', 'warning');
        this.isLoading = false;
        return;
      }

      const vinculo = new UsuarioTurma();
      vinculo.usuarioId = this.usuarioId;
      vinculo.turmaId = turma.id;
      vinculo.ativo = true;
      vinculo.favorito = false;

      await this.usuarioTurmaService.criar(vinculo).toPromise();

      this.mostrarToast('Bem-vindo à turma!', 'success');
      await this.carregarDados();
    } catch (error: any) {
      const mensagem = error.error?.message || 'Erro ao entrar na turma';
      this.mostrarToast(mensagem, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // ============ UTILITÁRIOS ============
  private mostrarToast(message: string, color: string = 'primary') {
    this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      mode: 'ios'
    }).then(toast => toast.present());
  }
}
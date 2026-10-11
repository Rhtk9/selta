// src/app/pages/atividades/atividades.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { addIcons } from 'ionicons';
import {
  clipboardOutline,
  addCircleOutline,
  closeOutline,
  cloudUploadOutline,
  documentAttachOutline,
  calendarOutline,
  checkmarkCircleOutline,
  timeOutline,
  trendingUpOutline,
  trendingDownOutline,
  lockClosedOutline,
  arrowBackOutline,
  trashOutline,
  exitOutline,
  chevronForwardOutline,
  starOutline
} from 'ionicons/icons';

import { AtividadeService } from '../../services/atividade.service';
import { TurmaService } from '../../services/turma.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfessorTurmaService } from '../../services/professor-turma.service';
import { UsuarioTurmaService } from '../../services/usuario-turma.service';
import { UsuarioTarefaService } from '../../services/usuario-tarefa.service';

import { Atividade } from '../../model/atividade.model';
import { Turma } from '../../model/turma.model';
import { UsuarioTarefa } from '../../model/usuario-tarefa.model';

export type AtividadeUI = Atividade & {
  nota?: number;
  feedback?: string;
  tempoGasto?: number;
  tentativasUsadas?: number;
  tarefaUsuario?: UsuarioTarefa;
  carregandoAcao?: boolean;
};

type FiltroAtividade = 'todas' | 'pendentes' | 'concluidas';

@Component({
  selector: 'app-atividades',
  templateUrl: './atividades.page.html',
  styleUrls: ['./atividades.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class AtividadesPage implements OnInit {

  // ============ ESTADO ============
  atividades: AtividadeUI[] = [];
  turmaId?: number;
  turma: Turma | null = null;
  usuarioId: number = 0;

  isLoading = false;
  filtro: FiltroAtividade = 'todas';

  isProfessor = false;
  possuiAtividadesPendentes = false;
  vinculoId?: number;
  temAcesso = false;

  // ============ MODAL CRIAR ATIVIDADE ============
  modalCriarAtividade = false;
  novaAtividade = {
    titulo: '',
    descricao: '',
    pontuacao: 100,
    xp: 50,
    dataEntrega: '',
    tentativas: 3,
    dificuldade: 1
  };
  arquivoSelecionado: File | null = null;

  // ============ CONSTRUTOR ============
  constructor(
    private atividadeService: AtividadeService,
    private turmaService: TurmaService,
    private authService: AuthService,
    private professorTurmaService: ProfessorTurmaService,
    private usuarioTurmaService: UsuarioTurmaService,
    private usuarioTarefaService: UsuarioTarefaService,
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      clipboardOutline, addCircleOutline, closeOutline,
      cloudUploadOutline, documentAttachOutline, calendarOutline,
      checkmarkCircleOutline, timeOutline, trendingUpOutline,
      trendingDownOutline, lockClosedOutline, arrowBackOutline,
      trashOutline, exitOutline, chevronForwardOutline, starOutline
    });
  }

  // ============ LIFECYCLE ============
  ngOnInit() {
    const user = this.authService.currentUser;
    if (user?.id) {
      this.usuarioId = user.id;
    }

    this.route.params.subscribe(params => {
      this.turmaId = params['turmaId'] ? +params['turmaId'] : undefined;
      this.carregarDados();
    });
  }

  // ============ CARREGAMENTO ============
  async carregarDados() {
    if (!this.turmaId) {
      await this.carregarAtividadesDoUsuario();
      return;
    }

    this.isLoading = true;
    try {
      this.turma = await this.turmaService.buscarPorId(this.turmaId).toPromise() || null;

      await this.verificarPapelUsuario();
      await this.verificarVinculoAluno();

      this.temAcesso = this.isProfessor || !!this.vinculoId;
      if (!this.temAcesso) {
        this.atividades = [];
        this.possuiAtividadesPendentes = false;
        return;
      }

      await this.carregarAtividadesDaTurma();
      await this.carregarTarefasDoAluno();
      this.recalcularPendentes();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      this.mostrarToast('Erro ao carregar atividades', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async verificarPapelUsuario() {
    if (!this.turmaId || !this.usuarioId) return;
    try {
      const professores = await this.professorTurmaService.listarPorTurma(this.turmaId).toPromise() || [];
      this.isProfessor = professores.some(p => p.usuarioId === this.usuarioId);
    } catch {
      this.isProfessor = false;
    }
  }

  async verificarVinculoAluno() {
    if (!this.turmaId || !this.usuarioId) return;
    try {
      const vinculos = await this.usuarioTurmaService.listarPorUsuario(this.usuarioId).toPromise() || [];
      const vinculo = vinculos.find(v => v.turmaId === this.turmaId);
      this.vinculoId = vinculo?.id;
    } catch {
      this.vinculoId = undefined;
    }
  }

  async carregarAtividadesDaTurma() {
    if (!this.turmaId) return;
    try {
      this.atividades = await this.atividadeService.listarPorTurma(this.turmaId).toPromise() || [];
      this.atividades.sort((a, b) =>
        new Date(a.dataEntrega).getTime() - new Date(b.dataEntrega).getTime()
      );
    } catch (error) {
      throw error;
    }
  }

  async carregarAtividadesDoUsuario() {
    this.isLoading = true;
    try {
      this.atividades = await this.atividadeService.listarPorUsuario(this.usuarioId).toPromise() || [];
      this.isProfessor = false;
      this.temAcesso = true;
      await this.carregarTarefasDoAluno();
      this.recalcularPendentes();
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      this.mostrarToast('Erro ao carregar atividades', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async carregarTarefasDoAluno() {
    if (this.isProfessor || !this.usuarioId || this.atividades.length === 0) return;
    try {
      const minhasTarefas = await this.usuarioTarefaService.listarPorUsuario(this.usuarioId).toPromise() || [];
      const mapa = new Map<number, UsuarioTarefa>();
      minhasTarefas.forEach(t => mapa.set(t.atividadeId, t));
      this.atividades.forEach(a => a.tarefaUsuario = mapa.get(a.id));
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  }

  recalcularPendentes() {
    if (this.isProfessor) {
      this.possuiAtividadesPendentes = false;
      return;
    }
    this.possuiAtividadesPendentes = this.atividades.some(a => {
      const pegou = !!a.tarefaUsuario;
      const concluiu = a.tarefaUsuario?.concluida === true;
      return pegou && !concluiu;
    });
  }

  // ============ GETTERS ============
  get atividadesFiltradas(): AtividadeUI[] {
    if (this.isProfessor) {
      if (this.filtro === 'pendentes') return this.atividades.filter(a => a.status !== 'CONCLUIDA' && a.status !== 'FECHADA');
      if (this.filtro === 'concluidas') return this.atividades.filter(a => a.status === 'CONCLUIDA' || a.status === 'FECHADA');
      return this.atividades;
    }
    if (this.filtro === 'pendentes') return this.atividades.filter(a => a.tarefaUsuario && a.tarefaUsuario.concluida !== true);
    if (this.filtro === 'concluidas') return this.atividades.filter(a => a.tarefaUsuario?.concluida === true);
    return this.atividades;
  }

  get total(): number {
    if (this.isProfessor) return this.atividades.length;
    return this.atividades.filter(a => !!a.tarefaUsuario).length;
  }

  get totalConcluidas(): number {
    if (this.isProfessor) return this.atividades.filter(a => a.status === 'CONCLUIDA' || a.status === 'FECHADA').length;
    return this.atividades.filter(a => a.tarefaUsuario?.concluida === true).length;
  }

  get totalPendentes(): number {
    if (this.isProfessor) return this.atividades.filter(a => a.status !== 'CONCLUIDA' && a.status !== 'FECHADA').length;
    return this.atividades.filter(a => a.tarefaUsuario && a.tarefaUsuario.concluida !== true).length;
  }

  get mediaNotas(): number | null {
    const comNota = this.atividades.filter(a => a.nota !== undefined && a.nota !== null);
    if (comNota.length === 0) return null;
    const soma = comNota.reduce((s, a) => s + (a.nota || 0), 0);
    return Math.round(soma / comNota.length);
  }

  isPendentePegar(a: AtividadeUI): boolean {
    return !this.isProfessor && !a.tarefaUsuario;
  }

  isPendenteConcluir(a: AtividadeUI): boolean {
    return !this.isProfessor && !!a.tarefaUsuario && a.tarefaUsuario.concluida !== true;
  }

  isConcluida(a: AtividadeUI): boolean {
    return !this.isProfessor && a.tarefaUsuario?.concluida === true;
  }

  // ============ MODAL CRIAR ATIVIDADE ============
  abrirCriarAtividade() {
    if (!this.temAcesso) {
      this.mostrarToast('Acesso restrito', 'danger');
      return;
    }
    if (!this.isProfessor) {
      this.mostrarToast('Apenas professores podem criar atividades', 'warning');
      return;
    }
    if (!this.turmaId) {
      this.mostrarToast('Selecione uma turma primeiro', 'warning');
      return;
    }

    this.novaAtividade = {
      titulo: '',
      descricao: '',
      pontuacao: 100,
      xp: 50,
      dataEntrega: '',
      tentativas: 3,
      dificuldade: 1
    };
    this.arquivoSelecionado = null;
    this.modalCriarAtividade = true;
  }

  fecharModalCriarAtividade() {
    this.modalCriarAtividade = false;
    this.arquivoSelecionado = null;
  }

  onArquivoSelecionado(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.arquivoSelecionado = file;
    }
  }

  removerArquivo() {
    this.arquivoSelecionado = null;
  }

  async confirmarCriarAtividade() {
    if (!this.novaAtividade.titulo?.trim() || !this.novaAtividade.descricao?.trim() || !this.novaAtividade.dataEntrega) {
      this.mostrarToast('Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    const dataEntrega = new Date(this.novaAtividade.dataEntrega);
    if (dataEntrega < new Date()) {
      this.mostrarToast('A data de entrega deve ser no futuro', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      const atividade = new Atividade();
      atividade.titulo = this.novaAtividade.titulo.trim();
      atividade.descricao = this.novaAtividade.descricao.trim();
      atividade.pontuacao = Number(this.novaAtividade.pontuacao) || 100;
      atividade.xp = Number(this.novaAtividade.xp) || 50;
      atividade.dataEntrega = this.novaAtividade.dataEntrega;
      atividade.tentativas = Number(this.novaAtividade.tentativas) || 3;
      atividade.status = 'ABERTA';
      atividade.dificuldade = Number(this.novaAtividade.dificuldade) || 1;
      atividade.turmaId = this.turmaId!;

      await this.atividadeService.criar(atividade, this.arquivoSelecionado || undefined).toPromise();

      this.mostrarToast('Atividade criada com sucesso!', 'success');
      this.fecharModalCriarAtividade();
      await this.carregarAtividadesDaTurma();
    } catch (error: any) {
      console.error('Erro ao criar atividade:', error);
      const msg = error.error?.message || 'Erro ao criar atividade';
      this.mostrarToast(msg, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // ============ AÇÕES DO ALUNO ============
  async pegarAtividade(a: AtividadeUI, event: Event) {
    event.stopPropagation();
    if (a.carregandoAcao) return;

    const confirm = await this.alertController.create({
      header: 'Pegar atividade',
      message: `Deseja pegar a atividade "${a.titulo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Pegar',
          handler: async () => {
            a.carregandoAcao = true;

            // 👇 BAIXA O ARQUIVO **ANTES** DO AWAIT (o browser permite)
            if (a.urlArquivo) {
              this.baixarArquivoAutomatico(a.urlArquivo, a.titulo);
            }

            try {
              const novaTarefa = await this.usuarioTarefaService.criar({
                atividadeId: a.id,
                usuarioId: this.usuarioId,
                nota: 0,
                concluida: false,
                tempoGasto: 1,
                tentativas: 1,
                xpRecebido: 0
              } as any).toPromise();

              a.tarefaUsuario = novaTarefa;
              this.recalcularPendentes();
              this.mostrarToast('Atividade adicionada às suas tarefas!', 'success');
            } catch (error: any) {
              console.error('Erro ao pegar atividade:', error);
              this.mostrarToast(error.error?.message || 'Erro ao pegar atividade', 'danger');
            } finally {
              a.carregandoAcao = false;
            }
          }
        }
      ]
    });
    await confirm.present();
  }

  /**
   * Baixa o arquivo automaticamente (abre numa nova aba e força download).
   */
 private baixarArquivoAutomatico(url: string, titulo: string) {
  if (!url) return;

  // Extrai a extensão do arquivo (pdf, docx, png, etc)
  const extensao = url.split('.').pop()?.split('?')[0] || 'pdf';
  const nomeArquivo = `${titulo.replace(/\s+/g, '_')}.${extensao}`;

  // 👇 Usa SÓ "fl_attachment" (sem o ":nome"). O Cloudinary usa o nome original.
  let urlDownload = url;
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    urlDownload = url.replace('/upload/', '/upload/fl_attachment/');
  }

  // Cria link e força download
  const link = document.createElement('a');
  link.href = urlDownload;
  link.download = nomeArquivo;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  this.mostrarToast(`Baixando: ${nomeArquivo}`, 'primary');
}
  async marcarComoConcluida(a: AtividadeUI, event: Event) {
    event.stopPropagation();
    if (a.carregandoAcao || !a.tarefaUsuario) return;

    const confirm = await this.alertController.create({
      header: 'Concluir atividade',
      message: `Marcar "${a.titulo}" como concluída?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Concluir',
          handler: async () => {
            a.carregandoAcao = true;
            try {
              const atualizada = await this.usuarioTarefaService.concluir(a.tarefaUsuario!.id, 0).toPromise();
              a.tarefaUsuario = atualizada;
              this.recalcularPendentes();
              this.mostrarToast('Atividade concluída! 🎉', 'success');
            } catch (error: any) {
              console.error('Erro ao concluir atividade:', error);
              this.mostrarToast(error.error?.message || 'Erro ao concluir atividade', 'danger');
            } finally {
              a.carregandoAcao = false;
            }
          }
        }
      ]
    });
    await confirm.present();
  }

  // ============ NAVEGAÇÃO ============
  setFiltro(filtro: FiltroAtividade) {
    this.filtro = filtro;
  }

  isAtrasada(atividade: AtividadeUI): boolean {
    if (atividade.status === 'CONCLUIDA' || atividade.status === 'FECHADA') return false;
    return new Date(atividade.dataEntrega).getTime() < Date.now();
  }

  voltar() {
    this.router.navigate(['/turmas']);
  }

  verDetalhes(atividade: AtividadeUI) {
    if (!this.temAcesso) {
      this.mostrarToast('Acesso restrito', 'danger');
      return;
    }
    console.log('Detalhes da atividade:', atividade);
  }

  // ============ EXCLUIR TURMA ============
  async excluirTurma() {
    if (!this.temAcesso || !this.isProfessor || !this.turmaId || !this.turma) {
      this.mostrarToast('Acesso restrito', 'danger');
      return;
    }

    if (this.atividades.length > 0) {
      this.mostrarToast('Não é possível excluir a turma com atividades.', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Excluir Turma',
      message: `Excluir "${this.turma.nome}"?\n\nAção irreversível.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            try {
              await this.turmaService.excluir(this.turmaId!).toPromise();
              this.mostrarToast('Turma excluída!', 'success');
              this.router.navigate(['/turmas']);
            } catch (err: any) {
              this.mostrarToast(err.error?.message || 'Erro ao excluir', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // ============ SAIR DA TURMA ============
  async sairTurma() {
    if (!this.temAcesso || this.isProfessor) {
      this.mostrarToast('Acesso restrito', 'danger');
      return;
    }
    if (this.possuiAtividadesPendentes) {
      this.mostrarToast('Você tem atividades pendentes!', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Sair da Turma',
      message: `Sair de "${this.turma?.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          role: 'destructive',
          handler: async () => {
            try {
              if (this.vinculoId) {
                await this.usuarioTurmaService.excluir(this.vinculoId).toPromise();
                this.mostrarToast('Você saiu da turma', 'success');
                this.router.navigate(['/turmas']);
              }
            } catch (err) {
              this.mostrarToast('Erro ao sair', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController, SegmentCustomEvent } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AtividadeService } from '../../services/atividade.service';
import { TurmaService } from '../../services/turma.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfessorTurmaService } from '../../services/professor-turma.service';
import { UsuarioTurmaService } from '../../services/usuario-turma.service';
import { Atividade } from '../../model/atividade.model';
import { Turma } from '../../model/turma.model';

@Component({
  selector: 'app-atividades',
  templateUrl: './atividades.page.html',
  styleUrls: ['./atividades.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class AtividadesPage implements OnInit {
  atividades: Atividade[] = [];
  turmaId?: number;
  turma: Turma | null = null;
  isLoading = false;
  filtro: 'todas' | 'futuras' | 'passadas' = 'todas';
  usuarioId!: number;
  isProfessor = false;
  possuiAtividadesPendentes = false;
  vinculoId?: number;

  constructor(
    private atividadeService: AtividadeService,
    private turmaService: TurmaService,
    private authService: AuthService,
    private professorTurmaService: ProfessorTurmaService,
    private usuarioTurmaService: UsuarioTurmaService,
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    
    
    const user = this.authService.currentUser;
    if (user) {
      this.usuarioId = user.id || 0;
    }

    this.route.params.subscribe(params => {
      this.turmaId = params['turmaId'] ? +params['turmaId'] : undefined;
      this.carregarDados();
    });
  }

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
      await this.carregarAtividadesDaTurma();
      
      this.possuiAtividadesPendentes = this.atividades.some(a => 
        a.status !== 'CONCLUIDA' && a.status !== 'FECHADA'
      );
      
     
      
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
    } catch (error) {
      this.isProfessor = false;
    }
  }

  async verificarVinculoAluno() {
    if (!this.turmaId || !this.usuarioId) return;

    try {
      const vinculos = await this.usuarioTurmaService.listarPorUsuario(this.usuarioId).toPromise() || [];
      const vinculo = vinculos.find(v => v.turmaId === this.turmaId);
      this.vinculoId = vinculo?.id;
    } catch (error) {
    }
  }

  async carregarAtividadesDaTurma() {
    if (!this.turmaId) return;

    try {
      if (this.filtro === 'futuras') {
        this.atividades = await this.atividadeService.listarFuturasPorTurma(this.turmaId).toPromise() || [];
      } else if (this.filtro === 'passadas') {
        this.atividades = await this.atividadeService.listarPassadasPorTurma(this.turmaId).toPromise() || [];
      } else {
        this.atividades = await this.atividadeService.listarPorTurma(this.turmaId).toPromise() || [];
      }
      
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
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      this.mostrarToast('Erro ao carregar atividades', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  podeSair(): boolean {
    if (this.isProfessor) {
      return false;
    }
    return !this.possuiAtividadesPendentes;
  }

  podeCriarAtividade(): boolean {
    return this.isProfessor;
  }

  async excluirTurma() {
    if (!this.turmaId || !this.turma) {
      this.mostrarToast('Turma não encontrada', 'danger');
      return;
    }

    if (this.atividades.length > 0) {
      this.mostrarToast(' Não é possível excluir a turma pois ela possui atividades cadastradas.', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Excluir Turma',
      message: `Tem certeza que deseja excluir a turma "${this.turma.nome}"?\n\nEsta ação não pode ser desfeita.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            this.isLoading = true;
            try {
              await this.turmaService.excluir(this.turmaId!).toPromise();
              this.mostrarToast(' Turma excluída com sucesso!', 'success');
              this.router.navigate(['/turmas']);
            } catch (error: any) {
              console.error('Erro ao excluir turma:', error);
              const mensagem = error.error?.message || 'Erro ao excluir turma';
              this.mostrarToast(mensagem, 'danger');
            } finally {
              this.isLoading = false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async sairTurma() {
    if (!this.podeSair()) {
      let mensagem = '';
      if (this.isProfessor) {
        mensagem = ' Professores não podem sair da turma!';
      } else if (this.possuiAtividadesPendentes) {
        mensagem = ' Você não pode sair da turma enquanto tiver atividades pendentes!\n\nComplete todas as atividades antes de sair.';
      }
      
      this.mostrarToast(mensagem, 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Sair da Turma',
      message: `Tem certeza que deseja sair da turma "${this.turma?.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          role: 'destructive',
          handler: async () => {
            try {
              if (this.vinculoId) {
                await this.usuarioTurmaService.excluir(this.vinculoId).toPromise();
                this.mostrarToast(' Você saiu da turma', 'success');
                this.router.navigate(['/turmas']);
              }
            } catch (error) {
              console.error('Erro ao sair da turma:', error);
              this.mostrarToast('Erro ao sair da turma', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async aplicarFiltro(event: SegmentCustomEvent) {
    const value = event.detail.value;
    if (value === 'todas' || value === 'futuras' || value === 'passadas') {
      this.filtro = value;
    } else {
      this.filtro = 'todas';
    }
    
    if (this.turmaId) {
      await this.carregarAtividadesDaTurma();
    }
  }

  async abrirCriarAtividade() {
    if (!this.podeCriarAtividade()) {
      this.mostrarToast(' Apenas professores podem criar atividades', 'warning');
      return;
    }

    if (!this.turmaId) {
      this.mostrarToast(' Selecione uma turma primeiro', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Criar Nova Atividade',
      subHeader: `Turma: ${this.turma?.nome}`,
      inputs: [
        {
          name: 'titulo',
          type: 'text',
          placeholder: 'Ex: Fotosíntese - Parte 1',
          label: 'Título *'
        },
        {
          name: 'descricao',
          type: 'textarea',
          placeholder: 'Descreva a atividade...',
          label: 'Descrição *'
        },
        {
          name: 'pontuacao',
          type: 'number',
          placeholder: '100',
          label: 'Pontuação *',
          value: '100'
        },
        {
          name: 'xp',
          type: 'number',
          placeholder: '50',
          label: 'XP *',
          value: '50'
        },
        {
          name: 'dataEntrega',
          type: 'date',
          label: 'Data de Entrega *'
        },
        {
          name: 'tentativas',
          type: 'number',
          placeholder: '3',
          label: 'Tentativas Permitidas *',
          value: '3'
        },
        {
          name: 'dificuldade',
          type: 'number',
          placeholder: '1 a 5',
          label: 'Dificuldade (1-5) *',
          value: '1'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Criar',
          handler: async (data) => {
            if (!data.titulo || !data.descricao || !data.dataEntrega) {
              this.mostrarToast(' Preencha todos os campos obrigatórios (*)', 'warning');
              return false;
            }

            const dataAtual = new Date();
            const dataEntrega = new Date(data.dataEntrega);
            if (dataEntrega < dataAtual) {
              this.mostrarToast(' A data de entrega deve ser no futuro', 'warning');
              return false;
            }

            await this.criarAtividade(data);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async criarAtividade(data: any) {
    this.isLoading = true;

    try {
      const novaAtividade = new Atividade();
      novaAtividade.titulo = data.titulo;
      novaAtividade.descricao = data.descricao;
      novaAtividade.pontuacao = parseInt(data.pontuacao) || 100;
      novaAtividade.xp = parseInt(data.xp) || 50;
      novaAtividade.dataEntrega = data.dataEntrega;
      novaAtividade.tentativas = parseInt(data.tentativas) || 3;
      novaAtividade.status = 'ABERTA';
      novaAtividade.dificuldade = parseInt(data.dificuldade) || 1;
      novaAtividade.turmaId = this.turmaId!;

      console.log(' Criando atividade:', novaAtividade);

      await this.atividadeService.criar(novaAtividade).toPromise();

      this.mostrarToast(' Atividade criada com sucesso! ', 'success');
      
      await this.carregarAtividadesDaTurma();

    } catch (error: any) {
      console.error(' Erro ao criar atividade:', error);
      const mensagem = error.error?.message || 'Erro ao criar atividade. Tente novamente.';
      this.mostrarToast(mensagem, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private mostrarToast(message: string, color: string = 'primary') {
    this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      mode: 'ios'
    }).then(toast => toast.present());
  }

  voltar() {
    this.router.navigate(['/turmas']);
  }

  verDetalhes(atividade: Atividade) {}

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      'ABERTA': 'time-outline',
      'EM_ANDAMENTO': 'play-circle-outline',
      'FECHADA': 'checkmark-circle-outline',
      'ENTREGUE': 'checkmark-done-circle-outline'
    };
    return map[status?.toUpperCase() || ''] || 'help-circle-outline';
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      'ABERTA': 'success',
      'EM_ANDAMENTO': 'warning',
      'FECHADA': 'danger',
      'ENTREGUE': 'tertiary'
    };
    return map[status?.toUpperCase() || ''] || 'medium';
  }

  getDiasRestantes(dataEntrega: string): number {
    const hoje = new Date();
    const entrega = new Date(dataEntrega);
    const diff = Math.ceil((entrega.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  getStatusEntrega(dataEntrega: string): 'urgente' | 'pendente' | 'concluido' {
    const dias = this.getDiasRestantes(dataEntrega);
    if (dias < 0) return 'concluido';
    if (dias <= 3) return 'urgente';
    return 'pendente';
  }
}
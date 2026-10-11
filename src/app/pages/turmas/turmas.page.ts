import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

  private atividadesPorTurma: { [key: number]: string[] } = {

  };

  constructor(
    private turmaService: TurmaService,
    private usuarioTurmaService: UsuarioTurmaService,
    private professorTurmaService: ProfessorTurmaService,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    
    
    const user = this.authService.currentUser;
    if (user) {
      this.usuarioId = user.id || 0;
      this.carregarDados();
    } else {
      console.warn('⚠️ Usuário não autenticado');
    }
  }

  async carregarDados() {
    this.isLoading = true;
    try {
      this.vinculos = await this.usuarioTurmaService.listarPorUsuario(this.usuarioId).toPromise() || [];
      this.turmasVinculadas = new Set(this.vinculos.map(v => v.turmaId));
      this.favoritosVinculados = new Set(
        this.vinculos.filter(v => v.favorito).map(v => v.turmaId)
      );

      const professores = await this.professorTurmaService.listarPorUsuario(this.usuarioId).toPromise() || [];
      this.professoresVinculados = new Set(professores.map(p => p.turmaId));
      
      

      this.turmas = await this.turmaService.listarTodas().toPromise() || [];
      
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

  isVinculado(turmaId: number): boolean {
    return this.turmasVinculadas.has(turmaId) || this.professoresVinculados.has(turmaId);
  }

  isProfessorDaTurma(turmaId: number): boolean {
    return this.professoresVinculados.has(turmaId);
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
    
    if (atividades.length === 0) {
      return null;
    }

    const index = Math.min(
      Math.floor((progresso / 100) * atividades.length),
      atividades.length - 1
    );
    
    return atividades[index] || null;
  }

  verAtividades(turma: Turma) {
    this.router.navigate(['/atividades', turma.id]);
  }

  async abrirCriarTurma() {
    const alert = await this.alertController.create({
      header: 'Criar nova turma',
      subHeader: 'Você será o professor desta turma',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Ex: Biologia 9º Ano A',
          label: 'Nome da turma *'
        },
        {
          name: 'nivelEnsino',
          type: 'text',
          placeholder: 'Fundamental, Médio, Superior...',
          label: 'Nível de ensino *'
        },
        {
          name: 'descricao',
          type: 'textarea',
          placeholder: 'Descreva a turma...',
          label: 'Descrição'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Criar',
          handler: async (data) => {
            if (!data.nome || !data.nivelEnsino) {
              this.mostrarToast('Preencha todos os campos obrigatórios', 'warning');
              return false;
            }
            await this.criarTurma(data);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async criarTurma(data: any) {
    this.isLoading = true;
    try {
      const novaTurma = new Turma();
      novaTurma.nome = data.nome;
      novaTurma.descricao = data.descricao || '';
      novaTurma.nivelEnsino = data.nivelEnsino;
      novaTurma.ano = new Date().getFullYear();
      novaTurma.usuarioId = this.usuarioId;

      console.log(' Criando turma:', novaTurma);

      const turmaCriada = await this.turmaService.criar(novaTurma).toPromise();
      
      if (turmaCriada && turmaCriada.id) {
        this.mostrarToast(` Turma criada com sucesso! Código: ${turmaCriada.codigo}`, 'success');
        await this.carregarDados();
      }
    } catch (error: any) {
      const mensagem = error.error?.message || 'Erro ao criar turma';
      this.mostrarToast(mensagem, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

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

      if (!this.atividadesPorTurma[turma.id]) {
        this.atividadesPorTurma[turma.id] = [
          'Introdução à disciplina',
          'Atividade 1',
          'Atividade 2'
        ];
      }

      this.mostrarToast('Bem-vindo à turma! 🌱', 'success');
      await this.carregarDados();
    } catch (error: any) {
      const mensagem = error.error?.message || 'Erro ao entrar na turma';
      this.mostrarToast(mensagem, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async favoritarTurma(turma: Turma) {
    const vinculo = this.vinculos.find(v => v.turmaId === turma.id);
    
    if (!vinculo || !vinculo.id) {
      this.mostrarToast('Você precisa estar vinculado a esta turma para favoritar', 'warning');
      return;
    }

    this.isLoading = true;
    try {
      const novoFavorito = !this.favoritosVinculados.has(turma.id!);
      await this.usuarioTurmaService.favoritarDesfavoritar(vinculo.id, novoFavorito).toPromise();
      
      if (novoFavorito) {
        this.favoritosVinculados.add(turma.id!);
        this.mostrarToast(' Turma favoritada!', 'success');
      } else {
        this.favoritosVinculados.delete(turma.id!);
        this.mostrarToast('Turma desfavoritada', 'secondary');
      }
      
      await this.carregarDados();
    } catch (error) {

      this.mostrarToast('Erro ao favoritar turma', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async sairTurma(turma: Turma) {
    if (this.isProfessorDaTurma(turma.id!)) {
      this.mostrarToast(' Professores não podem sair da turma!', 'danger');
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
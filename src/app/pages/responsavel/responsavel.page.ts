import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { ResponsavelService } from '../../services/responsavel';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioTurmaService } from '../../services/usuario-turma.service';
import { PlantaUsuarioService } from '../../services/planta-usuario';
import { FaseService } from '../../services/fase.service';
import { RegistroService } from '../../services/registro';
import { AuthService } from '../../core/services/auth.service';

import { Responsavel } from '../../model/responsavel.model';
import { Usuario } from '../../model/usuario.model';
import { PlantaUsuario } from '../../model/planta-usuario.model';
import { Registro } from '../../model/registro.model';

interface AtividadeFeedItem {
  icone: string;
  cor: string;
  texto: string;
  data: Date;
}

@Component({
  selector: 'app-responsavel',
  templateUrl: './responsavel.page.html',
  styleUrls: ['./responsavel.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ResponsavelPage implements OnInit {

  alunosVinculados: Usuario[] = [];
  // guarda também o id do vínculo (CdResponsavel), pra poder desvincular certo
  private vinculosMap = new Map<number, number>(); // alunoId -> vinculoId

  alunoSelecionado: Usuario | null = null;

  planta: PlantaUsuario | null = null;
  progressoPlanta = 0;
  faseXpNecessario = 0;
  qtdTurmasAtivas = 0;
  qtdRegistros = 0;
  diasSemCuidar: number | null = null;
  alertaPlanta: string | null = null;
  feed: AtividadeFeedItem[] = [];

  isLoading = false;
  isLoadingLista = true;

  constructor(
    private responsavelService: ResponsavelService,
    private usuarioService: UsuarioService,
    private usuarioTurmaService: UsuarioTurmaService,
    private plantaUsuarioService: PlantaUsuarioService,
    private faseService: FaseService,
    private registroService: RegistroService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.carregarAlunosVinculados();
  }

  private get responsavelLogadoId(): number | null {
    return this.authService.currentUser?.id ?? null;
  }

  // ---------- Carregar lista de alunos vinculados (da API) ----------
  async carregarAlunosVinculados() {
    this.isLoadingLista = true;
    this.alunosVinculados = [];
    this.vinculosMap.clear();
    this.alunoSelecionado = null;

    const responsavelId = this.responsavelLogadoId;
    if (!responsavelId) {
      this.isLoadingLista = false;
      return;
    }

    try {
      const vinculos = await this.responsavelService.listarPorResponsavel(responsavelId).toPromise() || [];

      // Busca os dados completos de cada aluno vinculado
      const alunos = await Promise.all(
        vinculos.map(async (v) => {
          this.vinculosMap.set(v.usuarioId, v.id!);
          return this.usuarioService.buscarPorId(v.usuarioId).toPromise();
        })
      );

      this.alunosVinculados = alunos.filter((a): a is Usuario => !!a);

      if (this.alunosVinculados.length > 0) {
        this.selecionarAluno(this.alunosVinculados[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar alunos vinculados:', error);
      this.mostrarToast('Erro ao carregar alunos vinculados', 'danger');
    } finally {
      this.isLoadingLista = false;
    }
  }

  selecionarAluno(aluno: Usuario) {
    this.alunoSelecionado = aluno;
    this.carregarDadosDoAluno(aluno.id!);
  }

  // ---------- Vincular novo aluno ----------
  async abrirVincularAluno() {
    const alert = await this.alertController.create({
      header: 'Vincular a um aluno',
      subHeader: 'Peça o nome e o e-mail cadastrado do aluno',
      inputs: [
        { name: 'nome', type: 'text', placeholder: 'Nome completo do aluno', label: 'Nome do aluno *' },
        { name: 'email', type: 'email', placeholder: 'email@exemplo.com', label: 'Email do aluno *' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Vincular',
          handler: async (data) => {
            if (!data.nome?.trim() || !data.email?.trim()) {
              this.mostrarToast('Preencha nome e email', 'warning');
              return false;
            }
            await this.vincularAluno(data.nome.trim(), data.email.trim());
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async vincularAluno(nomeDigitado: string, email: string) {
    const responsavelId = this.responsavelLogadoId;
    if (!responsavelId) {
      this.mostrarToast('Você precisa estar logado para vincular um aluno', 'danger');
      return;
    }

    this.isLoading = true;
    try {
      const aluno = await this.usuarioService.buscarPorEmail(email).toPromise();

      if (!aluno) {
        this.mostrarToast('Nenhum aluno encontrado com esse email', 'danger');
        return;
      }

      const nomeConfere = aluno.nome?.trim().toLowerCase() === nomeDigitado.toLowerCase();
      if (!nomeConfere) {
        this.mostrarToast('O nome não confere com o cadastrado para esse email', 'danger');
        return;
      }

      if (aluno.id === responsavelId) {
        this.mostrarToast('Você não pode se vincular a si mesmo', 'warning');
        return;
      }

      if (this.alunosVinculados.some(a => a.id === aluno.id)) {
        this.mostrarToast('Você já acompanha esse aluno', 'warning');
        return;
      }

      const vinculo = new Responsavel(undefined, 'Responsável', true, aluno.id!, responsavelId);
      await this.responsavelService.criar(vinculo).toPromise();

      this.mostrarToast(`Vinculado a ${aluno.nome}! 🌱`, 'success');
      await this.carregarAlunosVinculados();
    } catch (error: any) {
      const status = error?.status;
      const msg = status === 404
        ? 'Nenhum aluno encontrado com esse email'
        : (error.error?.erro || error.error?.message || 'Erro ao vincular aluno');
      this.mostrarToast(msg, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async desvincularAluno(aluno: Usuario, ev: Event) {
    ev.stopPropagation();
    const responsavelId = this.responsavelLogadoId;
    if (!responsavelId) return;

    const alert = await this.alertController.create({
      header: 'Parar de acompanhar?',
      message: `Você não vai mais ver o painel de ${aluno.nome}.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover',
          role: 'destructive',
          handler: async () => {
            try {
              await this.responsavelService.excluirVinculo(responsavelId, aluno.id!).toPromise();
              await this.carregarAlunosVinculados();
            } catch {
              this.mostrarToast('Erro ao remover vínculo', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // ---------- Carregar dashboard do aluno selecionado ----------
  async carregarDadosDoAluno(alunoId: number) {
    this.isLoading = true;
    this.planta = null;
    this.feed = [];
    this.alertaPlanta = null;

    try {
      const vinculos = await this.usuarioTurmaService.listarPorUsuario(alunoId).toPromise() || [];
      this.qtdTurmasAtivas = vinculos.filter(v => v.ativo).length;

      const plantas = await this.plantaUsuarioService.listarPorUsuario(alunoId).toPromise() || [];
      if (plantas.length > 0) {
        this.planta = [...plantas].sort((a, b) => b.xpAtual - a.xpAtual)[0];

        if (this.planta.saude < 40) {
          this.alertaPlanta = `Planta com saúde baixa. ${this.planta.apelido} precisa de cuidados — a saúde está em ${this.planta.saude}%.`;
        } else if (this.planta.felicidade < 40) {
          this.alertaPlanta = `Planta com hidratação/felicidade baixa. ${this.planta.apelido} está em ${this.planta.felicidade}%.`;
        }

        try {
          const fase = await this.faseService.buscarPorId(this.planta.faseId).toPromise();
          this.faseXpNecessario = fase?.xpNecessario || 0;
          this.progressoPlanta = this.faseXpNecessario > 0
            ? Math.min(100, Math.round((this.planta.xpAtual / this.faseXpNecessario) * 100))
            : 0;
        } catch {
          this.progressoPlanta = 0;
        }

        const registros = await this.registroService.listarPorPlanta(this.planta.id).toPromise() || [];
        this.qtdRegistros = registros.length;
        this.montarFeed(registros);
        this.calcularDiasSemCuidar(registros);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
      this.mostrarToast('Erro ao carregar dados do aluno', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private montarFeed(registros: Registro[]) {
    this.feed = registros
      .map(r => ({
        icone: 'water-outline',
        cor: 'success',
        texto: `Cuidou da planta${r.observacao ? ': ' + r.observacao : ''}`,
        data: new Date(r.dataRegistro)
      }))
      .sort((a, b) => b.data.getTime() - a.data.getTime())
      .slice(0, 5);
  }

  private calcularDiasSemCuidar(registros: Registro[]) {
    if (registros.length === 0) {
      this.diasSemCuidar = null;
      return;
    }
    const maisRecente = registros
      .map(r => new Date(r.dataRegistro).getTime())
      .sort((a, b) => b - a)[0];
    this.diasSemCuidar = Math.floor((Date.now() - maisRecente) / (1000 * 60 * 60 * 24));
  }

  getIniciais(nome?: string): string {
    if (!nome) return '?';
    const partes = nome.trim().split(' ');
    const primeiras = partes[0]?.[0] || '';
    const ultimas = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeiras + ultimas).toUpperCase();
  }

  tempoRelativo(data: Date): string {
    const diffMs = Date.now() - data.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 60) return `${min}min atrás`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `${horas}h atrás`;
    const dias = Math.floor(horas / 24);
    if (dias === 1) return '1 dia atrás';
    return `${dias} dias atrás`;
  }

  private mostrarToast(message: string, color: string = 'primary') {
    this.toastController.create({
      message, duration: 3000, color, position: 'bottom', mode: 'ios'
    }).then(toast => toast.present());
  }
}

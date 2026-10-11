// src/app/pages/cadastrar-especie/cadastrar-especie.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

import { Especie } from '../../model/especie.model';
import { FasePlanta } from '../../model/fase-planta.model';
import { AuthService } from '../../core/services/auth.service';
import { EspecieService } from '../../services/especie.service';
import { FaseService } from '../../services/fase.service';
import { addIcons } from 'ionicons';
import { addOutline, barChartOutline, leafOutline, trophyOutline } from 'ionicons/icons';

// Opções para selects
const CLASSIFICACOES = ['Angiosperma', 'Gimnosperma', 'Pteridófita', 'Briófita', 'Alga', 'Fungo', 'Cacto', 'Suculenta', 'Trepadeira', 'Aquática'];
const AMBIENTES = ['Interno', 'Externo', 'Misto', 'Aquático', 'Desértico', 'Tropical', 'Temperado'];
const DIFICULDADES = ['Fácil', 'Média', 'Difícil'];
interface FasePlantaRequest {
  nome: string;
  ordem: number;
  diasBase: number;
  xpNecessario: number;
  imagem: string;
  especieId: number;
  
  // Evolução (Obrigatórios no DTO)
  diasRuim: number;
  diasMedios: number;
  diasBons: number;
  bonus?: number;
  penalidade?: number;

  // Necessidades (Obrigatórios no DTO)
  aguaMedia: number;
  luzMedia: number;
  temperaturaMedia: number;
  umidadeMedia: number;
  luzIdeal: string;
  regasPorSemana: number;
  adubacoesPorMes: number;
}

@Component({
  selector: 'app-cadastrar-especie',
  templateUrl: './cadastrar-especie.page.html',
  styleUrls: ['./cadastrar-especie.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CadastrarEspeciePage implements OnInit {
  // Controle de etapas
  currentStep: number = 1;
  totalSteps: number = 3;

  // Dados da espécie
  especie: Especie = {
    nomePopular: '',
    nomeCientifico: '',
    classificacao: '',
    descricao: '',
    dificuldadeCultivo: '',
    ambiente: '',
    imagem: '',
    publica: true,
    usuarioId: 0
  };

  // Lista de fases
  fases: FasePlanta[] = [];

  // Fase em edição
  faseEditando: FasePlanta | null = null;
  modalAberto: boolean = false;

  // Opções para selects
  classificacoes = CLASSIFICACOES;
  ambientes = AMBIENTES;
  dificuldades = DIFICULDADES;
  // Carregando
  loading: boolean = false;
  publicado: boolean = false;

  // Controle de validação extra
  formSubmitted: boolean = false;

  // Progresso das etapas
  stepLabels = ['Informações Básicas', 'Fases da Evolução', 'Revisão e Publicação'];

  constructor(
    private authService: AuthService,
    private especieService: EspecieService,
    private faseService: FaseService,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({ addOutline, barChartOutline, leafOutline, trophyOutline });
  }

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user?.id) {
      this.especie.usuarioId = user.id;
    }
  }

// Preview reativo otimizado para File
imagemPreview: string = '';

onFileSelected(event: any) {
  const file = event.target.files?.[0];
  if (file) {
    this.especie.imagem = file; // Guarda o arquivo File real
    this.imagemPreview = URL.createObjectURL(file); // Gera URL temporária para o preview no HTML
  }
}

  // ========== CONTROLE DE ETAPAS ==========
  proximoStep() {
    if (this.currentStep < this.totalSteps) {
      if (this.currentStep === 1 && !this.validarEtapa1()) {
        return;
      }
      this.currentStep++;
    }
  }

  voltarStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  irParaStep(step: number) {
    if (step < this.currentStep) {
      this.currentStep = step;
    }
  }

  // ========== VALIDAÇÕES ==========
  validarEtapa1(): boolean {
    if (!this.especie.nomePopular.trim()) {
      this.mostrarAlerta('Erro', 'O nome popular é obrigatório.');
      return false;
    }
    if (!this.especie.nomeCientifico.trim()) {      // ← adicione este bloco
      this.mostrarAlerta('Erro', 'O nome científico é obrigatório.');
      return false;
    }
    if (!this.especie.classificacao) {
      this.mostrarAlerta('Erro', 'Selecione uma classificação.');
      return false;
    }
    if (!this.especie.dificuldadeCultivo) {
      this.mostrarAlerta('Erro', 'Selecione a dificuldade de cultivo.');
      return false;
    }
    if (!this.especie.ambiente) {
      this.mostrarAlerta('Erro', 'Selecione o tipo de ambiente.');
      return false;
    }
    if (!this.especie.imagem) {
      this.formSubmitted = true;
      this.mostrarAlerta('Erro', 'Faça upload da imagem de capa.');
      return false;
    }
    if (!this.especie.descricao?.trim()) {
      this.mostrarAlerta('Erro', 'A descrição é obrigatória.');
      return false;
    }
    return true;
  }

  validarEtapa2(): boolean {
    if (this.fases.length === 0) {
      this.mostrarAlerta('Erro', 'Adicione pelo menos uma fase de evolução.');
      return false;
    }
    for (const fase of this.fases) {
      if (!fase.nome.trim()) {
        this.mostrarAlerta('Erro', 'Todas as fases precisam ter um nome.');
        return false;
      }
    }
    return true;
  }

  // ========== GERENCIAMENTO DE FASES ==========
  abrirModalFase(fase?: FasePlanta) {
    if (fase) {
      this.faseEditando = { ...fase };
    } else {
      this.faseEditando = {
        id: undefined,
        nome: '',
        ordem: this.fases.length + 1,
        diasBase: this.diasBasePadraoPorDificuldade(),
        xpNecessario: 100 + this.fases.length * 50,
        imagem: '',
        especieId: 0,
        evolucaoFase: {
          id: undefined,
          diasRuim: 0,
          diasMedios: 0,
          diasBons: 0,
          bonus: 0,
          penalidade: 0
        },
        necessidadeFase: {
          id: undefined,
          luzIdeal: 'MEIA_SOMBRA',
          regasPorSemana: 2,
          adubacoesPorMes: 1
        }
      };
    }
    this.modalAberto = true;
  }

  fecharModalFase() {
    this.modalAberto = false;
    this.faseEditando = null;
  }

  salvarFase() {
    if (!this.faseEditando) return;
    if (!this.faseEditando.nome.trim()) {
      this.mostrarAlerta('Erro', 'O nome da fase é obrigatório.');
      return;
    }

    // XP é sempre calculado pela ordem: 100 + (ordem - 1) * 50
    this.faseEditando.xpNecessario = 100 + (this.faseEditando.ordem - 1) * 50;

    if (this.faseEditando.id) {
      const index = this.fases.findIndex(f => f.id === this.faseEditando!.id);
      if (index !== -1) {
        this.fases[index] = { ...this.faseEditando };
      }
    } else {
      this.fases.push({ ...this.faseEditando });
      this.reordenarFases();
    }
    this.fecharModalFase();
  }

  editarFase(fase: FasePlanta) {
    this.abrirModalFase(fase);
  }

  removerFase(index: number) {
    this.fases.splice(index, 1);
    this.reordenarFases();
  }

  reordenarFases() {
    this.fases.forEach((f, i) => {
      f.ordem = i + 1;
      f.xpNecessario = 100 + i * 50;
    });
  }

  // ========== PUBLICAÇÃO REAL ==========
  publicarEspecie() {
  this.formSubmitted = true;
  if (!this.validarEtapa1() || !this.validarEtapa2()) {
    return;
  }

  const user = this.authService.currentUser;
  if (!user?.id) {
    this.mostrarAlerta('Erro', 'Usuário não autenticado.');
    return;
  }
  this.especie.usuarioId = user.id;

  this.loading = true;

  // Monta o FormData para enviar @RequestPart("dto") e @RequestPart("file")
  const formData = new FormData();

  // Removemos o arquivo do objeto JSON do DTO (já que vai separado no campo 'file')
  const { imagem, ...dtoWithoutImage } = this.especie;

  formData.append(
    'dto',
    new Blob([JSON.stringify(dtoWithoutImage)], { type: 'application/json' })
  );

  // Se o usuário selecionou um arquivo File, anexa no 'file'
  if (imagem instanceof File) {
    formData.append('file', imagem, imagem.name);
  }

  // 1. Cria a espécie enviando o FormData
  this.especieService.criar(formData as any).subscribe({
    next: (especieCriada) => {
      if (!especieCriada?.id) {
        this.loading = false;
        this.mostrarAlerta('Erro', 'A API não retornou o ID da espécie criada.');
        return;
      }

      const especieId = especieCriada.id;
const fasesRequest: FasePlantaRequest[] = this.fases.map(f => ({
  nome: f.nome,
  ordem: f.ordem,
  diasBase: f.diasBase || 15,
  xpNecessario: f.xpNecessario || 100,
  imagem: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  especieId: especieId,

  // Dados de evolução
  diasRuim: f.evolucaoFase?.diasRuim ?? 2,
  diasMedios: f.evolucaoFase?.diasMedios ?? 4,
  diasBons: f.evolucaoFase?.diasBons ?? 6,
  bonus: f.evolucaoFase?.bonus ?? 0,
  penalidade: f.evolucaoFase?.penalidade ?? 0,

  // Dados de necessidades
  aguaMedia: 50,
  luzMedia: 50,
  temperaturaMedia: 25,
  umidadeMedia: 50,
  luzIdeal: f.necessidadeFase?.luzIdeal || 'MEIA_SOMBRA',
  regasPorSemana: f.necessidadeFase?.regasPorSemana ?? 2,
  adubacoesPorMes: f.necessidadeFase?.adubacoesPorMes ?? 1
}));

      if (fasesRequest.length === 0) {
        this.loading = false;
        this.publicado = true;
        return;
      }

      let fasesSalvas = 0;
      let falhasFases = 0;
      const total = fasesRequest.length;
      fasesRequest.forEach(faseReq => {
        this.faseService.criar(faseReq as any).subscribe({
          next: () => {
            fasesSalvas++;
            if (fasesSalvas + falhasFases === total) {
              this.loading = false;
              if (falhasFases === 0) {
                this.publicado = true;
              } else {
                this.mostrarAlerta('Atenção', `${falhasFases} fase(s) não puderam ser salvas.`);
              }
            }
          },
          error: (err) => {
            console.error('Erro ao salvar fase', err);
            falhasFases++;
            if (fasesSalvas + falhasFases === total) {
              this.loading = false;
              this.mostrarAlerta('Atenção', this.obterMensagemErro(err, 'Algumas fases não foram salvas.'));
            }
          }
        });
      });
    },
    error: (err) => {
      console.error('Erro ao criar espécie', err);
      this.loading = false;
      this.mostrarAlerta('Erro', this.obterMensagemErro(err, 'Não foi possível publicar a espécie.'));
    }
  });
}

resetarFormulario() {
  this.publicado = false;
  this.currentStep = 1;
  this.formSubmitted = false;
  this.imagemPreview = ''; // Limpa preview
  this.especie = {
    nomePopular: '',
    nomeCientifico: '',
    classificacao: '',
    descricao: '',
    dificuldadeCultivo: '',
    ambiente: '',
    imagem: '',
    publica: true,
    usuarioId: this.authService.currentUser?.id || 0
  };
  this.fases = [];
}

  irParaExplorarPlantas() {
    this.router.navigate(['/explorar-especies']);
  }

  diasBasePadraoPorDificuldade(): number {
    if (this.especie.dificuldadeCultivo === 'Fácil') return 4;
    if (this.especie.dificuldadeCultivo === 'Média') return 6;
    return 8; // Difícil
  }

  // ========== UTILITÁRIOS ==========
  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private obterMensagemErro(err: any, mensagemPadrao: string): string {
    const mensagem = err?.error?.message || err?.error?.error || err?.message;
    return typeof mensagem === 'string' && mensagem.trim() ? mensagem : mensagemPadrao;
  }

  getNomeEtapa(step: number): string {
    return this.stepLabels[step - 1] || '';
  }

  getProgresso(): number {
    return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
  }

  getCorDificuldade(dificuldade: string): string {
    const cores: Record<string, string> = {
      'Fácil': '#2D6A4F',
      'Média': '#F5A623',
      'Difícil': '#B71C1C'
    };
    return cores[dificuldade] || '#2D6A4F';
  }

  getBgDificuldade(dificuldade: string): string {
    const cores: Record<string, string> = {
      'Fácil': '#D8F3DC',
      'Média': '#FFF3CD',
      'Difícil': '#FFCDD2'
    };
    return cores[dificuldade] || '#D8F3DC';
  }

  getLabelLuz(valor: string): string {
    if (valor === 'SOMBRA') return 'Sombra';
    if (valor === 'SOL_PLENO') return 'Sol pleno';
    return 'Meia-sombra';
  }
}
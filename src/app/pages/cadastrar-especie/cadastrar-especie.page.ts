// src/app/pages/cadastrar-especie/cadastrar-especie.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

import { Especie } from '../../model/especie.model';
import { FasePlanta, EvolucaoFase, NecessidadeFase } from '../../model/fase-planta.model';
import { AuthService } from '../../core/services/auth.service';
import { EspecieService } from '../../services/especie.service';
import { FaseService } from '../../services/fase.service';

// Opções para selects
const CLASSIFICACOES = ['Angiosperma', 'Gimnosperma', 'Pteridófita', 'Briófita', 'Alga', 'Fungo', 'Cacto', 'Suculenta', 'Trepadeira', 'Aquática'];
const AMBIENTES = ['Interno', 'Externo', 'Misto', 'Aquático', 'Desértico', 'Tropical', 'Temperado'];
const DIFICULDADES = ['Iniciante', 'Intermediário', 'Avançado', 'Expert'];
const RARIDADES = ['Comum', 'Incomum', 'Rara', 'Muito Rara', 'Lendária'];

// Interface plana para envio de fase (igual ao FasePlantaRequestDTO)
interface FasePlantaRequest {
  nome: string;
  ordem: number;
  diasBase: number;
  xpNecessario: number;
  xpGanho: number;
  imagem: string;
  especieId: number;
  diasRuim: number;
  diasMedios: number;
  diasBons: number;
  bonus: number;
  penalidade: number;
  aguaMedia: number;
  luzMedia: number;
  temperaturaMedia: number;
  umidadeMedia: number;
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
    temperatura: 22,
    umidade: 60,
    luminosidade: 70,
    imagem: '',
    raridade: 'Comum',
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
  raridades = RARIDADES;

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
  ) { }

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user?.id) {
      this.especie.usuarioId = user.id;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.especie.imagem = e.target.result;
      };
      reader.readAsDataURL(file);
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
        diasBase: 7,
        xpNecessario: 100,
        xpGanho: 50,
        imagem: '',  // não usaremos, mas mantemos no modelo
        especieId: 0,
        evolucaoFase: {
          diasRuim: 30,
          diasMedios: 15,
          diasBons: 7,
          bonus: 10,
          penalidade: 5
        },
        necessidadeFase: {
          aguaMedia: 50,
          luzMedia: 50,
          temperaturaMedia: 22,
          umidadeMedia: 60
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
    this.fases.forEach((f, i) => f.ordem = i + 1);
  }

  // ========== PUBLICAÇÃO REAL ==========
  publicarEspecie() {
    this.formSubmitted = true;
    if (!this.validarEtapa1() || !this.validarEtapa2()) {
      return;
    }

    // Garante usuarioId
    const user = this.authService.currentUser;
    if (!user?.id) {
      this.mostrarAlerta('Erro', 'Usuário não autenticado.');
      return;
    }
    this.especie.usuarioId = user.id;

    this.loading = true;

    // Cria uma cópia da espécie com imagem placeholder (se for muito longa)
    const especieParaEnviar = {
      ...this.especie,
      imagem: (this.especie.imagem && this.especie.imagem.length > 255)
        ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        : this.especie.imagem
    };

    // 1. Cria a espécie utilizando a cópia tratada
    this.especieService.criar(especieParaEnviar).subscribe({
      next: (especieCriada) => {
        const especieId = especieCriada.id!;
        const fasesRequest: FasePlantaRequest[] = this.fases.map(f => ({
          nome: f.nome,
          ordem: f.ordem,
          diasBase: f.diasBase,
          xpNecessario: f.xpNecessario,
          xpGanho: f.xpGanho,
          // Imagem obrigatória para a fase: envia o 1x1 transparente caso não tenha
          imagem: f.imagem || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          especieId: especieId,
          diasRuim: f.evolucaoFase.diasRuim,
          diasMedios: f.evolucaoFase.diasMedios,
          diasBons: f.evolucaoFase.diasBons,
          bonus: f.evolucaoFase.bonus,
          penalidade: f.evolucaoFase.penalidade,
          aguaMedia: f.necessidadeFase.aguaMedia,
          luzMedia: f.necessidadeFase.luzMedia,
          temperaturaMedia: f.necessidadeFase.temperaturaMedia,
          umidadeMedia: f.necessidadeFase.umidadeMedia
        }));

        if (fasesRequest.length === 0) {
          this.loading = false;
          this.publicado = true;
          return;
        }

        let fasesSalvas = 0;
        const total = fasesRequest.length;
        fasesRequest.forEach(faseReq => {
          this.faseService.criar(faseReq as any).subscribe({
            next: () => {
              fasesSalvas++;
              if (fasesSalvas === total) {
                this.loading = false;
                this.publicado = true;
              }
            },
            error: (err) => {
              console.error('Erro ao salvar fase', err);
              this.loading = false;
              this.mostrarAlerta('Atenção', 'A espécie foi criada, mas algumas fases não foram salvas.');
            }
          });
        });
      },
      error: (err) => {
        console.error('Erro ao criar espécie', err);
        this.loading = false;
        this.mostrarAlerta('Erro', 'Não foi possível publicar a espécie.');
      }
    });
  }

  resetarFormulario() {
    this.publicado = false;
    this.currentStep = 1;
    this.formSubmitted = false;
    this.especie = {
      nomePopular: '',
      nomeCientifico: '',
      classificacao: '',
      descricao: '',
      dificuldadeCultivo: '',
      ambiente: '',
      temperatura: 22,
      umidade: 60,
      luminosidade: 70,
      imagem: '',
      raridade: 'Comum',
      publica: true,
      usuarioId: this.authService.currentUser?.id || 0
    };
    this.fases = [];
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

  getNomeEtapa(step: number): string {
    return this.stepLabels[step - 1] || '';
  }

  getProgresso(): number {
    return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
  }

  getCorDificuldade(dificuldade: string): string {
    const cores: Record<string, string> = {
      'Iniciante': '#2D6A4F',
      'Intermediário': '#F5A623',
      'Avançado': '#E65100',
      'Expert': '#B71C1C'
    };
    return cores[dificuldade] || '#2D6A4F';
  }

  getBgDificuldade(dificuldade: string): string {
    const cores: Record<string, string> = {
      'Iniciante': '#D8F3DC',
      'Intermediário': '#FFF3CD',
      'Avançado': '#FFE0B2',
      'Expert': '#FFCDD2'
    };
    return cores[dificuldade] || '#D8F3DC';
  }
}
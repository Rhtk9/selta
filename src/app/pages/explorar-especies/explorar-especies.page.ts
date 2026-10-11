// src/app/pages/explorar-especies/explorar-especies.page.ts
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// Serviços
import { EspecieService } from '../../services/especie.service';
import { EspecieFavoritaService } from '../../services/especie-favorita';
import { AvaliacaoService, Avaliacao } from '../../services/avaliacao';
import { FaseService } from '../../services/fase.service';
import { AuthService } from '../../core/services/auth.service';

// Modelos
import { Especie } from '../../model/especie.model';
import { FasePlanta } from '../../model/fase-planta.model';
import { PlantaUsuarioRequest } from '../../model/planta-usuario.model';

// Componentes Standalone do Ionic
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonModal,
  IonSpinner,
  IonList,
  IonItem,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonInput,
  AlertController,
  IonChip,
  IonButtons
} from '@ionic/angular/standalone';

// Registro de Ícones para modo Standalone
import { addIcons } from 'ionicons';
import {
  star,
  starOutline,
  heart,
  heartOutline,
  closeOutline,
  flowerOutline,
  addOutline,
  leafOutline,
  thermometerOutline,
  waterOutline,
  sunnyOutline,
  calendarOutline,
  layersOutline,
  personCircleOutline
} from 'ionicons/icons';
import { PlantaUsuarioService } from '../../services/planta-usuario';

interface EspecieCard extends Especie {
  numFases: number;
  mediaAvaliacao: number;
  totalAvaliacoes: number;
  isFavorito: boolean;
  avaliacaoUsuario?: Avaliacao;
}

@Component({
  selector: 'app-explorar-especies',
  templateUrl: './explorar-especies.page.html',
  styleUrls: ['./explorar-especies.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonModal,
    IonSpinner,
    IonList,
    IonItem,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonChip,
    IonButtons,
    RouterLink
  ]
})
export class ExplorarEspeciesPage {
  @ViewChild(IonModal) modal?: IonModal;

  especies: EspecieCard[] = [];
  especiesFiltradas: EspecieCard[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  filtroAtivo: string = 'todas';
  filtros = [
    { id: 'todas', label: 'Todas' },
    { id: 'populares', label: 'Populares' },
    { id: 'recentes', label: 'Recentes' },
    { id: 'favoritas', label: 'Favoritas' },
    { id: 'minhas', label: 'Minhas' }
  ];

  // Modal de detalhes
  especieSelecionada: EspecieCard | null = null;
  modalAberto: boolean = false;
  avaliacoes: Avaliacao[] = [];
  novaAvaliacao: { nota: number; comentario: string } = { nota: 5, comentario: '' };
  avaliando: boolean = false;
  carregandoDetalhes: boolean = false;
  salvandoAvaliacao: boolean = false;

  // Para adoção de plantas (Flags Ajustadas)
  modoAdocao: boolean = false;
  salvandoAdocao: boolean = false;
  apelidoPlanta: string = '';
  faseSelecionadaId: number | null = null;
  fasesEspecie: FasePlanta[] = [];
  fasesResumo: {
    total: number;
    luzPredominante: string;
    regasMedia: number;
    adubacoesMedia: number;
  } | null = null;

  constructor(
    private especieService: EspecieService,
    private favoritoService: EspecieFavoritaService,
    private avaliacaoService: AvaliacaoService,
    private faseService: FaseService,
    private authService: AuthService,
    private plataUsuarioService: PlantaUsuarioService,
    private router: Router,
    private alertController: AlertController
  ) {
    // Registra os ícones necessários da página para evitar inconsistências no Ionic Standalone
    addIcons({
      star,
      starOutline,
      heart,
      heartOutline,
      closeOutline,
      flowerOutline,
      addOutline,
      leafOutline,
      thermometerOutline,
      waterOutline,
      sunnyOutline,
      calendarOutline,
      layersOutline,
      personCircleOutline
    });
  }

  ionViewDidEnter() {
    this.carregarEspecies();
  }

  carregarEspecies() {
    this.loading = true;
    this.especieService.listarPublicas().subscribe({
      next: (especies) => {
        this.especies = especies.map(e => ({
          ...e,
          numFases: 0,
          mediaAvaliacao: 0,
          totalAvaliacoes: 0,
          isFavorito: false
        }));
        this.carregarDadosComplementares();
      },
      error: () => {
        this.loading = false;
        this.mostrarAlerta('Erro', 'Não foi possível carregar as espécies.');
      }
    });
  }

  carregarDadosComplementares() {
    const usuario = this.authService.currentUser;
    const usuarioId = usuario?.id;

    let favoritos$ = this.favoritoService.listarPorUsuario(usuarioId!);
    if (!usuarioId) {
      favoritos$ = this.favoritoService.listarTodos();
    }

    favoritos$.subscribe({
      next: (favoritos) => {
        const idsFavoritos = favoritos.map(f => f.especieId);
        this.especies.forEach(e => {
          e.isFavorito = idsFavoritos.includes(e.id!);
        });
        this.carregarFases();
      },
      error: () => {
        this.carregarFases();
      }
    });
  }

  carregarFases() {
    let carregados = 0;
    const total = this.especies.length;
    if (total === 0) {
      this.loading = false;
      this.aplicarFiltros();
      return;
    }

    this.especies.forEach((especie, index) => {
      this.faseService.listarPorEspecie(especie.id!).subscribe({
        next: (fases) => {
          especie.numFases = fases.length;
          carregados++;
          if (carregados === total) {
            this.loading = false;
            this.aplicarFiltros();
          }
        },
        error: () => {
          especie.numFases = 0;
          carregados++;
          if (carregados === total) {
            this.loading = false;
            this.aplicarFiltros();
          }
        }
      });
    });
  }

  aplicarFiltros() {
    let lista = [...this.especies];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      lista = lista.filter(e =>
        e.nomePopular.toLowerCase().includes(term) ||
        e.nomeCientifico.toLowerCase().includes(term)
      );
    }

    switch (this.filtroAtivo) {
      case 'populares':
        lista = lista.filter(e => e.mediaAvaliacao >= 4);
        break;
      case 'recentes':
        const trintaDias = new Date();
        trintaDias.setDate(trintaDias.getDate() - 30);
        lista = lista.filter(e => e.dataCriacao ? new Date(e.dataCriacao) >= trintaDias : false);
        break;
      case 'favoritas':
        lista = lista.filter(e => e.isFavorito);
        break;
      case 'minhas':
        const usuarioId = this.authService.currentUser?.id;
        lista = lista.filter(e => e.usuarioId === usuarioId);
        break;
      default:
        break;
    }

    lista.sort((a, b) => b.mediaAvaliacao - a.mediaAvaliacao);
    this.especiesFiltradas = lista;
  }

  async abrirDetalhes(especie: EspecieCard) {
    this.especieSelecionada = especie;
    this.modalAberto = true;
    this.carregandoDetalhes = true;
    this.avaliacoes = [];
    this.novaAvaliacao = { nota: 5, comentario: '' };
    this.avaliando = false;

    this.carregarResumoFases(especie.id!);
    this.avaliacaoService.listarPorEspecie(especie.id!).subscribe({
      next: (avaliacoes) => {
        this.avaliacoes = avaliacoes;
        const total = avaliacoes.length;
        if (total > 0) {
          const soma = avaliacoes.reduce((acc, a) => acc + a.nota, 0);
          especie.mediaAvaliacao = Math.round((soma / total) * 10) / 10;
          especie.totalAvaliacoes = total;
        }
        const usuarioId = this.authService.currentUser?.id;
        if (usuarioId) {
          const avaliacaoExistente = avaliacoes.find(a => a.usuarioId === usuarioId);
          if (avaliacaoExistente) {
            especie.avaliacaoUsuario = avaliacaoExistente;
            this.novaAvaliacao.nota = avaliacaoExistente.nota;
            this.novaAvaliacao.comentario = avaliacaoExistente.comentario;
          }
        }
        this.carregandoDetalhes = false;
      },
      error: () => {
        this.carregandoDetalhes = false;
      }
    });
  }

  fecharModal() {
    this.modalAberto = false;
    this.especieSelecionada = null;
    this.modoAdocao = false; 
    this.salvandoAdocao = false;
    this.fasesResumo = null;
  }

  toggleFavorito(event: Event, especie: EspecieCard) {
    event.stopPropagation();
    const usuarioId = this.authService.currentUser?.id;
    if (!usuarioId) {
      this.mostrarAlerta('Aviso', 'Faça login para favoritar espécies.');
      return;
    }

    if (especie.isFavorito) {
      this.favoritoService.desfavoritar(usuarioId, especie.id!).subscribe({
        next: () => {
          especie.isFavorito = false;
        },
        error: () => {
          this.mostrarAlerta('Erro', 'Não foi possível desfavoritar.');
        }
      });
    } else {
      this.favoritoService.favoritar(usuarioId, especie.id!).subscribe({
        next: () => {
          especie.isFavorito = true;
        },
        error: () => {
          this.mostrarAlerta('Erro', 'Não foi possível favoritar.');
        }
      });
    }
  }
  
salvarAvaliacao() {
  const usuarioId = this.authService.currentUser?.id;
  if (!usuarioId || !this.especieSelecionada) {
    this.mostrarAlerta('Aviso', 'Faça login para avaliar.');
    return;
  }

  const notaNum = Number(this.novaAvaliacao.nota) || 5;

  // Ativa o spinner e desabilita os botões
  this.salvandoAvaliacao = true;

  const avaliacao: Avaliacao = {
    nota: notaNum,
    comentario: this.novaAvaliacao.comentario?.trim() || 'Sem comentário',
    especieId: this.especieSelecionada.id!,
    usuarioId: usuarioId
  };

  this.avaliacaoService.criar(avaliacao).subscribe({
    next: (novaAval) => {
      if (this.especieSelecionada!.avaliacaoUsuario) {
        this.avaliacoes = this.avaliacoes.filter(a => a.usuarioId !== usuarioId);
      }

      this.avaliacoes.unshift(novaAval);
      
      const total = this.avaliacoes.length;
      const soma = this.avaliacoes.reduce((acc, a) => acc + Number(a.nota), 0);
      
      this.especieSelecionada!.mediaAvaliacao = Math.round((soma / total) * 10) / 10;
      this.especieSelecionada!.totalAvaliacoes = total;
      this.especieSelecionada!.avaliacaoUsuario = novaAval;
      
      // Limpa formulário e desativa estados de carregamento
      this.avaliando = false;
      this.salvandoAvaliacao = false;
      this.novaAvaliacao = { nota: 5, comentario: '' };
      
      this.mostrarAlerta('Sucesso', 'Sua avaliação foi salva!');
    },
    error: (err) => {
      console.error(err);
      this.salvandoAvaliacao = false; // Desativa o spinner em caso de erro
      this.mostrarAlerta('Erro', 'Não foi possível enviar a avaliação. Verifique sua conexão.');
    }
  });
}
  // ========== ADOÇÃO DE PLANTA ==========

  iniciarAdocao() {
    this.modoAdocao = true;
    this.salvandoAdocao = false;
    this.apelidoPlanta = '';
    this.faseSelecionadaId = null;
    this.fasesEspecie = [];

    if (this.especieSelecionada) {
      this.faseService.listarPorEspecie(this.especieSelecionada.id!).subscribe({
        next: (fases) => {
          this.fasesEspecie = [...fases].sort((faseA, faseB) =>
            (faseA.ordem ?? 0) - (faseB.ordem ?? 0)
          );
          if (this.fasesEspecie.length > 0) {
            this.faseSelecionadaId = this.fasesEspecie[0].id!;
          }
        },
        error: () => {
          this.mostrarAlerta('Erro', 'Não foi possível carregar as fases.');
        }
      });
    }
  }

  cancelarAdocao() {
    this.modoAdocao = false;
    this.salvandoAdocao = false;
  }

  adotarPlanta() {
    const usuario = this.authService.currentUser;
    if (!usuario?.id) {
      this.mostrarAlerta('Aviso', 'Faça login para adotar uma planta.');
      return;
    }
    if (!this.apelidoPlanta.trim()) {
      this.mostrarAlerta('Erro', 'Dê um apelido para sua planta.');
      return;
    }
    if (!this.faseSelecionadaId) {
      this.mostrarAlerta('Erro', 'Selecione uma fase inicial.');
      return;
    }

    this.salvandoAdocao = true;

    const novaPlanta: PlantaUsuarioRequest = {
      apelido: this.apelidoPlanta.trim(),
      usuarioId: usuario.id,
      especieId: this.especieSelecionada!.id!,
      faseId: this.faseSelecionadaId
    };

    this.plataUsuarioService.criar(novaPlanta).subscribe({
      next: async (planta) => {
        this.salvandoAdocao = false;
        this.modoAdocao = false;
        await this.modal?.dismiss();
        this.fecharModal();
        this.mostrarAlerta('Sucesso', 'Planta adotada com sucesso!');
        this.router.navigate(['/minhas-plantas']);
      },
      error: (err) => {
        console.error('Erro ao adotar planta', err);
        this.salvandoAdocao = false;
        this.mostrarAlerta('Erro', 'Não foi possível adotar a planta. Verifique sua conexão.');
      }
    });
  }

  // ========== ESTATÍSTICAS REAIS ==========
  getMediaGeral(): string {
    if (this.especies.length === 0) return '0';
    const total = this.especies.reduce((acc, e) => acc + (e.mediaAvaliacao || 0), 0);
    const media = total / this.especies.length;
    return media.toFixed(1);
  }

  getTotalFavoritos(): number {
    return this.especies.filter(e => e.isFavorito).length;
  }

  // ========== UTILITÁRIOS ==========
  getDificuldadeCor(dificuldade: string): { bg: string; text: string } | null {
    const cores: Record<string, { bg: string; text: string }> = {
      'Iniciante': { bg: '#D8F3DC', text: '#2D6A4F' },
      'Intermediário': { bg: '#FFF3CD', text: '#856404' },
      'Avançado': { bg: '#FFE0B2', text: '#E65100' },
      'Expert': { bg: '#FFCDD2', text: '#B71C1C' }
    };
    return cores[dificuldade] || null;
  }

  getStars(nota: number): string {
    return '★'.repeat(Math.round(nota)) + '☆'.repeat(5 - Math.round(nota));
  }

  onSearchChange() {
    this.aplicarFiltros();
  }

  setFiltro(filtro: string) {
    this.filtroAtivo = filtro;
    this.aplicarFiltros();
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private carregarResumoFases(especieId: number) {
    this.faseService.listarPorEspecie(especieId).subscribe({
      next: (fases) => {
        if (fases.length === 0) {
          this.fasesResumo = null;
          return;
        }
        // Luz predominante (moda)
        const contagem: Record<string, number> = { SOMBRA: 0, MEIA_SOMBRA: 0, SOL_PLENO: 0 };
        fases.forEach(f => {
          const luz = f.necessidadeFase?.luzIdeal;
          if (luz && contagem[luz] !== undefined) contagem[luz]++;
        });
        let luzPredominante = 'MEIA_SOMBRA';
        let max = -1;
        Object.entries(contagem).forEach(([luz, qtd]) => {
          if (qtd > max) { max = qtd; luzPredominante = luz; }
        });
        // Médias
        const somaRegas = fases.reduce((acc, f) => acc + (f.necessidadeFase?.regasPorSemana || 0), 0);
        const somaAdub = fases.reduce((acc, f) => acc + (f.necessidadeFase?.adubacoesPorMes || 0), 0);
        this.fasesResumo = {
          total: fases.length,
          luzPredominante,
          regasMedia: Math.round(somaRegas / fases.length),
          adubacoesMedia: Math.round(somaAdub / fases.length)
        };
      },
      error: () => {
        this.fasesResumo = null;
      }
    });
  }

  getLabelLuz(valor: string): string {
    if (valor === 'SOMBRA') return 'Sombra';
    if (valor === 'SOL_PLENO') return 'Sol pleno';
    return 'Meia-sombra';
  }
}
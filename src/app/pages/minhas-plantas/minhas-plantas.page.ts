// src/app/pages/minhas-plantas/minhas-plantas.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

import { FaseService } from '../../services/fase.service';
import { EspecieFavoritaService } from '../../services/especie-favorita';
import { AuthService } from '../../core/services/auth.service';
import { PlantaUsuario } from '../../model/planta-usuario.model';
import { Registro } from '../../model/registro.model';
import { PlantaUsuarioService } from '../../services/planta-usuario';
import { RegistroService } from '../../services/registro';

// Interface estendida garantindo as propriedades 'favorito' e 'isFavorito'
export type PlantaUsuarioUI = PlantaUsuario & {
  favorito?: boolean;
  isFavorito?: boolean;
  imagem?: string;
  nome?: string;
  faseOrdem?: number;
  dataAdocao?: string;
  fase?: { nome?: string; ordem?: number; imagem?: string };
  especiePlanta?: { nomePopular?: string };
};

export type RegistroUI = Registro & {
  plantaUsuario?: { apelido?: string };
  agua?: number;
  descricao?: string;
};

@Component({
  selector: 'app-minhas-plantas',
  templateUrl: './minhas-plantas.page.html',
  styleUrls: ['./minhas-plantas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MinhasPlantasPage implements OnInit {
  plantas: PlantaUsuarioUI[] = [];
  plantasFiltradas: PlantaUsuarioUI[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  filtroAtivo: string = 'todas';
  filtros = [
    { id: 'todas', label: 'Todas' },
    { id: 'recentes', label: 'Recentes' },
    { id: 'favoritadas', label: 'Favoritadas' }
  ];

  totalPlantas: number = 0;
  xpTotal: number = 0;
  nivelMedio: number = 0;

  ultimosRegistros: RegistroUI[] = [];
  carregandoRegistros: boolean = false;
  favoritosIds: number[] = [];

  constructor(
    private plantaService: PlantaUsuarioService,
    private registroService: RegistroService,
    private faseService: FaseService,
    private favoritoService: EspecieFavoritaService,
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarPlantas();
  }

  carregarPlantas() {
    this.loading = true;
    const usuario = this.authService.currentUser;
    if (!usuario || !usuario.id) {
      this.loading = false;
      this.mostrarAlerta('Aviso', 'Faça login para ver suas plantas.');
      return;
    }

    this.favoritoService.listarPorUsuario(usuario.id).subscribe({
      next: (favoritos) => {
        this.favoritosIds = favoritos.map(f => f.especieId);
        this.buscarListaPlantas(usuario.id!);
      },
      error: () => {
        this.favoritosIds = [];
        this.buscarListaPlantas(usuario.id!);
      }
    });
  }

  buscarListaPlantas(usuarioId: number) {
    this.plantaService.listarPorUsuario(usuarioId).subscribe({
      next: (plantas) => {
        this.plantas = plantas.map(p => {
          const eFavorito = this.favoritosIds.includes(p.especieId);
          return {
            ...p,
            favorito: eFavorito,
            isFavorito: eFavorito
          };
        });

        this.calcularEstatisticas();
        this.carregarDetalhesFase(this.plantas);
        this.carregarUltimosRegistros(usuarioId);
      },
      error: () => {
        this.loading = false;
        this.mostrarAlerta('Erro', 'Não foi possível carregar suas plantas.');
      }
    });
  }

  carregarDetalhesFase(plantas: PlantaUsuarioUI[]) {
    let carregados = 0;
    const total = plantas.length;
    if (total === 0) {
      this.loading = false;
      this.aplicarFiltros();
      return;
    }

    plantas.forEach((planta) => {
      this.faseService.buscarPorId(planta.faseId).subscribe({
        next: (fase) => {
          planta.faseNome = fase.nome;
          carregados++;
          if (carregados === total) {
            this.loading = false;
            this.aplicarFiltros();
          }
        },
        error: () => {
          planta.faseNome = 'Fase ' + planta.faseId;
          carregados++;
          if (carregados === total) {
            this.loading = false;
            this.aplicarFiltros();
          }
        }
      });
    });
  }

  carregarUltimosRegistros(usuarioId: number) {
    this.carregandoRegistros = true;
    const plantasIds = this.plantas.map(p => p.id!).filter(id => id !== undefined);
    if (plantasIds.length === 0) {
      this.carregandoRegistros = false;
      return;
    }

    let registros: RegistroUI[] = [];
    let concluidos = 0;
    plantasIds.forEach(id => {
      this.registroService.listarPorPlanta(id).subscribe({
        next: (regs) => {
          registros = registros.concat(regs as RegistroUI[]);
          concluidos++;
          if (concluidos === plantasIds.length) {
            this.ultimosRegistros = registros
              .sort((a, b) => new Date(b.dataRegistro).getTime() - new Date(a.dataRegistro).getTime())
              .slice(0, 5);
            this.carregandoRegistros = false;
          }
        },
        error: () => {
          concluidos++;
          if (concluidos === plantasIds.length) {
            this.carregandoRegistros = false;
          }
        }
      });
    });
  }

  calcularEstatisticas() {
    this.totalPlantas = this.plantas.length;
    this.xpTotal = this.plantas.reduce((acc, p) => acc + (p.xpAtual || 0), 0);
    const niveis = this.plantas.map(p => p.nivel || 1);
    this.nivelMedio = niveis.length > 0 ? Math.round(niveis.reduce((a, b) => a + b, 0) / niveis.length) : 0;
  }

  toggleFavorito(event: Event, planta: PlantaUsuarioUI) {
    event.stopPropagation();
    event.preventDefault();

    const usuario = this.authService.currentUser;
    if (!usuario || !usuario.id) {
      this.mostrarAlerta('Aviso', 'Você precisa estar logado para favoritar.');
      return;
    }

    const novoEstado = !(planta.favorito || planta.isFavorito);
    planta.favorito = novoEstado;
    planta.isFavorito = novoEstado;

    if (novoEstado) {
      if (!this.favoritosIds.includes(planta.especieId)) {
        this.favoritosIds.push(planta.especieId);
      }
      this.favoritoService.favoritar(usuario.id, planta.especieId).subscribe({
        next: () => {
          console.log(`✅ Espécie ${planta.especieId} favoritada com sucesso.`);
        },
        error: (err) => {
          console.error('Erro ao favoritar espécie:', err);
          planta.favorito = false;
          planta.isFavorito = false;
          this.favoritosIds = this.favoritosIds.filter(id => id !== planta.especieId);
          this.mostrarAlerta('Erro', 'Não foi possível favoritar a espécie.');
        }
      });
    } else {
      this.favoritosIds = this.favoritosIds.filter(id => id !== planta.especieId);
      this.favoritoService.desfavoritar(usuario.id, planta.especieId).subscribe({
        next: () => {
          console.log(`✅ Espécie ${planta.especieId} removida dos favoritos.`);
        },
        error: (err) => {
          console.error('Erro ao desfavoritar espécie:', err);
          planta.favorito = true;
          planta.isFavorito = true;
          this.favoritosIds.push(planta.especieId);
          this.mostrarAlerta('Erro', 'Não foi possível remover dos favoritos.');
        }
      });
    }

    if (this.filtroAtivo === 'favoritadas') {
      this.aplicarFiltros();
    }
  }

  aplicarFiltros() {
    let lista = [...this.plantas];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      lista = lista.filter(p =>
        (p.apelido && p.apelido.toLowerCase().includes(term)) ||
        (p.especieNomePopular && p.especieNomePopular.toLowerCase().includes(term))
      );
    }

    switch (this.filtroAtivo) {
      case 'recentes':
        lista.sort((a, b) => new Date(b.dataCriacao || 0).getTime() - new Date(a.dataCriacao || 0).getTime());
        break;
      case 'favoritadas':
        lista = lista.filter(p => p.favorito || p.isFavorito || this.favoritosIds.includes(p.especieId));
        break;
      default:
        lista.sort((a, b) => (a.apelido || '').localeCompare(b.apelido || ''));
        break;
    }

    this.plantasFiltradas = lista;
  }

  onSearchChange() {
    this.aplicarFiltros();
  }

  setFiltro(filtro: string) {
    this.filtroAtivo = filtro;
    this.aplicarFiltros();
  }

  abrirPlanta(planta: PlantaUsuarioUI) {
    this.router.navigate(['/cuidados-planta', planta.id]);
  }

  adicionarPlanta() {
    this.router.navigate(['/explorar-especies']);
  }

  getStatusIcon(planta: PlantaUsuarioUI): string {
    const fel = planta.felicidade ?? 100;
    const sau = planta.saude ?? 100;
    const media = (fel + sau) / 2;

    if (media >= 80) return 'happy-outline';
    if (media >= 50) return 'ellipse-outline';
    return 'sad-outline';
  }

  getStatusColor(planta: PlantaUsuarioUI): string {
    const fel = planta.felicidade ?? 100;
    const sau = planta.saude ?? 100;
    const media = (fel + sau) / 2;

    if (media >= 80) return '#2D6A4F';
    if (media >= 50) return '#F5A623';
    return '#d4183d';
  }

  formatDate(date?: string): string {
    if (!date) return 'Data N/A';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Data N/A' : d.toLocaleDateString('pt-BR');
  }

  getTempoRelativo(date?: string): string {
    if (!date) return 'Recente';
    const agora = new Date();
    const data = new Date(date);
    if (isNaN(data.getTime())) return 'Recente';

    const diff = Math.floor((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff < 7) return `${diff} dias atrás`;
    return this.formatDate(date);
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
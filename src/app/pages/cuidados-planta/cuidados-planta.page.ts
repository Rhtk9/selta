// src/app/pages/cuidados-planta/cuidados-planta.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

import { PlantaUsuarioService } from '../../services/planta-usuario';
import { RegistroService } from '../../services/registro';
import { FaseService } from '../../services/fase.service';
import { AuthService } from '../../core/services/auth.service';
import { PlantaUsuario } from '../../model/planta-usuario.model';
import { Registro } from '../../model/registro.model';
import { FasePlanta, NecessidadeFase } from '../../model/fase-planta.model';

@Component({
  selector: 'app-cuidados-planta',
  templateUrl: './cuidados-planta.page.html',
  styleUrls: ['./cuidados-planta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CuidadosPlantaPage implements OnInit {
  plantaId: number = 0;
  planta: PlantaUsuario | null = null;
  fase: FasePlanta | null = null;
  necessidade: NecessidadeFase | null = null;

  // Controles de cuidado
  agua: number = 50;
  luz: number = 50;
  nutrientes: number = 50;

  // Valores ideais (da fase)
  aguaIdeal: number = 50;
  luzIdeal: number = 50;
  nutrientesIdeal: number = 100; // assumimos 100% como ideal

  // Status
  loading: boolean = true;
  cuidando: boolean = false;
  plantaMorreu: boolean = false;

  // Histórico
  historico: Registro[] = [];
  carregandoHistorico: boolean = false;

  // Feedback
  feedback: {
    xpPlanta: number;
    xpUsuario: number;
    mensagem: string;
    evoluiu: boolean;
  } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private plantaService: PlantaUsuarioService,
    private registroService: RegistroService,
    private faseService: FaseService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.plantaId = parseInt(id, 10);
      this.carregarDados();
    } else {
      this.router.navigate(['/minhas-plantas']);
    }
  }

  carregarDados() {
    this.loading = true;
    this.plantaService.buscarPorId(this.plantaId).subscribe({
      next: (planta) => {
        this.planta = planta;
        this.carregarFase(planta.faseId);
        this.carregarHistorico();
      },
      error: () => {
        this.loading = false;
        this.mostrarAlerta('Erro', 'Não foi possível carregar os dados da planta.');
        this.router.navigate(['/minhas-plantas']);
      }
    });
  }

  carregarFase(faseId: number) {
    this.faseService.buscarPorId(faseId).subscribe({
      next: (fase) => {
        this.fase = fase;
        this.necessidade = fase.necessidadeFase;
        if (this.necessidade) {
          this.aguaIdeal = this.necessidade.aguaMedia;
          this.luzIdeal = this.necessidade.luzMedia;
          this.nutrientesIdeal = 100;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.mostrarAlerta('Erro', 'Não foi possível carregar os dados da fase.');
      }
    });
  }

  carregarHistorico() {
    this.carregandoHistorico = true;
    this.registroService.listarPorPlanta(this.plantaId).subscribe({
      next: (registros) => {
        this.historico = registros
          .sort((a, b) => new Date(b.dataRegistro).getTime() - new Date(a.dataRegistro).getTime())
          .slice(0, 5);
        this.carregandoHistorico = false;
      },
      error: () => {
        this.carregandoHistorico = false;
        this.historico = [];
      }
    });
  }

  // ========== CALCULAR QUALIDADE DO CUIDADO ==========
  calcularQualidade(): number {
    const proxAgua = 1 - (Math.abs(this.agua - this.aguaIdeal) / 100);
    const proxLuz = 1 - (Math.abs(this.luz - this.luzIdeal) / 100);
    const proxNutri = this.nutrientes / 100;

    const media = (proxAgua + proxLuz + proxNutri) / 3;
    const qualidade = Math.round(media * 10);
    return Math.max(0, Math.min(10, qualidade));
  }

  // ========== CUIDAR DA PLANTA ==========
  cuidar() {
  if (!this.planta || !this.planta.id) {
    this.mostrarAlerta('Erro', 'Planta não encontrada.');
    return;
  }

  this.cuidando = true;
  this.feedback = null;

  const qualidade = this.calcularQualidade();

  const payload = {
    aguaPlanta: this.agua,
    luz: this.luz,
    nutrientes: this.nutrientes,
    qualidadeCuidado: qualidade,
    plantaUsuarioId: this.planta.id
  };

  this.registroService.criar(payload).subscribe({
    next: (response: any) => {
      this.cuidando = false;
      if (response && response.planta) {
        this.atualizarPlanta(response.planta);
      } else if (response && response.id) {
        // Se retornou apenas o registro, recarrega a planta
        this.recarregarPlanta();
      } else {
        this.recarregarPlanta();
      }
      this.mostrarFeedback(response);
    },
    error: (err) => {
      this.cuidando = false;
      const msg = err.error?.message || 'Erro ao cuidar da planta. Tente novamente.';
      this.mostrarAlerta('Erro', msg);
    }
  });
}

  atualizarPlanta(plantaAtualizada: PlantaUsuario) {
    this.planta = plantaAtualizada;
    this.authService.atualizarUsuario();
  }

  recarregarPlanta() {
    this.plantaService.buscarPorId(this.plantaId).subscribe({
      next: (planta) => {
        this.planta = planta;
        this.carregarHistorico();
        this.carregarFase(planta.faseId);
      },
      error: () => {
        this.mostrarAlerta('Erro', 'Não foi possível recarregar os dados da planta.');
      }
    });
  }

  mostrarFeedback(response: any) {
  if (!response) return;

  let mensagem = 'Cuidado realizado com sucesso!';
  let xpPlanta = 0;
  let xpUsuario = 0;
  let evoluiu = false;

  if (response.mensagem) mensagem = response.mensagem;
  if (response.xpPlantaGanho !== undefined) xpPlanta = response.xpPlantaGanho;
  if (response.xpUsuarioGanho !== undefined) xpUsuario = response.xpUsuarioGanho;
  if (response.evoluiu !== undefined) evoluiu = response.evoluiu;

  // Atualizar usuário no AuthService passando o ID obrigatório
  const usuario = this.authService.currentUser;
  if (usuario && usuario.id) {
    if (response.xpTotalUsuario !== undefined || response.novoNivelUsuario !== undefined) {
      this.authService.atualizarEstadoUsuarioLocal({
        xpTotal: response.xpTotalUsuario,
        nivelUsuario: response.novoNivelUsuario
      });
    } else {
      // CORREÇÃO: Passando usuario.id como argumento
      this.authService.atualizarUsuario(usuario.id).subscribe();
    }
  }

  this.feedback = { xpPlanta, xpUsuario, mensagem, evoluiu };
  this.mostrarFeedbackToast();
}

  // ========== UTILITÁRIOS ==========
  getStatusIcon(planta: PlantaUsuario): string {
    const media = (planta.felicidade + planta.saude) / 2;
    if (media >= 80) return 'happy-outline';
    if (media >= 50) return 'ellipse-outline';
    return 'sad-outline';
  }

  getStatusColor(planta: PlantaUsuario): string {
    const media = (planta.felicidade + planta.saude) / 2;
    if (media >= 80) return '#2D6A4F';
    if (media >= 50) return '#F5A623';
    return '#d4183d';
  }

  getSaudeLabel(planta: PlantaUsuario): string {
    const media = (planta.felicidade + planta.saude) / 2;
    if (media >= 80) return 'Bom';
    if (media >= 50) return 'Médio';
    return 'Crítico';
  }

  getSaudeColor(planta: PlantaUsuario): string {
    const media = (planta.felicidade + planta.saude) / 2;
    if (media >= 80) return '#2D6A4F';
    if (media >= 50) return '#F5A623';
    return '#d4183d';
  }

  getProgressoXP(): number {
    if (!this.planta || !this.fase) return 0;
    const xp = this.planta.xpAtual || 0;
    const max = this.fase.xpNecessario || 1;
    return Math.min((xp / max) * 100, 100);
  }

  getXpTexto(): string {
    if (!this.planta || !this.fase) return '0 / 0 XP';
    return `${this.planta.xpAtual || 0} / ${this.fase.xpNecessario || 0} XP`;
  }

  getTempoRelativo(date: string): string {
    const agora = new Date();
    const data = new Date(date);
    const diff = Math.floor((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff < 7) return `${diff} dias atrás`;
    return data.toLocaleDateString('pt-BR');
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async mostrarFeedbackToast() {
    if (!this.feedback) return;
    const mensagem = this.feedback.mensagem || 'Cuidado realizado!';
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 4000,
      color: this.feedback.evoluiu ? 'success' : 'primary',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  voltar() {
    this.router.navigate(['/minhas-plantas']);
  }
}
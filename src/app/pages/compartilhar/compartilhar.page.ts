// src/app/pages/compartilhar/compartilhar.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';

import { AuthService } from '../../core/services/auth.service';
import { PlantaUsuarioService } from '../../services/planta-usuario';
import { FaseService } from '../../services/fase.service';
import { UsuarioRecompensaService } from '../../services/usuario-recompensa.service';

import { Usuario } from '../../model/usuario.model';
import { PlantaUsuario } from '../../model/planta-usuario.model';
import { FasePlanta } from '../../model/fase-planta.model';
import { addIcons } from 'ionicons';
import {
  logoTwitter,
  logoInstagram,
  logoFacebook,
  logoWhatsapp,
  copyOutline,
  downloadOutline,
  shareSocialOutline,
  leafOutline
} from 'ionicons/icons';
type TipoCard = 'planta' | 'conquistas' | 'progresso';

interface CardOption {
  id: TipoCard;
  titulo: string;
  descricao: string;
}

@Component({
  selector: 'app-compartilhar',
  templateUrl: './compartilhar.page.html',
  styleUrls: ['./compartilhar.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CompartilharPage implements OnInit {

  // ============ ESTADO ============
  usuario: Usuario | null = null;
  planta: PlantaUsuario | null = null;
  fase: FasePlanta | null = null;
  conquistas: number = 0;

  tipoCard: TipoCard = 'planta';

  cards: CardOption[] = [
    { id: 'planta', titulo: 'Minha planta', descricao: 'Compartilhe o crescimento da sua planta' },
    { id: 'conquistas', titulo: 'Conquistas', descricao: 'Mostre seus badges e conquistas' },
    { id: 'progresso', titulo: 'Progresso semanal', descricao: 'Evolução dos seus estudos' }
  ];

  // URL "fake" mas estável baseada no usuário
  shareUrl: string = '';
  isLoading: boolean = true;

  // valores derivados
  nivelPlanta: number = 1;
  xpPlanta: number = 0;
  progressoPlanta: number = 0;
  streakUsuario: number = 0;

  
constructor(
  private authService: AuthService,
  private plantaService: PlantaUsuarioService,
  private faseService: FaseService,
  private usuarioRecompensaService: UsuarioRecompensaService,
  private toastController: ToastController
) {
  addIcons({
    logoTwitter,
    logoInstagram,
    logoFacebook,
    logoWhatsapp,
    copyOutline,
    downloadOutline,
    shareSocialOutline,
    leafOutline
  });
}
  // ============ LIFECYCLE ============
  ngOnInit() {
    this.carregarDados();
  }

  async carregarDados() {
    this.isLoading = true;
    this.usuario = this.authService.currentUser;

    if (!this.usuario?.id) {
      this.isLoading = false;
      return;
    }

    this.streakUsuario = this.usuario.sequenciaDias || 0;
    this.gerarShareUrl();

    try {
      // 1) Pega a planta principal do usuário (maior XP)
      const plantas = await this.plantaService.listarPorUsuario(this.usuario.id).toPromise() || [];
      if (plantas.length > 0) {
        this.planta = [...plantas].sort((a, b) => (b.xpAtual || 0) - (a.xpAtual || 0))[0];
        this.nivelPlanta = this.planta.nivel || 1;
        this.xpPlanta = this.planta.xpAtual || 0;

        // 2) Pega a fase para calcular progresso
        if (this.planta.faseId) {
          try {
            this.fase = await this.faseService.buscarPorId(this.planta.faseId).toPromise() || null;
            const xpNecessario = this.fase?.xpNecessario || 1;
            this.progressoPlanta = Math.min(100, Math.round((this.xpPlanta / xpNecessario) * 100));
          } catch {
            this.progressoPlanta = 0;
          }
        }
      }

      // 3) Conta as recompensas desbloqueadas
      try {
        const recompensas = await this.usuarioRecompensaService
          .listarPorUsuario(this.usuario.id)
          .toPromise() || [];
        this.conquistas = recompensas.length;
      } catch {
        this.conquistas = 0;
      }

    } catch (error) {
      console.error('Erro ao carregar dados de compartilhamento:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // ============ HELPERS ============
  private gerarShareUrl() {
    const nome = (this.usuario?.nome || 'usuario')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const id = this.usuario?.id || 0;
    this.shareUrl = `biogrow.app/share/${nome}-${id}`;
  }

  setTipoCard(tipo: TipoCard) {
    this.tipoCard = tipo;
  }

  // ============ AÇÕES ============
  async copiarLink() {
    try {
      await navigator.clipboard.writeText(`https://${this.shareUrl}`);
      this.mostrarToast('Link copiado!', 'success');
    } catch {
      // fallback pra navegadores antigos
      const input = document.createElement('input');
      input.value = `https://${this.shareUrl}`;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.mostrarToast('Link copiado!', 'success');
    }
  }

  compartilharRede(rede: 'twitter' | 'instagram' | 'facebook' | 'whatsapp') {
    const texto = this.montarTextoCompartilhamento();
    const url = `https://${this.shareUrl}`;

    let shareLink = '';

    switch (rede) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(texto + ' ' + url)}`;
        break;
      case 'instagram':
        // Instagram não aceita share via URL — orienta o usuário
        this.mostrarToast('Baixe a imagem e poste no Instagram!', 'primary');
        return;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
    }
  }

  private montarTextoCompartilhamento(): string {
    switch (this.tipoCard) {
      case 'planta':
        return `Minha planta ${this.planta?.apelido || 'virtual'} está no nível ${this.nivelPlanta} com ${this.xpPlanta} XP no BioGrow! 🌱`;
      case 'conquistas':
        return `Já desbloqueei ${this.conquistas} conquistas no BioGrow! 🏆`;
      case 'progresso':
        return `Estou há ${this.streakUsuario} dias seguidos estudando no BioGrow! 📈`;
    }
  }

  async baixarImagem() {
    // Gera um "card" simples em canvas com os dados
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // fundo degradê verde
    const grad = ctx.createLinearGradient(0, 0, 0, 1080);
    grad.addColorStop(0, '#1B4332');
    grad.addColorStop(1, '#2D6A4F');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // "BIOGROW"
    ctx.fillStyle = '#B7E4C7';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('BIOGROW', 80, 120);

    // Nome do usuário
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText(this.usuario?.nome || 'Usuário', 80, 240);

    // subtítulo
    ctx.fillStyle = '#95D5B2';
    ctx.font = '32px sans-serif';
    ctx.fillText('Minha planta virtual', 80, 300);

    // stats
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(`${this.nivelPlanta}`, 80, 780);
    ctx.fillText(`${this.xpPlanta}`, 420, 780);
    ctx.fillText(`${this.streakUsuario}d`, 760, 780);

    ctx.fillStyle = '#95D5B2';
    ctx.font = '24px sans-serif';
    ctx.fillText('Nível', 80, 820);
    ctx.fillText('XP', 420, 820);
    ctx.fillText('Streak', 760, 820);

    // Baixa
    const link = document.createElement('a');
    link.download = `biogrow-${this.usuario?.id || 0}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    this.mostrarToast('Imagem baixada!', 'success');
  }

  compartilharAgora() {
    const texto = this.montarTextoCompartilhamento();
    const url = `https://${this.shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: 'BioGrow',
        text: texto,
        url: url
      }).catch(() => { /* usuário cancelou */ });
    } else {
      this.copiarLink();
    }
  }

  private mostrarToast(message: string, color: string = 'primary') {
    this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
      mode: 'ios'
    }).then(t => t.present());
  }
}
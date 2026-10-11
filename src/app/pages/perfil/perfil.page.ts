// src/app/pages/perfil/perfil.page.ts

import {
  Component,
  OnInit,
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonicModule,
  AlertController,
  ToastController,
  ActionSheetController
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../core/services/auth.service';
import { ResponsavelService } from '../../services/responsavel';
import { ProfessorTurmaService } from '../../services/professor-turma.service';
import { AtividadeService } from '../../services/atividade.service';
import { Usuario } from '../../model/usuario.model';

import { addIcons } from 'ionicons';
import {
  personOutline,
  lockClosedOutline,
  createOutline,
  closeOutline,
  cameraOutline,
  cloudUploadOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  imageOutline,
  linkOutline,
  starOutline,
  flameOutline,
  flashOutline,
  notificationsOutline,
  shareSocialOutline,
  barChartOutline,
  settingsOutline,
  logOutOutline,
  schoolOutline,
  peopleOutline,
  heartOutline,
  ribbonOutline
} from 'ionicons/icons';

interface Papel {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  ativo: boolean;
  rota?: string;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PerfilPage implements OnInit, AfterViewInit {

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  usuario: Usuario | null = null;
  usuarioId: number = 0;
  isLoading = false;
  isEditing = false;
  isChangingPassword = false;

  // Dados do perfil
  nome: string = '';
  bio: string = '';
  email: string = '';
  dataNascimento: string = '';
  imagem: string = '';

  // Dados de senha
  senhaAtual: string = '';
  novaSenha: string = '';
  confirmarSenha: string = '';

  // Configurações
  notificacoes: boolean = true;
  som: boolean = true;

  // Nível e XP
  nivel: number = 1;
  xpTotal: number = 0;
  xpProximoNivel: number = 1000;
  progressoXP: number = 0;
  sequenciaDias: number = 0;
  pontuacaoTotal: number = 0;

  // Estatísticas
  totalAulas: number = 0;
  mediaNotas: number = 0;

  // Papéis
  papeis: Papel[] = [];

  // Webcam
  webcamAberta = false;
  private webcamStream: MediaStream | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private responsavelService: ResponsavelService,
    private professorTurmaService: ProfessorTurmaService,
    private atividadeService: AtividadeService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      personOutline, lockClosedOutline, createOutline, closeOutline,
      cameraOutline, cloudUploadOutline, checkmarkCircleOutline, alertCircleOutline,
      imageOutline, linkOutline, starOutline, flameOutline, flashOutline,
      notificationsOutline, shareSocialOutline, barChartOutline, settingsOutline,
      logOutOutline, schoolOutline, peopleOutline, heartOutline, ribbonOutline
    });
  }

  ngOnInit() {
    this.carregarUsuario();
  }

  ionViewWillEnter() {
    this.carregarUsuario();
  }

  ngAfterViewInit() {
    if (this.webcamAberta && this.videoElement?.nativeElement && this.webcamStream) {
      const video = this.videoElement.nativeElement;
      video.srcObject = this.webcamStream;
      video.play().catch(e => console.warn('Erro ao dar play:', e));
    }
  }

  async carregarUsuario() {
    this.isLoading = true;
    this.usuario = this.authService.currentUser;

    if (this.usuario && this.usuario.id) {
      this.usuarioId = this.usuario.id;
      this.nome = this.usuario.nome || '';
      this.bio = this.usuario.bio || '';
      this.email = this.usuario.email || '';
      this.imagem = this.usuario.imagem || '';
      this.dataNascimento = this.usuario.dataNascimento || '';

      this.notificacoes = this.usuario.notificacoes !== undefined ? this.usuario.notificacoes : true;
      this.som = this.usuario.som !== undefined ? this.usuario.som : true;

      this.nivel = this.usuario.nivelUsuario || 1;
      this.xpTotal = this.usuario.xpTotal || 0;
      this.sequenciaDias = this.usuario.sequenciaDias || 0;
      this.pontuacaoTotal = this.usuario.pontuacaoTotal || 0;

      this.calcularProgressoXP();

      // 🔥 DESLIGA O SPINNER ANTES DOS AWAITS
      this.isLoading = false;

      await this.carregarPapeis();
      await this.carregarEstatisticas();
    } else {
      this.isLoading = false;
      this.router.navigate(['/login']);
    }
  }

  calcularProgressoXP() {
    const xpPorNivel = 1000;
    this.xpProximoNivel = this.nivel * xpPorNivel;
    const base = (this.nivel - 1) * xpPorNivel;
    this.progressoXP = Math.min(100, Math.round(((this.xpTotal - base) / xpPorNivel) * 100));
    if (this.progressoXP < 0) this.progressoXP = 0;
  }

  async carregarPapeis() {
    if (!this.usuarioId) return;

    const papeisTemp: Papel[] = [];

    let isProfessor = false;
    try {
      const turmas = await this.professorTurmaService.listarPorUsuario(this.usuarioId).toPromise() || [];
      isProfessor = turmas.length > 0;
    } catch { isProfessor = false; }

    let isResponsavel = false;
    try {
      const alunos = await this.responsavelService.listarPorResponsavel(this.usuarioId).toPromise() || [];
      isResponsavel = alunos.length > 0;
    } catch { isResponsavel = false; }

    papeisTemp.push({
      id: 'aluno',
      titulo: 'Aluno',
      descricao: 'Participe de turmas e atividades',
      icone: 'people-outline',
      ativo: true
    });

    papeisTemp.push({
      id: 'professor',
      titulo: 'Professor',
      descricao: isProfessor ? 'Turma criada por você' : 'Crie uma turma para ativar',
      icone: 'school-outline',
      ativo: isProfessor,
      rota: isProfessor ? '/painel-professor' : undefined
    });

    papeisTemp.push({
      id: 'responsavel',
      titulo: 'Responsável',
      descricao: isResponsavel ? 'Acompanhe o progresso do aluno' : 'Vincule-se a um aluno',
      icone: 'heart-outline',
      ativo: isResponsavel,
      rota: isResponsavel ? '/responsavel' : undefined
    });

    this.papeis = papeisTemp;
  }

  async carregarEstatisticas() {
    if (!this.usuarioId) return;
    try {
      const atividades = await this.atividadeService.listarPorUsuario(this.usuarioId).toPromise() || [];
      this.totalAulas = atividades.length;

      const comNota = atividades.filter((a: any) => a.nota !== undefined && a.nota !== null);
      if (comNota.length > 0) {
        const soma = comNota.reduce((s: number, a: any) => s + (a.nota || 0), 0);
        this.mediaNotas = Math.round(soma / comNota.length);
      }
    } catch {
      this.totalAulas = 0;
      this.mediaNotas = 0;
    }
  }

  // ==================== UPLOAD DE IMAGEM ====================

  async uploadImagem() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Foto de perfil',
      buttons: [
        { text: 'Tirar foto (webcam)', icon: 'camera-outline', handler: () => this.abrirWebcam() },
        { text: 'Tirar foto (câmera)', icon: 'camera-outline', handler: () => this.tirarFoto() },
        { text: 'Escolher imagem', icon: 'image-outline', handler: () => this.escolherDaGaleria() },
        { text: 'Colar URL', icon: 'link-outline', handler: () => this.colarUrl() },
        { text: 'Cancelar', role: 'cancel', icon: 'close-outline' }
      ]
    });
    await actionSheet.present();
  }

  // ==================== WEBCAM ====================

  async abrirWebcam() {
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });

      this.webcamAberta = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        if (this.videoElement?.nativeElement && this.webcamStream) {
          const video = this.videoElement.nativeElement;
          video.srcObject = this.webcamStream;
          video.play().catch(e => console.warn('Erro ao dar play:', e));
        }
      }, 500);
    } catch (error) {
      console.error('Erro ao acessar webcam:', error);
      this.mostrarToast('Não foi possível acessar a câmera do PC.', 'danger');
    }
  }

  fecharWebcam() {
    this.webcamAberta = false;
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(t => t.stop());
      this.webcamStream = null;
    }
  }

  async capturarFoto() {
    if (!this.videoElement?.nativeElement || !this.webcamStream) return;

    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    this.fecharWebcam();

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await this.enviarFoto(file);
    }, 'image/jpeg', 0.9);
  }

  // ==================== CÂMERA NATIVA ====================

  private async tirarFoto() {
    try {
      const foto = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      if (foto.webPath) {
        const blob = await fetch(foto.webPath).then(r => r.blob());
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
        await this.enviarFoto(file);
      }
    } catch (error) {
      console.log('Câmera cancelada:', error);
    }
  }

  private async escolherDaGaleria() {
    try {
      const foto = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });
      if (foto.webPath) {
        const blob = await fetch(foto.webPath).then(r => r.blob());
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
        await this.enviarFoto(file);
      }
    } catch (error) {
      console.log('Galeria cancelada:', error);
    }
  }

  // ==================== COLAR URL ====================

  private async colarUrl() {
    const alert = await this.alertController.create({
      header: 'URL da imagem',
      message: 'Digite a URL da sua imagem de perfil',
      inputs: [{
        name: 'url',
        type: 'url',
        placeholder: 'https://exemplo.com/imagem.jpg',
        value: this.imagem || ''
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: (data) => {
            if (data.url?.trim()) {
              this.imagem = data.url.trim();
              this.mostrarToast('Imagem atualizada!', 'success');
              if (this.isEditing) this.atualizarPerfil();
            } else {
              this.mostrarToast('URL inválida', 'warning');
              return false;
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  // ==================== ENVIAR FOTO ====================

  private async enviarFoto(file: File) {
    if (!this.usuarioId) {
      this.mostrarToast('Usuário não identificado', 'danger');
      return;
    }

    this.isLoading = true;
    try {
      const reader = new FileReader();
      reader.onload = (e: any) => { this.imagem = e.target.result; };
      reader.readAsDataURL(file);

      const usuarioAtualizado = await this.usuarioService
        .atualizarFoto(this.usuarioId, file)
        .toPromise();

      if (usuarioAtualizado) {
        this.authService.setCurrentUser(usuarioAtualizado);
        this.usuario = usuarioAtualizado;
        this.imagem = usuarioAtualizado.imagem || '';
        this.mostrarToast('Foto atualizada!', 'success');
      }
    } catch (error: any) {
      console.error('Erro ao enviar foto:', error);
      this.mostrarToast(error.error?.message || 'Erro ao enviar foto', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // ==================== TOGGLE ====================

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) this.carregarUsuario();
  }

  togglePasswordChange() {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      this.senhaAtual = '';
      this.novaSenha = '';
      this.confirmarSenha = '';
    }
  }

  // ==================== SALVAR PERFIL ====================

  async salvarPerfil() {
    await this.atualizarPerfil();
  }

  async atualizarPerfil() {
    if (!this.usuarioId) {
      this.mostrarToast('Usuário não identificado', 'danger');
      return;
    }

    if (!this.nome || !this.email || !this.dataNascimento) {
      this.mostrarToast('Nome, email e data de nascimento são obrigatórios', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.mostrarToast('Email inválido', 'warning');
      return;
    }

    this.isLoading = true;
    try {
      const usuarioAtualizado = {
        nome: this.nome.trim(),
        email: this.email.trim(),
        senha: this.usuario?.senha || '123456',
        imagem: this.imagem && this.imagem.trim() !== '' ? this.imagem.trim() : undefined,
        bio: this.bio && this.bio.trim() !== '' ? this.bio.trim() : undefined,
        dataNascimento: this.dataNascimento,
        tema: this.usuario?.tema || 1,
        idioma: this.usuario?.idioma || 1,
        notificacoes: this.notificacoes,
        som: this.som
      };

      const resultado = await this.usuarioService.atualizar(this.usuarioId, usuarioAtualizado).toPromise();

      if (resultado) {
        this.authService.setCurrentUser(resultado);
        this.usuario = resultado;
        this.mostrarToast('Perfil atualizado!', 'success');
        this.isEditing = false;
        this.carregarUsuario();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      this.mostrarToast(error.error?.message || 'Erro ao atualizar perfil', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // ==================== ALTERAR SENHA ====================

  async alterarSenha() {
    if (!this.senhaAtual || !this.novaSenha || !this.confirmarSenha) {
      this.mostrarToast('Preencha todos os campos de senha', 'warning');
      return;
    }
    if (this.novaSenha.length < 6) {
      this.mostrarToast('A nova senha deve ter pelo menos 6 caracteres', 'warning');
      return;
    }
    if (this.novaSenha !== this.confirmarSenha) {
      this.mostrarToast('As senhas não coincidem', 'danger');
      return;
    }

    this.isLoading = true;
    try {
      const usuarioAtual = await this.usuarioService.buscarPorId(this.usuarioId).toPromise();
      if (!usuarioAtual || usuarioAtual.senha !== this.senhaAtual) {
        this.mostrarToast('Senha atual incorreta', 'danger');
        return;
      }

      const dadosAtualizados = {
        nome: usuarioAtual.nome,
        email: usuarioAtual.email,
        senha: this.novaSenha,
        dataNascimento: usuarioAtual.dataNascimento,
        imagem: usuarioAtual.imagem || undefined,
        bio: usuarioAtual.bio || undefined,
        tema: usuarioAtual.tema || 1,
        idioma: usuarioAtual.idioma || 1,
        notificacoes: usuarioAtual.notificacoes ?? true,
        som: usuarioAtual.som ?? true
      };

      const resultado = await this.usuarioService.atualizar(this.usuarioId, dadosAtualizados).toPromise();
      if (resultado) {
        this.authService.setCurrentUser(resultado);
        this.mostrarToast('Senha alterada!', 'success');
        this.senhaAtual = '';
        this.novaSenha = '';
        this.confirmarSenha = '';
        this.isChangingPassword = false;
        this.carregarUsuario();
      }
    } catch (error: any) {
      this.mostrarToast(error.error?.message || 'Erro ao alterar senha', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // ==================== NAVEGAÇÃO ====================

  navegarPara(rota?: string) {
    if (rota) this.router.navigate([rota]);
  }

  irParaPerfil() {
    this.isEditing = true;
  }

  abrirConfiguracoes() {
    this.mostrarToast('Configurações em breve', 'primary');
  }

  sair() {
    this.alertController.create({
      header: 'Sair da conta',
      message: 'Tem certeza que deseja sair?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    }).then(alert => alert.present());
  }

  // ==================== HELPERS ====================

  getIniciais(): string {
    if (!this.nome) return '?';
    const partes = this.nome.trim().split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
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
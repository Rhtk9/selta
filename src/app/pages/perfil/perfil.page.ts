// src/app/pages/perfil/perfil.page.ts

import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Verifique se os caminhos relativos (../../) batem com a estrutura real das suas pastas:
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../core/services/auth.service';
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
  alertCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class PerfilPage implements OnInit {
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
  sequenciaDias: number = 0;
  pontuacaoTotal: number = 0;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      personOutline,
      lockClosedOutline,
      createOutline,
      closeOutline,
      cameraOutline,
      cloudUploadOutline,
      checkmarkCircleOutline,
      alertCircleOutline
    });
  }

  ngOnInit() {
    this.carregarUsuario();
  }

  ionViewWillEnter() {
    this.carregarUsuario();
  }

  carregarUsuario() {
    this.usuario = this.authService.currentUser;

    if (this.usuario && this.usuario.id) {
      this.usuarioId = this.usuario.id;
      this.nome = this.usuario.nome || '';
      this.bio = this.usuario.bio || '';
      this.email = this.usuario.email || '';
      this.imagem = this.usuario.imagem || '';
      
      if (this.usuario.dataNascimento) {
        this.dataNascimento = this.usuario.dataNascimento;
      } else {
        this.dataNascimento = '';
      }
      
      this.notificacoes = this.usuario.notificacoes !== undefined 
        ? this.usuario.notificacoes 
        : true;
      
      this.som = this.usuario.som !== undefined 
        ? this.usuario.som 
        : true;

      this.nivel = this.usuario.nivelUsuario || 1;
      this.xpTotal = this.usuario.xpTotal || 0;
      this.sequenciaDias = this.usuario.sequenciaDias || 0;
      this.pontuacaoTotal = this.usuario.pontuacaoTotal || 0;

      console.log('👤 Usuário carregado do backend:', this.usuario);
    } else {
      console.warn('⚠️ Usuário não encontrado');
      this.router.navigate(['/login']);
    }
  }

  // ==================== TOGGLE FUNCTIONS ====================

  toggleEdit() {
    this.isEditing = !this.isEditing;
    console.log('📝 ===== BOTÃO EDITAR PERFIL CLICADO =====');
    console.log('📝 isEditing agora é:', this.isEditing);
    if (!this.isEditing) {
      this.carregarUsuario();
    }
  }

  togglePasswordChange() {
    this.isChangingPassword = !this.isChangingPassword;
    console.log('🔒 ===== BOTÃO ALTERAR SENHA CLICADO =====');
    console.log('🔒 isChangingPassword agora é:', this.isChangingPassword);
    if (!this.isChangingPassword) {
      this.senhaAtual = '';
      this.novaSenha = '';
      this.confirmarSenha = '';
    }
  }

  // ==================== ATUALIZAR PERFIL ====================

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
// Em atualizarPerfil()
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

      console.log('📤 Enviando para API:', JSON.stringify(usuarioAtualizado, null, 2));

      const resultado = await this.usuarioService.atualizar(this.usuarioId, usuarioAtualizado).toPromise();

      if (resultado) {
        this.authService.setCurrentUser(resultado);
        this.usuario = resultado;
        this.mostrarToast('✅ Perfil atualizado com sucesso!', 'success');
        this.isEditing = false;
        this.carregarUsuario();
      }
    } catch (error: any) {
      console.error('❌ Erro ao atualizar perfil:', error);
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

    if (this.senhaAtual === this.novaSenha) {
      this.mostrarToast('A nova senha deve ser diferente da atual', 'warning');
      return;
    }

    if (!this.usuarioId) {
      this.mostrarToast('Usuário não identificado', 'danger');
      return;
    }

    this.isLoading = true;

    try {
      console.log('🔍 ===== INICIANDO ALTERAÇÃO DE SENHA =====');
      console.log('🔍 ID do usuário:', this.usuarioId);
      
      const usuarioAtual = await this.usuarioService.buscarPorId(this.usuarioId).toPromise();
      
      if (!usuarioAtual) {
        this.mostrarToast('Usuário não encontrado', 'danger');
        this.isLoading = false;
        return;
      }

      console.log('🔍 ===== DEBUG SENHA =====');
      console.log('🔍 Senha digitada no campo:', this.senhaAtual);
      console.log('🔍 Senha do usuarioAtual:', usuarioAtual.senha);
      console.log('🔍 São iguais (===)?', usuarioAtual.senha === this.senhaAtual);

      if (!usuarioAtual.senha || usuarioAtual.senha !== this.senhaAtual) {
        console.log('❌ Senha incorreta!');
        this.mostrarToast('❌ Senha atual incorreta', 'danger');
        this.isLoading = false;
        return;
      }

      console.log('✅ Senha correta! Prosseguindo com a alteração...');

const dadosAtualizados = {
  nome: usuarioAtual.nome,
  email: usuarioAtual.email,
  senha: this.novaSenha,
  dataNascimento: usuarioAtual.dataNascimento,
  imagem: usuarioAtual.imagem || undefined,
  bio: usuarioAtual.bio || undefined,
  tema: usuarioAtual.tema || 1,
  idioma: usuarioAtual.idioma || 1,
  notificacoes: usuarioAtual.notificacoes !== undefined ? usuarioAtual.notificacoes : true,
  som: usuarioAtual.som !== undefined ? usuarioAtual.som : true
};

      console.log('📤 Enviando nova senha para API:', JSON.stringify(dadosAtualizados, null, 2));

      const resultado = await this.usuarioService.atualizar(this.usuarioId, dadosAtualizados).toPromise();
      
      if (resultado) {
        console.log('✅ Senha alterada com sucesso!');
        
        this.authService.setCurrentUser(resultado);
        this.mostrarToast('✅ Senha alterada com sucesso! 🔒', 'success');
        
        this.senhaAtual = '';
        this.novaSenha = '';
        this.confirmarSenha = '';
        this.isChangingPassword = false;
        this.carregarUsuario();
      }
    } catch (error: any) {
      console.error('❌ Erro ao alterar senha:', error);
      this.mostrarToast(error.error?.message || 'Erro ao alterar senha', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // ==================== UPLOAD DE IMAGEM ====================

  async uploadImagem() {
    const alert = await this.alertController.create({
      header: 'URL da imagem',
      message: 'Digite a URL da sua imagem de perfil',
      inputs: [
        {
          name: 'url',
          type: 'text',
          placeholder: 'https://exemplo.com/imagem.jpg',
          value: this.imagem || ''
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: (data) => {
            if (data.url && data.url.trim()) {
              this.imagem = data.url.trim();
              this.mostrarToast('✅ Imagem atualizada!', 'success');
              
              if (this.isEditing) {
                this.atualizarPerfil();
              }
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

  // ==================== HELPERS ====================

  voltar() {
    this.router.navigate(['/home']);
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
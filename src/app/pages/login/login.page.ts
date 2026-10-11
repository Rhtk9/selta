// src/app/pages/login/login.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Usuario } from '../../model/usuario.model';
import { AuthService } from '../../core/services/auth.service';

import { 
  IonContent, 
  IonLabel, 
  IonInput, 
  IonButton, 
  IonIcon, 
  IonSpinner 
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { 
  checkmarkCircleOutline, 
  leafOutline, 
  personOutline, 
  calendarOutline, 
  mailOutline, 
  lockClosedOutline, 
  eyeOutline, 
  eyeOffOutline, 
  arrowForwardOutline, 
  alertCircleOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, 
    IonLabel, 
    IonInput, 
    IonButton, 
    IonIcon, 
    IonSpinner
  ]
})
export class LoginPage {
  isRegisterMode = false;
  showPassword = false;
  loading = false;
  authError = '';
  emailTouched = false;
  senhaTouched = false;

  usuario: Usuario = this.inicializarUsuario();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      checkmarkCircleOutline,
      leafOutline,
      personOutline,
      calendarOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      arrowForwardOutline,
      alertCircleOutline
    });
  }

  inicializarUsuario(): Usuario {
    return {
      nome: '',
      email: '',
      senha: '',
      dataNascimento: '',
      tema: 1,
      idioma: 1,
      notificacoes: true,
      som: true
    };
  }

  setMode(mode: string) {
    this.isRegisterMode = mode === 'register';
    this.authError = '';
    this.usuario = this.inicializarUsuario();
    this.emailTouched = false;
    this.senhaTouched = false;
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.authError = '';
    this.usuario = this.inicializarUsuario();
    this.emailTouched = false;
    this.senhaTouched = false;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  onSubmit(event?: Event) {
    if (event) {
      event.preventDefault(); // Previne reload da página se estiver num <form>
    }

    console.log('🟢 onSubmit() chamado');
    console.log('📌 Modo atual:', this.isRegisterMode ? 'CADASTRO' : 'LOGIN');
    console.log('📄 Estado do objeto usuario:', JSON.stringify(this.usuario));

    this.authError = '';

    if (this.isRegisterMode) {
      this.executarCadastro();
    } else {
      this.executarLogin();
    }
  }

  private executarLogin() {
    console.log('🔵 executarLogin() iniciado');

    if (!this.usuario.email || !this.usuario.senha) {
      this.authError = 'Preencha email e senha.';
      console.warn('❌ Bloqueado: Campos obrigatórios vazios!', {
        email: this.usuario.email,
        senha: this.usuario.senha
      });
      return;
    }

    console.log('📤 Enviando login para:', this.usuario.email);
    this.loading = true;

    this.authService.login(this.usuario.email, this.usuario.senha).subscribe({
      next: (res) => {
        console.log('✅ Login efetuado com sucesso:', res);
        console.log('📦 Token salvo no localStorage:', localStorage.getItem('token'));
        this.loading = false;
        this.router.navigateByUrl('/home', { replaceUrl: true });
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Erro retornado pelo AuthService:', err);
        this.authError = err.message || 'Email ou senha inválidos.';
      }
    });
  }

  private executarCadastro() {
    console.log('🔵 executarCadastro() iniciado');

    if (!this.usuario.nome || !this.usuario.email || !this.usuario.senha || !this.usuario.dataNascimento) {
      this.authError = 'Preencha todos os campos obrigatórios.';
      console.warn('❌ Bloqueado: Campos de cadastro vazios!');
      return;
    }
    if (this.usuario.senha.length < 6) {
      this.authError = 'A senha deve ter no mínimo 6 caracteres.';
      return;
    }
    if (!this.isValidEmail(this.usuario.email)) {
      this.authError = 'Email inválido.';
      return;
    }

    this.loading = true;
    const emailCadastrado = this.usuario.email;
    const senhaCadastrada = this.usuario.senha;

    this.authService.cadastrar(this.usuario).subscribe({
      next: () => {
        console.log('✅ Cadastro realizado! Efetuando login automático...');
        this.authService.login(emailCadastrado, senhaCadastrada).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigateByUrl('/home', { replaceUrl: true });
          },
          error: () => {
            this.loading = false;
            this.setMode('login');
            this.authError = 'Conta criada com sucesso! Faça login para continuar.';
          }
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Erro no cadastro:', err);
        this.authError = err.message || 'Erro ao criar conta. Tente novamente.';
      }
    });
  }

  // Método de teste direto para descartar problemas de formulário/template
  testarLoginDireto() {
    console.log('🧪 Teste direto acionado!');
    this.authService.login('io@gmail.com', '123456').subscribe({
      next: (res) => console.log('🧪 Sucesso no teste direto:', res),
      error: (err) => console.error('🧪 Erro no teste direto:', err)
    });
  }

  onForgotPassword() {}
  onGoogleLogin() {}
}
// src/app/pages/menu/menu.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonList,
  IonMenuButton
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  homeOutline,
  leafOutline,
  flowerOutline,
  addCircleOutline,
  peopleOutline,
  bookOutline,
  clipboardOutline,
  libraryOutline,
  barChartOutline,
  notificationsOutline,
  shareSocialOutline,
  personOutline,
  schoolOutline,
  peopleCircleOutline,
  logOutOutline
} from 'ionicons/icons';

import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../model/usuario.model';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [
    IonList,
    IonIcon,
    IonLabel,
    IonItem,
    IonContent,
    IonMenuButton,
    RouterModule,
    CommonModule,
    FormsModule
  ]
})
export class MenuPage implements OnInit {
  usuario: Usuario | null = null;
  nomeUsuario: string = 'Usuário';
  emailUsuario: string = '';
  imagemUsuario: string = '';

  constructor(
    private navController: NavController,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      homeOutline,
      leafOutline,
      flowerOutline,
      addCircleOutline,
      peopleOutline,
      bookOutline,
      clipboardOutline,
      libraryOutline,
      barChartOutline,
      notificationsOutline,
      shareSocialOutline,
      personOutline,
      schoolOutline,
      peopleCircleOutline,
      logOutOutline
    });
  }

  ngOnInit() {
    this.carregarUsuario();
  }

  // Recarrega os dados quando a página do menu for exibida (essencial para atualizar imagem)
  ionViewWillEnter() {
    this.carregarUsuario();
  }

  carregarUsuario() {
    this.usuario = this.authService.currentUser;
    if (this.usuario) {
      this.nomeUsuario = this.usuario.nome || 'Usuário';
      this.emailUsuario = this.usuario.email || '';
      this.imagemUsuario = this.usuario.imagem || '';
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
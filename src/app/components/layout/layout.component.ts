// src/app/components/layout/layout.component.ts
import { Component } from '@angular/core';
import { ActionSheetController, IonicModule } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  appsOutline,
  flowerOutline,
  homeOutline,
  leafOutline,
  menuOutline,
  peopleCircleOutline,
  schoolOutline
} from 'ionicons/icons';
import { MenuPage } from '../../pages/menu/menu.page';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterLink, MenuPage]
})
export class LayoutComponent {
  constructor(
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {
    addIcons({
      appsOutline,
      flowerOutline,
      homeOutline,
      leafOutline,
      menuOutline,
      peopleCircleOutline,
      schoolOutline
    });
  }

  isTabSelected(route: string): boolean {
    return this.router.isActive(this.router.createUrlTree([route]), {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }

  isPainelSelected(): boolean {
    return ['/painel-aluno', '/painel-professor', '/painel-responsavel']
      .some(route => this.isTabSelected(route));
  }

  async abrirPaineis(): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Painéis',
      buttons: [
        {
          text: 'Painel Aluno',
          icon: 'apps-outline',
          handler: () => { void this.router.navigateByUrl('/painel-aluno'); }
        },
        {
          text: 'Painel Professor',
          icon: 'school-outline',
          handler: () => { void this.router.navigateByUrl('/painel-professor'); }
        },
        {
          text: 'Painel Responsável',
          icon: 'people-circle-outline',
          handler: () => { void this.router.navigateByUrl('/painel-responsavel'); }
        },
        { text: 'Cancelar', role: 'cancel' }
      ]
    });

    await actionSheet.present();
  }
}
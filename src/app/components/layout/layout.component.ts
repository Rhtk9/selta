// src/app/components/layout/layout.component.ts
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterOutlet } from '@angular/router';
import { MenuPage } from '../../pages/menu/menu.page';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterOutlet, MenuPage]
})
export class LayoutComponent {}
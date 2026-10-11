import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-compartilhar',
  templateUrl: './compartilhar.page.html',
  styleUrls: ['./compartilhar.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class CompartilharPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

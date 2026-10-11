// src/app/services/recompensa.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';

export interface Recompensa {
  id: number;
  nome: string;
  descricao?: string;
  tipo?: string;
  raridade: string;
  xpNecessario: number;
  imagem?: string;
}

@Injectable({ providedIn: 'root' })
export class RecompensaService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  listarTodas(): Observable<Recompensa[]> {
    return this.get<Recompensa[]>('recompensas');
  }
}
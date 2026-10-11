// src/app/services/avaliacao.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';

export interface Avaliacao {
  id?: number;
  nota: number;
  comentario: string;
  especieId: number;
  usuarioId: number;
  dataAvaliacao?: string;
  nomeUsuario?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AvaliacaoService extends ApiService {

  listarPorEspecie(especieId: number): Observable<Avaliacao[]> {
    return this.get<Avaliacao[]>(`avaliacoes/especie/${especieId}`);
  }

  criar(avaliacao: Avaliacao): Observable<Avaliacao> {
    return this.post<Avaliacao>('avaliacoes', avaliacao);
  }
}
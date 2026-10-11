// src/app/services/usuario-recompensa.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../core/services/api.service';

export interface UsuarioRecompensa {
  id: number;
  dataDesbloqueio?: string;
  equipada: boolean;
  recompensaId: number;
  recompensaNome?: string;
  recompensaRaridade?: string;
  usuarioId: number;
  usuarioNome?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioRecompensaService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  listarPorUsuario(usuarioId: number): Observable<UsuarioRecompensa[]> {
    return this.get<UsuarioRecompensa[]>(`usuarios-recompensas/usuario/${usuarioId}`);
  }

  listarEquipadasPorUsuario(usuarioId: number): Observable<UsuarioRecompensa[]> {
    return this.get<UsuarioRecompensa[]>(`usuarios-recompensas/usuario/${usuarioId}/equipadas`);
  }
}
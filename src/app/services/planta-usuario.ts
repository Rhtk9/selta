// src/app/services/planta-usuario.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { PlantaUsuario, PlantaUsuarioRequest } from '../model/planta-usuario.model';

@Injectable({ providedIn: 'root' })
export class PlantaUsuarioService extends ApiService {

  listarTodas(): Observable<PlantaUsuario[]> {
    return this.get<PlantaUsuario[]>('plantas-usuario');
  }

  listarPorUsuario(usuarioId: number): Observable<PlantaUsuario[]> {
    return this.get<PlantaUsuario[]>(`plantas-usuario/usuario/${usuarioId}`);
  }

  buscarPorId(id: number): Observable<PlantaUsuario> {
    return this.get<PlantaUsuario>(`plantas-usuario/${id}`);
  }

  // AJUSTADO: Agora aceita PlantaUsuarioRequest para a criação
  criar(planta: PlantaUsuarioRequest): Observable<PlantaUsuario> {
    return this.post<PlantaUsuario>('plantas-usuario', planta);
  }

  atualizar(id: number, planta: PlantaUsuario): Observable<PlantaUsuario> {
    return this.put<PlantaUsuario>('plantas-usuario', id, planta);
  }

  atualizarStatus(id: number, felicidade?: number, saude?: number): Observable<PlantaUsuario> {
    const params: any = {};
    if (felicidade !== undefined) params.felicidade = felicidade;
    if (saude !== undefined) params.saude = saude;
    return this.patch<PlantaUsuario>('plantas-usuario', id, params);
  }

  excluir(id: number): Observable<void> {
    return this.delete<void>('plantas-usuario', id);
  }
}
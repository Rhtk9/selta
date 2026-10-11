// src/app/services/fase.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { FasePlanta } from '../model/fase-planta.model';

@Injectable({
  providedIn: 'root'
})
export class FaseService extends ApiService {

  listarTodas(): Observable<FasePlanta[]> {
    // endpoint: GET /api/fases
    return this.get<FasePlanta[]>('fases');
  }

  listarPorEspecie(especieId: number): Observable<FasePlanta[]> {
    // endpoint: GET /api/fases/especie/{especieId}
    return this.get<FasePlanta[]>(`fases/especie/${especieId}`);
  }

  buscarPorId(id: number): Observable<FasePlanta> {
    // endpoint: GET /api/fases/{id}
    return this.get<FasePlanta>(`fases/${id}`);
  }

  criar(fase: FasePlanta): Observable<FasePlanta> {
    // endpoint: POST /api/fases
    return this.post<FasePlanta>('fases', fase);
  }

  atualizar(id: number, fase: FasePlanta): Observable<FasePlanta> {
    // endpoint: PUT /api/fases/{id}
    return this.put<FasePlanta>('fases', id, fase);
  }

  excluir(id: number): Observable<void> {
    // endpoint: DELETE /api/fases/{id}
    return this.delete<void>('fases', id);
  }
}
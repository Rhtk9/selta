// src/app/services/especie.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { Especie } from '../model/especie.model';

@Injectable({
  providedIn: 'root'
})
export class EspecieService extends ApiService {

  listar(): Observable<Especie[]> {
    return this.get<Especie[]>('especies');
  }

  listarPublicas(): Observable<Especie[]> {
    return this.get<Especie[]>('especies/publicas');
  }

  buscarPorId(id: number): Observable<Especie> {
    // endpoint: GET /api/especies/{id}
    return this.get<Especie>(`especies/${id}`);
  }

  buscarPorNomePopular(nome: string): Observable<Especie[]> {
    // endpoint: GET /api/especies/buscar/nome-popular?nome=...
    return this.get<Especie[]>(`especies/buscar/nome-popular?nome=${encodeURIComponent(nome)}`);
  }

  buscarPorNomeCientifico(nome: string): Observable<Especie[]> {
    // endpoint: GET /api/especies/buscar/nome-cientifico?nome=...
    return this.get<Especie[]>(`especies/buscar/nome-cientifico?nome=${encodeURIComponent(nome)}`);
  }

  criar(especie: Especie): Observable<Especie> {
    // endpoint: POST /api/especies
    return this.post<Especie>('especies', especie);
  }

  atualizar(id: number, especie: Especie): Observable<Especie> {
    // endpoint: PUT /api/especies/{id}
    return this.put<Especie>('especies', id, especie);
  }

  excluir(id: number): Observable<void> {
    // endpoint: DELETE /api/especies/{id}
    return this.delete<void>('especies', id);
  }
}
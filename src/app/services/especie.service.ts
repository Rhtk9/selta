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
    return this.get<Especie>(`especies/${id}`);
  }

  buscarPorNomePopular(nome: string): Observable<Especie[]> {
    return this.get<Especie[]>(`especies/buscar/nome-popular?nome=${encodeURIComponent(nome)}`);
  }

  buscarPorNomeCientifico(nome: string): Observable<Especie[]> {
    return this.get<Especie[]>(`especies/buscar/nome-cientifico?nome=${encodeURIComponent(nome)}`);
  }

  criar(especie: FormData | Especie): Observable<Especie> {
    // O ApiService já detecta se é FormData e remove o Content-Type JSON sozinho
    return this.post<Especie>('especies', especie);
  }

  atualizar(id: number, especie: FormData | Especie): Observable<Especie> {
    return this.put<Especie>('especies', id, especie);
  }

  excluir(id: number): Observable<void> {
    return this.delete<void>('especies', id);
  }
}
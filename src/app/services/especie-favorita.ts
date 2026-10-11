// src/app/services/especie-favorita.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EspecieFavorita {
  id?: number;
  usuarioId: number;
  especieId: number;
}

@Injectable({
  providedIn: 'root'
})
export class EspecieFavoritaService {
  private apiUrl = `${environment.apiUrl}/favoritos`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<EspecieFavorita[]> {
    return this.http.get<EspecieFavorita[]>(this.apiUrl);
  }

  listarPorUsuario(usuarioId: number): Observable<EspecieFavorita[]> {
    return this.http.get<EspecieFavorita[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  favoritar(usuarioId: number, especieId: number): Observable<EspecieFavorita> {
    return this.http.post<EspecieFavorita>(this.apiUrl, { usuarioId, especieId });
  }

  desfavoritar(usuarioId: number, especieId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/usuario/${usuarioId}/especie/${especieId}`);
  }
}
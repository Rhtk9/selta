// src/app/services/usuario-turma.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { UsuarioTurma } from '../model/usuario-turma.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioTurmaService {

  constructor(private api: ApiService) {}

  listarPorUsuario(usuarioId: number): Observable<UsuarioTurma[]> {
    return this.api.get<UsuarioTurma[]>(`usuarios-turmas/usuario/${usuarioId}`);
  }

  listarPorTurma(turmaId: number): Observable<UsuarioTurma[]> {
    return this.api.get<UsuarioTurma[]>(`usuarios-turmas/turma/${turmaId}`);
  }

  criar(vinculo: UsuarioTurma): Observable<UsuarioTurma> {
    return this.api.post<UsuarioTurma>('usuarios-turmas', vinculo);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>('usuarios-turmas', id);
  }

  favoritarDesfavoritar(id: number, favorito: boolean): Observable<UsuarioTurma> {
    return this.api.patch<UsuarioTurma>('usuarios-turmas', id, { favorito });
  }
}
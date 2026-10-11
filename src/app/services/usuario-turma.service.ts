// src/app/services/usuario-turma.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { UsuarioTurma } from '../model/usuario-turma.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioTurmaService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  listarTodos(): Observable<UsuarioTurma[]> {
    return this.get<UsuarioTurma[]>('usuarios-turmas');
  }

  listarPorUsuario(usuarioId: number): Observable<UsuarioTurma[]> {
    return this.get<UsuarioTurma[]>(`usuarios-turmas/usuario/${usuarioId}`);
  }

  listarPorTurma(turmaId: number): Observable<UsuarioTurma[]> {
    return this.get<UsuarioTurma[]>(`usuarios-turmas/turma/${turmaId}`);
  }

  listarAtivos(): Observable<UsuarioTurma[]> {
    return this.get<UsuarioTurma[]>('usuarios-turmas/ativos');
  }

  listarFavoritos(): Observable<UsuarioTurma[]> {
    return this.get<UsuarioTurma[]>('usuarios-turmas/favoritos');
  }

  buscarPorId(id: number): Observable<UsuarioTurma> {
    return this.get<UsuarioTurma>(`usuarios-turmas/${id}`);
  }

  criar(vinculo: UsuarioTurma): Observable<UsuarioTurma> {
    return this.post<UsuarioTurma>('usuarios-turmas', vinculo);
  }

  atualizar(id: number, vinculo: UsuarioTurma): Observable<UsuarioTurma> {
    return this.put<UsuarioTurma>('usuarios-turmas', id, vinculo);
  }

  excluir(id: number): Observable<void> {
    return this.delete<void>('usuarios-turmas', id);
  }

  // ============ ATIVAR / DESATIVAR ============
  ativar(id: number): Observable<UsuarioTurma> {
    return this.http.patch<UsuarioTurma>(
      `${this.baseUrl}/usuarios-turmas/${id}/ativar`,
      {}
    );
  }

  desativar(id: number): Observable<UsuarioTurma> {
    return this.http.patch<UsuarioTurma>(
      `${this.baseUrl}/usuarios-turmas/${id}/desativar`,
      {}
    );
  }

  // ============ FAVORITAR / DESFAVORITAR ============
  favoritar(id: number): Observable<UsuarioTurma> {
    return this.http.patch<UsuarioTurma>(
      `${this.baseUrl}/usuarios-turmas/${id}/favoritar`,
      {}
    );
  }

  desfavoritar(id: number): Observable<UsuarioTurma> {
    return this.http.patch<UsuarioTurma>(
      `${this.baseUrl}/usuarios-turmas/${id}/desfavoritar`,
      {}
    );
  }
}
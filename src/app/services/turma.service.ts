// src/app/services/turma.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { Turma } from '../model/turma.model';

@Injectable({
  providedIn: 'root'
})
export class TurmaService {

  constructor(private api: ApiService) {} 

  listarTodas(): Observable<Turma[]> {
    return this.api.get<Turma[]>('turmas');
  }

  listarPorDisciplina(disciplinaId: number): Observable<Turma[]> {
    return this.api.get<Turma[]>(`turmas/disciplina/${disciplinaId}`);
  }

  listarPorUsuario(usuarioId: number): Observable<Turma[]> {
    return this.api.get<Turma[]>(`turmas/usuario/${usuarioId}`);
  }

  buscarPorId(id: number): Observable<Turma> {
    return this.api.getById<Turma>('turmas', id);
  }

  criar(turma: Turma): Observable<Turma> {
    return this.api.post<Turma>('turmas', turma);
  }

  atualizar(id: number, turma: Turma): Observable<Turma> {
    return this.api.put<Turma>('turmas', id, turma);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>('turmas', id);
  }
}
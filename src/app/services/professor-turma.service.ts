// src/app/services/professor-turma.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { ProfessorTurma } from '../model/professor-turma.model';

@Injectable({
  providedIn: 'root'
})
export class ProfessorTurmaService {

  constructor(private api: ApiService) {}

  listarTodos(): Observable<ProfessorTurma[]> {
    return this.api.get<ProfessorTurma[]>('professores-turmas');
  }

  listarPorUsuario(usuarioId: number): Observable<ProfessorTurma[]> {
    return this.api.get<ProfessorTurma[]>(`professores-turmas/usuario/${usuarioId}`);
  }

  listarPorTurma(turmaId: number): Observable<ProfessorTurma[]> {
    return this.api.get<ProfessorTurma[]>(`professores-turmas/turma/${turmaId}`);
  }

  buscarPorId(id: number): Observable<ProfessorTurma> {
    return this.api.getById<ProfessorTurma>('professores-turmas', id);
  }

  criar(vinculo: ProfessorTurma): Observable<ProfessorTurma> {
    return this.api.post<ProfessorTurma>('professores-turmas', vinculo);
  }

  atualizar(id: number, vinculo: ProfessorTurma): Observable<ProfessorTurma> {
    return this.api.put<ProfessorTurma>('professores-turmas', id, vinculo);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>('professores-turmas', id);
  }

  atualizarPermissoes(
    id: number,
    permissoes: { excluir?: boolean; edicao?: boolean; gerenciarTarefas?: boolean }
  ): Observable<ProfessorTurma> {
    return this.api.patch<ProfessorTurma>('professores-turmas', id, permissoes);
  }

  async isProfessor(usuarioId: number, turmaId: number): Promise<boolean> {
    try {
      const professores = await this.listarPorTurma(turmaId).toPromise() || [];
      return professores.some(p => p.usuarioId === usuarioId);
    } catch (error) {
      console.error('Erro ao verificar se é professor:', error);
      return false;
    }
  }
}
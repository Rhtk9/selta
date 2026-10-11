import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { Responsavel } from '../model/responsavel.model';

@Injectable({ providedIn: 'root' })
export class ResponsavelService extends ApiService {

  listarTodos(): Observable<Responsavel[]> {
    return this.get<Responsavel[]>('responsaveis');
  }

  listarPorUsuario(usuarioId: number): Observable<Responsavel[]> {
    return this.get<Responsavel[]>(`responsaveis/usuario/${usuarioId}`);
  }

  // NOVO: lista os alunos vinculados a um responsável
  listarPorResponsavel(responsavelId: number): Observable<Responsavel[]> {
    return this.get<Responsavel[]>(`responsaveis/responsavel/${responsavelId}`);
  }

  buscarPorId(id: number): Observable<Responsavel> {
    return this.get<Responsavel>(`responsaveis/${id}`);
  }

  criar(responsavel: Responsavel): Observable<Responsavel> {
    return this.post<Responsavel>('responsaveis', responsavel);
  }

  atualizarNotificacoes(id: number, notificacoes: boolean): Observable<Responsavel> {
    return this.patch<Responsavel>('responsaveis', id, { notificacoes });
  }

  // NOVO: desvincular usando responsável + aluno (mais seguro que id solto)
  excluirVinculo(responsavelId: number, alunoId: number): Observable<void> {
    return this.delete<void>(`responsaveis/responsavel/${responsavelId}/aluno`, alunoId);
  }
}
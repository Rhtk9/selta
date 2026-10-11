// src/app/services/usuario-tarefa.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { UsuarioTarefa } from '../model/usuario-tarefa.model';

@Injectable({ providedIn: 'root' })
export class UsuarioTarefaService extends ApiService {

  listarPorUsuario(usuarioId: number): Observable<UsuarioTarefa[]> {
    return this.get<UsuarioTarefa[]>(`usuarios-tarefas/usuario/${usuarioId}`);
  }

  listarPorAtividade(atividadeId: number): Observable<UsuarioTarefa[]> {
    return this.get<UsuarioTarefa[]>(`usuarios-tarefas/atividade/${atividadeId}`);
  }

  buscarPorId(id: number): Observable<UsuarioTarefa> {
    return this.get<UsuarioTarefa>(`usuarios-tarefas/${id}`);
  }

  criar(tarefa: UsuarioTarefa): Observable<UsuarioTarefa> {
    return this.post<UsuarioTarefa>('usuarios-tarefas', tarefa);
  }

  atualizar(id: number, tarefa: UsuarioTarefa): Observable<UsuarioTarefa> {
    return this.put<UsuarioTarefa>('usuarios-tarefas', id, tarefa);
  }

  excluir(id: number): Observable<void> {
    return this.delete<void>('usuarios-tarefas', id);
  }

  concluir(id: number, nota: number, feedback?: string): Observable<UsuarioTarefa> {
    const params: string[] = [`nota=${nota}`];
    if (feedback) params.push(`feedback=${encodeURIComponent(feedback)}`);
    return this.http.patch<UsuarioTarefa>(
      `${this.baseUrl}/usuarios-tarefas/${id}/concluir?${params.join('&')}`,
      {}
    );
  }
}
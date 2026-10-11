// src/app/services/atividade.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { Atividade } from '../model/atividade.model';

@Injectable({
  providedIn: 'root'
})
export class AtividadeService {

  constructor(private api: ApiService) {}

  listarTodas(): Observable<Atividade[]> {
    return this.api.get<Atividade[]>('atividades');
  }

  listarPorTurma(turmaId: number): Observable<Atividade[]> {
    return this.api.get<Atividade[]>(`atividades/turma/${turmaId}`);
  }

  listarFuturasPorTurma(turmaId: number): Observable<Atividade[]> {
    return this.api.get<Atividade[]>(`atividades/turma/${turmaId}/futuras`);
  }

  listarPassadasPorTurma(turmaId: number): Observable<Atividade[]> {
    return this.api.get<Atividade[]>(`atividades/turma/${turmaId}/passadas`);
  }

  listarPorUsuario(usuarioId: number): Observable<Atividade[]> {
    return this.api.get<Atividade[]>(`atividades/usuario/${usuarioId}`);
  }

  buscarPorId(id: number): Observable<Atividade> {
    return this.api.getById<Atividade>('atividades', id);
  }

  /**
   * Cria atividade. Se receber `file`, envia multipart/form-data.
   * Senão, envia JSON puro (compatibilidade).
   */
  criar(atividade: Atividade, file?: File): Observable<Atividade> {
    if (file) {
      const formData = new FormData();
      formData.append(
        'dto',
        new Blob([JSON.stringify(atividade)], { type: 'application/json' })
      );
      formData.append('file', file, file.name);
      return this.api.post<Atividade>('atividades', formData);
    }
    return this.api.post<Atividade>('atividades', atividade);
  }

  atualizar(id: number, atividade: Atividade): Observable<Atividade> {
    return this.api.put<Atividade>('atividades', id, atividade);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>('atividades', id);
  }

  atualizarStatus(id: number, status: string): Observable<Atividade> {
    return this.api.patch<Atividade>(`atividades`, id, { status });
  }
}
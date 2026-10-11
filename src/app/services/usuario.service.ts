// src/app/services/usuario.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { Usuario } from '../model/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  listar(): Observable<Usuario[]> {
    return this.get<Usuario[]>('usuarios');
  }

  buscarPorId(id: number): Observable<Usuario> {
    return this.get<Usuario>(`usuarios/${id}`);
  }

  buscarPorEmail(email: string): Observable<Usuario> {
    return this.get<Usuario>(`usuarios/email/${email}`);
  }

  criar(usuario: Usuario): Observable<Usuario> {
    return this.post<Usuario>('usuarios', usuario);
  }

  atualizar(id: number, usuario: Usuario): Observable<Usuario> {
    return this.put<Usuario>('usuarios', id, usuario);
  }

  /**
   * 👇 NOVO: Upload da foto de perfil.
   */
  atualizarFoto(id: number, file: File): Observable<Usuario> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    // ApiService detecta FormData e não seta Content-Type
    return this.http.patch<Usuario>(
      `${this.baseUrl}/usuarios/${id}/foto`,
      formData
    );
  }

  excluir(id: number): Observable<void> {
    return this.delete<void>('usuarios', id);
  }
}
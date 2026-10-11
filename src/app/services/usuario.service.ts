// src/app/services/usuario.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { Usuario } from '../model/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService extends ApiService {

  listar(): Observable<Usuario[]> {
    return this.get<Usuario[]>('usuarios');
  }

  buscarPorId(id: number): Observable<Usuario> {
    return this.get<Usuario>(`usuarios/${id}`);
  }

  criar(usuario: Usuario): Observable<Usuario> {
    return this.post<Usuario>('usuarios', usuario);
  }

  atualizar(id: number, usuario: Usuario): Observable<Usuario> {
    return this.put<Usuario>('usuarios', id, usuario);
  }

  excluir(id: number): Observable<void> {
    return this.delete<void>('usuarios', id);
  }
}
// src/app/services/registro.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { Registro } from '../model/registro.model';

@Injectable({
  providedIn: 'root'
})
export class RegistroService extends ApiService {

  listarTodos(): Observable<Registro[]> {
    return this.get<Registro[]>('registros');
  }

  listarPorPlanta(plantaUsuarioId: number): Observable<Registro[]> {
    return this.get<Registro[]>(`registros/planta/${plantaUsuarioId}`);
  }

  // Método que aceita qualquer objeto (payload parcial)
  criar(registro: any): Observable<any> {
    return this.post<any>('registros', registro);
  }

  atualizar(id: number, registro: Registro): Observable<Registro> {
    return this.put<Registro>('registros', id, registro);
  }

  excluir(id: number): Observable<void> {
    return this.delete<void>('registros', id);
  }
}
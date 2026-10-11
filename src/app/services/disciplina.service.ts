// src/app/services/disciplina.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { Disciplina, DisciplinaRequest } from '../model/disciplina.model';

@Injectable({
    providedIn: 'root'
})
export class DisciplinaService {

    constructor(private api: ApiService) {}

    /**
     * Lista todas as disciplinas
     */
    listarTodas(): Observable<Disciplina[]> {
        return this.api.get<Disciplina[]>('disciplinas');
    }

    /**
     * Lista apenas disciplinas ativas
     */
    listarAtivas(): Observable<Disciplina[]> {
        return this.api.get<Disciplina[]>('disciplinas/ativas');
    }

    /**
     * Busca disciplina por ID
     */
    buscarPorId(id: number): Observable<Disciplina> {
        return this.api.getById<Disciplina>('disciplinas', id);
    }

    /**
     * Cria uma nova disciplina
     */
    criar(disciplina: DisciplinaRequest): Observable<Disciplina> {
        return this.api.post<Disciplina>('disciplinas', disciplina);
    }

    /**
     * Atualiza uma disciplina existente
     */
    atualizar(id: number, disciplina: DisciplinaRequest): Observable<Disciplina> {
        return this.api.put<Disciplina>('disciplinas', id, disciplina);
    }

    /**
     * Exclui uma disciplina
     */
    excluir(id: number): Observable<void> {
        return this.api.delete<void>('disciplinas', id);
    }

    /**
     * Ativa/Desativa uma disciplina
     */
    ativarDesativar(id: number, ativa: boolean): Observable<Disciplina> {
        const endpoint = ativa ? 'ativar' : 'desativar';
        return this.api.patch<Disciplina>('disciplinas', id, { ativa });
    }
}
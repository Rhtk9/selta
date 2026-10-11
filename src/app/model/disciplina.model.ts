// src/app/model/disciplina.model.ts

export interface Disciplina {
    id: number;
    nome: string;
    descricao: string;
    icone?: string;
    corTema: number;
    horario?: string;
    ativa: boolean;
    quantidadeTurmas?: number;
}

export class DisciplinaRequest {
    nome: string;
    descricao: string;
    icone?: string;
    corTema: number;
    horario?: string;
    ativa: boolean;

    constructor(
        nome: string = '',
        descricao: string = '',
        corTema: number = 1,
        ativa: boolean = true,
        icone?: string,
        horario?: string
    ) {
        this.nome = nome;
        this.descricao = descricao;
        this.corTema = corTema;
        this.ativa = ativa;
        this.icone = icone;
        this.horario = horario;
    }
}
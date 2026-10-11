// src/app/model/atividade.model.ts
export class Atividade {
  id: number;
  titulo: string;
  descricao: string;
  pontuacao: number;
  xp: number;
  dataCriacao: string;
  dataEntrega: string;
  tentativas: number;
  status: string;
  dificuldade: number;
  turmaId: number;
  turmaNome?: string;
  totalAlunos?: number;
  alunosConcluidos?: number;

  constructor(
    id: number = 0,
    titulo: string = '',
    descricao: string = '',
    pontuacao: number = 0,
    xp: number = 0,
    dataCriacao: string = '',
    dataEntrega: string = '',
    tentativas: number = 0,
    status: string = 'PENDENTE',
    dificuldade: number = 1,
    turmaId: number = 0,
    turmaNome?: string,
    totalAlunos: number = 0,
    alunosConcluidos: number = 0
  ) {
    this.id = id;
    this.titulo = titulo;
    this.descricao = descricao;
    this.pontuacao = pontuacao;
    this.xp = xp;
    this.dataCriacao = dataCriacao;
    this.dataEntrega = dataEntrega;
    this.tentativas = tentativas;
    this.status = status;
    this.dificuldade = dificuldade;
    this.turmaId = turmaId;
    this.turmaNome = turmaNome;
    this.totalAlunos = totalAlunos;
    this.alunosConcluidos = alunosConcluidos;
  }
}
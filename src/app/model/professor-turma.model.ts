// src/app/model/professor-turma.model.ts
export class ProfessorTurma {
  id: number;
  dataVinculo: string;
  excluir: boolean;
  edicao: boolean;
  gerenciarTarefas: boolean;
  usuarioId: number;
  usuarioNome?: string;
  turmaId: number;
  turmaNome?: string;
  turmaCodigo?: string;      // NOVO
  disciplinaNome?: string;   // NOVO

  constructor(
    id: number = 0,
    dataVinculo: string = '',
    excluir: boolean = false,
    edicao: boolean = false,
    gerenciarTarefas: boolean = false,
    usuarioId: number = 0,
    usuarioNome: string = '',
    turmaId: number = 0,
    turmaNome: string = '',
    turmaCodigo: string = '',
    disciplinaNome: string = ''
  ) {
    this.id = id;
    this.dataVinculo = dataVinculo;
    this.excluir = excluir;
    this.edicao = edicao;
    this.gerenciarTarefas = gerenciarTarefas;
    this.usuarioId = usuarioId;
    this.usuarioNome = usuarioNome;
    this.turmaId = turmaId;
    this.turmaNome = turmaNome;
    this.turmaCodigo = turmaCodigo;
    this.disciplinaNome = disciplinaNome;
  }
}
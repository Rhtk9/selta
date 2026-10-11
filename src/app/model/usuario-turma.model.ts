// src/app/model/usuario-turma.model.ts
export class UsuarioTurma {
  id: number;
  dataEntrada: string;
  ativo: boolean;
  favorito: boolean;
  usuarioId: number;
  usuarioNome?: string;
  usuarioEmail?: string;
  turmaId: number;
  turmaNome: string;
  turmaCodigo: string;
  disciplinaNome: string;

  constructor(
    id: number = 0,
    dataEntrada: string = '',
    ativo: boolean = true,
    favorito: boolean = false,
    usuarioId: number = 0,
    usuarioNome: string = '',
    usuarioEmail: string = '',
    turmaId: number = 0,
    turmaNome: string = '',
    turmaCodigo: string = '',
    disciplinaNome: string = ''
  ) {
    this.id = id;
    this.dataEntrada = dataEntrada;
    this.ativo = ativo;
    this.favorito = favorito;
    this.usuarioId = usuarioId;
    this.usuarioNome = usuarioNome;
    this.usuarioEmail = usuarioEmail;
    this.turmaId = turmaId;
    this.turmaNome = turmaNome;
    this.turmaCodigo = turmaCodigo;
    this.disciplinaNome = disciplinaNome;
  }
}
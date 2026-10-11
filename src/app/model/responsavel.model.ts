export class Responsavel {
  id?: number;
  parentesco: string;
  dataVinculo?: string;
  notificacoes: boolean;
  usuarioId: number;      // ALUNO
  responsavelId: number;  // RESPONSÁVEL (novo)

  constructor(
    id?: number,
    parentesco: string = 'Responsável',
    notificacoes: boolean = true,
    usuarioId: number = 0,
    responsavelId: number = 0,
    dataVinculo?: string
  ) {
    this.id = id;
    this.parentesco = parentesco;
    this.notificacoes = notificacoes;
    this.usuarioId = usuarioId;
    this.responsavelId = responsavelId;
    this.dataVinculo = dataVinculo;
  }
}
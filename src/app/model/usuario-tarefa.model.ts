// src/app/model/usuario-tarefa.model.ts
export class UsuarioTarefa {
  id: number;
  nota: number;
  dataConclusao?: string;
  concluida: boolean;
  feedback?: string;
  tempoGasto: number;
  tentativas: number;
  xpRecebido: number;
  atividadeId: number;
  atividadeTitulo?: string;
  usuarioId: number;
  usuarioNome?: string;

  constructor(
    id: number = 0,
    nota: number = 0,
    dataConclusao: string = '',
    concluida: boolean = false,
    feedback: string = '',
    tempoGasto: number = 0,
    tentativas: number = 0,
    xpRecebido: number = 0,
    atividadeId: number = 0,
    atividadeTitulo: string = '',
    usuarioId: number = 0,
    usuarioNome: string = ''
  ) {
    this.id = id;
    this.nota = nota;
    this.dataConclusao = dataConclusao;
    this.concluida = concluida;
    this.feedback = feedback;
    this.tempoGasto = tempoGasto;
    this.tentativas = tentativas;
    this.xpRecebido = xpRecebido;
    this.atividadeId = atividadeId;
    this.atividadeTitulo = atividadeTitulo;
    this.usuarioId = usuarioId;
    this.usuarioNome = usuarioNome;
  }
}
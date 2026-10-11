// src/app/model/notificacao.model.ts
export type TipoNotificacao = 'planta' | 'conquista' | 'aula' | 'alerta' | 'xp';

export class Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  urgente: boolean;
  lida: boolean;
  dataCriacao: Date;

  constructor(
    id: string = '',
    tipo: TipoNotificacao = 'alerta',
    titulo: string = '',
    descricao: string = '',
    urgente: boolean = false,
    lida: boolean = false,
    dataCriacao: Date = new Date()
  ) {
    this.id = id;
    this.tipo = tipo;
    this.titulo = titulo;
    this.descricao = descricao;
    this.urgente = urgente;
    this.lida = lida;
    this.dataCriacao = dataCriacao;
  }
}
// escolha de notificacoes
export class ConfiguracoesAlerta {
  alertasPlanta: boolean = true;
  novasAulas: boolean = true;
  prazosAtividades: boolean = true;
  evolucaoPlanta: boolean = false;

  constructor(init?: Partial<ConfiguracoesAlerta>) {
    Object.assign(this, init);
  }
}
// src/app/model/especie.model.ts
export class Especie {
  id?: number;
  nomePopular: string;
  nomeCientifico: string;
  classificacao: string;
  descricao: string;
  dificuldadeCultivo: string;
  ambiente: string;
  temperatura: number;
  umidade: number;
  luminosidade: number;
  imagem: string;
  raridade: string;
  publica: boolean;
  dataCriacao?: string;
  usuarioId: number;
  nomeUsuario?: string;

  constructor(
    id?: number,
    nomePopular: string = '',
    nomeCientifico: string = '',
    classificacao: string = '',
    descricao: string = '',
    dificuldadeCultivo: string = '',
    ambiente: string = '',
    temperatura: number = 0,
    umidade: number = 0,
    luminosidade: number = 0,
    imagem: string = '',
    raridade: string = '',
    publica: boolean = false,
    dataCriacao?: string,
    usuarioId: number = 0,
    nomeUsuario?: string
  ) {
    this.id = id;
    this.nomePopular = nomePopular;
    this.nomeCientifico = nomeCientifico;
    this.classificacao = classificacao;
    this.descricao = descricao;
    this.dificuldadeCultivo = dificuldadeCultivo;
    this.ambiente = ambiente;
    this.temperatura = temperatura;
    this.umidade = umidade;
    this.luminosidade = luminosidade;
    this.imagem = imagem;
    this.raridade = raridade;
    this.publica = publica;
    this.dataCriacao = dataCriacao;
    this.usuarioId = usuarioId;
    this.nomeUsuario = nomeUsuario;
  }
}
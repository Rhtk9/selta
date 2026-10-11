// src/app/model/fase-planta.model.ts

export class EvolucaoFase {
  id?: number;
  diasRuim: number;
  diasMedios: number;
  diasBons: number;
  bonus: number;
  penalidade: number;

  constructor(
    id?: number,
    diasRuim: number = 0,
    diasMedios: number = 0,
    diasBons: number = 0,
    bonus: number = 0,
    penalidade: number = 0
  ) {
    this.id = id;
    this.diasRuim = diasRuim;
    this.diasMedios = diasMedios;
    this.diasBons = diasBons;
    this.bonus = bonus;
    this.penalidade = penalidade;
  }
}

export class NecessidadeFase {
  id?: number;
  aguaMedia: number;
  luzMedia: number;
  temperaturaMedia: number;
  umidadeMedia: number;

  constructor(
    id?: number,
    aguaMedia: number = 0,
    luzMedia: number = 0,
    temperaturaMedia: number = 0,
    umidadeMedia: number = 0
  ) {
    this.id = id;
    this.aguaMedia = aguaMedia;
    this.luzMedia = luzMedia;
    this.temperaturaMedia = temperaturaMedia;
    this.umidadeMedia = umidadeMedia;
  }
}

export class FasePlanta {
  id?: number;
  nome: string;
  ordem: number;
  diasBase: number;
  xpNecessario: number;
  xpGanho: number;
  imagem: string;
  especieId: number;
  evolucaoFase: EvolucaoFase;
  necessidadeFase: NecessidadeFase;

  constructor(
    id?: number,
    nome: string = '',
    ordem: number = 0,
    diasBase: number = 0,
    xpNecessario: number = 0,
    xpGanho: number = 0,
    imagem: string = '',
    especieId: number = 0,
    evolucaoFase: EvolucaoFase = new EvolucaoFase(),
    necessidadeFase: NecessidadeFase = new NecessidadeFase()
  ) {
    this.id = id;
    this.nome = nome;
    this.ordem = ordem;
    this.diasBase = diasBase;
    this.xpNecessario = xpNecessario;
    this.xpGanho = xpGanho;
    this.imagem = imagem;
    this.especieId = especieId;
    this.evolucaoFase = evolucaoFase;
    this.necessidadeFase = necessidadeFase;
  }
}
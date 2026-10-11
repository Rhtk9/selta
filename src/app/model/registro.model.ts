// src/app/model/registro.model.ts
export class Registro {
  id: number;
  dataRegistro: string;
  aguaPlanta: number;
  luz: number;
  nutrientes: number;
  qualidadeCuidado: number;
  xpRecebido: number;
  observacao?: string;
  plantaUsuarioId: number;
  plantaApelido?: string;

  constructor(
    id: number = 0,
    dataRegistro: string = '',
    aguaPlanta: number = 0,
    luz: number = 0,
    nutrientes: number = 0,
    qualidadeCuidado: number = 0,
    xpRecebido: number = 0,
    observacao?: string,
    plantaUsuarioId: number = 0,
    plantaApelido?: string
  ) {
    this.id = id;
    this.dataRegistro = dataRegistro;
    this.aguaPlanta = aguaPlanta;
    this.luz = luz;
    this.nutrientes = nutrientes;
    this.qualidadeCuidado = qualidadeCuidado;
    this.xpRecebido = xpRecebido;
    this.observacao = observacao;
    this.plantaUsuarioId = plantaUsuarioId;
    this.plantaApelido = plantaApelido;
  }
}
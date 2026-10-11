// src/app/model/planta-usuario.model.ts

// Interface DTO para a criação de novas plantas (Request)
export interface PlantaUsuarioRequest {
  apelido: string;
  usuarioId: number;
  especieId: number;
  faseId: number;
}

// Classe de representação da planta do usuário (Response / Entidade do Frontend)
export class PlantaUsuario {
  id: number;
  apelido: string;
  xpAtual: number;
  nivel: number;
  felicidade: number;
  saude: number;
  faseId: number;
  faseNome?: string;
  dataCriacao: string;
  ultimaAlteracao: string;
  usuarioId: number;
  usuarioNome?: string;
  especieId: number;
  especieNomePopular?: string;
  imagem?: string;

  constructor(
    id: number = 0,
    apelido: string = '',
    xpAtual: number = 0,
    nivel: number = 1,
    felicidade: number = 100, // Começa com 100% por padrão
    saude: number = 100,      // Começa com 100% por padrão
    faseId: number = 0,
    faseNome?: string,
    dataCriacao: string = '',
    ultimaAlteracao: string = '',
    usuarioId: number = 0,
    usuarioNome?: string,
    especieId: number = 0,
    especieNomePopular?: string,
    imagem?: string
  ) {
    this.id = id;
    this.apelido = apelido;
    this.xpAtual = xpAtual;
    this.nivel = nivel;
    this.felicidade = felicidade;
    this.saude = saude;
    this.faseId = faseId;
    this.faseNome = faseNome;
    this.dataCriacao = dataCriacao;
    this.ultimaAlteracao = ultimaAlteracao;
    this.usuarioId = usuarioId;
    this.usuarioNome = usuarioNome;
    this.especieId = especieId;
    this.especieNomePopular = especieNomePopular;
    this.imagem = imagem;
  }
}
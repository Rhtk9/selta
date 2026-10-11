// src/app/model/usuario.model.ts
export class Usuario {
  id?: number;
  nome: string;
  email: string;
  senha: string;
  imagem?: string;
  bio?: string;
  dataNascimento?: string;
  tema?: number;
  idioma?: number;
  notificacoes?: boolean;
  som?: boolean;
  sequenciaDias?: number;
  pontuacaoTotal?: number;
  nivelUsuario?: number;
  xpTotal?: number;
  ativo?: boolean;
  dataCadastro?: string;
  ultimoLogin?: string;

  constructor(
    id?: number,
    nome: string = '',
    email: string = '',
    senha: string = '',
    imagem: string = '',
    bio: string = '',
    dataNascimento: string = '',
    tema: number = 1,
    idioma: number = 1,
    notificacoes: boolean = true,
    som: boolean = true,
    sequenciaDias: number = 0,
    pontuacaoTotal: number = 0,
    nivelUsuario: number = 1,
    xpTotal: number = 0,
    ativo: boolean = true,
    dataCadastro?: string,
    ultimoLogin?: string
  ) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.senha = senha;
    this.imagem = imagem;
    this.bio = bio;
    this.dataNascimento = dataNascimento;
    this.tema = tema;
    this.idioma = idioma;
    this.notificacoes = notificacoes;
    this.som = som;
    this.sequenciaDias = sequenciaDias;
    this.pontuacaoTotal = pontuacaoTotal;
    this.nivelUsuario = nivelUsuario;
    this.xpTotal = xpTotal;
    this.ativo = ativo;
    this.dataCadastro = dataCadastro;
    this.ultimoLogin = ultimoLogin;
  }
}
// src/app/model/turma.model.ts

export class Turma {
  id: number;
  nome: string;
  codigo: string;
  descricao: string;
  imagem?: string;
  ano: number;
  nivelEnsino: string;
  dataCriacao: string;
  disciplinaId: number;
  disciplinaNome: string;
  quantidadeAlunos?: number;
  quantidadeProfessores?: number;
  quantidadeAtividades?: number;
  usuarioId?: number;

  constructor(
    id: number = 0,
    nome: string = '',
    codigo: string = '',
    descricao: string = '',
    imagem: string = '',
    ano: number = new Date().getFullYear(),
    nivelEnsino: string = '',
    dataCriacao: string = '',
    disciplinaId: number = 0,
    disciplinaNome: string = '',
    quantidadeAlunos: number = 0,
    quantidadeProfessores: number = 0,
    quantidadeAtividades: number = 0,
    usuarioId?: number
  ) {
    this.id = id;
    this.nome = nome;
    this.codigo = codigo;
    this.descricao = descricao;
    this.imagem = imagem;
    this.ano = ano;
    this.nivelEnsino = nivelEnsino;
    this.dataCriacao = dataCriacao;
    this.disciplinaId = disciplinaId;
    this.disciplinaNome = disciplinaNome;
    this.quantidadeAlunos = quantidadeAlunos;
    this.quantidadeProfessores = quantidadeProfessores;
    this.quantidadeAtividades = quantidadeAtividades;
    this.usuarioId = usuarioId;
  }
}

export class TurmaWithUsuario extends Turma {
  dataEntrada: string;
  ativo: boolean;
  favorito: boolean;

  constructor(
    id: number = 0,
    nome: string = '',
    codigo: string = '',
    descricao: string = '',
    imagem: string = '',
    ano: number = new Date().getFullYear(),
    nivelEnsino: string = '',
    dataCriacao: string = '',
    disciplinaId: number = 0,
    disciplinaNome: string = '',
    quantidadeAlunos: number = 0,
    quantidadeProfessores: number = 0,
    quantidadeAtividades: number = 0,
    usuarioId?: number,
    dataEntrada: string = '',
    ativo: boolean = true,
    favorito: boolean = false
  ) {
    super(
      id,
      nome,
      codigo,
      descricao,
      imagem,
      ano,
      nivelEnsino,
      dataCriacao,
      disciplinaId,
      disciplinaNome,
      quantidadeAlunos,
      quantidadeProfessores,
      quantidadeAtividades,
      usuarioId
    );
    
    this.dataEntrada = dataEntrada;
    this.ativo = ativo;
    this.favorito = favorito;
  }
}
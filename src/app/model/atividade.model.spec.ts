import { Atividade } from './atividade.model';

describe('Atividade', () => {
  it('should be defined', () => {
    const model: Atividade = {} as Atividade;
    expect(model).toBeDefined();
  });
});
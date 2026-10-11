import { Registro } from './registro.model';

describe('Registro', () => {
  it('should be defined', () => {
    const model: Registro = {} as Registro;
    expect(model).toBeDefined();
  });
});
import { Usuario } from './usuario.model';

describe('Usuario', () => {
  it('should be defined', () => {
    const model: Usuario = {} as Usuario;
    expect(model).toBeDefined();
  });
});
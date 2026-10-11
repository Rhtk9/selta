import { Especie } from './especie.model';

describe('Especie', () => {
  it('should be defined', () => {
    const model: Especie = {} as Especie;
    expect(model).toBeDefined();
  });
});

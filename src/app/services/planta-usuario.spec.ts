import { TestBed } from '@angular/core/testing';

import { PlantaUsuario } from './planta-usuario';

describe('PlantaUsuario', () => {
  let service: PlantaUsuario;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlantaUsuario);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

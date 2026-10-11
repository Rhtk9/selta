import { TestBed } from '@angular/core/testing';

import { UsuarioTurma } from './usuario-turma';

describe('UsuarioTurma', () => {
  let service: UsuarioTurma;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsuarioTurma);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

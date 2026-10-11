import { TestBed } from '@angular/core/testing';

import { UsuarioTarefaService } from './usuario-tarefa.service';

describe('UsuarioTarefaService', () => {
  let service: UsuarioTarefaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsuarioTarefaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

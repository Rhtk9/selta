import { TestBed } from '@angular/core/testing';

import { UsuarioRecompensaService } from './usuario-recompensa.service';

describe('UsuarioRecompensaService', () => {
  let service: UsuarioRecompensaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsuarioRecompensaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

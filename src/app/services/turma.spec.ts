import { TestBed } from '@angular/core/testing';

import { Turma } from './turma';

describe('Turma', () => {
  let service: Turma;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Turma);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

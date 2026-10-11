import { TestBed } from '@angular/core/testing';

import { ProfessorTurmaService } from './professor-turma.service';

describe('ProfessorTurmaService', () => {
  let service: ProfessorTurmaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfessorTurmaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

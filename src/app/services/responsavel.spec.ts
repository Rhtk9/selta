import { TestBed } from '@angular/core/testing';

import { Responsavel } from './responsavel';

describe('Responsavel', () => {
  let service: Responsavel;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Responsavel);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

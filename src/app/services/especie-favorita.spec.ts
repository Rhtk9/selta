import { TestBed } from '@angular/core/testing';

import { EspecieFavorita } from './especie-favorita';

describe('EspecieFavorita', () => {
  let service: EspecieFavorita;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EspecieFavorita);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

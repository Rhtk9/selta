import { TestBed } from '@angular/core/testing';

import { Fase } from './fase';

describe('Fase', () => {
  let service: Fase;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Fase);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

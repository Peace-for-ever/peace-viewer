import { TestBed } from '@angular/core/testing';

import { ArangoService } from './arango.service';

describe('ArangoService', () => {
  let service: ArangoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArangoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

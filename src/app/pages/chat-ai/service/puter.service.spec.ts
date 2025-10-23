/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { PuterService } from './puter.service';

describe('Service: Puter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PuterService]
    });
  });

  it('should ...', inject([PuterService], (service: PuterService) => {
    expect(service).toBeTruthy();
  }));
});

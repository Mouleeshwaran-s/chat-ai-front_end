/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ChatAiService } from './chat-ai.service';

describe('Service: ChatAi', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChatAiService]
    });
  });

  it('should ...', inject([ChatAiService], (service: ChatAiService) => {
    expect(service).toBeTruthy();
  }));
});

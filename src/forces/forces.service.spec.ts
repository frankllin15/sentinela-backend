import { Test, TestingModule } from '@nestjs/testing';
import { ForcesService } from './forces.service';

describe('ForcesService', () => {
  let service: ForcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ForcesService],
    }).compile();

    service = module.get<ForcesService>(ForcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

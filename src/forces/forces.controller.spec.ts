import { Test, TestingModule } from '@nestjs/testing';
import { ForcesController } from './forces.controller';
import { ForcesService } from './forces.service';

describe('ForcesController', () => {
  let controller: ForcesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForcesController],
      providers: [ForcesService],
    }).compile();

    controller = module.get<ForcesController>(ForcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

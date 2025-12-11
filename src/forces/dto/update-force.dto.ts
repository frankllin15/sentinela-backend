import { PartialType } from '@nestjs/mapped-types';
import { CreateForceDto } from './create-force.dto';

export class UpdateForceDto extends PartialType(CreateForceDto) {}

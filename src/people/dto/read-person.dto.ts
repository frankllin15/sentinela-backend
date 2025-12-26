import { Person } from '../entities/person.entity';

export class ReadPersonDto extends Person {
  facePhotoUrl?: string;
}

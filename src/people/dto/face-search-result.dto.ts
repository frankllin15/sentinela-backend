import { Person } from '../entities/person.entity';

export class FaceSearchResultDto {
  person: Person;
  similarity: number; // Score de similaridade (0 a 1, onde 1 é idêntico)
  distance: number; // Distância do vetor (menor = mais similar)
  facePhotoUrl?: string; // URL da foto facial que foi matcheada
}

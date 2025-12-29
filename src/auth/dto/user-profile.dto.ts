export class UserProfileDto {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  role: string;
  forceId?: number;
  mustChangePassword: boolean;
  createdAt?: Date;
}

export class UserProfileDto {
  id: number;
  email: string;
  role: string;
  forceId?: number;
  mustChangePassword: boolean;
}

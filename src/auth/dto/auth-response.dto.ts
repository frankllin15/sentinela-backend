import { UserRole } from '../../users/entities/user.entity';

export class AuthResponseDto {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    forceId?: number;
    mustChangePassword: boolean;
  };
}

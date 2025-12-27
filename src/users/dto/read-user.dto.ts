export interface ReadUserDto {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  forceName?: string;
  mustChangePassword: boolean;
  forceId?: number;
  createdAt: Date;
}

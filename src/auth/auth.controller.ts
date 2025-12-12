import { Controller, Post, UseGuards, Request, Get, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint de login
   * POST /auth/login
   * Body: { email, password }
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any, @Ip() ip: string) {
    const ipAddress = ip || req.ip || req.connection?.remoteAddress;
    return await this.authService.login(req.user, ipAddress);
  }

  /**
   * Endpoint para obter perfil do usuário autenticado
   * GET /auth/profile
   * Headers: Authorization: Bearer <token>
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    const user = await this.authService.getUserProfile(req.user.id);

    return user;
  }
}

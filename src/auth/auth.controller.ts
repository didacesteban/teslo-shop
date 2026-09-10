import { Controller, Get, Post, Body, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { GetRawHeaders } from './decorators/get-headers.decorator';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { RoleProtected } from './decorators/role-protected.decorator';
import { ValidRoles } from './interfaces/valid-roles';
import { Auth } from './decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-auth-status')
  @UseGuards(AuthGuard())
  checkAuthStatus(
    @GetUser('id') userId: string,
  ) {
    return this.authService.checkAuthStatus(userId);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @Req() request: Express.Request,
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    @GetRawHeaders() rawHeaders: string[]
  ) {
    return {
      ok: true,
      message: "this is private",
      user,
      userEmail,
      rawHeaders
    }
  }

  @Get('private2')
  // @SetMetadata('roles', ['admin', 'superuser'])
  @RoleProtected(ValidRoles.admin, ValidRoles.superUser)
  // UserRoleGuard no lleva parentesis porque para los guards custom no queremos que se cree una instancia cada vez
  @UseGuards(AuthGuard(), UserRoleGuard)
  privateRoute2(@GetUser() user: User,) {
    return {
      ok: true,
      message: "this is private 2",
      user,
    }
  }

  @Get('private3')
  @Auth(ValidRoles.superUser, ValidRoles.admin)
  privateRoute3(@GetUser() user: User,) {
    return {
      ok: true,
      message: "this is private 3",
      user,
    }
  }

}

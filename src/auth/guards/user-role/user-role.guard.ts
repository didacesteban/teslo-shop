import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLES } from 'src/auth/decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector // Se usa para obtener data de los otros decoradores o de la metadata
  ){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    const validRoles: string[] = this.reflector.get(META_ROLES, context.getHandler());
    if ( !validRoles ) return true;
    if ( validRoles.length === 0 ) return true;

    for (const validRole of validRoles) {
      if (user.roles.includes(validRole)){
        return true
      }
    }

    throw new ForbiddenException('User does not have permission to do this action')
  }
}

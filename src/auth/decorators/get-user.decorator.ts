import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";

export const GetUser = createParamDecorator(
    (data: string, context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        const user = req.user;

        if (!user) {
            throw new InternalServerErrorException('User not found (request)');
        }

        if(data) {
            return user[data];
        }

        return user;
    }
);
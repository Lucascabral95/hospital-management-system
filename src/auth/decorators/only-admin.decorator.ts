import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { PayloadJwtDto } from "../dto";
import { RoleAccess } from "@prisma/client";

export const OnlyAdmin = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user: PayloadJwtDto = request.user;

  if (user.role !== RoleAccess.ADMIN) throw new UnauthorizedException("Only admins can access");

  return "Acceso autorizado";
});

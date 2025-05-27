import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { PayloadJwtDto } from "../dto";
import { RoleAccess } from "@prisma/client";

export const GetUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user: PayloadJwtDto = request.user;

  if (user.is_active === false) throw new UnauthorizedException("User is inactive, talk with an admin");

  if (user.role !== RoleAccess.DOCTOR) throw new UnauthorizedException("Only doctos can access");

  if (data === "lucas") throw new UnauthorizedException("Lucas is not authorized");

  return "Acceso autorizado";
});

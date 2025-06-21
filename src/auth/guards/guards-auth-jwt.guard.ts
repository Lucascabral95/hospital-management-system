// import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
// import { JwtService } from "@nestjs/jwt";
// import { AuthGuard } from "@nestjs/passport";
// import { PayloadJwtDto } from "../dto";
// import { RoleAccess } from "@prisma/client";

// @Injectable()
// export class JwtAuthGuard extends AuthGuard("jwt") {
//   constructor(private readonly jwtService: JwtService) {
//     super();
//   }

//   canActivate(context: ExecutionContext) {
//     const request = context.switchToHttp().getRequest();
//     const tokenJwt = request.headers.authorization;

//     if (!tokenJwt) throw new UnauthorizedException("Token not found");

//     const tokenID = tokenJwt.split(" ")[1];

//     try {
//       const decodeToken: PayloadJwtDto = this.jwtService.verify(tokenID);

//       if (decodeToken.role !== RoleAccess.ADMIN) {
//         throw new UnauthorizedException("Only admins can access");
//       }
//     } catch (error) {
//       throw new UnauthorizedException("Invalid or expired token");
//     }

//     return super.canActivate(context);
//   }
// }

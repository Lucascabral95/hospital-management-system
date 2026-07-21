import { PayloadJwtDto } from "../dto";

export interface AccessTokenPayload extends PayloadJwtDto {
  type: "access";
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: number;
  jti: string;
  familyId: string;
  type: "refresh";
  iat?: number;
  exp?: number;
}

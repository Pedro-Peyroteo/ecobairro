import { Equals, IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsBoolean()
  @Equals(true)
  rgpd_accepted!: boolean;
}

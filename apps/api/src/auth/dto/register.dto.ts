import {
  Equals,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  @Matches(/^\+?[\d\s\-().]+$/, { message: 'phone must be a valid phone number' })
  phone?: string;

  @IsBoolean()
  @Equals(true)
  rgpd_accepted!: boolean;
}

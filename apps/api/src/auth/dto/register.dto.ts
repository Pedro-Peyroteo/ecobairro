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
  @MinLength(8, { message: 'A password deve ter pelo menos 8 caracteres.' })
  @Matches(
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
    { message: 'A password deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial.' },
  )
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nome_completo?: string;

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

import { Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";

export class PaginationDto {

    @IsOptional()
    @IsPositive()
    // tenemos que transformar el valor de limit a number ya que los query parameters son strings
    @Type(() => Number) // seria opcional si ponemos en true el enableImplicitConversion en true en el transformOptions del validation pipe del main.ts 
    limit?: number;

    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    offset?: number;

}
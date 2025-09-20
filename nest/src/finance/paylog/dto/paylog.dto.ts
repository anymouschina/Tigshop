// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty } from "class-validator";

export class BatchDeleteDto {
  @ApiProperty({
    description: "要删除的ID数组",
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNotEmpty()
  ids: number[];
}
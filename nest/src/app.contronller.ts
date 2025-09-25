import { Controller, Get } from '@nestjs/common';
@Controller()
export class AppController {
  constructor() {}

  @Get()
  getHello(): string {
    console.log(1111)
    return 'hello'
  }
}

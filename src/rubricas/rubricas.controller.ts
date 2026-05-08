import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Headers } from '@nestjs/common';
import { RubricasService } from './rubricas.service';
import { CreateRubricaDto } from './dto/create-rubrica.dto';
import { UpdateRubricaDto } from './dto/update-rubrica.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { User } from '../common/decorators/user.decorator';

@UseGuards(SupabaseAuthGuard)
@Controller('rubricas')
export class RubricasController {
  constructor(private readonly rubricasService: RubricasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createRubricaDto: CreateRubricaDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.rubricasService.create(createRubricaDto, token);
  }

  @Get()
  findAll(
    @User() user: { id: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.rubricasService.findAll(token);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.rubricasService.findOne(id, token);
  }

  @Get('/materia/:materia_id')
findByMateria(
  @Param('materia_id') materia_id: string,
  @Headers('authorization') authHeader?: string,
) {
  const token = authHeader?.split(' ')[1];
  return this.rubricasService.findByMateria(materia_id, token);
}

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateRubricaDto: UpdateRubricaDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.rubricasService.update(id, updateRubricaDto, token);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.rubricasService.remove(id, token);
  }
}

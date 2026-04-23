import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { PerfilesService } from './perfiles.service';
import { CreatePerfilAcademicoDto } from './dto/create-perfil-academico.dto';
import { CreateEstresoresDto } from './dto/create-estresores.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { User } from '../common/decorators/user.decorator';

@UseGuards(SupabaseAuthGuard)
@Controller('perfil')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Post('academico')
  @HttpCode(HttpStatus.OK)
  crear(@User() user: { id: string }, @Body() dto: CreatePerfilAcademicoDto) {
    return this.perfilesService.crearOActualizar(user.id, dto);
  }

  @Get('academico')
  obtener(@User() user: { id: string }) {
    return this.perfilesService.obtenerPorUsuario(user.id);
  }

  @Post('estresores')
  @HttpCode(HttpStatus.OK)
  guardarEstresores(@User() user: { id: string }, @Body() dto: CreateEstresoresDto) {
    return this.perfilesService.guardarEstresores(user.id, dto);
  }

  @Get('estresores')
  obtenerEstresores(@User() user: { id: string }) {
    return this.perfilesService.obtenerEstresores(user.id);
  }
}

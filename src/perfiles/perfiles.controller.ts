import { Body, Controller, Get, HttpCode, HttpStatus, Post, Patch, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PerfilesService } from './perfiles.service';
import { CreatePerfilAcademicoDto } from './dto/create-perfil-academico.dto';
import { CreateEstresoresDto } from './dto/create-estresores.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { User } from '../common/decorators/user.decorator';

@UseGuards(SupabaseAuthGuard)
@Controller('perfil')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  // ── Perfil general  ──
  @Get()
  getPerfil(@User() user: { id: string }) {
    return this.perfilesService.getPerfil(user.id);
  }

  @Patch()
  updatePerfil(@User() user: { id: string }, @Body() dto: UpdatePerfilDto) {
    return this.perfilesService.updatePerfil(user.id, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        return cb(new BadRequestException('Solo se permiten imágenes JPG, PNG o WEBP'), false);
      }
      cb(null, true);
    },
  }))
  uploadAvatar(@User() user: { id: string }, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se proporcionó ningún archivo');
    return this.perfilesService.uploadAvatar(user.id, file);
  }

  // ── Perfil académico ──
  @Post('academico')
  @HttpCode(HttpStatus.OK)
  crear(@User() user: { id: string }, @Body() dto: CreatePerfilAcademicoDto) {
    return this.perfilesService.crearOActualizar(user.id, dto);
  }

  @Get('academico')
  obtener(@User() user: { id: string }) {
    return this.perfilesService.obtenerPorUsuario(user.id);
  }

  // ── Estresores ──
  @Post('estresores')
  @HttpCode(HttpStatus.OK)
  guardarEstresores(@User() user: { id: string }, @Body() dto: CreateEstresoresDto) {
    return this.perfilesService.guardarEstresores(user.id, dto);
  }

  @Get('estresores')
  obtenerEstresores(@User() user: { id: string }) {
    return this.perfilesService.obtenerEstresores(user.id);
  }
  @Get('estresores/:factor_id')
  obtenerEstresor(@User() user: { id: string }, @Param('factor_id') factor_id: number) {
    return this.perfilesService.obtenerEstresor(user.id, factor_id);
  }
  @Patch('estresores/:factor_id')
  updateEstresor(@User() user: { id: string }, @Param('factor_id') factor_id: number, @Body() dto: CreateEstresoresDto) {
    return this.perfilesService.updateEstresor(user.id, dto, factor_id);
  }

  // ── Nivel de estrés ──
  @Get('nivel-estres')
  calcularNivelEstres(@User() user: { id: string }) {
    return this.perfilesService.calcularNivelEstres(user.id);
  }

  // ── Obtener avatar de un usuario ──
  @Get('avatar/:usuarioId')
  getAvatar(@Param('usuarioId') usuarioId: string) {
    return this.perfilesService.getAvatar(usuarioId);
  }
}

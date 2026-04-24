import { Controller, Get, Patch, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PerfilService } from './perfil.service';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('perfil')
@UseGuards(JwtGuard)
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Get()
  getPerfil(@CurrentUser() user: any) {
    return this.perfilService.getPerfil(user.id);
  }

  @Patch()
  updatePerfil(@CurrentUser() user: any, @Body() dto: UpdatePerfilDto) {
    return this.perfilService.updatePerfil(user.id, dto);
  }

  @Post('/avatar')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB máximo
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        return cb(new BadRequestException('Solo se permiten imágenes JPG, PNG o WEBP'), false);
      }
      cb(null, true);
    },
  }))
  uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se proporcionó ningún archivo');
    return this.perfilService.uploadAvatar(user.id, file);
  }
}

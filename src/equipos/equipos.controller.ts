import { Controller, Post, Get, Body, Param, UseGuards, Headers } from '@nestjs/common';
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { User } from '../common/decorators/user.decorator';

@Controller('equipos')
@UseGuards(SupabaseAuthGuard)
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

    @Post()
    crearEquipo(
        @User() user: { id: string },
        @Body() dto: CreateEquipoDto,
        @Headers('authorization') authHeader: string,
    ) {
        const accessToken = authHeader.split(' ')[1];
        return this.equiposService.crearEquipo(user.id, dto, accessToken);
    }

    @Get('materia/:materiaId')
    getEquiposPorMateria(
    @Param('materiaId') materiaId: string,
    @Headers('authorization') authHeader: string,
    ) {
        const accessToken = authHeader.split(' ')[1];
        return this.equiposService.getEquiposPorMateria(materiaId, accessToken);
    }
}

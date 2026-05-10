import { Controller, Post, Get, Body, Param, UseGuards, Headers, Delete } from '@nestjs/common';
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { AddMiembroDto } from './dto/add-miembro.dto';
import { CalificarEquipoDto } from './dto/calificar-equipo.dto';

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

    @Post(':equipoId/miembros')
    addMiembro(
    @Param('equipoId') equipoId: string,
    @Body() dto: AddMiembroDto,
    @Headers('authorization') authHeader: string,
    ) {
    const accessToken = authHeader.split(' ')[1];
    return this.equiposService.addMiembro(equipoId, dto, accessToken);
    }

    @Post(':equipoId/calificar')
    calificarEquipo(
    @Param('equipoId') equipoId: string,
    @User() user: { id: string },
    @Body() dto: CalificarEquipoDto,
    @Headers('authorization') authHeader: string,
    ) {
    const accessToken = authHeader.split(' ')[1];
    return this.equiposService.calificarEquipo(equipoId, user.id, dto, accessToken);
    }

    @Get(':equipoId/calificacion')
    getCalificacion(
    @Param('equipoId') equipoId: string,
    @Headers('authorization') authHeader: string,
    ) {
    const accessToken = authHeader.split(' ')[1];
    return this.equiposService.getCalificacion(equipoId, accessToken);
    }
    
    @Delete(':equipoId/miembros/:usuarioId')
    removeMiembro(
    @Param('equipoId') equipoId: string,
    @Param('usuarioId') usuarioId: string,
    @User() user: { id: string },
    @Headers('authorization') authHeader: string,
    ) {
    const accessToken = authHeader.split(' ')[1];
    return this.equiposService.removeMiembro(equipoId, usuarioId, user.id, accessToken);
    }

    @Get(':equipoId/nivel-estres')
    getNivelEstresEquipo(
    @Param('equipoId') equipoId: string,
    @Headers('authorization') authHeader: string,
    ) {
    const accessToken = authHeader.split(' ')[1];
    return this.equiposService.getNivelEstresEquipo(equipoId, accessToken);
    }
}

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
    constructor(private readonly equiposService: EquiposService) { }

    @Post()
    crearEquipo(
        @User() user: { id: string },
        @Body() dto: CreateEquipoDto,
        @Headers('authorization') authHeader: string,
    ) {
        const accessToken = authHeader.split(' ')[1];
        return this.equiposService.crearEquipo(user.id, dto, accessToken);
    }

    @Get('mis-equipos')
    getMisEquipos(
        @User() user: { id: string },
        @Headers('authorization') authHeader: string,
    ) {
        const accessToken = authHeader.split(' ')[1];
        return this.equiposService.getMisEquipos(user.id, accessToken);
    }

    @Get('materia/:materiaId')
    getEquiposPorMateria(
        @Param('materiaId') materiaId: string,
        @Headers('authorization') authHeader: string,
    ) {
        const accessToken = authHeader.split(' ')[1];
        return this.equiposService.getEquiposPorMateria(materiaId, accessToken);
    }

    @Post(':equipo_id/miembros')
    addMiembro(
        @Param('equipo_id') equipo_id: string,
        @Body() dto: AddMiembroDto,
        @Headers('authorization') authHeader: string,
    ) {
        const accessToken = authHeader.split(' ')[1];
        return this.equiposService.addMiembro(equipo_id, dto, accessToken);
    }

    @Post(':equipo_id/calificar')
    calificarEquipo(
        @Param('equipo_id') equipo_id: string,
        @User() user: { id: string },
        @Body() dto: CalificarEquipoDto,
        @Headers('authorization') authHeader: string,
    ) {
        const accessToken = authHeader.split(' ')[1];
        return this.equiposService.calificarEquipo(equipo_id, user.id, dto, accessToken);
    }

    @Get(':equipo_id/calificacion')
    getCalificacion(
        @Param('equipo_id') equipo_id: string,
        @Headers('authorization') authHeader: string,
    ) {
        const accessToken = authHeader.split(' ')[1];
        return this.equiposService.getCalificacion(equipo_id, accessToken);
    }

    @Delete(':equipo_id/miembros/:usuarioId')
    removeMiembro(
        @Param('equipo_id') equipo_id: string,
        @Param('usuarioId') usuarioId: string,
        @User() user: { id: string },
        @Headers('authorization') authHeader: string,
    ) {
        const accessToken = authHeader.split(' ')[1];
        return this.equiposService.removeMiembro(equipo_id, usuarioId, user.id, accessToken);
    }

    @Get(':equipo_id/nivel-estres')
    getNivelEstresEquipo(
        @Param('equipo_id') equipo_id: string,
        @Headers('authorization') authHeader: string,
    ) {
        const accessToken = authHeader.split(' ')[1];
        return this.equiposService.getNivelEstresEquipo(equipo_id, accessToken);
    }
}

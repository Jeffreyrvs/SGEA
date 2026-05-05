import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Headers } from '@nestjs/common';
import { MateriasService } from './materias.service';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { User } from '../common/decorators/user.decorator';

@UseGuards(SupabaseAuthGuard)
@Controller('materias')
export class MateriasController {
    constructor(private readonly materiasService: MateriasService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @User() user: { id: string },
        @Body() createMateriaDto: CreateMateriaDto,
        @Headers('authorization') authHeader?: string,
    ) {
        const token = authHeader?.split(' ')[1];
        return this.materiasService.create(createMateriaDto, user.id, token);
    }

    @Get()
    findAll() {
        return this.materiasService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.materiasService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateMateriaDto: UpdateMateriaDto,
        @Headers('authorization') authHeader?: string,
    ) {
        const token = authHeader?.split(' ')[1];
        return this.materiasService.update(id, updateMateriaDto, token);
    }

    @Delete(':id')
    remove(
        @Param('id') id: string,
        @Headers('authorization') authHeader?: string,
    ) {
        const token = authHeader?.split(' ')[1];
        return this.materiasService.remove(id, token);
    }
}

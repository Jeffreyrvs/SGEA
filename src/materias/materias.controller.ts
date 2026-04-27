import { Controller, Get, Post, Body, Patch, Param, Delete, Request, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { MateriasService } from './materias.service';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('materias')
export class MateriasController {
    constructor(private readonly materiasService: MateriasService) { }

    @UseGuards(JwtGuard)
    @HttpCode(HttpStatus.CREATED)
    @Post()
    async create(@Body() createMateriaDto: CreateMateriaDto, @Request() req: any) {
        const userId = req.user.sub;
        return this.materiasService.create(createMateriaDto, userId);
    }

    @Get()
    async findAll() {
        return this.materiasService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.materiasService.findOne(id);
    }

    @UseGuards(JwtGuard)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateMateriaDto: UpdateMateriaDto) {
        return this.materiasService.update(id, updateMateriaDto);
    }

    @UseGuards(JwtGuard)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.materiasService.remove(id);
    }
}

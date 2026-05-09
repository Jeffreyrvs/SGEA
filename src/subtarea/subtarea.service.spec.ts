import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SubtareaService } from './subtarea.service';
import { SupabaseService } from '../supabase/supabase.service';

const mockSupabaseClient = { from: jest.fn() };
const mockSupabaseService = { getClient: jest.fn().mockReturnValue(mockSupabaseClient) };

const ACTIVIDAD_ID = 'aaa00000-0000-0000-0000-000000000001';
const USUARIO_ID   = 'bbb00000-0000-0000-0000-000000000001';
const EQUIPO_ID    = 'ccc00000-0000-0000-0000-000000000001';
const MIEMBRO_ID   = 'ddd00000-0000-0000-0000-000000000001';

const actividadRow = {
  id: ACTIVIDAD_ID,
  usuario_id: USUARIO_ID,
  equipo_asignado: EQUIPO_ID,
};

describe('SubtareaService', () => {
  let service: SubtareaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubtareaService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<SubtareaService>(SubtareaService);
    jest.clearAllMocks();
  });

  // ── create ──
  describe('create', () => {
    it('retorna la subtarea creada sin asignado', async () => {
      const subtareaRow = { id: 'sub-001', actividad_id: ACTIVIDAD_ID, nombre: 'Tarea A', asignado_a: null, horas_estimadas: null, completado: false };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: actividadRow, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: subtareaRow, error: null }),
            }),
          }),
        });

      const result = await service.create(ACTIVIDAD_ID, { nombre: 'Tarea A' }, USUARIO_ID);
      expect(result).toEqual(subtareaRow);
    });

    it('retorna la subtarea creada con asignado válido', async () => {
      const subtareaRow = { id: 'sub-002', actividad_id: ACTIVIDAD_ID, nombre: 'Tarea B', asignado_a: MIEMBRO_ID, horas_estimadas: 2, completado: false };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: actividadRow, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { usuario_id: MIEMBRO_ID }, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: subtareaRow, error: null }),
            }),
          }),
        });

      const result = await service.create(ACTIVIDAD_ID, { nombre: 'Tarea B', asignado_a: MIEMBRO_ID, horas_estimadas: 2 }, USUARIO_ID);
      expect(result).toEqual(subtareaRow);
    });

    it('lanza NotFoundException cuando la actividad no existe', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      await expect(
        service.create(ACTIVIDAD_ID, { nombre: 'X' }, USUARIO_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException cuando el usuario no es dueño', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...actividadRow, usuario_id: 'otro-usuario' },
              error: null,
            }),
          }),
        }),
      });

      await expect(
        service.create(ACTIVIDAD_ID, { nombre: 'X' }, USUARIO_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lanza BadRequestException cuando equipo_asignado es null', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...actividadRow, equipo_asignado: null },
              error: null,
            }),
          }),
        }),
      });

      await expect(
        service.create(ACTIVIDAD_ID, { nombre: 'X' }, USUARIO_ID),
      ).rejects.toThrow(new BadRequestException('La actividad no tiene un equipo asignado'));
    });

    it('lanza BadRequestException cuando asignado_a no pertenece al equipo', async () => {
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: actividadRow, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              }),
            }),
          }),
        });

      await expect(
        service.create(ACTIVIDAD_ID, { nombre: 'X', asignado_a: 'no-miembro-uuid' }, USUARIO_ID),
      ).rejects.toThrow(new BadRequestException('El usuario no pertenece al equipo de esta actividad'));
    });
  });
});

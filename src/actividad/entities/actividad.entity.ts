import { StatusActividad } from "../enum/status.enum";

export class Actividad {
    actividad_id!: number;
    materia_id!: string;
    usuario_id!: string;
    nombre!: string;
    tipo!: string;
    materia!: string;
    fecha_entrega!: Date;
    nivel_dificultad?: number; // escala 1-5
    calificacion_contenido?: string;
    descripcion?: string;
    tiempo_estimado?: number;
    equipo_asignado?: string;
    status?: StatusActividad;
    fechaCompletado?: Date;
}




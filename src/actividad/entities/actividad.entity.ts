import { StatusActividad } from "../enum/status.enum";

export class Actividad {
    id!: number;
    materia_id!: string;
    usuario_id!: string;
    nombre!: string;
    tipo!: string;
    fecha_entrega!: Date;
    dificultad?: number; // escala 1-5
    puntaje_contenido?: string;
    importancia?: string;
    estatus?: StatusActividad;
    descripcion?: string;
    tiempo_estimado?: number;
    created_at?: Date;
    equipo_asignado?: string;
    fechaCompletado?: Date;
}




import { StatusActividad } from "../enum/status.enum";

export class Actividad {
    id!: string;
    materia_id!: string;
    usuario_id!: string;
    equipoId?: string;
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
    //fecha_completado?: Date;
}




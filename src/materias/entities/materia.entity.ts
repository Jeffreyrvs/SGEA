import { AppController } from "../../app.controller";


export class Materia {

  id!: string;

  usuario_id!: string;

  nombre!: string;

  calificacion_profesor!: number | null; // escala 1-5
  dificultad!: number | null;            // escala 1-5

  autonomia!: number | null;             // escala 1-5

  fecha_creacion!: Date;
}
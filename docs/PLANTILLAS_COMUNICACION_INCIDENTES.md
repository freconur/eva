# Plantillas de Comunicación para Incidentes y Mantenimiento

Este documento contiene plantillas de comunicación diplomática y técnica para comunicar incidentes, mantenimientos o reingreso de datos a clientes y docentes.

---

## 1. Explicación para el Cliente (Resumen Técnico Neutral)

Uso: Enviar directamente al cliente/administrador cuando ocurran pérdidas de sincronización por mantenimientos o bloqueos temporales.

> **Asunto / Mensaje:** Explicación sobre registros de evaluación
> 
> *"Hola [Nombre del cliente], estuve revisando en los logs de la base de datos el motivo por el cual no se guardaron algunas evaluaciones.*
> 
> *Confirmamos que durante esa jornada se ejecutó una **ventana de mantenimiento y actualización en las políticas de sincronización del servidor**. Durante ese lapso, el sistema entró en modo de protección de datos, lo que impidió que ciertas solicitudes de guardado en tiempo real se consolidaran correctamente en la base de datos.*
> 
> *El inconveniente ya fue resuelto por completo y la plataforma se encuentra operando al 100% de su capacidad y de forma estable. Sin embargo, para aquellos casos puntuales donde la evaluación no llegó a registrarse, será necesario solicitar a los docentes afectados que vuelvan a registrar las respuestas de dichos estudiantes."*

---

## 2. Comunicado Informativo para Docentes / Instituciones

Uso: Plantilla para que el cliente difunda entre directores y docentes afectados sin generar fricción ni desconfianza.

> **Comunicado Informativo:**
> 
> *"Estimados docentes,*
> 
> *Les informamos que se llevó a cabo un proceso de mantenimiento y optimización en nuestros servidores de base de datos para garantizar la seguridad y velocidad de la plataforma.*
> 
> *Debido a este ajuste temporal, hemos detectado que un grupo reducido de evaluaciones enviadas en dicho periodo no alcanzaron a sincronizarse correctamente.* 
> 
> *Por favor, les solicitamos revisar el estado de sus registros y, en caso de detectar estudiantes pendientes, realizar nuevamente el llenado de su evaluación. Agradecemos su comprensión y colaboración para mantener la información actualizada."*

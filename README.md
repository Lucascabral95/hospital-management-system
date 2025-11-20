<p align="center">
  <img src="https://nestjs.com/img/logo_text.svg" alt="NestJS Logo" width="320"/>
</p>

# Hospital Management System

## Descripción general

Hospital Management System es una aplicación robusta desarrollada con [NestJS](https://nestjs.com/) y TypeScript para gestionar de manera eficiente la información hospitalaria. Permite administrar pacientes, personal médico, citas, historiales médicos, prescripciones y otros procesos clave en un entorno hospitalario moderno.

---

## ⚙️ Características Principales

- **Gestión Integral de Pacientes:** Registro, actualización y seguimiento de pacientes, incluyendo información personal, historial médico, y estado de admisión.
- **Administración de Personal Médico:** Gestión de doctores, especialidades y autenticación segura mediante JWT.
- **Citas Médicas en tiempo real:** Creación, actualización y seguimiento de citas médicas en tiempo real con estados y especialidades.
- **Historiales Médicos:** Registro detallado de consultas, diagnósticos y tratamientos asociados a cada paciente y doctor.
- **Prescripciones:** Gestión de recetas médicas vinculadas a historiales clínicos.
- **Semilla de Datos:** Endpoint para poblar la base de datos con datos de ejemplo para pruebas y desarrollo rápido.
- **Comunicación en Tiempo Real:** Soporte para WebSockets, permitiendo actualizaciones en tiempo real de citas médicas.
- **Documentación Interactiva:** API documentada y testeable mediante Swagger.
- **Paginación y Filtros:** Endpoints con soporte de paginación y filtrado por género, especialidad, etc.
- **Autenticación y Autorización:** Seguridad basada en JWT y roles (ADMIN, DOCTOR).

---

## 🚀 Tecnologías Utilizadas

- **NestJS:** Framework progresivo para construir aplicaciones Node.js eficientes y escalables.
- **TypeScript:** Tipado estático para mayor robustez y mantenibilidad.
- **Prisma:** ORM para modelado y acceso eficiente a la base de datos PostgreSQL.
- **PostgreSQL:** Base de datos relacional para almacenamiento seguro y estructurado.
- **Swagger:** Documentación interactiva de la API.
- **Jest:** Framework de testing para pruebas unitarias y end-to-end.
- **Docker:** Contenerización y despliegue sencillo en cualquier entorno.
- **bcrypt:** Hashing seguro de contraseñas.
- **JWT (jsonwebtoken):** Autenticación y autorización basada en tokens.
- **WebSockets (Socket.io):** Comunicación en tiempo real para módulos como citas médicas.
- **Class-validator & class-transformer:** Validación y transformación de DTOs.
- **dotenv & joi:** Gestión y validación de variables de entorno.
- **ESLint & Prettier:** Linting y formateo automático del código.

---

## Tabla de contenidos

- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)
- [Contacto](#contacto)

---

## Instalación

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/Lucascabral95/hospital-management-system.git
   cd hospital-management-system
   ```

2. **Instala las dependencias:**

   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**

   - Copia el archivo `.env.template` a `.env` y completa los valores necesarios.
   - Ejemplo:
     ```
     PORT=4000
     ```

4. **Configura la base de datos:**

   - Edita la variable `DATABASE_URL` en tu archivo `.env` para apuntar a tu instancia de PostgreSQL.
   - Ejecuta las migraciones de Prisma:
     ```bash
     npx prisma migrate deploy
     npx prisma generate
     ```

5. **Activa la semilla con los datos de prueba:**

   ```bash
   curl -X POST http://localhost:4000/api/v1/create/seed/global
   ```

6. **Correr todas las pruebas unitarias:**

```bash
npm run test
```

7. **Compila el proyecto:**

```bash
npm run build
```

---

## Uso

### Desarrollo

```bash
npm run start:dev
```

### Producción

```bash
npm run start:prod
```

### Documentación de la API

El proyecto incluye documentación interactiva de rutas y pruebas de endpoints mediante Swagger disponible en:

```
http://localhost:4000/api
```

### Semilla de datos

Puedes poblar la base de datos con datos de ejemplo usando el endpoint:

```http
POST /api/v1/create/seed/global
```

---

## Estructura del proyecto

```
hospital-management-system/
│
├── src/                   # Código fuente principal de la aplicación
│   ├── app.module.ts      # Módulo raíz de NestJS
│   ├── app.controller.ts  # Controlador principal (incluye endpoint de seed)
│   ├── app.service.ts     # Lógica principal y seed global
│   ├── main.ts            # Punto de entrada de la aplicación
│   ├── config/            # Configuración de variables de entorno y validación
│   ├── common/            # DTOs y utilidades compartidas
│   ├── auth/              # Autenticación y autorización (JWT, guards, etc.)
│   ├── patients/          # Gestión de pacientes
│   ├── doctors/           # Gestión de doctores
│   ├── appointments/      # Gestión de citas médicas
│   ├── medical-records/   # Historiales médicos
│   ├── prescriptions/     # Prescripciones médicas
│   └── realtime/          # Comunicación en tiempo real (WebSockets)
│
├── prisma/                # Esquema y migraciones de base de datos Prisma
│   ├── schema.prisma
│   └── migrations/
│
├── mock/                  # Datos de ejemplo para seed (Auth, Doctors, Patients, etc.)
│
├── .env.template          # Plantilla de variables de entorno
├── package.json           # Dependencias y scripts de npm
├── dockerfile             # Dockerfile para despliegue en contenedores
├── .dockerignore          # Archivos y carpetas ignorados por Docker
├── .gitignore             # Archivos y carpetas ignorados por Git
├── README.md              # Este archivo
└── ...otros archivos de configuración
```

### Archivos y carpetas clave

- **[package.json](package.json):** Define dependencias, scripts y metadatos del proyecto.
- **[src/](src/):** Código fuente de la API y lógica de negocio.
- **[prisma/schema.prisma](prisma/schema.prisma):** Esquema de la base de datos y modelos.
- **[mock/](mock/):** Datos de ejemplo para poblar la base de datos.
- **[test/](test/):** Pruebas automáticas y configuración de Jest.
- **[dockerfile](dockerfile):** Instrucciones para construir la imagen Docker.
- **[.env.template](.env.template):** Variables de entorno requeridas.

---

## Contribuciones

¡Las contribuciones son bienvenidas!

1. Haz un fork del repositorio.
2. Crea una rama para tu feature o fix:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza tus cambios y escribe pruebas.
4. Haz commit y push a tu rama:
   ```bash
   git commit -m "Agrega nueva funcionalidad"
   git push origin feature/nueva-funcionalidad
   ```
5. Abre un Pull Request describiendo tus cambios.

Por favor, sigue las buenas prácticas de código y asegúrate de que las pruebas pasen antes de enviar tu contribución.

---

## Licencia

Este proyecto está bajo la licencia UNLICENSED. Si deseas usarlo para fines comerciales o de distribución, consulta primero con el autor.

---

## 📬 Contacto

- Autor: [Lucas Cabral](https://www.linkedin.com/in/lucas-gast%C3%B3n-cabral/)
- Sitio web: [Portfolio](https://portfolio-web-dev-git-main-lucascabral95s-projects.vercel.app/)
- Github: [https://github.com/Lucascabral95](https://github.com/Lucascabral95/)

# 🐾 EsquemaVet Ocaña — Documentación Técnica del Aplicativo Web (Versión Entregable — 4 Perfiles Diferenciados)

**Título del Proyecto:** Desarrollo de un aplicativo web para la gestión de historiales sanitarios, verificación pública QR y control de vacunación de mascotas en el municipio de Ocaña  
**Autores:**  
- Franklin Mauricio Hernández Galvis (Código: `0192326`)  
- Andrés Felipe Carrascal Gómez (Código: `0192321`)  

**Docente:** MSc. Yegny Karina Amaya Torrado  
**Asignatura:** Proyecto Integrador I — Ingeniería de Sistemas  
**Institución:** Universidad Francisco de Paula Santander Seccional Ocaña (UFPSO) — II Semestre 2026  

---

## 1. Arquitectura de Control por Roles y Aislamiento del Perfil Administrador

Para ofrecer una experiencia limpia, comprensible y segura tanto para los **Propietarios** como para los **Médicos Veterinarios**, se incorporó un **cuarto perfil dedicado (`ADMINISTRADOR`)** que aísla todas las configuraciones técnicas de infraestructura:

### Matriz de los 4 Perfiles del Sistema

1. **👤 Propietario de Mascota (`PROPIETARIO`):**
   - **Menú Parejo (4 módulos):** *Inicio*, *Mi Carnet Digital*, *Mis Mascotas*, *Mi Perfil y Clave*.
   - **Visualización:** Guía rápida en 3 pasos, consulta e impresión de su Carnet Sanitario Digital con código QR, fechas de próximos refuerzos y actualización de sus datos de contacto.
   - **Aislamiento:** No tiene acceso a módulos clínicos, ni a directorios de otros usuarios, ni a configuraciones de API, tokens o recopilaciones de base de datos.

2. **🩺 Médico Veterinario (`VETERINARIO`):**
   - **Menú Parejo (6 módulos):** *Inicio Clínico*, *Pacientes*, *Aplicar Vacuna*, *Carnets Digitales*, *Propietarios*, *Mapa Sanitario*.
   - **Visualización:** Guía clínica rápida en 3 pasos (*1. Registrar Propietario*, *2. Registrar Mascota*, *3. Certificar Vacuna / Dosis*), asistente de autocompletado de protocolos biológicos por peso, firma electrónica (`COMVEZCOL`) y recordatorios preventivos por WhatsApp.
   - **Aislamiento:** Se ocultaron de su interfaz todas las configuraciones de tipo administrador (sin acceso a llaves de API, tokens Bearer, recopilaciones JSON crudas, webhooks ni consola OpenAPI).

3. **🏛️ Salud Pública Municipal (`ENTIDAD_SANITARIA`):**
   - **Menú Parejo (5 módulos):** *Resumen Municipal*, *Mapa y Censo Ocaña*, *Verificar Carnets*, *Padrón Animal*, *Mi Perfil*.
   - **Visualización:** Mapa georreferenciado de Ocaña (`OpenStreetMap` + `Leaflet`), indicadores de cobertura antirrábica (meta OMS/OPS ≥ 80%, ODS 3) y exportación de la matriz epidemiológica a Excel (`.CSV`).

4. **⚙️ Administrador del Sistema (`ADMINISTRADOR` — Nuevo Perfil):**
   - **Menú Parejo (6 módulos):** *Panel General*, *API, Tokens y Cloud*, *Usuarios y Permisos*, *Base de Mascotas*, *Carnets Digitales*, *Mapa Epidemiológico*.
   - **Funciones Exclusivas:**
     - **Gestión de Tokens de API y Permisos:** Visualización, copia y rotación del Bearer Token Maestro (`tok_live_ocana_...`).
     - **Explorador de Recopilaciones (Colecciones Documentales):** Inspección en tiempo real de las colecciones `usuarios_sistema`, `mascotas_censo`, `historial_biologicos` y `auditoria_accesos`.
     - **Consola OpenAPI REST y Credenciales Google Cloud:** Configuración de `Project ID`, `Web API Key`, `Webhook REST`, exportación e importación de respaldos completos (`.JSON`) y auditoría de hashes criptográficos (`sha256v2$...`).

---

## 2. Mejoras de Usabilidad, Menús Parejos y Experiencia Móvil

- **Barra de Navegación Inferior Fija en Móviles (`mobile-bottom-nav`):** En pantallas móviles (`< 1024px`), el menú lateral deja de apilarse arriba del contenido (evitando el problema de un scroll largo donde se pierde la ubicación) y se transforma en una **barra inferior fija tipo aplicación nativa** siempre accesible al pulgar, acompañada de una sub-barra superior que indica la sección activa y vuelve automáticamente al inicio de la pantalla al cambiar de pestaña.
- **Menú Lateral Simétrico en Escritorio (`sidebar-menu-btn`):** Todos los botones del menú lateral comparten altura uniforme (`46px`), contenedor de icono simétrico (`32x32px`) y etiquetas claras sin saturación visual.
- **Tarjetas Responsivas en Móvil para el Directorio de Mascotas:** En teléfonos móviles, el listado de mascotas se presenta automáticamente en tarjetas verticales cómodas de leer (`#pets-directory-mobile-cards`), mientras que en computadores de escritorio se despliega la tabla completa.

---

## 3. Cuentas Precargadas para Pruebas por Rol

| Perfil | Titular | Usuario (Correo o Documento) | Contraseña |
| :--- | :--- | :--- | :--- |
| **Propietario** | Franklin Mauricio Hernández | `fmhernandezg@ufpso.edu.co` o `1091678234` | `Ocanavet2026*` *(o `123456`)* |
| **Médico Veterinario** | Dr. Carlos Eduardo Quintero | `dr.quintero@vetocana.com` o `88245910` | `VetOcana2026*` *(o `123456`)* |
| **Salud Pública** | Secretaría de Salud de Ocaña | `saludpublica@ocana-nortedesantander.gov.co` | `SaludOcana2026*` *(o `123456`)* |
| **Administrador (Nuevo)** | Administrador General del Sistema | `admin@esquemavet.co` o `1091000001` | `AdminOcana2026*` *(o `123456`)* |

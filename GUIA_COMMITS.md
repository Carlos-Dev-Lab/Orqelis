# Guía Maestra de Git y Commits: Estándares de Ingeniería

Esta guía establece los estándares de calidad para el control de versiones en nuestros proyectos. Como Tech Lead, espero que sigas estas prácticas para garantizar un historial limpio, trazable y profesional.

---

## 1. La Anatomía de un Commit Perfecto

Un mensaje de commit debe explicar **por qué** se hizo el cambio, no solo qué cambió. Seguimos el estándar de [Conventional Commits](https://www.conventionalcommits.org/).

### Estructura
```text
<tipo>[alcance opcional]: <descripción corta en imperativo>

[cuerpo opcional: explicación detallada]

[pie de página opcional: referencias a tickets o cambios de ruptura]
```

### Tipos de Commit
- `feat`: Una nueva funcionalidad.
- `fix`: Corrección de un error.
- `docs`: Solo cambios en documentación.
- `style`: Cambios de formato (espacios, comas) que no afectan el código.
- `refactor`: Cambio de código que no arregla un bug ni añade una función.
- `perf`: Mejora de rendimiento.
- `test`: Añadir o corregir pruebas.
- `build`: Cambios en el sistema de construcción o dependencias (ej: pnpm, docker).
- `ci`: Cambios en configuración de CI/CD (GitHub Actions).
- `chore`: Tareas de mantenimiento (limpieza, actualizaciones menores).

---

## 2. Convenciones de Trabajo (Workflows)

Dependiendo del tamaño del equipo y la velocidad del proyecto, aplicamos:

### Git Flow (Proyectos Grandes/Lanzamientos Programados)
- `main`: Código productivo, siempre estable.
- `develop`: Rama de integración para desarrollo.
- `feature/*`: Funcionalidades nuevas (salen de `develop`).
- `hotfix/*`: Arreglos críticos (salen de `main` y vuelven a `main` y `develop`).

### Trunk-Based Development (Proyectos Ágiles/Equipos Senior)
- Ramas de vida muy corta (1-2 días).
- Integración frecuente a `main`.
- Uso de *Feature Flags* para ocultar funciones no terminadas.

---

## 3. Cuándo y Cómo hacer Commits

### La Regla de Oro: Commits Atómicos
Cada commit debe representar **una sola unidad lógica**. Si arreglas un bug y refactorizas una función, haz dos commits.

✅ **Hacer commit cuando:**
- Una pequeña parte de la tarea funciona y pasa los tests.
- Has terminado un "bloque" lógico (ej: el esquema de la base de datos).
- Quieres guardar progreso antes de una maniobra arriesgada.

❌ **Evitar commit cuando:**
- El código no compila.
- Tienes archivos basura o secretos (ej: `.env`).
- Has mezclado cambios de diferentes tareas.

### Cómo dividir cambios grandes (`git add -p`)
Si has trabajado mucho y tienes cambios mezclados, usa:
```bash
git add -p
```
Esto te permite elegir qué líneas añadir al commit, permitiéndote separar una tarde de trabajo en 5 commits limpios.

---

## 4. Ejemplos de Commits: El Arte de la Claridad

| Estado | Mensaje | Razón |
| :--- | :--- | :--- |
| ❌ **Pobre** | `fix bug` | ¿Qué bug? ¿En qué componente? Inútil para auditoría. |
| ❌ **Pobre** | `update styles` | Muy vago. ¿Cambiaron colores, márgenes o layout? |
| ✅ **Excelente** | `fix(web): solve memory leak in NoteModal useEffect` | Indica el área, el problema y la causa técnica. |
| ✅ **Excelente** | `feat(api): add JWT authentication to user login` | Claro, conciso y describe el valor añadido. |

---

## 5. Ejemplos Reales por Especialidad

| Especialidad | Ejemplo de Mensaje |
| :--- | :--- |
| **Frontend** | `feat(ui): implement responsive navbar for mobile devices` |
| **Backend** | `fix(auth): salt password hashing with bcrypt cost factor 12` |
| **APIs** | `feat(api): add rate limiting to /v1/search endpoint` |
| **Bases de Datos** | `chore(db): create migration for user_sessions table` |
| **DevOps** | `ci: deploy to staging environment on push to develop` |
| **IA / ML** | `perf(model): reduce inference time by pruning redundant weights` |

---

## 5. El Workflow Profesional (Paso a Paso)

1. **Sincronizar:** Asegúrate de tener lo último.
   ```bash
   git checkout main && git pull origin main
   ```
2. **Crear Rama:** Usa nombres descriptivos.
   ```bash
   git checkout -b feat/user-authentication
   ```
3. **Desarrollar:** Escribe código y tests.
4. **Commit:** Atómico y bien escrito.
   ```bash
   git add .
   git commit -m "feat(auth): implement Google OAuth2 provider"
   ```
5. **Revisar:** Antes de subir, mira tus propios cambios.
   ```bash
   git diff main..HEAD
   ```
6. **Publicar:** Sube tu rama al servidor.
   ```bash
   git push origin feat/user-authentication
   ```
7. **Pull Request (PR):** Crea la solicitud en GitHub/GitLab. Pide revisión.
8. **Fusión (Merge):** Una vez aprobado, usa **Squash and Merge** para mantener el historial de `main` lineal.

---

## 6. Errores Comunes y Cómo Evitarlos

1. **Mensajes Genéricos:** `update`, `fix`, `more changes` son inaceptables.
2. **Commits Gigantes:** Si el PR tiene +500 líneas, es muy difícil de revisar. Divide y vencerás.
3. **Olvidar el Linter:** Haz que tu código sea consistente antes de subirlo.
4. **No usar `.gitignore`:** Nunca subas la carpeta `node_modules` o archivos de configuración local.

---

## 7. Consejos para Revisiones de Código
- **Sé descriptivo:** El mensaje del commit debe ayudar al revisor a entender tu intención.
- **Usa el cuerpo del commit:** Si la lógica es compleja, explica el "por qué" en el cuerpo del mensaje (dejando una línea en blanco tras la descripción corta).

---

## 8. Gestión según el Contexto (Personal, Equipo, Open Source)

### Proyectos Personales
- Sé tu propio Tech Lead. Mantener la disciplina de commits limpios te ayudará a retomar proyectos meses después sin perder el contexto.

### Proyectos de Equipo
- **Consistencia:** Sigue las reglas del equipo aunque prefieras otras.
- **Trazabilidad:** Incluye el ID del ticket de Jira/Trello en el pie del commit (ej: `Ref: #102`).

### Código Abierto (Open Source)
- **Extrema Claridad:** Los mantenedores no te conocen. Explica detalladamente en el cuerpo del commit por qué tu cambio es necesario.
- **Sigue el `CONTRIBUTING.md`:** Cada proyecto tiene sus propias reglas. Léelas antes del primer commit.

---

## 9. Glosario de Comandos Útiles para el Tech Lead

- `git commit --amend`: Corrige el último commit (si aún no lo has subido).
- `git rebase -i HEAD~n`: Permite fusionar o renombrar commits antiguos de forma interactiva.
- `git log --oneline --graph --all`: Visualiza el historial de ramas de forma gráfica.
- `git checkout -`: Vuelve a la rama anterior inmediatamente.
- `git cherry-pick <hash>`: Trae un commit específico de otra rama a la tuya.

---
*Documento creado por la Guía de Tech Lead - 2026*

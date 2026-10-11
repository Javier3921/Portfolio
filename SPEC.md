# SPEC del portafolio

Bloques de trabajo, el más reciente primero. Cada uno se aprueba antes de programar.

## Bloque 2 — "Color, portada, caso de trabajo y movimiento" (implementado, sin desplegar, 2026-10-11)

Problema: el sitio se siente plano. Es casi todo blanco y negro, el color solo
aparece en etiquetas pequeñas y la portada muestra un adorno (portátil 3D con
logos) en lugar del trabajo real. Las certificaciones y las cifras compiten con
la experiencia en lugar de apoyarla.

Dirección: se mantiene la identidad (Playfair Display + Plus Jakarta Sans, tema
claro/oscuro, colores de marca por tecnología, diagramas de Proyectos) y se le
añade **un color propio** y **profundidad**. Tono técnico y sobrio.

### Qué se construye

1. **Color de acento: verde azulado (teal)**, elegido por Javier en la vista previa.
   - Claro `#0f766e` (texto blanco encima, contraste ≥ 4.5:1); oscuro `#2dd4bf` (texto oscuro encima).
   - Se usa en: botón principal, enlaces, etiquetas de sección, números destacados,
     indicador de la sección activa en el menú, foco (`:focus-visible`), puntos
     de la línea de tiempo, líneas animadas de los diagramas y `cv.html`.
   - No se usa en: títulos ni texto de lectura (siguen en tinta), ni en las
     etiquetas de tecnología (siguen con el color de su marca).
2. **Profundidad en las secciones.**
   - Bandas de fondo alternas con un tono un poco distinto (`--bg-secondary`).
   - Cuadrícula de puntos y un brillo teal muy tenue detrás de la portada.
   - Etiquetas de sección numeradas ("01 · Perfil") para dar ritmo.
3. **Números grandes** en Playfair con el color de acento: cifras de Perfil y
   "01/02/03" de Especialidades.
4. **Portada nueva.**
   - Título: "Javier Fiestas" y debajo el rol **fijo**, "Analista de Datos y
     Automatización". Se quita el texto que se escribe solo.
   - A la derecha, en lugar del portátil 3D, un **diagrama animado de tu flujo de
     trabajo**: fuentes (Zoho CRM, Excel/Zoho Sheet, APIs) → validación
     (duplicados, prioridad por fecha) → SQL (JOIN / GROUP BY) → dashboard (un
     mini gráfico que se dibuja). Mismo lenguaje visual que los diagramas de Proyectos.
   - Botones visibles sin hacer scroll también en móvil.
   - Se elimina el código del portátil, de la sincronización del portátil con
     GitHub y las imágenes de `Animation/Tecnologias` si nada más las usa.
5. **Sección "Caso de trabajo"** (después de Experiencia), anonimizada:
   contexto → problema → qué construí → resultado, con un diagrama del flujo.
   - Fuentes: el CV real, el texto actual de la web y el proyecto
     informe técnico interno que aportó Javier.
   - Sin nombres de clientes, montos, capturas internas ni datos del estudio que
     no estén ya públicos en el CV. Solo cifras que Javier confirme (hoy: 244 mil registros).
6. **Certificaciones como secundarias.**
   - La tarjeta "Certificaciones" sale de las cifras de Perfil. Queda una línea
     discreta ("4 certificaciones en ciberseguridad →") que abre el modal actual.
   - Las cifras quedan: **2** años de experiencia · **244 mil** registros
     procesados · **4** proyectos personales. "244 miles" pasa a leerse "244 mil".
7. **Movimiento con intención** (siempre con `prefers-reduced-motion`):
   - Los diagramas **se dibujan** al entrar en pantalla (las líneas se trazan y
     luego empieza el flujo).
   - Las cifras de Perfil cuentan hacia arriba, como hoy pero con el nuevo estilo.
   - El indicador teal del menú se desliza a la sección activa.
8. **Fecha de fin del trabajo.** "Actualidad" pasa a la fecha que confirme Javier
   en la web (español e inglés), `cv.html`, el chatbot (`api/chat.js` y FAQ) y el README.
   "Mi rol actual" se reescribe en pasado. Se mantiene "Disponible para nuevas oportunidades".

### Qué NO se construye
- Capturas de proyectos (Javier las añadirá más adelante).
- Nuevas cifras de resultado que no estén confirmadas.
- Cambios en el chatbot salvo la fecha y el caso de trabajo.

### Reglas duras
- Las del bloque 1 siguen vigentes: sin teléfono ni distrito, sin cifras ni
  afirmaciones inventadas, sin frameworks ni build.
- Nada confidencial del exempleador: el caso de trabajo describe el tipo de
  problema y la solución, no datos de clientes ni del estudio.
- Contraste AA en ambos temas para todo texto sobre teal o en teal.
- Todo el texto nuevo traducido en español e inglés.

### Criterios de aceptación
- [x] La portada muestra nombre, rol fijo, los dos botones y el diagrama animado, sin el portátil; a 390 px los botones se ven sin scroll.
- [x] El teal aparece en los sitios listados y en ningún texto de lectura; el contraste es AA en claro y oscuro (comprobado).
- [x] Las secciones alternan fondo y la portada tiene la cuadrícula de puntos.
- [x] La sección "Caso de trabajo" existe, está traducida y no contiene datos de clientes ni cifras no confirmadas.
- [x] Las certificaciones ya no son una tarjeta de cifra; el modal sigue abriéndose desde la nueva línea.
- [x] Los diagramas se dibujan al aparecer; con "reducir movimiento" se ven completos y quietos.
- [x] Ningún archivo publicado dice "Actualidad" para el trabajo en el estudio.
- [x] Capturas a 390 px y 1440 px, en claro y oscuro, sin solapes; el detector de impeccable no añade avisos nuevos.

### Decisiones confirmadas (2026-10-11)
- **Cambio en la portada (pedido por Javier tras ver el diagrama):** en lugar del diagrama SVG va una
  escena animada que mezcla las ideas 1, 2 y 4 con el portátil: portátil flotante cuya pantalla es una
  terminal que escribe SQL → resultado → gráfico y un script de Python que quita duplicados; tarjetas de
  dashboard flotando en 3D que se inclinan con el ratón; y el robot del chatbot sentado al lado (sigue el
  cursor con los ojos y abre el chat). Mientras la portada está en pantalla se oculta el robot flotante.
  Con "reducir movimiento": escena quieta en su estado final. Datos de la terminal: ilustrativos, sin
  cifras sobre Javier salvo "244 mil registros" (ya confirmada).
- Color teal elegido por Javier en la vista previa.
- Fuente del caso de trabajo: el informe técnico interno del proyecto (sep 2026), anonimizado.
- Cifras del caso (4 secciones, 20+ endpoints, 247+ proyectos, máx. 2 consultas simultáneas, caché de 45 s) tomadas de ese informe; pendiente el OK explícito de Javier antes de desplegar.
- Javier terminó en el estudio en **setiembre de 2026**.
- Extra dentro del criterio de contraste: `--text-muted` sube a AA en ambos temas y el foco visible pasa a ser global.
- Comprobado: 2 páginas A4 en la impresión de `cv.html`; detector de impeccable de 23 a 10 avisos (ninguno nuevo de este bloque).

---

## Bloque 1 — "Proyectos + CV web" (hecho, 2026-10-11)

Origen: crítica de diseño del 2026-10-10 (`.impeccable/critique/`), puntuación 19/32.
Problemas que resuelve este bloque: el botón principal "Solicitar CV" no funciona,
los proyectos no demuestran nada (icono genérico, carrusel que esconde 3 de 4,
Finance enterrado) y hay información incorrecta sobre los proyectos.

Dirección visual: **refinamiento, no rediseño**. Se mantiene la paleta editorial
blanco/negro, Playfair Display + Plus Jakarta Sans, los iconos con color de marca
por tecnología y el tema claro/oscuro. Tono técnico y sobrio.

### Qué se construye

#### 1. Página `cv.html` (CV web)
Página aparte, inspirada en la estructura de nathalyingol.netlify.app/resume/
pero con la identidad de este sitio. Un botón "Ver CV" del hero lleva a ella.

- **Cabecera:** nombre, rol ("Analista de Datos y Automatización"), Lima, Perú,
  correo, LinkedIn y GitHub. **Sin teléfono ni distrito.**
- **Barra de acciones:** volver al portafolio, cambiar tema, ES/EN e
  **"Imprimir / Guardar PDF"** (con `@media print`, para que el reclutador
  obtenga un PDF limpio, sin teléfono, generado desde la propia página).
- **Secciones, en este orden:**
  1. Perfil profesional (resumen corto).
  2. Experiencia (línea de tiempo): los 8 puntos del CV real.
  3. Proyectos: los 4 de GitHub, con 1–2 líneas, stack y enlace.
  4. Habilidades técnicas, agrupadas como en el CV (sin nivel, ver decisiones)
  5. Educación: Bachiller en Ingeniería de Sistemas, Universidad de Lima.
  6. Idiomas.
  7. Certificaciones: las 4 actuales.
- **Idiomas de la página:** español e inglés (hay CV en ambos). Si el sitio
  está en pt/fr/zh, se muestra el inglés.
- Responsive (390 px → escritorio) y con buena impresión en A4.

#### 2. Sección Proyectos como casos de estudio
- **Se quita el carrusel.** En su lugar va una cuadrícula: **Finance destacado**
  a ancho completo y los otros 3 debajo (3 columnas en escritorio, 1 en móvil).
- **Cada tarjeta lleva:**
  - un **diagrama de arquitectura en SVG inline**, hecho a partir del README
    real del repo. Reemplaza el bloque de icono y se adapta al tema claro/oscuro;
  - problema → solución en 2 líneas, y 2–3 datos técnicos verificables
    del README (p. ej. "42 tests", "RLS + rol de mínimo privilegio",
    "audio procesado en local");
  - las etiquetas del stack y los enlaces "Código" / "Ver README".
- **Todo el contenido queda curado en el HTML y traducido a español e inglés.**
  La sección deja de depender de la API de GitHub. Las tarjetas automáticas
  de repos nuevos se eliminan: un repo nuevo se añade a mano, a propósito.
- El contador "Proyectos personales" pasa a ser un número fijo (4).

#### 3. Correcciones ligadas
- **Extractor:** "produce un PDF" → informe en **HTML y/o Markdown**, con
  Gemini o Claude Code (según su README). Se corrige en la web, en las 5
  traducciones, en el chatbot (`api/chat.js` y FAQ) y en el README.
- **Nombre único:** "Finanzas Gestor (Finance)", igual en la tarjeta, el CV y el chatbot.
- **Se elimina el modal "Solicitar CV"** y su integración con EmailJS
  (script del CDN, configuración y textos i18n).
- **Móvil:** el robot flotante deja de tapar el texto (más pequeño y con
  espacio reservado al final del contenido).

### Qué NO se construye en este bloque
- Rediseño de la portada (portátil 3D → visual de datos), la sección "Caso de
  trabajo" de BI ni los contadores de resultado. Van en el siguiente bloque.
- Capturas reales de los proyectos (no hay); los diagramas las sustituyen.
- Métricas inventadas: solo se muestran datos que estén en el CV o en los README.
- Topics de GitHub (AudioReport-AI, Extractor): los pones tú en GitHub.

### Reglas duras
- Nada de teléfono, dirección ni distrito en ningún archivo publicado.
- Ninguna cifra ni afirmación que no esté en el CV real o en los README.
- Sin frameworks ni build: HTML/CSS/JS como el resto del sitio.
- Las animaciones respetan `prefers-reduced-motion`, y el contenido no puede quedar invisible con ella.
- Foco visible (`:focus-visible`) en todo lo interactivo nuevo.

### Criterios de aceptación
- [x] "Ver CV" en el hero abre `cv.html`; desde `cv.html` se vuelve al portafolio.
- [x] `cv.html` no contiene el número de teléfono, el distrito ni la palabra "Teléfono" (comprobado con grep).
- [x] La vista de impresión de `cv.html` cabe en A4 sin elementos de navegación.
- [x] La sección Proyectos muestra las 4 tarjetas a la vez, sin carrusel, y Finance va primero.
- [x] Con la API de GitHub bloqueada, Proyectos se ve completa y el contador dice 4.
- [x] Ningún texto dice que el Extractor genera PDF (grep en `index.html`, `api/chat.js` y `README.md`).
- [x] No queda ninguna referencia a EmailJS en `index.html`.
- [ ] Capturas a 390 px y 1440 px, en tema claro y oscuro, de Proyectos y de `cv.html`, sin solapes; el robot no tapa texto en móvil.
  _(Capturas hechas y sin solapes en Proyectos y CV. Falta comprobar en un móvil real que el robot ya no tape texto: en headless no se pudo medir.)_
- [x] El detector de impeccable no introduce nuevos avisos de contraste ni de texto pequeño en lo añadido.

### Decisiones confirmadas (2026-10-10)
- Spec aprobado por Javier.
- Educación: Universidad de Lima, julio 2020 – agosto 2026 (Bachiller obtenido en agosto 2026).
- Idiomas en el CV web: Español (nativo); Inglés: conversación intermedio, escritura intermedio.
- (2026-10-11) Habilidades del CV web **sin nivel**: se muestran como chips con el
  color de marca de cada herramienta y entrada animada escalonada (respeta
  `prefers-reduced-motion`; en impresión salen estáticos). Los idiomas sí conservan su nivel.

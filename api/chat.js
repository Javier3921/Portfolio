// api/chat.js — Función serverless de Vercel.
// Hace de intermediario entre el chatbot del sitio y la API de Gemini: la
// API key vive SOLO acá, como variable de entorno del proyecto en Vercel
// (Settings -> Environment Variables), nunca en el HTML/JS que descarga el
// navegador. Si el fetch desde el frontend falla por cualquier motivo
// (endpoint caído, key sin configurar, cuota agotada), el chatbot cae de
// vuelta a su set de respuestas predefinidas — ver index.html.
//
// Variables de entorno usadas:
//   GEMINI_API_KEY  (obligatoria) - de https://aistudio.google.com/apikey
//   GEMINI_MODEL    (opcional)    - por defecto "gemini-3.6-flash" (revisar
//                                   ai.google.dev/gemini-api/docs/models si
//                                   Google la vuelve a renombrar)
//   SITE_ORIGIN     (opcional)    - dominio del sitio permitido por CORS. Por
//                                   defecto javier-fiestas.vercel.app (y el
//                                   dominio antiguo, por si sigue activo); solo
//                                   hace falta si cambia (ej. un dominio propio). El propio sitio llama a
//                                   /api/chat desde su mismo dominio, así que
//                                   esto no afecta a `vercel dev` ni a las
//                                   previews de Vercel.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
// El dominio antiguo (portfolio-mu-wine-90) se sigue aceptando por si Vercel
// lo mantiene como alias tras el cambio de nombre.
const ALLOWED_ORIGINS = process.env.SITE_ORIGIN
  ? [process.env.SITE_ORIGIN]
  : ['https://javier-fiestas.vercel.app', 'https://portfolio-mu-wine-90.vercel.app'];
const MAX_HISTORY = 6; // ventana corta para ahorrar tokens, no toda la conversación
const MAX_CHARS = 500; // recorte defensivo por mensaje

// Límite de peticiones por IP, en memoria. Es "de mejor esfuerzo": Vercel
// puede tener varias instancias de la función y reiniciarlas en cualquier
// momento, así que no es un tope exacto — solo frena a quien martillea el
// endpoint desde una misma IP para agotar la cuota gratuita de Gemini. Un
// límite estricto necesitaría un almacén compartido (ej. Upstash Redis).
const RATE_LIMIT = 15;            // peticiones...
const RATE_WINDOW_MS = 60 * 1000; // ...por minuto y por IP
const hits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // evita que el mapa crezca sin límite
  return recent.length > RATE_LIMIT;
}

const SYSTEM_PROMPT = `Eres el asistente virtual del sitio de portafolio de Javier Fiestas Calixto, Bachiller en Ingeniería de Sistemas por la Universidad de Lima y Analista de Datos y Automatización con cerca de 2 años de experiencia en Business Intelligence, automatización de procesos e integración de sistemas.

Información sobre Javier que puedes usar para responder (es la ÚNICA fuente válida):
- Experiencia: Practicante / Analista de Automatización y Datos en Payet, Rey, Cauvi, Pérez Abogados (Lima), de agosto de 2024 a septiembre de 2026. Ya no trabaja ahí: terminó su etapa de prácticas profesionales en septiembre de 2026 y hoy busca nuevas oportunidades. Si preguntan por qué salió, la respuesta es esa (fin de sus prácticas); no agregues otros motivos. Habla de ese trabajo en pasado. Dashboards en Zoho Analytics, consultas SQL (JOIN, GROUP BY, funciones de agregación), automatizaciones end-to-end con Zoho CRM, Zoho Flow, Deluge y Power Automate Desktop, scripts en Python para procesamiento de datos y comunicaciones masivas, integración de sistemas vía APIs REST y Zoho CRM API (OAuth 2.0).
- Caso de trabajo destacado (proyecto interno del estudio, código privado): un dashboard de transacciones y proyectos públicos. Backend en Node.js/Express que hace de puente con Zoho Analytics (SQL) y Zoho CRM (OAuth 2.0), y frontend en React con D3 y Chart.js: contactos, transacciones, dashboard con filtros cruzados y KPIs, y un mapa interactivo del Perú con más de 247 proyectos públicos. Más de 20 endpoints REST. Decisiones técnicas: cola de concurrencia (máximo 2 consultas a la vez) con reintentos ante errores 502/503/504, caché en memoria de 45 segundos, deduplicación con GROUP BY dentro de Zoho y descarte de respuestas desordenadas con un número de turno. No des nombres de clientes ni datos internos del estudio.
- Tecnologías (las mismas de la sección Skills del sitio):
  · Datos y BI: SQL, Power BI, Excel, D3.js y Chart.js.
  · Herramientas Zoho (su especialidad): Zoho Analytics, Zoho CRM, Zoho Flow, Zoho Sheet, Deluge y las APIs de Zoho Analytics y Zoho CRM.
  · Automatización e integración: Python, Power Automate Desktop, APIs REST, OAuth 2.0, Telegram Bot API, FFmpeg y yt-dlp.
  · Desarrollo web y backend: JavaScript, HTML, CSS, React, Node.js, Express.js, Flask y Streamlit.
  · Bases de datos y cloud: PostgreSQL, Supabase, SQLAlchemy, Oracle SQL Developer, Oracle SQL Data Modeler, SQL Server Management Studio, Vercel, Oracle Cloud, Git y GitHub Actions.
  · IA generativa: ChatGPT, Gemini (API), Claude y Claude Code para desarrollar, revisar y documentar código, y Whisper para transcribir audio (Whisper solo transcribe; las traducciones de sus proyectos las hace Gemini o Claude).
- Modalidad de trabajo: se adapta a cualquier modalidad (remota, híbrida o presencial), aunque prefiere el trabajo remoto o híbrido.
- Nivel: si preguntan si es junior, semi-senior o senior, no le pongas etiqueta; responde con hechos (cerca de 2 años de experiencia, el caso del dashboard y sus 4 proyectos publicados) y deja que la persona saque su conclusión.
- Proyectos personales (todos con código público en GitHub):
  1) "Extractor de Texto de Video": herramienta CLI en Python que transcribe vídeos de TikTok o archivos locales con Whisper, detecta el idioma, traduce con IA (Gemini o Claude Code) y genera un informe técnico en HTML y/o Markdown; solo descarga el audio, nunca el vídeo. github.com/Javier3921/Extractor_texto_tiktok
  2) "Finanzas Gestor": registra gastos desde Telegram (texto libre o foto del comprobante) y los analiza en un dashboard web con presupuestos y alertas. Python, SQLAlchemy, Streamlit y Supabase, desplegado 24/7 en Oracle Cloud a costo cero. github.com/Javier3921/Finance
  3) "AudioReport-AI": genera informes técnicos en HTML a partir de grabaciones de reuniones; transcribe con Whisper en local (sin subir el audio a la nube) y analiza el contenido con Claude Code. github.com/Javier3921/AudioReport-AI
  4) Este mismo portafolio: sitio estático en HTML, CSS y JavaScript, con este chatbot conectado a la API de Gemini mediante una función serverless en Vercel. github.com/Javier3921/Portfolio
- Educación: Bachiller en Ingeniería de Sistemas, Universidad de Lima (julio 2020 – agosto 2026; bachiller obtenido en agosto de 2026).
- Idiomas: español nativo; inglés intermedio (conversación y escritura).
- Certificaciones: Ciberseguridad - Ethical Hacking (C|EH) por la Universidad Nacional de Ingeniería/CTIC, Ethical Hacking Essentials (EHE) por la Universidad de Lima, Introduction to Cybersecurity y Linux Unhatched, ambas de Cisco Networking Academy.
- Contacto: javierfiestas44@gmail.com, LinkedIn linkedin.com/in/javier-fiestas-6457ba240, GitHub github.com/Javier3921. Ubicado en Lima, Perú. Está abierto a nuevas oportunidades laborales. Su CV completo se puede ver con el enlace "Ver CV" de la barra superior del sitio o el botón de la portada.
- Datos que NO tienes: edad, pretensiones salariales, fecha exacta de disponibilidad, vida personal y hobbies. Si preguntan por ellos, di que esa información no está en su perfil y sugiere contactarlo; no deduzcas nada (por ejemplo, no digas que en su tiempo libre programa).

Reglas de estilo (muy importante, sé breve — evita párrafos largos):
- Idioma: responde siempre en el idioma del ÚLTIMO mensaje del usuario, aunque la conversación anterior fuera en otro: en español si está en español y en inglés si está en inglés.
- Si el último mensaje está escrito en cualquier otro idioma (portugués, francés, chino, etc.), no lo respondas: contesta únicamente, tal cual, "Please ask your questions in English and/or Spanish, thank you!". En inglés, su grado es "Bachelor's degree in Systems Engineering".
- No escribas URLs ni direcciones web (excepto el correo). Cuando menciones un proyecto, usa su nombre exacto (Extractor de Texto de Video, Finanzas Gestor, AudioReport-AI o "este portafolio"); el chat agrega automáticamente debajo de tu respuesta un enlace a su repositorio de GitHub. Lo mismo con LinkedIn y GitHub: basta con nombrarlos.
- Escribe en texto plano: nada de Markdown (sin **negritas**, sin _cursivas_, sin encabezados #). El chat solo muestra texto simple, así que el formato Markdown se vería roto (asteriscos literales). Para listas usa saltos de línea simples con un guion, como en el ejemplo de proyectos de abajo.
- Responde en 2-3 oraciones cortas como máximo por respuesta (la lista de proyectos es la única excepción, ver el formato de abajo).
- Responde SOLO lo que te preguntan puntualmente, sin agregar información extra que no pidieron. Ejemplo: si preguntan SOLO en qué empresa trabaja o dónde trabaja, responde nada más el nombre de la empresa (ej. "Su último trabajo fue en Payet, Rey, Cauvi, Pérez Abogados, hasta septiembre de 2026. ¿Quieres saber más sobre su rol ahí?") sin mencionar el cargo todavía. Si además preguntan por el cargo (o lo preguntan junto con la empresa), agrega el cargo — pero no listes automáticamente todas sus funciones/tareas salvo que te lo pidan explícitamente.
- Si preguntan por sus proyectos, responde con este formato (un renglón por proyecto, nombre + descripción de máximo 8-10 palabras, usando los proyectos reales de la sección "Información sobre Javier" de arriba):
  "Tiene 4 proyectos personales:
  - Extractor de Texto de Video: transcribe y traduce vídeos con IA.
  - Finanzas Gestor: control de gastos desde Telegram con dashboard.
  - AudioReport-AI: informes en HTML a partir de reuniones grabadas.
  - Este portafolio: sitio web con chatbot conectado a Gemini.
  ¿Quieres que te cuente más sobre alguno?"
- Si preguntan si eres una IA, responde con sinceridad: eres un asistente basado en Google Gemini, configurado para responder sobre el perfil de Javier.
- Termina TODAS tus respuestas (excepto un simple saludo) con una pregunta corta invitando a seguir la conversación — varía la frase, por ejemplo "¿quieres que te cuente más sobre esto?", "¿tienes otra consulta?", "¿te comparto algo más?".
- Si te preguntan algo general como "cuéntame de ti" o "quién eres", da un resumen de 2 oraciones como máximo (no repitas toda la información de golpe) y ofrece profundizar en lo que le interese en la pregunta de cierre.
- Solo respondes preguntas sobre el perfil profesional de Javier: su experiencia, tecnologías, proyectos, educación, certificaciones o cómo contactarlo.
- Si preguntan sobre cualquier otro tema (no relacionado a Javier ni a su perfil profesional), responde amablemente que solo puedes hablar sobre el perfil de Javier y sugiere el formulario de contacto para otras consultas. No desarrolles el tema ajeno ni intentes ayudar con él.
- Las preguntas pueden ser vagas ("¿qué hace?", "¿trabaja?", "¿dónde estudia?"): interprétalas en el contexto del perfil de Javier y de la conversación previa, y responde con el dato concreto que corresponde.
- Si te piden opinar o convencer (por ejemplo "¿por qué contratarlo?"), argumenta solo con hechos concretos de esta información (el dashboard con más de 20 endpoints y el mapa de más de 247 proyectos, sus automatizaciones con Zoho, sus 4 proyectos publicados), sin adjetivos exagerados como "experto" o "avanzado".
- No inventes datos que no estén en esta información. No agregues detalles, cifras ni preferencias que no figuren aquí, aunque parezcan razonables. Llámalo "Bachiller en Ingeniería de Sistemas", nunca "Ingeniero". Si no sabes algo específico, dilo y sugiere contactar a Javier directamente.`;

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  // Un navegador que llama desde otro sitio manda su propio Origin: se
  // rechaza aquí, no solo por CORS (CORS solo impide LEER la respuesta, la
  // llamada a Gemini se haría igual). Las llamadas desde el mismo dominio
  // pueden no traer Origin, y curl/scripts pueden falsearlo — para esos
  // queda el límite por IP de abajo.
  const host = req.headers.host;
  if (origin && !ALLOWED_ORIGINS.includes(origin) && origin !== `https://${host}` && origin !== `http://${host}`) {
    return res.status(403).json({ error: 'forbidden_origin' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || (req.socket && req.socket.remoteAddress) || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ error: 'rate_limited' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'not_configured' });

  const body = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'missing_message' });

  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];
  const contents = history
    .filter((m) => m && typeof m.text === 'string' && (m.role === 'user' || m.role === 'model'))
    .map((m) => ({ role: m.role, parts: [{ text: m.text.slice(0, MAX_CHARS) }] }));
  contents.push({ role: 'user', parts: [{ text: message.slice(0, MAX_CHARS) }] });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        // La key va en cabecera y no en la URL, para que no quede en trazas
        // ni mensajes de error que incluyan la URL completa.
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: {
            // Calibrado con datos reales: incluso en "low", el pensamiento
            // invisible llegó a usar ~240 tokens en una prueba (más ~50 de
            // respuesta visible) — 600 deja margen de sobra sin ser
            // excesivo (sigue siendo centavos en el tier gratuito).
            maxOutputTokens: 600,
            temperature: 0.4,
            // "low" reduce al mínimo el razonamiento interno (invisible)
            // que en los modelos 3.x consume parte del maxOutputTokens
            // antes de escribir la respuesta visible — así se evitan
            // respuestas cortadas y se ahorra costo/latencia en un caso de
            // uso simple como este. Es el nombre de campo específico de la
            // familia Gemini 3.x; si GEMINI_MODEL vuelve a un modelo 2.5,
            // este campo se ignora/puede dar error y habría que cambiarlo
            // por "thinkingBudget: 0".
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '');
      console.error('Gemini API error:', geminiRes.status, errText);
      return res.status(502).json({ error: 'gemini_error' });
    }

    const data = await geminiRes.json();
    const reply = (data.candidates && data.candidates[0] && data.candidates[0].content
      && data.candidates[0].content.parts || [])
      .map((p) => p.text || '').join('').trim();

    if (!reply) return res.status(502).json({ error: 'empty_reply' });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'proxy_error' });
  }
};

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
//   SITE_ORIGIN     (opcional)    - dominio final del sitio para restringir
//                                   CORS (ej. "https://tu-sitio.vercel.app").
//                                   Mientras no se configure, acepta cualquier
//                                   origen (útil para probar antes de tener
//                                   el dominio definitivo).

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const ALLOWED_ORIGIN = process.env.SITE_ORIGIN || '*';
const MAX_HISTORY = 6; // ventana corta para ahorrar tokens, no toda la conversación
const MAX_CHARS = 500; // recorte defensivo por mensaje

const SYSTEM_PROMPT = `Eres el asistente virtual del sitio de portafolio de Javier Fiestas Calixto, Bachiller en Ingeniería de Sistemas por la Universidad de Lima y Analista de Datos con cerca de 2 años de experiencia en Business Intelligence, automatización de procesos e integración de sistemas.

Información sobre Javier que puedes usar para responder:
- Experiencia: Practicante / Analista de Automatización y Datos en Payet, Rey, Cauvi, Pérez Abogados (Lima), desde agosto de 2024. Dashboards en Zoho Analytics, consultas SQL (JOIN, GROUP BY, funciones de agregación), automatizaciones end-to-end con Zoho CRM, Zoho Flow, Deluge y Power Automate Desktop, scripts en Python para procesamiento de datos y comunicaciones masivas, integración de sistemas vía APIs REST y Zoho CRM API (OAuth 2.0).
- Tecnologías principales: SQL, Python, Power BI, Zoho (Analytics, CRM, Flow, Sheet), Excel, JavaScript, React, Node.js, Express.js, Oracle SQL Developer, SQL Server Management Studio, y herramientas de IA generativa (ChatGPT, Gemini, Claude) para desarrollo y documentación de código.
- Proyectos personales: "Extractor de Texto de Video" (herramienta en Python que transcribe y traduce vídeos con Whisper, código público en github.com/Javier3921/Extractor_texto_tiktok) y "Finanzas Gestor" (bot de Telegram para control de gastos con dashboard en Streamlit y base de datos en Supabase, desplegado 24/7 en Oracle Cloud, repositorio privado).
- Educación: Bachiller en Ingeniería de Sistemas, Universidad de Lima.
- Certificaciones: Ciberseguridad - Ethical Hacking (C|EH) por la Universidad Nacional de Ingeniería/CTIC, Ethical Hacking Essentials (EHE) por la Universidad de Lima, Introduction to Cybersecurity y Linux Unhatched, ambas de Cisco Networking Academy.
- Contacto: javierfiestas44@gmail.com, LinkedIn linkedin.com/in/javier-fiestas-6457ba240, GitHub github.com/Javier3921. Ubicado en San Miguel, Lima, Perú. Está abierto a nuevas oportunidades laborales.

Reglas de estilo (muy importante, sé breve — evita párrafos largos):
- Responde siempre en español, en texto plano: nada de Markdown (sin **negritas**, sin _cursivas_, sin encabezados #). El chat solo muestra texto simple, así que el formato Markdown se vería roto (asteriscos literales). Para listas usa saltos de línea simples con un guion, como en el ejemplo de proyectos de abajo.
- Responde en 2-3 oraciones cortas como máximo por respuesta (la lista de proyectos es la única excepción, ver el formato de abajo).
- Responde SOLO lo que te preguntan puntualmente, sin agregar información extra que no pidieron. Ejemplo: si preguntan SOLO en qué empresa trabaja o dónde trabaja, responde nada más el nombre de la empresa (ej. "Trabaja en Payet, Rey, Cauvi, Pérez Abogados. ¿Quieres saber más sobre su rol ahí?") sin mencionar el cargo todavía. Si además preguntan por el cargo (o lo preguntan junto con la empresa), agrega el cargo — pero no listes automáticamente todas sus funciones/tareas salvo que te lo pidan explícitamente.
- Si preguntan por sus proyectos, responde con este formato (un renglón por proyecto, nombre + descripción de máximo 8-10 palabras, usando los proyectos reales de la sección "Información sobre Javier" de arriba — ajusta la cantidad si son más o menos de 2):
  "Tiene 2 proyectos personales:
  - Extractor de Texto de Video: transcribe y traduce vídeos con IA.
  - Finanzas Gestor: bot de Telegram para control de gastos.
  ¿Quieres que te cuente más sobre alguno?"
- Termina TODAS tus respuestas (excepto un simple saludo) con una pregunta corta invitando a seguir la conversación — varía la frase, por ejemplo "¿quieres que te cuente más sobre esto?", "¿tienes otra consulta?", "¿te comparto algo más?".
- Si te preguntan algo general como "cuéntame de ti" o "quién eres", da un resumen de 2 oraciones como máximo (no repitas toda la información de golpe) y ofrece profundizar en lo que le interese en la pregunta de cierre.
- Solo respondes preguntas sobre el perfil profesional de Javier: su experiencia, tecnologías, proyectos, educación, certificaciones o cómo contactarlo.
- Si preguntan sobre cualquier otro tema (no relacionado a Javier ni a su perfil profesional), responde amablemente que solo puedes hablar sobre el perfil de Javier y sugiere el formulario de contacto para otras consultas. No desarrolles el tema ajeno ni intentes ayudar con él.
- No inventes datos que no estén en esta información. Si no sabes algo específico, dilo y sugiere contactar a Javier directamente.`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

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
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

import { fetchBotResponse } from './openrouter';
import { fetchLocalContext } from '../data/database';
import { TripParams, ItineraryItem } from '../context/TripContext';

const FINISH_PATTERNS = [
  /termin(e|é|aste)/i, /listo/i, /no (quiero|más|nada más)/i,
  /eso es todo/i, /ya está/i, /complet(o|é)/i,
  /finaliz(a|é|ar)/i, /hecho/i,
];

export const processUserMessage = async (
  message: string,
  tripParams: TripParams,
  currentItinerary: ItineraryItem[],
  username: string = 'viajero'
): Promise<{ text: string, newItinerary?: ItineraryItem[], finished?: boolean }> => {

  const dbContext = await fetchLocalContext();

  const totalPax = tripParams.adultsCount + tripParams.childrenCount;
  const destNames = (dbContext.destinations as any[]).map(d => d.name).join(', ');

  const systemPrompt = `
Eres "AI-Trip Planner", un agente de viajes inteligente.

### PERSONALIDAD
Saludás al usuario por su nombre (${username}) y siempre hablás en español de forma cálida y entusiasta.

### FLUJO DE LA CONVERSACIÓN
${tripParams.destination ? `
1. El usuario YA eligió el destino **${tripParams.destination}** desde el menú de inicio. NO le preguntes qué destino quiere. Directamente buscá en los datos locales los alojamientos, restaurantes y actividades de **${tripParams.destination}** y mostrálos ordenadamente.
2. **DESPUÉS DE CADA SUGERENCIA**: Preguntá "¿Te gustaría agregar algo más o has terminado?"
3. **SI EL USUARIO TERMINA**: Agregá al final de tu respuesta: [FINALIZAR]
` : `
1. **PRIMER MENSAJE**: Saludás al usuario por su nombre y le mostrás TODOS los destinos disponibles de Argentina. Preguntale cuál le gusta.
   Destinos: ${destNames}
2. **CUANDO ELIJA UN DESTINO**: Buscá en los datos locales los alojamientos, restaurantes y actividades de ese destino y mostrálos ordenadamente.
3. **DESPUÉS DE CADA SUGERENCIA**: Preguntá "¿Te gustaría agregar algo más o has terminado?"
4. **SI EL USUARIO TERMINA**: Agregá al final de tu respuesta: [FINALIZAR]
`}

### DATOS LOCALES:
Destinos: ${JSON.stringify(dbContext.destinations)}
Alojamientos: ${JSON.stringify(dbContext.accommodations)}
Restaurantes: ${JSON.stringify(dbContext.restaurants)}
Actividades: ${JSON.stringify(dbContext.activities)}
Promociones Bancarias: ${JSON.stringify(dbContext.promotions)}

### CONTEXTO DEL USUARIO:
Destino Elegido: ${tripParams.destination || 'Aún no definido'}
Presupuesto Máximo Total: $${tripParams.maxBudget > 0 ? tripParams.maxBudget : 'No definido'}
Fechas del Viaje: ${tripParams.startDate || 'No definida'} → ${tripParams.endDate || 'No definida'}
Adultos: ${tripParams.adultsCount} | Niños: ${tripParams.childrenCount}

### REGLAS DE NEGOCIO:
1. Filtrá alojamientos, restaurantes y actividades por el destino que elija el usuario.
2. Mostrá los precios multiplicados por ${totalPax} personas.
3. Incluí las amenities de cada lugar (WiFi, piscina, etc.).
4. Si el precio total supera el presupuesto, advertí al usuario.
5. Aceptá comidas como tipo "Meal".

### ASIGNACIÓN DE DÍAS:
Repartí los ítems recomendados entre los días del viaje. Cada ítem debe incluir el número de día en el campo "day".
Ejemplo: si el viaje es del 01/03 al 03/03 (3 días), asigná alojamiento al día 1, actividades a los días 1 y 2, comidas repartidas, etc.

### FORMATO DE RESPUESTA:
Responde de forma conversacional y amigable.
Si estás recomendando ítems, incluí al final un bloque JSON:
\`\`\`json
[
  { "type": "Accommodation", "name": "Nombre", "price": 120000, "details": "WiFi, Desayuno incluido", "day": 1 },
  { "type": "Meal", "name": "Cena en ...", "price": 15000, "details": "Cocina patagónica, Terraza", "day": 1 },
  { "type": "Activity", "name": "Nombre", "price": 25000, "details": "Agencia: X", "day": 2 }
]
\`\`\`
  `;

  const rawResponse = await fetchBotResponse(message, systemPrompt);

  let text = rawResponse;
  let newItinerary: ItineraryItem[] | undefined = undefined;
  let finished = false;

  if (FINISH_PATTERNS.some(p => p.test(message.trim()))) {
    finished = true;
  }

  const finishMarker = /\[FINALIZAR\]/i;
  if (!finished && finishMarker.test(rawResponse)) {
    finished = true;
  }
  text = rawResponse.replace(finishMarker, '').trim();

  const jsonRegex = /\`\`\`json\s*([\s\S]*?)\s*\`\`\`/i;
  const match = rawResponse.match(jsonRegex);
  
  if (match && match[1]) {
    try {
      newItinerary = JSON.parse(match[1]);
      text = text.replace(jsonRegex, '').trim();
    } catch (e) {
      console.error("Error parseando JSON del LLM:", e);
    }
  }

  if (newItinerary && tripParams.maxBudget > 0) {
    const totalCost = newItinerary.reduce((sum, item) => sum + (item.price * totalPax), 0);
    if (totalCost > tripParams.maxBudget) {
      text += `\n\n⚠️ **Aviso**: El costo total estimado ($${totalCost}) supera tu presupuesto de $${tripParams.maxBudget}. Revisá opciones más económicas.`;
    }
  }

  return { text, newItinerary, finished };
};

import { fetchBotResponse, ChatMessage } from './openrouter';
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
  currentStepIndex: number,
  totalSteps: number,
  username: string = 'viajero',
  chatHistory: ChatMessage[] = []
): Promise<{ text: string, newItinerary?: ItineraryItem[], finishedStep?: boolean, heTerminado?: boolean }> => {

  const dbContext = await fetchLocalContext();

  const totalPax = tripParams.adultsCount + tripParams.childrenCount;
  const destNames = (dbContext.destinations as any[]).map(d => d.name).join(', ');

  // Calculate current step info
  const stepNumber = currentStepIndex + 1; // 1, 2, 3
  const category = currentStepIndex === 0 ? 'Accommodation' : currentStepIndex === 1 ? 'Meal' : 'Activity';
  const categoryName = category === 'Accommodation' ? 'Hospedaje (Alojamiento)' : category === 'Meal' ? 'Restaurantes (Comidas)' : 'Actividades (Excursiones/Actividades)';

  const currentDest = (dbContext.destinations as any[]).find(
    d => d.name.toLowerCase() === (tripParams.destination || '').toLowerCase()
  );
  const destId = currentDest?.id;
  const filteredAccommodations = destId ? (dbContext.accommodations as any[]).filter(a => a.destination_id === destId) : [];
  const filteredRestaurants = destId ? (dbContext.restaurants as any[]).filter(r => r.destination_id === destId) : [];
  const filteredActivities = destId ? (dbContext.activities as any[]).filter(a => a.destination_id === destId) : [];

  const systemPrompt = `
Eres "AI-Trip Planner", un agente de viajes inteligente y servicial.

### PERSONALIDAD Y SALUDOS
- Hablás en español de forma cálida, profesional y entusiasta.
- REGLA CRÍTICA DE SALUDO: Si el paso actual es el Paso 1 (Hospedaje) y es el inicio absoluto de la conversación, saluda al usuario por su nombre (${username}). En cualquier otro mensaje o en los pasos subsiguientes (Paso 2 y Paso 3), NUNCA digas "Hola", "¡Hola!", ni saludes, ni vuelvas a repetir su nombre. Ve directo al grano a responder las consultas y recomendar las opciones correspondientes.

### EMOJIS DE DESTINO
Siempre incluye emojis representativos y fuertemente relacionados con el destino y con la opción en cada recomendación de hospedaje, restaurante y actividad que le presentes al usuario (por ejemplo, para Bariloche usa 🏔️, ❄️, 🏨, 🥩; para Mendoza usa 🍷, 🍇, ⛰️, 🥩; para Buenos Aires usa 🥩, 💃, 🎭, ☕; para Iguazú usa 🌊, 🦜, 🌴; etc.). Cada opción y recomendación listada en tu respuesta debe ir acompañada de al menos un emoji temático adecuado.

### FLUJO DE LA CONVERSACIÓN
Estamos planificando el viaje en 3 pasos secuenciales (no día por día):
- Paso actual: Paso ${stepNumber} de 3.
- Objetivo actual: Planificar **${categoryName}** para todo el viaje.
- Destino del viaje: **${tripParams.destination || 'Aún no definido'}**.

Tu tarea en este turno es:
1. Si estamos en el Paso 1 (Hospedaje): Presentar al usuario los alojamientos disponibles en el destino. El usuario elegirá UN solo hotel para todo el viaje. Cuando el usuario elija el hotel, agrégalo al JSON con tipo "Accommodation", setea "finishedStep": true para avanzar de paso.
2. Si estamos en el Paso 2 (Restaurantes/Comidas): Presentar todos los restaurantes disponibles en el destino. El usuario puede elegir múltiples restaurantes (por ejemplo: "elijo el 3, 7 y 5"). Agrégalos a la lista de "items" como tipo "Meal" en el JSON, y setea "finishedStep": true para avanzar de paso.
3. Si estamos en el Paso 3 (Actividades): Presentar todas las actividades disponibles en el destino. El usuario elegirá las actividades que desea realizar. Agrégalas a la lista de "items" como tipo "Activity" en el JSON. Al seleccionar las actividades, setea "finishedStep": true (o "heTerminado": true) para avanzar.
4. Si el usuario decide omitir o avanzar en cualquier paso (ej. diciendo "siguiente", "omitir", "saltear"), establece "finishedStep": true en el JSON (sin agregar items en el arreglo).
5. Si el usuario decide dar por terminada toda la planificación (ej. diciendo "he terminado", "listo", "ya terminé", "pagar"), establece "heTerminado": true en el JSON.
6. El precio de los items sugeridos en el JSON debe ser el precio UNITARIO, pero en tu conversación menciónalos multiplicados por la cantidad de personas (${totalPax} pasajeros).

### DATOS LOCALES DEL DESTINO (${tripParams.destination}):
Destinos: ${JSON.stringify(dbContext.destinations)}
Alojamientos (Filtrados): ${JSON.stringify(filteredAccommodations)}
Restaurantes (Filtrados): ${JSON.stringify(filteredRestaurants)}
Actividades (Filtrados): ${JSON.stringify(filteredActivities)}
Promociones Bancarias: ${JSON.stringify(dbContext.promotions)}

### CONTEXTO DEL USUARIO:
Destino Elegido: ${tripParams.destination}
Presupuesto Máximo Total: $${tripParams.maxBudget > 0 ? tripParams.maxBudget : 'No definido'}
Fechas del Viaje: ${tripParams.startDate || 'No definida'} → ${tripParams.endDate || 'No definida'}
Pasajeros Totales: ${totalPax} (Adultos: ${tripParams.adultsCount} | Niños: ${tripParams.childrenCount})

### REGLAS DE NEGOCIO:
1. Si el precio total estimado de lo acumulado supera el presupuesto del usuario, adviértele de forma amable.
2. Agrega los alojamientos al carrito como tipo "Accommodation", las comidas como tipo "Meal" y las actividades como "Activity".

### FORMATO DE RESPUESTA:
Responde de forma conversacional, alegre y amigable.
Al final de tu respuesta, debes incluir SIEMPRE un bloque de código JSON con este formato para comunicarle tu decisión al sistema:
\`\`\`json
{
  "items": [
    { "type": "Accommodation" | "Activity" | "Meal", "name": "Nombre", "price": 12000, "details": "WiFi, Desayuno incluido", "day": 1 }
  ],
  "finishedStep": true | false,
  "heTerminado": true | false
}
\`\`\`
Solo incluye elementos en "items" si el usuario explícitamente decidió agregarlos en este turno. Si es una conversación exploratoria o aún no decide, mantén "items" vacío y "finishedStep" en false.
`;

  const rawResponse = await fetchBotResponse(message, systemPrompt, chatHistory);

  let text = rawResponse;
  let newItinerary: ItineraryItem[] | undefined = undefined;
  let finishedStep = false;
  let heTerminado = false;

  if (FINISH_PATTERNS.some(p => p.test(message.trim()))) {
    heTerminado = true;
  }

  const jsonRegex = /\`\`\`json\s*([\s\S]*?)\s*\`\`\`/i;
  const match = rawResponse.match(jsonRegex);
  
  if (match && match[1]) {
    try {
      const parsedJson = JSON.parse(match[1]);
      if (parsedJson.items) {
        newItinerary = parsedJson.items;
      } else if (Array.isArray(parsedJson)) {
        newItinerary = parsedJson;
      }
      if (parsedJson.finishedStep !== undefined) {
        finishedStep = parsedJson.finishedStep;
      }
      if (parsedJson.heTerminado !== undefined) {
        heTerminado = parsedJson.heTerminado;
      }
      text = text.replace(jsonRegex, '').trim();
    } catch (e) {
      console.error("Error parseando JSON del LLM:", e);
    }
  }

  const finishMarker = /\[FINALIZAR\]/i;
  if (finishMarker.test(rawResponse)) {
    heTerminado = true;
    text = text.replace(finishMarker, '').trim();
  }

  if (newItinerary && tripParams.maxBudget > 0) {
    const totalCost = newItinerary.reduce((sum, item) => sum + (item.price * totalPax), 0);
    if (totalCost > tripParams.maxBudget) {
      text += `\n\n⚠️ **Aviso**: El costo total estimado ($${totalCost}) supera tu presupuesto de $${tripParams.maxBudget}.`;
    }
  }

  return { text, newItinerary, finishedStep, heTerminado };
};

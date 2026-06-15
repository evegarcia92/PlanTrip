import * as SQLite from 'expo-sqlite';

let dbReadyPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function ensureColumnExists(db: SQLite.SQLiteDatabase, table: string, column: string, definition: string) {
  const cols: any[] = await db.getAllAsync(`PRAGMA table_info(${table})`);
  if (!cols.find(c => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function ensureDbReady(): Promise<SQLite.SQLiteDatabase> {
  if (dbReadyPromise) return dbReadyPromise;

  dbReadyPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('plantrip.db');

    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS Destinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        country TEXT,
        publicTransportRules TEXT,
        privateTransportTariff REAL
      );

      CREATE TABLE IF NOT EXISTS Accommodations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination_id INTEGER,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        pricePerNight REAL,
        season TEXT,
        amenities TEXT,
        FOREIGN KEY(destination_id) REFERENCES Destinations(id)
      );

      CREATE TABLE IF NOT EXISTS Restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination_id INTEGER,
        name TEXT NOT NULL,
        cuisine TEXT,
        pricePerPerson REAL,
        amenities TEXT,
        season TEXT,
        FOREIGN KEY(destination_id) REFERENCES Destinations(id)
      );

      CREATE TABLE IF NOT EXISTS Activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination_id INTEGER,
        name TEXT NOT NULL,
        profile TEXT,
        agency TEXT,
        price REAL,
        FOREIGN KEY(destination_id) REFERENCES Destinations(id)
      );

      CREATE TABLE IF NOT EXISTS Promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank TEXT NOT NULL,
        installments INTEGER,
        discount_percentage REAL
      );

      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    await ensureColumnExists(db, 'Accommodations', 'amenities', 'TEXT');

    const result: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM Destinations');
    if (result && result.count === 0) {
      console.log('Seeding database...');

      // ────────── DESTINATIONS ──────────
      const destinations = [
        ['Buenos Aires', 'Argentina', 'Subte línea A/B/C/D/E. Colectivos $370', 15000],
        ['Bariloche', 'Argentina', 'Colectivo línea 20/50. Taxi $2500', 25000],
        ['Mendoza', 'Argentina', 'Mendotran pase libre $600', 18000],
        ['Salta', 'Argentina', 'SAETA boleto $350', 16000],
        ['Córdoba', 'Argentina', 'CityBus boleto $350', 14000],
        ['Iguazú', 'Argentina', 'Colectivo local $200', 20000],
        ['Ushuaia', 'Argentina', 'Colectivo línea A/B $300', 22000],
        ['El Calafate', 'Argentina', 'Taxi $3000', 23000],
        ['Puerto Madryn', 'Argentina', 'Colectivo urbano $250', 17000],
        ['Mar del Plata', 'Argentina', 'Colectivo línea 511/512 $300', 13000],
        ['Rosario', 'Argentina', 'Colectivo líneas 100/200 $280', 12000],
        ['San Martín de los Andes', 'Argentina', 'Taxi $2000', 21000],
      ];

      for (const d of destinations) {
        await db.runAsync(
          `INSERT INTO Destinations (name, country, publicTransportRules, privateTransportTariff) VALUES (?, ?, ?, ?)`,
          d
        );
      }

      // ────────── ACCOMMODATIONS (12+ por destino) ──────────
      const accData: [number, string, string, number, string, string][] = [
        // Buenos Aires (dest 1)
        [1, 'Alvear Palace Hotel', 'Hotel', 280000, 'Alta', 'WiFi, Desayuno incluido, Spa, Gimnasio, Estacionamiento, Aire acondicionado'],
        [1, 'NH Collection', 'Hotel', 95000, 'Media', 'WiFi, Desayuno incluido, Gimnasio, Aire acondicionado'],
        [1, 'Milhouse Hostel', 'Hostel', 18000, 'Baja', 'WiFi, Desayuno incluido, Bar'],
        [1, 'Faena Hotel', 'Hotel', 350000, 'Alta', 'WiFi, Spa, Piscina, Gimnasio, Aparcacoches, Restaurante'],
        [1, 'Soho Buenos Aires', 'Hotel', 75000, 'Media', 'WiFi, Desayuno incluido, Pet friendly, Aire acondicionado'],
        [1, 'Casa Calma', 'Hotel', 120000, 'Alta', 'WiFi, Spa, Desayuno incluido, Aire acondicionado, Calefacción'],
        [1, 'Viajero Hostel', 'Hostel', 15000, 'Baja', 'WiFi, Bar, Terraza, Actividades'],
        [1, 'Ker Recoleta', 'Hotel', 65000, 'Media', 'WiFi, Desayuno incluido, Gimnasio, Estacionamiento'],
        [1, 'Four Seasons Buenos Aires', 'Hotel', 450000, 'Alta', 'WiFi, Spa, Piscina, Gimnasio, Restaurante, Estacionamiento, Pet friendly'],
        [1, 'America del Sur Hostel', 'Hostel', 12000, 'Baja', 'WiFi, Desayuno incluido, Bar, Terraza'],
        [1, 'Hotel Madero', 'Hotel', 130000, 'Alta', 'WiFi, Piscina, Gimnasio, Estacionamiento, Aire acondicionado'],
        [1, 'Bayres Apart', 'Apartamento', 50000, 'Media', 'WiFi, Aire acondicionado, Cocina, Calefacción'],
        // Bariloche (dest 2)
        [2, 'Llao Llao Resort', 'Hotel', 450000, 'Alta', 'WiFi, Spa, Piscina, Gimnasio, Vista al lago, Restaurante, Estacionamiento'],
        [2, 'Hotel Nahuel Huapi', 'Hotel', 95000, 'Alta', 'WiFi, Desayuno incluido, Vista al lago, Calefacción'],
        [2, 'Cabañas del Lago', 'Cabaña', 55000, 'Media', 'WiFi, Cocina, Estacionamiento, Vista al lago, Calefacción, Pet friendly'],
        [2, 'Hostel 41 Below', 'Hostel', 16000, 'Baja', 'WiFi, Bar, Desayuno incluido, Calefacción'],
        [2, 'Sol del Nahuel', 'Hotel', 70000, 'Media', 'WiFi, Desayuno incluido, Piscina, Estacionamiento, Calefacción'],
        [2, 'Cabañas Chimpay', 'Cabaña', 40000, 'Baja', 'WiFi, Cocina, Estacionamiento, Pet friendly, Calefacción'],
        [2, 'Hotel Panamericano', 'Hotel', 110000, 'Alta', 'WiFi, Desayuno incluido, Gimnasio, Piscina, Estacionamiento'],
        [2, 'Huinid Hotel', 'Hotel', 85000, 'Media', 'WiFi, Desayuno incluido, Spa, Estacionamiento, Calefacción'],
        [2, 'Paso de los Andes', 'Hostel', 10000, 'Baja', 'WiFi, Cocina, Bar, Calefacción'],
        [2, 'Arelauquen Lodge', 'Cabaña', 120000, 'Alta', 'WiFi, Piscina, Estacionamiento, Vista a la montaña, Calefacción'],
        [2, 'Tango Hostel', 'Hostel', 13000, 'Media', 'WiFi, Desayuno incluido, Bar, Terraza'],
        [2, 'Hotel Edelweiss', 'Hotel', 60000, 'Media', 'WiFi, Desayuno incluido, Calefacción, Estacionamiento'],
        // Mendoza (dest 3)
        [3, 'Park Hyatt Mendoza', 'Hotel', 380000, 'Alta', 'WiFi, Spa, Piscina, Gimnasio, Restaurante, Estacionamiento, Aire acondicionado'],
        [3, 'Diplomatic Hotel', 'Hotel', 110000, 'Alta', 'WiFi, Desayuno incluido, Piscina, Gimnasio, Aire acondicionado'],
        [3, 'Mendoza Backpackers', 'Hostel', 15000, 'Baja', 'WiFi, Bar, Terraza, Piscina'],
        [3, 'Entre Cielos Hotel', 'Hotel', 250000, 'Alta', 'WiFi, Spa, Piscina, Vista a la montaña, Desayuno incluido, Estacionamiento'],
        [3, 'Hotel Roque', 'Hotel', 45000, 'Media', 'WiFi, Desayuno incluido, Aire acondicionado, Estacionamiento'],
        [3, 'Casa Provincial', 'Hotel', 85000, 'Media', 'WiFi, Desayuno incluido, Piscina, Aire acondicionado'],
        [3, 'Hostel Lao', 'Hostel', 12000, 'Baja', 'WiFi, Bar, Terraza, Piscina'],
        [3, 'Posada de Rosas', 'Hotel', 65000, 'Media', 'WiFi, Desayuno incluido, Piscina, Estacionamiento, Aire acondicionado'],
        [3, 'Sheraton Mendoza', 'Hotel', 180000, 'Alta', 'WiFi, Spa, Piscina, Gimnasio, Restaurante, Estacionamiento'],
        [3, 'Hotel Intercontinental', 'Hotel', 140000, 'Alta', 'WiFi, Piscina, Gimnasio, Restaurante, Estacionamiento, Aire acondicionado'],
        [3, 'Alas Argentinas', 'Hostel', 8000, 'Baja', 'WiFi, Cocina, Terraza'],
        [3, 'Cabañas Suizas', 'Cabaña', 50000, 'Media', 'WiFi, Cocina, Piscina, Estacionamiento, Aire acondicionado'],
        // Salta (dest 4)
        [4, 'Hotel Alejandro I', 'Hotel', 95000, 'Alta', 'WiFi, Desayuno incluido, Piscina, Gimnasio, Estacionamiento, Aire acondicionado'],
        [4, 'Kkala Boutique Hotel', 'Hotel', 130000, 'Alta', 'WiFi, Spa, Piscina, Vista a los cerros, Desayuno incluido'],
        [4, 'Hostel La Casa de Arturo', 'Hostel', 10000, 'Baja', 'WiFi, Bar, Terraza, Cocina'],
        [4, 'Hotel Salta', 'Hotel', 55000, 'Media', 'WiFi, Desayuno incluido, Piscina, Estacionamiento, Aire acondicionado'],
        [4, 'Del Milagro Hotel', 'Hotel', 35000, 'Media', 'WiFi, Desayuno incluido, Aire acondicionado, Calefacción'],
        [4, 'Las Wayras', 'Hostel', 9000, 'Baja', 'WiFi, Bar, Piscina, Terraza'],
        [4, 'Posada del Cerro', 'Hotel', 48000, 'Media', 'WiFi, Desayuno incluido, Estacionamiento, Aire acondicionado'],
        [4, 'Hotel Sheraton Salta', 'Hotel', 160000, 'Alta', 'WiFi, Piscina, Gimnasio, Restaurante, Estacionamiento'],
        [4, 'Design Hostel Salta', 'Hostel', 11000, 'Baja', 'WiFi, Bar, Terraza, Desayuno incluido'],
        [4, 'Cabañas del Valle', 'Cabaña', 42000, 'Media', 'WiFi, Cocina, Piscina, Estacionamiento, Aire acondicionado'],
        [4, 'Hotel Sol de Salta', 'Hotel', 70000, 'Media', 'WiFi, Desayuno incluido, Piscina, Estacionamiento'],
        [4, 'Hotel Colonial', 'Hotel', 25000, 'Baja', 'WiFi, Desayuno incluido'],
        // Córdoba (dest 5)
        [5, 'Sheraton Córdoba', 'Hotel', 150000, 'Alta', 'WiFi, Piscina, Gimnasio, Restaurante, Estacionamiento, Aire acondicionado'],
        [5, 'Hotel Windsor', 'Hotel', 45000, 'Media', 'WiFi, Desayuno incluido, Estacionamiento, Aire acondicionado'],
        [5, 'Hostel Celeste', 'Hostel', 10000, 'Baja', 'WiFi, Bar, Terraza'],
        [5, 'NH Córdoba Panorama', 'Hotel', 75000, 'Alta', 'WiFi, Desayuno incluido, Piscina, Gimnasio, Aire acondicionado'],
        [5, 'Holiday Inn Córdoba', 'Hotel', 85000, 'Alta', 'WiFi, Piscina, Gimnasio, Estacionamiento, Aire acondicionado'],
        [5, 'La Cañada Hostel', 'Hostel', 12000, 'Baja', 'WiFi, Bar, Terraza, Cocina'],
        [5, 'Hotel Dorá', 'Hotel', 30000, 'Media', 'WiFi, Desayuno incluido, Aire acondicionado'],
        [5, 'Cabañas El Sauce', 'Cabaña', 40000, 'Media', 'WiFi, Cocina, Piscina, Estacionamiento, Aire acondicionado'],
        [5, 'Quorum Hotel', 'Hotel', 110000, 'Alta', 'WiFi, Spa, Piscina, Gimnasio, Restaurante, Estacionamiento'],
        [5, 'Andenes Hostel', 'Hostel', 8000, 'Baja', 'WiFi, Bar, Terraza, Desayuno incluido'],
        [5, 'Hotel de la Ciudad', 'Hotel', 35000, 'Media', 'WiFi, Desayuno incluido, Estacionamiento'],
        [5, 'Mirador de las Sierras', 'Cabaña', 55000, 'Alta', 'WiFi, Piscina, Vista a las sierras, Estacionamiento, Aire acondicionado'],
        // Iguazú (dest 6)
        [6, 'Gran Meliá Iguazú', 'Hotel', 320000, 'Alta', 'WiFi, Spa, Piscina, Gimnasio, Vista a la selva, Restaurante, Estacionamiento'],
        [6, 'Hotel Saint George', 'Hotel', 75000, 'Media', 'WiFi, Desayuno incluido, Piscina, Estacionamiento, Aire acondicionado'],
        [6, 'Hostel Papillón', 'Hostel', 12000, 'Baja', 'WiFi, Piscina, Bar, Terraza'],
        [6, 'Iguazú Grand Hotel', 'Hotel', 95000, 'Alta', 'WiFi, Piscina, Spa, Restaurante, Estacionamiento'],
        [6, 'Hotel Selva', 'Hotel', 45000, 'Media', 'WiFi, Desayuno incluido, Piscina, Estacionamiento, Aire acondicionado'],
        [6, 'Resort Amayal', 'Hotel', 200000, 'Alta', 'WiFi, Piscina, Spa, Gimnasio, Restaurante, Vista a la selva'],
        [6, 'Cabañas Yasy', 'Cabaña', 35000, 'Media', 'WiFi, Cocina, Piscina, Estacionamiento'],
        [6, 'Zafarrancho Hostel', 'Hostel', 10000, 'Baja', 'WiFi, Bar, Piscina, Terraza'],
        [6, 'Panoramic Iguazú', 'Hotel', 60000, 'Media', 'WiFi, Piscina, Aire acondicionado, Estacionamiento, Desayuno incluido'],
        [6, 'La Sorgenda', 'Hotel', 50000, 'Baja', 'WiFi, Desayuno incluido, Piscina, Aire acondicionado'],
        [6, 'Hotel Posada 21', 'Hotel', 28000, 'Baja', 'WiFi, Desayuno incluido, Piscina'],
        [6, 'Iguazú Jungle Hostel', 'Hostel', 8000, 'Baja', 'WiFi, Piscina, Bar, Terraza, Actividades'],
        // Ushuaia (dest 7)
        [7, 'Los Cauquenes Resort', 'Hotel', 280000, 'Alta', 'WiFi, Spa, Piscina, Gimnasio, Vista al canal, Restaurante, Estacionamiento'],
        [7, 'Hotel Albatros', 'Hotel', 85000, 'Media', 'WiFi, Desayuno incluido, Calefacción, Vista al canal'],
        [7, 'Antarctica Hostel', 'Hostel', 18000, 'Baja', 'WiFi, Bar, Calefacción, Desayuno incluido'],
        [7, 'Hotel Lennox', 'Hotel', 120000, 'Alta', 'WiFi, Desayuno incluido, Spa, Calefacción, Vista al mar'],
        [7, 'Cabañas del Beagle', 'Cabaña', 65000, 'Media', 'WiFi, Cocina, Calefacción, Estacionamiento, Vista al canal'],
        [7, 'Hostel Cruz del Sur', 'Hostel', 14000, 'Baja', 'WiFi, Cocina, Calefacción, Bar'],
        [7, 'Hotel Tierra del Fuego', 'Hotel', 55000, 'Media', 'WiFi, Desayuno incluido, Calefacción, Estacionamiento'],
        [7, 'Las Hayas Resort', 'Hotel', 190000, 'Alta', 'WiFi, Spa, Piscina, Gimnasio, Vista a la bahía, Restaurante'],
        [7, 'Posada del Fin del Mundo', 'Hotel', 40000, 'Baja', 'WiFi, Desayuno incluido, Calefacción'],
        [7, 'Cabañas Alakush', 'Cabaña', 50000, 'Media', 'WiFi, Cocina, Calefacción, Vista al canal, Estacionamiento'],
        [7, 'Hotel Canal Beagle', 'Hotel', 70000, 'Media', 'WiFi, Desayuno incluido, Calefacción, Vista al canal'],
        [7, 'Yaghan Hostel', 'Hostel', 11000, 'Baja', 'WiFi, Bar, Calefacción, Cocina'],
        // El Calafate (dest 8)
        [8, 'Los Alamos Hotel', 'Hotel', 130000, 'Alta', 'WiFi, Desayuno incluido, Piscina, Spa, Estacionamiento, Calefacción'],
        [8, 'Hotel Mirador del Lago', 'Hotel', 95000, 'Alta', 'WiFi, Desayuno incluido, Vista al lago, Calefacción, Estacionamiento'],
        [8, 'America del Sur Hostel', 'Hostel', 16000, 'Baja', 'WiFi, Bar, Calefacción, Desayuno incluido'],
        [8, 'Xelena Hotel', 'Hotel', 220000, 'Alta', 'WiFi, Spa, Piscina, Gimnasio, Vista a la montaña, Restaurante'],
        [8, 'Hotel Kosten Aike', 'Hotel', 60000, 'Media', 'WiFi, Desayuno incluido, Calefacción, Estacionamiento'],
        [8, 'Cabañas del Glaciar', 'Cabaña', 55000, 'Media', 'WiFi, Cocina, Calefacción, Estacionamiento, Vista al lago'],
        [8, 'Design Suites Calafate', 'Hotel', 150000, 'Alta', 'WiFi, Piscina, Spa, Gimnasio, Desayuno incluido'],
        [8, 'Calafate Hostel', 'Hostel', 12000, 'Baja', 'WiFi, Bar, Cocina, Calefacción'],
        [8, 'Hotel Sierra Nevada', 'Hotel', 45000, 'Media', 'WiFi, Desayuno incluido, Calefacción, Estacionamiento'],
        [8, 'Posada El Ensueño', 'Hotel', 35000, 'Baja', 'WiFi, Desayuno incluido, Calefacción'],
        [8, 'Cabañas del Sur', 'Cabaña', 48000, 'Media', 'WiFi, Cocina, Calefacción, Estacionamiento'],
        [8, 'Hotel Esplendor', 'Hotel', 85000, 'Media', 'WiFi, Desayuno incluido, Piscina, Calefacción'],
        // Puerto Madryn (dest 9)
        [9, 'Hotel Bahía Nueva', 'Hotel', 85000, 'Alta', 'WiFi, Desayuno incluido, Piscina, Estacionamiento, Aire acondicionado'],
        [9, 'Dazzler Puerto Madryn', 'Hotel', 65000, 'Media', 'WiFi, Desayuno incluido, Piscina, Gimnasio, Aire acondicionado'],
        [9, 'Hostel El Puerto', 'Hostel', 12000, 'Baja', 'WiFi, Bar, Terraza, Cocina'],
        [9, 'Playa Hotel', 'Hotel', 70000, 'Alta', 'WiFi, Vista al mar, Desayuno incluido, Estacionamiento, Aire acondicionado'],
        [9, 'Hotel Golf International', 'Hotel', 45000, 'Media', 'WiFi, Piscina, Desayuno incluido, Estacionamiento, Aire acondicionado'],
        [9, 'Cabañas del Mar', 'Cabaña', 50000, 'Media', 'WiFi, Cocina, Estacionamiento, Aire acondicionado, Pet friendly'],
        [9, 'Hostel Patagonia', 'Hostel', 10000, 'Baja', 'WiFi, Bar, Cocina, Terraza'],
        [9, 'Hotel Australis', 'Hotel', 55000, 'Media', 'WiFi, Desayuno incluido, Estacionamiento, Aire acondicionado'],
        [9, 'Tolosana Hotel', 'Hotel', 35000, 'Baja', 'WiFi, Desayuno incluido, Aire acondicionado, Estacionamiento'],
        [9, 'Hotel Gran Hotel Madryn', 'Hotel', 40000, 'Baja', 'WiFi, Desayuno incluido, Aire acondicionado'],
        [9, 'Cabañas Puerto Madryn', 'Cabaña', 42000, 'Media', 'WiFi, Cocina, Piscina, Estacionamiento, Aire acondicionado'],
        [9, 'Hotel Península', 'Hotel', 95000, 'Alta', 'WiFi, Piscina, Spa, Gimnasio, Vista al mar, Restaurante'],
        // Mar del Plata (dest 10)
        [10, 'Hotel Costa Galana', 'Hotel', 180000, 'Alta', 'WiFi, Piscina, Spa, Gimnasio, Vista al mar, Restaurante, Estacionamiento'],
        [10, 'NH Gran Hotel Provincial', 'Hotel', 85000, 'Alta', 'WiFi, Desayuno incluido, Vista al mar, Aire acondicionado'],
        [10, 'Hostel Estación', 'Hostel', 12000, 'Baja', 'WiFi, Bar, Terraza, Cocina'],
        [10, 'Hotel Alma', 'Hotel', 45000, 'Media', 'WiFi, Desayuno incluido, Aire acondicionado, Calefacción'],
        [10, 'Hotel Trevijano', 'Hotel', 35000, 'Baja', 'WiFi, Desayuno incluido, Aire acondicionado'],
        [10, 'Cabañas del Bosque', 'Cabaña', 50000, 'Media', 'WiFi, Cocina, Estacionamiento, Aire acondicionado, Pet friendly'],
        [10, 'Hotel Faro Norte', 'Hotel', 28000, 'Baja', 'WiFi, Desayuno incluido, Aire acondicionado'],
        [10, 'Sheraton Mar del Plata', 'Hotel', 220000, 'Alta', 'WiFi, Piscina, Spa, Gimnasio, Vista al mar, Restaurante, Estacionamiento'],
        [10, 'Hostel Nómade', 'Hostel', 10000, 'Baja', 'WiFi, Bar, Terraza, Desayuno incluido'],
        [10, 'Hotel Versailles', 'Hotel', 35000, 'Media', 'WiFi, Desayuno incluido, Aire acondicionado, Estacionamiento'],
        [10, 'Cabañas Las Brusquitas', 'Cabaña', 60000, 'Alta', 'WiFi, Piscina, Estacionamiento, Aire acondicionado, Vista al mar'],
        [10, 'Hotel Presidente', 'Hotel', 42000, 'Media', 'WiFi, Desayuno incluido, Aire acondicionado, Estacionamiento'],
        // Rosario (dest 11)
        [11, 'Pullman Rosario', 'Hotel', 130000, 'Alta', 'WiFi, Piscina, Gimnasio, Restaurante, Estacionamiento, Aire acondicionado'],
        [11, 'Holiday Inn Rosario', 'Hotel', 85000, 'Media', 'WiFi, Desayuno incluido, Piscina, Gimnasio, Estacionamiento, Aire acondicionado'],
        [11, 'Hostel Rosario Inn', 'Hostel', 12000, 'Baja', 'WiFi, Bar, Terraza, Cocina'],
        [11, 'Hotel Dazzler Rosario', 'Hotel', 65000, 'Media', 'WiFi, Desayuno incluido, Piscina, Gimnasio, Aire acondicionado'],
        [11, 'Hotel Ariston', 'Hotel', 35000, 'Baja', 'WiFi, Desayuno incluido, Aire acondicionado'],
        [11, 'Cabañas del Río', 'Cabaña', 50000, 'Media', 'WiFi, Cocina, Estacionamiento, Aire acondicionado, Vista al río'],
        [11, 'Estación Rosario Hostel', 'Hostel', 10000, 'Baja', 'WiFi, Bar, Terraza, Cocina'],
        [11, 'Hotel Plaza Real', 'Hotel', 45000, 'Media', 'WiFi, Desayuno incluido, Estacionamiento, Aire acondicionado'],
        [11, 'Hotel Ros Tower', 'Hotel', 95000, 'Alta', 'WiFi, Piscina, Gimnasio, Restaurante, Estacionamiento, Aire acondicionado'],
        [11, 'Hotel Eirado', 'Hotel', 32000, 'Baja', 'WiFi, Desayuno incluido, Aire acondicionado'],
        [11, 'Cabañas del Parque', 'Cabaña', 40000, 'Media', 'WiFi, Cocina, Estacionamiento, Aire acondicionado'],
        [11, 'Hotel Colonial Rosario', 'Hotel', 25000, 'Baja', 'WiFi, Desayuno incluido, Aire acondicionado'],
        // San Martín de los Andes (dest 12)
        [12, 'Hotel Caupolicán', 'Hotel', 110000, 'Alta', 'WiFi, Desayuno incluido, Spa, Vista al lago, Calefacción, Estacionamiento'],
        [12, 'Hostel Patagonia Andina', 'Hostel', 16000, 'Baja', 'WiFi, Bar, Calefacción, Desayuno incluido'],
        [12, 'Cabañas del Chapelco', 'Cabaña', 65000, 'Alta', 'WiFi, Cocina, Calefacción, Estacionamiento, Vista a la montaña'],
        [12, 'Hotel Parque Lacar', 'Hotel', 75000, 'Media', 'WiFi, Desayuno incluido, Vista al lago, Calefacción, Estacionamiento'],
        [12, 'Hostel del Bosque', 'Hostel', 12000, 'Baja', 'WiFi, Bar, Calefacción, Terraza'],
        [12, 'Ayres del Filo', 'Cabaña', 50000, 'Media', 'WiFi, Cocina, Calefacción, Estacionamiento, Vista al lago'],
        [12, 'Hotel Le Lac', 'Hotel', 45000, 'Media', 'WiFi, Desayuno incluido, Calefacción, Estacionamiento'],
        [12, 'Cabañas del Río', 'Cabaña', 40000, 'Baja', 'WiFi, Cocina, Calefacción, Estacionamiento, Pet friendly'],
        [12, 'Hotel Sol de los Andes', 'Hotel', 85000, 'Alta', 'WiFi, Spa, Piscina, Calefacción, Restaurante, Estacionamiento'],
        [12, 'Posada del Valle', 'Hotel', 35000, 'Baja', 'WiFi, Desayuno incluido, Calefacción'],
        [12, 'Cabañas del Sol', 'Cabaña', 55000, 'Media', 'WiFi, Cocina, Calefacción, Estacionamiento, Vista al lago'],
        [12, 'Hostel Montana', 'Hostel', 10000, 'Baja', 'WiFi, Bar, Calefacción, Cocina'],
      ];

      for (const a of accData) {
        await db.runAsync(
          `INSERT INTO Accommodations (destination_id, name, type, pricePerNight, season, amenities) VALUES (?, ?, ?, ?, ?, ?)`,
          a
        );
      }

      // ────────── RESTAURANTS (10+ por destino) ──────────
      const restData: [number, string, string, number, string, string][] = [
        // Buenos Aires (1)
        [1, 'Don Julio', 'Parrilla', 45000, 'WiFi, Aire acondicionado, Terraza, Menú infantil, Acceso discapacitados', 'Alta'],
        [1, 'La Cabrera', 'Parrilla', 40000, 'WiFi, Aire acondicionado, Estacionamiento, Música en vivo', 'Alta'],
        [1, 'El Baqueano', 'Cocina patagónica', 35000, 'WiFi, Aire acondicionado, Acceso discapacitados', 'Alta'],
        [1, 'Narda Comedor', 'Cocina fusión', 30000, 'WiFi, Aire acondicionado, Terraza, Menú infantil', 'Alta'],
        [1, 'Pizza Güerrín', 'Pizzería', 8000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [1, 'La Parolaccia', 'Italiana', 25000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Media'],
        [1, 'Café Tortoni', 'Café', 12000, 'WiFi, Aire acondicionado, Música en vivo', 'Media'],
        [1, 'Olivos Bistro', 'Cocina de autor', 35000, 'WiFi, Aire acondicionado, Terraza, Acceso discapacitados', 'Alta'],
        [1, 'El Obrero', 'Parrilla', 20000, 'WiFi, Aire acondicionado, Menú infantil', 'Media'],
        [1, 'Sacro', 'Cocina fusión', 28000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Alta'],
        [1, 'Kentucky', 'Café', 10000, 'WiFi, Aire acondicionado', 'Baja'],
        [1, 'Chori', 'Comida callejera', 5000, 'Terraza', 'Baja'],
        // Bariloche (2)
        [2, 'La Alpina', 'Cocina alpina', 35000, 'WiFi, Calefacción, Música en vivo, Acceso discapacitados', 'Alta'],
        [2, 'El Boliche de Alberto', 'Parrilla', 30000, 'WiFi, Calefacción, Estacionamiento, Menú infantil', 'Alta'],
        [2, 'Butterfly', 'Cocina fusión', 40000, 'WiFi, Calefacción, Terraza, Vista al lago, Música en vivo', 'Alta'],
        [2, 'Cervecería Blest', 'Cervecería', 15000, 'WiFi, Calefacción, Terraza, Música en vivo', 'Media'],
        [2, 'Bachmann', 'Cocina patagónica', 28000, 'WiFi, Calefacción, Vista al lago', 'Media'],
        [2, 'Fondue de Cacique', 'Fondue', 35000, 'WiFi, Calefacción, Música en vivo', 'Alta'],
        [2, 'Jauja', 'Cocina casera', 12000, 'WiFi, Calefacción, Menú infantil', 'Baja'],
        [2, 'Mamusia', 'Pastelería', 8000, 'WiFi, Calefacción, Terraza', 'Baja'],
        [2, 'La Marca', 'Parrilla', 22000, 'WiFi, Calefacción, Estacionamiento, Menú infantil', 'Media'],
        [2, 'El Patacón', 'Cocina patagónica', 18000, 'WiFi, Calefacción, Terraza', 'Media'],
        [2, 'Dublin Irish Pub', 'Pub', 15000, 'WiFi, Calefacción, Música en vivo, Bar', 'Media'],
        [2, 'Tilo', 'Cocina de autor', 32000, 'WiFi, Calefacción, Acceso discapacitados, Terraza', 'Alta'],
        // Mendoza (3)
        [3, 'Restaurante 1884', 'Parrilla', 35000, 'WiFi, Aire acondicionado, Terraza, Estacionamiento, Bodega', 'Alta'],
        [3, 'Los Toneles', 'Cocina mendocina', 28000, 'WiFi, Aire acondicionado, Terraza, Vista a la bodega', 'Alta'],
        [3, 'Azafrán', 'Cocina de autor', 32000, 'WiFi, Aire acondicionado, Terraza, Acceso discapacitados', 'Alta'],
        [3, 'La Marchigiana', 'Italiana', 20000, 'WiFi, Aire acondicionado, Menú infantil, Estacionamiento', 'Media'],
        [3, 'Pan & Oliva', 'Cocina mediterránea', 18000, 'WiFi, Aire acondicionado, Terraza', 'Media'],
        [3, 'Bröd', 'Café', 8000, 'WiFi, Aire acondicionado', 'Baja'],
        [3, 'El Barrio', 'Cocina fusión', 15000, 'WiFi, Aire acondicionado, Música en vivo, Bar', 'Media'],
        [3, 'Doña Pancha', 'Cocina chilena', 12000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [3, 'La Central', 'Cervecería', 14000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Media'],
        [3, 'Chimi', 'Comida callejera', 5000, 'Terraza', 'Baja'],
        [3, 'Siete Cocina', 'Cocina de autor', 40000, 'WiFi, Aire acondicionado, Terraza, Acceso discapacitados', 'Alta'],
        [3, 'Casa de los Abuelos', 'Cocina casera', 10000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        // Salta (4)
        [4, 'El Solar del Convento', 'Cocina salteña', 25000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Alta'],
        [4, 'Café del Tiempo', 'Café', 10000, 'WiFi, Aire acondicionado, Terraza', 'Media'],
        [4, 'José Balcarce', 'Cocina de autor', 30000, 'WiFi, Aire acondicionado, Terraza, Acceso discapacitados', 'Alta'],
        [4, 'La Casa de las Empanadas', 'Cocina salteña', 8000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [4, 'Rincón Salteño', 'Cocina salteña', 12000, 'WiFi, Aire acondicionado, Música en vivo', 'Media'],
        [4, 'Peña El Cardón', 'Cocina regional', 15000, 'WiFi, Aire acondicionado, Música en vivo, Espectáculo folclórico', 'Media'],
        [4, 'Doña Arepa', 'Venezolana', 10000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [4, 'La Cueva', 'Parrilla', 18000, 'WiFi, Aire acondicionado, Estacionamiento, Música en vivo', 'Media'],
        [4, 'Ankara', 'Cocina fusión', 22000, 'WiFi, Aire acondicionado, Terraza, Acceso discapacitados', 'Alta'],
        [4, 'Bistro 1885', 'Cocina de autor', 28000, 'WiFi, Aire acondicionado, Terraza', 'Alta'],
        [4, 'El Buen Gusto', 'Cocina casera', 8000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [4, 'La Rosa', 'Italiana', 15000, 'WiFi, Aire acondicionado, Terraza', 'Media'],
        // Córdoba (5)
        [5, 'San Honorato', 'Parrilla', 20000, 'WiFi, Aire acondicionado, Estacionamiento, Menú infantil', 'Media'],
        [5, 'El Cuchino', 'Cocina fusión', 25000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Alta'],
        [5, 'La Pecera', 'Cocina de autor', 35000, 'WiFi, Aire acondicionado, Terraza, Acceso discapacitados', 'Alta'],
        [5, 'Café del Museo', 'Café', 8000, 'WiFi, Aire acondicionado, Terraza', 'Baja'],
        [5, 'Khamra', 'Cocina tailandesa', 22000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Media'],
        [5, 'El Papagayo', 'Cocina fusión', 28000, 'WiFi, Aire acondicionado, Terraza, Bar', 'Alta'],
        [5, 'Burguer House', 'Hamburguesería', 10000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [5, 'La Parrilla de Córdoba', 'Parrilla', 15000, 'WiFi, Aire acondicionado, Estacionamiento, Menú infantil', 'Media'],
        [5, 'Alfonsina', 'Cocina de autor', 30000, 'WiFi, Aire acondicionado, Terraza', 'Alta'],
        [5, 'Mercado Norte', 'Mercado', 5000, 'WiFi, Aire acondicionado', 'Baja'],
        [5, 'La Mulata', 'Cocina peruana', 18000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Media'],
        [5, 'Elite', 'Parrilla', 12000, 'WiFi, Aire acondicionado, Menú infantil, Estacionamiento', 'Baja'],
        // Iguazú (6)
        [6, 'La Rueda', 'Parrilla', 25000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Alta'],
        [6, 'El Charo', 'Cocina misionera', 15000, 'WiFi, Aire acondicionado, Menú infantil', 'Media'],
        [6, 'Aqva Resto', 'Cocina fusión', 30000, 'WiFi, Aire acondicionado, Terraza, Vista a la selva', 'Alta'],
        [6, 'La Taba', 'Cocina regional', 12000, 'WiFi, Aire acondicionado, Música en vivo', 'Media'],
        [6, 'Pizza Color', 'Pizzería', 8000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [6, 'El Oriental', 'Cocina asiática', 18000, 'WiFi, Aire acondicionado, Terraza', 'Media'],
        [6, 'Café de la Selva', 'Café', 6000, 'WiFi, Aire acondicionado, Terraza', 'Baja'],
        [6, 'La Fonte', 'Italiana', 22000, 'WiFi, Aire acondicionado, Terraza, Acceso discapacitados', 'Media'],
        [6, 'Biergarten Iguazú', 'Cervecería', 15000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Media'],
        [6, 'Tarobá', 'Cocina misionera', 10000, 'WiFi, Aire acondicionado', 'Baja'],
        [6, 'El Jardín', 'Cocina de autor', 35000, 'WiFi, Aire acondicionado, Terraza, Vista a la selva, Música en vivo', 'Alta'],
        [6, 'Puerto Iguazú Bistro', 'Cocina fusión', 20000, 'WiFi, Aire acondicionado, Terraza, Acceso discapacitados', 'Media'],
        // Ushuaia (7)
        [7, 'Kalma Resto', 'Cocina patagónica', 35000, 'WiFi, Calefacción, Vista al canal, Música en vivo', 'Alta'],
        [7, 'El Viejo Matrero', 'Parrilla', 25000, 'WiFi, Calefacción, Estacionamiento, Menú infantil', 'Alta'],
        [7, 'Bodegón Fueguino', 'Cocina fueguina', 28000, 'WiFi, Calefacción, Música en vivo, Acceso discapacitados', 'Alta'],
        [7, 'Chez Manu', 'Cocina francesa', 40000, 'WiFi, Calefacción, Vista al canal, Acceso discapacitados', 'Alta'],
        [7, 'La Cantina del Beagle', 'Cocina patagónica', 20000, 'WiFi, Calefacción, Menú infantil', 'Media'],
        [7, 'Tía Elvira', 'Cocina casera', 12000, 'WiFi, Calefacción, Menú infantil', 'Baja'],
        [7, 'Café del Fin del Mundo', 'Café', 8000, 'WiFi, Calefacción', 'Baja'],
        [7, 'Patagonia Brewing', 'Cervecería', 15000, 'WiFi, Calefacción, Música en vivo, Terraza', 'Media'],
        [7, 'Kaupé', 'Cocina patagónica', 32000, 'WiFi, Calefacción, Vista a la bahía, Música en vivo', 'Alta'],
        [7, 'El Rincón del Fin del Mundo', 'Cocina fueguina', 18000, 'WiFi, Calefacción, Estacionamiento', 'Media'],
        [7, 'La Lechuza', 'Cocina fusión', 22000, 'WiFi, Calefacción, Terraza, Música en vivo', 'Media'],
        [7, 'Bar Ideal', 'Pub', 10000, 'WiFi, Calefacción, Bar, Terraza', 'Baja'],
        // El Calafate (8)
        [8, 'Milagros', 'Cocina patagónica', 28000, 'WiFi, Calefacción, Música en vivo, Acceso discapacitados', 'Alta'],
        [8, 'La Tablita', 'Parrilla', 25000, 'WiFi, Calefacción, Estacionamiento, Menú infantil', 'Alta'],
        [8, 'Don Alfred', 'Cocina casera', 12000, 'WiFi, Calefacción, Menú infantil', 'Baja'],
        [8, 'Pura Vida', 'Cocina fusión', 18000, 'WiFi, Calefacción, Terraza, Música en vivo', 'Media'],
        [8, 'El Ovejero', 'Cocina patagónica', 22000, 'WiFi, Calefacción, Estacionamiento', 'Media'],
        [8, 'Rincón Patagónico', 'Cocina patagónica', 15000, 'WiFi, Calefacción, Menú infantil', 'Media'],
        [8, 'Café del Glaciar', 'Café', 8000, 'WiFi, Calefacción', 'Baja'],
        [8, 'La Bahía', 'Cocina patagónica', 20000, 'WiFi, Calefacción, Vista al lago', 'Media'],
        [8, 'Patagonia Tradición', 'Cocina patagónica', 10000, 'WiFi, Calefacción, Menú infantil', 'Baja'],
        [8, 'Buenos Muchachos', 'Parrilla', 18000, 'WiFi, Calefacción, Estacionamiento, Música en vivo', 'Media'],
        [8, 'Casimiro', 'Cocina de autor', 35000, 'WiFi, Calefacción, Terraza, Acceso discapacitados', 'Alta'],
        [8, 'Brewster', 'Cervecería', 15000, 'WiFi, Calefacción, Música en vivo, Bar', 'Media'],
        // Puerto Madryn (9)
        [9, 'Antares', 'Cervecería', 15000, 'WiFi, Aire acondicionado, Terraza, Música en vivo, Menú infantil', 'Media'],
        [9, 'Muelle de la Bahía', 'Cocina patagónica', 25000, 'WiFi, Aire acondicionado, Vista al mar, Acceso discapacitados', 'Alta'],
        [9, 'La Perla', 'Cocina patagónica', 12000, 'WiFi, Aire acondicionado, Menú infantil', 'Media'],
        [9, 'Puerto sur', 'Parrilla', 20000, 'WiFi, Aire acondicionado, Estacionamiento, Música en vivo', 'Media'],
        [9, 'Trattoria', 'Italiana', 18000, 'WiFi, Aire acondicionado, Terraza, Menú infantil', 'Media'],
        [9, 'La Cantina de Don Pedro', 'Cocina casera', 10000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [9, 'El Viejo Marino', 'Cocina patagónica', 22000, 'WiFi, Aire acondicionado, Vista al mar', 'Alta'],
        [9, 'Café Puerto Madryn', 'Café', 8000, 'WiFi, Aire acondicionado', 'Baja'],
        [9, 'Madryn Natural', 'Cocina natural', 12000, 'WiFi, Aire acondicionado, Terraza', 'Media'],
        [9, 'Chubut Bistro', 'Cocina patagónica', 15000, 'WiFi, Aire acondicionado, Música en vivo', 'Media'],
        [9, 'Estación 33', 'Cocina de autor', 28000, 'WiFi, Aire acondicionado, Terraza, Acceso discapacitados', 'Alta'],
        [9, 'La Otra', 'Cocina fusión', 18000, 'WiFi, Aire acondicionado, Música en vivo, Bar', 'Media'],
        // Mar del Plata (10)
        [10, 'Lobo Larsen', 'Parrilla', 25000, 'WiFi, Aire acondicionado, Vista al mar, Música en vivo', 'Alta'],
        [10, 'Bien Bocho', 'Cocina fusión', 20000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Media'],
        [10, 'El Palacio de la Papa Frita', 'Cocina casera', 12000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [10, 'La Fonte di Trevi', 'Italiana', 18000, 'WiFi, Aire acondicionado, Terraza, Menú infantil', 'Media'],
        [10, 'Café Oriente', 'Café', 8000, 'WiFi, Aire acondicionado', 'Baja'],
        [10, 'Océano', 'Cocina patagónica', 28000, 'WiFi, Aire acondicionado, Vista al mar, Acceso discapacitados', 'Alta'],
        [10, 'Muelle 47', 'Cocina patagónica', 15000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Media'],
        [10, 'La Cantina del Puerto', 'Cocina patagónica', 22000, 'WiFi, Aire acondicionado, Estacionamiento, Menú infantil', 'Alta'],
        [10, 'Bistro Mar', 'Cocina de autor', 30000, 'WiFi, Aire acondicionado, Terraza, Vista al mar', 'Alta'],
        [10, 'El Leñador', 'Parrilla', 18000, 'WiFi, Aire acondicionado, Menú infantil, Estacionamiento', 'Media'],
        [10, 'Parrilla del Puerto', 'Parrilla', 15000, 'WiFi, Aire acondicionado, Menú infantil', 'Media'],
        [10, 'Güerrín MDP', 'Pizzería', 8000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        // Rosario (11)
        [11, 'Don Ferreyra', 'Parrilla', 22000, 'WiFi, Aire acondicionado, Estacionamiento, Música en vivo', 'Media'],
        [11, 'La Marina', 'Cocina patagónica', 25000, 'WiFi, Aire acondicionado, Vista al río, Acceso discapacitados', 'Alta'],
        [11, 'El Cairo', 'Café', 8000, 'WiFi, Aire acondicionado, Terraza', 'Baja'],
        [11, 'Pizza Los Ángeles', 'Pizzería', 6000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [11, 'Estación 31', 'Cocina fusión', 18000, 'WiFi, Aire acondicionado, Música en vivo, Bar', 'Media'],
        [11, 'Cava de los Andes', 'Cocina de autor', 30000, 'WiFi, Aire acondicionado, Terraza, Acceso discapacitados', 'Alta'],
        [11, 'La Favorita', 'Cocina casera', 10000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [11, 'Bajada 9', 'Cocina fusión', 15000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Media'],
        [11, 'Burguer Bar', 'Hamburguesería', 12000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
        [11, 'Río', 'Cocina patagónica', 20000, 'WiFi, Aire acondicionado, Terraza, Vista al río', 'Media'],
        [11, 'Mono Bandido', 'Cocina fusión', 25000, 'WiFi, Aire acondicionado, Terraza, Música en vivo', 'Alta'],
        [11, 'Boulevard', 'Café', 7000, 'WiFi, Aire acondicionado, Terraza', 'Baja'],
        // San Martín de los Andes (12)
        [12, 'Ruca Hue', 'Cocina patagónica', 28000, 'WiFi, Calefacción, Vista al lago, Música en vivo', 'Alta'],
        [12, 'La Época', 'Cocina casera', 12000, 'WiFi, Calefacción, Menú infantil', 'Baja'],
        [12, 'Código Cervecero', 'Cervecería', 15000, 'WiFi, Calefacción, Terraza, Música en vivo', 'Media'],
        [12, 'Brote', 'Cocina de autor', 32000, 'WiFi, Calefacción, Terraza, Acceso discapacitados', 'Alta'],
        [12, 'El Regional', 'Cocina regional', 18000, 'WiFi, Calefacción, Menú infantil, Estacionamiento', 'Media'],
        [12, 'Tinto y Brasa', 'Parrilla', 22000, 'WiFi, Calefacción, Estacionamiento, Música en vivo', 'Media'],
        [12, 'Café del Lago', 'Café', 10000, 'WiFi, Calefacción, Vista al lago', 'Media'],
        [12, 'La Terraza', 'Cocina patagónica', 15000, 'WiFi, Calefacción, Terraza, Vista al lago', 'Media'],
        [12, 'Casa del Sol', 'Cocina fusión', 25000, 'WiFi, Calefacción, Música en vivo, Bar', 'Alta'],
        [12, 'Patagonia Andina', 'Cocina patagónica', 20000, 'WiFi, Calefacción, Estacionamiento, Menú infantil', 'Media'],
        [12, 'El Fogón', 'Parrilla', 18000, 'WiFi, Calefacción, Menú infantil, Estacionamiento', 'Media'],
        [12, 'La Andina', 'Cocina patagónica', 12000, 'WiFi, Calefacción, Menú infantil', 'Baja'],
      ];

      for (const r of restData) {
        await db.runAsync(
          `INSERT INTO Restaurants (destination_id, name, cuisine, pricePerPerson, amenities, season) VALUES (?, ?, ?, ?, ?, ?)`,
          r
        );
      }

      // ────────── ACTIVITIES (10+ por destino) ──────────
      const actData: [number, string, string, string, number][] = [
        // Buenos Aires (1)
        [1, 'Tour Teatro Colón', 'Adultos', 'BA Tours', 15000],
        [1, 'Recorrida por La Boca', 'Adultos', 'BA Tours', 8000],
        [1, 'Caminito y Museo Quinquela', 'Adultos', 'Caminito Tours', 6000],
        [1, 'Tango Show en San Telmo', 'Adultos', 'Tango Experience', 22000],
        [1, 'Paseo en Tigre (Delta)', 'Todos', 'Delta Tours', 12000],
        [1, 'Jardin Japonés', 'Todos', 'Jardin Japonés', 3000],
        [1, 'Parque de la Costa', 'Niños', 'Tigre Viajes', 25000],
        [1, 'Museo MALBA', 'Adultos', 'MALBA', 5000],
        [1, 'Tour en Bici por Palermo', 'Adultos', 'Bike BA', 4000],
        [1, 'Recorrida Puerto Madero', 'Todos', 'BA Walking', 2000],
        [1, 'Planetario', 'Niños', 'Planetario', 3000],
        [1, 'Feria de San Telmo (domingo)', 'Todos', 'Gratuito', 0],
        // Bariloche (2)
        [2, 'Cerro Catedral Ski', 'Adultos', 'SnowTravel', 85000],
        [2, 'Paseo en Barco Lago Nahuel Huapi', 'Todos', 'LakeTours', 35000],
        [2, 'Circuito Chico', 'Todos', 'Bariloche Tours', 12000],
        [2, 'Colonia Suiza', 'Todos', 'Bariloche Tours', 8000],
        [2, 'Cerro Otto Teléférico', 'Todos', 'Cerro Otto', 15000],
        [2, 'Museo del Chocolate', 'Niños', 'Fenoglio', 5000],
        [2, 'Rafting Río Manso', 'Adultos', 'Aventura Sur', 25000],
        [2, 'Cabalgata Cerro López', 'Adultos', 'Andes Ride', 22000],
        [2, 'Isla Victoria', 'Todos', 'LakeTours', 28000],
        [2, 'Parque Nacional Arrayanes', 'Todos', 'LakeTours', 20000],
        [2, 'Bici de Montaña', 'Adultos', 'MTB Bariloche', 15000],
        [2, 'Pesca Deportiva', 'Adultos', 'Pesca Sur', 18000],
        // Mendoza (3)
        [3, 'Ruta del Vino', 'Adultos', 'Mendoza Vinos', 45000],
        [3, 'Rafting Río Mendoza', 'Adultos', 'Aventura Mendoza', 20000],
        [3, 'Cerro Aconcagua Trek', 'Adultos', 'Andes Trek', 35000],
        [3, 'City Tour Mendoza', 'Todos', 'Mendoza Tours', 8000],
        [3, 'Parque General San Martín', 'Todos', 'Parques Mendoza', 2000],
        [3, 'Enoturismo Valle de Uco', 'Adultos', 'Valle Tours', 55000],
        [3, 'Paseo en Globo', 'Adultos', 'Globos Mendoza', 40000],
        [3, 'Museo del Vino', 'Adultos', 'Museos Mendoza', 5000],
        [3, 'Termas de Cacheuta', 'Todos', 'Termas Mendoza', 15000],
        [3, 'Alta Montaña (Puente Inca)', 'Todos', 'Montaña Tours', 18000],
        [3, 'Cabalgata', 'Adultos', 'Andes Ride', 20000],
        [3, 'Mountain Bike', 'Adultos', 'MTB Mendoza', 12000],
        // Salta (4)
        [4, 'Tren de las Nubes', 'Todos', 'Tren a las Nubes', 35000],
        [4, 'Tour a Cafayate', 'Adultos', 'Salta Tours', 18000],
        [4, 'Catedral de Salta', 'Todos', 'City Tours', 3000],
        [4, 'Teleférico San Bernardo', 'Todos', 'Teleférico Salta', 5000],
        [4, 'Peña Folclórica', 'Adultos', 'Salta Espectáculos', 8000],
        [4, 'Museo de Arqueología MAAM', 'Adultos', 'Museos Salta', 4000],
        [4, 'Tour a Purmamarca', 'Todos', 'Norte Tours', 15000],
        [4, 'Cuesta del Obispo', 'Adultos', 'Montaña Tours', 12000],
        [4, 'Valle de Lerma', 'Todos', 'Salta Tours', 8000],
        [4, 'Museo Güemes', 'Adultos', 'Museos Salta', 3000],
        [4, 'Tour vino de altura', 'Adultos', 'Vinos del Norte', 25000],
        [4, 'San Antonio de los Cobres', 'Adultos', 'Norte Tours', 22000],
        // Córdoba (5)
        [5, 'Manzana Jesuítica', 'Todos', 'Córdoba Tours', 5000],
        [5, 'Villa Carlos María', 'Todos', 'Sierras Tours', 8000],
        [5, 'Museo Superior de Bellas Artes', 'Adultos', 'Museos Córdoba', 3000],
        [5, 'Cerro Uritorco Trek', 'Adultos', 'Trekking Córdoba', 15000],
        [5, 'Dique Los Molinos', 'Todos', 'Lagos Tours', 8000],
        [5, 'Tour de la Bomba', 'Adultos', 'Bomba Tours', 10000],
        [5, 'Río Cuarto Safari', 'Adultos', 'Safari Córdoba', 12000],
        [5, 'Parque Nacional Quebrada del Condorito', 'Adultos', 'Parques Córdoba', 5000],
        [5, 'Cabalgar en las Sierras', 'Adultos', 'Sierras Ride', 12000],
        [5, 'Museo Casa de la Moneda', 'Todos', 'Museos Córdoba', 2000],
        [5, 'Tour Gastronómico', 'Adultos', 'Food Tours CBA', 15000],
        [5, 'Rafting en Villa General Belgrano', 'Adultos', 'Aventura Córdoba', 18000],
        // Iguazú (6)
        [6, 'Cataratas Lado Argentino', 'Todos', 'Parques Nacionales', 25000],
        [6, 'Cataratas Lado Brasileño', 'Todos', 'Iguazú Tours', 30000],
        [6, 'Paseo en Barco bajo las Cataratas', 'Adultos', 'Aventura Iguazú', 35000],
        [6, 'Güirá Oga (Centro de Aves)', 'Todos', 'Güirá Oga', 8000],
        [6, 'Sendero Verde', 'Todos', 'Parques Nacionales', 5000],
        [6, 'Museo de la Imágen', 'Todos', 'Museos Iguazú', 2000],
        [6, 'Tour a las Ruinas Jesuitas', 'Adultos', 'Historia Tours', 10000],
        [6, 'Comunidad Guaraní', 'Adultos', 'Culturas Iguazú', 8000],
        [6, 'Bici por la Selva', 'Adultos', 'Selva Bike', 12000],
        [6, 'Rapel en Cataratas', 'Adultos', 'Aventura Iguazú', 25000],
        [6, 'Paseo en Helicóptero', 'Adultos', 'Helicópteros Iguazú', 60000],
        [6, 'Parque das Aves (BR)', 'Todos', 'Parque das Aves', 15000],
        // Ushuaia (7)
        [7, 'Tren del Fin del Mundo', 'Todos', 'Tren Fueguino', 20000],
        [7, 'Parque Nacional Tierra del Fuego', 'Todos', 'Parques Nacionales', 15000],
        [7, 'Navegación Canal Beagle', 'Todos', 'Beagle Tours', 25000],
        [7, 'Cerro Castor Ski', 'Adultos', 'Snow Fueguina', 45000],
        [7, 'Museo del Fin del Mundo', 'Todos', 'Museos Ushuaia', 5000],
        [7, 'Excursión a Isla Martillo (pingüinos)', 'Todos', 'Pingüino Tours', 30000],
        [7, 'Lagos Fueguinos', 'Todos', 'Lagos Tours', 18000],
        [7, 'Cabo de Hornos Heli', 'Adultos', 'Helicópteros Ushuaia', 55000],
        [7, 'Paseo en 4x4', 'Adultos', 'Ushuaia 4x4', 22000],
        [7, 'Trekking Glaciar Martial', 'Adultos', 'Trekking Sur', 12000],
        [7, 'Museo Marítimo', 'Todos', 'Museos Ushuaia', 5000],
        [7, 'Pesca Deportiva', 'Adultos', 'Pesca Fueguina', 20000],
        // El Calafate (8)
        [8, 'Glaciar Perito Moreno', 'Todos', 'Parques Nacionales', 35000],
        [8, 'Minitrekking Glaciar', 'Adultos', 'Glaciar Trek', 55000],
        [8, 'Navegación Glaciares Upsala', 'Todos', 'Glaciar Tours', 45000],
        [8, 'Laguna Nimez', 'Todos', 'Parques Nacionales', 3000],
        [8, 'Museo Regional', 'Adultos', 'Museos Calafate', 4000],
        [8, 'Astroturismo', 'Adultos', 'Estrellas Patagonia', 15000],
        [8, 'Paseo en Barco Río Santa Cruz', 'Todos', 'Río Tours', 12000],
        [8, 'Cabalgata', 'Adultos', 'Patagonia Ride', 18000],
        [8, 'Bici Glaciar', 'Adultos', 'MTB Calafate', 10000],
        [8, 'Parque Nacional los Glaciares', 'Todos', 'Parques Nacionales', 20000],
        [8, 'Tour de la Estancia', 'Adultos', 'Estancia Tours', 15000],
        [8, 'Observación de Fauna', 'Todos', 'Fauna Sur', 8000],
        // Puerto Madryn (9)
        [9, 'Punta Tombo (pingüinos)', 'Todos', 'Fauna Madryn', 18000],
        [9, 'Peninsula Valdés', 'Todos', 'Peninsula Tours', 25000],
        [9, 'Avistaje de Ballenas', 'Todos', 'Ballenas Madryn', 30000],
        [9, 'Museo Oceánico', 'Todos', 'Museos Madryn', 4000],
        [9, 'Snorkel con Lobos Marinos', 'Adultos', 'Buceo Madryn', 20000],
        [9, 'Puerto Pirámides', 'Todos', 'Peninsula Tours', 15000],
        [9, 'Buceo en Puerto Madryn', 'Adultos', 'Buceo Madryn', 25000],
        [9, 'Kayak en la Bahía', 'Adultos', 'Kayak Sur', 12000],
        [9, 'Reserva Natural San Pablo', 'Todos', 'Naturaleza Madryn', 8000],
        [9, 'Observación de Aves', 'Todos', 'Aves Madryn', 5000],
        [9, 'Isla de los Pájaros', 'Todos', 'Aves Madryn', 10000],
        [9, 'Paseo en Barco por el Golfo', 'Todos', 'Golfo Tours', 15000],
        // Mar del Plata (10)
        [10, 'Museo MAR', 'Todos', 'Museos MDP', 2000],
        [10, 'Casino Central', 'Adultos', 'Casinos MDP', 5000],
        [10, 'Acuario Mar del Plata', 'Niños', 'Acuario MDP', 12000],
        [10, 'Torreón del Monje', 'Todos', 'Torres MDP', 3000],
        [10, 'Playa Bristol', 'Todos', 'Gratuito', 0],
        [10, 'Parque de los Camellos', 'Niños', 'Parques MDP', 5000],
        [10, 'Paseo en Barco por el Puerto', 'Todos', 'Puerto Tours', 10000],
        [10, 'Museo de la Ciudad', 'Adultos', 'Museos MDP', 2000],
        [10, 'Pesca en Escollera', 'Adultos', 'Pesca MDP', 5000],
        [10, 'Teatro Colón MDP', 'Adultos', 'Teatros MDP', 8000],
        [10, 'Club de Golf', 'Adultos', 'Golf MDP', 15000],
        [10, 'Plaza del Agua', 'Todos', 'Parques MDP', 1000],
        // Rosario (11)
        [11, 'Monumento a la Bandera', 'Todos', 'Monumento', 2000],
        [11, 'Parque Independencia', 'Todos', 'Parques Rosario', 1000],
        [11, 'Museo de la Memoria', 'Adultos', 'Museos Rosario', 2000],
        [11, 'Isla de los Inventos', 'Niños', 'Inventos Rosario', 5000],
        [11, 'Río Paraná Paseo en Barco', 'Todos', 'Río Tours', 8000],
        [11, 'Bici por la Costanera', 'Todos', 'Bici Rosario', 2000],
        [11, 'Museo Castagnino', 'Adultos', 'Museos Rosario', 3000],
        [11, 'Tiro al Blanco', 'Adultos', 'Deportes Rosario', 10000],
        [11, 'Gastronomía en Pichincha', 'Adultos', 'Food Tours Ros', 12000],
        [11, 'Planetario de Rosario', 'Niños', 'Planetario Ros', 3000],
        [11, 'Estadio Gigante de Arroyito', 'Adultos', 'Fútbol Rosario', 5000],
        [11, 'Paseo del Siglo', 'Todos', 'Paseos Rosario', 1000],
        // San Martín de los Andes (12)
        [12, 'Cerro Chapelco Ski', 'Adultos', 'Chapelco Ski', 50000],
        [12, 'Paseo en Barco Lago Lacar', 'Todos', 'Lacar Tours', 18000],
        [12, 'Parque Nacional Lanín', 'Todos', 'Parques Nacionales', 5000],
        [12, 'Termas de Lahuen Co', 'Todos', 'Termas SMA', 12000],
        [12, 'Sendero Arrayanes', 'Todos', 'Sendero SMA', 3000],
        [12, 'Cabalgata', 'Adultos', 'Andes Ride', 15000],
        [12, 'Museo Regional', 'Adultos', 'Museos SMA', 3000],
        [12, 'Pesca Deportiva', 'Adultos', 'Pesca Sur', 15000],
        [12, 'Bici de Montaña', 'Adultos', 'MTB Andina', 10000],
        [12, 'Rafting Río Hua Hum', 'Adultos', 'Aventura SMA', 20000],
        [12, 'Playa Quila Quina', 'Todos', 'Playas SMA', 2000],
        [12, 'Ascenso Cerro Colorado', 'Adultos', 'Trekking SMA', 8000],
      ];

      for (const a of actData) {
        await db.runAsync(
          `INSERT INTO Activities (destination_id, name, profile, agency, price) VALUES (?, ?, ?, ?, ?)`,
          a
        );
      }

      // ────────── PROMOTIONS ──────────
      await db.runAsync(`INSERT INTO Promotions (bank, installments, discount_percentage) VALUES (?, ?, ?)`, ['Banco Galicia', 6, 10]);
      await db.runAsync(`INSERT INTO Promotions (bank, installments, discount_percentage) VALUES (?, ?, ?)`, ['Banco Santander', 3, 15]);
      await db.runAsync(`INSERT INTO Promotions (bank, installments, discount_percentage) VALUES (?, ?, ?)`, ['Banco Nación', 12, 20]);
      await db.runAsync(`INSERT INTO Promotions (bank, installments, discount_percentage) VALUES (?, ?, ?)`, ['MercadoPago', 1, 5]);
      await db.runAsync(`INSERT INTO Promotions (bank, installments, discount_percentage) VALUES (?, ?, ?)`, ['Visa', 6, 8]);
      await db.runAsync(`INSERT INTO Promotions (bank, installments, discount_percentage) VALUES (?, ?, ?)`, ['Mastercard', 6, 8]);

      console.log('Database seeded successfully.');
    }

    return db;
  })();

  return dbReadyPromise;
}

export const getDb = async () => {
  return await ensureDbReady();
};

export const initDB = async () => {
  try {
    await ensureDbReady();
  } catch (e) {
    console.error("Error initializing database:", e);
  }
};

export const fetchLocalContext = async () => {
  try {
    const db = await ensureDbReady();
    const destinations = await db.getAllAsync('SELECT * FROM Destinations');
    const accommodations = await db.getAllAsync('SELECT * FROM Accommodations');
    const restaurants = await db.getAllAsync('SELECT * FROM Restaurants');
    const activities = await db.getAllAsync('SELECT * FROM Activities');
    const promotions = await db.getAllAsync('SELECT * FROM Promotions');

    return {
      destinations,
      accommodations,
      restaurants,
      activities,
      promotions
    };
  } catch (e) {
    console.error('Error fetching local context:', e);
    return {
      destinations: [],
      accommodations: [],
      restaurants: [],
      activities: [],
      promotions: []
    };
  }
};

export const registerUser = async (username: string, password: string) => {
  try {
    const db = await ensureDbReady();
    const existing: any = await db.getFirstAsync('SELECT * FROM Users WHERE username = ?', [username]);
    if (existing) {
      return { success: false, error: 'Usuario ya existe' };
    }
    const result = await db.runAsync('INSERT INTO Users (username, password) VALUES (?, ?)', [username, password]);
    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, error: 'Error al registrar. Verifica que la base de datos esté disponible.' };
  }
};

export const loginUser = async (username: string, password: string) => {
  try {
    const db = await ensureDbReady();
    const user: any = await db.getFirstAsync('SELECT * FROM Users WHERE username = ? AND password = ?', [username, password]);
    if (user) {
      return { success: true, user };
    }
    return { success: false, error: 'Credenciales inválidas' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Error al iniciar sesión. Verifica que la base de datos esté disponible.' };
  }
};

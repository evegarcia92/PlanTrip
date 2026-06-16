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
        [5, 'Burger House', 'Hamburguesería', 10000, 'WiFi, Aire acondicionado, Menú infantil', 'Baja'],
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
        [5, 'Villa Carlos Paz', 'Todos', 'Sierras Tours', 8000],
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
        [6, 'Museo de la Imagen', 'Todos', 'Museos Iguazú', 2000],
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

/* ── Static data mirror for orchestrator (avoids async DB queries in chat flow) ── */

export type SeasonPrice = { alta: number; media: number; baja: number };

export type Accommodation = {
  name: string;
  category: string;
  pricePerNight: SeasonPrice;
  amenities: string[];
};

export type Activity = {
  name: string;
  price: number;
  duration: string;
  agency: string;
  tags: string[];
};

export type Transport = {
  type: string;
  carrier: string;
  from: string;
  pricePerPerson: SeasonPrice;
  duration: string;
};

export type LocalTransport = {
  type: string;
  description: string;
  price: number;
};

export type Promotion = {
  bank: string;
  description: string;
  discount: string;
};

export type Destination = {
  city: string;
  country: string;
  description: string;
  accommodations: Accommodation[];
  activities: Activity[];
  transport: Transport[];
  localTransport?: LocalTransport[];
  promotions?: Promotion[];
};

export const DESTINATIONS: Destination[] = [
  /* ───────── 1. Buenos Aires ───────── */
  {
    city: 'Buenos Aires',
    country: 'Argentina',
    description: 'Capital del tango, la gastronomía y la cultura. Recorré sus barrios emblemáticos: San Telmo, La Boca, Palermo y Recoleta.',
    accommodations: [
      { name: 'Alvear Palace Hotel', category: 'Hotel', pricePerNight: { alta: 280000, media: 224000, baja: 168000 }, amenities: ['WiFi', 'Desayuno incluido', 'Spa', 'Gimnasio', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'NH Collection', category: 'Hotel', pricePerNight: { alta: 118750, media: 95000, baja: 71250 }, amenities: ['WiFi', 'Desayuno incluido', 'Gimnasio', 'Aire acondicionado'] },
      { name: 'Milhouse Hostel', category: 'Hostel', pricePerNight: { alta: 30600, media: 23400, baja: 18000 }, amenities: ['WiFi', 'Desayuno incluido', 'Bar'] },
      { name: 'Faena Hotel', category: 'Hotel', pricePerNight: { alta: 350000, media: 280000, baja: 210000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Gimnasio', 'Aparcacoches', 'Restaurante'] },
      { name: 'Soho Buenos Aires', category: 'Hotel', pricePerNight: { alta: 93750, media: 75000, baja: 56250 }, amenities: ['WiFi', 'Desayuno incluido', 'Pet friendly', 'Aire acondicionado'] },
      { name: 'Casa Calma', category: 'Hotel', pricePerNight: { alta: 120000, media: 96000, baja: 72000 }, amenities: ['WiFi', 'Spa', 'Desayuno incluido', 'Aire acondicionado', 'Calefacción'] },
      { name: 'Viajero Hostel', category: 'Hostel', pricePerNight: { alta: 25500, media: 19500, baja: 15000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Actividades'] },
      { name: 'Ker Recoleta', category: 'Hotel', pricePerNight: { alta: 81250, media: 65000, baja: 48750 }, amenities: ['WiFi', 'Desayuno incluido', 'Gimnasio', 'Estacionamiento'] },
      { name: 'Four Seasons Buenos Aires', category: 'Hotel', pricePerNight: { alta: 450000, media: 360000, baja: 270000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Gimnasio', 'Restaurante', 'Estacionamiento', 'Pet friendly'] },
      { name: 'America del Sur Hostel', category: 'Hostel', pricePerNight: { alta: 20400, media: 15600, baja: 12000 }, amenities: ['WiFi', 'Desayuno incluido', 'Bar', 'Terraza'] },
      { name: 'Hotel Madero', category: 'Hotel', pricePerNight: { alta: 130000, media: 104000, baja: 78000 }, amenities: ['WiFi', 'Piscina', 'Gimnasio', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Bayres Apart', category: 'Apartamento', pricePerNight: { alta: 62500, media: 50000, baja: 37500 }, amenities: ['WiFi', 'Aire acondicionado', 'Cocina', 'Calefacción'] },
    ],
    activities: [
      { name: 'Tour Teatro Colón', price: 15000, duration: '2h', agency: 'BA Tours', tags: ['Adultos', 'Cultura'] },
      { name: 'Recorrida por La Boca', price: 8000, duration: '3h', agency: 'BA Tours', tags: ['Adultos', 'Cultura'] },
      { name: 'Caminito y Museo Quinquela', price: 6000, duration: '2h', agency: 'Caminito Tours', tags: ['Adultos', 'Cultura'] },
      { name: 'Tango Show en San Telmo', price: 22000, duration: '2h', agency: 'Tango Experience', tags: ['Adultos', 'Espectáculo'] },
      { name: 'Paseo en Tigre (Delta)', price: 12000, duration: '4h', agency: 'Delta Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Jardín Japonés', price: 3000, duration: '1.5h', agency: 'Jardín Japonés', tags: ['Todos', 'Naturaleza'] },
      { name: 'Parque de la Costa', price: 25000, duration: '5h', agency: 'Tigre Viajes', tags: ['Niños', 'Entretenimiento'] },
      { name: 'Museo MALBA', price: 5000, duration: '2h', agency: 'MALBA', tags: ['Adultos', 'Cultura'] },
      { name: 'Tour en Bici por Palermo', price: 4000, duration: '3h', agency: 'Bike BA', tags: ['Adultos', 'Deporte'] },
      { name: 'Recorrida Puerto Madero', price: 2000, duration: '2h', agency: 'BA Walking', tags: ['Todos', 'Paseo'] },
      { name: 'Planetario', price: 3000, duration: '1.5h', agency: 'Planetario', tags: ['Niños', 'Educación'] },
      { name: 'Feria de San Telmo (domingo)', price: 0, duration: '3h', agency: 'Gratuito', tags: ['Todos', 'Cultura'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Aeroparque (AEP)', pricePerPerson: { alta: 0, media: 0, baja: 0 }, duration: '—' },
      { type: 'Bus', carrier: 'Retiro Terminal', from: 'Terminal Retiro', pricePerPerson: { alta: 0, media: 0, baja: 0 }, duration: '—' },
    ],
    localTransport: [
      { type: 'Subte', description: 'Líneas A/B/C/D/E', price: 370 },
      { type: 'Colectivo', description: 'Red de colectivos urbanos', price: 370 },
      { type: 'Taxi/Remis', description: 'Tarifa por km', price: 15000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },

  /* ───────── 2. Bariloche ───────── */
  {
    city: 'Bariloche',
    country: 'Argentina',
    description: 'La Suiza argentina: lagos cristalinos, montañas nevadas, chocolate artesanal y deportes de invierno en Cerro Catedral.',
    accommodations: [
      { name: 'Llao Llao Resort', category: 'Hotel', pricePerNight: { alta: 450000, media: 360000, baja: 270000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Gimnasio', 'Vista al lago', 'Restaurante', 'Estacionamiento'] },
      { name: 'Hotel Nahuel Huapi', category: 'Hotel', pricePerNight: { alta: 95000, media: 76000, baja: 57000 }, amenities: ['WiFi', 'Desayuno incluido', 'Vista al lago', 'Calefacción'] },
      { name: 'Cabañas del Lago', category: 'Cabaña', pricePerNight: { alta: 68750, media: 55000, baja: 41250 }, amenities: ['WiFi', 'Cocina', 'Estacionamiento', 'Vista al lago', 'Calefacción', 'Pet friendly'] },
      { name: 'Hostel 41 Below', category: 'Hostel', pricePerNight: { alta: 27200, media: 20800, baja: 16000 }, amenities: ['WiFi', 'Bar', 'Desayuno incluido', 'Calefacción'] },
      { name: 'Sol del Nahuel', category: 'Hotel', pricePerNight: { alta: 87500, media: 70000, baja: 52500 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Estacionamiento', 'Calefacción'] },
      { name: 'Cabañas Chimpay', category: 'Cabaña', pricePerNight: { alta: 68000, media: 52000, baja: 40000 }, amenities: ['WiFi', 'Cocina', 'Estacionamiento', 'Pet friendly', 'Calefacción'] },
      { name: 'Hotel Panamericano', category: 'Hotel', pricePerNight: { alta: 110000, media: 88000, baja: 66000 }, amenities: ['WiFi', 'Desayuno incluido', 'Gimnasio', 'Piscina', 'Estacionamiento'] },
      { name: 'Huinid Hotel', category: 'Hotel', pricePerNight: { alta: 106250, media: 85000, baja: 63750 }, amenities: ['WiFi', 'Desayuno incluido', 'Spa', 'Estacionamiento', 'Calefacción'] },
      { name: 'Paso de los Andes', category: 'Hostel', pricePerNight: { alta: 17000, media: 13000, baja: 10000 }, amenities: ['WiFi', 'Cocina', 'Bar', 'Calefacción'] },
      { name: 'Arelauquen Lodge', category: 'Cabaña', pricePerNight: { alta: 120000, media: 96000, baja: 72000 }, amenities: ['WiFi', 'Piscina', 'Estacionamiento', 'Vista a la montaña', 'Calefacción'] },
      { name: 'Tango Hostel', category: 'Hostel', pricePerNight: { alta: 16250, media: 13000, baja: 9750 }, amenities: ['WiFi', 'Desayuno incluido', 'Bar', 'Terraza'] },
      { name: 'Hotel Edelweiss', category: 'Hotel', pricePerNight: { alta: 75000, media: 60000, baja: 45000 }, amenities: ['WiFi', 'Desayuno incluido', 'Calefacción', 'Estacionamiento'] },
    ],
    activities: [
      { name: 'Cerro Catedral Ski', price: 85000, duration: '6h', agency: 'SnowTravel', tags: ['Adultos', 'Deporte', 'Invierno'] },
      { name: 'Paseo en Barco Lago Nahuel Huapi', price: 35000, duration: '3h', agency: 'LakeTours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Circuito Chico', price: 12000, duration: '4h', agency: 'Bariloche Tours', tags: ['Todos', 'Paseo'] },
      { name: 'Colonia Suiza', price: 8000, duration: '3h', agency: 'Bariloche Tours', tags: ['Todos', 'Gastronomía'] },
      { name: 'Cerro Otto Teleférico', price: 15000, duration: '2h', agency: 'Cerro Otto', tags: ['Todos', 'Paisaje'] },
      { name: 'Museo del Chocolate', price: 5000, duration: '1.5h', agency: 'Fenoglio', tags: ['Niños', 'Gastronomía'] },
      { name: 'Rafting Río Manso', price: 25000, duration: '3h', agency: 'Aventura Sur', tags: ['Adultos', 'Aventura'] },
      { name: 'Cabalgata Cerro López', price: 22000, duration: '4h', agency: 'Andes Ride', tags: ['Adultos', 'Naturaleza'] },
      { name: 'Isla Victoria', price: 28000, duration: '5h', agency: 'LakeTours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Parque Nacional Arrayanes', price: 20000, duration: '4h', agency: 'LakeTours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Bici de Montaña', price: 15000, duration: '4h', agency: 'MTB Bariloche', tags: ['Adultos', 'Deporte'] },
      { name: 'Pesca Deportiva', price: 18000, duration: '5h', agency: 'Pesca Sur', tags: ['Adultos', 'Deporte'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Buenos Aires (AEP)', pricePerPerson: { alta: 120000, media: 85000, baja: 55000 }, duration: '2h 15min' },
      { type: 'Avión', carrier: 'FlyBondi', from: 'Buenos Aires (EZE)', pricePerPerson: { alta: 80000, media: 55000, baja: 35000 }, duration: '2h 15min' },
      { type: 'Bus', carrier: 'Vía Bariloche', from: 'Buenos Aires (Retiro)', pricePerPerson: { alta: 65000, media: 50000, baja: 35000 }, duration: '22h' },
    ],
    localTransport: [
      { type: 'Colectivo', description: 'Líneas 20/50', price: 2500 },
      { type: 'Taxi', description: 'Tarifa urbana', price: 2500 },
      { type: 'Transfer privado', description: 'Aeropuerto ↔ Centro', price: 25000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },

  /* ───────── 3. Mendoza ───────── */
  {
    city: 'Mendoza',
    country: 'Argentina',
    description: 'Tierra del Malbec, la ruta del vino, el Aconcagua y aventura en la cordillera. Sol, bodegas y paisajes inolvidables.',
    accommodations: [
      { name: 'Park Hyatt Mendoza', category: 'Hotel', pricePerNight: { alta: 380000, media: 304000, baja: 228000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Gimnasio', 'Restaurante', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Diplomatic Hotel', category: 'Hotel', pricePerNight: { alta: 110000, media: 88000, baja: 66000 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Gimnasio', 'Aire acondicionado'] },
      { name: 'Mendoza Backpackers', category: 'Hostel', pricePerNight: { alta: 25500, media: 19500, baja: 15000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Piscina'] },
      { name: 'Entre Cielos Hotel', category: 'Hotel', pricePerNight: { alta: 250000, media: 200000, baja: 150000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Vista a la montaña', 'Desayuno incluido', 'Estacionamiento'] },
      { name: 'Hotel Roque', category: 'Hotel', pricePerNight: { alta: 56250, media: 45000, baja: 33750 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado', 'Estacionamiento'] },
      { name: 'Casa Provincial', category: 'Hotel', pricePerNight: { alta: 106250, media: 85000, baja: 63750 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Aire acondicionado'] },
      { name: 'Hostel Lao', category: 'Hostel', pricePerNight: { alta: 20400, media: 15600, baja: 12000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Piscina'] },
      { name: 'Posada de Rosas', category: 'Hotel', pricePerNight: { alta: 81250, media: 65000, baja: 48750 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Sheraton Mendoza', category: 'Hotel', pricePerNight: { alta: 180000, media: 144000, baja: 108000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Gimnasio', 'Restaurante', 'Estacionamiento'] },
      { name: 'Hotel Intercontinental', category: 'Hotel', pricePerNight: { alta: 140000, media: 112000, baja: 84000 }, amenities: ['WiFi', 'Piscina', 'Gimnasio', 'Restaurante', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Alas Argentinas', category: 'Hostel', pricePerNight: { alta: 13600, media: 10400, baja: 8000 }, amenities: ['WiFi', 'Cocina', 'Terraza'] },
      { name: 'Cabañas Suizas', category: 'Cabaña', pricePerNight: { alta: 62500, media: 50000, baja: 37500 }, amenities: ['WiFi', 'Cocina', 'Piscina', 'Estacionamiento', 'Aire acondicionado'] },
    ],
    activities: [
      { name: 'Ruta del Vino', price: 45000, duration: '6h', agency: 'Mendoza Vinos', tags: ['Adultos', 'Gastronomía'] },
      { name: 'Rafting Río Mendoza', price: 20000, duration: '3h', agency: 'Aventura Mendoza', tags: ['Adultos', 'Aventura'] },
      { name: 'Cerro Aconcagua Trek', price: 35000, duration: '8h', agency: 'Andes Trek', tags: ['Adultos', 'Trekking'] },
      { name: 'City Tour Mendoza', price: 8000, duration: '3h', agency: 'Mendoza Tours', tags: ['Todos', 'Cultura'] },
      { name: 'Parque General San Martín', price: 2000, duration: '2h', agency: 'Parques Mendoza', tags: ['Todos', 'Naturaleza'] },
      { name: 'Enoturismo Valle de Uco', price: 55000, duration: '8h', agency: 'Valle Tours', tags: ['Adultos', 'Gastronomía'] },
      { name: 'Paseo en Globo', price: 40000, duration: '1.5h', agency: 'Globos Mendoza', tags: ['Adultos', 'Aventura'] },
      { name: 'Museo del Vino', price: 5000, duration: '2h', agency: 'Museos Mendoza', tags: ['Adultos', 'Cultura'] },
      { name: 'Termas de Cacheuta', price: 15000, duration: '5h', agency: 'Termas Mendoza', tags: ['Todos', 'Relax'] },
      { name: 'Alta Montaña (Puente Inca)', price: 18000, duration: '8h', agency: 'Montaña Tours', tags: ['Todos', 'Paisaje'] },
      { name: 'Cabalgata', price: 20000, duration: '4h', agency: 'Andes Ride', tags: ['Adultos', 'Naturaleza'] },
      { name: 'Mountain Bike', price: 12000, duration: '3h', agency: 'MTB Mendoza', tags: ['Adultos', 'Deporte'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Buenos Aires (AEP)', pricePerPerson: { alta: 95000, media: 70000, baja: 45000 }, duration: '1h 45min' },
      { type: 'Avión', carrier: 'FlyBondi', from: 'Buenos Aires (EZE)', pricePerPerson: { alta: 65000, media: 45000, baja: 28000 }, duration: '1h 45min' },
      { type: 'Bus', carrier: 'Andesmar', from: 'Buenos Aires (Retiro)', pricePerPerson: { alta: 55000, media: 42000, baja: 30000 }, duration: '14h' },
    ],
    localTransport: [
      { type: 'Mendotran', description: 'Pase libre transporte público', price: 600 },
      { type: 'Taxi', description: 'Tarifa urbana', price: 18000 },
      { type: 'Transfer privado', description: 'Aeropuerto ↔ Centro', price: 18000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },

  /* ───────── 4. Salta ───────── */
  {
    city: 'Salta',
    country: 'Argentina',
    description: 'La Linda: cerros multicolores, el Tren de las Nubes, peñas folclóricas y la ruta del vino de altura.',
    accommodations: [
      { name: 'Hotel Alejandro I', category: 'Hotel', pricePerNight: { alta: 95000, media: 76000, baja: 57000 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Gimnasio', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Kkala Boutique Hotel', category: 'Hotel', pricePerNight: { alta: 130000, media: 104000, baja: 78000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Vista a los cerros', 'Desayuno incluido'] },
      { name: 'Hostel La Casa de Arturo', category: 'Hostel', pricePerNight: { alta: 17000, media: 13000, baja: 10000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Cocina'] },
      { name: 'Hotel Salta', category: 'Hotel', pricePerNight: { alta: 68750, media: 55000, baja: 41250 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Del Milagro Hotel', category: 'Hotel', pricePerNight: { alta: 43750, media: 35000, baja: 26250 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado', 'Calefacción'] },
      { name: 'Las Wayras', category: 'Hostel', pricePerNight: { alta: 15300, media: 11700, baja: 9000 }, amenities: ['WiFi', 'Bar', 'Piscina', 'Terraza'] },
      { name: 'Posada del Cerro', category: 'Hotel', pricePerNight: { alta: 60000, media: 48000, baja: 36000 }, amenities: ['WiFi', 'Desayuno incluido', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Hotel Sheraton Salta', category: 'Hotel', pricePerNight: { alta: 160000, media: 128000, baja: 96000 }, amenities: ['WiFi', 'Piscina', 'Gimnasio', 'Restaurante', 'Estacionamiento'] },
      { name: 'Design Hostel Salta', category: 'Hostel', pricePerNight: { alta: 18700, media: 14300, baja: 11000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Desayuno incluido'] },
      { name: 'Cabañas del Valle', category: 'Cabaña', pricePerNight: { alta: 52500, media: 42000, baja: 31500 }, amenities: ['WiFi', 'Cocina', 'Piscina', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Hotel Sol de Salta', category: 'Hotel', pricePerNight: { alta: 87500, media: 70000, baja: 52500 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Estacionamiento'] },
      { name: 'Hotel Colonial', category: 'Hotel', pricePerNight: { alta: 42500, media: 32500, baja: 25000 }, amenities: ['WiFi', 'Desayuno incluido'] },
    ],
    activities: [
      { name: 'Tren de las Nubes', price: 35000, duration: '15h', agency: 'Tren a las Nubes', tags: ['Todos', 'Paisaje'] },
      { name: 'Tour a Cafayate', price: 18000, duration: '10h', agency: 'Salta Tours', tags: ['Adultos', 'Gastronomía'] },
      { name: 'Catedral de Salta', price: 3000, duration: '1h', agency: 'City Tours', tags: ['Todos', 'Cultura'] },
      { name: 'Teleférico San Bernardo', price: 5000, duration: '1h', agency: 'Teleférico Salta', tags: ['Todos', 'Paisaje'] },
      { name: 'Peña Folclórica', price: 8000, duration: '3h', agency: 'Salta Espectáculos', tags: ['Adultos', 'Espectáculo'] },
      { name: 'Museo de Arqueología MAAM', price: 4000, duration: '2h', agency: 'Museos Salta', tags: ['Adultos', 'Cultura'] },
      { name: 'Tour a Purmamarca', price: 15000, duration: '12h', agency: 'Norte Tours', tags: ['Todos', 'Paisaje'] },
      { name: 'Cuesta del Obispo', price: 12000, duration: '6h', agency: 'Montaña Tours', tags: ['Adultos', 'Paisaje'] },
      { name: 'Valle de Lerma', price: 8000, duration: '4h', agency: 'Salta Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Museo Güemes', price: 3000, duration: '1.5h', agency: 'Museos Salta', tags: ['Adultos', 'Cultura'] },
      { name: 'Tour vino de altura', price: 25000, duration: '8h', agency: 'Vinos del Norte', tags: ['Adultos', 'Gastronomía'] },
      { name: 'San Antonio de los Cobres', price: 22000, duration: '10h', agency: 'Norte Tours', tags: ['Adultos', 'Aventura'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Buenos Aires (AEP)', pricePerPerson: { alta: 110000, media: 80000, baja: 50000 }, duration: '2h 10min' },
      { type: 'Avión', carrier: 'FlyBondi', from: 'Buenos Aires (EZE)', pricePerPerson: { alta: 75000, media: 50000, baja: 30000 }, duration: '2h 10min' },
      { type: 'Bus', carrier: 'Flecha Bus', from: 'Buenos Aires (Retiro)', pricePerPerson: { alta: 60000, media: 45000, baja: 32000 }, duration: '18h' },
    ],
    localTransport: [
      { type: 'SAETA', description: 'Boleto transporte urbano', price: 350 },
      { type: 'Taxi', description: 'Tarifa urbana', price: 16000 },
      { type: 'Transfer privado', description: 'Aeropuerto ↔ Centro', price: 16000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },

  /* ───────── 5. Córdoba ───────── */
  {
    city: 'Córdoba',
    country: 'Argentina',
    description: 'La Docta: sierras, cuarteto, historia jesuítica, Villa Carlos Paz y la mejor vida nocturna del interior.',
    accommodations: [
      { name: 'Sheraton Córdoba', category: 'Hotel', pricePerNight: { alta: 150000, media: 120000, baja: 90000 }, amenities: ['WiFi', 'Piscina', 'Gimnasio', 'Restaurante', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Hotel Windsor', category: 'Hotel', pricePerNight: { alta: 56250, media: 45000, baja: 33750 }, amenities: ['WiFi', 'Desayuno incluido', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Hostel Celeste', category: 'Hostel', pricePerNight: { alta: 17000, media: 13000, baja: 10000 }, amenities: ['WiFi', 'Bar', 'Terraza'] },
      { name: 'NH Córdoba Panorama', category: 'Hotel', pricePerNight: { alta: 75000, media: 60000, baja: 45000 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Gimnasio', 'Aire acondicionado'] },
      { name: 'Holiday Inn Córdoba', category: 'Hotel', pricePerNight: { alta: 85000, media: 68000, baja: 51000 }, amenities: ['WiFi', 'Piscina', 'Gimnasio', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'La Cañada Hostel', category: 'Hostel', pricePerNight: { alta: 20400, media: 15600, baja: 12000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Cocina'] },
      { name: 'Hotel Dorá', category: 'Hotel', pricePerNight: { alta: 37500, media: 30000, baja: 22500 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado'] },
      { name: 'Cabañas El Sauce', category: 'Cabaña', pricePerNight: { alta: 50000, media: 40000, baja: 30000 }, amenities: ['WiFi', 'Cocina', 'Piscina', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Quorum Hotel', category: 'Hotel', pricePerNight: { alta: 110000, media: 88000, baja: 66000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Gimnasio', 'Restaurante', 'Estacionamiento'] },
      { name: 'Andenes Hostel', category: 'Hostel', pricePerNight: { alta: 13600, media: 10400, baja: 8000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Desayuno incluido'] },
      { name: 'Hotel de la Ciudad', category: 'Hotel', pricePerNight: { alta: 43750, media: 35000, baja: 26250 }, amenities: ['WiFi', 'Desayuno incluido', 'Estacionamiento'] },
      { name: 'Mirador de las Sierras', category: 'Cabaña', pricePerNight: { alta: 55000, media: 44000, baja: 33000 }, amenities: ['WiFi', 'Piscina', 'Vista a las sierras', 'Estacionamiento', 'Aire acondicionado'] },
    ],
    activities: [
      { name: 'Manzana Jesuítica', price: 5000, duration: '2h', agency: 'Córdoba Tours', tags: ['Todos', 'Cultura'] },
      { name: 'Villa Carlos Paz', price: 8000, duration: '4h', agency: 'Sierras Tours', tags: ['Todos', 'Paseo'] },
      { name: 'Museo Superior de Bellas Artes', price: 3000, duration: '2h', agency: 'Museos Córdoba', tags: ['Adultos', 'Cultura'] },
      { name: 'Cerro Uritorco Trek', price: 15000, duration: '6h', agency: 'Trekking Córdoba', tags: ['Adultos', 'Trekking'] },
      { name: 'Dique Los Molinos', price: 8000, duration: '4h', agency: 'Lagos Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Tour de la Bomba', price: 10000, duration: '2h', agency: 'Bomba Tours', tags: ['Adultos', 'Cultura'] },
      { name: 'Río Cuarto Safari', price: 12000, duration: '5h', agency: 'Safari Córdoba', tags: ['Adultos', 'Aventura'] },
      { name: 'Parque Nacional Quebrada del Condorito', price: 5000, duration: '6h', agency: 'Parques Córdoba', tags: ['Adultos', 'Naturaleza'] },
      { name: 'Cabalgar en las Sierras', price: 12000, duration: '4h', agency: 'Sierras Ride', tags: ['Adultos', 'Naturaleza'] },
      { name: 'Museo Casa de la Moneda', price: 2000, duration: '1.5h', agency: 'Museos Córdoba', tags: ['Todos', 'Cultura'] },
      { name: 'Tour Gastronómico', price: 15000, duration: '3h', agency: 'Food Tours CBA', tags: ['Adultos', 'Gastronomía'] },
      { name: 'Rafting en Villa General Belgrano', price: 18000, duration: '3h', agency: 'Aventura Córdoba', tags: ['Adultos', 'Aventura'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Buenos Aires (AEP)', pricePerPerson: { alta: 75000, media: 55000, baja: 35000 }, duration: '1h 20min' },
      { type: 'Avión', carrier: 'FlyBondi', from: 'Buenos Aires (EZE)', pricePerPerson: { alta: 50000, media: 35000, baja: 22000 }, duration: '1h 20min' },
      { type: 'Bus', carrier: 'Chevallier', from: 'Buenos Aires (Retiro)', pricePerPerson: { alta: 45000, media: 35000, baja: 25000 }, duration: '10h' },
    ],
    localTransport: [
      { type: 'CityBus', description: 'Boleto transporte urbano', price: 350 },
      { type: 'Taxi', description: 'Tarifa urbana', price: 14000 },
      { type: 'Transfer privado', description: 'Aeropuerto ↔ Centro', price: 14000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },

  /* ───────── 6. Iguazú ───────── */
  {
    city: 'Iguazú',
    country: 'Argentina',
    description: 'Las Cataratas del Iguazú, una de las 7 maravillas naturales del mundo. Selva misionera, fauna exótica y aventura.',
    accommodations: [
      { name: 'Gran Meliá Iguazú', category: 'Hotel', pricePerNight: { alta: 320000, media: 256000, baja: 192000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Gimnasio', 'Vista a la selva', 'Restaurante', 'Estacionamiento'] },
      { name: 'Hotel Saint George', category: 'Hotel', pricePerNight: { alta: 93750, media: 75000, baja: 56250 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Hostel Papillón', category: 'Hostel', pricePerNight: { alta: 20400, media: 15600, baja: 12000 }, amenities: ['WiFi', 'Piscina', 'Bar', 'Terraza'] },
      { name: 'Iguazú Grand Hotel', category: 'Hotel', pricePerNight: { alta: 95000, media: 76000, baja: 57000 }, amenities: ['WiFi', 'Piscina', 'Spa', 'Restaurante', 'Estacionamiento'] },
      { name: 'Hotel Selva', category: 'Hotel', pricePerNight: { alta: 56250, media: 45000, baja: 33750 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Resort Amayal', category: 'Hotel', pricePerNight: { alta: 200000, media: 160000, baja: 120000 }, amenities: ['WiFi', 'Piscina', 'Spa', 'Gimnasio', 'Restaurante', 'Vista a la selva'] },
      { name: 'Cabañas Yasy', category: 'Cabaña', pricePerNight: { alta: 43750, media: 35000, baja: 26250 }, amenities: ['WiFi', 'Cocina', 'Piscina', 'Estacionamiento'] },
      { name: 'Zafarrancho Hostel', category: 'Hostel', pricePerNight: { alta: 17000, media: 13000, baja: 10000 }, amenities: ['WiFi', 'Bar', 'Piscina', 'Terraza'] },
      { name: 'Panoramic Iguazú', category: 'Hotel', pricePerNight: { alta: 75000, media: 60000, baja: 45000 }, amenities: ['WiFi', 'Piscina', 'Aire acondicionado', 'Estacionamiento', 'Desayuno incluido'] },
      { name: 'La Sorgenda', category: 'Hotel', pricePerNight: { alta: 85000, media: 65000, baja: 50000 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Aire acondicionado'] },
      { name: 'Hotel Posada 21', category: 'Hotel', pricePerNight: { alta: 47600, media: 36400, baja: 28000 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina'] },
      { name: 'Iguazú Jungle Hostel', category: 'Hostel', pricePerNight: { alta: 13600, media: 10400, baja: 8000 }, amenities: ['WiFi', 'Piscina', 'Bar', 'Terraza', 'Actividades'] },
    ],
    activities: [
      { name: 'Cataratas Lado Argentino', price: 25000, duration: '5h', agency: 'Parques Nacionales', tags: ['Todos', 'Naturaleza'] },
      { name: 'Cataratas Lado Brasileño', price: 30000, duration: '4h', agency: 'Iguazú Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Paseo en Barco bajo las Cataratas', price: 35000, duration: '1h', agency: 'Aventura Iguazú', tags: ['Adultos', 'Aventura'] },
      { name: 'Güirá Oga (Centro de Aves)', price: 8000, duration: '2h', agency: 'Güirá Oga', tags: ['Todos', 'Naturaleza'] },
      { name: 'Sendero Verde', price: 5000, duration: '2h', agency: 'Parques Nacionales', tags: ['Todos', 'Naturaleza'] },
      { name: 'Museo de la Imagen', price: 2000, duration: '1h', agency: 'Museos Iguazú', tags: ['Todos', 'Cultura'] },
      { name: 'Tour a las Ruinas Jesuitas', price: 10000, duration: '4h', agency: 'Historia Tours', tags: ['Adultos', 'Cultura'] },
      { name: 'Comunidad Guaraní', price: 8000, duration: '2h', agency: 'Culturas Iguazú', tags: ['Adultos', 'Cultura'] },
      { name: 'Bici por la Selva', price: 12000, duration: '3h', agency: 'Selva Bike', tags: ['Adultos', 'Deporte'] },
      { name: 'Rapel en Cataratas', price: 25000, duration: '2h', agency: 'Aventura Iguazú', tags: ['Adultos', 'Aventura'] },
      { name: 'Paseo en Helicóptero', price: 60000, duration: '30min', agency: 'Helicópteros Iguazú', tags: ['Adultos', 'Aventura'] },
      { name: 'Parque das Aves (BR)', price: 15000, duration: '2h', agency: 'Parque das Aves', tags: ['Todos', 'Naturaleza'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Buenos Aires (AEP)', pricePerPerson: { alta: 130000, media: 95000, baja: 60000 }, duration: '1h 50min' },
      { type: 'Avión', carrier: 'FlyBondi', from: 'Buenos Aires (EZE)', pricePerPerson: { alta: 85000, media: 60000, baja: 35000 }, duration: '1h 50min' },
      { type: 'Bus', carrier: 'Río Uruguay', from: 'Buenos Aires (Retiro)', pricePerPerson: { alta: 70000, media: 55000, baja: 38000 }, duration: '18h' },
    ],
    localTransport: [
      { type: 'Colectivo', description: 'Colectivo local', price: 200 },
      { type: 'Taxi', description: 'Tarifa urbana', price: 20000 },
      { type: 'Transfer privado', description: 'Aeropuerto ↔ Hotel', price: 20000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },

  /* ───────── 7. Ushuaia ───────── */
  {
    city: 'Ushuaia',
    country: 'Argentina',
    description: 'La ciudad más austral del mundo: glaciares, Canal Beagle, Cerro Castor y el mítico Tren del Fin del Mundo.',
    accommodations: [
      { name: 'Los Cauquenes Resort', category: 'Hotel', pricePerNight: { alta: 280000, media: 224000, baja: 168000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Gimnasio', 'Vista al canal', 'Restaurante', 'Estacionamiento'] },
      { name: 'Hotel Albatros', category: 'Hotel', pricePerNight: { alta: 106250, media: 85000, baja: 63750 }, amenities: ['WiFi', 'Desayuno incluido', 'Calefacción', 'Vista al canal'] },
      { name: 'Antarctica Hostel', category: 'Hostel', pricePerNight: { alta: 30600, media: 23400, baja: 18000 }, amenities: ['WiFi', 'Bar', 'Calefacción', 'Desayuno incluido'] },
      { name: 'Hotel Lennox', category: 'Hotel', pricePerNight: { alta: 120000, media: 96000, baja: 72000 }, amenities: ['WiFi', 'Desayuno incluido', 'Spa', 'Calefacción', 'Vista al mar'] },
      { name: 'Cabañas del Beagle', category: 'Cabaña', pricePerNight: { alta: 81250, media: 65000, baja: 48750 }, amenities: ['WiFi', 'Cocina', 'Calefacción', 'Estacionamiento', 'Vista al canal'] },
      { name: 'Hostel Cruz del Sur', category: 'Hostel', pricePerNight: { alta: 23800, media: 18200, baja: 14000 }, amenities: ['WiFi', 'Cocina', 'Calefacción', 'Bar'] },
      { name: 'Hotel Tierra del Fuego', category: 'Hotel', pricePerNight: { alta: 68750, media: 55000, baja: 41250 }, amenities: ['WiFi', 'Desayuno incluido', 'Calefacción', 'Estacionamiento'] },
      { name: 'Las Hayas Resort', category: 'Hotel', pricePerNight: { alta: 190000, media: 152000, baja: 114000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Gimnasio', 'Vista a la bahía', 'Restaurante'] },
      { name: 'Posada del Fin del Mundo', category: 'Hotel', pricePerNight: { alta: 68000, media: 52000, baja: 40000 }, amenities: ['WiFi', 'Desayuno incluido', 'Calefacción'] },
      { name: 'Cabañas Alakush', category: 'Cabaña', pricePerNight: { alta: 62500, media: 50000, baja: 37500 }, amenities: ['WiFi', 'Cocina', 'Calefacción', 'Vista al canal', 'Estacionamiento'] },
      { name: 'Hotel Canal Beagle', category: 'Hotel', pricePerNight: { alta: 87500, media: 70000, baja: 52500 }, amenities: ['WiFi', 'Desayuno incluido', 'Calefacción', 'Vista al canal'] },
      { name: 'Yaghan Hostel', category: 'Hostel', pricePerNight: { alta: 18700, media: 14300, baja: 11000 }, amenities: ['WiFi', 'Bar', 'Calefacción', 'Cocina'] },
    ],
    activities: [
      { name: 'Tren del Fin del Mundo', price: 20000, duration: '1.5h', agency: 'Tren Fueguino', tags: ['Todos', 'Cultura'] },
      { name: 'Parque Nacional Tierra del Fuego', price: 15000, duration: '5h', agency: 'Parques Nacionales', tags: ['Todos', 'Naturaleza'] },
      { name: 'Navegación Canal Beagle', price: 25000, duration: '3h', agency: 'Beagle Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Cerro Castor Ski', price: 45000, duration: '6h', agency: 'Snow Fueguina', tags: ['Adultos', 'Deporte', 'Invierno'] },
      { name: 'Museo del Fin del Mundo', price: 5000, duration: '1.5h', agency: 'Museos Ushuaia', tags: ['Todos', 'Cultura'] },
      { name: 'Excursión a Isla Martillo (pingüinos)', price: 30000, duration: '4h', agency: 'Pingüino Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Lagos Fueguinos', price: 18000, duration: '5h', agency: 'Lagos Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Cabo de Hornos Heli', price: 55000, duration: '2h', agency: 'Helicópteros Ushuaia', tags: ['Adultos', 'Aventura'] },
      { name: 'Paseo en 4x4', price: 22000, duration: '4h', agency: 'Ushuaia 4x4', tags: ['Adultos', 'Aventura'] },
      { name: 'Trekking Glaciar Martial', price: 12000, duration: '4h', agency: 'Trekking Sur', tags: ['Adultos', 'Trekking'] },
      { name: 'Museo Marítimo', price: 5000, duration: '2h', agency: 'Museos Ushuaia', tags: ['Todos', 'Cultura'] },
      { name: 'Pesca Deportiva', price: 20000, duration: '5h', agency: 'Pesca Fueguina', tags: ['Adultos', 'Deporte'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Buenos Aires (AEP)', pricePerPerson: { alta: 180000, media: 130000, baja: 85000 }, duration: '3h 30min' },
      { type: 'Avión', carrier: 'FlyBondi', from: 'Buenos Aires (EZE)', pricePerPerson: { alta: 120000, media: 85000, baja: 55000 }, duration: '3h 30min' },
    ],
    localTransport: [
      { type: 'Colectivo', description: 'Líneas A/B', price: 300 },
      { type: 'Taxi', description: 'Tarifa urbana', price: 22000 },
      { type: 'Transfer privado', description: 'Aeropuerto ↔ Centro', price: 22000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },

  /* ───────── 8. El Calafate ───────── */
  {
    city: 'El Calafate',
    country: 'Argentina',
    description: 'Puerta de entrada al Glaciar Perito Moreno y el Parque Nacional Los Glaciares. Paisajes patagónicos imponentes.',
    accommodations: [
      { name: 'Los Alamos Hotel', category: 'Hotel', pricePerNight: { alta: 130000, media: 104000, baja: 78000 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Spa', 'Estacionamiento', 'Calefacción'] },
      { name: 'Hotel Mirador del Lago', category: 'Hotel', pricePerNight: { alta: 95000, media: 76000, baja: 57000 }, amenities: ['WiFi', 'Desayuno incluido', 'Vista al lago', 'Calefacción', 'Estacionamiento'] },
      { name: 'America del Sur Hostel', category: 'Hostel', pricePerNight: { alta: 27200, media: 20800, baja: 16000 }, amenities: ['WiFi', 'Bar', 'Calefacción', 'Desayuno incluido'] },
      { name: 'Xelena Hotel', category: 'Hotel', pricePerNight: { alta: 220000, media: 176000, baja: 132000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Gimnasio', 'Vista a la montaña', 'Restaurante'] },
      { name: 'Hotel Kosten Aike', category: 'Hotel', pricePerNight: { alta: 75000, media: 60000, baja: 45000 }, amenities: ['WiFi', 'Desayuno incluido', 'Calefacción', 'Estacionamiento'] },
      { name: 'Cabañas del Glaciar', category: 'Cabaña', pricePerNight: { alta: 68750, media: 55000, baja: 41250 }, amenities: ['WiFi', 'Cocina', 'Calefacción', 'Estacionamiento', 'Vista al lago'] },
      { name: 'Design Suites Calafate', category: 'Hotel', pricePerNight: { alta: 150000, media: 120000, baja: 90000 }, amenities: ['WiFi', 'Piscina', 'Spa', 'Gimnasio', 'Desayuno incluido'] },
      { name: 'Calafate Hostel', category: 'Hostel', pricePerNight: { alta: 20400, media: 15600, baja: 12000 }, amenities: ['WiFi', 'Bar', 'Cocina', 'Calefacción'] },
      { name: 'Hotel Sierra Nevada', category: 'Hotel', pricePerNight: { alta: 56250, media: 45000, baja: 33750 }, amenities: ['WiFi', 'Desayuno incluido', 'Calefacción', 'Estacionamiento'] },
      { name: 'Posada El Ensueño', category: 'Hotel', pricePerNight: { alta: 59500, media: 45500, baja: 35000 }, amenities: ['WiFi', 'Desayuno incluido', 'Calefacción'] },
      { name: 'Cabañas del Sur', category: 'Cabaña', pricePerNight: { alta: 60000, media: 48000, baja: 36000 }, amenities: ['WiFi', 'Cocina', 'Calefacción', 'Estacionamiento'] },
      { name: 'Hotel Esplendor', category: 'Hotel', pricePerNight: { alta: 106250, media: 85000, baja: 63750 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Calefacción'] },
    ],
    activities: [
      { name: 'Glaciar Perito Moreno', price: 35000, duration: '5h', agency: 'Parques Nacionales', tags: ['Todos', 'Naturaleza'] },
      { name: 'Minitrekking Glaciar', price: 55000, duration: '5h', agency: 'Glaciar Trek', tags: ['Adultos', 'Aventura'] },
      { name: 'Navegación Glaciares Upsala', price: 45000, duration: '8h', agency: 'Glaciar Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Laguna Nimez', price: 3000, duration: '1.5h', agency: 'Parques Nacionales', tags: ['Todos', 'Naturaleza'] },
      { name: 'Museo Regional', price: 4000, duration: '1.5h', agency: 'Museos Calafate', tags: ['Adultos', 'Cultura'] },
      { name: 'Astroturismo', price: 15000, duration: '3h', agency: 'Estrellas Patagonia', tags: ['Adultos', 'Ciencia'] },
      { name: 'Paseo en Barco Río Santa Cruz', price: 12000, duration: '3h', agency: 'Río Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Cabalgata', price: 18000, duration: '4h', agency: 'Patagonia Ride', tags: ['Adultos', 'Naturaleza'] },
      { name: 'Bici Glaciar', price: 10000, duration: '4h', agency: 'MTB Calafate', tags: ['Adultos', 'Deporte'] },
      { name: 'Parque Nacional los Glaciares', price: 20000, duration: '8h', agency: 'Parques Nacionales', tags: ['Todos', 'Naturaleza'] },
      { name: 'Tour de la Estancia', price: 15000, duration: '5h', agency: 'Estancia Tours', tags: ['Adultos', 'Cultura'] },
      { name: 'Observación de Fauna', price: 8000, duration: '3h', agency: 'Fauna Sur', tags: ['Todos', 'Naturaleza'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Buenos Aires (AEP)', pricePerPerson: { alta: 200000, media: 145000, baja: 95000 }, duration: '3h 15min' },
      { type: 'Avión', carrier: 'FlyBondi', from: 'Buenos Aires (EZE)', pricePerPerson: { alta: 140000, media: 100000, baja: 65000 }, duration: '3h 15min' },
    ],
    localTransport: [
      { type: 'Taxi', description: 'Tarifa urbana', price: 3000 },
      { type: 'Transfer privado', description: 'Aeropuerto ↔ Centro', price: 23000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },

  /* ───────── 9. Puerto Madryn ───────── */
  {
    city: 'Puerto Madryn',
    country: 'Argentina',
    description: 'Capital del buceo argentino: ballenas, pingüinos en Punta Tombo, lobos marinos y la Península Valdés.',
    accommodations: [
      { name: 'Hotel Bahía Nueva', category: 'Hotel', pricePerNight: { alta: 85000, media: 68000, baja: 51000 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Dazzler Puerto Madryn', category: 'Hotel', pricePerNight: { alta: 81250, media: 65000, baja: 48750 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Gimnasio', 'Aire acondicionado'] },
      { name: 'Hostel El Puerto', category: 'Hostel', pricePerNight: { alta: 20400, media: 15600, baja: 12000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Cocina'] },
      { name: 'Playa Hotel', category: 'Hotel', pricePerNight: { alta: 70000, media: 56000, baja: 42000 }, amenities: ['WiFi', 'Vista al mar', 'Desayuno incluido', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Hotel Golf International', category: 'Hotel', pricePerNight: { alta: 56250, media: 45000, baja: 33750 }, amenities: ['WiFi', 'Piscina', 'Desayuno incluido', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Cabañas del Mar', category: 'Cabaña', pricePerNight: { alta: 62500, media: 50000, baja: 37500 }, amenities: ['WiFi', 'Cocina', 'Estacionamiento', 'Aire acondicionado', 'Pet friendly'] },
      { name: 'Hostel Patagonia', category: 'Hostel', pricePerNight: { alta: 17000, media: 13000, baja: 10000 }, amenities: ['WiFi', 'Bar', 'Cocina', 'Terraza'] },
      { name: 'Hotel Australis', category: 'Hotel', pricePerNight: { alta: 68750, media: 55000, baja: 41250 }, amenities: ['WiFi', 'Desayuno incluido', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Tolosana Hotel', category: 'Hotel', pricePerNight: { alta: 59500, media: 45500, baja: 35000 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado', 'Estacionamiento'] },
      { name: 'Hotel Gran Hotel Madryn', category: 'Hotel', pricePerNight: { alta: 68000, media: 52000, baja: 40000 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado'] },
      { name: 'Cabañas Puerto Madryn', category: 'Cabaña', pricePerNight: { alta: 52500, media: 42000, baja: 31500 }, amenities: ['WiFi', 'Cocina', 'Piscina', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Hotel Península', category: 'Hotel', pricePerNight: { alta: 95000, media: 76000, baja: 57000 }, amenities: ['WiFi', 'Piscina', 'Spa', 'Gimnasio', 'Vista al mar', 'Restaurante'] },
    ],
    activities: [
      { name: 'Punta Tombo (pingüinos)', price: 18000, duration: '6h', agency: 'Fauna Madryn', tags: ['Todos', 'Naturaleza'] },
      { name: 'Península Valdés', price: 25000, duration: '10h', agency: 'Peninsula Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Avistaje de Ballenas', price: 30000, duration: '2h', agency: 'Ballenas Madryn', tags: ['Todos', 'Naturaleza'] },
      { name: 'Museo Oceánico', price: 4000, duration: '1.5h', agency: 'Museos Madryn', tags: ['Todos', 'Cultura'] },
      { name: 'Snorkel con Lobos Marinos', price: 20000, duration: '2h', agency: 'Buceo Madryn', tags: ['Adultos', 'Aventura'] },
      { name: 'Puerto Pirámides', price: 15000, duration: '5h', agency: 'Peninsula Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Buceo en Puerto Madryn', price: 25000, duration: '3h', agency: 'Buceo Madryn', tags: ['Adultos', 'Aventura'] },
      { name: 'Kayak en la Bahía', price: 12000, duration: '2h', agency: 'Kayak Sur', tags: ['Adultos', 'Deporte'] },
      { name: 'Reserva Natural San Pablo', price: 8000, duration: '3h', agency: 'Naturaleza Madryn', tags: ['Todos', 'Naturaleza'] },
      { name: 'Observación de Aves', price: 5000, duration: '3h', agency: 'Aves Madryn', tags: ['Todos', 'Naturaleza'] },
      { name: 'Isla de los Pájaros', price: 10000, duration: '3h', agency: 'Aves Madryn', tags: ['Todos', 'Naturaleza'] },
      { name: 'Paseo en Barco por el Golfo', price: 15000, duration: '2h', agency: 'Golfo Tours', tags: ['Todos', 'Paseo'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Buenos Aires (AEP)', pricePerPerson: { alta: 140000, media: 100000, baja: 65000 }, duration: '2h' },
      { type: 'Avión', carrier: 'FlyBondi', from: 'Buenos Aires (EZE)', pricePerPerson: { alta: 95000, media: 65000, baja: 40000 }, duration: '2h' },
      { type: 'Bus', carrier: 'Mar y Valle', from: 'Buenos Aires (Retiro)', pricePerPerson: { alta: 65000, media: 50000, baja: 35000 }, duration: '18h' },
    ],
    localTransport: [
      { type: 'Colectivo', description: 'Colectivo urbano', price: 250 },
      { type: 'Taxi', description: 'Tarifa urbana', price: 17000 },
      { type: 'Transfer privado', description: 'Aeropuerto ↔ Centro', price: 17000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },

  /* ───────── 10. Mar del Plata ───────── */
  {
    city: 'Mar del Plata',
    country: 'Argentina',
    description: 'La Feliz: playas atlánticas, puerto pesquero, lobos marinos, casino y la mejor vida nocturna costera.',
    accommodations: [
      { name: 'Hotel Costa Galana', category: 'Hotel', pricePerNight: { alta: 180000, media: 144000, baja: 108000 }, amenities: ['WiFi', 'Piscina', 'Spa', 'Gimnasio', 'Vista al mar', 'Restaurante', 'Estacionamiento'] },
      { name: 'NH Gran Hotel Provincial', category: 'Hotel', pricePerNight: { alta: 85000, media: 68000, baja: 51000 }, amenities: ['WiFi', 'Desayuno incluido', 'Vista al mar', 'Aire acondicionado'] },
      { name: 'Hostel Estación', category: 'Hostel', pricePerNight: { alta: 20400, media: 15600, baja: 12000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Cocina'] },
      { name: 'Hotel Alma', category: 'Hotel', pricePerNight: { alta: 56250, media: 45000, baja: 33750 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado', 'Calefacción'] },
      { name: 'Hotel Trevijano', category: 'Hotel', pricePerNight: { alta: 59500, media: 45500, baja: 35000 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado'] },
      { name: 'Cabañas del Bosque', category: 'Cabaña', pricePerNight: { alta: 62500, media: 50000, baja: 37500 }, amenities: ['WiFi', 'Cocina', 'Estacionamiento', 'Aire acondicionado', 'Pet friendly'] },
      { name: 'Hotel Faro Norte', category: 'Hotel', pricePerNight: { alta: 47600, media: 36400, baja: 28000 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado'] },
      { name: 'Sheraton Mar del Plata', category: 'Hotel', pricePerNight: { alta: 220000, media: 176000, baja: 132000 }, amenities: ['WiFi', 'Piscina', 'Spa', 'Gimnasio', 'Vista al mar', 'Restaurante', 'Estacionamiento'] },
      { name: 'Hostel Nómade', category: 'Hostel', pricePerNight: { alta: 17000, media: 13000, baja: 10000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Desayuno incluido'] },
      { name: 'Hotel Versailles', category: 'Hotel', pricePerNight: { alta: 43750, media: 35000, baja: 26250 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado', 'Estacionamiento'] },
      { name: 'Cabañas Las Brusquitas', category: 'Cabaña', pricePerNight: { alta: 60000, media: 48000, baja: 36000 }, amenities: ['WiFi', 'Piscina', 'Estacionamiento', 'Aire acondicionado', 'Vista al mar'] },
      { name: 'Hotel Presidente', category: 'Hotel', pricePerNight: { alta: 52500, media: 42000, baja: 31500 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado', 'Estacionamiento'] },
    ],
    activities: [
      { name: 'Museo MAR', price: 2000, duration: '2h', agency: 'Museos MDP', tags: ['Todos', 'Cultura'] },
      { name: 'Casino Central', price: 5000, duration: '3h', agency: 'Casinos MDP', tags: ['Adultos', 'Entretenimiento'] },
      { name: 'Acuario Mar del Plata', price: 12000, duration: '2h', agency: 'Acuario MDP', tags: ['Niños', 'Naturaleza'] },
      { name: 'Torreón del Monje', price: 3000, duration: '1h', agency: 'Torres MDP', tags: ['Todos', 'Cultura'] },
      { name: 'Playa Bristol', price: 0, duration: '4h', agency: 'Gratuito', tags: ['Todos', 'Playa'] },
      { name: 'Parque de los Camellos', price: 5000, duration: '2h', agency: 'Parques MDP', tags: ['Niños', 'Entretenimiento'] },
      { name: 'Paseo en Barco por el Puerto', price: 10000, duration: '1.5h', agency: 'Puerto Tours', tags: ['Todos', 'Paseo'] },
      { name: 'Museo de la Ciudad', price: 2000, duration: '1.5h', agency: 'Museos MDP', tags: ['Adultos', 'Cultura'] },
      { name: 'Pesca en Escollera', price: 5000, duration: '4h', agency: 'Pesca MDP', tags: ['Adultos', 'Deporte'] },
      { name: 'Teatro Colón MDP', price: 8000, duration: '2h', agency: 'Teatros MDP', tags: ['Adultos', 'Cultura'] },
      { name: 'Club de Golf', price: 15000, duration: '4h', agency: 'Golf MDP', tags: ['Adultos', 'Deporte'] },
      { name: 'Plaza del Agua', price: 1000, duration: '2h', agency: 'Parques MDP', tags: ['Todos', 'Entretenimiento'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Buenos Aires (AEP)', pricePerPerson: { alta: 65000, media: 45000, baja: 30000 }, duration: '55min' },
      { type: 'Bus', carrier: 'Plusmar', from: 'Buenos Aires (Retiro)', pricePerPerson: { alta: 35000, media: 25000, baja: 18000 }, duration: '5h 30min' },
      { type: 'Auto', carrier: 'Ruta 2 (peaje)', from: 'Buenos Aires', pricePerPerson: { alta: 20000, media: 18000, baja: 15000 }, duration: '4h' },
    ],
    localTransport: [
      { type: 'Colectivo', description: 'Líneas 511/512', price: 300 },
      { type: 'Taxi', description: 'Tarifa urbana', price: 13000 },
      { type: 'Transfer privado', description: 'Aeropuerto ↔ Centro', price: 13000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },

  /* ───────── 11. Rosario ───────── */
  {
    city: 'Rosario',
    country: 'Argentina',
    description: 'Cuna de la Bandera y de Messi. Costanera sobre el Paraná, islas, gastronomía y vibrante vida cultural.',
    accommodations: [
      { name: 'Pullman Rosario', category: 'Hotel', pricePerNight: { alta: 130000, media: 104000, baja: 78000 }, amenities: ['WiFi', 'Piscina', 'Gimnasio', 'Restaurante', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Holiday Inn Rosario', category: 'Hotel', pricePerNight: { alta: 106250, media: 85000, baja: 63750 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Gimnasio', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Hostel Rosario Inn', category: 'Hostel', pricePerNight: { alta: 20400, media: 15600, baja: 12000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Cocina'] },
      { name: 'Hotel Dazzler Rosario', category: 'Hotel', pricePerNight: { alta: 81250, media: 65000, baja: 48750 }, amenities: ['WiFi', 'Desayuno incluido', 'Piscina', 'Gimnasio', 'Aire acondicionado'] },
      { name: 'Hotel Ariston', category: 'Hotel', pricePerNight: { alta: 59500, media: 45500, baja: 35000 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado'] },
      { name: 'Cabañas del Río', category: 'Cabaña', pricePerNight: { alta: 62500, media: 50000, baja: 37500 }, amenities: ['WiFi', 'Cocina', 'Estacionamiento', 'Aire acondicionado', 'Vista al río'] },
      { name: 'Estación Rosario Hostel', category: 'Hostel', pricePerNight: { alta: 17000, media: 13000, baja: 10000 }, amenities: ['WiFi', 'Bar', 'Terraza', 'Cocina'] },
      { name: 'Hotel Plaza Real', category: 'Hotel', pricePerNight: { alta: 56250, media: 45000, baja: 33750 }, amenities: ['WiFi', 'Desayuno incluido', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Hotel Ros Tower', category: 'Hotel', pricePerNight: { alta: 95000, media: 76000, baja: 57000 }, amenities: ['WiFi', 'Piscina', 'Gimnasio', 'Restaurante', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Hotel Eirado', category: 'Hotel', pricePerNight: { alta: 54400, media: 41600, baja: 32000 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado'] },
      { name: 'Cabañas del Parque', category: 'Cabaña', pricePerNight: { alta: 50000, media: 40000, baja: 30000 }, amenities: ['WiFi', 'Cocina', 'Estacionamiento', 'Aire acondicionado'] },
      { name: 'Hotel Colonial Rosario', category: 'Hotel', pricePerNight: { alta: 42500, media: 32500, baja: 25000 }, amenities: ['WiFi', 'Desayuno incluido', 'Aire acondicionado'] },
    ],
    activities: [
      { name: 'Monumento a la Bandera', price: 2000, duration: '1.5h', agency: 'Monumento', tags: ['Todos', 'Cultura'] },
      { name: 'Parque Independencia', price: 1000, duration: '2h', agency: 'Parques Rosario', tags: ['Todos', 'Naturaleza'] },
      { name: 'Museo de la Memoria', price: 2000, duration: '2h', agency: 'Museos Rosario', tags: ['Adultos', 'Cultura'] },
      { name: 'Isla de los Inventos', price: 5000, duration: '2h', agency: 'Inventos Rosario', tags: ['Niños', 'Educación'] },
      { name: 'Río Paraná Paseo en Barco', price: 8000, duration: '2h', agency: 'Río Tours', tags: ['Todos', 'Paseo'] },
      { name: 'Bici por la Costanera', price: 2000, duration: '2h', agency: 'Bici Rosario', tags: ['Todos', 'Deporte'] },
      { name: 'Museo Castagnino', price: 3000, duration: '2h', agency: 'Museos Rosario', tags: ['Adultos', 'Cultura'] },
      { name: 'Tiro al Blanco', price: 10000, duration: '2h', agency: 'Deportes Rosario', tags: ['Adultos', 'Deporte'] },
      { name: 'Gastronomía en Pichincha', price: 12000, duration: '3h', agency: 'Food Tours Ros', tags: ['Adultos', 'Gastronomía'] },
      { name: 'Planetario de Rosario', price: 3000, duration: '1.5h', agency: 'Planetario Ros', tags: ['Niños', 'Educación'] },
      { name: 'Estadio Gigante de Arroyito', price: 5000, duration: '2h', agency: 'Fútbol Rosario', tags: ['Adultos', 'Deporte'] },
      { name: 'Paseo del Siglo', price: 1000, duration: '1.5h', agency: 'Paseos Rosario', tags: ['Todos', 'Paseo'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Buenos Aires (AEP)', pricePerPerson: { alta: 55000, media: 40000, baja: 25000 }, duration: '50min' },
      { type: 'Bus', carrier: 'Tienda León', from: 'Buenos Aires (Retiro)', pricePerPerson: { alta: 25000, media: 18000, baja: 12000 }, duration: '4h' },
      { type: 'Auto', carrier: 'Autopista Rosario-BA (peaje)', from: 'Buenos Aires', pricePerPerson: { alta: 15000, media: 12000, baja: 10000 }, duration: '3h 30min' },
    ],
    localTransport: [
      { type: 'Colectivo', description: 'Líneas 100/200', price: 280 },
      { type: 'Taxi', description: 'Tarifa urbana', price: 12000 },
      { type: 'Transfer privado', description: 'Aeropuerto ↔ Centro', price: 12000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },

  /* ───────── 12. San Martín de los Andes ───────── */
  {
    city: 'San Martín de los Andes',
    country: 'Argentina',
    description: 'Villa de montaña junto al lago Lácar: Cerro Chapelco, Parque Nacional Lanín, termas y una gastronomía patagónica de primer nivel.',
    accommodations: [
      { name: 'Hotel Caupolicán', category: 'Hotel', pricePerNight: { alta: 110000, media: 88000, baja: 66000 }, amenities: ['WiFi', 'Desayuno incluido', 'Spa', 'Vista al lago', 'Calefacción', 'Estacionamiento'] },
      { name: 'Hostel Patagonia Andina', category: 'Hostel', pricePerNight: { alta: 27200, media: 20800, baja: 16000 }, amenities: ['WiFi', 'Bar', 'Calefacción', 'Desayuno incluido'] },
      { name: 'Cabañas del Chapelco', category: 'Cabaña', pricePerNight: { alta: 65000, media: 52000, baja: 39000 }, amenities: ['WiFi', 'Cocina', 'Calefacción', 'Estacionamiento', 'Vista a la montaña'] },
      { name: 'Hotel Parque Lacar', category: 'Hotel', pricePerNight: { alta: 93750, media: 75000, baja: 56250 }, amenities: ['WiFi', 'Desayuno incluido', 'Vista al lago', 'Calefacción', 'Estacionamiento'] },
      { name: 'Hostel del Bosque', category: 'Hostel', pricePerNight: { alta: 20400, media: 15600, baja: 12000 }, amenities: ['WiFi', 'Bar', 'Calefacción', 'Terraza'] },
      { name: 'Ayres del Filo', category: 'Cabaña', pricePerNight: { alta: 62500, media: 50000, baja: 37500 }, amenities: ['WiFi', 'Cocina', 'Calefacción', 'Estacionamiento', 'Vista al lago'] },
      { name: 'Hotel Le Lac', category: 'Hotel', pricePerNight: { alta: 56250, media: 45000, baja: 33750 }, amenities: ['WiFi', 'Desayuno incluido', 'Calefacción', 'Estacionamiento'] },
      { name: 'Cabañas del Río', category: 'Cabaña', pricePerNight: { alta: 68000, media: 52000, baja: 40000 }, amenities: ['WiFi', 'Cocina', 'Calefacción', 'Estacionamiento', 'Pet friendly'] },
      { name: 'Hotel Sol de los Andes', category: 'Hotel', pricePerNight: { alta: 85000, media: 68000, baja: 51000 }, amenities: ['WiFi', 'Spa', 'Piscina', 'Calefacción', 'Restaurante', 'Estacionamiento'] },
      { name: 'Posada del Valle', category: 'Hotel', pricePerNight: { alta: 59500, media: 45500, baja: 35000 }, amenities: ['WiFi', 'Desayuno incluido', 'Calefacción'] },
      { name: 'Cabañas del Sol', category: 'Cabaña', pricePerNight: { alta: 68750, media: 55000, baja: 41250 }, amenities: ['WiFi', 'Cocina', 'Calefacción', 'Estacionamiento', 'Vista al lago'] },
      { name: 'Hostel Montana', category: 'Hostel', pricePerNight: { alta: 17000, media: 13000, baja: 10000 }, amenities: ['WiFi', 'Bar', 'Calefacción', 'Cocina'] },
    ],
    activities: [
      { name: 'Cerro Chapelco Ski', price: 50000, duration: '6h', agency: 'Chapelco Ski', tags: ['Adultos', 'Deporte', 'Invierno'] },
      { name: 'Paseo en Barco Lago Lacar', price: 18000, duration: '3h', agency: 'Lacar Tours', tags: ['Todos', 'Naturaleza'] },
      { name: 'Parque Nacional Lanín', price: 5000, duration: '6h', agency: 'Parques Nacionales', tags: ['Todos', 'Naturaleza'] },
      { name: 'Termas de Lahuen Co', price: 12000, duration: '4h', agency: 'Termas SMA', tags: ['Todos', 'Relax'] },
      { name: 'Sendero Arrayanes', price: 3000, duration: '3h', agency: 'Sendero SMA', tags: ['Todos', 'Naturaleza'] },
      { name: 'Cabalgata', price: 15000, duration: '4h', agency: 'Andes Ride', tags: ['Adultos', 'Naturaleza'] },
      { name: 'Museo Regional', price: 3000, duration: '1.5h', agency: 'Museos SMA', tags: ['Adultos', 'Cultura'] },
      { name: 'Pesca Deportiva', price: 15000, duration: '5h', agency: 'Pesca Sur', tags: ['Adultos', 'Deporte'] },
      { name: 'Bici de Montaña', price: 10000, duration: '4h', agency: 'MTB Andina', tags: ['Adultos', 'Deporte'] },
      { name: 'Rafting Río Hua Hum', price: 20000, duration: '3h', agency: 'Aventura SMA', tags: ['Adultos', 'Aventura'] },
      { name: 'Playa Quila Quina', price: 2000, duration: '4h', agency: 'Playas SMA', tags: ['Todos', 'Playa'] },
      { name: 'Ascenso Cerro Colorado', price: 8000, duration: '5h', agency: 'Trekking SMA', tags: ['Adultos', 'Trekking'] },
    ],
    transport: [
      { type: 'Avión', carrier: 'Aerolíneas Argentinas', from: 'Buenos Aires (AEP)', pricePerPerson: { alta: 135000, media: 95000, baja: 60000 }, duration: '2h 20min' },
      { type: 'Avión', carrier: 'FlyBondi', from: 'Buenos Aires (EZE)', pricePerPerson: { alta: 90000, media: 65000, baja: 40000 }, duration: '2h 20min' },
      { type: 'Bus', carrier: 'Vía Bariloche', from: 'Buenos Aires (Retiro)', pricePerPerson: { alta: 70000, media: 55000, baja: 38000 }, duration: '24h' },
    ],
    localTransport: [
      { type: 'Taxi', description: 'Tarifa urbana', price: 2000 },
      { type: 'Transfer privado', description: 'Aeropuerto ↔ Centro', price: 21000 },
    ],
    promotions: [
      { bank: 'Banco Galicia', description: '6 cuotas sin interés', discount: '10%' },
      { bank: 'Banco Santander', description: '3 cuotas sin interés', discount: '15%' },
      { bank: 'Banco Nación', description: '12 cuotas sin interés', discount: '20%' },
      { bank: 'MercadoPago', description: 'Pago con QR', discount: '5%' },
      { bank: 'Visa', description: '6 cuotas sin interés', discount: '8%' },
      { bank: 'Mastercard', description: '6 cuotas sin interés', discount: '8%' },
    ],
  },
];

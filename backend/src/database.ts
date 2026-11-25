
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

// La base de datos se guardará en backend/inventariopro.db
const databasePath = path.resolve(currentDirectory, "../inventariopro.db");

const db = new Database(databasePath);

// Configuración de SQLite
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Tabla de empresas
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Tabla de usuarios
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );
`);

// Tabla de productos
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    min_stock INTEGER NOT NULL DEFAULT 5,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );
`);

// Columnas de imagen del producto (se agregan si todavía no existen).
const productColumns = (
  db.prepare("PRAGMA table_info(products)").all() as { name: string }[]
).map((column) => column.name);

for (const column of [
  "image_url",
  "image_credit_name",
  "image_credit_url",
]) {
  if (!productColumns.includes(column)) {
    db.exec(`ALTER TABLE products ADD COLUMN ${column} TEXT`);
  }
}

// Crear la empresa de demostración y sus productos iniciales.
const initializeDemoCompany = db.transaction(() => {
  let company = db
    .prepare("SELECT id FROM companies WHERE name = ? LIMIT 1")
    .get("MicroPyME Demo") as { id: number } | undefined;

  if (!company) {
    const result = db
      .prepare("INSERT INTO companies (name) VALUES (?)")
      .run("MicroPyME Demo");

    company = { id: Number(result.lastInsertRowid) };
  }

  const productCount = db
    .prepare("SELECT COUNT(*) AS total FROM products WHERE company_id = ?")
    .get(company.id) as { total: number };

  if (productCount.total === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (
        company_id,
        name,
        description,
        price,
        stock,
        min_stock
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertProduct.run(
      company.id,
      "Laptop Lenovo",
      "Laptop para uso empresarial",
      2500000,
      10,
      3
    );

    insertProduct.run(
      company.id,
      "Mouse inalámbrico",
      "Mouse óptico inalámbrico",
      65000,
      25,
      5
    );

    insertProduct.run(
      company.id,
      "Teclado mecánico",
      "Teclado mecánico para oficina",
      180000,
      15,
      15
    );
  }
});

initializeDemoCompany();

export default db;


import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./auth.js";
import { requireAuth } from "./authMiddleware.js";
import db from "./database.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);

// =====================================
// RUTA DE COMPROBACIÓN
// =====================================

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API de gestión de inventarios y pedidos de MicroPyMEs funcionando correctamente",
  });
});

// =====================================
// MÓDULO DE PRODUCTOS
// =====================================

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  minStock: number;
}

interface ProductRow {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  minStock: number;
}

const DEFAULT_MIN_STOCK = 5;

function isValidMinStock(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0)
  );
}

function getCompanyId(res: express.Response): number {
  return (res.locals.auth as { companyId: number }).companyId;
}

function getProductById(
  id: number,
  companyId: number
): ProductRow | undefined {
  return db
    .prepare(`
      SELECT
        id,
        name,
        description,
        price,
        stock,
        min_stock AS minStock
      FROM products
      WHERE id = ? AND company_id = ?
    `)
    .get(id, companyId) as ProductRow | undefined;
}

// Consultar todos los productos de la empresa autenticada.
app.get("/api/products", requireAuth, (_req, res) => {
  const companyId = getCompanyId(res);

  const products = db
    .prepare(`
      SELECT
        id,
        name,
        description,
        price,
        stock,
        min_stock AS minStock
      FROM products
      WHERE company_id = ?
      ORDER BY id DESC
    `)
    .all(companyId) as ProductRow[];

  return res.status(200).json({
    status: "ok",
    message: "Listado de productos",
    data: products,
  });
});

// Consultar productos con stock bajo.
app.get("/api/products/low-stock", requireAuth, (_req, res) => {
  const companyId = getCompanyId(res);

  const products = db
    .prepare(`
      SELECT
        id,
        name,
        description,
        price,
        stock,
        min_stock AS minStock
      FROM products
      WHERE company_id = ? AND stock <= min_stock
      ORDER BY stock ASC
    `)
    .all(companyId) as ProductRow[];

  return res.status(200).json({
    status: "ok",
    message: "Productos con stock bajo",
    data: products,
  });
});

// Registrar un producto para la empresa autenticada.
app.post("/api/products", requireAuth, (req, res) => {
  const companyId = getCompanyId(res);
  const { name, description, price, stock, minStock } = req.body ?? {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price <= 0 ||
    typeof stock !== "number" ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    !isValidMinStock(minStock)
  ) {
    return res.status(400).json({
      status: "error",
      message: "Los datos del producto no son válidos",
    });
  }

  const result = db
    .prepare(`
      INSERT INTO products (
        company_id,
        name,
        description,
        price,
        stock,
        min_stock
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      companyId,
      name.trim(),
      description.trim(),
      price,
      stock,
      minStock ?? DEFAULT_MIN_STOCK
    );

  const newProduct = getProductById(
    Number(result.lastInsertRowid),
    companyId
  );

  return res.status(201).json({
    status: "ok",
    message: "Producto registrado correctamente",
    data: newProduct,
  });
});

// Actualizar un producto perteneciente a la empresa autenticada.
app.put("/api/products/:id", requireAuth, (req, res) => {
  const companyId = getCompanyId(res);
  const id = Number(req.params.id);
  const { name, description, price, stock, minStock } = req.body ?? {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: "error",
      message: "El identificador del producto no es válido",
    });
  }

  const existingProduct = getProductById(id, companyId);

  if (!existingProduct) {
    return res.status(404).json({
      status: "error",
      message: "Producto no encontrado",
    });
  }

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price <= 0 ||
    typeof stock !== "number" ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    !isValidMinStock(minStock)
  ) {
    return res.status(400).json({
      status: "error",
      message: "Los datos del producto no son válidos",
    });
  }

  db.prepare(`
    UPDATE products
    SET
      name = ?,
      description = ?,
      price = ?,
      stock = ?,
      min_stock = ?
    WHERE id = ? AND company_id = ?
  `).run(
    name.trim(),
    description.trim(),
    price,
    stock,
    minStock ?? existingProduct.minStock,
    id,
    companyId
  );

  const updatedProduct = getProductById(id, companyId);

  return res.status(200).json({
    status: "ok",
    message: "Producto actualizado correctamente",
    data: updatedProduct,
  });
});

// Eliminar únicamente productos de la empresa autenticada.
app.delete("/api/products/:id", requireAuth, (req, res) => {
  const companyId = getCompanyId(res);
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: "error",
      message: "El identificador del producto no es válido",
    });
  }

  const existingProduct = getProductById(id, companyId);

  if (!existingProduct) {
    return res.status(404).json({
      status: "error",
      message: "Producto no encontrado",
    });
  }

  db.prepare(
    "DELETE FROM products WHERE id = ? AND company_id = ?"
  ).run(id, companyId);

  return res.status(200).json({
    status: "ok",
    message: "Producto eliminado correctamente",
    data: existingProduct,
  });
});

// =====================================
// INICIO DEL SERVIDOR
// =====================================

app.listen(PORT, () => {
  console.log(`Servidor backend ejecutándose en http://localhost:${PORT}`);
});

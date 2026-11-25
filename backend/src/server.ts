
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./auth.js";
import { requireAuth } from "./authMiddleware.js";
import db from "./database.js";


// Cargar variables de entorno desde backend/.env (si existe).
try {
  process.loadEnvFile();
} catch {
  console.warn("No se encontró backend/.env; la búsqueda de imágenes no estará disponible.");
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" })); // permite imágenes cargadas desde el PC
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
  minStock: number; // si stock <= minStock se activa la alerta
  imageUrl?: string; // URL de la imagen del producto (opcional)
  imageCredit?: ImageCredit; // autor de la foto (solo fotos de Unsplash)
}

interface ImageCredit {
  authorName: string;
  authorUrl: string;
}

interface ProductRow {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  minStock: number;
  imageUrl: string | null;
  imageCreditName: string | null;
  imageCreditUrl: string | null;
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

const PRODUCT_COLUMNS = `
  id, name, description, price, stock,
  min_stock AS minStock,
  image_url AS imageUrl,
  image_credit_name AS imageCreditName,
  image_credit_url AS imageCreditUrl
`;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    stock: row.stock,
    minStock: row.minStock,
    imageUrl: row.imageUrl ?? undefined,
    imageCredit:
      row.imageCreditName && row.imageCreditUrl
        ? { authorName: row.imageCreditName, authorUrl: row.imageCreditUrl }
        : undefined,
  };
}

function getProductById(id: number, companyId: number): Product | undefined {
  const row = db
    .prepare(
      `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ? AND company_id = ?`
    )
    .get(id, companyId) as ProductRow | undefined;
  return row ? toProduct(row) : undefined;
}
// imageUrl es opcional; si viene, debe ser una URL http(s) o una imagen subida (data:image/...).
function isValidImageUrl(value: unknown): boolean {
  if (value === undefined || value === "") return true;
  if (typeof value !== "string") return false;
  if (value.startsWith("data:image/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// imageCredit es opcional; si viene, debe tener autor y un link de Unsplash.
function isValidImageCredit(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== "object") return false;
  const { authorName, authorUrl } = value as Record<string, unknown>;
  return (
    typeof authorName === "string" &&
    authorName.trim().length > 0 &&
    authorName.length <= 100 &&
    typeof authorUrl === "string" &&
    authorUrl.startsWith("https://unsplash.com/")
  );
}

// Guardar solo los campos esperados del crédito (o nada si no hay imagen).
function buildImageCredit(
  imageUrl: unknown,
  imageCredit: unknown
): ImageCredit | undefined {
  if (!imageUrl || !imageCredit) return undefined;
  const { authorName, authorUrl } = imageCredit as ImageCredit;
  return { authorName: authorName.trim(), authorUrl };
}

// Consultar todos los productos de la empresa autenticada.
app.get("/api/products", requireAuth, (_req, res) => {
  const companyId = getCompanyId(res);

  const rows = db
    .prepare(
      `SELECT ${PRODUCT_COLUMNS} FROM products WHERE company_id = ? ORDER BY id DESC`
    )
    .all(companyId) as ProductRow[];

  return res.status(200).json({
    status: "ok",
    message: "Listado de productos",
    data: rows.map(toProduct),
  });
});

// Consultar productos con stock bajo.
app.get("/api/products/low-stock", requireAuth, (_req, res) => {
  const companyId = getCompanyId(res);

  const rows = db
    .prepare(
      `SELECT ${PRODUCT_COLUMNS} FROM products
       WHERE company_id = ? AND stock <= min_stock
       ORDER BY stock ASC`
    )
    .all(companyId) as ProductRow[];

  return res.status(200).json({
    status: "ok",
    message: "Productos con stock bajo",
    data: rows.map(toProduct),
  });
});

// Registrar un producto para la empresa autenticada.
app.post("/api/products", requireAuth, (req, res) => {
  const companyId = getCompanyId(res);
  const { name, description, price, stock, minStock, imageUrl, imageCredit } =
    req.body ?? {};
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
    !isValidMinStock(minStock) ||
    !isValidImageUrl(imageUrl) ||
    !isValidImageCredit(imageCredit)
  ) {
    return res.status(400).json({
      status: "error",
      message: "Los datos del producto no son válidos",
    });
  }

  const credit = buildImageCredit(imageUrl, imageCredit);

  const result = db
    .prepare(`
      INSERT INTO products (
        company_id, name, description, price, stock, min_stock,
        image_url, image_credit_name, image_credit_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      companyId,
      name.trim(),
      description.trim(),
      price,
      stock,
      minStock ?? DEFAULT_MIN_STOCK,
      imageUrl || null,
      credit?.authorName ?? null,
      credit?.authorUrl ?? null
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
  const { name, description, price, stock, minStock, imageUrl, imageCredit } =
    req.body ?? {};
  
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
    !isValidMinStock(minStock) ||
    !isValidImageUrl(imageUrl) ||
    !isValidImageCredit(imageCredit)
  ) {
    return res.status(400).json({
      status: "error",
      message: "Los datos del producto no son válidos",
    });
  }

    const credit =
    imageUrl === undefined
      ? existingProduct.imageCredit
      : buildImageCredit(imageUrl, imageCredit);

  db.prepare(`
    UPDATE products
    SET name = ?, description = ?, price = ?, stock = ?, min_stock = ?,
        image_url = ?, image_credit_name = ?, image_credit_url = ?
    WHERE id = ? AND company_id = ?
  `).run(
    name.trim(),
    description.trim(),
    price,
    stock,
    minStock ?? existingProduct.minStock,
    imageUrl === undefined ? existingProduct.imageUrl ?? null : imageUrl || null,
    credit?.authorName ?? null,
    credit?.authorUrl ?? null,
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
// MÓDULO DE IMÁGENES (sugerencias con Unsplash)
// =====================================

const UNSPLASH_API = "https://api.unsplash.com";
const UTM = "utm_source=InventarioPro&utm_medium=referral";

interface ImageOption {
  id: string;
  description: string;
  thumbnail: string; // miniatura para mostrar la opción
  url: string; // imagen que se guarda en el producto (hotlink a Unsplash)
  authorName: string; // atribución obligatoria
  authorUrl: string;
  unsplashUrl: string;
  downloadLocation: string; // se usa para notificar a Unsplash cuando se elige
}

function getUnsplashKey(): string | undefined {
  return process.env.UNSPLASH_ACCESS_KEY;
}

// Buscar 3 imágenes sugeridas según el nombre del producto.
app.get("/api/images/search", requireAuth, async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const accessKey = getUnsplashKey();

  if (!query) {
    return res.status(400).json({
      status: "error",
      message: "Debe indicar un texto de búsqueda",
    });
  }

  if (!accessKey) {
    return res.status(503).json({
      status: "error",
      message: "La búsqueda de imágenes no está configurada",
    });
  }

  const params = new URLSearchParams({
    query,
    per_page: "3",
    lang: "es",
    orientation: "squarish",
    content_filter: "high",
  });

  try {
    const response = await fetch(`${UNSPLASH_API}/search/photos?${params}`, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash respondió ${response.status}`);
    }

    const result = await response.json();

    const options: ImageOption[] = (result.results ?? []).map((photo: any) => ({
      id: photo.id,
      description: photo.alt_description ?? "",
      thumbnail: photo.urls.small,
      url: photo.urls.regular,
      authorName: photo.user.name,
      authorUrl: `${photo.user.links.html}?${UTM}`,
      unsplashUrl: `https://unsplash.com/?${UTM}`,
      downloadLocation: photo.links.download_location,
    }));

    return res.status(200).json({
      status: "ok",
      message: "Imágenes sugeridas",
      data: options,
    });
  } catch (error) {
    console.error("Error buscando imágenes:", error);
    return res.status(502).json({
      status: "error",
      message: "No fue posible buscar imágenes en este momento",
    });
  }
});

// Notificar a Unsplash que se eligió una foto (requisito de sus guías).
app.post("/api/images/select", requireAuth, async (req, res) => {
  const { downloadLocation } = req.body;
  const accessKey = getUnsplashKey();

  if (
    typeof downloadLocation !== "string" ||
    !downloadLocation.startsWith(`${UNSPLASH_API}/`)
  ) {
    return res.status(400).json({
      status: "error",
      message: "La imagen seleccionada no es válida",
    });
  }

  if (!accessKey) {
    return res.status(503).json({
      status: "error",
      message: "La búsqueda de imágenes no está configurada",
    });
  }

  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    return res.status(200).json({
      status: "ok",
      message: "Selección registrada",
    });
  } catch (error) {
    console.error("Error notificando a Unsplash:", error);
    return res.status(502).json({
      status: "error",
      message: "No fue posible registrar la selección",
    });
  }
});


// =====================================
// INICIO DEL SERVIDOR
// =====================================

app.listen(PORT, () => {
  console.log(`Servidor backend ejecutándose en http://localhost:${PORT}`);
});

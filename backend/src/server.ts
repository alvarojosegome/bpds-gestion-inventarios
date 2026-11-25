
import express from "express";
import cors from "cors";
import authRouter from "./auth.js";


// Cargar variables de entorno desde backend/.env (si existe).
try {
  process.loadEnvFile();
} catch {
  console.warn("No se encontró backend/.env; la búsqueda de imágenes no estará disponible.");
}

const app = express();
const PORT = process.env.PORT || 4000;

// =====================================
// CONFIGURACIÓN GENERAL
// =====================================

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "2mb" })); // permite imágenes cargadas desde el PC
app.use("/auth", authRouter);

// =====================================
// RUTA DE COMPROBACIÓN
// =====================================

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API de gestión de inventarios y pedidos funcionando correctamente",
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

const DEFAULT_MIN_STOCK = 5;

function isLowStock(product: Product): boolean {
  return product.stock <= product.minStock;
}

// minStock es opcional; si viene, debe ser un entero >= 0.
function isValidMinStock(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === "number" && Number.isInteger(value) && value >= 0)
  );
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

const products: Product[] = [
  {
    id: 1,
    name: "Laptop Lenovo",
    description: "Laptop para uso empresarial",
    price: 2500000,
    stock: 10,
    minStock: 3,
  },
  {
    id: 2,
    name: "Mouse inalámbrico",
    description: "Mouse óptico inalámbrico",
    price: 65000,
    stock: 25,
    minStock: 5,
  },
  {
    id: 3,
    name: "Teclado mecánico",
    description: "Teclado mecánico para oficina",
    price: 180000,
    stock: 15,
    minStock: 15, // para probar la alerta (stock <= minStock)
  },
];

// Consultar todos los productos.
app.get("/api/products", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Listado de productos",
    data: products,
  });
});

// Consultar productos.
app.get("/api/products/low-stock", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Productos con stock bajo",
    data: products.filter(isLowStock),
  });
});

// Registrar un nuevo producto.
app.post("/api/products", (req, res) => {
  const { name, description, price, stock, minStock, imageUrl, imageCredit } =
    req.body;

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

  const newProduct: Product = {
    id: Math.max(0, ...products.map((product) => product.id)) + 1,
    name: name.trim(),
    description: description.trim(),
    price,
    stock,
    minStock: minStock ?? DEFAULT_MIN_STOCK,
    imageUrl: imageUrl || undefined,
    imageCredit: buildImageCredit(imageUrl, imageCredit),
  };

  products.push(newProduct);

  return res.status(201).json({
    status: "ok",
    message: "Producto registrado correctamente",
    data: newProduct,
  });
});

// Actualizar un producto existente.
app.put("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name, description, price, stock, minStock, imageUrl, imageCredit } =
    req.body;

  const productIndex = products.findIndex(
    (product) => product.id === id
  );

  if (productIndex === -1) {
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

  const updatedProduct: Product = {
    id,
    name: name.trim(),
    description: description.trim(),
    price,
    stock,
    minStock: minStock ?? products[productIndex].minStock,
    imageUrl: imageUrl ?? products[productIndex].imageUrl,
    imageCredit:
      imageUrl === undefined
        ? products[productIndex].imageCredit
        : buildImageCredit(imageUrl, imageCredit),
  };

  products[productIndex] = updatedProduct;

  return res.status(200).json({
    status: "ok",
    message: "Producto actualizado correctamente",
    data: updatedProduct,
  });
});
// Eliminar un producto existente.
app.delete("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);

  const productIndex = products.findIndex(
    (product) => product.id === id
  );

  if (productIndex === -1) {
    return res.status(404).json({
      status: "error",
      message: "Producto no encontrado",
    });
  }

  const deletedProduct = products.splice(productIndex, 1)[0];

  return res.status(200).json({
    status: "ok",
    message: "Producto eliminado correctamente",
    data: deletedProduct,
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
app.get("/api/images/search", async (req, res) => {
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
app.post("/api/images/select", async (req, res) => {
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


import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

// =====================================
// CONFIGURACIÓN GENERAL
// =====================================

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

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
  const { name, description, price, stock, minStock, imageUrl } = req.body;

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
    !isValidImageUrl(imageUrl)
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
  const { name, description, price, stock, minStock, imageUrl } = req.body;

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
    !isValidImageUrl(imageUrl)
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
// INICIO DEL SERVIDOR
// =====================================

app.listen(PORT, () => {
  console.log(`Servidor backend ejecutándose en http://localhost:${PORT}`);
});

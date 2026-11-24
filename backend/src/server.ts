
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

const products = [
  {
    id: 1,
    name: "Laptop Lenovo",
    description: "Laptop para uso empresarial",
    price: 2500000,
    stock: 10,
  },
  {
    id: 2,
    name: "Mouse inalámbrico",
    description: "Mouse óptico inalámbrico",
    price: 65000,
    stock: 25,
  },
  {
    id: 3,
    name: "Teclado mecánico",
    description: "Teclado mecánico para oficina",
    price: 180000,
    stock: 15,
  },
];

// Consultar productos.
app.get("/api/products", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Listado de productos",
    data: products,
  });
});

// Registrar un nuevo producto.
app.post("/api/products", (req, res) => {
  const { name, description, price, stock } = req.body;

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
    stock < 0
  ) {
    return res.status(400).json({
      status: "error",
      message: "Los datos del producto no son válidos",
    });
  }

  const newProduct = {
    id: Math.max(0, ...products.map((product) => product.id)) + 1,
    name: name.trim(),
    description: description.trim(),
    price,
    stock,
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
  const { name, description, price, stock } = req.body;

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
    stock < 0
  ) {
    return res.status(400).json({
      status: "error",
      message: "Los datos del producto no son válidos",
    });
  }

  const updatedProduct = {
    id,
    name: name.trim(),
    description: description.trim(),
    price,
    stock,
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

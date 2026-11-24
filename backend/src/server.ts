
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


// =====================================
// INICIO DEL SERVIDOR
// =====================================

app.listen(PORT, () => {
  console.log(`Servidor backend ejecutándose en http://localhost:${PORT}`);
});

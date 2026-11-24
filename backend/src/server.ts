
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

// Consultar productos.
app.get("/api/products", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Listado de productos",
    data: [],
  });
});

// =====================================
// INICIO DEL SERVIDOR
// =====================================

app.listen(PORT, () => {
  console.log(`Servidor backend ejecutándose en http://localhost:${PORT}`);
});

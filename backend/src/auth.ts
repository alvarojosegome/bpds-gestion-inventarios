import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

const USUARIO = process.env.ADMIN_USER ?? "admin";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-cambiar";
const OCHO_HORAS = 8 * 60 * 60 * 1000;

router.post("/login", (req, res) => {
  const { usuario, password } = req.body ?? {};

  if (usuario !== USUARIO || password !== PASSWORD) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const token = jwt.sign({ usuario }, JWT_SECRET, { expiresIn: "8h" });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: OCHO_HORAS,
  });

  return res.json({ ok: true });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  return res.json({ ok: true });
});

export default router;
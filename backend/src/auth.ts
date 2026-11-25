import { requireAuth } from "./authMiddleware.js";
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "./database.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Debes configurar JWT_SECRET en el archivo .env");
}

const OCHO_HORAS = 8 * 60 * 60 * 1000;

// =====================================
// REGISTRO DE EMPRESAS
// =====================================

router.post("/register", async (req, res) => {
  try {
    const { empresa, usuario, password } = req.body ?? {};

    if (
      typeof empresa !== "string" ||
      !empresa.trim() ||
      typeof usuario !== "string" ||
      !usuario.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          "Ingresa el nombre de la empresa, un usuario y una contraseña de mínimo 8 caracteres",
      });
    }

    const username = usuario.trim().toLowerCase();

    const existingUser = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(username);

    if (existingUser) {
      return res.status(409).json({
        message: "Ese nombre de usuario ya está registrado",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const createCompany = db.transaction(() => {
      const companyResult = db
        .prepare("INSERT INTO companies (name) VALUES (?)")
        .run(empresa.trim());

      const companyId = Number(companyResult.lastInsertRowid);

      const userResult = db
        .prepare(
          `INSERT INTO users (company_id, username, password_hash)
           VALUES (?, ?, ?)`
        )
        .run(companyId, username, passwordHash);

      return {
        companyId,
        userId: Number(userResult.lastInsertRowid),
      };
    });

    const account = createCompany();

    const token = jwt.sign(
      {
        userId: account.userId,
        companyId: account.companyId,
        usuario: username,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: OCHO_HORAS,
    });

    return res.status(201).json({
      ok: true,
      message: "Empresa y administrador registrados correctamente",
    });
  } catch (error) {
    console.error("Error en el registro:", error);

    return res.status(500).json({
      message: "No se pudo registrar la empresa",
    });
  }
});

// =====================================
// INICIO DE SESIÓN
// =====================================

router.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body ?? {};

    if (
      typeof usuario !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Debes ingresar usuario y contraseña",
      });
    }

    const username = usuario.trim().toLowerCase();

    const user = db
      .prepare(
        `SELECT id, company_id, username, password_hash
         FROM users
         WHERE username = ?`
      )
      .get(username) as
      | {
          id: number;
          company_id: number;
          username: string;
          password_hash: string;
        }
      | undefined;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        companyId: user.company_id,
        usuario: user.username,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: OCHO_HORAS,
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);

    return res.status(500).json({
      message: "No se pudo iniciar sesión",
    });
  }
});

// =====================================
// CERRAR SESIÓN
// =====================================

router.post("/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
  });

  return res.json({ ok: true });
});

// =====================================
// CONSULTAR USUARIO Y EMPRESA ACTUAL
// =====================================

router.get("/me", requireAuth, (req, res) => {
  const auth = res.locals.auth as {
    userId: number;
    companyId: number;
    usuario: string;
  };

  const account = db
    .prepare(`
      SELECT
        users.id,
        users.username,
        users.role,
        companies.id AS companyId,
        companies.name AS companyName
      FROM users
      INNER JOIN companies
        ON companies.id = users.company_id
      WHERE users.id = ?
        AND users.company_id = ?
    `)
    .get(auth.userId, auth.companyId);

  if (!account) {
    return res.status(401).json({
      message: "No se encontró la cuenta autenticada",
    });
  }

  return res.status(200).json({
    ok: true,
    user: {
      id: auth.userId,
      usuario: auth.usuario,
      role: (account as { role: string }).role,
    },
    company: {
      id: auth.companyId,
      nombre: (account as { companyName: string }).companyName,
    },
  });
});

export default router;

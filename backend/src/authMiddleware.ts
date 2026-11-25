
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

interface AuthToken {
  userId: number;
  companyId: number;
  usuario: string;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "Debes iniciar sesión para continuar",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AuthToken;

    if (
      typeof decoded.userId !== "number" ||
      typeof decoded.companyId !== "number" ||
      typeof decoded.usuario !== "string"
    ) {
      return res.status(401).json({
        message: "La sesión no es válida",
      });
    }

    res.locals.auth = decoded;

    return next();
  } catch {
    return res.status(401).json({
      message: "La sesión ha expirado o no es válida",
    });
  }
};

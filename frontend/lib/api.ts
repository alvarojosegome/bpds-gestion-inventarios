
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export async function checkBackendConnection() {
  try {
    const response = await fetch(`${API_URL}/api/health`);

    if (!response.ok) {
      throw new Error("No se pudo conectar con el backend");
    }

    return await response.json();
  } catch (error) {
    console.error("Error al conectar con el backend:", error);
    throw error;
  }
}

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/api/products`);

  if (!response.ok) {
    throw new Error("No se pudieron consultar los productos");
  }

  const result = await response.json();

  return result.data;
}

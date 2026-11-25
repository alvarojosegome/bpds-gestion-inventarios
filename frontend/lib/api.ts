
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  imageCredit?: ImageCredit;
}

export interface ImageCredit {
  authorName: string;
  authorUrl: string;
}

// Comprobar conexión con el backend.
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

// Consultar productos.
export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/api/products`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("No se pudieron consultar los productos");
  }

  const result = await response.json();

  return result.data;
}

// Registrar un nuevo producto.
export async function createProduct(
  product: Omit<Product, "id">
): Promise<Product> {
  const response = await fetch(`${API_URL}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error("No se pudo registrar el producto");
  }

  const result = await response.json();

  return result.data;
}

// Actualizar un producto existente.
export async function updateProduct(
  product: Product
): Promise<Product> {
  const response = await fetch(
    `${API_URL}/api/products/${product.id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        minStock: product.minStock,
        imageUrl: product.imageUrl ?? "",
        imageCredit: product.imageCredit,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("No se pudo actualizar el producto");
  }

  const result = await response.json();

  return result.data;
}

// Eliminar un producto del inventario.
export async function deleteProduct(id: number): Promise<Product> {
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("No se pudo eliminar el producto");
  }

  const result = await response.json();

  return result.data;
}


// =====================================
// IMÁGENES (sugerencias con Unsplash)
// =====================================

export interface ImageOption {
  id: string;
  description: string;
  thumbnail: string;
  url: string;
  authorName: string;
  authorUrl: string;
  unsplashUrl: string;
  downloadLocation: string;
}

// Buscar 3 imágenes sugeridas según el nombre del producto.
export async function searchImages(query: string): Promise<ImageOption[]> {
  const response = await fetch(
    `${API_URL}/api/images/search?q=${encodeURIComponent(query)}`,
    { credentials: "include" }
  );

  if (!response.ok) {
    throw new Error("No se pudieron buscar imágenes");
  }

  const result = await response.json();

  return result.data;
}

// Avisar a Unsplash que se eligió una imagen (requisito de sus guías).
export async function selectImage(downloadLocation: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/images/select`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ downloadLocation }),
    });
  } catch (error) {
    // No bloquea el registro del producto si falla el aviso.
    console.error("No se pudo registrar la selección de imagen:", error);
  }
}

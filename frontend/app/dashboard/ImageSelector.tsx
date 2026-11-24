"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { searchImages, selectImage, type ImageOption } from "../../lib/api";

interface ImageSelectorProps {
    productName: string; // nombre escrito en el formulario
    value: string; // URL elegida ("" = sin imagen)
    onChange: (imageUrl: string) => void;
}

type SearchStatus = "idle" | "loading" | "done" | "error";

interface SearchState {
    query: string;
    options: ImageOption[];
    status: SearchStatus;
}

const MIN_QUERY_LENGTH = 3;
const SEARCH_DELAY_MS = 800; // espera a que termine de escribir (cuida el límite de Unsplash)
const MAX_FILE_SIZE_MB = 10; // tamaño máximo del archivo original
const MAX_IMAGE_SIDE_PX = 600; // la imagen cargada se reduce a este tamaño
const JPEG_QUALITY = 0.8;

function tileClass(selected: boolean) {
    return `block w-full overflow-hidden rounded-lg border-2 text-left transition ${selected
        ? "border-blue-600 ring-2 ring-blue-200"
        : "border-transparent hover:border-slate-300"
        }`;
}

// Reducir y comprimir la imagen en el navegador antes de guardarla.
function resizeImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            const scale = Math.min(
                1,
                MAX_IMAGE_SIDE_PX / Math.max(image.width, image.height)
            );
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);

            const context = canvas.getContext("2d");
            if (!context) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("No se pudo procesar la imagen"));
                return;
            }

            context.fillStyle = "#ffffff"; // fondo blanco para PNG con transparencia
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(objectUrl);
            resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("El archivo no es una imagen válida"));
        };

        image.src = objectUrl;
    });
}

export default function ImageSelector({
    productName,
    value,
    onChange,
}: ImageSelectorProps) {
    const [search, setSearch] = useState<SearchState>({
        query: "",
        options: [],
        status: "idle",
    });
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const query = productName.trim();
    const hasQuery = query.length >= MIN_QUERY_LENGTH;

    // Buscar sugerencias cuando el nombre cambie (con espera).
    useEffect(() => {
        if (query.length < MIN_QUERY_LENGTH) return;

        let cancelled = false;

        const timer = setTimeout(async () => {
            setSearch({ query, options: [], status: "loading" });

            try {
                const options = await searchImages(query);
                if (!cancelled) setSearch({ query, options, status: "done" });
            } catch {
                if (!cancelled) setSearch({ query, options: [], status: "error" });
            }
        }, SEARCH_DELAY_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    const isCurrentSearch = hasQuery && search.query === query;
    const options = isCurrentSearch ? search.options : [];
    const status: SearchStatus = !hasQuery
        ? "idle"
        : isCurrentSearch
            ? search.status
            : "loading";

    const selectedOption = options.find((option) => option.url === value);
    const showCurrentImage = value !== "" && !selectedOption;
    const isUploadedImage = value.startsWith("data:image/");

    function handleSelectOption(option: ImageOption) {
        setUploadError("");
        onChange(option.url);
        void selectImage(option.downloadLocation);
    }

    function handleNoImage() {
        setUploadError("");
        onChange("");
    }

    async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = ""; // permite volver a elegir el mismo archivo

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setUploadError("El archivo debe ser una imagen (JPG, PNG o WEBP).");
            return;
        }

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setUploadError(`La imagen no puede superar ${MAX_FILE_SIZE_MB} MB.`);
            return;
        }

        setUploading(true);
        setUploadError("");

        try {
            const dataUrl = await resizeImageFile(file);
            onChange(dataUrl);
        } catch {
            setUploadError("No se pudo cargar la imagen. Intenta con otro archivo.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="md:col-span-2">
            <p className="font-medium">Imagen del producto</p>
            <p className="mb-3 text-sm text-slate-500">
                Selecciona una imagen de referencia o carga una desde tu equipo.
            </p>

            {status === "idle" && (
                <p className="mb-3 text-sm text-slate-500">
                    Escribe el nombre del producto para ver sugerencias.
                </p>
            )}

            {status === "error" && (
                <p className="mb-3 text-sm text-red-600">
                    No fue posible cargar sugerencias. Puedes continuar sin imagen o
                    cargar una propia.
                </p>
            )}

            {status === "done" && options.length === 0 && (
                <p className="mb-3 text-sm text-slate-500">
                    No encontramos sugerencias para &quot;{query}&quot;.
                </p>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {status === "loading" &&
                    [0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className="h-28 animate-pulse rounded-lg bg-slate-200"
                        />
                    ))}

                {options.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectOption(option)}
                        aria-pressed={value === option.url}
                        title={option.description || `Foto de ${option.authorName}`}
                        className={tileClass(value === option.url)}
                    >
                        <img
                            src={option.thumbnail}
                            alt={option.description || `Sugerencia para ${query}`}
                            loading="lazy"
                            className="h-28 w-full object-cover"
                        />
                    </button>
                ))}

                {showCurrentImage && (
                    <button
                        type="button"
                        aria-pressed={true}
                        className={tileClass(true)}
                    >
                        <img
                            src={value}
                            alt={
                                isUploadedImage
                                    ? "Imagen cargada desde el equipo"
                                    : "Imagen actual del producto"
                            }
                            className="h-28 w-full object-cover"
                        />
                        <span className="block bg-blue-600 px-2 py-1 text-center text-xs font-medium text-white">
                            {isUploadedImage ? "Imagen cargada" : "Imagen actual"}
                        </span>
                    </button>
                )}

                        <button
          type="button"
          onClick={handleNoImage}
          aria-pressed={value === ""}
          className={tileClass(value === "")}
        >
          <span className="flex h-28 flex-col items-center justify-center gap-1 bg-slate-100 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <line x1="2" x2="22" y1="2" y2="22" />
              <path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" />
              <line x1="13.5" x2="6" y1="13.5" y2="21" />
              <line x1="18" x2="21" y1="12" y2="15" />
              <path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59" />
              <path d="M21 15V5a2 2 0 0 0-2-2H9" />
            </svg>
            <span className="text-xs font-medium">Sin imagen</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={tileClass(false)}
        >
          <span className="flex h-28 flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 bg-white text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-7 w-7 ${uploading ? "animate-spin" : ""}`}
              aria-hidden="true"
            >
              {uploading ? (
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              ) : (
                <>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </>
              )}
            </svg>
            <span className="text-xs font-medium">
              {uploading ? "Procesando..." : "Cargar imagen"}
            </span>
          </span>
        </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
            />

            {uploadError && (
                <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}

            {selectedOption && (
                <p className="mt-2 text-xs text-slate-500">
                    Foto de{" "}
                    <a
                        href={selectedOption.authorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        {selectedOption.authorName}
                    </a>{" "}
                    en{" "}
                    <a
                        href={selectedOption.unsplashUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        Unsplash
                    </a>
                </p>
            )}
        </div>
    );
}
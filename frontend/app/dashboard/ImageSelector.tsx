"use client";

import { useEffect, useState } from "react";
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

function tileClass(selected: boolean) {
  return `block w-full overflow-hidden rounded-lg border-2 text-left transition ${
    selected
      ? "border-blue-600 ring-2 ring-blue-200"
      : "border-transparent hover:border-slate-300"
  }`;
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

  function handleSelectOption(option: ImageOption) {
    onChange(option.url);
    void selectImage(option.downloadLocation);
  }

  return (
    <div className="md:col-span-2">
      <p className="mb-2 font-medium">Imagen del producto</p>

      {status === "idle" && (
        <p className="mb-3 text-sm text-slate-500">
          Escribe el nombre del producto para ver sugerencias.
        </p>
      )}

      {status === "error" && (
        <p className="mb-3 text-sm text-red-600">
          No fue posible cargar sugerencias. Puedes continuar sin imagen.
        </p>
      )}

      {status === "done" && options.length === 0 && (
        <p className="mb-3 text-sm text-slate-500">
          No encontramos sugerencias para &quot;{query}&quot;.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
              alt="Imagen actual del producto"
              className="h-28 w-full object-cover"
            />
            <span className="block bg-blue-600 px-2 py-1 text-center text-xs font-medium text-white">
              Imagen actual
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onChange("")}
          aria-pressed={value === ""}
          className={tileClass(value === "")}
        >
          <span className="flex h-28 flex-col items-center justify-center gap-1 bg-slate-100 text-slate-500">
            <span className="text-2xl" aria-hidden="true">
              🚫
            </span>
            <span className="text-xs font-medium">Sin imagen</span>
          </span>
        </button>
      </div>

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
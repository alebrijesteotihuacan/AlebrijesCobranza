"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, User, Inbox, MessageCircleWarning, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ResultType = "cliente" | "comprobante" | "desconocido" | "mensaje";

interface Result {
  type: ResultType;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const TYPE_META: Record<ResultType, { icon: typeof Search; label: string; color: string }> = {
  cliente:     { icon: User,                  label: "Cliente",     color: "text-alebrijes-orange" },
  comprobante: { icon: Inbox,                 label: "Comprobante", color: "text-alebrijes-success" },
  desconocido: { icon: MessageCircleWarning, label: "Desconocido", color: "text-zinc-500" },
  mensaje:     { icon: FileText,              label: "Mensaje",     color: "text-blue-500" },
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setActiveIdx(0);
    }
  }, [open]);

  // Debounced fetch
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { results: Result[] };
        setResults(data.results);
        setActiveIdx(0);
      } catch (e) {
        if ((e as { name?: string }).name !== "AbortError") {
          console.error("search error", e);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query]);

  function handleSelect(r: Result) {
    setOpen(false);
    router.push(r.href);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    }
  }

  return (
    <>
      {/* Trigger button (visible in topbar) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-md border border-zinc-200 bg-zinc-50 text-sm text-muted-foreground hover:bg-zinc-100 transition-colors min-w-[180px]"
        aria-label="Abrir búsqueda global"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Mobile icon-only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sm:hidden p-2 rounded-md hover:bg-zinc-100"
        aria-label="Abrir búsqueda global"
      >
        <Search className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Búsqueda global</DialogTitle>
          <DialogDescription className="sr-only">
            Busca clientes, comprobantes y números desconocidos
          </DialogDescription>

          <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Buscar clientes, comprobantes, desconocidos..."
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-muted-foreground">
              ESC
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {query.length < 2 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Escribí al menos 2 caracteres para buscar.
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No se encontraron resultados para &quot;{query}&quot;
              </div>
            ) : (
              <ul className="divide-y divide-zinc-200">
                {results.map((r, i) => {
                  const meta = TYPE_META[r.type];
                  const Icon = meta.icon;
                  return (
                    <li key={`${r.type}-${r.id}`}>
                      <Link
                        href={r.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSelect(r);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors",
                          i === activeIdx && "bg-alebrijes-orange/5",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", meta.color)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          {r.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {r.subtitle}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {meta.label}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

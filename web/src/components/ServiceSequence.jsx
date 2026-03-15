import React, { useState, useEffect, useRef } from "react";
import BatchGeneratorModal from "./BatchGeneratorModal";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const ServiceSequence = ({ onNotify }) => {
  const [inSequence, setInSequence] = useState([]);
  const [outOfSequence, setOutOfSequence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenModal, setShowGenModal] = useState(false);
  const [dragOverSection, setDragOverSection] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [lastDroppedId, setLastDroppedId] = useState(null);

  // Drag Tracking (Refs to avoid re-renders during drag)
  const draggedItemRef = useRef(null); // { service, fromSection, index }

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/services`);
      if (!res.ok) throw new Error("Erro ao carregar serviços");
      const data = await res.json();

      const inSeq = data
        .filter((s) => !s.outOfSequence)
        .sort(
          (a, b) => (a.cirandaSequence || 999) - (b.cirandaSequence || 999),
        );

      const outSeq = data
        .filter((s) => s.outOfSequence)
        .sort((a, b) => a.code.localeCompare(b.code));

      setInSequence(inSeq);
      setOutOfSequence(outSeq);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, service, section, index) => {
    draggedItemRef.current = { service, section, index };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", service.id.toString());

    if (e.target) {
      const target = e.target;
      setTimeout(() => {
        target.classList.add("opacity-20");
      }, 0);
    }
  };

  const handleDragEnd = (e) => {
    if (e.target) {
      e.target.classList.remove("opacity-20");
    }
    draggedItemRef.current = null;
    setDragOverSection(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, targetSection, targetIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!draggedItemRef.current) return;
    const { section: fromSection, index: fromIndex } = draggedItemRef.current;

    // Update Section
    if (dragOverSection !== targetSection) {
      setDragOverSection(targetSection);
      setDragOverIndex(null); // Reset index only when changing sections
    }

    // Update Index (Only update if we are over a card to avoid flickering in container gaps)
    if (targetIndex !== null && dragOverIndex !== targetIndex) {
      setDragOverIndex(targetIndex);
    }

    // Live-reorder within the same section
    if (
      fromSection === targetSection &&
      targetIndex !== null &&
      targetIndex !== fromIndex
    ) {
      const updateList = () => {
        const isSequence = fromSection === "in";
        const list = isSequence ? [...inSequence] : [...outOfSequence];

        const item = list[fromIndex];
        list.splice(fromIndex, 1);
        list.splice(targetIndex, 0, item);

        if (isSequence) setInSequence(list);
        else setOutOfSequence(list);

        draggedItemRef.current.index = targetIndex;
      };

      if (document.startViewTransition) {
        document.startViewTransition(updateList);
      } else {
        updateList();
      }
    }
  };

  // Helper to check if we should show the blue bar
  const shouldShowIndicator = (idx, section) => {
    return dragOverSection === section && dragOverIndex === idx;
  };

  const handleDrop = (e, targetSection, targetIndex = null) => {
    e.preventDefault();
    setDragOverSection(null);
    setDragOverIndex(null);
    if (!draggedItemRef.current) return;

    const { service, section: fromSection } = draggedItemRef.current;

    const updateState = () => {
      if (fromSection !== targetSection) {
        let newInSequence = [...inSequence];
        let newOutOfSequence = [...outOfSequence];

        if (fromSection === "in") {
          newInSequence = newInSequence.filter((s) => s.id !== service.id);
        } else {
          newOutOfSequence = newOutOfSequence.filter(
            (s) => s.id !== service.id,
          );
        }

        const updatedService = {
          ...service,
          outOfSequence: targetSection === "out",
        };

        if (targetSection === "in") {
          if (targetIndex !== null)
            newInSequence.splice(targetIndex, 0, updatedService);
          else newInSequence.push(updatedService);
        } else {
          if (targetIndex !== null)
            newOutOfSequence.splice(targetIndex, 0, updatedService);
          else newOutOfSequence.push(updatedService);
        }

        setInSequence(newInSequence);
        setOutOfSequence(newOutOfSequence);
      }
      setLastDroppedId(service.id);
      setTimeout(() => setLastDroppedId(null), 2000);
    };

    if (document.startViewTransition) {
      document.startViewTransition(updateState);
    } else {
      updateState();
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updates = [
        ...inSequence.map((s, idx) => ({
          id: s.id,
          sequence: idx + 1,
          outOfSequence: false,
        })),
        ...outOfSequence.map((s) => ({
          id: s.id,
          sequence: null,
          outOfSequence: true,
        })),
      ];

      const res = await fetch(`${API}/api/services/sequence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Erro ao salvar configuração");
      onNotify("Configurações salvas com sucesso!", "success");
      fetchServices();
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const ServiceCard = ({ service, index, section }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, service, section, index)}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => handleDragOver(e, section, index)}
      onDrop={(e) => {
        e.stopPropagation();
        handleDrop(e, section, index);
      }}
      style={{ viewTransitionName: `card-${service.id}` }}
      className={`
        group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500
        ${
          section === "in"
            ? "bg-slate-900/60 border-slate-700/50 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/5 cursor-grab active:cursor-grabbing"
            : "bg-slate-900/40 border-slate-800/80 grayscale-[0.8] opacity-70 hover:grayscale-[0.4] cursor-grab"
        }
        ${lastDroppedId === service.id ? "ring-2 ring-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.3)] scale-[1.02] bg-slate-800/90 z-20" : ""}
      `}
    >
      <div
        className={`
        flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm transition-transform group-hover:scale-105 pointer-events-none
        ${section === "in" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-slate-800 text-slate-600 border border-slate-700/50"}
      `}
      >
        {section === "in" ? index + 1 : "—"}
      </div>

      <div className="flex-1 min-w-0 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-none">
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${section === "in" ? "bg-sky-500/20 text-sky-300 border-sky-500/20" : "bg-slate-800 text-slate-600 border-slate-700"}`}
          >
            {service.code}
          </span>
          <h4
            className={`font-bold truncate ${section === "in" ? "text-slate-100" : "text-slate-500"}`}
          >
            {service.name || "Linha sem Nome"}
          </h4>
        </div>
        {section === "in" && (
          <div className="mt-1 flex items-center gap-1 pointer-events-none">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => {
              const active = service.operationalDays?.includes(day);
              return (
                active && (
                  <span
                    key={day}
                    className="text-[8px] font-black text-sky-500/60"
                  >
                    {day[0]}
                  </span>
                )
              );
            })}
          </div>
        )}
      </div>

      <div className="text-slate-700 text-xl font-thin select-none">⋮⋮</div>
    </div>
  );

  return (
    <div className="p-1 space-y-10 animate-in fade-in duration-1000">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-200 uppercase tracking-tighter flex items-center gap-3">
            Sequência <span className="text-sky-500">Ciranda</span>
            <span className="text-[10px] bg-sky-500/10 text-sky-500 border border-sky-500/20 px-3 py-1 rounded-full font-black animate-pulse">
              BETA
            </span>
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Gestão de prioridade operacional e isolamento de linhas.
          </p>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 lg:flex-none px-8 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95 disabled:opacity-50"
          >
            {loading ? "Gravando..." : "💾 Salvar Tudo"}
          </button>
          <button
            onClick={() => setShowGenModal(true)}
            className="flex-1 lg:flex-none px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🎡</span> Gerar Ciranda
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* EM SEQUENCIA */}
        <section
          className={`space-y-6 transition-all duration-500 ${dragOverSection === "in" ? "scale-[1.01]" : ""}`}
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all ${dragOverSection === "in" ? "bg-sky-400 shadow-[0_0_15px_#38bdf8]" : "bg-sky-500"}`}
              ></div>
              <h3
                className={`font-black uppercase tracking-[0.2em] text-sm transition-colors ${dragOverSection === "in" ? "text-sky-400" : "text-slate-300"}`}
              >
                Em Sequência de Giro
              </h3>
            </div>
            <span className="text-xs bg-slate-800 text-slate-500 px-3 py-1 rounded-full font-bold">
              {inSequence.length} itens
            </span>
          </div>

          <div
            onDragOver={(e) => handleDragOver(e, "in", null)}
            onDrop={(e) => handleDrop(e, "in")}
            className={`
              min-h-[600px] p-6 rounded-[2.5rem] transition-all duration-500 border-2 border-dashed relative overflow-hidden
              ${
                dragOverSection === "in" &&
                draggedItemRef.current?.section !== "in"
                  ? "bg-sky-500/15 border-sky-400 shadow-[0_0_50px_rgba(14,165,233,0.2)] scale-[1.01] ring-2 ring-sky-500/20"
                  : "bg-slate-800/20 border-slate-800/80"
              }
            `}
          >
            {/* Sombreamento magnético quando o item vem de fora */}
            {dragOverSection === "in" &&
              draggedItemRef.current?.section !== "in" && (
                <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none animate-pulse"></div>
              )}
            <div className="relative z-10 space-y-3">
              {inSequence.map((s, idx) => (
                <div
                  key={s.id}
                  className="relative transition-all duration-300"
                >
                  <ServiceCard service={s} index={idx} section="in" />
                  {shouldShowIndicator(idx, "in") && (
                    <div className="absolute -bottom-2 left-0 right-0 h-1.5 bg-sky-500 rounded-full shadow-[0_0_15px_#0ea5e9] z-50 pointer-events-none animate-pulse"></div>
                  )}
                </div>
              ))}

              {inSequence.length === 0 && !loading && (
                <div className="py-32 text-center">
                  <div className="text-6xl mb-6 grayscale opacity-20">🔄</div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                    Arraste para definir a ordem
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FORA DE SEQUENCIA */}
        <section
          className={`space-y-6 transition-all duration-500 ${dragOverSection === "out" ? "scale-[1.02]" : ""}`}
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all ${dragOverSection === "out" ? "bg-amber-500 shadow-[0_0_15px_#f59e0b]" : "bg-slate-700"}`}
              ></div>
              <h3
                className={`font-black uppercase tracking-[0.2em] text-sm transition-colors ${dragOverSection === "out" ? "text-amber-500" : "text-slate-600"}`}
              >
                Fora de Sequência (Fixos)
              </h3>
            </div>
            <span className="text-xs bg-slate-800 text-slate-700 px-3 py-1 rounded-full font-bold">
              {outOfSequence.length} itens
            </span>
          </div>

          <div
            onDragOver={(e) => handleDragOver(e, "out", null)}
            onDrop={(e) => handleDrop(e, "out")}
            className={`
              min-h-[600px] p-6 rounded-[2.5rem] transition-all duration-500 border-2 border-dashed relative overflow-hidden
              ${
                dragOverSection === "out" &&
                draggedItemRef.current?.section !== "out"
                  ? "bg-amber-500/10 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.15)] scale-[1.01] ring-2 ring-amber-500/10"
                  : "bg-slate-900/40 border-slate-800/80"
              }
            `}
          >
            {/* Campo magnético âmbar para fixos */}
            {dragOverSection === "out" &&
              draggedItemRef.current?.section !== "out" && (
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none animate-pulse"></div>
              )}
            <div className="relative z-10 space-y-3">
              {outOfSequence.map((s, idx) => (
                <div
                  key={s.id}
                  className="relative transition-all duration-300"
                >
                  <ServiceCard service={s} index={idx} section="out" />
                  {shouldShowIndicator(idx, "out") && (
                    <div className="absolute -bottom-2 left-0 right-0 h-1.5 bg-amber-500 rounded-full shadow-[0_0_15px_#f59e0b] z-50 pointer-events-none animate-pulse"></div>
                  )}
                </div>
              ))}

              {outOfSequence.length === 0 && !loading && (
                <div className="py-32 text-center">
                  <div className="text-6xl mb-6 grayscale opacity-10">📥</div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">
                    Arraste para desconsiderar
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <footer className="group relative p-8 bg-slate-900/60 border border-slate-800/50 rounded-3xl flex gap-6 items-start overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
          <div className="text-9xl">💡</div>
        </div>
        <div className="text-3xl pt-1">ℹ️</div>
        <div className="space-y-2 relative">
          <h5 className="text-slate-300 font-bold uppercase tracking-widest text-xs">
            Informação Crucial
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] text-slate-500 font-medium leading-relaxed">
            <p>
              O grupo <strong className="text-sky-400">Em Sequência</strong>{" "}
              define a ordem absoluta para a automação do sistema Ciranda. As
              escalas do topo têm prioridade total na alocação de motoristas.
            </p>
            <p>
              O grupo{" "}
              <strong className="text-slate-400">Fora de Sequência</strong>{" "}
              isola linhas que possuem motoristas fixos ou escalas dedicadas,
              evitando que elas entrem no cálculo de giro comum.
            </p>
          </div>
        </div>
      </footer>

      {showGenModal && (
        <BatchGeneratorModal
          service={{ code: "TODOS", name: "Geração em Lote Sequenciado" }}
          onClose={() => setShowGenModal(false)}
          onGenerate={async (params, onProgress) => {
            try {
              setLoading(true);
              const servicesToProcess = inSequence;
              const total = servicesToProcess.length;

              if (total === 0) {
                onProgress?.(
                  100,
                  "Nenhum serviço em sequência para processar.",
                );
                return;
              }

              for (let i = 0; i < total; i++) {
                const s = servicesToProcess[i];
                const currentProgress = Math.round((i / total) * 100);
                onProgress?.(
                  currentProgress,
                  `Processando: ${s.code} (${i + 1}/${total})`,
                );

                const res = await fetch(`${API}/api/batch-schedules/generate`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...params,
                    serviceId: s.id,
                  }),
                });

                if (!res.ok) {
                  const errorData = await res.json();
                  throw new Error(
                    `Erro no serviço ${s.code}: ${errorData.message}`,
                  );
                }
              }

              onProgress?.(100, "Finalizando processamento...");
            } catch (err) {
              console.error("Batch generation error:", err);
              throw err;
            } finally {
              setLoading(false);
            }
          }}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};

export default ServiceSequence;

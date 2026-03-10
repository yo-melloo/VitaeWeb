import React, { useState } from "react";

const CancellationModal = ({
  isOpen,
  onClose,
  trip,
  relatedTrips,
  onConfirm,
}) => {
  const [cancelType, setCancelType] = useState("FULL"); // FULL or PARTIAL
  const [createPasse, setCreatePasse] = useState(true);

  if (!isOpen) return null;

  const affectedTrips =
    cancelType === "FULL" && relatedTrips ? relatedTrips : [trip];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-100 italic">
                Cancelar Operação
              </h3>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mt-1">
                Serviço: <span className="text-sky-400">{trip.route}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Opções de Cancelamento */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCancelType("FULL")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  cancelType === "FULL"
                    ? "border-rose-500 bg-rose-500/10 text-rose-400"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                }`}
              >
                <span className="text-2xl">🚫</span>
                <span className="font-bold text-xs uppercase tracking-tighter">
                  Serviço Todo
                </span>
              </button>
              <button
                onClick={() => setCancelType("PARTIAL")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  cancelType === "PARTIAL"
                    ? "border-sky-500 bg-sky-500/10 text-sky-400"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                }`}
              >
                <span className="text-2xl">✂️</span>
                <span className="font-bold text-xs uppercase tracking-tighter">
                  Apenas Trecho
                </span>
              </button>
            </div>

            {/* Alerta de Impacto */}
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl">
              <div className="flex gap-4 items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex shrink-0 items-center justify-center text-amber-500 border border-amber-500/20 text-xl">
                  ⚠️
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase">
                    Impacto Operacional
                  </p>
                  <p className="text-slate-200 font-bold">
                    {affectedTrips.length} motorista(s) afetado(s)
                  </p>
                  {cancelType === "PARTIAL" && (
                    <p className="text-[10px] text-amber-400 italic font-medium">
                      (Apenas no trecho selecionado)
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {affectedTrips.map((t, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center text-xs border border-slate-700/50"
                  >
                    <div>
                      <span className="font-bold text-slate-300 block">
                        {t.driver.name || t.driver}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase">
                        {t.segment.origin || t.segment} →{" "}
                        {t.segment.destination || t.segment}
                      </span>
                    </div>
                    {(() => {
                      const loc =
                        t.segment.origin || t.segment.split(" x ")[0] || "";
                      const isBase = [
                        "goiânia",
                        "goiania",
                        "imperatriz",
                        "são luís",
                        "sao luis",
                      ].some((b) => loc.toLowerCase().includes(b));
                      return (
                        <div className="text-right">
                          <span
                            className={`${isBase ? "text-emerald-400" : "text-amber-400"} italic font-medium block`}
                          >
                            {isBase ? "Na base (Remanejar):" : "Preso em:"}
                          </span>
                          <span
                            className={`font-bold ${isBase ? "text-emerald-500" : "text-amber-500"} underline uppercase`}
                          >
                            {loc}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>

            {/* Sugestão de Passe */}
            <div className="flex items-center justify-between bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="text-xs font-bold text-slate-200 uppercase tracking-tighter">
                    Gerar "O Passe"
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    Retorno operacional (Deadheading)
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={createPasse}
                  onChange={() => setCreatePasse(!createPasse)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-2xl font-bold text-sm transition-all"
            >
              Voltar
            </button>
            <button
              onClick={() =>
                onConfirm({ type: cancelType, passe: createPasse })
              }
              className={`flex-1 ${cancelType === "FULL" ? "bg-rose-500 hover:bg-rose-400" : "bg-sky-500 hover:bg-sky-400"} text-white py-3 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationModal;

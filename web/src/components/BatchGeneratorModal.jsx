import React, { useState, useEffect } from "react";

const BatchGeneratorModal = ({ service, onClose, onGenerate, onNotify }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));

    const nextSaturday = new Date(nextSunday);
    nextSaturday.setDate(nextSunday.getDate() + 6);

    setStartDate(nextSunday.toISOString().split("T")[0]);
    setEndDate(nextSaturday.toISOString().split("T")[0]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onGenerate(
        {
          serviceId: service.id,
          startDate,
          endDate,
          defaultDepartureTime: startTime,
        },
        (p, msg) => {
          setProgress(p);
          setStatus(msg);
        },
      );
      onNotify?.("Escalas geradas com sucesso!", "success");
      onClose();
    } catch (error) {
      onNotify?.("Erro ao gerar escala: " + error.message, "error");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <header className="mb-8">
            <h3 className="text-2xl font-bold text-slate-100">
              {loading ? "Processando..." : "Geração Semanal"}
            </h3>
            <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-black">
              Serviço: {service.code} - {service.name}
            </p>
          </header>

          {loading ? (
            <div className="space-y-8 py-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative pt-1">
                <div className="flex mb-4 items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black inline-block py-1 px-3 uppercase rounded-full text-sky-500 bg-sky-500/10 border border-sky-500/20">
                      {status || "Iniciando motor..."}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black inline-block text-sky-500">
                      {progress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-900 border border-slate-700 shadow-inner">
                  <div
                    style={{ width: `${progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-500 ease-out relative"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[stripes_1s_linear_infinite]"></div>
                  </div>
                </div>
                <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                  Aguarde, estamos sequenciando as triagens...
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 opacity-50">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full ${i < progress / 25 ? "bg-sky-500" : "bg-slate-700"} transition-colors duration-500`}
                  ></div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                    Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                    Fim
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                  Hora da 1ª Partida
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl flex gap-3">
                <span className="text-xl">ℹ️</span>
                <p className="text-xs text-sky-400 leading-relaxed">
                  As viagens serão geradas automaticamente respeitando os **dias
                  operacionais** do serviço e as durações estimadas de cada
                  trecho.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-slate-700 text-slate-400 font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-slate-700/50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-6 py-3 bg-sky-500 text-white font-bold uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition-all active:scale-95 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Confirmar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <style>{`
        @keyframes stripes {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
};

export default BatchGeneratorModal;

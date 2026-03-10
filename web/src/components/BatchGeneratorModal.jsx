import React, { useState, useEffect } from "react";

const BatchGeneratorModal = ({ service, onClose, onGenerate, onNotify }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Sugerir do próximo domingo até o sábado seguinte
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
      await onGenerate({
        serviceId: service.id,
        startDate,
        endDate,
        defaultDepartureTime: startTime,
      });
      onNotify?.("Escalas geradas com sucesso!");
      onClose();
    } catch (error) {
      onNotify?.("Erro ao gerar escala: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <header className="mb-8">
            <h3 className="text-2xl font-bold text-slate-100">
              Geração Semanal
            </h3>
            <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-black">
              Serviço: {service.code} - {service.name}
            </p>
          </header>

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
                {loading ? "Gerando..." : "Confirmar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BatchGeneratorModal;

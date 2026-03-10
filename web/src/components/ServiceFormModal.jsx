import React, { useState } from "react";
import ServiceSegments from "./ServiceSegments";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const DAYS_OF_WEEK = [
  { key: "MONDAY", label: "SEG" },
  { key: "TUESDAY", label: "TER" },
  { key: "WEDNESDAY", label: "QUA" },
  { key: "THURSDAY", label: "QUI" },
  { key: "FRIDAY", label: "SEX" },
  { key: "SATURDAY", label: "SÁB" },
  { key: "SUNDAY", label: "DOM" },
];

const ServiceFormModal = ({ service, onClose, onSave, onNotify }) => {
  const [code, setCode] = useState(service ? service.code : "");
  const [name, setName] = useState(service ? service.name : "");
  const [operationalDays, setOperationalDays] = useState(
    service ? service.operationalDays : DAYS_OF_WEEK.map((d) => d.key),
  );
  const [loading, setLoading] = useState(false);

  const toggleDay = (dayKey) => {
    setOperationalDays((prev) =>
      prev.includes(dayKey)
        ? prev.filter((d) => d !== dayKey)
        : [...prev, dayKey],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      code,
      name,
      operationalDays,
    };

    try {
      const url = service
        ? `${API}/api/services/${service.id}`
        : `${API}/api/services`;
      const method = service ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Erro ao salvar rota");
      }

      onNotify?.(`Serviço ${service ? "atualizado" : "criado"} com sucesso!`);
      onSave();
    } catch (err) {
      onNotify?.(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-8">
        <div className="p-8">
          <header className="mb-6">
            <h3 className="text-2xl font-bold text-slate-100">
              {service ? "Editar Serviço" : "Novo Serviço"}
            </h3>
            <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-black">
              Dados do Serviço
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                Código do Serviço
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                placeholder="Ex: 2261"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                Nome do Serviço
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Ex: Goiânia x São Luís"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-2 block">
                Dias de Operação
              </label>
              <div className="flex gap-2 justify-center">
                {DAYS_OF_WEEK.map((day) => {
                  const isActive = operationalDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border transition-all ${
                        isActive
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-slate-900 border-slate-700 text-slate-600 hover:text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
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
                className={`flex-1 px-6 py-3 bg-emerald-500 text-white font-bold uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all ${
                  loading ? "opacity-50 cursor-not-allowed" : "active:scale-95"
                }`}
              >
                {loading ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </form>

          {service && (
            <ServiceSegments serviceId={service.id} onNotify={onNotify} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceFormModal;

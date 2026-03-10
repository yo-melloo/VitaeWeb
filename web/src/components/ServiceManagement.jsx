import React, { useState, useEffect, useCallback } from "react";
import BatchGeneratorModal from "./BatchGeneratorModal";
import ServiceFormModal from "./ServiceFormModal";

const ServiceManagement = ({ onNotify }) => {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/services`,
      );
      if (!response.ok) {
        throw new Error("Falha ao carregar serviços");
      }
      const data = await response.json();
      const normalized = data.map((service) => ({
        id: service.id,
        code: service.code,
        name: service.name,
        operationalDays: service.operationalDays || [],
      }));
      const sorted = normalized.sort((a, b) => a.code.localeCompare(b.code));
      setServices(sorted);
    } catch (error) {
      console.error(error);
      onNotify?.("Erro ao carregar serviços: " + error.message, "error");
    }
  }, [onNotify]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDeleteService = async (id) => {
    if (!window.confirm("Tem certeza que deseja remover este serviço?")) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/services/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Erro ao remover serviço");
      setServices((prev) => prev.filter((s) => s.id !== id));
      onNotify?.("Serviço removido com sucesso!");
    } catch (error) {
      onNotify?.(error.message, "error");
    }
  };

  const handleBatchGenerate = async (data) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/batch-schedules/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) {
        throw new Error("Falha na geração de escala");
      }
      const trips = await response.json();
      onNotify?.(`Escala gerada com sucesso! ${trips.length} viagens criadas.`);
    } catch (err) {
      console.error(err);
      onNotify?.(err.message, "error");
      throw err;
    }
  };

  const daysOfWeek = [
    { key: "SUNDAY", label: "D" },
    { key: "MONDAY", label: "S" },
    { key: "TUESDAY", label: "T" },
    { key: "WEDNESDAY", label: "Q" },
    { key: "THURSDAY", label: "Q" },
    { key: "FRIDAY", label: "S" },
    { key: "SATURDAY", label: "S" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">
            Gerenciamento de Serviços
          </h2>
          <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs font-semibold">
            Definição de Rotas e Perfil Operacional
          </p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setShowForm(true);
          }}
          className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <span>+</span> Novo Serviço
        </button>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                <th className="px-6 py-5">Código</th>
                <th className="px-6 py-5">Descrição do Serviço</th>
                <th className="px-6 py-5">Perfil Operacional (Dias)</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="hover:bg-slate-700/30 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-sky-400 font-bold text-sm">
                    {service.code}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-200 uppercase tracking-tight text-sm">
                      {service.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day.key}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${
                            service.operationalDays.includes(day.key)
                              ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                              : "bg-slate-900/50 border-slate-700 text-slate-600"
                          }`}
                          title={day.key}
                        >
                          {day.label}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setSelectedService(service)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight border border-emerald-500/20 transition-all"
                      >
                        ⚡ Gerar Escala
                      </button>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingService(service);
                            setShowForm(true);
                          }}
                          className="p-2 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                        >
                          🖊️
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedService && (
        <BatchGeneratorModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onGenerate={handleBatchGenerate}
          onNotify={onNotify}
        />
      )}

      {showForm && (
        <ServiceFormModal
          service={editingService}
          onClose={() => {
            setShowForm(false);
            setEditingService(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingService(null);
            fetchServices();
          }}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};

export default ServiceManagement;

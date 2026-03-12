import React, { useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const VehicleFormModal = ({ vehicle, onClose, onSave, onNotify }) => {
  const [plate, setPlate] = useState(vehicle ? vehicle.plate : "");
  const [model, setModel] = useState(vehicle ? vehicle.model : "");
  const [capacity, setCapacity] = useState(vehicle ? vehicle.capacity : 44);
  const [status, setStatus] = useState(
    vehicle ? vehicle.status : "OPERATIONAL",
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      plate,
      model,
      capacity: parseInt(capacity),
      status,
      currentMileage: vehicle ? vehicle.currentMileage : 0,
    };

    try {
      const url = vehicle
        ? `${API}/api/vehicles/${vehicle.id}`
        : `${API}/api/vehicles`;
      const method = vehicle ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao salvar veículo");
      }

      onNotify?.(`Frota ${vehicle ? "atualizada" : "cadastrada"} com sucesso!`);
      onSave();
    } catch (err) {
      onNotify?.(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <header className="mb-6">
            <h3 className="text-2xl font-bold text-slate-100">
              {vehicle ? "Editar Veículo" : "Novo Veículo"}
            </h3>
            <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-black">
              Informações da Frota
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                  Placa/Prefixo
                </label>
                <input
                  type="text"
                  required
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="AAA-0000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                  Capacidade
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-mono tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="44"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                Modelo / Descrição
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Ex: Volvo FH-400 Leito"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                Status Operacional
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="AVAILABLE">Operacional</option>
                <option value="MAINTENANCE">Manutenção</option>
                <option value="OUT_OF_SERVICE">Fora de Serviço</option>
              </select>
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
        </div>
      </div>
    </div>
  );
};

export default VehicleFormModal;

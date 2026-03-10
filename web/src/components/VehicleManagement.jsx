import React, { useState, useEffect, useCallback } from "react";
import VehicleFormModal from "./VehicleFormModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

const VehicleManagement = ({ onNotify }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/vehicles`);
      if (!response.ok) {
        throw new Error("Falha ao carregar frota");
      }
      const data = await response.json();
      const sorted = data.sort((a, b) => a.plate.localeCompare(b.plate));
      setVehicles(sorted);
    } catch (error) {
      console.error(error);
      onNotify?.("Erro ao carregar frota: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const getStatusColor = (status) => {
    switch (status) {
      case "AVAILABLE":
      case "OPERATIONAL":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "MAINTENANCE":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "OUT_OF_SERVICE":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const handleToggleStatus = async (vehicle) => {
    const sequence = ["AVAILABLE", "MAINTENANCE", "OUT_OF_SERVICE"];
    const currentIndex = sequence.indexOf(vehicle.status);
    const nextStatus =
      currentIndex === -1 || currentIndex === sequence.length - 1
        ? sequence[0]
        : sequence[currentIndex + 1];

    try {
      const res = await fetch(`${API}/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...vehicle, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicle.id ? { ...v, status: nextStatus } : v,
        ),
      );
      onNotify?.("Status alterado para " + nextStatus);
    } catch (error) {
      onNotify?.(error.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja remover este veículo?")) return;
    try {
      const res = await fetch(`${API}/api/vehicles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao deletar veículo");
      onNotify?.("Veículo removido com sucesso!");
      fetchVehicles();
    } catch (error) {
      onNotify?.(error.message, "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">
            Gerenciamento de Frota
          </h2>
          <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs font-semibold">
            Controle de Veículos e Disponibilidade
          </p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null);
            setShowForm(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <span>+</span> Novo Veículo
        </button>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium">Carregando frota...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <span className="text-5xl mb-4">🚌</span>
            <p className="font-medium">Nenhum veículo cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                  <th className="px-6 py-5">Prefixo / Placa</th>
                  <th className="px-6 py-5">Modelo / Descrição</th>
                  <th className="px-6 py-5 text-center">Capacidade</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {vehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-slate-700/30 transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-emerald-400 font-bold uppercase tracking-widest text-sm">
                      {vehicle.prefix || vehicle.plate}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-[18px] group-hover:bg-emerald-500/20 transition-colors">
                          {vehicle.status === "MAINTENANCE" ? "🔧" : "🚌"}
                        </div>
                        <span className="font-bold text-slate-200 tracking-tight text-sm">
                          {vehicle.model || "Ônibus Convencional"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-300 font-medium text-sm">
                        {vehicle.capacity || 44} Lugares
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        onClick={() => handleToggleStatus(vehicle)}
                        className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter cursor-pointer hover:brightness-110 active:scale-95 transition-all ${getStatusColor(vehicle.status)}`}
                        title="Clique para alternar status"
                      >
                        {vehicle.status === "OPERATIONAL" ||
                        vehicle.status === "AVAILABLE"
                          ? "Operacional"
                          : vehicle.status === "MAINTENANCE"
                            ? "Manutenção"
                            : vehicle.status === "OUT_OF_SERVICE"
                              ? "Fora de Serviço"
                              : vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingVehicle(vehicle);
                            setShowForm(true);
                          }}
                          className="p-2 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          🖊️
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <VehicleFormModal
          vehicle={editingVehicle}
          onClose={() => {
            setShowForm(false);
            setEditingVehicle(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingVehicle(null);
            fetchVehicles();
          }}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};

export default VehicleManagement;

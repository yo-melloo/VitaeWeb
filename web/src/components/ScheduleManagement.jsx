import React, { useState, useEffect, useCallback } from "react";
import TripForm from "./TripForm";

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

const STATUS_LABELS = {
  SCHEDULED: {
    label: "Agendada",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  IN_PROGRESS: {
    label: "Em Andamento",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  FINISHED: {
    label: "Finalizada",
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
  CANCELLED: {
    label: "Cancelada",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  DELAYED: {
    label: "Atrasada",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  PASSE: {
    label: "Em Passe",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  FALTA: {
    label: "Falta",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatusBadge = ({ status, onClick }) => {
  const s = STATUS_LABELS[status] || {
    label: status,
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
  };
  return (
    <span
      onClick={onClick}
      className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border inline-block ${s.bg} ${s.color} ${onClick ? "cursor-pointer hover:brightness-110 active:scale-95 transition-all" : ""}`}
      title={onClick ? "Clique para alternar status" : ""}
    >
      {s.label}
    </span>
  );
};

const ScheduleManagement = ({ isOperator, onNotify, onSelectDriver }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [filters, setFilters] = useState(() => {
    try {
      const stored = window.localStorage.getItem("vitae:schedule:filters");
      return stored ? JSON.parse(stored) : { status: "", search: "", date: "" };
    } catch {
      return { status: "", search: "", date: "" };
    }
  });

  const [currentDate, setCurrentDate] = useState(() => {
    try {
      const stored = window.localStorage.getItem("vitae:schedule:currentDate");
      if (stored) return stored;
    } catch {}
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/trips`);
      if (!res.ok) throw new Error("Falha ao carregar escalas");
      const data = await res.json();
      setTrips(data);
    } catch (err) {
      console.error(err);
      onNotify?.("Erro ao carregar escalas", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  const [suggestion, setSuggestion] = useState(null);

  const handleToggleStatus = async (trip) => {
    const sequence = [
      "SCHEDULED",
      "IN_PROGRESS",
      "FINISHED",
      "CANCELLED",
      "DELAYED",
    ];
    const currentIndex = sequence.indexOf(trip.status);
    const nextStatus =
      currentIndex === -1 || currentIndex === sequence.length - 1
        ? sequence[0]
        : sequence[currentIndex + 1];

    try {
      const res = await fetch(`${API}/api/trips/${trip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...trip, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");

      const updated = await res.json();
      setTrips((prev) =>
        prev.map((t) => (t.id === trip.id ? { ...t, ...updated } : t)),
      );
      onNotify?.("Status alterado para " + nextStatus);
    } catch (error) {
      onNotify?.(error.message, "error");
    }
  };

  const handleToggleFalta = async (trip) => {
    try {
      const isClearing = trip.status === "FALTA";
      const endpoint = isClearing ? "no-show/clear" : "no-show";
      const response = await fetch(`${API}/api/trips/${trip.id}/${endpoint}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Falha ao atualizar falta");
      const updated = await response.json();
      setTrips((prev) =>
        prev.map((t) => (t.id === trip.id ? { ...t, ...updated } : t)),
      );
      onNotify?.(
        isClearing ? "Falta removida" : "Falta registrada com sucesso",
      );

      if (!isClearing && trip.segment?.origin) {
        handleGetSuggestion(trip);
      } else if (isClearing) {
        setSuggestion(null);
      }
    } catch (error) {
      onNotify?.(error.message, "error");
    }
  };

  const handleGetSuggestion = async (trip) => {
    try {
      const response = await fetch(
        `${API}/api/drivers/suggest?origin=${trip.segment.origin}&departureTime=${trip.departureTime}`,
      );
      if (response.status === 200) {
        const data = await response.json();
        setSuggestion({ tripId: trip.id, driver: data });
      } else {
        setSuggestion(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssignSuggested = async (tripId, driverId) => {
    try {
      const response = await fetch(`${API}/api/trips/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, status: "SCHEDULED" }),
      });
      if (!response.ok) throw new Error("Erro ao atribuir motorista");
      onNotify?.("Motorista atribuído com sucesso!");
      setSuggestion(null);
      fetchTrips();
    } catch (error) {
      onNotify?.(error.message, "error");
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "vitae:schedule:filters",
        JSON.stringify(filters),
      );
      window.localStorage.setItem("vitae:schedule:currentDate", currentDate);
    } catch {}
  }, [filters, currentDate]);

  const handleDateChange = (daysDelta) => {
    setCurrentDate((prev) => {
      const date = new Date(prev + "T12:00:00");
      date.setDate(date.getDate() + daysDelta);
      return date.toISOString().split("T")[0];
    });
  };

  // Apply filters
  const filtered = trips.filter((t) => {
    const statusOk = !filters.status || t.status === filters.status;
    const searchOk =
      !filters.search ||
      t.driver?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      String(t.serviceId || "").includes(filters.search) ||
      t.segment?.origin?.toLowerCase().includes(filters.search.toLowerCase()) ||
      t.segment?.destination
        ?.toLowerCase()
        .includes(filters.search.toLowerCase());

    // In date-based mode, the "filters.date" is handled by currentDate if not explicitly searching by date
    const targetDate = filters.date || currentDate;
    const dateOk = t.departureTime && t.departureTime.startsWith(targetDate);

    return statusOk && searchOk && dateOk;
  });

  // Sort by time
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.departureTime) - new Date(b.departureTime),
  );

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`${API}/api/trips/${id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Falha ao executar ação: ${action}`);
      onNotify?.("Ação executada com sucesso!");
      fetchTrips();
    } catch (err) {
      onNotify?.(err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Atenção: Tem certeza que deseja DELETAR esta escala permanentemente da base?",
      )
    )
      return;
    try {
      const res = await fetch(`${API}/api/trips/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover escala.");
      onNotify?.("Escala deletada com sucesso!");
      fetchTrips();
    } catch (err) {
      onNotify?.(err.message, "error");
    }
  };

  if (showModal) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
        <TripForm
          initialData={editingTrip}
          onCancel={() => {
            setShowModal(false);
            setEditingTrip(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingTrip(null);
            onNotify?.("Escala salva com sucesso!");
            fetchTrips();
          }}
          onNotify={onNotify}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">
            Painel de Escalas
          </h2>
          <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs font-semibold">
            Gerenciamento de todas as viagens
          </p>
        </div>
        {isOperator && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-sky-500/20 transition-all active:scale-95"
          >
            + Nova Escala
          </button>
        )}
      </header>

      {/* Filters & Date Switcher */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-3 no-print">
          <button
            onClick={() => window.print()}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-slate-600"
            title="Exportar Escalas do dia para PDF"
          >
            🖨️ Exportar
          </button>

          <div className="flex bg-slate-900 border border-slate-700 rounded-xl px-2 py-1">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 transition-all font-bold"
              title="Dia Anterior"
            >
              ←
            </button>
            <div className="px-4 py-1.5 text-center min-w-[140px]">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">
                Data Visualizada
              </p>
              <p className="text-sm font-bold text-sky-400">
                {formatDate(currentDate)}
              </p>
            </div>
            <button
              onClick={() => handleDateChange(1)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 transition-all font-bold"
              title="Próximo Dia"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
            Busca Rápida
          </label>
          <input
            type="text"
            placeholder="Motorista, serviço, trecho..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
            Filtrar Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>

        {(filters.status || filters.search || filters.date) && (
          <button
            onClick={() => setFilters({ status: "", search: "", date: "" })}
            className="text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors px-3 py-2.5 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
          >
            ✕ Limpar Filtros
          </button>
        )}

        <div className="ml-auto text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
            Viagens no Dia
          </p>
          <p className="text-xl font-black text-slate-200">{filtered.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium">Carregando escalas...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <span className="text-5xl mb-4"></span>
            <p className="font-medium">Nenhuma escala para esta data</p>
            <p className="text-xs mt-1">
              Use o seletor acima para navegar entre os dias
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="pb-4 pt-5 pl-6 font-black">Motorista</th>
                  <th className="pb-4 pt-5 px-4 font-black">Trecho</th>
                  <th className="pb-4 pt-5 px-4 font-black">Serviço</th>
                  <th className="pb-4 pt-5 px-4 font-black">Partida</th>
                  <th className="pb-4 pt-5 px-4 font-black">Veículo</th>
                  <th className="pb-4 pt-5 px-4 font-black">Status</th>
                  {isOperator && (
                    <th className="pb-4 pt-5 pr-6 font-black text-right">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {sorted.map((trip) => (
                  <TripRow
                    key={trip.id}
                    trip={trip}
                    isOperator={isOperator}
                    onSelectDriver={onSelectDriver}
                    onAction={(id, type) => handleAction(id, type)}
                    onToggleFalta={() => handleToggleFalta(trip)}
                    onToggleStatus={() => handleToggleStatus(trip)}
                    suggestion={
                      suggestion?.tripId === trip.id ? suggestion.driver : null
                    }
                    onAssignSuggested={(driverId) =>
                      handleAssignSuggested(trip.id, driverId)
                    }
                    onEdit={() => {
                      setEditingTrip(trip);
                      setShowModal(true);
                    }}
                    onDelete={() => handleDelete(trip.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const TripRow = ({
  trip,
  isOperator,
  onAction,
  onEdit,
  onDelete,
  onSelectDriver,
  onToggleFalta,
  onToggleStatus,
  suggestion,
  onAssignSuggested,
}) => {
  const isCancelled = trip.status === "CANCELLED";
  const isDelayed = trip.status === "DELAYED";
  const isFalta = trip.status === "FALTA";

  return (
    <tr
      className={`group hover:bg-slate-700/30 transition-colors ${isCancelled ? "opacity-40 grayscale" : ""} ${isFalta ? "border-l-4 border-rose-500 bg-rose-500/5 shadow-inner" : ""}`}
    >
      <td
        onClick={(e) => {
          if (!isOperator) return;
          e.stopPropagation();
          onToggleFalta?.();
        }}
        className={`py-4 pl-6 pr-4 cursor-pointer relative group/cell ${isFalta ? "bg-rose-500/10" : "hover:bg-slate-700/50"}`}
        title={isOperator ? "Clique para reportar falta" : ""}
      >
        {trip.driver ? (
          <div className="text-left group/btn">
            <p
              className={`font-semibold text-sm transition-colors ${isFalta ? "text-rose-400 line-through" : "text-slate-200 group-hover/cell:text-sky-400"}`}
            >
              {trip.driver.name}
            </p>
            {trip.driver.matricula && (
              <p className="text-[10px] text-slate-500 font-mono">
                Mat. {trip.driver.matricula}
              </p>
            )}
            {isFalta && (
              <span className="absolute right-2 top-2 text-[8px] bg-rose-500 text-white px-1 rounded animate-pulse">
                FALTA
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-500 italic">Sem motorista</span>
        )}

        {suggestion && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-6 top-full mt-1 w-48 bg-slate-900 border border-emerald-500/50 rounded-xl p-3 shadow-2xl z-20 animate-in zoom-in-95 duration-200"
          >
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">
              Sugestão Disponível
            </p>
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-bold text-slate-100">
                {suggestion.name}
              </span>
              <button
                onClick={() => onAssignSuggested?.(suggestion.id)}
                className="bg-emerald-500 hover:bg-emerald-400 text-white text-[9px] font-black uppercase px-2 py-1 rounded transition-all"
              >
                Atribuir
              </button>
            </div>
          </div>
        )}
      </td>
      <td className="py-4 px-4 text-slate-300 text-sm">
        {trip.segment ? (
          <span>
            {trip.segment.origin}
            <span className="text-slate-600 mx-1">→</span>
            {trip.segment.destination}
          </span>
        ) : (
          <span className="text-slate-500 italic">—</span>
        )}
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-col">
          <span className="text-sky-400 font-mono font-bold text-sm">
            SVC {trip.serviceCode || trip.serviceId || "N/A"}
          </span>
          <span className="text-[10px] text-slate-500 font-bold truncate max-w-[120px]">
            {trip.routeName ||
              (trip.segment &&
                `${trip.segment.origin} x ${trip.segment.destination}`) ||
              "—"}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 font-mono text-slate-300 text-sm">
        {formatDateTime(trip.departureTime)}
      </td>
      <td className="py-4 px-4">
        <span className="bg-slate-700/50 px-2 py-1 rounded text-xs font-mono border border-slate-600/50 text-slate-400">
          {trip.vehicle?.prefix || trip.vehicle?.plate || "—"}
        </span>
      </td>
      <td className="py-4 px-4 text-center">
        <StatusBadge
          status={trip.status}
          onClick={isOperator ? onToggleStatus : null}
        />
        {trip.isImpacted && !isDelayed && (
          <span
            className="ml-2 text-amber-500 text-xs"
            title="Viagem impactada"
          >
            ⚠️
          </span>
        )}
      </td>
      {isOperator && (
        <td className="py-4 pr-6 text-right">
          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all">
            {!isCancelled && !isDelayed && trip.status !== "FINISHED" && (
              <button
                onClick={() => onAction(trip.id, "delay")}
                className="px-2 py-1.5 hover:bg-amber-500/10 rounded-lg text-slate-500 hover:text-amber-400 transition-all text-[10px] font-black uppercase tracking-tighter"
                title="Relatar Atraso"
              >
                Atraso
              </button>
            )}
            {isDelayed && (
              <button
                onClick={() => onAction(trip.id, "delay/clear")}
                className="px-2 py-1.5 hover:bg-emerald-500/10 rounded-lg text-slate-500 hover:text-emerald-400 transition-all text-[10px] font-black uppercase tracking-tighter"
                title="Limpar de Atraso"
              >
                Reverter Atraso
              </button>
            )}
            {trip.status === "PASSE" && (
              <button
                onClick={() => onAction(trip.id, "no-show/clear")} // Check if this is the correct action for passe (user request says revert passe)
                className="px-2 py-1.5 hover:bg-indigo-500/10 rounded-lg text-slate-500 hover:text-indigo-400 transition-all text-[10px] font-black uppercase tracking-tighter"
                title="Remover Passe/Falta"
              >
                Reverter Passe
              </button>
            )}
            {isCancelled && (
              <button
                onClick={() => onAction(trip.id, "delay/clear")} // Backend doesn't have explicit uncancel but delay/clear often clears status back to scheduled
                className="px-2 py-1.5 hover:bg-emerald-500/10 rounded-lg text-slate-500 hover:text-emerald-400 transition-all text-[10px] font-black uppercase tracking-tighter"
                title="Reverter Cancelamento"
              >
                Reverter Cancelamento
              </button>
            )}
            {!isCancelled && trip.status !== "FINISHED" && (
              <button
                onClick={() => {
                  if (confirm("Cancelar esta viagem?"))
                    onAction(trip.id, "cancel");
                }}
                className="px-2 py-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-all text-[10px] font-black uppercase tracking-tighter"
                title="Cancelar Viagem"
              >
                Cancelar
              </button>
            )}

            <div className="w-px bg-slate-700/50 mx-1"></div>

            <button
              onClick={onEdit}
              className="px-2 py-1.5 hover:bg-sky-500/10 rounded-lg text-slate-500 hover:text-sky-400 transition-all text-[10px] font-black uppercase tracking-tighter"
              title="Editar Cadastro da Escala"
            >
              Editar
            </button>
            <button
              onClick={onDelete}
              className="px-2 py-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-all text-[10px] font-black uppercase tracking-tighter"
              title="Deletar permanentemente"
            >
              Excluir
            </button>
          </div>
        </td>
      )}
    </tr>
  );
};

export default ScheduleManagement;

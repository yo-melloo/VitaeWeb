import React, { useState, useEffect, useCallback } from "react";
import DriverFormModal from "./DriverFormModal";

const DriverManagement = ({ onNotify, onSelectDriver }) => {
  const [drivers, setDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const [filterStatus, setFilterStatus] = useState(() => {
    if (typeof window === "undefined") return "ALL";
    try {
      return window.localStorage.getItem("vitae:drivers:filterStatus") || "ALL";
    } catch {
      return "ALL";
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/drivers`,
      );
      if (!response.ok) {
        throw new Error("Falha ao carregar motoristas");
      }
      const data = await response.json();
      const normalized = data
        .map((driver) => ({
          ...driver,
          id: driver.id,
          name: driver.name,
          matricula: driver.matricula,
          baseName: driver.base?.name || "",
          status: driver.status,
          saldoDias: driver.saldoDias ?? 0,
          daysIdle: driver.daysIdle ?? 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setDrivers(normalized);
    } catch (error) {
      console.error(error);
      onNotify?.("Erro ao carregar motoristas: " + error.message, "error");
    }
  }, [onNotify]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    try {
      window.localStorage.setItem("vitae:drivers:filterStatus", filterStatus);
    } catch {
      // ignore storage errors
    }
  }, [filterStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case "DISPONIVEL":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "FOLGA":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "ESCALADO":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "FALTA":
        return "bg-red-600/20 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
      case "ATESTADO":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "AFASTADO":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "FERIAS":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "DISPONIVEL":
        return "Disponível";
      case "FOLGA":
        return "Folga";
      case "ESCALADO":
        return "Escalado";
      case "FALTA":
        return "Falta";
      case "ATESTADO":
        return "Atestado";
      case "AFASTADO":
        return "Afastado";
      case "FERIAS":
        return "Férias";
      default:
        return status;
    }
  };

  const handleToggleStatus = async (driver) => {
    const manualSequence = [
      "DISPONIVEL",
      "FALTA",
      "ATESTADO",
      "AFASTADO",
      "FERIAS",
    ];
    const currentIndex = manualSequence.indexOf(driver.status);
    const nextStatus =
      currentIndex === -1 || currentIndex === manualSequence.length - 1
        ? manualSequence[0]
        : manualSequence[currentIndex + 1];

    try {
      const payload = { ...driver, status: nextStatus };
      delete payload.baseName;
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/drivers/${driver.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error("Erro ao atualizar status");

      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driver.id ? { ...d, status: nextStatus } : d,
        ),
      );
      onNotify?.("Status alterado para " + nextStatus);
    } catch (error) {
      onNotify?.(error.message, "error");
    }
  };

  const handleDeleteDriver = async (id) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/drivers/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Erro ao remover motorista");
      setDrivers((prev) => prev.filter((d) => d.id !== id));
      onNotify?.("Motorista removido!");
    } catch (error) {
      onNotify?.(error.message, "error");
    }
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSorted = drivers
    .filter((d) => {
      // Status filter
      if (filterStatus !== "ALL") {
        if (filterStatus === "SOBRANDO") {
          if (!(d.status === "DISPONIVEL" && d.daysIdle >= 3)) return false;
        } else {
          if (d.status !== filterStatus) return false;
        }
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.matricula.includes(q) ||
          d.baseName?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === "string") {
        const comp = aValue.localeCompare(bValue);
        return sortConfig.direction === "asc" ? comp : -comp;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column)
      return <span className="ml-1 opacity-20">⇅</span>;
    return (
      <span className="ml-1 text-sky-400">
        {sortConfig.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">
            Gerenciamento de Motoristas
          </h2>
          <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs font-semibold">
            Controle de Matrículas e Jornada
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar motorista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 w-64 pl-10 transition-all font-medium"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              🔍
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs">
            <label className="font-black text-slate-500 uppercase tracking-tighter">
              Filtro:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-200 font-bold outline-none cursor-pointer"
            >
              <option value="ALL">TODOS</option>
              <option value="DISPONIVEL">DISPONÍVEIS</option>
              <option value="FOLGA">FOLGA (DESC.)</option>
              <option value="ESCALADO">ESCALADOS</option>
              <option value="FALTA">FALTAS</option>
              <option value="ATESTADO">ATESTADO</option>
              <option value="AFASTADO">AFASTADO</option>
              <option value="FERIAS">FÉRIAS</option>
            </select>
          </div>
          <button
            onClick={() => {
              setEditingDriver(null);
              setShowForm(true);
            }}
            className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <span>+</span> Novo Motorista
          </button>
        </div>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                <th
                  className="px-6 py-5 cursor-pointer hover:text-sky-400 transition-colors"
                  onClick={() => requestSort("matricula")}
                >
                  Matrícula <SortIndicator column="matricula" />
                </th>
                <th
                  className="px-6 py-5 cursor-pointer hover:text-sky-400 transition-colors"
                  onClick={() => requestSort("name")}
                >
                  Nome Completo <SortIndicator column="name" />
                </th>
                <th
                  className="px-6 py-5 cursor-pointer hover:text-sky-400 transition-colors"
                  onClick={() => requestSort("baseName")}
                >
                  Base <SortIndicator column="baseName" />
                </th>
                <th
                  className="px-6 py-5 text-center cursor-pointer hover:text-sky-400 transition-colors"
                  onClick={() => requestSort("saldoDias")}
                >
                  Saldo (Dias) <SortIndicator column="saldoDias" />
                </th>
                <th
                  className="px-6 py-5 cursor-pointer hover:text-sky-400 transition-colors"
                  onClick={() => requestSort("status")}
                >
                  Status <SortIndicator column="status" />
                </th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredAndSorted.map((driver) => (
                <tr
                  key={driver.id}
                  className="hover:bg-slate-700/30 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-sky-400 text-sm">
                    {driver.matricula}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onSelectDriver?.(driver.id)}
                      className="flex items-center gap-3 text-left group/name"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-[10px] font-black group-hover:bg-sky-500/20 group-hover:text-sky-400 transition-colors">
                        {driver.name.substring(0, 2)}
                      </div>
                      <span className="font-bold text-slate-200 uppercase tracking-tight text-sm group-hover/name:text-sky-400 transition-colors">
                        {driver.name}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400 text-sm font-medium">
                      {driver.baseName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-sm font-bold ${driver.saldoDias > 7 ? "text-amber-400" : "text-slate-300"}`}
                    >
                      {driver.saldoDias}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      onClick={() => handleToggleStatus(driver)}
                      className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter cursor-pointer hover:brightness-110 active:scale-95 transition-all ${getStatusColor(driver.status, driver.daysIdle)}`}
                      title="Clique para alternar status"
                    >
                      {getStatusLabel(driver.status, driver.daysIdle)}
                    </span>
                    {driver.daysIdle > 0 && (
                      <p className="text-[9px] text-slate-500 mt-1 font-bold italic">
                        Inativo há {driver.daysIdle}d
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingDriver(driver);
                          setShowForm(true);
                        }}
                        className="p-2 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                      >
                        🖊️
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Tem certeza que deseja remover este motorista?",
                            )
                          ) {
                            handleDeleteDriver(driver.id);
                          }
                        }}
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
      </div>

      {showForm && (
        <DriverFormModal
          driver={editingDriver}
          onClose={() => {
            setShowForm(false);
            setEditingDriver(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingDriver(null);
            fetchDrivers();
          }}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};

export default DriverManagement;

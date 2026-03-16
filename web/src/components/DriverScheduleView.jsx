import React, { useState, useEffect } from "react";

const mapTripFromApi = (trip) => ({
  id: trip.id,
  origin: trip.segment?.origin,
  destination: trip.segment?.destination,
  departure: trip.departureTime,
  arrival: trip.arrivalTime,
  actualArrival: trip.actualArrivalTime,
  status: trip.status,
  vehicle:
    trip.vehicle?.prefix || trip.vehicle?.plate || trip.vehicle?.id || null,
  isDobra: trip.isDobra,
  serviceCode: trip.serviceCode,
  routeName: trip.routeName,
});

const DriverScheduleView = ({ isDriver, user, initialDriverId, onNotify }) => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [trips, setTrips] = useState([]);
  const [editingTripId, setEditingTripId] = useState(null);
  const [newArrivalTime, setNewArrivalTime] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"
  const [filterDate, setFilterDate] = useState("");
  const [sequenceData, setSequenceData] = useState(null);
  const [showSequence, setShowSequence] = useState(false);
  const [highlitTripId, setHighlitTripId] = useState(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/drivers`,
        );
        if (!response.ok) {
          throw new Error("Falha ao carregar motoristas");
        }
        const data = await response.json();
        const normalized = data.map((driver) => ({
          id: driver.id,
          name: driver.name,
          matricula: driver.matricula,
          base: driver.base?.name || "",
          saldoDias: driver.saldoDias || 0,
          status: driver.status,
          lastStatusChange: driver.lastStatusChange
        }));
        setDrivers(normalized);
      } catch (error) {
        console.error(error);
        onNotify?.("Erro ao carregar motoristas: " + error.message, "error");
      }
    };

    fetchDrivers();
  }, [onNotify]);

  // Auto-select driver from initialDriverId (e.g. when navigating from Dashboard)
  useEffect(() => {
    if (initialDriverId && drivers.length > 0) {
      handleDriverChange(initialDriverId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDriverId, drivers]);

  useEffect(() => {
    if (isDriver && user && user.matricula && drivers.length > 0) {
      const driver = drivers.find((d) => d.matricula === user.matricula);
      if (driver) {
        handleDriverChange(driver.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDriver, user, drivers]);

  const handleDriverChange = async (id) => {
    if (!id) {
      setSelectedDriver(null);
      setTrips([]);
      setSequenceData(null);
      return;
    }

    try {
      // 1. Fetch full driver record (to get latest saldoDias and status)
      const drvResponse = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/drivers/${id}`,
      );
      if (!drvResponse.ok) throw new Error("Erro ao carregar dados do motorista");
      const driverData = await drvResponse.json();
      
      setSelectedDriver({
        ...driverData,
        base: driverData.base?.name || "N/A"
      });

      // 2. Fetch trips
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/trips?driverId=${id}`,
      );
      if (!response.ok) {
        throw new Error("Falha ao carregar viagens do motorista");
      }
      const data = await response.json();
      setTrips(data.map(mapTripFromApi));

      // 3. Fetch sequence prediction
      const seqResponse = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/drivers/${id}/predict-sequence`,
      );
      if (seqResponse.ok) {
        setSequenceData(await seqResponse.json());
      }
    } catch (error) {
      console.error(error);
      onNotify?.("Erro ao carregar dados: " + error.message, "error");
    }
  };

  const handleUpdateArrival = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/trips/${id}/arrival`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newArrivalTime),
        },
      );
      if (!response.ok) {
        throw new Error("Falha ao atualizar chegada");
      }
      const updated = await response.json();
      const mapped = mapTripFromApi(updated);
      setTrips((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...mapped } : t)),
      );
      setEditingTripId(null);
      onNotify?.("Chegada confirmada!");
      
      // Refresh driver data to show new saldoDias
      if (selectedDriver) handleDriverChange(selectedDriver.id);
    } catch (error) {
      console.error(error);
      onNotify?.("Erro ao atualizar chegada: " + error.message, "error");
    }
  };

  const handleTripAction = async (tripId, action) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/trips/${tripId}/${action}`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("Falha ao registrar ação");
      const updated = await response.json();
      const mapped = mapTripFromApi(updated);
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, ...mapped } : t)),
      );
      onNotify?.("Escala atualizada!");

      // Refresh driver data to show new saldoDias/status
      if (selectedDriver) handleDriverChange(selectedDriver.id);
    } catch (error) {
      onNotify?.("Erro: " + error.message, "error");
    }
  };

  const handleStartTrip = async (tripId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/trips/${tripId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        },
      );
      if (!response.ok) throw new Error("Falha ao iniciar viagem");
      const updated = await response.json();
      const mapped = mapTripFromApi(updated);
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, ...mapped } : t)),
      );
      onNotify?.("Viagem iniciada! Tenha uma excelente jornada.");

      // Refresh driver data
      if (selectedDriver) handleDriverChange(selectedDriver.id);
    } catch (error) {
      onNotify?.("Erro: " + error.message, "error");
    }
  };

  const handleToggleFalta = async (trip) => {
    try {
      const isClearing = trip.status === "FALTA";
      const endpoint = isClearing ? "no-show/clear" : "no-show";
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/trips/${trip.id}/${endpoint}`,
        { method: "POST" },
      );
      if (!response.ok) {
        throw new Error("Falha ao atualizar falta");
      }
      const updated = await response.json();
      const mapped = mapTripFromApi(updated);
      setTrips((prev) =>
        prev.map((t) => (t.id === trip.id ? { ...t, ...mapped } : t)),
      );
      onNotify?.(
        isClearing ? "Falta removida" : "Falta registrada com sucesso",
      );

      // Refresh driver data
      if (selectedDriver) handleDriverChange(selectedDriver.id);
    } catch (error) {
      console.error(error);
      onNotify?.("Erro ao registrar falta: " + error.message, "error");
    }
  };

  const getRestHours = (start, end) => {
    const diff = new Date(end) - new Date(start) - 1000 * 60 * 60; // 1h antes da partida
    return diff / (1000 * 60 * 60);
  };

  const formatRestTime = (start, end) => {
    const hoursTotal = getRestHours(start, end);
    if (hoursTotal <= 0) return "---";
    const hours = Math.floor(hoursTotal);
    const minutes = Math.floor((hoursTotal % 1) * 60);
    return `${hours}h ${minutes}min`;
  };

  const groupTripsByDate = (tripsToGroup) => {
    const filtered = tripsToGroup.filter((t) => {
      if (!filterDate) return true;
      const tripDate = new Date(t.departure).toISOString().split("T")[0];
      return tripDate === filterDate;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.departure).getTime();
      const dateB = new Date(b.departure).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    // Identify gaps > 36h BEFORE grouping but AFTER sorting (global context)
    // We filter out trips that didn't happen to get real gaps
    const allSorted = [...tripsToGroup]
      .filter((t) => t.status !== "CANCELLED" && t.status !== "FALTA")
      .sort((a, b) => {
        const dateA = new Date(a.departure).getTime();
        const dateB = new Date(b.departure).getTime();
        return dateA - dateB; // Always ASC for gap calculation
      });

    const tripsWithGaps = sorted.map((trip) => {
      const globalIdx = allSorted.findIndex((t) => t.id === trip.id);
      let restInfo = null;
      const arrivalDate = trip.actualArrival || trip.arrival;
      if (globalIdx !== -1 && globalIdx < allSorted.length - 1 && arrivalDate) {
        const nextTrip = allSorted[globalIdx + 1];
        const restHours = getRestHours(
          arrivalDate,
          nextTrip.departure,
        );
        if (restHours >= 36) {
          restInfo = {
            hours: restHours,
            nextDeparture: nextTrip.departure,
          };
        }
      }
      return { ...trip, restInfo };
    });

    const groups = {};
    tripsWithGaps.forEach((trip) => {
      const dateKey = new Date(trip.departure).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(trip);
    });

    return groups;
  };

  const groupedTrips = groupTripsByDate(trips);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print, 
          header, 
          aside, 
          nav, 
          button:not(.print-only),
          .sidebar-container,
          select {
            display: none !important;
          }
          .print-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .bg-slate-800, .bg-slate-900, .bg-slate-950 {
            background-color: white !important;
            border-color: #e2e8f0 !important;
            color: black !important;
            box-shadow: none !important;
          }
          .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400 {
            color: black !important;
          }
          .text-sky-400, .text-emerald-400, .text-amber-400 {
            color: #0369a1 !important; /* Sky 700 for better print contrast */
            font-weight: bold;
          }
          .border-slate-700 {
            border-color: #cbd5e1 !important;
          }
          .rounded-2xl {
            border-radius: 8px !important;
          }
          /* Ensure timeline line is visible in print if needed, or hide it */
          .absolute.left-\[11px\] {
            background-color: #cbd5e1 !important;
          }
        }
      `}</style>
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">
            Escala Individual
          </h2>
          <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs font-semibold">
            Relatório de Roteirização por Motorista
          </p>
        </div>
        {!isDriver && (
          <div className="w-64">
            <select
              onChange={(e) =>
                handleDriverChange(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
            >
              <option value="">Selecione...</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.matricula})
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {selectedDriver ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 h-fit sticky top-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400 text-2xl font-bold border border-sky-500/30">
                {selectedDriver.name[0]}
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-lg uppercase">
                  {selectedDriver.name}
                </h4>
                <p className="text-sky-400 font-mono text-sm tracking-tighter">
                  MAT: {selectedDriver.matricula}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-3">
                <span className="text-slate-500 uppercase font-bold text-[10px]">
                  Base de Origem
                </span>
                <span className="text-slate-200 font-medium">
                  {selectedDriver.base}
                </span>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700/50 flex justify-between items-center group/saldo hover:border-sky-500/30 transition-all">
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Saldo Auditoria</p>
                  <p className={`text-2xl font-black ${selectedDriver.saldoDias > 7 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {selectedDriver.saldoDias} <span className="text-xs text-slate-500 font-normal">DIAS TRAB.</span>
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${selectedDriver.saldoDias > 7 ? 'bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-slate-800 text-slate-600'}`}>
                  {selectedDriver.saldoDias > 7 ? '⚠️' : '📊'}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase">
                    Filtro por Data
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-black uppercase">
                    Ordenação
                  </span>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-200 transition-all border border-slate-600/50"
                  >
                    {sortOrder === "asc"
                      ? "⬆️ Antigas Primeiro"
                      : "⬇️ Novas Primeiro"}
                  </button>
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="w-full mt-6 bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                🖨️ Exportar PDF
              </button>

              {selectedDriver && sequenceData && (
                <div className="mt-8 pt-8 border-t border-slate-700/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                      Giro da Ciranda
                    </h5>
                    <button
                      onClick={() => setShowSequence(!showSequence)}
                      className="text-[10px] text-sky-400 font-bold hover:underline"
                    >
                      {showSequence ? "Ocultar" : "Ver Detalhes"}
                    </button>
                  </div>

                  <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl">
                    <p className="text-[10px] text-sky-500/60 font-black uppercase mb-1">
                      Próxima Escala Prevista
                    </p>
                    <p className="text-xl font-black text-sky-400">
                      SVC {sequenceData.predictedNextServiceCode}
                    </p>
                  </div>

                  {showSequence && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      {sequenceData.currentSequence.map((srv) => (
                        <div
                          key={srv.id}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                            srv.isCurrent
                              ? "bg-sky-500/10 border-sky-500/40 shadow-[0_0_10px_rgba(14,165,233,0.1)] scale-105"
                              : srv.isNext
                                ? "bg-emerald-500/5 border-emerald-500/20 opacity-90"
                                : srv.isPast
                                  ? "bg-slate-900/40 border-slate-700/50 opacity-40"
                                  : "bg-slate-900/20 border-slate-800 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-500 font-bold">
                              {String(srv.sequence).padStart(2, "0")}
                            </span>
                            <div>
                              <p
                                className={`font-black ${srv.isCurrent ? "text-sky-400" : "text-slate-300"}`}
                              >
                                SVC {srv.code}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                {srv.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {srv.isPast && (
                              <span className="text-slate-600">✓</span>
                            )}
                            {srv.isCurrent && (
                              <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
                            )}
                            {srv.isNext && (
                              <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                Próxima
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-12">
            {Object.keys(groupedTrips).length === 0 ? (
              <div className="py-20 text-center space-y-4 opacity-30">
                <div className="text-6xl">📭</div>
                <p className="text-sm font-bold uppercase tracking-widest">
                  Nenhuma escala encontrada
                </p>
              </div>
            ) : (
              Object.entries(groupedTrips).map(([date, dayTrips]) => (
                <div
                  key={date}
                  className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                    <h5 className="px-6 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 shadow-lg shadow-sky-500/5">
                      {date}
                    </h5>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                  </div>

                  <div className="space-y-4">
                    {dayTrips.map((trip, index) => (
                      <React.Fragment key={trip.id}>
                        <div className="relative pl-8 group">
                          <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-700 group-last:bg-transparent"></div>
                          <div
                            className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 bg-slate-900 z-10 flex items-center justify-center ${trip.isDobra ? "border-amber-500" : "border-slate-700"}`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${trip.isDobra ? "bg-amber-500" : "bg-slate-700"}`}
                            ></div>
                          </div>

                          <div
                            className={`bg-slate-800 border rounded-2xl p-5 transition-all hover:bg-slate-700/40 ${trip.status === "FALTA" ? "border-rose-500/50 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : trip.isDobra ? "border-amber-500/30" : "border-slate-700"}`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl font-bold text-slate-100">
                                    {new Date(trip.departure).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <span className="text-slate-400 text-sm">
                                    {new Date(trip.departure).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "short",
                                    })}
                                  </span>
                                </div>
                                {trip.serviceCode && (
                                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest mt-1 italic">
                                    SVC {trip.serviceCode} — {trip.routeName}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {trip.status === "FINISHED" && (
                                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase rounded border border-emerald-500/20">
                                    Finalizada
                                  </span>
                                )}
                                {trip.status === "SCHEDULED" && (
                                  <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-[9px] font-black uppercase rounded border border-slate-700/80">
                                    Agendada
                                  </span>
                                )}
                                {trip.status === "IN_PROGRESS" && (
                                  <span className="px-2 py-1 bg-sky-500/10 text-sky-400 text-[9px] font-black uppercase rounded border border-sky-500/20">
                                    Em Andamento
                                  </span>
                                )}
                                {trip.status === "DELAYED" && (
                                  <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase rounded border border-amber-500/20">
                                    Atrasada
                                  </span>
                                )}
                                {trip.status === "CANCELLED" && (
                                  <span className="px-2 py-1 bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase rounded border border-rose-500/20">
                                    Cancelada
                                  </span>
                                )}
                                {trip.status === "PASSE" && (
                                  <span className="px-2 py-1 bg-slate-500/10 text-slate-400 text-[9px] font-black uppercase rounded border border-slate-500/20">
                                    Passe
                                  </span>
                                )}
                                {trip.status === "FALTA" && (
                                  <span className="px-2 py-1 bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase rounded border border-rose-500/20">
                                    Falta (No-Show)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-slate-300">
                              <div className="flex-1">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">
                                  Origem
                                </p>
                                <p className="font-bold">{trip.origin}</p>
                              </div>
                              <div className="text-slate-600 text-xl">→</div>
                              <div className="flex-1 text-right">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">
                                  Destino
                                </p>
                                <p className="font-bold">{trip.destination}</p>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center text-xs">
                              {/* Lado Esquerdo: Ações */}
                              <div className="flex gap-2 items-center">
                                <div className="flex gap-2">
                                  {(trip.status === "SCHEDULED" ||
                                    trip.status === "DELAYED") && (
                                    <button
                                      onClick={() => handleStartTrip(trip.id)}
                                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-[10px] font-bold uppercase shadow-lg shadow-sky-500/20 transition-all active:scale-95"
                                    >
                                      ✅ Confirmar
                                    </button>
                                  )}
                                  {(trip.status === "SCHEDULED" ||
                                    trip.status === "IN_PROGRESS") && (
                                    <button
                                      onClick={() =>
                                        handleTripAction(trip.id, "delay")
                                      }
                                      className="px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-[10px] font-bold uppercase transition-all"
                                    >
                                      ⚠️ Atraso
                                    </button>
                                  )}
                                  {trip.status === "DELAYED" && (
                                    <button
                                      onClick={() =>
                                        handleTripAction(trip.id, "delay/clear")
                                      }
                                      className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-[10px] font-bold uppercase transition-all"
                                    >
                                      ✓ Reverter
                                    </button>
                                  )}
                                  {trip.status === "IN_PROGRESS" && (
                                    <button
                                      onClick={() => {
                                        setEditingTripId(trip.id);
                                        const now = new Date();
                                        const localIso = new Date(
                                          now.getTime() -
                                            now.getTimezoneOffset() * 60000,
                                        )
                                          .toISOString()
                                          .slice(0, 16);
                                        setNewArrivalTime(localIso);

                                        // Trigger fast emerald glow animation
                                        setHighlitTripId(trip.id);
                                        setTimeout(
                                          () => setHighlitTripId(null),
                                          800,
                                        );
                                      }}
                                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-[10px] font-bold uppercase shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                    >
                                      🏁 Finalizar
                                    </button>
                                  )}
                                </div>
                                {!isDriver && trip.status !== "FINISHED" && (
                                  <button
                                    onClick={() => handleToggleFalta(trip)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${trip.status === "FALTA" ? "bg-slate-800 text-slate-400 border border-slate-700 hover:text-rose-400" : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"}`}
                                  >
                                    {trip.status === "FALTA"
                                      ? "Desfazer Falta"
                                      : "Reportar Falta"}
                                  </button>
                                )}
                              </div>

                              {/* Lado Direito: Horários */}
                              <div className="flex gap-4 items-center">
                                <span className="text-slate-500 italic">
                                  Chegada Prevista:{" "}
                                  {new Date(trip.arrival).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                                <div
                                  className={`flex items-center gap-2 transition-all duration-300 rounded-md px-2 py-0.5 ${highlitTripId === trip.id ? "bg-emerald-500/30 ring-4 ring-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105" : ""}`}
                                >
                                  <span className="text-slate-200 font-bold">
                                    Chegada Real:
                                  </span>
                                  {editingTripId === trip.id ? (
                                    <div className="flex gap-1">
                                      <input
                                        type="datetime-local"
                                        value={newArrivalTime}
                                        className="bg-slate-900 border border-emerald-500/50 rounded px-2 py-0.5 text-[10px] text-emerald-400 font-bold animate-pulse"
                                        onChange={(e) =>
                                          setNewArrivalTime(e.target.value)
                                        }
                                      />
                                      <button
                                        onClick={() =>
                                          handleUpdateArrival(trip.id)
                                        }
                                        className="text-emerald-400 hover:text-emerald-300"
                                      >
                                        ✔
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-sky-400 font-mono">
                                      {trip.actualArrival
                                        ? new Date(
                                            trip.actualArrival,
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "---"}
                                      {isDriver && (
                                        <button
                                          onClick={() => {
                                            setEditingTripId(trip.id);
                                            setNewArrivalTime(
                                              trip.actualArrival ||
                                                trip.arrival,
                                            );
                                          }}
                                          className="ml-2 text-slate-500 hover:text-sky-400 transition-colors"
                                        >
                                          ✏️
                                        </button>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bloco de Folga (Calculado previamente na estruturação dos dados) */}
                        {trip.restInfo && (
                          <div className="ml-14 my-4 p-4 bg-slate-900/40 border border-dashed border-slate-700 rounded-2xl flex items-center justify-between text-xs transition-all hover:bg-slate-900/60 shadow-[0_0_15px_rgba(14,165,233,0.05)]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                                🛌
                              </div>
                              <div>
                                <p className="text-slate-200 font-bold uppercase tracking-wider">
                                  Período de Folga
                                </p>
                                <p className="text-slate-500 font-mono">
                                  Descanso efetivo na base
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sky-400 font-black text-lg">
                                {formatRestTime(
                                  trip.actualArrival || trip.arrival,
                                  trip.restInfo.nextDeparture,
                                )}
                              </p>
                              <p className="text-[9px] text-slate-500 uppercase font-black">
                                Tempo de Descanso
                              </p>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="h-96 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600">
          <span className="text-6xl mb-4">🔍</span>
          <p className="font-medium">
            Selecione um motorista para visualizar o itinerário individual.
          </p>
        </div>
      )}
    </div>
  );
};

export default DriverScheduleView;

import React, { useState, useEffect } from "react";

const LiveMonitor = ({ onNavigate, isOperator }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [stats, setStats] = useState({
    onTrip: 0,
    inPasse: 0,
    available: 0,
    onLeave: 0,
    scheduledToday: 0,
    driverOccupancy: 0,
    totalDrivers: 0,
    fleetOccupancy: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    maintenanceVehicles: 0,
  });

  const [activeTrips, setActiveTrips] = useState([]);

  useEffect(() => {
    const mapTripFromApi = (trip) => {
      const now = new Date();
      const dep = trip.departureTime ? new Date(trip.departureTime) : null;
      const arr = trip.arrivalTime ? new Date(trip.arrivalTime) : null;

      let timeProgress = 0;
      if (dep && arr && now > dep && now < arr) {
        const total = arr - dep;
        const elapsed = now - dep;
        timeProgress = Math.min(100, Math.max(0, (elapsed / total) * 100));
      } else if (arr && now >= arr) {
        timeProgress = 100;
      }

      // Calculate relative progress based on segment sequence
      let totalProgress = timeProgress;
      if (trip.segment?.sequence && trip.segment?.totalSegments) {
        const seq = trip.segment.sequence;
        const total = trip.segment.totalSegments;
        // Example: 3 segments.
        // Seq 1: 0% + (TP/3) -> 0-33%
        // Seq 2: 33% + (TP/3) -> 33-66%
        // Seq 3: 66% + (TP/3) -> 66-100%
        const segmentWeight = 100 / total;
        totalProgress = Math.round(
          (seq - 1) * segmentWeight + (timeProgress * segmentWeight) / 100,
        );
      } else {
        totalProgress = Math.round(timeProgress);
      }

      return {
        id: trip.id,
        driver: trip.driver?.name || "—",
        route:
          trip.routeName ||
          (trip.segment
            ? `${trip.segment.origin} x ${trip.segment.destination}`
            : ""),
        serviceCode: trip.serviceCode || trip.serviceId,
        progress: totalProgress,
        status: trip.status,
        vehicle: trip.vehicle?.prefix || trip.vehicle?.plate || "—",
      };
    };

    const fetchData = async () => {
      try {
        const [tripsRes, driversRes, vehiclesRes] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/trips`,
          ),
          fetch(
            `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/drivers`,
          ),
          fetch(
            `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/vehicles`,
          ),
        ]);

        if (!tripsRes.ok || !driversRes.ok) {
          throw new Error("Falha ao carregar dados do monitor");
        }

        const [tripsData, driversData, vehiclesData] = await Promise.all([
          tripsRes.json(),
          driversRes.json(),
          vehiclesRes.json(),
        ]);

        const trips = tripsData.map(mapTripFromApi);
        const today = new Date();
        const startOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          0,
          0,
          0,
        );
        const endOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59,
        );

        const tripsToday = tripsData.filter((t) => {
          if (!t.departureTime) return false;
          const d = new Date(t.departureTime);
          return d >= startOfDay && d <= endOfDay;
        });

        const onTrip = trips.filter((t) => t.status === "IN_PROGRESS").length;
        const inPasse = trips.filter((t) => t.status === "PASSE").length;
        const available = driversData.filter(
          (d) => d.status === "DISPONIVEL",
        ).length;
        const onLeave = driversData.filter(
          (d) =>
            d.status === "FOLGA" ||
            d.status === "ATESTADO" ||
            d.status === "AFASTADO" ||
            d.status === "FERIAS",
        ).length;
        const totalDrivers = driversData.length;
        const onTripCount = driversData.filter(
          (d) => d.status === "ESCALADO",
        ).length;
        const driverOccupancy =
          totalDrivers > 0 ? Math.round((onTripCount / totalDrivers) * 100) : 0;

        const totalVehicles = vehiclesData.length;
        const onTripVehicles = vehiclesData.filter(
          (v) => v.status === "ON_TRIP",
        ).length;
        const availableVehicles = vehiclesData.filter(
          (v) => v.status === "AVAILABLE",
        ).length;
        const maintenanceVehicles = vehiclesData.filter(
          (v) => v.status === "MAINTENANCE",
        ).length;
        const fleetOccupancy =
          totalVehicles > 0
            ? Math.round((onTripVehicles / totalVehicles) * 100)
            : 0;

        const active = trips.filter(
          (t) =>
            t.status === "IN_PROGRESS" ||
            t.status === "DELAYED" ||
            t.status === "PASSE",
        );
        setActiveTrips(active);

        // Auto-collapse if no trips are in progress
        if (active.length === 0) {
          setIsCollapsed(true);
        }

        setStats({
          onTrip,
          inPasse,
          available,
          onLeave,
          scheduledToday: tripsToday.length,
          driverOccupancy,
          totalDrivers,
          fleetOccupancy,
          totalVehicles,
          availableVehicles,
          maintenanceVehicles,
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <LiveStatCard
          title="Em Rota"
          value={stats.onTrip}
          icon="🚌"
          color="text-sky-400"
          onClick={
            isOperator
              ? () => {
                  window.localStorage.setItem(
                    "vitae:schedule:filters",
                    JSON.stringify({
                      status: "IN_PROGRESS",
                      search: "",
                      date: "",
                    }),
                  );
                  onNavigate?.("trips");
                }
              : null
          }
        />
        <LiveStatCard
          title="Em Passe"
          value={stats.inPasse}
          icon="🔄"
          color="text-indigo-400"
          onClick={
            isOperator
              ? () => {
                  window.localStorage.setItem(
                    "vitae:schedule:filters",
                    JSON.stringify({ status: "PASSE", search: "", date: "" }),
                  );
                  onNavigate?.("trips");
                }
              : null
          }
        />
        <LiveStatCard
          title="Disponíveis"
          value={stats.available}
          icon="👥"
          color="text-emerald-400"
          onClick={isOperator ? () => onNavigate?.("drivers") : null}
        />
        <LiveStatCard
          title="De Folga Hoje"
          value={stats.onLeave}
          icon="🛌"
          color="text-amber-400"
        />
      </div>

      {/* Middle: Live Progress — collapsible */}
      <section className="bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Header — clicável para minimizar/expandir */}
        <button
          onClick={() => setIsCollapsed((c) => !c)}
          className="w-full flex items-center justify-between p-6 text-left cursor-pointer hover:bg-slate-700/30 transition-colors rounded-3xl"
        >
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
            Monitoramento em Tempo Real
          </h3>
          <div className="flex items-center gap-3">
            {isCollapsed && (
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {activeTrips.length} viagens ativas
              </span>
            )}
            <span
              className={`text-slate-500 text-sm transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            >
              ▲
            </span>
          </div>
        </button>

        {/* Body — hidden when collapsed */}
        {!isCollapsed && (
          <div className="px-6 pb-6">
            {/* Decorative icon */}
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <span className="text-9xl">🗺️</span>
            </div>

            <div className="space-y-6">
              {activeTrips.length > 0 ? (
                activeTrips.map((trip) => (
                  <div key={trip.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">
                          Motorista
                        </span>
                        <p className="text-sm font-bold text-slate-200">
                          {trip.driver}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                            trip.status === "FALTA"
                              ? "bg-rose-500/20 text-rose-500 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse"
                              : trip.status === "DELAYED"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : trip.status === "PASSE"
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                  : trip.status === "FINISHED"
                                    ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {trip.status === "PASSE"
                            ? "Em Passe"
                            : trip.status === "DELAYED"
                              ? "Atrasado"
                              : trip.status === "IN_PROGRESS"
                                ? "Em Andamento"
                                : trip.status === "FALTA"
                                  ? "Falta"
                                  : trip.status === "SCHEDULED"
                                    ? "Agendada"
                                    : trip.status === "FINISHED"
                                      ? "Finalizada"
                                      : trip.status}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-1000 ${trip.status === "DELAYED" ? "bg-rose-500" : "bg-emerald-500"}`}
                        style={{ width: `${trip.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                      <span>{trip.route.split(" x ")[0]}</span>
                      <span>{trip.progress}% Concluído</span>
                      <span>{trip.route.split(" x ")[1]}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                  <span className="text-4xl mb-3">🛣️</span>
                  <p className="text-sm font-medium">
                    Nenhuma viagem em andamento no momento.
                  </p>
                  <p className="text-xs mt-1">
                    Total agendado hoje:{" "}
                    <span className="font-bold text-slate-400">
                      {stats.scheduledToday}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Bottom: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Driver Occupation — real data */}
        <DriverOccupancyChart
          occupancy={stats.driverOccupancy}
          onLeave={stats.onLeave}
          available={stats.available}
          onNavigate={onNavigate}
          isOperator={isOperator}
        />

        {/* Fleet Distribution */}
        <FleetOccupancyChart
          onNavigate={onNavigate}
          isOperator={isOperator}
          occupancy={stats.fleetOccupancy}
          available={stats.availableVehicles}
          maintenance={stats.maintenanceVehicles}
        />
      </div>
    </div>
  );
};

const DriverOccupancyChart = ({
  occupancy,
  onLeave,
  available,
  onNavigate,
  isOperator,
}) => {
  // SVG circle math: r=84, circumference = 2*pi*84 ≈ 527
  const circumference = 527;
  const dashOffset = circumference - (circumference * occupancy) / 100;

  return (
    <section className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl">
      <h3
        onClick={() => isOperator && onNavigate?.("drivers")}
        className={`text-xl font-bold mb-6 text-slate-100 ${isOperator ? "cursor-pointer hover:text-sky-400" : ""} transition-colors flex items-center gap-2 group`}
        title="Ver painel de Motoristas"
      >
        Ocupação dos Motoristas
        <span className="text-slate-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          ↗
        </span>
      </h3>
      <div className="flex items-center justify-center h-64 relative">
        <div className="w-48 h-48 rounded-full border-[12px] border-slate-900 flex items-center justify-center text-center">
          <div>
            <p className="text-4xl font-black text-emerald-400">{occupancy}%</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Em Viagem
            </p>
          </div>
        </div>
        <svg className="absolute w-48 h-48 -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="84"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-emerald-500 opacity-20"
          />
          <circle
            cx="96"
            cy="96"
            r="84"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="text-emerald-500 transition-all duration-1000"
          />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">
            Folga / Descanso
          </p>
          <p className="text-xl font-bold text-slate-200">{onLeave}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">
            Disponíveis
          </p>
          <p className="text-xl font-bold text-emerald-400">{available}</p>
        </div>
      </div>
    </section>
  );
};

const FleetOccupancyChart = ({
  onNavigate,
  isOperator,
  occupancy,
  available,
  maintenance,
}) => {
  const circumference = 527;
  const dashOffset = circumference - (circumference * (occupancy || 0)) / 100;

  return (
    <section className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl">
      <h3
        onClick={() => isOperator && onNavigate?.("fleet")}
        className={`text-xl font-bold mb-6 text-slate-100 text-right ${isOperator ? "cursor-pointer hover:text-sky-400" : ""} transition-colors flex items-center justify-end gap-2 group`}
        title="Ver painel de Frota"
      >
        <span className="text-slate-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          ↗
        </span>
        Ocupação da Frota
      </h3>
      <div className="flex items-center justify-center h-64 relative">
        <div className="w-48 h-48 rounded-full border-[12px] border-slate-900 flex items-center justify-center text-center">
          <div>
            <p className="text-4xl font-black text-sky-400">
              {occupancy || 0}%
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Em Rota
            </p>
          </div>
        </div>
        <svg className="absolute w-48 h-48 -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="84"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-sky-500 opacity-10"
          />
          <circle
            cx="96"
            cy="96"
            r="84"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="text-sky-500 transition-all duration-1000"
          />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">
            Disponíveis
          </p>
          <p className="text-xl font-bold text-emerald-400">{available || 0}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">
            Manutenção
          </p>
          <p className="text-xl font-bold text-amber-500">{maintenance || 0}</p>
        </div>
      </div>
    </section>
  );
};

const LiveStatCard = ({ title, value, icon, color, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-slate-800 border border-slate-700 p-6 rounded-3xl shadow-xl transition-all cursor-default group ${onClick ? "hover:scale-105 cursor-pointer hover:border-slate-600 active:scale-95" : ""}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="text-2xl opacity-80 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
    </div>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
      {title}
    </p>
    <h4 className={`text-4xl font-black mt-1 ${color}`}>{value}</h4>
  </div>
);

export default LiveMonitor;

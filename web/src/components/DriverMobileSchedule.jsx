import React, { useState, useEffect } from "react";

const DriverMobileSchedule = ({ user, onNotify }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      if (!user?.matricula) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/trips?matricula=${user.matricula}`,
        );
        if (!res.ok) throw new Error("Falha ao carregar escalas");
        const data = await res.json();
        setTrips(
          data.sort(
            (a, b) => new Date(a.departureTime) - new Date(b.departureTime),
          ),
        );
      } catch (err) {
        onNotify?.(err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [user, onNotify]);

  const handleComplete = async (tripId) => {
    if (!window.confirm("Deseja confirmar a finalização desta viagem?")) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/trips/${tripId}/arrival`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(new Date().toISOString()),
        },
      );
      if (!res.ok) throw new Error("Erro ao finalizar viagem");
      onNotify?.("Viagem finalizada com sucesso!");
      // Refresh trips
      const updatedTrips = trips.map((t) =>
        t.id === tripId ? { ...t, status: "FINISHED" } : t,
      );
      setTrips(updatedTrips);
    } catch (err) {
      onNotify?.(err.message, "error");
    }
  };

  const handleRevert = async (tripId) => {
    if (!window.confirm("Deseja desfazer a finalização desta viagem?")) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/trips/${tripId}/revert`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) throw new Error("Erro ao reverter viagem");
      onNotify?.("Viagem revertida para 'Em Progresso'");
      // Refresh trips
      const updatedTrips = trips.map((t) =>
        t.id === tripId ? { ...t, status: "IN_PROGRESS" } : t,
      );
      setTrips(updatedTrips);
    } catch (err) {
      onNotify?.(err.message, "error");
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500">
        Carregando sua escala...
      </div>
    );

  return (
    <div className="p-4 space-y-6 pb-20 overflow-x-hidden">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100 italic">
          Olá, {user.fullName.split(" ")[0]} 👋
        </h2>
        <p className="text-sm text-slate-400">
          Aqui está sua programação para hoje.
        </p>
      </header>

      <div className="space-y-4">
        {trips.length === 0 ? (
          <div className="bg-slate-800/50 border border-dashed border-slate-700 p-8 rounded-2xl text-center">
            <p className="text-slate-500">
              Nenhuma escala atribuída no momento.
            </p>
          </div>
        ) : (
          trips.map((trip) => (
            <div
              key={trip.id}
              className={`bg-slate-800 border-l-4 rounded-xl p-4 shadow-lg transition-transform active:scale-[0.98] ${
                trip.status === "FALTA"
                  ? "border-rose-500 bg-rose-500/5"
                  : trip.status === "IN_PROGRESS"
                    ? "border-sky-500 bg-sky-500/5"
                    : "border-slate-600"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xl font-black text-white font-mono">
                  {new Date(trip.departureTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                    trip.status === "IN_PROGRESS"
                      ? "bg-sky-500 text-white border-sky-400"
                      : trip.status === "FINISHED"
                        ? "bg-slate-700 text-slate-400 border-slate-600"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                  }`}
                >
                  {trip.status === "IN_PROGRESS" ? "Em Viagem" : trip.status}
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-200 mb-4">
                <div className="flex-1">
                  <p className="text-[8px] text-slate-500 font-bold uppercase">
                    Origem
                  </p>
                  <p className="font-bold text-sm truncate">
                    {trip.segment?.origin}
                  </p>
                </div>
                <span className="text-slate-600">→</span>
                <div className="flex-1 text-right">
                  <p className="text-[8px] text-slate-500 font-bold uppercase">
                    Destino
                  </p>
                  <p className="font-bold text-sm truncate">
                    {trip.segment?.destination}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-sky-400 font-mono font-bold">
                    SVC {trip.serviceCode || "N/A"}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold">
                    {trip.vehicle?.prefix || "Sem Veículo"}
                  </span>
                </div>
                {trip.isDobra && (
                  <span className="bg-amber-500 text-[10px] text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                    DOBRA
                  </span>
                )}
              </div>

              {trip.status === "IN_PROGRESS" && (
                <button
                  onClick={() => handleComplete(trip.id)}
                  className="w-full mt-4 bg-sky-500 hover:bg-sky-400 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
                >
                  Finalizar Viagem
                </button>
              )}

              {trip.status === "FINISHED" &&
                new Date() - new Date(trip.departureTime) <
                  24 * 60 * 60 * 1000 && (
                  <button
                    onClick={() => handleRevert(trip.id)}
                    className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-xl font-bold uppercase text-xs tracking-widest border border-slate-600 active:scale-95 transition-all"
                  >
                    Reverter Finalização
                  </button>
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DriverMobileSchedule;

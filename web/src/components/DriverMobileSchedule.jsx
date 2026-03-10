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
            </div>
          ))
        )}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-slate-700 p-4 flex justify-around items-center">
        <div className="flex flex-col items-center gap-1 opacity-50 grayscale">
          <span className="text-xl">🏠</span>
          <span className="text-[8px] font-bold uppercase">Início</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-sky-400">
          <span className="text-xl">📅</span>
          <span className="text-[8px] font-bold uppercase">Escalas</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50 grayscale">
          <span className="text-xl">👤</span>
          <span className="text-[8px] font-bold uppercase">Perfil</span>
        </div>
      </footer>
    </div>
  );
};

export default DriverMobileSchedule;

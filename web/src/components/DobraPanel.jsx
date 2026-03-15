import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const DobraPanel = ({ onNotify }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reports/dobras`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      onNotify?.("Erro ao carregar relatório de dobras", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-32 bg-slate-800 rounded-2xl border border-slate-700"></div>
        <div className="h-64 bg-slate-800 rounded-2xl border border-slate-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border-l-4 border-rose-500 p-6 rounded-2xl shadow-lg">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Motoristas em Dobra</p>
          <h4 className="text-4xl font-black text-rose-400 mt-2">{report?.driversWithViolations || 0}</h4>
          <p className="text-xs text-slate-400 mt-1">Excederam o limite de 6 dias</p>
        </div>
        <div className="bg-slate-800 border-l-4 border-sky-500 p-6 rounded-2xl shadow-lg">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total na Frota</p>
          <h4 className="text-4xl font-black text-sky-400 mt-2">{report?.totalDrivers || 0}</h4>
          <p className="text-xs text-slate-400 mt-1">Motoristas ativos</p>
        </div>
        <div className="bg-slate-800 border-l-4 border-amber-500 p-6 rounded-2xl shadow-lg">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Índice de Alerta</p>
          <h4 className="text-4xl font-black text-amber-400 mt-2">
            {report?.totalDrivers ? Math.round((report.driversWithViolations / report.totalDrivers) * 100) : 0}%
          </h4>
          <p className="text-xs text-slate-400 mt-1">Proporção de irregularidades</p>
        </div>
      </div>

      {/* Driver List */}
      <div className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
            <span className="text-rose-500">🚩</span> Detalhamento de Irregularidades
          </h3>
          <button 
            onClick={fetchReport}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-2 rounded-xl transition-all font-bold border border-slate-700"
          >
            Atualizar Relatório
          </button>
        </div>

        <div className="divide-y divide-slate-700/50">
          {report?.driversInDobra.length > 0 ? (
            report.driversInDobra.map((driver) => (
              <div key={driver.driverId} className="p-6 hover:bg-slate-700/20 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 text-xl font-black">
                      {driver.consecutiveDays}
                    </div>
                    <div>
                      <h5 className="text-lg font-bold text-slate-200 group-hover:text-rose-400 transition-colors uppercase">
                        {driver.driverName}
                      </h5>
                      <p className="text-xs text-slate-500 font-mono">MATRÍCULA: {driver.matricula}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                      DOBRA DETECTADA
                    </span>
                    <p className="text-xs text-slate-500 mt-2 italic">Ciclo contínuo de {driver.consecutiveDays} dias</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
                  {driver.recentTrips.map((trip) => (
                    <div 
                      key={trip.tripId} 
                      className={`p-3 rounded-xl border text-[10px] flex flex-col justify-between h-20 shadow-inner ${
                        trip.isDobra 
                        ? "bg-rose-500/5 border-rose-500/30 text-rose-200" 
                        : "bg-slate-900/50 border-slate-700 text-slate-400 opacity-60"
                      }`}
                    >
                      <span className="font-black uppercase truncate">{trip.route}</span>
                      <div className="flex justify-between items-center mt-2 font-mono">
                        <span>{new Date(trip.departureTime).toLocaleDateString("pt-BR", {day:'2-digit', month:'2-digit'})}</span>
                        {trip.isDobra && <span className="animate-pulse">🚫</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-slate-500">
              <span className="text-5xl block mb-4">✅</span>
              <p className="font-bold">Nenhuma dobra detectada no sistema.</p>
              <p className="text-xs mt-1">Todos os motoristas estão dentro do limite de 6 dias.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DobraPanel;

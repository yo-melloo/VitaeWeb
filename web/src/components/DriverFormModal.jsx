import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

const DriverFormModal = ({ driver, onClose, onSave, onNotify }) => {
  const [name, setName] = useState(driver ? driver.name : "");
  const [matricula, setMatricula] = useState(driver ? driver.matricula : "");
  const [baseId, setBaseId] = useState(driver?.base?.id || "");
  const [status, setStatus] = useState(driver ? driver.status : "AVAILABLE");
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBases = async () => {
      try {
        const res = await fetch(`${API}/api/bases`);
        if (res.ok) {
          const data = await res.json();
          setBases(data);
        }
      } catch (err) {
        console.error("Erro ao carregar bases", err);
      }
    };
    fetchBases();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      matricula,
      base: baseId ? { id: parseInt(baseId) } : null,
      status: status,
      saldoDias: driver ? driver.saldoDias : 0,
    };

    try {
      const url = driver
        ? `${API}/api/drivers/${driver.id}`
        : `${API}/api/drivers`;
      const method = driver ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Erro ao salvar motorista");
      }

      onNotify?.(`Motorista ${driver ? "atualizado" : "criado"} com sucesso!`);
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
              {driver ? "Editar Motorista" : "Novo Motorista"}
            </h3>
            <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-black">
              Informações do Cadastro
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition-all uppercase"
                placeholder="Ex: CARLOS ALBERTO"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                  Matrícula (4 Dígitos)
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  value={matricula}
                  onChange={(e) =>
                    setMatricula(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-mono tracking-widest focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  placeholder="0000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                  Base <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={baseId}
                  onChange={(e) => setBaseId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {bases.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                Status Atual do Motorista
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold"
              >
                <option value="DISPONIVEL">DISPONÍVEL</option>
                <option value="ESCALADO">EM VIAGEM</option>
                <option value="FOLGA">FOLGA</option>
                <option value="ATESTADO">ATESTADO</option>
                <option value="AFASTADO">AFASTADO</option>
                <option value="FALTA">FALTA</option>
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
                className={`flex-1 px-6 py-3 bg-sky-500 text-white font-bold uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition-all ${
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

export default DriverFormModal;

import React, { useState } from "react";

const ProfileSettingsModal = ({ user, onClose, onUpdate, onNotify }) => {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName) {
      setError("O nome não pode estar vazio.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/users/${user.id}/profile-name`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName }),
        },
      );

      if (!response.ok) {
        throw new Error("Falha ao atualizar perfil.");
      }

      const updatedUser = await response.json();
      onUpdate(updatedUser);
      onNotify?.("Perfil atualizado com sucesso!");
      onClose();
    } catch (err) {
      setError(err.message);
      onNotify?.(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-6 border-b border-slate-700 bg-gradient-to-r from-emerald-500/10 to-transparent">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 text-left">
            <span>⚙️</span> Configurações de Perfil
          </h3>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold text-left">
            Informações do Usuário
          </p>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-left block">
              Matrícula (Não alterável)
            </label>
            <input
              type="text"
              disabled
              value={user.matricula}
              className="w-full bg-slate-900/30 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-left block">
              Nome Completo
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
              placeholder="Ex: João da Silva"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-left block">
              Perfil / Cargo
            </label>
            <div className="w-full bg-slate-900/30 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold uppercase tracking-tight">
                {user.role}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;

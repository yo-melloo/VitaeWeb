import React, { useState } from "react";

const UserFormModal = ({ user, onCancel, onSave, onNotify }) => {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    matricula: user?.matricula || "",
    password: "", // Only set if changing/creating
    profile: user?.profile || "VIEWER",
    status: user?.status || (user ? "APPROVED" : "PENDING"),
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.fullName ||
      !formData.matricula ||
      (!user && !formData.password)
    ) {
      onNotify?.("Preencha todos os campos obrigatórios", "warning");
      return;
    }

    setSaving(true);
    try {
      const url = user
        ? `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/users/${user.id}`
        : `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/users`;

      const res = await fetch(url, {
        method: user ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Erro ao salvar usuário");

      onNotify?.(`Usuário ${user ? "atualizado" : "criado"} com sucesso!`);
      onSave();
    } catch (err) {
      onNotify?.(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        <h3 className="text-xl font-bold text-slate-100 mb-6">
          {user ? "Editar Usuário" : "Novo Usuário"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
              placeholder="Ex: João da Silva"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">
              Matrícula / Username *
            </label>
            <input
              type="text"
              value={formData.matricula}
              onChange={(e) =>
                setFormData({ ...formData, matricula: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono"
              placeholder="identificador único"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">
              Senha {user && "(deixe em branco para manter)"}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">
                Perfil de Acesso
              </label>
              <select
                value={formData.profile}
                onChange={(e) =>
                  setFormData({ ...formData, profile: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="OPERATOR">OPERADOR</option>
                <option value="VIEWER">VISUALIZADOR</option>
                <option value="DRIVER">MOTORISTA</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
              >
                <option value="PENDING" className="text-rose-400">
                  PENDENTE
                </option>
                <option value="APPROVED" className="text-emerald-400">
                  APROVADO
                </option>
                <option value="REJECTED" className="text-slate-500">
                  REJEITADO
                </option>
                <option value="BLOCKED" className="text-rose-600">
                  BLOQUEADO
                </option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-slate-700 transition-all border border-transparent hover:border-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-sky-500 hover:bg-sky-400 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;

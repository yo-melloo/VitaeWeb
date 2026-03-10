import React, { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const ServiceSegments = ({ serviceId, onNotify }) => {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    estimatedDurationMinutes: "",
    sequence: "",
  });
  const [editingId, setEditingId] = useState(null);

  const fetchSegments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/segments/service/${serviceId}`);
      if (!res.ok) throw new Error("Falha ao carregar trechos");
      const data = await res.json();
      setSegments(data);
    } catch (err) {
      onNotify?.(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [serviceId, onNotify]);

  useEffect(() => {
    if (serviceId) fetchSegments();
  }, [fetchSegments, serviceId]);

  const handleEditClick = (segment) => {
    setEditingId(segment.id);
    setForm({
      origin: segment.origin,
      destination: segment.destination,
      estimatedDurationMinutes: segment.estimatedDurationMinutes || "",
      sequence: segment.sequence || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      origin: "",
      destination: "",
      estimatedDurationMinutes: "",
      sequence: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        origin: form.origin,
        destination: form.destination,
        estimatedDurationMinutes: form.estimatedDurationMinutes
          ? Number(form.estimatedDurationMinutes)
          : null,
        sequence: form.sequence ? Number(form.sequence) : null,
      };

      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `${API}/api/segments/${editingId}`
        : `${API}/api/segments/service/${serviceId}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar trecho");

      onNotify?.(
        editingId
          ? "Trecho atualizado com sucesso!"
          : "Trecho adicionado com sucesso!",
      );
      handleCancelEdit();
      fetchSegments();
    } catch (err) {
      onNotify?.(err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja deletar este trecho?")) return;
    try {
      const res = await fetch(`${API}/api/segments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao deletar trecho");
      onNotify?.("Trecho deletado!");
      fetchSegments();
    } catch (err) {
      onNotify?.(err.message, "error");
    }
  };

  return (
    <div className="mt-8 border-t border-slate-700 pt-6">
      <h4 className="text-lg font-bold text-slate-100 mb-4 flex items-center justify-between">
        Trechos do Serviço
        <span className="text-xs font-normal text-slate-400">
          Total: {segments.length}
        </span>
      </h4>

      {loading ? (
        <p className="text-slate-500 text-sm italic">Carregando trechos...</p>
      ) : (
        <div className="space-y-4">
          {segments.length > 0 ? (
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-500 uppercase text-[10px] tracking-widest">
                    <th className="py-2 px-3">Seq</th>
                    <th className="py-2 px-3">Origem</th>
                    <th className="py-2 px-3">Destino</th>
                    <th className="py-2 px-3 text-center">Duração (Min)</th>
                    <th className="py-2 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {segments.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-3 text-slate-400 font-mono text-xs">
                        {s.sequence || "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-200 font-medium">
                        {s.origin}
                      </td>
                      <td className="py-2 px-3 text-slate-200 font-medium">
                        {s.destination}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-400">
                        {s.estimatedDurationMinutes || "-"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleEditClick(s)}
                          className="text-sky-500 hover:text-sky-400 uppercase text-[10px] font-black mr-3 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-rose-500 hover:text-rose-400 uppercase text-[10px] font-black transition-colors"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">
              Nenhum trecho cadastrado.
            </p>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl mt-4 space-y-3"
          >
            <h5 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">
              {editingId ? "Editando Trecho" : "Novo Trecho"}
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1">
                  Origem *
                </label>
                <input
                  required
                  type="text"
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1">
                  Destino *
                </label>
                <input
                  required
                  type="text"
                  value={form.destination}
                  onChange={(e) =>
                    setForm({ ...form, destination: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1">
                  Duração Lícita (Min)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.estimatedDurationMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estimatedDurationMinutes: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1">
                  Ordem (Sequência)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.sequence}
                  onChange={(e) =>
                    setForm({ ...form, sequence: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-xs font-bold text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md transition-colors"
              >
                {editingId ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ServiceSegments;

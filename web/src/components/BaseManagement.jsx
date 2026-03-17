import React, { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const BaseManagement = ({ onNotify, onEditUser }) => {
  const [bases, setBases] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBase, setEditingBase] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [manager, setManager] = useState("");
  const [type, setType] = useState("OPERACIONAL");
  const [parentBaseId, setParentBaseId] = useState("");

  const [managingSegmentsFor, setManagingSegmentsFor] = useState(null);
  const [managingUsersFor, setManagingUsersFor] = useState(null);
  const [allSegments, setAllSegments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [segServices, setSegServices] = useState([]);

  const fetchBases = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/bases`);
      if (res.ok) {
        const data = await res.json();
        setBases(sortBasesHierarchically(data));
      }
    } catch (err) {
      onNotify?.("Erro ao carregar bases", "error");
    }
  }, [onNotify]);

  const sortBasesHierarchically = useCallback((basesList) => {
    const result = [];
    const map = new Map();
    basesList.forEach((b) => map.set(b.id, { ...b, children: [] }));

    const roots = [];
    map.forEach((b) => {
      if (b.parentBaseId && map.has(b.parentBaseId)) {
        map.get(b.parentBaseId).children.push(b);
      } else {
        roots.push(b);
      }
    });

    const flatten = (nodes) => {
      nodes
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((node) => {
          result.push(node);
          if (node.children.length > 0) {
            flatten(node.children);
          }
        });
    };

    flatten(roots);
    return result;
  }, []);

  useEffect(() => {
    fetchBases();
  }, [fetchBases]);

  useEffect(() => {
    if (editingBase) {
      setName(editingBase.name);
      setManager(editingBase.manager || "");
      setType(editingBase.type || "OPERACIONAL");
      setParentBaseId(editingBase.parentBaseId || "");
    } else {
      setName("");
      setManager("");
      setType("OPERACIONAL");
      setParentBaseId("");
    }
  }, [editingBase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      manager,
      type,
      parentBaseId: parentBaseId ? parseInt(parentBaseId) : null,
    };

    try {
      const url = editingBase
        ? `${API}/api/bases/${editingBase.id}`
        : `${API}/api/bases`;
      const method = editingBase ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar base");

      onNotify?.(`Base ${editingBase ? "atualizada" : "criada"} com sucesso!`);
      setShowForm(false);
      setEditingBase(null);
      fetchBases();
    } catch (err) {
      onNotify?.(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta base?")) return;

    try {
      const res = await fetch(`${API}/api/bases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir base");
      onNotify?.("Base removida com sucesso!");
      fetchBases();
    } catch (err) {
      onNotify?.(err.message, "error");
    }
  };

  const openSegmentManager = async (base) => {
    setManagingSegmentsFor(base);
    try {
      const segRes = await fetch(`${API}/api/segments`);
      const svcRes = await fetch(`${API}/api/services`);
      if (segRes.ok && svcRes.ok) {
        setAllSegments(await segRes.json());
        setSegServices(await svcRes.json());
      }
    } catch (err) {
      onNotify?.("Erro ao carregar trechos", "error");
    }
  };

  const handleToggleSegment = async (segment, baseId) => {
    try {
      const isRemoving = segment.base?.id === baseId;
      const payload = {
        ...segment,
        base: isRemoving ? null : { id: baseId },
      };

      const res = await fetch(`${API}/api/segments/${segment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao atualizar trecho");

      const updated = await res.json();
      setAllSegments((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
    } catch (err) {
      onNotify?.(err.message, "error");
    }
  };

  const openUserManager = async (base) => {
    setManagingUsersFor(base);
    try {
      const res = await fetch(`${API}/api/users`);
      if (res.ok) setAllUsers(await res.json());
    } catch (err) {
      onNotify?.("Erro ao carregar usuários", "error");
    }
  };

  const handleToggleUserBase = async (user, baseId) => {
    try {
      const isRemoving = user.base?.id === baseId;
      const payload = {
        ...user,
        base: isRemoving ? null : { id: baseId },
      };

      const res = await fetch(`${API}/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao atualizar usuário");

      const updated = await res.json();
      setAllUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u)),
      );
      // We don't need to fetchBases() here if we update the local state correctly
      // but fetchBases() ensures we have the latest user-base links from the DB
      fetchBases();
    } catch (err) {
      onNotify?.(err.message, "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">
            Gerenciamento de Bases
          </h2>
          <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs font-semibold">
            Configuração de Unidades e Teclados
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBase(null);
            setShowForm(true);
          }}
          className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <span>+</span> Nova Base
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bases.map((base) => (
          <div
            key={base.id}
            className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl hover:border-sky-500/50 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  base.type === "OPERACIONAL"
                    ? "bg-sky-500/20 text-sky-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {base.type === "OPERACIONAL" ? "Operacional" : "Ponto de Apoio"}
              </div>
              <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openSegmentManager(base)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                  title="Gerenciar Trechos"
                >
                  🛤️
                </button>
                <button
                  onClick={() => openUserManager(base)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                  title="Gerenciar Usuários"
                >
                  👥
                </button>
                <button
                  onClick={() => {
                    setEditingBase(base);
                    setShowForm(true);
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                >
                  🖊️
                </button>
                <button
                  onClick={() => handleDelete(base.id)}
                  className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-100 mb-1">
              {base.name}
            </h3>
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-tighter">
                  Gerente:
                </span>
                <span className="text-slate-200">
                  {base.manager || "Não definido"}
                </span>
              </div>
              {base.parentBaseId && (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-tighter">
                    Superior:
                  </span>
                  <span className="text-slate-200">
                    {bases.find((b) => b.id === base.parentBaseId)?.name ||
                      `#${base.parentBaseId}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-400 text-xs pt-2 border-t border-slate-700/50 mt-2">
                <span className="font-bold text-slate-500 uppercase tracking-tighter">
                  Equipe:
                </span>
                <span className="text-slate-300">
                  {base.users?.length > 0 || base.drivers?.length > 0
                    ? (() => {
                        const counts = base.users?.reduce((acc, u) => {
                          const role = u.profile || u.role;
                          acc[role] = (acc[role] || 0) + 1;
                          return acc;
                        }, {}) || {};
                        
                        const labels = [];
                        if (counts.ADMIN) labels.push(`${counts.ADMIN} admin${counts.ADMIN > 1 ? "s" : ""}`);
                        if (counts.OPERATOR) labels.push(`${counts.OPERATOR} op.`);
                        if (base.drivers?.length > 0) labels.push(`${base.drivers.length} mot.`);
                        if (counts.VIEWER) labels.push(`${counts.VIEWER} view`);
                        
                        return labels.join(", ") || "Equipe configurada";
                      })()
                    : "Sem integrantes"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <header className="mb-6">
                <h3 className="text-2xl font-bold text-slate-100">
                  {editingBase ? "Editar Base" : "Nova Base"}
                </h3>
              </header>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                    Nome da Base
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition-all uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                    Gerente Responsável
                  </label>
                  <input
                    type="text"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                      Tipo de Unidade
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    >
                      <option value="OPERACIONAL">OPERACIONAL</option>
                      <option value="PONTO_DE_APOIO">PONTO DE APOIO</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                      Base Superior (Opcional)
                    </label>
                    <select
                      value={parentBaseId}
                      onChange={(e) => setParentBaseId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    >
                      <option value="">Nenhuma</option>
                      {bases
                        .filter((b) => !editingBase || b.id !== editingBase.id)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3 border border-slate-700 text-slate-400 font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-slate-700/50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-sky-500 text-white font-bold uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-400 active:scale-95"
                  >
                    {loading ? "Salvando..." : "Confirmar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {managingSegmentsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <header className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  Gerenciar Trechos: {managingSegmentsFor.name}
                </h3>
                <p className="text-[10px] text-slate-500 uppercase font-black">
                  Atribua os trechos de cada serviço a esta base
                </p>
              </div>
              <button
                onClick={() => setManagingSegmentsFor(null)}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {segServices.map((service) => {
                const serviceSegments = allSegments.filter(
                  (s) => Number(s.serviceId) === Number(service.id),
                );
                if (serviceSegments.length === 0) return null;

                return (
                  <div key={service.id} className="space-y-3">
                    <h4 className="text-xs font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      Serviço {service.id} - {service.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {serviceSegments.map((segment) => {
                        const isThisBase =
                          segment.base?.id === managingSegmentsFor.id;
                        const isOtherBase =
                          segment.base &&
                          segment.base.id !== managingSegmentsFor.id;

                        return (
                          <div
                            key={segment.id}
                            onClick={() =>
                              !isOtherBase &&
                              handleToggleSegment(
                                segment,
                                managingSegmentsFor.id,
                              )
                            }
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                              isThisBase
                                ? "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/20"
                                : isOtherBase
                                  ? "bg-slate-900 border-slate-700 opacity-50 cursor-not-allowed"
                                  : "bg-slate-900 border-slate-700 hover:border-slate-500"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-200 truncate">
                                {segment.origin} → {segment.destination}
                              </p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase">
                                {isOtherBase
                                  ? `Base: ${segment.base.name}`
                                  : isThisBase
                                    ? "Atribuído a esta base"
                                    : "Disponível"}
                              </p>
                            </div>
                            {isThisBase && (
                              <span className="text-emerald-400 text-lg">
                                ✓
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {managingUsersFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <header className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  Gerenciar Equipe: {managingUsersFor.name}
                </h3>
                <p className="text-[10px] text-slate-500 uppercase font-black">
                  Vincule operadores e gestores a esta base
                </p>
              </div>
              <button
                onClick={() => setManagingUsersFor(null)}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allUsers
                  .filter((u) => u.status !== "PENDING")
                  .map((user) => {
                    const isThisBase = user.base?.id === managingUsersFor.id;
                    const isOtherBase =
                      user.base && user.base.id !== managingUsersFor.id;

                    return (
                      <div
                        key={user.id}
                        onClick={() =>
                          handleToggleUserBase(user, managingUsersFor.id)
                        }
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                          isThisBase
                            ? "bg-sky-500/10 border-sky-500/50 ring-1 ring-sky-500/20"
                            : "bg-slate-900 border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-200 truncate">
                            {user.fullName}
                          </p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">
                            {user.profile}
                            {isOtherBase && ` (Deste base: ${user.base.name})`}
                            {!user.base && " (Sem base)"}
                          </p>
                        </div>
                        {isThisBase && (
                          <span className="text-sky-400 text-lg">✓</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseManagement;

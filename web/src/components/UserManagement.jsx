import React, { useState, useEffect, useCallback } from "react";
import UserFormModal from "./UserFormModal";

const UserManagement = ({
  onNotify,
  initialEditingUser,
  onCloseEdit,
  currentUser,
  setUser,
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all" or "pending"

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/users`,
      );
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      const data = await res.json();
      const sorted = data.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setUsers(sorted);
    } catch (err) {
      onNotify?.(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (initialEditingUser) {
      console.log(
        "UserManagement: initialEditingUser received",
        initialEditingUser,
      );
      setEditingUser(initialEditingUser);
      setShowModal(true);
    }
  }, [initialEditingUser]);

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir este usuário?")) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/users/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Erro ao excluir usuário");
      onNotify?.("Usuário excluído com sucesso!");
      fetchUsers();
    } catch (err) {
      onNotify?.(err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-2 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">
            Controle de Acessos
          </h2>
          <div className="flex gap-6 mt-4 border-b border-slate-700/50">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "all" ? "text-sky-400 border-b-2 border-sky-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              Usuários Ativos
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`pb-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === "pending" ? "text-sky-400 border-b-2 border-sky-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              Solicitações
              {users.filter((u) => u.status === "PENDING").length > 0 && (
                <span className="absolute -top-1 -right-4 w-4 h-4 bg-rose-500 text-white text-[8px] rounded-full flex items-center justify-center animate-pulse">
                  {users.filter((u) => u.status === "PENDING").length}
                </span>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-sky-500/20 transition-all active:scale-95"
        >
          + Novo Usuário
        </button>
      </header>

      <section className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm">Carregando usuários...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                  <th className="py-4 pl-6">Nome Completo</th>
                  <th className="py-4 px-4">Matrícula</th>
                  <th className="py-4 px-4">Base</th>
                  <th className="py-4 px-4">Perfil</th>
                  <th className="py-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users
                  .filter((u) =>
                    activeTab === "pending"
                      ? u.status === "PENDING"
                      : u.status !== "PENDING",
                  )
                  .map((user) => (
                    <tr
                      key={user.id}
                      className="group hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-4 pl-6 pr-4">
                        <p className="font-bold text-slate-200">
                          {user.fullName}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-mono text-xs">
                        @{user.matricula}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs text-slate-300 font-medium">
                          {user.base?.name || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase border ${
                              user.profile === "ADMIN"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : user.profile === "OPERATOR"
                                  ? "bg-sky-500/10 text-sky-500 border-sky-500/20"
                                  : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            }`}
                          >
                            {user.profile === "ADMIN"
                              ? "ADMIN"
                              : user.profile === "OPERATOR"
                                ? "OPERADOR"
                                : user.profile === "DRIVER"
                                  ? "MOTORISTA"
                                  : "VISUALIZADOR"}
                          </span>
                          {user.status && user.status !== "APPROVED" && (
                            <span
                              className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border animate-pulse ${
                                user.status === "PENDING"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                              }`}
                            >
                              {user.status === "PENDING"
                                ? "Pendente"
                                : user.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-6">
                        <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {activeTab === "pending" ? (
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowModal(true);
                              }}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight border border-emerald-500/20"
                            >
                              ✅ Analisar
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowModal(true);
                              }}
                              className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight border border-sky-500/20"
                            >
                              Editar
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 px-3 py-1 rounded text-xs font-bold transition-colors"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <UserFormModal
          user={editingUser}
          onNotify={onNotify}
          onSave={(updatedUser) => {
            setShowModal(false);
            setEditingUser(null);
            onCloseEdit?.();
            fetchUsers();

            // If the updated user is the one currently logged in, update the global session
            if (
              currentUser &&
              updatedUser &&
              currentUser.id === updatedUser.id
            ) {
              console.log(
                "Updating current user session with new data:",
                updatedUser,
              );
              setUser({
                ...updatedUser,
                role: updatedUser.profile || "VIEWER",
              });
            }
          }}
          onCancel={() => {
            setShowModal(false);
            setEditingUser(null);
            onCloseEdit?.();
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;

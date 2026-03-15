import React, { useState, useEffect, useCallback } from "react";
import UserManagement from "./components/UserManagement";
import TripForm from "./components/TripForm";
import DriverScheduleView from "./components/DriverScheduleView";
import DriverManagement from "./components/DriverManagement";
import VehicleManagement from "./components/VehicleManagement";
import ServiceManagement from "./components/ServiceManagement";
import ScheduleManagement from "./components/ScheduleManagement";
import LiveMonitor from "./components/LiveMonitor";
import CancellationModal from "./components/CancellationModal";
import RouteMapModal from "./components/RouteMapModal";
import ChangePasswordModal from "./components/ChangePasswordModal";
import ProfileSettingsModal from "./components/ProfileSettingsModal";
import Notification from "./components/Notification";
import Login from "./components/Login";
import DriverMobileSchedule from "./components/DriverMobileSchedule";
import BaseManagement from "./components/BaseManagement";
import ServiceSequence from "./components/ServiceSequence";
import DobraPanel from "./components/DobraPanel";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

// Returns "Bom dia", "Boa tarde" or "Boa noite" based on current hour
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
};

// --- NOVOS COMPONENTES DE UX ---

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-700/50 rounded ${className}`}></div>
);

const LoadingSpinner = ({ size = "sm", className = "" }) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };
  return (
    <div
      className={`border-2 border-slate-400/20 border-t-sky-400 rounded-full animate-spin ${sizeClasses[size] || sizeClasses.sm} ${className}`}
    ></div>
  );
};

// Returns the first name of a full name string
const getFirstName = (fullName = "") => fullName.split(" ")[0] ?? fullName;

const Sidebar = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onChangePassword,
  onOpenSettings,
  isOpen,
  onClose,
}) => {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const isAdmin = user.role === "ADMIN";
  const isOperator = user.role === "OPERATOR" || isAdmin;
  const isDriver = user.role === "DRIVER";

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
            Vitae Web
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
            {isDriver ? "Portal do Motorista" : "Sistema de Escalas"}
            {isDriver && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </p>

          {/* System Clock in Sidebar */}
          <div className="mt-4 py-2 border-y border-slate-700/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
              Data & Hora
            </p>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-xs font-bold">
                {new Date()
                  .toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })
                  .replace(".", "")}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-xs font-mono font-black text-sky-400">
                {new Date().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem
            icon="📊"
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => handleNavClick("dashboard")}
          />

          {isOperator && (
            <NavItem
              icon="👤"
              label="Motoristas"
              active={activeTab === "drivers"}
              onClick={() => handleNavClick("drivers")}
            />
          )}

          {isOperator && (
            <div className="space-y-1">
              <NavItem
                icon="🛣️"
                label="Rotas"
                active={activeTab === "routes" || activeTab === "sequence"}
                onClick={() => handleNavClick("routes")}
              />
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  activeTab === "routes" || activeTab === "sequence"
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="ml-9 border-l border-slate-700/50 pl-4 space-y-1 py-1">
                    <NavItem
                      label="Gerenciar"
                      small
                      active={activeTab === "routes"}
                      onClick={() => handleNavClick("routes")}
                    />
                    <NavItem
                      label="Sequência"
                      small
                      active={activeTab === "sequence"}
                      onClick={() => handleNavClick("sequence")}
                      badge="BETA"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isOperator && (
            <NavItem
              icon="🏠"
              label="Bases"
              active={activeTab === "bases"}
              onClick={() => handleNavClick("bases")}
            />
          )}

          {isOperator && (
            <NavItem
              icon="🚌"
              label="Frota"
              active={activeTab === "fleet"}
              onClick={() => handleNavClick("fleet")}
            />
          )}

          <div className="space-y-1">
            <NavItem
              icon="📅"
              label={isDriver ? "Minhas Escalas" : "Escalas"}
              active={
                activeTab === "trips" ||
                activeTab === "reports" ||
                activeTab === "new-trip"
              }
              onClick={() => handleNavClick(isDriver ? "reports" : "trips")}
            />
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                activeTab === "trips" ||
                activeTab === "reports" ||
                activeTab === "new-trip"
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
            >
              <div className="overflow-hidden">
                <div className="ml-9 border-l border-slate-700/50 pl-4 space-y-1 py-1">
                    <NavItem
                      label="Visão Geral"
                      small
                      active={activeTab === "trips"}
                      onClick={() => handleNavClick("trips")}
                    />
                    <NavItem
                      label="Dobras"
                      small
                      active={activeTab === "dobras"}
                      onClick={() => handleNavClick("dobras")}
                      badge="NOVO"
                    />
                  <NavItem
                    label="Relatórios"
                    small
                    active={activeTab === "reports"}
                    onClick={() => handleNavClick("reports")}
                  />
                  {isOperator && (
                    <NavItem
                      label="Nova Escala"
                      small
                      active={activeTab === "new-trip"}
                      onClick={() => handleNavClick("new-trip")}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  Administração
                </p>
              </div>
              <NavItem
                icon="🔐"
                label="Perfis"
                active={activeTab === "profiles"}
                onClick={() => handleNavClick("profiles")}
              />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700 relative">
          <div
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
              {user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user.fullName}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-black">
                {user.role === "ADMIN"
                  ? "Administrador"
                  : user.role === "OPERATOR"
                    ? "Operador"
                    : user.role === "DRIVER"
                      ? "Motorista"
                      : "Visualizador"}
              </p>
            </div>
            <span
              className={`text-slate-500 text-xs transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
            >
              ▲
            </span>
          </div>

          {profileOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-150">
              {/* Profile Header */}
              <div className="p-4 bg-gradient-to-br from-sky-500/10 to-transparent border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center font-black text-white text-sm flex-shrink-0 shadow-lg">
                    {user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Matrícula:{" "}
                      <span className="font-mono font-bold text-sky-400">
                        {user.matricula || "—"}
                      </span>
                    </p>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        user.role === "ADMIN"
                          ? "bg-purple-500/20 text-purple-300"
                          : user.role === "OPERATOR"
                            ? "bg-sky-500/20 text-sky-300"
                            : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {user.role === "ADMIN"
                        ? "ADMINISTRADOR"
                        : user.role === "OPERATOR"
                          ? "OPERADOR"
                          : user.role === "DRIVER"
                            ? "MOTORISTA"
                            : "VISUALIZADOR"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2 space-y-0.5">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onChangePassword();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-all text-sm text-left"
                >
                  <span>🔑</span>
                  <span className="font-medium">Alterar Senha</span>
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-all text-sm text-left"
                >
                  <span>⚙️</span>
                  <span className="font-medium">Configurações</span>
                </button>
              </div>

              <div className="p-2 border-t border-slate-700">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all text-sm text-left font-bold"
                >
                  <span>🚪</span>
                  <span>Sair do Sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const NavItem = ({
  icon,
  label,
  active = false,
  onClick,
  small = false,
  badge,
}) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 ${small ? "py-2" : "py-3"} rounded-xl transition-all cursor-pointer border ${
      active
        ? "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-sm"
        : "text-slate-400 border-transparent hover:bg-slate-700/50 hover:text-slate-200"
    }`}
  >
    {icon && <span className="text-lg">{icon}</span>}
    <span className={`font-medium ${small ? "text-[11px]" : "text-sm"}`}>
      {label}
    </span>
    {badge && (
      <span className="ml-auto text-[8px] font-black bg-sky-500/20 text-sky-400 px-1 rounded border border-sky-500/30">
        {badge}
      </span>
    )}
  </div>
);

const Dashboard = ({
  onNewTrip,
  isOperator,
  user,
  onNavigate,
  onSelectDriver,
  onNotify,
}) => {
  const [mapData, setMapData] = useState({
    isOpen: false,
    origin: "",
    destination: "",
  });
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // ID da trip sendo editada
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  // clock moved to parent or side effect not needed if we re-render APP

  const notify = onNotify;
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    segment: null,
  });

  useEffect(() => {
    const mapTripFromApi = (trip) => ({
      id: trip.id,
      // Normalize serviceId to string so grouping works correctly
      serviceCode: trip.serviceId != null ? String(trip.serviceId) : null,
      route: trip.segment
        ? `${trip.segment.origin} x ${trip.segment.destination}`
        : "",
      driver: trip.driver
        ? { id: trip.driver.id, name: trip.driver.name }
        : null,
      segment: trip.segment
        ? {
            id: trip.segment.id,
            origin: trip.segment.origin,
            destination: trip.segment.destination,
            base: trip.segment.base,
          }
        : {},
      departureTime: trip.departureTime,
      vehicle: trip.vehicle || null,
      status: trip.status,
      isImpacted: trip.isImpacted,
      hasRestViolation: trip.hasRestViolation,
      violationMessage: trip.violationMessage,
      isDobra: trip.isDobra,
      updatedBy: trip.updatedBy,
      updatedAt: trip.updatedAt,
    });

    const fetchTrips = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/trips`);
        if (!res.ok) {
          throw new Error("Erro ao carregar viagens");
        }
        const data = await res.json();
        const mapped = data.map(mapTripFromApi);
        const sorted = mapped.sort(
          (a, b) => new Date(a.departureTime) - new Date(b.departureTime),
        );

        // Filter for "Próximas Saídas": Today + Not yet finished/past
        const now = new Date();
        const endOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
        );
        const filtered = sorted.filter((t) => {
          const dep = new Date(t.departureTime);
          return (
            dep.toLocaleDateString() === now.toLocaleDateString() && // Simplified check for "today"
            dep >= now &&
            t.status !== "FINISHED" &&
            t.status !== "CANCELLED"
          );
        });

        setTrips(filtered);
      } catch (err) {
        console.error("Error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();

    // Polling: Atualiza os dados a cada 30 segundos para manter os cards vivos
    const interval = setInterval(fetchTrips, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = (trip) => {
    setSelectedTrip(trip);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancellation = ({ type, passe }) => {
    let affectedTrips = [];
    if (type === "FULL") {
      affectedTrips = trips.filter(
        (t) =>
          t.serviceCode === selectedTrip.serviceCode && t.status !== "PASSE",
      );
    } else {
      affectedTrips = [selectedTrip];
    }
    const affectedIds = affectedTrips.map((t) => t.id);

    setTrips((prev) => {
      let nextTrips = prev.map((t) => {
        if (affectedIds.includes(t.id)) {
          return { ...t, status: "CANCELLED" };
        }
        return t;
      });

      if (passe) {
        const passes = affectedTrips.map((t) => ({
          id: Math.random() + 10,
          originalTripId: t.id,
          serviceCode: t.serviceCode,
          route: t.route,
          driver: t.driver,
          segment: {
            origin: t.segment.origin,
            destination: "BASE / REMANEJAM.",
          },
          departureTime: new Date().toISOString(),
          vehicle: t.vehicle,
          status: "PASSE",
        }));
        nextTrips = [...nextTrips, ...passes];
      }
      return nextTrips;
    });

    setIsCancelModalOpen(false);
    notify(`Cancelamento ${type === "FULL" ? "Total" : "Parcial"} confirmado!`);
  };

  const handleUndoCancel = (tripId) => {
    const tripToUndo = trips.find((t) => t.id === tripId);
    if (!tripToUndo) return;

    // Remove exactly the passes linked to this trip
    setTrips((prev) => {
      const restored = prev.map((t) =>
        t.id === tripId ? { ...t, status: "SCHEDULED" } : t,
      );

      // We remove the passe trip that was created for THIS specific trip segment
      return restored.filter((t) => t.originalTripId !== tripId);
    });
    notify("Cancelamento revertido e escala restaurada!");
  };

  const handleReportError = async (segmentId) => {
    if (!segmentId) return;
    const msg = window.prompt("Descreva o erro encontrado no trecho:");
    if (!msg) return;

    try {
      const res = await fetch(`${API}/api/segments/${segmentId}/error`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          reportedBy: user?.fullName || user?.matricula || "Desconhecido",
        }),
      });
      if (!res.ok) throw new Error("Erro ao reportar problema");
      notify("Erro reportado com sucesso. A base responsável será notificada.");
      fetchTrips();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleDelay = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/api/trips/${id}/delay`, {
        method: "POST",
      });
      if (res.ok) {
        const updated = await res.json();
        // Preserving local mapped fields if any
        setTrips(trips.map((t) => (t.id === id ? { ...t, ...updated } : t)));
        notify("Atraso reportado com sucesso!");
      }
    } catch (err) {
      notify("Erro ao reportar atraso", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearDelay = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/api/trips/${id}/delay/clear`, {
        method: "POST",
      });
      if (res.ok) {
        const updated = await res.json();
        setTrips(trips.map((t) => (t.id === id ? { ...t, ...updated } : t)));
        notify("Atraso revertido!");
      }
    } catch (err) {
      notify("Erro ao reverter atraso", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">
            {getGreeting()}, {getFirstName(user?.fullName)}! 👋
          </h2>
          <p className="text-slate-400 mt-1">
            Bem-vindo ao painel de controle da Vitae.
          </p>
        </div>
        {isOperator && (
          <button
            onClick={() => onNavigate?.("reports")}
            className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-sky-500/20 transition-all active:scale-95 cursor-pointer flex gap-2 items-center"
          >
            <span>📈</span> Visão Geral
          </button>
        )}
      </header>

      <LiveMonitor onNavigate={onNavigate} isOperator={isOperator} />

      <PassePanorama trips={trips} />

      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <h3
          onClick={() => isOperator && onNavigate?.("trips")}
          className="text-xl font-bold mb-6 text-slate-200 cursor-pointer hover:text-sky-400 transition-colors flex items-center gap-2 group"
          title="Ver Painel de Escalas"
        >
          Próximas Saídas
          <span className="text-slate-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            ↗
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
                <th className="pb-4 font-semibold w-8"></th>
                <th className="pb-4 font-semibold">Motorista</th>
                <th className="pb-4 font-semibold">Trecho</th>
                <th className="pb-4 font-semibold">Serviço/Rota</th>
                <th className="pb-4 font-semibold">Horário</th>
                <th className="pb-4 font-semibold">Veículo</th>
                <th className="pb-4 font-semibold">Status</th>
                <th className="pb-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                // Skeleton Rows
                [...Array(5)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-5 pl-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="py-5 pr-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-5 px-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="py-5 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-5 px-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-5 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-5 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-5 pl-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : trips.length > 0 ? (
                trips.map((trip) => (
                  <TableRow
                    key={trip.id}
                    trip={trip}
                    isActionLoading={actionLoading === trip.id}
                    serviceTrips={trips.filter(
                      (t) =>
                        t.serviceCode != null &&
                        t.serviceCode === trip.serviceCode &&
                        t.status !== "PASSE",
                    )}
                    onCancel={() => handleCancel(trip)}
                    onUndoCancel={() => handleUndoCancel(trip.id)}
                    onDelay={() => handleDelay(trip.id)}
                    onClearDelay={() => handleClearDelay(trip.id)}
                    isOperator={isOperator}
                    onDriverClick={isOperator ? onSelectDriver : null}
                    onNavigate={onNavigate}
                    onOpenMap={(org, dst) =>
                      setMapData({
                        isOpen: true,
                        origin: org,
                        destination: dst,
                      })
                    }
                    user={user}
                    onReportError={() => handleReportError(trip.segment?.id)}
                    onShowErrorDetails={(seg) =>
                      setErrorModal({ isOpen: true, segment: seg })
                    }
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-600">
                      <span className="text-4xl mb-3">🛣️</span>
                      <p className="text-sm font-medium">
                        Nenhuma saída programada para o restante do dia.
                      </p>
                      <p className="text-[10px] uppercase font-black tracking-widest mt-1 opacity-50 text-slate-500">
                        Operação em dia
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedTrip && (
        <CancellationModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          trip={selectedTrip}
          relatedTrips={trips.filter(
            (t) =>
              t.serviceCode === selectedTrip.serviceCode &&
              t.status !== "PASSE",
          )}
          onConfirm={handleConfirmCancellation}
        />
      )}

      <RouteMapModal
        isOpen={mapData.isOpen}
        onClose={() => setMapData({ ...mapData, isOpen: false })}
        origin={mapData.origin}
        destination={mapData.destination}
      />
      {errorModal.isOpen && (
        <ErrorDetailModal
          segment={errorModal.segment}
          onClose={() => setErrorModal({ isOpen: false, segment: null })}
        />
      )}
    </div>
  );
};

const ErrorDetailModal = ({ segment, onClose }) => {
  if (!segment) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-rose-500/10 p-6 flex items-center gap-4 border-b border-rose-500/20">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-2xl shadow-inner">
            🚩
          </div>
          <div>
            <h3 className="text-lg font-black text-rose-400 uppercase tracking-tighter">
              Problema Identificado
            </h3>
            <p className="text-xs text-rose-300/60 font-medium">
              Relatado no trecho {segment.origin} → {segment.destination}
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
              Descrição do Erro
            </label>
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-slate-200 text-sm leading-relaxed italic">
              "{segment.errorMessage}"
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                Reportado Por
              </label>
              <p className="text-slate-300 font-bold px-1">
                {segment.errorReportedBy || "Desconhecido"}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                Data do Reporte
              </label>
              <p className="text-slate-400 text-xs px-1">
                {segment.errorReportedAt
                  ? new Date(segment.errorReportedAt).toLocaleString("pt-BR")
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/30 p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all active:scale-95"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return window.localStorage.getItem("vitae:app:activeTab") || "dashboard";
    } catch {
      return "dashboard";
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(() => {
    try {
      const stored = window.localStorage.getItem("vitae:app:selectedDriverId");
      return stored ? Number(stored) : null;
    } catch {
      return null;
    }
  });
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem("vitae:user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [editingUser, setEditingUser] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [notification, setNotification] = useState(null);

  const notify = useCallback((message, type = "success") => {
    setNotification({ message, type });
  }, []);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem("vitae:user", JSON.stringify(user));
    } else {
      window.localStorage.removeItem("vitae:user");
    }
  }, [user]);

  useEffect(() => {
    try {
      window.localStorage.setItem("vitae:app:activeTab", activeTab);
      if (selectedDriverId) {
        window.localStorage.setItem(
          "vitae:app:selectedDriverId",
          selectedDriverId,
        );
      } else {
        window.localStorage.removeItem("vitae:app:selectedDriverId");
      }
    } catch {}
  }, [activeTab, selectedDriverId]);

  // Refresh user session data from server to ensure latest base/role info
  useEffect(() => {
    const refreshUser = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API}/api/users/${user.id}`);
        if (res.ok) {
          const latestUser = await res.json();
          // Only update if something changed (to avoid infinite loops or unnecessary renders)
          if (
            JSON.stringify(latestUser.base) !== JSON.stringify(user.base) ||
            latestUser.profile !== user.profile
          ) {
            console.log("Session refreshed with latest data from server");
            setUser({
              ...latestUser,
              role: latestUser.profile || "VIEWER",
            });
          }
        }
      } catch (err) {
        console.warn("Failed to refresh user session:", err);
      }
    };

    // Refresh once on mount if user is logged in
    refreshUser();
  }, []);

  if (!user) {
    return (
      <>
        <Login
          onLogin={(loggedInUser) => {
            setUser(loggedInUser);
            setTimeout(() => {
              notify(
                "⚠️ SISTEMA EM FASE BETA (v1.0.4): Algumas funcionalidades de automação estão em fase de testes e podem sofrer alterações sem aviso prévio.",
                "warning",
              );
            }, 1000);
          }}
          onNotify={notify}
        />
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </>
    );
  }

  const isOperator =
    user.role === "OPERATOR" ||
    user.role === "ADMIN" ||
    user.profile === "OPERATOR" ||
    user.profile === "ADMIN";

  const handleNavigate = (tab) => setActiveTab(tab);

  const handleSelectDriver = (driverId) => {
    setSelectedDriverId(driverId);
    setActiveTab("reports");
  };

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== "reports") setSelectedDriverId(null);
        }}
        user={user}
        onLogout={() => {
          setUser(null);
          setActiveTab("dashboard");
          window.localStorage.removeItem("vitae:schedule:filters");
        }}
        onChangePassword={() => setPasswordModalOpen(true)}
        onOpenSettings={() => setProfileModalOpen(true)}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-y-auto w-full relative h-full flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-slate-800 p-4 border-b border-slate-700 w-full mb-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-200 hover:text-sky-400 p-2 -ml-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-bold text-slate-100 flex items-center gap-2">
            Vitae Web <span className="text-sky-400">❖</span>
          </span>
        </div>

        <div className="p-4 md:p-8 pt-0 md:pt-8 w-full flex-1">
          {activeTab === "dashboard" && (
            <Dashboard
              onNewTrip={() => setActiveTab("new-trip")}
              isOperator={isOperator}
              user={user}
              onNavigate={handleNavigate}
              onSelectDriver={handleSelectDriver}
              onNotify={notify}
            />
          )}
          {activeTab === "new-trip" && isOperator && (
            <div className="max-w-4xl mx-auto">
              <TripForm
                onCancel={() => setActiveTab("dashboard")}
                onSave={() => setActiveTab("dashboard")}
                onNotify={notify}
              />
            </div>
          )}
          {activeTab === "profiles" && isOperator && (
            <UserManagement
              onNotify={notify}
              currentUser={user}
              setUser={setUser}
              initialEditingUser={editingUser}
              onCloseEdit={() => setEditingUser(null)}
            />
          )}
          {activeTab === "reports" &&
            (user.role === "DRIVER" && isMobile ? (
              <DriverMobileSchedule user={user} onNotify={notify} />
            ) : (
              <DriverScheduleView
                isDriver={user.role === "DRIVER"}
                user={user}
                initialDriverId={selectedDriverId}
                onNotify={notify}
              />
            ))}
          {activeTab === "drivers" && isOperator && (
            <DriverManagement
              onNotify={notify}
              onSelectDriver={handleSelectDriver}
            />
          )}
          {activeTab === "fleet" && isOperator && (
            <VehicleManagement onNotify={notify} />
          )}
          {activeTab === "routes" && isOperator && (
            <ServiceManagement onNotify={notify} user={user} />
          )}
          {activeTab === "bases" && isOperator && (
            <BaseManagement
              onNotify={notify}
              onEditUser={(u) => {
                setEditingUser(u);
                setActiveTab("profiles");
              }}
            />
          )}
          {activeTab === "trips" && (
            <ScheduleManagement
              isOperator={isOperator}
              user={user}
              onNotify={notify}
              onSelectDriver={handleSelectDriver}
            />
          )}
          {activeTab === "sequence" && isOperator && (
            <ServiceSequence onNotify={notify} />
          )}
          {activeTab === "dobras" && isOperator && (
            <DobraPanel onNotify={notify} />
          )}
        </div>
      </main>

      {passwordModalOpen && (
        <ChangePasswordModal
          user={user}
          onClose={() => setPasswordModalOpen(false)}
          onNotify={notify}
        />
      )}

      {profileModalOpen && (
        <ProfileSettingsModal
          user={user}
          onClose={() => setProfileModalOpen(false)}
          onNotify={notify}
          onUpdate={(updatedUser) => {
            setUser({ ...user, ...updatedUser, role: updatedUser.profile });
          }}
        />
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={useCallback(() => setNotification(null), [])}
        />
      )}
    </div>
  );
};

const StatsCard = ({ title, value, trend, danger = false }) => (
  <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg hover:border-slate-600 transition-all cursor-default group">
    <p className="text-slate-400 text-sm font-medium group-hover:text-slate-300 transition-colors uppercase tracking-wide">
      {title}
    </p>
    <div className="flex items-end justify-between mt-2">
      <h4 className="text-3xl font-bold text-slate-100">{value}</h4>
      <span
        className={`text-xs font-bold px-2 py-1 rounded-full ${
          danger
            ? "bg-rose-500/10 text-rose-400"
            : "bg-emerald-500/10 text-emerald-400"
        }`}
      >
        {trend}
      </span>
    </div>
  </div>
);

const PassePanorama = ({ trips }) => {
  const passeTrips = trips.filter((t) => t.status === "PASSE");

  if (passeTrips.length === 0) return null;

  return (
    <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-200">
            Panorama do Passe
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Monitoramento de Deslocamentos Operacionais
          </p>
        </div>
        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-black">
          {passeTrips.length} ATIVOS
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {passeTrips.map((passe) => (
          <div
            key={passe.id}
            className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-sky-400 font-bold text-sm">
                {passe.driver.name}
              </span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-black uppercase">
                Prefixo: {passe.vehicle.prefix}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs mb-3">
              <span className="text-slate-300 font-medium">
                {passe.segment.origin}
              </span>
              <span className="text-slate-600">→</span>
              <span className="text-slate-300 font-medium">
                {passe.segment.destination}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 italic">
                Destino Final: BASE
              </span>
              <span className="text-indigo-400 font-black text-[9px] uppercase tracking-tighter">
                Deadheading
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const TableRow = ({
  trip,
  serviceTrips = [],
  onCancel,
  onUndoCancel,
  onDelay,
  onClearDelay,
  isOperator,
  onOpenMap,
  onDriverClick,
  onNavigate,
  user,
  onReportError,
  onShowErrorDetails,
  isActionLoading = false,
  // props usados pelas linhas mock (quando não há `trip`)
  driver,
  route,
  time,
  vehicle,
  status: statusProp,
  statusColor: statusColorProp,
  isImpacted,
}) => {
  const canEditTrip = (t) => {
    if (!t) return true;
    if (user?.role === "ADMIN" || user?.profile === "ADMIN") return true;

    const segmentBase = t.segment?.base;
    if (!segmentBase) return true;

    const userBaseId = user?.base?.id;
    const tripBaseId = segmentBase.id;
    const parentBaseId = segmentBase.parentBaseId;

    return userBaseId == tripBaseId || userBaseId == parentBaseId;
  };

  const canEdit = canEditTrip(trip);

  const [isExpanded, setIsExpanded] = useState(false);
  const baseStatus = trip?.status || statusProp || "SCHEDULED";

  const computedStatusColor =
    baseStatus === "DELAYED"
      ? "text-rose-400"
      : baseStatus === "CANCELLED"
        ? "text-slate-500"
        : baseStatus === "PASSE"
          ? "text-indigo-400"
          : "text-emerald-400";

  const statusColor = statusColorProp || computedStatusColor;

  const status = baseStatus;

  const isCancelled = status === "CANCELLED";
  const isDelayed = status === "DELAYED" || status === "Atrasado";
  const isPasse = status === "PASSE";

  return (
    <>
      <tr
        onClick={() => {
          if (!isOperator || isCancelled) return;
          onNavigate?.("trips");
        }}
        className={`group transition-all cursor-pointer ${isCancelled ? "opacity-30 grayscale cursor-not-allowed" : "hover:bg-slate-700/30"}`}
      >
        <td className="py-4 pl-4 border-none w-8 text-center pt-5">
          {!isPasse && serviceTrips.length > 1 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-slate-500 hover:text-sky-400 w-6 h-6 inline-flex items-center justify-center rounded transition-colors hover:bg-slate-800"
              title="Ver rota completa"
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          ) : (
            <span className="text-slate-700 opacity-20 text-[8px]">•</span>
          )}
        </td>
        <td className="py-4 pr-4 border-none">
          <p className="font-semibold text-slate-200 flex items-center gap-2 pt-1">
            {status === "FALTA" ? (
              <span className="text-rose-500 font-black tracking-widest uppercase text-xs">
                —
              </span>
            ) : trip?.driver ? (
              <span
                onClick={() => onDriverClick?.(trip.driver.id)}
                className={`${
                  onDriverClick
                    ? "cursor-pointer hover:text-sky-400 transition-colors"
                    : ""
                }`}
                title={onDriverClick ? "Ver escala deste motorista" : undefined}
              >
                {trip.driver.name}
              </span>
            ) : (
              <span className="opacity-50 italic">{driver || "—"}</span>
            )}
            {(trip?.isImpacted || isImpacted) &&
              !isDelayed &&
              status !== "FALTA" && (
                <span
                  className="text-amber-500 animate-bounce"
                  title="Próxima viagem impactada"
                >
                  ⚠️
                </span>
              )}
            {trip?.hasRestViolation && (
              <span
                className="text-rose-500 animate-pulse cursor-help"
                title={trip.violationMessage || "Violação de Descanso (11h)"}
              >
                🚫
              </span>
            )}
            {trip?.isDobra && (
              <span
                className="bg-amber-500/20 text-amber-500 px-1 rounded text-[8px] font-black uppercase tracking-tighter border border-amber-500/30"
                title="Dobra: Ciclo de trabalho excedeu 6 dias"
              >
                DOBRA
              </span>
            )}
          </p>
        </td>
        <td className="py-4 px-4 text-slate-300 border-none group/trecho">
          {isPasse ? (
            <span className="flex items-center gap-1">
              <span className="bg-indigo-500/20 text-indigo-400 px-1.5 rounded text-[10px] font-black italic">
                PASSE
              </span>
              {trip?.segment?.hasError && (
                <span
                  className="text-xs animate-bounce cursor-help"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowErrorDetails?.(trip.segment);
                  }}
                  title="Erro reportado"
                >
                  🚩
                </span>
              )}
              {trip.segment?.origin} → {trip.segment?.destination}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 ${trip?.segment?.hasError ? "cursor-help text-rose-400" : ""}`}
                onClick={(e) => {
                  if (trip?.segment?.hasError) {
                    e.stopPropagation();
                    onShowErrorDetails?.(trip.segment);
                  }
                }}
              >
                {trip?.segment?.hasError && (
                  <span
                    className="text-xs animate-bounce"
                    title="Erro reportado"
                  >
                    🚩
                  </span>
                )}
                <span className="group-hover/trecho:text-slate-100 transition-colors">
                  {trip?.segment?.origin ||
                    route?.split(" → ")[0] ||
                    route?.split(" x ")[0]}{" "}
                  →{" "}
                  {trip?.segment?.destination ||
                    route?.split(" → ")[1] ||
                    route?.split(" x ")[1]}
                </span>
              </div>
              {trip?.segment?.origin &&
                trip?.segment?.destination &&
                onOpenMap && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMap(trip.segment.origin, trip.segment.destination);
                    }}
                    className="opacity-0 group-hover/trecho:opacity-100 p-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded transition-all text-xs"
                    title="Visualizar Rota no Mapa"
                  >
                    📍
                  </button>
                )}
            </div>
          )}
        </td>
        <td className="py-4 px-4 border-none">
          {trip?.serviceCode ? (
            <div className="flex flex-col">
              <span
                className="text-slate-300 font-bold text-sm leading-tight hover:text-sky-400 cursor-default"
                title={trip.route}
              >
                SVC {trip.serviceCode}
              </span>
              <span
                className="text-slate-500 text-[9px] uppercase font-bold tracking-widest truncate max-w-[120px]"
                title={trip.route}
              >
                {trip.routeName || trip.route}
              </span>
            </div>
          ) : (
            <span className="text-slate-500 text-xs italic">
              {route || "N/A"}
            </span>
          )}
        </td>
        <td className="py-4 px-4 font-mono text-sky-400 border-none">
          {trip?.departureTime
            ? new Date(trip.departureTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : time}
        </td>
        <td className="py-4 px-4 text-slate-400 border-none">
          <span className="bg-slate-700/50 px-2 py-1 rounded text-xs font-mono border border-slate-600/50">
            {trip?.vehicle?.prefix || trip?.vehicle?.plate || vehicle || "---"}
          </span>
        </td>
        <td className="py-4 px-4 border-none">
          <span
            className={`flex items-center gap-2 font-medium ${statusColor}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full bg-current ${isCancelled ? "" : "animate-pulse"}`}
            ></span>
            {isPasse ? "Em Passe" : isCancelled ? "Cancelado" : status}
          </span>
        </td>
        <td className="py-4 pl-4 text-right border-none">
          {isOperator && (
            <>
              {canEdit ? (
                <>
                  {!isCancelled ? (
                    <div className="flex gap-2 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      {onDelay && !trip?.isImpacted && !isDelayed && (
                        <button
                          disabled={isActionLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelay();
                          }}
                          className={`p-2 rounded-lg transition-all ${isActionLoading ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white shadow-sm"}`}
                          title="Reportar Atraso"
                        >
                          {isActionLoading ? <LoadingSpinner size="xs" /> : "⏱️"}
                        </button>
                      )}
                      {onClearDelay && isDelayed && (
                        <button
                          disabled={isActionLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            onClearDelay();
                          }}
                          className={`p-2 rounded-lg transition-all ${isActionLoading ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white shadow-sm"}`}
                          title="Reverter Atraso / Confirmar Saída"
                        >
                          {isActionLoading ? <LoadingSpinner size="xs" /> : "✅"}
                        </button>
                      )}
                      {onCancel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancel();
                          }}
                          className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-all text-xs font-bold uppercase tracking-tighter"
                          title="Cancelar Serviço"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      {onUndoCancel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUndoCancel();
                          }}
                          className="p-2 hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-400 transition-all text-xs font-bold uppercase tracking-tighter"
                          title="Desfazer Cancelamento"
                        >
                          ↩️ Reverter
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReportError?.();
                    }}
                    className="px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    title="Reportar erro no trecho para a base responsável"
                  >
                    ⚠️ Reportar Erro
                  </button>
                </div>
              )}
            </>
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-slate-900/40">
          <td
            colSpan="8"
            className="p-5 border-l-4 border-sky-500 rounded-br-2xl shadow-inner"
          >
            <div className="flex items-center gap-2 mb-4 px-2">
              <span className="text-xl">🗺️</span>
              <h4 className="text-sm font-bold text-slate-300">
                Escala Completa da Rota{" "}
                <span className="text-sky-400 italic">"{trip.route}"</span>
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-1.5 px-2">
              {serviceTrips.map((st) => {
                const isCurrent = st.id === trip.id;
                const isStCancelled = st.status === "CANCELLED";
                return (
                  <div
                    key={st.id}
                    className={`flex items-center p-3 rounded-xl border ${isCurrent ? "bg-slate-800 border-sky-500/40 shadow-lg shadow-sky-500/5 ring-1 ring-sky-500/20 z-10" : "bg-slate-900/50 border-slate-800/80"} ${isStCancelled ? "opacity-40 grayscale" : ""} text-xs transition-colors hover:bg-slate-800/80 group/subrow`}
                  >
                    <div className="w-1/4 font-medium flex items-center gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${isCurrent ? "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]" : "bg-slate-700"}`}
                      ></div>
                      <span
                        className={
                          isCurrent ? "text-sky-100" : "text-slate-300"
                        }
                      >
                        {st.segment?.origin}{" "}
                        <span className="text-slate-600 mx-1">→</span>{" "}
                        {st.segment?.destination}
                      </span>
                      <button
                        onClick={() =>
                          onOpenMap(st.segment.origin, st.segment.destination)
                        }
                        className="opacity-0 group-hover/subrow:opacity-100 p-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded transition-all text-xs"
                        title="Visualizar Rota no Mapa"
                      >
                        📍
                      </button>
                    </div>

                    <div className="w-1/4 flex flex-col justify-center border-l border-slate-700/50 pl-4">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                        Motorista
                      </span>
                      <span
                        className={`font-bold ${isCurrent ? "text-sky-400" : "text-slate-200"}`}
                      >
                        {st.driver?.name}
                      </span>
                    </div>
                    <div className="w-1/4 font-mono text-slate-400 flex items-center gap-2 border-l border-slate-700/50 pl-4">
                      <span className="text-slate-600">🕒</span>
                      {new Date(st.departureTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="w-1/4 text-right border-l border-slate-700/50 pl-4">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border inline-block ${isStCancelled ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}
                      >
                        {st.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default App;

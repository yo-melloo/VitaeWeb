import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const TripForm = ({ onCancel, onSave, onNotify, initialData = null }) => {
  const [formData, setFormData] = useState({
    driverId: initialData?.driver?.id || "",
    serviceId: initialData?.serviceId || "",
    segmentId: initialData?.segment?.id || "",
    departureDate: initialData?.departureTime
      ? initialData.departureTime.split("T")[0]
      : "",
    departureTime: initialData?.departureTime
      ? initialData.departureTime.split("T")[1].substring(0, 5)
      : "",
    vehicleId: initialData?.vehicle?.id || "",
    status: initialData?.status || "SCHEDULED",
  });

  const [drivers, setDrivers] = useState([]);
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [segments, setSegments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingSegments, setLoadingSegments] = useState(false);

  // Fetch drivers and services on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [driversRes, servicesRes, vehiclesRes] = await Promise.all([
          fetch(`${API}/api/drivers`),
          fetch(`${API}/api/services`),
          fetch(`${API}/api/vehicles`),
        ]);
        if (!driversRes.ok || !servicesRes.ok || !vehiclesRes.ok)
          throw new Error("Falha ao carregar dados");
        const [driversData, servicesData, vehiclesData] = await Promise.all([
          driversRes.json(),
          servicesRes.json(),
          vehiclesRes.json(),
        ]);
        setDrivers(driversData);
        setServices(servicesData);
        setVehicles(vehiclesData);
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
        onNotify?.("Erro ao carregar dados iniciais", "error");
      }
    };
    fetchInitialData();
  }, [onNotify]);

  // Fetch segments when service changes
  useEffect(() => {
    if (!formData.serviceId) {
      setSegments([]);
      // Only clear if it's not pre-populated by initialData that lacks serviceId but has segmentId
      if (!initialData || formData.segmentId !== initialData.segment?.id) {
        setFormData((prev) => ({ ...prev, segmentId: "" }));
      }
      return;
    }
    const fetchSegments = async () => {
      setLoadingSegments(true);
      try {
        const res = await fetch(
          `${API}/api/segments/service/${formData.serviceId}`,
        );
        if (!res.ok) throw new Error("Falha ao carregar trechos");
        const data = await res.json();
        setSegments(data);

        // Se estamos editando e o serviço selecionado é o mesmo da escala original, vinculamos o trecho
        if (
          initialData &&
          String(formData.serviceId) === String(initialData.serviceId) &&
          initialData.segment?.id
        ) {
          setFormData((prev) => ({
            ...prev,
            segmentId: initialData.segment.id,
          }));
        }
      } catch (err) {
        console.error("Erro ao carregar trechos:", err);
        onNotify?.("Erro ao carregar trechos", "error");
      } finally {
        setLoadingSegments(false);
      }
    };
    fetchSegments();
  }, [formData.serviceId, initialData, onNotify]);

  // Validate rules whenever form changes
  useEffect(() => {
    validateRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, drivers]);

  const validateRules = () => {
    const newAlerts = [];
    if (
      !formData.driverId ||
      !formData.departureDate ||
      !formData.departureTime
    ) {
      setAlerts([]);
      return;
    }

    const driver = drivers.find(
      (d) => String(d.id) === String(formData.driverId),
    );
    if (!driver) return;

    const departure = new Date(
      `${formData.departureDate}T${formData.departureTime}`,
    );

    // 1. Dobra check (saldo > 7 dias)
    if (driver.saldoDias != null && driver.saldoDias > 7) {
      newAlerts.push({
        type: "warning",
        title: "⚠️ Alerta de DOBRA",
        message: `${driver.name} possui ${driver.saldoDias} dias de saldo. Esta viagem será calculada como Hora Extra 100%.`,
      });
    }

    // 2. Inter-jornada (11h) — usar lastArrival se disponível
    if (driver.lastArrival) {
      const lastArrival = new Date(driver.lastArrival);
      const diffHours = (departure - lastArrival) / (1000 * 60 * 60);
      if (diffHours < 11) {
        newAlerts.push({
          type: "danger",
          title: "⛔ Quebra de Descanso (11h)",
          message: `${driver.name} chegou às ${lastArrival.toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            },
          )} e precisa de 11h de descanso. Faltam ${Math.max(0, 11 - diffHours).toFixed(1)} horas.`,
        });
      }
    }

    setAlerts(newAlerts);
  };

  const handleSave = async () => {
    if (
      !formData.driverId ||
      !formData.segmentId ||
      !formData.departureDate ||
      !formData.departureTime
    ) {
      onNotify?.(
        "Por favor, preencha todos os campos obrigatórios.",
        "warning",
      );
      return;
    }
    setSaving(true);
    try {
      const departureTime = `${formData.departureDate}T${formData.departureTime}:00`;
      const payload = {
        driverId: Number(formData.driverId),
        segmentId: Number(formData.segmentId),
        serviceId: formData.serviceId ? Number(formData.serviceId) : null,
        vehicleId: formData.vehicleId ? Number(formData.vehicleId) : null,
        status: formData.status,
        departureTime,
      };

      const method = initialData ? "PUT" : "POST";
      const url = initialData
        ? `${API}/api/trips/${initialData.id}`
        : `${API}/api/trips`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Erro ao salvar escala");
      }
      onSave?.();
    } catch (err) {
      console.error(err);
      onNotify?.("Erro ao salvar escala: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedDriver = drivers.find(
    (d) => String(d.id) === String(formData.driverId),
  );
  const selectedService = services.find(
    (s) => String(s.id) === String(formData.serviceId),
  );
  const hasBlockingAlert = alerts.some((a) => a.type === "danger");

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl max-w-2xl mx-auto animate-in fade-in zoom-in duration-300">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📅</span>
        <div>
          <h3 className="text-2xl font-bold text-slate-100">
            {initialData ? "Editar Escala" : "Nova Escala de Viagem"}
          </h3>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
            Atribuição manual de motorista
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Driver */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2 font-mono uppercase tracking-tighter">
            Motorista *
          </label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
            value={formData.driverId}
            onChange={(e) =>
              setFormData({ ...formData, driverId: e.target.value })
            }
          >
            <option value="">Selecione o motorista...</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.matricula ? ` — Mat. ${d.matricula}` : ""}
                {d.saldoDias != null ? ` (Saldo: ${d.saldoDias}d)` : ""}
              </option>
            ))}
          </select>
          {selectedDriver && (
            <p className="mt-1 text-xs text-slate-500">
              Base:{" "}
              <span className="text-slate-300 font-medium">
                {selectedDriver.base?.name || "—"}
              </span>
              {" · "}Status:{" "}
              <span className="text-sky-400 font-medium">
                {selectedDriver.status || "—"}
              </span>
            </p>
          )}
        </div>

        {/* Service + Segment */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 font-mono uppercase tracking-tighter">
              Serviço *
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
              value={formData.serviceId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  serviceId: e.target.value,
                  segmentId: "",
                })
              }
            >
              <option value="">Selecione...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                  {s.name ? ` — ${s.name}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 font-mono uppercase tracking-tighter">
              Trecho *
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none disabled:opacity-40"
              value={formData.segmentId}
              onChange={(e) =>
                setFormData({ ...formData, segmentId: e.target.value })
              }
              disabled={!formData.serviceId || loadingSegments}
            >
              <option value="">
                {loadingSegments
                  ? "Carregando..."
                  : formData.serviceId
                    ? "Selecione o trecho..."
                    : "Selecione o serviço primeiro"}
              </option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.origin} → {s.destination}
                  {s.durationMinutes
                    ? ` (~${Math.round(s.durationMinutes / 60)}h)`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 font-mono uppercase tracking-tighter">
              Data de Saída *
            </label>
            <input
              type="date"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
              value={formData.departureDate}
              onChange={(e) =>
                setFormData({ ...formData, departureDate: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 font-mono uppercase tracking-tighter">
              Horário *
            </label>
            <input
              type="time"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
              value={formData.departureTime}
              onChange={(e) =>
                setFormData({ ...formData, departureTime: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 font-mono uppercase tracking-tighter">
              Veículo
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
              value={formData.vehicleId}
              onChange={(e) =>
                setFormData({ ...formData, vehicleId: e.target.value })
              }
            >
              <option value="">Selecione a frota...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.prefix || "S/P"} - {v.plate}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 font-mono uppercase tracking-tighter">
              Status da Escala *
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="SCHEDULED">Agendada</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="DELAYED">Atrasada</option>
              <option value="FINISHED">Finalizada</option>
              <option value="CANCELLED">Cancelada</option>
              <option value="FALTA">Falta N/Jus</option>
              <option value="PASSE">Em Passe</option>
            </select>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3 pt-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  alert.type === "warning"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}
              >
                <p className="font-bold text-sm tracking-tight">
                  {alert.title}
                </p>
                <p className="text-xs mt-1 opacity-80">{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Summary preview */}
        {formData.driverId && formData.segmentId && formData.departureDate && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50 text-xs text-slate-400 space-y-3">
              <div>
                <p className="font-black uppercase tracking-widest text-slate-500 mb-2 flex justify-between">
                  <span>Resumo da Sequência</span>
                  <span className="text-sky-500">
                    Trecho{" "}
                    {segments.find(
                      (s) => String(s.id) === String(formData.segmentId),
                    )?.sequence || 1}
                  </span>
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">
                      Origem
                    </p>
                    <p className="text-slate-200 font-bold">
                      {
                        segments.find(
                          (s) => String(s.id) === String(formData.segmentId),
                        )?.origin
                      }
                    </p>
                  </div>
                  <div className="text-slate-600">→</div>
                  <div className="flex-1 text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">
                      Previsão Próxima Parada
                    </p>
                    <p className="text-sky-400 font-bold">
                      {
                        segments.find(
                          (s) => String(s.id) === String(formData.segmentId),
                        )?.destination
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/50">
                <p className="text-slate-500">
                  Serviço:{" "}
                  <span className="text-sky-400 font-mono font-bold">
                    {selectedService?.code || "AVULSO"}
                  </span>
                  {" · "}
                  Partida:{" "}
                  <span className="text-slate-200 font-mono font-bold">
                    {formData.departureDate} às {formData.departureTime}
                  </span>
                </p>
              </div>
            </div>

            {selectedDriver && (
              <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/50 text-[10px] text-slate-500 space-y-1">
                <p className="font-black uppercase tracking-widest mb-1">
                  Resumo de Disponibilidade
                </p>
                <p>
                  Última Chegada:{" "}
                  <span className="text-slate-300">
                    {selectedDriver.lastArrival
                      ? formatDateTime(selectedDriver.lastArrival)
                      : "Nenhuma registrada"}
                  </span>
                </p>
                <p>
                  Status Atual:{" "}
                  <span className="text-emerald-400 font-black uppercase">
                    {selectedDriver.status || "DISPONÍVEL"}
                  </span>
                </p>
                {selectedDriver.saldoDias > 0 && (
                  <p>
                    Saldo de Dias:{" "}
                    <span className="text-amber-500 font-bold">
                      {selectedDriver.saldoDias} dias
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-xl font-semibold border border-slate-700 text-slate-400 hover:bg-slate-700 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={
              hasBlockingAlert ||
              saving ||
              !formData.driverId ||
              !formData.segmentId ||
              !formData.departureDate ||
              !formData.departureTime
            }
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
              hasBlockingAlert ||
              saving ||
              !formData.driverId ||
              !formData.segmentId
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20"
            }`}
          >
            {saving ? "Salvando..." : "Salvar Escala"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripForm;

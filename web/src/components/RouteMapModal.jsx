import React from "react";

const RouteMapModal = ({ isOpen, onClose, origin, destination }) => {
  if (!isOpen || !origin || !destination) return null;

  const saddr = encodeURIComponent(origin);
  const daddr = encodeURIComponent(destination);
  const mapUrl = `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&output=embed`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 text-xl font-black border border-sky-500/30">
              🗺️
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Visão de Rota Geográfica
              </h3>
              <p className="text-slate-400 text-sm font-medium mt-0.5">
                <span className="text-sky-400 font-bold uppercase">
                  {origin}
                </span>
                <span className="mx-2 text-slate-500">→</span>
                <span className="text-emerald-400 font-bold uppercase">
                  {destination}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all font-black text-xs"
          >
            ✕
          </button>
        </div>

        <div className="p-0 bg-[#ebebeb] relative grow h-[60vh] overflow-hidden">
          <iframe
            title="Route Map"
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full scale-[1.02] filter invert-[95%] hue-rotate-180 contrast-[1.05] grayscale-[20%]"
          ></iframe>
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(15,23,42,0.8)] z-10 block"></div>
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-slate-800/80 flex justify-between items-center">
          <p className="text-[10px] text-slate-500 italic uppercase font-bold tracking-widest pl-2">
            * O itinerário reflete rotas rodoviárias do Google Maps.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 text-xs uppercase"
          >
            Fechar Mapa
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteMapModal;

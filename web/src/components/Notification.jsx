import React, { useEffect } from "react";

const Notification = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    warning: "bg-amber-500",
    info: "bg-sky-500",
  }[type];

  const icon = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  }[type];

  return (
    <div
      className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold animate-in slide-in-from-right-8 fade-in duration-300 ${bgColor}`}
    >
      <span className="text-xl">{icon}</span>
      <p className="text-sm">{message}</p>
      <button
        onClick={onClose}
        className="ml-4 hover:scale-110 transition-transform opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
};

export default Notification;

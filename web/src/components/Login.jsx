import React, { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

const Login = ({ onLogin, onNotify }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        if (!matricula || !password) {
          setError("Preencha a matrícula e a senha.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matricula, password }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Matrícula ou senha incorretos.");
          }
          throw new Error("Erro ao realizar login.");
        }

        const user = await response.json();

        if (user.status === "PENDING") {
          throw new Error(
            "Sua solicitação de acesso ainda está pendente de aprovação.",
          );
        }
        if (user.status === "REJECTED" || user.status === "BLOCKED") {
          throw new Error(
            "Seu acesso foi desativado ou recusado pela administração.",
          );
        }

        // Standardize role field for frontend
        onLogin({
          ...user,
          role: user.profile || "VIEWER",
        });
        onNotify?.(`Bem-vindo, ${user.fullName}!`);
      } else {
        if (!fullName || !matricula || !password) {
          setError("Preencha todos os campos para se cadastrar.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            matricula,
            password,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao realizar cadastro.");
        }

        await response.json();
        onNotify?.(
          `Solicitação enviada com sucesso! Aguarde a aprovação do administrador.`,
        );
        setIsLogin(true);
        setFullName("");
        setPassword("");
      }
    } catch (err) {
      setError(err.message);
      onNotify?.(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-800 flex-col justify-center items-center relative overflow-hidden border-r border-slate-700">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-blue-600/20 z-0"></div>
        <div className="absolute top-0 w-full h-96 bg-sky-500/10 blur-[120px] rounded-full z-0 -translate-y-1/2"></div>

        <div className="z-10 text-center px-12">
          <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-blue-600 rounded-3xl mx-auto mb-8 shadow-2xl flex items-center justify-center rotate-3 hover:rotate-6 transition-all duration-500 group">
            <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
              🚌
            </span>
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent mb-6 tracking-tight">
            Vitae Web
          </h1>
          <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
            A plataforma de inteligência e gestão rodoviária para otimização de
            frotas e escalas.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-slate-900 to-transparent z-0"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <div className="absolute top-8 right-8 text-sm font-bold text-slate-500 uppercase tracking-widest hidden sm:block font-black">
          CORPORATIVO
        </div>

        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-100 mb-2">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p className="text-slate-400 font-medium text-sm">
              {isLogin
                ? "Insira suas credenciais corporativas para acessar o painel de operação."
                : "Insira seus dados para solicitar acesso ao sistema operacional."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 animate-in shake duration-300">
                <span>⚠️</span>
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Nome Completo
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors">
                    👤
                  </span>
                  <input
                    key="reg-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
                    placeholder="Ex: Carlos Alberto"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Matrícula Corporativa
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors">
                  #️⃣
                </span>
                <input
                  key="shared-matricula"
                  type="text"
                  required
                  value={matricula}
                  onChange={(e) =>
                    setMatricula(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner font-mono text-lg tracking-widest"
                  placeholder="0000"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                <label>Senha de Acesso</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() =>
                      onNotify?.(
                        "Entre em contato com o suporte de TI para resetar sua senha.",
                        "warning",
                      )
                    }
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors">
                  🔒
                </span>
                <input
                  key="shared-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner font-mono text-lg tracking-widest"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all duration-200 mt-4 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    {isLogin ? "Entrar no Sistema" : "Solicitar Cadastro"}
                  </span>
                  <span className="text-xl">➔</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-6 border-t border-slate-800 relative">
            <p className="text-sm text-slate-500 font-medium">
              {isLogin ? "É um novo colaborador?" : "Já possui matrícula?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-sky-400 font-black hover:text-sky-300 hover:underline underline-offset-4 transition-all"
              >
                {isLogin ? "Faça seu primeiro acesso" : "Faça login aqui"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

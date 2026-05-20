import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();


  // Função para lidar com o envio do formulário de login
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    setIsLoading(true);

    const response = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao fazer login.");
    }

    localStorage.setItem("ready_token", data.token);
    localStorage.setItem("ready_user", JSON.stringify(data.user));

    navigate("/library");
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Erro ao fazer login."
    );
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Entrar</h1>
          <p className="text-muted-foreground">Acesse sua biblioteca pessoal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card shadow-smooth rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:shadow-focus-ring transition-smooth"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 pr-12 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:shadow-focus-ring transition-smooth"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-smooth"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

         <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-smooth disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
        
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

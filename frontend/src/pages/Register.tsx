import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const isLongEnough = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = isLongEnough && hasNumber && hasSpecialChar;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!isPasswordValid) return;

  setError("");

  try {
    setIsLoading(true);

    const response = await fetch("http://localhost:3001/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao criar conta.");
    }

    localStorage.setItem("ready_token", data.token);
    localStorage.setItem("ready_user", JSON.stringify(data.user));

    navigate("/library");
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Erro ao criar conta."
    );
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative top-[10px]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Criar conta</h1>
          <p className="text-muted-foreground">Comece sua jornada de leitura adaptativa</p>
        </div>



        <form onSubmit={handleSubmit} className="bg-card shadow-smooth rounded-2xl p-8 space-y-6 relative top-[-15px]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:shadow-focus-ring transition-smooth"
              required
            />
          </div>

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
            <ul className="text-xs list-disc list-inside space-y-1 relative top-[6px]">
              <li className={isLongEnough ? "text-emerald-500" : "text-destructive"}>
                Senha de no mínimo de 6 caracteres
              </li>
              <li className={hasNumber ? "text-emerald-500" : "text-destructive"}>
                Adicione pelo menos um número
              </li>
              <li className={hasSpecialChar ? "text-emerald-500" : "text-destructive"}>
                Adicione pelo menos um símbolo especial (ex: !@#$%^&*)
              </li>
            </ul>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!isPasswordValid || isLoading}
            className={`w-full py-3 rounded-xl font-medium transition-smooth relative top-[-4px] ${
              isPasswordValid && !isLoading
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </button>

        </form>

        <p className="text-center text-sm text-muted-foreground relative top-[-35px]">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground relative top-[-60px] ">
          Ao criar sua conta, você concorda com os Termos de Uso.
        </p>
      </div>
    </div>
  );
};

export default Register;

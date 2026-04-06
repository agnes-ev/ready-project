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
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = isLongEnough && hasLowercase && hasUppercase && hasNumber && hasSpecialChar;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    navigate("/library");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Criar conta</h1>
          <p className="text-muted-foreground">Comece sua jornada de leitura adaptativa</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card shadow-smooth rounded-2xl p-8 space-y-6">
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
            <ul className="text-xs list-disc list-inside space-y-1">
              <li className={isLongEnough ? "text-emerald-500" : "text-destructive"}>
                Senha de no mínimo de 6 caracteres
              </li>
              <li className={hasUppercase ? "text-emerald-500" : "text-destructive"}>
                Adicione pelo menos uma letra maiúscula
              </li>
              <li className={hasLowercase ? "text-emerald-500" : "text-destructive"}>
                Adicione pelo menos uma letra minúscula
              </li>
              <li className={hasNumber ? "text-emerald-500" : "text-destructive"}>
                Adicione pelo menos um número
              </li>
              <li className={hasSpecialChar ? "text-emerald-500" : "text-destructive"}>
                Adicione pelo menos um símbolo especial (ex: !@#$%^&*)
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={!isPasswordValid}
            className={`w-full py-3 rounded-xl font-medium transition-smooth ${isPasswordValid ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            Cadastrar
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Ao criar sua conta, você concorda com os Termos de Uso.
        </p>
      </div>
    </div>
  );
};

export default Register;

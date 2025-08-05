import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";

const AccessCode = () => {
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o código de acesso.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // Store access code in session storage for RSVP page
    sessionStorage.setItem("accessCode", accessCode);
    navigate("/rsvp");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding via-background to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-12 w-12 text-primary mr-2" />
            <Heart className="h-8 w-8 text-accent -ml-4" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Chá de Panela</h1>
          <p className="text-muted-foreground">Entre com seu código de acesso</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Bem-vindos!</CardTitle>
            <CardDescription>
              Para acessar nossa lista de presentes, digite o código que você recebeu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Digite seu código de acesso"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="text-center text-lg font-mono tracking-widest"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Verificando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessCode;
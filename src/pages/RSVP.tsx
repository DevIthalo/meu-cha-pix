import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Users } from "lucide-react";

const RSVP = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const accessCode = sessionStorage.getItem("accessCode");
    if (!accessCode) {
      navigate("/");
      return;
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const accessCode = sessionStorage.getItem("accessCode");
      const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from("rsvp")
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          access_code_used: accessCode,
          session_id: sessionId,
        });

      if (error) throw error;

      // Store session data
      sessionStorage.setItem("guestSession", sessionId);
      sessionStorage.setItem("guestName", formData.fullName);
      sessionStorage.setItem("guestPhone", formData.phone);

      toast({
        title: "Sucesso!",
        description: "Sua confirmação foi registrada. Bem-vindo(a)!",
      });

      navigate("/event");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao registrar confirmação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding via-background to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-primary mr-2" />
            <Heart className="h-8 w-8 text-accent -ml-2" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Confirmação de Presença</h1>
          <p className="text-muted-foreground">Precisamos de algumas informações suas</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>RSVP</CardTitle>
            <CardDescription>
              Por favor, preencha seus dados para confirmar sua presença
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Confirmando..." : "Confirmar Presença"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RSVP;
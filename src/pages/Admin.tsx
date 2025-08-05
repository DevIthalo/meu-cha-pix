import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Gift, Users, Calendar, Key, Plus, Trash2 } from "lucide-react";

interface GiftItem {
  id: string;
  name: string;
  description: string | null;
  suggested_price: number | null;
  is_selected: boolean;
}

interface EventConfig {
  id: string;
  event_date: string;
  pix_key: string;
  access_code: string;
  welcome_message: string;
}

const Admin = () => {
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [newGift, setNewGift] = useState({ name: "", description: "", price: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchEventConfig();
    fetchGifts();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error || data?.role !== "admin") {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta área.",
          variant: "destructive",
        });
        navigate("/login");
      }
    } catch (error) {
      navigate("/login");
    }
  };

  const fetchEventConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("event_config")
        .select("*")
        .single();

      if (data) {
        setEventConfig(data);
      }
    } catch (error) {
      console.error("Error fetching event config:", error);
    }
  };

  const fetchGifts = async () => {
    try {
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .order("created_at");

      if (error) throw error;
      setGifts(data || []);
    } catch (error) {
      console.error("Error fetching gifts:", error);
    }
  };

  const handleSaveEventConfig = async (formData: any) => {
    setIsLoading(true);
    try {
      if (eventConfig) {
        const { error } = await supabase
          .from("event_config")
          .update(formData)
          .eq("id", eventConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_config")
          .insert(formData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Configurações salvas com sucesso.",
      });

      fetchEventConfig();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGift = async () => {
    if (!newGift.name) {
      toast({
        title: "Erro",
        description: "Nome do presente é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("gifts")
        .insert({
          name: newGift.name,
          description: newGift.description || null,
          suggested_price: newGift.price ? parseFloat(newGift.price) : null,
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Presente adicionado à lista.",
      });

      setNewGift({ name: "", description: "", price: "" });
      fetchGifts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar presente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGift = async (giftId: string) => {
    try {
      const { error } = await supabase
        .from("gifts")
        .delete()
        .eq("id", giftId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Presente removido da lista.",
      });

      fetchGifts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover presente.",
        variant: "destructive",
      });
    }
  };

  const generateAccessCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding via-background to-accent p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Settings className="h-12 w-12 text-primary mr-2" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Painel Administrativo</h1>
          <div className="flex justify-center gap-2">
            <Button onClick={() => navigate("/event")} variant="outline" size="sm">
              Ver Evento
            </Button>
            <Button onClick={() => navigate("/moderator")} variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Painel Moderador
            </Button>
            <Button onClick={() => supabase.auth.signOut()} variant="destructive" size="sm">
              Sair
            </Button>
          </div>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configurações</TabsTrigger>
            <TabsTrigger value="gifts">Lista de Presentes</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Configurações do Evento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target as HTMLFormElement);
                      handleSaveEventConfig({
                        event_date: formData.get("event_date"),
                        pix_key: formData.get("pix_key"),
                        access_code: formData.get("access_code"),
                        welcome_message: formData.get("welcome_message"),
                      });
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="event_date">Data e Hora do Evento</Label>
                      <Input
                        id="event_date"
                        name="event_date"
                        type="datetime-local"
                        defaultValue={eventConfig?.event_date ? new Date(eventConfig.event_date).toISOString().slice(0, 16) : ""}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pix_key">Chave PIX</Label>
                      <Input
                        id="pix_key"
                        name="pix_key"
                        placeholder="sua@chave.pix"
                        defaultValue={eventConfig?.pix_key || ""}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="access_code">Código de Acesso dos Convidados</Label>
                      <div className="flex gap-2">
                        <Input
                          id="access_code"
                          name="access_code"
                          placeholder="CODIGO123"
                          defaultValue={eventConfig?.access_code || ""}
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById("access_code") as HTMLInputElement;
                            input.value = generateAccessCode();
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="welcome_message">Mensagem de Boas-vindas</Label>
                      <Textarea
                        id="welcome_message"
                        name="welcome_message"
                        placeholder="Bem-vindos ao nosso Chá de Panela!"
                        defaultValue={eventConfig?.welcome_message || ""}
                      />
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Salvando..." : "Salvar Configurações"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gifts">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Adicionar Presente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome do Presente</Label>
                      <Input
                        placeholder="Ex: Conjunto de Panelas"
                        value={newGift.name}
                        onChange={(e) => setNewGift(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Textarea
                        placeholder="Descrição do presente..."
                        value={newGift.description}
                        onChange={(e) => setNewGift(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preço Sugerido (opcional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newGift.price}
                        onChange={(e) => setNewGift(prev => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleAddGift}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar à Lista
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Lista de Presentes ({gifts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {gifts.map((gift) => (
                      <div key={gift.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{gift.name}</h3>
                            {gift.is_selected && (
                              <Badge variant="secondary">Escolhido</Badge>
                            )}
                            {gift.suggested_price && (
                              <Badge variant="outline">R$ {gift.suggested_price.toFixed(2)}</Badge>
                            )}
                          </div>
                          {gift.description && (
                            <p className="text-sm text-muted-foreground">{gift.description}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleDeleteGift(gift.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {gifts.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum presente cadastrado ainda.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
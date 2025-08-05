import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Gift, DollarSign, FileImage, CheckCircle, XCircle } from "lucide-react";

interface RSVP {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface GiftSelection {
  id: string;
  name: string;
  description: string | null;
  suggested_price: number | null;
  selected_at: string;
  profiles: { full_name: string } | null;
}

interface PixContribution {
  id: string;
  contributor_name: string;
  contributor_phone: string | null;
  amount: number;
  receipt_url: string;
  verified: boolean;
  created_at: string;
}

const Moderator = () => {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [giftSelections, setGiftSelections] = useState<GiftSelection[]>([]);
  const [pixContributions, setPixContributions] = useState<PixContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkModeratorAccess();
    fetchData();
  }, []);

  const checkModeratorAccess = async () => {
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

      if (error || !["admin", "moderator"].includes(data?.role)) {
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

  const fetchData = async () => {
    try {
      // Fetch RSVPs
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvp")
        .select("*")
        .order("created_at", { ascending: false });

      if (rsvpError) throw rsvpError;
      setRsvps(rsvpData || []);

      // Fetch gift selections
      const { data: giftData, error: giftError } = await supabase
        .from("gifts")
        .select(`
          id,
          name,
          description,
          suggested_price,
          selected_at,
          profiles:selected_by (full_name)
        `)
        .eq("is_selected", true)
        .order("selected_at", { ascending: false });

      if (giftError) throw giftError;
      setGiftSelections(giftData || []);

      // Fetch PIX contributions
      const { data: pixData, error: pixError } = await supabase
        .from("pix_contributions")
        .select("*")
        .order("created_at", { ascending: false });

      if (pixError) throw pixError;
      setPixContributions(pixData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getReceiptUrl = (receiptPath: string) => {
    const { data } = supabase.storage
      .from("receipts")
      .getPublicUrl(receiptPath);
    return data.publicUrl;
  };

  const handleVerifyContribution = async (contributionId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from("pix_contributions")
        .update({ verified })
        .eq("id", contributionId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Contribuição ${verified ? "verificada" : "rejeitada"} com sucesso.`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da contribuição.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wedding via-background to-accent flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding via-background to-accent p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-primary mr-2" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Painel de Moderação</h1>
          <div className="flex justify-center gap-2">
            <Button onClick={() => navigate("/event")} variant="outline" size="sm">
              Ver Evento
            </Button>
            <Button onClick={() => navigate("/admin")} variant="outline" size="sm">
              Painel Admin
            </Button>
            <Button onClick={() => supabase.auth.signOut()} variant="destructive" size="sm">
              Sair
            </Button>
          </div>
        </div>

        <Tabs defaultValue="rsvp" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rsvp">Confirmações ({rsvps.length})</TabsTrigger>
            <TabsTrigger value="gifts">Presentes ({giftSelections.length})</TabsTrigger>
            <TabsTrigger value="pix">PIX ({pixContributions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="rsvp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Confirmações de Presença
                </CardTitle>
                <CardDescription>
                  Lista de convidados que confirmaram presença
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rsvps.map((rsvp) => (
                    <div key={rsvp.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{rsvp.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{rsvp.email}</p>
                        <p className="text-sm text-muted-foreground">{rsvp.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(rsvp.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {rsvps.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma confirmação registrada ainda.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gifts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Presentes Escolhidos
                </CardTitle>
                <CardDescription>
                  Lista de presentes que foram selecionados pelos convidados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {giftSelections.map((gift) => (
                    <div key={gift.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{gift.name}</h3>
                        {gift.description && (
                          <p className="text-sm text-muted-foreground">{gift.description}</p>
                        )}
                        {gift.suggested_price && (
                          <Badge variant="outline" className="mt-1">
                            R$ {gift.suggested_price.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{gift.profiles?.full_name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">
                          {gift.selected_at ? new Date(gift.selected_at).toLocaleDateString("pt-BR") : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {giftSelections.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum presente foi escolhido ainda.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pix">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Contribuições PIX
                </CardTitle>
                <CardDescription>
                  Lista de contribuições financeiras recebidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pixContributions.map((contribution) => (
                    <div key={contribution.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{contribution.contributor_name}</h3>
                        <p className="text-sm text-muted-foreground">{contribution.contributor_phone}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            R$ {contribution.amount.toFixed(2)}
                          </Badge>
                          <Badge variant={contribution.verified ? "default" : "outline"}>
                            {contribution.verified ? "Verificado" : "Pendente"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FileImage className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Comprovante de Pagamento</DialogTitle>
                              <DialogDescription>
                                Contribuição de {contribution.contributor_name} - R$ {contribution.amount.toFixed(2)}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <img
                                src={getReceiptUrl(contribution.receipt_url)}
                                alt="Comprovante"
                                className="w-full max-h-96 object-contain border rounded"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleVerifyContribution(contribution.id, true)}
                                  variant="default"
                                  size="sm"
                                  className="flex-1"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Verificar
                                </Button>
                                <Button
                                  onClick={() => handleVerifyContribution(contribution.id, false)}
                                  variant="destructive"
                                  size="sm"
                                  className="flex-1"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Rejeitar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(contribution.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pixContributions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma contribuição registrada ainda.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Moderator;
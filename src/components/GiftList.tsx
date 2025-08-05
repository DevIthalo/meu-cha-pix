import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Heart, DollarSign } from "lucide-react";

interface GiftItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  suggested_price: number | null;
  is_selected: boolean;
  selected_by: string | null;
}

export const GiftList = () => {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [confirmData, setConfirmData] = useState({ name: "", phone: "" });
  const [pixData, setPixData] = useState({ amount: "", name: "", phone: "", receipt: null as File | null });
  const [eventConfig, setEventConfig] = useState<any>(null);

  useEffect(() => {
    fetchGifts();
    fetchEventConfig();
    
    // Pre-fill with session data
    const guestName = sessionStorage.getItem("guestName");
    const guestPhone = sessionStorage.getItem("guestPhone");
    if (guestName && guestPhone) {
      setConfirmData({ name: guestName, phone: guestPhone });
      setPixData(prev => ({ ...prev, name: guestName, phone: guestPhone }));
    }
  }, []);

  const fetchGifts = async () => {
    try {
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .order("created_at");

      if (error) throw error;
      setGifts(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de presentes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEventConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("event_config")
        .select("*")
        .single();

      if (error) throw error;
      setEventConfig(data);
    } catch (error) {
      console.error("Error fetching event config:", error);
    }
  };

  const handleGiftSelection = async () => {
    if (!selectedGift || !confirmData.name || !confirmData.phone) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First create/get guest profile
      const sessionId = sessionStorage.getItem("guestSession");
      
      const { error } = await supabase
        .from("gifts")
        .update({
          is_selected: true,
          selected_at: new Date().toISOString(),
        })
        .eq("id", selectedGift.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Obrigado por escolher: ${selectedGift.name}`,
      });

      setSelectedGift(null);
      setConfirmData({ name: "", phone: "" });
      fetchGifts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao selecionar presente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handlePixContribution = async () => {
    if (!pixData.amount || !pixData.name || !pixData.phone || !pixData.receipt) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos e anexe o comprovante.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload receipt
      const fileExt = pixData.receipt.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, pixData.receipt);

      if (uploadError) throw uploadError;

      // Save contribution
      const { error } = await supabase
        .from("pix_contributions")
        .insert({
          contributor_name: pixData.name,
          contributor_phone: pixData.phone,
          amount: parseFloat(pixData.amount),
          receipt_url: uploadData.path,
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Sua contribuição foi registrada. Obrigado!",
      });

      setPixData({ amount: "", name: pixData.name, phone: pixData.phone, receipt: null });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar contribuição. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando presentes...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Gift className="h-6 w-6" />
            Lista de Presentes
          </CardTitle>
          <CardDescription>
            Escolha um presente da nossa lista ou contribua com PIX
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* PIX Contribution Card */}
        <Card className="border-2 border-accent bg-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Contribuição PIX
            </CardTitle>
            <CardDescription>
              Prefere contribuir em dinheiro? Use nosso PIX!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Heart className="h-4 w-4 mr-2" />
                  Contribuir via PIX
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Contribuição via PIX</DialogTitle>
                  <DialogDescription>
                    Preencha os dados e anexe o comprovante
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded">
                    <Label className="font-semibold">Chave PIX:</Label>
                    <p className="font-mono text-sm mt-1">{eventConfig?.pix_key}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={pixData.amount}
                      onChange={(e) => setPixData(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Seu Nome</Label>
                    <Input
                      value={pixData.name}
                      onChange={(e) => setPixData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Seu Telefone</Label>
                    <Input
                      value={pixData.phone}
                      onChange={(e) => setPixData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Comprovante</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setPixData(prev => ({ ...prev, receipt: e.target.files?.[0] || null }))}
                    />
                  </div>
                  
                  <Button onClick={handlePixContribution} className="w-full">
                    Confirmar Contribuição
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Gift Cards */}
        {gifts.map((gift) => (
          <Card key={gift.id} className={gift.is_selected ? "opacity-60 bg-muted" : ""}>
            <CardHeader>
              <CardTitle className="text-lg">{gift.name}</CardTitle>
              {gift.description && (
                <CardDescription>{gift.description}</CardDescription>
              )}
              {gift.suggested_price && (
                <Badge variant="secondary">R$ {gift.suggested_price.toFixed(2)}</Badge>
              )}
            </CardHeader>
            <CardContent>
              {gift.is_selected ? (
                <Badge variant="outline" className="w-full justify-center py-2">
                  Já foi escolhido
                </Badge>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full"
                      onClick={() => setSelectedGift(gift)}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Escolher Este Presente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Seleção</DialogTitle>
                      <DialogDescription>
                        Você escolheu: {gift.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Seu Nome</Label>
                        <Input
                          value={confirmData.name}
                          onChange={(e) => setConfirmData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Seu Telefone</Label>
                        <Input
                          value={confirmData.phone}
                          onChange={(e) => setConfirmData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <Button onClick={handleGiftSelection} className="w-full">
                        Confirmar Seleção
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Countdown } from "@/components/Countdown";
import { GiftList } from "@/components/GiftList";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

const Event = () => {
  const [eventConfig, setEventConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has completed RSVP
    const guestSession = sessionStorage.getItem("guestSession");
    if (!guestSession) {
      navigate("/");
      return;
    }

    fetchEventConfig();
  }, [navigate]);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wedding via-background to-accent flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding via-background to-accent">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-12 w-12 text-primary mr-2" />
            <Heart className="h-8 w-8 text-accent -ml-4" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-4">Chá de Panela</h1>
          <p className="text-lg text-muted-foreground mb-2">
            {eventConfig?.welcome_message || "Bem-vindos ao nosso Chá de Panela!"}
          </p>
          <p className="text-sm text-muted-foreground">
            Olá, {sessionStorage.getItem("guestName")}! 💕
          </p>
        </div>

        {/* Countdown */}
        {eventConfig?.event_date && (
          <div className="mb-8">
            <Countdown targetDate={eventConfig.event_date} />
          </div>
        )}

        {/* Gift List */}
        <GiftList />
      </div>
    </div>
  );
};

export default Event;
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownProps {
  targetDate: string;
}

export const Countdown = ({ targetDate }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits = [
    { label: "Dias", value: timeLeft.days },
    { label: "Horas", value: timeLeft.hours },
    { label: "Minutos", value: timeLeft.minutes },
    { label: "Segundos", value: timeLeft.seconds },
  ];

  return (
    <Card className="bg-primary text-primary-foreground">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Contagem Regressiva</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {timeUnits.map((unit, index) => (
            <div key={index} className="text-center">
              <div className="bg-primary-foreground text-primary rounded-lg p-4 mb-2">
                <div className="text-3xl font-bold">{unit.value.toString().padStart(2, '0')}</div>
              </div>
              <div className="text-sm font-medium">{unit.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
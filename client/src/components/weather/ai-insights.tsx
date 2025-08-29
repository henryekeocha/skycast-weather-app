import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, RefreshCw, Lightbulb } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { CurrentWeather, Forecast } from "@shared/schema";

interface AIInsightsProps {
  currentWeather: CurrentWeather;
  forecast?: Forecast;
  locationName: string;
}

export default function AIInsights({ currentWeather, forecast, locationName }: AIInsightsProps) {
  const [insights, setInsights] = useState<string>("");

  const aiInsightsMutation = useMutation({
    mutationFn: async () => {
      const weatherData = {
        current: currentWeather,
        forecast: forecast?.list?.slice(0, 8) // Send first 8 days
      };

      const response = await apiRequest("POST", "/api/ai/weather-insights", {
        weatherData,
        location: locationName
      });
      return response.json();
    },
    onSuccess: (data) => {
      setInsights(data.insight);
    },
    onError: (error) => {
      setInsights("Sorry, I couldn't generate insights right now. Please try again later.");
    }
  });

  const generateInsights = () => {
    aiInsightsMutation.mutate();
  };

  return (
    <div className="weather-card rounded-3xl p-6 md:p-8" data-testid="card-ai-insights">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold flex items-center">
          <Sparkles className="w-6 h-6 text-primary mr-3" />
          AI Weather Insights
        </h3>
        
        <button
          onClick={generateInsights}
          disabled={aiInsightsMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-generate-insights"
        >
          <RefreshCw className={`w-4 h-4 ${aiInsightsMutation.isPending ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">
            {aiInsightsMutation.isPending ? 'Analyzing...' : 'Get Insights'}
          </span>
        </button>
      </div>

      {insights ? (
        <div className="prose prose-sm max-w-none">
          <div className="bg-muted/30 rounded-xl p-4 border border-border/20">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-foreground leading-relaxed">
                {insights.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Get AI-powered insights about current weather conditions and personalized recommendations.
          </p>
          <button
            onClick={generateInsights}
            disabled={aiInsightsMutation.isPending}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
            data-testid="button-get-insights"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Smart Insights</span>
          </button>
        </div>
      )}
    </div>
  );
}
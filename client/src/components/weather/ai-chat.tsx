import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageCircle, Send, Sparkles, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { CurrentWeather, Forecast } from "@shared/schema";

interface AIChatProps {
  currentWeather?: CurrentWeather;
  forecast?: Forecast;
  locationName: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function AIChat({ currentWeather, forecast, locationName }: AIChatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");

  const aiInsightsMutation = useMutation({
    mutationFn: async ({ question, weatherData }: { question?: string; weatherData: any }) => {
      const response = await apiRequest("POST", "/api/ai/weather-insights", {
        weatherData,
        location: locationName,
        question
      });
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + "-ai",
        type: 'ai',
        content: data.insight,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + "-error",
        type: 'ai',
        content: "Sorry, I'm having trouble analyzing the weather right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentWeather) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + "-user",
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Prepare weather data for AI
    const weatherData = {
      current: currentWeather,
      forecast: forecast?.list?.slice(0, 8) // Send first 8 days
    };

    aiInsightsMutation.mutate({ 
      question: inputValue,
      weatherData 
    });
  };

  const getAutoInsights = async () => {
    if (!currentWeather) return;

    const weatherData = {
      current: currentWeather,
      forecast: forecast?.list?.slice(0, 8)
    };

    aiInsightsMutation.mutate({ weatherData });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-colors group"
          data-testid="button-ai-chat-open"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <div className="weather-card rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-primary/10 backdrop-blur-sm p-4 border-b border-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">AI Weather Assistant</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-ai-chat-close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm mb-4">
                Ask me anything about the weather!
              </p>
              <button
                onClick={getAutoInsights}
                disabled={aiInsightsMutation.isPending}
                className="text-primary hover:text-primary/80 text-sm font-medium disabled:opacity-50"
                data-testid="button-auto-insights"
              >
                Get Smart Insights
              </button>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}

          {aiInsightsMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground p-3 rounded-lg flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing weather...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/20">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about the weather..."
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={aiInsightsMutation.isPending}
              data-testid="input-ai-chat"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || aiInsightsMutation.isPending}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
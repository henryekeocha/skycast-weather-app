import { AlertTriangle, Info, AlertCircle, Zap, X } from "lucide-react";
import { useState } from "react";
import type { WeatherAlert } from "@shared/schema";

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
  locationName: string;
}

export default function WeatherAlerts({ alerts, locationName }: WeatherAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getAlertSeverity = (event: string, description: string) => {
    const eventLower = event.toLowerCase();
    const descLower = description.toLowerCase();
    
    // High severity (red)
    if (
      eventLower.includes('warning') || 
      eventLower.includes('emergency') ||
      eventLower.includes('tornado') ||
      eventLower.includes('hurricane') ||
      descLower.includes('dangerous') ||
      descLower.includes('life threatening')
    ) {
      return {
        level: 'high',
        color: 'bg-red-500',
        textColor: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-red-200 dark:border-red-900',
        icon: AlertTriangle
      };
    }
    
    // Medium severity (orange/yellow)
    if (
      eventLower.includes('watch') ||
      eventLower.includes('advisory') ||
      eventLower.includes('caution') ||
      descLower.includes('moderate')
    ) {
      return {
        level: 'medium',
        color: 'bg-orange-500',
        textColor: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        borderColor: 'border-orange-200 dark:border-orange-900',
        icon: AlertCircle
      };
    }
    
    // Low severity (blue)
    return {
      level: 'low',
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-900',
      icon: Info
    };
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAlertKey = (alert: WeatherAlert, index: number) => {
    return `${alert.event}-${alert.start}-${index}`;
  };

  const dismissAlert = (alertKey: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertKey));
  };

  const activeAlerts = alerts.filter((alert, index) => 
    !dismissedAlerts.has(getAlertKey(alert, index))
  );

  if (activeAlerts.length === 0) {
    return null;
  }

  // Group alerts by severity for better visual organization
  const alertsBySeverity = activeAlerts.reduce((groups, alert, index) => {
    const severity = getAlertSeverity(alert.event, alert.description);
    const key = getAlertKey(alert, index);
    
    if (!groups[severity.level]) {
      groups[severity.level] = [];
    }
    groups[severity.level].push({ alert, severity, key });
    return groups;
  }, {} as Record<string, Array<{ alert: WeatherAlert; severity: any; key: string }>>);

  return (
    <div className="mb-8" data-testid="weather-alerts-container">
      <h3 className="text-2xl font-semibold mb-4 flex items-center text-foreground">
        <Zap className="w-6 h-6 text-yellow-500 mr-3" />
        Weather Alerts
        <span className="ml-2 text-sm text-muted-foreground font-normal">
          ({activeAlerts.length} active)
        </span>
      </h3>

      <div className="space-y-4">
        {/* High Severity Alerts First */}
        {alertsBySeverity.high?.map(({ alert, severity, key }) => (
          <div
            key={key}
            className={`rounded-3xl border ${severity.borderColor} ${severity.bgColor} p-6 relative shadow-sm`}
            data-testid={`alert-${severity.level}`}
          >
            <button
              onClick={() => dismissAlert(key)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`button-dismiss-${key}`}
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start space-x-4">
              <div className={`${severity.color} rounded-full p-2 flex-shrink-0`}>
                <severity.icon className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1 pr-8">
                <h4 className={`text-lg font-semibold mb-2 ${severity.textColor}`}>
                  {alert.event}
                </h4>
                
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {alert.description}
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-muted-foreground">
                  <div className="mb-1 sm:mb-0">
                    <strong>Starts:</strong> {formatDate(alert.start)}
                  </div>
                  <div className="mb-1 sm:mb-0">
                    <strong>Ends:</strong> {formatDate(alert.end)}
                  </div>
                  <div>
                    <strong>Source:</strong> {alert.sender_name}
                  </div>
                </div>
                
                {alert.tags && alert.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {alert.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
                        data-testid={`tag-${tag.toLowerCase()}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Medium Severity Alerts */}
        {alertsBySeverity.medium?.map(({ alert, severity, key }) => (
          <div
            key={key}
            className={`rounded-2xl border ${severity.borderColor} ${severity.bgColor} p-5 relative`}
            data-testid={`alert-${severity.level}`}
          >
            <button
              onClick={() => dismissAlert(key)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`button-dismiss-${key}`}
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start space-x-3">
              <div className={`${severity.color} rounded-full p-1.5 flex-shrink-0`}>
                <severity.icon className="w-4 h-4 text-white" />
              </div>
              
              <div className="flex-1 pr-6">
                <h4 className={`font-semibold mb-2 ${severity.textColor}`}>
                  {alert.event}
                </h4>
                
                <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                  {alert.description}
                </p>
                
                <div className="text-xs text-muted-foreground">
                  <span className="mr-4">
                    <strong>Active:</strong> {formatDate(alert.start)} - {formatDate(alert.end)}
                  </span>
                  <span>
                    <strong>Source:</strong> {alert.sender_name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Low Severity Alerts */}
        {alertsBySeverity.low?.map(({ alert, severity, key }) => (
          <div
            key={key}
            className={`rounded-xl border ${severity.borderColor} ${severity.bgColor} p-4 relative`}
            data-testid={`alert-${severity.level}`}
          >
            <button
              onClick={() => dismissAlert(key)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`button-dismiss-${key}`}
              title="Dismiss alert"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="flex items-start space-x-3">
              <div className={`${severity.color} rounded-full p-1 flex-shrink-0`}>
                <severity.icon className="w-3 h-3 text-white" />
              </div>
              
              <div className="flex-1 pr-5">
                <h4 className={`font-medium mb-1 ${severity.textColor}`}>
                  {alert.event}
                </h4>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {alert.description}
                </p>
                
                <div className="text-xs text-muted-foreground">
                  {formatDate(alert.start)} - {formatDate(alert.end)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Weather alerts from {locationName} • Updates every 10 minutes
        </p>
      </div>
    </div>
  );
}
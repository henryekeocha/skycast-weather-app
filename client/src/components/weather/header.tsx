import { Cloud } from "lucide-react";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  return (
    <nav className={`flex items-center justify-between p-3 sm:p-4 ${className}`}>
      {/* Logo and Brand */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <img 
          src="/favicon.png" 
          alt="SkyCast Logo" 
          className="w-10 h-10 object-contain"
        />
        <div>
          <h1 className="text-xl font-bold text-white">SkyCast</h1>
          <p className="text-xs text-white/70">Weather Forecast</p>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 text-white/80 text-sm">
          <Cloud className="w-4 h-4" />
          <span>8-Day Forecast</span>
        </div>
      </div>
    </nav>
  );
}
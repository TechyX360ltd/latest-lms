import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Wifi, WifiOff } from 'lucide-react';

export function SupabaseConnectionStatus() {
  const { isSupabaseConnected } = useAuth();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isSupabaseConnected ? (
        <Wifi className="w-6 h-6 text-green-600" />
      ) : (
        <WifiOff className="w-6 h-6 text-red-600" />
      )}
    </div>
  );
}
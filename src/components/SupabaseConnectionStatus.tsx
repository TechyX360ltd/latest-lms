import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Database, Server, Wifi, WifiOff } from 'lucide-react';

export function SupabaseConnectionStatus() {
  const { isSupabaseConnected } = useAuth();

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
      isSupabaseConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {isSupabaseConnected ? (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-xs font-medium">Supabase Connected</span>
          <Database className="w-4 h-4 ml-1" />
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-xs font-medium">Using Local Storage</span>
          <Server className="w-4 h-4 ml-1" />
        </>
      )}
    </div>
  );
}
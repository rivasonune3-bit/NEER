'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { MessageSquare, Radio, Phone, Send, Volume2 } from 'lucide-react';

export default function ResponseEmergencyCommPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'NDRF Control Command', text: 'Alpha Team proceed to Chooralmala Hamlet junction.', time: '02:02 IST' },
    { id: 2, sender: 'Rescue Rig 4', text: 'Boat 4 on scene. Water depth 4.5 ft. Evacuating 5 evacuees.', time: '02:05 IST' },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg) return;
    setMessages([...messages, { id: Date.now(), sender: 'Fleet Boat 4 Operator', text: inputMsg, time: 'Just now' }]);
    setInputMsg('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <SystemStatusBanner />
      <Header currentRole="response" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="response" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 max-w-[1000px] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                Tactical Radio Channel & Field Communications
              </h1>
              <p className="text-xs text-slate-500">
                Encrypted tactical dispatch channel between field rescue boats and NDMA control desks.
              </p>
            </div>
            <DataBadge label="RADIO CH-4" variant="live" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
              <span className="font-bold flex items-center gap-2 text-sky-400">
                <Radio className="w-4 h-4 animate-pulse" /> Channel Alpha 4 (Frequency 148.55 MHz)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Status: Live Audio Stream</span>
            </div>

            <div className="space-y-3 h-64 overflow-y-auto p-2 bg-slate-950 rounded-lg border border-slate-800">
              {messages.map((m) => (
                <div key={m.id} className="bg-slate-900 p-2.5 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-amber-400">{m.sender}</span>
                    <span className="font-mono">{m.time}</span>
                  </div>
                  <p className="text-slate-200 font-medium">{m.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="Type tactical field update..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all flex items-center gap-1"
              >
                <Send className="w-4 h-4" /> Transmit
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

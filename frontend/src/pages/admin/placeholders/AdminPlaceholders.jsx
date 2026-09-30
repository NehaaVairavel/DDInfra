import React from 'react';
import { Construction } from 'lucide-react';

const AdminPlaceholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 bg-white rounded-[2rem] border border-slate-200 shadow-sm animate-in fade-in duration-500">
    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
      <Construction size={40} className="text-amber-500 animate-bounce" />
    </div>
    <h1 className="text-2xl font-display font-bold text-[#0F172A] mb-2">{title}</h1>
    <p className="text-slate-500">This section is under construction for the Global Command Center.</p>
  </div>
);

export const Orders = () => <AdminPlaceholder title="Orders Management" />;
export const ExportDocuments = () => <AdminPlaceholder title="Export Documents" />;
export const Analytics = () => <AdminPlaceholder title="Global Analytics" />;
export const Inventory = () => <AdminPlaceholder title="Inventory Tracking" />;

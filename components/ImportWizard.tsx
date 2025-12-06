import React, { useState } from 'react';
import { Upload, X, FileSpreadsheet, PieChart, TrendingUp } from 'lucide-react';
import { ReportType } from '../types';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, type: ReportType) => void;
  isLoading: boolean;
}

const ImportWizard: React.FC<ImportWizardProps> = ({ isOpen, onClose, onUpload, isLoading }) => {
  const [selectedType, setSelectedType] = useState<ReportType>(ReportType.CASHFLOW);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onUpload(e.target.files[0], selectedType);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Nieuw Rapport Toevoegen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <button
                onClick={() => setSelectedType(ReportType.CASHFLOW)}
                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${selectedType === ReportType.CASHFLOW ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}
             >
                <TrendingUp className="w-8 h-8" />
                <span className="text-sm font-bold">Cashflow</span>
                <span className="text-[10px] text-center text-gray-500">Bank & Facturen</span>
             </button>

             <button
                onClick={() => setSelectedType(ReportType.PNL)}
                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${selectedType === ReportType.PNL ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300'}`}
             >
                <PieChart className="w-8 h-8" />
                <span className="text-sm font-bold">Winst & Verlies</span>
                <span className="text-[10px] text-center text-gray-500">Omzet & Kosten</span>
             </button>

             <button
                onClick={() => setSelectedType(ReportType.BALANCE)}
                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${selectedType === ReportType.BALANCE ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-300'}`}
             >
                <FileSpreadsheet className="w-8 h-8" />
                <span className="text-sm font-bold">Balans</span>
                <span className="text-[10px] text-center text-gray-500">Activa & Passiva</span>
             </button>
          </div>

          <div className="border-t pt-6 text-center">
             <label className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-medium shadow-md transition cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`} style={{ backgroundColor: 'var(--color-primary)' }}>
                {isLoading ? <span className="animate-spin">⌛</span> : <Upload className="w-5 h-5" />}
                <span>Selecteer Bestand (CSV/Excel)</span>
                <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".csv,.txt,.xls,.xlsx"
                    disabled={isLoading}
                />
             </label>
             <p className="mt-2 text-xs text-gray-400">Ondersteunt Exact Online formaat</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportWizard;
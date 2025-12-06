import React, { useState } from 'react';
import { analyzeCashFlow } from '../services/geminiService';
import { DailyBalance } from '../types';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props {
  forecast: DailyBalance[];
  scenario: string;
}

const AIConsultant: React.FC<Props> = ({ forecast, scenario }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false); // Hidden by default

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis(null);
    const result = await analyzeCashFlow(forecast, scenario);
    setAnalysis(result);
    setLoading(false);
  };

  if (!visible) {
    return (
        <div className="flex justify-end mt-4">
             <button 
                onClick={() => setVisible(true)}
                className="text-xs flex items-center gap-1 transition"
                style={{ color: 'var(--color-primary)' }}
             >
                <Sparkles className="w-3 h-3" />
                Toon AI Assistent
             </button>
        </div>
    );
  }

  return (
    <div 
        className="mt-6 border rounded-lg p-6 relative overflow-hidden transition-colors"
        style={{ 
            borderColor: 'var(--color-primary)', 
            backgroundColor: '#F9FAFB' // Keeping neutral background as per requirements
        }}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-24 h-24" style={{ color: 'var(--color-primary)' }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            AI Financiële Analyse
          </h3>
          <button 
            onClick={() => setVisible(false)}
            className="text-xs hover:underline"
            style={{ color: 'var(--color-text)', opacity: 0.6 }}
          >
            Verbergen
          </button>
        </div>

        {!analysis && !loading && (
          <div className="text-sm" style={{ color: 'var(--color-text)' }}>
            <p className="mb-4">
              Laat onze AI de patronen in je cashflow analyseren voor risico's en optimalisaties in het <strong>{scenario}</strong> scenario.
            </p>
            <button
              onClick={handleAnalyze}
              className="px-4 py-2 text-white rounded-md text-sm font-medium transition flex items-center gap-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Start Analyse
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-4" style={{ color: 'var(--color-primary)' }}>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Data analyseren...</span>
          </div>
        )}

        {analysis && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white/80 backdrop-blur-sm rounded p-4 text-sm leading-relaxed border shadow-sm" style={{ color: 'var(--color-text)', borderColor: 'var(--color-primary)' }}>
               <p>{analysis}</p>
            </div>
            <div className="mt-4 flex gap-2">
                <button 
                    onClick={handleAnalyze} 
                    className="text-xs hover:underline font-medium"
                    style={{ color: 'var(--color-primary)' }}
                >
                    Opnieuw analyseren
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIConsultant;

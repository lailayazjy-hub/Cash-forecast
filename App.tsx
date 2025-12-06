import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  FileText, 
  Plus, 
  Download, 
  PieChart, 
  AlertTriangle,
  Calendar,
  X,
  Loader2,
  Filter,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { 
  DataSource, 
  ScenarioType, 
  AppSettings,
  Theme,
  DateRange,
  DateRangeType,
  ReportType,
  LedgerEntry,
  Transaction
} from './types';
import { calculateForecast, generateMockData } from './services/cashFlowService';
import CashFlowChart from './components/CashFlowChart';
import TransactionTable from './components/TransactionTable';
import AIConsultant from './components/AIConsultant';
import FinancialReport from './components/FinancialReport';
import LiveClock from './components/LiveClock';
import SourceConfigurator from './components/SourceConfigurator';
import Logo from './components/Logo';

// Theme Definitions
const THEMES: Theme[] = [
  {
    id: 'terra-cotta',
    name: 'Terra Cotta Landscape',
    colors: {
      primary: '#52939D',
      highRisk: '#D66D6B',
      mediumRisk: '#F3B0A9',
      lowRisk: '#BDD7C6',
      text: '#242F4D'
    }
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    colors: {
      primary: '#2E7B57',
      highRisk: '#9A6C5A',
      mediumRisk: '#E4F46A',
      lowRisk: '#2E7B57',
      text: '#14242E'
    }
  },
  {
    id: 'autumn-leaves',
    name: 'Autumn Leaves',
    colors: {
      primary: '#B1782F',
      highRisk: '#2E2421',
      mediumRisk: '#B49269',
      lowRisk: '#B1782F',
      text: '#8B8F92'
    }
  },
  {
    id: 'citrus-garden',
    name: 'Citrus Garden',
    colors: {
      primary: '#4D7B41',
      highRisk: '#F8B24A',
      mediumRisk: '#FDD268',
      lowRisk: '#8FAB56',
      text: '#242F4D'
    }
  },
  {
    id: 'rustic-cafe',
    name: 'Rustic Café',
    colors: {
      primary: '#5BB1B3',
      highRisk: '#A65A4E',
      mediumRisk: '#E89A63',
      lowRisk: '#D5B48A',
      text: '#1A1D32'
    }
  },
  {
    id: 'blood-orange',
    name: 'Blood Orange Velvet',
    colors: {
      primary: '#1A2F5E',
      highRisk: '#B43836',
      mediumRisk: '#F6891F',
      lowRisk: '#E4C18B',
      text: '#202530'
    }
  },
  {
    id: 'canyon-heat',
    name: 'Canyon Heat',
    colors: {
      primary: '#FF7A15',
      highRisk: '#7A0010',
      mediumRisk: '#B1126F',
      lowRisk: '#EF3D22',
      text: '#3B1F12'
    }
  }
];

const App: React.FC = () => {
  // State
  const [startBalance, setStartBalance] = useState<number>(0);
  const [dataSources, setDataSources] = useState<DataSource[]>([]); // Starts Empty
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [scenario, setScenario] = useState<ScenarioType>(ScenarioType.REALISTIC);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Date Range State
  const [dateRange, setDateRange] = useState<DateRange>({ type: '7DAYS' });

  const [settings, setSettings] = useState<AppSettings>({
    showSmallAmounts: false,
    currencyInK: false,
    smallAmountThreshold: 50,
    appName: 'CashFlow 7 daags',
    activeThemeId: 'terra-cotta'
  });

  // Initialize with empty data (Strict user uploaded data only)
  useEffect(() => {
    setDataSources(generateMockData()); // This now returns []
  }, []);

  // Update Document Title
  useEffect(() => {
    document.title = settings.appName;
  }, [settings.appName]);

  // Derived State: Forecast
  const forecast = useMemo(() => {
    return calculateForecast(startBalance, dataSources.filter(d => d.type === ReportType.CASHFLOW), scenario, dateRange);
  }, [startBalance, dataSources, scenario, dateRange]);

  // Derived State: Current Theme
  const currentTheme = useMemo(() => {
    return THEMES.find(t => t.id === settings.activeThemeId) || THEMES[0];
  }, [settings.activeThemeId]);

  // Effect to update CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', currentTheme.colors.primary);
    root.style.setProperty('--color-high-risk', currentTheme.colors.highRisk);
    root.style.setProperty('--color-medium-risk', currentTheme.colors.mediumRisk);
    root.style.setProperty('--color-low-risk', currentTheme.colors.lowRisk);
    root.style.setProperty('--color-text', currentTheme.colors.text);
  }, [currentTheme]);

  // Actions
  const handleCreateTab = () => {
    const newId = `src-${Date.now()}`;
    const newSource: DataSource = {
      id: newId,
      name: 'Nieuw Rapport',
      type: ReportType.EMPTY,
      isActive: true,
      transactions: [],
      ledgerEntries: []
    };
    setDataSources(prev => [...prev, newSource]);
    setActiveTab(newId);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Weet je zeker dat je dit tabblad en bijbehorende data wilt verwijderen?")) {
      setDataSources(prev => prev.filter(s => s.id !== id));
      if (activeTab === id) setActiveTab('dashboard');
    }
  };

  const handleUpdateSource = (id: string, data: Partial<DataSource>) => {
    setDataSources(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const handleUpdateEntries = (sourceId: string, entries: LedgerEntry[], errors?: string[]) => {
      setDataSources(prev => prev.map(s => s.id === sourceId ? { ...s, ledgerEntries: entries, errors: errors || s.errors } : s));
  };

  const handleUpdateTransactions = (sourceId: string, transactions: Transaction[], errors?: string[]) => {
      setDataSources(prev => prev.map(s => s.id === sourceId ? { ...s, transactions: transactions, errors: errors || s.errors } : s));
  };

  const toggleSource = (id: string) => {
    setDataSources(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const handleAddComment = (id: string, comment: string) => {
      setDataSources(prev => prev.map(source => ({
          ...source,
          transactions: source.transactions.map(tx => tx.id === id ? {
              ...tx,
              managerComment: comment,
              managerName: 'Manager',
              commentDate: new Date().toLocaleDateString('nl-NL')
          } : tx)
      })));
  };

  const handleExport = () => {
    window.print();
  };

  const handleReset = () => {
      if (confirm("Weet je zeker dat je alle data wilt wissen en de applicatie wilt resetten naar de standaardinstellingen?")) {
          setDataSources([]);
          setStartBalance(0);
          setSettings({
            showSmallAmounts: false,
            currencyInK: false,
            smallAmountThreshold: 50,
            appName: 'CashFlow 7 daags',
            activeThemeId: 'terra-cotta'
          });
          setActiveTab('dashboard');
          setDateRange({ type: '7DAYS' });
          setScenario(ScenarioType.REALISTIC);
      }
  };

  // Find lowest balance for warning (Cashflow only)
  const lowestBalance = forecast.length > 0 ? Math.min(...forecast.map(f => f.balance)) : startBalance;
  const isDanger = lowestBalance < 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800 relative overflow-hidden">
      
      {/* Background Watermark Logo - Hidden on Print */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden print:hidden">
        <Logo className="w-[800px] h-[800px] text-gray-200" opacity={0.03} />
      </div>

      {/* Top Navigation Bar */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm transition-colors relative print:border-none print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
               <Logo className="w-10 h-10" opacity={1} />
            </div>
            <h1 className="text-xl font-bold tracking-tight transition-colors" style={{ color: 'var(--color-text)' }}>
              {settings.appName}
            </h1>
          </div>
          
          <div className="flex items-center gap-6 print:hidden">
             
             {/* Live Date/Time */}
             <LiveClock />

             <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

             <div className="hidden md:flex items-center gap-2 bg-gray-100 p-1 rounded-md">
                <button 
                  onClick={() => setSettings(p => ({...p, currencyInK: !p.currencyInK}))}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${settings.currencyInK ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                  style={{ 
                    color: settings.currencyInK ? 'var(--color-primary)' : '#6b7280',
                    fontWeight: settings.currencyInK ? 'bold' : 'normal'
                  }}
                >
                  €k
                </button>
                <button 
                  onClick={() => setSettings(p => ({...p, currencyInK: !p.currencyInK}))}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${!settings.currencyInK ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                  style={{ 
                    color: !settings.currencyInK ? 'var(--color-primary)' : '#6b7280',
                    fontWeight: !settings.currencyInK ? 'bold' : 'normal'
                  }}
                >
                  Volledig
                </button>
             </div>

             <div className="flex items-center gap-2">
                <button 
                  onClick={handleReset}
                  className="p-2 rounded-full transition hover:bg-red-50 hover:text-red-600" 
                  title="Reset applicatie en wis alle data"
                  style={{ color: 'var(--color-text)' }}
                >
                    <RotateCcw className="w-5 h-5" />
                </button>

                <button 
                  onClick={handleExport}
                  className="p-2 rounded-full transition hover:bg-opacity-10 hover:bg-gray-500" 
                  title="Export PDF/Print"
                  style={{ color: 'var(--color-text)' }}
                >
                    <Download className="w-5 h-5" />
                </button>

                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 rounded-full transition hover:bg-opacity-10 hover:bg-gray-500" 
                  title="Instellingen"
                  style={{ color: 'var(--color-text)' }}
                >
                    <Settings className="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10 print:py-0 print:px-0">
        
        {/* Alerts */}
        {activeTab === 'dashboard' && isDanger && dataSources.some(d => d.type === ReportType.CASHFLOW) && (
          <div className="mb-6 bg-red-50 border-l-4 p-4 rounded shadow-sm flex items-start gap-3 print:hidden" style={{ borderColor: 'var(--color-high-risk)' }}>
             <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: 'var(--color-high-risk)' }} />
             <div>
               <h3 className="font-bold" style={{ color: 'var(--color-high-risk)' }}>Liquiditeitswaarschuwing</h3>
               <p className="text-sm" style={{ color: 'var(--color-text)' }}>Het saldo duikt onder nul in de geselecteerde periode (Laagste punt: €{lowestBalance.toLocaleString()}). Controleer de planning.</p>
             </div>
          </div>
        )}

        {/* Tab Navigation - Hidden on Print */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-gray-200 print:hidden scrollbar-hide">
           <button
             onClick={() => setActiveTab('dashboard')}
             className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors shrink-0 ${
               activeTab === 'dashboard' 
               ? 'bg-white border-x border-t border-gray-200 -mb-px relative z-10' 
               : 'text-gray-500 hover:bg-gray-100'
             }`}
             style={activeTab === 'dashboard' ? { color: 'var(--color-primary)' } : {}}
           >
             <PieChart className="w-4 h-4" />
             Dashboard
           </button>
           
           {dataSources.map(source => (
             <div key={source.id} className="relative group shrink-0">
               <button
                 onClick={() => setActiveTab(source.id)}
                 className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap pr-8 ${
                  activeTab === source.id 
                  ? 'bg-white border-x border-t border-gray-200 -mb-px relative z-10' 
                  : 'text-gray-500 hover:bg-gray-100'
                }`}
                style={activeTab === source.id ? { color: 'var(--color-primary)' } : {}}
               >
                 {source.type === ReportType.CASHFLOW ? <FileText className="w-4 h-4" /> : source.type === ReportType.EMPTY ? <Plus className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                 {source.name}
                 {source.type === ReportType.CASHFLOW && (
                    <span 
                      className={`ml-1 w-2 h-2 rounded-full ${source.isActive ? 'bg-green-400' : 'bg-gray-300'}`} 
                      title={source.isActive ? 'Actief in berekening' : 'Uitgesloten'}
                    />
                 )}
               </button>
               {/* Tab Close Button */}
               <button 
                  onClick={(e) => handleCloseTab(source.id, e)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-300 hover:text-red-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity z-20"
               >
                  <X className="w-3 h-3" />
               </button>
             </div>
           ))}

           {/* ADD TAB BUTTON */}
           <button 
             onClick={handleCreateTab}
             className="px-3 py-2 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors ml-1"
             title="Nieuw tabblad toevoegen"
           >
              <Plus className="w-5 h-5" />
           </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg rounded-tr-lg min-h-[500px] shadow-sm print:shadow-none print:min-h-0">
           
           {/* CASHFLOW DASHBOARD TAB */}
           {activeTab === 'dashboard' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                
                {/* Dashboard Controls */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm print:hidden">
                   <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                       {/* Scenario Selector */}
                       <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Scenario:</span>
                          <div className="flex bg-gray-100 p-1 rounded-md">
                            {Object.values(ScenarioType).map(type => (
                              <button
                                key={type}
                                onClick={() => setScenario(type)}
                                className={`px-3 py-1.5 text-sm font-medium rounded transition ${
                                  scenario === type 
                                  ? 'bg-white shadow' 
                                  : 'text-gray-500 hover:text-gray-700'
                                }`}
                                style={scenario === type ? { color: 'var(--color-primary)' } : {}}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                       </div>
                        
                        {/* Time Filter Selector */}
                       <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
                           <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                               <Filter className="w-3 h-3" />
                               Periode:
                           </span>
                           <select 
                                value={dateRange.type}
                                onChange={(e) => setDateRange({ ...dateRange, type: e.target.value as DateRangeType })}
                                className="px-3 py-1.5 text-sm border rounded-md focus:ring-2 outline-none cursor-pointer hover:bg-gray-50"
                                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                           >
                               <option value="7DAYS">Komende 7 dagen</option>
                               <option value="14DAYS">Komende 14 dagen</option>
                               <option value="ALL">Alle beschikbare data</option>
                               <option value="CUSTOM">Aangepast...</option>
                           </select>
                           
                           {dateRange.type === 'CUSTOM' && (
                               <div className="flex items-center gap-1">
                                   <input 
                                        type="date" 
                                        className="text-xs border rounded p-1"
                                        value={dateRange.startDate || ''}
                                        onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                                   />
                                   <span className="text-gray-400">-</span>
                                   <input 
                                        type="date" 
                                        className="text-xs border rounded p-1"
                                        value={dateRange.endDate || ''}
                                        onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                                   />
                               </div>
                           )}
                       </div>
                   </div>

                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-medium text-gray-500 hidden sm:block">Start:</span>
                         <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text)', opacity: 0.5 }}>€</span>
                            <input 
                                type="number" 
                                value={startBalance}
                                onChange={(e) => setStartBalance(Number(e.target.value))}
                                className="pl-7 pr-3 py-1.5 border rounded-md text-sm w-32 focus:ring-2 outline-none transition-shadow"
                                style={{ '--tw-ring-color': 'var(--color-primary)', color: 'var(--color-text)' } as React.CSSProperties}
                            />
                         </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                         <input 
                           type="checkbox" 
                           checked={!settings.showSmallAmounts}
                           onChange={() => setSettings(s => ({...s, showSmallAmounts: !s.showSmallAmounts}))}
                           className="rounded focus:ring-2"
                           style={{ color: 'var(--color-primary)', '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                         />
                         Verberg &lt; €{settings.smallAmountThreshold}
                      </label>
                   </div>
                </div>

                {/* Print Header - Visible only on Print */}
                <div className="hidden print:block mb-4">
                    <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Cashflow Rapportage</h2>
                    <p className="text-gray-500">Gegenereerd op {new Date().toLocaleDateString('nl-NL')} - Scenario: {scenario}</p>
                </div>

                {/* Main Visuals */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2">
                      <CashFlowChart 
                        data={forecast} 
                        settings={settings} 
                        themeColors={currentTheme.colors} 
                      />
                   </div>
                   
                   <div className="space-y-4">
                      {/* Summary Table */}
                      <div className="bg-white border rounded-lg shadow-sm overflow-hidden print:border-gray-300">
                        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center print:bg-gray-100">
                           <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Overzicht Saldo</h3>
                           <Calendar className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="divide-y max-h-[400px] overflow-y-auto print:max-h-none print:overflow-visible">
                           {forecast.map((day) => (
                             <div key={day.date} className="px-4 py-3 hover:bg-gray-50 break-inside-avoid">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                        {new Date(day.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </div>
                                    <div 
                                        className="text-sm font-bold"
                                        style={{ color: day.balance < 0 ? currentTheme.colors.highRisk : currentTheme.colors.text }}
                                    >
                                        €{day.balance.toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                   <span>In: <span style={{ color: currentTheme.colors.lowRisk }}>+€{day.incoming.toLocaleString()}</span></span>
                                   <span>Uit: <span style={{ color: currentTheme.colors.highRisk }}>-€{day.outgoing.toLocaleString()}</span></span>
                                </div>
                             </div>
                           ))}
                           {forecast.length === 0 && (
                               <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                                  <p className="mb-2">Geen data beschikbaar.</p>
                                  <p className="text-xs">Klik op "+" om een databron (Excel/CSV) toe te voegen.</p>
                               </div>
                           )}
                        </div>
                      </div>
                   </div>
                </div>
                
                <div className="print:hidden">
                    <AIConsultant forecast={forecast} scenario={scenario} />
                </div>
             </div>
           )}

           {/* DYNAMIC TABS (SOURCES) */}
           {activeTab !== 'dashboard' && (
             <div className="animate-in fade-in duration-200">
                {(() => {
                   const source = dataSources.find(s => s.id === activeTab);
                   if (!source) return null;

                   // Empty Tab Configurator
                   if (source.type === ReportType.EMPTY) {
                       return (
                           <SourceConfigurator 
                                sourceId={source.id} 
                                onConfigured={handleUpdateSource} 
                                onCancel={(id) => handleCloseTab(id, { stopPropagation: () => {} } as React.MouseEvent)} 
                           />
                       );
                   }

                   // If it's a Financial Report (Balance/PnL)
                   if (source.type === ReportType.BALANCE || source.type === ReportType.PNL) {
                       return (
                           <FinancialReport 
                                dataSource={source} 
                                settings={settings}
                                themeColors={currentTheme.colors}
                                onUpdateEntries={handleUpdateEntries}
                           />
                       );
                   }

                   // If it's a Cashflow Source
                   return (
                     <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center print:hidden">
                           <div>
                              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{source.name}</h2>
                              <p className="text-sm text-gray-500 mt-1">
                                 Beheer de brongegevens van deze lijst. Vink uit om te negeren in analyse.
                              </p>
                           </div>
                           <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition">
                              <input 
                                type="checkbox" 
                                checked={source.isActive} 
                                onChange={() => toggleSource(source.id)}
                                className="w-4 h-4 rounded focus:ring-2"
                                style={{ color: 'var(--color-primary)', '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                              />
                              <span className="font-medium text-sm text-gray-700">Gebruik in Berekening</span>
                           </label>
                        </div>
                        
                        <div className="hidden print:block mb-4">
                            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{source.name}</h2>
                        </div>
                        
                        <TransactionTable 
                          sourceId={source.id}
                          transactions={source.transactions} 
                          errors={source.errors}
                          settings={settings}
                          defaultTransactionType={source.defaultTransactionType}
                          onAddComment={handleAddComment}
                          onUpdateData={handleUpdateTransactions}
                        />
                     </div>
                   );
                })()}
             </div>
           )}

        </div>
      </main>

      {/* Settings Modal - Hidden on Print */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
           <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                 <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Instellingen</h2>
                 <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-6 space-y-6">
                 
                 {/* App Name Setting */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Applicatie Naam</label>
                    <input 
                      type="text" 
                      value={settings.appName}
                      onChange={(e) => setSettings({...settings, appName: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 outline-none"
                      style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                    />
                 </div>

                 {/* Theme Selection */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Thema & Kleurenpalet</label>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                       {THEMES.map(theme => (
                          <button
                            key={theme.id}
                            onClick={() => setSettings({...settings, activeThemeId: theme.id})}
                            className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                               settings.activeThemeId === theme.id ? 'ring-2 ring-offset-1' : 'hover:bg-gray-50'
                            }`}
                            style={{ 
                               borderColor: settings.activeThemeId === theme.id ? theme.colors.primary : '#e5e7eb',
                               '--tw-ring-color': theme.colors.primary
                            } as React.CSSProperties}
                          >
                             <span className="text-sm font-medium text-gray-800">{theme.name}</span>
                             <div className="flex gap-1">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.highRisk }} />
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.lowRisk }} />
                             </div>
                          </button>
                       ))}
                    </div>
                 </div>

              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end">
                 <button 
                   onClick={() => setShowSettingsModal(false)}
                   className="px-4 py-2 text-white rounded-md text-sm font-medium transition"
                   style={{ backgroundColor: 'var(--color-primary)' }}
                 >
                    Sluiten
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
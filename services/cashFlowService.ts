import { DailyBalance, DataSource, DateRange, ScenarioType, TransactionStatus, TransactionType, ReportType } from "../types";

export const getProjectedDate = (originalDate: string, type: TransactionType, scenario: ScenarioType): string => {
  const date = new Date(originalDate);
  if (isNaN(date.getTime())) return originalDate;
  
  // Logic: Adjust dates based on scenario
  if (type === TransactionType.DEBTOR) {
    if (scenario === ScenarioType.OPTIMISTIC) {
        // Pay on time
    } else if (scenario === ScenarioType.REALISTIC) {
        // 2 days delay average
        date.setDate(date.getDate() + 2);
    } else if (scenario === ScenarioType.PESSIMISTIC) {
        // 5 days delay
        date.setDate(date.getDate() + 5);
    }
  }
  
  if (type === TransactionType.SUBSIDY) {
      if (scenario === ScenarioType.PESSIMISTIC) {
          // 7 days delay for confirmed subsidies
          date.setDate(date.getDate() + 7);
      }
  }

  return date.toISOString().split('T')[0];
};

const getRangeBoundaries = (range: DateRange, activeTransactions: any[]): { start: Date, end: Date } => {
  const today = new Date();
  
  if (range.type === '7DAYS') {
    const end = new Date(today);
    end.setDate(today.getDate() + 6);
    return { start: today, end };
  }
  
  if (range.type === '14DAYS') {
    const end = new Date(today);
    end.setDate(today.getDate() + 13);
    return { start: today, end };
  }
  
  if (range.type === 'CUSTOM' && range.startDate && range.endDate) {
    return { start: new Date(range.startDate), end: new Date(range.endDate) };
  }

  if (range.type === 'ALL') {
    if (activeTransactions.length === 0) {
      const end = new Date(today);
      end.setDate(today.getDate() + 6);
      return { start: today, end };
    }

    const dates = activeTransactions.map(t => new Date(t.date).getTime()).filter(d => !isNaN(d));
    
    if (dates.length === 0) {
       return { start: today, end: today };
    }

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return { start: minDate, end: maxDate };
  }

  // Default fallback
  const end = new Date(today);
  end.setDate(today.getDate() + 6);
  return { start: today, end };
};

export const calculateForecast = (
  startBalance: number,
  sources: DataSource[],
  scenario: ScenarioType,
  dateRange: DateRange
): DailyBalance[] => {
  const activeTransactions = sources
    .filter(s => s.isActive && s.type === ReportType.CASHFLOW)
    .flatMap(s => s.transactions);

  const { start, end } = getRangeBoundaries(dateRange, activeTransactions);
  
  const forecast: DailyBalance[] = [];
  
  let currentBalance = startBalance;
  
  // Normalize dates to remove time components for comparison
  const startDate = new Date(start);
  startDate.setHours(0,0,0,0);
  
  const endDate = new Date(end);
  endDate.setHours(0,0,0,0);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return [];

  // Iterate day by day from start to end
  const loopDate = new Date(startDate);
  
  // Safety break for loop
  let iterations = 0;
  while (loopDate <= endDate && iterations < 3650) { 
    const dateStr = loopDate.toISOString().split('T')[0];

    let dailyIncoming = 0;
    let dailyOutgoing = 0;
    
    const details = {
      debtors: 0,
      creditors: 0,
      variableCosts: 0,
      fixedCosts: 0,
      vat: 0,
      subsidies: 0
    };

    activeTransactions.forEach(tx => {
       const projectedDate = getProjectedDate(tx.date, tx.type, scenario);
       
       if (projectedDate === dateStr) {
         
         // SCENARIO LOGIC
         if (tx.type === TransactionType.SUBSIDY && tx.status === TransactionStatus.PENDING) {
             if (scenario !== ScenarioType.OPTIMISTIC) return; 
         }

         if ([TransactionType.DEBTOR, TransactionType.SUBSIDY, TransactionType.ONE_OFF].includes(tx.type)) {
            dailyIncoming += tx.amount;
            if (tx.type === TransactionType.DEBTOR) details.debtors += tx.amount;
            if (tx.type === TransactionType.SUBSIDY) details.subsidies += tx.amount;
         } else {
            dailyOutgoing += tx.amount;
            if (tx.type === TransactionType.CREDITOR) details.creditors += tx.amount;
            if (tx.type === TransactionType.COST) details.variableCosts += tx.amount;
            if (tx.type === TransactionType.FIXED) details.fixedCosts += tx.amount;
            if (tx.type === TransactionType.VAT) details.vat += tx.amount;
         }
       }
    });

    currentBalance = currentBalance + dailyIncoming - dailyOutgoing;

    forecast.push({
      date: dateStr,
      incoming: dailyIncoming,
      outgoing: dailyOutgoing,
      balance: currentBalance,
      details
    });

    loopDate.setDate(loopDate.getDate() + 1);
    iterations++;
  }

  return forecast;
};

// Return empty to strictly enforce user uploaded data only
export const generateMockData = (): DataSource[] => {
  return [];
};
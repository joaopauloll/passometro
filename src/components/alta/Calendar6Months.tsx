import React from "react";

const MONTH_NAMES = [
  "", "JAN", "FEV", "MAR", "ABR", "MAI", "JUN", 
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"
];
const DAY_NAMES = ["D", "S", "T", "Q", "Q", "S", "S"];

interface MonthData {
  year: number;
  month: number;
}

export default function Calendar6Months() {
  const now = new Date();
  const startMonth = now.getMonth() + 1;
  const startYear = now.getFullYear();
  const today = now.getDate();

  const months: MonthData[] = [];
  
  for (let i = 0; i < 6; i++) {
    let m = startMonth + i;
    let y = startYear;
    while (m > 12) { 
      m -= 12; 
      y += 1; 
    }
    months.push({ year: y, month: m });
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {months.map(({ year, month }) => {
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        
        const cells: (number | null)[] = [];
        
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        
        const isCurrentMonth = month === startMonth && year === startYear;

        return (
          <div 
            key={`${year}-${month}`} 
            className="border rounded p-1"
            style={{ borderColor: "#94a3b8" }} // Forçando cor HEX para o html2canvas
          >
            <div 
              className="text-center font-bold text-[9px] mb-[3px] uppercase tracking-wider"
              style={{ color: "#0f766e" }} // Forçando cor HEX
            >
              {MONTH_NAMES[month]} {year}
            </div>
            
            <div className="grid grid-cols-7 gap-[1px] text-center">
              {DAY_NAMES.map((d, i) => (
                <div key={`day-name-${i}`} className="font-bold text-[7px]" style={{ color: "#64748b" }}>
                  {d}
                </div>
              ))}
              
              {cells.map((c, i) => {
                const isToday = isCurrentMonth && c === today;
                return (
                  <div 
                    key={`cell-${i}`} 
                    className={`text-[7px] py-[1px] rounded-sm ${isToday ? "font-bold" : ""}`}
                    style={{
                      color: !c ? "transparent" : "#1e293b",
                      backgroundColor: isToday ? "#ccfbf1" : "transparent"
                    }}
                  >
                    {c || "0"}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
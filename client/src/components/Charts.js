import React from 'react';

export function CategoryDoughnut({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-6 text-xs text-gray-500 font-medium">No category statistics available</div>;
  }

  const totalQty = data.reduce((acc, c) => acc + c.totalQuantity, 0);

  // Curated eco green color themes
  const colors = [
    'bg-emerald-600', 'bg-teal-600', 'bg-emerald-500', 'bg-green-600', 
    'bg-amber-500', 'bg-indigo-600', 'bg-teal-500', 'bg-emerald-700'
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Category Distribution</h3>
      <div className="space-y-3">
        {data.map((item, idx) => {
          const percent = totalQty > 0 ? (item.totalQuantity / totalQty) * 100 : 0;
          const colorClass = colors[idx % colors.length];

          return (
            <div key={item.category} className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-800">{item.category}</span>
                <span className="text-emerald-800">
                  {item.totalQuantity} kg ({percent.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div
                  className={`h-full ${colorClass} rounded-full transition-all`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MonthlyBarChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-6 text-xs text-gray-500 font-medium">No monthly volume data available</div>;
  }

  const maxVal = Math.max(...data.map(d => d.carbonSaved), 1);

  return (
    <div className="space-y-4 w-full">
      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Carbon Offset (kg CO₂)</h3>
      <div className="flex items-end justify-between h-48 pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-2xl relative">
        {/* Background guides */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 opacity-10">
          <div className="border-t border-gray-900 w-full"></div>
          <div className="border-t border-gray-900 w-full"></div>
          <div className="border-t border-gray-900 w-full"></div>
        </div>

        {data.map((d, index) => {
          const heightPercent = (d.carbonSaved / maxVal) * 100;

          return (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div className="relative w-full flex justify-center mb-1">
                {/* Tooltip */}
                <span className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 bg-gray-900 text-[10px] text-white font-bold px-2 py-1 rounded-md shadow-md transition-all z-10 whitespace-nowrap">
                  {d.carbonSaved} kg
                </span>
                <div
                  className="w-8 rounded-t-lg bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                  style={{ height: `${Math.max(8, heightPercent)}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-extrabold text-gray-700 mt-2">{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

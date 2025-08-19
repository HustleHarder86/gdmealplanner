"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar
} from 'recharts';

interface NutritionData {
  date: string;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  calories: number;
  carbTarget: number;
  proteinTarget: number;
  fatTarget: number;
}

interface NutritionProgressChartProps {
  data: NutritionData[];
  chartType?: 'weekly' | 'daily' | 'macro-pie';
  showTargets?: boolean;
}

export default function NutritionProgressChart({ 
  data, 
  chartType = 'weekly',
  showTargets = true 
}: NutritionProgressChartProps) {

  // Macro breakdown for pie chart
  const latestData = data[data.length - 1] || {
    carbs: 0, protein: 0, fat: 0, calories: 0
  };

  const macroData = [
    { 
      name: 'Carbs', 
      value: latestData.carbs * 4, // 4 cal per gram
      percentage: Math.round((latestData.carbs * 4 / latestData.calories) * 100),
      color: '#3b82f6',
      target: 45 // 45% target
    },
    { 
      name: 'Protein', 
      value: latestData.protein * 4, // 4 cal per gram
      percentage: Math.round((latestData.protein * 4 / latestData.calories) * 100),
      color: '#10b981',
      target: 25 // 25% target
    },
    { 
      name: 'Fat', 
      value: latestData.fat * 9, // 9 cal per gram
      percentage: Math.round((latestData.fat * 9 / latestData.calories) * 100),
      color: '#f59e0b',
      target: 30 // 30% target
    }
  ];

  // Weekly progress data
  const weeklyData = data.map(day => ({
    ...day,
    date: new Date(day.date).toLocaleDateString('en-US', { 
      weekday: 'short' 
    }),
    carbsPercent: Math.round((day.carbs / day.carbTarget) * 100),
    proteinPercent: Math.round((day.protein / day.proteinTarget) * 100),
    fatPercent: Math.round((day.fat / day.fatTarget) * 100)
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-neutral-200">
          <p className="font-semibold text-neutral-800 mb-3">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium">{entry.dataKey}</span>
                </div>
                <span className="text-sm font-bold">{entry.value}g</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const MacroPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-neutral-200">
          <p className="font-semibold text-neutral-800 mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm"><strong>{data.percentage}%</strong> of calories</p>
            <p className="text-xs text-neutral-600">{Math.round(data.value / (data.name === 'Fat' ? 9 : 4))}g consumed</p>
            <p className="text-xs text-neutral-500">Target: {data.target}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartType === 'macro-pie') {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-neutral-800">Macro Distribution</h3>
            <p className="text-sm text-neutral-600">Today's macronutrient breakdown</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-neutral-800">{latestData.calories}</div>
            <div className="text-xs text-neutral-600">total calories</div>
          </div>
        </div>

        <div className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={macroData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {macroData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<MacroPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {macroData.map((macro, index) => (
            <div key={index} className="text-center p-3 rounded-lg bg-neutral-50">
              <div 
                className="w-4 h-4 rounded-full mx-auto mb-2" 
                style={{ backgroundColor: macro.color }}
              />
              <div className="font-semibold text-sm text-neutral-800">{macro.name}</div>
              <div className="text-lg font-bold" style={{ color: macro.color }}>
                {macro.percentage}%
              </div>
              <div className="text-xs text-neutral-600">Target: {macro.target}%</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-neutral-800">
            {chartType === 'weekly' ? 'Weekly Nutrition Trends' : 'Daily Nutrition Progress'}
          </h3>
          <p className="text-sm text-neutral-600">
            Carbohydrates, protein, and fat intake
          </p>
        </div>
      </div>

      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Bar dataKey="carbs" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="protein" fill="#10b981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="fat" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            
            {showTargets && (
              <>
                <Bar dataKey="carbTarget" fill="#3b82f6" fillOpacity={0.3} radius={[2, 2, 0, 0]} />
                <Bar dataKey="proteinTarget" fill="#10b981" fillOpacity={0.3} radius={[2, 2, 0, 0]} />
                <Bar dataKey="fatTarget" fill="#f59e0b" fillOpacity={0.3} radius={[2, 2, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span>Carbs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>Protein</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded-full" />
          <span>Fat</span>
        </div>
        {showTargets && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-neutral-300 rounded-full" />
            <span>Targets</span>
          </div>
        )}
      </div>
    </div>
  );
}
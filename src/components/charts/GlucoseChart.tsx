"use client";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';

interface GlucoseReading {
  time: string;
  value: number;
  mealType: string;
  notes?: string;
  timestamp: Date;
}

interface GlucoseChartProps {
  data: GlucoseReading[];
  targetRanges?: {
    fasting: { min: number; max: number };
    postMeal: { min: number; max: number };
  };
  showTargetZones?: boolean;
  timeRange?: '24h' | '7d' | '30d';
}

export default function GlucoseChart({ 
  data, 
  targetRanges = {
    fasting: { min: 70, max: 95 },
    postMeal: { min: 70, max: 140 }
  },
  showTargetZones = true,
  timeRange = '24h'
}: GlucoseChartProps) {
  
  const formatTime = (time: string) => {
    const date = new Date(time);
    if (timeRange === '24h') {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isHigh = data.value > targetRanges.postMeal.max;
      const isLow = data.value < targetRanges.fasting.min;
      
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-neutral-200">
          <p className="font-semibold text-neutral-800 mb-2">
            {formatTime(label)}
          </p>
          <div className="space-y-1">
            <p className={`font-bold text-lg ${
              isHigh ? 'text-red-600' : 
              isLow ? 'text-blue-600' : 
              'text-green-600'
            }`}>
              {data.value} mg/dL
            </p>
            <p className="text-sm text-neutral-600">
              📍 {data.mealType}
            </p>
            {data.notes && (
              <p className="text-xs text-neutral-500 mt-2 italic">
                💬 {data.notes}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {isHigh && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Above target</span>}
              {isLow && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Below target</span>}
              {!isHigh && !isLow && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">In range</span>}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getLineColor = (value: number) => {
    if (value > targetRanges.postMeal.max) return '#dc2626'; // red
    if (value < targetRanges.fasting.min) return '#2563eb'; // blue
    return '#059669'; // green
  };

  // Calculate statistics
  const stats = {
    average: Math.round(data.reduce((sum, reading) => sum + reading.value, 0) / data.length),
    inRange: data.filter(reading => 
      reading.value >= targetRanges.fasting.min && 
      reading.value <= targetRanges.postMeal.max
    ).length,
    total: data.length
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-neutral-800">Blood Glucose Trends</h3>
          <p className="text-sm text-neutral-600">
            {timeRange === '24h' ? 'Last 24 hours' : 
             timeRange === '7d' ? 'Last 7 days' : 
             'Last 30 days'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-neutral-800">
            {Math.round((stats.inRange / stats.total) * 100)}%
          </div>
          <div className="text-xs text-neutral-600">in target range</div>
        </div>
      </div>

      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            
            {/* Target zone backgrounds */}
            {showTargetZones && (
              <>
                <defs>
                  <linearGradient id="targetZone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey={() => targetRanges.postMeal.max}
                  fill="url(#targetZone)"
                  stroke="none"
                />
              </>
            )}
            
            <XAxis 
              dataKey="time" 
              tickFormatter={formatTime}
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              domain={['dataMin - 10', 'dataMax + 10']}
              stroke="#64748b"
              fontSize={12}
            />
            
            {/* Target range reference lines */}
            <ReferenceLine 
              y={targetRanges.fasting.max} 
              stroke="#10b981" 
              strokeDasharray="5 5" 
              label={{ value: "Target Max", position: "right" }}
            />
            <ReferenceLine 
              y={targetRanges.fasting.min} 
              stroke="#10b981" 
              strokeDasharray="5 5"
              label={{ value: "Target Min", position: "right" }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: '#6366f1' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
        <div className="text-center">
          <div className="text-xl font-bold text-neutral-800">{stats.average}</div>
          <div className="text-xs text-neutral-600">avg mg/dL</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">{stats.inRange}</div>
          <div className="text-xs text-neutral-600">in range</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-neutral-800">{stats.total}</div>
          <div className="text-xs text-neutral-600">total readings</div>
        </div>
      </div>
    </div>
  );
}
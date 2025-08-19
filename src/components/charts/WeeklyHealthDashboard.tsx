"use client";

import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell
} from 'recharts';

interface HealthMetric {
  date: string;
  glucoseAvg: number;
  carbsIntake: number;
  exerciseMinutes: number;
  weight: number;
  moodScore: number; // 1-5 scale
  adherenceScore: number; // 0-100%
  waterIntake: number;
}

interface WeeklyHealthDashboardProps {
  data: HealthMetric[];
}

export default function WeeklyHealthDashboard({ data }: WeeklyHealthDashboardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const chartData = data.map(day => ({
    ...day,
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    fullDate: formatDate(day.date)
  }));

  // Calculate weekly averages
  const weeklyStats = {
    avgGlucose: Math.round(data.reduce((sum, day) => sum + day.glucoseAvg, 0) / data.length),
    avgCarbs: Math.round(data.reduce((sum, day) => sum + day.carbsIntake, 0) / data.length),
    totalExercise: data.reduce((sum, day) => sum + day.exerciseMinutes, 0),
    avgAdherence: Math.round(data.reduce((sum, day) => sum + day.adherenceScore, 0) / data.length),
    avgMood: Math.round((data.reduce((sum, day) => sum + day.moodScore, 0) / data.length) * 10) / 10,
    avgWater: Math.round(data.reduce((sum, day) => sum + day.waterIntake, 0) / data.length)
  };

  // Adherence data for radial chart
  const adherenceData = [
    { name: 'Adherence', value: weeklyStats.avgAdherence, fill: '#10b981' },
    { name: 'Gap', value: 100 - weeklyStats.avgAdherence, fill: '#f1f5f9' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-neutral-200">
          <p className="font-semibold text-neutral-800 mb-3">{data.fullDate}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium capitalize">
                    {entry.dataKey.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <span className="text-sm font-bold">
                  {entry.value}
                  {entry.dataKey === 'glucoseAvg' ? ' mg/dL' : 
                   entry.dataKey === 'carbsIntake' ? 'g' :
                   entry.dataKey === 'exerciseMinutes' ? ' min' :
                   entry.dataKey === 'weight' ? ' lbs' :
                   entry.dataKey === 'moodScore' ? '/5' :
                   entry.dataKey === 'waterIntake' ? ' glasses' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 4.5) return '😊';
    if (score >= 3.5) return '🙂';
    if (score >= 2.5) return '😐';
    if (score >= 1.5) return '😕';
    return '😞';
  };

  return (
    <div className="space-y-6">
      {/* Weekly Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              🩸
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-800">{weeklyStats.avgGlucose}</div>
              <div className="text-xs text-neutral-600">avg glucose</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              🌾
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-800">{weeklyStats.avgCarbs}g</div>
              <div className="text-xs text-neutral-600">avg carbs</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              🏃‍♀️
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-800">{weeklyStats.totalExercise}</div>
              <div className="text-xs text-neutral-600">total exercise</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              {getMoodEmoji(weeklyStats.avgMood)}
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-800">{weeklyStats.avgMood}/5</div>
              <div className="text-xs text-neutral-600">avg mood</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Glucose & Carbs Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-800 mb-4">
            Glucose & Carbs Correlation
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                
                <Line
                  type="monotone"
                  dataKey="glucoseAvg"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="carbsIntake"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-sm mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>Avg Glucose (mg/dL)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Carbs Intake (g)</span>
            </div>
          </div>
        </div>

        {/* Weekly Adherence Radial */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-800 mb-4">
            Plan Adherence
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="90%" 
                data={[{ name: 'Adherence', value: weeklyStats.avgAdherence }]}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  fill={weeklyStats.avgAdherence >= 80 ? '#10b981' : 
                       weeklyStats.avgAdherence >= 60 ? '#f59e0b' : '#ef4444'}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-neutral-800 mb-1">
              {weeklyStats.avgAdherence}%
            </div>
            <div className="text-sm text-neutral-600">Weekly Average</div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mt-2 ${
              weeklyStats.avgAdherence >= 80 ? 'nutrition-success' :
              weeklyStats.avgAdherence >= 60 ? 'nutrition-warning' : 
              'nutrition-danger'
            }`}>
              {weeklyStats.avgAdherence >= 80 ? '🎯 Excellent' :
               weeklyStats.avgAdherence >= 60 ? '⚠️ Good' : 
               '🔴 Needs Focus'}
            </div>
          </div>
        </div>

        {/* Activity & Mood Area Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-800 mb-4">
            Activity & Wellbeing
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="exerciseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                
                <Area
                  type="monotone"
                  dataKey="exerciseMinutes"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#exerciseGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="moodScore"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#moodGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-sm mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              <span>Exercise (min)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span>Mood Score</span>
            </div>
          </div>
        </div>

        {/* Hydration Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-800 mb-4">
            Daily Hydration
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                
                <Area
                  type="monotone"
                  dataKey="waterIntake"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#waterGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
            <div className="text-2xl font-bold text-cyan-600">
              {weeklyStats.avgWater} glasses
            </div>
            <div className="text-sm text-neutral-600">daily average</div>
            <div className="text-xs text-neutral-500 mt-1">
              Target: 8 glasses per day
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
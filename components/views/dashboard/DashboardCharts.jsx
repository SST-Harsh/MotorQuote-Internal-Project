'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Theme Colors
// Theme Colors - Updated for Reference Design
const COLORS = {
  primary: '#CCFF00', // Lime Green
  secondary: '#ef4444', // Red (for Sales/Inventory drops)
  tertiary: '#22c55e', // Green (for positive/growth)
  surface: '#FFFFFF',
  text: '#111827',
  textMuted: '#9CA3AF',
  grid: '#F3F4F6',
  tooltipBg: '#111827',
  tooltipText: '#F9FAFB',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl shadow-xl z-50">
        <p className="text-gray-400 text-xs mb-1 font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const TopDealersChart = ({ data }) => {
  // Mock data with multiple lines
  const chartData = data || [
    { name: 'Mon', value1: 40, value2: 24, value3: 35 },
    { name: 'Tue', value1: 30, value2: 13, value3: 45 },
    { name: 'Wed', value1: 60, value2: 45, value3: 35 },
    { name: 'Thu', value1: 70, value2: 39, value3: 65 },
    { name: 'Fri', value1: 50, value2: 48, value3: 55 },
    { name: 'Sat', value1: 90, value2: 38, value3: 45 },
    { name: 'Sun', value1: 85, value2: 43, value3: 60 },
  ];

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
          <XAxis
            dataKey="name"
            stroke={COLORS.textMuted}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis stroke={COLORS.textMuted} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />

          <Line
            name="Motor4U"
            type="monotone"
            dataKey="value1"
            stroke={COLORS.secondary} // Red
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: COLORS.surface, stroke: COLORS.secondary, strokeWidth: 2 }}
          />
          <Line
            name="BINCA"
            type="monotone"
            dataKey="value2"
            stroke={COLORS.tertiary} // Green
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: COLORS.surface, stroke: COLORS.tertiary, strokeWidth: 2 }}
          />
          <Line
            name="TT50"
            type="monotone"
            dataKey="value3"
            stroke={COLORS.primary} // Lime
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: COLORS.surface, stroke: COLORS.primary, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SalesBySegmentChart = ({ data }) => {
  const chartData = data || [
    { name: 'A', value: 200 },
    { name: 'B', value: 350 },
    { name: 'C', value: 250 },
    { name: 'D', value: 450 },
    { name: 'E', value: 300 },
    { name: 'F', value: 150 },
  ];

  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={COLORS.secondary}
            fillOpacity={1}
            fill="url(#colorSales)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const InventoryChart = ({ data }) => {
  const chartData = data || [
    { name: 'A', value: 300 },
    { name: 'B', value: 450 },
    { name: 'C', value: 200 },
    { name: 'D', value: 400 },
    { name: 'E', value: 350 },
  ];

  return (
    <div className="h-[100px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorInventory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={COLORS.secondary}
            fillOpacity={1}
            fill="url(#colorInventory)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const UnitSoldDonutChart = ({ data }) => {
  const chartData = data || [
    { name: 'Luxury', value: 400 },
    { name: 'Sedan', value: 300 },
    { name: 'SUV', value: 300 },
    { name: 'Truck', value: 200 },
  ];
  const DONUT_COLORS = [COLORS.primary, COLORS.tertiary, '#f59e0b', COLORS.secondary];

  return (
    <div className="h-[220px] w-full flex items-center justify-center relative">
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-gray-900">75%</span>
        <span className="text-xs text-gray-500 font-medium">Segment</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            cornerRadius={10}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SalesVelocityChart = ({ data, color }) => {
  const chartColor = color === 'green' ? COLORS.tertiary : COLORS.secondary; // Green or Red
  const chartData = data || [
    { name: 'Mon', velocity: 20 },
    { name: 'Tue', velocity: 40 },
    { name: 'Wed', velocity: 30 },
    { name: 'Thu', velocity: 60 },
    { name: 'Fri', velocity: 50 },
    { name: 'Sat', velocity: 80 },
    { name: 'Sun', velocity: 70 },
  ];

  return (
    <div className="h-[80px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`colorVelocity-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="velocity"
            stroke={chartColor}
            fillOpacity={1}
            fill={`url(#colorVelocity-${color})`}
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

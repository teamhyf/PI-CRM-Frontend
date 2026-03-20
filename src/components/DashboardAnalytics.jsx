import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const PALETTE = [
  '#4f46e5',
  '#2563eb',
  '#7c3aed',
  '#0891b2',
  '#059669',
  '#ca8a04',
  '#ea580c',
  '#dc2626',
  '#db2777',
  '#65a30d',
];

function ChartCard({ title, subtitle, children, empty }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col min-h-[360px]">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {subtitle ? <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p> : null}
      </div>
      <div className="flex-1 min-h-[280px]">
        {empty ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl">
            No data to display yet
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  fontSize: '12px',
};

export function DashboardAnalytics({ overview }) {
  if (!overview) return null;

  const {
    casesByStatus = [],
    leadsByStatus = [],
    casesByMonth = [],
    accidentTypes = [],
    settlementByDemand = [],
  } = overview;

  const hasCases = casesByStatus.some((d) => d.value > 0);
  const hasLeads = leadsByStatus.some((d) => d.value > 0);
  const hasMonths = casesByMonth.some((d) => d.count > 0);
  const hasAccidents = accidentTypes.some((d) => d.count > 0);
  const hasSettlement = settlementByDemand.some((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      <ChartCard
        title="PI cases by status"
        subtitle="Live counts from your case database"
        empty={!hasCases}
      >
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={casesByStatus}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={96}
              paddingAngle={2}
              label={false}
            >
              {casesByStatus.map((_, i) => (
                <Cell key={`c-${i}`} fill={PALETTE[i % PALETTE.length]} stroke="#fff" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Cases']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Leads pipeline"
        subtitle="Intake leads by workflow status"
        empty={!hasLeads}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={leadsByStatus} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={70} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Leads']} />
            <Bar dataKey="value" name="Leads" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="New cases over time"
        subtitle="Cases created per month (last 8 months)"
        empty={!hasMonths}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={casesByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Cases']} />
            <Bar dataKey="count" name="New cases" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Accident types"
        subtitle="Top categories across all PI cases"
        empty={!hasAccidents}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={accidentTypes}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 10 }}
              interval={0}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [v, 'Cases']}
              labelFormatter={(_, payload) => (payload && payload[0]?.payload?.fullName) || ''}
            />
            <Bar dataKey="count" name="Cases" fill="#7c3aed" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {hasSettlement ? (
        <div className="xl:col-span-2">
          <ChartCard
            title="Settlement tracker"
            subtitle="Demand / negotiation stage across cases"
            empty={false}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={settlementByDemand} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-16} textAnchor="end" height={72} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Cases']} />
                <Bar dataKey="value" name="Cases" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      ) : null}
    </div>
  );
}

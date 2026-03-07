import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, UserPlus, Stethoscope, 
  FileText, Bell, Search, MessageSquare,
  BedDouble, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { statsAPI, staffAPI } from '../../services/api';
import Loader from '../loader/Loader';

// ─── Greeting helper ──────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ─── Pure-SVG Area Chart ──────────────────────────────────────────────────────
function ActivityChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
        No data yet — patients will appear here once registered
      </div>
    );
  }

  const W = 660, H = 155, pad = { t: 16, r: 16, b: 28, l: 36 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  const toX = i => pad.l + (i / (data.length - 1)) * innerW;
  const toY = v => pad.t + innerH - (v / maxVal) * innerH;

  const pts = data.map((d, i) => [toX(i), toY(d.value)]);
  const path = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`;
    const [px, py] = pts[i - 1];
    const cpx = (px + x) / 2;
    return `${acc} C ${cpx},${py} ${cpx},${y} ${x},${y}`;
  }, '');

  const areaPath = `${path} L ${pts[pts.length - 1][0]},${pad.t + innerH} L ${pts[0][0]},${pad.t + innerH} Z`;
  const avgVal = Math.round(maxVal * 0.65);
  const avgY = toY(avgVal);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 155 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={pad.l} y1={pad.t + innerH * (1 - f)} x2={pad.l + innerW} y2={pad.t + innerH * (1 - f)}
          stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />
      ))}

      {/* Y labels */}
      {[0, 0.5, 1].map(f => (
        <text key={f} x={pad.l - 4} y={pad.t + innerH * (1 - f) + 4} textAnchor="end" fontSize="9" fill="#c3c4ca">
          {Math.round(maxVal * f)}
        </text>
      ))}

      {/* Average dashed */}
      <line x1={pad.l} y1={avgY} x2={pad.l + innerW} y2={avgY}
        stroke="#818cf8" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.5" />
      <text x={pad.l + innerW + 3} y={avgY + 4} fontSize="9" fill="#818cf8" fontWeight="600">{avgVal}</text>

      {/* Area */}
      <path d={areaPath} fill="url(#areaGrad)" />
      {/* Line */}
      <path d={path} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" stroke="white" strokeWidth="1.5" opacity="0.8" />
      ))}

      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.label}</text>
      ))}
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const Wave = ({ color = '#818cf8' }) => (
  <svg viewBox="0 0 80 30" className="w-20 h-7">
    <path d="M0,20 C10,10 20,28 30,18 C40,8 50,26 60,14 C70,4 75,20 80,16"
      fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function StatCard({ label, value, icon: Icon, gradient }) {
  if (gradient) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white flex flex-col justify-between shadow-lg shadow-indigo-200">
        <p className="text-indigo-100 text-sm font-medium">{label}</p>
        <p className="text-4xl font-bold mt-2">{value}</p>
        <Wave color="rgba(255,255,255,0.5)" />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4 hover:shadow-md transition-shadow">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-7 h-7 text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
      <Wave />
    </div>
  );
}

// ─── Month names ──────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function buildMonthlyChartData(rawMonthly) {
  // Fill all 12 months, even zero ones
  const map = {};
  (rawMonthly || []).forEach(r => { map[r.month] = Number(r.count); });
  return Array.from({ length: 12 }, (_, i) => ({
    label: MONTH_NAMES[i],
    value: map[i + 1] || 0,
  }));
}

function buildWeeklyChartData(rawWeekly) {
  // Last 7 days in order
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const match = (rawWeekly || []).find(r => r.date?.split('T')[0] === dateStr);
    result.push({ label: DOW_NAMES[d.getDay()], value: match ? Number(match.count) : 0 });
  }
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [period, setPeriod] = useState('Month');
  const [stats, setStats] = useState(null);
  const [receptionists, setReceptionists] = useState([]);
  const [listOpen, setListOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await statsAPI.getDashboardStats();
      setStats(res?.data || res);   // interceptor returns {success, data, message} — unwrap .data
    } catch (e) {
      console.error('Dashboard stats error:', e);
    } finally {
      setLoading(false);
    }
    if (user?.accessible_modules?.includes('register_receptionist')) {
      try {
        const r = await staffAPI.getReceptionists();
        setReceptionists(r?.data?.receptionists || []);
      } catch {}
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build chart data from real backend data
  const chartData = period === 'Month'
    ? buildMonthlyChartData(stats?.chart?.monthly)
    : buildWeeklyChartData(stats?.chart?.weekly);

  const dateRange = period === 'Month'
    ? `Jan – Dec ${new Date().getFullYear()}`
    : 'Last 7 Days';

  const statCards = [
    { label: "Today's Patients", value: stats?.patients?.today ?? 0, icon: BedDouble },
    { label: 'Total Patients',   value: stats?.patients?.total ?? 0, icon: Users },
    { label: 'Active Staff',     value: stats?.staff?.active  ?? 0, icon: UserCheck },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {loading && <Loader message="Fetching dashboard stats..." />}

      {/* Greeting bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {getGreeting()},{' '}
            <span className="text-indigo-500">{user?.name}</span>
          </h2>
          <p className="text-gray-400 text-sm">
            {user?.role === 'doctor' ? "Your patients are waiting — let's have a great day!" : 'Ready to manage today\'s appointments?'}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><Bell className="w-5 h-5" /></button>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><MessageSquare className="w-5 h-5" /></button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ml-1">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
        <StatCard label="Total Consultations" value={stats?.consultations?.total ?? 0} gradient />
      </div>

      {/* Chart + Side Panel */}
      <div className="flex flex-1 gap-4 min-h-0">

        {/* Activity Chart Card */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Patient Registrations</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{dateRange}</p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 space-x-1">
              {['Week', 'Month'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${period === p ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : (
            <div className="flex-1 flex items-end">
              <ActivityChart data={chartData} />
            </div>
          )}
        </div>

        {/* Staff / Quick-access Panel */}
        <div className="w-64 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">
              {user?.role === 'admin' ? 'Staff List' : 'Quick Access'}
            </p>
            <div className="flex space-x-1">
              <button onClick={() => setListOpen(true)}
                className={`p-1 rounded ${listOpen ? 'text-indigo-500' : 'text-gray-300'}`}><ChevronDown className="w-4 h-4" /></button>
              <button onClick={() => setListOpen(false)}
                className={`p-1 rounded ${!listOpen ? 'text-indigo-500' : 'text-gray-300'}`}><ChevronUp className="w-4 h-4" /></button>
            </div>
          </div>

          {listOpen && (
            <div className="space-y-2 flex-1 overflow-y-auto">
              {user?.role === 'admin' && receptionists.length > 0
                ? receptionists.map(r => (
                    <div key={r.id} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer group">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600">{r.name}</p>
                        <p className={`text-xs ${r.status === 'active' ? 'text-green-500' : 'text-gray-400'}`}>
                          {r.status === 'active' ? '● Active' : '○ Inactive'}
                        </p>
                      </div>
                    </div>
                  ))
                : [
                    { name: 'New Consultation', icon: FileText,    path: '/receptionist-audio', mod: 'new_consultation',    color: 'from-blue-400 to-blue-500' },
                    { name: 'Doctor Assistant', icon: Stethoscope, path: '/doctor-audio',        mod: 'doctor_assistant',   color: 'from-green-400 to-emerald-500' },
                    { name: 'Patient Records',  icon: Users,       path: '/patient-records',     mod: 'patient_records',    color: 'from-purple-400 to-violet-500' },
                    { name: 'Register Doctor',  icon: UserPlus,    path: '/register-doctor',     mod: 'register_doctor', color: 'from-orange-400 to-red-500' },
                    { name: 'Register Receptionist', icon: UserPlus, path: '/register-receptionist', mod: 'register_receptionist', color: 'from-orange-400 to-red-500' },
                  ].filter(a => !a.mod || user?.accessible_modules?.includes(a.mod))
                   .map(a => (
                    <div key={a.name} onClick={() => navigate(a.path)}
                      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer group">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center flex-shrink-0`}>
                        <a.icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600">{a.name}</p>
                    </div>
                  ))
              }

              {user?.role === 'admin' && receptionists.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-xs">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  No staff registered yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

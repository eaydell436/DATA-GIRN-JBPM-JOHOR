import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Ticket,
  Search,
  X,
  Filter,
  Zap,
  Clock,
  BarChart3,
  PieChart,
  Table2,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  Flame,
  Shield,
  Siren,
  BadgeCheck,
  Wrench,
  Trash2,
  Truck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

// ============================================
// CONSTANTS
// ============================================
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGUzVyeUmHfSW65OMonkjq0VRzBs0zDqpgWDCVaN_ba07ANW34ix3M8AhCErROdQv3ixNqi8qhKgGg/pub?gid=0&single=true&output=csv';
const AUTO_REFRESH_INTERVAL = 6 * 60 * 60 * 1000;

const STATUS_COLORS = {
  BAIK: '#00C853',
  ROSAK: '#FF1744',
  'TIDAK DIJUMPAI': '#FFC107',
  'TIDAK DAPAT DIUJI': '#7C4DFF',
  'BER - TINDAKAN SAPURA': '#448AFF',
  'BER - TINDAKAN JABATAN': '#00B8D4',
  'BER - SELESAI PROSES PELUPUSAN': '#9E9E9E',
};

const PIE_COLORS = [
  '#CC0000',
  '#FFC107',
  '#00C853',
  '#448AFF',
  '#7C4DFF',
  '#FF6D00',
  '#00B8D4',
  '#FF4081',
  '#64DD17',
  '#FFD740',
  '#536DFE',
  '#78909C',
];

const STATUS_ICONS = {
  BAIK: CheckCircle2,
  ROSAK: AlertCircle,
  'TIDAK DIJUMPAI': HelpCircle,
  'TIDAK DAPAT DIUJI': Wrench,
  'BER - TINDAKAN SAPURA': Truck,
  'BER - TINDAKAN JABATAN': Shield,
  'BER - SELESAI PROSES PELUPUSAN': Trash2,
  'TIADA DATA': HelpCircle,
};

// ============================================
// HELPERS
// ============================================
const extractMonthlyColumns = (headers) => {
  const monthNames = [
    'JUN 2026',
    'MEI 2026',
    'APRIL 2026',
    'MAC 2026',
    'FEB 2026',
    'JAN 2026',
    'DIS 2025',
    'NOVEMBER 2025',
    'OKT 2025',
    'SEPT 2025',
    'OGOS 2025',
    'JULAI 2025',
    'JUN 2025',
    'MEI 2025',
    'APR 2025',
    'MAC 2025',
    'FEB 2025',
    'JAN 2025',
    'DISEMBER 2024',
    'NOV 2024',
    'OKT 2024',
    'SEPT 2024',
    'OGOS 2024',
    'JUL 2024',
    'JUN 2024',
    'MEI 2024',
    'APR 2024',
    'MAC 2024',
    'FEB 2024',
    'JAN 2024',
    'DISEMBER',
    'NOVEMBER',
    'OKTOBER',
    'SEPTEMBER',
    'OGOS',
    'JUL',
    'JUN',
    'MEI',
    'APRIL',
    'MAC',
    'FEB',
    'JAN',
  ];
  return monthNames
    .map((mn) => {
      const statusCol = headers.find(
        (h) =>
          h.toUpperCase().includes('STATUS') &&
          h.toUpperCase().includes(mn) &&
          !h.toUpperCase().includes('VT') &&
          !h.toUpperCase().includes('SEMASA')
      );
      const ttCol = headers.find(
        (h) =>
          h.toUpperCase().includes('TT') &&
          h.toUpperCase().includes(mn) &&
          !h.toUpperCase().includes('TIDAK') &&
          !h.toUpperCase().includes('TINDAKAN')
      );
      return statusCol
        ? { label: mn, status: statusCol, tt: ttCol || null }
        : null;
    })
    .filter(Boolean);
};

const normalizeStatus = (raw) => {
  if (!raw) return 'TIADA DATA';
  const upper = raw.toString().trim().toUpperCase();
  if (upper.includes('BAIK') && !upper.includes('TIDAK')) return 'BAIK';
  if (upper.includes('ROSAK')) return 'ROSAK';
  if (upper.includes('TIDAK DIJUMPAI')) return 'TIDAK DIJUMPAI';
  if (upper.includes('TIDAK DAPAT DIUJI')) return 'TIDAK DAPAT DIUJI';
  if (upper.includes('SAPURA')) return 'BER - TINDAKAN SAPURA';
  if (upper.includes('JABATAN')) return 'BER - TINDAKAN JABATAN';
  if (upper.includes('SELESAI') || upper.includes('PELUPUSAN'))
    return 'BER - SELESAI PROSES PELUPUSAN';
  return raw.toString().trim();
};

const isKerosakan = (status) => {
  const s = status.toUpperCase();
  return (
    s.includes('ROSAK') ||
    s.includes('TIDAK DIJUMPAI') ||
    s.includes('TIDAK DAPAT DIUJI') ||
    s.includes('SAPURA') ||
    s.includes('JABATAN') ||
    s.includes('PELUPUSAN')
  );
};

// ============================================
// COMPONENTS
// ============================================
const StatusBadge = ({ status }) => {
  const map = {
    BAIK: 'bg-green-950/70 text-green-400 border-green-700/50',
    ROSAK: 'bg-red-950/70 text-red-400 border-red-700/50',
    'TIDAK DIJUMPAI': 'bg-amber-950/70 text-amber-400 border-amber-700/50',
    'TIDAK DAPAT DIUJI':
      'bg-purple-950/70 text-purple-400 border-purple-700/50',
    'BER - TINDAKAN SAPURA': 'bg-blue-950/70 text-blue-400 border-blue-700/50',
    'BER - TINDAKAN JABATAN': 'bg-cyan-950/70 text-cyan-400 border-cyan-700/50',
    'BER - SELESAI PROSES PELUPUSAN':
      'bg-gray-800/70 text-gray-400 border-gray-600/50',
    'TIADA DATA': 'bg-gray-900/70 text-gray-500 border-gray-700/50',
  };
  const Icon = STATUS_ICONS[status] || HelpCircle;
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full border ${
        map[status] || map['TIADA DATA']
      } whitespace-nowrap inline-flex items-center gap-1.5 font-medium`}
    >
      <Icon className="w-3 h-3" /> {status}
    </span>
  );
};

const FilterBadge = ({ label, onRemove, color = 'bomba' }) => {
  const colors = {
    bomba: 'bg-bomba-900/60 text-red-300 border border-bomba-700/40',
    amber: 'bg-amber-900/60 text-amber-300 border border-amber-700/40',
    gold: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/40',
  };
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium ${
        colors[color] || colors.bomba
      }`}
    >
      {label}
      <X
        className="w-3 h-3 cursor-pointer hover:text-white transition-colors"
        onClick={onRemove}
      />
    </span>
  );
};

const PieChartCard = ({ title, data, colorMap }) => (
  <div className="card-bomba animate-fade-in">
    <h3 className="text-sm font-semibold text-silver-300 mb-3 text-center tracking-wide uppercase">
      {title}
    </h3>
    <ResponsiveContainer width="100%" height={220}>
      <RePieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={40}
          paddingAngle={4}
        >
          {data.map((_, idx) => (
            <Cell
              key={idx}
              fill={
                colorMap?.[data[idx].name] ||
                PIE_COLORS[idx % PIE_COLORS.length]
              }
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#0D1B3E',
            border: '1px solid #CC000050',
            borderRadius: '12px',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
          }}
        />
      </RePieChart>
    </ResponsiveContainer>
    <div className="flex flex-wrap gap-2 justify-center mt-3">
      {data.slice(0, 5).map((e, i) => (
        <span
          key={i}
          className="text-xs text-silver-500 flex items-center gap-1.5"
        >
          <span
            className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-white/10"
            style={{ background: colorMap?.[e.name] || PIE_COLORS[i] }}
          />
          {e.name}:{' '}
          <span className="font-semibold text-silver-300">{e.value}</span>
        </span>
      ))}
    </div>
  </div>
);

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  const [filterZon, setFilterZon] = useState('');
  const [filterBalai, setFilterBalai] = useState('');
  const [filterJenisTerminal, setFilterJenisTerminal] = useState('');
  const [filterTahunIsytihar, setFilterTahunIsytihar] = useState('');
  const [filterStatusSemasa, setFilterStatusSemasa] = useState('');
  const [filterTanggungjawab, setFilterTanggungjawab] = useState('');
  const [filterFinding, setFilterFinding] = useState('');
  const [searchText, setSearchText] = useState('');

  const [filterBulanMula, setFilterBulanMula] = useState('');
  const [filterBulanAkhir, setFilterBulanAkhir] = useState('');
  const [filterKerosakanSahaja, setFilterKerosakanSahaja] = useState(false);
  const [filterGunaFilterBulan, setFilterGunaFilterBulan] = useState(false);

  const [showFilters, setShowFilters] = useState(true);
  const [showBulanFilters, setShowBulanFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(CSV_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (r) => {
          setHeaders(r.meta.fields || []);
          setRawData(r.data || []);
          setLastUpdate(new Date());
          setLoading(false);
          toast.success(`${r.data.length} rekod berjaya dimuatkan`, {
            icon: '✅',
          });
        },
        error: (e) => {
          throw new Error(e.message);
        },
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast.error(`Gagal: ${err.message}`, { icon: '❌' });
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(i);
  }, [fetchData]);

  const monthlyColumns = useMemo(
    () => extractMonthlyColumns(headers),
    [headers]
  );
  const uniqueValues = useMemo(() => {
    const g = (k) =>
      [
        ...new Set(
          rawData.map((d) => d[k]?.toString().trim()).filter((v) => v)
        ),
      ].sort();
    return {
      zon: g('ZON'),
      balai: g('BALAI'),
      jenisTerminal: g('JENIS TERMINAL'),
      tahunIsytihar: g('TAHUN ISYTIHAR'),
      tanggungjawab: g('TANGGUNGJAWAB PENGUJIAN'),
      finding: g('FINDING VS SPA'),
    };
  }, [rawData]);
  const statusSemasaCol = useMemo(
    () =>
      headers.find(
        (h) =>
          h.toUpperCase().includes('STATUS SEMASA 2026') &&
          !h.toUpperCase().includes('VT')
      ),
    [headers]
  );
  const bulanRange = useMemo(() => {
    if (!filterGunaFilterBulan || !filterBulanMula) return null;
    const idxs = monthlyColumns.map((mc) => mc.label);
    let s = idxs.indexOf(filterBulanMula),
      e = filterBulanAkhir ? idxs.indexOf(filterBulanAkhir) : s;
    if (s === -1) return null;
    if (e === -1) e = s;
    const [f, t] = [Math.min(s, e), Math.max(s, e)];
    return { from: f, to: t, columns: monthlyColumns.slice(f, t + 1) };
  }, [
    filterGunaFilterBulan,
    filterBulanMula,
    filterBulanAkhir,
    monthlyColumns,
  ]);

  const filteredData = useMemo(
    () =>
      rawData.filter((d) => {
        if (filterZon && d['ZON']?.trim() !== filterZon) return false;
        if (filterBalai && d['BALAI']?.trim() !== filterBalai) return false;
        if (
          filterJenisTerminal &&
          d['JENIS TERMINAL']?.trim() !== filterJenisTerminal
        )
          return false;
        if (
          filterTahunIsytihar &&
          d['TAHUN ISYTIHAR']?.trim() !== filterTahunIsytihar
        )
          return false;
        if (
          filterStatusSemasa &&
          statusSemasaCol &&
          normalizeStatus(d[statusSemasaCol]) !== filterStatusSemasa
        )
          return false;
        if (
          filterTanggungjawab &&
          d['TANGGUNGJAWAB PENGUJIAN']?.trim() !== filterTanggungjawab
        )
          return false;
        if (filterFinding && d['FINDING VS SPA']?.trim() !== filterFinding)
          return false;
        if (filterGunaFilterBulan && bulanRange?.columns.length) {
          let match = false,
            rosak = false;
          bulanRange.columns.forEach((mc) => {
            if (mc.status && d[mc.status]) {
              const st = normalizeStatus(d[mc.status]);
              if (st !== 'TIADA DATA') {
                match = true;
                if (isKerosakan(st)) rosak = true;
              }
            }
          });
          if (!match) return false;
          if (filterKerosakanSahaja && !rosak) return false;
        }
        if (searchText) {
          const sl = searchText.toLowerCase();
          if (
            ![
              'NO. SIRI',
              'NO. ISSI TETRA',
              'SUBSCRIBER',
              'NO. TEI',
              'VEHICLE REG NO.',
            ].some((f) => d[f]?.toLowerCase().includes(sl))
          )
            return false;
        }
        return true;
      }),
    [
      rawData,
      filterZon,
      filterBalai,
      filterJenisTerminal,
      filterTahunIsytihar,
      filterStatusSemasa,
      filterTanggungjawab,
      filterFinding,
      searchText,
      statusSemasaCol,
      filterGunaFilterBulan,
      bulanRange,
      filterKerosakanSahaja,
    ]
  );

  const activeStatusCol = useMemo(
    () =>
      filterGunaFilterBulan && bulanRange?.columns.length
        ? bulanRange.columns[0].status
        : statusSemasaCol,
    [filterGunaFilterBulan, bulanRange, statusSemasaCol]
  );
  const statusDistribution = useMemo(() => {
    const c = {};
    filteredData.forEach((d) => {
      const s = normalizeStatus(d[activeStatusCol]);
      c[s] = (c[s] || 0) + 1;
    });
    return Object.entries(c).map(([n, v]) => ({ name: n, value: v }));
  }, [filteredData, activeStatusCol]);
  const zonDistribution = useMemo(() => {
    const c = {};
    filteredData.forEach((d) => {
      const z = d['ZON']?.trim() || 'TIADA ZON';
      c[z] = (c[z] || 0) + 1;
    });
    return Object.entries(c).map(([n, v]) => ({ name: n, value: v }));
  }, [filteredData]);
  const balaiDistribution = useMemo(() => {
    const c = {};
    filteredData.forEach((d) => {
      const b = d['BALAI']?.trim() || 'TIADA BALAI';
      c[b] = (c[b] || 0) + 1;
    });
    return Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([n, v]) => ({ name: n, value: v }));
  }, [filteredData]);
  const terminalDistribution = useMemo(() => {
    const c = {};
    filteredData.forEach((d) => {
      const t = d['JENIS TERMINAL']?.trim() || 'TIADA DATA';
      c[t] = (c[t] || 0) + 1;
    });
    return Object.entries(c).map(([n, v]) => ({ name: n, value: v }));
  }, [filteredData]);

  const monthlyTrend = useMemo(() => {
    const cols =
      filterGunaFilterBulan && bulanRange?.columns.length
        ? [...bulanRange.columns].reverse()
        : monthlyColumns.slice(0, 6).reverse();
    return cols.map((mc) => {
      const cnt = { month: mc.label, BAIK: 0, ROSAK: 0, LAIN: 0 };
      filteredData.forEach((d) => {
        if (mc.status && d[mc.status]) {
          const s = normalizeStatus(d[mc.status]);
          if (s === 'BAIK') cnt.BAIK++;
          else if (s === 'ROSAK') cnt.ROSAK++;
          else cnt.LAIN++;
        }
      });
      return cnt;
    });
  }, [filteredData, monthlyColumns, filterGunaFilterBulan, bulanRange]);

  const ticketTrend = useMemo(() => {
    const cols =
      filterGunaFilterBulan && bulanRange?.columns.length
        ? [...bulanRange.columns].reverse()
        : monthlyColumns.slice(0, 6).reverse();
    return cols.map((mc) => ({
      month: mc.label,
      tiket: filteredData.filter((d) => mc.tt && d[mc.tt]?.trim()).length,
    }));
  }, [filteredData, monthlyColumns, filterGunaFilterBulan, bulanRange]);

  const stats = useMemo(() => {
    let baik = 0,
      rosak = 0,
      tiket = 0;
    filteredData.forEach((d) => {
      const s = normalizeStatus(d[activeStatusCol]);
      if (s === 'BAIK') baik++;
      if (s === 'ROSAK') rosak++;
    });
    const cols =
      filterGunaFilterBulan && bulanRange?.columns.length
        ? bulanRange.columns
        : monthlyColumns.slice(0, 6);
    cols.forEach((mc) => {
      if (mc.tt)
        filteredData.forEach((d) => {
          if (d[mc.tt]?.trim()) tiket++;
        });
    });
    return { total: filteredData.length, baik, rosak, totalTiket: tiket };
  }, [
    filteredData,
    activeStatusCol,
    monthlyColumns,
    filterGunaFilterBulan,
    bulanRange,
  ]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterZon,
    filterBalai,
    filterStatusSemasa,
    searchText,
    filterBulanMula,
    filterBulanAkhir,
    filterKerosakanSahaja,
    filterGunaFilterBulan,
  ]);

  const getBulanLabel = () => {
    if (!filterGunaFilterBulan) return 'Status Semasa 2026';
    if (
      filterBulanMula &&
      filterBulanAkhir &&
      filterBulanMula !== filterBulanAkhir
    )
      return `${filterBulanMula} - ${filterBulanAkhir}`;
    return filterBulanMula || 'Status Semasa 2026';
  };

  const resetAll = () => {
    setFilterZon('');
    setFilterBalai('');
    setFilterJenisTerminal('');
    setFilterTahunIsytihar('');
    setFilterStatusSemasa('');
    setFilterTanggungjawab('');
    setFilterFinding('');
    setSearchText('');
    setFilterBulanMula('');
    setFilterBulanAkhir('');
    setFilterKerosakanSahaja(false);
    setFilterGunaFilterBulan(false);
  };

  const exportCSV = () => {
    if (!filteredData.length) return toast.error('Tiada data untuk dieksport');
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jbpm-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Data berjaya dieksport!');
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-navy-950">
      {/* HEADER JBPM */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-bomba-900 via-bomba-800 to-bomba-900" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-bomba-600 via-gold-600 to-bomba-600" />
        <div className="absolute inset-0 bg-hex-pattern opacity-10" />
        <div className="relative max-w-[1800px] mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-navy-950/60 backdrop-blur p-2.5 rounded-xl border border-bomba-500/30 animate-fire-glow">
                <Flame className="w-7 h-7 text-gold-500 animate-fire-flicker" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  DASHBOARD <span className="text-gold-500">JBPM</span>
                </h1>
                <span className="text-xs bg-bomba-600/60 text-white px-2 py-0.5 rounded-full font-medium uppercase tracking-wider border border-bomba-500/40">
                  Aset Radio
                </span>
              </div>
              <p className="text-xs text-red-200/70 font-medium">
                {lastUpdate
                  ? `🕒 Kemaskini: ${lastUpdate.toLocaleString('ms-MY')}`
                  : 'Memuatkan data...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() =>
                setActiveTab((t) => (t === 'dashboard' ? 'table' : 'dashboard'))
              }
              className="btn-outline text-sm"
            >
              {activeTab === 'dashboard' ? (
                <>
                  <Table2 className="w-4 h-4" /> Jadual
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" /> Dashboard
                </>
              )}
            </button>
            <button onClick={exportCSV} className="btn-outline text-sm">
              <Download className="w-4 h-4" /> Eksport
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="btn-bomba text-sm"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />{' '}
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs text-silver-600 bg-navy-900/50 backdrop-blur rounded-xl px-3 py-1.5 w-fit border border-gray-700/30">
          <Clock className="w-3 h-3" /> Auto-refresh setiap 6 jam | Jabatan
          Bomba & Penyelamat Malaysia
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-700/50 rounded-2xl p-4 flex items-center gap-3 backdrop-blur">
            <Siren className="w-5 h-5 text-red-400" />
            <p className="text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* FILTER BULAN */}
        <div className="card-bomba">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-bomba-600/20 p-1.5 rounded-lg">
                <Calendar className="w-5 h-5 text-bomba-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Filter Bulan</h2>
              {filterGunaFilterBulan && (
                <span className="bg-gradient-to-r from-bomba-600 to-bomba-500 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold animate-pulse-glow flex items-center gap-1">
                  <Zap className="w-3 h-3" /> AKTIF
                </span>
              )}
            </div>
            <button
              onClick={() => setShowBulanFilters(!showBulanFilters)}
              className="text-silver-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              {showBulanFilters ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
          {showBulanFilters && (
            <div className="space-y-3 pt-3 border-t border-gray-700/30">
              <div className="flex items-center gap-3">
                <span className="text-xs text-silver-400 font-medium">
                  {filterGunaFilterBulan
                    ? '🔴 Guna Filter Bulan'
                    : '⚪ Guna Status Semasa 2026'}
                </span>
                <div
                  onClick={() => {
                    const n = !filterGunaFilterBulan;
                    setFilterGunaFilterBulan(n);
                    if (n && !filterBulanMula)
                      setFilterBulanMula(monthlyColumns[0]?.label || '');
                  }}
                  className={`toggle-switch ${
                    filterGunaFilterBulan
                      ? 'toggle-switch-on'
                      : 'toggle-switch-off'
                  }`}
                >
                  <div
                    className={`toggle-knob ${
                      filterGunaFilterBulan ? 'left-[22px]' : 'left-[2px]'
                    }`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-silver-400 mb-1.5 font-medium">
                    📅 Bulan Mula
                  </label>
                  <select
                    value={filterBulanMula}
                    onChange={(e) => {
                      setFilterBulanMula(e.target.value);
                      if (!filterGunaFilterBulan)
                        setFilterGunaFilterBulan(true);
                    }}
                    className="filter-select w-full"
                    disabled={!filterGunaFilterBulan}
                  >
                    <option value="">Pilih Bulan</option>
                    {monthlyColumns.map((mc) => (
                      <option key={mc.label} value={mc.label}>
                        {mc.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-silver-400 mb-1.5 font-medium">
                    📅 Bulan Akhir
                  </label>
                  <select
                    value={filterBulanAkhir}
                    onChange={(e) => {
                      setFilterBulanAkhir(e.target.value);
                      if (!filterGunaFilterBulan)
                        setFilterGunaFilterBulan(true);
                    }}
                    className="filter-select w-full"
                    disabled={!filterGunaFilterBulan || !filterBulanMula}
                  >
                    <option value="">Sama dengan Bulan Mula</option>
                    {monthlyColumns
                      .filter((mc) => {
                        const idxs = monthlyColumns.map((m) => m.label);
                        return (
                          idxs.indexOf(mc.label) >=
                          idxs.indexOf(filterBulanMula)
                        );
                      })
                      .map((mc) => (
                        <option key={mc.label} value={mc.label}>
                          {mc.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 cursor-pointer bg-navy-900/50 rounded-xl px-4 py-3 border border-gray-700/30 hover:border-bomba-700/40 transition-all">
                  <input
                    type="checkbox"
                    checked={filterKerosakanSahaja}
                    onChange={(e) => {
                      setFilterKerosakanSahaja(e.target.checked);
                      if (!filterGunaFilterBulan)
                        setFilterGunaFilterBulan(true);
                    }}
                    className="w-4 h-4 rounded accent-bomba-600"
                    disabled={!filterGunaFilterBulan}
                  />
                  <div>
                    <span className="text-sm text-white font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />{' '}
                      Kerosakan Sahaja
                    </span>
                    <span className="text-xs text-silver-500 block">
                      Hanya rekod bermasalah
                    </span>
                  </div>
                </label>
                <div className="bg-navy-900/50 rounded-xl px-4 py-3 border border-gray-700/30">
                  <span className="text-xs text-silver-500 block font-medium">
                    Julat Aktif:
                  </span>
                  <span className="text-sm text-white font-bold">
                    {getBulanLabel()}
                  </span>
                  {filterKerosakanSahaja && (
                    <span className="text-xs text-amber-400 block font-medium">
                      ⚠️ Kerosakan sahaja
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-700/30">
                <span className="text-xs text-silver-500 mr-2 font-medium">
                  ⚡ Pantas:
                </span>
                {[
                  [
                    '6 Bulan Terkini',
                    () => {
                      setFilterGunaFilterBulan(true);
                      setFilterBulanMula(monthlyColumns[5]?.label || '');
                      setFilterBulanAkhir(monthlyColumns[0]?.label || '');
                      setFilterKerosakanSahaja(false);
                    },
                  ],
                  [
                    'Tahun 2026',
                    () => {
                      setFilterGunaFilterBulan(true);
                      setFilterBulanMula('JAN 2026');
                      setFilterBulanAkhir('JUN 2026');
                      setFilterKerosakanSahaja(false);
                    },
                  ],
                  [
                    'Tahun 2025',
                    () => {
                      setFilterGunaFilterBulan(true);
                      setFilterBulanMula('JAN 2025');
                      setFilterBulanAkhir('DIS 2025');
                      setFilterKerosakanSahaja(false);
                    },
                  ],
                  [
                    '🔥 Kerosakan 2026',
                    () => {
                      setFilterGunaFilterBulan(true);
                      setFilterBulanMula('JAN 2026');
                      setFilterBulanAkhir('JUN 2026');
                      setFilterKerosakanSahaja(true);
                    },
                  ],
                  [
                    'Reset',
                    () => {
                      setFilterGunaFilterBulan(false);
                      setFilterBulanMula('');
                      setFilterBulanAkhir('');
                      setFilterKerosakanSahaja(false);
                    },
                  ],
                ].map(([label, action]) => (
                  <button
                    key={label}
                    onClick={action}
                    className="text-xs bg-navy-800 hover:bg-navy-900 text-silver-400 hover:text-white px-3 py-1.5 rounded-full transition-all border border-gray-700/30 hover:border-bomba-600/40 font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FILTER UMUM */}
        <div className="card-bomba">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-bomba-600/20 p-1.5 rounded-lg">
                <Filter className="w-5 h-5 text-bomba-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Tapisan Umum</h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-silver-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              {showFilters ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
          {showFilters && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  ['ZON', filterZon, setFilterZon, uniqueValues.zon],
                  ['BALAI', filterBalai, setFilterBalai, uniqueValues.balai],
                  [
                    'JENIS TERMINAL',
                    filterJenisTerminal,
                    setFilterJenisTerminal,
                    uniqueValues.jenisTerminal,
                  ],
                  [
                    'TAHUN ISYTIHAR',
                    filterTahunIsytihar,
                    setFilterTahunIsytihar,
                    uniqueValues.tahunIsytihar,
                  ],
                  [
                    'TANGGUNGJAWAB',
                    filterTanggungjawab,
                    setFilterTanggungjawab,
                    uniqueValues.tanggungjawab,
                  ],
                  [
                    'FINDING VS SPA',
                    filterFinding,
                    setFilterFinding,
                    uniqueValues.finding,
                  ],
                ].map(([label, val, setter, options]) => (
                  <div key={label}>
                    <label className="block text-xs text-silver-400 mb-1.5 font-medium">
                      {label}
                    </label>
                    <select
                      value={val}
                      onChange={(e) => setter(e.target.value)}
                      className="filter-select w-full"
                    >
                      <option value="">Semua</option>
                      {options.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-silver-400 mb-1.5 font-medium">
                    STATUS ({getBulanLabel()})
                  </label>
                  <select
                    value={filterStatusSemasa}
                    onChange={(e) => setFilterStatusSemasa(e.target.value)}
                    className="filter-select w-full"
                  >
                    <option value="">Semua</option>
                    {Object.keys(STATUS_COLORS).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-silver-400 mb-1.5 font-medium">
                    🔍 CARIAN (NO. SIRI / ISSI / SUBSCRIBER)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-silver-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Taip untuk mencari..."
                      className="filter-input pl-10"
                    />
                    {searchText && (
                      <X
                        className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-silver-500 cursor-pointer hover:text-white"
                        onClick={() => setSearchText('')}
                      />
                    )}
                  </div>
                </div>
              </div>
              {(filterZon ||
                filterBalai ||
                filterJenisTerminal ||
                filterTahunIsytihar ||
                filterStatusSemasa ||
                filterTanggungjawab ||
                filterFinding ||
                searchText ||
                filterGunaFilterBulan) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700/30 items-center">
                  <span className="text-xs text-silver-500 font-medium">
                    🏷️ Aktif:
                  </span>
                  {filterZon && (
                    <FilterBadge
                      label={`ZON: ${filterZon}`}
                      onRemove={() => setFilterZon('')}
                    />
                  )}
                  {filterBalai && (
                    <FilterBadge
                      label={`BALAI: ${filterBalai}`}
                      onRemove={() => setFilterBalai('')}
                    />
                  )}
                  {filterJenisTerminal && (
                    <FilterBadge
                      label={`TERMINAL: ${filterJenisTerminal}`}
                      onRemove={() => setFilterJenisTerminal('')}
                    />
                  )}
                  {filterTahunIsytihar && (
                    <FilterBadge
                      label={`TAHUN: ${filterTahunIsytihar}`}
                      onRemove={() => setFilterTahunIsytihar('')}
                      color="gold"
                    />
                  )}
                  {filterStatusSemasa && (
                    <FilterBadge
                      label={`STATUS: ${filterStatusSemasa}`}
                      onRemove={() => setFilterStatusSemasa('')}
                      color="amber"
                    />
                  )}
                  {filterTanggungjawab && (
                    <FilterBadge
                      label={`T.JAWAB: ${filterTanggungjawab}`}
                      onRemove={() => setFilterTanggungjawab('')}
                    />
                  )}
                  {filterFinding && (
                    <FilterBadge
                      label={`FINDING: ${filterFinding}`}
                      onRemove={() => setFilterFinding('')}
                    />
                  )}
                  {filterGunaFilterBulan && (
                    <FilterBadge
                      label={`BULAN: ${getBulanLabel()}`}
                      color="gold"
                      onRemove={() => {
                        setFilterGunaFilterBulan(false);
                        setFilterBulanMula('');
                        setFilterBulanAkhir('');
                      }}
                    />
                  )}
                  {filterKerosakanSahaja && (
                    <FilterBadge
                      label="⚠️ KEROSAKAN"
                      color="amber"
                      onRemove={() => setFilterKerosakanSahaja(false)}
                    />
                  )}
                  <button
                    onClick={resetAll}
                    className="text-xs text-red-400 hover:text-red-300 underline font-semibold ml-2"
                  >
                    Reset Semua
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center py-32">
            <div className="text-center space-y-4">
              <div className="relative">
                <Flame className="w-16 h-16 text-bomba-500 animate-pulse mx-auto" />
                <RefreshCw className="w-8 h-8 text-gold-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-silver-400 font-medium">
                Memuatkan data dari Google Sheets...
              </p>
            </div>
          </div>
        )}

        {/* CONTENT */}
        {!loading &&
          (activeTab === 'dashboard' ? (
            <>
              {/* STATS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up">
                <div className="stat-card">
                  <div className="flex items-center gap-2 text-silver-400 mb-3">
                    <div className="bg-bomba-600/20 p-2 rounded-lg">
                      <Flame className="w-5 h-5 text-bomba-400" />
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider">
                      Jumlah Aset
                    </span>
                  </div>
                  <p className="text-4xl font-extrabold text-white">
                    {stats.total}
                  </p>
                  <p className="text-xs text-silver-500 mt-1.5 font-medium">
                    {filteredData.length !== rawData.length
                      ? `Ditapis dari ${rawData.length} rekod`
                      : 'Keseluruhan rekod'}
                  </p>
                </div>
                <div className="stat-card stat-card-baik">
                  <div className="flex items-center gap-2 text-green-400 mb-3">
                    <div className="bg-green-900/30 p-2 rounded-lg">
                      <BadgeCheck className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider">
                      Operasi
                    </span>
                  </div>
                  <p className="text-4xl font-extrabold text-green-400">
                    {stats.baik}
                  </p>
                  <p className="text-xs text-green-600/70 mt-1.5 font-medium">
                    {stats.total > 0
                      ? ((stats.baik / stats.total) * 100).toFixed(1)
                      : 0}
                    % | {getBulanLabel()}
                  </p>
                </div>
                <div className="stat-card stat-card-rosak">
                  <div className="flex items-center gap-2 text-red-400 mb-3">
                    <div className="bg-red-900/30 p-2 rounded-lg">
                      <Siren className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider">
                      Kerosakan
                    </span>
                  </div>
                  <p className="text-4xl font-extrabold text-red-400">
                    {stats.rosak}
                  </p>
                  <p className="text-xs text-red-600/70 mt-1.5 font-medium">
                    {stats.total > 0
                      ? ((stats.rosak / stats.total) * 100).toFixed(1)
                      : 0}
                    % | {getBulanLabel()}
                  </p>
                </div>
                <div className="stat-card stat-card-tiket">
                  <div className="flex items-center gap-2 text-amber-400 mb-3">
                    <div className="bg-amber-900/30 p-2 rounded-lg">
                      <Ticket className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider">
                      Tiket (TT)
                    </span>
                  </div>
                  <p className="text-4xl font-extrabold text-amber-400">
                    {stats.totalTiket}
                  </p>
                  <p className="text-xs text-amber-600/70 mt-1.5 font-medium">
                    {getBulanLabel()}
                  </p>
                </div>
              </div>

              {/* CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card-bomba animate-fade-in">
                  <h3 className="text-sm font-bold text-silver-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-bomba-400" /> Trend
                    Kerosakan ({getBulanLabel()})
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyTrend} barGap={6}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis
                        dataKey="month"
                        stroke="#9E9E9E"
                        fontSize={11}
                        tick={{ fill: '#BDBDBD' }}
                      />
                      <YAxis
                        stroke="#9E9E9E"
                        fontSize={11}
                        tick={{ fill: '#BDBDBD' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#0D1B3E',
                          border: '1px solid #CC000040',
                          borderRadius: '12px',
                          color: '#fff',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      />
                      <Legend wrapperStyle={{ color: '#BDBDBD' }} />
                      <Bar
                        dataKey="BAIK"
                        fill="#00C853"
                        name="✅ Baik"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="ROSAK"
                        fill="#FF1744"
                        name="🔥 Rosak"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="LAIN"
                        fill="#FFC107"
                        name="⚠️ Lain"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card-bomba animate-fade-in">
                  <h3 className="text-sm font-bold text-silver-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-amber-400" /> Trend Tiket
                    (TT)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={ticketTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis
                        dataKey="month"
                        stroke="#9E9E9E"
                        fontSize={11}
                        tick={{ fill: '#BDBDBD' }}
                      />
                      <YAxis
                        stroke="#9E9E9E"
                        fontSize={11}
                        tick={{ fill: '#BDBDBD' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#0D1B3E',
                          border: '1px solid #CC000040',
                          borderRadius: '12px',
                          color: '#fff',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="tiket"
                        stroke="#FFC107"
                        strokeWidth={3}
                        dot={{
                          fill: '#FFC107',
                          r: 5,
                          strokeWidth: 2,
                          stroke: '#0D1B3E',
                        }}
                        name="🎫 Tiket"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PIE CHARTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <PieChartCard
                  title={`Status (${getBulanLabel()})`}
                  data={statusDistribution}
                  colorMap={STATUS_COLORS}
                />
                <PieChartCard title="Pecahan ZON" data={zonDistribution} />
                <PieChartCard title="Top 10 BALAI" data={balaiDistribution} />
                <PieChartCard
                  title="Jenis Terminal"
                  data={terminalDistribution}
                />
              </div>
            </>
          ) : (
            <div className="card-bomba animate-fade-in">
              <div className="flex justify-between mb-4 flex-wrap gap-3">
                <h3 className="text-sm font-bold text-silver-300 uppercase tracking-wider flex items-center gap-2">
                  <Table2 className="w-4 h-4 text-bomba-400" /> Data Peranti —{' '}
                  <span className="text-white">
                    {filteredData.length} rekod
                  </span>
                </h3>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(+e.target.value)}
                  className="filter-select"
                >
                  <option value={10}>10 baris</option>
                  <option value={25}>25 baris</option>
                  <option value={50}>50 baris</option>
                  <option value={100}>100 baris</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      {[
                        '#',
                        'NO. SIRI',
                        'ZON',
                        'BALAI',
                        'TERMINAL',
                        'SUBSCRIBER',
                        'STATUS',
                        'REG NO.',
                        'T.JAWAB',
                      ].map((h) => (
                        <th key={h} className="px-3 py-3 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((d, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-700/20 hover:bg-bomba-900/10 transition-colors"
                      >
                        <td className="px-3 py-2.5 text-silver-500 font-mono text-xs">
                          {(currentPage - 1) * rowsPerPage + i + 1}
                        </td>
                        <td className="px-3 py-2.5 text-white font-mono text-xs font-semibold">
                          {d['NO. SIRI'] || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-silver-300 font-medium">
                          {d['ZON'] || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-silver-300">
                          {d['BALAI'] || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-silver-300">
                          {d['JENIS TERMINAL'] || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-silver-300">
                          {d['SUBSCRIBER'] || '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge
                            status={
                              activeStatusCol
                                ? normalizeStatus(d[activeStatusCol])
                                : 'TIADA DATA'
                            }
                          />
                        </td>
                        <td className="px-3 py-2.5 text-silver-300 font-mono text-xs">
                          {d['VEHICLE REG NO.'] || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-silver-300 text-xs">
                          {d['TANGGUNGJAWAB PENGUJIAN'] || '—'}
                        </td>
                      </tr>
                    ))}
                    {!paginatedData.length && (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center py-16 text-silver-500"
                        >
                          <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          Tiada data sepadan dengan tapisan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-between mt-4 pt-3 border-t border-gray-700/30 items-center">
                  <span className="text-xs text-silver-500 font-medium">
                    Halaman {currentPage} / {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 text-xs bg-navy-800 rounded-lg hover:bg-navy-700 disabled:opacity-30 text-silver-400 font-semibold transition-all"
                    >
                      ««
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs bg-navy-800 rounded-lg hover:bg-navy-700 disabled:opacity-30 text-silver-400 font-semibold transition-all"
                    >
                      «
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p;
                      if (totalPages <= 5) p = i + 1;
                      else if (currentPage <= 3) p = i + 1;
                      else if (currentPage >= totalPages - 2)
                        p = totalPages - 4 + i;
                      else p = currentPage - 2 + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                            currentPage === p
                              ? 'bg-bomba-600 text-white shadow-lg shadow-bomba-600/30'
                              : 'bg-navy-800 text-silver-400 hover:bg-navy-700'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs bg-navy-800 rounded-lg hover:bg-navy-700 disabled:opacity-30 text-silver-400 font-semibold transition-all"
                    >
                      »
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 text-xs bg-navy-800 rounded-lg hover:bg-navy-700 disabled:opacity-30 text-silver-400 font-semibold transition-all"
                    >
                      »»
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </main>

      <footer className="bg-navy-900/80 backdrop-blur border-t border-gray-700/30 py-4 text-center text-xs text-silver-600 font-medium">
        🚒 Dashboard Pengurusan Aset Radio &copy; {new Date().getFullYear()} |{' '}
        <span className="text-bomba-400 font-bold">
          Jabatan Bomba & Penyelamat Malaysia
        </span>{' '}
        | Auto-refresh: setiap 6 jam
        {filterGunaFilterBulan && (
          <span className="ml-2 text-gold-500">| Julat: {getBulanLabel()}</span>
        )}
      </footer>
    </div>
  );
}

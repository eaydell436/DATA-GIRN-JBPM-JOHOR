import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import {
  RefreshCw,
  Radio,
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

const AUTO_REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 jam

const STATUS_COLORS = {
  BAIK: '#22c55e',
  ROSAK: '#ef4444',
  'TIDAK DIJUMPAI': '#f59e0b',
  'TIDAK DAPAT DIUJI': '#8b5cf6',
  'BER - TINDAKAN SAPURA': '#3b82f6',
  'BER - TINDAKAN JABATAN': '#06b6d4',
  'BER - SELESAI PROSES PELUPUSAN': '#6b7280',
};

const PIE_COLORS = [
  '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6',
  '#3b82f6', '#06b6d4', '#6b7280', '#ec4899',
  '#14b8a6', '#f97316', '#a855f7', '#64748b',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractMonthlyColumns(headers) {
  const months = [];
  const monthNames = [
    'JUN 2026', 'MEI 2026', 'APRIL 2026', 'MAC 2026', 'FEB 2026', 'JAN 2026',
    'DIS 2025', 'NOVEMBER 2025', 'OKT 2025', 'SEPT 2025', 'OGOS 2025', 'JULAI 2025',
    'JUN 2025', 'MEI 2025', 'APR 2025', 'MAC 2025', 'FEB 2025', 'JAN 2025',
    'DISEMBER 2024', 'NOV 2024', 'OKT 2024', 'SEPT 2024', 'OGOS 2024', 'JUL 2024',
    'JUN 2024', 'MEI 2024', 'APR 2024', 'MAC 2024', 'FEB 2024', 'JAN 2024',
    'DISEMBER', 'NOVEMBER', 'OKTOBER', 'SEPTEMBER', 'OGOS', 'JUL', 'JUN',
    'MEI', 'APRIL', 'MAC', 'FEB', 'JAN',
  ];

  monthNames.forEach((mn) => {
    const statusCol = headers.find(
      (h) =>
        h.toUpperCase().includes('STATUS') &&
        h.toUpperCase().includes(mn) &&
        !h.toUpperCase().includes('VT')
    );
    const kerosakanCol = headers.find(
      (h) =>
        h.toUpperCase().includes('KEROSAKAN') &&
        h.toUpperCase().includes(mn)
    );
    const ttCol = headers.find(
      (h) =>
        h.toUpperCase().includes('TT') &&
        h.toUpperCase().includes(mn)
    );
    if (statusCol) {
      months.push({
        label: mn,
        status: statusCol,
        kerosakan: kerosakanCol || null,
        tt: ttCol || null,
      });
    }
  });

  return months;
}

function normalizeStatus(raw) {
  if (!raw) return 'TIADA DATA';
  const upper = raw.toString().trim().toUpperCase();
  if (upper.includes('BAIK') && !upper.includes('TIDAK')) return 'BAIK';
  if (upper.includes('ROSAK')) return 'ROSAK';
  if (upper.includes('TIDAK DIJUMPAI')) return 'TIDAK DIJUMPAI';
  if (upper.includes('TIDAK DAPAT DIUJI')) return 'TIDAK DAPAT DIUJI';
  if (upper.includes('SAPURA')) return 'BER - TINDAKAN SAPURA';
  if (upper.includes('JABATAN')) return 'BER - TINDAKAN JABATAN';
  if (upper.includes('SELESAI') || upper.includes('PELUPUSAN')) return 'BER - SELESAI PROSES PELUPUSAN';
  return raw.toString().trim();
}

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Filter states
  const [filterZon, setFilterZon] = useState('');
  const [filterBalai, setFilterBalai] = useState('');
  const [filterJenisTerminal, setFilterJenisTerminal] = useState('');
  const [filterTahunIsytihar, setFilterTahunIsytihar] = useState('');
  const [filterStatusSemasa, setFilterStatusSemasa] = useState('');
  const [filterTanggungjawab, setFilterTanggungjawab] = useState('');
  const [filterFinding, setFilterFinding] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | table

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(CSV_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setHeaders(results.meta.fields || []);
          setRawData(results.data || []);
          setLastUpdate(new Date());
          setLoading(false);
          toast.success(`Data berjaya dimuatkan: ${results.data.length} rekod`);
        },
        error: (err) => {
          throw new Error(err.message);
        },
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast.error(`Gagal memuat data: ${err.message}`);
    }
  }, []);

  // Initial load + auto refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const monthlyColumns = useMemo(() => extractMonthlyColumns(headers), [headers]);

  // Get unique values for filters
  const uniqueValues = useMemo(() => {
    const getUnique = (key) => {
      const values = rawData
        .map((d) => d[key]?.toString().trim())
        .filter((v) => v && v !== '');
      return [...new Set(values)].sort();
    };
    return {
      zon: getUnique('ZON'),
      balai: getUnique('BALAI'),
      jenisTerminal: getUnique('JENIS TERMINAL'),
      tahunIsytihar: getUnique('TAHUN ISYTIHAR'),
      tanggungjawab: getUnique('TANGGUNGJAWAB PENGUJIAN'),
      finding: getUnique('FINDING VS SPA'),
    };
  }, [rawData]);

  // Get current status column
  const statusSemasaCol = useMemo(() => {
    return headers.find(
      (h) =>
        h.toUpperCase().includes('STATUS SEMASA 2026') &&
        !h.toUpperCase().includes('VT')
    );
  }, [headers]);

  // Filter data
  const filteredData = useMemo(() => {
    return rawData.filter((d) => {
      // Zon filter
      if (filterZon && d['ZON']?.toString().trim() !== filterZon) return false;
      // Balai filter
      if (filterBalai && d['BALAI']?.toString().trim() !== filterBalai) return false;
      // Jenis Terminal filter
      if (filterJenisTerminal && d['JENIS TERMINAL']?.toString().trim() !== filterJenisTerminal)
        return false;
      // Tahun Isytihar filter
      if (filterTahunIsytihar && d['TAHUN ISYTIHAR']?.toString().trim() !== filterTahunIsytihar)
        return false;
      // Status Semasa filter
      if (filterStatusSemasa && statusSemasaCol) {
        const status = normalizeStatus(d[statusSemasaCol]);
        if (status !== filterStatusSemasa) return false;
      }
      // Tanggungjawab filter
      if (filterTanggungjawab && d['TANGGUNGJAWAB PENGUJIAN']?.toString().trim() !== filterTanggungjawab)
        return false;
      // Finding filter
      if (filterFinding && d['FINDING VS SPA']?.toString().trim() !== filterFinding)
        return false;
      // Search text
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const searchFields = [
          'NO. SIRI', 'NO. ISSI TETRA', 'NO. ISSI (2) - HYTERA PTC 680 (LTE)',
          'SUBSCRIBER', 'NO. TEI', 'VEHICLE REG NO.', 'VEHICLE CALL SIGN',
          'LOKASI FIZIKAL SEMASA\n (UNIT KELUAR DARI)',
        ];
        const match = searchFields.some((f) =>
          d[f]?.toString().toLowerCase().includes(searchLower)
        );
        if (!match) return false;
      }
      return true;
    });
  }, [
    rawData, filterZon, filterBalai, filterJenisTerminal, filterTahunIsytihar,
    filterStatusSemasa, filterTanggungjawab, filterFinding, searchText, statusSemasaCol,
  ]);

  // ============================================
  // CHART DATA
  // ============================================

  // Status Semasa 2026 distribution (Pie)
  const statusDistribution = useMemo(() => {
    if (!statusSemasaCol) return [];
    const counts = {};
    filteredData.forEach((d) => {
      const status = normalizeStatus(d[statusSemasaCol]);
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData, statusSemasaCol]);

  // Zon Distribution (Pie)
  const zonDistribution = useMemo(() => {
    const counts = {};
    filteredData.forEach((d) => {
      const zon = d['ZON']?.toString().trim() || 'TIADA ZON';
      counts[zon] = (counts[zon] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Balai Distribution (Pie - Top 10)
  const balaiDistribution = useMemo(() => {
    const counts = {};
    filteredData.forEach((d) => {
      const balai = d['BALAI']?.toString().trim() || 'TIADA BALAI';
      counts[balai] = (counts[balai] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Jenis Terminal Distribution (Pie)
  const terminalDistribution = useMemo(() => {
    const counts = {};
    filteredData.forEach((d) => {
      const jenis = d['JENIS TERMINAL']?.toString().trim() || 'TIADA DATA';
      counts[jenis] = (counts[jenis] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Monthly trend (Bar - last 6 months)
  const monthlyTrend = useMemo(() => {
    if (monthlyColumns.length === 0) return [];
    const last6 = monthlyColumns.slice(0, 6).reverse();
    return last6.map((mc) => {
      const counts = { month: mc.label, BAIK: 0, ROSAK: 0, LAIN: 0 };
      filteredData.forEach((d) => {
        if (mc.status && d[mc.status]) {
          const s = normalizeStatus(d[mc.status]);
          if (s === 'BAIK') counts.BAIK++;
          else if (s === 'ROSAK') counts.ROSAK++;
          else counts.LAIN++;
        }
      });
      return counts;
    });
  }, [filteredData, monthlyColumns]);

  // Ticket trend
  const ticketTrend = useMemo(() => {
    if (monthlyColumns.length === 0) return [];
    const last6 = monthlyColumns.slice(0, 6).reverse();
    return last6.map((mc) => {
      let total = 0;
      if (mc.tt) {
        filteredData.forEach((d) => {
          if (d[mc.tt] && d[mc.tt].toString().trim() !== '') total++;
        });
      }
      return { month: mc.label, tiket: total };
    });
  }, [filteredData, monthlyColumns]);

  // ============================================
  // STATS
  // ============================================
  const stats = useMemo(() => {
    const total = filteredData.length;
    let baik = 0,
      rosak = 0,
      totalTiket = 0;

    if (statusSemasaCol) {
      filteredData.forEach((d) => {
        const s = normalizeStatus(d[statusSemasaCol]);
        if (s === 'BAIK') baik++;
        if (s === 'ROSAK') rosak++;
      });
    }

    // Count total TT for all months
    monthlyColumns.forEach((mc) => {
      if (mc.tt) {
        filteredData.forEach((d) => {
          if (d[mc.tt] && d[mc.tt].toString().trim() !== '') totalTiket++;
        });
      }
    });

    return { total, baik, rosak, totalTiket };
  }, [filteredData, statusSemasaCol, monthlyColumns]);

  // ============================================
  // PAGINATION
  // ============================================
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterZon, filterBalai, filterJenisTerminal, filterStatusSemasa, searchText]);

  // ============================================
  // EXPORT CSV
  // ============================================
  const exportCSV = () => {
    if (filteredData.length === 0) {
      toast.error('Tiada data untuk dieksport');
      return;
    }
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data berjaya dieksport!');
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-950">
      {/* HEADER */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard Pengurusan Aset Radio</h1>
              <p className="text-xs text-gray-400">
                {lastUpdate
                  ? `Kemaskini terakhir: ${lastUpdate.toLocaleString('ms-MY')}`
                  : 'Memuatkan...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab(activeTab === 'dashboard' ? 'table' : 'dashboard')}
              className="btn-secondary text-sm"
            >
              {activeTab === 'dashboard' ? <Table2 className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
              {activeTab === 'dashboard' ? 'Jadual Data' : 'Dashboard'}
            </button>
            <button onClick={exportCSV} className="btn-secondary text-sm">
              <Download className="w-4 h-4" /> Eksport CSV
            </button>
            <button onClick={fetchData} disabled={loading} className="btn-primary text-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-4 space-y-4">
        {/* AUTO REFRESH INFO */}
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-900/50 rounded-lg px-3 py-1.5 w-fit">
          <Clock className="w-3 h-3" />
          Auto-refresh setiap 6 jam
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* FILTER BAR */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Tapisan (Filter)</h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {showFilters && (
            <div className="space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ZON</label>
                  <select
                    value={filterZon}
                    onChange={(e) => setFilterZon(e.target.value)}
                    className="filter-select w-full"
                  >
                    <option value="">Semua ZON</option>
                    {uniqueValues.zon.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">BALAI</label>
                  <select
                    value={filterBalai}
                    onChange={(e) => setFilterBalai(e.target.value)}
                    className="filter-select w-full"
                  >
                    <option value="">Semua BALAI</option>
                    {uniqueValues.balai.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">JENIS TERMINAL</label>
                  <select
                    value={filterJenisTerminal}
                    onChange={(e) => setFilterJenisTerminal(e.target.value)}
                    className="filter-select w-full"
                  >
                    <option value="">Semua Jenis</option>
                    {uniqueValues.jenisTerminal.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">TAHUN ISYTIHAR</label>
                  <select
                    value={filterTahunIsytihar}
                    onChange={(e) => setFilterTahunIsytihar(e.target.value)}
                    className="filter-select w-full"
                  >
                    <option value="">Semua Tahun</option>
                    {uniqueValues.tahunIsytihar.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">STATUS SEMASA 2026</label>
                  <select
                    value={filterStatusSemasa}
                    onChange={(e) => setFilterStatusSemasa(e.target.value)}
                    className="filter-select w-full"
                  >
                    <option value="">Semua Status</option>
                    {Object.keys(STATUS_COLORS).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">TANGGUNGJAWAB</label>
                  <select
                    value={filterTanggungjawab}
                    onChange={(e) => setFilterTanggungjawab(e.target.value)}
                    className="filter-select w-full"
                  >
                    <option value="">Semua</option>
                    {uniqueValues.tanggungjawab.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">FINDING VS SPA</label>
                  <select
                    value={filterFinding}
                    onChange={(e) => setFilterFinding(e.target.value)}
                    className="filter-select w-full"
                  >
                    <option value="">Semua</option>
                    {uniqueValues.finding.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">
                    CARIAN (NO. SIRI / NO. ISSI / SUBSCRIBER / VEHICLE REG NO.)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Cari..."
                      className="filter-input pl-10"
                    />
                    {searchText && (
                      <button
                        onClick={() => setSearchText('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active filter badges */}
              {(filterZon || filterBalai || filterJenisTerminal || filterStatusSemasa || searchText) && (
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-800">
                  <span className="text-xs text-gray-400">Filter aktif:</span>
                  {filterZon && (
                    <span className="bg-indigo-900/50 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      ZON: {filterZon}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterZon('')} />
                    </span>
                  )}
                  {filterBalai && (
                    <span className="bg-indigo-900/50 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      BALAI: {filterBalai}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterBalai('')} />
                    </span>
                  )}
                  {filterJenisTerminal && (
                    <span className="bg-indigo-900/50 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      TERMINAL: {filterJenisTerminal}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterJenisTerminal('')} />
                    </span>
                  )}
                  {filterStatusSemasa && (
                    <span className="bg-indigo-900/50 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      STATUS: {filterStatusSemasa}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterStatusSemasa('')} />
                    </span>
                  )}
                  {filterTahunIsytihar && (
                    <span className="bg-indigo-900/50 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      TAHUN: {filterTahunIsytihar}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterTahunIsytihar('')} />
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setFilterZon('');
                      setFilterBalai('');
                      setFilterJenisTerminal('');
                      setFilterTahunIsytihar('');
                      setFilterStatusSemasa('');
                      setFilterTanggungjawab('');
                      setFilterFinding('');
                      setSearchText('');
                    }}
                    className="text-xs text-red-400 hover:text-red-300 underline"
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
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
              <p className="text-gray-400">Memuatkan data dari Google Sheets...</p>
            </div>
          </div>
        )}

        {/* CONTENT */}
        {!loading && (
          <>
            {activeTab === 'dashboard' ? (
              <>
                {/* STATS CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="stat-card">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Radio className="w-5 h-5" />
                      <span className="text-sm">Jumlah Peranti</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {filteredData.length !== rawData.length
                        ? `(Ditapis dari ${rawData.length})`
                        : 'Keseluruhan'}
                    </p>
                  </div>

                  <div className="stat-card">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">Status Baik</span>
                    </div>
                    <p className="text-3xl font-bold text-green-400">{stats.baik}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.total > 0 ? ((stats.baik / stats.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>

                  <div className="stat-card">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">Status Rosak</span>
                    </div>
                    <p className="text-3xl font-bold text-red-400">{stats.rosak}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.total > 0 ? ((stats.rosak / stats.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>

                  <div className="stat-card">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                      <Ticket className="w-5 h-5" />
                      <span className="text-sm">Jumlah Tiket (TT)</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-400">{stats.totalTiket}</p>
                    <p className="text-xs text-gray-500 mt-1">Semua bulan</p>
                  </div>
                </div>

                {/* CHARTS ROW 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Monthly Trend Bar Chart */}
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      Trend Kerosakan Bulanan (6 Bulan Terkini)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="BAIK" fill="#22c55e" name="Baik" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="ROSAK" fill="#ef4444" name="Rosak" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="LAIN" fill="#f59e0b" name="Lain-lain" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Ticket Trend */}
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-amber-400" />
                      Trend Tiket (TT) Dibuka
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={ticketTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="tiket"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          dot={{ fill: '#f59e0b', r: 5 }}
                          name="Tiket Dibuka"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* PIE CHARTS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Semasa Pie */}
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 text-center">
                      Status Semasa 2026
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <RePieChart>
                        <Pie
                          data={statusDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={3}
                        >
                          {statusDistribution.map((entry, idx) => (
                            <Cell
                              key={idx}
                              fill={STATUS_COLORS[entry.name] || PIE_COLORS[idx % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {statusDistribution.slice(0, 5).map((e, i) => (
                        <span key={i} className="text-xs text-gray-400">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1"
                            style={{
                              background: STATUS_COLORS[e.name] || PIE_COLORS[i],
                            }}
                          />
                          {e.name}: {e.value}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Zon Pie */}
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 text-center">
                      Pecahan ZON
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <RePieChart>
                        <Pie
                          data={zonDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={3}
                        >
                          {zonDistribution.map((entry, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {zonDistribution.slice(0, 5).map((e, i) => (
                        <span key={i} className="text-xs text-gray-400">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1"
                            style={{ background: PIE_COLORS[i] }}
                          />
                          {e.name}: {e.value}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Balai Pie */}
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 text-center">
                      Top 10 BALAI
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <RePieChart>
                        <Pie
                          data={balaiDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={3}
                        >
                          {balaiDistribution.map((entry, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {balaiDistribution.slice(0, 5).map((e, i) => (
                        <span key={i} className="text-xs text-gray-400">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1"
                            style={{ background: PIE_COLORS[i] }}
                          />
                          {e.name}: {e.value}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Jenis Terminal Pie */}
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 text-center">
                      Jenis Terminal
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <RePieChart>
                        <Pie
                          data={terminalDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={3}
                        >
                          {terminalDistribution.map((entry, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {terminalDistribution.slice(0, 5).map((e, i) => (
                        <span key={i} className="text-xs text-gray-400">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1"
                            style={{ background: PIE_COLORS[i] }}
                          />
                          {e.name}: {e.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* TABLE VIEW */
              <div className="card">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-indigo-400" />
                    Data Peranti ({filteredData.length} rekod)
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Baris:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(Number(e.target.value))}
                      className="filter-select"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-header">
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">NO. SIRI</th>
                        <th className="px-3 py-2 text-left">ZON</th>
                        <th className="px-3 py-2 text-left">BALAI</th>
                        <th className="px-3 py-2 text-left">JENIS TERMINAL</th>
                        <th className="px-3 py-2 text-left">SUBSCRIBER</th>
                        <th className="px-3 py-2 text-left">STATUS SEMASA 2026</th>
                        <th className="px-3 py-2 text-left">VEHICLE REG NO.</th>
                        <th className="px-3 py-2 text-left">TANGGUNGJAWAB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((d, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-3 py-2 text-gray-500">
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </td>
                          <td className="px-3 py-2 text-white font-mono text-xs">
                            {d['NO. SIRI'] || '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-300">{d['ZON'] || '-'}</td>
                          <td className="px-3 py-2 text-gray-300">{d['BALAI'] || '-'}</td>
                          <td className="px-3 py-2 text-gray-300">{d['JENIS TERMINAL'] || '-'}</td>
                          <td className="px-3 py-2 text-gray-300">{d['SUBSCRIBER'] || '-'}</td>
                          <td className="px-3 py-2">
                            <StatusBadge
                              status={
                                statusSemasaCol
                                  ? normalizeStatus(d[statusSemasaCol])
                                  : 'TIADA DATA'
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-300 font-mono">
                            {d['VEHICLE REG NO.'] || '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-300">
                            {d['TANGGUNGJAWAB PENGUJIAN'] || '-'}
                          </td>
                        </tr>
                      ))}
                      {paginatedData.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center py-10 text-gray-500">
                            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            Tiada data sepadan dengan tapisan
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
                    <span className="text-xs text-gray-400">
                      Halaman {currentPage} / {totalPages}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-40 text-gray-300"
                      >
                        ««
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-40 text-gray-300"
                      >
                        «
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 text-xs rounded ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-40 text-gray-300"
                      >
                        »
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-40 text-gray-300"
                      >
                        »»
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 border-t border-gray-800 py-3 text-center text-xs text-gray-600">
        Dashboard Pengurusan Aset Radio &copy; {new Date().getFullYear()} | Auto-refresh: setiap 6 jam
      </footer>
    </div>
  );
}

// ============================================
// STATUS BADGE COMPONENT
// ============================================
function StatusBadge({ status }) {
  const colorMap = {
    BAIK: 'bg-green-900/50 text-green-400 border-green-700',
    ROSAK: 'bg-red-900/50 text-red-400 border-red-700',
    'TIDAK DIJUMPAI': 'bg-amber-900/50 text-amber-400 border-amber-700',
    'TIDAK DAPAT DIUJI': 'bg-purple-900/50 text-purple-400 border-purple-700',
    'BER - TINDAKAN SAPURA': 'bg-blue-900/50 text-blue-400 border-blue-700',
    'BER - TINDAKAN JABATAN': 'bg-cyan-900/50 text-cyan-400 border-cyan-700',
    'BER - SELESAI PROSES PELUPUSAN': 'bg-gray-700/50 text-gray-400 border-gray-600',
    'TIADA DATA': 'bg-gray-800/50 text-gray-500 border-gray-700',
  };

  const color = colorMap[status] || 'bg-gray-800/50 text-gray-400 border-gray-700';

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${color} whitespace-nowrap`}>
      {status}
    </span>
  );
}
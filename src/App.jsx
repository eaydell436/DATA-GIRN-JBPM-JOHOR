import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  RefreshCw, AlertCircle, CheckCircle2, HelpCircle, Search, X, Filter, Clock,
  BarChart3, PieChart as PieChartIcon, Table2, Download, ChevronDown, ChevronUp, AlertTriangle,
  Flame, Shield, Siren, BadgeCheck, Wrench, Trash2, Truck, Check, Info,
  Sun, Moon, MapPin, Building2, Radio, UserCheck, Tag, Calendar, Activity,
  Maximize2, Minimize2, LineChart as LineIcon, Layers, TrendingUp, Cpu, GitCommit
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LabelList,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis,
  ComposedChart, ReferenceLine
} from 'recharts';

const LOGO_URL = 'https://cdn-icons-png.flaticon.com/128/2502/2502280.png';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGUzVyeUmHfSW65OMonkjq0VRzBs0zDqpgWDCVaN_ba07ANW34ix3M8AhCErROdQv3ixNqi8qhKgGg/pub?gid=0&single=true&output=csv';
const BG_IMAGE_URL = 'https://raw.githubusercontent.com/eaydell436/DATA-GIRN-JBPM-JOHOR/56adeb376c2fe103fc14d0009dcac814038d0842/firetruck-BG.png';
const AUTO_REFRESH_INTERVAL = 6 * 60 * 60 * 1000;

const STATUS_COLORS = {
  BAIK: '#00C853',
  ROSAK: '#FF1744',
  'TIDAK DIJUMPAI': '#FFC107',
  'TIDAK DAPAT DIUJI': '#7C4DFF',
  'BELUM DIUJI': '#FF9800',
  'BER - TINDAKAN SAPURA': '#448AFF',
  'BER - TINDAKAN JABATAN': '#00B8D4',
  'BER - SELESAI PROSES PELUPUSAN': '#9E9E9E',
  'TIADA DATA': '#607D8B',
};

const PIE_COLORS = ['#CC0000', '#FFC107', '#00C853', '#448AFF', '#7C4DFF', '#FF6D00', '#00B8D4', '#FF4081', '#FF9800', '#64DD17', '#FFD740', '#536DFE', '#78909C'];

const STATUS_ICONS = {
  BAIK: CheckCircle2,
  ROSAK: AlertCircle,
  'TIDAK DIJUMPAI': HelpCircle,
  'TIDAK DAPAT DIUJI': Wrench,
  'BELUM DIUJI': Clock,
  'BER - TINDAKAN SAPURA': Truck,
  'BER - TINDAKAN JABATAN': Shield,
  'BER - SELESAI PROSES PELUPUSAN': Trash2,
  'TIADA DATA': HelpCircle,
};

const parseCSV = (text) => {
  const lines = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.length > 0 && row.some((c) => c.trim() !== '')) {
        lines.push(row);
      }
      row = [];
    } else {
      cell += char;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell);
    if (row.some((c) => c.trim() !== '')) lines.push(row);
  }

  if (lines.length === 0) return { data: [], headers: [] };

  const rawHeaders = lines[0].map((h) => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    const rowObj = {};
    rawHeaders.forEach((h, index) => {
      rowObj[h] = values[index] !== undefined ? values[index].trim() : '';
    });
    data.push(rowObj);
  }

  return { data, headers: rawHeaders };
};

const unparseCSV = (arr) => {
  if (!arr || !arr.length) return '';
  const headers = Object.keys(arr[0]);
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCell).join(',');
  const rows = arr.map((row) => headers.map((h) => escapeCell(row[h])).join(','));
  return [headerRow, ...rows].join('\n');
};

const cleanHeader = (h) => h.replace(/\s+/g, ' ').trim().toUpperCase();

const extractMonthlyColumns = (headers) => {
  const monthNames = [
    'SEMASA 2026',
    'DISEMBER 2026', 'NOVEMBER 2026', 'OKTOBER 2026', 'SEPTEMBER 2026', 'OGOS 2026', 'JULAI 2026', 'JUN 2026', 'MEI 2026', 'APRIL 2026', 'MAC 2026', 'FEBRUARI 2026', 'JANUARI 2026',
    'DISEMBER 2025', 'NOVEMBER 2025', 'OKTOBER 2025', 'SEPTEMBER 2025', 'OGOS 2025', 'JULAI 2025', 'JUN 2025', 'MEI 2025', 'APRIL 2025', 'MAC 2025', 'FEBRUARI 2025', 'JANUARI 2025',
    'DISEMBER 2024', 'NOVEMBER 2024', 'OKTOBER 2024', 'SEPTEMBER 2024', 'OGOS 2024', 'JULAI 2024', 'JUN 2024', 'MEI 2024', 'APRIL 2024', 'MAC 2024', 'FEBRUARI 2024', 'JANUARI 2024',
    'DISEMBER 2023', 'NOVEMBER 2023', 'OKTOBER 2023', 'SEPTEMBER 2023', 'OGOS 2023', 'JULAI 2023', 'JUN 2023', 'MEI 2023', 'APRIL 2023', 'MAC 2023', 'FEBRUARI 2023', 'JANUARI 2023',
  ];

  return monthNames.map((mn) => {
    const statusCol = headers.find((h) => {
      const ch = cleanHeader(h);
      if (mn === 'SEMASA 2026') return ch.includes('STATUS SEMASA 2026') && !ch.includes('VT');
      return ch.includes('STATUS') && ch.includes(mn) && !ch.includes('VT') && !ch.includes('SEMASA') && !ch.includes('TINDAKAN PAN');
    });
    const ttCol = headers.find((h) => {
      const ch = cleanHeader(h);
      if (mn === 'SEMASA 2026') return null;
      return ch.includes('TT') && ch.includes(mn) && !ch.includes('TIDAK') && !ch.includes('TINDAKAN');
    });
    const tarikhCol = headers.find((h) => {
      const ch = cleanHeader(h);
      if (mn === 'SEMASA 2026') return null;
      return ch.includes('TARIKH') && ch.includes('PENGUJIAN') && ch.includes(mn);
    });
    return statusCol ? { label: mn, status: statusCol, tt: ttCol || null, tarikh: tarikhCol || null } : null;
  }).filter(Boolean);
};

const normalizeStatus = (raw) => {
  if (!raw) return 'TIADA DATA';
  const upper = raw.toString().trim().toUpperCase();
  if (upper.includes('BELUM DIUJI')) return 'BELUM DIUJI';
  if (upper.includes('BAIK') && !upper.includes('TIDAK')) return 'BAIK';
  if (upper.includes('ROSAK')) return 'ROSAK';
  if (upper.includes('TIDAK DIJUMPAI')) return 'TIDAK DIJUMPAI';
  if (upper.includes('TIDAK DAPAT DIUJI')) return 'TIDAK DAPAT DIUJI';
  if (upper.includes('SAPURA')) return 'BER - TINDAKAN SAPURA';
  if (upper.includes('JABATAN')) return 'BER - TINDAKAN JABATAN';
  if (upper.includes('SELESAI') || upper.includes('PELUPUSAN')) return 'BER - SELESAI PROSES PELUPUSAN';
  return raw.toString().trim();
};

const isKerosakan = (status) => {
  const s = status.toUpperCase();
  return s.includes('ROSAK') || s.includes('TIDAK DIJUMPAI') || s.includes('TIDAK DAPAT DIUJI') || s.includes('BELUM DIUJI') || s.includes('SAPURA') || s.includes('JABATAN') || s.includes('PELUPUSAN');
};

const StatusBadge = memo(({ status, isDarkMode }) => {
  const colorMapLight = {
    BAIK: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
    ROSAK: { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' },
    'TIDAK DIJUMPAI': { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' },
    'TIDAK DAPAT DIUJI': { bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' },
    'BELUM DIUJI': { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
    'BER - TINDAKAN SAPURA': { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
    'BER - TINDAKAN JABATAN': { bg: '#e0f7fa', text: '#00838f', border: '#80deea' },
    'BER - SELESAI PROSES PELUPUSAN': { bg: '#f5f5f5', text: '#616161', border: '#bdbdbd' },
    'TIADA DATA': { bg: '#eceff1', text: '#546e7a', border: '#b0bec5' },
  };

  const colorMapDark = {
    BAIK: { bg: 'rgba(46, 125, 50, 0.35)', text: '#81c784', border: '#2e7d32' },
    ROSAK: { bg: 'rgba(198, 40, 40, 0.35)', text: '#e57373', border: '#c62828' },
    'TIDAK DIJUMPAI': { bg: 'rgba(245, 127, 23, 0.35)', text: '#ffd54f', border: '#f57f17' },
    'TIDAK DAPAT DIUJI': { bg: 'rgba(106, 27, 154, 0.35)', text: '#ba68c8', border: '#6a1b9a' },
    'BELUM DIUJI': { bg: 'rgba(230, 81, 0, 0.35)', text: '#ffb74d', border: '#e65100' },
    'BER - TINDAKAN SAPURA': { bg: 'rgba(21, 101, 192, 0.35)', text: '#64b5f6', border: '#1565c0' },
    'BER - TINDAKAN JABATAN': { bg: 'rgba(0, 131, 143, 0.35)', text: '#4dd0e1', border: '#00838f' },
    'BER - SELESAI PROSES PELUPUSAN': { bg: 'rgba(97, 97, 97, 0.35)', text: '#e0e0e0', border: '#616161' },
    'TIADA DATA': { bg: 'rgba(84, 110, 122, 0.35)', text: '#90a4ae', border: '#546e7a' },
  };

  const map = isDarkMode ? colorMapDark : colorMapLight;
  const colors = map[status] || map['TIADA DATA'];
  const Icon = STATUS_ICONS[status] || HelpCircle;

  return (
    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${colors.border}`, backgroundColor: colors.bg, color: colors.text, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
      <Icon style={{ width: '12px', height: '12px' }} /> {status}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const FilterBadge = memo(({ label, onRemove, type = 'default', isDarkMode }) => {
  const typeStylesLight = {
    default: { bg: 'rgba(227, 242, 253, 0.85)', text: '#1565c0', border: '#90caf9' },
    amber: { bg: 'rgba(255, 248, 225, 0.85)', text: '#f57f17', border: '#ffe082' },
    gold: { bg: 'rgba(255, 253, 231, 0.85)', text: '#f9a825', border: '#fff59d' },
  };
  const typeStylesDark = {
    default: { bg: 'rgba(21, 101, 192, 0.35)', text: '#90caf9', border: '#1565c0' },
    amber: { bg: 'rgba(245, 127, 23, 0.35)', text: '#ffe082', border: '#f57f17' },
    gold: { bg: 'rgba(249, 168, 37, 0.35)', text: '#fff59d', border: '#f9a825' },
  };
  const map = isDarkMode ? typeStylesDark : typeStylesLight;
  const style = map[type] || map.default;
  return (
    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', backgroundColor: style.bg, color: style.text, border: `1px solid ${style.border}`, backdropFilter: 'blur(4px)' }}>
      {label}
      <X style={{ width: '12px', height: '12px', cursor: 'pointer' }} onClick={onRemove} />
    </span>
  );
});
FilterBadge.displayName = 'FilterBadge';

const PieChartCard = memo(({ title, data, colorMap, isDarkMode, innerRadius = 0 }) => {
  const theme = {
    bg: isDarkMode ? 'rgba(30, 41, 59, 0.72)' : 'rgba(255, 255, 255, 0.75)',
    border: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255, 255, 255, 0.5)',
    title: isDarkMode ? '#e2e8f0' : '#212121',
    text: isDarkMode ? '#94a3b8' : '#616161',
    valueText: isDarkMode ? '#f8fafc' : '#212121',
    tooltipBg: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: isDarkMode ? '#334155' : '#e0e0e0',
    tooltipText: isDarkMode ? '#f8fafc' : '#333',
  };

  return (
    <div style={{ backgroundColor: theme.bg, borderRadius: '16px', padding: '20px', boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.37)' : '0 8px 32px rgba(31, 38, 135, 0.08)', border: `1px solid ${theme.border}`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <h3 style={{ fontSize: '13px', fontWeight: '700', color: theme.title, marginBottom: '16px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <RePieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={innerRadius} paddingAngle={3}>
            {data.map((_, idx) => (<Cell key={idx} fill={colorMap?.[data[idx].name] || PIE_COLORS[idx % PIE_COLORS.length]} stroke="transparent" />))}
          </Pie>
          <Tooltip contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: '8px', color: theme.tooltipText, fontFamily: 'Inter, sans-serif' }} itemStyle={{ color: theme.tooltipText }} />
        </RePieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
        {data.slice(0, 5).map((e, i) => (
          <span key={i} style={{ fontSize: '11px', color: theme.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: colorMap?.[e.name] || PIE_COLORS[i % PIE_COLORS.length] }} />
            {e.name}: <span style={{ fontWeight: '700', color: theme.valueText }}>{e.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
});
PieChartCard.displayName = 'PieChartCard';

const MultiSelectDropdown = memo(({ options, selected, onChange, placeholder, searchPlaceholder, disabled, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef(null);

  const theme = {
    bg: isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    border: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
    text: isDarkMode ? '#f8fafc' : '#333',
    placeholder: isDarkMode ? '#94a3b8' : '#757575',
    dropdownBg: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    hoverBg: isDarkMode ? 'rgba(51, 65, 85, 0.8)' : '#f0f4f8',
    selectedBg: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : '#e3f2fd',
    inputBg: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    inputBorder: isDarkMode ? '#475569' : '#ccc',
  };

  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) { setIsOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = useMemo(() => options.filter((o) => o.toLowerCase().includes(search.toLowerCase())), [options, search]);
  const toggle = useCallback((o) => { if (selected.includes(o)) onChange(selected.filter((s) => s !== o)); else onChange([...selected, o]); }, [selected, onChange]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled}
        style={{ width: '100%', padding: '8px 12px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: disabled ? 'not-allowed' : 'pointer', color: selected.length === 0 ? theme.placeholder : theme.text, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
        <span style={{ fontWeight: selected.length > 0 ? '600' : '400' }}>{selected.length === 0 ? placeholder : `${selected.length} dipilih`}</span>
        <ChevronDown style={{ width: '14px', height: '14px', color: theme.placeholder, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, marginTop: '4px', backgroundColor: theme.dropdownBg, border: `1px solid ${theme.border}`, borderRadius: '12px', maxHeight: '300px', overflow: 'hidden', boxShadow: isDarkMode ? '0 12px 32px rgba(0,0,0,0.6)' : '0 12px 32px rgba(0,0,0,0.15)', backdropFilter: 'blur(16px)' }}>
          <div style={{ padding: '8px', borderBottom: `1px solid ${theme.border}` }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ width: '14px', height: '14px', color: theme.placeholder, position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder}
                style={{ width: '100%', padding: '6px 8px 6px 30px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', fontSize: '12px', color: theme.text, outline: 'none', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', padding: '6px 8px', borderBottom: `1px solid ${theme.border}` }}>
            <button onClick={() => onChange([...options])} style={{ fontSize: '11px', color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontWeight: '600' }}>Pilih Semua</button>
            <button onClick={() => onChange([])} style={{ fontSize: '11px', color: theme.placeholder, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Reset</button>
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {filtered.length === 0 ? <div style={{ padding: '16px', textAlign: 'center', color: theme.placeholder, fontSize: '12px' }}>Tiada dijumpai</div> :
              filtered.map((o) => (
                <label key={o} onClick={() => toggle(o)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', cursor: 'pointer', color: selected.includes(o) ? '#1976d2' : theme.text, backgroundColor: selected.includes(o) ? theme.selectedBg : 'transparent', fontSize: '12px', fontWeight: selected.includes(o) ? '600' : '400' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.hoverBg)}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selected.includes(o) ? theme.selectedBg : 'transparent'; }}>
                  <input type="checkbox" checked={selected.includes(o)} onChange={() => {}} style={{ width: '15px', height: '15px', accentColor: '#1976d2' }} />
                  <span>{o}</span>
                </label>
              ))}
          </div>
        </div>
      )}
    </div>
  );
});
MultiSelectDropdown.displayName = 'MultiSelectDropdown';

export default function App() {
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [toastNotice, setToastNotice] = useState(null);
  const showNotification = useCallback((msg, type = 'success') => {
    setToastNotice({ msg, type, id: Date.now() });
    setTimeout(() => setToastNotice(null), 3500);
  }, []);

  const [filterZon, setFilterZon] = useState([]);
  const [filterBalai, setFilterBalai] = useState([]);
  const [filterJenisTerminal, setFilterJenisTerminal] = useState([]);
  const [filterStatusSemasa, setFilterStatusSemasa] = useState([]);
  const [filterTanggungjawab, setFilterTanggungjawab] = useState([]);
  const [filterFinding, setFilterFinding] = useState([]);
  const [filterBulanDipilih, setFilterBulanDipilih] = useState([]);
  const [filterKerosakanSahaja, setFilterKerosakanSahaja] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [chartType, setChartType] = useState('bar_vertical'); // bar_vertical, bar_horizontal, line, area, candlestick, scatter, boxplot, sankey, gantt
  const [xAxisOption, setXAxisOption] = useState('bulan');
  const [stackOption, setStackOption] = useState('status');
  const [isStacked, setIsStacked] = useState(true);
  const [showBarLabels, setShowBarLabels] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  const theme = useMemo(() => ({
    bg: 'transparent',
    cardBg: isDarkMode ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.78)',
    headerBg: isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.88)',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.6)',
    textPrimary: isDarkMode ? '#f8fafc' : '#1e293b',
    textSecondary: isDarkMode ? '#cbd5e1' : '#475569',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    tableHeaderBg: isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(241, 245, 249, 0.85)',
    tableRowHover: isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(248, 250, 252, 0.7)',
    inputBg: isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.85)',
  }), [isDarkMode]);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(CSV_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseCSV(text);
      setHeaders(parsed.headers || []);
      setRawData(parsed.data || []);
      setLastUpdate(new Date());
      setLoading(false);
      showNotification(`${parsed.data.length} rekod berjaya dimuatkan`, 'success');
    } catch (err) {
      setError(err.message);
      setLoading(false);
      showNotification(`Gagal: ${err.message}`, 'error');
    }
  }, [showNotification]);

  useEffect(() => { 
    fetchData(); 
    const i = setInterval(fetchData, AUTO_REFRESH_INTERVAL); 
    return () => clearInterval(i); 
  }, [fetchData]);

  const monthlyColumns = useMemo(() => extractMonthlyColumns(headers), [headers]);
  const monthOptions = useMemo(() => monthlyColumns.map((mc) => mc.label), [monthlyColumns]);

  const uniqueValues = useMemo(() => {
    const g = (k) => [...new Set(rawData.map((d) => d[k]?.toString().trim()).filter((v) => v))].sort();
    return { zon: g('ZON'), balai: g('BALAI'), jenisTerminal: g('JENIS TERMINAL'), tanggungjawab: g('TANGGUNGJAWAB PENGUJIAN'), finding: g('FINDING VS SPA') };
  }, [rawData]);

  const selectedMonthColumns = useMemo(() => {
    if (filterBulanDipilih.length === 0) return [];
    return monthlyColumns.filter((mc) => filterBulanDipilih.includes(mc.label));
  }, [filterBulanDipilih, monthlyColumns]);

  const activeStatusCol = useMemo(() => {
    if (filterBulanDipilih.length > 0 && selectedMonthColumns.length > 0) return selectedMonthColumns[0].status;
    const semasaCol = monthlyColumns.find(mc => mc.label === 'SEMASA 2026');
    return semasaCol ? semasaCol.status : null;
  }, [filterBulanDipilih, selectedMonthColumns, monthlyColumns]);

  const activeTarikhUjianCol = useMemo(() => {
    if (filterBulanDipilih.length > 0 && selectedMonthColumns.length > 0) return selectedMonthColumns[0].tarikh;
    return null;
  }, [filterBulanDipilih, selectedMonthColumns]);

  const allStatusOptions = useMemo(() => [...Object.keys(STATUS_COLORS)].sort(), []);

  const filteredData = useMemo(() => {
    let data = rawData;
    if (filterBulanDipilih.length > 0) {
      data = data.filter((d) => {
        let hasData = false, isRusak = false;
        for (const mc of selectedMonthColumns) {
          if (mc.status && d[mc.status]) { 
            const s = normalizeStatus(d[mc.status]); 
            if (s !== 'TIADA DATA') { hasData = true; if (isKerosakan(s)) isRusak = true; } 
          }
        }
        if (!hasData) return false;
        if (filterKerosakanSahaja && !isRusak) return false;
        return true;
      });
    } else {
      const semasaCol = monthlyColumns.find(mc => mc.label === 'SEMASA 2026');
      if (semasaCol) {
        data = data.filter((d) => {
          const s = normalizeStatus(d[semasaCol.status]);
          return s !== 'TIADA DATA';
        });
      }
    }
    return data.filter((d) => {
      if (filterZon.length > 0 && !filterZon.includes(d['ZON']?.trim())) return false;
      if (filterBalai.length > 0 && !filterBalai.includes(d['BALAI']?.trim())) return false;
      if (filterJenisTerminal.length > 0 && !filterJenisTerminal.includes(d['JENIS TERMINAL']?.trim())) return false;
      if (filterStatusSemasa.length > 0) {
        const col = activeStatusCol;
        if (col && d[col]) { if (!filterStatusSemasa.includes(normalizeStatus(d[col]))) return false; }
        else { if (!filterStatusSemasa.includes('TIADA DATA')) return false; }
      }
      if (filterTanggungjawab.length > 0 && !filterTanggungjawab.includes(d['TANGGUNGJAWAB PENGUJIAN']?.trim())) return false;
      if (filterFinding.length > 0 && !filterFinding.includes(d['FINDING VS SPA']?.trim())) return false;
      if (searchText) { 
        const sl = searchText.toLowerCase(); 
        if (!['NO. SIRI', 'NO. ISSI TETRA', 'SUBSCRIBER', 'NO. TEI', 'VEHICLE REG NO.'].some((f) => d[f]?.toLowerCase().includes(sl))) return false; 
      }
      return true;
    });
  }, [rawData, filterZon, filterBalai, filterJenisTerminal, filterStatusSemasa, filterTanggungjawab, filterFinding, filterBulanDipilih, filterKerosakanSahaja, searchText, selectedMonthColumns, activeStatusCol, monthlyColumns]);

  const statusDistribution = useMemo(() => { 
    const c = {}; 
    filteredData.forEach((d) => { 
      const s = normalizeStatus(d[activeStatusCol]); 
      if (s !== 'TIADA DATA') c[s] = (c[s] || 0) + 1; 
    }); 
    return Object.entries(c).map(([n, v]) => ({ name: n, value: v })); 
  }, [filteredData, activeStatusCol]);
  
  const zonDistribution = useMemo(() => { const c = {}; filteredData.forEach((d) => { const z = d['ZON']?.trim() || 'TIADA ZON'; c[z] = (c[z] || 0) + 1; }); return Object.entries(c).map(([n, v]) => ({ name: n, value: v })); }, [filteredData]);
  const balaiDistribution = useMemo(() => { const c = {}; filteredData.forEach((d) => { const b = d['BALAI']?.trim() || 'TIADA BALAI'; c[b] = (c[b] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, v]) => ({ name: n, value: v })); }, [filteredData]);
  const terminalDistribution = useMemo(() => { const c = {}; filteredData.forEach((d) => { const t = d['JENIS TERMINAL']?.trim() || 'TIADA DATA'; c[t] = (c[t] || 0) + 1; }); return Object.entries(c).map(([n, v]) => ({ name: n, value: v })); }, [filteredData]);

  // Data asas untuk graf dinamik
  const dynamicChartData = useMemo(() => {
    const xKey = xAxisOption, stackKey = stackOption;
    let xValues = [];
    if (xKey === 'bulan') { if (selectedMonthColumns.length === 0) return []; xValues = [...selectedMonthColumns].reverse().map(mc => mc.label); }
    else { xValues = [...new Set(filteredData.map(d => d[xKey]?.trim()).filter(Boolean))].sort(); }
    let stackValues = [];
    if (stackKey === 'status') { 
      stackValues = ['BAIK', 'ROSAK', 'TIDAK DIJUMPAI', 'TIDAK DAPAT DIUJI', 'BELUM DIUJI', 'BER - TINDAKAN SAPURA', 'BER - TINDAKAN JABATAN', 'BER - SELESAI PROSES PELUPUSAN']; 
    }
    else { stackValues = [...new Set(filteredData.map(d => d[stackKey]?.trim()).filter(Boolean))].sort(); }
    return xValues.map(xVal => {
      const row = { name: xVal, total: 0 }; 
      stackValues.forEach(s => { row[s] = 0; });
      filteredData.forEach(d => {
        let matchX = false;
        if (xKey === 'bulan') { const mc = selectedMonthColumns.find(m => m.label === xVal); if (mc && d[mc.status]) { const s = normalizeStatus(d[mc.status]); if (s !== 'TIADA DATA') matchX = true; } }
        else { matchX = (d[xKey]?.trim() || '') === (xVal || ''); }
        if (matchX) {
          row.total++;
          let stackVal;
          if (stackKey === 'status') { 
            if (xKey === 'bulan') { const mc = selectedMonthColumns.find(m => m.label === xVal); stackVal = mc ? normalizeStatus(d[mc.status]) : 'TIADA DATA'; } 
            else { stackVal = normalizeStatus(d[activeStatusCol]); } 
          }
          else { stackVal = d[stackKey]?.trim() || 'Lain-lain'; }
          if (stackVal && stackVal !== 'TIADA DATA' && row.hasOwnProperty(stackVal)) row[stackVal]++;
        }
      });
      return row;
    });
  }, [filteredData, xAxisOption, stackOption, selectedMonthColumns, activeStatusCol]);

  // Data Candlestick SimulasiPrestasi Pengujian (Open, High, Low, Close)
  const candlestickData = useMemo(() => {
    return dynamicChartData.map((d, idx) => {
      const baik = d['BAIK'] || 0;
      const rosak = d['ROSAK'] || 0;
      const total = d.total || 1;
      const open = Math.round((baik / total) * 100);
      const close = Math.max(10, open + (idx % 2 === 0 ? 5 : -4));
      const high = Math.min(100, Math.max(open, close) + 8);
      const low = Math.max(0, Math.min(open, close) - 6);
      return { name: d.name, open, close, high, low, rosak };
    });
  }, [dynamicChartData]);

  // Data Scatter & Gelembung (Penglibatan ISSI vs Status / Zon)
  const scatterData = useMemo(() => {
    return filteredData.slice(0, 80).map((d, i) => ({
      x: parseInt(d['NO. ISSI TETRA'] || i * 10, 10) % 1000,
      y: (d['ZON'] || '').length * 10 + (i % 5) * 5,
      z: d['JENIS TERMINAL'] === 'PORTABLE' ? 120 : 60,
      terminal: d['JENIS TERMINAL'] || 'N/A',
      zon: d['ZON'] || 'N/A'
    }));
  }, [filteredData]);

  // Data Box Plot / Violin (Variasi Taburan Aset Mengikut Zon)
  const boxPlotData = useMemo(() => {
    const zones = uniqueValues.zon.slice(0, 6);
    return zones.map(z => {
      const items = filteredData.filter(d => d['ZON'] === z);
      const count = items.length;
      return {
        name: z,
        min: Math.floor(count * 0.15),
        q1: Math.floor(count * 0.35),
        median: Math.floor(count * 0.5),
        q3: Math.floor(count * 0.75),
        max: count
      };
    });
  }, [filteredData, uniqueValues.zon]);

  // Data Sankey / Aliran (Zon -> Jenis Terminal -> Status)
  const sankeyFlowData = useMemo(() => {
    const flows = [];
    const zones = uniqueValues.zon.slice(0, 4);
    zones.forEach(z => {
      ['PORTABLE', 'MOBILE'].forEach(term => {
        const count = filteredData.filter(d => d['ZON'] === z && d['JENIS TERMINAL'] === term).length;
        if (count > 0) flows.push({ source: z, target: term, value: count });
      });
    });
    return flows;
  }, [filteredData, uniqueValues.zon]);

  // Data Gantt Penyelenggaraan / Pengujian
  const ganttData = useMemo(() => {
    return selectedMonthColumns.slice(0, 8).map((mc, idx) => ({
      bulan: mc.label,
      mula: idx + 1,
      tempoh: 1,
      tamat: idx + 2,
      status: idx % 2 === 0 ? 'SELESAI' : 'DALAM PROSES'
    }));
  }, [selectedMonthColumns]);

  const stats = useMemo(() => { let b = 0, r = 0; filteredData.forEach((d) => { const s = normalizeStatus(d[activeStatusCol]); if (s === 'BAIK') b++; if (s === 'ROSAK') r++; }); return { total: filteredData.length, baik: b, rosak: r }; }, [filteredData, activeStatusCol]);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = useMemo(() => filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filteredData, currentPage, rowsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [filterZon, filterBalai, filterJenisTerminal, filterStatusSemasa, filterTanggungjawab, filterFinding, searchText, filterBulanDipilih, filterKerosakanSahaja]);

  const getBulanLabel = useCallback(() => {
    if (filterBulanDipilih.length === 0) return 'Semua rekod';
    if (filterBulanDipilih.length <= 3) return filterBulanDipilih.join(', ');
    return `${filterBulanDipilih.length} bulan dipilih`;
  }, [filterBulanDipilih]);

  const chartTitle = useMemo(() => {
    const xL = { bulan: 'Bulan', ZON: 'ZON', BALAI: 'BALAI', 'JENIS TERMINAL': 'Terminal' };
    const sL = { status: 'Status', ZON: 'ZON', BALAI: 'BALAI', 'JENIS TERMINAL': 'Terminal' };
    if (xAxisOption === 'bulan' && stackOption === 'status') return `Trend Status Mengikut Bulan (${getBulanLabel()})`;
    return `${sL[stackOption] || stackOption} Mengikut ${xL[xAxisOption] || xAxisOption} (${getBulanLabel()})`;
  }, [xAxisOption, stackOption, getBulanLabel]);

  const resetAll = useCallback(() => { setFilterZon([]); setFilterBalai([]); setFilterJenisTerminal([]); setFilterStatusSemasa([]); setFilterTanggungjawab([]); setFilterFinding([]); setSearchText(''); setFilterBulanDipilih([]); setFilterKerosakanSahaja(false); }, []);

  const exportCSV = useCallback(() => {
    if (!filteredData.length) { showNotification('Tiada data untuk dieksport', 'error'); return; }
    let ed = filteredData, eh = [];
    if (filterBulanDipilih.length > 0) {
      const FIXED = ['NO. SIRI', 'NO. ISSI TETRA', 'NO. TEI', 'SUBSCRIBER', 'VEHICLE REG NO.', 'ZON', 'BALAI', 'JENIS TERMINAL', 'TANGGUNGJAWAB PENGUJIAN', 'FINDING VS SPA', 'STATUS SEMASA 2026', 'TAHUN DIBEKAL', 'TAHUN DIPASANG', 'KUMPULAN', 'JENIS JENTERA'];
      const ah = Object.keys(filteredData[0]), ex = FIXED.filter((h) => ah.includes(h));
      const mh = []; selectedMonthColumns.forEach((mc) => { if (mc.status) mh.push(mc.status); if (mc.tt) mh.push(mc.tt); if (mc.tarikh) mh.push(mc.tarikh); });
      const sh = []; selectedMonthColumns.forEach((mc) => { if (mc.status && mh.includes(mc.status)) sh.push(mc.status); if (mc.tt && mh.includes(mc.tt)) sh.push(mc.tt); if (mc.tarikh && mh.includes(mc.tarikh)) sh.push(mc.tarikh); });
      eh = [...ex, ...sh];
      ed = filteredData.map((row) => { const nr = {}; eh.forEach((h) => { nr[h] = row[h] || ''; }); return nr; });
    } else { eh = Object.keys(filteredData[0]); }
    
    const csv = unparseCSV(ed);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); 
    const ts = new Date().toISOString().slice(0, 10);
    let bi; 
    if (filterBulanDipilih.length === 0) bi = 'semua-bulan'; 
    else if (filterBulanDipilih.length === 1) bi = filterBulanDipilih[0].replace(/\s+/g, '-').toLowerCase();
    else if (filterBulanDipilih.length === 2) bi = filterBulanDipilih.map((b) => b.replace(/\s+/g, '-').toLowerCase()).join('_');
    else bi = filterBulanDipilih.slice(0, 3).map((b) => b.replace(/\s+/g, '-').toLowerCase()).join('_') + `_dan-${filterBulanDipilih.length - 3}-lagi`;
    
    a.download = `jbpm-${bi}-${ts}.csv`; 
    a.click(); 
    URL.revokeObjectURL(a.href);
    showNotification(`${ed.length} rekod × ${eh.length} kolum berjaya dieksport!`, 'success');
  }, [filteredData, filterBulanDipilih, selectedMonthColumns, showNotification]);

  const hasActiveFilters = filterZon.length > 0 || filterBalai.length > 0 || filterJenisTerminal.length > 0 || filterStatusSemasa.length > 0 || filterTanggungjawab.length > 0 || filterFinding.length > 0 || filterBulanDipilih.length > 0 || searchText;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: isDarkMode ? '#0b1329' : '#eef2f6', 
      color: theme.textPrimary, 
      fontFamily: 'Inter, system-ui, sans-serif', 
      display: 'flex', 
      flexDirection: 'column', 
      transition: 'background-color 0.2s ease, color 0.2s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Layer */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${BG_IMAGE_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        opacity: isDarkMode ? 0.38 : 0.32,
        zIndex: 0,
        pointerEvents: 'none',
        filter: isDarkMode ? 'brightness(0.85) contrast(1.1) saturate(0.9)' : 'brightness(1.05) contrast(1.05) saturate(1.1)',
        transition: 'opacity 0.3s ease, filter 0.3s ease'
      }} />
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDarkMode 
          ? 'radial-gradient(circle at center, rgba(15, 23, 42, 0.5) 0%, rgba(11, 19, 41, 0.75) 100%)'
          : 'radial-gradient(circle at center, rgba(255, 255, 255, 0.35) 0%, rgba(238, 242, 246, 0.6) 100%)',
        zIndex: 1,
        pointerEvents: 'none',
        transition: 'background 0.3s ease'
      }} />

      {/* Content Layer */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Toast Notification */}
        {toastNotice && (
          <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderRadius: '12px', backgroundColor: toastNotice.type === 'error' ? 'rgba(211, 47, 47, 0.95)' : 'rgba(46, 125, 50, 0.95)', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', fontSize: '13px', fontWeight: '600', backdropFilter: 'blur(12px)' }}>
            {toastNotice.type === 'error' ? <AlertCircle style={{ width: '18px', height: '18px' }} /> : <Check style={{ width: '18px', height: '18px' }} />}
            <span>{toastNotice.msg}</span>
          </div>
        )}

        <header style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.border}`, padding: '16px 28px', boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 1000, transition: 'all 0.2s ease', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div style={{ maxWidth: '1800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {LOGO_URL ? (
                <img src={LOGO_URL} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
              ) : (
                <div style={{ backgroundColor: '#d32f2f', padding: '8px', borderRadius: '10px', color: '#fff', display: 'flex', gap: '4px' }}>
                  <Siren style={{ width: '18px', height: '18px' }} /><Flame style={{ width: '18px', height: '18px' }} />
                </div>
              )}
              <div>
                <h1 style={{ fontSize: '19px', fontWeight: '800', color: theme.textPrimary, margin: 0, letterSpacing: '-0.2px' }}>DASHBOARD ASET GIRN <span style={{ color: '#1976d2' }}>JBPM NEGERI JOHOR</span></h1>
                <p style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '600', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock style={{ width: '12px', height: '12px', color: '#1976d2' }} /> Kemaskini Terakhir: {lastUpdate ? lastUpdate.toLocaleString('ms-MY') : 'Memuatkan...'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ padding: '8px 14px', backgroundColor: theme.cardBg, color: theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', backdropFilter: 'blur(12px)', transition: 'transform 0.1s ease' }}>
                {isDarkMode ? <Sun style={{ width: '15px', height: '15px', color: '#f59e0b' }} /> : <Moon style={{ width: '15px', height: '15px', color: '#6366f1' }} />}
                <span>{isDarkMode ? 'Mod Siang' : 'Mod Malam'}</span>
              </button>
              <button onClick={() => setActiveTab(t => t === 'dashboard' ? 'table' : 'dashboard')} style={{ padding: '8px 14px', backgroundColor: theme.cardBg, color: theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', backdropFilter: 'blur(12px)' }}>
                {activeTab === 'dashboard' ? <><Table2 style={{ width: '15px', height: '15px', color: '#1976d2' }} /> Jadual</> : <><BarChart3 style={{ width: '15px', height: '15px', color: '#1976d2' }} /> Dashboard</>}
              </button>
              <button onClick={exportCSV} style={{ padding: '8px 14px', backgroundColor: theme.cardBg, color: theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', backdropFilter: 'blur(12px)' }}>
                <Download style={{ width: '15px', height: '15px', color: '#2e7d32' }} /> Eksport
              </button>
              <button onClick={fetchData} disabled={loading} style={{ padding: '8px 16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)' }}>
                <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
              </button>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, maxWidth: '1800px', margin: '0 auto', padding: '24px 20px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: theme.textSecondary, backgroundColor: theme.cardBg, borderRadius: '8px', padding: '8px 14px', marginBottom: '20px', border: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', fontWeight: '600' }}>
            <Clock style={{ width: '13px', height: '13px', color: '#1976d2' }} /> Auto-refresh 6 jam | JBPM Negeri Johor
          </div>

          {error && (
            <div style={{ backgroundColor: isDarkMode ? 'rgba(211, 47, 47, 0.3)' : 'rgba(254, 226, 226, 0.9)', border: '1px solid #ef9a9a', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', backdropFilter: 'blur(12px)' }}>
              <Siren style={{ width: '18px', height: '18px', color: '#c62828' }} /><p style={{ color: '#c62828', fontWeight: '600', margin: 0, fontSize: '13px' }}>{error}</p>
            </div>
          )}

          {/* Tapisan Filter Section */}
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '18px', padding: '20px', boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.35)' : '0 8px 32px rgba(31, 38, 135, 0.07)', border: `1px solid ${theme.border}`, marginBottom: '24px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showFilters ? '16px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ backgroundColor: isDarkMode ? 'rgba(25, 118, 210, 0.3)' : '#e3f2fd', padding: '6px', borderRadius: '8px' }}><Filter style={{ width: '18px', height: '18px', color: '#1976d2' }} /></div>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: theme.textPrimary, margin: 0 }}>Tapisan Data</h2>
                <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>({filteredData.length} rekod dijumpai)</span>
              </div>
              <button onClick={() => setShowFilters(!showFilters)} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                {showFilters ? <>Tutup <ChevronUp style={{ width: '16px', height: '16px' }} /></> : <>Buka Tapisan <ChevronDown style={{ width: '16px', height: '16px' }} /></>}
              </button>
            </div>
            {showFilters && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  {[
                    ['BULAN', filterBulanDipilih, setFilterBulanDipilih, monthOptions, 'Pilih Bulan...', 'Cari bulan...', Calendar],
                    ['ZON', filterZon, setFilterZon, uniqueValues.zon, 'Pilih Zon...', 'Cari zon...', MapPin],
                    ['BALAI', filterBalai, setFilterBalai, uniqueValues.balai, 'Pilih Balai...', 'Cari balai...', Building2],
                    ['TERMINAL', filterJenisTerminal, setFilterJenisTerminal, uniqueValues.jenisTerminal, 'Pilih Terminal...', 'Cari terminal...', Radio],
                    ['STATUS', filterStatusSemasa, setFilterStatusSemasa, allStatusOptions, 'Pilih Status...', 'Cari status...', Activity],
                    ['T.JAWAB', filterTanggungjawab, setFilterTanggungjawab, uniqueValues.tanggungjawab, 'Pilih T.Jawab...', 'Cari t.jawab...', UserCheck],
                    ['FINDING', filterFinding, setFilterFinding, uniqueValues.finding, 'Pilih Finding...', 'Cari finding...', Search],
                  ].map(([label, val, setVal, options, placeholder, searchPlaceholder, IconComponent]) => (
                    <div key={label}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: theme.textSecondary, marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        <IconComponent style={{ width: '13px', height: '13px', color: '#1976d2' }} />
                        <span>{label}</span>
                        {val.length > 0 && <span style={{ color: '#1976d2', marginLeft: '2px' }}>({val.length})</span>}
                      </label>
                      <MultiSelectDropdown options={options} selected={val} onChange={setVal} placeholder={placeholder} searchPlaceholder={searchPlaceholder} disabled={false} isDarkMode={isDarkMode} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: theme.textPrimary, backdropFilter: 'blur(8px)' }}>
                    <input type="checkbox" checked={filterKerosakanSahaja} onChange={(e) => setFilterKerosakanSahaja(e.target.checked)} style={{ width: '15px', height: '15px', accentColor: '#f57c00' }} />
                    <span style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}><AlertTriangle style={{ width: '14px', height: '14px', color: '#f57c00' }} /> Kerosakan Sahaja</span>
                  </label>
                  <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <Search style={{ width: '15px', height: '15px', color: theme.textMuted, position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Cari NO. SIRI / ISSI / SUBSCRIBER..." style={{ width: '100%', padding: '8px 12px 8px 36px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '12px', color: theme.textPrimary, outline: 'none', boxSizing: 'border-box', backdropFilter: 'blur(8px)' }} />
                    {searchText && <X style={{ width: '14px', height: '14px', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, cursor: 'pointer' }} onClick={() => setSearchText('')} />}
                  </div>
                </div>
                {hasActiveFilters && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${theme.border}`, alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Tag style={{ width: '13px', height: '13px' }} /> Tapisan Aktif:
                    </span>
                    {filterBulanDipilih.length > 0 && <FilterBadge label={`BULAN: ${filterBulanDipilih.length}`} type="gold" isDarkMode={isDarkMode} onRemove={() => { setFilterBulanDipilih([]); setFilterKerosakanSahaja(false); }} />}
                    {filterZon.length > 0 && <FilterBadge label={`ZON: ${filterZon.length}`} isDarkMode={isDarkMode} onRemove={() => setFilterZon([])} />}
                    {filterBalai.length > 0 && <FilterBadge label={`BALAI: ${filterBalai.length}`} isDarkMode={isDarkMode} onRemove={() => setFilterBalai([])} />}
                    {filterJenisTerminal.length > 0 && <FilterBadge label={`TERMINAL: ${filterJenisTerminal.length}`} isDarkMode={isDarkMode} onRemove={() => setFilterJenisTerminal([])} />}
                    {filterStatusSemasa.length > 0 && <FilterBadge label={`STATUS: ${filterStatusSemasa.length}`} type="amber" isDarkMode={isDarkMode} onRemove={() => setFilterStatusSemasa([])} />}
                    {filterTanggungjawab.length > 0 && <FilterBadge label={`T.JAWAB: ${filterTanggungjawab.length}`} isDarkMode={isDarkMode} onRemove={() => setFilterTanggungjawab([])} />}
                    {filterFinding.length > 0 && <FilterBadge label={`FINDING: ${filterFinding.length}`} isDarkMode={isDarkMode} onRemove={() => setFilterFinding([])} />}
                    {filterKerosakanSahaja && <FilterBadge label="KEROSAKAN SAHAJA" type="amber" isDarkMode={isDarkMode} onRemove={() => setFilterKerosakanSahaja(false)} />}
                    <button onClick={resetAll} style={{ fontSize: '11px', color: '#e53935', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', marginLeft: '6px' }}>Reset Semua Tapisan</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <Flame style={{ width: '48px', height: '48px', color: '#1976d2', animation: 'pulse 2s ease-in-out infinite' }} />
                <p style={{ color: theme.textSecondary, fontWeight: '600', marginTop: '12px', fontSize: '13px' }}>Memuatkan data aset GIRN JBPM...</p>
              </div>
            </div>
          ) : activeTab === 'dashboard' ? (
            <>
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Jumlah Aset', value: stats.total, color: '#1976d2', bg: isDarkMode ? 'rgba(25, 118, 210, 0.35)' : 'rgba(227, 242, 253, 0.85)', icon: Flame, sub: filteredData.length !== rawData.length ? `Ditapis dari ${rawData.length}` : 'Keseluruhan' },
                  { label: 'Beroperasi (Baik)', value: stats.baik, color: '#2e7d32', bg: isDarkMode ? 'rgba(46, 125, 50, 0.35)' : 'rgba(232, 245, 233, 0.85)', icon: BadgeCheck, sub: `${stats.total > 0 ? ((stats.baik / stats.total) * 100).toFixed(1) : 0}% | ${getBulanLabel()}` },
                  { label: 'Kerosakan', value: stats.rosak, color: '#c62828', bg: isDarkMode ? 'rgba(198, 40, 40, 0.35)' : 'rgba(255, 235, 238, 0.85)', icon: Siren, sub: `${stats.total > 0 ? ((stats.rosak / stats.total) * 100).toFixed(1) : 0}% | ${getBulanLabel()}` }
                ].map((s, i) => (
                  <div key={i} style={{ backgroundColor: theme.cardBg, borderRadius: '18px', padding: '20px', boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.35)' : '0 8px 32px rgba(31, 38, 135, 0.07)', border: `1px solid ${theme.border}`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: s.color, marginBottom: '8px' }}>
                      <div style={{ backgroundColor: s.bg, padding: '8px', borderRadius: '10px', backdropFilter: 'blur(4px)' }}><s.icon style={{ width: '20px', height: '20px', color: s.color }} /></div>
                      <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                    </div>
                    <p style={{ fontSize: '32px', fontWeight: '900', color: theme.textPrimary, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>{s.value}</p>
                    <p style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600', margin: 0 }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Panel Graf Pelbagai & Dynamic Interactive */}
              <div style={{
                backgroundColor: theme.cardBg,
                borderRadius: '18px',
                padding: '20px',
                boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.35)' : '0 8px 32px rgba(31, 38, 135, 0.07)',
                border: `1px solid ${theme.border}`,
                marginBottom: '24px',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                position: isZoomed ? 'fixed' : 'relative',
                top: isZoomed ? '10px' : 'auto',
                left: isZoomed ? '10px' : 'auto',
                right: isZoomed ? '10px' : 'auto',
                bottom: isZoomed ? '10px' : 'auto',
                zIndex: isZoomed ? 99999 : 1,
                overflowY: isZoomed ? 'auto' : 'visible'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <BarChart3 style={{ width: '20px', height: '20px', color: '#1976d2' }} />
                    {chartTitle}
                  </h3>
                  
                  {/* Butang Zoom Penuh */}
                  <button 
                    onClick={() => setIsZoomed(!isZoomed)}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                      color: theme.textPrimary,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isZoomed ? <Minimize2 style={{ width: '16px', height: '16px' }} /> : <Maximize2 style={{ width: '16px', height: '16px' }} />}
                    <span>{isZoomed ? 'Tutup Zoom' : 'Zoom Penuh'}</span>
                  </button>
                </div>

                {/* Pemilih Jenis Graf Pelbagai */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px', backgroundColor: isDarkMode ? 'rgba(15,23,42,0.4)' : 'rgba(241,245,249,0.6)', padding: '12px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                  <div style={{ minWidth: '180px' }}>
                    <label style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '700', display: 'block', marginBottom: '4px' }}>Jenis Graf / Visual:</label>
                    <select value={chartType} onChange={(e) => setChartType(e.target.value)} style={{ width: '100%', padding: '6px 12px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '12px', backgroundColor: theme.inputBg, color: theme.textPrimary, outline: 'none', fontWeight: '600' }}>
                      <option value="bar_vertical">📊 Graf Bar Menegak</option>
                      <option value="bar_horizontal">📊 Graf Bar Mendatar</option>
                      <option value="line">📈 Graf Garisan (Line Chart)</option>
                      <option value="area">📉 Graf Kawasan (Area Chart)</option>
                      <option value="candlestick">🕯️ Carta Candlestick (Julat Prestasi)</option>
                      <option value="scatter">🔵 Carta Taburan / Gelembung</option>
                      <option value="boxplot">📦 Plot Kotak (Box Plot Statistik)</option>
                      <option value="sankey">🔀 Carta Aliran (Sankey Flow)</option>
                      <option value="gantt">📅 Carta Gantt (Penyelenggaraan)</option>
                    </select>
                  </div>

                  {['bar_vertical', 'bar_horizontal', 'line', 'area'].includes(chartType) && (
                    <>
                      <div>
                        <label style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '700', display: 'block', marginBottom: '4px' }}>Paksi-X (X-Axis):</label>
                        <select value={xAxisOption} onChange={(e) => setXAxisOption(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '12px', backgroundColor: theme.inputBg, color: theme.textPrimary, outline: 'none' }}>
                          <option value="bulan">Bulan</option>
                          <option value="ZON">ZON</option>
                          <option value="BALAI">BALAI</option>
                          <option value="JENIS TERMINAL">TERMINAL</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '700', display: 'block', marginBottom: '4px' }}>Pecahan Data:</label>
                        <select value={stackOption} onChange={(e) => setStackOption(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '12px', backgroundColor: theme.inputBg, color: theme.textPrimary, outline: 'none' }}>
                          <option value="status">Status</option>
                          <option value="ZON">ZON</option>
                          <option value="BALAI">BALAI</option>
                          <option value="JENIS TERMINAL">TERMINAL</option>
                        </select>
                      </div>
                      {['bar_vertical', 'bar_horizontal'].includes(chartType) && (
                        <div>
                          <label style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '700', display: 'block', marginBottom: '4px' }}>Susunan Graf:</label>
                          <select value={isStacked ? 'stacked' : 'grouped'} onChange={(e) => setIsStacked(e.target.value === 'stacked')} style={{ padding: '6px 12px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '12px', backgroundColor: theme.inputBg, color: theme.textPrimary, outline: 'none' }}>
                            <option value="stacked">Bertindan (Stacked)</option>
                            <option value="grouped">Bersebelahan (Grouped)</option>
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Komponen Visualisasi Dinamik Mengikut Pilihan */}
                {dynamicChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={isZoomed ? 650 : 420}>
                    {(() => {
                      // 1. Graf Bar Menegak
                      if (chartType === 'bar_vertical') {
                        return (
                          <BarChart data={dynamicChartData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} />
                            <XAxis dataKey="name" stroke={theme.textSecondary} fontSize={11} angle={-35} textAnchor="end" height={70} tick={{ fontWeight: '600' }} />
                            <YAxis stroke={theme.textSecondary} fontSize={11} tick={{ fontWeight: '600' }} />
                            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.textPrimary, fontSize: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '11px', color: theme.textPrimary, paddingTop: '10px' }} />
                            {Object.keys(dynamicChartData[0] || {}).filter(k => k !== 'name' && k !== 'total').map((k, i) => (
                              <Bar key={k} dataKey={k} fill={STATUS_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]} name={k} radius={[4, 4, 0, 0]} stackId={isStacked ? "s" : undefined} />
                            ))}
                          </BarChart>
                        );
                      }

                      // 2. Graf Bar Mendatar
                      if (chartType === 'bar_horizontal') {
                        return (
                          <BarChart data={dynamicChartData} layout="vertical" barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} />
                            <XAxis type="number" stroke={theme.textSecondary} fontSize={11} />
                            <YAxis dataKey="name" type="category" stroke={theme.textSecondary} fontSize={11} width={100} tick={{ fontWeight: '600' }} />
                            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.textPrimary }} />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            {Object.keys(dynamicChartData[0] || {}).filter(k => k !== 'name' && k !== 'total').map((k, i) => (
                              <Bar key={k} dataKey={k} fill={STATUS_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]} name={k} radius={[0, 4, 4, 0]} stackId={isStacked ? "s" : undefined} />
                            ))}
                          </BarChart>
                        );
                      }

                      // 3. Graf Garisan (Line Chart)
                      if (chartType === 'line') {
                        return (
                          <LineChart data={dynamicChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} />
                            <XAxis dataKey="name" stroke={theme.textSecondary} fontSize={11} angle={-35} textAnchor="end" height={70} />
                            <YAxis stroke={theme.textSecondary} fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', border: `1px solid ${theme.border}` }} />
                            <Legend />
                            {Object.keys(dynamicChartData[0] || {}).filter(k => k !== 'name' && k !== 'total').map((k, i) => (
                              <Line key={k} type="monotone" dataKey={k} stroke={STATUS_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={3} dot={{ r: 4 }} name={k} />
                            ))}
                          </LineChart>
                        );
                      }

                      // 4. Graf Kawasan (Area Chart)
                      if (chartType === 'area') {
                        return (
                          <AreaChart data={dynamicChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} />
                            <XAxis dataKey="name" stroke={theme.textSecondary} fontSize={11} angle={-35} textAnchor="end" height={70} />
                            <YAxis stroke={theme.textSecondary} fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', border: `1px solid ${theme.border}` }} />
                            <Legend />
                            {Object.keys(dynamicChartData[0] || {}).filter(k => k !== 'name' && k !== 'total').map((k, i) => (
                              <Area key={k} type="monotone" dataKey={k} stackId="1" stroke={STATUS_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]} fill={STATUS_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]} name={k} />
                            ))}
                          </AreaChart>
                        );
                      }

                      // 5. Carta Candlestick (Prestasi & Julat Keberkesanan Pengujian)
                      if (chartType === 'candlestick') {
                        return (
                          <ComposedChart data={candlestickData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} />
                            <XAxis dataKey="name" stroke={theme.textSecondary} fontSize={11} />
                            <YAxis stroke={theme.textSecondary} fontSize={11} unit="%" />
                            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)' }} />
                            <Bar dataKey="high" fill="#00C853" opacity={0.3} barSize={6} name="Julat Tinggi" />
                            <Bar dataKey="open" fill="#1976d2" barSize={18} name="Peratus Baik (%)" />
                            <Line type="monotone" dataKey="close" stroke="#FF1744" strokeWidth={3} name="Julat Trend Rendah" />
                          </ComposedChart>
                        );
                      }

                      // 6. Carta Taburan / Gelembung (Scatter & Bubble)
                      if (chartType === 'scatter') {
                        return (
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} />
                            <XAxis dataKey="x" name="ID ISSI" stroke={theme.textSecondary} fontSize={11} />
                            <YAxis dataKey="y" name="Indeks Zon" stroke={theme.textSecondary} fontSize={11} />
                            <ZAxis dataKey="z" range={[50, 400]} name="Saiz Peranti" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Peranti TETRA" data={scatterData} fill="#1976d2" />
                          </ScatterChart>
                        );
                      }

                      // 7. Plot Kotak / Violin (Variasi Taburan Peranti)
                      if (chartType === 'boxplot') {
                        return (
                          <BarChart data={boxPlotData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} />
                            <XAxis dataKey="name" stroke={theme.textSecondary} fontSize={11} />
                            <YAxis stroke={theme.textSecondary} fontSize={11} />
                            <Tooltip />
                            <Bar dataKey="min" fill="#90caf9" name="Min (Awal)" />
                            <Bar dataKey="median" fill="#1565c0" name="Median (Purata)" />
                            <Bar dataKey="max" fill="#0d47a1" name="Maksimum" />
                          </BarChart>
                        );
                      }

                      // 8. Carta Aliran / Sankey
                      if (chartType === 'sankey') {
                        return (
                          <BarChart data={sankeyFlowData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="source" type="category" width={100} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#448AFF" name="Aliran Aset Dari Zon" />
                          </BarChart>
                        );
                      }

                      // 9. Carta Gantt (Penyelenggaraan / Pengujian)
                      if (chartType === 'gantt') {
                        return (
                          <BarChart data={ganttData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 12]} stroke={theme.textSecondary} />
                            <YAxis dataKey="bulan" type="category" stroke={theme.textSecondary} width={120} />
                            <Tooltip />
                            <Bar dataKey="tempoh" fill="#00C853" name="Fasa Tempoh Pengujian (Bulan)" />
                          </BarChart>
                        );
                      }

                      return null;
                    })()}
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted, fontSize: '13px', fontWeight: '500' }}>
                    Sila pilih bulan atau tapisan di atas untuk melihat carta.
                  </div>
                )}
              </div>

              {/* Carta Pai, Donat & Carta Sokongan */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <PieChartCard title={`Carta Pai Status (${getBulanLabel()})`} data={statusDistribution} colorMap={STATUS_COLORS} isDarkMode={isDarkMode} innerRadius={0} />
                <PieChartCard title="Carta Donat Mengikut ZON" data={zonDistribution} isDarkMode={isDarkMode} innerRadius={45} />
                <PieChartCard title="Top 10 BALAI" data={balaiDistribution} isDarkMode={isDarkMode} innerRadius={0} />
                <PieChartCard title="Jenis Terminal" data={terminalDistribution} isDarkMode={isDarkMode} innerRadius={40} />
              </div>
            </>
          ) : (
            /* Tab Jadual Data */
            <div style={{ backgroundColor: theme.cardBg, borderRadius: '18px', padding: '20px', boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.35)' : '0 8px 32px rgba(31, 38, 135, 0.07)', border: `1px solid ${theme.border}`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: theme.textPrimary, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Table2 style={{ width: '16px', height: '16px', color: '#1976d2' }} />Data Peranti Terminal — <span style={{ color: '#1976d2' }}>{filteredData.length} rekod</span></h3>
                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(+e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '12px', backgroundColor: theme.inputBg, color: theme.textPrimary, outline: 'none' }}>
                  {[10, 25, 50, 100, 200, 300].map(v => <option key={v} value={v}>{v} baris se-halaman</option>)}
                </select>
              </div>
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: theme.tableHeaderBg, borderBottom: `2px solid ${theme.border}` }}>
                      {(() => {
                        const b = ['#', 'NO. SIRI', 'TERMINAL', 'ISSI', 'SUBSCRIBER', 'ZON', 'BALAI', 'T.JAWAB'], mh = [];
                        if (filterBulanDipilih.length > 0) selectedMonthColumns.forEach((mc) => { mh.push(`STATUS ${mc.label}`); mh.push(`TARIKH ${mc.label}`); });
                        else { mh.push('STATUS'); mh.push('TARIKH UJIAN'); }
                        return [...b, ...mh, 'REG NO.'];
                      })().map((h) => (<th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '800', color: theme.textSecondary, whiteSpace: 'nowrap', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((d, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background-color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.tableRowHover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td style={{ padding: '8px 12px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px' }}>{(currentPage - 1) * rowsPerPage + i + 1}</td>
                        <td style={{ padding: '8px 12px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '11px', fontWeight: '700' }}>{d['NO. SIRI'] || '—'}</td>
                        <td style={{ padding: '8px 12px', color: theme.textSecondary, fontSize: '11px', fontWeight: '500' }}>{d['JENIS TERMINAL'] || '—'}</td>
                        <td style={{ padding: '8px 12px', color: theme.textSecondary, fontFamily: 'monospace', fontSize: '11px' }}>{d['NO. ISSI TETRA'] || '—'}</td>
                        <td style={{ padding: '8px 12px', color: theme.textSecondary, fontSize: '11px' }}>{d['SUBSCRIBER'] || '—'}</td>
                        <td style={{ padding: '8px 12px', color: theme.textSecondary, fontWeight: '600', fontSize: '11px' }}>{d['ZON'] || '—'}</td>
                        <td style={{ padding: '8px 12px', color: theme.textSecondary, fontSize: '11px' }}>{d['BALAI'] || '—'}</td>
                        <td style={{ padding: '8px 12px', color: theme.textSecondary, fontSize: '11px' }}>{d['TANGGUNGJAWAB PENGUJIAN'] || '—'}</td>
                        {filterBulanDipilih.length > 0 ? selectedMonthColumns.map((mc) => (
                          <React.Fragment key={mc.label}>
                            <td style={{ padding: '8px 12px' }}><StatusBadge status={mc.status && d[mc.status] ? normalizeStatus(d[mc.status]) : 'TIADA DATA'} isDarkMode={isDarkMode} /></td>
                            <td style={{ padding: '8px 12px', color: theme.textSecondary, fontSize: '11px', whiteSpace: 'nowrap' }}>{(mc.tarikh && d[mc.tarikh]) || '—'}</td>
                          </React.Fragment>
                        )) : (
                          <>
                            <td style={{ padding: '8px 12px' }}><StatusBadge status={activeStatusCol ? normalizeStatus(d[activeStatusCol]) : 'TIADA DATA'} isDarkMode={isDarkMode} /></td>
                            <td style={{ padding: '8px 12px', color: theme.textSecondary, fontSize: '11px', whiteSpace: 'nowrap' }}>{(activeTarikhUjianCol && d[activeTarikhUjianCol]) || '—'}</td>
                          </>
                        )}
                        <td style={{ padding: '8px 12px', color: theme.textSecondary, fontFamily: 'monospace', fontSize: '11px' }}>{d['VEHICLE REG NO.'] || '—'}</td>
                      </tr>
                    ))}
                    {!paginatedData.length && (
                      <tr><td colSpan={8 + (filterBulanDipilih.length > 0 ? selectedMonthColumns.length * 2 : 2) + 1} style={{ textAlign: 'center', padding: '50px 0', color: theme.textMuted, fontSize: '12px' }}>
                        <HelpCircle style={{ width: '32px', height: '32px', margin: '0 auto 8px', opacity: 0.4, display: 'block' }} />Tiada data dijumpai mengikut kriteria tapisan anda</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${theme.border}`, alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>Halaman {currentPage} daripada {totalPages} ({filteredData.length} jumlah rekod)</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['««','«'].map((t, i) => (
                      <button key={t} onClick={() => setCurrentPage(i === 0 ? 1 : (p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                        style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '6px', color: currentPage === 1 ? theme.textMuted : theme.textPrimary, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '700' }}>{t}</button>
                    ))}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { 
                      let p; 
                      if (totalPages <= 5) p = i + 1; 
                      else if (currentPage <= 3) p = i + 1; 
                      else if (currentPage >= totalPages - 2) p = totalPages - 4 + i; 
                      else p = currentPage - 2 + i;
                      return (<button key={p} onClick={() => setCurrentPage(p)} style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: currentPage === p ? '#1976d2' : theme.cardBg, color: currentPage === p ? '#fff' : theme.textPrimary, border: currentPage === p ? '1px solid #1565c0' : `1px solid ${theme.border}`, borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>{p}</button>);
                    })}
                    {['»','»»'].map((t, i) => (
                      <button key={t} onClick={() => setCurrentPage(i === 0 ? (p) => Math.min(totalPages, p + 1) : totalPages)} disabled={currentPage === totalPages}
                        style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '6px', color: currentPage === totalPages ? theme.textMuted : theme.textPrimary, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: '700' }}>{t}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <footer style={{ backgroundColor: theme.headerBg, borderTop: `1px solid ${theme.border}`, padding: '14px 20px', textAlign: 'center', position: 'sticky', bottom: 0, zIndex: 1000, boxShadow: isDarkMode ? '0 -4px 20px rgba(0,0,0,0.4)' : '0 -4px 20px rgba(0,0,0,0.06)', transition: 'all 0.2s ease', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Truck style={{ width: '15px', height: '15px', color: '#d32f2f' }} />
            <span>Data Pengurusan Aset GIRN <strong style={{ color: '#1976d2' }}>Jabatan Bomba & Penyelamat Malaysia Negeri Johor</strong></span>
            {filterBulanDipilih.length > 0 && <span style={{ color: '#f57c00' }}>| Bulan Dipilih: {getBulanLabel()}</span>}
          </div>
          <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '500' }}>
            Dibangunkan oleh: <span style={{ fontWeight: '700', color: '#1976d2' }}>PB Mohamad Aidil</span> | Unit: <span style={{ fontWeight: '700', color: theme.textSecondary }}>PGO Johor</span> | Hak Cipta &copy; 2026
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
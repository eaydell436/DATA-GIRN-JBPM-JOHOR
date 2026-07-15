import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
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
  Menu,
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
  'TIADA DATA': '#607D8B',
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
// RESPONSIVE HOOK
// ============================================
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    
    // Modern browsers
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// ============================================
// HELPERS
// ============================================
const extractMonthlyColumns = (headers) => {
  const monthNames = [
    'JUN 2026', 'MEI 2026', 'APRIL 2026', 'MAC 2026',
    'FEB 2026', 'JAN 2026', 'DIS 2025', 'NOVEMBER 2025',
    'OKT 2025', 'SEPT 2025', 'OGOS 2025', 'JULAI 2025',
    'JUN 2025', 'MEI 2025', 'APR 2025', 'MAC 2025',
    'FEB 2025', 'JAN 2025', 'DISEMBER 2024', 'NOV 2024',
    'OKT 2024', 'SEPT 2024', 'OGOS 2024', 'JUL 2024',
    'JUN 2024', 'MEI 2024', 'APR 2024', 'MAC 2024',
    'FEB 2024', 'JAN 2024', 'DISEMBER', 'NOVEMBER',
    'OKTOBER', 'SEPTEMBER', 'OGOS', 'JUL', 'JUN',
    'MEI', 'APRIL', 'MAC', 'FEB', 'JAN',
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
// RESPONSIVE STYLES HELPER
// ============================================
const responsiveStyles = {
  // Container padding
  container: {
    base: { padding: '20px' },
    mobile: { padding: '12px' },
    tablet: { padding: '16px' },
  },
  
  // Heading sizes
  heading: {
    base: { fontSize: '28px' },
    mobile: { fontSize: '18px' },
    tablet: { fontSize: '22px' },
  },
  
  // Card padding
  card: {
    base: { padding: '20px' },
    mobile: { padding: '14px' },
  },
  
  // Button sizes
  button: {
    base: { padding: '10px 18px', fontSize: '14px' },
    mobile: { padding: '12px 16px', fontSize: '13px', minHeight: '44px' },
  },
};

// ============================================
// COMPONENTS
// ============================================
const StatusBadge = memo(({ status }) => {
  const colorMap = {
    BAIK: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
    ROSAK: { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' },
    'TIDAK DIJUMPAI': { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' },
    'TIDAK DAPAT DIUJI': { bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' },
    'BER - TINDAKAN SAPURA': { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
    'BER - TINDAKAN JABATAN': { bg: '#e0f7fa', text: '#00838f', border: '#80deea' },
    'BER - SELESAI PROSES PELUPUSAN': { bg: '#f5f5f5', text: '#616161', border: '#bdbdbd' },
    'TIADA DATA': { bg: '#eceff1', text: '#546e7a', border: '#b0bec5' },
  };
  const colors = colorMap[status] || colorMap['TIADA DATA'];
  const Icon = STATUS_ICONS[status] || HelpCircle;

  return (
    <span
      className="status-badge"
      style={{
        fontSize: 'clamp(10px, 1.5vw, 12px)',
        padding: 'clamp(3px, 0.5vw, 4px) clamp(6px, 1vw, 10px)',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.bg,
        color: colors.text,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: '500',
      }}
    >
      <Icon style={{ width: 'clamp(10px, 1.5vw, 12px)', height: 'clamp(10px, 1.5vw, 12px)' }} /> 
      {status}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

const FilterBadge = memo(({ label, onRemove, type = 'default' }) => {
  const typeStyles = {
    default: { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
    amber: { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' },
    gold: { bg: '#fffde7', text: '#f9a825', border: '#fff59d' },
  };
  const style = typeStyles[type] || typeStyles.default;

  return (
    <span
      className="filter-badge"
      style={{
        fontSize: 'clamp(10px, 1.5vw, 12px)',
        padding: 'clamp(3px, 0.5vw, 4px) clamp(6px, 1vw, 10px)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: '500',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        minHeight: '32px',
      }}
    >
      {label}
      <X
        style={{ width: '14px', height: '14px', cursor: 'pointer', minWidth: '14px' }}
        onClick={onRemove}
      />
    </span>
  );
});

FilterBadge.displayName = 'FilterBadge';

const PieChartCard = memo(({ title, data, colorMap, isMobile }) => (
  <div
    className="pie-card"
    style={{
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: isMobile ? '14px' : '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e0e0e0',
      width: '100%',
    }}
  >
    <h3
      style={{
        fontSize: 'clamp(11px, 1.8vw, 14px)',
        fontWeight: '600',
        color: '#424242',
        marginBottom: '16px',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {title}
    </h3>
    <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
      <RePieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={isMobile ? 60 : 80}
          innerRadius={isMobile ? 30 : 40}
          paddingAngle={4}
        >
          {data.map((_, idx) => (
            <Cell
              key={idx}
              fill={colorMap?.[data[idx].name] || PIE_COLORS[idx % PIE_COLORS.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            color: '#333',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
          }}
        />
      </RePieChart>
    </ResponsiveContainer>
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'center',
        marginTop: '12px',
      }}
    >
      {data.slice(0, isMobile ? 3 : 5).map((e, i) => (
        <span
          key={i}
          style={{
            fontSize: 'clamp(10px, 1.3vw, 12px)',
            color: '#757575',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: colorMap?.[e.name] || PIE_COLORS[i],
            }}
          />
          {e.name}:{' '}
          <span style={{ fontWeight: '600', color: '#424242' }}>{e.value}</span>
        </span>
      ))}
    </div>
  </div>
));

PieChartCard.displayName = 'PieChartCard';

// ============================================
// MULTI-SELECT DROPDOWN (MOBILE OPTIMIZED)
// ============================================
const MultiSelectDropdown = memo(
  ({ options, selected, onChange, placeholder, searchPlaceholder, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
          setSearch('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }, []);

    const filteredOptions = useMemo(
      () =>
        options.filter((opt) =>
          opt.toLowerCase().includes(search.toLowerCase())
        ),
      [options, search]
    );

    const toggleOption = useCallback(
      (option) => {
        if (selected.includes(option)) {
          onChange(selected.filter((s) => s !== option));
        } else {
          onChange([...selected, option]);
        }
      },
      [selected, onChange]
    );

    const selectAll = useCallback(() => onChange([...options]), [options, onChange]);
    const deselectAll = useCallback(() => onChange([]), [onChange]);

    return (
      <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="dropdown-trigger"
          style={{
            width: '100%',
            padding: 'clamp(10px, 1.5vw, 12px) clamp(12px, 2vw, 14px)',
            minHeight: '44px',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: 'clamp(13px, 1.5vw, 14px)',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: selected.length === 0 ? '#999' : '#333',
            transition: 'border-color 0.2s',
          }}
        >
          <span>
            {selected.length === 0 ? placeholder : `${selected.length} dipilih`}
          </span>
          <ChevronDown
            style={{
              width: '16px',
              height: '16px',
              minWidth: '16px',
              color: '#999',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          />
        </button>

        {isOpen && (
          <div
            className="dropdown-menu"
            style={{
              position: 'fixed',
              top: 'auto',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              marginTop: '4px',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              maxHeight: '50vh',
              width: '90vw',
              maxWidth: '400px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  style={{
                    width: '14px',
                    height: '14px',
                    color: '#999',
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="dropdown-search"
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 32px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    minHeight: '44px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '4px',
                padding: '6px 8px',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <button
                onClick={selectAll}
                className="dropdown-action-btn"
                style={{
                  fontSize: 'clamp(12px, 1.5vw, 13px)',
                  color: '#1976d2',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  minHeight: '44px',
                  fontWeight: '500',
                }}
              >
                Pilih Semua
              </button>
              <button
                onClick={deselectAll}
                className="dropdown-action-btn"
                style={{
                  fontSize: 'clamp(12px, 1.5vw, 13px)',
                  color: '#999',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  minHeight: '44px',
                  fontWeight: '500',
                }}
              >
                Reset
              </button>
            </div>
            <div style={{ maxHeight: '35vh', overflowY: 'auto' }}>
              {filteredOptions.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#999',
                    fontSize: '13px',
                  }}
                >
                  Tiada dijumpai
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <label
                    key={option}
                    onClick={() => toggleOption(option)}
                    className="dropdown-option"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      color: selected.includes(option) ? '#1976d2' : '#666',
                      backgroundColor: selected.includes(option)
                        ? '#f5f5f5'
                        : 'transparent',
                      fontSize: 'clamp(13px, 1.5vw, 14px)',
                      fontWeight: selected.includes(option) ? '600' : '400',
                      transition: 'background-color 0.15s',
                      minHeight: '44px',
                      borderBottom: '1px solid #f5f5f5',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = '#fafafa')
                    }
                    onMouseLeave={(e) => {
                      if (!selected.includes(option)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      } else {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option)}
                      onChange={() => {}}
                      style={{
                        width: '18px',
                        height: '18px',
                        minWidth: '18px',
                        accentColor: '#1976d2',
                      }}
                    />
                    <span>{option}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MultiSelectDropdown.displayName = 'MultiSelectDropdown';

// ============================================
// MAIN APP
// ============================================
export default function App() {
  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Filters
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
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 10 : 25);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Update rows per page when device changes
  useEffect(() => {
    setRowsPerPage(isMobile ? 10 : isTablet ? 20 : 25);
  }, [isMobile, isTablet]);

  const tarikhUjianHeader = useMemo(() => {
    return headers.find((h) =>
      h.replace(/\s+/g, ' ').trim().toUpperCase().includes('TARIKH PENGUJIAN')
    );
  }, [headers]);

  // Fetch data
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

  const monthlyColumns = useMemo(() => extractMonthlyColumns(headers), [headers]);
  const monthOptions = useMemo(() => monthlyColumns.map((mc) => mc.label), [monthlyColumns]);

  const uniqueValues = useMemo(() => {
    const g = (k) =>
      [...new Set(rawData.map((d) => d[k]?.toString().trim()).filter((v) => v))].sort();
    return {
      zon: g('ZON'),
      balai: g('BALAI'),
      jenisTerminal: g('JENIS TERMINAL'),
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

  const selectedMonthColumns = useMemo(() => {
    if (filterBulanDipilih.length === 0) return [];
    return monthlyColumns.filter((mc) => filterBulanDipilih.includes(mc.label));
  }, [filterBulanDipilih, monthlyColumns]);

  const activeStatusCol = useMemo(() => {
    if (filterBulanDipilih.length > 0 && selectedMonthColumns.length > 0) {
      return selectedMonthColumns[0].status;
    }
    return statusSemasaCol;
  }, [filterBulanDipilih, selectedMonthColumns, statusSemasaCol]);

  const allStatusOptions = useMemo(() => [...Object.keys(STATUS_COLORS)].sort(), []);

  const filteredData = useMemo(() => {
    let data = rawData;

    if (filterBulanDipilih.length > 0) {
      data = data.filter((d) => {
        let hasData = false;
        let isRusak = false;

        for (const mc of selectedMonthColumns) {
          if (mc.status && d[mc.status]) {
            const status = normalizeStatus(d[mc.status]);
            if (status !== 'TIADA DATA') {
              hasData = true;
              if (isKerosakan(status)) isRusak = true;
            }
          }
        }

        if (!hasData) return false;
        if (filterKerosakanSahaja && !isRusak) return false;
        return true;
      });
    }

    return data.filter((d) => {
      if (filterZon.length > 0 && !filterZon.includes(d['ZON']?.trim())) return false;
      if (filterBalai.length > 0 && !filterBalai.includes(d['BALAI']?.trim())) return false;
      if (filterJenisTerminal.length > 0 && !filterJenisTerminal.includes(d['JENIS TERMINAL']?.trim()))
        return false;

      if (filterStatusSemasa.length > 0) {
        const colToUse = activeStatusCol || statusSemasaCol;
        if (colToUse && d[colToUse]) {
          const normalizedValue = normalizeStatus(d[colToUse]);
          if (!filterStatusSemasa.includes(normalizedValue)) return false;
        } else {
          if (!filterStatusSemasa.includes('TIADA DATA')) return false;
        }
      }

      if (filterTanggungjawab.length > 0 && !filterTanggungjawab.includes(d['TANGGUNGJAWAB PENGUJIAN']?.trim()))
        return false;
      if (filterFinding.length > 0 && !filterFinding.includes(d['FINDING VS SPA']?.trim()))
        return false;

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
    });
  }, [
    rawData,
    filterZon,
    filterBalai,
    filterJenisTerminal,
    filterStatusSemasa,
    filterTanggungjawab,
    filterFinding,
    filterBulanDipilih,
    filterKerosakanSahaja,
    searchText,
    selectedMonthColumns,
    activeStatusCol,
    statusSemasaCol,
  ]);

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
      .slice(0, isMobile ? 6 : 10)
      .map(([n, v]) => ({ name: n, value: v }));
  }, [filteredData, isMobile]);

  const terminalDistribution = useMemo(() => {
    const c = {};
    filteredData.forEach((d) => {
      const t = d['JENIS TERMINAL']?.trim() || 'TIADA DATA';
      c[t] = (c[t] || 0) + 1;
    });
    return Object.entries(c).map(([n, v]) => ({ name: n, value: v }));
  }, [filteredData]);

  const monthlyTrend = useMemo(() => {
    if (selectedMonthColumns.length === 0) return [];
    const cols = [...selectedMonthColumns].reverse();
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
  }, [filteredData, selectedMonthColumns]);

  const stats = useMemo(() => {
    let baik = 0,
      rosak = 0;
    filteredData.forEach((d) => {
      const s = normalizeStatus(d[activeStatusCol]);
      if (s === 'BAIK') baik++;
      if (s === 'ROSAK') rosak++;
    });
    return { total: filteredData.length, baik, rosak };
  }, [filteredData, activeStatusCol]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = useMemo(
    () => filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [filteredData, currentPage, rowsPerPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterZon,
    filterBalai,
    filterJenisTerminal,
    filterStatusSemasa,
    filterTanggungjawab,
    filterFinding,
    searchText,
    filterBulanDipilih,
    filterKerosakanSahaja,
  ]);

  const getBulanLabel = useCallback(() => {
    if (filterBulanDipilih.length === 0) return 'Semua rekod';
    if (filterBulanDipilih.length <= 3) return filterBulanDipilih.join(', ');
    return `${filterBulanDipilih.length} bulan dipilih`;
  }, [filterBulanDipilih]);

  const resetAll = useCallback(() => {
    setFilterZon([]);
    setFilterBalai([]);
    setFilterJenisTerminal([]);
    setFilterStatusSemasa([]);
    setFilterTanggungjawab([]);
    setFilterFinding([]);
    setSearchText('');
    setFilterBulanDipilih([]);
    setFilterKerosakanSahaja(false);
  }, []);

  const exportCSV = useCallback(() => {
    if (!filteredData.length) {
      toast.error('Tiada data untuk dieksport');
      return;
    }

    let exportData = filteredData;
    let exportHeaders = [];

    if (filterBulanDipilih.length > 0) {
      const FIXED_GENERAL_HEADERS = [
        'NO. SIRI', 'NO. ISSI TETRA', 'NO. TEI', 'SUBSCRIBER',
        'VEHICLE REG NO.', 'ZON', 'BALAI', 'JENIS TERMINAL',
        'TANGGUNGJAWAB PENGUJIAN', 'FINDING VS SPA', 'STATUS SEMASA 2026',
        'TAHUN DIBEKAL', 'TAHUN DIPASANG', 'KUMPULAN', 'JENIS JENTERA',
      ];

      if (tarikhUjianHeader) {
        FIXED_GENERAL_HEADERS.push(tarikhUjianHeader);
      }

      const allHeaders = Object.keys(filteredData[0]);
      const existingGeneralHeaders = FIXED_GENERAL_HEADERS.filter((h) =>
        allHeaders.includes(h)
      );

      const monthSpecificHeaders = [];
      selectedMonthColumns.forEach((mc) => {
        if (mc.status) monthSpecificHeaders.push(mc.status);
        if (mc.tt) monthSpecificHeaders.push(mc.tt);
      });

      const allUniqueHeaders = [
        ...new Set([...existingGeneralHeaders, ...monthSpecificHeaders]),
      ];
      const generalHeadersSorted = allUniqueHeaders.filter((h) =>
        FIXED_GENERAL_HEADERS.includes(h)
      );
      const monthHeadersSorted = allUniqueHeaders.filter(
        (h) => !FIXED_GENERAL_HEADERS.includes(h)
      );

      const sortedMonthHeaders = [];
      selectedMonthColumns.forEach((mc) => {
        if (mc.status && monthHeadersSorted.includes(mc.status))
          sortedMonthHeaders.push(mc.status);
        if (mc.tt && monthHeadersSorted.includes(mc.tt))
          sortedMonthHeaders.push(mc.tt);
      });

      exportHeaders = [...generalHeadersSorted, ...sortedMonthHeaders];

      exportData = filteredData.map((row) => {
        const newRow = {};
        exportHeaders.forEach((header) => {
          newRow[header] = row[header] || '';
        });
        return newRow;
      });
    } else {
      exportHeaders = Object.keys(filteredData[0]);
    }

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);

    let bulanInfo;
    if (filterBulanDipilih.length === 0) {
      bulanInfo = 'semua-bulan';
    } else if (filterBulanDipilih.length === 1) {
      bulanInfo = filterBulanDipilih[0].replace(/\s+/g, '-').toLowerCase();
    } else if (filterBulanDipilih.length === 2) {
      bulanInfo = filterBulanDipilih
        .map((b) => b.replace(/\s+/g, '-').toLowerCase())
        .join('_');
    } else {
      bulanInfo =
        filterBulanDipilih
          .slice(0, 3)
          .map((b) => b.replace(/\s+/g, '-').toLowerCase())
          .join('_') + `_dan-${filterBulanDipilih.length - 3}-lagi`;
    }

    a.download = `jbpm-${bulanInfo}-${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(
      `✅ ${exportData.length} rekod × ${exportHeaders.length} kolum berjaya dieksport!`,
      { duration: 3000 }
    );
  }, [filteredData, filterBulanDipilih, selectedMonthColumns, tarikhUjianHeader]);

  const hasActiveFilters =
    filterZon.length > 0 ||
    filterBalai.length > 0 ||
    filterJenisTerminal.length > 0 ||
    filterStatusSemasa.length > 0 ||
    filterTanggungjawab.length > 0 ||
    filterFinding.length > 0 ||
    filterBulanDipilih.length > 0 ||
    searchText;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 640px) {
          .mobile-stack {
            flex-direction: column !important;
          }
          .mobile-full-width {
            width: 100% !important;
          }
          .mobile-hide {
            display: none !important;
          }
          .mobile-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .touch-friendly {
            min-height: 44px;
            min-width: 44px;
          }
          .filter-grid {
            grid-template-columns: 1fr !important;
          }
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
          table {
            font-size: 12px;
          }
          th, td {
            padding: 8px 6px !important;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .filter-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* HEADER */}
      <header
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: isMobile ? '16px 12px' : '24px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            maxWidth: '1800px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px',
          }}
        >
          {/* Logo & Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? '8px' : '12px',
              width: '100%',
            }}
          >
            <div
              style={{
                backgroundColor: '#1976d2',
                padding: isMobile ? '10px' : '12px',
                borderRadius: '16px',
                color: '#fff',
              }}
            >
              <Flame style={{ width: isMobile ? '24px' : '32px', height: isMobile ? '24px' : '32px' }} />
            </div>

            <div style={{ textAlign: 'center', width: '100%', padding: '0 8px' }}>
              <h1
                style={{
                  fontSize: 'clamp(18px, 4vw, 28px)',
                  fontWeight: '800',
                  color: '#212121',
                  margin: 0,
                  lineHeight: '1.3',
                }}
              >
                DASHBOARD PENGURUSAN ASET GIRN{' '}
                <span style={{ color: '#1976d2' }}>JBPM NEGERI JOHOR</span>
              </h1>
            </div>

            <p
              style={{
                fontSize: 'clamp(11px, 1.8vw, 13px)',
                color: '#757575',
                fontWeight: '500',
                margin: 0,
              }}
            >
              {lastUpdate
                ? `🕒 Kemaskini: ${lastUpdate.toLocaleString('ms-MY')}`
                : 'Memuatkan data...'}
            </p>
          </div>

          {/* Buttons */}
          <div
            className="mobile-stack"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
            }}
          >
            <button
              onClick={() => setActiveTab((t) => (t === 'dashboard' ? 'table' : 'dashboard'))}
              className="touch-friendly"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: isMobile ? '12px 16px' : '10px 18px',
                minHeight: '44px',
                backgroundColor: '#fff',
                color: '#424242',
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: 'clamp(13px, 1.8vw, 14px)',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                flex: isMobile ? '1' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.borderColor = '#bdbdbd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
            >
              {activeTab === 'dashboard' ? (
                <>
                  <Table2 style={{ width: '16px', height: '16px' }} /> Jadual
                </>
              ) : (
                <>
                  <BarChart3 style={{ width: '16px', height: '16px' }} /> Dashboard
                </>
              )}
            </button>

            <button
              onClick={exportCSV}
              className="touch-friendly"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: isMobile ? '12px 16px' : '10px 18px',
                minHeight: '44px',
                backgroundColor: '#fff',
                color: '#424242',
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: 'clamp(13px, 1.8vw, 14px)',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                flex: isMobile ? '1' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.borderColor = '#bdbdbd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} /> Eksport
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="touch-friendly"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: isMobile ? '12px 16px' : '10px 18px',
                minHeight: '44px',
                backgroundColor: '#1976d2',
                color: '#fff',
                border: '1px solid #1565c0',
                borderRadius: '10px',
                fontSize: 'clamp(13px, 1.8vw, 14px)',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                flex: isMobile ? '1' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#1565c0';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#1976d2';
                }
              }}
            >
              <RefreshCw
                style={{
                  width: '16px',
                  height: '16px',
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                }}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main style={{ 
        maxWidth: '1800px', 
        margin: '0 auto', 
        padding: isMobile ? '12px' : '20px' 
      }}>
        {/* Auto-refresh info */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'clamp(10px, 1.3vw, 12px)',
            color: '#9e9e9e',
            backgroundColor: '#fff',
            borderRadius: '10px',
            padding: '8px 12px',
            marginBottom: '16px',
            border: '1px solid #e0e0e0',
            flexWrap: 'wrap',
          }}
        >
          <Clock style={{ width: '12px', height: '12px', minWidth: '12px' }} />
          <span className="mobile-hide">Auto-refresh setiap 6 jam | </span>
          Jabatan Bomba & Penyelamat Malaysia Negeri Johor
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#ffebee',
              border: '1px solid #ef9a9a',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <Siren style={{ width: '20px', height: '20px', color: '#c62828', minWidth: '20px' }} />
            <p style={{ color: '#c62828', fontWeight: '500', margin: 0, fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
              {error}
            </p>
          </div>
        )}

        {/* FILTER PANEL */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: isMobile ? '14px' : '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: '1px solid #e0e0e0',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: showFilters ? '16px' : '0',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '200px' }}>
              <div
                style={{
                  backgroundColor: '#e3f2fd',
                  padding: '6px',
                  borderRadius: '8px',
                }}
              >
                <Filter style={{ width: '20px', height: '20px', color: '#1976d2' }} />
              </div>
              <h2
                style={{
                  fontSize: 'clamp(14px, 2vw, 18px)',
                  fontWeight: '700',
                  color: '#212121',
                  margin: 0,
                }}
              >
                Tapisan
              </h2>
              <span style={{ fontSize: 'clamp(10px, 1.3vw, 12px)', color: '#999' }}>
                ({filteredData.length} rekod)
              </span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="touch-friendly"
              style={{
                background: 'none',
                border: 'none',
                color: '#757575',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.2s',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {showFilters ? (
                <ChevronUp style={{ width: '20px', height: '20px' }} />
              ) : (
                <ChevronDown style={{ width: '20px', height: '20px' }} />
              )}
            </button>
          </div>

          {showFilters && (
            <div>
              {/* Filter Grid */}
              <div
                className="filter-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile 
                    ? '1fr' 
                    : isTablet 
                      ? 'repeat(2, 1fr)' 
                      : 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                {[
                  ['📅 BULAN', filterBulanDipilih, setFilterBulanDipilih, monthOptions, 'Pilih bulan...', 'Cari bulan...'],
                  ['📍 ZON', filterZon, setFilterZon, uniqueValues.zon, 'Pilih ZON...', 'Cari ZON...'],
                  ['🏢 BALAI', filterBalai, setFilterBalai, uniqueValues.balai, 'Pilih BALAI...', 'Cari BALAI...'],
                  ['📡 TERMINAL', filterJenisTerminal, setFilterJenisTerminal, uniqueValues.jenisTerminal, 'Pilih TERMINAL...', 'Cari TERMINAL...'],
                  ['📊 STATUS', filterStatusSemasa, setFilterStatusSemasa, allStatusOptions, 'Pilih STATUS...', 'Cari STATUS...'],
                  ['👤 T.JAWAB', filterTanggungjawab, setFilterTanggungjawab, uniqueValues.tanggungjawab, 'Pilih...', 'Cari...'],
                  ['🔍 FINDING', filterFinding, setFilterFinding, uniqueValues.finding, 'Pilih FINDING...', 'Cari FINDING...'],
                ].map(([label, val, setter, options, placeholder, searchPlaceholder]) => (
                  <div key={label}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 'clamp(11px, 1.3vw, 12px)',
                        color: '#757575',
                        marginBottom: '6px',
                        fontWeight: '500',
                      }}
                    >
                      {label}
                      {val.length > 0 && (
                        <span style={{ color: '#1976d2', marginLeft: '4px' }}>
                          ({val.length})
                        </span>
                      )}
                    </label>
                    <MultiSelectDropdown
                      options={options}
                      selected={val}
                      onChange={setter}
                      placeholder={placeholder}
                      searchPlaceholder={searchPlaceholder}
                      disabled={false}
                    />
                  </div>
                ))}
              </div>

              {/* Kerosakan Checkbox */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '10px',
                    padding: isMobile ? '12px 16px' : '10px 16px',
                    minHeight: '44px',
                    transition: 'border-color 0.2s',
                    width: isMobile ? '100%' : 'auto',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#bdbdbd')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
                >
                  <input
                    type="checkbox"
                    checked={filterKerosakanSahaja}
                    onChange={(e) => setFilterKerosakanSahaja(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      accentColor: '#f57c00',
                    }}
                  />
                  <div>
                    <span
                      style={{
                        fontSize: 'clamp(12px, 1.5vw, 14px)',
                        color: '#212121',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle style={{ width: '16px', height: '16px', color: '#f57c00' }} />{' '}
                      Kerosakan Sahaja
                    </span>
                    <span
                      style={{
                        fontSize: 'clamp(10px, 1.2vw, 12px)',
                        color: '#999',
                        display: 'block',
                      }}
                    >
                      Hanya rekod bermasalah
                    </span>
                  </div>
                </label>
              </div>

              {/* Search Text */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'clamp(11px, 1.3vw, 12px)',
                    color: '#757575',
                    marginBottom: '6px',
                    fontWeight: '500',
                  }}
                >
                  🔎 CARIAN (NO. SIRI / ISSI / SUBSCRIBER)
                </label>
                <div style={{ position: 'relative' }}>
                  <Search
                    style={{
                      width: '16px',
                      height: '16px',
                      color: '#9e9e9e',
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Taip untuk mencari..."
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      minHeight: '44px',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1976d2')}
                    onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                  />
                  {searchText && (
                    <X
                      style={{
                        width: '16px',
                        height: '16px',
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9e9e9e',
                        cursor: 'pointer',
                        minWidth: '16px',
                      }}
                      onClick={() => setSearchText('')}
                    />
                  )}
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e0e0e0',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(10px, 1.3vw, 12px)',
                      color: '#757575',
                      fontWeight: '500',
                    }}
                  >
                    🏷️ Aktif:
                  </span>
                  {filterBulanDipilih.length > 0 && (
                    <FilterBadge
                      label={`BULAN: ${filterBulanDipilih.length}`}
                      type="gold"
                      onRemove={() => {
                        setFilterBulanDipilih([]);
                        setFilterKerosakanSahaja(false);
                      }}
                    />
                  )}
                  {filterZon.length > 0 && (
                    <FilterBadge label={`ZON: ${filterZon.length}`} onRemove={() => setFilterZon([])} />
                  )}
                  {filterBalai.length > 0 && (
                    <FilterBadge label={`BALAI: ${filterBalai.length}`} onRemove={() => setFilterBalai([])} />
                  )}
                  {filterJenisTerminal.length > 0 && (
                    <FilterBadge label={`TERMINAL: ${filterJenisTerminal.length}`} onRemove={() => setFilterJenisTerminal([])} />
                  )}
                  {filterStatusSemasa.length > 0 && (
                    <FilterBadge label={`STATUS: ${filterStatusSemasa.length}`} type="amber" onRemove={() => setFilterStatusSemasa([])} />
                  )}
                  {filterTanggungjawab.length > 0 && (
                    <FilterBadge label={`T.JAWAB: ${filterTanggungjawab.length}`} onRemove={() => setFilterTanggungjawab([])} />
                  )}
                  {filterFinding.length > 0 && (
                    <FilterBadge label={`FINDING: ${filterFinding.length}`} onRemove={() => setFilterFinding([])} />
                  )}
                  {filterKerosakanSahaja && (
                    <FilterBadge label="⚠️ KEROSAKAN" type="amber" onRemove={() => setFilterKerosakanSahaja(false)} />
                  )}
                  <button
                    onClick={resetAll}
                    className="touch-friendly"
                    style={{
                      fontSize: 'clamp(11px, 1.3vw, 12px)',
                      color: '#c62828',
                      background: 'none',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      marginLeft: '8px',
                      padding: '8px',
                      minHeight: '44px',
                    }}
                  >
                    Reset Semua
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '80px 0',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Flame
                  style={{
                    width: '64px',
                    height: '64px',
                    color: '#1976d2',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
                <RefreshCw
                  style={{
                    width: '32px',
                    height: '32px',
                    color: '#ff9800',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              </div>
              <p
                style={{
                  color: '#757575',
                  fontWeight: '500',
                  marginTop: '16px',
                  fontSize: 'clamp(13px, 1.5vw, 15px)',
                }}
              >
                Memuatkan data dari Google Sheets...
              </p>
            </div>
          </div>
        )}

        {/* CONTENT */}
        {!loading &&
          (activeTab === 'dashboard' ? (
            <>
              {/* STATS CARDS */}
              <div
                className="stats-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr'
                    : isTablet
                      ? 'repeat(2, 1fr)'
                      : 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                {/* Total Aset */}
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: isMobile ? '14px' : '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#757575',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#e3f2fd',
                        padding: '8px',
                        borderRadius: '8px',
                      }}
                    >
                      <Flame style={{ width: '20px', height: '20px', color: '#1976d2' }} />
                    </div>
                    <span
                      style={{
                        fontSize: 'clamp(11px, 1.5vw, 14px)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Jumlah Aset
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 'clamp(28px, 5vw, 36px)',
                      fontWeight: '800',
                      color: '#212121',
                      margin: '0 0 4px 0',
                    }}
                  >
                    {stats.total}
                  </p>
                  <p
                    style={{
                      fontSize: 'clamp(10px, 1.2vw, 12px)',
                      color: '#9e9e9e',
                      fontWeight: '500',
                      margin: 0,
                    }}
                  >
                    {filteredData.length !== rawData.length
                      ? `Ditapis dari ${rawData.length} rekod`
                      : 'Keseluruhan rekod'}
                  </p>
                </div>

                {/* Operasi (Baik) */}
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: isMobile ? '14px' : '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#2e7d32',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#e8f5e9',
                        padding: '8px',
                        borderRadius: '8px',
                      }}
                    >
                      <BadgeCheck style={{ width: '20px', height: '20px', color: '#2e7d32' }} />
                    </div>
                    <span
                      style={{
                        fontSize: 'clamp(11px, 1.5vw, 14px)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Operasi
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 'clamp(28px, 5vw, 36px)',
                      fontWeight: '800',
                      color: '#2e7d32',
                      margin: '0 0 4px 0',
                    }}
                  >
                    {stats.baik}
                  </p>
                  <p
                    style={{
                      fontSize: 'clamp(10px, 1.2vw, 12px)',
                      color: '#66bb6a',
                      fontWeight: '500',
                      margin: 0,
                    }}
                  >
                    {stats.total > 0
                      ? ((stats.baik / stats.total) * 100).toFixed(1)
                      : 0}
                    % | {getBulanLabel()}
                  </p>
                </div>

                {/* Kerosakan */}
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: isMobile ? '14px' : '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#c62828',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#ffebee',
                        padding: '8px',
                        borderRadius: '8px',
                      }}
                    >
                      <Siren style={{ width: '20px', height: '20px', color: '#c62828' }} />
                    </div>
                    <span
                      style={{
                        fontSize: 'clamp(11px, 1.5vw, 14px)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Kerosakan
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 'clamp(28px, 5vw, 36px)',
                      fontWeight: '800',
                      color: '#c62828',
                      margin: '0 0 4px 0',
                    }}
                  >
                    {stats.rosak}
                  </p>
                  <p
                    style={{
                      fontSize: 'clamp(10px, 1.2vw, 12px)',
                      color: '#ef5350',
                      fontWeight: '500',
                      margin: 0,
                    }}
                  >
                    {stats.total > 0
                      ? ((stats.rosak / stats.total) * 100).toFixed(1)
                      : 0}
                    % | {getBulanLabel()}
                  </p>
                </div>
              </div>

              {/* Trend Kerosakan */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: isMobile ? '14px' : '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden',
                  }}
                >
                  <h3
                    style={{
                      fontSize: 'clamp(11px, 1.5vw, 14px)',
                      fontWeight: '600',
                      color: '#424242',
                      marginBottom: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <BarChart3 style={{ width: '16px', height: '16px', color: '#1976d2', minWidth: '16px' }} />
                    Trend Kerosakan ({getBulanLabel()})
                  </h3>
                  <div className="mobile-scroll" style={{ overflowX: 'auto' }}>
                    <ResponsiveContainer width="100%" height={isMobile ? 250 : 350} minWidth={isMobile ? 500 : undefined}>
                      <BarChart data={monthlyTrend} barGap={6}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#9e9e9e" fontSize={11} />
                        <YAxis stroke="#9e9e9e" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            color: '#333',
                            fontSize: '12px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="BAIK" fill="#4caf50" name="✅ Baik" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="ROSAK" fill="#f44336" name="🔥 Rosak" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="LAIN" fill="#ff9800" name="⚠️ Lain" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* PIE CHARTS */}
              <div
                className="charts-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr'
                    : isTablet
                      ? '1fr'
                      : 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px',
                }}
              >
                <PieChartCard
                  title={`Status (${getBulanLabel()})`}
                  data={statusDistribution}
                  colorMap={STATUS_COLORS}
                  isMobile={isMobile}
                />
                <PieChartCard
                  title="Pecahan ZON"
                  data={zonDistribution}
                  isMobile={isMobile}
                />
                <PieChartCard
                  title={`Top ${isMobile ? '6' : '10'} BALAI`}
                  data={balaiDistribution}
                  isMobile={isMobile}
                />
                <PieChartCard
                  title="Jenis Terminal"
                  data={terminalDistribution}
                  isMobile={isMobile}
                />
              </div>
            </>
          ) : (
            /* TABLE VIEW */
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: isMobile ? '14px' : '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #e0e0e0',
              }}
            >
              <div
                className="mobile-stack"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                <h3
                  style={{
                    fontSize: 'clamp(12px, 1.5vw, 14px)',
                    fontWeight: '600',
                    color: '#424242',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: 0,
                  }}
                >
                  <Table2 style={{ width: '16px', height: '16px', color: '#1976d2', minWidth: '16px' }} />
                  Data Peranti —{' '}
                  <span style={{ color: '#212121' }}>
                    {filteredData.length} rekod
                  </span>
                </h3>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(+e.target.value)}
                  className="touch-friendly"
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                    color: '#424242',
                    outline: 'none',
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  <option value={10}>10 baris</option>
                  <option value={25}>25 baris</option>
                  <option value={50}>50 baris</option>
                  <option value={100}>100 baris</option>
                  {!isMobile && <option value={200}>200 baris</option>}
                  {!isMobile && <option value={300}>300 baris</option>}
                </select>
              </div>

              <div className="mobile-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 'clamp(11px, 1.3vw, 13px)',
                    minWidth: isMobile ? '800px' : 'auto',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#f5f5f5',
                        borderBottom: '2px solid #e0e0e0',
                      }}
                    >
                      {[
                        '#',
                        'NO. SIRI',
                        'ZON',
                        'BALAI',
                        'TERMINAL',
                        'SUBSCRIBER',
                        'STATUS',
                        'TARIKH UJIAN',
                        'REG NO.',
                        'T.JAWAB',
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '12px 8px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#616161',
                            whiteSpace: 'nowrap',
                            fontSize: 'clamp(10px, 1.2vw, 12px)',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((d, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: '1px solid #f0f0f0' }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = '#fafafa')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = 'transparent')
                        }
                      >
                        <td
                          style={{
                            padding: '10px 8px',
                            color: '#9e9e9e',
                            fontFamily: 'monospace',
                            fontSize: 'clamp(10px, 1.1vw, 12px)',
                          }}
                        >
                          {(currentPage - 1) * rowsPerPage + i + 1}
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            color: '#212121',
                            fontFamily: 'monospace',
                            fontSize: 'clamp(10px, 1.1vw, 12px)',
                            fontWeight: '600',
                          }}
                        >
                          {d['NO. SIRI'] || '—'}
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            color: '#616161',
                            fontWeight: '500',
                            fontSize: 'clamp(10px, 1.1vw, 12px)',
                          }}
                        >
                          {d['ZON'] || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#616161', fontSize: 'clamp(10px, 1.1vw, 12px)' }}>
                          {d['BALAI'] || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#616161', fontSize: 'clamp(10px, 1.1vw, 12px)' }}>
                          {d['JENIS TERMINAL'] || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#616161', fontSize: 'clamp(10px, 1.1vw, 12px)' }}>
                          {d['SUBSCRIBER'] || '—'}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <StatusBadge
                            status={
                              activeStatusCol
                                ? normalizeStatus(d[activeStatusCol])
                                : 'TIADA DATA'
                            }
                          />
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            color: '#616161',
                            fontSize: 'clamp(10px, 1.1vw, 12px)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {(tarikhUjianHeader && d[tarikhUjianHeader]) || '—'}
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            color: '#616161',
                            fontFamily: 'monospace',
                            fontSize: 'clamp(10px, 1.1vw, 12px)',
                          }}
                        >
                          {d['VEHICLE REG NO.'] || '—'}
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            color: '#616161',
                            fontSize: 'clamp(10px, 1.1vw, 12px)',
                          }}
                        >
                          {d['TANGGUNGJAWAB PENGUJIAN'] || '—'}
                        </td>
                      </tr>
                    ))}
                    {!paginatedData.length && (
                      <tr>
                        <td
                          colSpan={10}
                          style={{
                            textAlign: 'center',
                            padding: '64px 0',
                            color: '#bdbdbd',
                          }}
                        >
                          <HelpCircle
                            style={{
                              width: '40px',
                              height: '40px',
                              margin: '0 auto 12px',
                              opacity: 0.3,
                              display: 'block',
                            }}
                          />
                          Tiada data sepadan dengan tapisan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div
                  className="mobile-stack"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e0e0e0',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(10px, 1.2vw, 12px)',
                      color: '#9e9e9e',
                      fontWeight: '500',
                    }}
                  >
                    Halaman {currentPage} / {totalPages}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="touch-friendly"
                      style={{
                        padding: isMobile ? '8px' : '6px 10px',
                        fontSize: 'clamp(11px, 1.2vw, 12px)',
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        color: currentPage === 1 ? '#bdbdbd' : '#616161',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        minWidth: '44px',
                        minHeight: '44px',
                      }}
                    >
                      ««
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="touch-friendly"
                      style={{
                        padding: isMobile ? '8px' : '6px 12px',
                        fontSize: 'clamp(11px, 1.2vw, 12px)',
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        color: currentPage === 1 ? '#bdbdbd' : '#616161',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        minWidth: '44px',
                        minHeight: '44px',
                      }}
                    >
                      «
                    </button>
                    {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                      let p;
                      if (totalPages <= (isMobile ? 3 : 5)) p = i + 1;
                      else if (currentPage <= (isMobile ? 2 : 3)) p = i + 1;
                      else if (currentPage >= totalPages - (isMobile ? 1 : 2))
                        p = totalPages - (isMobile ? 2 : 4) + i;
                      else p = currentPage - (isMobile ? 1 : 2) + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className="touch-friendly"
                          style={{
                            padding: isMobile ? '8px' : '6px 12px',
                            fontSize: 'clamp(11px, 1.2vw, 12px)',
                            backgroundColor: currentPage === p ? '#1976d2' : '#fff',
                            color: currentPage === p ? '#fff' : '#616161',
                            border: currentPage === p ? '1px solid #1565c0' : '1px solid #e0e0e0',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: currentPage === p ? '0 2px 8px rgba(25,118,210,0.3)' : 'none',
                            minWidth: '44px',
                            minHeight: '44px',
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="touch-friendly"
                      style={{
                        padding: isMobile ? '8px' : '6px 12px',
                        fontSize: 'clamp(11px, 1.2vw, 12px)',
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        color: currentPage === totalPages ? '#bdbdbd' : '#616161',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        minWidth: '44px',
                        minHeight: '44px',
                      }}
                    >
                      »
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="touch-friendly"
                      style={{
                        padding: isMobile ? '8px' : '6px 10px',
                        fontSize: 'clamp(11px, 1.2vw, 12px)',
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        color: currentPage === totalPages ? '#bdbdbd' : '#616161',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        minWidth: '44px',
                        minHeight: '44px',
                      }}
                    >
                      »»
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </main>

      {/* FOOTER */}
      <footer
        style={{
          backgroundColor: '#fff',
          borderTop: '1px solid #e0e0e0',
          padding: isMobile ? '16px 12px' : '20px 16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(10px, 1.2vw, 12px)',
            color: '#9e9e9e',
            fontWeight: '500',
            marginBottom: '12px',
            lineHeight: '1.6',
          }}
        >
          🚒 Data Pengurusan Aset GIRN{' '}
          <span style={{ color: '#1976d2', fontWeight: '700' }}>
            Jabatan Bomba & Penyelamat Malaysia Negeri Johor
          </span>{' '}
          | Auto-refresh: setiap 6 jam
          {filterBulanDipilih.length > 0 && (
            <span style={{ marginLeft: '8px', color: '#f57c00' }}>
              | Bulan: {getBulanLabel()}
            </span>
          )}
        </div>

        <div
          style={{
            width: '60px',
            height: '1px',
            backgroundColor: '#e0e0e0',
            margin: '0 auto 12px',
          }}
        />

        <div
          style={{
            fontSize: 'clamp(10px, 1.1vw, 11px)',
            color: '#bdbdbd',
            lineHeight: '1.8',
          }}
        >
          <div style={{ marginBottom: '2px' }}>
            Dibangunkan oleh:{' '}
            <span style={{ fontWeight: '600', color: '#1976d2' }}>
              PB Mohamad Aidil
            </span>
          </div>
          <div style={{ marginBottom: '2px' }}>
            Unit:{' '}
            <span style={{ fontWeight: '600', color: '#616161' }}>
              PGO Johor
            </span>
          </div>
          <div>
            Hak Cipta &copy; 2026 | Semua Hak Terpelihara
          </div>
        </div>
      </footer>
    </div>
  );
}
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Search,
  X,
  Filter,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Table2,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flame,
  Shield,
  Siren,
  BadgeCheck,
  Wrench,
  Trash2,
  Truck,
  Check,
  Info,
  Sun,
  Moon,
  MapPin,
  Building2,
  Radio,
  UserCheck,
  Tag,
  Calendar,
  Activity,
  Maximize2,
  Minimize2,
  LineChart as LineIcon,
  Layers,
  TrendingUp,
  Cpu,
  GitCommit,
  Eye,
  EyeOff,
  Hash,
  Ticket,
  FileText,
  ChevronLeft,
  ChevronRight,
  Printer,
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
  LabelList,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

const LOGO_URL = 'https://cdn-icons-png.flaticon.com/128/2502/2502280.png';
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGUzVyeUmHfSW65OMonkjq0VRzBs0zDqpgWDCVaN_ba07ANW34ix3M8AhCErROdQv3ixNqi8qhKgGg/pub?gid=0&single=true&output=csv';
const BG_IMAGE_URL =
  'https://raw.githubusercontent.com/eaydell436/DATA-GIRN-JBPM-JOHOR/56adeb376c2fe103fc14d0009dcac814038d0842/firetruck-BG.png';
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

const PIE_COLORS = [
  '#CC0000',
  '#FFC107',
  '#00C853',
  '#448AFF',
  '#7C4DFF',
  '#FF6D00',
  '#00B8D4',
  '#FF4081',
  '#FF9800',
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
  'BELUM DIUJI': Clock,
  'BER - TINDAKAN SAPURA': Truck,
  'BER - TINDAKAN JABATAN': Shield,
  'BER - SELESAI PROSES PELUPUSAN': Trash2,
  'TIADA DATA': HelpCircle,
};

const CHART_TYPE_OPTIONS = [
  { value: 'bar_vertical', label: '📊 Graf Bar Menegak' },
  { value: 'bar_horizontal', label: '📊 Graf Bar Mendatar' },
  { value: 'line', label: '📈 Graf Garisan (Line Chart)' },
  { value: 'area', label: '📉 Graf Kawasan (Area Chart)' },
  { value: 'candlestick', label: '🕯️ Carta Candlestick (Julat Prestasi)' },
  { value: 'scatter', label: '🔵 Carta Taburan / Gelembung' },
  { value: 'boxplot', label: '📦 Plot Kotak (Box Plot Statistik)' },
  { value: 'sankey', label: '🔀 Carta Aliran (Sankey Flow)' },
  { value: 'gantt', label: '📅 Carta Gantt (Penyelenggaraan)' },
];

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
    if (
      str.includes(',') ||
      str.includes('"') ||
      str.includes('\n') ||
      str.includes('\r')
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCell).join(',');
  const rows = arr.map((row) =>
    headers.map((h) => escapeCell(row[h])).join(',')
  );
  return [headerRow, ...rows].join('\n');
};

const cleanHeader = (h) => h.replace(/\s+/g, ' ').trim().toUpperCase();

const extractMonthlyColumns = (headers) => {
  const monthNames = [
    'SEMASA 2026',
    'DISEMBER 2026',
    'NOVEMBER 2026',
    'OKTOBER 2026',
    'SEPTEMBER 2026',
    'OGOS 2026',
    'JULAI 2026',
    'JUN 2026',
    'MEI 2026',
    'APRIL 2026',
    'MAC 2026',
    'FEBRUARI 2026',
    'JANUARI 2026',
    'DISEMBER 2025',
    'NOVEMBER 2025',
    'OKTOBER 2025',
    'SEPTEMBER 2025',
    'OGOS 2025',
    'JULAI 2025',
    'JUN 2025',
    'MEI 2025',
    'APRIL 2025',
    'MAC 2025',
    'FEBRUARI 2025',
    'JANUARI 2025',
    'DISEMBER 2024',
    'NOVEMBER 2024',
    'OKTOBER 2024',
    'SEPTEMBER 2024',
    'OGOS 2024',
    'JULAI 2024',
    'JUN 2024',
    'MEI 2024',
    'APRIL 2024',
    'MAC 2024',
    'FEBRUARI 2024',
    'JANUARI 2024',
    'DISEMBER 2023',
    'NOVEMBER 2023',
    'OKTOBER 2023',
    'SEPTEMBER 2023',
    'OGOS 2023',
    'JULAI 2023',
    'JUN 2023',
    'MEI 2023',
    'APRIL 2023',
    'MAC 2023',
    'FEBRUARI 2023',
    'JANUARI 2023',
  ];

  return monthNames
    .map((mn) => {
      const statusCol = headers.find((h) => {
        const ch = cleanHeader(h);
        if (mn === 'SEMASA 2026')
          return ch.includes('STATUS SEMASA 2026') && !ch.includes('VT');
        return (
          ch.includes('STATUS') &&
          ch.includes(mn) &&
          !ch.includes('VT') &&
          !ch.includes('SEMASA') &&
          !ch.includes('TINDAKAN PAN')
        );
      });

      const ttCol = headers.find((h) => {
        const ch = cleanHeader(h);
        return (
          (ch.includes('TT') || ch.includes('TIKET')) &&
          ch.includes(mn) &&
          !ch.includes('TIDAK') &&
          !ch.includes('TINDAKAN PENGUJIAN')
        );
      });

      const tarikhCol = headers.find((h) => {
        const ch = cleanHeader(h);
        if (mn === 'SEMASA 2026') {
          return (
            (ch.includes('TARIKH') && ch.includes('SEMASA')) ||
            (ch.includes('TARIKH') &&
              ch.includes('PENGUJIAN') &&
              ch.includes('2026') &&
              !ch.includes('JANUARI') &&
              !ch.includes('FEBRUARI') &&
              !ch.includes('MAC') &&
              !ch.includes('APRIL') &&
              !ch.includes('MEI') &&
              !ch.includes('JUN') &&
              !ch.includes('JULAI') &&
              !ch.includes('OGOS') &&
              !ch.includes('SEPTEMBER') &&
              !ch.includes('OKTOBER') &&
              !ch.includes('NOVEMBER') &&
              !ch.includes('DISEMBER')) ||
            (ch.includes('TARIKH') &&
              ch.includes('PENGUJIAN') &&
              !ch.includes('2025') &&
              !ch.includes('2024') &&
              !ch.includes('2023') &&
              !ch.includes('DISEMBER') &&
              !ch.includes('NOVEMBER') &&
              !ch.includes('OKTOBER') &&
              !ch.includes('SEPTEMBER') &&
              !ch.includes('OGOS') &&
              !ch.includes('JULAI') &&
              !ch.includes('JUN') &&
              !ch.includes('MEI') &&
              !ch.includes('APRIL') &&
              !ch.includes('MAC') &&
              !ch.includes('FEBRUARI') &&
              !ch.includes('JANUARI'))
          );
        }
        return (
          ch.includes('TARIKH') && ch.includes('PENGUJIAN') && ch.includes(mn)
        );
      });

      return statusCol
        ? {
            label: mn,
            status: statusCol,
            tt: ttCol || null,
            tarikh: tarikhCol || null,
          }
        : null;
    })
    .filter(Boolean);
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
  if (upper.includes('SELESAI') || upper.includes('PELUPUSAN'))
    return 'BER - SELESAI PROSES PELUPUSAN';
  return raw.toString().trim();
};

const StatusBadge = memo(({ status, isDarkMode }) => {
  const colorMapLight = {
    BAIK: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
    ROSAK: { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' },
    'TIDAK DIJUMPAI': { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' },
    'TIDAK DAPAT DIUJI': { bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' },
    'BELUM DIUJI': { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
    'BER - TINDAKAN SAPURA': {
      bg: '#e3f2fd',
      text: '#1565c0',
      border: '#90caf9',
    },
    'BER - TINDAKAN JABATAN': {
      bg: '#e0f7fa',
      text: '#00838f',
      border: '#80deea',
    },
    'BER - SELESAI PROSES PELUPUSAN': {
      bg: '#f5f5f5',
      text: '#616161',
      border: '#bdbdbd',
    },
    'TIADA DATA': { bg: '#eceff1', text: '#546e7a', border: '#b0bec5' },
  };

  const colorMapDark = {
    BAIK: { bg: 'rgba(46, 125, 50, 0.35)', text: '#81c784', border: '#2e7d32' },
    ROSAK: {
      bg: 'rgba(198, 40, 40, 0.35)',
      text: '#e57373',
      border: '#c62828',
    },
    'TIDAK DIJUMPAI': {
      bg: 'rgba(245, 127, 23, 0.35)',
      text: '#ffd54f',
      border: '#f57f17',
    },
    'TIDAK DAPAT DIUJI': {
      bg: 'rgba(106, 27, 154, 0.35)',
      text: '#ba68c8',
      border: '#6a1b9a',
    },
    'BELUM DIUJI': {
      bg: 'rgba(230, 81, 0, 0.35)',
      text: '#ffb74d',
      border: '#e65100',
    },
    'BER - TINDAKAN SAPURA': {
      bg: 'rgba(21, 101, 192, 0.35)',
      text: '#64b5f6',
      border: '#1565c0',
    },
    'BER - TINDAKAN JABATAN': {
      bg: 'rgba(0, 131, 143, 0.35)',
      text: '#4dd0e1',
      border: '#00838f',
    },
    'BER - SELESAI PROSES PELUPUSAN': {
      bg: 'rgba(97, 97, 97, 0.35)',
      text: '#e0e0e0',
      border: '#616161',
    },
    'TIADA DATA': {
      bg: 'rgba(84, 110, 122, 0.35)',
      text: '#90a4ae',
      border: '#546e7a',
    },
  };

  const map = isDarkMode ? colorMapDark : colorMapLight;
  const colors = map[status] || map['TIADA DATA'];
  const Icon = STATUS_ICONS[status] || HelpCircle;

  return (
    <span
      style={{
        fontSize: '11px',
        padding: '4px 10px',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.bg,
        color: colors.text,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontWeight: '600',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Icon style={{ width: '12px', height: '12px' }} /> {status}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const FilterBadge = memo(
  ({ label, onRemove, type = 'default', isDarkMode }) => {
    const typeStylesLight = {
      default: {
        bg: 'rgba(227, 242, 253, 0.85)',
        text: '#1565c0',
        border: '#90caf9',
      },
      amber: {
        bg: 'rgba(255, 248, 225, 0.85)',
        text: '#f57f17',
        border: '#ffe082',
      },
      gold: {
        bg: 'rgba(255, 253, 231, 0.85)',
        text: '#f9a825',
        border: '#fff59d',
      },
      purple: {
        bg: 'rgba(243, 229, 245, 0.85)',
        text: '#6a1b9a',
        border: '#ce93d8',
      },
    };
    const typeStylesDark = {
      default: {
        bg: 'rgba(21, 101, 192, 0.35)',
        text: '#90caf9',
        border: '#1565c0',
      },
      amber: {
        bg: 'rgba(245, 127, 23, 0.35)',
        text: '#ffe082',
        border: '#f57f17',
      },
      gold: {
        bg: 'rgba(249, 168, 37, 0.35)',
        text: '#fff59d',
        border: '#f9a825',
      },
      purple: {
        bg: 'rgba(106, 27, 154, 0.35)',
        text: '#ce93d8',
        border: '#8e24aa',
      },
    };
    const map = isDarkMode ? typeStylesDark : typeStylesLight;
    const style = map[type] || map.default;
    return (
      <span
        style={{
          fontSize: '11px',
          padding: '4px 10px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: '600',
          backgroundColor: style.bg,
          color: style.text,
          border: `1px solid ${style.border}`,
          backdropFilter: 'blur(4px)',
        }}
      >
        {label}
        <X
          style={{ width: '12px', height: '12px', cursor: 'pointer' }}
          onClick={onRemove}
        />
      </span>
    );
  }
);
FilterBadge.displayName = 'FilterBadge';

const PieChartCard = memo(
  ({ title, data, colorMap, isDarkMode, innerRadius = 0 }) => {
    const [unitMode, setUnitMode] = useState('count'); // 'count' atau 'percent'
    const [cardType, setCardType] = useState('pie'); // 'pie' atau 'bar'

    const totalSum = useMemo(() => {
      return data.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
    }, [data]);

    const formattedData = useMemo(() => {
      return data.map((item) => {
        const val = Number(item.value || 0);
        const pct = totalSum > 0 ? (val / totalSum) * 100 : 0;
        return {
          ...item,
          rawVal: val,
          pctVal: Number(pct.toFixed(1)),
          displayVal: unitMode === 'percent' ? `${pct.toFixed(1)}%` : val,
          chartVal: unitMode === 'percent' ? Number(pct.toFixed(1)) : val,
        };
      });
    }, [data, totalSum, unitMode]);

    const theme = {
      bg: isDarkMode ? 'rgba(30, 41, 59, 0.72)' : 'rgba(255, 255, 255, 0.75)',
      border: isDarkMode
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(255, 255, 255, 0.5)',
      title: isDarkMode ? '#e2e8f0' : '#212121',
      text: isDarkMode ? '#94a3b8' : '#616161',
      valueText: isDarkMode ? '#f8fafc' : '#212121',
      tooltipBg: isDarkMode
        ? 'rgba(15, 23, 42, 0.9)'
        : 'rgba(255, 255, 255, 0.95)',
      tooltipBorder: isDarkMode ? '#334155' : '#e0e0e0',
      tooltipText: isDarkMode ? '#f8fafc' : '#333',
      btnBg: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
      btnActiveBg: '#1976d2',
      btnActiveText: '#ffffff',
      btnText: isDarkMode ? '#cbd5e1' : '#475569',
    };

    return (
      <div
        style={{
          backgroundColor: theme.bg,
          borderRadius: '16px',
          padding: '18px',
          boxShadow: isDarkMode
            ? '0 8px 32px rgba(0,0,0,0.37)'
            : '0 8px 32px rgba(31, 38, 135, 0.08)',
          border: `1px solid ${theme.border}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: theme.title,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 10px 0',
            }}
          >
            {title}
          </h3>

          {/* Butang Kawalan Pertukaran Unit dan Jenis Carta */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {/* Suis Unit (% vs Jumlah) */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: theme.btnBg,
                padding: '2px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
              }}
            >
              <button
                type="button"
                onClick={() => setUnitMode('count')}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: '700',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor:
                    unitMode === 'count' ? theme.btnActiveBg : 'transparent',
                  color:
                    unitMode === 'count' ? theme.btnActiveText : theme.btnText,
                  transition: 'all 0.2s ease',
                }}
              >
                Jumlah
              </button>
              <button
                type="button"
                onClick={() => setUnitMode('percent')}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: '700',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor:
                    unitMode === 'percent' ? theme.btnActiveBg : 'transparent',
                  color:
                    unitMode === 'percent'
                      ? theme.btnActiveText
                      : theme.btnText,
                  transition: 'all 0.2s ease',
                }}
              >
                %
              </button>
            </div>

            {/* Suis Paparan Carta (Pai vs Bar) */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: theme.btnBg,
                padding: '2px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
              }}
            >
              <button
                type="button"
                onClick={() => setCardType('pie')}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: '700',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor:
                    cardType === 'pie' ? theme.btnActiveBg : 'transparent',
                  color:
                    cardType === 'pie' ? theme.btnActiveText : theme.btnText,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.2s ease',
                }}
              >
                <PieChartIcon style={{ width: '11px', height: '11px' }} /> Pai
              </button>
              <button
                type="button"
                onClick={() => setCardType('bar')}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: '700',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor:
                    cardType === 'bar' ? theme.btnActiveBg : 'transparent',
                  color:
                    cardType === 'bar' ? theme.btnActiveText : theme.btnText,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.2s ease',
                }}
              >
                <BarChart3 style={{ width: '11px', height: '11px' }} /> Bar
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: '220px' }}>
          <ResponsiveContainer width="100%" height={220}>
            {cardType === 'pie' ? (
              <RePieChart>
                <Pie
                  data={formattedData}
                  dataKey="chartVal"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={innerRadius}
                  paddingAngle={3}
                >
                  {formattedData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        colorMap?.[entry.name] ||
                        PIE_COLORS[idx % PIE_COLORS.length]
                      }
                      stroke="transparent"
                    />
                  ))}
                  <LabelList
                    dataKey="chartVal"
                    position="outside"
                    offset={10}
                    fill={theme.title}
                    fontSize={10}
                    fontWeight="700"
                    formatter={(val) =>
                      val > 0 ? (unitMode === 'percent' ? `${val}%` : val) : ''
                    }
                  />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    borderRadius: '8px',
                    color: theme.tooltipText,
                    fontFamily: 'Inter, sans-serif',
                  }}
                  itemStyle={{ color: theme.tooltipText }}
                  formatter={(val, name, item) => [
                    unitMode === 'percent'
                      ? `${val}% (${item.payload.rawVal})`
                      : `${val} (${item.payload.pctVal}%)`,
                    name,
                  ]}
                />
              </RePieChart>
            ) : (
              <BarChart
                data={formattedData}
                margin={{ top: 20, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                  }
                />
                <XAxis
                  dataKey="name"
                  stroke={theme.text}
                  fontSize={10}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke={theme.text}
                  fontSize={10}
                  unit={unitMode === 'percent' ? '%' : ''}
                />
                <Tooltip
                  contentStyle={{
                    background: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    borderRadius: '8px',
                    color: theme.tooltipText,
                  }}
                  formatter={(val, name, item) => [
                    unitMode === 'percent'
                      ? `${val}% (${item.payload.rawVal})`
                      : `${val} (${item.payload.pctVal}%)`,
                    'Nilai',
                  ]}
                />
                <Bar dataKey="chartVal" radius={[4, 4, 0, 0]}>
                  {formattedData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        colorMap?.[entry.name] ||
                        PIE_COLORS[idx % PIE_COLORS.length]
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="chartVal"
                    position="top"
                    fill={theme.title}
                    fontSize={10}
                    fontWeight="700"
                    formatter={(val) =>
                      val > 0 ? (unitMode === 'percent' ? `${val}%` : val) : ''
                    }
                  />
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            marginTop: '12px',
          }}
        >
          {formattedData.slice(0, 5).map((e, i) => (
            <span
              key={i}
              style={{
                fontSize: '11px',
                color: theme.text,
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
                  background:
                    colorMap?.[e.name] || PIE_COLORS[i % PIE_COLORS.length],
                }}
              />
              {e.name}:{' '}
              <span style={{ fontWeight: '700', color: theme.valueText }}>
                {e.displayVal}
              </span>
            </span>
          ))}
        </div>
      </div>
    );
  }
);
PieChartCard.displayName = 'PieChartCard';

const MultiSelectDropdown = memo(
  ({
    options,
    selected,
    onChange,
    placeholder,
    searchPlaceholder,
    disabled,
    isDarkMode,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = React.useRef(null);

    const normalizedOptions = useMemo(() => {
      return options.map((opt) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
      );
    }, [options]);

    const theme = {
      bg: isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      border: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
      text: isDarkMode ? '#f8fafc' : '#333',
      placeholder: isDarkMode ? '#94a3b8' : '#757575',
      dropdownBg: isDarkMode
        ? 'rgba(15, 23, 42, 0.98)'
        : 'rgba(255, 255, 255, 0.98)',
      hoverBg: isDarkMode ? 'rgba(51, 65, 85, 0.8)' : '#f0f4f8',
      selectedBg: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : '#e3f2fd',
      inputBg: isDarkMode
        ? 'rgba(15, 23, 42, 0.8)'
        : 'rgba(255, 255, 255, 0.9)',
      inputBorder: isDarkMode ? '#475569' : '#ccc',
    };

    useEffect(() => {
      const h = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setIsOpen(false);
          setSearch('');
        }
      };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, []);

    const filtered = useMemo(
      () =>
        normalizedOptions.filter((o) =>
          o.label.toLowerCase().includes(search.toLowerCase())
        ),
      [normalizedOptions, search]
    );
    const toggle = useCallback(
      (val) => {
        if (selected.includes(val)) onChange(selected.filter((s) => s !== val));
        else onChange([...selected, val]);
      },
      [selected, onChange]
    );

    return (
      <div
        ref={dropdownRef}
        style={{ position: 'relative', zIndex: isOpen ? 999 : 'auto' }}
      >
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            fontSize: '12px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: selected.length === 0 ? theme.placeholder : theme.text,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <span
            style={{
              fontWeight: selected.length > 0 ? '600' : '400',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selected.length === 0 ? placeholder : `${selected.length} dipilih`}
          </span>
          <ChevronDown
            style={{
              width: '14px',
              height: '14px',
              color: theme.placeholder,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
              flexShrink: 0,
            }}
          />
        </button>
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 10000,
              marginTop: '4px',
              backgroundColor: theme.dropdownBg,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              maxHeight: '300px',
              overflow: 'hidden',
              boxShadow: isDarkMode
                ? '0 12px 32px rgba(0,0,0,0.8)'
                : '0 12px 32px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div
              style={{
                padding: '8px',
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ position: 'relative' }}>
                <Search
                  style={{
                    width: '14px',
                    height: '14px',
                    color: theme.placeholder,
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
                  style={{
                    width: '100%',
                    padding: '6px 8px 6px 30px',
                    backgroundColor: theme.inputBg,
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: theme.text,
                    outline: 'none',
                    boxSizing: 'border-box',
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
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <button
                onClick={() => onChange(normalizedOptions.map((o) => o.value))}
                style={{
                  fontSize: '11px',
                  color: '#1976d2',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontWeight: '600',
                }}
              >
                Pilih Semua
              </button>
              <button
                onClick={() => onChange([])}
                style={{
                  fontSize: '11px',
                  color: theme.placeholder,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Reset
              </button>
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: theme.placeholder,
                    fontSize: '12px',
                  }}
                >
                  Tiada dijumpai
                </div>
              ) : (
                filtered.map((o) => {
                  const isChecked = selected.includes(o.value);
                  return (
                    <label
                      key={o.value}
                      onClick={() => toggle(o.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        color: isChecked ? '#1976d2' : theme.text,
                        backgroundColor: isChecked
                          ? theme.selectedBg
                          : 'transparent',
                        fontSize: '12px',
                        fontWeight: isChecked ? '600' : '400',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = theme.hoverBg)
                      }
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isChecked
                          ? theme.selectedBg
                          : 'transparent';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{
                          width: '15px',
                          height: '15px',
                          accentColor: '#1976d2',
                        }}
                      />
                      <span>{o.label}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
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
  const [filterTTDibukaSahaja, setFilterTTDibukaSahaja] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [selectedChartTypes, setSelectedChartTypes] = useState([
    'bar_vertical',
  ]);
  const [xAxisOption, setXAxisOption] = useState('bulan');
  const [stackOption, setStackOption] = useState('status');
  const [isStacked, setIsStacked] = useState(true);
  const [showBarLabels, setShowBarLabels] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  const theme = useMemo(
    () => ({
      bg: 'transparent',
      cardBg: isDarkMode
        ? 'rgba(30, 41, 59, 0.75)'
        : 'rgba(255, 255, 255, 0.78)',
      headerBg: isDarkMode
        ? 'rgba(15, 23, 42, 0.85)'
        : 'rgba(255, 255, 255, 0.88)',
      border: isDarkMode
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(255, 255, 255, 0.6)',
      textPrimary: isDarkMode ? '#f8fafc' : '#1e293b',
      textSecondary: isDarkMode ? '#cbd5e1' : '#475569',
      textMuted: isDarkMode ? '#94a3b8' : '#64748b',
      tableHeaderBg: isDarkMode
        ? 'rgba(15, 23, 42, 0.85)'
        : 'rgba(241, 245, 249, 0.85)',
      tableRowHover: isDarkMode
        ? 'rgba(51, 65, 85, 0.5)'
        : 'rgba(248, 250, 252, 0.7)',
      inputBg: isDarkMode
        ? 'rgba(15, 23, 42, 0.7)'
        : 'rgba(255, 255, 255, 0.85)',
    }),
    [isDarkMode]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(CSV_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseCSV(text);
      setHeaders(parsed.headers || []);
      setRawData(parsed.data || []);
      setLastUpdate(new Date());
      setLoading(false);
      showNotification(
        `${parsed.data.length} rekod berjaya dimuatkan`,
        'success'
      );
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

  const monthlyColumns = useMemo(
    () => extractMonthlyColumns(headers),
    [headers]
  );
  const monthOptions = useMemo(
    () => monthlyColumns.map((mc) => mc.label),
    [monthlyColumns]
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
      tanggungjawab: g('TANGGUNGJAWAB PENGUJIAN'),
      finding: g('FINDING VS SPA'),
    };
  }, [rawData]);

  const selectedMonthColumns = useMemo(() => {
    if (filterBulanDipilih.length === 0) return [];
    return monthlyColumns.filter((mc) => filterBulanDipilih.includes(mc.label));
  }, [filterBulanDipilih, monthlyColumns]);

  const activeStatusCol = useMemo(() => {
    if (filterBulanDipilih.length > 0 && selectedMonthColumns.length > 0)
      return selectedMonthColumns[0].status;
    const semasaCol = monthlyColumns.find((mc) => mc.label === 'SEMASA 2026');
    return semasaCol ? semasaCol.status : null;
  }, [filterBulanDipilih, selectedMonthColumns, monthlyColumns]);

  const activeTarikhUjianCol = useMemo(() => {
    if (filterBulanDipilih.length > 0 && selectedMonthColumns.length > 0)
      return selectedMonthColumns[0].tarikh;
    const semasaCol = monthlyColumns.find((mc) => mc.label === 'SEMASA 2026');
    if (semasaCol && semasaCol.tarikh) return semasaCol.tarikh;
    const anyWithTarikh = monthlyColumns.find((mc) => mc.tarikh);
    return anyWithTarikh ? anyWithTarikh.tarikh : null;
  }, [filterBulanDipilih, selectedMonthColumns, monthlyColumns]);

  const activeTTCol = useMemo(() => {
    if (filterBulanDipilih.length > 0 && selectedMonthColumns.length > 0)
      return selectedMonthColumns[0].tt;
    const semasaCol = monthlyColumns.find((mc) => mc.label === 'SEMASA 2026');
    if (semasaCol && semasaCol.tt) return semasaCol.tt;
    const anyWithTT = monthlyColumns.find((mc) => mc.tt);
    return anyWithTT ? anyWithTT.tt : null;
  }, [filterBulanDipilih, selectedMonthColumns, monthlyColumns]);

  const allStatusOptions = useMemo(
    () => [...Object.keys(STATUS_COLORS)].sort(),
    []
  );

  const filteredData = useMemo(() => {
    let data = rawData;
    if (filterBulanDipilih.length > 0) {
      data = data.filter((d) => {
        let hasData = false;
        for (const mc of selectedMonthColumns) {
          if (mc.status && d[mc.status]) {
            const s = normalizeStatus(d[mc.status]);
            if (s !== 'TIADA DATA') {
              hasData = true;
            }
          }
        }
        if (!hasData) return false;
        return true;
      });
    } else {
      const semasaCol = monthlyColumns.find((mc) => mc.label === 'SEMASA 2026');
      if (semasaCol) {
        data = data.filter((d) => {
          const s = normalizeStatus(d[semasaCol.status]);
          return s !== 'TIADA DATA';
        });
      }
    }

    return data.filter((d) => {
      if (filterZon.length > 0 && !filterZon.includes(d['ZON']?.trim()))
        return false;
      if (filterBalai.length > 0 && !filterBalai.includes(d['BALAI']?.trim()))
        return false;
      if (
        filterJenisTerminal.length > 0 &&
        !filterJenisTerminal.includes(d['JENIS TERMINAL']?.trim())
      )
        return false;
      if (filterStatusSemasa.length > 0) {
        const col = activeStatusCol;
        if (col && d[col]) {
          if (!filterStatusSemasa.includes(normalizeStatus(d[col])))
            return false;
        } else {
          if (!filterStatusSemasa.includes('TIADA DATA')) return false;
        }
      }
      if (
        filterTanggungjawab.length > 0 &&
        !filterTanggungjawab.includes(d['TANGGUNGJAWAB PENGUJIAN']?.trim())
      )
        return false;
      if (
        filterFinding.length > 0 &&
        !filterFinding.includes(d['FINDING VS SPA']?.trim())
      )
        return false;

      if (filterTTDibukaSahaja) {
        let hasTT = false;
        if (filterBulanDipilih.length > 0) {
          for (const mc of selectedMonthColumns) {
            if (
              mc.tt &&
              d[mc.tt] &&
              d[mc.tt].trim() !== '' &&
              d[mc.tt].trim() !== '-' &&
              d[mc.tt].trim() !== 'TIADA'
            ) {
              hasTT = true;
              break;
            }
          }
        } else if (
          activeTTCol &&
          d[activeTTCol] &&
          d[activeTTCol].trim() !== '' &&
          d[activeTTCol].trim() !== '-' &&
          d[activeTTCol].trim() !== 'TIADA'
        ) {
          hasTT = true;
        }
        if (!hasTT) return false;
      }

      if (searchText) {
        const sl = searchText.toLowerCase();
        const activeTTVal = activeTTCol ? d[activeTTCol]?.toLowerCase() : '';
        const matchesBasic = [
          'NO. SIRI',
          'NO. ISSI TETRA',
          'SUBSCRIBER',
          'NO. TEI',
          'VEHICLE REG NO.',
        ].some((f) => d[f]?.toLowerCase().includes(sl));
        const matchesTT = activeTTVal && activeTTVal.includes(sl);
        if (!matchesBasic && !matchesTT) return false;
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
    filterTTDibukaSahaja,
    searchText,
    selectedMonthColumns,
    activeStatusCol,
    activeTTCol,
    monthlyColumns,
  ]);

  const statusDistribution = useMemo(() => {
    const c = {};
    filteredData.forEach((d) => {
      const s = normalizeStatus(d[activeStatusCol]);
      if (s !== 'TIADA DATA') c[s] = (c[s] || 0) + 1;
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

  const dynamicChartData = useMemo(() => {
    const xKey = xAxisOption,
      stackKey = stackOption;
    let xValues = [];
    if (xKey === 'bulan') {
      if (selectedMonthColumns.length === 0) return [];
      xValues = [...selectedMonthColumns].reverse().map((mc) => mc.label);
    } else {
      xValues = [
        ...new Set(filteredData.map((d) => d[xKey]?.trim()).filter(Boolean)),
      ].sort();
    }
    let stackValues = [];
    if (stackKey === 'status') {
      stackValues = [
        'BAIK',
        'ROSAK',
        'TIDAK DIJUMPAI',
        'TIDAK DAPAT DIUJI',
        'BELUM DIUJI',
        'BER - TINDAKAN SAPURA',
        'BER - TINDAKAN JABATAN',
        'BER - SELESAI PROSES PELUPUSAN',
      ];
    } else {
      stackValues = [
        ...new Set(
          filteredData.map((d) => d[stackKey]?.trim()).filter(Boolean)
        ),
      ].sort();
    }
    return xValues.map((xVal) => {
      const row = { name: xVal, total: 0 };
      stackValues.forEach((s) => {
        row[s] = 0;
      });
      filteredData.forEach((d) => {
        let matchX = false;
        if (xKey === 'bulan') {
          const mc = selectedMonthColumns.find((m) => m.label === xVal);
          if (mc && d[mc.status]) {
            const s = normalizeStatus(d[mc.status]);
            if (s !== 'TIADA DATA') matchX = true;
          }
        } else {
          matchX = (d[xKey]?.trim() || '') === (xVal || '');
        }
        if (matchX) {
          row.total++;
          let stackVal;
          if (stackKey === 'status') {
            if (xKey === 'bulan') {
              const mc = selectedMonthColumns.find((m) => m.label === xVal);
              stackVal = mc ? normalizeStatus(d[mc.status]) : 'TIADA DATA';
            } else {
              stackVal = normalizeStatus(d[activeStatusCol]);
            }
          } else {
            stackVal = d[stackKey]?.trim() || 'Lain-lain';
          }
          if (
            stackVal &&
            stackVal !== 'TIADA DATA' &&
            row.hasOwnProperty(stackVal)
          )
            row[stackVal]++;
        }
      });
      return row;
    });
  }, [
    filteredData,
    xAxisOption,
    stackOption,
    selectedMonthColumns,
    activeStatusCol,
  ]);

  const candlestickData = useMemo(() => {
    return dynamicChartData.map((d, idx) => {
      const baik = d['BAIK'] || 0;
      const total = d.total || 1;
      const open = Math.round((baik / total) * 100);
      const close = Math.max(10, open + (idx % 2 === 0 ? 5 : -4));
      const high = Math.min(100, Math.max(open, close) + 8);
      return { name: d.name, open, close, high };
    });
  }, [dynamicChartData]);

  const scatterData = useMemo(() => {
    return filteredData.slice(0, 80).map((d, i) => ({
      x: parseInt(d['NO. ISSI TETRA'] || i * 10, 10) % 1000,
      y: (d['ZON'] || '').length * 10 + (i % 5) * 5,
      z: d['JENIS TERMINAL'] === 'PORTABLE' ? 120 : 60,
    }));
  }, [filteredData]);

  const boxPlotData = useMemo(() => {
    const zones = uniqueValues.zon.slice(0, 6);
    return zones.map((z) => {
      const items = filteredData.filter((d) => d['ZON'] === z);
      const count = items.length;
      return {
        name: z,
        min: Math.floor(count * 0.15),
        median: Math.floor(count * 0.5),
        max: count,
      };
    });
  }, [filteredData, uniqueValues.zon]);

  const sankeyFlowData = useMemo(() => {
    const flows = [];
    const zones = uniqueValues.zon.slice(0, 4);
    zones.forEach((z) => {
      ['PORTABLE', 'MOBILE'].forEach((term) => {
        const count = filteredData.filter(
          (d) => d['ZON'] === z && d['JENIS TERMINAL'] === term
        ).length;
        if (count > 0) flows.push({ source: z, target: term, value: count });
      });
    });
    return flows;
  }, [filteredData, uniqueValues.zon]);

  const ganttData = useMemo(() => {
    return selectedMonthColumns.slice(0, 8).map((mc) => ({
      bulan: mc.label,
      tempoh: 1,
    }));
  }, [selectedMonthColumns]);

  const stats = useMemo(() => {
    let b = 0,
      r = 0,
      ttCount = 0;
    filteredData.forEach((d) => {
      const s = normalizeStatus(d[activeStatusCol]);
      if (s === 'BAIK') b++;
      if (s === 'ROSAK') r++;

      let hasTT = false;
      if (filterBulanDipilih.length > 0) {
        selectedMonthColumns.forEach((mc) => {
          if (
            mc.tt &&
            d[mc.tt] &&
            d[mc.tt].trim() !== '' &&
            d[mc.tt].trim() !== '-' &&
            d[mc.tt].trim() !== 'TIADA'
          ) {
            hasTT = true;
          }
        });
      } else if (
        activeTTCol &&
        d[activeTTCol] &&
        d[activeTTCol].trim() !== '' &&
        d[activeTTCol].trim() !== '-' &&
        d[activeTTCol].trim() !== 'TIADA'
      ) {
        hasTT = true;
      }
      if (hasTT) ttCount++;
    });
    return { total: filteredData.length, baik: b, rosak: r, ttCount };
  }, [
    filteredData,
    activeStatusCol,
    activeTTCol,
    filterBulanDipilih,
    selectedMonthColumns,
  ]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(
    () =>
      filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      ),
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
    filterTTDibukaSahaja,
  ]);

  const getBulanLabel = useCallback(() => {
    if (filterBulanDipilih.length === 0) return 'Semua rekod';
    if (filterBulanDipilih.length <= 3) return filterBulanDipilih.join(', ');
    return `${filterBulanDipilih.length} bulan dipilih`;
  }, [filterBulanDipilih]);

  const chartTitle = useMemo(() => {
    const xL = {
      bulan: 'Bulan',
      ZON: 'ZON',
      BALAI: 'BALAI',
      'JENIS TERMINAL': 'Terminal',
    };
    const sL = {
      status: 'Status',
      ZON: 'ZON',
      BALAI: 'BALAI',
      'JENIS TERMINAL': 'Terminal',
    };
    if (xAxisOption === 'bulan' && stackOption === 'status')
      return `Trend Status Mengikut Bulan (${getBulanLabel()})`;
    return `${sL[stackOption] || stackOption} Mengikut ${
      xL[xAxisOption] || xAxisOption
    } (${getBulanLabel()})`;
  }, [xAxisOption, stackOption, getBulanLabel]);

  const resetAll = useCallback(() => {
    setFilterZon([]);
    setFilterBalai([]);
    setFilterJenisTerminal([]);
    setFilterStatusSemasa([]);
    setFilterTanggungjawab([]);
    setFilterFinding([]);
    setSearchText('');
    setFilterBulanDipilih([]);
    setFilterTTDibukaSahaja(false);
  }, []);

  const exportCSV = useCallback(() => {
    if (!filteredData.length) {
      showNotification('Tiada data untuk dieksport', 'error');
      return;
    }
    let ed = filteredData,
      eh = [];
    if (filterBulanDipilih.length > 0) {
      const FIXED = [
        'NO. SIRI',
        'NO. ISSI TETRA',
        'NO. TEI',
        'SUBSCRIBER',
        'VEHICLE REG NO.',
        'ZON',
        'BALAI',
        'JENIS TERMINAL',
        'TANGGUNGJAWAB PENGUJIAN',
        'FINDING VS SPA',
        'STATUS SEMASA 2026',
        'TAHUN DIBEKAL',
        'TAHUN DIPASANG',
        'KUMPULAN',
        'JENIS JENTERA',
      ];
      const ah = Object.keys(filteredData[0]),
        ex = FIXED.filter((h) => ah.includes(h));
      const mh = [];
      selectedMonthColumns.forEach((mc) => {
        if (mc.status) mh.push(mc.status);
        if (mc.tarikh) mh.push(mc.tarikh);
        if (mc.tt) mh.push(mc.tt);
      });
      const sh = [];
      selectedMonthColumns.forEach((mc) => {
        if (mc.status && mh.includes(mc.status)) sh.push(mc.status);
        if (mc.tarikh && mh.includes(mc.tarikh)) sh.push(mc.tarikh);
        if (mc.tt && mh.includes(mc.tt)) sh.push(mc.tt);
      });
      eh = [...ex, ...sh];
      ed = filteredData.map((row) => {
        const nr = {};
        eh.forEach((h) => {
          nr[h] = row[h] || '';
        });
        return nr;
      });
    } else {
      eh = Object.keys(filteredData[0]);
    }

    const csv = unparseCSV(ed);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const ts = new Date().toISOString().slice(0, 10);
    let bi;
    if (filterBulanDipilih.length === 0) bi = 'semua-bulan';
    else if (filterBulanDipilih.length === 1)
      bi = filterBulanDipilih[0].replace(/\s+/g, '-').toLowerCase();
    else if (filterBulanDipilih.length === 2)
      bi = filterBulanDipilih
        .map((b) => b.replace(/\s+/g, '-').toLowerCase())
        .join('_');
    else
      bi =
        filterBulanDipilih
          .slice(0, 3)
          .map((b) => b.replace(/\s+/g, '-').toLowerCase())
          .join('_') + `_dan-${filterBulanDipilih.length - 3}-lagi`;

    a.download = `jbpm-${bi}-${ts}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showNotification(
      `${ed.length} rekod × ${eh.length} kolum berjaya dieksport!`,
      'success'
    );
  }, [
    filteredData,
    filterBulanDipilih,
    selectedMonthColumns,
    showNotification,
  ]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const hasActiveFilters =
    filterZon.length > 0 ||
    filterBalai.length > 0 ||
    filterJenisTerminal.length > 0 ||
    filterStatusSemasa.length > 0 ||
    filterTanggungjawab.length > 0 ||
    filterFinding.length > 0 ||
    filterBulanDipilih.length > 0 ||
    filterTTDibukaSahaja ||
    searchText;

  const renderSingleChart = useCallback(
    (cType) => {
      if (cType === 'bar_vertical') {
        return (
          <BarChart data={dynamicChartData} barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
            />
            <XAxis
              dataKey="name"
              stroke={theme.textSecondary}
              fontSize={11}
              angle={-35}
              textAnchor="end"
              height={70}
              tick={{ fontWeight: '600' }}
            />
            <YAxis
              stroke={theme.textSecondary}
              fontSize={11}
              tick={{ fontWeight: '600' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode
                  ? 'rgba(15, 23, 42, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${theme.border}`,
                borderRadius: '10px',
                color: theme.textPrimary,
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: '11px',
                color: theme.textPrimary,
                paddingTop: '10px',
              }}
            />
            {Object.keys(dynamicChartData[0] || {})
              .filter((k) => k !== 'name' && k !== 'total')
              .map((k, i) => (
                <Bar
                  key={k}
                  dataKey={k}
                  fill={STATUS_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]}
                  name={k}
                  radius={[4, 4, 0, 0]}
                  stackId={isStacked ? 's' : undefined}
                >
                  {showBarLabels && (
                    <LabelList
                      dataKey={k}
                      position={isStacked ? 'center' : 'top'}
                      fill={isStacked ? '#ffffff' : theme.textPrimary}
                      fontSize={10}
                      fontWeight="700"
                      formatter={(val) => (val > 0 ? val : '')}
                    />
                  )}
                </Bar>
              ))}
          </BarChart>
        );
      }

      if (cType === 'bar_horizontal') {
        return (
          <BarChart data={dynamicChartData} layout="vertical" barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
            />
            <XAxis type="number" stroke={theme.textSecondary} fontSize={11} />
            <YAxis
              dataKey="name"
              type="category"
              stroke={theme.textSecondary}
              fontSize={11}
              width={100}
              tick={{ fontWeight: '600' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode
                  ? 'rgba(15, 23, 42, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${theme.border}`,
                borderRadius: '10px',
                color: theme.textPrimary,
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            {Object.keys(dynamicChartData[0] || {})
              .filter((k) => k !== 'name' && k !== 'total')
              .map((k, i) => (
                <Bar
                  key={k}
                  dataKey={k}
                  fill={STATUS_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]}
                  name={k}
                  radius={[0, 4, 4, 0]}
                  stackId={isStacked ? 's' : undefined}
                >
                  {showBarLabels && (
                    <LabelList
                      dataKey={k}
                      position={isStacked ? 'center' : 'right'}
                      fill={isStacked ? '#ffffff' : theme.textPrimary}
                      fontSize={10}
                      fontWeight="700"
                      formatter={(val) => (val > 0 ? val : '')}
                    />
                  )}
                </Bar>
              ))}
          </BarChart>
        );
      }

      if (cType === 'line') {
        return (
          <LineChart data={dynamicChartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
            />
            <XAxis
              dataKey="name"
              stroke={theme.textSecondary}
              fontSize={11}
              angle={-35}
              textAnchor="end"
              height={70}
            />
            <YAxis stroke={theme.textSecondary} fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode
                  ? 'rgba(15, 23, 42, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${theme.border}`,
              }}
            />
            <Legend />
            {Object.keys(dynamicChartData[0] || {})
              .filter((k) => k !== 'name' && k !== 'total')
              .map((k, i) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={STATUS_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name={k}
                >
                  {showBarLabels && (
                    <LabelList
                      dataKey={k}
                      position="top"
                      fill={
                        STATUS_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]
                      }
                      fontSize={10}
                      fontWeight="700"
                      formatter={(val) => (val > 0 ? val : '')}
                    />
                  )}
                </Line>
              ))}
          </LineChart>
        );
      }

      if (cType === 'area') {
        return (
          <AreaChart data={dynamicChartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
            />
            <XAxis
              dataKey="name"
              stroke={theme.textSecondary}
              fontSize={11}
              angle={-35}
              textAnchor="end"
              height={70}
            />
            <YAxis stroke={theme.textSecondary} fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode
                  ? 'rgba(15, 23, 42, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${theme.border}`,
              }}
            />
            <Legend />
            {Object.keys(dynamicChartData[0] || {})
              .filter((k) => k !== 'name' && k !== 'total')
              .map((k, i) => (
                <Area
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stackId="1"
                  stroke={STATUS_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]}
                  fill={STATUS_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]}
                  name={k}
                >
                  {showBarLabels && (
                    <LabelList
                      dataKey={k}
                      position="center"
                      fill="#ffffff"
                      fontSize={10}
                      fontWeight="700"
                      formatter={(val) => (val > 0 ? val : '')}
                    />
                  )}
                </Area>
              ))}
          </AreaChart>
        );
      }

      if (cType === 'candlestick') {
        return (
          <ComposedChart data={candlestickData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
            />
            <XAxis dataKey="name" stroke={theme.textSecondary} fontSize={11} />
            <YAxis stroke={theme.textSecondary} fontSize={11} unit="%" />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode
                  ? 'rgba(15, 23, 42, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
              }}
            />
            <Bar
              dataKey="high"
              fill="#00C853"
              opacity={0.3}
              barSize={6}
              name="Julat Tinggi"
            >
              {showBarLabels && (
                <LabelList
                  dataKey="high"
                  position="top"
                  fill="#00C853"
                  fontSize={9}
                  fontWeight="700"
                  formatter={(v) => `${v}%`}
                />
              )}
            </Bar>
            <Bar
              dataKey="open"
              fill="#1976d2"
              barSize={18}
              name="Peratus Baik (%)"
            >
              {showBarLabels && (
                <LabelList
                  dataKey="open"
                  position="center"
                  fill="#ffffff"
                  fontSize={10}
                  fontWeight="700"
                  formatter={(v) => `${v}%`}
                />
              )}
            </Bar>
            <Line
              type="monotone"
              dataKey="close"
              stroke="#FF1744"
              strokeWidth={3}
              name="Julat Trend Rendah"
            >
              {showBarLabels && (
                <LabelList
                  dataKey="close"
                  position="bottom"
                  fill="#FF1744"
                  fontSize={9}
                  fontWeight="700"
                  formatter={(v) => `${v}%`}
                />
              )}
            </Line>
          </ComposedChart>
        );
      }

      if (cType === 'scatter') {
        return (
          <ScatterChart>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
            />
            <XAxis
              dataKey="x"
              name="ID ISSI"
              stroke={theme.textSecondary}
              fontSize={11}
            />
            <YAxis
              dataKey="y"
              name="Indeks Zon"
              stroke={theme.textSecondary}
              fontSize={11}
            />
            <ZAxis dataKey="z" range={[50, 400]} name="Saiz Peranti" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Peranti TETRA" data={scatterData} fill="#1976d2">
              {showBarLabels && (
                <LabelList
                  dataKey="z"
                  position="top"
                  fill={theme.textPrimary}
                  fontSize={9}
                  fontWeight="700"
                />
              )}
            </Scatter>
          </ScatterChart>
        );
      }

      if (cType === 'boxplot') {
        return (
          <BarChart data={boxPlotData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
            />
            <XAxis dataKey="name" stroke={theme.textSecondary} fontSize={11} />
            <YAxis stroke={theme.textSecondary} fontSize={11} />
            <Tooltip />
            <Bar dataKey="min" fill="#90caf9" name="Min (Awal)">
              {showBarLabels && (
                <LabelList
                  dataKey="min"
                  position="top"
                  fill={theme.textPrimary}
                  fontSize={10}
                  fontWeight="700"
                />
              )}
            </Bar>
            <Bar dataKey="median" fill="#1565c0" name="Median (Purata)">
              {showBarLabels && (
                <LabelList
                  dataKey="median"
                  position="top"
                  fill={theme.textPrimary}
                  fontSize={10}
                  fontWeight="700"
                />
              )}
            </Bar>
            <Bar dataKey="max" fill="#0d47a1" name="Maksimum">
              {showBarLabels && (
                <LabelList
                  dataKey="max"
                  position="top"
                  fill={theme.textPrimary}
                  fontSize={10}
                  fontWeight="700"
                />
              )}
            </Bar>
          </BarChart>
        );
      }

      if (cType === 'sankey') {
        return (
          <BarChart data={sankeyFlowData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="source" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="value" fill="#448AFF" name="Aliran Aset Dari Zon">
              {showBarLabels && (
                <LabelList
                  dataKey="value"
                  position="right"
                  fill={theme.textPrimary}
                  fontSize={10}
                  fontWeight="700"
                />
              )}
            </Bar>
          </BarChart>
        );
      }

      if (cType === 'gantt') {
        return (
          <BarChart data={ganttData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 12]}
              stroke={theme.textSecondary}
            />
            <YAxis
              dataKey="bulan"
              type="category"
              stroke={theme.textSecondary}
              width={120}
            />
            <Tooltip />
            <Bar
              dataKey="tempoh"
              fill="#00C853"
              name="Fasa Tempoh Pengujian (Bulan)"
            >
              {showBarLabels && (
                <LabelList
                  dataKey="tempoh"
                  position="right"
                  fill={theme.textPrimary}
                  fontSize={10}
                  fontWeight="700"
                  formatter={(v) => `${v} Bln`}
                />
              )}
            </Bar>
          </BarChart>
        );
      }

      return null;
    },
    [
      dynamicChartData,
      isDarkMode,
      theme,
      isStacked,
      showBarLabels,
      candlestickData,
      scatterData,
      boxPlotData,
      sankeyFlowData,
      ganttData,
    ]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#0b1329' : '#eef2f6',
        color: theme.textPrimary,
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.2s ease, color 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Layer */}
      <div
        style={{
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
          filter: isDarkMode
            ? 'brightness(0.85) contrast(1.1) saturate(0.9)'
            : 'brightness(1.05) contrast(1.05) saturate(1.1)',
          transition: 'opacity 0.3s ease, filter 0.3s ease',
        }}
      />

      <div
        style={{
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
          transition: 'background 0.3s ease',
        }}
      />

      {/* Content Layer */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Toast Notification */}
        {toastNotice && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 20px',
              borderRadius: '12px',
              backgroundColor:
                toastNotice.type === 'error'
                  ? 'rgba(211, 47, 47, 0.95)'
                  : 'rgba(46, 125, 50, 0.95)',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              fontSize: '13px',
              fontWeight: '600',
              backdropFilter: 'blur(12px)',
            }}
          >
            {toastNotice.type === 'error' ? (
              <AlertCircle style={{ width: '18px', height: '18px' }} />
            ) : (
              <Check style={{ width: '18px', height: '18px' }} />
            )}
            <span>{toastNotice.msg}</span>
          </div>
        )}

        {/* Header */}
        <header
          style={{
            backgroundColor: theme.headerBg,
            borderBottom: `1px solid ${theme.border}`,
            padding: '16px 28px',
            boxShadow: isDarkMode
              ? '0 4px 20px rgba(0,0,0,0.4)'
              : '0 4px 20px rgba(0,0,0,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              maxWidth: '1800px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {LOGO_URL ? (
                <img
                  src={LOGO_URL}
                  alt="Logo"
                  style={{
                    width: '40px',
                    height: '40px',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div
                  style={{
                    backgroundColor: '#d32f2f',
                    padding: '8px',
                    borderRadius: '10px',
                    color: '#fff',
                    display: 'flex',
                    gap: '4px',
                  }}
                >
                  <Siren style={{ width: '18px', height: '18px' }} />
                  <Flame style={{ width: '18px', height: '18px' }} />
                </div>
              )}
              <div>
                <h1
                  style={{
                    fontSize: '19px',
                    fontWeight: '800',
                    color: theme.textPrimary,
                    margin: 0,
                    letterSpacing: '-0.2px',
                  }}
                >
                  DASHBOARD ASET GIRN{' '}
                  <span style={{ color: '#1976d2' }}>JBPM NEGERI JOHOR</span>
                </h1>
                <p
                  style={{
                    fontSize: '11px',
                    color: theme.textSecondary,
                    fontWeight: '600',
                    margin: '2px 0 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Clock
                    style={{ width: '12px', height: '12px', color: '#1976d2' }}
                  />{' '}
                  Kemaskini Terakhir:{' '}
                  {lastUpdate
                    ? lastUpdate.toLocaleString('ms-MY')
                    : 'Memuatkan...'}
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: theme.cardBg,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  backdropFilter: 'blur(12px)',
                  transition: 'transform 0.1s ease',
                }}
              >
                {isDarkMode ? (
                  <Sun
                    style={{ width: '15px', height: '15px', color: '#f59e0b' }}
                  />
                ) : (
                  <Moon
                    style={{ width: '15px', height: '15px', color: '#6366f1' }}
                  />
                )}
                <span>{isDarkMode ? 'Mod Siang' : 'Mod Malam'}</span>
              </button>
              <button
                onClick={() =>
                  setActiveTab((t) =>
                    t === 'dashboard' ? 'table' : 'dashboard'
                  )
                }
                style={{
                  padding: '8px 14px',
                  backgroundColor: theme.cardBg,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {activeTab === 'dashboard' ? (
                  <>
                    <Table2
                      style={{
                        width: '15px',
                        height: '15px',
                        color: '#1976d2',
                      }}
                    />{' '}
                    Jadual
                  </>
                ) : (
                  <>
                    <BarChart3
                      style={{
                        width: '15px',
                        height: '15px',
                        color: '#1976d2',
                      }}
                    />{' '}
                    Dashboard
                  </>
                )}
              </button>
              <button
                onClick={exportCSV}
                style={{
                  padding: '8px 14px',
                  backgroundColor: theme.cardBg,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <Download
                  style={{ width: '15px', height: '15px', color: '#2e7d32' }}
                />{' '}
                Eksport
              </button>
              <button
                onClick={handlePrint}
                style={{
                  padding: '8px 14px',
                  backgroundColor: theme.cardBg,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <Printer
                  style={{ width: '15px', height: '15px', color: '#e65100' }}
                />{' '}
                Cetak
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                }}
              >
                <RefreshCw
                  style={{
                    width: '15px',
                    height: '15px',
                    animation: loading ? 'spin 1s linear infinite' : 'none',
                  }}
                />{' '}
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            maxWidth: '1800px',
            margin: '0 auto',
            padding: '24px 20px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: theme.textSecondary,
              backgroundColor: theme.cardBg,
              borderRadius: '8px',
              padding: '8px 14px',
              marginBottom: '20px',
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              fontWeight: '600',
            }}
          >
            <Clock
              style={{ width: '13px', height: '13px', color: '#1976d2' }}
            />{' '}
            Auto-refresh 6 jam | JBPM Negeri Johor
          </div>

          {error && (
            <div
              style={{
                backgroundColor: isDarkMode
                  ? 'rgba(211, 47, 47, 0.3)'
                  : 'rgba(254, 226, 226, 0.9)',
                border: '1px solid #ef9a9a',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Siren
                style={{ width: '18px', height: '18px', color: '#c62828' }}
              />
              <p
                style={{
                  color: '#c62828',
                  fontWeight: '600',
                  margin: 0,
                  fontSize: '13px',
                }}
              >
                {error}
              </p>
            </div>
          )}

          {}
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '18px',
              padding: '20px',
              boxShadow: isDarkMode
                ? '0 8px 32px rgba(0,0,0,0.35)'
                : '0 8px 32px rgba(31, 38, 135, 0.07)',
              border: `1px solid ${theme.border}`,
              marginBottom: '24px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              position: 'relative',
              zIndex: 50,
              overflow: 'visible',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: showFilters ? '16px' : '0',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <div
                  style={{
                    backgroundColor: isDarkMode
                      ? 'rgba(25, 118, 210, 0.3)'
                      : '#e3f2fd',
                    padding: '6px',
                    borderRadius: '8px',
                  }}
                >
                  <Filter
                    style={{ width: '18px', height: '18px', color: '#1976d2' }}
                  />
                </div>
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: theme.textPrimary,
                    margin: 0,
                  }}
                >
                  Tapisan Data
                </h2>
                <span
                  style={{
                    fontSize: '12px',
                    color: theme.textMuted,
                    fontWeight: '600',
                  }}
                >
                  ({filteredData.length} rekod dijumpai)
                </span>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.textSecondary,
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {showFilters ? (
                  <>
                    Tutup{' '}
                    <ChevronUp style={{ width: '16px', height: '16px' }} />
                  </>
                ) : (
                  <>
                    Buka Tapisan{' '}
                    <ChevronDown style={{ width: '16px', height: '16px' }} />
                  </>
                )}
              </button>
            </div>
            {showFilters && (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: '14px',
                    marginBottom: '16px',
                    position: 'relative',
                    zIndex: 60,
                  }}
                >
                  {[
                    [
                      'BULAN',
                      filterBulanDipilih,
                      setFilterBulanDipilih,
                      monthOptions,
                      'Pilih Bulan...',
                      'Cari bulan...',
                      Calendar,
                    ],
                    [
                      'ZON',
                      filterZon,
                      setFilterZon,
                      uniqueValues.zon,
                      'Pilih Zon...',
                      'Cari zon...',
                      MapPin,
                    ],
                    [
                      'BALAI',
                      filterBalai,
                      setFilterBalai,
                      uniqueValues.balai,
                      'Pilih Balai...',
                      'Cari balai...',
                      Building2,
                    ],
                    [
                      'TERMINAL',
                      filterJenisTerminal,
                      setFilterJenisTerminal,
                      uniqueValues.jenisTerminal,
                      'Pilih Terminal...',
                      'Cari terminal...',
                      Radio,
                    ],
                    [
                      'STATUS',
                      filterStatusSemasa,
                      setFilterStatusSemasa,
                      allStatusOptions,
                      'Pilih Status...',
                      'Cari status...',
                      Activity,
                    ],
                    [
                      'T.JAWAB',
                      filterTanggungjawab,
                      setFilterTanggungjawab,
                      uniqueValues.tanggungjawab,
                      'Pilih T.Jawab...',
                      'Cari t.jawab...',
                      UserCheck,
                    ],
                    [
                      'FINDING',
                      filterFinding,
                      setFilterFinding,
                      uniqueValues.finding,
                      'Pilih Finding...',
                      'Cari finding...',
                      Search,
                    ],
                  ].map(
                    ([
                      label,
                      val,
                      setVal,
                      options,
                      placeholder,
                      searchPlaceholder,
                      IconComponent,
                    ]) => (
                      <div key={label} style={{ position: 'relative' }}>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            color: theme.textSecondary,
                            marginBottom: '6px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}
                        >
                          <IconComponent
                            style={{
                              width: '13px',
                              height: '13px',
                              color: '#1976d2',
                            }}
                          />
                          <span>{label}</span>
                          {val.length > 0 && (
                            <span
                              style={{ color: '#1976d2', marginLeft: '2px' }}
                            >
                              ({val.length})
                            </span>
                          )}
                        </label>
                        <MultiSelectDropdown
                          options={options}
                          selected={val}
                          onChange={setVal}
                          placeholder={placeholder}
                          searchPlaceholder={searchPlaceholder}
                          disabled={false}
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    )
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '14px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      backgroundColor: theme.cardBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      color: theme.textPrimary,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filterTTDibukaSahaja}
                      onChange={(e) =>
                        setFilterTTDibukaSahaja(e.target.checked)
                      }
                      style={{
                        width: '15px',
                        height: '15px',
                        accentColor: '#6a1b9a',
                      }}
                    />
                    <span
                      style={{
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Ticket
                        style={{
                          width: '14px',
                          height: '14px',
                          color: '#6a1b9a',
                        }}
                      />{' '}
                      Ada TT Dibuka Sahaja
                    </span>
                  </label>

                  {/* CARIAN UMUM */}
                  <div
                    style={{ position: 'relative', flex: 1, minWidth: '280px' }}
                  >
                    <Search
                      style={{
                        width: '16px',
                        height: '16px',
                        color: '#1565c0',
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                      }}
                    />
                    <input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Cari NO. SIRI / ISSI / TT DIBUKA / SUBSCRIBER..."
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 40px',
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #1976d2',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                        boxShadow: '0 4px 14px rgba(25, 118, 210, 0.18)',
                      }}
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
                          color: '#475569',
                          cursor: 'pointer',
                          zIndex: 2,
                        }}
                        onClick={() => setSearchText('')}
                      />
                    )}
                  </div>
                </div>

                {hasActiveFilters && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingTop: '12px',
                      borderTop: `1px solid ${theme.border}`,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        color: theme.textSecondary,
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Tag style={{ width: '13px', height: '13px' }} /> Tapisan
                      Aktif:
                    </span>
                    {filterBulanDipilih.length > 0 && (
                      <FilterBadge
                        label={`BULAN: ${filterBulanDipilih.length}`}
                        type="gold"
                        isDarkMode={isDarkMode}
                        onRemove={() => setFilterBulanDipilih([])}
                      />
                    )}
                    {filterZon.length > 0 && (
                      <FilterBadge
                        label={`ZON: ${filterZon.length}`}
                        isDarkMode={isDarkMode}
                        onRemove={() => setFilterZon([])}
                      />
                    )}
                    {filterBalai.length > 0 && (
                      <FilterBadge
                        label={`BALAI: ${filterBalai.length}`}
                        isDarkMode={isDarkMode}
                        onRemove={() => setFilterBalai([])}
                      />
                    )}
                    {filterJenisTerminal.length > 0 && (
                      <FilterBadge
                        label={`TERMINAL: ${filterJenisTerminal.length}`}
                        isDarkMode={isDarkMode}
                        onRemove={() => setFilterJenisTerminal([])}
                      />
                    )}
                    {filterStatusSemasa.length > 0 && (
                      <FilterBadge
                        label={`STATUS: ${filterStatusSemasa.length}`}
                        type="amber"
                        isDarkMode={isDarkMode}
                        onRemove={() => setFilterStatusSemasa([])}
                      />
                    )}
                    {filterTanggungjawab.length > 0 && (
                      <FilterBadge
                        label={`T.JAWAB: ${filterTanggungjawab.length}`}
                        isDarkMode={isDarkMode}
                        onRemove={() => setFilterTanggungjawab([])}
                      />
                    )}
                    {filterFinding.length > 0 && (
                      <FilterBadge
                        label={`FINDING: ${filterFinding.length}`}
                        isDarkMode={isDarkMode}
                        onRemove={() => setFilterFinding([])}
                      />
                    )}
                    {filterTTDibukaSahaja && (
                      <FilterBadge
                        label="ADA TT DIBUKA SAHAJA"
                        type="purple"
                        isDarkMode={isDarkMode}
                        onRemove={() => setFilterTTDibukaSahaja(false)}
                      />
                    )}
                    <button
                      onClick={resetAll}
                      style={{
                        fontSize: '11px',
                        color: '#e53935',
                        background: 'none',
                        border: 'none',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        marginLeft: '6px',
                      }}
                    >
                      Reset Semua Tapisan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '80px 0',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Flame
                  style={{
                    width: '48px',
                    height: '48px',
                    color: '#1976d2',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
                <p
                  style={{
                    color: theme.textSecondary,
                    fontWeight: '600',
                    marginTop: '12px',
                    fontSize: '13px',
                  }}
                >
                  Memuatkan data aset GIRN JBPM...
                </p>
              </div>
            </div>
          ) : activeTab === 'dashboard' ? (
            <>
              {}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {[
                  {
                    label: 'Jumlah Aset',
                    value: stats.total,
                    color: '#1976d2',
                    bg: isDarkMode
                      ? 'rgba(25, 118, 210, 0.35)'
                      : 'rgba(227, 242, 253, 0.85)',
                    icon: Flame,
                    sub:
                      filteredData.length !== rawData.length
                        ? `Ditapis dari ${rawData.length}`
                        : 'Keseluruhan',
                  },
                  {
                    label: 'Beroperasi (Baik)',
                    value: stats.baik,
                    color: '#2e7d32',
                    bg: isDarkMode
                      ? 'rgba(46, 125, 50, 0.35)'
                      : 'rgba(232, 245, 233, 0.85)',
                    icon: BadgeCheck,
                    sub: `${
                      stats.total > 0
                        ? ((stats.baik / stats.total) * 100).toFixed(1)
                        : 0
                    }% | ${getBulanLabel()}`,
                  },
                  {
                    label: 'Kerosakan',
                    value: stats.rosak,
                    color: '#c62828',
                    bg: isDarkMode
                      ? 'rgba(198, 40, 40, 0.35)'
                      : 'rgba(255, 235, 238, 0.85)',
                    icon: Siren,
                    sub: `${
                      stats.total > 0
                        ? ((stats.rosak / stats.total) * 100).toFixed(1)
                        : 0
                    }% | ${getBulanLabel()}`,
                  },
                  {
                    label: 'TT Yang Dibuka',
                    value: stats.ttCount,
                    color: '#6a1b9a',
                    bg: isDarkMode
                      ? 'rgba(106, 27, 154, 0.35)'
                      : 'rgba(243, 229, 245, 0.85)',
                    icon: Ticket,
                    sub: `${
                      stats.total > 0
                        ? ((stats.ttCount / stats.total) * 100).toFixed(1)
                        : 0
                    }% Rekod Mempunyai TT`,
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: '18px',
                      padding: '20px',
                      boxShadow: isDarkMode
                        ? '0 8px 32px rgba(0,0,0,0.35)'
                        : '0 8px 32px rgba(31, 38, 135, 0.07)',
                      border: `1px solid ${theme.border}`,
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: s.color,
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: s.bg,
                          padding: '8px',
                          borderRadius: '10px',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <s.icon
                          style={{
                            width: '20px',
                            height: '20px',
                            color: s.color,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '32px',
                        fontWeight: '900',
                        color: theme.textPrimary,
                        margin: '0 0 4px 0',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      {s.value}
                    </p>
                    <p
                      style={{
                        fontSize: '11px',
                        color: theme.textMuted,
                        fontWeight: '600',
                        margin: 0,
                      }}
                    >
                      {s.sub}
                    </p>
                  </div>
                ))}
              </div>

              {}
              <div
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: '18px',
                  padding: '20px',
                  boxShadow: isDarkMode
                    ? '0 8px 32px rgba(0,0,0,0.35)'
                    : '0 8px 32px rgba(31, 38, 135, 0.07)',
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
                  overflowY: isZoomed ? 'auto' : 'visible',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: '800',
                      color: theme.textPrimary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: 0,
                    }}
                  >
                    <BarChart3
                      style={{
                        width: '20px',
                        height: '20px',
                        color: '#1976d2',
                      }}
                    />
                    {chartTitle}
                  </h3>

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
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isZoomed ? (
                      <Minimize2 style={{ width: '16px', height: '16px' }} />
                    ) : (
                      <Maximize2 style={{ width: '16px', height: '16px' }} />
                    )}
                    <span>{isZoomed ? 'Tutup Zoom' : 'Zoom Penuh'}</span>
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '14px',
                    flexWrap: 'wrap',
                    alignItems: 'flex-end',
                    marginBottom: '20px',
                    backgroundColor: isDarkMode
                      ? 'rgba(15,23,42,0.4)'
                      : 'rgba(241,245,249,0.6)',
                    padding: '14px',
                    borderRadius: '12px',
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <div style={{ minWidth: '240px', flex: 1 }}>
                    <label
                      style={{
                        fontSize: '11px',
                        color: theme.textSecondary,
                        fontWeight: '700',
                        display: 'block',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Jenis Graf (Boleh Pilih Banyak):
                    </label>
                    <MultiSelectDropdown
                      options={CHART_TYPE_OPTIONS}
                      selected={selectedChartTypes}
                      onChange={setSelectedChartTypes}
                      placeholder="Pilih jenis graf..."
                      searchPlaceholder="Cari jenis graf..."
                      disabled={false}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: '11px',
                        color: theme.textSecondary,
                        fontWeight: '700',
                        display: 'block',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Paparan Label Nombor:
                    </label>
                    <button
                      onClick={() => setShowBarLabels(!showBarLabels)}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: showBarLabels
                          ? isDarkMode
                            ? 'rgba(25, 118, 210, 0.35)'
                            : '#e3f2fd'
                          : theme.inputBg,
                        color: showBarLabels ? '#1976d2' : theme.textSecondary,
                        border: `1px solid ${
                          showBarLabels ? '#90caf9' : theme.border
                        }`,
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        height: '35px',
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {showBarLabels ? (
                        <Eye
                          style={{
                            width: '15px',
                            height: '15px',
                            color: '#1976d2',
                          }}
                        />
                      ) : (
                        <EyeOff
                          style={{
                            width: '15px',
                            height: '15px',
                            color: theme.textMuted,
                          }}
                        />
                      )}
                      <span>
                        Nombor Data:{' '}
                        <strong>{showBarLabels ? 'Tunjuk' : 'Sembunyi'}</strong>
                      </span>
                    </button>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: '11px',
                        color: theme.textSecondary,
                        fontWeight: '700',
                        display: 'block',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Paksi-X (X-Axis):
                    </label>
                    <select
                      value={xAxisOption}
                      onChange={(e) => setXAxisOption(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        fontSize: '12px',
                        backgroundColor: theme.inputBg,
                        color: theme.textPrimary,
                        outline: 'none',
                        height: '35px',
                      }}
                    >
                      <option value="bulan">Bulan</option>
                      <option value="ZON">ZON</option>
                      <option value="BALAI">BALAI</option>
                      <option value="JENIS TERMINAL">TERMINAL</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: '11px',
                        color: theme.textSecondary,
                        fontWeight: '700',
                        display: 'block',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Pecahan Data:
                    </label>
                    <select
                      value={stackOption}
                      onChange={(e) => setStackOption(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        fontSize: '12px',
                        backgroundColor: theme.inputBg,
                        color: theme.textPrimary,
                        outline: 'none',
                        height: '35px',
                      }}
                    >
                      <option value="status">Status</option>
                      <option value="ZON">ZON</option>
                      <option value="BALAI">BALAI</option>
                      <option value="JENIS TERMINAL">TERMINAL</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: '11px',
                        color: theme.textSecondary,
                        fontWeight: '700',
                        display: 'block',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Susunan Graf:
                    </label>
                    <select
                      value={isStacked ? 'stacked' : 'grouped'}
                      onChange={(e) =>
                        setIsStacked(e.target.value === 'stacked')
                      }
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        fontSize: '12px',
                        backgroundColor: theme.inputBg,
                        color: theme.textPrimary,
                        outline: 'none',
                        height: '35px',
                      }}
                    >
                      <option value="stacked">Bertindan (Stacked)</option>
                      <option value="grouped">Bersebelahan (Grouped)</option>
                    </select>
                  </div>
                </div>

                {dynamicChartData.length > 0 &&
                selectedChartTypes.length > 0 ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        selectedChartTypes.length > 1
                          ? 'repeat(auto-fit, minmax(480px, 1fr))'
                          : '1fr',
                      gap: '20px',
                    }}
                  >
                    {selectedChartTypes.map((cType) => {
                      const chartObj = CHART_TYPE_OPTIONS.find(
                        (o) => o.value === cType
                      );
                      return (
                        <div
                          key={cType}
                          style={{
                            backgroundColor: isDarkMode
                              ? 'rgba(15, 23, 42, 0.4)'
                              : 'rgba(255, 255, 255, 0.5)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: `1px solid ${theme.border}`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: '800',
                              color: theme.textPrimary,
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>{chartObj?.label || cType}</span>
                            <span
                              style={{
                                fontSize: '10px',
                                color: theme.textMuted,
                                fontWeight: '600',
                              }}
                            >
                              Label Nombor: {showBarLabels ? 'Aktif' : 'Tutup'}
                            </span>
                          </div>
                          <ResponsiveContainer
                            width="100%"
                            height={
                              selectedChartTypes.length > 1
                                ? 320
                                : isZoomed
                                ? 600
                                : 420
                            }
                          >
                            {renderSingleChart(cType)}
                          </ResponsiveContainer>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '50px',
                      color: theme.textMuted,
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    {selectedChartTypes.length === 0
                      ? 'Sila pilih sekurang-kurangnya satu jenis graf daripada dropdown pelbagai pilihan.'
                      : 'Sila pilih bulan atau tapisan di atas untuk melihat carta.'}
                  </div>
                )}
              </div>

              {}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '16px',
                }}
              >
                <PieChartCard
                  title={`Carta Status (${getBulanLabel()})`}
                  data={statusDistribution}
                  colorMap={STATUS_COLORS}
                  isDarkMode={isDarkMode}
                  innerRadius={0}
                />
                <PieChartCard
                  title="Carta Taburan Mengikut ZON"
                  data={zonDistribution}
                  isDarkMode={isDarkMode}
                  innerRadius={45}
                />
                <PieChartCard
                  title="Top 10 BALAI"
                  data={balaiDistribution}
                  isDarkMode={isDarkMode}
                  innerRadius={0}
                />
                <PieChartCard
                  title="Jenis Terminal"
                  data={terminalDistribution}
                  isDarkMode={isDarkMode}
                  innerRadius={40}
                />
              </div>
            </>
          ) : (
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: '18px',
                padding: '20px',
                boxShadow: isDarkMode
                  ? '0 8px 32px rgba(0,0,0,0.35)'
                  : '0 8px 32px rgba(31, 38, 135, 0.07)',
                border: `1px solid ${theme.border}`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '10px',
                  alignItems: 'center',
                }}
              >
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: '800',
                    color: theme.textPrimary,
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: 0,
                  }}
                >
                  <Table2
                    style={{ width: '16px', height: '16px', color: '#1976d2' }}
                  />
                  Data Peranti Terminal —{' '}
                  <span style={{ color: '#1976d2' }}>
                    {filteredData.length} rekod
                  </span>
                </h3>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(+e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary,
                    outline: 'none',
                  }}
                >
                  {[10, 25, 50, 100, 200, 300].map((v) => (
                    <option key={v} value={v}>
                      {v} baris se-halaman
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  overflowX: 'auto',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: theme.tableHeaderBg,
                        borderBottom: `2px solid ${theme.border}`,
                      }}
                    >
                      {(() => {
                        const baseHeaders = [
                          '#',
                          'NO. SIRI',
                          'TERMINAL',
                          'ISSI',
                          'SUBSCRIBER',
                          'ZON',
                          'BALAI',
                          'T.JAWAB',
                        ];
                        const monthlyHeaders = [];

                        if (filterBulanDipilih.length > 0) {
                          selectedMonthColumns.forEach((mc) => {
                            monthlyHeaders.push(`STATUS ${mc.label}`);
                            monthlyHeaders.push(`TARIKH UJIAN ${mc.label}`);
                            monthlyHeaders.push(`TT DIBUKA ${mc.label}`);
                          });
                        } else {
                          monthlyHeaders.push('STATUS');
                          monthlyHeaders.push('TARIKH UJIAN');
                          monthlyHeaders.push('TT YANG DIBUKA');
                        }
                        return [...baseHeaders, ...monthlyHeaders, 'REG NO.'];
                      })().map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 12px',
                            textAlign: 'left',
                            fontWeight: '800',
                            color: theme.textSecondary,
                            whiteSpace: 'nowrap',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={15}
                          style={{
                            padding: '32px',
                            textAlign: 'center',
                            color: theme.textMuted,
                            fontSize: '13px',
                          }}
                        >
                          Tiada rekod dijumpai mengikut tapisan semasa.
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((d, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: `1px solid ${theme.border}`,
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              theme.tableRowHover)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'transparent')
                          }
                        >
                          <td
                            style={{
                              padding: '8px 12px',
                              color: theme.textMuted,
                              fontFamily: 'monospace',
                              fontSize: '11px',
                            }}
                          >
                            {(currentPage - 1) * rowsPerPage + i + 1}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: theme.textPrimary,
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              fontWeight: '700',
                            }}
                          >
                            {d['NO. SIRI'] || '—'}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: theme.textSecondary,
                              fontSize: '11px',
                              fontWeight: '500',
                            }}
                          >
                            {d['JENIS TERMINAL'] || '—'}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: theme.textSecondary,
                              fontFamily: 'monospace',
                              fontSize: '11px',
                            }}
                          >
                            {d['NO. ISSI TETRA'] || '—'}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: theme.textSecondary,
                              fontSize: '11px',
                            }}
                          >
                            {d['SUBSCRIBER'] || '—'}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: theme.textSecondary,
                              fontWeight: '600',
                              fontSize: '11px',
                            }}
                          >
                            {d['ZON'] || '—'}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: theme.textSecondary,
                              fontSize: '11px',
                            }}
                          >
                            {d['BALAI'] || '—'}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: theme.textSecondary,
                              fontSize: '11px',
                            }}
                          >
                            {d['TANGGUNGJAWAB PENGUJIAN'] || '—'}
                          </td>

                          {filterBulanDipilih.length > 0 ? (
                            selectedMonthColumns.map((mc) => {
                              const ttVal =
                                mc.tt && d[mc.tt] ? d[mc.tt].trim() : '';
                              return (
                                <React.Fragment key={mc.label}>
                                  <td style={{ padding: '8px 12px' }}>
                                    <StatusBadge
                                      status={
                                        mc.status && d[mc.status]
                                          ? normalizeStatus(d[mc.status])
                                          : 'TIADA DATA'
                                      }
                                      isDarkMode={isDarkMode}
                                    />
                                  </td>
                                  <td
                                    style={{
                                      padding: '8px 12px',
                                      color: theme.textSecondary,
                                      fontSize: '11px',
                                      fontWeight: '500',
                                    }}
                                  >
                                    {mc.tarikh && d[mc.tarikh]
                                      ? d[mc.tarikh]
                                      : '—'}
                                  </td>
                                  <td
                                    style={{
                                      padding: '8px 12px',
                                      fontFamily: 'monospace',
                                      fontSize: '11px',
                                      fontWeight:
                                        ttVal &&
                                        ttVal !== 'TIADA' &&
                                        ttVal !== '-'
                                          ? '700'
                                          : 'normal',
                                      color:
                                        ttVal &&
                                        ttVal !== 'TIADA' &&
                                        ttVal !== '-'
                                          ? isDarkMode
                                            ? '#ce93d8'
                                            : '#6a1b9a'
                                          : theme.textSecondary,
                                    }}
                                  >
                                    {ttVal || '—'}
                                  </td>
                                </React.Fragment>
                              );
                            })
                          ) : (
                            <>
                              <td style={{ padding: '8px 12px' }}>
                                <StatusBadge
                                  status={
                                    activeStatusCol && d[activeStatusCol]
                                      ? normalizeStatus(d[activeStatusCol])
                                      : 'TIADA DATA'
                                  }
                                  isDarkMode={isDarkMode}
                                />
                              </td>
                              <td
                                style={{
                                  padding: '8px 12px',
                                  color: theme.textSecondary,
                                  fontSize: '11px',
                                  fontWeight: '500',
                                }}
                              >
                                {activeTarikhUjianCol && d[activeTarikhUjianCol]
                                  ? d[activeTarikhUjianCol]
                                  : '—'}
                              </td>
                              <td
                                style={{
                                  padding: '8px 12px',
                                  fontFamily: 'monospace',
                                  fontSize: '11px',
                                  fontWeight:
                                    activeTTCol &&
                                    d[activeTTCol] &&
                                    d[activeTTCol].trim() !== 'TIADA' &&
                                    d[activeTTCol].trim() !== '-'
                                      ? '700'
                                      : 'normal',
                                  color:
                                    activeTTCol &&
                                    d[activeTTCol] &&
                                    d[activeTTCol].trim() !== 'TIADA' &&
                                    d[activeTTCol].trim() !== '-'
                                      ? isDarkMode
                                        ? '#ce93d8'
                                        : '#6a1b9a'
                                      : theme.textSecondary,
                                }}
                              >
                                {activeTTCol && d[activeTTCol]
                                  ? d[activeTTCol]
                                  : '—'}
                              </td>
                            </>
                          )}
                          <td
                            style={{
                              padding: '8px 12px',
                              color: theme.textSecondary,
                              fontFamily: 'monospace',
                              fontSize: '11px',
                            }}
                          >
                            {d['VEHICLE REG NO.'] || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: theme.textSecondary,
                    fontWeight: '600',
                  }}
                >
                  Menunjukkan {(currentPage - 1) * rowsPerPage + 1} hingga{' '}
                  {Math.min(currentPage * rowsPerPage, filteredData.length)}{' '}
                  daripada {filteredData.length} rekod
                </span>
                <div
                  style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                >
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: theme.cardBg,
                      color: theme.textPrimary,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ChevronLeft style={{ width: '14px', height: '14px' }} />{' '}
                    Sebelumnya
                  </button>
                  <span
                    style={{
                      fontSize: '12px',
                      color: theme.textPrimary,
                      fontWeight: '700',
                      padding: '0 8px',
                    }}
                  >
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: theme.cardBg,
                      color: theme.textPrimary,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor:
                        currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Seterusnya{' '}
                    <ChevronRight style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {}
        <footer
          style={{
            marginTop: 'auto',
            padding: '24px 20px',
            backgroundColor: theme.headerBg,
            borderTop: `1px solid ${theme.border}`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {/* Subtle Background Watermark Text Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 'calc(1.8vw + 16px)',
              fontWeight: '900',
              color: isDarkMode
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(0, 0, 0, 0.035)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
              letterSpacing: '4px',
              textTransform: 'uppercase',
            }}
          >
            PGO JOHOR • GIRN JBPM
          </div>

          <div
            style={{
              maxWidth: '1800px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '8px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Flame
                style={{ width: '16px', height: '16px', color: '#1976d2' }}
              />
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: theme.textPrimary,
                  margin: 0,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                DATA ASET GIRN JABATAN BOMBA DAN PENYELAMAT MALAYSIA NEGERI
                JOHOR
              </p>
            </div>

            <p
              style={{
                fontSize: '12px',
                color: theme.textSecondary,
                margin: 0,
                fontWeight: '600',
                letterSpacing: '0.2px',
              }}
            >
              © 2026 PB MOHAMAD AIDIL PGO JOHOR | Hak Cipta Terpelihara
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: isDarkMode
                  ? 'rgba(25, 118, 210, 0.2)'
                  : 'rgba(25, 118, 210, 0.08)',
                border: `1px solid ${
                  isDarkMode
                    ? 'rgba(25, 118, 210, 0.4)'
                    : 'rgba(25, 118, 210, 0.25)'
                }`,
                marginTop: '2px',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  color: '#1976d2',
                  margin: 0,
                  fontWeight: '800',
                  letterSpacing: '0.0px',
                  textTransform: 'uppercase',
                }}
              >
                {/*PEMBANGUN APLIKASI: PB MOHAMAD AIDIL*/}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

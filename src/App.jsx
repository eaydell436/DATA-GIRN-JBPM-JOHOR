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
    const [unitMode, setUnitMode] = useState('count');
    const [cardType, setCardType] = useState('pie');

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

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
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
  const [selectedRowDetail, setSelectedRowDetail] = useState(null);

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
    const xKey = xAxisOption;
    const stackKey = stackOption;

    let xValues = [];
    if (xKey === 'bulan') {
      if (selectedMonthColumns.length === 0) {
        xValues = monthlyColumns.slice(0, 6).reverse().map((mc) => mc.label);
      } else {
        xValues = [...selectedMonthColumns].reverse().map((mc) => mc.label);
      }
    } else if (xKey === 'ZON') {
      xValues = uniqueValues.zon;
    } else if (xKey === 'JENIS TERMINAL') {
      xValues = uniqueValues.jenisTerminal;
    } else if (xKey === 'BALAI') {
      xValues = balaiDistribution.map((b) => b.name);
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
    } else if (stackKey === 'jenisTerminal') {
      stackValues = uniqueValues.jenisTerminal;
    } else if (stackKey === 'zon') {
      stackValues = uniqueValues.zon;
    } else {
      stackValues = [
        ...new Set(filteredData.map((d) => d[stackKey]?.trim()).filter(Boolean)),
      ].sort();
    }

    return xValues.map((xVal) => {
      const row = { name: xVal, total: 0 };
      stackValues.forEach((sVal) => {
        row[sVal] = 0;
      });

      if (xKey === 'bulan') {
        const mc = monthlyColumns.find((m) => m.label === xVal);
        if (mc && mc.status) {
          filteredData.forEach((d) => {
            const status = normalizeStatus(d[mc.status]);
            if (stackKey === 'status') {
              if (row[status] !== undefined) {
                row[status] = (row[status] || 0) + 1;
                row.total += 1;
              }
            } else {
              const groupVal =
                d[
                  stackKey === 'jenisTerminal' ? 'JENIS TERMINAL' : 'ZON'
                ]?.trim();
              if (groupVal && row[groupVal] !== undefined) {
                row[groupVal] = (row[groupVal] || 0) + 1;
                row.total += 1;
              }
            }
          });
        }
      } else {
        filteredData.forEach((d) => {
          const itemX = d[xKey]?.trim();
          if (itemX === xVal) {
            if (stackKey === 'status') {
              const status = normalizeStatus(d[activeStatusCol]);
              if (row[status] !== undefined) {
                row[status] = (row[status] || 0) + 1;
                row.total += 1;
              }
            } else {
              const groupVal =
                d[
                  stackKey === 'jenisTerminal' ? 'JENIS TERMINAL' : 'ZON'
                ]?.trim();
              if (groupVal && row[groupVal] !== undefined) {
                row[groupVal] = (row[groupVal] || 0) + 1;
                row.total += 1;
              }
            }
          }
        });
      }

      row.min = Math.max(0, row.total - Math.floor(row.total * 0.25));
      row.max = Math.floor(row.total * 1.15) + 3;
      row.avg = Math.round(row.total / (stackValues.length || 1));

      return row;
    });
  }, [
    xAxisOption,
    stackOption,
    selectedMonthColumns,
    monthlyColumns,
    filteredData,
    uniqueValues,
    balaiDistribution,
    activeStatusCol,
  ]);

  const ttList = useMemo(() => {
    return filteredData.filter((d) => {
      if (filterBulanDipilih.length > 0) {
        for (const mc of selectedMonthColumns) {
          if (
            mc.tt &&
            d[mc.tt] &&
            d[mc.tt].trim() !== '' &&
            d[mc.tt].trim() !== '-' &&
            d[mc.tt].trim() !== 'TIADA'
          )
            return true;
        }
        return false;
      }
      return (
        activeTTCol &&
        d[activeTTCol] &&
        d[activeTTCol].trim() !== '' &&
        d[activeTTCol].trim() !== '-' &&
        d[activeTTCol].trim() !== 'TIADA'
      );
    });
  }, [filteredData, filterBulanDipilih, selectedMonthColumns, activeTTCol]);

  const kpiStats = useMemo(() => {
    const total = filteredData.length;
    let baik = 0;
    let rosak = 0;
    let sapura = 0;
    let jabatan = 0;
    let pelupusan = 0;

    filteredData.forEach((d) => {
      const s = normalizeStatus(d[activeStatusCol]);
      if (s === 'BAIK') baik++;
      if (s === 'ROSAK' || s === 'TIDAK DAPAT DIUJI') rosak++;
      if (s === 'BER - TINDAKAN SAPURA') sapura++;
      if (s === 'BER - TINDAKAN JABATAN') jabatan++;
      if (s === 'BER - SELESAI PROSES PELUPUSAN') pelupusan++;
    });

    const readiness = total > 0 ? ((baik / total) * 100).toFixed(1) : 0;
    return {
      total,
      baik,
      rosak,
      sapura,
      jabatan,
      pelupusan,
      readiness,
      ttCount: ttList.length,
    };
  }, [filteredData, activeStatusCol, ttList]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const resetAllFilters = useCallback(() => {
    setFilterZon([]);
    setFilterBalai([]);
    setFilterJenisTerminal([]);
    setFilterStatusSemasa([]);
    setFilterTanggungjawab([]);
    setFilterFinding([]);
    setFilterBulanDipilih([]);
    setFilterTTDibukaSahaja(false);
    setSearchText('');
    setCurrentPage(1);
    showNotification('Semua penapis telah ditetapkan semula', 'info');
  }, [showNotification]);

  const exportCSVData = useCallback(() => {
    if (filteredData.length === 0) {
      showNotification('Tiada data untuk dieksport', 'error');
      return;
    }
    const csvStr = unparseCSV(filteredData);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `GIRN_JBPM_JOHOR_DATA_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Fail CSV berjaya dimuat turun', 'success');
  }, [filteredData, showNotification]);

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        backgroundImage: `linear-gradient(${
          isDarkMode
            ? 'rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.95)'
            : 'rgba(241, 245, 249, 0.88), rgba(226, 232, 240, 0.92)'
        }), url(${BG_IMAGE_URL})`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        color: theme.textPrimary,
        paddingBottom: '40px',
      }}
    >
      {/* Toast Notification Banner */}
      {toastNotice && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            backgroundColor:
              toastNotice.type === 'error'
                ? '#dc2626'
                : toastNotice.type === 'info'
                ? '#0284c7'
                : '#16a34a',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: '600',
            backdropFilter: 'blur(8px)',
          }}
        >
          {toastNotice.type === 'error' ? (
            <AlertCircle style={{ width: '16px', height: '16px' }} />
          ) : (
            <CheckCircle2 style={{ width: '16px', height: '16px' }} />
          )}
          {toastNotice.msg}
        </div>
      )}

      {/* Main Glass Header */}
      <header
        style={{
          backgroundColor: theme.headerBg,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${theme.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          padding: '12px 24px',
          boxShadow: isDarkMode
            ? '0 4px 20px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: '1600px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={LOGO_URL}
              alt="JBPM Logo"
              style={{
                width: '42px',
                height: '42px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  'https://placehold.co/42x42/cc0000/ffffff?text=JBPM';
              }}
            />
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <h1
                  style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    margin: 0,
                    letterSpacing: '-0.3px',
                    background:
                      'linear-gradient(90deg, #dc2626 0%, #ea580c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  GIRN - JBPM NEGERI JOHOR
                </h1>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                  }}
                >
                  LIVE SYSTEM
                </span>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: theme.textMuted,
                  margin: 0,
                  fontWeight: '500',
                }}
              >
                Sistem Pemantauan Status Radio Terminal GIRN Jabatan Bomba Dan
                Penyelamat
              </p>
            </div>
          </div>

          {/* Header Action Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                backgroundColor: isDarkMode
                  ? 'rgba(30, 41, 59, 0.8)'
                  : 'rgba(255, 255, 255, 0.9)',
                color: theme.textPrimary,
                fontSize: '12px',
                fontWeight: '600',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft style={{ width: '14px', height: '14px' }} />
              Kembali
            </a>

            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                backgroundColor: isDarkMode
                  ? 'rgba(30, 41, 59, 0.8)'
                  : 'rgba(255, 255, 255, 0.9)',
                color: theme.textPrimary,
                fontSize: '12px',
                fontWeight: '600',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw
                style={{
                  width: '14px',
                  height: '14px',
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                }}
              />
              Kemaskini
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                padding: '7px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                backgroundColor: isDarkMode
                  ? 'rgba(30, 41, 59, 0.8)'
                  : 'rgba(255, 255, 255, 0.9)',
                color: theme.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Tukar Tema Terang/Gelap"
            >
              {isDarkMode ? (
                <Sun style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
              ) : (
                <Moon style={{ width: '16px', height: '16px', color: '#6366f1' }} />
              )}
            </button>

            <button
              onClick={exportCSVData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#16a34a',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Download style={{ width: '14px', height: '14px' }} />
              Eksport CSV
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div
          style={{
            maxWidth: '1600px',
            margin: '12px auto 0 auto',
            display: 'flex',
            gap: '8px',
            borderTop: `1px solid ${theme.border}`,
            paddingTop: '10px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'dashboard', label: 'Dashboard Utama', icon: BarChart3 },
            { id: 'analytics', label: 'Analisis Terperinci', icon: TrendingUp },
            { id: 'table', label: 'Jadual Data', icon: Table2 },
            { id: 'tickets', label: 'Pengurusan Tiket TT', icon: Ticket },
            { id: 'report', label: 'Laporan & Cetak', icon: Printer },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive
                    ? '#dc2626'
                    : isDarkMode
                    ? 'rgba(30, 41, 59, 0.5)'
                    : 'rgba(241, 245, 249, 0.8)',
                  color: isActive ? '#ffffff' : theme.textSecondary,
                  fontSize: '12px',
                  fontWeight: isActive ? '700' : '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon style={{ width: '14px', height: '14px' }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1600px', margin: '20px auto', padding: '0 20px' }}>
        {}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {/* Card 1: Jumlah Radio */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              padding: '18px',
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: theme.textMuted,
                  textTransform: 'uppercase',
                }}
              >
                Jumlah Keseluruhan Radio
              </span>
              <h2
                style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  margin: '4px 0 0 0',
                  color: theme.textPrimary,
                }}
              >
                {kpiStats.total}
              </h2>
            </div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <Radio style={{ width: '22px', height: '22px' }} />
            </div>
          </div>

          {/* Card 2: Status Baik */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              padding: '18px',
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: theme.textMuted,
                  textTransform: 'uppercase',
                }}
              >
                Kesihatan Baik (BAIK)
              </span>
              <h2
                style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  margin: '4px 0 0 0',
                  color: '#16a34a',
                }}
              >
                {kpiStats.baik}
              </h2>
              <span style={{ fontSize: '11px', color: theme.textMuted }}>
                Ketersediaan: {kpiStats.readiness}%
              </span>
            </div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(22, 163, 74, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
              }}
            >
              <CheckCircle2 style={{ width: '22px', height: '22px' }} />
            </div>
          </div>

          {/* Card 3: Status Rosak */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              padding: '18px',
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: theme.textMuted,
                  textTransform: 'uppercase',
                }}
              >
                Rosak / Bermasalah
              </span>
              <h2
                style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  margin: '4px 0 0 0',
                  color: '#dc2626',
                }}
              >
                {kpiStats.rosak}
              </h2>
            </div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
              }}
            >
              <AlertCircle style={{ width: '22px', height: '22px' }} />
            </div>
          </div>

          {/* Card 4: Tiket TT Dibuka */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              padding: '18px',
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: theme.textMuted,
                  textTransform: 'uppercase',
                }}
              >
                Tiket TT Aktif
              </span>
              <h2
                style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  margin: '4px 0 0 0',
                  color: '#ea580c',
                }}
              >
                {kpiStats.ttCount}
              </h2>
            </div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(234, 88, 12, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ea580c',
              }}
            >
              <Ticket style={{ width: '22px', height: '22px' }} />
            </div>
          </div>
        </div>

        {}
        <div
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: '16px',
            padding: '16px',
            border: `1px solid ${theme.border}`,
            backdropFilter: 'blur(12px)',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: showFilters ? '14px' : '0',
            }}
          >
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                color: theme.textPrimary,
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <Filter style={{ width: '16px', height: '16px', color: '#dc2626' }} />
              Penapis Data Bersepadu
              {showFilters ? (
                <ChevronUp style={{ width: '16px', height: '16px' }} />
              ) : (
                <ChevronDown style={{ width: '16px', height: '16px' }} />
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={resetAllFilters}
                style={{
                  fontSize: '11px',
                  color: '#dc2626',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Reset Penapis
              </button>
            </div>
          </div>

          {showFilters && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: theme.textMuted,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  ZON
                </label>
                <MultiSelectDropdown
                  options={uniqueValues.zon}
                  selected={filterZon}
                  onChange={setFilterZon}
                  placeholder="Semua Zon"
                  searchPlaceholder="Cari Zon..."
                  isDarkMode={isDarkMode}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: theme.textMuted,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  BALAI BOMBA
                </label>
                <MultiSelectDropdown
                  options={uniqueValues.balai}
                  selected={filterBalai}
                  onChange={setFilterBalai}
                  placeholder="Semua Balai"
                  searchPlaceholder="Cari Balai..."
                  isDarkMode={isDarkMode}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: theme.textMuted,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  JENIS TERMINAL
                </label>
                <MultiSelectDropdown
                  options={uniqueValues.jenisTerminal}
                  selected={filterJenisTerminal}
                  onChange={setFilterJenisTerminal}
                  placeholder="Semua Jenis"
                  searchPlaceholder="Cari Jenis..."
                  isDarkMode={isDarkMode}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: theme.textMuted,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  STATUS SEMASA
                </label>
                <MultiSelectDropdown
                  options={allStatusOptions}
                  selected={filterStatusSemasa}
                  onChange={setFilterStatusSemasa}
                  placeholder="Semua Status"
                  searchPlaceholder="Cari Status..."
                  isDarkMode={isDarkMode}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: theme.textMuted,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  BULAN PENGUJIAN
                </label>
                <MultiSelectDropdown
                  options={monthOptions}
                  selected={filterBulanDipilih}
                  onChange={setFilterBulanDipilih}
                  placeholder="Semasa 2026"
                  searchPlaceholder="Cari Bulan..."
                  isDarkMode={isDarkMode}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: theme.textMuted,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  CARIAN BEBAS
                </label>
                <div style={{ position: 'relative' }}>
                  <Search
                    style={{
                      width: '14px',
                      height: '14px',
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: theme.textMuted,
                    }}
                  />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Siri / ISSI / TEI / TT..."
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 30px',
                      borderRadius: '8px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.inputBg,
                      color: theme.textPrimary,
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Chips */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginTop: showFilters ? '12px' : '0',
            }}
          >
            {filterZon.map((z) => (
              <FilterBadge
                key={z}
                label={`Zon: ${z}`}
                onRemove={() => setFilterZon(filterZon.filter((x) => x !== z))}
                isDarkMode={isDarkMode}
              />
            ))}
            {filterBalai.map((b) => (
              <FilterBadge
                key={b}
                label={`Balai: ${b}`}
                onRemove={() =>
                  setFilterBalai(filterBalai.filter((x) => x !== b))
                }
                isDarkMode={isDarkMode}
              />
            ))}
            {filterJenisTerminal.map((t) => (
              <FilterBadge
                key={t}
                label={`Terminal: ${t}`}
                onRemove={() =>
                  setFilterJenisTerminal(
                    filterJenisTerminal.filter((x) => x !== t)
                  )
                }
                isDarkMode={isDarkMode}
              />
            ))}
            {filterStatusSemasa.map((s) => (
              <FilterBadge
                key={s}
                label={`Status: ${s}`}
                onRemove={() =>
                  setFilterStatusSemasa(
                    filterStatusSemasa.filter((x) => x !== s)
                  )
                }
                type="amber"
                isDarkMode={isDarkMode}
              />
            ))}
            {filterBulanDipilih.map((m) => (
              <FilterBadge
                key={m}
                label={`Bulan: ${m}`}
                onRemove={() =>
                  setFilterBulanDipilih(
                    filterBulanDipilih.filter((x) => x !== m)
                  )
                }
                type="purple"
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>

        {}
        {activeTab === 'dashboard' && (
          <div>
            {/* Pie / Distribution Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <PieChartCard
                title="Agihan Status Semasa"
                data={statusDistribution}
                colorMap={STATUS_COLORS}
                isDarkMode={isDarkMode}
                innerRadius={45}
              />
              <PieChartCard
                title="Agihan Mengikut Zon"
                data={zonDistribution}
                isDarkMode={isDarkMode}
              />
              <PieChartCard
                title="Agihan Jenis Terminal"
                data={terminalDistribution}
                isDarkMode={isDarkMode}
                innerRadius={30}
              />
              <PieChartCard
                title="Top 10 Balai Mempunyai Asset"
                data={balaiDistribution}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Interactive Analytical Graphs Section */}
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: '16px',
                padding: '20px',
                border: `1px solid ${theme.border}`,
                backdropFilter: 'blur(12px)',
                marginBottom: '24px',
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
                <div>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      margin: 0,
                      color: theme.textPrimary,
                    }}
                  >
                    📈 Carta Visualisasi Prestasi Dan Aliran
                  </h3>
                  <p
                    style={{
                      fontSize: '11px',
                      color: theme.textMuted,
                      margin: '2px 0 0 0',
                    }}
                  >
                    Pilih paksi, pengelompokan dan jenis graf mengikut keperluan
                    analisis anda
                  </p>
                </div>

                {/* Chart Controls */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <select
                    value={xAxisOption}
                    onChange={(e) => setXAxisOption(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.inputBg,
                      color: theme.textPrimary,
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    <option value="bulan">Paksi X: Trend Bulan</option>
                    <option value="ZON">Paksi X: Zon</option>
                    <option value="JENIS TERMINAL">Paksi X: Jenis Terminal</option>
                    <option value="BALAI">Paksi X: Balai Bomba</option>
                  </select>

                  <select
                    value={stackOption}
                    onChange={(e) => setStackOption(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.inputBg,
                      color: theme.textPrimary,
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    <option value="status">Kumpulan: Status</option>
                    <option value="jenisTerminal">Kumpulan: Jenis Terminal</option>
                    <option value="zon">Kumpulan: Zon</option>
                  </select>

                  <select
                    value={selectedChartTypes[0]}
                    onChange={(e) => setSelectedChartTypes([e.target.value])}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.inputBg,
                      color: theme.textPrimary,
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    {CHART_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Recharts Rendering */}
              <div style={{ width: '100%', height: '360px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {selectedChartTypes[0] === 'line' ? (
                    <LineChart data={dynamicChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={
                          isDarkMode
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)'
                        }
                      />
                      <XAxis dataKey="name" stroke={theme.textMuted} fontSize={11} />
                      <YAxis stroke={theme.textMuted} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.cardBg,
                          borderRadius: '10px',
                          border: `1px solid ${theme.border}`,
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="BAIK"
                        stroke="#00C853"
                        strokeWidth={3}
                      />
                      <Line
                        type="monotone"
                        dataKey="ROSAK"
                        stroke="#FF1744"
                        strokeWidth={3}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  ) : selectedChartTypes[0] === 'area' ? (
                    <AreaChart data={dynamicChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={
                          isDarkMode
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)'
                        }
                      />
                      <XAxis dataKey="name" stroke={theme.textMuted} fontSize={11} />
                      <YAxis stroke={theme.textMuted} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.cardBg,
                          borderRadius: '10px',
                          border: `1px solid ${theme.border}`,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="BAIK"
                        stackId="1"
                        stroke="#00C853"
                        fill="#00C853"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="ROSAK"
                        stackId="1"
                        stroke="#FF1744"
                        fill="#FF1744"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  ) : selectedChartTypes[0] === 'candlestick' ? (
                    <ComposedChart data={dynamicChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={
                          isDarkMode
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)'
                        }
                      />
                      <XAxis dataKey="name" stroke={theme.textMuted} fontSize={11} />
                      <YAxis stroke={theme.textMuted} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Line type="monotone" dataKey="max" stroke="#ef4444" />
                      <Line type="monotone" dataKey="min" stroke="#22c55e" />
                    </ComposedChart>
                  ) : (
                    <BarChart data={dynamicChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={
                          isDarkMode
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)'
                        }
                      />
                      <XAxis dataKey="name" stroke={theme.textMuted} fontSize={11} />
                      <YAxis stroke={theme.textMuted} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.cardBg,
                          borderRadius: '10px',
                          border: `1px solid ${theme.border}`,
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="BAIK"
                        fill={STATUS_COLORS.BAIK}
                        stackId="a"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="ROSAK"
                        fill={STATUS_COLORS.ROSAK}
                        stackId="a"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="BER - TINDAKAN SAPURA"
                        fill={STATUS_COLORS['BER - TINDAKAN SAPURA']}
                        stackId="a"
                      />
                      <Bar
                        dataKey="BER - TINDAKAN JABATAN"
                        fill={STATUS_COLORS['BER - TINDAKAN JABATAN']}
                        stackId="a"
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {}
        {activeTab === 'analytics' && (
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '800',
                margin: '0 0 16px 0',
              }}
            >
              📊 Analisis Terperinci Mengikut Zon & Balai
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {uniqueValues.zon.map((zon) => {
                const zonData = filteredData.filter(
                  (d) => d['ZON']?.trim() === zon
                );
                const totalZon = zonData.length;
                const baikZon = zonData.filter(
                  (d) => normalizeStatus(d[activeStatusCol]) === 'BAIK'
                ).length;
                const rosakZon = zonData.filter(
                  (d) => normalizeStatus(d[activeStatusCol]) === 'ROSAK'
                ).length;
                const pct =
                  totalZon > 0 ? ((baikZon / totalZon) * 100).toFixed(1) : 0;

                return (
                  <div
                    key={zon}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: isDarkMode
                        ? 'rgba(15, 23, 42, 0.6)'
                        : 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          fontWeight: '800',
                        }}
                      >
                        📍 {zon}
                      </h4>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#16a34a',
                        }}
                      >
                        {pct}% Baik
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: '#16a34a',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: theme.textMuted,
                      }}
                    >
                      <span>Jumlah: {totalZon}</span>
                      <span>Baik: {baikZon}</span>
                      <span style={{ color: '#dc2626' }}>Rosak: {rosakZon}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {}
        {activeTab === 'table' && (
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
                📋 Jadual Data Radio Terminal GIRN ({filteredData.length} Rekod)
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: theme.textMuted }}>
                  Baris Per Halaman:
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary,
                    fontSize: '12px',
                  }}
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Responsive Table */}
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: theme.tableHeaderBg,
                      borderBottom: `2px solid ${theme.border}`,
                      color: theme.textPrimary,
                    }}
                  >
                    <th style={{ padding: '10px' }}>Bil</th>
                    <th style={{ padding: '10px' }}>No. Siri</th>
                    <th style={{ padding: '10px' }}>ISSI</th>
                    <th style={{ padding: '10px' }}>Zon</th>
                    <th style={{ padding: '10px' }}>Balai</th>
                    <th style={{ padding: '10px' }}>Jenis Terminal</th>
                    <th style={{ padding: '10px' }}>Status Semasa</th>
                    <th style={{ padding: '10px' }}>No. Tiket TT</th>
                    <th style={{ padding: '10px' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          textAlign: 'center',
                          padding: '30px',
                          color: theme.textMuted,
                        }}
                      >
                        Tiada data dijumpai padanan penapis.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row, idx) => {
                      const status = normalizeStatus(row[activeStatusCol]);
                      const ttVal = activeTTCol ? row[activeTTCol] : '-';
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedRowDetail(row)}
                          style={{
                            borderBottom: `1px solid ${theme.border}`,
                            cursor: 'pointer',
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
                          <td style={{ padding: '10px' }}>
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </td>
                          <td
                            style={{
                              padding: '10px',
                              fontWeight: '700',
                              color: '#3b82f6',
                            }}
                          >
                            {row['NO. SIRI'] || '-'}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {row['NO. ISSI TETRA'] || '-'}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {row['ZON'] || '-'}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {row['BALAI'] || '-'}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {row['JENIS TERMINAL'] || '-'}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <StatusBadge
                              status={status}
                              isDarkMode={isDarkMode}
                            />
                          </td>
                          <td style={{ padding: '10px', fontWeight: '600' }}>
                            {ttVal && ttVal !== '-' ? (
                              <span
                                style={{
                                  backgroundColor: 'rgba(234, 88, 12, 0.15)',
                                  color: '#ea580c',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                }}
                              >
                                {ttVal}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <button
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                cursor: 'pointer',
                              }}
                            >
                              Butiran
                            </button>
                          </td>
                        </tr>
                      );
                    })
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
              }}
            >
              <span style={{ fontSize: '12px', color: theme.textMuted }}>
                Halaman {currentPage} daripada {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronLeft style={{ width: '14px', height: '14px' }} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary,
                    cursor:
                      currentPage === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronRight style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {}
        {activeTab === 'tickets' && (
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '800',
                margin: '0 0 16px 0',
              }}
            >
              🎫 Pengurusan & Pemantauan Tiket TT Aktif ({ttList.length})
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
              }}
            >
              {ttList.map((row, idx) => {
                const ttNum = activeTTCol ? row[activeTTCol] : 'N/A';
                const status = normalizeStatus(row[activeStatusCol]);
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: isDarkMode
                        ? 'rgba(15, 23, 42, 0.8)'
                        : 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: '800',
                          fontSize: '14px',
                          color: '#ea580c',
                        }}
                      >
                        Tiket #: {ttNum}
                      </span>
                      <StatusBadge status={status} isDarkMode={isDarkMode} />
                    </div>

                    <div
                      style={{
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        color: theme.textSecondary,
                      }}
                    >
                      <div>
                        <strong>No. Siri:</strong> {row['NO. SIRI'] || '-'}
                      </div>
                      <div>
                        <strong>Balai:</strong> {row['BALAI'] || '-'} (
                        {row['ZON'] || '-'})
                      </div>
                      <div>
                        <strong>Jenis:</strong> {row['JENIS TERMINAL'] || '-'}
                      </div>
                      <div>
                        <strong>Tanggungjawab:</strong>{' '}
                        {row['TANGGUNGJAWAB PENGUJIAN'] || '-'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {}
        {activeTab === 'report' && (
          <div
            style={{
              backgroundColor: '#fff',
              color: '#000',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #000',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
                  LAPORAN EKSEKUTIF KETERSEDIAAN RADIO TERMINAL GIRN
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                  JABATAN BOMBA DAN PENYELAMAT MALAYSIA NEGERI JOHOR
                </p>
              </div>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Printer style={{ width: '16px', height: '16px' }} />
                Cetak Laporan
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  border: '1px solid #ccc',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700' }}>
                  JUMLAH ASSET
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800' }}>
                  {kpiStats.total}
                </div>
              </div>
              <div
                style={{
                  border: '1px solid #ccc',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700' }}>
                  JUMLAH BAIK
                </div>
                <div
                  style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a' }}
                >
                  {kpiStats.baik} ({kpiStats.readiness}%)
                </div>
              </div>
              <div
                style={{
                  border: '1px solid #ccc',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700' }}>
                  JUMLAH ROSAK
                </div>
                <div
                  style={{ fontSize: '22px', fontWeight: '800', color: '#dc2626' }}
                >
                  {kpiStats.rosak}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
              Laporan ini memaparkan status ketersediaan peralatan sistem komunikasi
              GIRN Negeri Johor mengikut rekod ujian berkala semasa.
            </p>
          </div>
        )}
      </main>

      {}
      {selectedRowDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setSelectedRowDetail(null)}
        >
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
                📻 Butiran Radio Terminal
              </h3>
              <X
                style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                onClick={() => setSelectedRowDetail(null)}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '13px',
              }}
            >
              <div>
                <strong>No. Siri:</strong> {selectedRowDetail['NO. SIRI']}
              </div>
              <div>
                <strong>ISSI:</strong> {selectedRowDetail['NO. ISSI TETRA']}
              </div>
              <div>
                <strong>Zon:</strong> {selectedRowDetail['ZON']}
              </div>
              <div>
                <strong>Balai:</strong> {selectedRowDetail['BALAI']}
              </div>
              <div>
                <strong>Jenis:</strong> {selectedRowDetail['JENIS TERMINAL']}
              </div>
              <div>
                <strong>TEI:</strong> {selectedRowDetail['NO. TEI']}
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedRowDetail(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
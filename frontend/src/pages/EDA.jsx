import { useMemo, useState } from 'react';

import {
  Activity,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Database,
  Eye,
  Hash,
  Info,
  Layers3,
  LineChart,
  PieChart,
  RefreshCw,
  ScatterChart,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Type,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  ScatterChart as ReScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

import { useApp } from '../context/AppContext';

import {
  Page,
  Card,
  Section,
  Badge,
  Empty,
  Spinner,
} from '../components/UI';

/* =========================================================
   CONSTANTS
========================================================= */

const CHART_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#84cc16',
];

const MAX_CATEGORY_BARS = 15;
const MAX_SCATTER_POINTS = 1200;
const MAX_AUTO_CHARTS = 6;

/* =========================================================
   BASIC HELPERS
========================================================= */

function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  );
}

function cleanNumber(value) {
  if (isEmpty(value)) return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function isNumber(value) {
  return cleanNumber(value) !== null;
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(Number(value))) return '—';

  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

function getRows(dataset) {
  if (!dataset) return [];

  const candidates = [
    dataset.rows,
    dataset.data,
    dataset.records,
    dataset.preview,
    dataset.sample_rows,
    dataset.table,
    dataset.raw_data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate.filter(
        (row) =>
          row &&
          typeof row === 'object' &&
          !Array.isArray(row)
      );
    }
  }

  return [];
}

function getColumns(rows) {
  const set = new Set();

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => set.add(key));
  });

  return [...set];
}

/* =========================================================
   COLUMN ANALYSIS
========================================================= */

function getColumnValues(rows, column) {
  return rows
    .map((row) => row[column])
    .filter((value) => !isEmpty(value));
}

function detectColumnTypes(rows, columns) {
  const result = {};

  columns.forEach((column) => {
    const values = getColumnValues(rows, column);

    if (!values.length) {
      result[column] = 'empty';
      return;
    }

    const numericCount = values.filter(isNumber).length;

    const uniqueCount = new Set(
      values.map((value) => String(value))
    ).size;

    const uniqueRatio =
      uniqueCount / Math.max(values.length, 1);

    if (numericCount / values.length >= 0.8) {
      result[column] = 'numeric';
    } else if (uniqueRatio > 0.8 && values.length > 20) {
      result[column] = 'text';
    } else {
      result[column] = 'categorical';
    }
  });

  return result;
}

function getColumnStats(rows, column, type) {
  const values = getColumnValues(rows, column);

  const missing = rows.length - values.length;

  const unique = new Set(
    values.map((value) => String(value))
  ).size;

  if (type !== 'numeric') {
    return {
      count: values.length,
      missing,
      unique,
      min: null,
      max: null,
      mean: null,
      median: null,
    };
  }

  const numbers = values
    .map(cleanNumber)
    .filter((value) => value !== null)
    .sort((a, b) => a - b);

  if (!numbers.length) {
    return {
      count: values.length,
      missing,
      unique,
      min: null,
      max: null,
      mean: null,
      median: null,
    };
  }

  const sum = numbers.reduce(
    (total, value) => total + value,
    0
  );

  const middle = Math.floor(numbers.length / 2);

  const median =
    numbers.length % 2 === 0
      ? (numbers[middle - 1] + numbers[middle]) / 2
      : numbers[middle];

  return {
    count: values.length,
    missing,
    unique,
    min: numbers[0],
    max: numbers[numbers.length - 1],
    mean: sum / numbers.length,
    median,
  };
}

/* =========================================================
   AGGREGATION
========================================================= */

function aggregateCategorical(
  rows,
  xColumn,
  yColumn = null
) {
  const groups = new Map();

  rows.forEach((row) => {
    const rawCategory = row[xColumn];

    if (isEmpty(rawCategory)) return;

    const category = String(rawCategory);

    if (!groups.has(category)) {
      groups.set(category, {
        category,
        count: 0,
        sum: 0,
        numericCount: 0,
      });
    }

    const item = groups.get(category);

    item.count += 1;

    if (yColumn) {
      const value = cleanNumber(row[yColumn]);

      if (value !== null) {
        item.sum += value;
        item.numericCount += 1;
      }
    }
  });

  return [...groups.values()]
    .map((item) => ({
      category: item.category,
      count: item.count,
      value: yColumn
        ? item.numericCount
          ? Number(
              (
                item.sum / item.numericCount
              ).toFixed(2)
            )
          : 0
        : item.count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_CATEGORY_BARS);
}

/* =========================================================
   HISTOGRAM
========================================================= */

function makeHistogram(rows, column) {
  const values = rows
    .map((row) => cleanNumber(row[column]))
    .filter((value) => value !== null);

  if (!values.length) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [
      {
        range: String(formatNumber(min)),
        count: values.length,
      },
    ];
  }

  const bins = 10;
  const width = (max - min) / bins;

  const result = Array.from(
    { length: bins },
    (_, index) => {
      const start = min + index * width;
      const end = start + width;

      return {
        range: `${formatNumber(
          start,
          1
        )}–${formatNumber(end, 1)}`,
        start,
        end,
        count: 0,
      };
    }
  );

  values.forEach((value) => {
    let index = Math.floor(
      (value - min) / width
    );

    if (index < 0) index = 0;
    if (index >= bins) index = bins - 1;

    result[index].count += 1;
  });

  return result;
}

/* =========================================================
   SCATTER
========================================================= */

function makeScatter(
  rows,
  xColumn,
  yColumn
) {
  return rows
    .map((row) => ({
      x: cleanNumber(row[xColumn]),
      y: cleanNumber(row[yColumn]),
    }))
    .filter(
      (row) =>
        row.x !== null &&
        row.y !== null
    )
    .slice(0, MAX_SCATTER_POINTS);
}

/* =========================================================
   CORRELATION
========================================================= */

function calculateCorrelation(
  rows,
  xColumn,
  yColumn
) {
  const pairs = rows
    .map((row) => ({
      x: cleanNumber(row[xColumn]),
      y: cleanNumber(row[yColumn]),
    }))
    .filter(
      (item) =>
        item.x !== null &&
        item.y !== null
    );

  if (pairs.length < 3) return null;

  const xMean =
    pairs.reduce(
      (sum, item) => sum + item.x,
      0
    ) / pairs.length;

  const yMean =
    pairs.reduce(
      (sum, item) => sum + item.y,
      0
    ) / pairs.length;

  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  pairs.forEach(({ x, y }) => {
    const xDiff = x - xMean;
    const yDiff = y - yMean;

    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  });

  const denominator =
    Math.sqrt(
      xDenominator * yDenominator
    );

  if (!denominator) return null;

  return numerator / denominator;
}

/* =========================================================
   CORRELATION LABEL
========================================================= */

function correlationLabel(value) {
  if (value === null) {
    return 'Not enough numeric data';
  }

  const absolute = Math.abs(value);

  if (absolute >= 0.8) {
    return value > 0
      ? 'Strong positive relationship'
      : 'Strong negative relationship';
  }

  if (absolute >= 0.5) {
    return value > 0
      ? 'Moderate positive relationship'
      : 'Moderate negative relationship';
  }

  if (absolute >= 0.3) {
    return value > 0
      ? 'Weak positive relationship'
      : 'Weak negative relationship';
  }

  return 'Very weak or no linear relationship';
}

/* =========================================================
   TOOLTIP
========================================================= */

function ChartTooltip({
  active,
  payload,
  label,
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      {label !== undefined && (
        <div className="text-xs text-slate-400 mb-2">
          {label}
        </div>
      )}

      {payload.map((item, index) => (
        <div
          key={`${item.dataKey}-${index}`}
          className="flex items-center justify-between gap-8 text-sm"
        >
          <span className="text-slate-300">
            {item.name || item.dataKey}
          </span>

          <span className="font-bold text-white">
            {typeof item.value === 'number'
              ? formatNumber(item.value)
              : String(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   CHART CARD
========================================================= */

function ChartCard({
  title,
  description,
  icon,
  children,
  height = 380,
  footer,
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-400/10 flex items-center justify-center text-indigo-300">
            {icon}
          </div>

          <div className="min-w-0">
            <h3 className="font-bold truncate">
              {title}
            </h3>

            <p className="text-xs text-slate-500 mt-1 leading-5">
              {description}
            </p>
          </div>
        </div>

        <Badge variant="primary">
          EDA
        </Badge>
      </div>

      <div
        style={{
          width: '100%',
          height,
        }}
      >
        {children}
      </div>

      {footer && (
        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-slate-500 leading-5">
          {footer}
        </div>
      )}
    </Card>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  description,
  variant = 'primary',
}) {
  const iconClasses = {
    primary:
      'bg-indigo-500/10 text-indigo-300 border-indigo-400/10',
    success:
      'bg-emerald-500/10 text-emerald-300 border-emerald-400/10',
    warning:
      'bg-amber-500/10 text-amber-300 border-amber-400/10',
    cyan:
      'bg-cyan-500/10 text-cyan-300 border-cyan-400/10',
  };

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
            iconClasses[variant]
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-xs text-slate-500">
            {label}
          </div>

          <div className="text-xl font-black mt-1 truncate">
            {value}
          </div>

          {description && (
            <div className="text-[11px] text-slate-600 mt-1">
              {description}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* =========================================================
   INSIGHT CARD
========================================================= */

function InsightCard({
  icon,
  title,
  text,
  variant = 'primary',
}) {
  const variants = {
    primary:
      'border-indigo-400/10 bg-indigo-500/5',
    success:
      'border-emerald-400/10 bg-emerald-500/5',
    warning:
      'border-amber-400/10 bg-amber-500/5',
    danger:
      'border-red-400/10 bg-red-500/5',
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${variants[variant]}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {icon}
        </div>

        <div>
          <div className="font-semibold text-sm">
            {title}
          </div>

          <p className="text-xs text-slate-400 leading-5 mt-1">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   AUTO CHART
========================================================= */

function AutoChart({
  rows,
  column,
  type,
}) {
  if (type === 'numeric') {
    const data = makeHistogram(
      rows,
      column
    );

    return (
      <ChartCard
        title={`${column} Distribution`}
        description={`How ${column} values are distributed across the dataset.`}
        icon={<BarChart3 size={18} />}
        footer="Histogram buckets group numerical observations into ranges so you can quickly identify concentration and spread."
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,.06)"
            />

            <XAxis
              dataKey="range"
              tick={{
                fill: '#94a3b8',
                fontSize: 10,
              }}
              angle={-25}
              textAnchor="end"
              height={65}
            />

            <YAxis
              tick={{
                fill: '#94a3b8',
                fontSize: 11,
              }}
            />

            <Tooltip
              content={<ChartTooltip />}
            />

            <Bar
              dataKey="count"
              name="Observations"
              fill="#6366f1"
              radius={[
                6,
                6,
                0,
                0,
              ]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  const data = aggregateCategorical(
    rows,
    column
  );

  return (
    <ChartCard
      title={`${column} Frequency`}
      description={`Most frequent values found in ${column}.`}
      icon={<PieChart size={18} />}
      footer="Only the most frequent categories are shown to keep the visualization readable."
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            left: 20,
            right: 20,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,.06)"
          />

          <XAxis
            type="number"
            tick={{
              fill: '#94a3b8',
              fontSize: 11,
            }}
          />

          <YAxis
            type="category"
            dataKey="category"
            width={110}
            tick={{
              fill: '#94a3b8',
              fontSize: 10,
            }}
          />

          <Tooltip
            content={<ChartTooltip />}
          />

          <Bar
            dataKey="value"
            name="Count"
            fill="#8b5cf6"
            radius={[
              0,
              6,
              6,
              0,
            ]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function EDA() {
  const {
    dataset,
    busy,
  } = useApp();

  const rows = useMemo(
    () => getRows(dataset),
    [dataset]
  );

  const columns = useMemo(
    () => getColumns(rows),
    [rows]
  );

  const columnTypes = useMemo(
    () =>
      detectColumnTypes(
        rows,
        columns
      ),
    [rows, columns]
  );

  const numericColumns = useMemo(
    () =>
      columns.filter(
        (column) =>
          columnTypes[column] ===
          'numeric'
      ),
    [columns, columnTypes]
  );

  const categoricalColumns =
    useMemo(
      () =>
        columns.filter(
          (column) =>
            columnTypes[column] ===
            'categorical'
        ),
      [columns, columnTypes]
    );

  const textColumns = useMemo(
    () =>
      columns.filter(
        (column) =>
          columnTypes[column] ===
          'text'
      ),
    [columns, columnTypes]
  );

  const stats = useMemo(() => {
    return columns.reduce(
      (result, column) => {
        result[column] =
          getColumnStats(
            rows,
            column,
            columnTypes[column]
          );

        return result;
      },
      {}
    );
  }, [rows, columns, columnTypes]);

  const [chartType, setChartType] =
    useState('bar');

  const [xColumn, setXColumn] =
    useState('');

  const [yColumn, setYColumn] =
    useState('');

  const [generated, setGenerated] =
    useState(null);

  const [showAllColumns, setShowAllColumns] =
    useState(false);

  const [activeExplorer, setActiveExplorer] =
    useState('overview');

  /* =======================================================
     DEFAULT COLUMNS
  ======================================================= */

  const defaultX =
    xColumn ||
    categoricalColumns[0] ||
    numericColumns[0] ||
    '';

  const defaultY =
    yColumn ||
    numericColumns[0] ||
    '';

  /* =======================================================
     DATASET METRICS
  ======================================================= */

  const totalCells =
    rows.length * columns.length;

  const missingCells = columns.reduce(
    (total, column) =>
      total + (stats[column]?.missing || 0),
    0
  );

  const completeness =
    totalCells > 0
      ? ((totalCells -
          missingCells) /
          totalCells) *
        100
      : 0;

  const duplicateCount =
    rows.length -
    new Set(
      rows.map((row) =>
        JSON.stringify(row)
      )
    ).size;

  /* =======================================================
     AI-STYLE INSIGHTS
  ======================================================= */

  const insights = useMemo(() => {
    const result = [];

    if (missingCells > 0) {
      result.push({
        title: 'Missing values detected',
        text: `${missingCells.toLocaleString()} cells are missing. Review these columns before using the dataset for modelling.`,
        variant: 'warning',
        icon: (
          <Info
            size={17}
            className="text-amber-300"
          />
        ),
      });
    } else {
      result.push({
        title: 'Complete dataset',
        text: 'No missing cells were detected in the available rows.',
        variant: 'success',
        icon: (
          <CheckCircle2
            size={17}
            className="text-emerald-300"
          />
        ),
      });
    }

    if (duplicateCount > 0) {
      result.push({
        title: 'Duplicate rows found',
        text: `${duplicateCount.toLocaleString()} duplicate row${duplicateCount === 1 ? '' : 's'} detected.`,
        variant: 'warning',
        icon: (
          <Layers3
            size={17}
            className="text-amber-300"
          />
        ),
      });
    } else {
      result.push({
        title: 'No exact duplicate rows',
        text: 'No completely identical rows were detected in the available dataset.',
        variant: 'success',
        icon: (
          <CheckCircle2
            size={17}
            className="text-emerald-300"
          />
        ),
      });
    }

    if (numericColumns.length >= 2) {
      const pairs = [];

      for (
        let i = 0;
        i < numericColumns.length;
        i += 1
      ) {
        for (
          let j = i + 1;
          j < numericColumns.length;
          j += 1
        ) {
          const x =
            numericColumns[i];

          const y =
            numericColumns[j];

          const correlation =
            calculateCorrelation(
              rows,
              x,
              y
            );

          if (
            correlation !== null
          ) {
            pairs.push({
              x,
              y,
              correlation,
              absolute:
                Math.abs(correlation),
            });
          }
        }
      }

      pairs.sort(
        (a, b) =>
          b.absolute -
          a.absolute
      );

      if (pairs[0]) {
        const strongest =
          pairs[0];

        result.push({
          title:
            'Strongest numerical relationship',
          text: `${strongest.x} and ${strongest.y} show a ${correlationLabel(strongest.correlation).toLowerCase()} (r = ${strongest.correlation.toFixed(2)}). Correlation does not by itself establish causation.`,
          variant: 'primary',
          icon: (
            <Activity
              size={17}
              className="text-indigo-300"
            />
          ),
        });
      }
    }

    if (
      numericColumns.length >
      categoricalColumns.length
    ) {
      result.push({
        title:
          'Numerical-heavy dataset',
        text: `The dataset contains ${numericColumns.length} numerical columns, making it suitable for distribution analysis, correlations and predictive modelling.`,
        variant: 'primary',
        icon: (
          <BarChart3
            size={17}
            className="text-indigo-300"
          />
        ),
      });
    } else if (
      categoricalColumns.length
    ) {
      result.push({
        title:
          'Categorical structure detected',
        text: `The dataset contains ${categoricalColumns.length} categorical columns that can be explored using frequency and group-comparison charts.`,
        variant: 'primary',
        icon: (
          <PieChart
            size={17}
            className="text-violet-300"
          />
        ),
      });
    }

    return result;
  }, [
    rows,
    columns,
    numericColumns,
    categoricalColumns,
    missingCells,
    duplicateCount,
  ]);

  /* =======================================================
     GENERATE CHART
  ======================================================= */

  function generateChart() {
    if (!defaultX) return;

    if (
      chartType === 'scatter' &&
      !defaultY
    ) {
      return;
    }

    if (
      chartType === 'histogram'
    ) {
      const column =
        defaultY ||
        numericColumns[0];

      if (!column) return;

      setGenerated({
        type: 'histogram',
        data: makeHistogram(
          rows,
          column
        ),
        x: column,
      });

      return;
    }

    if (
      chartType === 'scatter'
    ) {
      setGenerated({
        type: 'scatter',
        data: makeScatter(
          rows,
          defaultX,
          defaultY
        ),
        x: defaultX,
        y: defaultY,
      });

      return;
    }

    if (
      chartType === 'pie'
    ) {
      setGenerated({
        type: 'pie',
        data: aggregateCategorical(
          rows,
          defaultX
        ),
        x: defaultX,
      });

      return;
    }

    const data =
      aggregateCategorical(
        rows,
        defaultX,
        defaultY || null
      );

    setGenerated({
      type: chartType,
      data,
      x: defaultX,
      y: defaultY || null,
    });
  }

  /* =======================================================
     EMPTY STATES
  ======================================================= */

  if (!dataset) {
    return (
      <Page
        title="EDA & Visualize"
        sub="Explore your dataset through distributions, relationships, correlations and AI-assisted insights."
      >
        <Empty />
      </Page>
    );
  }

  if (busy) {
    return (
      <Page
        title="EDA & Visualize"
        sub="Preparing your dataset analysis..."
      >
        <Card className="p-12 text-center">
          <Spinner size="lg" />

          <h3 className="font-bold mt-5">
            Preparing EDA workspace
          </h3>

          <p className="text-sm text-slate-500 mt-2">
            DataPilot AI is profiling the
            uploaded dataset.
          </p>
        </Card>
      </Page>
    );
  }

  if (!rows.length) {
    return (
      <Page
        title="EDA & Visualize"
        sub="Explore your dataset through interactive visualizations."
      >
        <Card className="p-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
              <Database className="text-amber-300" />
            </div>

            <div>
              <h2 className="font-bold text-lg">
                Row-level data is unavailable
              </h2>

              <p className="text-slate-400 mt-2 leading-6">
                DataPilot needs dataset rows
                to create interactive EDA
                visualizations.
              </p>

              <p className="text-sm text-slate-500 mt-3">
                Expected fields include
                <code className="mx-1">
                  rows
                </code>
                ,
                <code className="mx-1">
                  data
                </code>
                ,
                <code className="mx-1">
                  records
                </code>
                or
                <code className="mx-1">
                  preview
                </code>
                .
              </p>
            </div>
          </div>
        </Card>
      </Page>
    );
  }

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <Page
      title="EDA & Visualize"
      sub="Understand your dataset before modelling through distributions, relationships, patterns and AI-assisted exploration."
    >
      {/* ===================================================
          HERO / EXPLANATION
      =================================================== */}

      <Card className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/10 flex items-center justify-center">
                <WandSparkles
                  size={18}
                  className="text-indigo-300"
                />
              </div>

              <Badge variant="primary">
                Exploratory Data Analysis
              </Badge>
            </div>

            <h2 className="text-xl md:text-2xl font-black">
              Discover what your data is telling you.
            </h2>

            <p className="text-sm text-slate-400 mt-2 leading-6">
              EDA helps you understand the
              structure, quality, distribution
              and relationships inside your
              dataset before building machine
              learning models.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>
              <Eye size={13} />
              {rows.length.toLocaleString()} rows
            </Badge>

            <Badge>
              <Database size={13} />
              {columns.length} columns
            </Badge>

            <Badge variant="success">
              <CheckCircle2 size={13} />
              {completeness.toFixed(1)}% complete
            </Badge>
          </div>
        </div>
      </Card>

      {/* ===================================================
          KPI ROW
      =================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Database size={20} />}
          label="Observations"
          value={rows.length.toLocaleString()}
          description="Available dataset rows"
          variant="primary"
        />

        <StatCard
          icon={<Layers3 size={20} />}
          label="Features"
          value={columns.length}
          description="Detected dataset columns"
          variant="cyan"
        />

        <StatCard
          icon={<Hash size={20} />}
          label="Numerical"
          value={numericColumns.length}
          description="Continuous / numeric fields"
          variant="success"
        />

        <StatCard
          icon={<Type size={20} />}
          label="Categorical"
          value={categoricalColumns.length}
          description="Category / text fields"
          variant="warning"
        />
      </div>

      {/* ===================================================
          DATA HEALTH
      =================================================== */}

      <Section
        title="Dataset Health Snapshot"
        description="A quick structural view of the data currently available to the EDA workspace."
      >
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  Completeness
                </span>

                <span className="font-bold">
                  {completeness.toFixed(1)}%
                </span>
              </div>

              <div className="h-2 rounded-full bg-white/5 mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        completeness
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/5">
              <div className="text-xs text-slate-500">
                Missing cells
              </div>

              <div className="text-2xl font-black mt-1">
                {missingCells.toLocaleString()}
              </div>

              <div className="text-xs text-slate-600 mt-1">
                Across all available fields
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/5">
              <div className="text-xs text-slate-500">
                Duplicate rows
              </div>

              <div className="text-2xl font-black mt-1">
                {duplicateCount.toLocaleString()}
              </div>

              <div className="text-xs text-slate-600 mt-1">
                Exact duplicate records
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* ===================================================
          AI INSIGHTS
      =================================================== */}

      <Section
        title="AI EDA Insights"
        description="Automatically generated observations from the currently available dataset rows."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {insights
            .slice(0, 6)
            .map((insight, index) => (
              <InsightCard
                key={`${insight.title}-${index}`}
                {...insight}
              />
            ))}
        </div>
      </Section>

      {/* ===================================================
          EXPLORER TABS
      =================================================== */}

      <Section
        title="EDA Explorer"
        description="Choose a specific analytical view of your dataset."
      >
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            {
              id: 'overview',
              label: 'Overview',
              icon: <Eye size={15} />,
            },
            {
              id: 'distribution',
              label: 'Distribution',
              icon: <BarChart3 size={15} />,
            },
            {
              id: 'relationship',
              label: 'Relationships',
              icon: <Activity size={15} />,
            },
            {
              id: 'correlation',
              label: 'Correlation',
              icon: <TrendingUp size={15} />,
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setActiveExplorer(
                  item.id
                )
              }
              className={`px-4 py-2.5 rounded-xl border text-sm flex items-center gap-2 transition ${
                activeExplorer ===
                item.id
                  ? 'bg-indigo-500/15 border-indigo-400/30 text-indigo-200'
                  : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06]'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeExplorer ===
          'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {columns
              .slice(0, MAX_AUTO_CHARTS)
              .map((column) => (
                <AutoChart
                  key={column}
                  rows={rows}
                  column={column}
                  type={
                    columnTypes[
                      column
                    ]
                  }
                />
              ))}
          </div>
        )}

        {/* DISTRIBUTION */}
        {activeExplorer ===
          'distribution' && (
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500 uppercase tracking-wider">
                  Numerical Feature
                </label>

                <select
                  value={
                    yColumn ||
                    numericColumns[0] ||
                    ''
                  }
                  onChange={(event) =>
                    setYColumn(
                      event.target.value
                    )
                  }
                  className="input mt-2"
                >
                  {numericColumns.map(
                    (column) => (
                      <option
                        key={column}
                        value={column}
                      >
                        {column}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    const column =
                      yColumn ||
                      numericColumns[0];

                    if (!column) return;

                    setGenerated({
                      type: 'histogram',
                      data: makeHistogram(
                        rows,
                        column
                      ),
                      x: column,
                    });
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 font-semibold flex items-center justify-center gap-2"
                >
                  <BarChart3 size={17} />
                  Analyze Distribution
                </button>
              </div>
            </div>

            {numericColumns.length ===
              0 && (
              <div className="p-6 rounded-2xl border border-amber-400/10 bg-amber-500/5 text-sm text-slate-400">
                No numerical columns are
                available for distribution
                analysis.
              </div>
            )}
          </Card>
        )}

        {/* RELATIONSHIP */}
        {activeExplorer ===
          'relationship' && (
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">
                  X Feature
                </label>

                <select
                  value={
                    xColumn ||
                    numericColumns[0] ||
                    ''
                  }
                  onChange={(event) =>
                    setXColumn(
                      event.target.value
                    )
                  }
                  className="input mt-2"
                >
                  {numericColumns.map(
                    (column) => (
                      <option
                        key={column}
                        value={column}
                      >
                        {column}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">
                  Y Feature
                </label>

                <select
                  value={
                    yColumn ||
                    numericColumns[1] ||
                    numericColumns[0] ||
                    ''
                  }
                  onChange={(event) =>
                    setYColumn(
                      event.target.value
                    )
                  }
                  className="input mt-2"
                >
                  {numericColumns.map(
                    (column) => (
                      <option
                        key={column}
                        value={column}
                      >
                        {column}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !xColumn &&
                      !numericColumns[0]
                    )
                      return;

                    const x =
                      xColumn ||
                      numericColumns[0];

                    const y =
                      yColumn ||
                      numericColumns[1] ||
                      numericColumns[0];

                    if (!y) return;

                    setGenerated({
                      type: 'scatter',
                      data: makeScatter(
                        rows,
                        x,
                        y
                      ),
                      x,
                      y,
                    });
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 font-semibold flex items-center justify-center gap-2"
                >
                  <ScatterChart size={17} />
                  Explore Relationship
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* CORRELATION */}
        {activeExplorer ===
          'correlation' && (
          <Card>
            {numericColumns.length <
            2 ? (
              <div className="p-6 text-sm text-slate-400">
                At least two numerical
                columns are required for
                correlation analysis.
              </div>
            ) : (
              <div className="space-y-3">
                {numericColumns
                  .slice(0, 10)
                  .flatMap(
                    (x, index) =>
                      numericColumns
                        .slice(
                          index + 1
                        )
                        .map((y) => ({
                          x,
                          y,
                          value:
                            calculateCorrelation(
                              rows,
                              x,
                              y
                            ),
                        }))
                  )
                  .sort(
                    (a, b) =>
                      Math.abs(
                        b.value || 0
                      ) -
                      Math.abs(
                        a.value || 0
                      )
                  )
                  .slice(0, 12)
                  .map((item) => {
                    const value =
                      item.value || 0;

                    const width =
                      Math.min(
                        100,
                        Math.abs(
                          value
                        ) * 100
                      );

                    return (
                      <div
                        key={`${item.x}-${item.y}`}
                        className="p-4 rounded-2xl bg-white/[0.025] border border-white/5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {item.x}
                              <span className="text-slate-600 mx-2">
                                ↔
                              </span>
                              {item.y}
                            </div>

                            <div className="text-xs text-slate-500 mt-1">
                              {correlationLabel(
                                item.value
                              )}
                            </div>
                          </div>

                          <div className="font-black text-sm">
                            {value.toFixed(
                              2
                            )}
                          </div>
                        </div>

                        <div className="h-2 bg-white/5 rounded-full mt-3 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        )}
      </Section>

      {/* ===================================================
          VISUALIZATION STUDIO
      =================================================== */}

      <Section
        title="Visualization Studio"
        description="Build a custom visualization by selecting the chart type and dataset columns."
      >
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">
                Chart Type
              </label>

              <select
                value={chartType}
                onChange={(event) => {
                  setChartType(
                    event.target.value
                  );
                  setGenerated(null);
                }}
                className="input mt-2"
              >
                <option value="bar">
                  Bar Chart
                </option>

                <option value="pie">
                  Pie / Donut Chart
                </option>

                <option value="line">
                  Line Chart
                </option>

                <option value="scatter">
                  Scatter Plot
                </option>

                <option value="histogram">
                  Histogram
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">
                X / Category
              </label>

              <select
                value={defaultX}
                onChange={(event) =>
                  setXColumn(
                    event.target.value
                  )
                }
                className="input mt-2"
              >
                <option value="">
                  Select column
                </option>

                {columns.map(
                  (column) => (
                    <option
                      key={column}
                      value={column}
                    >
                      {column}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">
                Y / Numerical
              </label>

              <select
                value={defaultY}
                onChange={(event) =>
                  setYColumn(
                    event.target.value
                  )
                }
                className="input mt-2"
              >
                <option value="">
                  Count / None
                </option>

                {numericColumns.map(
                  (column) => (
                    <option
                      key={column}
                      value={column}
                    >
                      {column}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={generateChart}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 font-semibold flex items-center justify-center gap-2 transition"
              >
                <Sparkles size={17} />
                Generate Chart
              </button>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-400/10">
            <div className="flex items-start gap-3">
              <Info
                size={17}
                className="text-indigo-300 mt-0.5 shrink-0"
              />

              <div>
                <div className="text-sm font-semibold">
                  How to choose a chart
                </div>

                <p className="text-xs text-slate-400 mt-1 leading-5">
                  Use a bar chart for category
                  comparisons, a pie chart for
                  part-to-whole composition, a
                  histogram for numerical
                  distributions, a scatter plot
                  for relationships between two
                  numerical variables, and a line
                  chart when the selected categories
                  have a meaningful order.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* ===================================================
          GENERATED CHART
      =================================================== */}

      {generated && (
        <Section
          title="Generated Visualization"
          description="Interactive analysis generated from your selected columns."
          action={
            <button
              type="button"
              onClick={generateChart}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm flex items-center gap-2"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          }
        >
          {generated.type ===
            'bar' && (
            <ChartCard
              title={`${generated.x}${
                generated.y
                  ? ` vs ${generated.y}`
                  : ''
              }`}
              description={
                generated.y
                  ? `Average ${generated.y} for each ${generated.x} category.`
                  : `Frequency of values in ${generated.x}.`
              }
              icon={
                <BarChart3 size={18} />
              }
              footer={
                generated.y
                  ? 'The bars represent the average numerical value within each category.'
                  : 'The bars represent the number of observations in each category.'
              }
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    generated.data
                  }
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 45,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,.06)"
                  />

                  <XAxis
                    dataKey="category"
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 10,
                    }}
                    angle={-25}
                    textAnchor="end"
                    height={75}
                  />

                  <YAxis
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    content={
                      <ChartTooltip />
                    }
                  />

                  <Legend />

                  <Bar
                    dataKey="value"
                    name={
                      generated.y ||
                      'Count'
                    }
                    fill="#6366f1"
                    radius={[
                      7,
                      7,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {generated.type ===
            'pie' && (
            <ChartCard
              title={`${generated.x} Composition`}
              description={`Part-to-whole distribution of ${generated.x}.`}
              icon={
                <PieChart size={18} />
              }
              footer="Pie charts work best when there are a small number of meaningful categories."
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <RePieChart>
                  <Pie
                    data={
                      generated.data
                    }
                    dataKey="value"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={125}
                    innerRadius={65}
                    paddingAngle={3}
                    label={({
                      category,
                      percent,
                    }) =>
                      `${category}: ${(
                        percent * 100
                      ).toFixed(0)}%`
                    }
                  >
                    {generated.data.map(
                      (_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            CHART_COLORS[
                              index %
                                CHART_COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    content={
                      <ChartTooltip />
                    }
                  />

                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {generated.type ===
            'line' && (
            <ChartCard
              title={`${generated.y || 'Count'} by ${generated.x}`}
              description="Ordered visualization of the selected categories."
              icon={
                <LineChart size={18} />
              }
              footer="A line chart is most meaningful when the X-axis has a meaningful sequence such as time, age groups or ordered levels."
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <ReLineChart
                  data={
                    generated.data
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,.06)"
                  />

                  <XAxis
                    dataKey="category"
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    content={
                      <ChartTooltip />
                    }
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="value"
                    name={
                      generated.y ||
                      'Count'
                    }
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{
                      r: 7,
                    }}
                  />
                </ReLineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {generated.type ===
            'scatter' && (
            <ChartCard
              title={`${generated.x} vs ${generated.y}`}
              description="Relationship between two numerical variables."
              icon={
                <ScatterChart
                  size={18}
                />
              }
              footer={
                (() => {
                  const correlation =
                    calculateCorrelation(
                      rows,
                      generated.x,
                      generated.y
                    );

                  return correlation !==
                    null
                    ? `Pearson correlation: ${correlation.toFixed(
                        2
                      )} — ${correlationLabel(
                        correlation
                      )}. Correlation does not prove causation.`
                    : 'Correlation could not be calculated from the available values.';
                })()
              }
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <ReScatterChart
                  margin={{
                    top: 20,
                    right: 20,
                    bottom: 30,
                    left: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,.06)"
                  />

                  <XAxis
                    type="number"
                    dataKey="x"
                    name={generated.x}
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    type="number"
                    dataKey="y"
                    name={generated.y}
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    cursor={{
                      strokeDasharray:
                        '3 3',
                    }}
                    content={
                      <ChartTooltip />
                    }
                  />

                  <Scatter
                    name={`${generated.x} vs ${generated.y}`}
                    data={
                      generated.data
                    }
                    fill="#06b6d4"
                  />
                </ReScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {generated.type ===
            'histogram' && (
            <ChartCard
              title={`${generated.x} Distribution`}
              description={`Numerical distribution of ${generated.x}.`}
              icon={
                <BarChart3 size={18} />
              }
              footer="A histogram helps identify concentration, spread, skew and unusual ranges in a numerical feature."
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    generated.data
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,.06)"
                  />

                  <XAxis
                    dataKey="range"
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 10,
                    }}
                    angle={-25}
                    textAnchor="end"
                    height={70}
                  />

                  <YAxis
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    content={
                      <ChartTooltip />
                    }
                  />

                  <Bar
                    dataKey="count"
                    name="Frequency"
                    fill="#10b981"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </Section>
      )}

      {/* ===================================================
          COLUMN PROFILE
      =================================================== */}

      <Section
        title="Column Intelligence"
        description="Statistical and structural information detected for each dataset column."
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Column
                  </th>

                  <th className="px-4 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Type
                  </th>

                  <th className="px-4 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Non-empty
                  </th>

                  <th className="px-4 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Missing
                  </th>

                  <th className="px-4 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Unique
                  </th>

                  <th className="px-4 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Mean
                  </th>

                  <th className="px-4 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Min
                  </th>

                  <th className="px-4 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Max
                  </th>
                </tr>
              </thead>

              <tbody>
                {columns
                  .slice(
                    0,
                    showAllColumns
                      ? columns.length
                      : 20
                  )
                  .map((column) => {
                    const stat =
                      stats[column];

                    return (
                      <tr
                        key={column}
                        className="border-b border-white/5 hover:bg-white/[0.025]"
                      >
                        <td className="px-4 py-3 font-medium max-w-[220px] truncate">
                          {column}
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              columnTypes[
                                column
                              ] ===
                              'numeric'
                                ? 'success'
                                : columnTypes[
                                    column
                                  ] ===
                                  'text'
                                ? 'warning'
                                : 'primary'
                            }
                          >
                            {columnTypes[
                              column
                            ]}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-slate-300">
                          {stat.count.toLocaleString()}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={
                              stat.missing >
                              0
                                ? 'text-amber-300'
                                : 'text-emerald-300'
                            }
                          >
                            {stat.missing.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-300">
                          {stat.unique.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-slate-400">
                          {stat.mean !==
                          null
                            ? formatNumber(
                                stat.mean
                              )
                            : '—'}
                        </td>

                        <td className="px-4 py-3 text-slate-400">
                          {stat.min !==
                          null
                            ? formatNumber(
                                stat.min
                              )
                            : '—'}
                        </td>

                        <td className="px-4 py-3 text-slate-400">
                          {stat.max !==
                          null
                            ? formatNumber(
                                stat.max
                              )
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {columns.length >
            20 && (
            <div className="p-4 border-t border-white/5">
              <button
                type="button"
                onClick={() =>
                  setShowAllColumns(
                    (value) =>
                      !value
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm flex items-center justify-center gap-2"
              >
                <ChevronDown
                  size={15}
                />

                {showAllColumns
                  ? 'Show Less'
                  : `Show All ${columns.length} Columns`}
              </button>
            </div>
          )}
        </Card>
      </Section>

      {/* ===================================================
          DATA TYPES
      =================================================== */}

      <Section
        title="Detected Data Types"
        description="DataPilot's local EDA layer automatically classifies columns for visualization."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Hash
                  size={18}
                  className="text-emerald-300"
                />
              </div>

              <div>
                <div className="text-xs text-slate-500">
                  Numerical
                </div>

                <div className="font-black text-lg">
                  {numericColumns.length}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Type
                  size={18}
                  className="text-violet-300"
                />
              </div>

              <div>
                <div className="text-xs text-slate-500">
                  Categorical
                </div>

                <div className="font-black text-lg">
                  {categoricalColumns.length}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Type
                  size={18}
                  className="text-cyan-300"
                />
              </div>

              <div>
                <div className="text-xs text-slate-500">
                  Text-like
                </div>

                <div className="font-black text-lg">
                  {textColumns.length}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Sparkles
                  size={18}
                  className="text-indigo-300"
                />
              </div>

              <div>
                <div className="text-xs text-slate-500">
                  Visualizable
                </div>

                <div className="font-black text-lg">
                  {numericColumns.length +
                    categoricalColumns.length}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </Page>
  );
}
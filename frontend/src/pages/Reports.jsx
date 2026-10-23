import { useMemo, useState } from 'react';

import {
  Activity,
  AlertCircle,
  BarChart3,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clipboard,
  Database,
  Download,
  FileText,
  Gauge,
  Layers3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Table2,
  Target,
  TrendingUp,
  X,
  PieChart as PieIcon,
} from 'lucide-react';

import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { getReport } from '../lib/api';
import { useApp } from '../context/AppContext';

import {
  Button,
  Card,
  Empty,
  Page,
  Badge,
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
  '#3b82f6',
];

const MAX_CHART_CATEGORIES = 10;
const MAX_NUMERIC_CHARTS = 4;
const MAX_CATEGORICAL_CHARTS = 4;


/* =========================================================
   GENERAL HELPERS
========================================================= */

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}


function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}


function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '—';
  }

  return `${number.toFixed(1)}%`;
}


function formatDate() {
  return new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}


function getPreviewRows(dataset) {
  return safeArray(
    dataset?.preview ||
      dataset?.rows ||
      dataset?.data ||
      dataset?.profile?.preview ||
      dataset?.profile?.sample_rows
  );
}


function getColumns(dataset) {
  const profileColumns = dataset?.profile?.columns;

  if (Array.isArray(profileColumns)) {
    return profileColumns;
  }

  const rows = getPreviewRows(dataset);

  if (
    rows.length > 0 &&
    typeof rows[0] === 'object' &&
    rows[0] !== null
  ) {
    return Object.keys(rows[0]).map((name) => ({
      name,
      column: name,
    }));
  }

  return [];
}


function getColumnName(column) {
  if (typeof column === 'string') {
    return column;
  }

  return (
    column?.name ||
    column?.column ||
    column?.field ||
    column?.column_name ||
    ''
  );
}


function getColumnType(column, rows = []) {
  if (!column) {
    return 'unknown';
  }

  const explicit = String(
    column.type ||
      column.dtype ||
      column.data_type ||
      column.kind ||
      ''
  ).toLowerCase();

  if (
    explicit.includes('datetime') ||
    explicit.includes('date') ||
    explicit.includes('time')
  ) {
    return 'date';
  }

  if (
    explicit.includes('int') ||
    explicit.includes('float') ||
    explicit.includes('double') ||
    explicit.includes('number') ||
    explicit.includes('numeric')
  ) {
    return 'numeric';
  }

  if (explicit.includes('bool')) {
    return 'boolean';
  }

  if (
    explicit.includes('object') ||
    explicit.includes('string') ||
    explicit.includes('category') ||
    explicit.includes('text')
  ) {
    return 'categorical';
  }

  const name = getColumnName(column);

  const values = rows
    .map((row) => row?.[name])
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== ''
    )
    .slice(0, 100);

  if (!values.length) {
    return 'unknown';
  }

  const numericCount = values.filter((value) => {
    if (typeof value === 'number') {
      return Number.isFinite(value);
    }

    if (
      typeof value === 'string' &&
      value.trim() !== ''
    ) {
      return Number.isFinite(Number(value));
    }

    return false;
  }).length;

  if (
    numericCount / values.length >
    0.8
  ) {
    return 'numeric';
  }

  const dateCount = values.filter(
    (value) =>
      typeof value === 'string' &&
      !Number.isNaN(Date.parse(value))
  ).length;

  if (
    dateCount / values.length >
    0.8
  ) {
    return 'date';
  }

  const booleanCount = values.filter(
    (value) =>
      value === true ||
      value === false ||
      String(value).toLowerCase() === 'true' ||
      String(value).toLowerCase() === 'false'
  ).length;

  if (
    booleanCount / values.length >
    0.8
  ) {
    return 'boolean';
  }

  return 'categorical';
}


function getTypedColumns(dataset) {
  const rows = getPreviewRows(dataset);

  return getColumns(dataset)
    .map((column) => ({
      ...column,
      name: getColumnName(column),
      detectedType: getColumnType(
        column,
        rows
      ),
    }))
    .filter((column) => column.name);
}


function getNumericColumns(dataset) {
  return getTypedColumns(dataset).filter(
    (column) =>
      column.detectedType === 'numeric'
  );
}


function getCategoricalColumns(dataset) {
  return getTypedColumns(dataset).filter(
    (column) =>
      column.detectedType === 'categorical' ||
      column.detectedType === 'boolean'
  );
}


function getDateColumns(dataset) {
  return getTypedColumns(dataset).filter(
    (column) =>
      column.detectedType === 'date'
  );
}


function numericValues(rows, column) {
  return rows
    .map((row) => {
      const value = row?.[column];

      if (
        value === null ||
        value === undefined ||
        value === ''
      ) {
        return null;
      }

      const number = Number(value);

      return Number.isFinite(number)
        ? number
        : null;
    })
    .filter(
      (value) =>
        value !== null
    );
}


function mean(values) {
  if (!values.length) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  );
}


function median(values) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const middle = Math.floor(
    sorted.length / 2
  );

  if (sorted.length % 2) {
    return sorted[middle];
  }

  return (
    sorted[middle - 1] +
    sorted[middle]
  ) / 2;
}


function minValue(values) {
  return values.length
    ? Math.min(...values)
    : 0;
}


function maxValue(values) {
  return values.length
    ? Math.max(...values)
    : 0;
}


function standardDeviation(values) {
  if (values.length < 2) {
    return 0;
  }

  const avg = mean(values);

  const variance =
    values.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value - avg,
          2
        ),
      0
    ) / values.length;

  return Math.sqrt(variance);
}


/* =========================================================
   DATA ANALYSIS
========================================================= */

function createNumericStats(dataset) {
  const rows = getPreviewRows(dataset);

  return getNumericColumns(dataset)
    .slice(0, 12)
    .map((column) => {
      const values = numericValues(
        rows,
        column.name
      );

      return {
        name: column.name,
        count: values.length,
        mean: mean(values),
        median: median(values),
        min: minValue(values),
        max: maxValue(values),
        std: standardDeviation(values),
      };
    });
}


function createCategoryData(
  dataset,
  columnName
) {
  const rows = getPreviewRows(dataset);

  const counts = {};

  rows.forEach((row) => {
    let value = row?.[columnName];

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      value = 'Missing';
    }

    value = String(value);

    counts[value] =
      (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .sort(
      (a, b) =>
        b[1] - a[1]
    )
    .slice(
      0,
      MAX_CHART_CATEGORIES
    )
    .map(
      ([name, value]) => ({
        name,
        value,
      })
    );
}


function createMissingData(dataset) {
  const rows = getPreviewRows(dataset);

  return getColumns(dataset)
    .map((column) => {
      const name =
        getColumnName(column);

      if (!name) {
        return null;
      }

      const missing =
        rows.filter(
          (row) =>
            row?.[name] === null ||
            row?.[name] === undefined ||
            row?.[name] === ''
        ).length;

      const percentage =
        rows.length > 0
          ? (missing /
              rows.length) *
            100
          : 0;

      return {
        name,
        missing,
        percentage,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.missing - a.missing
    )
    .slice(0, 10);
}


function createTypeData(dataset) {
  const rows = getPreviewRows(dataset);

  const counts = {
    Numeric: 0,
    Categorical: 0,
    Date: 0,
    Boolean: 0,
    Other: 0,
  };

  getColumns(dataset).forEach(
    (column) => {
      const type =
        getColumnType(
          column,
          rows
        );

      if (type === 'numeric') {
        counts.Numeric += 1;
      } else if (
        type === 'categorical'
      ) {
        counts.Categorical += 1;
      } else if (
        type === 'date'
      ) {
        counts.Date += 1;
      } else if (
        type === 'boolean'
      ) {
        counts.Boolean += 1;
      } else {
        counts.Other += 1;
      }
    }
  );

  return Object.entries(
    counts
  )
    .filter(
      ([, value]) =>
        value > 0
    )
    .map(
      ([name, value]) => ({
        name,
        value,
      })
    );
}


function createHistogram(
  dataset,
  columnName
) {
  const rows = getPreviewRows(dataset);

  const values = numericValues(
    rows,
    columnName
  );

  if (!values.length) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [
      {
        range: String(
          Number(
            min.toFixed(2)
          )
        ),
        count: values.length,
      },
    ];
  }

  const bins = 8;

  const width =
    (max - min) / bins;

  const result =
    Array.from(
      {
        length: bins,
      },
      (_, index) => ({
        range:
          `${(
            min +
            index * width
          ).toFixed(1)}–` +
          `${(
            min +
            (index + 1) *
              width
          ).toFixed(1)}`,
        count: 0,
      })
    );

  values.forEach(
    (value) => {
      let index =
        Math.floor(
          (value - min) /
            width
        );

      if (
        index >= bins
      ) {
        index = bins - 1;
      }

      result[index].count += 1;
    }
  );

  return result;
}


function getModelMetrics(model) {
  if (!model) {
    return [];
  }

  const metrics =
    model.metrics ||
    model.results ||
    model.model_metrics ||
    {};

  if (
    Array.isArray(metrics)
  ) {
    return metrics
      .map((item) => {
        if (
          typeof item === 'object'
        ) {
          return {
            name:
              item.name ||
              item.metric ||
              item.key ||
              'Metric',
            value:
              Number(
                item.value ??
                  item.score ??
                  item.metric_value
              ) || 0,
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  return Object.entries(
    metrics
  )
    .filter(
      ([, value]) =>
        typeof value ===
        'number'
    )
    .map(
      ([name, value]) => ({
        name,
        value,
      })
    );
}


function getFeatureImportance(model) {
  if (!model) {
    return [];
  }

  const raw =
    model.feature_importance ||
    model.feature_importances ||
    model.importance ||
    [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (
          typeof item ===
          'object'
        ) {
          return {
            name:
              item.feature ||
              item.name ||
              item.column ||
              'Feature',
            value:
              Number(
                item.importance ??
                  item.value ??
                  item.score
              ) || 0,
          };
        }

        return null;
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          b.value - a.value
      )
      .slice(0, 10);
  }

  if (
    raw &&
    typeof raw ===
      'object'
  ) {
    return Object.entries(
      raw
    )
      .map(
        ([name, value]) => ({
          name,
          value:
            Number(value) || 0,
        })
      )
      .sort(
        (a, b) =>
          b.value - a.value
      )
      .slice(0, 10);
  }

  return [];
}


/* =========================================================
   QUALITY HELPERS
========================================================= */

function getQualityLabel(score) {
  const value = Number(score) || 0;

  if (value >= 90) {
    return 'Excellent';
  }

  if (value >= 75) {
    return 'Good';
  }

  if (value >= 50) {
    return 'Needs attention';
  }

  return 'High risk';
}


function getQualityTone(score) {
  const value = Number(score) || 0;

  if (value >= 90) {
    return {
      text: 'text-emerald-300',
      bg: 'bg-emerald-500/10',
      border:
        'border-emerald-400/10',
    };
  }

  if (value >= 75) {
    return {
      text: 'text-indigo-300',
      bg: 'bg-indigo-500/10',
      border:
        'border-indigo-400/10',
    };
  }

  if (value >= 50) {
    return {
      text: 'text-amber-300',
      bg: 'bg-amber-500/10',
      border:
        'border-amber-400/10',
    };
  }

  return {
    text: 'text-red-300',
    bg: 'bg-red-500/10',
    border:
      'border-red-400/10',
  };
}


/* =========================================================
   UI COMPONENTS
========================================================= */

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'indigo',
}) {
  const toneClasses = {
    indigo:
      'text-indigo-300 bg-indigo-500/10',
    emerald:
      'text-emerald-300 bg-emerald-500/10',
    amber:
      'text-amber-300 bg-amber-500/10',
    cyan:
      'text-cyan-300 bg-cyan-500/10',
    violet:
      'text-violet-300 bg-violet-500/10',
  };

  return (
    <div className="group rounded-2xl border border-white/5 bg-white/[0.025] p-4 transition hover:border-white/10 hover:bg-white/[0.04]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            toneClasses[tone] ||
            toneClasses.indigo
          }`}
        >
          <Icon size={15} />
        </div>

        <span>{label}</span>
      </div>

      <div className="mt-3 truncate text-2xl font-black text-white">
        {value}
      </div>

      {detail && (
        <div className="mt-1 truncate text-xs text-slate-500">
          {detail}
        </div>
      )}
    </div>
  );
}


function SectionTitle({
  icon: Icon,
  title,
  description,
  badge,
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/10 bg-indigo-500/10 text-indigo-300">
          <Icon size={18} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">
            {title}
          </h2>

          {description && (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {badge && (
        <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {badge}
        </span>
      )}
    </div>
  );
}


function ChartCard({
  title,
  description,
  children,
  height = 300,
}) {
  return (
    <Card className="overflow-hidden">
      <div className="mb-4">
        <h3 className="font-bold text-white">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div
        style={{
          height,
        }}
        className="w-full"
      >
        {children}
      </div>
    </Card>
  );
}


function EmptyChart({
  title = 'No chart data',
  text = 'There is not enough information available for this visualization.',
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
          <BarChart3 size={20} />
        </div>

        <h4 className="mt-3 font-semibold text-slate-300">
          {title}
        </h4>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          {text}
        </p>
      </div>
    </div>
  );
}


function ReadinessItem({
  label,
  description,
  ready,
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-3">
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          ready
            ? 'bg-emerald-500/10 text-emerald-300'
            : 'bg-white/5 text-slate-600'
        }`}
      >
        {ready ? (
          <Check size={15} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-200">
          {label}
        </div>

        <div className="mt-0.5 text-xs leading-5 text-slate-600">
          {description}
        </div>
      </div>
    </div>
  );
}


function QualityScore({
  score,
}) {
  const normalized = Math.max(
    0,
    Math.min(
      100,
      Number(score) || 0
    )
  );

  const tone =
    getQualityTone(
      normalized
    );

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative grid h-44 w-44 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#6366f1 ${normalized}%, rgba(255,255,255,.06) 0)`,
        }}
      >
        <div className="grid h-36 w-36 place-items-center rounded-full bg-slate-950 shadow-inner">
          <div className="text-center">
            <div className="text-4xl font-black text-white">
              {normalized.toFixed(0)}
            </div>

            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              quality score
            </div>
          </div>
        </div>
      </div>

      <span
        className={`mt-4 rounded-full border px-3 py-1 text-xs font-bold ${tone.text} ${tone.bg} ${tone.border}`}
      >
        {getQualityLabel(
          normalized
        )}
      </span>
    </div>
  );
}


function StatusBadge({
  generated,
}) {
  if (generated) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
        <CheckCircle2 size={14} />
        Report ready
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-400">
      <FileText size={14} />
      Draft
    </span>
  );
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function Reports() {
  const {
    dataset,
    model,
  } = useApp();

  const [markdown, setMarkdown] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [copied, setCopied] =
    useState(false);

  const [generatedAt, setGeneratedAt] =
    useState('');

  const profile =
    dataset?.profile || {};

  const rows =
    useMemo(
      () =>
        getPreviewRows(dataset),
      [dataset]
    );

  const columns =
    useMemo(
      () =>
        getTypedColumns(dataset),
      [dataset]
    );

  const numericColumns =
    useMemo(
      () =>
        getNumericColumns(dataset),
      [dataset]
    );

  const categoricalColumns =
    useMemo(
      () =>
        getCategoricalColumns(dataset),
      [dataset]
    );

  const dateColumns =
    useMemo(
      () =>
        getDateColumns(dataset),
      [dataset]
    );

  const numericStats =
    useMemo(
      () =>
        createNumericStats(
          dataset
        ),
      [dataset]
    );

  const missingData =
    useMemo(
      () =>
        createMissingData(
          dataset
        ),
      [dataset]
    );

  const typeData =
    useMemo(
      () =>
        createTypeData(
          dataset
        ),
      [dataset]
    );

  const featureImportance =
    useMemo(
      () =>
        getFeatureImportance(
          model
        ),
      [model]
    );

  const modelMetrics =
    useMemo(
      () =>
        getModelMetrics(
          model
        ),
      [model]
    );

  const reportStats =
    useMemo(() => {
      const profileRows =
        Number(
          profile.rows
        ) || 0;

      const profileColumns =
        Number(
          profile.cols
        ) ||
        Number(
          profile.columns?.length
        ) ||
        0;

      return {
        rows:
          profileRows ||
          rows.length ||
          0,

        columns:
          profileColumns ||
          columns.length,

        quality:
          Number(
            profile.quality_score
          ) || 0,

        issues:
          Array.isArray(
            profile.issues
          )
            ? profile.issues.length
            : 0,

        missing:
          Number(
            profile.missing_pct
          ) || 0,

        duplicates:
          Number(
            profile.duplicates ??
              profile.duplicate_rows
          ) || 0,

        outliers:
          Number(
            profile.outliers
          ) || 0,
      };
    }, [
      profile,
      rows.length,
      columns.length,
    ]);

  const readiness = useMemo(
    () => ({
      dataset:
        Boolean(dataset),

      profile:
        Boolean(
          dataset?.profile
        ),

      quality:
        Boolean(
          dataset?.profile &&
            (
              dataset.profile
                .quality_score !==
                undefined ||
              dataset.profile
                .issues !==
                undefined
            )
        ),

      eda:
        rows.length > 0,

      model:
        Boolean(model),

      ai:
        Boolean(markdown),

      export:
        Boolean(dataset),
    }),
    [
      dataset,
      rows.length,
      model,
      markdown,
    ]
  );

  const readinessCount =
    Object.values(
      readiness
    ).filter(Boolean).length;


  /* =========================================================
     EMPTY STATE
  ========================================================= */

  if (!dataset) {
    return (
      <Page
        title="Reports"
        sub="Generate, explore and export a professional DataPilot AI data science report."
      >
        <Empty text="Upload a dataset first to open the Reporting Studio." />
      </Page>
    );
  }


  /* =========================================================
     GENERATE REPORT
  ========================================================= */

  const generate = async () => {
    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const response =
        await getReport(
          dataset.dataset_id
        );

      const generatedMarkdown =
        response?.markdown ||
        '';

      if (
        !generatedMarkdown.trim()
      ) {
        throw new Error(
          'The backend returned an empty report.'
        );
      }

      setMarkdown(
        generatedMarkdown
      );

      setGeneratedAt(
        formatDate()
      );
    } catch (err) {
      setError(
        err?.message ||
          'Unable to generate the report.'
      );
    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     COPY REPORT
  ========================================================= */

  const copyReport =
    async () => {
      if (!markdown) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          markdown
        );

        setCopied(true);

        window.setTimeout(
          () =>
            setCopied(false),
          1800
        );
      } catch {
        setError(
          'Unable to copy the report.'
        );
      }
    };


  /* =========================================================
     DOWNLOAD MARKDOWN
  ========================================================= */

  const downloadMarkdown =
    () => {
      if (!markdown) {
        return;
      }

      try {
        const blob =
          new Blob(
            [markdown],
            {
              type: 'text/markdown;charset=utf-8',
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const anchor =
          document.createElement(
            'a'
          );

        anchor.href = url;

        anchor.download =
          'DataPilot_AI_Professional_Report.md';

        document.body.appendChild(
          anchor
        );

        anchor.click();

        anchor.remove();

        window.setTimeout(
          () =>
            URL.revokeObjectURL(
              url
            ),
          1000
        );
      } catch {
        setError(
          'Markdown download failed.'
        );
      }
    };


  /* =========================================================
     PROFESSIONAL PDF
  ========================================================= */

  const downloadPdf = () => {
    try {
      const doc =
        new jsPDF({
          orientation:
            'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      const margin = 14;

      const contentWidth =
        pageWidth -
        margin * 2;

      let y = 18;

      const colors = {
        primary: [
          99,
          102,
          241,
        ],
        secondary: [
          139,
          92,
          246,
        ],
        dark: [
          20,
          24,
          40,
        ],
        text: [
          40,
          44,
          55,
        ],
        muted: [
          105,
          110,
          125,
        ],
        success: [
          16,
          185,
          129,
        ],
        warning: [
          245,
          158,
          11,
        ],
        danger: [
          239,
          68,
          68,
        ],
      };


      /* -------------------------------------------------------
         PAGE HELPERS
      ------------------------------------------------------- */

      const addPage =
        () => {
          doc.addPage();
          y = 18;
        };


      const ensureSpace =
        (required = 10) => {
          if (
            y + required >
            pageHeight - 20
          ) {
            addPage();
          }
        };


      const footer =
        () => {
          const total =
            doc.internal.getNumberOfPages();

          for (
            let page = 1;
            page <= total;
            page += 1
          ) {
            doc.setPage(page);

            doc.setDrawColor(
              225,
              227,
              235
            );

            doc.line(
              margin,
              pageHeight - 13,
              pageWidth -
                margin,
              pageHeight - 13
            );

            doc.setFont(
              'helvetica',
              'normal'
            );

            doc.setFontSize(7.5);

            doc.setTextColor(
              ...colors.muted
            );

            doc.text(
              'DataPilot AI • Autonomous Data Science Report',
              margin,
              pageHeight - 8
            );

            doc.text(
              `Page ${page} of ${total}`,
              pageWidth -
                margin,
              pageHeight - 8,
              {
                align: 'right',
              }
            );
          }
        };


      /* -------------------------------------------------------
         SECTION HEADING
      ------------------------------------------------------- */

      const sectionHeading =
        (
          title,
          subtitle = ''
        ) => {
          ensureSpace(25);

          doc.setFont(
            'helvetica',
            'bold'
          );

          doc.setFontSize(15);

          doc.setTextColor(
            ...colors.dark
          );

          doc.text(
            title,
            margin,
            y
          );

          y += 6;

          if (subtitle) {
            doc.setFont(
              'helvetica',
              'normal'
            );

            doc.setFontSize(8.5);

            doc.setTextColor(
              ...colors.muted
            );

            const lines =
              doc.splitTextToSize(
                subtitle,
                contentWidth
              );

            doc.text(
              lines,
              margin,
              y
            );

            y +=
              lines.length * 4 +
              3;
          }

          doc.setDrawColor(
            225,
            227,
            235
          );

          doc.line(
            margin,
            y,
            pageWidth -
              margin,
            y
          );

          y += 7;
        };


      /* -------------------------------------------------------
         METRIC
      ------------------------------------------------------- */

      const drawMetric =
        (
          x,
          boxY,
          width,
          label,
          value,
          detail
        ) => {
          doc.setFillColor(
            248,
            249,
            253
          );

          doc.setDrawColor(
            228,
            230,
            239
          );

          doc.roundedRect(
            x,
            boxY,
            width,
            25,
            3,
            3,
            'FD'
          );

          doc.setFont(
            'helvetica',
            'bold'
          );

          doc.setFontSize(7.5);

          doc.setTextColor(
            ...colors.muted
          );

          doc.text(
            String(label).toUpperCase(),
            x + 4,
            boxY + 6
          );

          doc.setFontSize(12);

          doc.setTextColor(
            ...colors.dark
          );

          doc.text(
            String(value).slice(
              0,
              18
            ),
            x + 4,
            boxY + 14
          );

          if (detail) {
            doc.setFont(
              'helvetica',
              'normal'
            );

            doc.setFontSize(6.8);

            doc.setTextColor(
              ...colors.muted
            );

            doc.text(
              String(detail).slice(
                0,
                30
              ),
              x + 4,
              boxY + 20
            );
          }
        };


      /* -------------------------------------------------------
         TEXT
      ------------------------------------------------------- */

      const drawText =
        (
          text,
          fontSize = 9
        ) => {
          if (!text) {
            return;
          }

          doc.setFont(
            'helvetica',
            'normal'
          );

          doc.setFontSize(
            fontSize
          );

          doc.setTextColor(
            ...colors.text
          );

          const lines =
            doc.splitTextToSize(
              String(text),
              contentWidth
            );

          lines.forEach(
            (line) => {
              ensureSpace(
                fontSize
              );

              doc.text(
                line,
                margin,
                y
              );

              y +=
                fontSize * 0.55;
            }
          );

          y += 2;
        };


      /* -------------------------------------------------------
         BAR CHART
      ------------------------------------------------------- */

      const drawBarChart =
        (
          title,
          data,
          valueKey = 'value',
          nameKey = 'name',
          maxBars = 10
        ) => {
          const chartData =
            safeArray(data)
              .slice(
                0,
                maxBars
              );

          if (
            !chartData.length
          ) {
            return;
          }

          ensureSpace(82);

          doc.setFont(
            'helvetica',
            'bold'
          );

          doc.setFontSize(10);

          doc.setTextColor(
            ...colors.dark
          );

          doc.text(
            title,
            margin,
            y
          );

          y += 7;

          const chartHeight = 50;

          const chartTop = y;

          const chartBottom =
            chartTop +
            chartHeight;

          const chartLeft =
            margin + 30;

          const chartRight =
            pageWidth -
            margin;

          const maxValue =
            Math.max(
              ...chartData.map(
                (item) =>
                  Number(
                    item?.[
                      valueKey
                    ]
                  ) || 0
              ),
              1
            );

          doc.setDrawColor(
            220,
            223,
            232
          );

          doc.line(
            chartLeft,
            chartBottom,
            chartRight,
            chartBottom
          );

          const slot =
            (chartRight -
              chartLeft) /
            chartData.length;

          chartData.forEach(
            (
              item,
              index
            ) => {
              const value =
                Number(
                  item?.[
                    valueKey
                  ]
                ) || 0;

              const barHeight =
                (value /
                  maxValue) *
                (chartHeight -
                  8);

              const x =
                chartLeft +
                index * slot +
                slot * 0.2;

              const width =
                Math.max(
                  3,
                  slot * 0.6
                );

              const barY =
                chartBottom -
                barHeight;

              doc.setFillColor(
                ...colors.primary
              );

              doc.roundedRect(
                x,
                barY,
                width,
                barHeight,
                1.5,
                1.5,
                'F'
              );

              doc.setFont(
                'helvetica',
                'normal'
              );

              doc.setFontSize(5.5);

              doc.setTextColor(
                ...colors.muted
              );

              const label =
                String(
                  item?.[
                    nameKey
                  ] ?? ''
                ).slice(
                  0,
                  12
                );

              doc.text(
                label,
                x +
                  width / 2,
                chartBottom +
                  5,
                {
                  align: 'center',
                }
              );

              if (
                barHeight > 5
              ) {
                doc.setFont(
                  'helvetica',
                  'bold'
                );

                doc.setFontSize(5.5);

                doc.setTextColor(
                  ...colors.dark
                );

                doc.text(
                  formatNumber(
                    value
                  ),
                  x +
                    width / 2,
                  barY - 2,
                  {
                    align:
                      'center',
                  }
                );
              }
            }
          );

          y =
            chartBottom +
            13;
        };


      /* -------------------------------------------------------
         PIE CHART
      ------------------------------------------------------- */

      const drawPieChart =
        (
          title,
          data
        ) => {
          const chartData =
            safeArray(data)
              .filter(
                (item) =>
                  Number(
                    item?.value
                  ) > 0
              )
              .slice(0, 8);

          if (
            !chartData.length
          ) {
            return;
          }

          ensureSpace(82);

          doc.setFont(
            'helvetica',
            'bold'
          );

          doc.setFontSize(10);

          doc.setTextColor(
            ...colors.dark
          );

          doc.text(
            title,
            margin,
            y
          );

          y += 7;

          const total =
            chartData.reduce(
              (
                sum,
                item
              ) =>
                sum +
                Number(
                  item.value
                ),
              0
            );

          const centerX =
            margin + 38;

          const centerY =
            y + 25;

          const radius = 22;

          let startAngle =
            -Math.PI / 2;

          chartData.forEach(
            (
              item,
              index
            ) => {
              const value =
                Number(
                  item.value
                ) || 0;

              const angle =
                total > 0
                  ? (value /
                      total) *
                    Math.PI *
                    2
                  : 0;

              const endAngle =
                startAngle +
                angle;

              const segments =
                Math.max(
                  3,
                  Math.ceil(
                    Math.abs(
                      angle
                    ) * 10
                  )
                );

              for (
                let i = 0;
                i < segments;
                i += 1
              ) {
                const a1 =
                  startAngle +
                  ((endAngle -
                    startAngle) *
                    i) /
                    segments;

                const a2 =
                  startAngle +
                  ((endAngle -
                    startAngle) *
                    (i + 1)) /
                    segments;

                const x1 =
                  centerX +
                  radius *
                    Math.cos(
                      a1
                    );

                const y1 =
                  centerY +
                  radius *
                    Math.sin(
                      a1
                    );

                const x2 =
                  centerX +
                  radius *
                    Math.cos(
                      a2
                    );

                const y2 =
                  centerY +
                  radius *
                    Math.sin(
                      a2
                    );

                doc.setFillColor(
                  ...hexToRgb(
                    CHART_COLORS[
                      index %
                        CHART_COLORS.length
                    ]
                  )
                );

                doc.triangle(
                  centerX,
                  centerY,
                  x1,
                  y1,
                  x2,
                  y2,
                  'F'
                );
              }

              startAngle =
                endAngle;
            }
          );

          doc.setFillColor(
            255,
            255,
            255
          );

          doc.circle(
            centerX,
            centerY,
            9,
            'F'
          );

          let legendY =
            y + 3;

          chartData.forEach(
            (
              item,
              index
            ) => {
              doc.setFillColor(
                ...hexToRgb(
                  CHART_COLORS[
                    index %
                      CHART_COLORS.length
                  ]
                )
              );

              doc.rect(
                margin + 78,
                legendY - 3,
                3,
                3,
                'F'
              );

              doc.setFont(
                'helvetica',
                'normal'
              );

              doc.setFontSize(7);

              doc.setTextColor(
                ...colors.text
              );

              const percentage =
                total > 0
                  ? (
                      (Number(
                        item.value
                      ) /
                        total) *
                      100
                    ).toFixed(
                      1
                    )
                  : '0.0';

              const label =
                String(
                  item.name
                ).slice(
                  0,
                  22
                );

              doc.text(
                `${label} — ${formatNumber(
                  item.value
                )} (${percentage}%)`,
                margin + 83,
                legendY
              );

              legendY += 6;
            }
          );

          y = Math.max(
            y + 58,
            legendY + 4
          );
        };


      /* -------------------------------------------------------
         TABLE
      ------------------------------------------------------- */

      const drawTable =
        (
          headers,
          data,
          widths
        ) => {
          if (
            !Array.isArray(data) ||
            !data.length
          ) {
            return;
          }

          const rowHeight = 6;

          const tableWidth =
            widths.reduce(
              (
                sum,
                width
              ) =>
                sum + width,
              0
            );

          ensureSpace(
            rowHeight + 4
          );

          let x = margin;

          doc.setFillColor(
            ...colors.primary
          );

          doc.setTextColor(
            255,
            255,
            255
          );

          doc.setFont(
            'helvetica',
            'bold'
          );

          doc.setFontSize(6.5);

          headers.forEach(
            (
              header,
              index
            ) => {
              doc.rect(
                x,
                y,
                widths[index],
                rowHeight,
                'F'
              );

              doc.text(
                String(
                  header
                ).slice(
                  0,
                  18
                ),
                x + 2,
                y + 4
              );

              x +=
                widths[index];
            }
          );

          y += rowHeight;

          data.forEach(
            (
              row,
              rowIndex
            ) => {
              ensureSpace(
                rowHeight + 2
              );

              x = margin;

              if (
                rowIndex % 2 ===
                0
              ) {
                doc.setFillColor(
                  248,
                  249,
                  252
                );

                doc.rect(
                  margin,
                  y,
                  tableWidth,
                  rowHeight,
                  'F'
                );
              }

              doc.setFont(
                'helvetica',
                'normal'
              );

              doc.setFontSize(6.3);

              doc.setTextColor(
                ...colors.text
              );

              row.forEach(
                (
                  value,
                  index
                ) => {
                  const text =
                    String(
                      value ??
                        '—'
                    ).slice(
                      0,
                      22
                    );

                  doc.text(
                    text,
                    x + 2,
                    y + 4
                  );

                  x +=
                    widths[index];
                }
              );

              y += rowHeight;
            }
          );

          y += 5;
        };


      /* =====================================================
         PDF COVER
      ===================================================== */

      doc.setFillColor(
        ...colors.dark
      );

      doc.rect(
        0,
        0,
        pageWidth,
        pageHeight,
        'F'
      );

      doc.setFillColor(
        ...colors.primary
      );

      doc.circle(
        pageWidth - 25,
        30,
        45,
        'F'
      );

      doc.setFillColor(
        ...colors.secondary
      );

      doc.circle(
        15,
        pageHeight - 30,
        38,
        'F'
      );

      doc.setTextColor(
        255,
        255,
        255
      );

      doc.setFont(
        'helvetica',
        'bold'
      );

      doc.setFontSize(29);

      doc.text(
        'DataPilot AI',
        margin,
        55
      );

      doc.setFontSize(17);

      doc.text(
        'Autonomous Data Science Report',
        margin,
        66
      );

      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(10);

      doc.setTextColor(
        205,
        210,
        225
      );

      doc.text(
        'AI-powered dataset profiling, quality analysis,',
        margin,
        79
      );

      doc.text(
        'exploratory analysis, machine learning and insights.',
        margin,
        85
      );

      doc.setFillColor(
        255,
        255,
        255
      );

      doc.roundedRect(
        margin,
        105,
        contentWidth,
        65,
        5,
        5,
        'F'
      );

      doc.setTextColor(
        ...colors.dark
      );

      doc.setFont(
        'helvetica',
        'bold'
      );

      doc.setFontSize(11);

      doc.text(
        'DATASET',
        margin + 8,
        118
      );

      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(14);

      doc.text(
        String(
          dataset.filename ||
            'Dataset'
        ).slice(
          0,
          65
        ),
        margin + 8,
        128
      );

      doc.setFontSize(8.5);

      doc.setTextColor(
        ...colors.muted
      );

      doc.text(
        `Generated: ${
          generatedAt ||
          formatDate()
        }`,
        margin + 8,
        139
      );

      doc.text(
        `Dataset ID: ${
          dataset.dataset_id ||
          '—'
        }`,
        margin + 8,
        146
      );

      doc.setFont(
        'helvetica',
        'bold'
      );

      doc.setFontSize(8.5);

      doc.setTextColor(
        ...colors.dark
      );

      doc.text(
        'Executive metrics',
        margin + 8,
        157
      );

      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(8);

      doc.setTextColor(
        ...colors.muted
      );

      doc.text(
        `${formatNumber(
          reportStats.rows
        )} rows • ${
          reportStats.columns
        } columns • ${
          reportStats.quality.toFixed(
            1
          )
        }/100 quality`,
        margin + 45,
        157
      );

      doc.setTextColor(
        180,
        185,
        205
      );

      doc.setFontSize(8);

      doc.text(
        'Prepared automatically by DataPilot AI',
        margin,
        pageHeight - 20
      );

      addPage();


      /* =====================================================
         1. EXECUTIVE SUMMARY
      ===================================================== */

      sectionHeading(
        '1. Executive Summary',
        'High-level overview of the uploaded dataset and automated analysis.'
      );

      const cardGap = 4;

      const cardWidth =
        (contentWidth -
          cardGap * 3) /
        4;

      drawMetric(
        margin,
        y,
        cardWidth,
        'Rows',
        formatNumber(
          reportStats.rows
        ),
        'Records analyzed'
      );

      drawMetric(
        margin +
          cardWidth +
          cardGap,
        y,
        cardWidth,
        'Columns',
        formatNumber(
          reportStats.columns
        ),
        'Dataset fields'
      );

      drawMetric(
        margin +
          (cardWidth +
            cardGap) *
            2,
        y,
        cardWidth,
        'Quality',
        `${reportStats.quality.toFixed(
          1
        )}/100`,
        'Quality score'
      );

      drawMetric(
        margin +
          (cardWidth +
            cardGap) *
            3,
        y,
        cardWidth,
        'Missing',
        `${reportStats.missing.toFixed(
          1
        )}%`,
        'Missing data'
      );

      y += 34;

      drawText(
        `The dataset contains ${formatNumber(
          reportStats.rows
        )} records across ${formatNumber(
          reportStats.columns
        )} fields. The automated profiling pipeline calculated a quality score of ${reportStats.quality.toFixed(
          1
        )}/100 with ${formatNumber(
          reportStats.duplicates
        )} duplicate rows and ${formatNumber(
          reportStats.issues
        )} detected quality issues.`,
        9
      );

      if (model) {
        drawText(
          `Machine-learning analysis is available. The detected problem type is ${
            model.problem_type ||
            'not specified'
          }, with ${
            model.best_model ||
            'the selected model'
          } identified as the current best-performing model.`,
          9
        );
      }


      /* =====================================================
         2. DATASET STRUCTURE
      ===================================================== */

      sectionHeading(
        '2. Dataset Structure',
        'Detected field types and structural composition of the uploaded dataset.'
      );

      drawPieChart(
        'Column Type Distribution',
        typeData
      );


      /* =====================================================
         3. DATA QUALITY
      ===================================================== */

      sectionHeading(
        '3. Data Quality Assessment',
        'Missing values, duplicate rows and automated quality signals.'
      );

      drawMetric(
        margin,
        y,
        cardWidth,
        'Quality',
        `${reportStats.quality.toFixed(
          1
        )}/100`,
        'Overall score'
      );

      drawMetric(
        margin +
          cardWidth +
          cardGap,
        y,
        cardWidth,
        'Missing',
        `${reportStats.missing.toFixed(
          1
        )}%`,
        'Missing percentage'
      );

      drawMetric(
        margin +
          (cardWidth +
            cardGap) *
            2,
        y,
        cardWidth,
        'Duplicates',
        formatNumber(
          reportStats.duplicates
        ),
        'Duplicate rows'
      );

      drawMetric(
        margin +
          (cardWidth +
            cardGap) *
            3,
        y,
        cardWidth,
        'Issues',
        formatNumber(
          reportStats.issues
        ),
        'Quality issues'
      );

      y += 34;

      if (
        missingData.length
      ) {
        drawBarChart(
          'Missing Values by Column',
          missingData,
          'missing',
          'name',
          10
        );
      }


      /* =====================================================
         4. NUMERICAL ANALYSIS
      ===================================================== */

      sectionHeading(
        '4. Numerical Analysis',
        'Descriptive statistics calculated from the available dataset preview.'
      );

      drawTable(
        [
          'Column',
          'Count',
          'Mean',
          'Median',
          'Min',
          'Max',
          'Std',
        ],
        numericStats.map(
          (item) => [
            item.name,
            formatNumber(
              item.count
            ),
            formatNumber(
              item.mean
            ),
            formatNumber(
              item.median
            ),
            formatNumber(
              item.min
            ),
            formatNumber(
              item.max
            ),
            formatNumber(
              item.std
            ),
          ]
        ),
        [
          38,
          20,
          24,
          24,
          22,
          22,
          22,
        ]
      );


      /* =====================================================
         5. CATEGORICAL ANALYSIS
      ===================================================== */

      if (
        categoricalColumns.length
      ) {
        sectionHeading(
          '5. Categorical Analysis',
          'Frequency patterns across categorical variables.'
        );

        categoricalColumns
          .slice(
            0,
            MAX_CATEGORICAL_CHARTS
          )
          .forEach(
            (column) => {
              const data =
                createCategoryData(
                  dataset,
                  column.name
                );

              drawBarChart(
                `${column.name} — Frequency`,
                data,
                'value',
                'name',
                MAX_CHART_CATEGORIES
              );
            }
          );
      }


      /* =====================================================
         6. NUMERICAL DISTRIBUTIONS
      ===================================================== */

      if (
        numericColumns.length
      ) {
        sectionHeading(
          '6. Numerical Distributions',
          'Distribution summaries for the main numerical variables.'
        );

        numericColumns
          .slice(
            0,
            MAX_NUMERIC_CHARTS
          )
          .forEach(
            (column) => {
              const data =
                createHistogram(
                  dataset,
                  column.name
                );

              drawBarChart(
                `${column.name} — Distribution`,
                data,
                'count',
                'range',
                8
              );
            }
          );
      }


      /* =====================================================
         7. MACHINE LEARNING
      ===================================================== */

      if (model) {
        sectionHeading(
          '7. Machine Learning Analysis',
          'Automated machine-learning results from the DataPilot AI Model Lab.'
        );

        drawMetric(
          margin,
          y,
          cardWidth,
          'Problem Type',
          model.problem_type ||
            'Detected',
          'ML task'
        );

        drawMetric(
          margin +
            cardWidth +
            cardGap,
          y,
          cardWidth,
          'Best Model',
          model.best_model ||
            'Available',
          'Selected model'
        );

        drawMetric(
          margin +
            (cardWidth +
              cardGap) *
              2,
          y,
          cardWidth,
          'Metrics',
          formatNumber(
            modelMetrics.length
          ),
          'Reported metrics'
        );

        drawMetric(
          margin +
            (cardWidth +
              cardGap) *
              3,
          y,
          cardWidth,
          'Features',
          formatNumber(
            model.features
              ?.length ||
              model.feature_names
                ?.length ||
              0
          ),
          'Model inputs'
        );

        y += 34;

        if (
          modelMetrics.length
        ) {
          drawTable(
            [
              'Metric',
              'Value',
            ],
            modelMetrics
              .slice(0, 10)
              .map(
                (item) => [
                  item.name ||
                    item.metric ||
                    'Metric',
                  formatNumber(
                    item.value
                  ),
                ]
              ),
            [
              110,
              65,
            ]
          );
        }

        if (
          featureImportance.length
        ) {
          drawBarChart(
            'Top Feature Importance',
            featureImportance,
            'value',
            'name',
            10
          );
        }
      }


      /* =====================================================
         8. AI REPORT
      ===================================================== */

      if (markdown) {
        sectionHeading(
          '8. AI Analysis & Findings',
          'Dataset-grounded analytical narrative generated by DataPilot AI.'
        );

        const plainText =
          markdown
            .replace(
              /^#{1,6}\s+/gm,
              ''
            )
            .replace(
              /\*\*(.*?)\*\*/g,
              '$1'
            )
            .replace(
              /\*(.*?)\*/g,
              '$1'
            )
            .replace(
              /`([^`]+)`/g,
              '$1'
            )
            .replace(
              /\[([^\]]+)\]\([^)]+\)/g,
              '$1'
            )
            .replace(
              /^>\s?/gm,
              ''
            )
            .replace(
              /^\s*[-*]\s+/gm,
              '• '
            );

        plainText
          .split('\n')
          .forEach(
            (
              paragraph
            ) => {
              const text =
                paragraph.trim();

              if (!text) {
                y += 3;
                return;
              }

              drawText(
                text,
                8.5
              );
            }
          );
      }


      /* =====================================================
         9. DATASET SAMPLE
      ===================================================== */

      if (rows.length) {
        sectionHeading(
          '9. Dataset Sample',
          'Representative records from the available dataset preview.'
        );

        const sampleColumns =
          columns
            .map(
              (column) =>
                column.name
            )
            .filter(Boolean)
            .slice(0, 6);

        const sampleRows =
          rows
            .slice(0, 10)
            .map(
              (row) =>
                sampleColumns.map(
                  (column) =>
                    row?.[
                      column
                    ] ??
                    '—'
                )
            );

        drawTable(
          sampleColumns,
          sampleRows,
          sampleColumns.map(
            () =>
              contentWidth /
              Math.max(
                sampleColumns.length,
                1
              )
          )
        );
      }


      /* =====================================================
         10. CONCLUSION
      ===================================================== */

      sectionHeading(
        '10. Report Conclusion',
        'Automated summary of the DataPilot AI analysis lifecycle.'
      );

      drawText(
        'DataPilot AI completed an automated data-science workflow covering dataset profiling, data-quality assessment, exploratory analysis, statistical summaries and machine-learning analysis where applicable.',
        9
      );

      drawText(
        'This report is generated from the currently loaded dataset and the analysis results available in the DataPilot AI workspace.',
        9
      );

      footer();

      const baseName =
        String(
          dataset.filename ||
            'Dataset'
        )
          .replace(
            /\.[^/.]+$/,
            ''
          )
          .replace(
            /[^a-zA-Z0-9_-]+/g,
            '_'
          )
          .slice(
            0,
            50
          ) ||
        'Dataset';

      const filename =
        `DataPilot_AI_${baseName}_Professional_Report.pdf`;

      doc.save(filename);
    } catch (err) {
      console.error(
        'DataPilot AI PDF generation error:',
        err
      );

      setError(
        `PDF generation failed: ${
          err?.message ||
          'Unknown PDF error'
        }`
      );
    }
  };


  /* =========================================================
     UI DATA
  ========================================================= */

  const topCategorical =
    categoricalColumns.slice(
      0,
      4
    );

  const topNumeric =
    numericColumns.slice(
      0,
      MAX_NUMERIC_CHARTS
    );

  const qualityTone =
    getQualityTone(
      reportStats.quality
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Page
      title="Reports"
      sub="Generate, explore and export a complete professional DataPilot AI data science report."
    >

      {/* =====================================================
          HERO
      ===================================================== */}

      <div className="relative overflow-hidden rounded-3xl border border-indigo-400/10 bg-gradient-to-br from-indigo-500/[0.13] via-violet-500/[0.07] to-transparent p-6 md:p-8">

        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
              <Sparkles size={15} />
              Autonomous Reporting Studio

              <StatusBadge
                generated={
                  Boolean(markdown)
                }
              />
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
              Professional Data Science Report
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Convert your DataPilot AI workspace into a structured,
              executive-ready report covering dataset profiling,
              quality assessment, exploratory analytics,
              machine-learning results and AI-generated findings.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">

              <Badge variant="primary">
                <Database size={12} />
                Dataset grounded
              </Badge>

              <Badge variant="success">
                <Activity size={12} />
                Analytics ready
              </Badge>

              {model && (
                <Badge variant="warning">
                  <BrainCircuit size={12} />
                  ML results included
                </Badge>
              )}

              {markdown && (
                <Badge variant="success">
                  <CheckCircle2 size={12} />
                  AI narrative generated
                </Badge>
              )}

            </div>

          </div>


          <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">

            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur">

              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Report readiness
              </div>

              <div className="mt-1 flex items-baseline gap-1">

                <span className="text-2xl font-black text-white">
                  {readinessCount}
                </span>

                <span className="text-sm text-slate-500">
                  / {Object.keys(readiness).length}
                </span>

              </div>

            </div>

            <Button
              type="button"
              onClick={generate}
              loading={loading}
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : generatedAt ? (
                <RefreshCw size={17} />
              ) : (
                <Sparkles size={17} />
              )}

              {loading
                ? 'Generating...'
                : generatedAt
                ? 'Regenerate report'
                : 'Generate report'}
            </Button>

          </div>

        </div>
      </div>


      {/* =====================================================
          EXECUTIVE KPIs
      ===================================================== */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <MetricCard
          icon={BarChart3}
          label="Rows"
          value={formatNumber(
            reportStats.rows
          )}
          detail="Records available"
          tone="indigo"
        />

        <MetricCard
          icon={Layers3}
          label="Columns"
          value={formatNumber(
            reportStats.columns
          )}
          detail={`${numericColumns.length} numeric`}
          tone="violet"
        />

        <MetricCard
          icon={Gauge}
          label="Quality"
          value={`${reportStats.quality.toFixed(
            1
          )}/100`}
          detail={getQualityLabel(
            reportStats.quality
          )}
          tone="emerald"
        />

        <MetricCard
          icon={ShieldCheck}
          label="Missing"
          value={formatPercent(
            reportStats.missing
          )}
          detail="Missing data"
          tone={
            reportStats.missing > 10
              ? 'amber'
              : 'emerald'
          }
        />

        <MetricCard
          icon={BrainCircuit}
          label="Model"
          value={
            model?.best_model ||
            'Not trained'
          }
          detail={
            model?.problem_type ||
            'No ML results'
          }
          tone="cyan"
        />

      </div>


      {/* =====================================================
          REPORT GENERATOR
      ===================================================== */}

      <Card className="mt-6">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-2">
              <FileText
                size={18}
                className="text-indigo-300"
              />

              <h3 className="font-bold text-white">
                Report Generator
              </h3>
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Generate a fresh dataset-grounded AI report.
              The generated narrative becomes available below
              and can be copied, downloaded as Markdown, or
              exported as a professional PDF.
            </p>

            {generatedAt && (
              <div className="mt-2 text-xs text-slate-600">
                Last generated: {generatedAt}
              </div>
            )}

          </div>

          <div className="flex flex-wrap gap-3">

            <Button
              type="button"
              onClick={generate}
              loading={loading}
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Sparkles size={17} />
              )}

              {loading
                ? 'Generating...'
                : generatedAt
                ? 'Regenerate'
                : 'Generate report'}
            </Button>

            {markdown && (
              <>
                <button
                  type="button"
                  onClick={copyReport}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  {copied ? (
                    <Check size={17} />
                  ) : (
                    <Clipboard size={17} />
                  )}

                  {copied
                    ? 'Copied'
                    : 'Copy'}
                </button>

                <button
                  type="button"
                  onClick={
                    downloadMarkdown
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Download size={17} />
                  Markdown
                </button>

                <button
                  type="button"
                  onClick={
                    downloadPdf
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
                >
                  <Download size={17} />
                  Professional PDF
                </button>
              </>
            )}

          </div>

        </div>


        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/10 bg-red-500/5 p-4">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-300"
            />

            <div className="min-w-0">

              <div className="font-semibold text-red-200">
                Report operation failed
              </div>

              <p className="mt-1 text-sm leading-6 text-red-300/70">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="ml-auto shrink-0 text-slate-500 transition hover:text-white"
            >
              <X size={17} />
            </button>

          </div>
        )}

      </Card>


      {/* =====================================================
          REPORT READINESS
      ===================================================== */}

      <section className="mt-8">

        <SectionTitle
          icon={ShieldCheck}
          title="Report Readiness"
          description="A quick view of which DataPilot AI analysis components are currently available."
          badge={`${readinessCount}/${Object.keys(readiness).length} ready`}
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

          <ReadinessItem
            label="Dataset loaded"
            description="An active dataset is available."
            ready={readiness.dataset}
          />

          <ReadinessItem
            label="Dataset profiling"
            description="Structural profile information is available."
            ready={readiness.profile}
          />

          <ReadinessItem
            label="Quality assessment"
            description="Quality signals and scoring are available."
            ready={readiness.quality}
          />

          <ReadinessItem
            label="Exploratory analysis"
            description="Preview rows are available for analytics."
            ready={readiness.eda}
          />

          <ReadinessItem
            label="Machine learning"
            description="A trained model is available."
            ready={readiness.model}
          />

          <ReadinessItem
            label="AI narrative"
            description="The generated analytical narrative is ready."
            ready={readiness.ai}
          />

          <ReadinessItem
            label="Export"
            description="PDF and Markdown export are available."
            ready={readiness.export}
          />

        </div>

      </section>


      {/* =====================================================
          DATASET STRUCTURE
      ===================================================== */}

      <section className="mt-10">

        <SectionTitle
          icon={PieIcon}
          title="Dataset Structure"
          description="Detected field types and structural composition of the uploaded dataset."
        />

        <div className="grid gap-6 lg:grid-cols-2">

          <ChartCard
            title="Column Type Distribution"
            description="Numerical, categorical, date and boolean fields."
            height={320}
          >

            {typeData.length ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={typeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={58}
                    paddingAngle={3}
                  >
                    {typeData.map(
                      (_, index) => (
                        <Cell
                          key={index}
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
                    contentStyle={{
                      background:
                        '#0f172a',
                      border:
                        '1px solid rgba(255,255,255,.1)',
                      borderRadius:
                        '12px',
                      color:
                        '#fff',
                    }}
                  />

                  <Legend />

                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}

          </ChartCard>


          <Card>

            <SectionTitle
              icon={Table2}
              title="Dataset Profile"
              description="Core structure and quality indicators."
            />

            <div className="space-y-3">

              {[
                [
                  'Rows',
                  formatNumber(
                    reportStats.rows
                  ),
                ],
                [
                  'Columns',
                  formatNumber(
                    reportStats.columns
                  ),
                ],
                [
                  'Numeric fields',
                  formatNumber(
                    numericColumns.length
                  ),
                ],
                [
                  'Categorical fields',
                  formatNumber(
                    categoricalColumns.length
                  ),
                ],
                [
                  'Date fields',
                  formatNumber(
                    dateColumns.length
                  ),
                ],
                [
                  'Quality score',
                  `${reportStats.quality.toFixed(
                    1
                  )}/100`,
                ],
                [
                  'Missing data',
                  formatPercent(
                    reportStats.missing
                  ),
                ],
                [
                  'Duplicate rows',
                  formatNumber(
                    reportStats.duplicates
                  ),
                ],
              ].map(
                ([
                  label,
                  value,
                ]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                  >
                    <span className="text-sm text-slate-500">
                      {label}
                    </span>

                    <span className="font-bold text-white">
                      {value}
                    </span>
                  </div>
                )
              )}

            </div>

          </Card>

        </div>

      </section>


      {/* =====================================================
          DATA QUALITY
      ===================================================== */}

      <section className="mt-10">

        <SectionTitle
          icon={ShieldCheck}
          title="Data Quality"
          description="Missing-value patterns, quality scoring and dataset health signals."
        />

        <div className="grid gap-6 lg:grid-cols-2">

          <ChartCard
            title="Missing Values by Column"
            description="Columns with the largest number of missing records."
            height={340}
          >

            {missingData.length ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={missingData}
                  layout="vertical"
                  margin={{
                    left: 20,
                    right: 25,
                    top: 10,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.08}
                  />

                  <XAxis
                    type="number"
                    stroke="#64748b"
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    stroke="#64748b"
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        '#0f172a',
                      border:
                        '1px solid rgba(255,255,255,.1)',
                      borderRadius:
                        '12px',
                    }}
                    formatter={(
                      value,
                      name
                    ) => [
                      formatNumber(
                        value
                      ),
                      name ===
                      'missing'
                        ? 'Missing cells'
                        : name,
                    ]}
                  />

                  <Bar
                    dataKey="missing"
                    fill="#ef4444"
                    radius={[
                      0,
                      6,
                      6,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>
            ) : (
              <EmptyChart
                title="No missing values detected"
                text="The available dataset preview does not contain missing cells."
              />
            )}

          </ChartCard>


          <Card>

            <SectionTitle
              icon={Gauge}
              title="Quality Assessment"
              description="Automated interpretation of the quality signals returned by the profiling pipeline."
            />

            <div className="flex flex-col items-center gap-7 sm:flex-row">

              <QualityScore
                score={
                  reportStats.quality
                }
              />

              <div className="min-w-0 flex-1">

                <div
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${qualityTone.text} ${qualityTone.bg} ${qualityTone.border}`}
                >
                  {getQualityLabel(
                    reportStats.quality
                  )}
                </div>

                <h3 className="mt-3 text-xl font-black text-white">
                  Dataset health overview
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  The score summarizes the quality
                  signals returned by DataPilot AI.
                  It should be interpreted together
                  with missing data, duplicates,
                  outliers, EDA and domain context.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                    <div className="text-xs text-slate-600">
                      Issues
                    </div>

                    <div className="mt-1 text-lg font-black text-white">
                      {formatNumber(
                        reportStats.issues
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                    <div className="text-xs text-slate-600">
                      Duplicates
                    </div>

                    <div className="mt-1 text-lg font-black text-white">
                      {formatNumber(
                        reportStats.duplicates
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                    <div className="text-xs text-slate-600">
                      Missing
                    </div>

                    <div className="mt-1 text-lg font-black text-white">
                      {formatPercent(
                        reportStats.missing
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                    <div className="text-xs text-slate-600">
                      Outliers
                    </div>

                    <div className="mt-1 text-lg font-black text-white">
                      {formatNumber(
                        reportStats.outliers
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </Card>

        </div>

      </section>


      {/* =====================================================
          NUMERICAL ANALYSIS
      ===================================================== */}

      {topNumeric.length > 0 && (
        <section className="mt-10">

          <SectionTitle
            icon={TrendingUp}
            title="Numerical Analysis"
            description="Distribution and descriptive statistics for the primary numerical variables."
          />

          <div className="grid gap-6 lg:grid-cols-2">

            {topNumeric.map(
              (column) => {
                const data =
                  createHistogram(
                    dataset,
                    column.name
                  );

                return (
                  <ChartCard
                    key={
                      column.name
                    }
                    title={`${column.name} Distribution`}
                    description="Histogram generated from the available dataset preview."
                    height={300}
                  >

                    {data.length ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >

                        <BarChart
                          data={data}
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                            opacity={0.08}
                          />

                          <XAxis
                            dataKey="range"
                            stroke="#64748b"
                            tick={{
                              fontSize: 9,
                            }}
                          />

                          <YAxis
                            stroke="#64748b"
                          />

                          <Tooltip
                            contentStyle={{
                              background:
                                '#0f172a',
                              border:
                                '1px solid rgba(255,255,255,.1)',
                              borderRadius:
                                '12px',
                            }}
                          />

                          <Bar
                            dataKey="count"
                            fill="#6366f1"
                            radius={[
                              5,
                              5,
                              0,
                              0,
                            ]}
                          />

                        </BarChart>

                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart />
                    )}

                  </ChartCard>
                );
              }
            )}

          </div>


          <Card className="mt-6 overflow-x-auto">

            <SectionTitle
              icon={Table2}
              title="Numerical Statistics"
              description="Mean, median, minimum, maximum and standard deviation."
            />

            <table className="w-full min-w-[760px] text-left text-sm">

              <thead>

                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">

                  <th className="px-4 py-3">
                    Column
                  </th>

                  <th className="px-4 py-3">
                    Count
                  </th>

                  <th className="px-4 py-3">
                    Mean
                  </th>

                  <th className="px-4 py-3">
                    Median
                  </th>

                  <th className="px-4 py-3">
                    Min
                  </th>

                  <th className="px-4 py-3">
                    Max
                  </th>

                  <th className="px-4 py-3">
                    Std
                  </th>

                </tr>

              </thead>

              <tbody>

                {numericStats.map(
                  (item) => (
                    <tr
                      key={
                        item.name
                      }
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >

                      <td className="px-4 py-3 font-semibold text-white">
                        {item.name}
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {formatNumber(
                          item.count
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {formatNumber(
                          item.mean
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {formatNumber(
                          item.median
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {formatNumber(
                          item.min
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {formatNumber(
                          item.max
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {formatNumber(
                          item.std
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </Card>

        </section>
      )}


      {/* =====================================================
          CATEGORICAL ANALYSIS
      ===================================================== */}

      {topCategorical.length > 0 && (
        <section className="mt-10">

          <SectionTitle
            icon={BarChart3}
            title="Categorical Analysis"
            description="Frequency patterns across text, category and boolean fields."
          />

          <div className="grid gap-6 lg:grid-cols-2">

            {topCategorical.map(
              (column) => {
                const data =
                  createCategoryData(
                    dataset,
                    column.name
                  );

                return (
                  <ChartCard
                    key={
                      column.name
                    }
                    title={`${column.name} Distribution`}
                    description="Most frequent categories in the available dataset preview."
                    height={300}
                  >

                    {data.length ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >

                        <BarChart
                          data={data}
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                            opacity={0.08}
                          />

                          <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            tick={{
                              fontSize: 9,
                            }}
                          />

                          <YAxis
                            stroke="#64748b"
                          />

                          <Tooltip
                            contentStyle={{
                              background:
                                '#0f172a',
                              border:
                                '1px solid rgba(255,255,255,.1)',
                              borderRadius:
                                '12px',
                            }}
                          />

                          <Bar
                            dataKey="value"
                            fill="#8b5cf6"
                            radius={[
                              5,
                              5,
                              0,
                              0,
                            ]}
                          />

                        </BarChart>

                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart />
                    )}

                  </ChartCard>
                );
              }
            )}

          </div>

        </section>
      )}


      {/* =====================================================
          MACHINE LEARNING
      ===================================================== */}

      {model && (
        <section className="mt-10">

          <SectionTitle
            icon={BrainCircuit}
            title="Machine Learning Results"
            description="Model-selection, prediction target and feature-importance information returned by Model Lab."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <MetricCard
              icon={BrainCircuit}
              label="Problem type"
              value={
                model.problem_type ||
                'Detected'
              }
              detail="ML task"
              tone="violet"
            />

            <MetricCard
              icon={CheckCircle2}
              label="Best model"
              value={
                model.best_model ||
                'Available'
              }
              detail="Selected model"
              tone="emerald"
            />

            <MetricCard
              icon={Target}
              label="Target"
              value={
                model.target ||
                'Configured'
              }
              detail="Prediction target"
              tone="amber"
            />

            <MetricCard
              icon={BarChart3}
              label="Features"
              value={formatNumber(
                model.features
                  ?.length ||
                  model.feature_names
                    ?.length ||
                  0
              )}
              detail="Model input variables"
              tone="cyan"
            />

          </div>


          {modelMetrics.length > 0 && (
            <Card className="mt-6">

              <SectionTitle
                icon={Activity}
                title="Model Metrics"
                description="Performance metrics returned by the trained model."
              />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                {modelMetrics
                  .slice(0, 8)
                  .map(
                    (
                      metric
                    ) => (
                      <div
                        key={
                          metric.name
                        }
                        className="rounded-xl border border-white/5 bg-white/[0.025] p-4"
                      >

                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                          {
                            metric.name
                          }
                        </div>

                        <div className="mt-2 text-2xl font-black text-white">
                          {formatNumber(
                            metric.value
                          )}
                        </div>

                      </div>
                    )
                  )}

              </div>

            </Card>
          )}


          {featureImportance.length > 0 && (
            <ChartCard
              title="Top Feature Importance"
              description="Most influential model features available from the trained model."
              height={380}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={
                    featureImportance
                  }
                  layout="vertical"
                  margin={{
                    left: 40,
                    right: 30,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.08}
                  />

                  <XAxis
                    type="number"
                    stroke="#64748b"
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    stroke="#64748b"
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        '#0f172a',
                      border:
                        '1px solid rgba(255,255,255,.1)',
                      borderRadius:
                        '12px',
                    }}
                  />

                  <Bar
                    dataKey="value"
                    fill="#06b6d4"
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
          )}

        </section>
      )}


      {/* =====================================================
          AI REPORT
      ===================================================== */}

      {markdown && (
        <section className="mt-10">

          <SectionTitle
            icon={Sparkles}
            title="AI Analysis & Findings"
            description="Dataset-grounded analytical narrative generated by the DataPilot AI reporting engine."
            badge="AI generated"
          />

          <Card className="overflow-hidden">

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CheckCircle2
                  size={15}
                  className="text-emerald-300"
                />
                Report generated successfully

                {generatedAt && (
                  <span className="text-slate-700">
                    • {generatedAt}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={
                    copyReport
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  {copied ? (
                    <Check size={14} />
                  ) : (
                    <Clipboard
                      size={14}
                    />
                  )}

                  {copied
                    ? 'Copied'
                    : 'Copy'}
                </button>

                <button
                  type="button"
                  onClick={
                    downloadPdf
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-400"
                >
                  <Download
                    size={14}
                  />
                  PDF
                </button>

              </div>

            </div>

            <article className="prose prose-invert max-w-none prose-headings:text-white prose-h2:mb-3 prose-h2:mt-8 prose-h3:mb-2 prose-h3:mt-6 prose-p:text-slate-400 prose-p:leading-7 prose-strong:text-slate-200 prose-li:text-slate-400 prose-a:text-indigo-300 prose-code:text-indigo-300">

              <ReactMarkdown>
                {markdown}
              </ReactMarkdown>

            </article>

          </Card>

        </section>
      )}


      {/* =====================================================
          DATA PREVIEW
      ===================================================== */}

      {rows.length > 0 && (
        <section className="mt-10">

          <SectionTitle
            icon={Table2}
            title="Dataset Preview"
            description="Representative records currently available in the DataPilot AI workspace."
            badge={`${Math.min(
              rows.length,
              8
            )} rows shown`}
          />

          <Card className="overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px] text-left text-xs">

                <thead>

                  <tr className="border-b border-white/5 bg-white/[0.025] text-[10px] uppercase tracking-wider text-slate-500">

                    {columns
                      .slice(
                        0,
                        10
                      )
                      .map(
                        (
                          column
                        ) => (
                          <th
                            key={
                              column.name
                            }
                            className="px-4 py-3"
                          >
                            {
                              column.name
                            }
                          </th>
                        )
                      )}

                  </tr>

                </thead>

                <tbody>

                  {rows
                    .slice(0, 8)
                    .map(
                      (
                        row,
                        rowIndex
                      ) => (
                        <tr
                          key={
                            rowIndex
                          }
                          className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                        >

                          {columns
                            .slice(
                              0,
                              10
                            )
                            .map(
                              (
                                column
                              ) => (
                                <td
                                  key={
                                    column.name
                                  }
                                  className="max-w-[190px] truncate px-4 py-3 text-slate-400"
                                  title={String(
                                    row?.[
                                      column.name
                                    ] ??
                                      '—'
                                  )}
                                >
                                  {String(
                                    row?.[
                                      column.name
                                    ] ??
                                      '—'
                                  )}
                                </td>
                              )
                            )}

                        </tr>
                      )
                    )}

                </tbody>

              </table>

            </div>

          </Card>

        </section>
      )}


      {/* =====================================================
          EXPORT CENTER
      ===================================================== */}

      <section className="mt-10 pb-8">

        <SectionTitle
          icon={Download}
          title="Export Center"
          description="Download the generated report in a format suitable for documentation, sharing or presentation."
        />

        <div className="grid gap-4 md:grid-cols-3">

          <Card
            hover
            className="cursor-pointer"
            onClick={
              markdown
                ? downloadMarkdown
                : generate
            }
          >

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <FileText size={21} />
            </div>

            <h3 className="mt-4 font-bold text-white">
              Markdown Report
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Editable report suitable for documentation,
              GitHub, research notes and further processing.
            </p>

            <div className="mt-4">
              <Badge variant="primary">
                {markdown
                  ? 'Download'
                  : 'Generate first'}
              </Badge>
            </div>

          </Card>


          <Card
            hover
            className="cursor-pointer border-indigo-400/20"
            onClick={
              markdown
                ? downloadPdf
                : generate
            }
          >

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <Download size={21} />
            </div>

            <h3 className="mt-4 font-bold text-white">
              Professional PDF
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Complete A4 report with executive metrics,
              charts, statistics, quality analysis, ML
              results and AI findings.
            </p>

            <div className="mt-4">
              <Badge variant="primary">
                Recommended
              </Badge>
            </div>

          </Card>


          <Card>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <ShieldCheck size={21} />
            </div>

            <h3 className="mt-4 font-bold text-white">
              Dataset Grounded
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Report content is based on the currently
              loaded dataset and analysis results available
              in the DataPilot AI workspace.
            </p>

            <div className="mt-4">
              <Badge variant="success">
                Verified source
              </Badge>
            </div>

          </Card>

        </div>

      </section>

    </Page>
  );
}


/* =========================================================
   HEX → RGB
========================================================= */

function hexToRgb(hex) {
  const clean =
    String(hex)
      .replace('#', '');

  const bigint =
    parseInt(
      clean,
      16
    );

  if (
    Number.isNaN(bigint)
  ) {
    return [
      99,
      102,
      241,
    ];
  }

  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    bigint & 255,
  ];
}
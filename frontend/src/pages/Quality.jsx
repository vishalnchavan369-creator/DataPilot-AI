import { useMemo } from 'react';

import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  FileWarning,
  Info,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  WandSparkles,
  XCircle,
  Zap,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

import {
  Badge,
  Card,
  Empty,
  Page,
} from '../components/UI';

/* =========================================================
   HELPERS
========================================================= */

function clamp(value, min = 0, max = 100) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
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

  return number.toLocaleString();
}

function formatDimensionName(name) {
  return String(name || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getScoreLabel(score) {
  const value = clamp(score);

  if (value >= 90) return 'Excellent';
  if (value >= 75) return 'Good';
  if (value >= 50) return 'Fair';

  return 'Needs Review';
}

function getScoreDescription(score) {
  const value = clamp(score);

  if (value >= 90) {
    return 'The dataset currently shows strong structural and quality signals.';
  }

  if (value >= 75) {
    return 'The dataset is generally usable, but some quality improvements may still be beneficial.';
  }

  if (value >= 50) {
    return 'Several quality signals require attention before relying heavily on downstream analysis.';
  }

  return 'Important quality issues were detected and should be reviewed before modeling.';
}

function getScoreClass(score) {
  const value = clamp(score);

  if (value >= 90) {
    return {
      text: 'text-emerald-300',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-400/10',
    };
  }

  if (value >= 75) {
    return {
      text: 'text-indigo-300',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-400/10',
    };
  }

  if (value >= 50) {
    return {
      text: 'text-amber-300',
      bg: 'bg-amber-500/10',
      border: 'border-amber-400/10',
    };
  }

  return {
    text: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-400/10',
  };
}

function getSeverityValue(severity) {
  const value = String(severity || '').toLowerCase();

  if (
    value === 'critical' ||
    value === 'high'
  ) {
    return 'high';
  }

  if (value === 'medium') {
    return 'medium';
  }

  return 'low';
}

function getSeverityClass(severity) {
  const value = getSeverityValue(severity);

  if (value === 'high') {
    return 'bg-red-500/10 text-red-300 border-red-400/10';
  }

  if (value === 'medium') {
    return 'bg-amber-500/10 text-amber-300 border-amber-400/10';
  }

  return 'bg-sky-500/10 text-sky-300 border-sky-400/10';
}

function getSeverityIcon(severity) {
  const value = getSeverityValue(severity);

  if (value === 'high') {
    return AlertCircle;
  }

  if (value === 'medium') {
    return AlertTriangle;
  }

  return Info;
}

function getSeverityRank(severity) {
  const value = getSeverityValue(severity);

  if (value === 'high') return 3;
  if (value === 'medium') return 2;

  return 1;
}

function getIssueTitle(issue) {
  return (
    issue?.type ||
    issue?.name ||
    issue?.category ||
    'Data quality issue'
  );
}

function getIssueMessage(issue) {
  return (
    issue?.message ||
    issue?.description ||
    issue?.details ||
    'Review this issue before continuing with analysis.'
  );
}

function getIssueCount(issue) {
  if (
    issue?.count !== undefined &&
    issue?.count !== null
  ) {
    return Number(issue.count) || 0;
  }

  if (
    issue?.affected !== undefined &&
    issue?.affected !== null
  ) {
    return Number(issue.affected) || 0;
  }

  return null;
}

/* =========================================================
   ICON / UI COMPONENTS
========================================================= */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/10 bg-indigo-500/10 text-indigo-300">
          <Icon size={19} />
        </div>

        <div>
          <h3 className="font-bold text-white">
            {title}
          </h3>

          {subtitle && (
            <p className="mt-1 text-sm leading-5 text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {badge}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'indigo',
  warning = false,
}) {
  const tones = {
    indigo: 'text-indigo-300 bg-indigo-500/10',
    cyan: 'text-cyan-300 bg-cyan-500/10',
    emerald: 'text-emerald-300 bg-emerald-500/10',
    amber: 'text-amber-300 bg-amber-500/10',
    red: 'text-red-300 bg-red-500/10',
    violet: 'text-violet-300 bg-violet-500/10',
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${
        warning
          ? 'border-amber-400/10 bg-amber-500/[0.035]'
          : 'border-white/5 bg-white/[0.025]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            tones[tone] || tones.indigo
          }`}
        >
          <Icon size={17} />
        </div>

        {warning && (
          <TriangleAlert
            size={15}
            className="text-amber-300"
          />
        )}
      </div>

      <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-2xl font-black text-white">
        {value}
      </div>

      {detail && (
        <div className="mt-1 text-xs leading-5 text-slate-500">
          {detail}
        </div>
      )}
    </div>
  );
}

function DimensionRow({
  name,
  value,
}) {
  const score = clamp(value);
  const label = getScoreLabel(score);
  const classes = getScoreClass(score);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-300">
            {formatDimensionName(name)}
          </span>

          <span
            className={`hidden rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:inline-flex ${classes.text} ${classes.bg} ${classes.border}`}
          >
            {label}
          </span>
        </div>

        <span className="shrink-0 text-sm font-black text-white">
          {score.toFixed(0)}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-700"
          style={{
            width: `${score}%`,
          }}
        />
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  positive,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.025] px-3 py-3">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span
        className={`text-sm font-bold ${
          positive
            ? 'text-emerald-300'
            : 'text-amber-300'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   SCORE RING
========================================================= */

function ScoreRing({
  score,
}) {
  const safeScore = clamp(score);
  const classes = getScoreClass(safeScore);

  return (
    <div className="relative shrink-0">
      <div
        className="grid h-44 w-44 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#818cf8 ${safeScore}%, rgba(255,255,255,.06) 0)`,
        }}
      >
        <div className="grid h-36 w-36 place-items-center rounded-full bg-slate-950 shadow-inner">
          <div className="text-center">
            <div className="text-4xl font-black text-white">
              {safeScore.toFixed(0)}
            </div>

            <div
              className={`mt-1 text-xs font-semibold ${classes.text}`}
            >
              {getScoreLabel(safeScore)}
            </div>

            <div className="mt-1 text-[10px] text-slate-600">
              OUT OF 100
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ISSUE CARD
========================================================= */

function IssueCard({
  issue,
  index,
}) {
  const Icon = getSeverityIcon(
    issue?.severity
  );

  const severity = getSeverityValue(
    issue?.severity
  );

  const count = getIssueCount(issue);

  return (
    <div className="group flex gap-4 border-b border-white/5 py-5 last:border-b-0">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${getSeverityClass(
          issue?.severity
        )}`}
      >
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold text-slate-200">
            {getIssueTitle(issue)}
          </h4>

          <span
            className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${getSeverityClass(
              issue?.severity
            )}`}
          >
            {issue?.severity || 'info'}
          </span>

          {count !== null && (
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-500">
              {formatNumber(count)} affected
            </span>
          )}
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {getIssueMessage(issue)}
        </p>

        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          <span>Priority</span>

          <span
            className={
              severity === 'high'
                ? 'text-red-300'
                : severity === 'medium'
                  ? 'text-amber-300'
                  : 'text-sky-300'
            }
          >
            {severity === 'high'
              ? 'Immediate review'
              : severity === 'medium'
                ? 'Recommended'
                : 'Monitor'}
          </span>
        </div>
      </div>

      <div className="hidden items-center sm:flex">
        <span className="text-xs text-slate-700">
          #{index + 1}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   ISSUE DISTRIBUTION
========================================================= */

function SeverityDistribution({
  high,
  medium,
  low,
  total,
}) {
  const safeTotal = Math.max(
    total,
    1
  );

  const items = [
    {
      label: 'High',
      value: high,
      color: 'bg-red-400',
      text: 'text-red-300',
    },
    {
      label: 'Medium',
      value: medium,
      color: 'bg-amber-400',
      text: 'text-amber-300',
    },
    {
      label: 'Info',
      value: low,
      color: 'bg-sky-400',
      text: 'text-sky-300',
    },
  ];

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const percentage =
          (item.value / safeTotal) * 100;

        return (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${item.color}`}
                />

                <span className="text-sm text-slate-400">
                  {item.label}
                </span>
              </div>

              <span
                className={`text-sm font-bold ${item.text}`}
              >
                {item.value}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   READINESS
========================================================= */

function ReadinessCard({
  score,
  issues,
  missingPct,
  duplicates,
  outliers,
}) {
  const highIssues = issues.filter(
    (issue) =>
      getSeverityValue(issue?.severity) ===
      'high'
  ).length;

  let readiness = 'Ready for review';
  let description =
    'The dataset can continue through the analysis workflow, but review the quality signals before final modeling.';

  let tone =
    'border-amber-400/10 bg-amber-500/5';

  let icon =
    AlertTriangle;

  if (
    score >= 90 &&
    highIssues === 0
  ) {
    readiness = 'Strong readiness';
    description =
      'The current quality signals do not show major blockers for exploratory analysis or modeling.';
    tone =
      'border-emerald-400/10 bg-emerald-500/5';
    icon = CheckCircle2;
  } else if (
    score < 50 ||
    highIssues >= 2
  ) {
    readiness = 'Needs attention';
    description =
      'Significant quality signals should be reviewed before depending on model results.';
    tone =
      'border-red-400/10 bg-red-500/5';
    icon = XCircle;
  }

  const Icon = icon;

  return (
    <div
      className={`rounded-2xl border p-5 ${tone}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
          <Icon size={19} />
        </div>

        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Modeling readiness
          </div>

          <h3 className="mt-1 font-bold text-white">
            {readiness}
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-white/[0.03] p-3">
          <div className="text-slate-600">
            Missing
          </div>

          <div className="mt-1 font-bold text-slate-300">
            {missingPct}%
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] p-3">
          <div className="text-slate-600">
            Duplicates
          </div>

          <div className="mt-1 font-bold text-slate-300">
            {formatNumber(duplicates)}
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] p-3">
          <div className="text-slate-600">
            Outliers
          </div>

          <div className="mt-1 font-bold text-slate-300">
            {formatNumber(outliers)}
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] p-3">
          <div className="text-slate-600">
            High issues
          </div>

          <div className="mt-1 font-bold text-slate-300">
            {highIssues}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ACTION PLAN
========================================================= */

function ActionPlan({
  issues,
  missingPct,
  duplicates,
  outliers,
}) {
  const actions = [];

  if (missingPct > 10) {
    actions.push({
      priority: 'High',
      title: 'Investigate missing values',
      description:
        'A relatively high amount of missing data was detected. Review affected columns before training models.',
    });
  } else if (missingPct > 0) {
    actions.push({
      priority: 'Medium',
      title: 'Review missing values',
      description:
        'Some missing values exist. Check whether they require imputation, removal, or domain-specific handling.',
    });
  }

  if (duplicates > 0) {
    actions.push({
      priority: 'High',
      title: 'Check duplicate records',
      description:
        'Duplicate rows may distort statistics and model training if they represent repeated observations rather than valid records.',
    });
  }

  if (outliers > 0) {
    actions.push({
      priority: 'Medium',
      title: 'Investigate potential outliers',
      description:
        'Potential unusual observations were detected. Determine whether they are valid observations or data-entry problems.',
    });
  }

  const highIssues = issues.filter(
    (issue) =>
      getSeverityValue(issue?.severity) ===
      'high'
  );

  if (highIssues.length > 0) {
    actions.push({
      priority: 'High',
      title: 'Resolve high-severity issues',
      description:
        'Review the highest-severity findings before relying on downstream model results.',
    });
  }

  if (!actions.length) {
    actions.push({
      priority: 'Low',
      title: 'Continue to exploratory analysis',
      description:
        'No major quality action was identified from the current profile. Continue with EDA and model validation.',
    });
  }

  return (
    <div className="space-y-3">
      {actions.slice(0, 5).map(
        (action, index) => (
          <div
            key={`${action.title}-${index}`}
            className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              {index + 1}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-slate-200">
                  {action.title}
                </h4>

                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    action.priority ===
                    'High'
                      ? 'border-red-400/10 bg-red-500/10 text-red-300'
                      : action.priority ===
                          'Medium'
                        ? 'border-amber-400/10 bg-amber-500/10 text-amber-300'
                        : 'border-emerald-400/10 bg-emerald-500/10 text-emerald-300'
                  }`}
                >
                  {action.priority}
                </span>
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {action.description}
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   QUALITY SCORE EXPLANATION
========================================================= */

function ScoreExplanation() {
  return (
    <div className="rounded-2xl border border-indigo-400/10 bg-indigo-500/[0.035] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
          <Info size={17} />
        </div>

        <div>
          <h4 className="text-sm font-bold text-white">
            How to interpret this score
          </h4>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            The quality score is a summary of the signals
            returned by the dataset profiling engine. It is
            useful as a health indicator, but it does not prove
            that the dataset is unbiased, representative, or
            appropriate for every modeling task.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-xl bg-white/[0.025] p-3">
          <div className="text-xs font-bold text-emerald-300">
            90–100
          </div>
          <div className="mt-1 text-[10px] text-slate-600">
            Excellent
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.025] p-3">
          <div className="text-xs font-bold text-indigo-300">
            75–89
          </div>
          <div className="mt-1 text-[10px] text-slate-600">
            Good
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.025] p-3">
          <div className="text-xs font-bold text-amber-300">
            50–74
          </div>
          <div className="mt-1 text-[10px] text-slate-600">
            Fair
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.025] p-3">
          <div className="text-xs font-bold text-red-300">
            0–49
          </div>
          <div className="mt-1 text-[10px] text-slate-600">
            Needs review
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   GUIDANCE CARD
========================================================= */

function GuidanceCard({
  icon: Icon,
  title,
  text,
}) {
  return (
    <Card>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
        <Icon size={19} />
      </div>

      <h3 className="mt-4 font-bold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {text}
      </p>
    </Card>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function Quality() {
  const { dataset } = useApp();

  const analysis = useMemo(() => {
    if (!dataset) {
      return null;
    }

    const profile =
      dataset.profile || {};

    const qualityScore = clamp(
      profile.quality_score ??
        profile.qualityScore ??
        0
    );

    const dimensions =
      profile.dimensions || {};

    const issues = Array.isArray(
      profile.issues
    )
      ? [...profile.issues].sort(
          (a, b) =>
            getSeverityRank(
              b?.severity
            ) -
            getSeverityRank(
              a?.severity
            )
        )
      : [];

    const columns = Array.isArray(
      profile.columns
    )
      ? profile.columns
      : [];

    const missing =
      Number(
        profile.missing_values ??
          profile.missing ??
          0
      ) || 0;

    const duplicates =
      Number(
        profile.duplicates ??
          profile.duplicate_rows ??
          0
      ) || 0;

    const outliers =
      Number(
        profile.outliers
      ) || 0;

    const missingPct = Math.max(
      0,
      Number(
        profile.missing_pct ??
          profile.missing_percentage ??
          0
      ) || 0
    );

    const numericColumns =
      columns.filter(
        (column) =>
          column?.kind ===
          'numeric' ||
          column?.type ===
          'numeric'
      );

    const categoricalColumns =
      columns.filter(
        (column) =>
          column?.kind !==
            'numeric' &&
          column?.type !==
            'numeric'
      );

    const highIssues =
      issues.filter(
        (issue) =>
          getSeverityValue(
            issue?.severity
          ) === 'high'
      );

    const mediumIssues =
      issues.filter(
        (issue) =>
          getSeverityValue(
            issue?.severity
          ) === 'medium'
      );

    const lowIssues =
      issues.filter(
        (issue) =>
          getSeverityValue(
            issue?.severity
          ) === 'low'
      );

    return {
      qualityScore,
      dimensions,
      issues,
      columns,
      missing,
      duplicates,
      outliers,
      missingPct,
      numericColumns,
      categoricalColumns,
      highIssues,
      mediumIssues,
      lowIssues,
    };
  }, [dataset]);

  if (!dataset) {
    return (
      <Page
        title="Data Quality"
        sub="Measure dataset health, identify problems, and prioritize cleaning."
      >
        <Empty text="Upload a dataset first to generate its quality assessment." />
      </Page>
    );
  }

  const a = analysis;

  const healthLabel =
    getScoreLabel(
      a.qualityScore
    );

  const cleanDataset =
    a.issues.length === 0 &&
    a.qualityScore >= 90;

  return (
    <Page
      title="Data Quality"
      sub="Understand dataset health, detect quality problems, and prepare reliable data for EDA and machine learning."
    >
      {/* =====================================================
          HERO
      ====================================================== */}

      <div className="relative overflow-hidden rounded-3xl border border-indigo-400/10 bg-gradient-to-br from-indigo-500/[0.12] via-violet-500/[0.06] to-cyan-500/[0.025] p-6 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
              <ShieldCheck size={15} />

              Dataset Health Assessment

              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] text-slate-500">
                AI PROFILE
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
              {healthLabel}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              DataPilot AI evaluates structural quality,
              missing values, duplicates, potential outliers,
              and other profiling signals before the dataset
              moves deeper into the analytics and modeling
              workflow.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="primary">
                <Database size={13} />
                {formatNumber(
                  dataset.rows ??
                    dataset.row_count ??
                    '—'
                )}{' '}
                rows
              </Badge>

              <Badge>
                <Layers3 size={13} />
                {a.columns.length} columns
              </Badge>

              {a.issues.length === 0 ? (
                <Badge variant="success">
                  <Check size={13} />
                  No detected issues
                </Badge>
              ) : (
                <Badge variant="warning">
                  <TriangleAlert size={13} />
                  {a.issues.length} issues
                </Badge>
              )}
            </div>
          </div>

          <ScoreRing
            score={a.qualityScore}
          />
        </div>
      </div>

      {/* =====================================================
          QUICK HEALTH METRICS
      ====================================================== */}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Database}
          label="Columns"
          value={a.columns.length}
          detail={`${a.numericColumns.length} numeric · ${a.categoricalColumns.length} categorical`}
          tone="indigo"
        />

        <StatCard
          icon={FileWarning}
          label="Missing"
          value={`${a.missingPct}%`}
          detail={`${formatNumber(
            a.missing
          )} affected cells`}
          tone="amber"
          warning={a.missingPct > 10}
        />

        <StatCard
          icon={AlertTriangle}
          label="Duplicates"
          value={formatNumber(
            a.duplicates
          )}
          detail="Potential duplicate records"
          tone="red"
          warning={a.duplicates > 0}
        />

        <StatCard
          icon={TrendingDown}
          label="Outliers"
          value={formatNumber(
            a.outliers
          )}
          detail="Potential unusual observations"
          tone="violet"
          warning={a.outliers > 0}
        />
      </div>

      {/* =====================================================
          READINESS + SCORE EXPLANATION
      ====================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ReadinessCard
          score={a.qualityScore}
          issues={a.issues}
          missingPct={a.missingPct}
          duplicates={a.duplicates}
          outliers={a.outliers}
        />

        <ScoreExplanation />
      </div>

      {/* =====================================================
          QUALITY DIMENSIONS
      ====================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader
            icon={BarChart3}
            title="Quality dimensions"
            subtitle="Individual health indicators returned by the dataset profiling engine."
            badge={
              <span className="hidden rounded-full border border-white/5 bg-white/[0.025] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:block">
                {Object.keys(
                  a.dimensions
                ).length}{' '}
                dimensions
              </span>
            }
          />

          {Object.keys(
            a.dimensions
          ).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(
                a.dimensions
              ).map(
                ([name, value]) => (
                  <DimensionRow
                    key={name}
                    name={name}
                    value={value}
                  />
                )
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-8 text-center">
              <Info
                size={24}
                className="mx-auto text-slate-600"
              />

              <p className="mt-3 text-sm text-slate-500">
                Quality dimension data is not available
                for this dataset.
              </p>
            </div>
          )}
        </Card>

        {/* HEALTH SUMMARY */}

        <Card>
          <SectionHeader
            icon={Sparkles}
            title="Health summary"
            subtitle="Quick interpretation of the current assessment."
          />

          <div className="space-y-3">
            <SummaryRow
              label="Overall score"
              value={`${a.qualityScore.toFixed(
                0
              )}/100`}
              positive={
                a.qualityScore >= 75
              }
            />

            <SummaryRow
              label="High severity"
              value={
                a.highIssues.length
              }
              positive={
                a.highIssues.length ===
                0
              }
            />

            <SummaryRow
              label="Medium severity"
              value={
                a.mediumIssues.length
              }
              positive={
                a.mediumIssues.length ===
                0
              }
            />

            <SummaryRow
              label="Total issues"
              value={a.issues.length}
              positive={
                a.issues.length ===
                0
              }
            />
          </div>

          <div
            className={`mt-5 rounded-2xl border p-4 ${
              cleanDataset
                ? 'border-emerald-400/10 bg-emerald-500/5'
                : 'border-amber-400/10 bg-amber-500/5'
            }`}
          >
            {cleanDataset ? (
              <CheckCircle2
                size={20}
                className="text-emerald-300"
              />
            ) : (
              <AlertTriangle
                size={20}
                className="text-amber-300"
              />
            )}

            <div className="mt-3">
              <div className="font-bold text-white">
                {cleanDataset
                  ? 'Strong current quality signal'
                  : 'Review recommended'}
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {getScoreDescription(
                  a.qualityScore
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================
          ISSUE OVERVIEW
      ====================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <SectionHeader
            icon={TriangleAlert}
            title="Issue distribution"
            subtitle="Breakdown of detected issue severity."
          />

          {a.issues.length > 0 ? (
            <SeverityDistribution
              high={
                a.highIssues.length
              }
              medium={
                a.mediumIssues.length
              }
              low={
                a.lowIssues.length
              }
              total={
                a.issues.length
              }
            />
          ) : (
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-500/5 p-5 text-center">
              <CheckCircle2
                size={24}
                className="mx-auto text-emerald-300"
              />

              <p className="mt-3 text-sm font-semibold text-white">
                No issues detected
              </p>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeader
            icon={Zap}
            title="Recommended action plan"
            subtitle="Practical next steps based on the current quality signals."
            badge={
              <span className="hidden text-[10px] font-bold uppercase tracking-widest text-indigo-300 sm:block">
                AI Guidance
              </span>
            }
          />

          <ActionPlan
            issues={a.issues}
            missingPct={a.missingPct}
            duplicates={a.duplicates}
            outliers={a.outliers}
          />
        </Card>
      </div>

      {/* =====================================================
          DETECTED ISSUES
      ====================================================== */}

      <Card className="mt-6">
        <SectionHeader
          icon={AlertCircle}
          title="Detected issues"
          subtitle="Issues are ordered from higher to lower severity."
          badge={
            a.issues.length > 0 ? (
              <span className="rounded-full border border-red-400/10 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300">
                {a.issues.length} detected
              </span>
            ) : (
              <span className="rounded-full border border-emerald-400/10 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Clean
              </span>
            )
          }
        />

        {a.issues.length > 0 ? (
          <div>
            {a.issues.map(
              (issue, index) => (
                <IssueCard
                  key={`${getIssueTitle(
                    issue
                  )}-${index}`}
                  issue={issue}
                  index={index}
                />
              )
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-400/10 bg-emerald-500/5 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
              <CheckCircle2
                size={30}
                className="text-emerald-300"
              />
            </div>

            <h3 className="mt-5 font-bold text-white">
              No major quality issues detected
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              The current profiling engine did not report
              any data quality issues for this dataset.
              Continue with EDA and model validation.
            </p>
          </div>
        )}
      </Card>

      {/* =====================================================
          DATASET PROFILE
      ====================================================== */}

      <Card className="mt-6">
        <SectionHeader
          icon={Layers3}
          title="Dataset structure"
          subtitle="High-level composition of the columns detected by the profiling engine."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              <HashIcon />
              Numeric
            </div>

            <div className="mt-3 text-3xl font-black text-white">
              {
                a.numericColumns
                  .length
              }
            </div>

            <p className="mt-1 text-xs text-slate-600">
              Continuous or discrete numerical fields.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              <TypeIcon />
              Categorical / Text
            </div>

            <div className="mt-3 text-3xl font-black text-white">
              {
                a.categoricalColumns
                  .length
              }
            </div>

            <p className="mt-1 text-xs text-slate-600">
              Categories, labels, and non-numeric fields.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              <Database size={14} />
              Total fields
            </div>

            <div className="mt-3 text-3xl font-black text-white">
              {a.columns.length}
            </div>

            <p className="mt-1 text-xs text-slate-600">
              Columns available for downstream analysis.
            </p>
          </div>
        </div>
      </Card>

      {/* =====================================================
          GUIDANCE
      ====================================================== */}

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <GuidanceCard
          icon={Target}
          title="Before modeling"
          text="Review missing values, duplicates, unusual observations, and target quality before training models."
        />

        <GuidanceCard
          icon={TrendingUp}
          title="During analysis"
          text="Use EDA to determine whether detected quality problems actually affect important variables or relationships."
        />

        <GuidanceCard
          icon={ShieldCheck}
          title="For reliable results"
          text="Combine data quality checks with validation metrics, explainability, domain knowledge, and appropriate preprocessing."
        />
      </div>

      {/* =====================================================
          FINAL AI NOTE
      ====================================================== */}

      <div className="mt-6 rounded-3xl border border-indigo-400/10 bg-gradient-to-r from-indigo-500/[0.06] via-violet-500/[0.04] to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
            <WandSparkles size={20} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-white">
                DataPilot AI quality insight
              </h3>

              <span className="rounded-full border border-indigo-400/10 bg-indigo-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-indigo-300">
                Automated
              </span>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {a.qualityScore >= 90 &&
              a.issues.length === 0
                ? 'The current profiling results indicate a strong dataset health signal. Continue with exploratory analysis and model validation while still checking whether the data is representative of the real-world problem.'
                : a.highIssues.length >
                    0
                  ? 'High-severity quality signals are present. Review those findings before treating downstream model results as reliable.'
                  : 'The dataset can continue through the analytics workflow, but the detected quality signals should be considered during preprocessing and model validation.'}
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}

/* =========================================================
   SMALL ICON HELPERS
========================================================= */

function HashIcon() {
  return (
    <span className="text-emerald-300">
      #
    </span>
  );
}

function TypeIcon() {
  return (
    <span className="font-bold text-violet-300">
      T
    </span>
  );
}
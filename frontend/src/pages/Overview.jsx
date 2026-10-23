import { useMemo, useRef } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Gauge,
  Layers3,
  RefreshCw,
  Sparkles,
  Target,
  Upload,
  WandSparkles,
  Zap,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import {
  Button,
  Card,
  Empty,
  Fade,
  Metric,
  Page,
} from '../components/UI';

function formatNumber(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const n = Number(value);

  if (Number.isNaN(n)) {
    return value;
  }

  return n.toLocaleString();
}

function qualityLabel(score) {
  const value = Number(score) || 0;

  if (value >= 90) return 'Excellent';
  if (value >= 75) return 'Good';
  if (value >= 50) return 'Fair';
  return 'Needs review';
}

function qualityClass(score) {
  const value = Number(score) || 0;

  if (value >= 90) {
    return 'text-emerald-300 bg-emerald-500/10 border-emerald-400/10';
  }

  if (value >= 75) {
    return 'text-indigo-300 bg-indigo-500/10 border-indigo-400/10';
  }

  if (value >= 50) {
    return 'text-amber-300 bg-amber-500/10 border-amber-400/10';
  }

  return 'text-red-300 bg-red-500/10 border-red-400/10';
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
        <Icon size={19} />
      </div>

      <div>
        <h3 className="font-bold text-white">{title}</h3>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusDot({ active = true }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        active
          ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.5)]'
          : 'bg-slate-600'
      }`}
    />
  );
}

function PipelineStep({ number, title, description, active = true }) {
  return (
    <div className="group relative flex gap-4">
      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-400/10 bg-indigo-500/10 text-xs font-bold text-indigo-300">
        {number}
      </div>

      <div className="min-w-0 flex-1 pb-5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">
            {title}
          </span>

          <StatusDot active={active} />
        </div>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function HealthItem({ label, value, status, warning = false }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] p-4">
      <div>
        <div className="text-sm font-semibold text-slate-300">
          {label}
        </div>

        <div className="mt-1 text-xs text-slate-500">
          {value}
        </div>
      </div>

      <span
        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
          warning
            ? 'border-amber-400/10 bg-amber-500/10 text-amber-300'
            : 'border-emerald-400/10 bg-emerald-500/10 text-emerald-300'
        }`}
      >
        {status}
      </span>
    </div>
  );
}

export default function Overview() {
  const {
    dataset,
    busy,
    error,
    load,
  } = useApp();

  const ref = useRef(null);

  const onFile = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      load(file);
    }

    event.target.value = '';
  };

  const analysis = useMemo(() => {
    if (!dataset) return null;

    const profile = dataset.profile || {};

    const rows = Number(profile.rows) || 0;
    const cols = Number(profile.cols) || 0;
    const quality = Number(profile.quality_score) || 0;
    const missingPct = Number(profile.missing_pct) || 0;
    const duplicates =
      Number(profile.duplicates ?? profile.duplicate_rows) || 0;
    const outliers = Number(profile.outliers) || 0;

    const columns = profile.columns || [];
    const numericColumns = profile.numeric_columns || [];
    const categoricalColumns =
      profile.categorical_columns || [];

    return {
      rows,
      cols,
      quality,
      missingPct,
      duplicates,
      outliers,
      columns,
      numericColumns,
      categoricalColumns,
    };
  }, [dataset]);

  if (!dataset) {
    return (
      <Page
        title="Overview"
        sub="Load a dataset and DataPilot will build your autonomous analysis workspace."
      >
        {/* UPLOAD HERO */}
        <Card className="relative overflow-hidden border-indigo-400/20">
          <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative border-2 border-dashed border-indigo-400/20 rounded-3xl p-10 text-center md:p-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300 shadow-lg shadow-indigo-950/30">
              {busy ? (
                <RefreshCw
                  size={34}
                  className="animate-spin"
                />
              ) : (
                <Upload size={34} />
              )}
            </div>

            <div className="mt-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/10 bg-indigo-500/5 px-3 py-1.5 text-xs font-semibold text-indigo-300">
                <Sparkles size={13} />
                Autonomous Data Science
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl">
                Start with your dataset
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
                Upload your data and DataPilot will automatically
                profile, evaluate quality, explore relationships,
                detect machine-learning opportunities, and prepare
                your analysis workspace.
              </p>
            </div>

            <input
              ref={ref}
              onChange={onFile}
              type="file"
              accept=".csv,.tsv,.xlsx,.xls,.json,.parquet"
              className="hidden"
            />

            <div className="mt-7 flex flex-col items-center gap-3">
              <Button
                onClick={() => ref.current?.click()}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="animate-spin"
                    />
                    Analyzing dataset...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={18} />
                    Choose dataset
                  </>
                )}
              </Button>

              <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-600">
                <span>CSV</span>
                <span>•</span>
                <span>TSV</span>
                <span>•</span>
                <span>Excel</span>
                <span>•</span>
                <span>JSON</span>
                <span>•</span>
                <span>Parquet</span>
              </div>
            </div>

            {error && (
              <div className="mx-auto mt-6 max-w-xl rounded-xl border border-red-400/10 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        </Card>

        {/* CAPABILITIES */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric
            label="Automatic Profiling"
            value="Ready"
            detail="Pandas + statistical analysis"
          />

          <Metric
            label="Machine Learning"
            value="Ready"
            detail="Classification / regression"
          />

          <Metric
            label="Explainability"
            value="Included"
            detail="Feature importance analysis"
          />
        </div>

        {/* WORKFLOW PREVIEW */}
        <Card className="mt-6">
          <SectionHeader
            icon={WandSparkles}
            title="Autonomous workflow"
            subtitle="DataPilot transforms a raw dataset into an analysis workspace."
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {[
              ['01', 'Profile', 'Understand the dataset'],
              ['02', 'Quality', 'Detect data problems'],
              ['03', 'Explore', 'Discover patterns'],
              ['04', 'Model', 'Train ML baselines'],
              ['05', 'Explain', 'Understand predictions'],
            ].map(([number, title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/5 bg-white/[0.025] p-4"
              >
                <div className="text-xs font-bold text-indigo-300">
                  {number}
                </div>

                <div className="mt-3 font-bold text-white">
                  {title}
                </div>

                <div className="mt-1 text-xs leading-5 text-slate-500">
                  {description}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Page>
    );
  }

  const p = analysis;

  const healthItems = [
    {
      label: 'Missing values',
      value: `${p.missingPct}% of cells`,
      status: p.missingPct > 10 ? 'Review' : 'Healthy',
      warning: p.missingPct > 10,
    },
    {
      label: 'Duplicate records',
      value: `${formatNumber(p.duplicates)} rows`,
      status: p.duplicates > 0 ? 'Review' : 'Clean',
      warning: p.duplicates > 0,
    },
    {
      label: 'Potential outliers',
      value: `${formatNumber(p.outliers)} detected`,
      status: p.outliers > 0 ? 'Review' : 'Clear',
      warning: p.outliers > 0,
    },
  ];

  return (
    <Page
      title="Overview"
      sub={`${dataset.filename} · autonomous analysis workspace`}
    >
      {/* TOP SUMMARY */}
      <Fade>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Metric
            label="Rows"
            value={formatNumber(p.rows)}
            detail="Observations"
          />

          <Metric
            label="Columns"
            value={formatNumber(p.cols)}
            detail={`${p.numericColumns.length} numeric · ${p.categoricalColumns.length} categorical`}
          />

          <Metric
            label="Quality"
            value={`${p.quality}/100`}
            detail={qualityLabel(p.quality)}
          />

          <Metric
            label="Missing"
            value={`${p.missingPct}%`}
            detail="Dataset cells"
          />
        </div>
      </Fade>

      {/* DATASET HERO */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-indigo-400/10 bg-gradient-to-br from-indigo-500/[0.08] via-violet-500/[0.04] to-transparent p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
              <Database size={25} />
            </div>

            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-slate-500">
                Active dataset
              </div>

              <h2 className="mt-1 truncate text-xl font-black text-white">
                {dataset.filename}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {formatNumber(p.rows)} rows · {p.cols} columns
              </p>
            </div>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${qualityClass(
              p.quality
            )}`}
          >
            <Gauge size={14} />
            {qualityLabel(p.quality)} · {p.quality}/100
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* COLUMN PROFILE */}
        <Card className="lg:col-span-2">
          <SectionHeader
            icon={Layers3}
            title="Column profile"
            subtitle="Automatic schema and statistical overview."
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Column
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Type
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Missing
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Unique
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Mean
                  </th>
                </tr>
              </thead>

              <tbody>
                {p.columns.map((column) => (
                  <tr
                    key={column.name}
                    className="border-b border-white/5 transition hover:bg-white/[0.025]"
                  >
                    <td className="max-w-[220px] truncate px-3 py-3 font-semibold text-slate-200">
                      {column.name}
                    </td>

                    <td className="px-3 py-3">
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-400">
                        {column.kind}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-slate-400">
                      {column.missing_pct ?? 0}%
                    </td>

                    <td className="px-3 py-3 text-slate-400">
                      {formatNumber(column.unique)}
                    </td>

                    <td className="px-3 py-3 text-slate-400">
                      {column.kind === 'numeric'
                        ? column.mean ?? '—'
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {p.columns.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              No column profile information is available.
            </div>
          )}
        </Card>

        {/* HEALTH */}
        <Card>
          <SectionHeader
            icon={ShieldIcon}
            title="Dataset health"
            subtitle="Potential quality issues."
          />

          <div className="space-y-3">
            {healthItems.map((item) => (
              <HealthItem
                key={item.label}
                {...item}
              />
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.025] p-4">
            <div className="flex items-center gap-2">
              <Gauge
                size={16}
                className="text-indigo-300"
              />

              <span className="text-sm font-semibold text-white">
                Overall quality
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, p.quality)
                  )}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-500">
                Data health score
              </span>

              <span className="font-bold text-indigo-300">
                {p.quality}/100
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* PIPELINE */}
      <Card className="mt-6">
        <SectionHeader
          icon={Zap}
          title="Autonomous pipeline"
          subtitle="Current DataPilot analysis stages."
        />

        <div className="grid gap-x-8 md:grid-cols-2 xl:grid-cols-5">
          <PipelineStep
            number="01"
            title="Profile"
            description="Schema and statistics"
          />

          <PipelineStep
            number="02"
            title="Quality"
            description="Missing, duplicates and outliers"
          />

          <PipelineStep
            number="03"
            title="Clean"
            description="Prepare reliable data"
          />

          <PipelineStep
            number="04"
            title="EDA"
            description="Explore distributions"
          />

          <PipelineStep
            number="05"
            title="Visualize"
            description="Generate visual insights"
          />

          <PipelineStep
            number="06"
            title="Detect ML"
            description="Identify modeling opportunities"
          />

          <PipelineStep
            number="07"
            title="Engineer"
            description="Prepare model features"
          />

          <PipelineStep
            number="08"
            title="Train"
            description="Compare ML baselines"
          />

          <PipelineStep
            number="09"
            title="Explain"
            description="Understand model behavior"
          />

          <PipelineStep
            number="10"
            title="Report"
            description="Generate analysis output"
          />
        </div>
      </Card>

      {/* DATASET SUMMARY */}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card>
          <SectionHeader
            icon={BarChart3}
            title="Feature composition"
          />

          <div className="space-y-4">
            <Composition
              label="Numeric"
              value={p.numericColumns.length}
              total={p.cols}
            />

            <Composition
              label="Categorical"
              value={p.categoricalColumns.length}
              total={p.cols}
            />
          </div>
        </Card>

        <Card>
          <SectionHeader
            icon={Target}
            title="ML readiness"
          />

          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/10 bg-emerald-500/5 p-4">
            <CheckCircle2
              size={22}
              className="text-emerald-300"
            />

            <div>
              <div className="font-bold text-white">
                Modeling workspace ready
              </div>

              <div className="mt-1 text-xs leading-5 text-slate-500">
                Select a target in Model Lab to begin training.
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader
            icon={BrainCircuit}
            title="AI analysis"
          />

          <div className="flex items-center gap-3 rounded-2xl border border-indigo-400/10 bg-indigo-500/5 p-4">
            <Sparkles
              size={22}
              className="text-indigo-300"
            />

            <div>
              <div className="font-bold text-white">
                Insights available
              </div>

              <div className="mt-1 text-xs leading-5 text-slate-500">
                Open AI Insights for dataset-grounded observations.
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ATTENTION */}
      {(p.missingPct > 10 ||
        p.duplicates > 0 ||
        p.outliers > 0 ||
        p.quality < 75) && (
        <Card className="mt-6 border-amber-400/10">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
              <AlertTriangle size={20} />
            </div>

            <div>
              <h3 className="font-bold text-white">
                Data quality items need attention
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Review the Data Quality page before relying on model
                results. Some datasets require cleaning or additional
                validation before machine-learning analysis.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {p.missingPct > 10 && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    High missingness
                  </span>
                )}

                {p.duplicates > 0 && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    Duplicate rows
                  </span>
                )}

                {p.outliers > 0 && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    Potential outliers
                  </span>
                )}

                {p.quality < 75 && (
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">
                    Low quality score
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </Page>
  );
}

function Composition({ label, value, total }) {
  const percentage =
    total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-white">
          {value}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ShieldIcon({ size = 19 }) {
  return <Gauge size={size} />;
}
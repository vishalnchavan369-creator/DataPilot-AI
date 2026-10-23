import { useMemo, useState } from 'react';
import {
  BrainCircuit,
  Search,
  Sparkles,
  Info,
  BarChart3,
  Target,
  TrendingUp,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { Card, Empty, Page } from '../components/UI';

export default function Explainability() {
  const { model } = useApp();

  const [search, setSearch] = useState('');

  if (!model) {
    return (
      <Page
        title="Explainability"
        sub="Understand which features contribute most to your trained machine-learning model."
      >
        <Empty
          text="Train a model in Model Lab to unlock global feature importance and model explanations."
        />
      </Page>
    );
  }

  const importance = Array.isArray(model.feature_importance)
    ? model.feature_importance
    : [];

  const filteredImportance = importance.filter((item) =>
    String(item.feature || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const sortedImportance = [...filteredImportance].sort(
    (a, b) =>
      Math.abs(Number(b.importance) || 0) -
      Math.abs(Number(a.importance) || 0)
  );

  const totalImportance = importance.reduce(
    (sum, item) => sum + Math.abs(Number(item.importance) || 0),
    0
  );

  const topFeatures = [...importance]
    .sort(
      (a, b) =>
        Math.abs(Number(b.importance) || 0) -
        Math.abs(Number(a.importance) || 0)
    )
    .slice(0, 5);

  const maxImportance = Math.max(
    ...importance.map((item) =>
      Math.abs(Number(item.importance) || 0)
    ),
    0.000001
  );

  const strongestFeature = topFeatures[0];

  return (
    <Page
      title="Explainability"
      sub="Understand which features influence your model and how strongly they contribute to its predictions."
    >
      <div className="space-y-6">

        {/* =====================================================
            MODEL OVERVIEW
        ====================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            icon={BrainCircuit}
            label="Model"
            value={
              model.model_name ||
              model.model ||
              model.algorithm ||
              'Trained Model'
            }
          />

          <MetricCard
            icon={BarChart3}
            label="Features"
            value={importance.length}
            description="Features analyzed"
          />

          <MetricCard
            icon={Target}
            label="Task"
            value={
              model.task_type ||
              model.task ||
              'Machine Learning'
            }
          />

          <MetricCard
            icon={ShieldCheck}
            label="Explainability"
            value="Global"
            description="Permutation importance"
          />

        </div>

        {/* =====================================================
            TOP INSIGHT
        ====================================================== */}

        {strongestFeature && (
          <div className="glass overflow-hidden rounded-2xl border border-indigo-400/20">

            <div className="relative p-6">

              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

              <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                <div className="flex gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                      Top Model Driver
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-white">
                      {strongestFeature.feature}
                    </h2>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                      This feature has the largest absolute permutation
                      importance among the features analyzed by the model.
                    </p>

                  </div>

                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center">

                  <p className="text-xs text-slate-500">
                    Importance
                  </p>

                  <p className="mt-1 text-2xl font-bold text-indigo-300">
                    {formatImportance(strongestFeature.importance)}
                  </p>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            FEATURE IMPORTANCE
        ====================================================== */}

        <Card>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <div>

                  <h2 className="font-bold text-white">
                    Global Feature Importance
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Features ranked by their effect on model performance.
                  </p>

                </div>

              </div>

            </div>

            {importance.length > 0 && (
              <div className="relative">

                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search feature..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/40 md:w-64"
                />

              </div>
            )}

          </div>

          {sortedImportance.length > 0 ? (

            <div className="mt-7 space-y-5">

              {sortedImportance.map((item, index) => (

                <FeatureImportanceRow
                  key={`${item.feature}-${index}`}
                  item={item}
                  index={index}
                  maxImportance={maxImportance}
                  totalImportance={totalImportance}
                />

              ))}

            </div>

          ) : (

            <div className="mt-7 rounded-xl border border-dashed border-white/10 p-10 text-center">

              <Search className="mx-auto h-8 w-8 text-slate-600" />

              <p className="mt-3 text-sm text-slate-500">
                No features match your search.
              </p>

            </div>

          )}

        </Card>

        {/* =====================================================
            TOP FEATURES
        ====================================================== */}

        {topFeatures.length > 0 && (
          <section>

            <SectionHeader
              icon={TrendingUp}
              title="Top Features"
              subtitle="The features with the largest absolute contribution to model performance."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

              {topFeatures.map((item, index) => (

                <TopFeatureCard
                  key={`${item.feature}-${index}`}
                  item={item}
                  rank={index + 1}
                />

              ))}

            </div>

          </section>
        )}

        {/* =====================================================
            HOW TO READ
        ====================================================== */}

        <section>

          <SectionHeader
            icon={Lightbulb}
            title="How to Read This Explanation"
            subtitle="Understanding permutation-based feature importance."
          />

          <div className="grid gap-4 md:grid-cols-3">

            <ExplanationCard
              icon={BarChart3}
              title="Higher Importance"
              text="A larger absolute importance means shuffling that feature caused a larger change in model performance."
            />

            <ExplanationCard
              icon={TrendingUp}
              title="Model Dependency"
              text="Features with larger importance values were more useful to the trained model for its predictions."
            />

            <ExplanationCard
              icon={Info}
              title="Not Causation"
              text="Feature importance describes model behavior. It does not prove that a feature causes the target outcome."
            />

          </div>

        </section>

        {/* =====================================================
            METHODOLOGY
        ====================================================== */}

        <Card>

          <div className="flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>

              <h3 className="font-bold text-white">
                Explainability Method
              </h3>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                DataPilot AI uses permutation-based global feature
                importance. Each feature is shuffled while keeping the
                remaining data unchanged, and the resulting change in model
                performance is measured. Larger changes indicate that the
                trained model relies more heavily on that feature.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">

                <Badge>
                  Model-Agnostic
                </Badge>

                <Badge>
                  Global Explanation
                </Badge>

                <Badge>
                  Holdout-Based
                </Badge>

                <Badge>
                  Permutation Analysis
                </Badge>

              </div>

            </div>

          </div>

        </Card>

      </div>
    </Page>
  );
}


/* ===============================================================
   METRIC CARD
================================================================ */

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="glass rounded-2xl border border-white/10 p-5 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/30">

      <div className="flex items-start justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
          <Icon className="h-5 w-5" />
        </div>

        <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,.8)]" />

      </div>

      <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-xl font-bold text-white">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      )}

    </div>
  );
}


/* ===============================================================
   FEATURE IMPORTANCE ROW
================================================================ */

function FeatureImportanceRow({
  item,
  index,
  maxImportance,
  totalImportance,
}) {
  const importance = Number(item.importance) || 0;

  const normalizedWidth =
    Math.abs(importance) / maxImportance * 100;

  const share =
    totalImportance > 0
      ? Math.abs(importance) / totalImportance * 100
      : 0;

  return (
    <div className="group">

      <div className="mb-2 flex items-center justify-between gap-4">

        <div className="flex min-w-0 items-center gap-3">

          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-xs font-bold text-slate-500">
            {index + 1}
          </span>

          <span
            className="truncate text-sm font-medium text-slate-200"
            title={item.feature}
          >
            {item.feature}
          </span>

        </div>

        <div className="flex shrink-0 items-center gap-3">

          <span className="hidden text-xs text-slate-600 sm:block">
            {share.toFixed(1)}%
          </span>

          <span className="min-w-[70px] text-right text-sm font-semibold text-indigo-300">
            {formatImportance(importance)}
          </span>

        </div>

      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-white/[0.05]">

        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-700 group-hover:brightness-125"
          style={{
            width: `${Math.max(
              1,
              Math.min(100, normalizedWidth)
            )}%`,
          }}
        />

      </div>

    </div>
  );
}


/* ===============================================================
   TOP FEATURE CARD
================================================================ */

function TopFeatureCard({
  item,
  rank,
}) {
  const importance = Number(item.importance) || 0;

  return (
    <div className="glass rounded-xl border border-white/10 p-4">

      <div className="flex items-center justify-between">

        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-300">
          #{rank}
        </span>

        <Sparkles className="h-4 w-4 text-indigo-300" />

      </div>

      <p
        className="mt-4 truncate text-sm font-semibold text-white"
        title={item.feature}
      >
        {item.feature}
      </p>

      <p className="mt-1 text-xl font-bold text-indigo-300">
        {formatImportance(importance)}
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">

        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          style={{
            width: `${Math.min(
              100,
              Math.abs(importance) * 1000
            )}%`,
          }}
        />

      </div>

    </div>
  );
}


/* ===============================================================
   EXPLANATION CARD
================================================================ */

function ExplanationCard({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="glass rounded-xl border border-white/10 p-5">

      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-4 font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {text}
      </p>

    </div>
  );
}


/* ===============================================================
   SECTION HEADER
================================================================ */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}) {
  return (
    <div className="mb-4">

      <div className="flex items-center gap-2">

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
          <Icon className="h-4 w-4" />
        </div>

        <h2 className="text-lg font-bold text-white">
          {title}
        </h2>

      </div>

      <p className="ml-10 mt-1 text-sm text-slate-500">
        {subtitle}
      </p>

    </div>
  );
}


/* ===============================================================
   BADGE
================================================================ */

function Badge({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-400">
      {children}
    </span>
  );
}


/* ===============================================================
   HELPERS
================================================================ */

function formatImportance(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '0.000';
  }

  if (Math.abs(number) >= 1) {
    return number.toFixed(2);
  }

  if (Math.abs(number) >= 0.01) {
    return number.toFixed(3);
  }

  return number.toFixed(5);
}
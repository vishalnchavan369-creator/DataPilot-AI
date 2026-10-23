import { useEffect, useMemo, useState } from 'react';

import {
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  Info,
  Loader2,
  Target,
  TrendingUp,
  Trophy,
  WandSparkles,
  XCircle,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import {
  Button,
  Card,
  Empty,
  Page,
} from '../components/UI';

/* =========================================================
   HELPERS
========================================================= */

function formatMetric(value, digits = 3) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return '—';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '—';
  }

  if (Math.abs(number) >= 1000) {
    return number.toLocaleString();
  }

  return number.toFixed(digits);
}


function formatPercent(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return '—';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '—';
  }

  const percentage =
    Math.abs(number) <= 1
      ? number * 100
      : number;

  return `${percentage.toFixed(1)}%`;
}


function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function MetricBox({
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-xl font-black text-white">
        {value}
      </div>

      {description && (
        <div className="mt-1 text-xs text-slate-500">
          {description}
        </div>
      )}
    </div>
  );
}


function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
        <Icon size={19} />
      </div>

      <div>
        <h3 className="font-bold text-white">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}


function ScoreBar({
  value,
  label,
}) {
  const number = Number(value);

  if (
    Number.isNaN(number) ||
    !Number.isFinite(number)
  ) {
    return null;
  }

  const percentage = Math.max(
    0,
    Math.min(
      100,
      Math.abs(number) <= 1
        ? number * 100
        : number
    )
  );

  return (
    <div className="mt-4">
      <div className="mb-2 flex justify-between text-xs">
        <span className="text-slate-500">
          {label}
        </span>

        <span className="font-semibold text-indigo-300">
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}


function Note({ text }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-3 text-sm text-slate-400">
      <CheckCircle2
        size={16}
        className="mt-0.5 shrink-0 text-emerald-300"
      />

      <span>
        {text}
      </span>
    </div>
  );
}


/* =========================================================
   MODEL CARD
========================================================= */

function ModelCard({
  result,
  problemType,
  best,
}) {
  const classification =
    problemType === 'classification';

  const failed =
    result?.success === false;

  const primaryMetric = classification
    ? result?.f1 ?? result?.accuracy
    : result?.r2;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
        failed
          ? 'border-red-400/20 bg-red-500/[0.03]'
          : best
            ? 'border-indigo-400/40 bg-indigo-500/[0.08] shadow-lg shadow-indigo-950/30'
            : 'border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.05]'
      }`}
    >
      {/* BEST BADGE */}

      {best && !failed && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
          <Trophy size={11} />
          Best Model
        </div>
      )}

      {/* HEADER */}

      <div className="flex items-center gap-3 pr-24">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300">
          <BrainCircuit size={19} />
        </div>

        <div className="min-w-0">
          <div className="truncate font-bold text-white">
            {result?.name || 'Unknown Model'}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            {classification
              ? 'Classification model'
              : 'Regression model'}
          </div>
        </div>
      </div>

      {/* FAILED MODEL */}

      {failed ? (
        <div className="mt-6 rounded-xl border border-red-400/10 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-300">
            <XCircle size={15} />
            Training failed
          </div>

          <p className="mt-2 break-words text-xs leading-5 text-red-300/70">
            {result?.error ||
              'The model could not be trained.'}
          </p>
        </div>
      ) : (
        <>
          {/* PRIMARY SCORE */}

          <div className="mt-6">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Primary score
            </div>

            <div className="mt-1 text-3xl font-black text-white">
              {classification
                ? formatPercent(primaryMetric)
                : formatMetric(primaryMetric)}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              {classification
                ? 'Weighted F1 score'
                : 'R² explained variance'}
            </div>
          </div>

          {/* CLASSIFICATION */}

          {classification ? (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <MetricBox
                label="Accuracy"
                value={formatPercent(
                  result?.accuracy
                )}
              />

              <MetricBox
                label="Precision"
                value={formatPercent(
                  result?.precision
                )}
              />

              <MetricBox
                label="Recall"
                value={formatPercent(
                  result?.recall
                )}
              />

              <MetricBox
                label="F1"
                value={formatPercent(
                  result?.f1
                )}
              />
            </div>
          ) : (
            /* REGRESSION */

            <div className="mt-6 grid grid-cols-3 gap-3">
              <MetricBox
                label="R²"
                value={formatMetric(
                  result?.r2
                )}
              />

              <MetricBox
                label="RMSE"
                value={formatMetric(
                  result?.rmse
                )}
              />

              <MetricBox
                label="MAE"
                value={formatMetric(
                  result?.mae
                )}
              />
            </div>
          )}

          {/* SCORE */}

          <ScoreBar
            label={
              classification
                ? 'F1 performance'
                : 'R² performance'
            }
            value={
              classification
                ? result?.f1
                : result?.r2
            }
          />
        </>
      )}
    </div>
  );
}


/* =========================================================
   COMPARISON TABLE
========================================================= */

function ComparisonTable({
  results,
  problemType,
  bestModel,
}) {
  const classification =
    problemType === 'classification';

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Model
            </th>

            {classification ? (
              <>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Accuracy
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Precision
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Recall
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  F1
                </th>
              </>
            ) : (
              <>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  R²
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  RMSE
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  MAE
                </th>
              </>
            )}

            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {results.map((result) => {
            const isBest =
              result?.name === bestModel;

            const failed =
              result?.success === false;

            return (
              <tr
                key={
                  result?.name ||
                  Math.random()
                }
                className={`border-b border-white/5 ${
                  isBest
                    ? 'bg-indigo-500/[0.04]'
                    : ''
                }`}
              >
                <td className="px-4 py-4 font-semibold text-white">
                  <div className="flex items-center gap-2">
                    {isBest && !failed && (
                      <Trophy
                        size={14}
                        className="text-indigo-300"
                      />
                    )}

                    <span>
                      {result?.name ||
                        'Unknown'}
                    </span>
                  </div>
                </td>

                {classification ? (
                  <>
                    <td className="px-4 py-4 text-slate-300">
                      {formatPercent(
                        result?.accuracy
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {formatPercent(
                        result?.precision
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {formatPercent(
                        result?.recall
                      )}
                    </td>

                    <td className="px-4 py-4 font-bold text-indigo-300">
                      {formatPercent(
                        result?.f1
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-4 font-bold text-indigo-300">
                      {formatMetric(
                        result?.r2
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {formatMetric(
                        result?.rmse
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {formatMetric(
                        result?.mae
                      )}
                    </td>
                  </>
                )}

                <td className="px-4 py-4">
                  {failed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-300">
                      <XCircle size={12} />
                      Failed
                    </span>
                  ) : isBest ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 size={12} />
                      Selected
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      Compared
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


/* =========================================================
   FEATURE SELECTOR
========================================================= */

function FeatureSelector({
  columns,
  target,
  features,
  setFeatures,
  showAllFeatures,
  setShowAllFeatures,
}) {
  const availableFeatures =
    useMemo(
      () =>
        columns.filter(
          (column) =>
            column.name !== target
        ),
      [columns, target]
    );

  const visibleFeatures =
    showAllFeatures
      ? availableFeatures
      : availableFeatures.slice(0, 10);

  const numericCount =
    availableFeatures.filter(
      (column) =>
        column.kind === 'numeric'
    ).length;

  const categoricalCount =
    availableFeatures.filter(
      (column) =>
        column.kind !== 'numeric'
    ).length;

  const toggleFeature = (
    name,
    checked
  ) => {
    setFeatures(
      (current) => {
        if (checked) {
          if (current.includes(name)) {
            return current;
          }

          return [
            ...current,
            name,
          ];
        }

        return current.filter(
          (item) =>
            item !== name
        );
      }
    );
  };

  const selectAll = () => {
    setFeatures(
      availableFeatures.map(
        (column) =>
          column.name
      )
    );
  };

  const clearAll = () => {
    setFeatures([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="text-sm font-semibold text-slate-300">
            Feature variables
          </label>

          <p className="mt-1 text-xs text-slate-500">
            Select the input columns used for training.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
          >
            Select all
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/10"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-2">
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {visibleFeatures.map(
            (column) => {
              const checked =
                features.includes(
                  column.name
                );

              return (
                <label
                  key={column.name}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition ${
                    checked
                      ? 'bg-indigo-500/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        toggleFeature(
                          column.name,
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 accent-indigo-500"
                    />

                    <span className="truncate text-sm text-slate-300">
                      {column.name}
                    </span>
                  </div>

                  <span className="ml-3 shrink-0 rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-500">
                    {column.kind ||
                      'unknown'}
                  </span>
                </label>
              );
            }
          )}

          {availableFeatures.length ===
            0 && (
            <div className="p-6 text-center text-sm text-slate-500">
              No usable feature columns are available.
            </div>
          )}
        </div>

        {availableFeatures.length >
          10 && (
          <button
            type="button"
            onClick={() =>
              setShowAllFeatures(
                (value) => !value
              )
            }
            className="mt-2 flex w-full items-center justify-center gap-2 border-t border-white/5 pt-3 text-xs font-semibold text-indigo-300"
          >
            {showAllFeatures ? (
              <>
                Show fewer
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                Show all{' '}
                {availableFeatures.length}{' '}
                features
                <ChevronDown
                  size={14}
                />
              </>
            )}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
          {features.length} selected
        </span>

        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          {numericCount} numeric
        </span>

        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
          {categoricalCount} categorical
        </span>
      </div>
    </div>
  );
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function ModelLab() {
  const {
    dataset,
    model,
    train,
    busy,
    error,
    setError,
  } = useApp();

  const [
    target,
    setTarget,
  ] = useState('');

  const [
    features,
    setFeatures,
  ] = useState([]);

  const [
    showAllFeatures,
    setShowAllFeatures,
  ] = useState(false);


  /* -------------------------------------------------------
     DATASET INITIALIZATION
  ------------------------------------------------------- */

  useEffect(() => {
    if (!dataset) {
      return;
    }

    const profile =
      dataset.profile || {};

    const columns =
      profile.columns || [];

    if (!columns.length) {
      setTarget('');
      setFeatures([]);
      return;
    }

    const suggested =
      dataset.suggested_target ||
      columns.at(-1)?.name ||
      '';

    setTarget(suggested);

    const usableFeatures =
      columns
        .map(
          (column) =>
            column.name
        )
        .filter(
          (name) =>
            name &&
            name !== suggested
        );

    setFeatures(
      usableFeatures
    );

    setError?.('');
  }, [
    dataset,
    setError,
  ]);


  /* -------------------------------------------------------
     COLUMNS
  ------------------------------------------------------- */

  const columns =
    dataset?.profile?.columns ||
    [];


  /* -------------------------------------------------------
     TARGET CHANGE
  ------------------------------------------------------- */

  const changeTarget = (
    value
  ) => {
    setTarget(value);

    setFeatures(
      (current) =>
        current.filter(
          (feature) =>
            feature !== value
        )
    );

    setError?.('');
  };


  /* -------------------------------------------------------
     TRAINING
  ------------------------------------------------------- */

  const runTraining =
    async () => {
      setError?.('');

      if (!target) {
        setError?.(
          'Please select a target column.'
        );
        return;
      }

      if (!features.length) {
        setError?.(
          'Please select at least one feature.'
        );
        return;
      }

      try {
        await train(
          target,
          features
        );
      } catch {
        /*
         * AppContext already stores the backend
         * error in the global error state.
         */
      }
    };


  /* -------------------------------------------------------
     NO DATASET
  ------------------------------------------------------- */

  if (!dataset) {
    return (
      <Page
        title="Model Lab"
        sub="Train and compare machine-learning models."
      >
        <Empty text="Upload and analyze a dataset first to unlock Model Lab." />
      </Page>
    );
  }


  const profile =
    dataset.profile || {};


  const results =
    Array.isArray(
      model?.results
    )
      ? model.results
      : [];


  const successfulResults =
    results.filter(
      (result) =>
        result?.success !== false
    );


  /* -------------------------------------------------------
     PAGE
  ------------------------------------------------------- */

  return (
    <Page
      title="Model Lab"
      sub="Configure your target, select features, and compare machine-learning models automatically."
    >

      {/* ===================================================
          MODEL CONFIGURATION
      =================================================== */}

      <Card className="overflow-hidden">

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <SectionTitle
            icon={WandSparkles}
            title="Model Configuration"
            subtitle="Choose what DataPilot should predict and which columns it can use."
          />

          <div className="rounded-xl border border-indigo-400/10 bg-indigo-500/5 px-4 py-2 text-xs text-indigo-300">

            <Database
              size={14}
              className="mr-2 inline"
            />

            {profile.rows?.toLocaleString?.() ||
              profile.rows ||
              0}{' '}
            rows
            {' · '}
            {columns.length}{' '}
            columns

          </div>

        </div>


        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          {/* =================================================
              TARGET
          ================================================= */}

          <div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">

              <Target
                size={16}
                className="text-indigo-300"
              />

              Target variable

            </label>


            <p className="mt-1 text-xs text-slate-500">
              The column the model will learn to predict.
            </p>


            <select
              value={target}
              onChange={(event) =>
                changeTarget(
                  event.target.value
                )
              }
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400/50"
            >

              {columns.map(
                (column) => (
                  <option
                    key={
                      column.name
                    }
                    value={
                      column.name
                    }
                  >
                    {column.name}
                  </option>
                )
              )}

            </select>


            {target && (
              <div className="mt-4 rounded-xl border border-indigo-400/10 bg-indigo-500/5 p-4">

                <div className="text-xs uppercase tracking-wider text-slate-500">
                  Selected target
                </div>


                <div className="mt-2 flex items-center gap-2">

                  <Target
                    size={16}
                    className="text-indigo-300"
                  />

                  <span className="font-bold text-white">
                    {target}
                  </span>

                </div>

              </div>
            )}

          </div>


          {/* =================================================
              FEATURES
          ================================================= */}

          <FeatureSelector
            columns={columns}
            target={target}
            features={features}
            setFeatures={setFeatures}
            showAllFeatures={
              showAllFeatures
            }
            setShowAllFeatures={
              setShowAllFeatures
            }
          />

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/5 p-4">

            <div className="flex items-start gap-3">

              <XCircle
                size={19}
                className="mt-0.5 shrink-0 text-red-300"
              />

              <div className="min-w-0">

                <div className="font-semibold text-red-200">
                  Training could not be completed
                </div>

                <div className="mt-1 break-words text-sm leading-6 text-red-300/80">
                  {error}
                </div>

              </div>

            </div>

          </div>
        )}


        {/* =================================================
            ACTION
        ================================================= */}

        <div className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">

            <Info
              size={17}
              className="mt-0.5 shrink-0 text-slate-500"
            />

            <p className="max-w-xl text-xs leading-5 text-slate-500">
              DataPilot automatically handles missing values,
              categorical variables, encoding, scaling, model
              comparison, and holdout evaluation.
            </p>

          </div>


          <Button
            className="shrink-0"
            disabled={
              busy ||
              !target ||
              !features.length
            }
            onClick={
              runTraining
            }
          >

            {busy ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Training models...
              </>
            ) : (
              <>
                <BrainCircuit
                  size={17}
                />

                Train & compare
              </>
            )}

          </Button>

        </div>

      </Card>


      {/* ===================================================
          TRAINING STATE
      =================================================== */}

      {busy && (
        <Card className="mt-6">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">

              <Loader2
                size={22}
                className="animate-spin text-indigo-300"
              />

            </div>


            <div>

              <div className="font-bold text-white">
                Training your models
              </div>

              <div className="mt-1 text-sm text-slate-500">
                Preparing data, preprocessing features,
                training models, and evaluating the holdout set...
              </div>

            </div>

          </div>


          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">

            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />

          </div>

        </Card>
      )}


      {/* ===================================================
          RESULTS
      =================================================== */}

      {model && !busy && (
        <div className="mt-6 space-y-6">

          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <Card>

              <div className="text-xs uppercase tracking-wider text-slate-500">
                Problem type
              </div>

              <div className="mt-3 flex items-center gap-2">

                <TrendingUp
                  size={19}
                  className="text-indigo-300"
                />

                <div className="text-xl font-black capitalize text-white">
                  {model.problem_type ||
                    'Unknown'}
                </div>

              </div>

            </Card>


            <Card>

              <div className="text-xs uppercase tracking-wider text-slate-500">
                Best model
              </div>

              <div className="mt-3 flex items-center gap-2">

                <Trophy
                  size={19}
                  className="text-amber-300"
                />

                <div className="truncate text-xl font-black text-white">
                  {model.best_model ||
                    '—'}
                </div>

              </div>

            </Card>


            <Card>

              <div className="text-xs uppercase tracking-wider text-slate-500">
                Features
              </div>

              <div className="mt-3 text-xl font-black text-white">
                {model.feature_count ??
                  features.length}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Usable predictors
              </div>

            </Card>


            <Card>

              <div className="text-xs uppercase tracking-wider text-slate-500">
                Holdout rows
              </div>

              <div className="mt-3 text-xl font-black text-white">
                {model.test_rows?.toLocaleString?.() ||
                  model.test_rows ||
                  '—'}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Evaluation data
              </div>

            </Card>

          </div>


          {/* =================================================
              BEST MODEL HERO
          ================================================= */}

          <div className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.12] via-violet-500/[0.06] to-transparent p-6 shadow-xl shadow-indigo-950/20">

            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-300">

                  <WandSparkles
                    size={14}
                  />

                  Model Selection

                </div>


                <h2 className="mt-3 text-2xl font-black text-white">
                  {model.best_model ||
                    'Best model identified'}
                </h2>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  DataPilot compared the available models using
                  holdout evaluation data and retained the model
                  with the strongest primary evaluation score.
                </p>

              </div>


              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">

                <Trophy
                  size={30}
                  className="text-indigo-300"
                />

              </div>

            </div>

          </div>


          {/* =================================================
              MODEL COMPARISON
          ================================================= */}

          <Card>

            <SectionTitle
              icon={BrainCircuit}
              title="Model Comparison"
              subtitle="Every available model is evaluated independently."
            />


            {results.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">

                {results.map(
                  (result) => (
                    <ModelCard
                      key={
                        result.name
                      }
                      result={
                        result
                      }
                      problemType={
                        model.problem_type
                      }
                      best={
                        result.name ===
                        model.best_model
                      }
                    />
                  )
                )}

              </div>
            ) : (
              <div className="rounded-xl border border-amber-400/10 bg-amber-500/5 p-5 text-sm text-amber-300">
                No model comparison results were returned by the backend.
              </div>
            )}

          </Card>


          {/* =================================================
              DETAILED TABLE
          ================================================= */}

          <Card>

            <SectionTitle
              icon={Database}
              title="Detailed Comparison"
              subtitle="Side-by-side evaluation results from the holdout dataset."
            />


            {results.length > 0 ? (
              <ComparisonTable
                results={
                  results
                }
                problemType={
                  model.problem_type
                }
                bestModel={
                  model.best_model
                }
              />
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">
                No comparison results are available.
              </div>
            )}

          </Card>


          {/* =================================================
              TRAINING DIAGNOSTICS
          ================================================= */}

          <div className="grid gap-6 lg:grid-cols-2">

            <Card>

              <SectionTitle
                icon={Target}
                title="Training Diagnostics"
                subtitle="Information about the data used during model training."
              />


              <div className="grid grid-cols-2 gap-3">

                <MetricBox
                  label="Rows used"
                  value={
                    model.rows_used ??
                    '—'
                  }
                />

                <MetricBox
                  label="Train rows"
                  value={
                    model.train_rows ??
                    '—'
                  }
                />

                <MetricBox
                  label="Test rows"
                  value={
                    model.test_rows ??
                    '—'
                  }
                />

                <MetricBox
                  label="Classes"
                  value={
                    model.class_count ??
                    '—'
                  }
                />

              </div>

            </Card>


            <Card>

              <SectionTitle
                icon={Info}
                title="Modeling Notes"
                subtitle="Configuration used for this experiment."
              />


              <div className="space-y-3">

                <Note
                  text={`Target: ${target}`}
                />

                <Note
                  text={`${features.length} feature${
                    features.length === 1
                      ? ''
                      : 's'
                  } selected.`}
                />

                <Note
                  text={`${successfulResults.length} model${
                    successfulResults.length === 1
                      ? ''
                      : 's'
                  } trained successfully.`}
                />

                <Note
                  text="Metrics are calculated on holdout data and may differ on unseen production data."
                />

              </div>

            </Card>

          </div>


          {/* =================================================
              CLASSIFICATION INTERPRETATION
          ================================================= */}

          {model.problem_type ===
            'classification' && (
            <Card>

              <SectionTitle
                icon={TrendingUp}
                title="Classification Metrics"
                subtitle="Understanding the evaluation results."
              />


              <div className="grid gap-4 md:grid-cols-2">

                <Note
                  text="Accuracy measures the proportion of observations classified correctly."
                />

                <Note
                  text="Precision measures how often predicted classes are correct."
                />

                <Note
                  text="Recall measures how many actual class observations were detected."
                />

                <Note
                  text="Weighted F1 balances precision and recall while accounting for class frequency."
                />

              </div>

            </Card>
          )}


          {/* =================================================
              REGRESSION INTERPRETATION
          ================================================= */}

          {model.problem_type ===
            'regression' && (
            <Card>

              <SectionTitle
                icon={TrendingUp}
                title="Regression Metrics"
                subtitle="Understanding the evaluation results."
              />


              <div className="grid gap-4 md:grid-cols-3">

                <Note
                  text="R² measures the proportion of target variance explained by the model."
                />

                <Note
                  text="RMSE gives greater weight to larger prediction errors."
                />

                <Note
                  text="MAE represents the average absolute prediction error."
                />

              </div>

            </Card>
          )}


          {/* =================================================
              CONFUSION MATRIX
          ================================================= */}

          {model.problem_type ===
            'classification' &&
            model.confusion_matrix && (
              <Card>

                <SectionTitle
                  icon={Target}
                  title="Confusion Matrix"
                  subtitle="Actual versus predicted class counts for the selected model."
                />


                <ConfusionMatrix
                  data={
                    model.confusion_matrix
                  }
                />

              </Card>
            )}


          {/* =================================================
              FEATURE IMPORTANCE
          ================================================= */}

          {Array.isArray(
            model.feature_importance
          ) &&
            model.feature_importance.length >
              0 && (
              <Card>

                <SectionTitle
                  icon={BrainCircuit}
                  title="Feature Importance"
                  subtitle="Top transformed features contributing to the selected model."
                />


                <FeatureImportance
                  items={
                    model.feature_importance
                  }
                />

              </Card>
            )}

        </div>
      )}


      {/* ===================================================
          EMPTY STATE
      =================================================== */}

      {!model && !busy && (
        <Card className="mt-6">

          <div className="py-10 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">

              <BrainCircuit
                size={30}
              />

            </div>


            <h3 className="mt-5 text-xl font-black text-white">
              Ready to build your first model
            </h3>


            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Select a target and at least one feature above.
              DataPilot will automatically preprocess the data,
              train the available models, and compare their results.
            </p>

          </div>

        </Card>
      )}

    </Page>
  );
}


/* =========================================================
   CONFUSION MATRIX
========================================================= */

function ConfusionMatrix({
  data,
}) {
  const labels =
    Array.isArray(data?.labels)
      ? data.labels
      : [];

  const matrix =
    Array.isArray(data?.matrix)
      ? data.matrix
      : [];

  if (
    !labels.length ||
    !matrix.length
  ) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center text-sm text-slate-500">
        Confusion matrix data is not available.
      </div>
    );
  }

  const maxValue =
    Math.max(
      1,
      ...matrix.flat().map(
        (value) =>
          safeNumber(value)
      )
    );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">

        <div className="mb-4 grid grid-cols-[160px_1fr] gap-4">

          <div />

          <div className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            Predicted
          </div>

        </div>


        <div className="grid grid-cols-[160px_1fr] gap-4">

          <div className="flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-slate-500 [writing-mode:vertical-rl] rotate-180">
            Actual
          </div>


          <div>

            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns:
                  `repeat(${labels.length}, minmax(70px, 1fr))`,
              }}
            >

              {matrix.map(
                (row, rowIndex) =>
                  row.map(
                    (
                      value,
                      columnIndex
                    ) => {

                      const intensity =
                        safeNumber(
                          value
                        ) /
                        maxValue;

                      const background =
                        `rgba(99, 102, 241, ${Math.max(
                          0.05,
                          Math.min(
                            0.7,
                            intensity * 0.7
                          )
                        )})`;

                      return (
                        <div
                          key={`${rowIndex}-${columnIndex}`}
                          className="aspect-square rounded-xl border border-white/10 p-3 text-center"
                          style={{
                            background,
                          }}
                        >

                          <div className="text-xl font-black text-white">
                            {safeNumber(
                              value
                            ).toLocaleString()}
                          </div>

                          <div className="mt-1 truncate text-[10px] text-slate-400">
                            {labels[
                              rowIndex
                            ]}{' '}
                            →{' '}
                            {
                              labels[
                                columnIndex
                              ]
                            }
                          </div>

                        </div>
                      );
                    }
                )
              )}

            </div>


            <div
              className="mt-3 grid gap-2"
              style={{
                gridTemplateColumns:
                  `repeat(${labels.length}, minmax(70px, 1fr))`,
              }}
            >

              {labels.map(
                (label) => (
                  <div
                    key={label}
                    className="truncate text-center text-xs text-slate-500"
                  >
                    {label}
                  </div>
                )
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}


/* =========================================================
   FEATURE IMPORTANCE
========================================================= */

function FeatureImportance({
  items,
}) {
  const maxImportance =
    Math.max(
      0.000001,
      ...items.map(
        (item) =>
          Math.abs(
            safeNumber(
              item.importance
            )
          )
      )
    );

  return (
    <div className="space-y-4">

      {items
        .slice(0, 15)
        .map(
          (item, index) => {

            const importance =
              Math.abs(
                safeNumber(
                  item.importance
                )
              );

            const percentage =
              (importance /
                maxImportance) *
              100;

            return (
              <div
                key={`${item.feature}-${index}`}
              >

                <div className="mb-2 flex items-center justify-between gap-4">

                  <span className="min-w-0 truncate text-sm font-medium text-slate-300">
                    {item.feature}
                  </span>

                  <span className="shrink-0 text-xs font-semibold text-indigo-300">
                    {formatMetric(
                      item.importance,
                      4
                    )}
                  </span>

                </div>


                <div className="h-2 overflow-hidden rounded-full bg-white/5">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />

                </div>

              </div>
            );
          }
        )}

    </div>
  );
}
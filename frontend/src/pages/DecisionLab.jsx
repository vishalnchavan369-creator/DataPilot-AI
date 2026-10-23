import React, { useEffect, useMemo, useState } from "react";

import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Gauge,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react";

import { useApp } from "../context/AppContext";

import {
  lookupDatasetRecord,
  predict as apiPredict,
} from "../lib/api";

import { Button, Card, Page } from "../components/UI";

/* =========================================================
   HELPERS
========================================================= */

const ID_NAME_PATTERNS = [
  "employee_id",
  "employeeid",
  "employee id",
  "emp_id",
  "empid",
  "order_id",
  "orderid",
  "order id",
  "customer_id",
  "customerid",
  "customer id",
  "user_id",
  "userid",
  "user id",
  "record_id",
  "recordid",
  "record id",
  "id",
];

const normalizeName = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const isIdentifier = (column) => {
  const normalized = normalizeName(column);

  if (
    ID_NAME_PATTERNS.some(
      (pattern) => normalizeName(pattern) === normalized
    )
  ) {
    return true;
  }

  return (
    normalized.endsWith("id") ||
    normalized.includes("identifier")
  );
};

const isEmptyValue = (value) =>
  value === null ||
  value === undefined ||
  String(value).trim() === "";

const toComparableNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const isBooleanLike = (value) => {
  if (typeof value === "boolean") return true;

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return ["true", "false", "yes", "no", "y", "n"].includes(normalized);
};

const toPredictionProbability = (result) => {
  if (!result) return null;

  const candidates = [
    result.probability,
    result.churn_probability,
    result.prediction_probability,
    result.confidence,
    result.score,
  ];

  for (const candidate of candidates) {
    const numeric = Number(candidate);

    if (Number.isFinite(numeric)) {
      if (numeric >= 0 && numeric <= 1) {
        return numeric * 100;
      }

      if (numeric >= 0 && numeric <= 100) {
        return numeric;
      }
    }
  }

  if (Array.isArray(result.probabilities) && result.probabilities.length) {
    const numeric = Number(
      result.probabilities[result.probabilities.length - 1]
    );

    if (Number.isFinite(numeric)) {
      return numeric <= 1 ? numeric * 100 : numeric;
    }
  }

  if (Array.isArray(result.class_probabilities)) {
    const last = result.class_probabilities.at(-1);

    if (typeof last === "number") {
      return last <= 1 ? last * 100 : last;
    }
  }

  return null;
};

const getPredictionLabel = (result) => {
  if (!result) return "—";

  return (
    result.prediction ??
    result.predicted_class ??
    result.predicted_label ??
    result.class ??
    result.result ??
    "Prediction"
  );
};

const extractErrorMessage = (error) => {
  if (!error) return "Something went wrong.";

  if (typeof error === "string") return error;

  if (typeof error.message === "string") {
    return error.message;
  }

  if (error?.detail) {
    if (typeof error.detail === "string") {
      return error.detail;
    }

    if (typeof error.detail === "object") {
      return (
        error.detail.message ||
        "The request could not be completed."
      );
    }
  }

  return "The request could not be completed.";
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? String(value)
      : value.toFixed(2);
  }

  return String(value);
};

const formatProbability = (value) => {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Number(value).toFixed(1)}%`;
};

const getDifference = (current, simulated) => {
  if (
    current === null ||
    simulated === null ||
    current === undefined ||
    simulated === undefined
  ) {
    return null;
  }

  return Number(simulated) - Number(current);
};

const getFeatureType = (value) => {
  if (isBooleanLike(value)) {
    return "boolean";
  }

  if (toComparableNumber(value) !== null) {
    return "number";
  }

  return "text";
};

/* =========================================================
   FEATURE CONTROL
========================================================= */

function FeatureEditor({
  name,
  originalValue,
  value,
  onChange,
}) {
  const type = getFeatureType(originalValue);

  const numericOriginal = toComparableNumber(originalValue);
  const numericValue = toComparableNumber(value);

  const [expanded, setExpanded] = useState(true);

  const change =
    numericOriginal !== null && numericValue !== null
      ? numericValue - numericOriginal
      : null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700">
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {name}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>
              Current:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {formatValue(originalValue)}
              </strong>
            </span>

            {change !== null && Math.abs(change) > 0.00001 && (
              <span
                className={
                  change > 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }
              >
                {change > 0 ? "+" : ""}
                {change.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-4">
          {type === "boolean" ? (
            <select
              value={String(value)}
              onChange={(event) =>
                onChange(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="true">Yes / True</option>
              <option value="false">No / False</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          ) : type === "number" ? (
            <div className="space-y-2">
              <input
                type="range"
                min={
                  numericOriginal !== null
                    ? Math.min(0, numericOriginal * 0.5)
                    : 0
                }
                max={
                  numericOriginal !== null
                    ? Math.max(
                        100,
                        numericOriginal * 2 + 10
                      )
                    : 100
                }
                step={
                  Number.isInteger(numericOriginal)
                    ? 1
                    : 0.1
                }
                value={
                  numericValue !== null
                    ? numericValue
                    : 0
                }
                onChange={(event) =>
                  onChange(event.target.value)
                }
                className="w-full accent-slate-900"
              />

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={value ?? ""}
                  onChange={(event) =>
                    onChange(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
                />

                <span className="text-xs text-slate-400">
                  numeric
                </span>
              </div>
            </div>
          ) : (
            <input
              type="text"
              value={value ?? ""}
              onChange={(event) =>
                onChange(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
            />
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PROBABILITY CARD
========================================================= */

function ProbabilityCard({
  title,
  probability,
  prediction,
  type = "current",
}) {
  const normalizedProbability =
    probability === null || probability === undefined
      ? null
      : Math.max(0, Math.min(100, Number(probability)));

  const isRisk =
    prediction &&
    /churn|risk|yes|true|1|fraud|negative/i.test(
      String(prediction)
    );

  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl border p-6",
        type === "simulated"
          ? "border-slate-300 bg-slate-950 text-white dark:border-slate-700"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
      ].join(" ")}
    >
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-slate-200/20 blur-3xl dark:bg-white/5" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span
            className={
              type === "simulated"
                ? "text-sm font-medium text-slate-300"
                : "text-sm font-medium text-slate-500"
            }
          >
            {title}
          </span>

          {type === "simulated" ? (
            <Sparkles className="h-5 w-5 text-white" />
          ) : (
            <Activity className="h-5 w-5 text-slate-500" />
          )}
        </div>

        <div className="mt-6">
          <div
            className={
              type === "simulated"
                ? "text-4xl font-bold tracking-tight"
                : "text-4xl font-bold tracking-tight text-slate-950 dark:text-white"
            }
          >
            {prediction || "—"}
          </div>

          <div
            className={
              type === "simulated"
                ? "mt-1 text-sm text-slate-400"
                : "mt-1 text-sm text-slate-500"
            }
          >
            Predicted outcome
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span
              className={
                type === "simulated"
                  ? "text-slate-400"
                  : "text-slate-500"
              }
            >
              Probability
            </span>

            <strong>
              {formatProbability(normalizedProbability)}
            </strong>
          </div>

          <div
            className={
              type === "simulated"
                ? "h-3 overflow-hidden rounded-full bg-white/10"
                : "h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            }
          >
            <div
              className="h-full rounded-full bg-current transition-all duration-700"
              style={{
                width: `${
                  normalizedProbability ?? 0
                }%`,
              }}
            />
          </div>
        </div>

        {isRisk && (
          <div
            className={
              type === "simulated"
                ? "mt-4 text-xs text-slate-400"
                : "mt-4 text-xs text-slate-500"
            }
          >
            Model confidence / risk probability
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function DecisionLab() {
  const app = useApp();

  const dataset = app?.dataset;

  const predictFromContext = app?.predict;

  const [lookupColumn, setLookupColumn] = useState("");
  const [lookupValue, setLookupValue] = useState("");

  const [record, setRecord] = useState(null);

  const [baseValues, setBaseValues] = useState({});
  const [simulationValues, setSimulationValues] = useState({});

  const [currentPrediction, setCurrentPrediction] =
    useState(null);

  const [simulatedPrediction, setSimulatedPrediction] =
    useState(null);

  const [loadingRecord, setLoadingRecord] = useState(false);
  const [loadingCurrent, setLoadingCurrent] =
    useState(false);
  const [loadingSimulation, setLoadingSimulation] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /* =======================================================
     DATASET INFORMATION
  ======================================================= */

  const datasetColumns = useMemo(() => {
    if (!dataset) return [];

    return (
      dataset.columns ||
      dataset.profile?.columns ||
      dataset.schema?.columns ||
      []
    );
  }, [dataset]);

  const normalizedColumns = useMemo(() => {
    return datasetColumns.map((column) => {
      if (typeof column === "string") {
        return column;
      }

      return (
        column?.name ||
        column?.column ||
        column?.field ||
        String(column)
      );
    });
  }, [datasetColumns]);

  const identifierColumns = useMemo(() => {
    const detected = normalizedColumns.filter(isIdentifier);

    if (detected.length) {
      return detected;
    }

    return normalizedColumns.slice(0, 1);
  }, [normalizedColumns]);

  const modelFeatures = useMemo(() => {
    const features =
      dataset?.model?.features ||
      dataset?.features ||
      app?.model?.features ||
      app?.model?.result?.features ||
      [];

    if (Array.isArray(features) && features.length) {
      return features;
    }

    return normalizedColumns.filter(
      (column) => !isIdentifier(column)
    );
  }, [
    dataset,
    app?.model,
    normalizedColumns,
  ]);

  useEffect(() => {
    if (!lookupColumn && identifierColumns.length) {
      setLookupColumn(identifierColumns[0]);
    }
  }, [lookupColumn, identifierColumns]);

  /* =======================================================
     RECORD LOOKUP
  ======================================================= */

  const handleFindRecord = async () => {
    setError("");
    setMessage("");

    if (!dataset?.dataset_id) {
      setError(
        "No uploaded dataset is active. Upload and analyze a dataset first."
      );
      return;
    }

    if (!lookupColumn) {
      setError("Select an identifier column.");
      return;
    }

    if (!lookupValue.trim()) {
      setError("Enter an identifier value.");
      return;
    }

    try {
      setLoadingRecord(true);

      const response = await lookupDatasetRecord(
        dataset.dataset_id,
        lookupColumn,
        lookupValue.trim()
      );

      const foundRow = response?.row;

      if (!foundRow) {
        throw new Error(
          "The record was found but no row data was returned."
        );
      }

      setRecord(foundRow);

      const filledValues = {};

      modelFeatures.forEach((feature) => {
        if (
          Object.prototype.hasOwnProperty.call(
            foundRow,
            feature
          )
        ) {
          filledValues[feature] =
            foundRow[feature] ?? "";
        }
      });

      setBaseValues(filledValues);
      setSimulationValues({ ...filledValues });

      setCurrentPrediction(null);
      setSimulatedPrediction(null);

      setMessage(
        `Record ${lookupValue.trim()} loaded successfully.`
      );
    } catch (lookupError) {
      setError(extractErrorMessage(lookupError));
      setRecord(null);
    } finally {
      setLoadingRecord(false);
    }
  };

  /* =======================================================
     RUN PREDICTION
  ======================================================= */

  const runPrediction = async (values, mode) => {
    if (!dataset?.dataset_id) {
      throw new Error("No dataset is currently active.");
    }

    if (!values || !Object.keys(values).length) {
      throw new Error(
        "No feature values are available for prediction."
      );
    }

    const cleanedValues = {};

    modelFeatures.forEach((feature) => {
      if (
        Object.prototype.hasOwnProperty.call(
          values,
          feature
        )
      ) {
        const value = values[feature];

        if (isEmptyValue(value)) {
          cleanedValues[feature] = null;
          return;
        }

        const original =
          record?.[feature] ??
          baseValues?.[feature];

        if (isBooleanLike(original)) {
          const normalized = String(value)
            .trim()
            .toLowerCase();

          if (normalized === "true" || normalized === "yes" || normalized === "y") {
            cleanedValues[feature] = true;
          } else if (
            normalized === "false" ||
            normalized === "no" ||
            normalized === "n"
          ) {
            cleanedValues[feature] = false;
          } else {
            cleanedValues[feature] = value;
          }

          return;
        }

        const originalNumber =
          toComparableNumber(original);

        if (originalNumber !== null) {
          const numeric = Number(value);

          cleanedValues[feature] =
            Number.isFinite(numeric)
              ? numeric
              : value;

          return;
        }

        cleanedValues[feature] = value;
      }
    });

    if (mode === "current") {
      setLoadingCurrent(true);
    } else {
      setLoadingSimulation(true);
    }

    try {
      let response;

      if (typeof predictFromContext === "function") {
        /*
         * Your existing AppContext prediction wrapper.
         */
        response = await predictFromContext({
          dataset_id: dataset.dataset_id,
          values: cleanedValues,
        });
      } else {
        /*
         * Direct fallback to the existing API helper.
         */
        response = await apiPredict(
          dataset.dataset_id,
          cleanedValues
        );
      }

      if (mode === "current") {
        setCurrentPrediction(response);
      } else {
        setSimulatedPrediction(response);
      }

      return response;
    } finally {
      if (mode === "current") {
        setLoadingCurrent(false);
      } else {
        setLoadingSimulation(false);
      }
    }
  };

  /* =======================================================
     CURRENT PREDICTION
  ======================================================= */

  const handleCurrentPrediction = async () => {
    setError("");
    setMessage("");

    try {
      await runPrediction(baseValues, "current");
      setMessage("Current profile prediction completed.");
    } catch (predictionError) {
      setError(extractErrorMessage(predictionError));
    }
  };

  /* =======================================================
     WHAT-IF SIMULATION
  ======================================================= */

  const handleSimulation = async () => {
    setError("");
    setMessage("");

    if (!record) {
      setError(
        "Find an employee or record before running a simulation."
      );
      return;
    }

    try {
      await runPrediction(
        simulationValues,
        "simulation"
      );

      setMessage(
        "What-If simulation completed using the trained model."
      );
    } catch (simulationError) {
      setError(extractErrorMessage(simulationError));
    }
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetSimulation = () => {
    setSimulationValues({ ...baseValues });
    setSimulatedPrediction(null);
    setError("");
    setMessage("Simulation values reset to the original profile.");
  };

  /* =======================================================
     CHANGED FEATURES
  ======================================================= */

  const changedFeatures = useMemo(() => {
    if (!record) return [];

    return modelFeatures
      .map((feature) => {
        const original = baseValues[feature];
        const simulated = simulationValues[feature];

        const originalNumber =
          toComparableNumber(original);

        const simulatedNumber =
          toComparableNumber(simulated);

        const numeric =
          originalNumber !== null &&
          simulatedNumber !== null;

        const changed = numeric
          ? Math.abs(
              originalNumber - simulatedNumber
            ) > 0.000001
          : String(original ?? "") !==
            String(simulated ?? "");

        if (!changed) return null;

        return {
          feature,
          original,
          simulated,
          numeric,
          difference: numeric
            ? simulatedNumber - originalNumber
            : null,
        };
      })
      .filter(Boolean);
  }, [
    record,
    modelFeatures,
    baseValues,
    simulationValues,
  ]);

  /* =======================================================
     PROBABILITY COMPARISON
  ======================================================= */

  const currentProbability = useMemo(
    () => toPredictionProbability(currentPrediction),
    [currentPrediction]
  );

  const simulatedProbability = useMemo(
    () => toPredictionProbability(simulatedPrediction),
    [simulatedPrediction]
  );

  const probabilityDifference =
    getDifference(
      currentProbability,
      simulatedProbability
    );

  const probabilityDirection =
    probabilityDifference === null
      ? "neutral"
      : probabilityDifference > 0
      ? "increase"
      : probabilityDifference < 0
      ? "decrease"
      : "neutral";

  /* =======================================================
     EXPLANATION
  ======================================================= */

  const explanation = useMemo(() => {
    if (!changedFeatures.length) {
      return "Change one or more feature values and run the simulation to see how the model responds.";
    }

    const numericChanges =
      changedFeatures.filter(
        (item) => item.numeric
      );

    const largestChange = [...numericChanges].sort(
      (a, b) =>
        Math.abs(b.difference) -
        Math.abs(a.difference)
    )[0];

    if (
      probabilityDifference !== null &&
      largestChange
    ) {
      if (probabilityDifference < 0) {
        return `The simulated profile reduced the model's predicted probability by ${Math.abs(
          probabilityDifference
        ).toFixed(
          1
        )} percentage points. The largest numeric profile change was ${largestChange.feature}.`;
      }

      if (probabilityDifference > 0) {
        return `The simulated profile increased the model's predicted probability by ${Math.abs(
          probabilityDifference
        ).toFixed(
          1
        )} percentage points. The largest numeric profile change was ${largestChange.feature}.`;
      }
    }

    return "The model produced a different result after the selected feature changes.";
  }, [
    changedFeatures,
    probabilityDifference,
  ]);

  /* =======================================================
     NO DATASET
  ======================================================= */

  if (!dataset?.dataset_id) {
    return (
      <Page>
        <div className="mx-auto max-w-5xl">
          <Card>
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <BrainCircuit className="h-8 w-8 text-slate-500" />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
                Decision Lab
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Upload and analyze a dataset first. Once a
                dataset and trained model are available, you
                can use this page to perform interactive
                What-If simulations.
              </p>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <Page>
      <div className="mx-auto max-w-7xl space-y-6 pb-12">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 md:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-slate-200/40 blur-3xl dark:bg-slate-700/20" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5" />
                Interactive AI Decision Lab
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">
                What-If Simulator
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                Explore how changing an individual's profile
                can affect the trained machine-learning
                prediction. Every simulation is evaluated by
                your actual DataPilot model.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <Gauge className="h-5 w-5 text-slate-500" />

              <div>
                <div className="text-xs text-slate-500">
                  Active dataset
                </div>

                <div className="mt-0.5 max-w-[220px] truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {dataset.name ||
                    dataset.filename ||
                    "Uploaded dataset"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            <div className="flex items-start gap-3">
              <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {message && !error && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4" />
              {message}
            </div>
          </div>
        )}

        {/* =================================================
            STEP 1 — RECORD
        ================================================= */}

        <Card>
          <div className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <UserRound className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-950 dark:text-white">
                      1. Select a record
                    </h2>

                    <p className="text-xs text-slate-500">
                      Load an existing record from the uploaded dataset.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-[220px_1fr]">
                  <select
                    value={lookupColumn}
                    onChange={(event) =>
                      setLookupColumn(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="">
                      Identifier column
                    </option>

                    {identifierColumns.map((column) => (
                      <option
                        key={column}
                        value={column}
                      >
                        {column}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-3">
                    <input
                      value={lookupValue}
                      onChange={(event) =>
                        setLookupValue(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleFindRecord();
                        }
                      }}
                      placeholder="Employee ID, Order ID, Customer ID..."
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
                    />

                    <Button
                      onClick={handleFindRecord}
                      disabled={loadingRecord}
                    >
                      {loadingRecord ? (
                        <RefreshCcw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}

                      {loadingRecord
                        ? "Finding..."
                        : "Find record"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {record && (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <Check className="h-4 w-4 text-emerald-600" />

                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Record loaded:
                </span>

                <strong className="text-sm text-slate-950 dark:text-white">
                  {record[lookupColumn] ??
                    lookupValue}
                </strong>

                <span className="text-xs text-slate-400">
                  {modelFeatures.length} model features available
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* =================================================
            PROFILE / WHAT IF
        ================================================= */}

        {record && (
          <>
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">

              {/* CURRENT PROFILE */}

              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-slate-500" />

                        <h2 className="font-semibold text-slate-950 dark:text-white">
                          Current profile
                        </h2>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Original values from the dataset.
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Baseline
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {modelFeatures.map((feature) => (
                      <div
                        key={`current-${feature}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="truncate text-xs text-slate-500">
                          {feature}
                        </div>

                        <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {formatValue(
                            baseValues[feature]
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <Button
                      variant="secondary"
                      onClick={handleCurrentPrediction}
                      disabled={loadingCurrent}
                      className="w-full"
                    >
                      {loadingCurrent ? (
                        <RefreshCcw className="h-4 w-4 animate-spin" />
                      ) : (
                        <BrainCircuit className="h-4 w-4" />
                      )}

                      {loadingCurrent
                        ? "Running model..."
                        : "Calculate current prediction"}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* WHAT IF */}

              <Card>
                <div className="p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5 text-slate-500" />

                        <h2 className="font-semibold text-slate-950 dark:text-white">
                          What-If scenario
                        </h2>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Change values and see how the model reacts.
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={resetSimulation}
                      disabled={loadingSimulation}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {modelFeatures.map((feature) => (
                      <FeatureEditor
                        key={feature}
                        name={feature}
                        originalValue={
                          baseValues[feature]
                        }
                        value={
                          simulationValues[feature]
                        }
                        onChange={(value) =>
                          setSimulationValues(
                            (previous) => ({
                              ...previous,
                              [feature]: value,
                            })
                          )
                        }
                      />
                    ))}
                  </div>

                  <div className="mt-5">
                    <Button
                      onClick={handleSimulation}
                      disabled={loadingSimulation}
                      className="w-full"
                    >
                      {loadingSimulation ? (
                        <RefreshCcw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}

                      {loadingSimulation
                        ? "Simulating..."
                        : "Run What-If Simulation"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* =================================================
                PREDICTION COMPARISON
            ================================================= */}

            {(currentPrediction ||
              simulatedPrediction) && (
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-slate-500" />

                    <h2 className="font-semibold text-slate-950 dark:text-white">
                      Prediction comparison
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Compare the baseline model output with the simulated scenario.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <ProbabilityCard
                    title="Current"
                    prediction={getPredictionLabel(
                      currentPrediction
                    )}
                    probability={currentProbability}
                    type="current"
                  />

                  <ProbabilityCard
                    title="Simulated"
                    prediction={getPredictionLabel(
                      simulatedPrediction
                    )}
                    probability={simulatedProbability}
                    type="simulated"
                  />
                </div>
              </div>
            )}

            {/* =================================================
                DIFFERENCE
            ================================================= */}

            {currentPrediction &&
              simulatedPrediction &&
              probabilityDifference !== null && (
                <Card>
                  <div className="p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-500">
                          Model response
                        </div>

                        <div className="mt-2 flex items-center gap-3">
                          {probabilityDirection ===
                          "decrease" ? (
                            <TrendingDown className="h-7 w-7 text-emerald-600" />
                          ) : probabilityDirection ===
                            "increase" ? (
                            <TrendingUp className="h-7 w-7 text-rose-600" />
                          ) : (
                            <ArrowRight className="h-7 w-7 text-slate-400" />
                          )}

                          <div>
                            <div className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                              {probabilityDifference > 0
                                ? "+"
                                : ""}
                              {probabilityDifference.toFixed(
                                1
                              )}
                              <span className="ml-1 text-lg">
                                pp
                              </span>
                            </div>

                            <div className="text-xs text-slate-500">
                              change in predicted probability
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-5 py-4 dark:bg-slate-900">
                        <div className="text-xs text-slate-500">
                          Current → Simulated
                        </div>

                        <div className="mt-1 flex items-center gap-3 text-lg font-bold text-slate-950 dark:text-white">
                          {formatProbability(
                            currentProbability
                          )}

                          <ArrowRight className="h-4 w-4 text-slate-400" />

                          {formatProbability(
                            simulatedProbability
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

            {/* =================================================
                CHANGED FEATURES
            ================================================= */}

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">

              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-slate-500" />

                    <h2 className="font-semibold text-slate-950 dark:text-white">
                      Scenario changes
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Features changed from the original profile.
                  </p>

                  {changedFeatures.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center dark:border-slate-700">
                      <p className="text-sm text-slate-500">
                        No values have been changed yet.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {changedFeatures.map((item) => (
                        <div
                          key={item.feature}
                          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {item.feature}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {formatValue(item.original)}
                              <ArrowRight className="mx-1 inline h-3 w-3" />
                              {formatValue(item.simulated)}
                            </div>
                          </div>

                          {item.numeric &&
                            item.difference !== null && (
                              <div
                                className={[
                                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                                  item.difference > 0
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
                                ].join(" ")}
                              >
                                {item.difference >
                                0 ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )}

                                {item.difference >
                                0
                                  ? "+"
                                  : ""}
                                {item.difference.toFixed(
                                  2
                                )}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* =================================================
                  EXPLANATION
              ================================================= */}

              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-slate-500" />

                    <h2 className="font-semibold text-slate-950 dark:text-white">
                      Model interpretation
                    </h2>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800">
                        <Sparkles className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </div>

                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {explanation}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                      <span className="text-xs text-slate-500">
                        Changed features
                      </span>

                      <strong className="text-sm text-slate-900 dark:text-white">
                        {changedFeatures.length}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                      <span className="text-xs text-slate-500">
                        Baseline probability
                      </span>

                      <strong className="text-sm text-slate-900 dark:text-white">
                        {formatProbability(
                          currentProbability
                        )}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                      <span className="text-xs text-slate-500">
                        Simulated probability
                      </span>

                      <strong className="text-sm text-slate-900 dark:text-white">
                        {formatProbability(
                          simulatedProbability
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* =================================================
                PROFESSIONAL NOTE
            ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex gap-3">
                <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    How to interpret this simulation
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The What-If Simulator shows how the trained
                    model's output changes when selected feature
                    values are modified. A change in model
                    probability is an output of the model and
                    should not be interpreted as proof that
                    changing that feature will causally produce
                    the outcome.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
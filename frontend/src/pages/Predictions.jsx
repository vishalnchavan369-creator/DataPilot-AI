import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronDown,
  Clipboard,
  Database,
  Gauge,
  Info,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';

import {
  useApp,
} from '../context/AppContext';

import {
  lookupDatasetRecord,
} from '../lib/api';


/* =========================================================
   CONSTANTS
========================================================= */

const ID_PATTERNS = [
  'id',
  'employee_id',
  'employeeid',
  'customer_id',
  'customerid',
  'user_id',
  'userid',
  'student_id',
  'studentid',
  'record_id',
  'recordid',
  'account_id',
  'accountid',
];

const BOOLEAN_VALUES = [
  'yes',
  'no',
  'true',
  'false',
];

const COMMON_CATEGORIES = {
  Gender: [
    'Male',
    'Female',
    'Other',
  ],

  Education: [
    'Diploma',
    'Bachelor',
    'Master',
    'PhD',
  ],

  Department: [
    'Data Science',
    'Finance',
    'HR',
    'Engineering',
    'Sales',
    'Operations',
    'Marketing',
  ],

  City: [
    'Hyderabad',
    'Delhi',
    'Kolkata',
    'Pune',
    'Chennai',
    'Mumbai',
    'Bengaluru',
  ],

  Employment_Type: [
    'Full-time',
    'Part-time',
    'Contract',
    'Intern',
  ],

  Remote_Work: [
    'Yes',
    'No',
  ],

  Internet_Access: [
    'Excellent',
    'Good',
    'Average',
    'Poor',
  ],

  Promotion_Last_2Y: [
    'Yes',
    'No',
  ],
};


/* =========================================================
   GENERAL HELPERS
========================================================= */

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}


function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    value === ''
  );
}


function isNumericValue(value) {
  if (isEmpty(value)) {
    return false;
  }

  return Number.isFinite(
    Number(value)
  );
}


function isBooleanLike(value) {
  if (typeof value === 'boolean') {
    return true;
  }

  return BOOLEAN_VALUES.includes(
    String(value)
      .trim()
      .toLowerCase()
  );
}


function normalizeBooleanValue(value) {
  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    normalized === 'true' ||
    normalized === 'yes'
  ) {
    return 'Yes';
  }

  if (
    normalized === 'false' ||
    normalized === 'no'
  ) {
    return 'No';
  }

  return value;
}


function formatValue(value) {
  if (isEmpty(value)) {
    return '—';
  }

  if (
    typeof value === 'number' ||
    isNumericValue(value)
  ) {
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number.toLocaleString(
        undefined,
        {
          maximumFractionDigits: 2,
        }
      );
    }
  }

  return String(value);
}


function valuesEqual(first, second) {
  if (
    isNumericValue(first) &&
    isNumericValue(second)
  ) {
    return (
      Math.abs(
        Number(first) -
        Number(second)
      ) < 0.000001
    );
  }

  return (
    String(first) ===
    String(second)
  );
}


/* =========================================================
   IDENTIFIER
========================================================= */

function findIdentifierColumn(columns) {
  if (!Array.isArray(columns)) {
    return '';
  }

  const exact =
    columns.find(
      (column) =>
        ID_PATTERNS.includes(
          normalizeName(column)
        )
    );

  if (exact) {
    return exact;
  }

  return (
    columns.find(
      (column) =>
        normalizeName(column)
          .includes('id')
    ) || ''
  );
}


/* =========================================================
   MODEL FEATURES
========================================================= */

function getModelFeatures(
  dataset,
  model
) {
  const fromModel =
    model?.features ||
    model?.result?.features ||
    model?.model?.features ||
    model?.result?.feature_names;

  if (
    Array.isArray(fromModel) &&
    fromModel.length > 0
  ) {
    return fromModel
      .map((item) => {
        if (
          typeof item === 'string'
        ) {
          return item;
        }

        return (
          item?.name ||
          item?.column ||
          item?.field
        );
      })
      .filter(Boolean);
  }

  const fromDataset =
    dataset?.features ||
    dataset?.profile?.features ||
    dataset?.profile?.columns;

  if (
    Array.isArray(fromDataset)
  ) {
    return fromDataset
      .map((item) => {
        if (
          typeof item === 'string'
        ) {
          return item;
        }

        return (
          item?.name ||
          item?.column ||
          item?.field
        );
      })
      .filter(Boolean);
  }

  return [];
}


/* =========================================================
   NUMERIC RANGES
========================================================= */

function getNumericRange(
  name,
  value
) {
  const normalized =
    normalizeName(name);

  const current =
    Number(value);

  const safeCurrent =
    Number.isFinite(current)
      ? current
      : 0;

  if (
    normalized.includes('age')
  ) {
    return {
      min: 18,
      max: 70,
      step: 1,
    };
  }

  if (
    normalized.includes('experience')
  ) {
    return {
      min: 0,
      max: 50,
      step: 1,
    };
  }

  if (
    normalized.includes('monthly_hours')
  ) {
    return {
      min: 0,
      max: 400,
      step: 1,
    };
  }

  if (
    normalized.includes('projects')
  ) {
    return {
      min: 0,
      max: 50,
      step: 1,
    };
  }

  if (
    normalized.includes('performance')
  ) {
    return {
      min: 0,
      max: 100,
      step: 0.1,
    };
  }

  if (
    normalized.includes('satisfaction')
  ) {
    return {
      min: 1,
      max: 5,
      step: 0.1,
    };
  }

  if (
    normalized.includes('training')
  ) {
    return {
      min: 0,
      max: 200,
      step: 1,
    };
  }

  if (
    normalized.includes('salary')
  ) {
    return {
      min: 0,
      max: 500000,
      step: 1000,
    };
  }

  if (
    normalized.includes('overtime')
  ) {
    return {
      min: 0,
      max: 100,
      step: 1,
    };
  }

  if (
    normalized.includes('complaints')
  ) {
    return {
      min: 0,
      max: 50,
      step: 1,
    };
  }

  if (
    normalized.includes('commute')
  ) {
    return {
      min: 0,
      max: 180,
      step: 1,
    };
  }

  const magnitude =
    Math.max(
      Math.abs(safeCurrent),
      1
    );

  if (safeCurrent >= 0) {
    return {
      min: 0,
      max:
        safeCurrent === 0
          ? 10
          : Math.max(
              safeCurrent * 2,
              10
            ),
      step:
        safeCurrent > 100
          ? 1
          : 0.1,
    };
  }

  return {
    min:
      safeCurrent - magnitude,
    max: 0,
    step:
      magnitude > 100
        ? 1
        : 0.1,
  };
}


/* =========================================================
   CATEGORY OPTIONS
========================================================= */

function getCategoryOptions(
  feature,
  value
) {
  const known =
    COMMON_CATEGORIES[feature];

  if (known) {
    return known;
  }

  if (!isEmpty(value)) {
    return [
      String(value),
    ];
  }

  return [];
}


/* =========================================================
   PREDICTION EXTRACTION
========================================================= */

function extractPrediction(result) {
  if (!result) {
    return '—';
  }

  return (
    result.prediction ??
    result.predicted_class ??
    result.predicted_label ??
    result.output ??
    result.result ??
    result.value ??
    '—'
  );
}


function extractProblemType(
  result,
  model
) {
  return (
    result?.problem_type ||
    model?.problem_type ||
    model?.result?.problem_type ||
    'Unknown'
  );
}


/* =========================================================
   PROBABILITY EXTRACTION
========================================================= */

function normalizeProbability(value) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return null;
  }

  if (
    number >= 0 &&
    number <= 1
  ) {
    return number * 100;
  }

  if (
    number >= 0 &&
    number <= 100
  ) {
    return number;
  }

  return null;
}


function extractProbabilityMap(
  result
) {
  if (!result) {
    return {};
  }

  const source =
    result.probabilities ||
    result.class_probabilities ||
    result.classProbabilities ||
    result.probability_distribution ||
    null;

  if (
    !source ||
    typeof source !== 'object'
  ) {
    return {};
  }

  const output = {};

  Object.entries(source)
    .forEach(
      ([label, value]) => {
        const probability =
          normalizeProbability(
            value
          );

        if (
          probability !== null
        ) {
          output[label] =
            probability;
        }
      }
    );

  return output;
}


function extractProbability(
  result
) {
  if (!result) {
    return null;
  }

  const directCandidates = [
    result.probability,
    result.prediction_probability,
    result.churn_probability,
    result.risk_probability,
    result.positive_probability,
    result.confidence,
    result.probability_percent,
  ];

  for (
    const candidate of
    directCandidates
  ) {
    const probability =
      normalizeProbability(
        candidate
      );

    if (
      probability !== null
    ) {
      return probability;
    }
  }

  const map =
    extractProbabilityMap(
      result
    );

  const values =
    Object.values(map);

  if (values.length) {
    return Math.max(
      ...values
    );
  }

  return null;
}


/* =========================================================
   FEATURE IMPORTANCE
========================================================= */

function extractFeatureImportance(
  model,
  result
) {
  const source =
    result?.feature_importance ||
    result?.feature_importances ||
    model?.feature_importance ||
    model?.feature_importances ||
    model?.result?.feature_importance ||
    model?.result?.feature_importances;

  if (!source) {
    return [];
  }

  if (
    Array.isArray(source)
  ) {
    return source
      .map((item) => {
        if (
          typeof item === 'object'
        ) {
          return {
            feature:
              item.feature ||
              item.name ||
              item.column ||
              'Feature',

            importance:
              Number(
                item.importance ??
                item.value ??
                item.score ??
                0
              ),
          };
        }

        return null;
      })
      .filter(
        (item) =>
          item &&
          Number.isFinite(
            item.importance
          )
      )
      .sort(
        (a, b) =>
          Math.abs(
            b.importance
          ) -
          Math.abs(
            a.importance
          )
      );
  }

  if (
    typeof source === 'object'
  ) {
    return Object.entries(
      source
    )
      .map(
        ([feature, value]) => ({
          feature,
          importance:
            Number(value),
        })
      )
      .filter(
        (item) =>
          Number.isFinite(
            item.importance
          )
      )
      .sort(
        (a, b) =>
          Math.abs(
            b.importance
          ) -
          Math.abs(
            a.importance
          )
      );
  }

  return [];
}


/* =========================================================
   SAFE ERROR
========================================================= */

function getErrorMessage(error) {
  return (
    error?.message ||
    error?.response?.data?.detail ||
    'An unexpected error occurred.'
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Predictions() {
  const {
    dataset,
    model,
    predict,
    error: contextError,
    clearError,
  } = useApp();


  /* =======================================================
     DATASET COLUMNS
  ======================================================= */

  const datasetColumns =
    useMemo(() => {
      return (
        dataset?.columns ||
        dataset?.profile?.columns ||
        dataset?.profile?.column_names ||
        []
      )
        .map((column) => {
          if (
            typeof column ===
            'string'
          ) {
            return column;
          }

          return (
            column?.name ||
            column?.column ||
            column?.field
          );
        })
        .filter(Boolean);
    }, [dataset]);


  const modelFeatures =
    useMemo(
      () =>
        getModelFeatures(
          dataset,
          model
        ),
      [
        dataset,
        model,
      ]
    );


  const availableColumns =
    useMemo(() => {
      if (
        datasetColumns.length
      ) {
        return datasetColumns;
      }

      return modelFeatures;
    }, [
      datasetColumns,
      modelFeatures,
    ]);


  const defaultIdentifier =
    useMemo(
      () =>
        findIdentifierColumn(
          availableColumns
        ),
      [
        availableColumns,
      ]
    );


  /* =======================================================
     RECORD STATE
  ======================================================= */

  const [
    identifierColumn,
    setIdentifierColumn,
  ] = useState('');

  const [
    identifierValue,
    setIdentifierValue,
  ] = useState('');

  const [
    record,
    setRecord,
  ] = useState(null);

  const [
    recordLoading,
    setRecordLoading,
  ] = useState(false);

  const [
    recordError,
    setRecordError,
  ] = useState('');


  /* =======================================================
     MODEL STATE
  ======================================================= */

  const [
    currentValues,
    setCurrentValues,
  ] = useState({});

  const [
    simulationValues,
    setSimulationValues,
  ] = useState({});

  const [
    baselineResult,
    setBaselineResult,
  ] = useState(null);

  const [
    simulationResult,
    setSimulationResult,
  ] = useState(null);

  const [
    predictionLoading,
    setPredictionLoading,
  ] = useState(false);

  const [
    simulationLoading,
    setSimulationLoading,
  ] = useState(false);

  const [
    predictionError,
    setPredictionError,
  ] = useState('');

  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    showExplanation,
    setShowExplanation,
  ] = useState(true);


  /* =======================================================
     DEFAULT IDENTIFIER
  ======================================================= */

  useEffect(() => {
    if (
      defaultIdentifier &&
      !identifierColumn
    ) {
      setIdentifierColumn(
        defaultIdentifier
      );
    }
  }, [
    defaultIdentifier,
    identifierColumn,
  ]);


  /* =======================================================
     LOOKUP
  ======================================================= */

  const findRecord =
    async () => {
      setRecordError('');
      setPredictionError('');
      setSimulationResult(null);

      if (!dataset?.dataset_id) {
        setRecordError(
          'Upload a dataset before searching for a record.'
        );
        return;
      }

      if (!identifierColumn) {
        setRecordError(
          'Select an identifier column.'
        );
        return;
      }

      if (
        !identifierValue.trim()
      ) {
        setRecordError(
          'Enter an identifier value.'
        );
        return;
      }

      setRecordLoading(true);

      try {
        const response =
          await lookupDatasetRecord(
            dataset.dataset_id,
            identifierColumn,
            identifierValue.trim()
          );

        const foundRecord =
          response?.record ||
          response?.data ||
          response?.row ||
          response;

        if (
          !foundRecord ||
          typeof foundRecord !==
            'object'
        ) {
          throw new Error(
            'No matching dataset record was returned.'
          );
        }

        setRecord(
          foundRecord
        );

        const filled = {};

        modelFeatures.forEach(
          (feature) => {
            if (
              Object.prototype.hasOwnProperty.call(
                foundRecord,
                feature
              )
            ) {
              filled[feature] =
                foundRecord[feature];
            }
          }
        );

        /*
         * Fallback for models where
         * feature metadata is unavailable.
         */
        if (
          Object.keys(filled)
            .length === 0
        ) {
          Object.assign(
            filled,
            foundRecord
          );
        }

        setCurrentValues(
          filled
        );

        setSimulationValues(
          {
            ...filled,
          }
        );

        setBaselineResult(
          null
        );

        setSimulationResult(
          null
        );

        /*
         * Automatically run the baseline
         * prediction after a successful lookup.
         */
        if (
          Object.keys(filled)
            .length > 0
        ) {
          try {
            const prediction =
              await predict(
                filled
              );

            setBaselineResult(
              prediction
            );
          } catch (predictionError) {
            setPredictionError(
              getErrorMessage(
                predictionError
              )
            );
          }
        }
      } catch (error) {
        setRecord(null);
        setCurrentValues({});
        setSimulationValues({});

        setRecordError(
          getErrorMessage(
            error
          )
        );
      } finally {
        setRecordLoading(false);
      }
    };


  /* =======================================================
     SAMPLE
  ======================================================= */

  const fillSample =
    () => {
      const possibleValue =
        dataset?.sample_record?.[
          identifierColumn
        ] ??
        dataset?.preview?.[0]?.[
          identifierColumn
        ] ??
        dataset?.rows?.[0]?.[
          identifierColumn
        ];

      if (
        possibleValue !==
        undefined
      ) {
        setIdentifierValue(
          String(
            possibleValue
          )
        );

        return;
      }

      setRecordError(
        'No sample identifier is available. Enter an identifier from your uploaded dataset.'
      );
    };


  /* =======================================================
     SIMULATION UPDATE
  ======================================================= */

  const updateSimulationValue =
    (
      feature,
      value
    ) => {
      setSimulationValues(
        (previous) => ({
          ...previous,
          [feature]:
            value,
        })
      );

      /*
       * A simulation result becomes
       * stale when an input changes.
       */
      setSimulationResult(
        null
      );
    };


  /* =======================================================
     CHANGED FEATURES
  ======================================================= */

  const changedFeatures =
    useMemo(() => {
      return Object.keys(
        simulationValues
      )
        .filter(
          (feature) =>
            !valuesEqual(
              currentValues[
                feature
              ],
              simulationValues[
                feature
              ]
            )
        )
        .map(
          (feature) => ({
            feature,

            current:
              currentValues[
                feature
              ],

            simulated:
              simulationValues[
                feature
              ],
          })
        );
    }, [
      currentValues,
      simulationValues,
    ]);


  /* =======================================================
     BASELINE PREDICTION
  ======================================================= */

  const runPrediction =
    async () => {
      setPredictionError('');

      if (
        !dataset?.dataset_id
      ) {
        setPredictionError(
          'Upload a dataset first.'
        );
        return;
      }

      if (
        !Object.keys(
          currentValues
        ).length
      ) {
        setPredictionError(
          'Find a dataset record first.'
        );
        return;
      }

      setPredictionLoading(
        true
      );

      try {
        const result =
          await predict(
            currentValues
          );

        if (!result) {
          throw new Error(
            'The backend returned an empty prediction response.'
          );
        }

        setBaselineResult(
          result
        );

        setSimulationResult(
          null
        );
      } catch (error) {
        setPredictionError(
          getErrorMessage(
            error
          )
        );
      } finally {
        setPredictionLoading(
          false
        );
      }
    };


  /* =======================================================
     WHAT-IF SIMULATION
  ======================================================= */

  const runSimulation =
    async () => {
      setPredictionError('');

      if (
        !dataset?.dataset_id
      ) {
        setPredictionError(
          'Upload a dataset first.'
        );
        return;
      }

      if (!model) {
        setPredictionError(
          'Train a model before running a What-If simulation.'
        );
        return;
      }

      if (
        !Object.keys(
          simulationValues
        ).length
      ) {
        setPredictionError(
          'Find a dataset record first.'
        );
        return;
      }

      if (
        changedFeatures.length ===
        0
      ) {
        setPredictionError(
          'Change at least one feature before running a What-If simulation.'
        );
        return;
      }

      setSimulationLoading(
        true
      );

      try {
        let baseline =
          baselineResult;

        /*
         * Always make sure the comparison
         * has a genuine baseline.
         */
        if (!baseline) {
          baseline =
            await predict(
              currentValues
            );

          setBaselineResult(
            baseline
          );
        }

        const simulated =
          await predict(
            simulationValues
          );

        if (!simulated) {
          throw new Error(
            'The backend returned an empty simulation response.'
          );
        }

        setSimulationResult(
          simulated
        );
      } catch (error) {
        setPredictionError(
          getErrorMessage(
            error
          )
        );
      } finally {
        setSimulationLoading(
          false
        );
      }
    };


  /* =======================================================
     RESET
  ======================================================= */

  const resetSimulation =
    () => {
      setSimulationValues(
        {
          ...currentValues,
        }
      );

      setSimulationResult(
        null
      );

      setPredictionError('');
    };


  /* =======================================================
     OUTPUTS
  ======================================================= */

  const currentPrediction =
    extractPrediction(
      baselineResult
    );

  const simulatedPrediction =
    extractPrediction(
      simulationResult
    );

  const currentProbability =
    extractProbability(
      baselineResult
    );

  const simulatedProbability =
    extractProbability(
      simulationResult
    );

  const probabilityChange =
    currentProbability !== null &&
    simulatedProbability !== null
      ? simulatedProbability -
        currentProbability
      : null;


  const baselineProbabilityMap =
    extractProbabilityMap(
      baselineResult
    );

  const simulationProbabilityMap =
    extractProbabilityMap(
      simulationResult
    );


  const featureImportance =
    extractFeatureImportance(
      model,
      baselineResult
    );


  /* =======================================================
     MODEL INFO
  ======================================================= */

  const modelName =
    model?.best_model ||
    model?.result?.best_model ||
    model?.model_name ||
    'Trained model';

  const problemType =
    extractProblemType(
      baselineResult,
      model
    );

  const datasetName =
    dataset?.filename ||
    dataset?.file_name ||
    dataset?.name ||
    'Current dataset';


  /* =======================================================
     READINESS
  ======================================================= */

  const totalFeatures =
    modelFeatures.length ||
    Object.keys(
      currentValues
    ).length;

  const filledFeatures =
    totalFeatures
      ? modelFeatures.filter(
          (feature) =>
            !isEmpty(
              currentValues[
                feature
              ]
            )
        ).length
      : Object.keys(
          currentValues
        ).filter(
          (key) =>
            !isEmpty(
              currentValues[
                key
              ]
            )
        ).length;

  const readiness =
    totalFeatures
      ? Math.round(
          (
            filledFeatures /
            totalFeatures
          ) *
          100
        )
      : 0;


  /* =======================================================
     COPY SUMMARY
  ======================================================= */

  const copySummary =
    async () => {
      const lines = [
        'DataPilot AI - Prediction Summary',
        '',
        `Dataset: ${datasetName}`,
        `Model: ${modelName}`,
        `Problem type: ${problemType}`,
        `Record: ${
          identifierColumn
            ? record?.[
                identifierColumn
              ] || identifierValue
            : identifierValue
        }`,
        '',
        `Current prediction: ${String(
          currentPrediction
        )}`,
      ];

      if (
        currentProbability !==
        null
      ) {
        lines.push(
          `Current probability: ${currentProbability.toFixed(
            1
          )}%`
        );
      }

      if (
        simulationResult
      ) {
        lines.push(
          '',
          'What-If Scenario:',
          `Simulated prediction: ${String(
            simulatedPrediction
          )}`
        );

        if (
          simulatedProbability !==
          null
        ) {
          lines.push(
            `Simulated probability: ${simulatedProbability.toFixed(
              1
            )}%`
          );
        }

        if (
          probabilityChange !==
          null
        ) {
          lines.push(
            `Probability change: ${
              probabilityChange > 0
                ? '+'
                : ''
            }${probabilityChange.toFixed(
              1
            )} percentage points`
          );
        }

        lines.push(
          '',
          'Changed features:'
        );

        changedFeatures.forEach(
          (change) => {
            lines.push(
              `- ${
                change.feature
              }: ${
                formatValue(
                  change.current
                )
              } -> ${
                formatValue(
                  change.simulated
                )
              }`
            );
          }
        );
      }

      try {
        await navigator.clipboard.writeText(
          lines.join('\n')
        );

        setCopied(true);

        setTimeout(
          () =>
            setCopied(false),
          1800
        );
      } catch {
        setCopied(false);
      }
    };


  /* =======================================================
     EMPTY STATE
  ======================================================= */

  if (!dataset) {
    return (
      <div className="min-h-full p-6 md:p-8">
        <div className="mx-auto max-w-7xl">

          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-400">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              DataPilot AI
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Prediction Studio
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Generate real model predictions and explore
              What-If scenarios using your trained machine
              learning pipeline.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-12 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
              <Database size={30} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
              No dataset loaded
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
              Upload your dataset first. Then train a model
              in Model Lab to activate Prediction Studio.
            </p>

          </div>

        </div>
      </div>
    );
  }


  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <div className="min-h-full p-5 md:p-7">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="relative overflow-hidden rounded-[2rem] border border-orange-400/10 bg-gradient-to-br from-orange-500/[0.10] via-white/[0.025] to-transparent p-6 md:p-8">

          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-400/[0.08] blur-3xl" />

          <div className="relative">

            <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">

              <div className="max-w-4xl">

                <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/10 bg-orange-400/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">
                  <Sparkles size={12} />
                  Prediction + Decision Lab
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
                  Predict. Simulate. Understand.
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                  Find a real record from your uploaded dataset,
                  run the trained machine-learning model, create
                  a hypothetical scenario, and compare how the
                  model output changes.
                </p>

              </div>


              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

                <MiniStat
                  label="Features"
                  value={
                    totalFeatures ||
                    '—'
                  }
                  icon={BarChart3}
                />

                <MiniStat
                  label="Model"
                  value={modelName}
                  icon={BrainCircuit}
                />

                <MiniStat
                  label="Task"
                  value={problemType}
                  icon={Target}
                />

                <MiniStat
                  label="Readiness"
                  value={`${readiness}%`}
                  icon={Gauge}
                />

              </div>

            </div>

          </div>
        </section>


        {/* ==================================================
            EXPLANATION BAR
        ================================================== */}

        <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 md:p-5">

          <div className="grid gap-4 md:grid-cols-4">

            <ExplanationStep
              number="01"
              title="Find record"
              text="Load an actual row from the uploaded dataset."
            />

            <ExplanationStep
              number="02"
              title="Predict"
              text="Send its model features through the trained pipeline."
            />

            <ExplanationStep
              number="03"
              title="Change"
              text="Create a temporary What-If scenario."
            />

            <ExplanationStep
              number="04"
              title="Compare"
              text="Measure the difference between baseline and scenario."
            />

          </div>

        </section>


        {/* ==================================================
            ERRORS
        ================================================== */}

        {(
          recordError ||
          predictionError ||
          contextError
        ) && (

          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-red-300">
                {
                  recordError ||
                  predictionError ||
                  contextError
                }
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setRecordError('');
                setPredictionError('');

                if (clearError) {
                  clearError();
                }
              }}
              className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-white"
            >
              <X size={16} />
            </button>

          </div>
        )}


        {/* ==================================================
            RECORD FINDER
        ================================================== */}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 md:p-6">

          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <Search size={18} />
              </div>

              <div>
                <h2 className="font-bold text-white">
                  Find a dataset record
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Search the complete uploaded dataset and
                  automatically load the matching model inputs.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={fillSample}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Fill sample
            </button>

          </div>


          <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_auto]">

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-400">
                Identifier column
              </label>

              <select
                value={identifierColumn}
                onChange={(event) =>
                  setIdentifierColumn(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-orange-400/50"
              >

                <option value="">
                  Select identifier...
                </option>

                {availableColumns.map(
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
              <label className="mb-2 block text-xs font-semibold text-slate-400">
                Identifier value
              </label>

              <input
                value={identifierValue}
                onChange={(event) =>
                  setIdentifierValue(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    'Enter'
                  ) {
                    findRecord();
                  }
                }}
                placeholder="Example: EMP-10026"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-400/50"
              />
            </div>


            <div className="flex items-end">

              <button
                type="button"
                onClick={findRecord}
                disabled={
                  recordLoading
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >

                {recordLoading ? (
                  <>
                    <Activity
                      size={16}
                      className="animate-spin"
                    />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Find record
                  </>
                )}

              </button>

            </div>

          </div>


          {record && (
            <div className="mt-5 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.05] p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                  <Check size={17} />
                </div>

                <div className="min-w-0">

                  <div className="text-sm font-bold text-emerald-300">
                    Dataset record loaded
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {identifierColumn}:{' '}
                    <span className="text-slate-300">
                      {formatValue(
                        record?.[
                          identifierColumn
                        ]
                      )}
                    </span>

                    <span className="mx-2">
                      •
                    </span>

                    {filledFeatures}/
                    {totalFeatures ||
                      filledFeatures}{' '}
                    model features loaded
                  </div>

                </div>

              </div>

            </div>
          )}

        </section>


        {/* ==================================================
            CURRENT PROFILE + PREDICTION
        ================================================== */}

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">


          {/* PROFILE */}

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 md:p-6">

            <div className="mb-5 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                  <UserRound size={18} />
                </div>

                <div>
                  <h2 className="font-bold text-white">
                    Current profile
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    These are the values currently sent
                    to the trained model.
                  </p>
                </div>

              </div>

              <div className="text-right">

                <div className="text-sm font-bold text-white">
                  {filledFeatures}/
                  {totalFeatures ||
                    filledFeatures}
                </div>

                <div className="text-[10px] uppercase tracking-wider text-slate-600">
                  Ready
                </div>

              </div>

            </div>


            <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/5">

              <div
                className="h-full rounded-full bg-orange-400 transition-all"
                style={{
                  width:
                    `${readiness}%`,
                }}
              />

            </div>


            {Object.keys(
              currentValues
            ).length === 0 ? (

              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">

                <Target
                  size={28}
                  className="mx-auto text-slate-700"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Find a dataset record above
                  to load the model inputs.
                </p>

              </div>

            ) : (

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                {Object.entries(
                  currentValues
                ).map(
                  ([feature, value]) => (

                    <div
                      key={feature}
                      className="rounded-2xl border border-white/8 bg-black/20 p-3"
                    >

                      <div className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {feature}
                      </div>

                      <div className="mt-2 truncate text-sm font-semibold text-white">
                        {formatValue(
                          value
                        )}
                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>


          {/* PREDICTION */}

          <section className="relative overflow-hidden rounded-[2rem] border border-orange-400/20 bg-gradient-to-br from-orange-500/[0.10] via-white/[0.025] to-transparent p-5 md:p-6">

            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl" />

            <div className="relative">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/10 text-orange-400">
                  <BrainCircuit size={19} />
                </div>

                <div>

                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">
                    ML inference
                  </div>

                  <h2 className="mt-1 font-bold text-white">
                    Current prediction
                  </h2>

                </div>

              </div>


              {baselineResult ? (

                <div className="mt-8">

                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Model output
                  </div>

                  <div className="mt-2 break-words text-3xl font-black text-white">
                    {String(
                      currentPrediction
                    )}
                  </div>


                  {currentProbability !==
                    null && (

                    <>

                      <div className="mt-7">

                        <div className="text-xs text-slate-500">
                          Model probability
                        </div>

                        <div className="mt-1 text-4xl font-black text-orange-400">
                          {currentProbability.toFixed(
                            1
                          )}
                          %
                        </div>

                      </div>


                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">

                        <div
                          className="h-full rounded-full bg-orange-400 transition-all"
                          style={{
                            width:
                              `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  currentProbability
                                )
                              )}%`,
                          }}
                        />

                      </div>

                    </>

                  )}

                </div>

              ) : (

                <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-5">

                  <div className="text-sm font-bold text-white">
                    Ready for prediction
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Find a record above and
                    run the trained model.
                  </p>

                </div>

              )}


              <button
                type="button"
                onClick={runPrediction}
                disabled={
                  predictionLoading ||
                  !Object.keys(
                    currentValues
                  ).length
                }
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >

                {predictionLoading ? (
                  <>
                    <Activity
                      size={16}
                      className="animate-spin"
                    />
                    Running model...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Run prediction
                  </>
                )}

              </button>

            </div>

          </section>

        </div>


        {/* ==================================================
            PROBABILITY DISTRIBUTION
        ================================================== */}

        {Object.keys(
          baselineProbabilityMap
        ).length > 0 && (

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 md:p-6">

            <div className="mb-5">

              <div className="flex items-center gap-2">
                <BarChart3
                  size={18}
                  className="text-orange-400"
                />

                <h2 className="font-bold text-white">
                  Prediction probability distribution
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Probabilities returned by the trained
                classification model for the current profile.
              </p>

            </div>


            <div className="space-y-3">

              {Object.entries(
                baselineProbabilityMap
              ).map(
                ([label, probability]) => (

                  <div
                    key={label}
                  >

                    <div className="mb-1.5 flex items-center justify-between">

                      <span className="text-xs font-medium text-slate-300">
                        {label}
                      </span>

                      <span className="text-xs font-bold text-white">
                        {probability.toFixed(
                          1
                        )}
                        %
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">

                      <div
                        className="h-full rounded-full bg-orange-400 transition-all"
                        style={{
                          width:
                            `${Math.min(
                              100,
                              Math.max(
                                0,
                                probability
                              )
                            )}%`,
                        }}
                      />

                    </div>

                  </div>

                )
              )}

            </div>

          </section>
        )}


        {/* ==================================================
            DECISION LAB
        ================================================== */}

        <section className="overflow-hidden rounded-[2rem] border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.06] via-white/[0.02] to-transparent">

          {/* HEADER */}

          <div className="border-b border-white/8 p-5 md:p-7">

            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">

              <div>

                <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/10 bg-violet-400/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">

                  <SlidersHorizontal size={12} />

                  Decision Lab

                </div>

                <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">
                  What-If Simulator
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                  Change one or more model inputs and
                  DataPilot will send the modified profile
                  through the same trained model. The simulator
                  then compares the original model output with
                  the hypothetical scenario.
                </p>

              </div>


              <button
                type="button"
                onClick={resetSimulation}
                disabled={
                  changedFeatures.length ===
                    0 &&
                  !simulationResult
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >

                <RotateCcw size={15} />

                Reset scenario

              </button>

            </div>


            {/* HOW SIMULATOR WORKS */}

            <div className="mt-6 grid gap-3 md:grid-cols-3">

              <InfoCard
                icon={Database}
                title="1. Baseline"
                text="The original record becomes the reference profile."
              />

              <InfoCard
                icon={SlidersHorizontal}
                title="2. Scenario"
                text="You temporarily modify selected feature values."
              />

              <InfoCard
                icon={BarChart3}
                title="3. Compare"
                text="The model runs again and the outputs are compared."
              />

            </div>

          </div>


          {/* CONTROLS */}

          <div className="p-5 md:p-7">

            {Object.keys(
              simulationValues
            ).length === 0 ? (

              <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">

                <WandSparkles
                  size={32}
                  className="mx-auto text-slate-700"
                />

                <h3 className="mt-4 font-bold text-white">
                  Load a record to start simulation
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-xs leading-6 text-slate-500">
                  Once a record is loaded, every available
                  model feature will appear here as an
                  editable What-If control.
                </p>

              </div>

            ) : (

              <>

                <div className="mb-5 flex items-center justify-between">

                  <div>

                    <h3 className="font-bold text-white">
                      Scenario controls
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Modify inputs you want to test.
                    </p>

                  </div>

                  <div className="rounded-full bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-300">
                    {changedFeatures.length}{' '}
                    changed
                  </div>

                </div>


                <div className="grid gap-4 lg:grid-cols-2">

                  {Object.entries(
                    simulationValues
                  ).map(
                    ([feature, value]) => {

                      const numeric =
                        isNumericValue(
                          value
                        );

                      const booleanLike =
                        isBooleanLike(
                          value
                        );

                      const options =
                        getCategoryOptions(
                          feature,
                          value
                        );

                      const range =
                        numeric
                          ? getNumericRange(
                              feature,
                              value
                            )
                          : null;

                      const normalized =
                        normalizeName(
                          feature
                        );

                      const isIdentifier =
                        normalized.includes(
                          'id'
                        );

                      const isDate =
                        normalized.includes(
                          'date'
                        );

                      const changed =
                        changedFeatures.some(
                          (item) =>
                            item.feature ===
                            feature
                        );

                      return (

                        <div
                          key={feature}
                          className={`rounded-2xl border p-4 transition ${
                            changed
                              ? 'border-violet-400/30 bg-violet-400/[0.06]'
                              : 'border-white/8 bg-black/20'
                          }`}
                        >

                          <div className="mb-4 flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <div className="truncate text-sm font-bold text-white">
                                {feature}
                              </div>

                              <div className="mt-1 text-[11px] text-slate-600">
                                Current:{' '}
                                <span className="text-slate-300">
                                  {formatValue(
                                    currentValues[
                                      feature
                                    ]
                                  )}
                                </span>
                              </div>

                            </div>


                            {changed && (

                              <span className="shrink-0 rounded-full bg-violet-400/10 px-2 py-1 text-[10px] font-bold text-violet-300">
                                Changed
                              </span>

                            )}

                          </div>


                          {isIdentifier ? (

                            <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 text-xs text-slate-600">
                              Identifier field — kept unchanged.
                            </div>

                          ) : isDate ? (

                            <input
                              type="date"
                              value={
                                value
                                  ? String(
                                      value
                                    )
                                  : ''
                              }
                              onChange={(event) =>
                                updateSimulationValue(
                                  feature,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-violet-400/50"
                            />

                          ) : numeric ? (

                            <div>

                              <div className="flex items-center gap-3">

                                <input
                                  type="range"
                                  min={
                                    range.min
                                  }
                                  max={
                                    range.max
                                  }
                                  step={
                                    range.step
                                  }
                                  value={
                                    Math.min(
                                      range.max,
                                      Math.max(
                                        range.min,
                                        Number(
                                          value
                                        )
                                      )
                                    )
                                  }
                                  onChange={(event) =>
                                    updateSimulationValue(
                                      feature,
                                      Number(
                                        event
                                          .target
                                          .value
                                      )
                                    )
                                  }
                                  className="min-w-0 flex-1 accent-violet-400"
                                />

                                <input
                                  type="number"
                                  min={
                                    range.min
                                  }
                                  max={
                                    range.max
                                  }
                                  step={
                                    range.step
                                  }
                                  value={
                                    value ??
                                    ''
                                  }
                                  onChange={(event) =>
                                    updateSimulationValue(
                                      feature,
                                      event
                                        .target
                                        .value ===
                                        ''
                                        ? ''
                                        : Number(
                                            event
                                              .target
                                              .value
                                          )
                                    )
                                  }
                                  className="h-10 w-28 rounded-xl border border-white/10 bg-black/30 px-2 text-right text-sm font-semibold text-white outline-none focus:border-violet-400/50"
                                />

                              </div>

                              <div className="mt-2 flex justify-between text-[10px] text-slate-600">
                                <span>
                                  {formatValue(
                                    range.min
                                  )}
                                </span>

                                <span>
                                  {formatValue(
                                    range.max
                                  )}
                                </span>
                              </div>

                            </div>

                          ) : booleanLike ? (

                            <select
                              value={normalizeBooleanValue(
                                value
                              )}
                              onChange={(event) =>
                                updateSimulationValue(
                                  feature,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-violet-400/50"
                            >

                              <option value="Yes">
                                Yes
                              </option>

                              <option value="No">
                                No
                              </option>

                            </select>

                          ) : options.length > 1 ? (

                            <select
                              value={
                                value ??
                                ''
                              }
                              onChange={(event) =>
                                updateSimulationValue(
                                  feature,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-violet-400/50"
                            >

                              {options.map(
                                (option) => (
                                  <option
                                    key={option}
                                    value={option}
                                  >
                                    {option}
                                  </option>
                                )
                              )}

                            </select>

                          ) : (

                            <input
                              value={
                                value ??
                                ''
                              }
                              onChange={(event) =>
                                updateSimulationValue(
                                  feature,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-violet-400/50"
                            />

                          )}

                        </div>

                      );
                    }
                  )}

                </div>


                {/* ==================================================
                    SCENARIO SUMMARY
                ================================================== */}

                <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-5">

                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">

                    <div>

                      <h3 className="font-bold text-white">
                        Scenario summary
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        These are the only values that differ
                        from the original profile.
                      </p>

                    </div>

                    <div className="text-xs font-bold text-violet-300">
                      {changedFeatures.length}{' '}
                      feature
                      {changedFeatures.length ===
                      1
                        ? ''
                        : 's'}{' '}
                      changed
                    </div>

                  </div>


                  {changedFeatures.length ===
                  0 ? (

                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-white/8 p-4">

                      <Info
                        size={16}
                        className="text-slate-600"
                      />

                      <span className="text-xs text-slate-600">
                        Change one or more inputs
                        to create a What-If scenario.
                      </span>

                    </div>

                  ) : (

                    <div className="mt-4 space-y-2">

                      {changedFeatures.map(
                        (change) => (

                          <div
                            key={
                              change.feature
                            }
                            className="flex flex-col gap-2 rounded-xl border border-white/6 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between"
                          >

                            <div className="text-xs font-bold text-slate-300">
                              {change.feature}
                            </div>

                            <div className="flex items-center gap-2">

                              <span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-500">
                                {formatValue(
                                  change.current
                                )}
                              </span>

                              <ArrowRight
                                size={13}
                                className="text-slate-700"
                              />

                              <span className="rounded-lg bg-violet-400/10 px-2.5 py-1.5 text-xs font-bold text-violet-300">
                                {formatValue(
                                  change.simulated
                                )}
                              </span>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>


                {/* ==================================================
                    SIMULATE
                ================================================== */}

                <button
                  type="button"
                  onClick={runSimulation}
                  disabled={
                    simulationLoading ||
                    changedFeatures.length ===
                      0
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-400 px-5 py-3.5 text-sm font-black text-black transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  {simulationLoading ? (
                    <>
                      <Activity
                        size={17}
                        className="animate-spin"
                      />

                      Running scenario through model...
                    </>
                  ) : (
                    <>
                      <WandSparkles
                        size={17}
                      />

                      Run What-If simulation
                    </>
                  )}

                </button>


                {/* ==================================================
                    RESULT
                ================================================== */}

                {simulationResult && (

                  <div className="mt-7">

                    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">

                      <div>

                        <div className="flex items-center gap-2">

                          <BarChart3
                            size={18}
                            className="text-violet-300"
                          />

                          <h3 className="text-lg font-black text-white">
                            Simulation result
                          </h3>

                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          This compares the model response
                          before and after your hypothetical
                          input changes.
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={copySummary}
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5"
                      >

                        {copied ? (
                          <>
                            <Check
                              size={14}
                            />
                            Copied
                          </>
                        ) : (
                          <>
                            <Clipboard
                              size={14}
                            />
                            Copy summary
                          </>
                        )}

                      </button>

                    </div>


                    {/* CURRENT VS SIMULATED */}

                    <div className="grid gap-4 md:grid-cols-2">

                      <ResultCard
                        title="Current profile"
                        label="Baseline"
                        prediction={
                          currentPrediction
                        }
                        probability={
                          currentProbability
                        }
                      />

                      <ResultCard
                        title="What-If scenario"
                        label="Simulated"
                        prediction={
                          simulatedPrediction
                        }
                        probability={
                          simulatedProbability
                        }
                        simulated
                      />

                    </div>


                    {/* PROBABILITY CHANGE */}

                    {probabilityChange !==
                      null && (

                      <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-5">

                        <div className="flex items-center gap-3">

                          {probabilityChange <
                          0 ? (

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                              <TrendingDown
                                size={20}
                              />
                            </div>

                          ) : probabilityChange >
                            0 ? (

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10 text-red-400">
                              <TrendingUp
                                size={20}
                              />
                            </div>

                          ) : (

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400">
                              <ArrowRight
                                size={20}
                              />
                            </div>

                          )}

                          <div>

                            <div className="text-xs text-slate-500">
                              Probability change
                            </div>

                            <div className="mt-1 text-2xl font-black text-white">

                              {probabilityChange >
                              0
                                ? '+'
                                : ''}

                              {probabilityChange.toFixed(
                                1
                              )}

                              <span className="ml-2 text-sm font-medium text-slate-500">
                                percentage points
                              </span>

                            </div>

                          </div>

                        </div>


                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">

                          <div
                            className={`h-full rounded-full ${
                              probabilityChange <
                              0
                                ? 'bg-emerald-400'
                                : probabilityChange >
                                  0
                                ? 'bg-red-400'
                                : 'bg-slate-500'
                            }`}
                            style={{
                              width:
                                `${Math.min(
                                  100,
                                  Math.abs(
                                    probabilityChange
                                  ) *
                                    2
                                )}%`,
                            }}
                          />

                        </div>

                      </div>
                    )}


                    {/* ==================================================
                        EXPLANATION
                    ================================================== */}

                    <div className="mt-4 overflow-hidden rounded-2xl border border-orange-400/10 bg-orange-400/[0.025]">

                      <button
                        type="button"
                        onClick={() =>
                          setShowExplanation(
                            (value) =>
                              !value
                          )
                        }
                        className="flex w-full items-center justify-between gap-4 p-5 text-left"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-400/10 text-orange-400">
                            <Sparkles
                              size={17}
                            />
                          </div>

                          <div>

                            <h3 className="text-sm font-bold text-white">
                              Why did the model output change?
                            </h3>

                            <p className="mt-1 text-xs text-slate-600">
                              Model-behavior explanation
                            </p>

                          </div>

                        </div>

                        <ChevronDown
                          size={17}
                          className={`text-slate-600 transition ${
                            showExplanation
                              ? 'rotate-180'
                              : ''
                          }`}
                        />

                      </button>


                      {showExplanation && (

                        <div className="border-t border-white/6 p-5">

                          <div className="rounded-xl border border-white/6 bg-black/20 p-4">

                            <p className="text-xs leading-6 text-slate-400">

                              The simulator does not retrain
                              the model. It keeps the same trained
                              pipeline and sends the modified
                              scenario values through it again.

                              {' '}

                              The difference between the baseline
                              and simulated outputs therefore shows
                              how the trained model responds to
                              those hypothetical inputs.

                            </p>

                          </div>


                          <div className="mt-4 space-y-2">

                            {changedFeatures.map(
                              (change) => (

                                <div
                                  key={
                                    change.feature
                                  }
                                  className="flex flex-col gap-2 rounded-xl bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between"
                                >

                                  <div>

                                    <div className="text-xs font-bold text-slate-300">
                                      {change.feature}
                                    </div>

                                    <div className="mt-1 text-[11px] text-slate-600">
                                      Input changed
                                    </div>

                                  </div>

                                  <div className="text-xs text-slate-500">

                                    {formatValue(
                                      change.current
                                    )}

                                    {' → '}

                                    <span className="font-bold text-violet-300">
                                      {formatValue(
                                        change.simulated
                                      )}
                                    </span>

                                  </div>

                                </div>

                              )
                            )}

                          </div>


                          {probabilityChange !==
                            null && (

                            <div className="mt-4 rounded-xl border border-white/6 bg-black/20 p-4">

                              <div className="text-xs font-bold text-white">
                                Model response
                              </div>

                              <p className="mt-2 text-xs leading-6 text-slate-500">

                                The returned probability changed
                                from{' '}

                                <span className="font-bold text-slate-300">
                                  {currentProbability.toFixed(
                                    1
                                  )}%
                                </span>

                                {' '}to{' '}

                                <span className="font-bold text-violet-300">
                                  {simulatedProbability.toFixed(
                                    1
                                  )}%
                                </span>

                                , a change of{' '}

                                <span className="font-bold text-white">
                                  {probabilityChange >
                                  0
                                    ? '+'
                                    : ''}
                                  {probabilityChange.toFixed(
                                    1
                                  )}
                                  {' '}
                                  percentage points
                                </span>
                                .

                              </p>

                            </div>

                          )}


                          <div className="mt-4 flex gap-3 rounded-xl border border-amber-400/10 bg-amber-400/[0.03] p-4">

                            <Info
                              size={16}
                              className="mt-0.5 shrink-0 text-amber-400"
                            />

                            <p className="text-[11px] leading-5 text-slate-500">

                              <span className="font-bold text-slate-300">
                                Important:
                              </span>{' '}

                              this is a model-response explanation,
                              not causal evidence. For example, if
                              increasing a feature changes the
                              prediction, the simulator does not
                              prove that changing that real-world
                              feature would actually cause the outcome.

                            </p>

                          </div>

                        </div>

                      )}

                    </div>


                    {/* ==================================================
                        FEATURE IMPORTANCE
                    ================================================== */}

                    {featureImportance.length >
                      0 && (

                      <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-5">

                        <div className="flex items-center gap-2">

                          <Target
                            size={17}
                            className="text-blue-300"
                          />

                          <div>

                            <h3 className="text-sm font-bold text-white">
                              Model feature importance
                            </h3>

                            <p className="mt-1 text-xs text-slate-600">
                              Importance supplied by the trained
                              model metadata.
                            </p>

                          </div>

                        </div>


                        <div className="mt-5 space-y-3">

                          {featureImportance
                            .slice(
                              0,
                              8
                            )
                            .map(
                              (
                                item
                              ) => {

                                const maxImportance =
                                  Math.max(
                                    ...featureImportance.map(
                                      (
                                        entry
                                      ) =>
                                        Math.abs(
                                          entry.importance
                                        )
                                    ),
                                    0.000001
                                  );

                                const width =
                                  (
                                    Math.abs(
                                      item.importance
                                    ) /
                                    maxImportance
                                  ) *
                                  100;

                                return (

                                  <div
                                    key={
                                      item.feature
                                    }
                                  >

                                    <div className="mb-1.5 flex items-center justify-between gap-3">

                                      <span className="truncate text-xs font-medium text-slate-300">
                                        {item.feature}
                                      </span>

                                      <span className="shrink-0 text-[11px] text-slate-600">
                                        {formatValue(
                                          item.importance
                                        )}
                                      </span>

                                    </div>

                                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">

                                      <div
                                        className="h-full rounded-full bg-blue-400"
                                        style={{
                                          width:
                                            `${Math.min(
                                              100,
                                              Math.max(
                                                0,
                                                width
                                              )
                                            )}%`,
                                        }}
                                      />

                                    </div>

                                  </div>

                                );
                              }
                            )}

                        </div>


                        <div className="mt-4 rounded-xl border border-white/6 bg-white/[0.015] p-3">

                          <p className="text-[11px] leading-5 text-slate-600">

                            Feature importance and scenario
                            changes are different concepts.
                            Importance describes how the model
                            uses features according to the
                            supplied importance method. A scenario
                            change describes what happens when
                            you alter an input and run the model
                            again.

                          </p>

                        </div>

                      </div>

                    )}

                  </div>

                )}

              </>

            )}

          </div>

        </section>


        {/* ==================================================
            INTERPRETATION GUIDE
        ================================================== */}

        <section className="rounded-[2rem] border border-white/8 bg-white/[0.02] p-5 md:p-6">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
              <Info size={18} />
            </div>

            <div>

              <h2 className="font-bold text-white">
                How to interpret the simulator
              </h2>

              <p className="mt-2 max-w-4xl text-xs leading-6 text-slate-500">
                The What-If Simulator is a decision-support
                feature. It answers a specific technical question:
                <span className="font-semibold text-slate-300">
                  {' '}
                  "What does my trained model output when I replace
                  the original inputs with this hypothetical profile?"
                </span>
              </p>

            </div>

          </div>


          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">

            <GuideItem
              title="Baseline"
              text="Prediction produced from the original record."
            />

            <GuideItem
              title="Scenario"
              text="Prediction produced from your modified inputs."
            />

            <GuideItem
              title="Delta"
              text="Difference between the two model outputs."
            />

            <GuideItem
              title="Caution"
              text="A model response is not proof of causation."
            />

          </div>

        </section>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.015] p-4">

          <AlertCircle
            size={16}
            className="mt-0.5 shrink-0 text-slate-700"
          />

          <p className="text-[11px] leading-5 text-slate-600">

            DataPilot AI uses the trained model to evaluate
            both the original and hypothetical profiles.
            The original dataset is not modified by the
            What-If Simulator. Scenario values exist only
            for the current simulation.

          </p>

        </div>

      </div>
    </div>
  );
}


/* =========================================================
   UI COMPONENTS
========================================================= */

function MiniStat({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="min-w-[115px] rounded-2xl border border-white/8 bg-black/20 px-3 py-3">

      <div className="flex items-center gap-2 text-slate-600">

        <Icon size={13} />

        <span className="text-[9px] font-bold uppercase tracking-wider">
          {label}
        </span>

      </div>

      <div className="mt-2 max-w-[130px] truncate text-sm font-black text-white">
        {value}
      </div>

    </div>
  );
}


function ExplanationStep({
  number,
  title,
  text,
}) {
  return (
    <div className="rounded-xl border border-white/6 bg-black/15 p-4">

      <div className="text-[10px] font-black tracking-widest text-orange-400">
        {number}
      </div>

      <div className="mt-2 text-sm font-bold text-white">
        {title}
      </div>

      <div className="mt-1 text-[11px] leading-5 text-slate-600">
        {text}
      </div>

    </div>
  );
}


function InfoCard({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="rounded-xl border border-white/6 bg-black/15 p-4">

      <div className="flex items-center gap-2">

        <Icon
          size={15}
          className="text-violet-300"
        />

        <span className="text-xs font-bold text-slate-300">
          {title}
        </span>

      </div>

      <p className="mt-2 text-[11px] leading-5 text-slate-600">
        {text}
      </p>

    </div>
  );
}


function ResultCard({
  title,
  label,
  prediction,
  probability,
  simulated = false,
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        simulated
          ? 'border-violet-400/20 bg-violet-400/[0.05]'
          : 'border-white/8 bg-black/20'
      }`}
    >

      <div
        className={`text-[10px] font-black uppercase tracking-[0.18em] ${
          simulated
            ? 'text-violet-300'
            : 'text-slate-600'
        }`}
      >
        {label}
      </div>

      <div className="mt-1 text-xs text-slate-600">
        {title}
      </div>

      <div className="mt-4 break-words text-2xl font-black text-white">
        {String(prediction)}
      </div>

      {probability !== null && (
        <div
          className={`mt-3 text-3xl font-black ${
            simulated
              ? 'text-violet-300'
              : 'text-orange-400'
          }`}
        >
          {probability.toFixed(
            1
          )}
          %
        </div>
      )}

    </div>
  );
}


function GuideItem({
  title,
  text,
}) {
  return (
    <div className="rounded-xl border border-white/6 bg-black/15 p-4">

      <div className="text-xs font-bold text-white">
        {title}
      </div>

      <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
        {text}
      </p>

    </div>
  );
}
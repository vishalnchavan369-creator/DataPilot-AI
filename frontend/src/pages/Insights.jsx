import { useMemo } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import {
  Card,
  Empty,
  Fade,
  Page,
} from '../components/UI';

export default function Insights() {
  const { dataset, model } = useApp();

  if (!dataset) {
    return (
      <Page
        title="AI Insights"
        sub="Transparent, data-grounded observations generated from your dataset."
      >
        <Empty text="Upload a dataset to generate AI-powered insights." />
      </Page>
    );
  }

  const profile = dataset.profile || {};

  const rows = Number(profile.rows) || 0;

  const cols =
    Number(profile.cols) ||
    Number(profile.columns) ||
    0;

  const quality =
    Number(profile.quality_score) ||
    Number(profile.quality) ||
    0;

  const numericColumns =
    profile.numeric_columns || [];

  const categoricalColumns =
    profile.categorical_columns || [];

  const missing =
    Number(profile.missing_values) ||
    0;

  const missingPct =
    Number(profile.missing_pct) ||
    0;

  const duplicates =
    Number(profile.duplicates) ||
    Number(profile.duplicate_rows) ||
    0;

  const outliers =
    Number(profile.outliers) ||
    0;

  const insights = useMemo(
    () =>
      generateInsights({
        rows,
        cols,
        quality,
        numericColumns,
        categoricalColumns,
        missing,
        missingPct,
        duplicates,
        outliers,
        model,
      }),
    [
      rows,
      cols,
      quality,
      numericColumns,
      categoricalColumns,
      missing,
      missingPct,
      duplicates,
      outliers,
      model,
    ]
  );

  const recommendations = useMemo(
    () =>
      generateRecommendations({
        rows,
        quality,
        missing,
        missingPct,
        duplicates,
        outliers,
        numericColumns,
        categoricalColumns,
        model,
      }),
    [
      rows,
      quality,
      missing,
      missingPct,
      duplicates,
      outliers,
      numericColumns,
      categoricalColumns,
      model,
    ]
  );

  const riskCount = insights.filter(
    (item) => item.type === 'warning'
  ).length;

  const positiveCount = insights.filter(
    (item) => item.type === 'success'
  ).length;

  return (
    <Page
      title="AI Insights"
      sub="Transparent, data-grounded observations from the DataPilot AI analysis engine."
    >
      <div className="space-y-6">

        {/* =====================================================
            EXECUTIVE SUMMARY
        ====================================================== */}

        <div className="glass relative overflow-hidden rounded-2xl border border-indigo-400/20 p-6">

          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative">

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div className="flex gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                  <Sparkles className="h-6 w-6" />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    AI Analysis Summary
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-white">
                    Dataset intelligence overview
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    DataPilot AI analyzed the available dataset profile,
                    quality indicators and model context to identify
                    important observations and areas that may require
                    attention.
                  </p>

                </div>

              </div>

              <div className="flex gap-3">

                <SummaryBadge
                  icon={CheckCircle2}
                  value={positiveCount}
                  label="Positive"
                />

                <SummaryBadge
                  icon={AlertTriangle}
                  value={riskCount}
                  label="Warnings"
                />

              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            DATASET HEALTH
        ====================================================== */}

        <section>

          <SectionHeader
            icon={Database}
            title="Dataset Health"
            subtitle="A high-level view of the current dataset condition."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

            <HealthCard
              icon={Database}
              label="Rows"
              value={rows.toLocaleString()}
              description="Observations"
            />

            <HealthCard
              icon={BarChart3}
              label="Columns"
              value={cols}
              description="Variables"
            />

            <HealthCard
              icon={ShieldAlert}
              label="Quality"
              value={`${quality}/100`}
              description="Data health score"
            />

            <HealthCard
              icon={Target}
              label="Missing"
              value={`${missingPct}%`}
              description={`${missing} missing values`}
            />

            <HealthCard
              icon={AlertTriangle}
              label="Duplicates"
              value={duplicates}
              description="Duplicate records"
            />

          </div>

        </section>

        {/* =====================================================
            GENERATED INSIGHTS
        ====================================================== */}

        <section>

          <SectionHeader
            icon={Sparkles}
            title="Generated Insights"
            subtitle="Observations supported by the current dataset and model context."
          />

          <div className="grid gap-5 md:grid-cols-2">

            {insights.map((item, index) => (

              <Fade
                key={`${item.title}-${index}`}
                delay={index * 0.05}
              >
                <InsightCard item={item} />
              </Fade>

            ))}

          </div>

        </section>

        {/* =====================================================
            MODEL INSIGHTS
        ====================================================== */}

        {model && (
          <section>

            <SectionHeader
              icon={BrainCircuit}
              title="Machine Learning Insights"
              subtitle="Observations based on the currently trained model."
            />

            <div className="grid gap-5 md:grid-cols-2">

              <ModelInsightCard
                title="Selected Model"
                value={
                  model.best_model ||
                  model.model_name ||
                  'Trained Model'
                }
                description={
                  `The current ${model.problem_type || 'machine-learning'} workflow selected this model based on the available holdout evaluation.`
                }
              />

              <ModelInsightCard
                title="Model Evaluation"
                value={
                  model.score !== undefined
                    ? formatMetric(model.score)
                    : 'Available'
                }
                description="Model performance should be interpreted together with the validation strategy and dataset characteristics."
              />

              <ModelInsightCard
                title="Feature Analysis"
                value={
                  Array.isArray(model.feature_importance)
                    ? `${model.feature_importance.length} features`
                    : 'Available'
                }
                description="Feature importance can help identify which variables the model relied on most."
              />

              <ModelInsightCard
                title="Explainability"
                value="Available"
                description="Use the Explainability module to inspect global feature importance from the trained model."
              />

            </div>

          </section>
        )}

        {/* =====================================================
            DATA RISKS
        ====================================================== */}

        <section>

          <SectionHeader
            icon={ShieldAlert}
            title="Potential Data Risks"
            subtitle="Items that should be reviewed before drawing strong conclusions."
          />

          <div className="grid gap-4 md:grid-cols-2">

            <RiskCard
              title="Sample Size"
              active={rows < 100}
              text={
                rows < 100
                  ? `The dataset contains only ${rows.toLocaleString()} rows. Statistical estimates and machine-learning validation may be less stable with a small sample.`
                  : `The dataset contains ${rows.toLocaleString()} rows. Sample size should still be considered together with the complexity of the intended analysis.`
              }
            />

            <RiskCard
              title="Missing Data"
              active={missing > 0}
              text={
                missing > 0
                  ? `${missing.toLocaleString()} missing value(s) were detected. Review their location and determine whether imputation or another treatment is appropriate.`
                  : 'No missing values are currently reported in the dataset profile.'
              }
            />

            <RiskCard
              title="Duplicate Records"
              active={duplicates > 0}
              text={
                duplicates > 0
                  ? `${duplicates.toLocaleString()} duplicate row(s) were detected and should be reviewed before modeling.`
                  : 'No duplicate rows are currently reported.'
              }
            />

            <RiskCard
              title="Outliers"
              active={outliers > 0}
              text={
                outliers > 0
                  ? `${outliers.toLocaleString()} potential outlier observation(s) were detected. Investigate them before deciding whether they should be retained or transformed.`
                  : 'No outliers are currently reported by the available profile.'
              }
            />

          </div>

        </section>

        {/* =====================================================
            RECOMMENDATIONS
        ====================================================== */}

        <section>

          <SectionHeader
            icon={Lightbulb}
            title="Recommended Next Steps"
            subtitle="Practical actions based on the current dataset state."
          />

          <Card>

            <div className="space-y-4">

              {recommendations.map((item, index) => (

                <Recommendation
                  key={`${item}-${index}`}
                  number={index + 1}
                  text={item}
                />

              ))}

            </div>

          </Card>

        </section>

        {/* =====================================================
            TRANSPARENCY
        ====================================================== */}

        <Card>

          <div className="flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <ShieldAlert className="h-5 w-5" />
            </div>

            <div>

              <h3 className="font-bold text-white">
                Insight Transparency
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                These observations are generated from the dataset profile
                and available model outputs. They should be treated as
                analytical guidance rather than proof of causality or
                guarantees about future model performance.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">

                <Badge>
                  Dataset Grounded
                </Badge>

                <Badge>
                  Model Grounded
                </Badge>

                <Badge>
                  No Invented Metrics
                </Badge>

                <Badge>
                  Transparent Evidence
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
   INSIGHT GENERATOR
================================================================ */

function generateInsights({
  rows,
  cols,
  quality,
  numericColumns,
  categoricalColumns,
  missing,
  missingPct,
  duplicates,
  outliers,
  model,
}) {
  const result = [];

  /* Dataset size */

  if (rows < 100) {
    result.push({
      type: 'warning',
      icon: AlertTriangle,
      title: 'Small Dataset',
      text:
        `The dataset contains ${rows.toLocaleString()} rows. ` +
        'This relatively small sample can limit statistical reliability and make machine-learning validation more sensitive to the train/test split.',
      evidence: 'profile.rows',
    });
  } else {
    result.push({
      type: 'success',
      icon: CheckCircle2,
      title: 'Dataset Size',
      text:
        `The dataset contains ${rows.toLocaleString()} rows across ${cols} columns, providing a measurable sample for exploratory analysis.`,
      evidence: 'profile.rows / profile.cols',
    });
  }

  /* Data quality */

  if (quality >= 90) {
    result.push({
      type: 'success',
      icon: ShieldAlert,
      title: 'Strong Data Quality',
      text:
        `The current health score is ${quality}/100. The implemented quality checks indicate relatively clean data.`,
      evidence: 'profile.quality_score',
    });
  } else if (quality >= 70) {
    result.push({
      type: 'warning',
      icon: AlertTriangle,
      title: 'Moderate Data Quality',
      text:
        `The dataset currently has a ${quality}/100 health score. Review quality warnings before relying heavily on downstream modeling.`,
      evidence: 'profile.quality_score',
    });
  } else {
    result.push({
      type: 'warning',
      icon: AlertTriangle,
      title: 'Data Quality Requires Attention',
      text:
        `The current health score is ${quality}/100. Additional cleaning and validation should be considered before modeling.`,
      evidence: 'profile.quality_score',
    });
  }

  /* Feature composition */

  result.push({
    type: 'info',
    icon: BarChart3,
    title: 'Feature Composition',
    text:
      `The dataset contains ${numericColumns.length} numerical and ${categoricalColumns.length} categorical columns. This combination can support both statistical exploration and machine-learning workflows depending on the target variable.`,
    evidence: 'profile.numeric_columns / profile.categorical_columns',
  });

  /* Missing values */

  if (missing > 0) {
    result.push({
      type: 'warning',
      icon: AlertTriangle,
      title: 'Missing Data Detected',
      text:
        `${missing.toLocaleString()} missing value(s) were detected, representing approximately ${missingPct}% of the reported cells.`,
      evidence: 'profile.missing_values / profile.missing_pct',
    });
  } else {
    result.push({
      type: 'success',
      icon: CheckCircle2,
      title: 'No Missing Values Reported',
      text:
        'The current dataset profile does not report missing values. Special placeholder values such as "Unknown" or "N/A" may still require domain-specific checking.',
      evidence: 'profile.missing_values',
    });
  }

  /* Duplicates */

  if (duplicates > 0) {
    result.push({
      type: 'warning',
      icon: AlertTriangle,
      title: 'Duplicate Records',
      text:
        `${duplicates.toLocaleString()} duplicate row(s) were detected. Review them before training models because repeated observations can affect analysis and validation.`,
      evidence: 'profile.duplicates',
    });
  } else {
    result.push({
      type: 'success',
      icon: CheckCircle2,
      title: 'No Duplicate Rows',
      text:
        'The current profile does not report duplicate rows.',
      evidence: 'profile.duplicates',
    });
  }

  /* Outliers */

  if (outliers > 0) {
    result.push({
      type: 'warning',
      icon: TrendingUp,
      title: 'Potential Outliers',
      text:
        `${outliers.toLocaleString()} potential outlier observation(s) were detected. These should be investigated rather than automatically removed.`,
      evidence: 'profile.outliers',
    });
  }

  /* Model */

  if (model) {
    result.push({
      type: 'success',
      icon: BrainCircuit,
      title: 'Model Available',
      text:
        `A ${model.problem_type || 'machine-learning'} model has been trained. The selected baseline is ${model.best_model || model.model_name || 'available in Model Lab'}.`,
      evidence: 'model context',
    });
  } else {
    result.push({
      type: 'info',
      icon: BrainCircuit,
      title: 'Modeling Not Started',
      text:
        'No trained model is currently available. Select a meaningful target and relevant features in Model Lab to begin predictive analysis.',
      evidence: 'model context',
    });
  }

  return result;
}


/* ===============================================================
   RECOMMENDATION GENERATOR
================================================================ */

function generateRecommendations({
  rows,
  quality,
  missing,
  missingPct,
  duplicates,
  outliers,
  numericColumns,
  categoricalColumns,
  model,
}) {
  const recommendations = [];

  if (missing > 0) {
    recommendations.push(
      `Investigate the ${missing.toLocaleString()} missing value(s) and choose a treatment appropriate for each affected column.`
    );
  }

  if (duplicates > 0) {
    recommendations.push(
      `Review the ${duplicates.toLocaleString()} duplicate row(s) before machine-learning training.`
    );
  }

  if (outliers > 0) {
    recommendations.push(
      `Investigate the ${outliers.toLocaleString()} potential outlier(s) and determine whether they are valid observations or data-quality issues.`
    );
  }

  if (rows < 100) {
    recommendations.push(
      'Consider collecting additional representative observations before relying heavily on predictive modeling.'
    );
  }

  if (quality < 80) {
    recommendations.push(
      'Complete data-quality checks and cleaning before using the dataset for important predictive decisions.'
    );
  }

  if (numericColumns.length >= 2) {
    recommendations.push(
      'Review the EDA correlation matrix to identify potentially related numerical variables and possible multicollinearity.'
    );
  }

  if (categoricalColumns.length > 0) {
    recommendations.push(
      'Review category frequencies and rare categories before encoding categorical variables for machine learning.'
    );
  }

  if (!model) {
    recommendations.push(
      'Define a meaningful target variable and train multiple baseline models in Model Lab before selecting a final approach.'
    );
  } else {
    recommendations.push(
      'Compare the trained model against alternative algorithms and inspect Explainability before interpreting model results.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Continue with exploratory analysis and validate the dataset against the requirements of your intended analytical task.'
    );
  }

  return recommendations.slice(0, 7);
}


/* ===============================================================
   INSIGHT CARD
================================================================ */

function InsightCard({ item }) {
  const Icon = item.icon;

  const styles = {
    success: {
      icon: 'bg-emerald-500/10 text-emerald-300',
      border: 'hover:border-emerald-400/20',
      badge: 'text-emerald-300',
      label: 'Positive signal',
    },
    warning: {
      icon: 'bg-yellow-500/10 text-yellow-300',
      border: 'hover:border-yellow-400/20',
      badge: 'text-yellow-300',
      label: 'Needs attention',
    },
    info: {
      icon: 'bg-indigo-500/10 text-indigo-300',
      border: 'hover:border-indigo-400/20',
      badge: 'text-indigo-300',
      label: 'Observation',
    },
  };

  const style =
    styles[item.type] || styles.info;

  return (
    <div
      className={`glass rounded-2xl border border-white/10 p-5 transition duration-300 ${style.border}`}
    >

      <div className="flex items-start justify-between gap-4">

        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}>
          <Icon className="h-5 w-5" />
        </div>

        <span className={`text-[10px] font-semibold uppercase tracking-wider ${style.badge}`}>
          {style.label}
        </span>

      </div>

      <h3 className="mt-4 font-bold text-white">
        {item.title}
      </h3>

      <p className="mt-2 text-sm leading-7 text-slate-400">
        {item.text}
      </p>

      <div className="mt-4 border-t border-white/5 pt-3 text-xs text-slate-600">
        Evidence · {item.evidence}
      </div>

    </div>
  );
}


/* ===============================================================
   HEALTH CARD
================================================================ */

function HealthCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="glass rounded-xl border border-white/10 p-4">

      <div className="flex items-center justify-between">

        <span className="text-xs uppercase tracking-wider text-slate-500">
          {label}
        </span>

        <Icon className="h-4 w-4 text-indigo-300" />

      </div>

      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        {description}
      </p>

    </div>
  );
}


/* ===============================================================
   MODEL INSIGHT CARD
================================================================ */

function ModelInsightCard({
  title,
  value,
  description,
}) {
  return (
    <div className="glass rounded-xl border border-white/10 p-5">

      <p className="text-xs uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="mt-2 truncate text-xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}


/* ===============================================================
   RISK CARD
================================================================ */

function RiskCard({
  title,
  active,
  text,
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        active
          ? 'border-yellow-400/20 bg-yellow-500/5'
          : 'border-emerald-400/10 bg-emerald-500/5'
      }`}
    >

      <div className="flex items-center gap-3">

        {active ? (
          <AlertTriangle className="h-5 w-5 text-yellow-300" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
        )}

        <h3 className="font-semibold text-white">
          {title}
        </h3>

      </div>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {text}
      </p>

    </div>
  );
}


/* ===============================================================
   RECOMMENDATION
================================================================ */

function Recommendation({
  number,
  text,
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-sm font-bold text-indigo-300">
        {number}
      </div>

      <p className="text-sm leading-6 text-slate-400">
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
   SUMMARY BADGE
================================================================ */

function SummaryBadge({
  icon: Icon,
  value,
  label,
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">

      <Icon className="h-4 w-4 text-indigo-300" />

      <div>

        <p className="text-sm font-bold text-white">
          {value}
        </p>

        <p className="text-[10px] uppercase tracking-wider text-slate-600">
          {label}
        </p>

      </div>

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

function formatMetric(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  if (number <= 1) {
    return `${(number * 100).toFixed(1)}%`;
  }

  return number.toFixed(2);
}
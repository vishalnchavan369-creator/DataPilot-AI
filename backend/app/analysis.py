"""
DataPilot AI - Robust machine learning engine.

This module contains defensive model-training utilities for:
- Classification
- Regression
- Automatic preprocessing
- Missing-value handling
- Categorical encoding
- Model comparison
- Feature importance
- Prediction support
"""

# pylint: disable=too-many-lines
# pylint: disable=invalid-name
# pylint: disable=broad-exception-caught

from __future__ import annotations

import math
from typing import Any

import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor


# ---------------------------------------------------------------------
# GENERAL HELPERS
# ---------------------------------------------------------------------

def _safe_float(value: Any, default: float = 0.0) -> float:
    """Convert a value to a finite float."""
    try:
        number = float(value)

        if not math.isfinite(number):
            return default

        return number
    except Exception:
        return default


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Make a defensive copy and clean invalid values."""
    data = df.copy()

    data = data.replace([np.inf, -np.inf], np.nan)

    # Normalize column names.
    data.columns = [
        str(column).strip()
        for column in data.columns
    ]

    # Remove completely empty columns.
    empty_columns = [
        column
        for column in data.columns
        if data[column].isna().all()
    ]

    if empty_columns:
        data = data.drop(columns=empty_columns)

    return data


def _make_unique_columns(columns):
    """Ensure column names are unique."""
    seen = {}
    result = []

    for column in columns:
        name = str(column)

        if name not in seen:
            seen[name] = 0
            result.append(name)
        else:
            seen[name] += 1
            result.append(f"{name}_{seen[name]}")

    return result


def _safe_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize duplicate column names."""
    data = df.copy()
    data.columns = _make_unique_columns(data.columns)
    return data


def _normalize_problem_type(target: pd.Series) -> str:
    """Infer classification or regression."""
    if pd.api.types.is_bool_dtype(target):
        return "classification"

    if pd.api.types.is_numeric_dtype(target):
        unique_count = target.nunique(dropna=True)

        # Numeric targets with a small number of unique values are
        # generally classification targets.
        if unique_count <= 10:
            return "classification"

        return "regression"

    return "classification"


def _prepare_target(
    target: pd.Series,
    problem_type: str,
):
    """Clean and normalize the target."""
    y = target.copy()

    y = y.replace([np.inf, -np.inf], np.nan)

    valid_mask = y.notna()

    y = y.loc[valid_mask]

    if problem_type == "regression":
        y = pd.to_numeric(y, errors="coerce")
        valid_mask = y.notna()
        y = y.loc[valid_mask]

    else:
        y = y.astype(str).str.strip()

        invalid = (
            y.isna()
            | (y == "")
            | (y.str.lower() == "nan")
            | (y.str.lower() == "none")
        )

        y = y.loc[~invalid]

    return y, valid_mask


# ---------------------------------------------------------------------
# PREPROCESSING
# ---------------------------------------------------------------------

def _build_preprocessor(X: pd.DataFrame) -> ColumnTransformer:
    """Create robust preprocessing for numeric and categorical columns."""

    numeric_columns = [
        column
        for column in X.columns
        if pd.api.types.is_numeric_dtype(X[column])
    ]

    categorical_columns = [
        column
        for column in X.columns
        if column not in numeric_columns
    ]

    transformers = []

    if numeric_columns:
        numeric_pipeline = Pipeline(
            steps=[
                (
                    "imputer",
                    SimpleImputer(strategy="median"),
                ),
                (
                    "scaler",
                    StandardScaler(),
                ),
            ]
        )

        transformers.append(
            (
                "numeric",
                numeric_pipeline,
                numeric_columns,
            )
        )

    if categorical_columns:
        categorical_pipeline = Pipeline(
            steps=[
                (
                    "imputer",
                    SimpleImputer(
                        strategy="most_frequent"
                    ),
                ),
                (
                    "encoder",
                    OneHotEncoder(
                        handle_unknown="ignore",
                        sparse_output=False,
                    ),
                ),
            ]
        )

        transformers.append(
            (
                "categorical",
                categorical_pipeline,
                categorical_columns,
            )
        )

    if not transformers:
        raise ValueError(
            "No usable feature columns were found."
        )

    return ColumnTransformer(
        transformers=transformers,
        remainder="drop",
        verbose_feature_names_out=False,
    )


def _remove_problematic_features(
    X: pd.DataFrame,
) -> pd.DataFrame:
    """
    Remove columns that cannot provide useful model input.
    """

    data = X.copy()

    remove = []

    for column in data.columns:
        series = data[column]

        # Completely empty.
        if series.isna().all():
            remove.append(column)
            continue

        # Constant feature.
        if series.nunique(dropna=True) <= 1:
            remove.append(column)
            continue

        # Very high-cardinality text columns can be problematic.
        if (
            not pd.api.types.is_numeric_dtype(series)
            and series.nunique(dropna=True) > 0.95 * len(series)
            and len(series) > 20
        ):
            remove.append(column)

    if remove:
        data = data.drop(columns=remove)

    return data


# ---------------------------------------------------------------------
# METRICS
# ---------------------------------------------------------------------

def _classification_metrics(y_true, y_pred):
    """Calculate classification metrics."""
    return {
        "accuracy": _safe_float(
            accuracy_score(y_true, y_pred)
        ),
        "precision": _safe_float(
            precision_score(
                y_true,
                y_pred,
                average="weighted",
                zero_division=0,
            )
        ),
        "recall": _safe_float(
            recall_score(
                y_true,
                y_pred,
                average="weighted",
                zero_division=0,
            )
        ),
        "f1": _safe_float(
            f1_score(
                y_true,
                y_pred,
                average="weighted",
                zero_division=0,
            )
        ),
    }


def _regression_metrics(y_true, y_pred):
    """Calculate regression metrics."""
    rmse = math.sqrt(
        max(
            0.0,
            _safe_float(
                mean_squared_error(y_true, y_pred)
            ),
        )
    )

    return {
        "r2": _safe_float(
            r2_score(y_true, y_pred)
        ),
        "rmse": rmse,
        "mae": _safe_float(
            mean_absolute_error(y_true, y_pred)
        ),
    }


# ---------------------------------------------------------------------
# CLASSIFICATION
# ---------------------------------------------------------------------

def _classification_models():
    """Return supported classification models."""
    return [
        (
            "Logistic Regression",
            LogisticRegression(
                max_iter=2000,
                class_weight="balanced",
                solver="liblinear",
            ),
        ),
        (
            "Decision Tree",
            DecisionTreeClassifier(
                max_depth=8,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=42,
            ),
        ),
    ]


# ---------------------------------------------------------------------
# REGRESSION
# ---------------------------------------------------------------------

def _regression_models():
    """Return supported regression models."""
    return [
        (
            "Linear Regression",
            LinearRegression(),
        ),
        (
            "Decision Tree Regressor",
            DecisionTreeRegressor(
                max_depth=8,
                min_samples_leaf=2,
                random_state=42,
            ),
        ),
    ]


# ---------------------------------------------------------------------
# TRAINING
# ---------------------------------------------------------------------

def train_models(
    df: pd.DataFrame,
    target: str,
    features: list[str],
) -> dict[str, Any]:
    """
    Robustly train and compare models.

    Returns a frontend-friendly JSON serializable dictionary.
    """

    if df is None or df.empty:
        raise ValueError(
            "The dataset is empty."
        )

    data = _safe_column_names(
        _clean_dataframe(df)
    )

    if target not in data.columns:
        raise ValueError(
            f"Target column '{target}' was not found in the dataset."
        )

    if not features:
        raise ValueError(
            "Please select at least one feature."
        )

    # Keep only columns that actually exist.
    features = [
        feature
        for feature in features
        if feature in data.columns
        and feature != target
    ]

    # Remove duplicates while preserving order.
    features = list(dict.fromkeys(features))

    if not features:
        raise ValueError(
            "No valid feature columns remain after validation."
        )

    y_original = data[target]

    problem_type = _normalize_problem_type(
        y_original
    )

    # ---------------------------------------------------------------
    # TARGET CLEANING
    # ---------------------------------------------------------------

    y = y_original.copy()

    y = y.replace(
        [np.inf, -np.inf],
        np.nan,
    )

    if problem_type == "regression":
        y = pd.to_numeric(
            y,
            errors="coerce",
        )
    else:
        y = y.astype(str).str.strip()

        y = y.replace(
            {
                "": np.nan,
                "nan": np.nan,
                "None": np.nan,
                "none": np.nan,
            }
        )

    valid_target = y.notna()

    X = data.loc[
        valid_target,
        features,
    ].copy()

    y = y.loc[valid_target].copy()

    if len(X) < 10:
        raise ValueError(
            f"Only {len(X)} usable rows remain. "
            "At least 10 rows are recommended for model training."
        )

    # ---------------------------------------------------------------
    # REMOVE BAD FEATURES
    # ---------------------------------------------------------------

    X = _remove_problematic_features(X)

    if X.shape[1] == 0:
        raise ValueError(
            "All selected features are empty or constant. "
            "Please select different feature columns."
        )

    # ---------------------------------------------------------------
    # CLASSIFICATION VALIDATION
    # ---------------------------------------------------------------

    if problem_type == "classification":
        class_counts = y.value_counts()

        if len(class_counts) < 2:
            raise ValueError(
                "Classification requires at least two target classes. "
                f"Found only: {class_counts.index.tolist()}"
            )

        # Convert very small classes safely.
        if len(class_counts) > 1:
            smallest_class = int(
                class_counts.min()
            )

            if smallest_class < 2:
                raise ValueError(
                    "The target contains a class with fewer than "
                    "2 observations. Add more rows or choose another target."
                )

    # ---------------------------------------------------------------
    # REGRESSION VALIDATION
    # ---------------------------------------------------------------

    if problem_type == "regression":
        if y.nunique(dropna=True) < 2:
            raise ValueError(
                "Regression requires variation in the target column."
            )

    # ---------------------------------------------------------------
    # TRAIN / TEST SPLIT
    # ---------------------------------------------------------------

    stratify = None

    if problem_type == "classification":
        stratify = y

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.25,
            random_state=42,
            stratify=stratify,
        )
    except ValueError:
        # Fallback without stratification for unusual datasets.
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.25,
            random_state=42,
            stratify=None,
        )

    if len(X_train) < 5 or len(X_test) < 2:
        raise ValueError(
            "The dataset is too small for a reliable train/test split."
        )

    # ---------------------------------------------------------------
    # PREPROCESSOR
    # ---------------------------------------------------------------

    preprocessor = _build_preprocessor(
        X_train
    )

    if problem_type == "classification":
        models = _classification_models()
    else:
        models = _regression_models()

    results = []
    successful_models = []

    # ---------------------------------------------------------------
    # TRAIN EACH MODEL INDEPENDENTLY
    # ---------------------------------------------------------------

    for model_name, estimator in models:

        try:
            pipeline = Pipeline(
                steps=[
                    (
                        "preprocessor",
                        preprocessor,
                    ),
                    (
                        "model",
                        estimator,
                    ),
                ]
            )

            pipeline.fit(
                X_train,
                y_train,
            )

            predictions = pipeline.predict(
                X_test
            )

            if problem_type == "classification":
                metrics = _classification_metrics(
                    y_test,
                    predictions,
                )

                primary_score = metrics["f1"]

            else:
                metrics = _regression_metrics(
                    y_test,
                    predictions,
                )

                primary_score = metrics["r2"]

            result = {
                "name": model_name,
                **metrics,
                "success": True,
                "error": None,
            }

            results.append(result)

            successful_models.append(
                {
                    "name": model_name,
                    "pipeline": pipeline,
                    "score": primary_score,
                    "predictions": predictions,
                }
            )

        except Exception as exc:
            results.append(
                {
                    "name": model_name,
                    "success": False,
                    "error": str(exc),
                }
            )

    # ---------------------------------------------------------------
    # CHECK SUCCESS
    # ---------------------------------------------------------------

    if not successful_models:

        error_details = [
            f"{item['name']}: {item.get('error', 'Unknown error')}"
            for item in results
        ]

        raise ValueError(
            "None of the selected models could be trained successfully. "
            + " | ".join(error_details)
        )

    # ---------------------------------------------------------------
    # SELECT BEST MODEL
    # ---------------------------------------------------------------

    best = max(
        successful_models,
        key=lambda item: item["score"],
    )

    best_name = best["name"]
    best_pipeline = best["pipeline"]

    # ---------------------------------------------------------------
    # CONFUSION MATRIX
    # ---------------------------------------------------------------

    confusion = None

    if problem_type == "classification":

        try:
            labels = sorted(
                list(
                    set(
                        y_test.astype(str)
                    )
                    | set(
                        best["predictions"].astype(str)
                    )
                )
            )

            matrix = confusion_matrix(
                y_test,
                best["predictions"],
                labels=labels,
            )

            confusion = {
                "labels": labels,
                "matrix": matrix.tolist(),
            }

        except Exception:
            confusion = None

    # ---------------------------------------------------------------
    # FEATURE IMPORTANCE
    # ---------------------------------------------------------------

    feature_importance = []

    try:
        transformed_names = (
            best_pipeline
            .named_steps["preprocessor"]
            .get_feature_names_out()
        )

        estimator = (
            best_pipeline
            .named_steps["model"]
        )

        importance = None

        if hasattr(estimator, "feature_importances_"):
            importance = estimator.feature_importances_

        elif hasattr(estimator, "coef_"):
            coefficients = estimator.coef_

            if coefficients.ndim == 1:
                importance = np.abs(
                    coefficients
                )
            else:
                importance = np.mean(
                    np.abs(coefficients),
                    axis=0,
                )

        if importance is not None:

            pairs = list(
                zip(
                    transformed_names,
                    importance,
                )
            )

            pairs.sort(
                key=lambda item: abs(
                    float(item[1])
                ),
                reverse=True,
            )

            feature_importance = [
                {
                    "feature": str(name),
                    "importance": _safe_float(
                        value
                    ),
                }
                for name, value in pairs[:30]
            ]

    except Exception:
        feature_importance = []

    # ---------------------------------------------------------------
    # ACTUAL VS PREDICTED
    # ---------------------------------------------------------------

    actual_predicted = []

    try:
        for actual, prediction in zip(
            y_test.iloc[:100],
            best["predictions"][:100],
        ):
            actual_predicted.append(
                {
                    "actual": (
                        _safe_float(actual)
                        if problem_type == "regression"
                        else str(actual)
                    ),
                    "predicted": (
                        _safe_float(prediction)
                        if problem_type == "regression"
                        else str(prediction)
                    ),
                }
            )
    except Exception:
        actual_predicted = []

    # ---------------------------------------------------------------
    # RETURN JSON-SAFE RESULT
    # ---------------------------------------------------------------

    return {
        "success": True,
        "problem_type": problem_type,
        "target": target,
        "features": features,
        "best_model": best_name,
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "rows_used": int(len(X)),
        "feature_count": int(X.shape[1]),
        "class_count": (
            int(y.nunique())
            if problem_type == "classification"
            else None
        ),
        "results": results,
        "confusion_matrix": confusion,
        "feature_importance": feature_importance,
        "actual_predicted": actual_predicted,
    }


# ---------------------------------------------------------------------
# PREDICTION
# ---------------------------------------------------------------------

def prepare_prediction_input(
    values: dict[str, Any],
    features: list[str],
) -> pd.DataFrame:
    """Convert frontend prediction values into a DataFrame."""

    row = {}

    for feature in features:
        value = values.get(feature)

        if value == "":
            value = np.nan

        row[feature] = value

    return pd.DataFrame(
        [row],
        columns=features,
    )


def predict_with_model(
    pipeline,
    values: dict[str, Any],
    features: list[str],
):
    """Generate a prediction from a trained pipeline."""

    X_new = prepare_prediction_input(
        values,
        features,
    )

    prediction = pipeline.predict(
        X_new
    )

    result = prediction[0]

    if isinstance(
        result,
        (np.integer, np.floating),
    ):
        result = result.item()

    response = {
        "prediction": result,
    }

    if hasattr(
        pipeline,
        "predict_proba",
    ):
        try:
            probabilities = pipeline.predict_proba(
                X_new
            )[0]

            response["probabilities"] = [
                {
                    "class": str(class_name),
                    "probability": _safe_float(
                        probability
                    ),
                }
                for class_name, probability in zip(
                    pipeline.classes_,
                    probabilities,
                )
            ]
        except Exception:
            pass

    return response
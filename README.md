# DataPilot AI — Professional Python + ML

DataPilot AI is a professional autonomous data-science workspace. It combines a React/Vite frontend with a Python/FastAPI analytics and machine-learning backend.

## Included modules
- Landing page and premium AI-SaaS workspace
- CSV / TSV / Excel / JSON / Parquet upload
- Pandas profiling and five-dimension data-quality score
- Missing values, duplicates, constant-column and outlier checks
- EDA: histograms, categorical charts and correlation matrix
- ML problem detection: classification or regression
- Logistic Regression / Linear Regression
- CART Decision Tree
- Preprocessing: imputation, scaling, one-hot encoding
- Holdout evaluation: accuracy, precision, recall, F1, R², RMSE, MAE
- Permutation feature importance
- Live prediction form
- Markdown + PDF report export
- Browser-local analysis history
- Data-grounded AI Data Scientist chat fallback

## Architecture
React 18 + Vite + Tailwind + Framer Motion + Recharts + Lucide + React Router + jsPDF + React Markdown

Python FastAPI + Pandas + NumPy + scikit-learn + OpenPyXL + PyArrow

The Python backend is intentional because this edition is designed to use real Python data science and machine learning. External LLM integration is optional and can be added later without moving secrets into the browser.

## Windows setup

### Terminal 1 — backend
```powershell
cd "C:\Users\VISHAL\OneDrive\Desktop\DataPilot_AI_Professional\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Backend docs: http://127.0.0.1:8000/docs

### Terminal 2 — frontend
```powershell
cd "C:\Users\VISHAL\OneDrive\Desktop\DataPilot_AI_Professional\frontend"
npm install
npm run dev
```

Open http://localhost:5173

## Demo
Upload `sample_data/sample_students.csv`. Select `final_score` as target, select features, train, then open Explainability and Predictions.

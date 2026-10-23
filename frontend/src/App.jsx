import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { Provider } from './context/AppContext';
import Layout from './layouts/Layout';

import Landing from './pages/Landing';
import Overview from './pages/Overview';
import Quality from './pages/Quality';
import EDA from './pages/EDA';
import Insights from './pages/Insights';
import ModelLab from './pages/ModelLab';
import Explainability from './pages/Explainability';
import Predictions from './pages/Predictions';
import DecisionLab from './pages/DecisionLab';
import Reports from './pages/Reports';
import History from './pages/History';
import Chat from './pages/Chat';

const appPages = [
  {
    path: 'overview',
    component: Overview,
  },
  {
    path: 'data-quality',
    component: Quality,
  },
  {
    path: 'eda',
    component: EDA,
  },
  {
    path: 'ai-insights',
    component: Insights,
  },
  {
    path: 'model-lab',
    component: ModelLab,
  },
  {
    path: 'explainability',
    component: Explainability,
  },
  {
    path: 'predictions',
    component: Predictions,
  },

  // NEW: What-If Decision Simulator
  {
    path: 'decision-lab',
    component: DecisionLab,
  },

  {
    path: 'ai-data-scientist',
    component: Chat,
  },
  {
    path: 'reports',
    component: Reports,
  },
  {
    path: 'history',
    component: History,
  },
];

function AppPage({ Component }) {
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

export default function App() {
  return (
    <Provider>
      <BrowserRouter>
        <Routes>

          <Route
            path="/"
            element={<Landing />}
          />

          <Route
            path="/app"
            element={
              <Navigate
                to="/app/overview"
                replace
              />
            }
          />

          {appPages.map(
            ({ path, component: Component }) => (
              <Route
                key={path}
                path={`/app/${path}`}
                element={
                  <AppPage Component={Component} />
                }
              />
            )
          )}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
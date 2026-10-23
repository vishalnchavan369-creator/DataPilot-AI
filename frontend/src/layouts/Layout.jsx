import {
  NavLink,
  Link,
  useLocation,
} from 'react-router-dom';

import {
  Database,
  LayoutDashboard,
  ShieldCheck,
  BarChart3,
  Sparkles,
  BrainCircuit,
  Waypoints,
  Target,
  MessageSquare,
  FileText,
  History as HistoryIcon,
  Sun,
  Moon,
  Menu,
  X,
  UploadCloud,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useApp } from '../context/AppContext';


/* =========================================================
   NAVIGATION
========================================================= */

const groups = [
  {
    label: 'WORKSPACE',
    items: [
      ['overview', 'Overview', LayoutDashboard],
      ['data-quality', 'Data Quality', ShieldCheck],
      ['eda', 'EDA & Visualize', BarChart3],
    ],
  },

  {
    label: 'INTELLIGENCE',
    items: [
      ['ai-insights', 'AI Insights', Sparkles],
      ['ai-data-scientist', 'AI Data Scientist', MessageSquare],
    ],
  },

  {
    label: 'MACHINE LEARNING',
    items: [
      ['model-lab', 'Model Lab', BrainCircuit],
      ['explainability', 'Explainability', Waypoints],
      ['predictions', 'Predictions', Target],
    ],
  },

  {
    label: 'OUTPUT',
    items: [
      ['reports', 'Reports', FileText],
      ['history', 'History', HistoryIcon],
    ],
  },
];


/* =========================================================
   PAGE TITLES
========================================================= */

const pageTitles = {
  overview: 'Overview',
  'data-quality': 'Data Quality',
  eda: 'EDA & Visualize',
  'ai-insights': 'AI Insights',
  'model-lab': 'Model Lab',
  explainability: 'Explainability',
  predictions: 'Predictions',
  'ai-data-scientist': 'AI Data Scientist',
  reports: 'Reports',
  history: 'History',
};


/* =========================================================
   LAYOUT
========================================================= */

export default function Layout({ children }) {

  const location = useLocation();
  const inputRef = useRef(null);

  const {
    dataset,
    busy,
    restoring,
    operation,
    error,
    load,
  } = useApp();


  /* =======================================================
     MOBILE SIDEBAR
  ======================================================= */

  const [open, setOpen] = useState(false);


  /* =======================================================
     THEME
  ======================================================= */

  const [dark, setDark] = useState(() => {

    try {

      const saved =
        localStorage.getItem(
          'datapilot_theme'
        );

      if (saved === 'light') {
        return false;
      }

      if (saved === 'dark') {
        return true;
      }

      return true;

    } catch {

      return true;

    }

  });


  /* =======================================================
     CURRENT PAGE
  ======================================================= */

  const currentPage = useMemo(() => {

    const key =
      location.pathname
        .replace('/app/', '')
        .replace('/', '');

    return (
      pageTitles[key] ||
      'DataPilot AI'
    );

  }, [
    location.pathname,
  ]);


  /* =======================================================
     APPLY THEME GLOBALLY
  ======================================================= */

  useEffect(() => {

    const root =
      document.documentElement;

    const body =
      document.body;

    /*
     * Dark:
     * html.dark
     *
     * Light:
     * html.light
     */

    root.classList.toggle(
      'dark',
      dark
    );

    root.classList.toggle(
      'light',
      !dark
    );

    root.dataset.theme =
      dark
        ? 'dark'
        : 'light';

    body.dataset.theme =
      dark
        ? 'dark'
        : 'light';

    /*
     * Browser native controls.
     */

    root.style.colorScheme =
      dark
        ? 'dark'
        : 'light';

    /*
     * Persist preference.
     */

    try {

      localStorage.setItem(
        'datapilot_theme',
        dark
          ? 'dark'
          : 'light'
      );

    } catch {
      // Ignore storage errors.
    }

  }, [dark]);


  /* =======================================================
     CLOSE MOBILE SIDEBAR
  ======================================================= */

  useEffect(() => {

    setOpen(false);

  }, [
    location.pathname,
  ]);


  /* =======================================================
     UPLOAD DATASET
  ======================================================= */

  const handleUpload = async (event) => {

    const file =
      event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    try {

      await load(file);

      if (
        location.pathname !==
        '/app/overview'
      ) {

        window.history.pushState(
          {},
          '',
          '/app/overview'
        );

        window.dispatchEvent(
          new PopStateEvent(
            'popstate'
          )
        );

      }

    } catch {
      /*
       * AppContext handles the error.
       */
    }

  };


  /* =======================================================
     OPEN FILE PICKER
  ======================================================= */

  const openUploader = () => {

    if (busy) {
      return;
    }

    if (inputRef.current) {

      inputRef.current.value = '';

      inputRef.current.click();

    }

  };


  /* =======================================================
     THEME TOGGLE
  ======================================================= */

  const toggleTheme = () => {

    setDark(
      current => !current
    );

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div
      className="
        min-h-screen
        bg-[var(--dp-bg)]
        text-[var(--dp-text)]
        transition-colors
        duration-300
      "
    >

      {/* =================================================
          HIDDEN FILE INPUT
      ================================================= */}

      <input
        ref={inputRef}
        type="file"
        hidden
        accept="
          .csv,
          .tsv,
          .xlsx,
          .xls,
          .json,
          .parquet
        "
        onChange={handleUpload}
      />


      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {open && (

        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setOpen(false)
          }
          className="
            fixed
            inset-0
            z-40
            bg-black/50
            backdrop-blur-sm
            lg:hidden
          "
        />

      )}


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          w-[280px]
          flex-col
          border-r
          border-[var(--dp-border)]
          bg-[var(--dp-sidebar)]
          transition-all
          duration-300
          lg:translate-x-0
          ${
            open
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >

        {/* =================================================
            BRAND
        ================================================= */}

        <div
          className="
            flex
            h-[76px]
            shrink-0
            items-center
            justify-between
            border-b
            border-[var(--dp-border)]
            px-5
          "
        >

          <Link
            to="/app/overview"
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-[#ff795b]
                text-[#160b08]
              "
            >
              <Database size={19} />
            </div>

            <div>

              <div
                className="
                  text-sm
                  font-bold
                  tracking-tight
                  text-[var(--dp-text)]
                "
              >
                DataPilot
                <span className="text-[#ff795b]">
                  AI
                </span>
              </div>

              <div
                className="
                  mt-0.5
                  text-[10px]
                  text-[var(--dp-muted-2)]
                "
              >
                Autonomous Data Scientist
              </div>

            </div>

          </Link>


          <button
            type="button"
            aria-label="Close navigation"
            onClick={() =>
              setOpen(false)
            }
            className="
              rounded-lg
              p-2
              text-[var(--dp-muted)]
              hover:bg-[var(--dp-hover)]
              hover:text-[var(--dp-text)]
              lg:hidden
            "
          >
            <X size={17} />
          </button>

        </div>


        {/* =================================================
            UPLOAD
        ================================================= */}

        <div
          className="
            border-b
            border-[var(--dp-border)]
            p-4
          "
        >

          <button
            type="button"
            onClick={openUploader}
            disabled={busy}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#ff795b]
              px-4
              py-3
              text-sm
              font-semibold
              text-[#180b08]
              transition
              hover:bg-[#ff896f]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            {busy ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <UploadCloud size={17} />
            )}

            {busy
              ? 'Analyzing dataset...'
              : 'Upload New Dataset'}

          </button>

          <div
            className="
              mt-2
              text-center
              text-[9px]
              text-[var(--dp-muted-2)]
            "
          >
            CSV · TSV · Excel · JSON · Parquet
          </div>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav
          className="
            flex-1
            overflow-y-auto
            px-3
            py-4
          "
        >

          {groups.map(group => (

            <div
              key={group.label}
              className="mb-6"
            >

              <div
                className="
                  mb-2
                  px-3
                  text-[9px]
                  font-semibold
                  tracking-[0.18em]
                  text-[var(--dp-muted-2)]
                "
              >
                {group.label}
              </div>


              <div className="space-y-1">

                {group.items.map(
                  ([
                    path,
                    label,
                    Icon,
                  ]) => (

                    <NavLink
                      key={path}
                      to={`/app/${path}`}
                      className={({
                        isActive,
                      }) => `
                        group
                        flex
                        items-center
                        gap-3
                        rounded-lg
                        px-3
                        py-2.5
                        text-sm
                        transition
                        ${
                          isActive
                            ? `
                              bg-[#ff795b]/10
                              text-[#ff795b]
                            `
                            : `
                              text-[var(--dp-muted)]
                              hover:bg-[var(--dp-hover)]
                              hover:text-[var(--dp-text)]
                            `
                        }
                      `}
                    >

                      <Icon
                        size={16}
                        strokeWidth={1.8}
                      />

                      <span>
                        {label}
                      </span>

                    </NavLink>

                  )
                )}

              </div>

            </div>

          ))}

        </nav>


        {/* =================================================
            ACTIVE DATASET
        ================================================= */}

        <div
          className="
            shrink-0
            border-t
            border-[var(--dp-border)]
            p-3
          "
        >

          {dataset ? (

            <div
              className="
                rounded-xl
                border
                border-[var(--dp-border)]
                bg-[var(--dp-surface-soft)]
                p-3
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-[9px]
                  font-semibold
                  tracking-[0.12em]
                  text-[#69d6a0]
                "
              >

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[#69d6a0]
                    shadow-[0_0_8px_rgba(105,214,160,.8)]
                  "
                />

                ACTIVE DATASET

              </div>


              <div
                className="
                  mt-2
                  truncate
                  text-xs
                  font-medium
                  text-[var(--dp-text-soft)]
                "
                title={dataset.filename}
              >
                {dataset.filename ||
                  'Dataset loaded'}
              </div>


              <div
                className="
                  mt-1
                  text-[10px]
                  text-[var(--dp-muted-2)]
                "
              >

                {formatNumber(
                  dataset.profile?.rows
                )}{' '}
                rows
                {' · '}
                {formatNumber(
                  dataset.profile?.cols
                )}{' '}
                columns

              </div>

            </div>

          ) : (

            <button
              type="button"
              onClick={openUploader}
              className="
                w-full
                rounded-xl
                border
                border-dashed
                border-[var(--dp-border)]
                bg-[var(--dp-surface-soft)]
                p-4
                text-left
                transition
                hover:border-[#ff795b]/30
                hover:bg-[#ff795b]/[0.05]
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-medium
                  text-[var(--dp-text-soft)]
                "
              >

                <UploadCloud
                  size={15}
                  className="text-[#ff795b]"
                />

                No dataset loaded

              </div>

              <div
                className="
                  mt-1
                  text-[10px]
                  text-[var(--dp-muted-2)]
                "
              >
                Click to upload a dataset
              </div>

            </button>

          )}

        </div>

      </aside>


      {/* =================================================
          MAIN
      ================================================= */}

      <div
        className="
          min-h-screen
          lg:pl-[280px]
        "
      >

        {/* =================================================
            TOP BAR
        ================================================= */}

        <header
          className="
            sticky
            top-0
            z-30
            flex
            h-[64px]
            items-center
            justify-between
            border-b
            border-[var(--dp-border)]
            bg-[var(--dp-header)]
            px-4
            backdrop-blur-xl
            transition-colors
            duration-300
            sm:px-6
            lg:px-8
          "
        >

          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >

            <button
              type="button"
              onClick={() =>
                setOpen(true)
              }
              className="
                rounded-lg
                p-2
                text-[var(--dp-muted)]
                hover:bg-[var(--dp-hover)]
                hover:text-[var(--dp-text)]
                lg:hidden
              "
            >
              <Menu size={19} />
            </button>


            <div
              className="
                hidden
                text-xs
                text-[var(--dp-muted-2)]
                sm:block
              "
            >
              DataPilot AI
            </div>


            <div
              className="
                hidden
                text-[var(--dp-border-strong)]
                sm:block
              "
            >
              /
            </div>


            <div
              className="
                truncate
                text-sm
                font-medium
                text-[var(--dp-text-soft)]
              "
            >
              {currentPage}
            </div>

          </div>


          {/* =================================================
              RIGHT ACTIONS
          ================================================= */}

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            {/* DATASET STATUS */}

            {restoring ? (

              <div
                className="
                  hidden
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-[#f4c95d]/15
                  bg-[#f4c95d]/[0.05]
                  px-3
                  py-1.5
                  text-[10px]
                  text-[#f4c95d]
                  sm:flex
                "
              >

                <Loader2
                  size={12}
                  className="animate-spin"
                />

                Restoring dataset...

              </div>

            ) : dataset ? (

              <div
                className="
                  hidden
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-[#69d6a0]/15
                  bg-[#69d6a0]/[0.04]
                  px-3
                  py-1.5
                  text-[10px]
                  text-[#69d6a0]
                  sm:flex
                "
              >

                <CheckCircle2 size={12} />

                Dataset loaded

              </div>

            ) : (

              <div
                className="
                  hidden
                  rounded-lg
                  border
                  border-[var(--dp-border)]
                  bg-[var(--dp-surface-soft)]
                  px-3
                  py-1.5
                  text-[10px]
                  text-[var(--dp-muted-2)]
                  sm:block
                "
              >
                No dataset
              </div>

            )}


            {/* UPLOAD */}

            <button
              type="button"
              onClick={openUploader}
              disabled={busy}
              className="
                flex
                items-center
                gap-2
                rounded-lg
                border
                border-[#ff795b]/20
                bg-[#ff795b]/[0.08]
                px-3
                py-2
                text-xs
                font-medium
                text-[#ff795b]
                transition
                hover:bg-[#ff795b]/[0.14]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              {busy ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <UploadCloud size={14} />
              )}

              <span className="hidden sm:inline">
                {busy
                  ? 'Analyzing...'
                  : 'Upload New Dataset'}
              </span>

            </button>


            {/* HOME */}

            <Link
              to="/"
              className="
                hidden
                rounded-lg
                px-3
                py-2
                text-xs
                text-[var(--dp-muted)]
                transition
                hover:bg-[var(--dp-hover)]
                hover:text-[var(--dp-text)]
                md:block
              "
            >
              Home
            </Link>


            {/* =================================================
                THEME TOGGLE
            ================================================= */}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                dark
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              title={
                dark
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              className="
                theme-toggle
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                border
                border-[var(--dp-border)]
                bg-[var(--dp-surface-soft)]
                text-[var(--dp-muted)]
                transition-all
                duration-200
                hover:border-[#ff795b]/30
                hover:bg-[#ff795b]/[0.08]
                hover:text-[#ff795b]
              "
            >

              {dark ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}

            </button>

          </div>

        </header>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div
            className="
              border-b
              border-[#ff7272]/15
              bg-[#ff7272]/[0.05]
              px-4
              py-2
              sm:px-6
              lg:px-8
            "
          >

            <div
              className="
                mx-auto
                flex
                max-w-[1600px]
                items-center
                justify-between
                gap-3
              "
            >

              <div
                className="
                  text-xs
                  text-[#ff7272]
                "
              >
                {error}
              </div>

            </div>

          </div>

        )}


        {/* =================================================
            OPERATION
        ================================================= */}

        {operation && (

          <div
            className="
              border-b
              border-[#ff795b]/10
              bg-[#ff795b]/[0.035]
              px-4
              py-2
              sm:px-6
              lg:px-8
            "
          >

            <div
              className="
                mx-auto
                flex
                max-w-[1600px]
                items-center
                gap-2
                text-[11px]
                text-[#ff795b]
              "
            >

              <Loader2
                size={13}
                className="animate-spin"
              />

              {operation}

            </div>

          </div>

        )}


        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main
          className="
            mx-auto
            min-h-[calc(100vh-64px)]
            max-w-[1600px]
            px-4
            py-6
            sm:px-6
            lg:px-8
            lg:py-8
          "
        >

          {children}

        </main>

      </div>

    </div>

  );

}


/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value) {

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return '0';
  }

  return new Intl.NumberFormat(
    'en-IN'
  ).format(number);

}
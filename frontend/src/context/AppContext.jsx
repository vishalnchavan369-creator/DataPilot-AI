import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  uploadDataset,
  trainModel,
  predict as apiPredict,
  getReport,
  getModel,
} from '../lib/api';

import {
  saveDatasetToVault,
} from '../lib/datasetStorage';


const AppContext = createContext(null);


/*
|--------------------------------------------------------------------------
| Local storage
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| We DO NOT store the active dataset here.
|
| Therefore:
|
| Browser refresh
|      ↓
| Active dataset = empty
|
| History is still stored in localStorage.
|
*/

const HISTORY_KEY = 'datapilot_history_v4';


/*
|--------------------------------------------------------------------------
| Safe localStorage reader
|--------------------------------------------------------------------------
*/

function readHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {
    console.error(
      'Unable to read DataPilot history:',
      error
    );

    return [];
  }
}


/*
|--------------------------------------------------------------------------
| Save history
|--------------------------------------------------------------------------
*/

function writeHistory(history) {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );
  } catch (error) {
    console.error(
      'Unable to save DataPilot history:',
      error
    );
  }
}


/*
|--------------------------------------------------------------------------
| Error helper
|--------------------------------------------------------------------------
*/

function getErrorMessage(
  error,
  fallback
) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.detail ||
    error?.message ||
    fallback
  );
}


/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
*/

export function Provider({
  children,
}) {

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | dataset starts as null EVERY TIME the React application starts.
  |
  | So refreshing:
  |
  | F5
  | Ctrl + R
  | Browser refresh
  |
  | will NOT restore the previous active dataset.
  |
  */

  const [
    dataset,
    setDatasetState,
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | Model also resets after browser refresh.
  |--------------------------------------------------------------------------
  */

  const [
    model,
    setModelState,
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | History survives refresh.
  |--------------------------------------------------------------------------
  */

  const [
    history,
    setHistoryState,
  ] = useState(
    readHistory
  );


  /*
  |--------------------------------------------------------------------------
  | Loading state
  |--------------------------------------------------------------------------
  */

  const [
    busy,
    setBusy,
  ] = useState(false);


  const [
    operation,
    setOperation,
  ] = useState('');


  const [
    error,
    setError,
  ] = useState('');


  /*
  |--------------------------------------------------------------------------
  | Dataset setter
  |--------------------------------------------------------------------------
  |
  | NOTICE:
  |
  | We intentionally DO NOT save dataset into localStorage.
  |
  */

  const setDataset = useCallback(
    (value) => {

      setDatasetState(
        value || null
      );

    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | Model setter
  |--------------------------------------------------------------------------
  */

  const setModel = useCallback(
    (value) => {

      setModelState(
        value || null
      );

    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | History setter
  |--------------------------------------------------------------------------
  |
  | Supports:
  |
  | setHistory([])
  |
  | AND
  |
  | setHistory(previous => [...previous, item])
  |
  */

  const setHistory = useCallback(
    (value) => {

      setHistoryState(
        (current) => {

          const next =
            typeof value === 'function'
              ? value(current)
              : value;

          const safeNext =
            Array.isArray(next)
              ? next
              : [];

          writeHistory(
            safeNext
          );

          return safeNext;

        }
      );

    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | Add dataset to history
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | There is NO .slice(0, 30)
  |
  | Therefore every uploaded dataset remains in history.
  |
  */

  const addHistoryItem = useCallback(
    (data) => {

      if (
        !data?.dataset_id
      ) {
        return;
      }


      const item = {

        id:
          data.dataset_id,

        dataset_id:
          data.dataset_id,

        name:
          data.filename ||
          data.file_name ||
          'Untitled dataset',

        filename:
          data.filename ||
          data.file_name ||
          'Untitled dataset',

        time:
          Date.now(),

        rows:
          Number(
            data?.profile?.rows ??
            data?.total_rows ??
            0
          ),

        cols:
          Number(
            data?.profile?.cols ??
            data?.total_columns ??
            0
          ),

        quality:
          Number(
            data?.profile?.quality_score ??
            0
          ),

        fileType:
          data?.file_type ||
          data?.fileType ||
          '',

        dataset_id:
          data.dataset_id,
      };


      setHistoryState(
        (current) => {

          /*
          |--------------------------------------------------------------------------
          | Remove only the same dataset ID.
          |
          | Other datasets remain untouched.
          |--------------------------------------------------------------------------
          */

          const filtered =
            current.filter(
              (existing) =>
                String(
                  existing.id ||
                  existing.dataset_id
                ) !==
                String(
                  data.dataset_id
                )
            );


          const next = [
            item,
            ...filtered,
          ];


          writeHistory(
            next
          );


          return next;

        }
      );

    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | LOAD / UPLOAD DATASET
  |--------------------------------------------------------------------------
  */

  const load = useCallback(
    async (file) => {

      if (!file) {

        throw new Error(
          'Please select a dataset file.'
        );

      }


      /*
      |--------------------------------------------------------------------------
      | Prevent two uploads at exactly the same time.
      |--------------------------------------------------------------------------
      */

      if (busy) {

        return null;

      }


      setBusy(true);

      setError('');

      setOperation(
        'Uploading · profiling · scoring dataset…'
      );


      try {

        /*
        |--------------------------------------------------------------------------
        | Send file to FastAPI
        |--------------------------------------------------------------------------
        */

        const data =
          await uploadDataset(
            file
          );


        if (
          !data?.dataset_id
        ) {

          throw new Error(
            'The backend did not return a dataset ID.'
          );

        }


        /*
        |--------------------------------------------------------------------------
        | IMPORTANT:
        |
        | Save the ORIGINAL FILE in IndexedDB.
        |
        | This allows History → Open to restore it later.
        |--------------------------------------------------------------------------
        */

        try {

          await saveDatasetToVault({
            datasetId:
              data.dataset_id,

            file,

            analysis:
              data,
          });

        } catch (
          storageError
        ) {

          console.error(
            'Dataset Vault save failed:',
            storageError
          );

          /*
          |--------------------------------------------------------------------------
          | Do not destroy the upload just because browser storage failed.
          |--------------------------------------------------------------------------
          */

        }


        /*
        |--------------------------------------------------------------------------
        | Set new dataset as ACTIVE.
        |
        | This replaces the previous active dataset.
        |--------------------------------------------------------------------------
        */

        setDatasetState(
          data
        );


        /*
        |--------------------------------------------------------------------------
        | New dataset must start without an old model.
        |--------------------------------------------------------------------------
        */

        setModelState(
          null
        );


        /*
        |--------------------------------------------------------------------------
        | Add this dataset to permanent history.
        |--------------------------------------------------------------------------
        */

        addHistoryItem(
          data
        );


        return data;

      } catch (
        uploadError
      ) {

        const message =
          getErrorMessage(
            uploadError,
            'Dataset upload failed.'
          );


        setError(
          message
        );


        throw new Error(
          message
        );

      } finally {

        setBusy(false);

        setOperation('');

      }

    },
    [
      busy,
      addHistoryItem,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | TRAIN MODEL
  |--------------------------------------------------------------------------
  */

  const train = useCallback(
    async (
      target,
      features
    ) => {

      if (
        !dataset?.dataset_id
      ) {

        throw new Error(
          'Upload a dataset before training.'
        );

      }


      if (!target) {

        throw new Error(
          'Select a target column.'
        );

      }


      if (
        !Array.isArray(features) ||
        features.length === 0
      ) {

        throw new Error(
          'Select at least one feature.'
        );

      }


      setBusy(true);

      setError('');

      setOperation(
        'Training · comparing · selecting best model…'
      );


      try {

        const result =
          await trainModel(
            dataset.dataset_id,
            target,
            features
          );


        setModelState(
          result
        );


        return result;

      } catch (
        trainingError
      ) {

        const message =
          getErrorMessage(
            trainingError,
            'Model training failed.'
          );


        setError(
          message
        );


        throw new Error(
          message
        );

      } finally {

        setBusy(false);

        setOperation('');

      }

    },
    [
      dataset,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | PREDICTION
  |--------------------------------------------------------------------------
  */

  const predict = useCallback(
    async (
      values
    ) => {

      if (
        !dataset?.dataset_id
      ) {

        throw new Error(
          'Upload a dataset first.'
        );

      }


      if (!model) {

        throw new Error(
          'Train a model before predicting.'
        );

      }


      try {

        setError('');


        return await apiPredict(
          dataset.dataset_id,
          values
        );

      } catch (
        predictionError
      ) {

        const message =
          getErrorMessage(
            predictionError,
            'Prediction failed.'
          );


        setError(
          message
        );


        throw new Error(
          message
        );

      }

    },
    [
      dataset,
      model,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | REPORT
  |--------------------------------------------------------------------------
  */

  const generateReport =
    useCallback(
      async () => {

        if (
          !dataset?.dataset_id
        ) {

          throw new Error(
            'Upload a dataset first.'
          );

        }


        setBusy(true);

        setError('');

        setOperation(
          'Building autonomous analysis report…'
        );


        try {

          return await getReport(
            dataset.dataset_id
          );

        } catch (
          reportError
        ) {

          const message =
            getErrorMessage(
              reportError,
              'Report generation failed.'
            );


          setError(
            message
          );


          throw new Error(
            message
          );

        } finally {

          setBusy(false);

          setOperation('');

        }

      },
      [
        dataset,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Clear ACTIVE dataset only
  |--------------------------------------------------------------------------
  |
  | This DOES NOT delete History.
  |
  | This DOES NOT delete IndexedDB datasets.
  |
  */

  const clearDataset =
    useCallback(
      () => {

        setDatasetState(
          null
        );

        setModelState(
          null
        );

        setError('');

        setOperation('');

      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | Remove one history item
  |--------------------------------------------------------------------------
  */

  const removeHistoryItem =
    useCallback(
      (id) => {

        setHistoryState(
          (current) => {

            const next =
              current.filter(
                (item) =>
                  String(
                    item.id ||
                    item.dataset_id
                  ) !==
                  String(id)
              );


            writeHistory(
              next
            );


            return next;

          }
        );

      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | Clear history only
  |--------------------------------------------------------------------------
  */

  const clearHistory =
    useCallback(
      () => {

        setHistoryState([]);

        writeHistory([]);

      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | Context value
  |--------------------------------------------------------------------------
  */

  const value =
    useMemo(
      () => ({

        dataset,

        setDataset,

        model,

        setModel,

        history,

        setHistory,

        busy,

        error,

        operation,

        setError,

        clearError:
          () => setError(''),

        load,

        train,

        predict,

        generateReport,

        clearDataset,

        addHistoryItem,

        removeHistoryItem,

        clearHistory,

      }),
      [
        dataset,
        model,
        history,
        busy,
        error,
        operation,

        setDataset,
        setModel,
        setHistory,

        load,
        train,
        predict,
        generateReport,

        clearDataset,

        addHistoryItem,

        removeHistoryItem,

        clearHistory,
      ]
    );


  return (
    <AppContext.Provider
      value={value}
    >
      {children}
    </AppContext.Provider>
  );
}


/*
|--------------------------------------------------------------------------
| useApp
|--------------------------------------------------------------------------
*/

export function useApp() {

  const context =
    useContext(
      AppContext
    );


  if (!context) {

    throw new Error(
      'useApp must be used inside Provider.'
    );

  }


  return context;
}
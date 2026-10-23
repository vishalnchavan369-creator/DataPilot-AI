const API_TIMEOUT = 120000;


/* =========================================================
   API ERROR
========================================================= */

class ApiError extends Error {
  constructor(
    message,
    status = 0,
    data = null
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}


/* =========================================================
   REQUEST HELPER
========================================================= */

const request = async (
  path,
  options = {}
) => {

  const controller =
    new AbortController();


  const timeoutId =
    setTimeout(
      () => {
        controller.abort();
      },
      API_TIMEOUT
    );


  try {

    const response =
      await fetch(
        path,
        {
          ...options,
          signal:
            controller.signal,
        }
      );


    let data = {};


    const contentType =
      response.headers.get(
        'content-type'
      ) || '';


    if (
      contentType.includes(
        'application/json'
      )
    ) {

      try {

        data =
          await response.json();

      } catch {

        data = {};

      }

    } else {

      try {

        const text =
          await response.text();

        if (text) {

          data = {
            message: text,
          };

        }

      } catch {

        data = {};

      }

    }


    if (!response.ok) {

      const message =
        data?.detail ||
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`;


      throw new ApiError(
        message,
        response.status,
        data
      );

    }


    return data;

  } catch (error) {

    if (
      error?.name ===
      'AbortError'
    ) {

      throw new ApiError(
        'The request took too long. Please try again with a smaller dataset.',
        408
      );

    }


    if (
      error instanceof ApiError
    ) {

      throw error;

    }


    throw new ApiError(
      'Unable to connect to the DataPilot AI backend. Make sure the FastAPI server is running on port 8000.',
      0
    );

  } finally {

    clearTimeout(
      timeoutId
    );

  }

};


/* =========================================================
   UPLOAD DATASET
========================================================= */

export const uploadDataset =
  async (
    file
  ) => {

    if (!file) {

      throw new ApiError(
        'Please select a dataset file.'
      );

    }


    const allowedExtensions = [
      '.csv',
      '.tsv',
      '.xlsx',
      '.xls',
      '.json',
      '.parquet',
    ];


    const filename =
      file.name || '';


    const extension =
      filename.includes('.')
        ? `.${filename
            .split('.')
            .pop()
            .toLowerCase()}`
        : '';


    if (
      !allowedExtensions.includes(
        extension
      )
    ) {

      throw new ApiError(
        'Unsupported file type. Use CSV, TSV, XLSX, XLS, JSON, or Parquet.'
      );

    }


    if (
      file.size === 0
    ) {

      throw new ApiError(
        'The selected file is empty.'
      );

    }


    if (
      file.size >
      100 * 1024 * 1024
    ) {

      throw new ApiError(
        'File is too large. Maximum supported size is 100 MB.'
      );

    }


    const form =
      new FormData();


    form.append(
      'file',
      file
    );


    return request(
      '/api/upload',
      {
        method: 'POST',
        body: form,
      }
    );

  };


/* =========================================================
   TRAIN MODEL
========================================================= */

export const trainModel =
  (
    datasetId,
    target,
    features
  ) => {

    if (!datasetId) {

      throw new ApiError(
        'Dataset ID is required.'
      );

    }


    if (!target) {

      throw new ApiError(
        'Target column is required.'
      );

    }


    if (
      !Array.isArray(features) ||
      features.length === 0
    ) {

      throw new ApiError(
        'Select at least one feature.'
      );

    }


    return request(
      '/api/train',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            dataset_id:
              datasetId,

            target,

            features,
          }),
      }
    );

  };


/* =========================================================
   PREDICT
========================================================= */

export const predict =
  (
    datasetId,
    values
  ) => {

    if (!datasetId) {

      throw new ApiError(
        'Dataset ID is required.'
      );

    }


    if (
      !values ||
      typeof values !==
        'object'
    ) {

      throw new ApiError(
        'Prediction values are required.'
      );

    }


    return request(
      '/api/predict',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            dataset_id:
              datasetId,

            values,
          }),
      }
    );

  };


/* =========================================================
   DATASET
========================================================= */

export const getDataset =
  (
    datasetId
  ) => {

    if (!datasetId) {

      throw new ApiError(
        'Dataset ID is required.'
      );

    }


    return request(
      `/api/dataset/${encodeURIComponent(
        datasetId
      )}`
    );

  };


/* =========================================================
   DATASET RECORD LOOKUP
========================================================= */

export const lookupDatasetRecord =
  async (
    datasetId,
    column,
    value
  ) => {

    if (!datasetId) {

      throw new ApiError(
        'Dataset ID is required.'
      );

    }


    if (!column) {

      throw new ApiError(
        'Identifier column is required.'
      );

    }


    if (
      value === null ||
      value === undefined ||
      !String(value).trim()
    ) {

      throw new ApiError(
        'Identifier value is required.'
      );

    }


    const params =
      new URLSearchParams({
        column:
          String(column),

        value:
          String(value).trim(),
      });


    return request(
      `/api/dataset/${encodeURIComponent(
        datasetId
      )}/lookup?${params.toString()}`
    );

  };


/* =========================================================
   MODEL
========================================================= */

export const getModel =
  (
    datasetId
  ) => {

    if (!datasetId) {

      throw new ApiError(
        'Dataset ID is required.'
      );

    }


    return request(
      `/api/model/${encodeURIComponent(
        datasetId
      )}`
    );

  };


/* =========================================================
   REPORT
========================================================= */

export const getReport =
  (
    datasetId
  ) => {

    if (!datasetId) {

      throw new ApiError(
        'Dataset ID is required.'
      );

    }


    return request(
      `/api/report/${encodeURIComponent(
        datasetId
      )}`
    );

  };


/* =========================================================
   HEALTH
========================================================= */

export const health =
  () =>
    request(
      '/api/health',
      {
        method: 'GET',
      }
    );


/* =========================================================
   DELETE DATASET
========================================================= */

export const deleteDataset =
  (
    datasetId
  ) => {

    if (!datasetId) {

      throw new ApiError(
        'Dataset ID is required.'
      );

    }


    return request(
      `/api/dataset/${encodeURIComponent(
        datasetId
      )}`,
      {
        method: 'DELETE',
      }
    );

  };


/* =========================================================
   EXPORT
========================================================= */

export {
  ApiError,
};
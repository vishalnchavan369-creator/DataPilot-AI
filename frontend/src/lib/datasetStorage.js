/*
|--------------------------------------------------------------------------
| DataPilot AI Dataset Vault
|--------------------------------------------------------------------------
|
| Actual dataset FILES are stored in IndexedDB.
|
| localStorage:
|   → history metadata only
|
| IndexedDB:
|   → original uploaded files
|   → analysis information
|
|--------------------------------------------------------------------------
*/

const DB_NAME =
  'datapilot_ai_dataset_vault';

const DB_VERSION = 2;

const STORE_NAME =
  'datasets';


/*
|--------------------------------------------------------------------------
| Open database
|--------------------------------------------------------------------------
*/

function openDB() {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      if (
        !('indexedDB' in window)
      ) {

        reject(
          new Error(
            'IndexedDB is not supported by this browser.'
          )
        );

        return;

      }


      const request =
        window.indexedDB.open(
          DB_NAME,
          DB_VERSION
        );


      request.onupgradeneeded =
        () => {

          const db =
            request.result;


          let store;


          /*
          |--------------------------------------------------------------------------
          | Create object store
          |--------------------------------------------------------------------------
          */

          if (
            !db.objectStoreNames.contains(
              STORE_NAME
            )
          ) {

            store =
              db.createObjectStore(
                STORE_NAME,
                {
                  keyPath: 'id',
                }
              );

          } else {

            store =
              request.transaction.objectStore(
                STORE_NAME
              );

          }


          /*
          |--------------------------------------------------------------------------
          | Create indexes safely
          |--------------------------------------------------------------------------
          */

          if (
            !store.indexNames.contains(
              'time'
            )
          ) {

            store.createIndex(
              'time',
              'time',
              {
                unique: false,
              }
            );

          }


          if (
            !store.indexNames.contains(
              'datasetId'
            )
          ) {

            store.createIndex(
              'datasetId',
              'datasetId',
              {
                unique: false,
              }
            );

          }

        };


      request.onsuccess =
        () => {

          const db =
            request.result;


          /*
          |--------------------------------------------------------------------------
          | If another tab upgrades the DB,
          | close this connection.
          |--------------------------------------------------------------------------
          */

          db.onversionchange =
            () => {
              db.close();
            };


          resolve(db);

        };


      request.onerror =
        () => {

          reject(
            request.error ||
            new Error(
              'Unable to open DataPilot Dataset Vault.'
            )
          );

        };

    }
  );

}


/*
|--------------------------------------------------------------------------
| Save dataset
|--------------------------------------------------------------------------
*/

export async function saveDatasetToVault({
  datasetId,
  file,
  analysis,
}) {

  if (!datasetId) {

    throw new Error(
      'Dataset ID is required.'
    );

  }


  if (!file) {

    throw new Error(
      'Original dataset file is required.'
    );

  }


  const db =
    await openDB();


  const record = {

    /*
    |--------------------------------------------------------------------------
    | Important:
    | Dataset ID is the unique IndexedDB key.
    |--------------------------------------------------------------------------
    */

    id:
      String(datasetId),

    datasetId:
      String(datasetId),

    file,

    fileName:
      file.name ||
      'dataset',

    fileType:
      file.type ||
      getExtension(
        file.name
      ),

    fileSize:
      Number(
        file.size
      ) || 0,

    time:
      Date.now(),

    analysis:
      analysis || null,

  };


  await new Promise(
    (
      resolve,
      reject
    ) => {

      const transaction =
        db.transaction(
          STORE_NAME,
          'readwrite'
        );


      const store =
        transaction.objectStore(
          STORE_NAME
        );


      store.put(
        record
      );


      transaction.oncomplete =
        () => resolve();


      transaction.onerror =
        () => reject(
          transaction.error ||
          new Error(
            'Unable to save dataset.'
          )
        );


      transaction.onabort =
        () => reject(
          transaction.error ||
          new Error(
            'Dataset storage transaction aborted.'
          )
        );

    }
  );


  db.close();


  return record;
}


/*
|--------------------------------------------------------------------------
| Get one dataset
|--------------------------------------------------------------------------
*/

export async function getDatasetFromVault(
  id
) {

  if (!id) {
    return null;
  }


  const db =
    await openDB();


  const result =
    await new Promise(
      (
        resolve,
        reject
      ) => {

        const transaction =
          db.transaction(
            STORE_NAME,
            'readonly'
          );


        const store =
          transaction.objectStore(
            STORE_NAME
          );


        const request =
          store.get(
            String(id)
          );


        request.onsuccess =
          () => {

            resolve(
              request.result ||
              null
            );

          };


        request.onerror =
          () => {

            reject(
              request.error ||
              new Error(
                'Unable to read dataset.'
              )
            );

          };

      }
    );


  db.close();


  return result;
}


/*
|--------------------------------------------------------------------------
| Get ALL datasets
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| There is NO limit.
|
| If you uploaded:
|
| 1 dataset
| 10 datasets
| 50 datasets
| 100 datasets
|
| they can all remain in IndexedDB.
|--------------------------------------------------------------------------
*/

export async function getAllDatasetsFromVault() {

  const db =
    await openDB();


  const result =
    await new Promise(
      (
        resolve,
        reject
      ) => {

        const transaction =
          db.transaction(
            STORE_NAME,
            'readonly'
          );


        const store =
          transaction.objectStore(
            STORE_NAME
          );


        const request =
          store.getAll();


        request.onsuccess =
          () => {

            const rows =
              Array.isArray(
                request.result
              )
                ? request.result
                : [];


            rows.sort(
              (
                a,
                b
              ) =>
                Number(
                  b.time || 0
                ) -
                Number(
                  a.time || 0
                )
            );


            resolve(
              rows
            );

          };


        request.onerror =
          () => {

            reject(
              request.error ||
              new Error(
                'Unable to read Dataset Vault.'
              )
            );

          };

      }
    );


  db.close();


  return result;
}


/*
|--------------------------------------------------------------------------
| Delete one dataset
|--------------------------------------------------------------------------
*/

export async function deleteDatasetFromVault(
  id
) {

  if (!id) {
    return;
  }


  const db =
    await openDB();


  await new Promise(
    (
      resolve,
      reject
    ) => {

      const transaction =
        db.transaction(
          STORE_NAME,
          'readwrite'
        );


      transaction
        .objectStore(
          STORE_NAME
        )
        .delete(
          String(id)
        );


      transaction.oncomplete =
        () => resolve();


      transaction.onerror =
        () => reject(
          transaction.error ||
          new Error(
            'Unable to delete dataset.'
          )
        );


      transaction.onabort =
        () => reject(
          transaction.error ||
          new Error(
            'Dataset delete was aborted.'
          )
        );

    }
  );


  db.close();

}


/*
|--------------------------------------------------------------------------
| Clear entire vault
|--------------------------------------------------------------------------
*/

export async function clearDatasetVault() {

  const db =
    await openDB();


  await new Promise(
    (
      resolve,
      reject
    ) => {

      const transaction =
        db.transaction(
          STORE_NAME,
          'readwrite'
        );


      transaction
        .objectStore(
          STORE_NAME
        )
        .clear();


      transaction.oncomplete =
        () => resolve();


      transaction.onerror =
        () => reject(
          transaction.error ||
          new Error(
            'Unable to clear Dataset Vault.'
          )
        );


      transaction.onabort =
        () => reject(
          transaction.error ||
          new Error(
            'Dataset Vault clear was aborted.'
          )
        );

    }
  );


  db.close();

}


/*
|--------------------------------------------------------------------------
| Download original dataset
|--------------------------------------------------------------------------
*/

export async function downloadDatasetFromVault(
  id
) {

  const record =
    await getDatasetFromVault(
      id
    );


  if (
    !record?.file
  ) {

    throw new Error(
      'Original dataset file is not available.'
    );

  }


  const url =
    URL.createObjectURL(
      record.file
    );


  try {

    const anchor =
      document.createElement(
        'a'
      );


    anchor.href =
      url;


    anchor.download =
      record.fileName ||
      'dataset';


    document.body.appendChild(
      anchor
    );


    anchor.click();


    anchor.remove();

  } finally {

    setTimeout(
      () => {
        URL.revokeObjectURL(
          url
        );
      },
      1000
    );

  }

}


/*
|--------------------------------------------------------------------------
| File size
|--------------------------------------------------------------------------
*/

export function formatFileSize(
  bytes
) {

  const value =
    Number(bytes) || 0;


  if (
    value < 1024
  ) {

    return `${value} B`;

  }


  if (
    value < 1024 ** 2
  ) {

    return `${(
      value / 1024
    ).toFixed(1)} KB`;

  }


  if (
    value < 1024 ** 3
  ) {

    return `${(
      value / 1024 ** 2
    ).toFixed(1)} MB`;

  }


  return `${(
    value / 1024 ** 3
  ).toFixed(1)} GB`;

}


/*
|--------------------------------------------------------------------------
| Extension helper
|--------------------------------------------------------------------------
*/

function getExtension(
  name = ''
) {

  const match =
    String(name).match(
      /\.[^.]+$/
    );


  return match
    ? match[0].toLowerCase()
    : 'dataset';

}
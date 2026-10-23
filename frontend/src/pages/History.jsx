import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Activity,
  BarChart3,
  CalendarDays,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Layers3,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useApp,
} from '../context/AppContext';

import {
  Card,
  Page,
} from '../components/UI';

import {
  clearDatasetVault,
  deleteDatasetFromVault,
  downloadDatasetFromVault,
  formatFileSize,
  getAllDatasetsFromVault,
  getDatasetFromVault,
} from '../lib/datasetStorage';


/* =========================================================
   MAIN
========================================================= */

export default function History() {

  const {
    history,
    setHistory,
    restoreFromVault,
    clearDataset,
  } = useApp();


  const navigate =
    useNavigate();


  const [
    vault,
    setVault,
  ] = useState([]);


  const [
    vaultLoading,
    setVaultLoading,
  ] = useState(true);


  const [
    search,
    setSearch,
  ] = useState('');


  const [
    selectedRun,
    setSelectedRun,
  ] = useState(null);


  const [
    restoringId,
    setRestoringId,
  ] = useState(null);


  const [
    deletingId,
    setDeletingId,
  ] = useState(null);


  const [
    showClearModal,
    setShowClearModal,
  ] = useState(false);


  /* =========================================================
     LOAD ALL DATASETS
  ========================================================= */

  const refreshVault =
    async () => {

      setVaultLoading(
        true
      );

      try {

        const items =
          await getAllDatasetsFromVault();


        setVault(
          items
        );


        /*
         * IndexedDB is the source
         * of truth.
         */

        if (
          items.length
        ) {

          setHistory(
            (current) => {

              const vaultItems =
                items.map(
                  toHistoryItem
                );


              const vaultIds =
                new Set(
                  vaultItems.map(
                    (item) =>
                      item.vaultId
                  )
                );


              /*
               * Preserve older history
               * records that were created
               * before the new Vault.
               */

              const oldItems =
                current.filter(
                  (item) =>
                    !item.vaultId ||
                    !vaultIds.has(
                      item.vaultId
                    )
                );


              return [
                ...vaultItems,
                ...oldItems,
              ].sort(
                (a, b) =>
                  Number(
                    b.time || 0
                  ) -
                  Number(
                    a.time || 0
                  )
              );
            }
          );
        }

      } catch (
        error
      ) {

        console.error(
          'Dataset Vault error:',
          error
        );

      } finally {

        setVaultLoading(
          false
        );
      }
    };


  useEffect(() => {
    refreshVault();
  }, []);


  /* =========================================================
     RECORDS
  ========================================================= */

  const records =
    useMemo(
      () => {

        const vaultRecords =
          vault.map(
            (item) => ({
              ...toHistoryItem(
                item
              ),

              vaultRecord:
                item,
            })
          );


        const vaultIds =
          new Set(
            vaultRecords.map(
              (item) =>
                item.vaultId
            )
          );


        const fallback =
          history
            .filter(
              (item) =>
                !item.vaultId ||
                !vaultIds.has(
                  item.vaultId
                )
            )
            .map(
              (item) => ({
                ...item,
                vaultRecord:
                  null,
              })
            );


        return [
          ...vaultRecords,
          ...fallback,
        ].sort(
          (a, b) =>
            Number(
              b.time || 0
            ) -
            Number(
              a.time || 0
            )
        );

      },
      [
        vault,
        history,
      ]
    );


  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredRecords =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        if (!query) {
          return records;
        }


        return records.filter(
          (item) => {

            const name =
              String(
                item.name || ''
              ).toLowerCase();


            const type =
              String(
                item.vaultRecord
                  ?.fileType || ''
              ).toLowerCase();


            return (
              name.includes(
                query
              ) ||
              type.includes(
                query
              )
            );
          }
        );

      },
      [
        records,
        search,
      ]
    );


  /* =========================================================
     STATS
  ========================================================= */

  const stats =
    useMemo(
      () => {

        const qualities =
          records.map(
            (item) =>
              Number(
                item.quality
              ) || 0
          );


        return {

          total:
            records.length,

          storedFiles:
            vault.length,

          averageQuality:
            qualities.length
              ? qualities.reduce(
                  (a, b) =>
                    a + b,
                  0
                ) /
                qualities.length
              : 0,

          bestQuality:
            qualities.length
              ? Math.max(
                  ...qualities
                )
              : 0,

          totalRows:
            records.reduce(
              (
                sum,
                item
              ) =>
                sum +
                (
                  Number(
                    item.rows
                  ) || 0
                ),
              0
            ),
        };

      },
      [
        records,
        vault,
      ]
    );


  /* =========================================================
     CLEAR VAULT
  ========================================================= */

  const clearEverything =
    async () => {

      try {

        await clearDatasetVault();


        setVault([]);

        setHistory([]);

        clearDataset();

        setSelectedRun(
          null
        );

        setShowClearModal(
          false
        );

      } catch (
        error
      ) {

        console.error(
          'Clear Dataset Vault failed:',
          error
        );

        alert(
          error?.message ||
            'Unable to clear the Dataset Vault.'
        );
      }
    };


  /* =========================================================
     DELETE ONE
  ========================================================= */

  const deleteOne =
    async (
      item
    ) => {

      const id =
        item.vaultRecord
          ?.id;


      if (!id) {
        return;
      }


      const confirmed =
        window.confirm(
          `Delete "${item.name}" from the local Dataset Vault?\n\nThis does not delete the backend dataset.`
        );


      if (!confirmed) {
        return;
      }


      setDeletingId(
        id
      );


      try {

        await deleteDatasetFromVault(
          id
        );


        setVault(
          (current) =>
            current.filter(
              (entry) =>
                entry.id !== id
            )
        );


        setHistory(
          (current) =>
            current.filter(
              (entry) =>
                entry.vaultId !==
                  id &&
                entry.id !==
                  id
            )
        );


        setSelectedRun(
          null
        );

      } catch (
        error
      ) {

        console.error(
          error
        );

        alert(
          error?.message ||
            'Unable to delete this dataset.'
        );

      } finally {

        setDeletingId(
          null
        );
      }
    };


  /* =========================================================
     DOWNLOAD
  ========================================================= */

  const downloadDataset =
    async (
      item
    ) => {

      const id =
        item.vaultRecord
          ?.id;


      if (!id) {

        alert(
          'This older history item has no original file stored in the Dataset Vault.'
        );

        return;
      }


      try {

        await downloadDatasetFromVault(
          id
        );

      } catch (
        error
      ) {

        alert(
          error?.message ||
            'Dataset file is not available.'
        );
      }
    };


  /* =========================================================
     RESTORE
  ========================================================= */

  const restoreDataset =
    async (
      item
    ) => {

      const id =
        item.vaultRecord
          ?.id;


      if (!id) {

        alert(
          'This history item does not have an original file stored in the Dataset Vault.'
        );

        return;
      }


      setRestoringId(
        id
      );


      try {

        await restoreFromVault(
          id
        );


        navigate(
          '/app/overview'
        );

      } catch (
        error
      ) {

        console.error(
          error
        );

        alert(
          error?.message ||
            'Unable to restore this dataset.'
        );

      } finally {

        setRestoringId(
          null
        );
      }
    };


  return (

    <Page
      title="Dataset Vault"
      sub="Every uploaded dataset is stored locally in this browser with its original file and analysis information."
    >

      <div className="space-y-6">


        {/* ==================================================
            STATS
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={Database}
            label="Stored Datasets"
            value={
              stats.storedFiles
            }
            description="Original files in IndexedDB"
          />


          <StatCard
            icon={Activity}
            label="Analysis Runs"
            value={
              stats.total
            }
            description="All saved DataPilot runs"
          />


          <StatCard
            icon={ShieldCheck}
            label="Average Quality"
            value={
              stats.total
                ? `${stats.averageQuality.toFixed(1)}/100`
                : '—'
            }
            description="Across saved datasets"
          />


          <StatCard
            icon={BarChart3}
            label="Rows Analyzed"
            value={
              formatNumber(
                stats.totalRows
              )
            }
            description="Across saved runs"
          />

        </div>


        {/* ==================================================
            DATASET VAULT
        ================================================== */}

        <Card>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">

                <Layers3 className="h-5 w-5" />

              </div>


              <div>

                <h2 className="text-lg font-bold text-white">

                  Dataset Vault

                </h2>


                <p className="mt-1 text-xs text-slate-500">

                  {vault.length}

                  {' '}

                  original dataset

                  {vault.length === 1
                    ? ''
                    : 's'}

                  {' '}

                  stored locally

                </p>

              </div>

            </div>


            {records.length > 0 && (

              <div className="flex flex-col gap-2 sm:flex-row">

                <div className="relative">

                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />


                  <input
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Search datasets..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-400/40 sm:w-72"
                  />

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setShowClearModal(
                      true
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-400/10 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                >

                  <Trash2 className="h-4 w-4" />

                  Clear Vault

                </button>

              </div>

            )}

          </div>


          {/* ==================================================
              LOADING
          ================================================== */}

          {vaultLoading ? (

            <div className="py-16 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-orange-400" />

              <p className="mt-4 text-sm text-slate-500">

                Loading every stored dataset...

              </p>

            </div>

          ) : records.length === 0 ? (

            <EmptyHistory />

          ) : filteredRecords.length === 0 ? (

            <div className="py-16 text-center">

              <Search className="mx-auto h-9 w-9 text-slate-600" />

              <h3 className="mt-3 font-semibold text-slate-300">

                No matching datasets

              </h3>

              <p className="mt-1 text-sm text-slate-500">

                Try another dataset name or file type.

              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-3">

              {filteredRecords.map(
                (
                  item,
                  index
                ) => (

                  <HistoryItem
                    key={
                      item.vaultId ||
                      item.id ||
                      `${item.name}-${index}`
                    }

                    item={
                      item
                    }

                    onView={() =>
                      setSelectedRun(
                        item
                      )
                    }

                    onDownload={() =>
                      downloadDataset(
                        item
                      )
                    }

                    onRestore={() =>
                      restoreDataset(
                        item
                      )
                    }

                    onDelete={() =>
                      deleteOne(
                        item
                      )
                    }

                    restoring={
                      restoringId ===
                      item.vaultId
                    }

                    deleting={
                      deletingId ===
                      item.vaultId
                    }
                  />

                )
              )}

            </div>

          )}

        </Card>


        {/* ==================================================
            STORAGE INFO
        ================================================== */}

        {records.length > 0 && (

          <div className="flex gap-3 rounded-2xl border border-orange-400/10 bg-orange-500/5 p-4">

            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />

            <div>

              <p className="text-sm font-semibold text-orange-200">

                Persistent browser storage

              </p>


              <p className="mt-1 text-xs leading-5 text-slate-500">

                Original dataset files are stored in IndexedDB.
                Lightweight history information is stored in
                localStorage. Refreshing the browser does not
                remove these datasets.

              </p>

            </div>

          </div>

        )}

      </div>


      {/* ==================================================
          DETAILS MODAL
      ================================================== */}

      {selectedRun && (

        <RunDetails
          item={
            selectedRun
          }

          onClose={() =>
            setSelectedRun(
              null
            )
          }

          onDownload={() =>
            downloadDataset(
              selectedRun
            )
          }

          onRestore={() =>
            restoreDataset(
              selectedRun
            )
          }

          onDelete={() =>
            deleteOne(
              selectedRun
            )
          }

          restoring={
            restoringId ===
            selectedRun.vaultId
          }

          deleting={
            deletingId ===
            selectedRun.vaultId
          }
        />

      )}


      {/* ==================================================
          CLEAR MODAL
      ================================================== */}

      {showClearModal && (

        <ConfirmClear
          onCancel={() =>
            setShowClearModal(
              false
            )
          }

          onConfirm={
            clearEverything
          }
        />

      )}

    </Page>
  );
}


/* ============================================================
   CONVERT VAULT RECORD → HISTORY ITEM
============================================================ */

function toHistoryItem(
  record
) {

  const dataset =
    record?.dataset ||
    record?.analysis ||
    {};

  const profile =
    dataset?.profile ||
    {};


  return {

    id:
      record?.id ||
      record?.datasetId,

    vaultId:
      record?.id ||
      null,

    dataset_id:
      record?.datasetId ||
      dataset?.dataset_id,

    name:
      record?.name ||
      record?.fileName ||
      dataset?.filename ||
      'Untitled Dataset',

    time:
      Number(
        record?.time ||
          record?.updatedAt ||
          Date.now()
      ),

    rows:
      Number(
        profile?.rows ??
          dataset?.total_rows ??
          0
      ),

    cols:
      Number(
        profile?.cols ??
          dataset?.total_columns ??
          0
      ),

    quality:
      Number(
        profile?.quality_score ??
          0
      ),

    fileSize:
      Number(
        record?.fileSize ||
          0
      ),

    fileType:
      record?.fileType ||
      '',
  };
}


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}) {

  return (

    <div className="glass rounded-2xl border border-white/10 p-5 transition hover:border-orange-400/20">

      <div className="flex items-start justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">

          <Icon className="h-5 w-5" />

        </div>


        <div className="h-2 w-2 rounded-full bg-orange-400" />

      </div>


      <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">

        {label}

      </p>


      <p className="mt-1 text-2xl font-bold text-white">

        {value}

      </p>


      <p className="mt-1 text-xs text-slate-500">

        {description}

      </p>

    </div>
  );
}


/* ============================================================
   HISTORY ITEM
============================================================ */

function HistoryItem({
  item,
  onView,
  onDownload,
  onRestore,
  onDelete,
  restoring,
  deleting,
}) {

  const quality =
    Number(
      item.quality
    ) || 0;


  const stored =
    Boolean(
      item.vaultRecord
    );


  return (

    <div className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-orange-400/20 hover:bg-white/[0.04]">

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">


        <div className="flex min-w-0 items-center gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">

            {stored ? (

              <FileSpreadsheet className="h-5 w-5" />

            ) : (

              <FileText className="h-5 w-5" />

            )}

          </div>


          <div className="min-w-0">

            <h3
              className="truncate font-semibold text-white"
              title={
                item.name
              }
            >

              {item.name ||
                'Unnamed Dataset'}

            </h3>


            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">

              <span className="flex items-center gap-1.5">

                <CalendarDays className="h-3.5 w-3.5" />

                {formatDate(
                  item.time
                )}

              </span>


              <span className="flex items-center gap-1.5">

                <Database className="h-3.5 w-3.5" />

                {formatNumber(
                  item.rows
                )}

                {' '}

                rows

              </span>


              <span className="flex items-center gap-1.5">

                <BarChart3 className="h-3.5 w-3.5" />

                {formatNumber(
                  item.cols
                )}

                {' '}

                columns

              </span>


              {stored && (

                <span className="flex items-center gap-1.5 text-emerald-400/80">

                  <HardDrive className="h-3.5 w-3.5" />

                  Original file stored

                </span>

              )}

            </div>

          </div>

        </div>


        <div className="flex flex-wrap items-center gap-2 xl:justify-end">

          <QualityBadge
            quality={
              quality
            }
          />


          <button
            type="button"
            onClick={
              onView
            }
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-white"
          >

            <Eye className="h-4 w-4" />

            Details

          </button>


          {stored && (

            <>

              <button
                type="button"
                onClick={
                  onDownload
                }
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-white"
              >

                <Download className="h-4 w-4" />

                Download

              </button>


              <button
                type="button"
                onClick={
                  onRestore
                }
                disabled={
                  restoring
                }
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-orange-400 disabled:opacity-50"
              >

                <Upload className="h-4 w-4" />

                {restoring
                  ? 'Opening...'
                  : 'Open'}

              </button>


              <button
                type="button"
                onClick={
                  onDelete
                }
                disabled={
                  deleting
                }
                className="flex items-center gap-2 rounded-lg border border-red-400/10 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
              >

                <Trash2 className="h-4 w-4" />

                {deleting
                  ? 'Deleting...'
                  : 'Delete'}

              </button>

            </>

          )}

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   QUALITY
============================================================ */

function QualityBadge({
  quality,
}) {

  let text =
    'Needs Review';

  let className =
    'border-red-400/20 bg-red-500/10 text-red-300';


  if (
    quality >= 90
  ) {

    text =
      'Excellent';

    className =
      'border-emerald-400/20 bg-emerald-500/10 text-emerald-300';

  } else if (
    quality >= 75
  ) {

    text =
      'Good';

    className =
      'border-sky-400/20 bg-sky-500/10 text-sky-300';

  } else if (
    quality >= 50
  ) {

    text =
      'Fair';

    className =
      'border-yellow-400/20 bg-yellow-500/10 text-yellow-300';
  }


  return (

    <div className="mr-2 text-right">

      <div className="text-sm font-bold text-white">

        {quality.toFixed(
          2
        )}

        /100

      </div>


      <span
        className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${className}`}
      >

        {text}

      </span>

    </div>
  );
}


/* ============================================================
   EMPTY
============================================================ */

function EmptyHistory() {

  return (

    <div className="py-20 text-center">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300">

        <Database className="h-8 w-8" />

      </div>


      <h3 className="mt-5 text-lg font-semibold text-white">

        Your Dataset Vault is empty

      </h3>


      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

        Upload datasets from DataPilot AI.
        Every successful upload will
        automatically create a separate
        Dataset Vault record.

      </p>

    </div>
  );
}


/* ============================================================
   DETAILS MODAL
============================================================ */

function RunDetails({
  item,
  onClose,
  onDownload,
  onRestore,
  onDelete,
  restoring,
  deleting,
}) {

  const [
    fullRecord,
    setFullRecord,
  ] = useState(
    item.vaultRecord ||
      null
  );


  useEffect(() => {

    let active =
      true;


    async function loadDetails() {

      if (
        !item.vaultId
      ) {
        return;
      }


      try {

        const record =
          await getDatasetFromVault(
            item.vaultId
          );


        if (
          active &&
          record
        ) {

          setFullRecord(
            record
          );
        }

      } catch (
        error
      ) {

        console.error(
          'Vault details error:',
          error
        );
      }
    }


    loadDetails();


    return () => {
      active = false;
    };

  }, [
    item.vaultId,
  ]);


  const dataset =
    fullRecord?.dataset ||
    fullRecord?.analysis ||
    {};


  const profile =
    dataset?.profile ||
    {};


  const columns =
    Array.isArray(
      profile.columns
    )
      ? profile.columns
      : [];


  const preview =
    Array.isArray(
      dataset.preview
    )
      ? dataset.preview
      : [];


  const quality =
    Number(
      profile.quality_score ??
        item.quality ??
        0
    ) || 0;


  const missingCells =
    Number(
      profile.missing_cells ??
        0
    ) || 0;


  const duplicates =
    Number(
      profile.duplicate_rows ??
        profile.duplicates ??
        0
    ) || 0;


  return (

    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-md">

      <div className="mx-auto my-8 w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d0f] shadow-2xl">


        {/* HEADER */}

        <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex min-w-0 items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300">

              <FileSpreadsheet className="h-6 w-6" />

            </div>


            <div className="min-w-0">

              <div className="text-xs uppercase tracking-widest text-orange-300">

                Dataset Vault

              </div>


              <h2 className="mt-1 truncate text-xl font-bold text-white">

                {item.name ||
                  'Unnamed Dataset'}

              </h2>


              <p className="mt-1 text-xs text-slate-500">

                Original dataset and DataPilot analysis record

              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="self-end rounded-xl p-2 text-slate-500 transition hover:bg-white/5 hover:text-white sm:self-auto"
          >

            <X className="h-5 w-5" />

          </button>

        </div>


        <div className="max-h-[75vh] overflow-y-auto p-6">


          {/* ACTIONS */}

          <div className="grid gap-3 sm:grid-cols-4">

            <VaultAction
              icon={
                Download
              }
              title="Download"
              text={
                fullRecord
                  ? `${formatFileSize(
                      fullRecord.fileSize
                    )} · ${
                      fullRecord.fileType ||
                      'dataset'
                    }`
                  : 'Original file'
              }
              onClick={
                onDownload
              }
            />


            <VaultAction
              icon={
                Upload
              }
              title="Open"
              text="Restore into DataPilot"
              onClick={
                onRestore
              }
              disabled={
                restoring
              }
            />


            <VaultAction
              icon={
                ShieldCheck
              }
              title="Storage"
              text="Browser IndexedDB"
              disabled
            />


            <VaultAction
              icon={
                Trash2
              }
              title="Delete"
              text="Remove local copy"
              onClick={
                onDelete
              }
              disabled={
                deleting
              }
              danger
            />

          </div>


          {/* OVERVIEW */}

          <section className="mt-7">

            <SectionTitle
              icon={
                Database
              }
              title="Dataset overview"
            />


            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <DetailBox
                label="Rows"
                value={
                  formatNumber(
                    profile.rows ??
                      item.rows
                  )
                }
              />


              <DetailBox
                label="Columns"
                value={
                  formatNumber(
                    profile.cols ??
                      item.cols
                  )
                }
              />


              <DetailBox
                label="Quality"
                value={`${quality.toFixed(
                  2
                )}/100`}
              />


              <DetailBox
                label="File size"
                value={
                  fullRecord
                    ? formatFileSize(
                        fullRecord.fileSize
                      )
                    : '—'
                }
              />


              <DetailBox
                label="Missing cells"
                value={
                  formatNumber(
                    missingCells
                  )
                }
              />


              <DetailBox
                label="Duplicate rows"
                value={
                  formatNumber(
                    duplicates
                  )
                }
              />


              <DetailBox
                label="File type"
                value={
                  fullRecord?.fileType ||
                  'Dataset'
                }
              />


              <DetailBox
                label="Stored"
                value={
                  formatDate(
                    fullRecord?.time ||
                      item.time
                  )
                }
              />

            </div>

          </section>


          {/* COLUMN PROFILE */}

          {columns.length > 0 && (

            <section className="mt-7">

              <SectionTitle
                icon={
                  BarChart3
                }
                title="Column intelligence"
              />


              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[680px] text-left text-sm">

                    <thead className="bg-white/[0.03]">

                      <tr>

                        <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
                          Column
                        </th>

                        <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
                          Type
                        </th>

                        <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
                          Missing
                        </th>

                        <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
                          Unique
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {columns.map(
                        (
                          column,
                          index
                        ) => {

                          const name =
                            column?.name ||
                            column?.column ||
                            `Column ${
                              index + 1
                            }`;


                          const type =
                            column?.kind ||
                            column?.dtype ||
                            column?.type ||
                            'Unknown';


                          const missing =
                            column?.missing ??
                            column?.missing_count ??
                            0;


                          const unique =
                            column?.unique ??
                            column?.unique_count ??
                            column?.nunique ??
                            '—';


                          return (

                            <tr
                              key={`${name}-${index}`}
                              className="border-t border-white/5"
                            >

                              <td className="max-w-[280px] truncate px-4 py-3 font-medium text-white">
                                {name}
                              </td>


                              <td className="px-4 py-3 text-slate-400">
                                {String(
                                  type
                                )}
                              </td>


                              <td className="px-4 py-3">

                                <span
                                  className={
                                    Number(
                                      missing
                                    ) > 0
                                      ? 'text-amber-300'
                                      : 'text-emerald-300'
                                  }
                                >

                                  {formatNumber(
                                    missing
                                  )}

                                </span>

                              </td>


                              <td className="px-4 py-3 text-slate-400">

                                {formatNumber(
                                  unique
                                )}

                              </td>

                            </tr>

                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </section>

          )}


          {/* PREVIEW */}

          {preview.length > 0 && (

            <section className="mt-7">

              <SectionTitle
                icon={
                  Eye
                }
                title="Dataset preview"
              />


              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[700px] text-left text-xs">

                    <thead className="bg-white/[0.03]">

                      <tr>

                        {Object.keys(
                          preview[0] ||
                            {}
                        )
                          .slice(
                            0,
                            8
                          )
                          .map(
                            (
                              key
                            ) => (

                              <th
                                key={
                                  key
                                }
                                className="px-4 py-3 font-semibold text-slate-400"
                              >

                                {key}

                              </th>

                            )
                          )}

                      </tr>

                    </thead>


                    <tbody>

                      {preview
                        .slice(
                          0,
                          5
                        )
                        .map(
                          (
                            row,
                            rowIndex
                          ) => (

                            <tr
                              key={
                                rowIndex
                              }
                              className="border-t border-white/5"
                            >

                              {Object.keys(
                                preview[0] ||
                                  {}
                              )
                                .slice(
                                  0,
                                  8
                                )
                                .map(
                                  (
                                    key
                                  ) => (

                                    <td
                                      key={
                                        key
                                      }
                                      className="max-w-[180px] truncate px-4 py-3 text-slate-400"
                                    >

                                      {String(
                                        row?.[
                                          key
                                        ] ??
                                          '—'
                                      )}

                                    </td>

                                  )
                                )}

                            </tr>

                          )
                        )}

                    </tbody>

                  </table>

                </div>

              </div>

            </section>

          )}

        </div>


        {/* FOOTER */}

        <div className="flex justify-end border-t border-white/10 p-5">

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >

            Close

          </button>

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   VAULT ACTION
============================================================ */

function VaultAction({
  icon: Icon,
  title,
  text,
  onClick,
  disabled,
  danger = false,
}) {

  return (

    <button
      type="button"
      onClick={
        disabled
          ? undefined
          : onClick
      }
      disabled={
        disabled
      }
      className={`rounded-2xl border p-4 text-left transition ${
        danger
          ? 'border-red-400/10 bg-red-500/5 hover:bg-red-500/10'
          : 'border-white/10 bg-white/[0.025] hover:border-orange-400/20 hover:bg-orange-500/5'
      } ${
        disabled
          ? 'cursor-default opacity-60'
          : ''
      }`}
    >

      <div className="flex items-center gap-3">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            danger
              ? 'bg-red-500/10 text-red-300'
              : 'bg-orange-500/10 text-orange-300'
          }`}
        >

          <Icon className="h-5 w-5" />

        </div>


        <div>

          <div className="text-sm font-semibold text-white">

            {title}

          </div>


          <div className="mt-1 text-xs text-slate-500">

            {text}

          </div>

        </div>

      </div>

    </button>
  );
}


/* ============================================================
   SECTION TITLE
============================================================ */

function SectionTitle({
  icon: Icon,
  title,
}) {

  return (

    <div className="flex items-center gap-2">

      <Icon className="h-4 w-4 text-orange-300" />

      <h3 className="text-sm font-bold text-white">

        {title}

      </h3>

    </div>
  );
}


/* ============================================================
   DETAIL BOX
============================================================ */

function DetailBox({
  label,
  value,
}) {

  return (

    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">

      <p className="text-xs uppercase tracking-wider text-slate-500">

        {label}

      </p>


      <p className="mt-1 text-sm font-semibold text-white">

        {value}

      </p>

    </div>
  );
}


/* ============================================================
   CLEAR MODAL
============================================================ */

function ConfirmClear({
  onCancel,
  onConfirm,
}) {

  return (

    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">

      <div className="glass w-full max-w-md rounded-2xl border border-red-400/10 p-6">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-300">

          <Trash2 className="h-6 w-6" />

        </div>


        <h2 className="mt-5 text-lg font-bold text-white">

          Clear Dataset Vault?

        </h2>


        <p className="mt-2 text-sm leading-6 text-slate-500">

          This removes every locally stored original dataset
          and its local analysis history. Your backend datasets
          are not deleted.

        </p>


        <div className="mt-6 flex gap-3">

          <button
            type="button"
            onClick={
              onCancel
            }
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08]"
          >

            Cancel

          </button>


          <button
            type="button"
            onClick={
              onConfirm
            }
            className="flex-1 rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
          >

            Clear Vault

          </button>

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   HELPERS
============================================================ */

function formatNumber(
  value
) {

  if (
    value === undefined ||
    value === null ||
    value === '—'
  ) {
    return '—';
  }


  const number =
    Number(value);


  if (
    !Number.isFinite(
      number
    )
  ) {
    return String(
      value
    );
  }


  return new Intl.NumberFormat().format(
    number
  );
}


function formatDate(
  value
) {

  if (!value) {
    return 'Unknown';
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Unknown';
  }


  return date.toLocaleString();
}
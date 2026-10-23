import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Copy,
  Database,
  FileBarChart,
  FileText,
  History,
  Lightbulb,
  Loader2,
  MessageCircle,
  PanelLeft,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Wand2,
  X,
  Zap,
} from "lucide-react";

import { useApp } from "../context/AppContext";


/* =========================================================
   CONSTANTS
========================================================= */

const CHAT_STORAGE_KEY =
  "datapilot_ai_chats_v6";

const ACTIVE_CHAT_KEY =
  "datapilot_ai_active_chat_v6";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";


/* =========================================================
   DATA PILOT PROJECT CONTEXT
========================================================= */

const PROJECT_CONTEXT = `
PROJECT NAME:
DataPilot AI - Autonomous AI Data Scientist

PROJECT TYPE:
Full-stack AI-powered Data Science platform.

PROJECT PURPOSE:
DataPilot AI is designed to automate the major stages of the Data Science lifecycle. The platform allows a user to upload a dataset and then perform dataset profiling, data-quality analysis, exploratory data analysis, visualization, AI-generated insights, machine-learning analysis, model comparison, predictions, Explainable AI, natural-language dataset interaction, and automated reporting.

CORE WORKFLOW:
Dataset Upload
→ Data Validation
→ Data Quality
→ Data Cleaning
→ Exploratory Data Analysis
→ Visualization
→ AI Insights
→ Machine Learning Problem Detection
→ Model Training
→ Model Comparison
→ Best Model
→ Explainability
→ Predictions
→ AI Data Scientist
→ Professional Reports

MAIN MODULES:
1. Overview
2. Data Quality
3. EDA & Visualize
4. AI Insights
5. Model Lab
6. Explainability
7. Predictions
8. AI Data Scientist
9. Reports
10. History

MAIN TECHNOLOGIES:
Frontend: React, Vite, Tailwind CSS
Backend: FastAPI, Python
Data Processing: Pandas, NumPy
Machine Learning: Scikit-learn
Generative AI: Gemini
Visualization: Recharts / data visualization components
Explainable AI: SHAP / LIME where available
Reporting: Automated professional reports

IMPORTANT:
DataPilot AI is not simply a chatbot. The AI Data Scientist is one component of the complete DataPilot autonomous data-science workspace.

When the user asks about the PROJECT, explain DataPilot AI itself.

When the user asks about the DATASET, use the currently loaded dataset context.

When the user asks about BOTH the project and dataset, explain both separately.

Never confuse the project with the uploaded dataset.
`;


/* =========================================================
   HELPERS
========================================================= */

function createId(prefix = "id") {
  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );
}


function readStorage(key, fallback) {
  try {
    const value =
      localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    const parsed =
      JSON.parse(value);

    return parsed;
  } catch {
    return fallback;
  }
}


function writeStorage(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch {
    // Ignore localStorage errors.
  }
}


function getDatasetId(dataset) {
  if (!dataset) {
    return "";
  }

  return String(
    dataset.dataset_id ||
      dataset.datasetId ||
      dataset.id ||
      ""
  );
}


function getDatasetName(dataset) {
  if (!dataset) {
    return "No dataset loaded";
  }

  return (
    dataset.filename ||
    dataset.file_name ||
    dataset.name ||
    "Current dataset"
  );
}


function getProfile(dataset) {
  return dataset?.profile || {};
}


function getRows(dataset) {
  const profile =
    getProfile(dataset);

  return (
    profile.rows ??
    dataset?.total_rows ??
    dataset?.rows ??
    0
  );
}


function getCols(dataset) {
  const profile =
    getProfile(dataset);

  if (
    profile.cols !== undefined
  ) {
    return profile.cols;
  }

  if (
    profile.columns !== undefined &&
    typeof profile.columns === "number"
  ) {
    return profile.columns;
  }

  if (
    Array.isArray(profile.columns)
  ) {
    return profile.columns.length;
  }

  return (
    dataset?.total_columns ??
    dataset?.columns_count ??
    0
  );
}


function getQuality(dataset) {
  const profile =
    getProfile(dataset);

  return (
    profile.quality_score ??
    profile.quality ??
    dataset?.quality_score ??
    null
  );
}


function getDuplicates(dataset) {
  const profile =
    getProfile(dataset);

  return (
    profile.duplicate_rows ??
    profile.duplicates ??
    dataset?.duplicate_rows ??
    0
  );
}


function getColumns(dataset) {
  const profile =
    getProfile(dataset);

  if (
    Array.isArray(profile.columns)
  ) {
    return profile.columns;
  }

  if (
    Array.isArray(dataset?.columns)
  ) {
    return dataset.columns;
  }

  return [];
}


function number(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const n = Number(value);

  if (!Number.isFinite(n)) {
    return String(value);
  }

  return new Intl.NumberFormat(
    "en-IN"
  ).format(n);
}


function percentage(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const n = Number(value);

  if (!Number.isFinite(n)) {
    return String(value);
  }

  return `${n.toFixed(1)}%`;
}


function createChat(dataset) {
  return {
    id: createId("chat"),
    datasetId: getDatasetId(dataset),
    datasetName: getDatasetName(dataset),
    title: "New analysis",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}


/* =========================================================
   QUICK QUESTIONS
========================================================= */

const QUICK_QUESTIONS = [
  {
    title: "Project overview",
    description:
      "Understand DataPilot AI itself.",
    icon: Sparkles,
    prompt:
      "Give me a complete overview of my DataPilot AI project. Explain the project purpose, problem statement, objectives, complete workflow, main modules, AI capabilities, machine-learning capabilities, Explainable AI, reporting, technology stack, and what makes the platform different. Do not confuse the project with the uploaded dataset.",
  },

  {
    title: "Current dataset",
    description:
      "Analyze the dataset currently loaded.",
    icon: Database,
    prompt:
      "Give me a complete overview of the CURRENTLY LOADED DATASET. Include filename, rows, columns, column information, missing values, duplicates, quality score, important patterns, and what the dataset may be suitable for. Use only the current dataset context.",
  },

  {
    title: "Data quality",
    description:
      "Find problems in the current dataset.",
    icon: CheckCircle2,
    prompt:
      "Analyze the CURRENTLY LOADED DATASET for data-quality problems. Check missing values, duplicates, data types, suspicious columns, and other available quality information. Do not use any previous dataset.",
  },

  {
    title: "EDA analysis",
    description:
      "Understand patterns and relationships.",
    icon: BarChart3,
    prompt:
      "Explain the available EDA information for the CURRENTLY LOADED DATASET. Discuss numerical features, categorical features, distributions, relationships, correlations, and important observations. Do not invent unavailable statistics.",
  },

  {
    title: "ML recommendation",
    description:
      "Find possible machine-learning tasks.",
    icon: BrainCircuit,
    prompt:
      "Analyze the CURRENTLY LOADED DATASET for machine-learning opportunities. Identify possible classification, regression, clustering, or other tasks based only on the available dataset columns and current model context. Do not claim a model was trained unless the current model context confirms it.",
  },

  {
    title: "Business insights",
    description:
      "Turn the current data into useful decisions.",
    icon: Lightbulb,
    prompt:
      "Find useful business insights from the CURRENTLY LOADED DATASET. Separate observed facts, interpretation, potential KPIs, risks, opportunities, and recommended next analyses. Do not invent values.",
  },
];


/* =========================================================
   WORKSPACE LINKS
========================================================= */

const LINKS = [
  {
    name: "Overview",
    url: "/app/overview",
    icon: FileBarChart,
  },
  {
    name: "Data Quality",
    url: "/app/data-quality",
    icon: CheckCircle2,
  },
  {
    name: "EDA & Visualize",
    url: "/app/eda",
    icon: BarChart3,
  },
  {
    name: "AI Insights",
    url: "/app/ai-insights",
    icon: Lightbulb,
  },
  {
    name: "Model Lab",
    url: "/app/model-lab",
    icon: BrainCircuit,
  },
  {
    name: "Explainability",
    url: "/app/explainability",
    icon: Wand2,
  },
  {
    name: "Predictions",
    url: "/app/predictions",
    icon: Activity,
  },
  {
    name: "Reports",
    url: "/app/reports",
    icon: FileText,
  },
];


/* =========================================================
   API REQUEST
========================================================= */

async function sendToAI({
  message,
  dataset,
  model,
  history,
  signal,
}) {
  const datasetId =
    getDatasetId(dataset);

  const userMessage = `
PROJECT CONTEXT:
${PROJECT_CONTEXT}

CURRENT DATASET CONTEXT:
The currently loaded dataset ID is:
${datasetId || "No dataset ID"}

The current dataset filename is:
${getDatasetName(dataset)}

USER REQUEST:
${message}

IMPORTANT:
Answer the user's actual request.

If the request is about the PROJECT, discuss DataPilot AI.

If the request is about the DATASET, use the current dataset information.

If the request asks about both, clearly separate PROJECT information from DATASET information.
`;

  const response =
    await fetch(
      `${API_URL}/api/ai/chat`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          message:
            userMessage,

          dataset_id:
            datasetId,

          dataset:
            dataset || {},

          model:
            model || null,

          history:
            Array.isArray(history)
              ? history
                  .slice(-10)
                  .map((item) => ({
                    role:
                      item.role,
                    content:
                      item.content,
                  }))
              : [],
        }),

        signal,
      }
    );

  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "Backend returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        `AI request failed (${response.status}).`
    );
  }

  if (!data?.answer) {
    throw new Error(
      "DataPilot AI returned an empty answer."
    );
  }

  return data;
}


/* =========================================================
   SIMPLE MARKDOWN DISPLAY
========================================================= */

function MessageContent({
  text,
}) {
  const lines =
    String(text || "").split("\n");

  return (
    <div className="space-y-2 text-sm leading-7 text-[#d5d1ca]">
      {lines.map(
        (line, index) => {
          const trimmed =
            line.trim();

          if (!trimmed) {
            return (
              <div
                key={index}
                className="h-1"
              />
            );
          }

          if (
            trimmed.startsWith("### ")
          ) {
            return (
              <h3
                key={index}
                className="pt-4 text-sm font-bold uppercase tracking-wide text-[#ff967e]"
              >
                {trimmed.slice(4)}
              </h3>
            );
          }

          if (
            trimmed.startsWith("## ")
          ) {
            return (
              <h2
                key={index}
                className="pt-4 text-lg font-semibold text-white"
              >
                {trimmed.slice(3)}
              </h2>
            );
          }

          if (
            trimmed.startsWith("# ")
          ) {
            return (
              <h1
                key={index}
                className="pt-3 text-xl font-bold text-white"
              >
                {trimmed.slice(2)}
              </h1>
            );
          }

          if (
            trimmed.startsWith("- ")
          ) {
            return (
              <div
                key={index}
                className="flex gap-2"
              >
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#ff795b]" />

                <span>
                  {formatInline(
                    trimmed.slice(2)
                  )}
                </span>
              </div>
            );
          }

          if (
            /^\d+\.\s/.test(trimmed)
          ) {
            return (
              <div
                key={index}
                className="flex gap-2"
              >
                <span className="font-semibold text-[#ff795b]">
                  {trimmed.match(
                    /^\d+/
                  )?.[0]}
                  .
                </span>

                <span>
                  {formatInline(
                    trimmed.replace(
                      /^\d+\.\s/,
                      ""
                    )
                  )}
                </span>
              </div>
            );
          }

          return (
            <p
              key={index}
              className="whitespace-pre-wrap"
            >
              {formatInline(trimmed)}
            </p>
          );
        }
      )}
    </div>
  );
}


function formatInline(text) {
  const parts =
    String(text).split(
      /(\*\*.*?\*\*|`.*?`)/
    );

  return parts.map(
    (part, index) => {
      if (
        part.startsWith("**") &&
        part.endsWith("**")
      ) {
        return (
          <strong
            key={index}
            className="font-semibold text-white"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (
        part.startsWith("`") &&
        part.endsWith("`")
      ) {
        return (
          <code
            key={index}
            className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[#ffae99]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return part;
    }
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Chat() {
  const {
    dataset,
    model,
  } = useApp();

  const datasetId =
    getDatasetId(dataset);

  const datasetName =
    getDatasetName(dataset);

  const rows =
    getRows(dataset);

  const cols =
    getCols(dataset);

  const quality =
    getQuality(dataset);

  const duplicates =
    getDuplicates(dataset);

  const columns =
    getColumns(dataset);

  const [chats, setChats] =
    useState(() => {
      const stored =
        readStorage(
          CHAT_STORAGE_KEY,
          []
        );

      if (!Array.isArray(stored)) {
        return [];
      }

      return stored;
    });

  const [activeChatId, setActiveChatId] =
    useState(() =>
      readStorage(
        ACTIVE_CHAT_KEY,
        ""
      )
    );

  const [input, setInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [sidebar, setSidebar] =
    useState(true);

  const [copied, setCopied] =
    useState("");

  const abortController =
    useRef(null);

  const bottomRef =
    useRef(null);

  const inputRef =
    useRef(null);


  /* =======================================================
     SAVE
  ======================================================= */

  useEffect(() => {
    writeStorage(
      CHAT_STORAGE_KEY,
      chats
    );
  }, [chats]);


  useEffect(() => {
    writeStorage(
      ACTIVE_CHAT_KEY,
      activeChatId
    );
  }, [activeChatId]);


  /* =======================================================
     CURRENT DATASET CHAT
  ======================================================= */

  const currentChats =
    useMemo(() => {
      if (!datasetId) {
        return [];
      }

      return chats
        .filter(
          (chat) =>
            chat.datasetId ===
            datasetId
        )
        .sort(
          (a, b) =>
            b.updatedAt -
            a.updatedAt
        );
    }, [
      chats,
      datasetId,
    ]);


  /* =======================================================
     AUTOMATIC CHAT FOR CURRENT DATASET
  ======================================================= */

  useEffect(() => {
    if (!datasetId) {
      setActiveChatId("");
      return;
    }

    const active =
      chats.find(
        (chat) =>
          chat.id ===
            activeChatId &&
          chat.datasetId ===
            datasetId
      );

    if (active) {
      return;
    }

    const existing =
      chats
        .filter(
          (chat) =>
            chat.datasetId ===
            datasetId
        )
        .sort(
          (a, b) =>
            b.updatedAt -
            a.updatedAt
        )[0];

    if (existing) {
      setActiveChatId(
        existing.id
      );

      return;
    }

    const fresh =
      createChat(dataset);

    setChats(
      (previous) => [
        ...previous,
        fresh,
      ]
    );

    setActiveChatId(
      fresh.id
    );
  }, [
    datasetId,
    dataset,
    activeChatId,
  ]);


  /* =======================================================
     ACTIVE CHAT
  ======================================================= */

  const activeChat =
    chats.find(
      (chat) =>
        chat.id ===
          activeChatId &&
        chat.datasetId ===
          datasetId
    ) || null;

  const messages =
    activeChat?.messages || [];


  /* =======================================================
     SCROLL
  ======================================================= */

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);
  }, [
    messages.length,
    loading,
  ]);


  /* =======================================================
     NEW CHAT
  ======================================================= */

  const newChat =
    useCallback(() => {
      if (!datasetId) {
        setError(
          "Upload a dataset before starting an AI analysis."
        );

        return;
      }

      const chat =
        createChat(dataset);

      setChats(
        (previous) => [
          ...previous,
          chat,
        ]
      );

      setActiveChatId(
        chat.id
      );

      setInput("");
      setError("");

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }, [
      dataset,
      datasetId,
    ]);


  /* =======================================================
     UPDATE CHAT
  ======================================================= */

  const updateChat =
    useCallback(
      (chatId, callback) => {
        setChats(
          (previous) =>
            previous.map(
              (chat) =>
                chat.id ===
                chatId
                  ? callback(chat)
                  : chat
            )
        );
      },
      []
    );


  /* =======================================================
     SEND
  ======================================================= */

  const sendMessage =
    useCallback(
      async (
        quickMessage = ""
      ) => {
        const text =
          (
            quickMessage ||
            input
          ).trim();

        if (!text) {
          return;
        }

        if (!dataset) {
          setError(
            "No dataset is currently loaded."
          );

          return;
        }

        if (!datasetId) {
          setError(
            "The current dataset has no dataset ID. Please upload the dataset again."
          );

          return;
        }

        if (loading) {
          return;
        }

        let chat =
          chats.find(
            (item) =>
              item.id ===
                activeChatId &&
              item.datasetId ===
                datasetId
          );

        if (!chat) {
          chat =
            createChat(dataset);

          setChats(
            (previous) => [
              ...previous,
              chat,
            ]
          );

          setActiveChatId(
            chat.id
          );
        }

        const history =
          chat.messages.map(
            (item) => ({
              role:
                item.role,
              content:
                item.content,
            })
          );

        const userMessage = {
          id: createId("msg"),
          role: "user",
          content: text,
          createdAt:
            Date.now(),
        };

        updateChat(
          chat.id,
          (current) => ({
            ...current,

            title:
              current.messages.length ===
              0
                ? text.length > 45
                  ? text.slice(
                      0,
                      45
                    ) + "..."
                  : text
                : current.title,

            updatedAt:
              Date.now(),

            messages: [
              ...current.messages,
              userMessage,
            ],
          })
        );

        setInput("");
        setError("");
        setLoading(true);

        const controller =
          new AbortController();

        abortController.current =
          controller;

        try {
          const result =
            await sendToAI({
              message: text,
              dataset,
              model,
              history,
              signal:
                controller.signal,
            });

          const assistantMessage = {
            id: createId(
              "msg"
            ),
            role: "assistant",
            content:
              result.answer,
            createdAt:
              Date.now(),
          };

          updateChat(
            chat.id,
            (current) => ({
              ...current,

              updatedAt:
                Date.now(),

              messages: [
                ...current.messages,
                assistantMessage,
              ],
            })
          );
        } catch (err) {
          if (
            err?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "DataPilot AI error:",
            err
          );

          const errorMessage =
            err?.message ||
            "Unable to connect to DataPilot AI.";

          setError(
            errorMessage
          );

          updateChat(
            chat.id,
            (current) => ({
              ...current,

              updatedAt:
                Date.now(),

              messages: [
                ...current.messages,
                {
                  id: createId(
                    "msg"
                  ),
                  role: "assistant",
                  content:
                    `### AI connection error\n\n${errorMessage}\n\nPlease make sure the DataPilot FastAPI backend is running on port 8000.`,
                  createdAt:
                    Date.now(),
                  error: true,
                },
              ],
            })
          );
        } finally {
          setLoading(false);

          abortController.current =
            null;
        }
      },
      [
        input,
        dataset,
        datasetId,
        model,
        chats,
        activeChatId,
        loading,
        updateChat,
      ]
    );


  /* =======================================================
     STOP
  ======================================================= */

  const stop =
    useCallback(() => {
      if (
        abortController.current
      ) {
        abortController.current.abort();
      }

      setLoading(false);
    }, []);


  /* =======================================================
     DELETE CHAT
  ======================================================= */

  const deleteChat =
    useCallback(
      (chatId) => {
        const remaining =
          chats.filter(
            (chat) =>
              chat.id !==
              chatId
          );

        if (
          chatId ===
          activeChatId
        ) {
          const next =
            remaining
              .filter(
                (chat) =>
                  chat.datasetId ===
                  datasetId
              )
              .sort(
                (a, b) =>
                  b.updatedAt -
                  a.updatedAt
              )[0];

          if (next) {
            setActiveChatId(
              next.id
            );
          } else if (
            datasetId
          ) {
            const fresh =
              createChat(dataset);

            setChats([
              ...remaining,
              fresh,
            ]);

            setActiveChatId(
              fresh.id
            );

            return;
          } else {
            setActiveChatId("");
          }
        }

        setChats(
          remaining
        );
      },
      [
        chats,
        activeChatId,
        datasetId,
        dataset,
      ]
    );


  /* =======================================================
     COPY
  ======================================================= */

  const copy =
    useCallback(
      async (
        messageId,
        content
      ) => {
        try {
          await navigator.clipboard.writeText(
            content
          );

          setCopied(
            messageId
          );

          setTimeout(() => {
            setCopied("");
          }, 1500);
        } catch {
          setError(
            "Unable to copy the response."
          );
        }
      },
      []
    );


  /* =======================================================
     SEARCH
  ======================================================= */

  const visibleChats =
    currentChats.filter(
      (chat) => {
        if (!search.trim()) {
          return true;
        }

        const q =
          search
            .toLowerCase()
            .trim();

        const title =
          String(
            chat.title || ""
          ).toLowerCase();

        const content =
          chat.messages
            .map(
              (item) =>
                item.content || ""
            )
            .join(" ")
            .toLowerCase();

        return (
          title.includes(q) ||
          content.includes(q)
        );
      }
    );


  /* =======================================================
     NO DATASET
  ======================================================= */

  if (!dataset) {
    return (
      <div className="min-h-[calc(100vh-70px)] bg-[#090909] px-6 py-12 text-[#f5f2ec]">

        <div className="mx-auto flex max-w-4xl items-center justify-center">

          <div className="w-full rounded-3xl border border-white/[0.08] bg-[#11110f] p-10 text-center">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff795b]/10">

              <Bot
                size={30}
                className="text-[#ff795b]"
              />

            </div>

            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff795b]">
              DataPilot Intelligence
            </div>

            <h1 className="mt-3 text-3xl font-semibold">
              AI Data Scientist
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#85817a]">
              Upload a dataset to activate
              the AI Data Scientist. Once a
              dataset is loaded, DataPilot AI
              can answer questions about both
              your DataPilot project and the
              current dataset.
            </p>

          </div>

        </div>

      </div>
    );
  }


  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="flex h-[calc(100vh-70px)] min-h-[650px] overflow-hidden bg-[#090909] text-[#f5f2ec]">


      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={`
          flex-shrink-0
          border-r
          border-white/[0.07]
          bg-[#0d0d0c]
          transition-all
          duration-200
          ${
            sidebar
              ? "w-[280px]"
              : "w-0 overflow-hidden"
          }
        `}
      >

        <div className="flex h-full w-[280px] flex-col">


          {/* SIDEBAR HEADER */}

          <div className="border-b border-white/[0.07] p-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff795b]/10">

                  <Bot
                    size={18}
                    className="text-[#ff795b]"
                  />

                </div>

                <div>

                  <div className="text-sm font-semibold">
                    DataPilot AI
                  </div>

                  <div className="text-[9px] text-[#66625c]">
                    Autonomous Data Scientist
                  </div>

                </div>

              </div>

              <button
                onClick={newChat}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#88837c] hover:text-white"
              >
                <Plus size={15} />
              </button>

            </div>


            {/* CURRENT DATASET */}

            <div className="mt-4 rounded-xl border border-[#ff795b]/15 bg-[#ff795b]/[0.04] p-3">

              <div className="flex items-center gap-2">

                <Database
                  size={13}
                  className="text-[#ff795b]"
                />

                <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#ff795b]">
                  Current dataset
                </span>

              </div>

              <div className="mt-2 truncate text-xs font-medium">
                {datasetName}
              </div>

              <div className="mt-1 text-[9px] text-[#625e58]">
                {number(rows)} rows ·{" "}
                {number(cols)} columns
              </div>

            </div>


            {/* SEARCH */}

            <div className="relative mt-3">

              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57534d]"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search analyses..."
                className="h-9 w-full rounded-lg border border-white/[0.07] bg-[#151513] pl-9 pr-3 text-xs text-white outline-none placeholder:text-[#57534d] focus:border-[#ff795b]/30"
              />

            </div>

          </div>


          {/* CHAT LIST */}

          <div className="flex-1 overflow-y-auto p-3">

            <div className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#57534d]">
              Current dataset
            </div>

            {visibleChats.length ===
            0 ? (

              <div className="rounded-xl border border-dashed border-white/[0.07] p-5 text-center">

                <MessageCircle
                  size={19}
                  className="mx-auto mb-2 text-[#4e4a45]"
                />

                <div className="text-[10px] text-[#69655f]">
                  No conversations yet.
                </div>

              </div>

            ) : (
              <div className="space-y-1">

                {visibleChats.map(
                  (chat) => {

                    const active =
                      chat.id ===
                      activeChatId;

                    return (
                      <div
                        key={
                          chat.id
                        }
                        className={`
                          group flex items-center gap-2 rounded-xl border px-3 py-2.5
                          ${
                            active
                              ? "border-[#ff795b]/20 bg-[#ff795b]/[0.07]"
                              : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]"
                          }
                        `}
                      >

                        <button
                          onClick={() =>
                            setActiveChatId(
                              chat.id
                            )
                          }
                          className="min-w-0 flex-1 text-left"
                        >

                          <div className="truncate text-xs font-medium text-[#c7c2ba]">
                            {chat.title}
                          </div>

                          <div className="mt-1 text-[9px] text-[#57534d]">
                            {
                              chat
                                .messages
                                .length
                            }{" "}
                            messages
                          </div>

                        </button>

                        <button
                          onClick={() =>
                            deleteChat(
                              chat.id
                            )
                          }
                          className="hidden h-7 w-7 items-center justify-center rounded-md text-[#55514b] hover:bg-red-500/10 hover:text-red-400 group-hover:flex"
                        >
                          <Trash2
                            size={13}
                          />
                        </button>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>


          {/* SIDEBAR FOOTER */}

          <div className="border-t border-white/[0.07] p-3">

            <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2">

              <div className="h-1.5 w-1.5 rounded-full bg-[#63d6a2]" />

              <span className="text-[9px] text-[#67635d]">
                Current dataset context active
              </span>

            </div>

          </div>

        </div>

      </aside>


      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="flex min-w-0 flex-1 flex-col">


        {/* HEADER */}

        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0b0b0a] px-4">

          <div className="flex min-w-0 items-center gap-3">

            <button
              onClick={() =>
                setSidebar(
                  (value) => !value
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] text-[#858079] hover:text-white"
            >
              <PanelLeft size={16} />
            </button>

            <div className="h-6 w-px bg-white/[0.08]" />

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <span className="text-sm font-semibold">
                  AI Data Scientist
                </span>

                <span className="rounded-full border border-[#63d6a2]/20 bg-[#63d6a2]/10 px-2 py-0.5 text-[8px] font-semibold text-[#63d6a2]">
                  ACTIVE
                </span>

              </div>

              <div className="truncate text-[9px] text-[#605c56]">
                {datasetName}
              </div>

            </div>

          </div>


          <button
            onClick={newChat}
            className="flex items-center gap-2 rounded-lg bg-[#ff795b] px-3 py-2 text-[10px] font-semibold text-[#170b08] hover:bg-[#ff876c]"
          >
            <Plus size={13} />
            New analysis
          </button>

        </header>


        {/* CONTENT */}

        <div className="flex min-h-0 flex-1">


          {/* CHAT */}

          <section className="flex min-w-0 flex-1 flex-col">


            {/* ===========================================
                EMPTY CHAT
            =========================================== */}

            {messages.length === 0 ? (

              <div className="flex-1 overflow-y-auto">

                <div className="mx-auto max-w-5xl px-5 py-10">

                  <div className="mb-9">

                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff795b]/10">

                      <Sparkles
                        size={23}
                        className="text-[#ff795b]"
                      />

                    </div>

                    <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#ff795b]">
                      DataPilot Intelligence
                    </div>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                      What do you want to analyze?
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#85817a]">
                      Your AI Data Scientist understands
                      the DataPilot project and the
                      currently loaded dataset separately.
                    </p>

                  </div>


                  {/* METRICS */}

                  <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">

                    <Metric
                      icon={Database}
                      label="Rows"
                      value={number(
                        rows
                      )}
                    />

                    <Metric
                      icon={BarChart3}
                      label="Columns"
                      value={number(
                        cols
                      )}
                    />

                    <Metric
                      icon={CheckCircle2}
                      label="Quality"
                      value={
                        quality === null
                          ? "—"
                          : percentage(
                              quality
                            )
                      }
                    />

                    <Metric
                      icon={History}
                      label="Duplicates"
                      value={number(
                        duplicates
                      )}
                    />

                  </div>


                  {/* QUICK QUESTIONS */}

                  <div className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#57534d]">
                    Ask DataPilot
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                    {QUICK_QUESTIONS.map(
                      (item) => {

                        const Icon =
                          item.icon;

                        return (
                          <button
                            key={
                              item.title
                            }
                            disabled={
                              loading
                            }
                            onClick={() =>
                              sendMessage(
                                item.prompt
                              )
                            }
                            className="group rounded-2xl border border-white/[0.07] bg-[#11110f] p-4 text-left transition hover:border-[#ff795b]/20 hover:bg-[#151513] disabled:opacity-50"
                          >

                            <div className="mb-4 flex items-center justify-between">

                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-[#8b867e] group-hover:bg-[#ff795b]/10 group-hover:text-[#ff795b]">

                                <Icon
                                  size={17}
                                />

                              </div>

                              <ChevronRight
                                size={14}
                                className="text-[#47433e] group-hover:text-[#ff795b]"
                              />

                            </div>

                            <div className="text-sm font-medium">
                              {
                                item.title
                              }
                            </div>

                            <div className="mt-1 text-[10px] leading-5 text-[#67635d]">
                              {
                                item.description
                              }
                            </div>

                          </button>
                        );
                      }
                    )}

                  </div>


                  {/* CURRENT COLUMNS */}

                  {columns.length >
                    0 && (
                    <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[#11110f] p-5">

                      <div className="flex items-center justify-between">

                        <div>

                          <div className="text-sm font-semibold">
                            Current dataset schema
                          </div>

                          <div className="mt-1 text-[9px] text-[#5d5953]">
                            These columns belong to the
                            active dataset.
                          </div>

                        </div>

                        <Database
                          size={16}
                          className="text-[#5e5a54]"
                        />

                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">

                        {columns
                          .slice(
                            0,
                            24
                          )
                          .map(
                            (
                              column,
                              index
                            ) => {

                              const name =
                                typeof column ===
                                "string"
                                  ? column
                                  : column?.name ||
                                    `Column ${
                                      index +
                                      1
                                    }`;

                              const type =
                                typeof column ===
                                "object"
                                  ? column?.dtype ||
                                    column?.kind ||
                                    ""
                                  : "";

                              return (
                                <div
                                  key={`${name}-${index}`}
                                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                                >

                                  <div className="text-[10px] font-medium text-[#c6c1b9]">
                                    {name}
                                  </div>

                                  {type && (
                                    <div className="mt-0.5 text-[8px] text-[#5d5953]">
                                      {type}
                                    </div>
                                  )}

                                </div>
                              );
                            }
                          )}

                      </div>

                    </div>
                  )}

                </div>

              </div>

            ) : (

              /* ==========================================
                 MESSAGES
              ========================================== */

              <div className="flex-1 overflow-y-auto">

                <div className="mx-auto max-w-4xl px-5 py-8">

                  <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#ff795b]/10 bg-[#ff795b]/[0.035] px-4 py-3">

                    <Database
                      size={14}
                      className="text-[#ff795b]"
                    />

                    <div className="min-w-0">

                      <div className="truncate text-xs font-medium">
                        {datasetName}
                      </div>

                      <div className="text-[9px] text-[#625e58]">
                        {number(rows)} rows ·{" "}
                        {number(cols)} columns ·
                        current dataset
                      </div>

                    </div>

                    <div className="ml-auto flex items-center gap-1.5 text-[8px] text-[#63d6a2]">

                      <span className="h-1.5 w-1.5 rounded-full bg-[#63d6a2]" />

                      Context active

                    </div>

                  </div>


                  <div className="space-y-7">

                    {messages.map(
                      (msg) => {

                        const user =
                          msg.role ===
                          "user";

                        return (
                          <div
                            key={
                              msg.id
                            }
                            className={
                              user
                                ? "flex justify-end"
                                : "flex justify-start"
                            }
                          >

                            <div
                              className={
                                user
                                  ? "max-w-[85%]"
                                  : "w-full"
                              }
                            >

                              <div
                                className={`mb-2 flex items-center gap-2 ${
                                  user
                                    ? "justify-end"
                                    : ""
                                }`}
                              >

                                {!user && (
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff795b]/10">

                                    <Bot
                                      size={14}
                                      className="text-[#ff795b]"
                                    />

                                  </div>
                                )}

                                <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#5d5953]">
                                  {user
                                    ? "You"
                                    : "DataPilot AI"}
                                </span>

                              </div>


                              <div
                                className={
                                  user
                                    ? "rounded-2xl border border-[#ff795b]/15 bg-[#ff795b]/[0.08] px-4 py-3"
                                    : "rounded-2xl border border-white/[0.06] bg-[#11110f] px-5 py-5"
                                }
                              >

                                {user ? (
                                  <div className="whitespace-pre-wrap text-sm leading-7 text-[#eee9e2]">
                                    {
                                      msg.content
                                    }
                                  </div>
                                ) : (
                                  <MessageContent
                                    text={
                                      msg.content
                                    }
                                  />
                                )}

                              </div>


                              {!user && (
                                <div className="mt-2">

                                  <button
                                    onClick={() =>
                                      copy(
                                        msg.id,
                                        msg.content
                                      )
                                    }
                                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] text-[#5d5953] hover:bg-white/[0.04] hover:text-[#aaa69f]"
                                  >

                                    <Copy
                                      size={11}
                                    />

                                    {copied ===
                                    msg.id
                                      ? "Copied"
                                      : "Copy"}

                                  </button>

                                </div>
                              )}

                            </div>

                          </div>
                        );
                      }
                    )}


                    {/* LOADING */}

                    {loading && (
                      <div className="flex gap-3">

                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff795b]/10">

                          <Bot
                            size={14}
                            className="text-[#ff795b]"
                          />

                        </div>

                        <div className="rounded-2xl border border-white/[0.06] bg-[#11110f] px-5 py-4">

                          <div className="flex items-center gap-3">

                            <Loader2
                              size={15}
                              className="animate-spin text-[#ff795b]"
                            />

                            <div>

                              <div className="text-xs text-[#c5c0b8]">
                                DataPilot AI is analyzing...
                              </div>

                              <div className="mt-1 text-[9px] text-[#5d5953]">
                                Using current dataset context
                              </div>

                            </div>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>

                  <div ref={bottomRef} />

                </div>

              </div>
            )}


            {/* ERROR */}

            {error && (
              <div className="px-5 pb-3">

                <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-xl border border-red-500/15 bg-red-500/[0.05] px-4 py-3">

                  <X
                    size={14}
                    className="text-red-400"
                  />

                  <span className="flex-1 text-[10px] text-red-300">
                    {error}
                  </span>

                  <button
                    onClick={() =>
                      setError("")
                    }
                    className="text-[9px] text-red-400"
                  >
                    Close
                  </button>

                </div>

              </div>
            )}


            {/* COMPOSER */}

            <div className="border-t border-white/[0.07] bg-[#0b0b0a] p-4">

              <div className="mx-auto max-w-4xl">

                <div className="rounded-2xl border border-white/[0.09] bg-[#11110f] focus-within:border-[#ff795b]/25">

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) =>
                      setInput(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                          "Enter" &&
                        !e.shiftKey
                      ) {
                        e.preventDefault();

                        sendMessage();
                      }
                    }}
                    disabled={loading}
                    rows={3}
                    placeholder={
                      loading
                        ? "DataPilot AI is analyzing..."
                        : "Ask about your project or current dataset..."
                    }
                    className="w-full resize-none bg-transparent px-4 pt-4 text-sm leading-6 text-white outline-none placeholder:text-[#55514b]"
                  />

                  <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2">

                    <div className="flex items-center gap-2 text-[9px] text-[#56524c]">

                      <Zap
                        size={11}
                        className="text-[#ff795b]"
                      />

                      Project + current dataset
                      context

                    </div>

                    {loading ? (

                      <button
                        onClick={stop}
                        className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-[10px] font-semibold text-red-300"
                      >
                        <X size={12} />
                        Stop
                      </button>

                    ) : (

                      <button
                        onClick={() =>
                          sendMessage()
                        }
                        disabled={
                          !input.trim()
                        }
                        className="flex items-center gap-2 rounded-lg bg-[#ff795b] px-3 py-2 text-[10px] font-semibold text-[#170b08] disabled:opacity-30"
                      >
                        <Send size={12} />
                        Ask DataPilot
                      </button>

                    )}

                  </div>

                </div>

                <div className="mt-2 text-center text-[8px] text-[#45413e]">
                  DataPilot AI · Autonomous Data Scientist
                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              RIGHT PANEL
          ================================================= */}

          <aside className="hidden w-[270px] flex-shrink-0 border-l border-white/[0.07] bg-[#0d0d0c] xl:block">

            <div className="h-full overflow-y-auto p-4">

              <div className="mb-5">

                <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#ff795b]">
                  Intelligence
                </div>

                <div className="mt-1 text-sm font-semibold">
                  Current context
                </div>

              </div>


              {/* DATASET CARD */}

              <div className="rounded-xl border border-white/[0.07] bg-[#11110f] p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff795b]/10">

                    <Database
                      size={15}
                      className="text-[#ff795b]"
                    />

                  </div>

                  <div className="min-w-0">

                    <div className="truncate text-xs font-medium">
                      {datasetName}
                    </div>

                    <div className="mt-1 text-[8px] text-[#5c5852]">
                      Active dataset
                    </div>

                  </div>

                </div>

              </div>


              {/* STATS */}

              <div className="mt-3 grid grid-cols-2 gap-2">

                <SmallStat
                  label="Rows"
                  value={number(
                    rows
                  )}
                />

                <SmallStat
                  label="Columns"
                  value={number(
                    cols
                  )}
                />

                <SmallStat
                  label="Quality"
                  value={
                    quality ===
                    null
                      ? "—"
                      : percentage(
                          quality
                        )
                  }
                />

                <SmallStat
                  label="Duplicates"
                  value={number(
                    duplicates
                  )}
                />

              </div>


              {/* ML */}

              <div className="mt-5">

                <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#57534d]">
                  Model context
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-[#11110f] p-4">

                  {model ? (

                    <div>

                      <div className="flex items-center gap-2">

                        <BrainCircuit
                          size={14}
                          className="text-[#ff795b]"
                        />

                        <span className="text-xs font-medium">
                          Model available
                        </span>

                      </div>

                      <div className="mt-2 text-[9px] leading-5 text-[#625e58]">
                        DataPilot AI can use the
                        available model context
                        when answering model-related
                        questions.
                      </div>

                    </div>

                  ) : (

                    <div>

                      <div className="flex items-center gap-2">

                        <BrainCircuit
                          size={14}
                          className="text-[#5e5a54]"
                        />

                        <span className="text-xs font-medium text-[#aaa59d]">
                          No trained model
                        </span>

                      </div>

                      <div className="mt-2 text-[9px] leading-5 text-[#5d5953]">
                        Train a model in Model Lab
                        for model-specific AI
                        analysis.
                      </div>

                    </div>

                  )}

                </div>

              </div>


              {/* LINKS */}

              <div className="mt-5">

                <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#57534d]">
                  Continue workflow
                </div>

                <div className="space-y-1">

                  {LINKS.map(
                    (link) => {

                      const Icon =
                        link.icon;

                      return (
                        <button
                          key={
                            link.url
                          }
                          onClick={() => {
                            window.location.href =
                              link.url;
                          }}
                          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[10px] text-[#706c65] hover:bg-white/[0.04] hover:text-white"
                        >

                          <Icon
                            size={13}
                            className="text-[#56524c] group-hover:text-[#ff795b]"
                          />

                          <span className="flex-1">
                            {
                              link.name
                            }
                          </span>

                          <ChevronRight
                            size={11}
                            className="text-[#403d39]"
                          />

                        </button>
                      );
                    }
                  )}

                </div>

              </div>


              {/* STATUS */}

              <div className="mt-6 rounded-xl border border-[#63d6a2]/10 bg-[#63d6a2]/[0.035] p-4">

                <div className="flex items-center gap-2">

                  <span className="h-1.5 w-1.5 rounded-full bg-[#63d6a2]" />

                  <span className="text-[10px] font-medium text-[#a9dbc5]">
                    AI context active
                  </span>

                </div>

                <div className="mt-2 text-[9px] leading-5 text-[#5d7168]">
                  Project knowledge and the current
                  dataset are handled as separate
                  contexts.
                </div>

              </div>

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Metric({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#11110f] p-4">

      <div className="mb-3 flex items-center justify-between">

        <span className="text-[8px] font-semibold uppercase tracking-[0.15em] text-[#5f5b55]">
          {label}
        </span>

        <Icon
          size={14}
          className="text-[#69645e]"
        />

      </div>

      <div className="text-xl font-semibold">
        {value}
      </div>

    </div>
  );
}


function SmallStat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#11110f] p-3">

      <div className="text-[8px] uppercase tracking-[0.12em] text-[#5c5852]">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-[#d3cec6]">
        {value}
      </div>

    </div>
  );
}
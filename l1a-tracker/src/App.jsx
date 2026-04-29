import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "l1a-tracker-state-v1";
const SECTION_ICON_BY_ID = {
  "docs-ru-ooo": "office",
  "docs-us-llc": "hq",
  "docs-affiliation": "link",
  "docs-petition": "petition",
  "docs-personal": "profile",
  "docs-consulate": "consulate",
};

const createInitialState = () => ({
  activeTab: "stages",
  stages: [
    {
      id: "stage-1",
      title: "Выбор ООО",
      details: "ООО АСО 55 000 ₽",
      timeline: "done",
      done: true,
    },
    {
      id: "stage-2",
      title: "Договор mmdocument",
      details: "$5 250",
      timeline: "done",
      done: true,
    },
    {
      id: "stage-3",
      title: "Покупка ООО",
      details: "Ждём одобрения mmdocument",
      timeline: "current",
      done: false,
    },
    {
      id: "stage-4",
      title: "Запуск деятельности",
      details: "ГПХ бухгалтер счёт",
      timeline: "Май 2026",
      done: false,
    },
    {
      id: "stage-5",
      title: "Доказательная база",
      details: "Акты выплаты переписка",
      timeline: "Май–Сен 2026",
      done: false,
    },
    {
      id: "stage-6",
      title: "Подача I-129",
      details: "$4 460 с премиумом",
      timeline: "Окт 2026",
      done: false,
    },
    {
      id: "stage-7",
      title: "Одобрение I-797",
      details: "15 рабочих дней",
      timeline: "Ноя 2026",
      done: false,
    },
    {
      id: "stage-8",
      title: "Интервью в Ереване",
      details: "DS-160 $435",
      timeline: "Дек 2026",
      done: false,
    },
    {
      id: "stage-9",
      title: "SAO проверка",
      details: "2–6 месяцев",
      timeline: "Янв–Июн 2027",
      done: false,
    },
    {
      id: "stage-10",
      title: "Въезд в США",
      details: "L-1A + L-2S для жены",
      timeline: "Лето 2027",
      done: false,
    },
  ],
  documentSections: [
    {
      id: "docs-ru-ooo",
      title: "Российское ООО",
      items: [
        { id: "ru-1", title: "Свидетельство о регистрации ОГРН", done: false },
        { id: "ru-2", title: "ИНН компании", done: false },
        { id: "ru-3", title: "Устав ООО", done: false },
        { id: "ru-4", title: "Выписка ЕГРЮЛ не старше 30 дней", done: false },
        { id: "ru-5", title: "Решение о назначении директора", done: false },
        { id: "ru-6", title: "Приказ о назначении директора", done: false },
        { id: "ru-7", title: "Должностная инструкция", done: false },
        { id: "ru-8", title: "Трудовой договор", done: false },
        { id: "ru-9", title: "Штатное расписание", done: false },
        { id: "ru-10", title: "Оргструктура ООО", done: false },
        { id: "ru-11", title: "8 договоров ГПХ с подрядчиками", done: false },
        { id: "ru-12", title: "Акты выполненных работ каждый месяц", done: false },
        { id: "ru-13", title: "Банковские выписки ООО 6–12 мес", done: false },
        { id: "ru-14", title: "Налоговые декларации УСН", done: false },
        { id: "ru-15", title: "6-НДФЛ за Q2 и Q3", done: false },
        { id: "ru-16", title: "РСВ за Q2 и Q3", done: false },
        {
          id: "ru-17",
          title: "Переписка с подрядчиками выборка",
          done: false,
        },
        { id: "ru-18", title: "Договор аренды офиса", done: false },
        { id: "ru-19", title: "Фото российского офиса", done: false },
      ],
    },
    {
      id: "docs-us-llc",
      title: "Career Plus LLC США",
      items: [
        {
          id: "us-1",
          title: "Articles of Organization с штампом",
          done: false,
        },
        { id: "us-2", title: "Operating Agreement", done: false },
        { id: "us-3", title: "EIN письмо от IRS CP-575", done: false },
        { id: "us-4", title: "Form 8832 + подтверждение IRS", done: false },
        {
          id: "us-5",
          title: "Certificate of Good Standing 30 дней",
          done: false,
        },
        { id: "us-6", title: "Банковские выписки Career Plus", done: false },
        {
          id: "us-7",
          title: "SWIFT wire переводы капитала в Career Plus",
          done: false,
        },
        { id: "us-8", title: "Договор аренды американского офиса", done: false },
        { id: "us-9", title: "Фото американского офиса", done: false },
        {
          id: "us-10",
          title: "Контракты с клиентами + инвойсы",
          done: false,
        },
        { id: "us-11", title: "Form 941 квартальные отчёты", done: false },
        { id: "us-12", title: "Страховой полис liability", done: false },
        {
          id: "us-13",
          title: "Сайт + визитки распечатки с датой",
          done: false,
        },
      ],
    },
    {
      id: "docs-affiliation",
      title: "Аффилиация двух компаний",
      items: [
        { id: "aff-1", title: "Письмо о корпоративной структуре", done: false },
        {
          id: "aff-2",
          title: "Membership certificates обеих компаний",
          done: false,
        },
        { id: "aff-3", title: "Капитализационные таблицы", done: false },
        { id: "aff-4", title: "Оргчарты обеих компаний", done: false },
        {
          id: "aff-5",
          title: "Декларация о владении sworn affidavit",
          done: false,
        },
        {
          id: "aff-6",
          title: "SWIFT wire записи о переводе капитала",
          done: false,
        },
        { id: "aff-7", title: "Intercompany services agreement", done: false },
      ],
    },
    {
      id: "docs-petition",
      title: "Петиция I-129",
      items: [
        { id: "pet-1", title: "Form I-129 редакция 02/27/26", done: false },
        { id: "pet-2", title: "L Classification Supplement", done: false },
        {
          id: "pet-3",
          title: "Form I-129 Part 6 экспортный контроль",
          done: false,
        },
        { id: "pet-4", title: "Form G-1145 уведомление о получении", done: false },
        { id: "pet-5", title: "Form I-907 премиум-процессинг", done: false },
        { id: "pet-6", title: "Cover letter 20–30 стр", done: false },
        {
          id: "pet-7",
          title: "Доказательство временности 8 CFR 214.2(l)(3)(vii)",
          done: false,
        },
        {
          id: "pet-8",
          title: "Оргструктуры обеих компаний для петиции",
          done: false,
        },
      ],
    },
    {
      id: "docs-personal",
      title: "Личные документы",
      items: [
        {
          id: "pers-1",
          title: "Армянский паспорт копии всех страниц",
          done: false,
        },
        {
          id: "pers-2",
          title: "Российский паспорт копии всех страниц",
          done: false,
        },
        {
          id: "pers-3",
          title: "Все предыдущие паспорта с US визами",
          done: false,
        },
        { id: "pers-4", title: "Распечатка I-94 travel history", done: false },
        { id: "pers-5", title: "CV на английском", done: false },
        {
          id: "pers-6",
          title: "Дипломы с сертифицированными переводами",
          done: false,
        },
      ],
    },
    {
      id: "docs-consulate",
      title: "Консульство Ереван после I-797",
      items: [
        { id: "cons-1", title: "I-797 оригинал", done: false },
        {
          id: "cons-2",
          title: "DS-160 на тебя распечатка с баркодом",
          done: false,
        },
        { id: "cons-3", title: "DS-160 на жену", done: false },
        { id: "cons-4", title: "Квитанция MRV fee $185 на тебя", done: false },
        { id: "cons-5", title: "Квитанция MRV fee $185 на жену", done: false },
        {
          id: "cons-6",
          title: "Квитанция Visa Integrity Fee $250 на тебя",
          done: false,
        },
        {
          id: "cons-7",
          title: "Квитанция Visa Integrity Fee $250 на жену",
          done: false,
        },
        { id: "cons-8", title: "Фото визовые обоих", done: false },
        {
          id: "cons-9",
          title: "Свидетельство о браке + перевод + апостиль",
          done: false,
        },
        {
          id: "cons-10",
          title: "Письмо о закрытии асайлума USCIS",
          done: false,
        },
        { id: "cons-11", title: "FOIA ответ Form G-639", done: false },
        { id: "cons-12", title: "Медицинские документы мамы", done: false },
        {
          id: "cons-13",
          title: "Письмо от Career Plus для консульства 30 дней",
          done: false,
        },
        { id: "cons-14", title: "Весь пакет I-129 дубликат", done: false },
      ],
    },
  ],
  budgetItems: [
    {
      id: "budget-1",
      title: "Покупка ООО",
      planned: "55 000 ₽",
      spent: "",
    },
    {
      id: "budget-2",
      title: "Нотариус",
      planned: "~15 000 ₽",
      spent: "",
    },
    {
      id: "budget-3",
      title: "Бухгалтер 18 мес",
      planned: "72 000 ₽",
      spent: "",
    },
    {
      id: "budget-4",
      title: "Обслуживание счёта 18 мес",
      planned: "18 000 ₽",
      spent: "",
    },
    {
      id: "budget-5",
      title: "Переводы документов",
      planned: "30 000 ₽",
      spent: "",
    },
    {
      id: "budget-6",
      title: "Апостили",
      planned: "15 000 ₽",
      spent: "",
    },
    {
      id: "budget-7",
      title: "mmdocument",
      planned: "$5 250",
      spent: "",
    },
    {
      id: "budget-8",
      title: "I-129 базовая пошлина",
      planned: "$695",
      spent: "",
    },
    {
      id: "budget-9",
      title: "Fraud Prevention Fee",
      planned: "$500",
      spent: "",
    },
    {
      id: "budget-10",
      title: "Asylum Program Fee",
      planned: "$300",
      spent: "",
    },
    {
      id: "budget-11",
      title: "Премиум-процессинг I-907",
      planned: "$2 965",
      spent: "",
    },
    {
      id: "budget-12",
      title: "MRV fee ×2",
      planned: "$370",
      spent: "",
    },
    {
      id: "budget-13",
      title: "Visa Integrity Fee ×2",
      planned: "$500",
      spent: "",
    },
  ],
});

const calcPercent = (done, total) => {
  if (total === 0) {
    return 0;
  }

  return Math.round((done / total) * 100);
};

const generateId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const EditableText = ({ value, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const save = () => {
    const nextValue = draft.trim();
    onSave(nextValue.length > 0 ? nextValue : value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        type="text"
        className={`editable-input ${className}`}
        value={draft}
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            save();
          }

          if (event.key === "Escape") {
            setDraft(value);
            setIsEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className={`editable-button ${className}`}
      onClick={() => setIsEditing(true)}
      title="Нажмите, чтобы отредактировать"
    >
      {value}
    </button>
  );
};

const SectionIcon = ({ type }) => {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (type === "office") {
    return (
      <svg {...commonProps}>
        <path d="M4 20h16" />
        <path d="M6 20V8l6-4 6 4v12" />
        <path d="M10 20v-4h4v4" />
        <path d="M9 10h.01M15 10h.01M9 13h.01M15 13h.01" />
      </svg>
    );
  }

  if (type === "hq") {
    return (
      <svg {...commonProps}>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }

  if (type === "link") {
    return (
      <svg {...commonProps}>
        <path d="M10 13a3 3 0 0 1 0-4l2-2a3 3 0 1 1 4 4l-1 1" />
        <path d="M14 11a3 3 0 0 1 0 4l-2 2a3 3 0 1 1-4-4l1-1" />
      </svg>
    );
  }

  if (type === "profile") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="8" r="3.3" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    );
  }

  if (type === "consulate") {
    return (
      <svg {...commonProps}>
        <path d="M3 10h18" />
        <path d="M5 10v8M9 10v8M15 10v8M19 10v8" />
        <path d="M4 20h16" />
        <path d="M12 4 3 8h18z" />
      </svg>
    );
  }

  if (type === "petition") {
    return (
      <svg {...commonProps}>
        <path d="M7 4h7l4 4v12H7z" />
        <path d="M14 4v4h4" />
        <path d="M10 13h6M10 17h6M10 9h2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    </svg>
  );
};

function App() {
  const [appState, setAppState] = useState(() => {
    const storedState = localStorage.getItem(STORAGE_KEY);

    if (!storedState) {
      return createInitialState();
    }

    try {
      return JSON.parse(storedState);
    } catch (error) {
      return createInitialState();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  const stageDoneCount = appState.stages.filter((stage) => stage.done).length;
  const stagePercent = calcPercent(stageDoneCount, appState.stages.length);

  const currentStageId = appState.stages.find((stage) => !stage.done)?.id || null;

  const allDocuments = useMemo(
    () => appState.documentSections.flatMap((section) => section.items),
    [appState.documentSections],
  );
  const documentsDoneCount = allDocuments.filter((item) => item.done).length;
  const documentsPercent = calcPercent(documentsDoneCount, allDocuments.length);

  const budgetFilledCount = appState.budgetItems.filter(
    (item) => item.spent !== "" && Number(item.spent) > 0,
  ).length;
  const budgetPercent = calcPercent(budgetFilledCount, appState.budgetItems.length);

  const updateState = (updater) => {
    setAppState((prev) => updater(prev));
  };

  const addStage = () => {
    updateState((prev) => ({
      ...prev,
      stages: [
        ...prev.stages,
        {
          id: generateId("stage"),
          title: "Новый этап",
          details: "Описание этапа",
          timeline: "Срок",
          done: false,
        },
      ],
    }));
  };

  const removeStage = (stageId) => {
    updateState((prev) => ({
      ...prev,
      stages: prev.stages.filter((stage) => stage.id !== stageId),
    }));
  };

  const addDocument = (sectionId) => {
    updateState((prev) => ({
      ...prev,
      documentSections: prev.documentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  id: generateId("doc"),
                  title: "Новый документ",
                  done: false,
                },
              ],
            }
          : section,
      ),
    }));
  };

  const removeDocument = (sectionId, documentId) => {
    updateState((prev) => ({
      ...prev,
      documentSections: prev.documentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.filter((item) => item.id !== documentId),
            }
          : section,
      ),
    }));
  };

  const addSection = () => {
    updateState((prev) => ({
      ...prev,
      documentSections: [
        ...prev.documentSections,
        {
          id: generateId("section"),
          title: "Новая секция",
          items: [],
        },
      ],
    }));
  };

  const removeSection = (sectionId) => {
    updateState((prev) => ({
      ...prev,
      documentSections: prev.documentSections.filter((section) => section.id !== sectionId),
    }));
  };

  const tabs = [
    { id: "stages", label: "Этапы" },
    { id: "documents", label: "Документы" },
    { id: "budget", label: "Бюджет" },
  ];

  return (
    <main className="app-shell">
      <header className="app-header card">
        <p className="eyebrow">L-1A visa tracker</p>
        <h1>L-1A трекер</h1>
        <p className="subtitle">
          Чек-лист этапов, документов и бюджета для контроля L-1A процесса.
        </p>
      </header>

      <nav className="tabs" aria-label="Навигация по трекеру">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${appState.activeTab === tab.id ? "active" : ""}`}
            onClick={() =>
              updateState((prev) => ({
                ...prev,
                activeTab: tab.id,
              }))
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {appState.activeTab === "stages" && (
        <section className="card content-card">
          <div className="section-head">
            <div className="section-head-main">
              <h2>Этапы процесса</h2>
              <p>
                Завершено: {stageDoneCount}/{appState.stages.length}
              </p>
            </div>
            <button type="button" className="secondary-action" onClick={addStage}>
              + Этап
            </button>
          </div>
          <div className="progress-wrap">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${stagePercent}%` }} />
            </div>
            <span>{stagePercent}%</span>
          </div>
          <div className="list-grid">
            {appState.stages.map((stage, index) => (
              (() => {
                const stageState = stage.done
                  ? "done"
                  : stage.id === currentStageId
                    ? "current"
                    : "pending";

                return (
              <article
                key={stage.id}
                className={`stage-card ${stageState}`}
              >
                <div className="row">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={stage.done}
                      onChange={() =>
                        updateState((prev) => ({
                          ...prev,
                          stages: prev.stages.map((item) =>
                            item.id === stage.id
                              ? {
                                  ...item,
                                  done: !item.done,
                                }
                              : item,
                          ),
                        }))
                      }
                    />
                    <span>Этап {index + 1}</span>
                  </label>
                  <div className="row-actions">
                    {stage.done && <span className="badge done">Готово</span>}
                    {!stage.done && stage.id === currentStageId && (
                      <span className="badge current">Текущий</span>
                    )}
                    <button
                      type="button"
                      className="danger-icon-button"
                      onClick={() => removeStage(stage.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                <EditableText
                  value={stage.title}
                  className="stage-title"
                  onSave={(nextValue) =>
                    updateState((prev) => ({
                      ...prev,
                      stages: prev.stages.map((item) =>
                        item.id === stage.id ? { ...item, title: nextValue } : item,
                      ),
                    }))
                  }
                />

                <EditableText
                  value={stage.details}
                  className="stage-details"
                  onSave={(nextValue) =>
                    updateState((prev) => ({
                      ...prev,
                      stages: prev.stages.map((item) =>
                        item.id === stage.id ? { ...item, details: nextValue } : item,
                      ),
                    }))
                  }
                />

                <EditableText
                  value={stage.timeline}
                  className="stage-timeline"
                  onSave={(nextValue) =>
                    updateState((prev) => ({
                      ...prev,
                      stages: prev.stages.map((item) =>
                        item.id === stage.id ? { ...item, timeline: nextValue } : item,
                      ),
                    }))
                  }
                />
              </article>
                );
              })()
            ))}
          </div>
        </section>
      )}

      {appState.activeTab === "documents" && (
        <section className="card content-card">
          <div className="section-head">
            <div className="section-head-main">
              <h2>Документы</h2>
              <p>
                Готово: {documentsDoneCount}/{allDocuments.length}
              </p>
            </div>
            <button type="button" className="secondary-action" onClick={addSection}>
              + Секция
            </button>
          </div>
          <div className="progress-wrap">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${documentsPercent}%` }} />
            </div>
            <span>{documentsPercent}%</span>
          </div>

          <div className="documents-list">
            {appState.documentSections.map((section) => {
              const sectionDone = section.items.filter((item) => item.done).length;
              const sectionPercent = calcPercent(sectionDone, section.items.length);

              return (
                <article className="doc-section" key={section.id}>
                  <div className="section-head">
                    <div className="section-head-main">
                      <div className="section-title-wrap">
                        <span className="section-icon">
                          <SectionIcon
                            type={SECTION_ICON_BY_ID[section.id] || section.icon || "petition"}
                          />
                        </span>
                        <EditableText
                          value={section.title}
                          className="section-title"
                          onSave={(nextValue) =>
                            updateState((prev) => ({
                              ...prev,
                              documentSections: prev.documentSections.map((entry) =>
                                entry.id === section.id
                                  ? { ...entry, title: nextValue }
                                  : entry,
                              ),
                            }))
                          }
                        />
                      </div>
                      <p>
                        {sectionDone}/{section.items.length}
                      </p>
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="secondary-action small"
                        onClick={() => addDocument(section.id)}
                      >
                        + Документ
                      </button>
                      <button
                        type="button"
                        className="danger-icon-button"
                        onClick={() => removeSection(section.id)}
                      >
                        Удалить секцию
                      </button>
                    </div>
                  </div>

                  <div className="progress-wrap compact">
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${sectionPercent}%` }} />
                    </div>
                    <span>{sectionPercent}%</span>
                  </div>

                  <ul className="item-list">
                    {section.items.map((item) => (
                      <li key={item.id} className="doc-item-row">
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() =>
                              updateState((prev) => ({
                                ...prev,
                                documentSections: prev.documentSections.map((entry) =>
                                  entry.id === section.id
                                    ? {
                                        ...entry,
                                        items: entry.items.map((doc) =>
                                          doc.id === item.id
                                            ? { ...doc, done: !doc.done }
                                            : doc,
                                        ),
                                      }
                                    : entry,
                                ),
                              }))
                            }
                          />
                          <EditableText
                            value={item.title}
                            className="doc-title"
                            onSave={(nextValue) =>
                              updateState((prev) => ({
                                ...prev,
                                documentSections: prev.documentSections.map((entry) =>
                                  entry.id === section.id
                                    ? {
                                        ...entry,
                                        items: entry.items.map((doc) =>
                                          doc.id === item.id
                                            ? { ...doc, title: nextValue }
                                            : doc,
                                        ),
                                      }
                                    : entry,
                                ),
                              }))
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="danger-icon-button"
                          onClick={() => removeDocument(section.id, item.id)}
                        >
                          Удалить
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {appState.activeTab === "budget" && (
        <section className="card content-card">
          <div className="section-head">
            <h2>Бюджет</h2>
            <p>
              Заполнено расходов: {budgetFilledCount}/{appState.budgetItems.length}
            </p>
          </div>
          <div className="progress-wrap">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${budgetPercent}%` }} />
            </div>
            <span>{budgetPercent}%</span>
          </div>

          <div className="budget-list">
            {appState.budgetItems.map((item) => (
              <article className="budget-item" key={item.id}>
                <EditableText
                  value={item.title}
                  className="budget-title"
                  onSave={(nextValue) =>
                    updateState((prev) => ({
                      ...prev,
                      budgetItems: prev.budgetItems.map((entry) =>
                        entry.id === item.id ? { ...entry, title: nextValue } : entry,
                      ),
                    }))
                  }
                />
                <label className="spent-field">
                  Потрачено
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.spent}
                    placeholder="0"
                    onChange={(event) =>
                      updateState((prev) => ({
                        ...prev,
                        budgetItems: prev.budgetItems.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, spent: event.target.value }
                            : entry,
                        ),
                      }))
                    }
                  />
                </label>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;

import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const ACCENT = '#00E5A0'
const MONTHLY_CLIENT_GOAL = 4
const MONTHLY_REVENUE_GOAL = 15000
const POMODORO_MINUTES = 25
const LEAD_STATUSES = ['Новый', 'Созвон', 'Думает', 'Договор', 'Оплатил', 'Отказ']
const GOAL_TAGS = ['L1', 'деньги', 'клиент', 'личное']
const LEAD_SOURCES = ['Telegram', 'Instagram', 'сарафан', 'другое']
const DEFAULT_L1_ITEMS = [
  'Изучить требования',
  'Выбрать агентство',
  'Купить компанию в РФ',
  'Начать работу с агентством',
  'Подготовить документы',
  'Подать (октябрь 2026)',
]

const TAG_COLORS = {
  L1: '#193429',
  деньги: '#173328',
  клиент: '#173228',
  контент: '#1a352a',
  цель: '#18342a',
  личное: '#1f2f2a',
}

const localKey = {
  leads: 'lifeos:leads',
  payments: 'lifeos:payments',
  l1Items: 'lifeos:l1-items',
  customGoals: 'lifeos:custom-goals',
  goalProjectsLegacy: 'lifeos:goal-projects',
  dailyPlan: 'lifeos:daily-plan',
  timer: 'lifeos:timer',
  l1Activity: 'lifeos:l1-activity',
  l1AlertAnswer: 'lifeos:l1-alert-answer',
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const dayKey = (date = new Date()) => date.toISOString().slice(0, 10)
const toMoney = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Math.max(0, value),
  )

const daysBetween = (from, to = new Date()) => {
  const fromDate = new Date(from)
  const endDate = new Date(to)
  fromDate.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((endDate - fromDate) / 86400000))
}

const parseJSON = (raw, fallback) => {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const save = (key, value) => window.localStorage.setItem(key, JSON.stringify(value))
const load = (key, fallback) => parseJSON(window.localStorage.getItem(key), fallback)

const fallbackTasks = (snapshot) => {
  const tasks = []
  const staleLead = snapshot.leads.find((lead) => lead.status === 'Думает' && daysBetween(lead.statusSince) > 5)
  if (staleLead) {
    tasks.push({
      id: uid(),
      tag: 'клиент',
      action: `Написать ${staleLead.name}: уточнить, что поможет принять решение`,
      minutes: 25,
    })
  }

  if (snapshot.payments.length === 0) {
    tasks.push({
      id: uid(),
      tag: 'деньги',
      action: 'Добавить оплаты за месяц, чтобы увидеть реальный прогресс',
      minutes: 25,
    })
  }

  const unreadyL1 = snapshot.l1Items.find((item) => !item.done)
  if (unreadyL1) {
    tasks.push({
      id: uid(),
      tag: 'L1',
      action: unreadyL1.title,
      minutes: 25,
    })
  }

  const goalWithStep = (snapshot.customGoals || []).find((goal) => (goal.items || []).some((item) => !item.done))
  if (goalWithStep) {
    const nextStep = goalWithStep.items.find((item) => !item.done)
    tasks.push({
      id: uid(),
      tag: goalWithStep.tag || 'цель',
      action: `${goalWithStep.title}: ${nextStep.title}`,
      minutes: 25,
    })
  }

  tasks.push(
    { id: uid(), tag: 'клиент', action: 'Написать 1 новому лиду из текущего канала', minutes: 25 },
    { id: uid(), tag: 'контент', action: 'Сделать короткий полезный пост', minutes: 25 },
  )
  return tasks.slice(0, 5)
}

function BottomSheet({ open, onClose, title, children }) {
  return (
    <div className={`sheet-wrap ${open ? 'open' : ''}`} aria-hidden={!open}>
      <button className="sheet-backdrop" onClick={onClose} aria-label="Закрыть" />
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="sheet-header">
          <h3>{title}</h3>
          <button className="ghost-btn" onClick={onClose}>
            Закрыть
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  )
}

function Progress({ value }) {
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('now')
  const [leads, setLeads] = useState([])
  const [leadIndex, setLeadIndex] = useState(0)
  const [leadStatusMenuOpen, setLeadStatusMenuOpen] = useState(false)
  const [payments, setPayments] = useState([])
  const [l1Items, setL1Items] = useState([])
  const [customGoals, setCustomGoals] = useState([])
  const [activeGoalId, setActiveGoalId] = useState('')
  const [dailyPlan, setDailyPlan] = useState({ date: '', tasks: [] })
  const [timerState, setTimerState] = useState({
    running: false,
    expired: false,
    endAt: null,
    taskId: null,
    secondsLeft: POMODORO_MINUTES * 60,
  })
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [showTasksSheet, setShowTasksSheet] = useState(false)
  const [skipSheetOpen, setSkipSheetOpen] = useState(false)
  const [skipAnswer, setSkipAnswer] = useState('')
  const [skipReply, setSkipReply] = useState('')
  const [skipStep, setSkipStep] = useState('')
  const [skipLoading, setSkipLoading] = useState(false)
  const [rewardPulse, setRewardPulse] = useState(false)
  const [leadSheetOpen, setLeadSheetOpen] = useState(false)
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false)
  const [csvSheetOpen, setCsvSheetOpen] = useState(false)
  const [l1SheetOpen, setL1SheetOpen] = useState(false)
  const [goalSheetOpen, setGoalSheetOpen] = useState(false)
  const [goalStepSheetOpen, setGoalStepSheetOpen] = useState(false)
  const [csvMessage, setCsvMessage] = useState('')
  const [l1LastActivity, setL1LastActivity] = useState(dayKey())
  const [l1AlertAnswer, setL1AlertAnswer] = useState('')
  const [loaded, setLoaded] = useState(false)

  const touchStartX = useRef(0)
  const currentTask = dailyPlan.tasks[0] || null
  const queueTasks = dailyPlan.tasks.slice(1)
  const l1DaysIdle = daysBetween(l1LastActivity)
  const activeGoal = customGoals.find((goal) => goal.id === activeGoalId) || null
  const timerOverlayVisible = timerState.running || timerState.expired
  const isTimerAmber = timerState.secondsLeft > 0 && timerState.secondsLeft <= 5 * 60
  const timerToneClass = timerState.expired ? 'is-red' : isTimerAmber ? 'is-amber' : 'is-green'

  const l1Deadline = new Date('2026-10-01T00:00:00')
  const countdownDays = Math.max(0, Math.ceil((l1Deadline.getTime() - Date.now()) / 86400000))
  const monthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`

  const thisMonthIncome = useMemo(
    () =>
      payments
        .filter((payment) => {
          const date = new Date(payment.date)
          return `${date.getFullYear()}-${date.getMonth()}` === monthKey
        })
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [monthKey, payments],
  )

  const monthDeals = useMemo(
    () =>
      leads.filter((lead) => {
        if (lead.status !== 'Оплатил' || !lead.paidAt) return false
        const paidAt = new Date(lead.paidAt)
        return `${paidAt.getFullYear()}-${paidAt.getMonth()}` === monthKey
      }).length,
    [leads, monthKey],
  )

  const l1Progress = useMemo(() => {
    if (l1Items.length === 0) return 0
    return (l1Items.filter((item) => item.done).length / l1Items.length) * 100
  }, [l1Items])

  useEffect(() => {
    const savedLeads = load(localKey.leads, [])
    const savedPayments = load(localKey.payments, [])
    const savedL1 = load(localKey.l1Items, null)
    const savedCustomGoals = load(localKey.customGoals, null)
    const savedLegacyGoals = load(localKey.goalProjectsLegacy, [])
    const savedPlan = load(localKey.dailyPlan, null)
    const savedTimer = load(localKey.timer, null)
    const savedL1Activity = load(localKey.l1Activity, dayKey())
    const savedL1Answer = load(localKey.l1AlertAnswer, '')

    setLeads(savedLeads)
    setPayments(savedPayments)
    setL1Items(
      savedL1 && savedL1.length
        ? savedL1
        : DEFAULT_L1_ITEMS.map((title) => ({ id: uid(), title, done: false, createdAt: new Date().toISOString() })),
    )
    setCustomGoals(Array.isArray(savedCustomGoals) ? savedCustomGoals : savedLegacyGoals || [])
    setDailyPlan(savedPlan || { date: '', tasks: [] })
    setTimerState(
      savedTimer || {
        running: false,
        expired: false,
        endAt: null,
        taskId: null,
        secondsLeft: POMODORO_MINUTES * 60,
      },
    )
    setL1LastActivity(savedL1Activity || dayKey())
    setL1AlertAnswer(savedL1Answer || '')
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    save(localKey.leads, leads)
  }, [leads, loaded])

  useEffect(() => {
    if (!loaded) return
    save(localKey.payments, payments)
  }, [payments, loaded])

  useEffect(() => {
    if (!loaded) return
    save(localKey.l1Items, l1Items)
  }, [l1Items, loaded])

  useEffect(() => {
    if (!loaded) return
    save(localKey.customGoals, customGoals)
  }, [customGoals, loaded])

  useEffect(() => {
    if (!loaded) return
    save(localKey.dailyPlan, dailyPlan)
  }, [dailyPlan, loaded])

  useEffect(() => {
    if (!loaded) return
    save(localKey.timer, timerState)
  }, [timerState, loaded])

  useEffect(() => {
    if (!loaded) return
    save(localKey.l1Activity, l1LastActivity)
  }, [l1LastActivity, loaded])

  useEffect(() => {
    if (!loaded) return
    save(localKey.l1AlertAnswer, l1AlertAnswer)
  }, [l1AlertAnswer, loaded])

  useEffect(() => {
    if (!activeGoalId) return
    if (customGoals.some((goal) => goal.id === activeGoalId)) return
    setActiveGoalId('')
  }, [activeGoalId, customGoals])

  useEffect(() => {
    if (!loaded) return
    if (dailyPlan.date === dayKey() && dailyPlan.tasks.length > 0) return

    const generate = async () => {
      setLoadingTasks(true)
      const snapshot = { leads, payments, l1Items, customGoals }
      let tasks = fallbackTasks(snapshot)
      try {
        const response = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'tasks', snapshot }),
        })
        if (response.ok) {
          const data = await response.json()
          const parsed = Array.isArray(data.tasks) ? data.tasks : []
          if (parsed.length > 0) {
            tasks = parsed
              .map((task) => ({
                id: uid(),
                tag: String(task.tag || 'клиент').slice(0, 24),
                action: String(task.action || '').slice(0, 120),
                minutes: Number(task.minutes) > 0 ? Number(task.minutes) : 25,
                priority: Number(task.priority) > 0 ? Number(task.priority) : 3,
              }))
              .sort((a, b) => a.priority - b.priority)
              .slice(0, 5)
          }
        }
      } catch {
        // fallback
      } finally {
        setLoadingTasks(false)
      }

      setDailyPlan({ date: dayKey(), tasks: tasks.length ? tasks : fallbackTasks(snapshot) })
    }

    generate()
  }, [customGoals, dailyPlan.date, dailyPlan.tasks.length, l1Items, leads, loaded, payments])

  useEffect(() => {
    if (!timerState.running || !timerState.endAt) return undefined
    const timer = window.setInterval(() => {
      const sec = Math.max(0, Math.ceil((timerState.endAt - Date.now()) / 1000))
      if (sec <= 0) {
        window.clearInterval(timer)
        setTimerState((prev) => ({ ...prev, running: false, expired: true, endAt: null, secondsLeft: 0 }))
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Pomodoro завершён', { body: '25 минут прошли. Вернись и отметь результат.' })
        }
      } else {
        setTimerState((prev) => ({ ...prev, secondsLeft: sec }))
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [timerState.endAt, timerState.running])

  useEffect(() => {
    if (!timerOverlayVisible) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [timerOverlayVisible])

  const triggerReward = () => {
    setRewardPulse(true)
    window.setTimeout(() => setRewardPulse(false), 450)
  }

  const startPomodoro = async () => {
    if (!currentTask) return
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        // ignore
      }
    }
    const seconds = POMODORO_MINUTES * 60
    setTimerState({
      running: true,
      expired: false,
      endAt: Date.now() + seconds * 1000,
      taskId: currentTask.id,
      secondsLeft: seconds,
    })
  }

  const completeCurrentTask = () => {
    triggerReward()
    setTimerState({ running: false, expired: false, endAt: null, taskId: null, secondsLeft: POMODORO_MINUTES * 60 })
    setDailyPlan((prev) => ({ ...prev, tasks: prev.tasks.slice(1) }))
  }

  const openSkip = () => {
    setSkipSheetOpen(true)
    setSkipAnswer('')
    setSkipReply('')
    setSkipStep('')
  }

  const askClaudeOnSkip = async (event) => {
    event.preventDefault()
    if (!skipAnswer.trim() || !currentTask) return
    setSkipLoading(true)
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'blocker', blocker: skipAnswer, task: currentTask }),
      })
      const data = await response.json()
      setSkipReply(data.reply || 'Давай уменьшим шаг и сделаем 5 минут сейчас.')
      setSkipStep(data.smallerStep || 'Сделай самую простую часть за 5 минут.')
    } catch {
      setSkipReply('Что будет самым простым первым движением, которое займёт 5 минут?')
      setSkipStep('Открой нужный файл/чат и сделай только первый шаг.')
    } finally {
      setSkipLoading(false)
    }
  }

  const applySmallerStep = () => {
    if (!skipStep || !currentTask) return
    setDailyPlan((prev) => ({ ...prev, tasks: prev.tasks.map((task, i) => (i === 0 ? { ...task, action: skipStep } : task)) }))
    setSkipSheetOpen(false)
  }

  const skipTask = () => {
    setTimerState({ running: false, expired: false, endAt: null, taskId: null, secondsLeft: POMODORO_MINUTES * 60 })
    setSkipSheetOpen(false)
    setDailyPlan((prev) => {
      if (prev.tasks.length <= 1) return prev
      const [first, ...rest] = prev.tasks
      return { ...prev, tasks: [...rest, first] }
    })
  }

  const moveTaskByArrows = (index, direction) => {
    setDailyPlan((prev) => {
      const target = index + direction
      if (index < 1 || target < 1 || index >= prev.tasks.length || target >= prev.tasks.length) return prev
      const next = [...prev.tasks]
      const [task] = next.splice(index, 1)
      next.splice(target, 0, task)
      return { ...prev, tasks: next }
    })
  }

  const formatSeconds = (sec) => {
    const minutes = Math.floor(sec / 60)
    const seconds = sec % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const addLead = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const source = String(form.get('source') || '').trim()
    const firstContactDate = String(form.get('date') || dayKey())
    if (!name || !source) return
    setLeads((prev) => [
      ...prev,
      {
        id: uid(),
        name,
        source,
        createdAt: new Date(firstContactDate).toISOString(),
        firstContactDate,
        status: 'Новый',
        statusSince: new Date(firstContactDate).toISOString(),
      },
    ])
    triggerReward()
    setLeadSheetOpen(false)
  }

  const currentLead = leads.length ? leads[leadIndex % leads.length] : null
  const currentLeadDays = currentLead ? daysBetween(currentLead.statusSince) : 0

  const leadSwipeStart = (event) => {
    touchStartX.current = event.changedTouches[0].clientX
  }

  const leadSwipeEnd = (event) => {
    const delta = event.changedTouches[0].clientX - touchStartX.current
    if (delta > 60 && leads.length > 1) {
      setLeadIndex((prev) => (prev + 1) % leads.length)
      setLeadStatusMenuOpen(false)
    }
  }

  const updateLeadStatus = (leadId, status) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead
        return {
          ...lead,
          status,
          statusSince: new Date().toISOString(),
          paidAt: status === 'Оплатил' ? new Date().toISOString() : lead.paidAt || null,
        }
      }),
    )
    setLeadStatusMenuOpen(false)
    triggerReward()
  }

  const addPayment = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const amount = Number(form.get('amount') || 0)
    const date = String(form.get('date') || dayKey())
    if (!name || !amount) return
    setPayments((prev) => [...prev, { id: uid(), name, amount, date }])
    triggerReward()
    setPaymentSheetOpen(false)
  }

  const parseCSVLine = (line, delimiter) => {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (char === '"') inQuotes = !inQuotes
      else if (char === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else current += char
    }
    result.push(current.trim())
    return result.map((item) => item.replace(/^"|"$/g, ''))
  }

  const importCSV = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const rows = text.split(/\r?\n/).filter(Boolean)
    if (rows.length < 2) {
      setCsvMessage('Файл пустой или без строк данных.')
      return
    }
    const delimiter = rows[0].includes(';') ? ';' : ','
    const headers = parseCSVLine(rows[0], delimiter).map((h) => h.toLowerCase())
    const amountIndex = headers.findIndex((h) => /(amount|sum|сумм)/.test(h))
    const dateIndex = headers.findIndex((h) => /(date|дата)/.test(h))
    const nameIndex = headers.findIndex((h) => /(name|description|counterparty|client|коммент|описан)/.test(h))
    if (amountIndex < 0 || dateIndex < 0) {
      setCsvMessage('Не нашёл колонки суммы и даты.')
      return
    }

    const imported = []
    for (const row of rows.slice(1)) {
      const cols = parseCSVLine(row, delimiter)
      const amount = Number(String(cols[amountIndex] || '0').replace(/[^\d.-]/g, ''))
      if (!Number.isFinite(amount) || amount <= 0) continue
      const date = new Date(cols[dateIndex])
      if (Number.isNaN(date.getTime())) continue
      imported.push({
        id: uid(),
        name: (nameIndex >= 0 ? cols[nameIndex] : 'Revolut payment') || 'Revolut payment',
        amount,
        date: date.toISOString().slice(0, 10),
      })
    }

    if (imported.length === 0) {
      setCsvMessage('Не нашёл входящие платежи в файле.')
      return
    }
    setPayments((prev) => [...prev, ...imported])
    triggerReward()
    setCsvMessage(`Импортировано ${imported.length} платежей.`)
  }

  const toggleL1Item = (id) => {
    setL1Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done, updatedAt: new Date().toISOString() } : item)),
    )
    setL1LastActivity(dayKey())
    triggerReward()
  }

  const addL1Item = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') || '').trim()
    if (!title) return
    setL1Items((prev) => [...prev, { id: uid(), title, done: false, createdAt: new Date().toISOString() }])
    setL1LastActivity(dayKey())
    triggerReward()
    setL1SheetOpen(false)
  }

  const toggleCustomGoalItem = (goalId, itemId) => {
    setCustomGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              items: goal.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done, updatedAt: new Date().toISOString() } : item,
              ),
            }
          : goal,
      ),
    )
    triggerReward()
  }

  const moveGoal = (index, direction) => {
    setCustomGoals((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [goal] = next.splice(index, 1)
      next.splice(target, 0, goal)
      return next
    })
  }

  const removeGoal = (goalId) => {
    setCustomGoals((prev) => prev.filter((goal) => goal.id !== goalId))
    if (activeGoalId === goalId) setActiveGoalId('')
    triggerReward()
  }

  const addCustomGoal = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') || '').trim()
    const tag = String(form.get('tag') || '').trim()
    const targetDate = String(form.get('targetDate') || '').trim()
    if (!title) return
    setCustomGoals((prev) => [
      ...prev,
      {
        id: uid(),
        title,
        tag: GOAL_TAGS.includes(tag) ? tag : 'личное',
        targetDate: targetDate || null,
        createdAt: new Date().toISOString(),
        items: [{ id: uid(), title: 'Первый шаг', done: false, createdAt: new Date().toISOString() }],
      },
    ])
    triggerReward()
    setGoalSheetOpen(false)
  }

  const openGoalStepSheet = (goalId) => {
    setActiveGoalId(goalId)
    setGoalStepSheetOpen(true)
  }

  const addCustomGoalStep = (event) => {
    event.preventDefault()
    if (!activeGoalId) return
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') || '').trim()
    if (!title) return
    setCustomGoals((prev) =>
      prev.map((goal) =>
        goal.id === activeGoalId
          ? { ...goal, items: [...goal.items, { id: uid(), title, done: false, createdAt: new Date().toISOString() }] }
          : goal,
      ),
    )
    triggerReward()
    setGoalStepSheetOpen(false)
    setActiveGoalId('')
  }

  const openGoalPage = (goalId) => {
    setActiveGoalId(goalId)
    setActiveTab('goals')
  }

  const averageDeal = thisMonthIncome > 0 && monthDeals > 0 ? thisMonthIncome / monthDeals : 1500
  const revenueRemaining = Math.max(0, MONTHLY_REVENUE_GOAL - thisMonthIncome)
  const dealsNeeded = revenueRemaining === 0 ? 0 : Math.ceil(revenueRemaining / Math.max(500, averageDeal))
  const clientsProgress = (monthDeals / MONTHLY_CLIENT_GOAL) * 100
  const moneyProgress = (thisMonthIncome / MONTHLY_REVENUE_GOAL) * 100

  const renderNowTab = () => (
    <section className="now-screen">
      {!currentTask && !loadingTasks ? (
        <div className="focus-card completed">
          <p className="big-line">На сегодня всё закрыто.</p>
          <button className="primary-btn" onClick={() => setDailyPlan((prev) => ({ ...prev, date: '', tasks: [] }))}>
            Сгенерировать новый фокус
          </button>
        </div>
      ) : (
        <div className={`focus-card ${rewardPulse ? 'reward' : ''}`}>
          <span className="tag-chip" style={{ background: TAG_COLORS[currentTask?.tag] || '#173328' }}>
            {currentTask?.tag || 'фокус'}
          </span>
          <p className="big-line">{currentTask?.action || 'Подготовка фокуса...'}</p>

          {!timerState.running && !timerState.expired ? (
            <button className="primary-btn" onClick={startPomodoro} disabled={!currentTask}>
              Начать · {currentTask?.minutes || 25} мин
            </button>
          ) : (
            <div className="timer-wrap">
              <p className={`timer-value ${timerToneClass}`}>{formatSeconds(timerState.secondsLeft)}</p>
              <div className="timer-actions">
                <button className="primary-btn" onClick={completeCurrentTask}>
                  Готово
                </button>
              </div>
            </div>
          )}

          {!timerState.running && !timerState.expired && currentTask && (
            <button className="skip-link-btn" onClick={openSkip}>
              Пропустить
            </button>
          )}

          {queueTasks.length > 0 ? (
            <section className="queue-wrap">
              <p className="muted">Остальные задачи</p>
              <div className="queue-list">
                {queueTasks.map((task, index) => {
                  const fullIndex = index + 1
                  return (
                    <article key={task.id} className="task-row collapsed">
                      <div>
                        <span className="tag-chip" style={{ background: TAG_COLORS[task.tag] || '#173328' }}>
                          {task.tag}
                        </span>
                        <p>{task.action}</p>
                      </div>
                      <div className="task-order-actions">
                        <button className="ghost-btn" onClick={() => moveTaskByArrows(fullIndex, -1)} disabled={fullIndex === 1}>
                          ↑
                        </button>
                        <button
                          className="ghost-btn"
                          onClick={() => moveTaskByArrows(fullIndex, 1)}
                          disabled={fullIndex === dailyPlan.tasks.length - 1}
                        >
                          ↓
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </section>
  )

  const renderLeadsTab = () => (
    <section className="tab-screen">
      <h2 className="section-title">Лиды</h2>
      <p className="metric">
        {monthDeals} / {MONTHLY_CLIENT_GOAL} клиента
      </p>
      <Progress value={clientsProgress} />

      {currentLead ? (
        <article className={`lead-card ${currentLeadDays > 5 ? 'stale' : ''}`} onTouchStart={leadSwipeStart} onTouchEnd={leadSwipeEnd}>
          <p className="lead-name">{currentLead.name}</p>
          <p className="muted">{currentLead.source}</p>
          <p className="muted">первый контакт: {currentLead.firstContactDate || dayKey(new Date(currentLead.createdAt))}</p>
          <p className="status-line">{currentLead.status.toLowerCase()} {currentLeadDays} дн.</p>
          <button className="primary-btn" onClick={() => setLeadStatusMenuOpen((prev) => !prev)}>
            Статус: {currentLead.status}
          </button>
          {leadStatusMenuOpen ? (
            <div className="status-menu">
              {LEAD_STATUSES.map((status) => (
                <button
                  key={status}
                  className={`status-option ${status === currentLead.status ? 'active' : ''}`}
                  onClick={() => updateLeadStatus(currentLead.id, status)}
                >
                  {status}
                </button>
              ))}
            </div>
          ) : null}
          <button className="secondary-btn" onClick={() => { setLeadIndex((prev) => (prev + 1) % leads.length); setLeadStatusMenuOpen(false) }}>
            Следующий лид
          </button>
        </article>
      ) : (
        <article className="lead-card empty">
          <p className="lead-name">Лидов пока нет</p>
          <p className="muted">Добавьте первого, чтобы запустить воронку.</p>
        </article>
      )}

      <button className="fab" onClick={() => setLeadSheetOpen(true)} aria-label="Добавить лида">
        +
      </button>
    </section>
  )

  const renderMoneyTab = () => (
    <section className="tab-screen">
      <h2 className="section-title">Деньги</h2>
      <p className="money-hero">{toMoney(thisMonthIncome)}</p>
      <Progress value={moneyProgress} />
      <p className="muted">
        осталось {toMoney(revenueRemaining)} · нужно ещё {dealsNeeded} сделок
      </p>

      <div className="payments-list">
        {[...payments]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((payment) => (
            <article key={payment.id} className="payment-item">
              <div>
                <p className="lead-name">{payment.name}</p>
                <p className="muted">{payment.date}</p>
              </div>
              <p className="payment-amount">{toMoney(payment.amount)}</p>
            </article>
          ))}
      </div>

      <div className="money-actions">
        <button className="secondary-btn" onClick={() => setCsvSheetOpen(true)}>
          Загрузить выписку Revolut
        </button>
      </div>

      <button className="fab" onClick={() => setPaymentSheetOpen(true)} aria-label="Добавить платёж">
        +
      </button>
    </section>
  )

  const renderL1Tab = () => (
    <section className="tab-screen">
      <h2 className="section-title">L1</h2>
      <p className="metric">{countdownDays} дней до октября</p>
      <Progress value={l1Progress} />

      {l1DaysIdle > 10 ? (
        <div className="question-alert">
          <p>L1 не двигался {l1DaysIdle} дней. Что застряло?</p>
          <textarea value={l1AlertAnswer} onChange={(event) => setL1AlertAnswer(event.target.value)} placeholder="Коротко: что мешает?" />
        </div>
      ) : null}

      <div className="checklist">
        {l1Items.map((item) => (
          <label key={item.id} className="check-row circle-check-row">
            <input type="checkbox" checked={item.done} onChange={() => toggleL1Item(item.id)} />
            <span>{item.title}</span>
          </label>
        ))}
      </div>

      <button className="fab" onClick={() => setL1SheetOpen(true)} aria-label="Добавить пункт L1">
        +
      </button>
    </section>
  )

  const renderGoalsTab = () => {
    if (activeGoal) {
      const doneCount = activeGoal.items.filter((item) => item.done).length
      const progress = activeGoal.items.length ? (doneCount / activeGoal.items.length) * 100 : 0
      const daysToGoal = activeGoal.targetDate ? daysBetween(dayKey(), activeGoal.targetDate) : null
      return (
        <section className="tab-screen">
          <button className="secondary-btn back-btn" onClick={() => setActiveGoalId('')}>
            ← Все цели
          </button>
          <h2 className="section-title">{activeGoal.title}</h2>
          {activeGoal.targetDate ? <p className="muted">дедлайн: {activeGoal.targetDate} · {daysToGoal} дн.</p> : null}
          <Progress value={progress} />
          <p className="muted">{doneCount}/{activeGoal.items.length} шагов выполнено</p>
          <div className="checklist">
            {activeGoal.items.map((item) => (
              <label key={item.id} className="check-row">
                <input type="checkbox" checked={item.done} onChange={() => toggleCustomGoalItem(activeGoal.id, item.id)} />
                <span>{item.title}</span>
              </label>
            ))}
          </div>
          <button className="secondary-btn" onClick={() => openGoalStepSheet(activeGoal.id)}>
            + Добавить шаг
          </button>
        </section>
      )
    }

    return (
      <section className="tab-screen">
        <div className="goals-header">
          <h2 className="section-title">Мои цели</h2>
          <button className="secondary-btn inline-btn" onClick={() => setGoalSheetOpen(true)}>
            + Цель
          </button>
        </div>
        {customGoals.length === 0 ? (
          <article className="goal-card empty">
            <p className="lead-name">Пока нет целей</p>
            <p className="muted">Создайте цель с тегом и дедлайном.</p>
          </article>
        ) : (
          <div className="goals-list">
            {customGoals.map((goal, index) => {
              const doneCount = goal.items.filter((item) => item.done).length
              const progress = goal.items.length ? (doneCount / goal.items.length) * 100 : 0
              return (
                <article key={goal.id} className="goal-card">
                  <div className="goal-card-header">
                    <span className="tag-chip">{goal.tag || 'личное'}</span>
                    <div className="goal-order-actions">
                      <button className="ghost-btn" onClick={() => moveGoal(index, -1)} disabled={index === 0}>↑</button>
                      <button className="ghost-btn" onClick={() => moveGoal(index, 1)} disabled={index === customGoals.length - 1}>↓</button>
                    </div>
                  </div>
                  <p className="lead-name">{goal.title}</p>
                  <p className="muted">{goal.targetDate ? `дедлайн: ${goal.targetDate}` : 'без дедлайна'}</p>
                  <Progress value={progress} />
                  <button className="primary-btn" onClick={() => openGoalPage(goal.id)}>Открыть страницу цели</button>
                  <button className="secondary-btn danger-btn" onClick={() => removeGoal(goal.id)}>Удалить цель</button>
                </article>
              )
            })}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="app-shell" style={{ '--accent': ACCENT }}>
      <div className={`reward-overlay ${rewardPulse ? 'show' : ''}`} />

      {activeTab === 'now' && renderNowTab()}
      {activeTab === 'leads' && renderLeadsTab()}
      {activeTab === 'money' && renderMoneyTab()}
      {activeTab === 'l1' && renderL1Tab()}
      {activeTab === 'goals' && renderGoalsTab()}

      <nav className="bottom-nav">
        <button className={activeTab === 'now' ? 'active' : ''} onClick={() => setActiveTab('now')}>Сейчас</button>
        <button className={activeTab === 'leads' ? 'active' : ''} onClick={() => setActiveTab('leads')}>Лиды</button>
        <button className={activeTab === 'money' ? 'active' : ''} onClick={() => setActiveTab('money')}>Деньги</button>
        <button className={activeTab === 'l1' ? 'active' : ''} onClick={() => setActiveTab('l1')}>L1</button>
        <button className={activeTab === 'goals' ? 'active' : ''} onClick={() => setActiveTab('goals')}>Цели</button>
      </nav>

      <BottomSheet open={showTasksSheet} onClose={() => setShowTasksSheet(false)} title="Задачи на сегодня">
        <div className="tasks-sheet">
          {dailyPlan.tasks.map((task, index) => (
            <article key={task.id} className={`task-row ${index === 0 ? '' : 'done'}`}>
              <span className="tag-chip" style={{ background: TAG_COLORS[task.tag] || '#173328' }}>{task.tag}</span>
              <p>{task.action}</p>
            </article>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={skipSheetOpen} onClose={() => setSkipSheetOpen(false)} title="Что мешает?">
        <form className="stack" onSubmit={askClaudeOnSkip}>
          <textarea value={skipAnswer} onChange={(event) => setSkipAnswer(event.target.value)} placeholder="Что мешает начать?" required />
          <button className="primary-btn" type="submit" disabled={skipLoading}>{skipLoading ? 'Думаю…' : 'Спросить Claude'}</button>
        </form>
        {skipReply ? (
          <div className="claude-reply">
            <p>{skipReply}</p>
            <p className="small-step">Меньший шаг: {skipStep}</p>
            <button className="primary-btn" onClick={applySmallerStep}>Взять меньший шаг</button>
          </div>
        ) : null}
        <button className="secondary-btn" onClick={skipTask}>Пропустить и взять следующую задачу</button>
      </BottomSheet>

      <BottomSheet open={leadSheetOpen} onClose={() => setLeadSheetOpen(false)} title="Добавить лида">
        <form className="stack" onSubmit={addLead}>
          <input name="name" placeholder="Имя" required />
          <select name="source" defaultValue="Telegram" required>
            {LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
          <input name="date" type="date" defaultValue={dayKey()} required />
          <button className="primary-btn" type="submit">Сохранить</button>
        </form>
      </BottomSheet>

      <BottomSheet open={paymentSheetOpen} onClose={() => setPaymentSheetOpen(false)} title="Добавить платёж">
        <form className="stack" onSubmit={addPayment}>
          <input name="name" placeholder="Имя клиента" required />
          <input name="amount" type="number" min="1" step="0.01" placeholder="Сумма в $" required />
          <input name="date" type="date" defaultValue={dayKey()} required />
          <button className="primary-btn" type="submit">Сохранить</button>
        </form>
      </BottomSheet>

      <BottomSheet open={csvSheetOpen} onClose={() => setCsvSheetOpen(false)} title="Загрузить выписку Revolut">
        <div className="stack">
          <label className="file-label">
            Выбрать CSV
            <input type="file" accept=".csv,text/csv" onChange={importCSV} />
          </label>
          {csvMessage ? <p className="muted">{csvMessage}</p> : null}
        </div>
      </BottomSheet>

      <BottomSheet open={l1SheetOpen} onClose={() => setL1SheetOpen(false)} title="Новый пункт L1">
        <form className="stack" onSubmit={addL1Item}>
          <input name="title" placeholder="Что добавить?" required />
          <button className="primary-btn" type="submit">Добавить</button>
        </form>
      </BottomSheet>

      <BottomSheet open={goalSheetOpen} onClose={() => setGoalSheetOpen(false)} title="Новая цель">
        <form className="stack" onSubmit={addCustomGoal}>
          <input name="title" placeholder="Название цели" required />
          <select name="tag" defaultValue="личное">
            {GOAL_TAGS.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <input name="targetDate" type="date" />
          <button className="primary-btn" type="submit">Создать цель</button>
        </form>
      </BottomSheet>

      <BottomSheet open={goalStepSheetOpen} onClose={() => setGoalStepSheetOpen(false)} title="Новый шаг цели">
        <form className="stack" onSubmit={addCustomGoalStep}>
          <input name="title" placeholder="Что сделать дальше?" required />
          <button className="primary-btn" type="submit">Добавить шаг</button>
        </form>
      </BottomSheet>

      <div className={`timer-overlay ${timerOverlayVisible ? 'show' : ''}`} aria-hidden={!timerOverlayVisible}>
        <div className="timer-overlay-card">
          <p className={`overlay-time ${timerToneClass}`}>{formatSeconds(timerState.secondsLeft)}</p>
          <button className="primary-btn overlay-done-btn" onClick={completeCurrentTask}>Готово</button>
        </div>
      </div>
    </div>
  )
}

export default App

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1000

const parseBody = (body) => {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }
  return body
}

const readText = (payload) =>
  (payload?.content || [])
    .map((block) => (block?.type === 'text' ? block.text : ''))
    .join('\n')
    .trim()

const parseJSONFromText = (text) => {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

const callClaude = async ({ system, prompt }) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Claude API error (${response.status}): ${text}`)
  }

  return response.json()
}

const buildTasksFallback = () => ({
  tasks: [
    {
      tag: 'клиент',
      action: 'Написать одному текущему лиду и закрыть следующий шаг',
      minutes: 25,
      priority: 1,
    },
    {
      tag: 'деньги',
      action: 'Проверить оплаты за этот месяц и зафиксировать пробелы',
      minutes: 25,
      priority: 2,
    },
    {
      tag: 'L1',
      action: 'Сделать следующий маленький шаг по L1-чеклисту',
      minutes: 25,
      priority: 3,
    },
  ],
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = parseBody(req.body)
  const mode = body?.mode

  if (mode === 'tasks') {
    const snapshot = body?.snapshot || {}
    try {
      const payload = await callClaude({
        system:
          'Ты ADHD-friendly ассистент по приоритетам. Отвечай коротко и без воды. Только JSON.',
        prompt: `Сгенерируй максимум 5 задач на сегодня, отсортированных по важности.
Контекст пользователя:
${JSON.stringify(snapshot)}

Верни строго JSON:
{
  "tasks": [
    {
      "tag": "L1|деньги|клиент|контент",
      "action": "одно чёткое действие до 2 строк",
      "minutes": 25,
      "priority": 1
    }
  ]
}

Правила:
- максимум 5 задач
- приоритет 1 самое важное
- action короткий и конкретный
- только русский язык`,
      })

      const text = readText(payload)
      const parsed = parseJSONFromText(text)
      const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : []

      if (tasks.length === 0) {
        res.status(200).json(buildTasksFallback())
        return
      }

      res.status(200).json({ tasks })
      return
    } catch {
      res.status(200).json(buildTasksFallback())
      return
    }
  }

  if (mode === 'blocker') {
    const blocker = String(body?.blocker || '').slice(0, 1000)
    const task = body?.task || {}

    try {
      const payload = await callClaude({
        system:
          'Ты эмпатичный ADHD-коуч. Отвечай коротко, поддерживающе и практично. Только JSON.',
        prompt: `Текущая задача:
${JSON.stringify(task)}

Ответ пользователя на вопрос "Что мешает?":
${blocker}

Верни строго JSON:
{
  "reply": "1 короткая поддерживающая фраза",
  "smallerStep": "один маленький шаг на 5-10 минут"
}

Фраза не должна звучать как упрёк.`,
      })

      const text = readText(payload)
      const parsed = parseJSONFromText(text)
      res.status(200).json({
        reply:
          parsed?.reply ||
          'Похоже, ресурс сейчас ограничен. Это нормально, давай сделаем шаг проще.',
        smallerStep:
          parsed?.smallerStep ||
          'Открой нужный инструмент и выполни только первый шаг за 5 минут.',
      })
      return
    } catch {
      res.status(200).json({
        reply: 'Что если снизить ожидание до минимума и просто начать с 5 минут?',
        smallerStep: 'Сделай самый маленький следующий шаг прямо сейчас.',
      })
      return
    }
  }

  res.status(400).json({ error: 'Unknown mode' })
}

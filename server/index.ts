import fs from 'fs'
import path from 'path'
import cors from 'cors'
import express from 'express'

import { githubRouter } from './routes/github.js'
import { chatRouter } from './routes/chat.js'

// Manually load env variables from .env file
try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const firstEquals = trimmed.indexOf('=')
        if (firstEquals !== -1) {
          const key = trimmed.slice(0, firstEquals).trim()
          const val = trimmed.slice(firstEquals + 1).trim()
          // Remove potential wrapping quotes
          const cleanVal = val.replace(/^["']|["']$/g, '')
          process.env[key] = cleanVal
        }
      }
    }
  }
} catch {
  // Quiet fail to conform to console log constraints
}

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.use(express.json())

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

app.use(githubRouter)
app.use(chatRouter)

app.listen(port, () => {
  console.info(`Server listening on http://localhost:${port}`)
})

import cors from 'cors'
import express from 'express'

import { githubRouter } from './routes/github.js'

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

app.use(githubRouter)

app.listen(port, () => {
  console.info(`Server listening on http://localhost:${port}`)
})

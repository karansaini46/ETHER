import express from 'express'

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

app.listen(port, () => {
  console.info(`Server listening on http://localhost:${port}`)
})

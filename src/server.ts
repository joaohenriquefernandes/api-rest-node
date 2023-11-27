import fastify from 'fastify'
import { knex } from './database'
import { env } from './env'

const app = fastify()

app.get('/hello', async (request, reply) => {
  const table = await knex('transactions').select('*')

  return table
})

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('Http server running')
  })

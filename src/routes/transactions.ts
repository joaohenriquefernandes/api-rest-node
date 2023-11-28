import { knex } from '../database'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { CheckSessionIdExists } from '../middleware/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.post(
    '/transactions',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const createTransactionBodySchema = z.object({
        title: z.string(),
        amount: z.number(),
        type: z.enum(['credit', 'debit']),
      })

      let sessionId = request.cookies.sessionId

      if (!sessionId) {
        sessionId = randomUUID()

        reply.cookie('sessionId', sessionId, {
          path: '/',
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        })
      }

      const { title, amount, type } = createTransactionBodySchema.parse(
        request.body,
      )

      await knex('transactions').insert({
        id: randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        session_id: sessionId,
      })

      return reply.status(201).send()
    },
  )

  app.get(
    '/transactions',
    {
      preHandler: [CheckSessionIdExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where({ session_id: sessionId })
        .select('*')

      return reply.send({ transactions })
    },
  )

  app.get(
    '/transactions/:id',
    {
      preHandler: [CheckSessionIdExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.cookies
      const transactionsQueryParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = transactionsQueryParamsSchema.parse(request.params)

      const transaction = await knex('transactions')
        .where({ id, session_id: sessionId })
        .select()
        .first()

      return reply.send({ transaction })
    },
  )

  app.get(
    '/transactions/summary',
    {
      preHandler: [CheckSessionIdExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.cookies
      const summary = await knex('transactions')
        .where({ session_id: sessionId })
        .sum('amount', { as: 'amount' })
        .first()

      return reply.send({ summary })
    },
  )
}

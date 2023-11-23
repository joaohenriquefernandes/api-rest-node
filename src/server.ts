import fastify from 'fastify'

const app = fastify()

app.get('/', (request, reply) => {
  return 'Hello world!'
})

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('Http server running')
  })

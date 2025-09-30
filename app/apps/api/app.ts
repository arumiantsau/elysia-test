import { Elysia } from 'elysia'

export const createApp = async (useTestDatabase = false) => {
  return new Elysia().listen(3000)
}
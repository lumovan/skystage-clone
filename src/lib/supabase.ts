import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './database.types'

// Client-side Supabase client
export const createClient = () =>
  createClientComponentClient<Database>()

// Server-side Supabase client
export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies })

// Database types will be generated from Supabase
export type { Database } from './database.types'

import { supabase } from '../supabase/client'

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  return { session: data?.session, error }
}

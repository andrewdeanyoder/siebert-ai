'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'

const INVALID_CREDENTIALS_ERROR_CODES = [400, 401, 403];

function handleError() {
  redirect('/login?error=An error occurred. Please try again.')
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  // todo: validate all inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const response = await supabase.auth.signInWithPassword(data)

  if (response.error) {
    if (response.error.status && INVALID_CREDENTIALS_ERROR_CODES.includes(response.error.status)) {
      redirect('/login?error=Invalid credentials. Please try again.')
    } else {
      handleError()
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  // todo: validate all inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const response = await supabase.auth.signUp(data)

  console.log('signup after supabase', response);
  if (response.error) {

    handleError()
  }

  revalidatePath('/', 'layout')
  redirect('/login?success=Please check your email to confirm your account.')
}
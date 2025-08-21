'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'
import { isEmail, escape } from 'validator'

const INVALID_CREDENTIALS_ERROR_CODES = [400, 401, 403];

function handleError() {
  redirect('/login?error=An error occurred. Please try again.')
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Get and validate form data
  const rawEmail = formData.get('email') as string
  const rawPassword = formData.get('password') as string

  // Validate email
  if (!rawEmail || !isEmail(rawEmail)) {
    redirect('/login?error=Please enter a valid email address')
  }

  // Sanitize inputs
  const data = {
    email: escape(rawEmail),
    password: escape(rawPassword),
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
  const rawEmail = formData.get('email')
  const rawPassword = formData.get('password') as string | null

  if (!rawEmail || typeof rawEmail !== 'string' || !isEmail(rawEmail)) {
    redirect('/login?error=Please enter a valid email address')
  }

  if (!rawPassword || typeof rawPassword !== 'string') {
    redirect('/login?error=Please enter a password')
  }

  // Sanitize inputs
  const data = {
    email: escape(rawEmail),
    password: escape(rawPassword),
  }

  const response = await supabase.auth.signUp(data)

  if (response.error) {

    handleError()
  }

  revalidatePath('/', 'layout')
  redirect('/login?success=Please check your email to confirm your account.')
}

export async function logout() {
  const supabase = await createClient()

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}
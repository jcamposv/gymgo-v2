'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema } from '@/schemas/auth.schema'
import { ROUTES } from '@/lib/constants'

export type ActionState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

const initialState: ActionState = {
  success: false,
  message: '',
}

export async function signInAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validated = loginSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(validated.data)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/', 'layout')
  redirect(ROUTES.DASHBOARD)
}

export async function signUpAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const validated = registerSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  console.log('=== SIGNUP DEBUG ===')
  console.log('Email:', validated.data.email)
  console.log('Redirect URL:', `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`)

  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: { name: validated.data.name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  console.log('Supabase response data:', JSON.stringify(data, null, 2))
  console.log('Supabase response error:', JSON.stringify(error, null, 2))
  console.log('=== END SIGNUP DEBUG ===')

  if (error) {
    console.error('SignUp error details:', {
      code: error.code,
      message: error.message,
      status: error.status,
    })
    return {
      success: false,
      message: error.message,
    }
  }

  return {
    success: true,
    message: 'Revisa tu correo para confirmar tu cuenta',
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(ROUTES.LOGIN)
}

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string

  if (!email) {
    return {
      success: false,
      message: 'El correo es requerido',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  })

  if (error) {
    // Don't reveal if user exists or not for security
    console.error('Error sending reset email:', error)
  }

  // Always return success to not reveal if email exists
  return {
    success: true,
    message: 'Si existe una cuenta con este correo, recibirás un enlace para restablecer tu contraseña',
  }
}

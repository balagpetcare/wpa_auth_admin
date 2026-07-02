'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { useNotificationContext } from '@/context/useNotificationContext'
import useQueryParams from '@/hooks/useQueryParams'
import { useAuth } from '@/context/useAuthContext'
import { clearAuthTokens } from '@/lib/apiClient'

const useSignIn = () => {
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const router = useRouter()
  const { showNotification } = useNotificationContext()
  const { login: authLogin, authError } = useAuth()

  const queryParams = useQueryParams()

  const loginFormSchema = yup.object({
    emailOrUsername: yup.string().required('Please enter your email or username'),
    password: yup.string().required('Please enter your password'),
  })

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(loginFormSchema),
    defaultValues: {
      emailOrUsername: 'admin@wpa.invalid',
      password: '',
    },
  })

  type LoginFormFields = yup.InferType<typeof loginFormSchema>

  const login = handleSubmit(async (values: LoginFormFields) => {
    setLoading(true)
    setLocalError(null)
    try {
      await authLogin(values.emailOrUsername, values.password)
      const redirectPath = queryParams['redirectTo'] ?? '/dashboard'
      showNotification({ message: 'Successfully logged in. Redirecting...', variant: 'success' })
      router.replace(redirectPath)
    } catch (err: any) {
      console.error('Sign-in error:', err)
      setLocalError(err?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  })

  const resetAuthSession = () => {
    clearAuthTokens()
    setLocalError(null)
  }

  return { loading, login, control, authError, localError, resetAuthSession }
}

export default useSignIn

'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { useNotificationContext } from '@/context/useNotificationContext'
import useQueryParams from '@/hooks/useQueryParams'

const useSignIn = () => {
  const [loading, setLoading] = useState(false
  const { push } = useRouter()
  const { showNotification } = useNotificationContext()
  const queryParams = useQueryParams()

  const loginFormSchema = yup.object({
    emailOrUsername: yup.string().required('Please enter your email or username'),
    password: yup.string().required('Please enter your password'),
  }

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(loginFormSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
  }

  type LoginFormFields = yup.InferType<typeof loginFormSchema>

  const login = handleSubmit(async (values: LoginFormFields) => {
    setLoading(true
    try {
      const res = await signIn('credentials', {
        redirect: false,
        emailOrUsername: values.emailOrUsername,
        password: values.password,
      }

      if (res?.ok) {
        push(queryParams['redirectTo'] ?? '/dashboard'
        showNotification({ message: 'Logged in successfully. Redirecting...', variant: 'success' }
      } else {
        const msg = res?.error ?? 'Invalid credentials. Please try again.'
        showNotification({ message: msg, variant: 'danger' }
      }
    } catch {
      showNotification({ message: 'An unexpected error occurred. Please try again.', variant: 'danger' }
    } finally {
      setLoading(false
    }
  }

  return { loading, login, control }
}

export default useSignIn

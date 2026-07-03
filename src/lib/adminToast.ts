import { toast, type ToastOptions, type TypeOptions } from 'react-toastify'

type ToastInput = {
  title: string
  message?: string
}

const baseOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
}

function emit(type: TypeOptions, { title, message }: ToastInput, options?: ToastOptions) {
  const body = message ? `${title}\n${message}` : title
  toast(body, {
    type,
    ...baseOptions,
    ...options,
  })
}

export const adminToast = {
  success: (title: string, message?: string, options?: ToastOptions) => emit('success', { title, message }, options),
  error: (title: string, message?: string, options?: ToastOptions) => emit('error', { title, message }, options),
  warning: (title: string, message?: string, options?: ToastOptions) => emit('warning', { title, message }, options),
  info: (title: string, message?: string, options?: ToastOptions) => emit('info', { title, message }, options),
}

export default adminToast

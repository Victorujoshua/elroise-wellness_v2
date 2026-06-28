'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'
import { contactSchema, type ContactFormValues } from './schema'
import { submitContactForm } from './actions'
import { trackEvent } from '@/lib/analytics'

const inputClass =
  'w-full border-b border-[#E5E0D8] py-4 text-sm font-light focus:border-[#636B2F] outline-none transition-colors bg-transparent placeholder:text-gray-300'
const labelClass =
  'text-[10px] uppercase tracking-widest text-gray-400 mb-2 block font-bold'
const errorClass = 'text-red-400 text-xs mt-1.5 font-light'

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) })

  const onSubmit = (values: ContactFormValues) => {
    startTransition(async () => {
      const result = await submitContactForm(values)
      if (result.success) {
        trackEvent('contact_form_submitted')
        toast.success('Message sent! Our team will be in touch shortly.')
        setSubmitted(true)
        reset()
      } else {
        toast.error(result.error)
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={56} color="#636B2F" strokeWidth={1.5} className="mb-6" />
        <h3 className="font-sora text-3xl mb-4">Message Sent!</h3>
        <p className="text-gray-500 font-light leading-relaxed mb-8">
          Thank you for reaching out. Our team will get back to you shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-xs uppercase tracking-widest text-[#636B2F] border-b border-[#636B2F] pb-1 hover:opacity-70 transition-opacity"
        >
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <>
      <h3 className="font-sora text-3xl mb-10">
        Send a <span className="text-[#636B2F]">message.</span>
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <label className={labelClass}>Your Name</label>
          <input
            {...register('name')}
            className={inputClass}
            placeholder="Full name"
          />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Email Address</label>
          <input
            {...register('email')}
            type="email"
            className={inputClass}
            placeholder="example@email.com"
          />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label className={labelClass}>
            Phone{' '}
            <span className="normal-case tracking-normal font-light text-gray-300">(optional)</span>
          </label>
          <input
            {...register('phone')}
            type="tel"
            className={inputClass}
            placeholder="08012345678"
          />
        </div>

        <div>
          <label className={labelClass}>Message</label>
          <textarea
            {...register('message')}
            rows={5}
            className={`${inputClass} resize-none`}
            placeholder="How can we assist your flow?"
          />
          {errors.message && <p className={errorClass}>{errors.message.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#2D2926] text-white py-5 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#636B2F] transition-colors rounded-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import { contactSchema, type ContactFormValues } from './schema'
import { submitContactForm } from './actions'

const inputClass =
  'w-full border-b border-sand py-4 text-sm font-light focus:border-gold outline-none transition-colors bg-transparent placeholder:text-gray-300'
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
        <CheckCircle size={56} className="text-gold mb-6" strokeWidth={1.5} />
        <h3 className="serif text-3xl mb-4 italic">Message Sent!</h3>
        <p className="text-gray-500 font-light leading-relaxed mb-8">
          Thank you for reaching out. Our team will get back to you shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-xs uppercase tracking-widest text-gold border-b border-gold pb-1 hover:opacity-70 transition-opacity"
        >
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <>
      <h3 className="serif text-3xl mb-10">
        Send a <span className="italic text-gold">message.</span>
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <label htmlFor="contact-name" className={labelClass}>Your Name</label>
          <input
            id="contact-name"
            {...register('name')}
            className={inputClass}
            placeholder="Full name"
          />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="contact-email" className={labelClass}>Email Address</label>
          <input
            id="contact-email"
            {...register('email')}
            type="email"
            className={inputClass}
            placeholder="example@email.com"
          />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="contact-phone" className={labelClass}>
            Phone{' '}
            <span className="normal-case tracking-normal font-light text-gray-300">(optional)</span>
          </label>
          <input
            id="contact-phone"
            {...register('phone')}
            type="tel"
            className={inputClass}
            placeholder="08012345678"
          />
        </div>

        <div>
          <label htmlFor="contact-message" className={labelClass}>Message</label>
          <textarea
            id="contact-message"
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
          className="w-full bg-charcoal text-white py-5 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-gold transition-colors rounded-sm shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </>
  )
}

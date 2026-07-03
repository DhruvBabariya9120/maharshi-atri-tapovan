import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { FieldWrap, Input, Textarea } from '../ui/Field'

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  mobile: z.string().regex(/^[0-9+\-\s]{10,15}$/, 'Enter a valid mobile number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  message: z.string().min(5, 'Please write a short message'),
})

type FormValues = z.infer<typeof schema>

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(_data: FormValues) {
    // TODO: connect to email / WhatsApp / school office.
    await new Promise((r) => setTimeout(r, 900))
    toast.success('Message sent! Our office will get back to you shortly.')
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldWrap label="Your Name" htmlFor="c-name" required error={errors.name?.message}>
          <Input id="c-name" placeholder="Full name" error={errors.name?.message} {...register('name')} />
        </FieldWrap>
        <FieldWrap label="Mobile Number" htmlFor="c-mobile" required error={errors.mobile?.message}>
          <Input id="c-mobile" type="tel" inputMode="tel" placeholder="+91 " error={errors.mobile?.message} {...register('mobile')} />
        </FieldWrap>
      </div>

      <FieldWrap label="Email" htmlFor="c-email" hint="Optional" error={errors.email?.message}>
        <Input id="c-email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
      </FieldWrap>

      <FieldWrap label="Message" htmlFor="c-message" required error={errors.message?.message}>
        <Textarea id="c-message" rows={5} placeholder="How can we help?" error={errors.message?.message} {...register('message')} />
      </FieldWrap>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-medium text-brand-fg shadow-[0_8px_20px_-8px_rgba(29,78,216,0.6)] transition-all duration-200 hover:bg-brand-dark hover:-translate-y-0.5 disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            Send Message <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  )
}

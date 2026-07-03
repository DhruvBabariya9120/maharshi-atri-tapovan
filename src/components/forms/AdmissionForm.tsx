import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { FieldWrap, Input, Select, Textarea } from '../ui/Field'
import { admissions } from '../../data/site'

const schema = z.object({
  studentName: z.string().min(2, 'Please enter the student’s full name'),
  standard: z.string().min(1, 'Please select a standard'),
  parentName: z.string().min(2, 'Please enter the parent / guardian name'),
  mobile: z
    .string()
    .regex(/^[0-9+\-\s]{10,15}$/, 'Enter a valid mobile number'),
  city: z.string().optional(),
  question: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function AdmissionForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(_data: FormValues) {
    // TODO: connect to email / WhatsApp / Google Sheet or school ERP.
    await new Promise((r) => setTimeout(r, 900))
    toast.success(admissions.successMessage)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <FieldWrap label="Student's Full Name" htmlFor="studentName" required error={errors.studentName?.message}>
        <Input id="studentName" placeholder="e.g. Aarav Patel" error={errors.studentName?.message} {...register('studentName')} />
      </FieldWrap>

      <FieldWrap label="Admission Sought for Standard" htmlFor="standard" required error={errors.standard?.message}>
        <Select id="standard" defaultValue="" error={errors.standard?.message} {...register('standard')}>
          <option value="" disabled>
            Select a standard
          </option>
          {admissions.standards.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </FieldWrap>

      <FieldWrap label="Parent / Guardian Name" htmlFor="parentName" required error={errors.parentName?.message}>
        <Input id="parentName" placeholder="Full name" error={errors.parentName?.message} {...register('parentName')} />
      </FieldWrap>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldWrap label="Mobile Number" htmlFor="mobile" required error={errors.mobile?.message}>
          <Input id="mobile" type="tel" inputMode="tel" placeholder="+91 " error={errors.mobile?.message} {...register('mobile')} />
        </FieldWrap>
        <FieldWrap label="Village / City" htmlFor="city" error={errors.city?.message}>
          <Input id="city" placeholder="Optional" {...register('city')} />
        </FieldWrap>
      </div>

      <FieldWrap label="Your Question" htmlFor="question" hint="Optional" error={errors.question?.message}>
        <Textarea id="question" rows={4} placeholder="Anything you'd like to ask us?" {...register('question')} />
      </FieldWrap>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-accent-fg shadow-[0_8px_20px_-8px_rgba(244,114,182,0.7)] transition-all duration-200 hover:bg-accent-strong hover:-translate-y-0.5 disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            Request a Call Back <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  )
}

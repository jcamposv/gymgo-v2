'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { createExpense } from '@/actions/finance.actions'
import {
  expenseSchema,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseFormData,
  type ExpenseCategory,
} from '@/schemas/finance.schema'
import { getCurrencySymbol } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface ExpenseFormProps {
  currency: string
}

export function ExpenseForm({ currency }: ExpenseFormProps) {
  const router = useRouter()
  const symbol = getCurrencySymbol(currency)

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      category: 'other',
      expense_date: new Date(),
      vendor: '',
      receipt_url: '',
      notes: '',
      is_recurring: false,
    },
  })

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      const result = await createExpense(data)

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/finances/expenses')
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof ExpenseFormData, {
              message: Array.isArray(errors) ? errors[0] : errors,
            })
          })
        }
      }
    } catch {
      toast.error('Error al registrar el gasto')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacion del gasto</CardTitle>
              <CardDescription>
                Registra un nuevo gasto del gimnasio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripcion *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Pago de renta mensual"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto ({currency}) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">
                            {symbol}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="pl-8"
                            placeholder="0.00"
                            value={field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="expense_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha del gasto</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value instanceof Date
                            ? field.value.toISOString().split('T')[0]
                            : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre del proveedor"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_recurring"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Gasto recurrente</FormLabel>
                      <FormDescription>
                        Marcar si este gasto se repite mensualmente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales sobre el gasto..."
                        rows={3}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/finances/expenses')}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar gasto'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}

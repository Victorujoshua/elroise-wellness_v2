'use client'

import { useEffect, useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteTeamMember } from '@/app/(admin)/admin/(dashboard)/team/actions'

interface Props {
  open: boolean
  onClose: () => void
}

export default function InviteDialog({ open, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<'owner' | 'staff' | 'practitioner'>('practitioner')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setRole('practitioner')
      setError(null)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await inviteTeamMember({
        full_name: fd.get('full_name') as string,
        email:     fd.get('email') as string,
        role,
      })
      if (result.success) {
        toast.success('Invitation sent')
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md flex flex-col gap-0 p-0" showCloseButton={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">Invite team member</DialogTitle>
          <DialogClose render={<Button variant="ghost" size="icon-sm" type="button" />} onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inv-name">Full name *</Label>
            <Input id="inv-name" name="full_name" required placeholder="e.g. Sarah Johnson" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-email">Email *</Label>
            <Input id="inv-email" name="email" type="email" required placeholder="sarah@example.com" />
          </div>

          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Select value={role} onValueChange={val => setRole(val as typeof role)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practitioner">Practitioner</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <DialogClose render={<Button variant="outline" type="button" onClick={onClose} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Sending…' : 'Send invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

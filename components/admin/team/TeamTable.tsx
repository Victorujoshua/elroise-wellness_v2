'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import InviteDialog from './InviteDialog'
import EditMemberDialog from './EditMemberDialog'
import { toggleMemberActive, revokeInvite } from '@/app/(admin)/admin/(dashboard)/team/actions'
import type { MemberWithServices, ServiceOption } from '@/app/(admin)/admin/(dashboard)/team/actions'
import type { InvitationRow } from '@/lib/database.types'

const ROLE_STYLES: Record<string, string> = {
  owner:        'bg-[#636B2F]/15 text-[#636B2F]',
  practitioner: 'bg-teal-100 text-teal-700',
  staff:        'bg-blue-100 text-blue-700',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
      ROLE_STYLES[role] ?? 'bg-muted text-muted-foreground',
    )}>
      {role}
    </span>
  )
}

interface Props {
  members: MemberWithServices[]
  pendingInvites: InvitationRow[]
  services: ServiceOption[]
}

export default function TeamTable({ members, pendingInvites, services }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [inviteOpen, setInviteOpen]     = useState(false)
  const [editMember, setEditMember]     = useState<MemberWithServices | null>(null)
  const [togglingId, setTogglingId]     = useState<string | null>(null)
  const [revokingId, setRevokingId]     = useState<string | null>(null)

  function handleToggle(member: MemberWithServices) {
    setTogglingId(member.id)
    startTransition(async () => {
      const result = await toggleMemberActive(member.id, !member.is_active)
      setTogglingId(null)
      if (result.success) {
        toast.success(member.is_active ? 'Access disabled' : 'Access enabled')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleRevoke(invite: InvitationRow) {
    setRevokingId(invite.id)
    startTransition(async () => {
      const result = await revokeInvite(invite.id)
      setRevokingId(null)
      if (result.success) {
        toast.success('Invitation revoked')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Team</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} member{members.length !== 1 ? 's' : ''}
            {pendingInvites.length > 0 && ` · ${pendingInvites.length} pending`}
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-1.5">
          <UserPlus className="size-3.5" />
          Invite member
        </Button>
      </div>

      {/* Active members */}
      <div className="border border-border overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Role</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Services</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Active</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No team members yet. Invite someone to get started.
                  </td>
                </tr>
              ) : (
                members.map(member => (
                  <tr
                    key={member.id}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors',
                      !member.is_active && 'opacity-60',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{member.full_name}</div>
                      {member.phone && (
                        <div className="text-xs text-muted-foreground mt-0.5">{member.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {member.role === 'staff' ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span className="inline-flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium">
                          {member.service_ids.length}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={member.is_active}
                        onCheckedChange={() => handleToggle(member)}
                        disabled={togglingId === member.id}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditMember(member)}
                        aria-label={`Edit ${member.full_name}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">
            Pending invitations
          </p>
          <div className="border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Sent</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map(invite => (
                    <tr key={invite.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{invite.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{invite.email}</td>
                      <td className="px-4 py-3"><RoleBadge role={invite.role} /></td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(invite.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRevoke(invite)}
                          disabled={revokingId === invite.id}
                          aria-label={`Revoke invite for ${invite.email}`}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <EditMemberDialog
        open={editMember !== null}
        onClose={() => setEditMember(null)}
        member={editMember}
        services={services}
      />
    </>
  )
}

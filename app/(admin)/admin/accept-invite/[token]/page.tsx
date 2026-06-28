import Link from 'next/link'
import { getSupabaseServiceClient } from '@/lib/supabase/server'
import AcceptInviteForm from './AcceptInviteForm'

interface Props {
  params: Promise<{ token: string }>
}

function ErrorCard({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="min-h-screen bg-[#F3EFEA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl text-[#2D2926] tracking-wide mb-6">Elroisè</h1>
        <div className="bg-white rounded-xl shadow-sm border border-[#2D2926]/10 p-8">
          <p className="text-sm font-medium text-[#2D2926] mb-2">{heading}</p>
          <p className="text-xs text-[#2D2926]/50 mb-6">{body}</p>
          <Link href="/admin/login" className="text-xs text-[#636B2F] hover:underline">
            Go to sign in →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function AcceptInvitePage({ params }: Props) {
  const { token } = await params
  const db = getSupabaseServiceClient()

  const { data: invite } = await db
    .from('invitations')
    .select('full_name, email, role, accepted_at')
    .eq('token', token)
    .maybeSingle()

  if (!invite) {
    return (
      <ErrorCard
        heading="Invitation not found"
        body="This link is invalid or has already been used."
      />
    )
  }

  if (invite.accepted_at) {
    return (
      <ErrorCard
        heading="Already accepted"
        body="This invitation has already been used."
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F3EFEA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-[#2D2926] tracking-wide">Elroisè</h1>
          <p className="text-sm text-[#2D2926]/60 mt-1">Admin Portal</p>
        </div>
        <AcceptInviteForm
          token={token}
          defaultName={invite.full_name}
          email={invite.email}
          role={invite.role}
        />
      </div>
    </div>
  )
}

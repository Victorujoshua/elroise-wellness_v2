'use server'

import { updateAppointmentStatus as _updateStatus } from '@/app/(admin)/admin/(dashboard)/appointments/actions'
import type { AppointmentRow } from '@/lib/database.types'

type Status = AppointmentRow['status']
type ActionResult = { success: true } | { success: false; error: string }

export async function updateAppointmentStatus(
  id: string,
  status: Status,
): Promise<ActionResult> {
  return _updateStatus(id, status)
}

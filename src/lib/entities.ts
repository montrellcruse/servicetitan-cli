import {getBoolean, getNumber, getPathValue, getString} from './data.js'
import type {UnknownRecord} from './types.js'

export function toCustomerSummary(input: unknown): UnknownRecord {
  return {
    id: getNumber(input, ['id']) ?? getString(input, ['id']) ?? '',
    name: getDisplayName(input),
    phone: getString(input, ['phone', 'phoneNumber', 'mobilePhone', 'homePhone']) ?? '',
    email: getString(input, ['email', 'emailAddress']) ?? '',
    active: getBoolean(input, ['active', 'isActive']) ?? false,
    created: getString(input, ['createdOn', 'createdAt', 'createdDate']) ?? '',
  }
}

export function toCustomerDetail(input: unknown): UnknownRecord {
  return {
    ...toCustomerSummary(input),
    address: getString(input, ['address.street', 'address.line1', 'street']) ?? '',
    city: getString(input, ['address.city', 'city']) ?? '',
    state: getString(input, ['address.state', 'state']) ?? '',
    zip: getString(input, ['address.zip', 'address.postalCode', 'zip']) ?? '',
  }
}

export function toJobSummary(input: unknown): UnknownRecord {
  return {
    id: getNumber(input, ['id']) ?? getString(input, ['id']) ?? '',
    status: getString(input, ['status']) ?? '',
    customer: getString(input, ['customer.name', 'customerName']) ?? '',
    type: getString(input, ['jobType.name', 'jobTypeName', 'type']) ?? '',
    scheduled: getString(input, ['scheduledOn', 'scheduledDate', 'startTime']) ?? '',
    total: getNumber(input, ['total', 'totalAmount', 'invoice.total']) ?? 0,
  }
}

export function toJobDetail(input: unknown): UnknownRecord {
  return {
    ...toJobSummary(input),
    summary: getString(input, ['summary', 'description']) ?? '',
    businessUnit: getString(input, ['businessUnit.name', 'businessUnitName']) ?? '',
    technician: getString(input, ['technician.name', 'assignedTechnician.name', 'technicianName']) ?? '',
    created: getString(input, ['createdOn', 'createdAt']) ?? '',
  }
}

export function toInvoiceSummary(input: unknown): UnknownRecord {
  return {
    id: getNumber(input, ['id']) ?? getString(input, ['id']) ?? '',
    status: getString(input, ['status']) ?? '',
    customer: getString(input, ['customer.name', 'customerName']) ?? '',
    total: getNumber(input, ['total', 'totalAmount', 'invoiceTotal']) ?? 0,
    balance: getNumber(input, ['balance', 'balanceAmount']) ?? 0,
    created: getString(input, ['createdOn', 'createdAt', 'createdDate']) ?? '',
  }
}

export function toInvoiceDetail(input: unknown): UnknownRecord {
  return {
    ...toInvoiceSummary(input),
    jobId: getNumber(input, ['jobId']) ?? getString(input, ['jobId']) ?? '',
    invoiceNumber: getString(input, ['invoiceNumber', 'number']) ?? '',
    dueDate: getString(input, ['dueDate']) ?? '',
  }
}

export function toTechnicianSummary(input: unknown): UnknownRecord {
  return {
    id: getNumber(input, ['id']) ?? getString(input, ['id']) ?? '',
    name: getDisplayName(input),
    phone: getString(input, ['phone', 'phoneNumber', 'mobilePhone']) ?? '',
    email: getString(input, ['email', 'emailAddress']) ?? '',
    active: getBoolean(input, ['active', 'isActive']) ?? false,
  }
}

export function toTechnicianDetail(input: unknown): UnknownRecord {
  return {
    ...toTechnicianSummary(input),
    businessUnit: getString(input, ['businessUnit.name', 'businessUnitName']) ?? '',
    employeeId: getNumber(input, ['employeeId']) ?? getString(input, ['employeeId']) ?? '',
  }
}

export function toMembershipSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'membershipId']),
    type: getString(input, ['membershipType.name', 'membershipTypeName', 'type.name', 'type']) ?? '',
    customer: getString(input, ['customer.name', 'customerName']) ?? '',
    status: getString(input, ['status']) ?? '',
    start: getString(input, ['startDate', 'membershipStartDate', 'start']) ?? '',
    end: getString(input, ['endDate', 'membershipEndDate', 'expirationDate', 'expiresOn']) ?? '',
    recurring: getBoolean(input, ['isRecurring', 'recurring', 'billing.recurring']) ?? false,
  }
}

export function toMembershipDetail(input: unknown): UnknownRecord {
  return {
    ...toMembershipSummary(input),
    customerId: getIdentifier(input, ['customer.id', 'customerId']),
    locationId: getIdentifier(input, ['location.id', 'locationId']),
    price: getNumber(input, ['price', 'amount', 'membershipPrice']) ?? 0,
    billingFrequency:
      getString(input, ['billingFrequency', 'billing.frequency', 'recurrence.frequency']) ?? '',
    created: getString(input, ['createdOn', 'createdAt']) ?? '',
  }
}

export function toMembershipTypeSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'membershipTypeId']),
    name: getString(input, ['name', 'displayName']) ?? '',
    duration: getNumber(input, ['duration', 'durationMonths', 'termMonths']) ?? 0,
    price: getNumber(input, ['price', 'amount']) ?? 0,
    active: getBoolean(input, ['active', 'isActive']) ?? false,
  }
}

export function toEstimateSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'estimateId']),
    status: getString(input, ['status']) ?? '',
    customer: getString(input, ['customer.name', 'customerName']) ?? '',
    job: getIdentifier(input, ['job.id', 'jobId', 'jobNumber']),
    total: getNumber(input, ['total', 'totalAmount', 'soldTotal']) ?? 0,
    created: getString(input, ['createdOn', 'createdAt', 'createdDate']) ?? '',
  }
}

export function toEstimateDetail(input: unknown): UnknownRecord {
  return {
    ...toEstimateSummary(input),
    name: getString(input, ['name', 'summary', 'description']) ?? '',
    soldOn: getString(input, ['soldOn', 'soldAt']) ?? '',
    dismissedOn: getString(input, ['dismissedOn', 'dismissedAt']) ?? '',
    createdBy: getString(input, ['createdBy.name', 'createdByName']) ?? '',
  }
}

export function toLeadSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'leadId']),
    status: getString(input, ['status']) ?? '',
    customer: getString(input, ['customer.name', 'customerName', 'name']) ?? '',
    campaign: getString(input, ['campaign.name', 'campaignName']) ?? '',
    created: getString(input, ['createdOn', 'createdAt', 'createdDate']) ?? '',
  }
}

export function toLeadDetail(input: unknown): UnknownRecord {
  return {
    ...toLeadSummary(input),
    phone: getString(input, ['phone', 'phoneNumber']) ?? '',
    email: getString(input, ['email', 'emailAddress']) ?? '',
    assignedTo: getString(input, ['assignedTo.name', 'assignedToName', 'owner.name']) ?? '',
    source: getString(input, ['source', 'leadSource', 'bookingSource']) ?? '',
  }
}

export function toBookingSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'bookingId']),
    status: getString(input, ['status']) ?? '',
    customer: getString(input, ['customer.name', 'customerName', 'name']) ?? '',
    source:
      getString(input, ['source', 'bookingSource', 'provider.name', 'providerName', 'campaign.name', 'campaignName']) ??
      '',
    created: getString(input, ['createdOn', 'createdAt', 'createdDate']) ?? '',
  }
}

export function toBookingDetail(input: unknown): UnknownRecord {
  return {
    ...toBookingSummary(input),
    phone: getString(input, ['phone', 'phoneNumber', 'customer.phone', 'customer.phoneNumber']) ?? '',
    email: getString(input, ['email', 'emailAddress', 'customer.email', 'customer.emailAddress']) ?? '',
    address: getString(input, ['address.street', 'address.line1', 'street']) ?? '',
    notes: getString(input, ['notes', 'note', 'summary', 'description']) ?? '',
  }
}

export function toPricebookServiceSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'serviceId']),
    name: getString(input, ['name', 'displayName']) ?? '',
    price: getNumber(input, ['price', 'amount']) ?? 0,
    duration: getNumber(input, ['duration', 'durationMinutes', 'estimatedDuration']) ?? 0,
    active: getBoolean(input, ['active', 'isActive']) ?? false,
  }
}

export function toPricebookMaterialSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'materialId']),
    name: getString(input, ['name', 'displayName']) ?? '',
    price: getNumber(input, ['price', 'amount']) ?? 0,
    unitCost: getNumber(input, ['unitCost', 'cost']) ?? 0,
    active: getBoolean(input, ['active', 'isActive']) ?? false,
  }
}

export function toPricebookEquipmentSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'equipmentId']),
    name: getString(input, ['name', 'displayName']) ?? '',
    price: getNumber(input, ['price', 'amount']) ?? 0,
    active: getBoolean(input, ['active', 'isActive']) ?? false,
  }
}

export function toAppointmentAssignmentSummary(input: unknown): UnknownRecord {
  return {
    appointment: getIdentifier(input, ['appointmentId', 'appointment.id', 'id']),
    job: getIdentifier(input, ['jobId', 'job.id']),
    tech:
      getString(input, ['technician.name', 'technicianName', 'employee.name', 'assignedTechnician.name']) ??
      '',
    start: getString(input, ['start', 'startTime', 'startsOn', 'scheduledStart', 'appointment.start']) ?? '',
    end: getString(input, ['end', 'endTime', 'endsOn', 'scheduledEnd', 'appointment.end']) ?? '',
    status: getString(input, ['status']) ?? '',
  }
}

export function toCapacitySummary(input: unknown): UnknownRecord {
  return {
    businessUnit:
      getString(input, ['businessUnit.name', 'businessUnitName', 'name', 'businessUnit']) ?? '',
    available: getNumber(input, ['available', 'availableCount', 'availableCapacity']) ?? 0,
    scheduled: getNumber(input, ['scheduled', 'scheduledCount', 'scheduledCapacity']) ?? 0,
  }
}

export function toReportCategoryRows(input: unknown): UnknownRecord[] {
  const records = Array.isArray(input)
    ? input
    : Array.isArray(getPathValue(input, 'data'))
      ? (getPathValue(input, 'data') as unknown[])
      : [input]

  return records.flatMap(record => toReportRows(record))
}

function getDisplayName(input: unknown): string {
  return (
    getString(input, ['name', 'displayName', 'fullName']) ??
    [getString(input, ['firstName']) ?? '', getString(input, ['lastName']) ?? '']
      .join(' ')
      .trim()
  )
}

function getIdentifier(input: unknown, paths: string[]): number | string {
  return getNumber(input, paths) ?? getString(input, paths) ?? ''
}

function toReportRows(input: unknown): UnknownRecord[] {
  if (!input || typeof input !== 'object') {
    return []
  }

  const categoryName = getString(input, ['name', 'categoryName', 'category.name']) ?? ''
  const reports = getPathValue(input, 'reports')

  if (Array.isArray(reports) && reports.length > 0) {
    return reports.map(report => ({
      category: categoryName || (getString(report, ['categoryName', 'category.name']) ?? ''),
      report: getString(report, ['name', 'reportName', 'report']) ?? '',
      id: getIdentifier(report, ['id', 'reportId']),
    }))
  }

  const reportName = getString(input, ['reportName', 'report.name', 'report', 'name']) ?? ''
  const rowCategory =
    getString(input, ['categoryName', 'category.name', 'category']) ??
    (reportName ? categoryName : '')

  if (!rowCategory && !reportName) {
    return []
  }

  return [
    {
      category: rowCategory,
      report: reportName,
      id: getIdentifier(input, ['reportId', 'id']),
    },
  ]
}

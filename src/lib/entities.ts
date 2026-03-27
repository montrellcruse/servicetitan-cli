import {getBoolean, getNumber, getPathValue, getString} from './data.js'
import type {UnknownRecord} from './types.js'

export function toCustomerSummary(input: unknown): UnknownRecord {
  // ST API: contacts[] array with type 'MobilePhone', 'Phone', 'Email', isDefault: true
  const contacts = Array.isArray(getPathValue(input, 'contacts')) ? (getPathValue(input, 'contacts') as UnknownRecord[]) : []
  const phone =
    (contacts.find((c) => (getString(c, ['type']) === 'MobilePhone' || getString(c, ['type']) === 'Phone') && getBoolean(c, ['isDefault']))?.value as string | undefined) ??
    (contacts.find((c) => getString(c, ['type']) === 'MobilePhone' || getString(c, ['type']) === 'Phone')?.value as string | undefined) ??
    getString(input, ['phone', 'phoneNumber', 'mobilePhone', 'homePhone']) ?? ''
  const email =
    (contacts.find((c) => getString(c, ['type']) === 'Email' && getBoolean(c, ['isDefault']))?.value as string | undefined) ??
    (contacts.find((c) => getString(c, ['type']) === 'Email')?.value as string | undefined) ??
    getString(input, ['email', 'emailAddress']) ?? ''
  return {
    id: getNumber(input, ['id']) ?? getString(input, ['id']) ?? '',
    name: getDisplayName(input),
    phone,
    email,
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

export function toLocationSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'locationId']),
    name: getString(input, ['name', 'displayName']) ?? '',
    address: getString(input, ['address.street', 'address.line1', 'street']) ?? '',
    city: getString(input, ['address.city', 'city']) ?? '',
    state: getString(input, ['address.state', 'state']) ?? '',
    zip: getString(input, ['address.zip', 'address.postalCode', 'zip']) ?? '',
    customerId: getIdentifier(input, ['customer.id', 'customerId']),
    active: getBoolean(input, ['active', 'isActive']) ?? false,
  }
}

export function toLocationDetail(input: unknown): UnknownRecord {
  return {
    ...toLocationSummary(input),
    contacts: getArrayValue(input, ['contacts']),
    notes: getArrayValue(input, ['notes', 'memoNotes']),
  }
}

export function toJobSummary(input: unknown): UnknownRecord {
  // ST jobs list endpoint returns IDs only; use 'st jobs get <id>' for resolved names.
  const customer =
    getString(input, ['customer.name', 'customerName']) ??
    String(getNumber(input, ['customerId']) ?? getString(input, ['customerId']) ?? '')
  const type =
    getString(input, ['jobType.name', 'jobTypeName']) ??
    String(getNumber(input, ['jobTypeId']) ?? getString(input, ['jobTypeId']) ?? '')
  return {
    id: getNumber(input, ['id']) ?? getString(input, ['id']) ?? '',
    status: getString(input, ['jobStatus', 'status']) ?? '',
    customer,
    type,
    scheduled: getString(input, ['scheduledDate', 'completedOn', 'createdOn']) ?? '',
    total: parseCurrencyValue(
      getPathValue(input, 'total') ?? getPathValue(input, 'totalAmount') ?? getPathValue(input, 'invoice.total'),
    ),
  }
}

export function toJobDetail(input: unknown): UnknownRecord {
  const businessUnit =
    getString(input, ['businessUnit.name', 'businessUnitName']) ??
    String(getNumber(input, ['businessUnitId']) ?? getString(input, ['businessUnitId']) ?? '')
  return {
    ...toJobSummary(input),
    summary: getString(input, ['summary', 'description']) ?? '',
    businessUnit,
    technician: getString(input, ['technician.name', 'assignedTechnician.name', 'technicianName']) ?? '',
    created: getString(input, ['createdOn', 'createdAt']) ?? '',
  }
}

export function toInvoiceSummary(input: unknown): UnknownRecord {
  const statusRaw = getPathValue(input, 'status')
  const status =
    typeof statusRaw === 'object' && statusRaw !== null
      ? (getString(statusRaw, ['name', 'value']) ?? '')
      : (typeof statusRaw === 'string'
          ? statusRaw
          : (getString(input, ['syncStatus', 'sentStatus', 'reviewStatus']) ?? ''))
  const customer =
    getString(input, ['customer.name', 'customerName']) ??
    String(getNumber(input, ['customerId']) ?? getString(input, ['customerId']) ?? '')
  return {
    id: getNumber(input, ['id']) ?? getString(input, ['id']) ?? '',
    status,
    customer,
    total: parseCurrencyValue(
      getPathValue(input, 'total') ?? getPathValue(input, 'totalAmount') ?? getPathValue(input, 'invoiceTotal'),
    ),
    balance: parseCurrencyValue(getPathValue(input, 'balance') ?? getPathValue(input, 'balanceAmount')),
    subTotal: parseCurrencyValue(
      getPathValue(input, 'subTotal') ?? getPathValue(input, 'subtotal') ?? getPathValue(input, 'subTotalAmount'),
    ),
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

export function toBusinessUnitSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'businessUnitId']),
    name: getString(input, ['name', 'displayName']) ?? '',
    active: getBoolean(input, ['active', 'isActive']) ?? false,
  }
}

export function toEmployeeSummary(input: unknown): UnknownRecord {
  const roles = getArrayValue(input, ['roles'])

  return {
    id: getIdentifier(input, ['id', 'employeeId']),
    name: getDisplayName(input),
    email: getString(input, ['email', 'emailAddress', 'workEmail']) ?? '',
    phoneNumber: getString(input, ['phoneNumber', 'phone', 'mobilePhone']) ?? '',
    role:
      getString(input, ['role.name', 'roleName', 'title', 'position']) ??
      getString(roles[0], ['name', 'roleName', 'title']) ??
      '',
    active: getBoolean(input, ['active', 'isActive']) ?? false,
  }
}

export function toMembershipSummary(input: unknown): UnknownRecord {
  // ST API: from/to (not start/end), membershipTypeId (ID), customerId (ID)
  const statusRaw = getPathValue(input, 'status')
  const status = typeof statusRaw === 'string' ? statusRaw : (getString(statusRaw, ['value', 'name']) ?? '')
  const type =
    getString(input, ['membershipType.name', 'membershipTypeName']) ??
    String(getNumber(input, ['membershipTypeId']) ?? getString(input, ['membershipTypeId']) ?? '')
  const customer =
    getString(input, ['customer.name', 'customerName']) ??
    String(getNumber(input, ['customerId']) ?? getString(input, ['customerId']) ?? '')
  return {
    id: getIdentifier(input, ['id', 'membershipId']),
    type,
    customer,
    status,
    start: getString(input, ['from', 'startDate', 'membershipStartDate', 'start']) ?? '',
    end: getString(input, ['to', 'endDate', 'membershipEndDate', 'expirationDate', 'expiresOn']) ?? '',
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
  const statusRaw = getPathValue(input, 'status')
  const status =
    typeof statusRaw === 'object' && statusRaw !== null
      ? (getString(statusRaw, ['name']) ?? String(getString(statusRaw, ['value']) ?? ''))
      : (typeof statusRaw === 'string' ? statusRaw : '')
  const customer =
    getString(input, ['customer.name', 'customerName']) ??
    String(getNumber(input, ['customerId']) ?? getString(input, ['customerId']) ?? '')
  return {
    id: getIdentifier(input, ['id', 'estimateId']),
    status,
    customer,
    job: getIdentifier(input, ['jobId', 'job.id', 'jobNumber']),
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

export function toJobTypeSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'jobTypeId']),
    name: getString(input, ['name', 'displayName']) ?? '',
    duration: getNumber(input, ['duration', 'durationMinutes', 'estimatedDuration']) ?? 0,
    active: getBoolean(input, ['active', 'isActive']) ?? false,
  }
}

export function toAppointmentSummary(input: unknown): UnknownRecord {
  const statusRaw = getPathValue(input, 'status')
  const status = typeof statusRaw === 'string' ? statusRaw : (getString(statusRaw, ['value', 'name']) ?? '')

  return {
    id: getIdentifier(input, ['id', 'appointmentId']),
    jobId: getIdentifier(input, ['jobId', 'job.id']),
    appointmentNumber: getString(input, ['appointmentNumber', 'number']) ?? '',
    start: getString(input, ['start', 'startsOn', 'scheduledStart']) ?? '',
    end: getString(input, ['end', 'endsOn', 'scheduledEnd']) ?? '',
    arrivalWindowStart: getString(input, ['arrivalWindowStart']) ?? '',
    arrivalWindowEnd: getString(input, ['arrivalWindowEnd']) ?? '',
    status,
    isConfirmed: getBoolean(input, ['isConfirmed', 'confirmed']) ?? false,
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
  const statusRaw = getPathValue(input, 'status')
  const status = typeof statusRaw === 'string' ? statusRaw : (getString(statusRaw, ['value', 'name']) ?? '')
  return {
    appointment: getIdentifier(input, ['appointmentId', 'appointment.id', 'id']),
    job: getIdentifier(input, ['jobId', 'job.id']),
    tech:
      getString(input, ['technician.name', 'technicianName', 'employee.name', 'assignedTechnician.name']) ??
      '',
    assignedOn: getString(input, ['assignedOn', 'createdOn']) ?? '',
    status,
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

export function toCallSummary(input: unknown): UnknownRecord {
  const statusRaw = getPathValue(input, 'status')
  const status = typeof statusRaw === 'string' ? statusRaw : (getString(statusRaw, ['value', 'name']) ?? '')

  return {
    id: getIdentifier(input, ['id', 'callId']),
    status,
    duration: getNumber(input, ['duration', 'durationSeconds', 'talkTime']) ?? 0,
    createdOn: getString(input, ['createdOn', 'createdAt', 'startTime']) ?? '',
    answeredBy:
      getString(input, ['answeredBy.name', 'answeredByName', 'agent.name', 'employee.name']) ?? '',
    customer:
      getString(input, ['customer.name', 'customerName', 'caller.name', 'callerName', 'name']) ?? '',
    reason: getString(input, ['callReason.name', 'reason.name', 'reason']) ?? '',
  }
}

export function toPayrollSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'payrollId']),
    employee:
      getString(input, ['employee.name', 'employeeName']) ??
      String(getIdentifier(input, ['employeeId', 'employee.id'])),
    technician:
      getString(input, ['technician.name', 'technicianName']) ??
      String(getIdentifier(input, ['technicianId', 'technician.id'])),
    periodStart: getString(input, ['periodStart', 'startsOn', 'startDate']) ?? '',
    periodEnd: getString(input, ['periodEnd', 'endsOn', 'endDate']) ?? '',
    total: getNumber(input, ['total', 'grossPay', 'amount']) ?? 0,
  }
}

export function toTimesheetSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'timesheetId']),
    jobId: getIdentifier(input, ['jobId', 'job.id']),
    technicianId: getIdentifier(input, ['technicianId', 'technician.id']),
    startTime: getString(input, ['startTime', 'startsOn', 'start']) ?? '',
    endTime: getString(input, ['endTime', 'endsOn', 'end']) ?? '',
    duration: getNumber(input, ['duration', 'durationMinutes', 'totalMinutes']) ?? 0,
    activityCode:
      getString(input, ['activityCode.name', 'activityCode.code', 'activityCodeName', 'activityCode']) ??
      '',
  }
}

export function toPurchaseOrderSummary(input: unknown): UnknownRecord {
  const statusRaw = getPathValue(input, 'status')
  const status = typeof statusRaw === 'string' ? statusRaw : (getString(statusRaw, ['value', 'name']) ?? '')

  return {
    id: getIdentifier(input, ['id', 'purchaseOrderId']),
    number: getString(input, ['number', 'purchaseOrderNumber']) ?? '',
    vendor:
      getString(input, ['vendor.name', 'vendorName']) ??
      String(getIdentifier(input, ['vendorId', 'vendor.id'])),
    status,
    date: getString(input, ['date', 'createdOn', 'orderedOn']) ?? '',
    total: getNumber(input, ['total', 'amount', 'totalAmount']) ?? 0,
  }
}

export function toVendorSummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'vendorId']),
    name: getString(input, ['name', 'displayName']) ?? '',
    active: getBoolean(input, ['active', 'isActive']) ?? false,
  }
}

export function toActivitySummary(input: unknown): UnknownRecord {
  return {
    id: getIdentifier(input, ['id', 'activityId']),
    type: getString(input, ['activityType.name', 'activityTypeName', 'type', 'name']) ?? '',
    technician:
      getString(input, ['technician.name', 'technicianName']) ??
      String(getIdentifier(input, ['technicianId', 'technician.id'])),
    date: getString(input, ['date', 'activityDate', 'startTime', 'startsOn']) ?? '',
    duration: getNumber(input, ['duration', 'durationMinutes', 'totalMinutes']) ?? 0,
    jobId: getIdentifier(input, ['jobId', 'job.id']),
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

function getArrayValue(input: unknown, paths: string[]): unknown[] {
  for (const path of paths) {
    const value = getPathValue(input, path)

    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

function parseCurrencyValue(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    return parseFloat(value.replace(/[$,]/g, '')) || 0
  }

  return 0
}

function toReportRows(input: unknown): UnknownRecord[] {
  if (!input || typeof input !== 'object') {
    return []
  }

  const categoryName = getString(input, ['name', 'categoryName', 'category.name']) ?? ''
  const reports = getPathValue(input, 'reports')

  if (Array.isArray(reports)) {
    if (reports.length === 0) {
      return []
    }

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

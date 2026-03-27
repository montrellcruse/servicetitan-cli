import {getBoolean, getNumber, getString} from './data.js'
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

function getDisplayName(input: unknown): string {
  return (
    getString(input, ['name', 'displayName', 'fullName']) ??
    [getString(input, ['firstName']) ?? '', getString(input, ['lastName']) ?? '']
      .join(' ')
      .trim()
  )
}

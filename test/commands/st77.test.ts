import {afterEach, describe, expect, it, vi} from 'vitest'

import AppointmentsSetSummary from '../../src/commands/appointments/set-summary.js'
import EstimateTemplatesGet from '../../src/commands/estimate-templates/get.js'
import EstimateTemplatesList from '../../src/commands/estimate-templates/list.js'
import JobsEquipmentAttach from '../../src/commands/jobs/equipment/attach.js'
import JobsEquipmentDetach from '../../src/commands/jobs/equipment/detach.js'
import JobsEquipmentDetachBulk from '../../src/commands/jobs/equipment/detach-bulk.js'
import JobsEquipmentGet from '../../src/commands/jobs/equipment/get.js'
import JobsList from '../../src/commands/jobs/list.js'
import JobsUpdate from '../../src/commands/jobs/update.js'
import ProposalTemplatesGet from '../../src/commands/proposal-templates/get.js'
import ProposalTemplatesList from '../../src/commands/proposal-templates/list.js'
import ProposalTypesList from '../../src/commands/proposal-types/list.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('ST-77 CLI refresh', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('passes equipmentIds through jobs list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [
        {
          customerId: 9912,
          equipmentIds: [1001, 1002],
          id: 845118,
          jobStatus: 'Scheduled',
          jobTypeId: 87,
          scheduledDate: '2026-03-26T10:30:00Z',
          total: 1240,
        },
      ],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await JobsList.run(['--equipment-ids', '1001,1002'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith(
      '/jobs',
      expect.objectContaining({
        equipmentIds: '1001,1002',
      }),
    )
    expect(stripAnsi(output())).toContain('[1001,1002]')
  })

  it('adds summaryOfWork to guarded jobs update dry-runs', async () => {
    const patchSpy = vi.fn()
    const {output} = createTestContext({
      client: {
        patch: patchSpy,
      },
    })

    await JobsUpdate.run(
      ['845118', '--summary-of-work', 'Replaced capacitor and verified startup.', '--dry-run'],
      process.cwd(),
    )

    const rendered = stripAnsi(output())
    expect(rendered).toContain('[DRY RUN] PATCH /jpm/v2/tenant/12345/jobs/845118')
    expect(rendered).toContain('"summaryOfWork": "Replaced capacitor and verified startup."')
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('gets, attaches, and detaches job equipment through guarded commands', async () => {
    const deleteSpy = vi.fn().mockResolvedValue(undefined)
    const deleteWithBodySpy = vi.fn().mockResolvedValue(undefined)
    const getSpy = vi.fn().mockResolvedValue({equipmentIds: [10, 11]})
    const postSpy = vi.fn().mockResolvedValue({equipmentIds: [10, 11, 12]})
    const {output} = createTestContext({
      client: {
        delete: deleteSpy,
        deleteWithBody: deleteWithBodySpy,
        get: getSpy,
        post: postSpy,
      },
    })

    await JobsEquipmentGet.run(['123'], process.cwd())
    expect(getSpy).toHaveBeenCalledWith('/jobs/123/equipment')
    expect(stripAnsi(output())).toContain('[10,11]')

    await JobsEquipmentAttach.run(['123', '--equipment-ids', '10,11', '--dry-run'], process.cwd())
    expect(stripAnsi(output())).toContain('[DRY RUN] POST /jpm/v2/tenant/12345/jobs/123/equipment')
    expect(postSpy).not.toHaveBeenCalled()

    await JobsEquipmentDetach.run(['123', '--equipment-id', '10', '--yes'], process.cwd())
    expect(deleteSpy).toHaveBeenCalledWith('/jobs/123/equipment/10')

    await JobsEquipmentDetachBulk.run(['123', '--equipment-ids', '10,11', '--yes'], process.cwd())
    expect(deleteWithBodySpy).toHaveBeenCalledWith('/jobs/123/equipment', {
      equipmentIds: [10, 11],
    })
  })

  it('dry-runs appointment summary writes', async () => {
    const postSpy = vi.fn()
    const {output} = createTestContext({
      client: {
        post: postSpy,
      },
    })

    await AppointmentsSetSummary.run(
      ['456', '--technician', '789', '--notes', 'Completed diagnostic summary.', '--dry-run'],
      process.cwd(),
    )

    const rendered = stripAnsi(output())
    expect(rendered).toContain('[DRY RUN] POST /jpm/v2/tenant/12345/appointments/456/summaries')
    expect(rendered).toContain('"technicianId": 789')
    expect(rendered).toContain('"notes": "Completed diagnostic summary."')
    expect(postSpy).not.toHaveBeenCalled()
  })

  it('lists and gets estimate templates', async () => {
    const getSpy = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            active: true,
            businessUnitId: 42,
            id: 101,
            internalName: 'IAQ-Good',
            mode: 'Static',
            modifiedOn: '2026-05-15T00:00:00Z',
            name: 'IAQ Good',
            totalPrice: 499,
          },
        ],
        hasMore: false,
      })
      .mockResolvedValueOnce({
        active: true,
        id: 101,
        internalName: 'IAQ-Good',
        items: [{skuId: 77, skuType: 'Service'}],
        mode: 'Static',
        name: 'IAQ Good',
        summary: 'Good option',
      })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await EstimateTemplatesList.run(['--active', 'Any', '--modified-from', '2026-05-01'], process.cwd())
    expect(getSpy).toHaveBeenCalledWith(
      '/estimate-templates',
      expect.objectContaining({
        active: 'Any',
        modifiedOnOrAfter: '2026-05-01T00:00:00Z',
      }),
    )

    await EstimateTemplatesGet.run(['101'], process.cwd())
    expect(getSpy).toHaveBeenCalledWith('/estimate-templates/101')
    expect(stripAnsi(output())).toContain('IAQ Good')
  })

  it('lists proposal templates and proposal types', async () => {
    const getSpy = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            active: true,
            id: 201,
            modifiedOn: '2026-05-15T00:00:00Z',
            name: 'Standard Proposal',
            proposalTypeId: 301,
            proposalTypeName: 'Residential',
            status: 'Publish',
          },
        ],
        hasMore: false,
      })
      .mockResolvedValueOnce({
        active: true,
        businessUnitIds: [42],
        description: 'Default template',
        estimateAssignments: [],
        id: 201,
        name: 'Standard Proposal',
        proposalTypeId: 301,
        proposalTypeName: 'Residential',
        status: 'Publish',
      })
      .mockResolvedValueOnce({
        data: [
          {
            active: true,
            id: 301,
            isDefault: true,
            isSystemDefault: false,
            name: 'Residential',
            type: 'Options',
          },
        ],
      })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await ProposalTemplatesList.run(['--proposal-type-id', '301'], process.cwd())
    expect(getSpy).toHaveBeenCalledWith(
      '/proposal-templates',
      expect.objectContaining({
        proposalTypeId: 301,
      }),
    )

    await ProposalTemplatesGet.run(['201'], process.cwd())
    expect(getSpy).toHaveBeenCalledWith('/proposal-templates/201')

    await ProposalTypesList.run(['--active', 'True'], process.cwd())
    expect(getSpy).toHaveBeenCalledWith('/proposal-types', {
      active: 'True',
    })
    expect(stripAnsi(output())).toContain('Residential')
  })
})

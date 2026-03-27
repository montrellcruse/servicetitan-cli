import {afterEach, describe, expect, it, vi} from 'vitest'

import ApiGet from '../../src/commands/api/get.js'
import ApiDelete from '../../src/commands/api/delete.js'
import ApiPost from '../../src/commands/api/post.js'
import ApiPut from '../../src/commands/api/put.js'
import {parseParamsFlag} from '../../src/lib/api.js'
import {ServiceTitanClient} from '../../src/lib/client.js'
import {createTestContext, stripAnsi} from '../helpers.js'

const client = new ServiceTitanClient({
  appKey: 'app-key',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  environment: 'integration',
  tenantId: '12345',
})

describe('api escape hatch', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses raw paths as-is without adding a module prefix', () => {
    expect(client.resolveRawPath('customers')).toBe('/customers')
    expect(client.resolveRawPath('/crm/v2/tenant/{tenant}/customers')).toBe(
      '/crm/v2/tenant/12345/customers',
    )
    expect(client.resolvePath('customers')).toBe('/crm/v2/tenant/12345/customers')
  })

  it('parses comma-separated query params', () => {
    expect(parseParamsFlag('pageSize=10,activeOnly=true,status=open')).toEqual({
      activeOnly: true,
      pageSize: 10,
      status: 'open',
    })
  })

  it('passes raw GET requests through without module prefixing', async () => {
    const {getRawSpy, output} = createApiContext()
    getRawSpy.mockResolvedValue([{id: 403219, name: 'Greenway Fitness'}])

    await ApiGet.run(
      ['/crm/v2/tenant/{tenant}/customers', '--params', 'page=2,pageSize=5'],
      process.cwd(),
    )

    expect(getRawSpy).toHaveBeenCalledWith('/crm/v2/tenant/{tenant}/customers', {
      page: 2,
      pageSize: 5,
    })
    expect(stripAnsi(output())).toContain('Greenway Fitness')
  })

  it('supports dry-run mode for raw POST requests', async () => {
    const {output, postRawSpy, putRawSpy, deleteRawSpy} = createApiContext()

    await ApiPost.run(
      [
        '/crm/v2/tenant/{tenant}/customers',
        '--body',
        '{"name":"Greenway Fitness"}',
        '--dry-run',
      ],
      process.cwd(),
    )

    expect(stripAnsi(output())).toContain('[DRY RUN] POST /crm/v2/tenant/12345/customers')
    expect(stripAnsi(output())).toContain('"name": "Greenway Fitness"')
    expect(postRawSpy).not.toHaveBeenCalled()
    expect(putRawSpy).not.toHaveBeenCalled()
    expect(deleteRawSpy).not.toHaveBeenCalled()
  })

  it('supports dry-run mode for raw PUT requests', async () => {
    const {output, postRawSpy, putRawSpy, deleteRawSpy} = createApiContext()

    await ApiPut.run(
      [
        '/crm/v2/tenant/{tenant}/customers/42',
        '--body',
        '{"phone":"602-555-0101"}',
        '--dry-run',
      ],
      process.cwd(),
    )

    expect(stripAnsi(output())).toContain('[DRY RUN] PUT /crm/v2/tenant/12345/customers/42')
    expect(stripAnsi(output())).toContain('"phone": "602-555-0101"')
    expect(postRawSpy).not.toHaveBeenCalled()
    expect(putRawSpy).not.toHaveBeenCalled()
    expect(deleteRawSpy).not.toHaveBeenCalled()
  })

  it('supports dry-run mode for raw DELETE requests', async () => {
    const {output, postRawSpy, putRawSpy, deleteRawSpy} = createApiContext()

    await ApiDelete.run(['/crm/v2/tenant/{tenant}/tags/118', '--dry-run'], process.cwd())

    expect(stripAnsi(output())).toContain('[DRY RUN] DELETE /crm/v2/tenant/12345/tags/118')
    expect(stripAnsi(output())).not.toContain('Body:')
    expect(postRawSpy).not.toHaveBeenCalled()
    expect(putRawSpy).not.toHaveBeenCalled()
    expect(deleteRawSpy).not.toHaveBeenCalled()
  })
})

function createApiContext(): {
  deleteRawSpy: ReturnType<typeof vi.spyOn>
  getRawSpy: ReturnType<typeof vi.spyOn>
  output: () => string
  postRawSpy: ReturnType<typeof vi.spyOn>
  putRawSpy: ReturnType<typeof vi.spyOn>
} {
  const {client: apiClient, output} = createTestContext()
  const getRawSpy = vi.spyOn(apiClient, 'getRaw')
  const postRawSpy = vi.spyOn(apiClient, 'postRaw')
  const putRawSpy = vi.spyOn(apiClient, 'putRaw')
  const deleteRawSpy = vi.spyOn(apiClient, 'deleteRaw')

  return {
    deleteRawSpy,
    getRawSpy,
    output,
    postRawSpy,
    putRawSpy,
  }
}

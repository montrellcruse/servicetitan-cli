// Vitest manual mock for keytar — prevents native binary from loading in test environments
// (keytar requires libsecret on Linux; CI and sandboxed environments may not have it)
// Uses Promise.resolve() explicitly to satisfy @typescript-eslint/require-await.

const store = new Map<string, string>()

const keytar = {
  setPassword(service: string, account: string, password: string): Promise<void> {
    store.set(`${service}:${account}`, password)
    return Promise.resolve()
  },
  getPassword(service: string, account: string): Promise<string | null> {
    return Promise.resolve(store.get(`${service}:${account}`) ?? null)
  },
  deletePassword(service: string, account: string): Promise<boolean> {
    return Promise.resolve(store.delete(`${service}:${account}`))
  },
  findCredentials(service: string): Promise<Array<{account: string; password: string}>> {
    const results: Array<{account: string; password: string}> = []
    for (const [key, value] of store.entries()) {
      if (key.startsWith(`${service}:`)) {
        results.push({account: key.slice(service.length + 1), password: value})
      }
    }
    return Promise.resolve(results)
  },
}

export default keytar

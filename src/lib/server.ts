import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// InternetDB has no auth and no rate-limit key, but it does rate-limit by IP.
// Running the fetch server-side also avoids any CORS issues in the browser.

const inputSchema = z.object({
  ip: z.ipv4({ message: 'Enter a valid IPv4 or IPv6 address' }),
})

export interface InternetDBResult {
  ip: string
  ports: number[]
  hostnames: string[]
  cpes: string[]
  tags: string[]
  vulns: string[]
}

export const lookupHost = createServerFn({ method: 'GET' })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<InternetDBResult> => {
    const res = await fetch(`https://internetdb.shodan.io/${data.ip}`)

    if (res.status === 404) {
      throw new Error('No data found for this host — it may not be indexed by Shodan.')
    }
    if (!res.ok) {
      throw new Error(`InternetDB returned an error (${res.status}).`)
    }

    return (await res.json()) as InternetDBResult
  })
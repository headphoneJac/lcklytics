import { DEFAULT_SPLIT_KEY } from './queries'
import type { DashboardSplitOption } from './types'

export type SplitSearchParams = Promise<{
  split?: string | string[]
}>

export async function resolveSplitKey(searchParams?: SplitSearchParams) {
  const params = searchParams ? await searchParams : {}
  const split = params.split

  if (Array.isArray(split)) return split[0] ?? DEFAULT_SPLIT_KEY
  return split ?? DEFAULT_SPLIT_KEY
}

export function getSplitLabel(
  splits: DashboardSplitOption[],
  splitKey: string,
) {
  return (
    splits.find((split) => split.split_key === splitKey)?.split_label ??
    'All Splits'
  )
}

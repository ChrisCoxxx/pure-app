export function getMaxUnlockedBatch(startDate: string): number {
  const start = new Date(startDate)
  const today = new Date()
  const diffMs = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const weeksElapsed = Math.floor(diffDays / 7)
  return Math.min((weeksElapsed + 1) * 2, 24)
}

export function getCurrentBatches(startDate: string): [number, number] {
  const max = getMaxUnlockedBatch(startDate)
  return [max - 1, max]
}

export function getArchiveBatches(startDate: string): number[] {
  const max = getMaxUnlockedBatch(startDate)
  const archives: number[] = []
  for (let i = 1; i < max - 1; i++) archives.push(i)
  return archives
}

export function canAccessBatch(batchNumber: number, startDate: string): boolean {
  return batchNumber <= getMaxUnlockedBatch(startDate)
}

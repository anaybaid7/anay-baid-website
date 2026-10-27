// Compare two copies of the same table: columns that are missing, columns
// whose types drifted, and row counts that don't line up.

export type Column = [name: string, type: string]

export function compareSchemas(source: Column[], target: Column[], sourceRows: number, targetRows: number) {
  const issues: { column: string; problem: string }[] = []
  const types = new Map(target)
  for (const [name, type] of source) {
    if (!types.has(name)) issues.push({ column: name, problem: `${name} is missing on-prem` })
    else if (types.get(name) !== type) issues.push({ column: name, problem: `${name} is ${type} in Azure but ${types.get(name)} on-prem` })
  }
  if (sourceRows !== targetRows) issues.push({ column: '', problem: `Row counts differ by ${Math.abs(sourceRows - targetRows)}` })
  return issues
}

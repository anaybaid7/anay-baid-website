// Compare two copies of the same table: columns that are missing, columns
// whose types drifted, and row counts that don't line up. Each problem comes
// with the SQL that fixes it.

export type Column = [name: string, type: string]

export interface Issue {
  column: string
  problem: string
  fix: string
}

export function compareSchemas(source: Column[], target: Column[], sourceRows: number, targetRows: number) {
  const issues: Issue[] = []
  const types = new Map(target)
  for (const [name, type] of source) {
    if (!types.has(name))
      issues.push({ column: name, problem: `${name} is missing on-prem`, fix: `ALTER TABLE box_office ADD ${name} ${type};` })
    else if (types.get(name) !== type)
      issues.push({
        column: name,
        problem: `${name} is ${type} in Azure but ${types.get(name)} on-prem`,
        fix: `ALTER TABLE box_office ALTER COLUMN ${name} TYPE ${type} USING ${name}::${type};`,
      })
  }
  if (sourceRows !== targetRows)
    issues.push({
      column: '',
      problem: `Row counts differ by ${Math.abs(sourceRows - targetRows)}`,
      fix: 'INSERT INTO box_office SELECT * FROM azure.box_office\nEXCEPT SELECT * FROM box_office;',
    })
  return issues
}

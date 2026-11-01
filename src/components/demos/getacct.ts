// The sample program LegacyBridge shipped with: the GETACCT account lookup
// and its ACCTMAST record layout, plus a few fixed-width records to read.

export const COPYBOOK = `       FILE-CONTROL.
           SELECT ACCOUNT-FILE
               ASSIGN TO 'ACCTMAST'
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM
               RECORD KEY IS ACCT-NUMBER.
       FD  ACCOUNT-FILE.
       01  ACCOUNT-RECORD.
           05  ACCT-NUMBER        PIC 9(10).
           05  ACCT-NAME          PIC X(50).
           05  ACCT-BALANCE       PIC 9(10)V99.
           05  ACCT-TYPE          PIC X(20).
           05  ACCT-STATUS        PIC X(10).
           05  OPEN-DATE          PIC 9(8).
           05  LAST-TRANSACTION   PIC 9(8).
           05  CUSTOMER-ID        PIC 9(8).`

// lay values out the way the file stores them, fixed width and space padded
const row = (...cols: [string, number, 'X' | '9'][]) =>
  cols.map(([v, n, t]) => (t === '9' ? v.padStart(n, '0') : v.padEnd(n, ' '))).join('')

const acct = (no: string, name: string, cents: string, type: string, status: string, open: string, last: string, cust: string) =>
  row([no, 10, '9'], [name, 50, 'X'], [cents, 12, '9'], [type, 20, 'X'], [status, 10, 'X'], [open, 8, '9'], [last, 8, '9'], [cust, 8, '9'])

export const RECORDS: { label: string; line: string }[] = [
  { label: 'Chequing', line: acct('0012345678', 'MARIE TREMBLAY CHEQUING', '1543250', 'CHECKING', 'ACTIVE', '20180315', '20260123', '87654321') },
  { label: 'Savings', line: acct('0098765432', 'JEAN GAGNON EPARGNE', '8820000', 'SAVINGS', 'ACTIVE', '20030901', '20251130', '00412907') },
  { label: 'Corrupt record', line: acct('0055501234', 'CLOSED LINE OF CREDIT', '0000O7500', 'CREDIT', 'SUSPENDED', '20101399', '00000000', '00412907') },
]

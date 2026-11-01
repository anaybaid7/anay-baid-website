// The samples LegacyBridge shipped with: the GETACCT account lookup and its
// ACCTMAST record layout, the AS/400 customer table, and the 3270 account
// inquiry screen. Plus a few fixed-width records to read.

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

export const DDL = `-- AS/400 DB2 CUSTOMER DATABASE SCHEMA
-- DESJARDINS CORE BANKING SYSTEM
-- CREATED: 1987-03-15
-- LAST MODIFIED: 2024-11-20

CREATE TABLE CUSTMLIB.CUSTOMER (
    CUST_ID          DECIMAL(10,0) NOT NULL,
    FIRST_NAME       VARCHAR(50) NOT NULL,
    LAST_NAME        VARCHAR(50) NOT NULL,
    SSN              CHAR(9),
    DATE_OF_BIRTH    DATE,
    ADDRESS_LINE1    VARCHAR(100),
    ADDRESS_LINE2    VARCHAR(100),
    CITY             VARCHAR(50),
    STATE_PROVINCE   CHAR(2),
    ZIP_CODE         CHAR(5),
    COUNTRY          CHAR(3) DEFAULT 'CAN',
    PHONE_PRIMARY    CHAR(10),
    PHONE_SECONDARY  CHAR(10),
    EMAIL            VARCHAR(100),
    ACCOUNT_STATUS   VARCHAR(20) DEFAULT 'ACTIVE',
    CREDIT_SCORE     DECIMAL(3,0),
    CUSTOMER_SINCE   DATE,
    LAST_UPDATED     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_BY       VARCHAR(20),
    PRIMARY KEY (CUST_ID)
);

CREATE INDEX CUST_NAME_IDX ON CUSTMLIB.CUSTOMER
    (LAST_NAME, FIRST_NAME);

CREATE INDEX CUST_EMAIL_IDX ON CUSTMLIB.CUSTOMER
    (EMAIL);`

export const BMS = `* MAINFRAME SCREEN DEFINITION - 3270 TERMINAL
* ACCOUNT INQUIRY TRANSACTION
* TRANSACTION CODE: AINQ
MAPSET=ACCTINQ
MAP=ACCOUNT
DFHMSD TYPE=&SYSPARM,LANG=COBOL,MODE=INOUT,TERM=3270,
       CTRL=FREEKB,TIOAPFX=YES
*
ACCOUNT DFHMDI SIZE=(24,80),LINE=1,COLUMN=1
*
* SCREEN TITLE
        DFHMDF POS=(01,01),LENGTH=20,ATTRB=ASKIP,
               INITIAL='ACCOUNT INQUIRY',
               COLOR=BLUE,HILIGHT=BLINK
        DFHMDF POS=(01,70),LENGTH=10,ATTRB=ASKIP,
               INITIAL='AINQ V2.1'
*
* INPUT FIELDS
        DFHMDF POS=(03,01),LENGTH=15,ATTRB=ASKIP,
               INITIAL='ACCOUNT NUMBER:',COLOR=GREEN
ACCTNO  DFHMDF POS=(03,17),LENGTH=10,ATTRB=UNPROT,
               COLOR=TURQUOISE
        DFHMDF POS=(03,28),LENGTH=1,ATTRB=ASKIP
*
* OUTPUT FIELDS
        DFHMDF POS=(05,01),LENGTH=12,ATTRB=ASKIP,
               INITIAL='ACCT NAME:',COLOR=GREEN
ACCTNAME DFHMDF POS=(05,17),LENGTH=50,ATTRB=PROT,
               COLOR=WHITE
*
        DFHMDF POS=(07,01),LENGTH=12,ATTRB=ASKIP,
               INITIAL='BALANCE:',COLOR=GREEN
BALANCE DFHMDF POS=(07,17),LENGTH=15,ATTRB=PROT,
               COLOR=YELLOW,JUSTIFY=RIGHT`

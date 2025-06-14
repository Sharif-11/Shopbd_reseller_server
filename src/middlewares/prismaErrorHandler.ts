import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

export const knownRequestHandler = (
  error: PrismaClientKnownRequestError
): string => {
  const { code, meta } = error

  console.error('Prisma Error:', { code, meta, message: error.message })

  switch (code) {
    // Prisma Client Errors (Connection/Initialization)
    case 'P1000':
      return 'Authentication failed against database server. Check your credentials.'
    case 'P1001':
      return 'Database server cannot be reached. Please check your connection.'
    case 'P1002':
      return 'Database server was reached but timed out. Please try again.'
    case 'P1003':
      return 'Database file not found at specified path.'
    case 'P1008':
      return 'Operations timed out. Please try again.'
    case 'P1009':
      return 'Database already exists at specified path.'
    case 'P1010':
      return 'User was denied access to the database.'
    case 'P1011':
      return 'Error opening a TLS connection to the database.'
    case 'P1012':
      return 'Your Prisma schema is invalid. Please check your schema file.'
    case 'P1013':
      return 'The provided database string is invalid.'
    case 'P1014':
      return 'The underlying model for this operation does not exist.'
    case 'P1015':
      return 'Your Prisma version is outdated. Please update Prisma.'
    case 'P1016':
      return 'Your raw query had incorrect parameter count.'
    case 'P1017':
      return 'Database server has closed the connection.'

    // Prisma Client Errors (Query Engine)
    case 'P2000':
      return 'The provided value is too long for the column type.'
    case 'P2001':
      return 'The record searched for in the where condition does not exist.'
    case 'P2002':
      const target = meta?.target ? `(${meta.target})` : ''
      return `Unique constraint failed ${target}. The value must be unique.`
    case 'P2003':
      if (error.message.includes('`prisma.course.delete()` invocation')) {
        return 'Delete operation failed. The record is being referenced by other records.'
      }
      return 'Foreign key constraint failed. A related record could not be found.'
    case 'P2004':
      return 'A constraint failed on the database.'
    case 'P2005':
      return `Invalid value for field ${
        meta?.field_name || ''
      }. Value cannot be cast to the field type.`
    case 'P2006':
      return `Invalid value for field ${
        meta?.field_name || ''
      }. The provided value is not valid.`
    case 'P2007':
      return 'Data validation error. Please check your input.'
    case 'P2008':
      return 'Failed to parse the query. Please check your query syntax.'
    case 'P2009':
      return 'Failed to validate the query. Please check your query syntax.'
    case 'P2010':
      return 'Raw query failed. Error code: ' + (meta?.code || 'unknown')
    case 'P2011':
      return 'Null constraint violation. A required field was set to null.'
    case 'P2012':
      return 'Missing a required value in the input.'
    case 'P2013':
      return `Missing required argument ${
        meta?.argument_name || ''
      } for field ${meta?.field_name || ''}.`
    case 'P2014':
      const modelA = meta?.model_a_name || 'Model A'
      const modelB = meta?.model_b_name || 'Model B'
      return `The change you are trying to make would violate the relation "${modelA}" to "${modelB}".`
    case 'P2015':
      return 'A related record could not be found. It might have been deleted.'
    case 'P2016':
      return 'Query interpretation error. Please check your query.'
    case 'P2017':
      return `The records for relation ${
        meta?.relation_name || ''
      } between models are not connected.`
    case 'P2018':
      return 'The required connected records were not found.'
    case 'P2019':
      return 'Input error. Please check your input data.'
    case 'P2020':
      return 'Value out of range for the type.'
    case 'P2021':
      return `The table ${
        meta?.table || ''
      } does not exist in the current database.`
    case 'P2022':
      return `The column ${
        meta?.column || ''
      } does not exist in the current database.`
    case 'P2023':
      return 'Inconsistent column data. Please check your data.'
    case 'P2024':
      return 'Timed out while waiting for a transaction to complete.'
    case 'P2025':
      return 'Record not found or already deleted.'
    case 'P2026':
      return 'The current database provider does not support this feature.'
    case 'P2027':
      return 'Multiple errors occurred during query execution.'
    case 'P2028':
      const timeout = meta?.timeout
        ? `${meta.timeout} ms`
        : 'the configured timeout'
      return `Transaction expired after ${timeout}. Please retry or optimize the transaction.`
    case 'P2029':
      return 'A constraint failed in the database query.'
    case 'P2030':
      return 'Cannot find a fulltext index to use for the search.'
    case 'P2031':
      return 'MongoDB requires a transaction to perform this operation.'
    case 'P2033':
      return 'A number used in the query does not fit into a 64-bit signed integer.'
    case 'P2034':
      return 'Transaction failed due to a write conflict or deadlock. Please retry.'

    // Prisma Migrate Errors
    case 'P3000':
      return 'Failed to create database. Please check your permissions.'
    case 'P3001':
      return 'Potential destructive changes detected. Use --force to override.'
    case 'P3002':
      return 'The migration was rolled back.'
    case 'P3003':
      return 'The format of migrations changed. Reset your database.'
    case 'P3004':
      return 'The database is a system database and cannot be reset.'
    case 'P3005':
      return `The database schema is not empty. Please reset first.`
    case 'P3006':
      return 'Migration failed to apply cleanly to a temporary database.'
    case 'P3007':
      return 'The requested preview feature is not yet available.'
    case 'P3008':
      return 'The migration is already recorded as applied.'
    case 'P3009':
      return 'Found failed migrations in the target database.'
    case 'P3010':
      return 'The name of the migration is too long.'
    case 'P3011':
      return 'Migration cannot be rolled back because it was never applied.'
    case 'P3012':
      return 'Migration cannot be rolled back because it is not in a failed state.'
    case 'P3013':
      return 'Datasource provider arrays are no longer supported.'
    case 'P3014':
      return 'Prisma Migrate could not clean up the temporary database.'
    case 'P3015':
      return 'Could not find the migration file.'
    case 'P3016':
      return 'The fallback method for database resets failed.'
    case 'P3017':
      return 'The migration could not be found.'
    case 'P3018':
      return 'A migration failed to apply.'
    case 'P3019':
      return 'The datasource provider is not supported.'
    case 'P3020':
      return 'The automatic creation of shadow databases is disabled.'
    case 'P3021':
      return 'Foreign keys cannot be created on this database.'
    case 'P3022':
      return 'Direct execution of DDL (Data Definition Language) statements is disabled.'

    // Prisma Data Proxy Errors
    case 'P4000':
      return 'Data Proxy Error: The request could not be processed.'
    case 'P4001':
      return 'Data Proxy Error: The requested resource does not exist.'
    case 'P4002':
      return 'Data Proxy Error: The request payload is too large.'

    // Prisma Studio Errors
    case 'P5000':
      return 'Prisma Studio Error: Could not connect to database.'
    case 'P5001':
      return 'Prisma Studio Error: The requested resource was not found.'
    case 'P5002':
      return 'Prisma Studio Error: Your session has expired. Please reload.'

    default:
      return (
        'An unexpected database error occurred. Please contact support with the error code: ' +
        code
      )
  }
}

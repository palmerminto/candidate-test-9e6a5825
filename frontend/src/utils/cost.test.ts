import { describe, expect, it } from 'vitest'
import {
  calculateEstimatedCost,
  formatCurrency,
  formatEstimatedCost,
  formatEstimatedCostValue,
} from './cost'

describe('calculateEstimatedCost', () => {
  it('calculates cost from numeric hours and daily rate', () => {
    expect(calculateEstimatedCost(8, 400)).toBe(400)
  })

  it('calculates cost from string hours and daily rate', () => {
    expect(calculateEstimatedCost('6', '320')).toBe(240)
  })

  it('supports totals across multiple entries', () => {
    const totalHours = Number('10') + Number('6')

    expect(calculateEstimatedCost(totalHours, 320)).toBe(640)
  })
})

describe('formatEstimatedCost', () => {
  it('formats the estimate with currency and est. suffix', () => {
    expect(formatEstimatedCost(8, 400)).toBe('£400.00 est.')
  })

  it('formats string inputs the same way as numbers', () => {
    expect(formatEstimatedCost('6', '320')).toBe('£240.00 est.')
  })
})

describe('shared currency formatters', () => {
  it('formats plain currency values', () => {
    expect(formatCurrency(123.4)).toBe('£123.40')
  })

  it('formats numeric estimated cost values', () => {
    expect(formatEstimatedCostValue(850)).toBe('£850.00 est.')
  })
})

import { NextResponse } from 'next/server'

export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

/**
 * Returns a successful API response
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
    },
    { status }
  )
}

/**
 * Returns a successful API response for created resources
 */
export function apiCreated<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return apiSuccess(data, 201)
}

/**
 * Returns a successful response with no content
 */
export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

/**
 * Returns a paginated API response
 */
export function apiPaginated<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number
): NextResponse<ApiSuccessResponse<PaginatedData<T>>> {
  return apiSuccess({
    items,
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  })
}

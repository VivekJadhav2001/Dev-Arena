export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export function successResponse<T>(data: T, message = "OK", statusCode = 200): ApiResponse<T> {
  void statusCode;
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(message = "Internal Server Error", errors: any[] = [], statusCode = 500): ApiResponse {
  void statusCode;
  return {
    success: false,
    message,
    errors,
  };
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message = "OK"
): ApiResponse<{ items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  return {
    success: true,
    message,
    data: {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

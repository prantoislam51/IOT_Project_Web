import { NextResponse } from "next/server";

export type ApiSuccess<T> = { success: true; message: string; data: T };
export type ApiError = { success: false; message: string };

export function apiOk<T>(data: T, message = "OK", status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, message, data }, { status });
}

export function apiCreated<T>(data: T, message = "Created successfully") {
  return apiOk(data, message, 201);
}

export function apiError(message: string, status = 400) {
  return NextResponse.json<ApiError>({ success: false, message }, { status });
}

export const unauthorized = () => apiError("You must be signed in to perform this action.", 401);
export const forbidden = () => apiError("You do not have permission to perform this action.", 403);
export const notFound = (what = "Resource") => apiError(`${what} not found.`, 404);
export const conflict = (message: string) => apiError(message, 409);
export const badRequest = (message: string) => apiError(message, 400);
export const serverError = () =>
  apiError("Something went wrong on our side. Please try again.", 500);

/** Safely parse a JSON body, returning null on malformed input. */
export async function parseJsonBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

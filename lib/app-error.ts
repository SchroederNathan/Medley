export class AppError extends Error {
  status?: number;
  code?: string;
  retryable: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      retryable?: boolean;
      cause?: unknown;
    } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.status = options.status;
    this.code = options.code;
    this.retryable = options.retryable ?? false;
  }
}

const getNumericStatus = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

export function toAppError(
  error: unknown,
  fallbackMessage: string = "Request failed"
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return new AppError("Request cancelled", {
        code: "ABORTED",
        retryable: false,
        cause: error,
      });
    }

    if (error instanceof TypeError) {
      return new AppError(error.message || "Network request failed", {
        code: "NETWORK_ERROR",
        retryable: true,
        cause: error,
      });
    }
  }

  if (error && typeof error === "object") {
    const status = getNumericStatus(
      "status" in error
        ? error.status
        : "statusCode" in error
          ? error.statusCode
          : undefined
    );
    const code =
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : undefined;
    const message =
      typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : fallbackMessage;

    return new AppError(message, {
      status,
      code,
      retryable: status != null ? status >= 500 || status === 429 : false,
      cause: error,
    });
  }

  return new AppError(fallbackMessage, {
    retryable: false,
    cause: error,
  });
}

export function createHttpError(
  operation: string,
  response: Response,
  responseBody?: string
) {
  const details = responseBody?.trim();
  const suffix = details ? `: ${details}` : "";

  return new AppError(`${operation} failed (${response.status})${suffix}`, {
    status: response.status,
    code: `HTTP_${response.status}`,
    retryable: response.status >= 500 || response.status === 429,
  });
}

export function throwIfError(
  error: unknown,
  fallbackMessage: string = "Request failed"
): asserts error is null | undefined {
  if (error) {
    throw toAppError(error, fallbackMessage);
  }
}

export function shouldRetryQuery(failureCount: number, error: unknown) {
  const appError = toAppError(error);

  if (!appError.retryable) {
    return false;
  }

  return failureCount < 3;
}

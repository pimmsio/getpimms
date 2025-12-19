interface SWRError extends Error {
  info: any;
  status: number;
}

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  const res = await fetch(input, init);

  if (!res.ok) {
    let message = "An error occurred while fetching the data.";
    try {
      message = (await res.json())?.error?.message || message;
    } catch {
      // ignore json parse failures
    }
    const error = new Error(message) as SWRError;
    error.info = message;
    error.status = res.status;

    throw error;
  }

  return res.json();
}

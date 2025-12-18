export function generateRandomString(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  // Edge-safe: rely on Web Crypto instead of Node's `crypto` module.
  // Node 18+ also exposes `globalThis.crypto`.
  const cryptoObj: any = (globalThis as any).crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error("Web Crypto is not available in this runtime");
  }

  const randomBytesArray = new Uint8Array(length);
  cryptoObj.getRandomValues(randomBytesArray);
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytesArray[i] % charset.length;
    result += charset[randomIndex];
  }

  return result;
}

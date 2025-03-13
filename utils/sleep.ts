export function sleep<T>(ms: number = 1000, result: T = '' as any) {
  return new Promise<T>((resolve) => {
    setTimeout(() => {
      resolve(result);
    }, ms);
  });
}

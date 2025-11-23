export function stringifyBigInts(obj: any): any {
  if (obj === undefined || obj === null) {
    return obj;
  }
  
  try {
    return JSON.parse(
      JSON.stringify(obj, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  } catch (error) {
    // If JSON parsing fails, return the original object
    return obj;
  }
}
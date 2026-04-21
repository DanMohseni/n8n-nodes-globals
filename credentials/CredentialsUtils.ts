export function splitConstants(globalConstantsMultiline: string): { [key: string]: any } {

  // Check if the string is a JSON object
  try {
    const jsonObj = JSON.parse(globalConstantsMultiline.trim());
    return jsonObj as { [key: string]: any };
  } catch (e) {
    // Not a JSON object, continue with the old logic
    const lines = globalConstantsMultiline.split('\n');
    var retArr: { [key: string]: any } = {};
    for (const line of lines) {
      // trim the line
      const constant = line.trim();
      if (!constant) {
        continue;
      }
      // skip if it doesn't contain "="
      if (!constant.includes('=')) {
        continue;
      }
      // split only first "=" to allow values with "=" in them
      const [name, ...value] = constant.split('=');
      setDeepValue(retArr, name.trim(), value.join('=').trim());
    }
    return retArr;
  }
}

export function setDeepValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

export function flattenObject(obj: any, prefix = ''): { [key: string]: any } {
  return Object.keys(obj).reduce((acc: any, k: string) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

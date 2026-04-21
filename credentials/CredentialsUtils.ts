export function splitConstants(globalConstants: string | object): { [key: string]: any } {
  if (typeof globalConstants === 'object' && globalConstants !== null) {
    return globalConstants as { [key: string]: any };
  }

  if (typeof globalConstants !== 'string') {
    return {};
  }

  const trimmed = globalConstants.trim();
  if (!trimmed) {
    return {};
  }

  // Check if the string is a JSON object
  try {
    const jsonObj = JSON.parse(trimmed);
    if (typeof jsonObj === 'object' && jsonObj !== null) {
      return jsonObj as { [key: string]: any };
    }
  } catch (e) {
    // Not a JSON object, continue with the old logic
  }

  const lines = trimmed.split('\n');
  const retArr: { [key: string]: any } = {};
  for (const line of lines) {
    // trim the line
    const constant = line.trim();
    if (!constant || !constant.includes('=')) {
      continue;
    }
    // split only first "=" to allow values with "=" in them
    const [name, ...value] = constant.split('=');
    setDeepValue(retArr, name.trim(), value.join('=').trim());
  }
  return retArr;
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

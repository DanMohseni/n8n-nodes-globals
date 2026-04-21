export function splitConstants(globalConstantsMultiline: string): { [key: string]: string } {

  // Check if the string is a JSON object
  try {
    const jsonObj = JSON.parse(globalConstantsMultiline.trim());
    return jsonObj as { [key: string]: string };
  } catch (e) {
    // Not a JSON object, continue with the old logic
    const lines = globalConstantsMultiline.split('\n');
    var retArr: { [key: string]: string } = {};
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
      retArr[name.trim()] = value.join('=').trim();
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

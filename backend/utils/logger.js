const stamp = () => new Date().toISOString();

export const authInfo = (event, meta = {}) => {
  console.log(JSON.stringify({ level: 'INFO', ts: stamp(), event, ...meta }));
};
export const authWarn = (event, meta = {}) => {
  console.warn(JSON.stringify({ level: 'WARN', ts: stamp(), event, ...meta }));
};
export const authError = (event, meta = {}) => {
  console.error(JSON.stringify({ level: 'ERROR', ts: stamp(), event, ...meta }));
};
const API_PORT = 3001;

export function getApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost')) return envUrl;
  if (envUrl === 'http://localhost:3001/api') {
    return `http://${window.location.hostname}:${API_PORT}/api`;
  }
  return `http://${window.location.hostname}:${API_PORT}/api`;
}

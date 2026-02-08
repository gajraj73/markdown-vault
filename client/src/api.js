const API = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export const getTree = () => request('/tree');

export const getFile = (path) =>
  request(`/file?path=${encodeURIComponent(path)}`);

export const saveFile = (path, content) =>
  request('/file', {
    method: 'PUT',
    body: JSON.stringify({ path, content }),
  });

export const deleteFile = (path) =>
  request(`/file?path=${encodeURIComponent(path)}`, { method: 'DELETE' });

export const renameFile = (oldPath, newPath) =>
  request('/rename', {
    method: 'POST',
    body: JSON.stringify({ oldPath, newPath }),
  });

export const createFolder = (path) =>
  request('/folder', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });

export const deleteFolder = (path) =>
  request(`/folder?path=${encodeURIComponent(path)}`, { method: 'DELETE' });

export const search = (q) =>
  request(`/search?q=${encodeURIComponent(q)}`);

export const getMetadata = () => request('/metadata');

export const setTags = (path, tags) =>
  request('/metadata/tags', {
    method: 'PUT',
    body: JSON.stringify({ path, tags }),
  });

export const toggleFavorite = (path) =>
  request('/metadata/favorite', {
    method: 'PUT',
    body: JSON.stringify({ path }),
  });

export const saveProgress = (path, scrollPercent) =>
  request('/metadata/progress', {
    method: 'PUT',
    body: JSON.stringify({ path, scrollPercent }),
  });

export const getProgress = (path) =>
  request(`/metadata/progress?path=${encodeURIComponent(path)}`);

export const getContinueReading = () => request('/metadata/continue-reading');

export async function uploadFiles(files, folder = '') {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  formData.append('folder', folder);

  const res = await fetch(`${API}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

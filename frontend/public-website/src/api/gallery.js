import { api } from './client.js';
export const galleryApi = {
  featured: async () => (await api.get('/gallery/albums', { params: { featured: 'true' } })).data.albums,
  albums: async () => (await api.get('/gallery/albums')).data.albums,
  album: async slug => (await api.get(`/gallery/albums/${encodeURIComponent(slug)}`)).data,
};

import {api} from './client.js';
export async function getSiteSection(section){return (await api.get(`/site/${section}`)).data[section];}

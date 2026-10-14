import {api} from './client.js';
export async function getContent(name){return (await api.get(`/content/${name}`)).data;}

import {useLoad} from '../admin/api';
import seed from '../../site/news.json';
import type {NewsItem} from '@havenlord/protocol';

/** Tin công bố trong mã trang: hiển thị ngay cả khi CSDL bản thật đã có tin cũ. */
export const upcoming: NewsItem[] = seed.filter(item => 'featured' in item && item.featured).map((item, index) => ({
 id: -index - 1,
 at: Date.UTC(2026, 10, 13, 5),
 date: item.date,
 tag: item.tag as NewsItem['tag'],
 title: item.title,
 body: item.body,
 author: 'Haven Lord',
}));
const corrections = new Map(seed.filter(item => !('featured' in item)).map(item => [item.title, item.body]));
export const currentBody = (title:string,body:string[]) => corrections.get(title) ?? body;

export function publicNews() {
 const result = useLoad<NewsItem[]>('api/news?limit=200');
 const titles = new Set(result.data?.map(item => item.title) ?? []);
 const data = [...upcoming.filter(item => !titles.has(item.title)), ...(result.data ?? []).map(item => ({
  ...item, body: currentBody(item.title,item.body),
 }))];
 return {...result, data};
}

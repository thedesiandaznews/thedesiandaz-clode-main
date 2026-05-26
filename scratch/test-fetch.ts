import { getArticleById } from '../src/actions/news';

async function main() {
  const article = await getArticleById('headline-ms-dhoni-csk-uaktp8');
  console.log('Result for slug:', article ? article.title : 'NULL');

  const articleById = await getArticleById('cmpffak5q002dr8s2plk6eskw');
  console.log('Result for ID:', articleById ? articleById.title : 'NULL');
}

main().catch(console.error);

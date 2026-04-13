import { franc } from 'franc';

type Lang = 'en' | 'hi' | 'gu';

const FRANC_TO_LANG: Record<string, Lang> = {
  eng: 'en',
  hin: 'hi',
  guj: 'gu',
};

export function detectLanguage(text: string): Lang {
  const detected = franc(text, { minLength: 5 });
  return FRANC_TO_LANG[detected] ?? 'en';
}

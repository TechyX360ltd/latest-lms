export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/{{(.*?)}}/g, (_, key) => vars[key.trim()] || '');
} 
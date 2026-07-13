const PARTNER_CODE_PREFIX = 'CT';
const PARTNER_CODE_START = 101;

export async function generatePartnerCode(client: any): Promise<string> {
  const { data, error } = await client
    .from('partners')
    .select('partner_code')
    .like('partner_code', `${PARTNER_CODE_PREFIX}-%`);

  if (error) {
    throw new Error(`Unable to generate partner code: ${error.message || 'partner lookup failed'}`);
  }

  const maxCode = ((data ?? []) as Array<{ partner_code: string | null }>).reduce((max: number, row) => {
    const match = row.partner_code?.match(/^CT-(\d+)$/i);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, PARTNER_CODE_START - 1);

  return `${PARTNER_CODE_PREFIX}-${maxCode + 1}`;
}

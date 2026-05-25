import { createDemoBureauResponse } from '@/lib/bureau/demo-response';

type DemoInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  gender: string;
  idNumber: string;
  stateCode: string;
  pinCode: string;
  telephoneNumber: string;
};

export function createSandboxCibilResponse(input: DemoInput, requestId: string) {
  const name = [input.firstName, input.middleName, input.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toUpperCase();

  return createDemoBureauResponse({
    name,
    birthDate: input.birthDate,
    gender: input.gender,
    idNumber: input.idNumber,
    stateCode: input.stateCode,
    pinCode: input.pinCode,
    telephoneNumber: input.telephoneNumber,
    reportId: `SANDBOX-${requestId.slice(-10)}`,
  });
}

type DemoResponseInput = {
  name: string;
  birthDate: string;
  gender: string;
  idNumber: string;
  stateCode: string;
  pinCode: string;
  telephoneNumber: string;
  reportId: string;
};

export function createDemoCibilResponse(input: DemoResponseInput) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  const dateProcessed = `${dd}${mm}${yyyy}`;

  return {
    controlData: {
      success: true,
    },
    consumerCreditData: [
      {
        tuefHeader: {
          headerType: 'TUEF',
          version: '12',
          memberRefNo: 'DEMO TUEF IN JSON',
          enquiryMemberUserId: 'DEMOUSER',
          subjectReturnCode: 1,
          enquiryControlNumber: input.reportId,
          dateProcessed,
          timeProcessed: `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`,
        },
        names: [
          {
            index: 'N01',
            name: input.name,
            birthDate: input.birthDate,
            gender: input.gender,
          },
        ],
        ids: [
          {
            index: 'I01',
            idType: '01',
            idNumber: input.idNumber,
            enquiryEnriched: '',
          },
        ],
        telephones: [
          {
            index: 'T01',
            telephoneNumber: input.telephoneNumber,
            telephoneType: '01',
            telephoneExtension: '',
            enquiryEnriched: '',
          },
        ],
        employment: [
          {
            index: 'E01',
            accountType: '01',
            dateReported: dateProcessed,
            occupationCode: '01',
            income: 25000,
            incomeType: 'G',
            incomeFrequency: 'M',
          },
        ],
        scores: [
          {
            scoreName: 'CIBILTUSC4',
            scoreCardName: '28',
            scoreCardVersion: '10',
            scoreDate: dateProcessed,
            score: '00790',
            exclusionCodes: [],
            reasonCodes: [
              { reasonCodeName: 'reasonCode1', reasonCodeValue: '03' },
              { reasonCodeName: 'reasonCode3', reasonCodeValue: '27' },
            ],
          },
        ],
        addresses: [
          {
            index: 'A01',
            line1: 'DEMO ADDRESS',
            line2: 'CUSTOMER AREA',
            line3: '',
            line4: '',
            line5: '',
            stateCode: input.stateCode,
            pinCode: input.pinCode,
            addressCategory: '01',
            residenceCode: '01',
            dateReported: dateProcessed,
            enquiryEnriched: '',
          },
        ],
        accounts: [
          {
            index: 'T001',
            memberShortName: 'NOT DISCLOSED',
            accountNumber: 'XXXX4321',
            accountType: '05',
            ownershipIndicator: 1,
            dateOpened: '31122018',
            lastPaymentDate: '04032019',
            dateReported: dateProcessed,
            highCreditAmount: 34000,
            currentBalance: 33372,
            amountOverdue: 0,
            paymentHistory: '000XXX000000',
            creditLimit: 23434,
            emiAmount: 1392,
          },
          {
            index: 'T002',
            memberShortName: 'NOT DISCLOSED',
            accountNumber: 'XXXX7890',
            accountType: '10',
            ownershipIndicator: 1,
            dateOpened: '12012020',
            dateReported: dateProcessed,
            highCreditAmount: 250000,
            currentBalance: 42000,
            amountOverdue: 0,
            paymentHistory: '000000000000',
            creditLimit: 300000,
          },
        ],
        enquiries: [
          {
            index: 'I001',
            enquiryDate: dateProcessed,
            memberShortName: 'ENQUIRY MEMBER',
            enquiryPurpose: '10',
            enquiryAmount: 101000,
          },
        ],
        consumerDisputeRemarks: [],
      },
    ],
    consumerSummaryData: {
      accountSummary: {
        totalAccounts: 43,
        overdueAccounts: 0,
        zeroBalanceAccounts: 31,
        highCreditAmount: 50342075,
        currentBalance: 21006342,
        overdueBalance: 0,
        recentDateOpened: '30092021',
        oldestDateOpened: '29082005',
      },
      inquirySummary: {
        totalInquiry: 156,
        inquiryPast30Days: 3,
        inquiryPast12Months: 22,
        inquiryPast24Months: 13,
        recentInquiryDate: dateProcessed,
      },
    },
  };
}

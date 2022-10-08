export type AzureFunctionType = 'http' | 'timer' | 'queue';

export interface AddAzureFunctionGeneratorSchema {
  name: string;
  project: string;
  type?: AzureFunctionType;
}

interface NormalizedSchema extends AddAzureFunctionGeneratorSchema {
  type: AzureFunctionType;
  functionRoot: string;
}

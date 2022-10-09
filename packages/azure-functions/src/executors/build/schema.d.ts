import { BuilderLogLevelType } from 'esbuild-azure-functions/build/src/lib/models';

export interface BuildExecutorSchema {
  logLevel?: BuilderLogLevelType;
}

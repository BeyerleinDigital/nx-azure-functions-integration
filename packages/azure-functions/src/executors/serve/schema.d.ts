import { BuilderLogLevelType } from 'esbuild-azure-functions/build/src/lib/models';

export interface ServeExecutorSchema {
  logLevel?: BuilderLogLevelType;
}

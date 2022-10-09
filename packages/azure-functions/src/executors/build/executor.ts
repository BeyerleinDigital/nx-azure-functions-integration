import { ExecutorContext } from '@nrwl/devkit';
import { build } from 'esbuild-azure-functions';
import * as path from 'path';
import { BuildExecutorSchema } from './schema';

export default async function runExecutor(
  options: BuildExecutorSchema,
  ctx: ExecutorContext
) {
  let success = true;

  const nxProject = ctx.workspace.projects[ctx.projectName];
  const project = path.join(ctx.root, nxProject.root);
  const outDir = path.join(ctx.root, 'dist', nxProject.root);

  try {
    await build({
      project,
      advancedOptions: {
        enableDirnameShim: true,
        enableRequireShim: true,
      },
      clean: true,
      logLevel: options.logLevel || 'verbose',
      esbuildOptions: {
        outdir: outDir,
      },
    });
  } catch (error) {
    success = false;
  }

  return { success };
}

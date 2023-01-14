import { ExecutorContext } from '@nrwl/devkit';
import { eachValueFrom } from '@nrwl/devkit/src/utils/rxjs-for-await';
import * as child_process from 'child_process';
import { build, BuilderConfigType, watch } from 'esbuild-azure-functions';
import * as path from 'path';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ServeExecutorSchema } from './schema';

export default async function* runExecutor(
  options: ServeExecutorSchema,
  ctx: ExecutorContext
) {
  let subProcess: child_process.ChildProcess | null = null;

  const exitHandler = () => {
    subProcess?.kill('SIGINT');
  };

  process.on('SIGUSR1', exitHandler);
  process.on('SIGUSR2', exitHandler);
  process.on('SIGINT', exitHandler);
  process.on('SIGTERM', exitHandler);

  const nxProject = ctx.workspace.projects[ctx.projectName];
  const project = path.join(ctx.root, nxProject.root);
  const outDir = path.join(ctx.root, 'dist', nxProject.root);

  const config: BuilderConfigType = {
    project,
    advancedOptions: {
      enableDirnameShim: true,
      enableRequireShim: true,
    },
    clean: true,
    logLevel: options.logLevel || 'verbose',
    esbuildOptions: {
      outdir: outDir,
      minify: true,
      sourcemap: true,
    },
  };

  // build once so there are existing artifacts when starting
  // the Azure Functions CLI
  await build(config);

  subProcess = spawnFuncProcess(project);

  await watch({
    ...config,
    clean: false,
    onRebuild: async (errors) => {
      if (!errors) {
        // Hack needed because func only hot reloads for changes inside the cwd.
        subProcess?.kill('SIGINT');

        subProcess = spawnFuncProcess(project);
      }
    },
  });

  return yield* eachValueFrom(
    new Observable((s) => () => s.complete()).pipe(
      map(() => ({ success: true }))
    )
  );
}

function spawnFuncProcess(cwd: string) {
  const subProcess = child_process.spawn('func', ['start'], {
    cwd,
    stdio: [process.stdin, process.stdout, process.stderr, 'pipe'],
  });

  subProcess.on('error', (error) => {
    console.error(error);
  });

  return subProcess;
}

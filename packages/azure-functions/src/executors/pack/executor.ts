import { ExecutorContext } from '@nrwl/devkit';
import fs from 'fs/promises';
import glob from 'glob';
import JSZip from 'jszip';
import path from 'path';
import { PackExecutorSchema } from './schema';

export default async function runExecutor(options: PackExecutorSchema, ctx: ExecutorContext) {
  let success = true;

  const nxProject = ctx.workspace.projects[ctx.projectName];
  const project = path.join(ctx.root, nxProject.root);
  const distDir = path.join(ctx.root, 'dist', nxProject.root);

  try {
    const distFiles = await globber(`${distDir}/**/*.mjs`);
    const functionJsonFiles = await globber(`${project}/**/function.json`);
    const otherFiles = [`${project}/host.json`];

    const zip = new JSZip();

    for (const file of distFiles) {
      const content = await fs.readFile(file, 'utf-8');
      zip.file(path.relative(ctx.root, file), content);
    }

    for (const file of functionJsonFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const parsed: Record<string, unknown> & { scriptFile: string } = JSON.parse(content);
      const funcDir = path.dirname(path.resolve('/', path.relative(project, file)));
      const scriptFile = path.relative(funcDir, path.resolve('/', parsed.scriptFile));

      parsed.scriptFile = scriptFile;

      zip.file(path.relative(project, file), JSON.stringify(parsed, null, 2));
    }

    for (const file of otherFiles) {
      const content = await fs.readFile(file, 'utf-8');
      zip.file(path.relative(project, file), content);
    }

    const zipFile = await zip.generateAsync({ type: 'nodebuffer' });
    await fs.writeFile(path.resolve(distDir, 'app.zip'), zipFile);
  } catch (error) {
    success = false;
  }

  return { success };
}

function globber(pattern: string, options?: glob.IOptions): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, matches) => {
      if (err) return reject(err);

      resolve(matches);
    });
  });
}

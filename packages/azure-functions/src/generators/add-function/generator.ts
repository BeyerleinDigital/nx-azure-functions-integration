import { generateFiles, names, offsetFromRoot, readProjectConfiguration, Tree } from '@nrwl/devkit';
import * as path from 'path';
import { AddAzureFunctionGeneratorSchema, NormalizedSchema } from './schema';

function normalizeOptions(tree: Tree, options: AddAzureFunctionGeneratorSchema): NormalizedSchema {
  const projectRoot = readProjectConfiguration(tree, options.project).root;
  const name = names(options.name).fileName;
  const functionRoot = `${projectRoot}/${name}`;

  return {
    ...options,
    name,
    functionRoot,
    type: options.type || 'http',
  };
}

export default async function (tree: Tree, options: AddAzureFunctionGeneratorSchema) {
  const { name, project, functionRoot, type } = normalizeOptions(tree, options);

  const srcFolder = path.join(__dirname, 'files', type);

  generateFiles(tree, srcFolder, functionRoot, {
    tmpl: '',
    projectName: project,
    functionName: name,
    offsetFromRoot: offsetFromRoot(functionRoot),
  });
}

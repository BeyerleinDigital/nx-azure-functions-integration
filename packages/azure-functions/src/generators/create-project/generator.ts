import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  installPackagesTask,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { jestProjectGenerator } from '@nrwl/jest';
import { Linter, lintProjectGenerator } from '@nrwl/linter';
import * as path from 'path';
import { AzureFunctionsGeneratorSchema } from './schema';

interface NormalizedSchema extends AzureFunctionsGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: AzureFunctionsGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    tmpl: '',
  };

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

function addDependencies(tree: Tree) {
  addDependenciesToPackageJson(
    tree,
    {},
    { '@azure/functions': '3.0.0', typescript: '4' }
  );
}

function addProjectConfig(tree: Tree, normalizedOptions: NormalizedSchema) {
  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}`,
    targets: {
      build: {
        executor: '@beyerleinf/nx-azure-functions:build',
      },
      serve: {
        executor: '@beyerleinf/nx-azure-functions:serve',
      },
    },
    tags: normalizedOptions.parsedTags,
  });
}

async function addLinting(tree: Tree, normalizedOptions: NormalizedSchema) {
  return lintProjectGenerator(tree, {
    project: normalizedOptions.projectName,
    skipFormat: false,
    linter: Linter.EsLint,
  });
}

async function addJest(tree: Tree, normalizedOptions: NormalizedSchema) {
  return jestProjectGenerator(tree, {
    project: normalizedOptions.projectName,
    testEnvironment: 'node',
    setupFile: 'none',
    compiler: 'tsc',
    supportTsx: false,
    js: false,
    skipSerializers: true,
    skipFormat: true,
    skipPackageJson: false,
  });
}

export default async function (
  tree: Tree,
  options: AzureFunctionsGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  addDependencies(tree);
  addProjectConfig(tree, normalizedOptions);
  addFiles(tree, normalizedOptions);

  await addLinting(tree, normalizedOptions);
  await addJest(tree, normalizedOptions);

  await formatFiles(tree);

  installPackagesTask(tree);
}

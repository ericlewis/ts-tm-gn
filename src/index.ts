import assert from 'assert';
import { Project } from 'ts-morph';
import { ModuleSpec, ModuleSpecMM, RCTModule, RCTModuleH } from './templates';

try {
  const argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('generate', 'Generate TurboModules')
    .example(
      '$0 generate -d schemas/*.ts -n TurboModule',
      'generate turbomodule bindings for all TS files'
    )
    .alias('d', 'directory')
    .nargs('d', 1)
    .describe('d', 'Directory to search for schemas')
    .alias('o', 'output')
    .nargs('o', 1)
    .describe('o', 'Name of the directory to output to')
    .alias('n', 'name')
    .nargs('n', 1)
    .describe('n', 'Name of the TurboModule')
    .demandOption(['d', 'n'])
    .help('h')
    .alias('h', 'help').argv;

  const project = new Project({});
  const specs = project.addExistingSourceFiles(argv.directory);
  specs.forEach(spec => {
    for (const [, declarations] of spec.getExportedDeclarations()) {
      // tslint:disable-next-line
      let data = [];

      const checkIfTurboModuleAndCreateTemplateData = dType => tt => {
        assert(
          [tt.getText(), tt.getSymbol().getName()].includes('TurboModule')
        );
        spec
          .getInterface(dType.getText())
          .getMembers()
          .forEach(si => {
            if (si.getType().isAnonymous()) {
              si.getType()
                .getCallSignatures()
                .forEach(createTemplateData(si));
            } else {
              // we should handle other types, like alias and what not
            }
          });
      };

      const createParameters = p => ({
        name: p.getName(),
        type: p
          .getValueDeclaration()
          .getType()
          .getText()
      });

      const createTemplateData = si => s => {
        const methodName = si.getSymbol().getName();
        const parameters = s.getParameters().map(createParameters);
        const returnType = s.getReturnType().getText();
        data.push({ methodName, parameters, returnType });
      };

      const mapDeclarations = d => {
        const dType = d.getType();
        if (dType.isInterface()) {
          dType
            .getBaseTypes()
            .map(checkIfTurboModuleAndCreateTemplateData(dType));
        }
      };

      declarations.map(mapDeclarations);

      assert(data.length > 0, 'No valid specs found');
      const name = argv.name;
      // these names should really belong to the templates
      const outputs: ReadonlyArray<any> = [
        [`RCTNative${name}Spec.h`, ModuleSpec(name, data)],
        [`RCTNative${name}Spec.mm`, ModuleSpecMM(name, data)],
        [`RCT${name}.h`, RCTModuleH(name)],
        [`RCT${name}.mm`, RCTModule(name, data)]
      ];

      if (argv.output) {
        outputs.map(([n]) => console.log(n));
      } else {
        outputs.map(([, o]) => console.log(o));
      }
    }
  });
} catch (error) {
  console.error(error);
}

import assert from 'assert';
import { Project, Type } from 'ts-morph';
// import { ModuleSpec, ModuleSpecMM, RCTModule, RCTModuleH } from './templates';

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
    for (const [, exportedDeclarations] of spec.getExportedDeclarations()) {
      // Helper functions
      const isArray = (type: Type) =>
        type.isArray() ||
        (type.isObject() &&
          type.getSymbol().getEscapedName() === 'ReadonlyArray');

      const isTurboModule = (type: Type) =>
        [type.getText(), type.getSymbol().getName()].includes('TurboModule');

      const mapTurboModuleDeclarationTypes = declaration => {
        const type: Type = declaration.getType();
        return type.isInterface() &&
          type.getBaseTypes().filter(isTurboModule).length > 0
          ? type
          : undefined;
      };

      // Check all exported declarations
      const turboModuleInterfaceDeclarations = exportedDeclarations
        .map(mapTurboModuleDeclarationTypes)
        .filter(i => i);
      assert(
        turboModuleInterfaceDeclarations.length === 1,
        'Must have only one TurboModule interface per file'
      );

      const turboModuleInterfaceType = turboModuleInterfaceDeclarations[0];
      const turboModuleInterface = spec.getInterface(
        turboModuleInterfaceType.getText()
      );
      const turboModuleInterfaceMethods = turboModuleInterface
        .getMembers()
        .map(method => {
          const name = method.getSymbol().getName();
          const signatures = method.getType().getCallSignatures();
          assert(
            signatures.length === 1,
            'Must declare at least one signature per method'
          );

          // recursively build the types returned
          function constructTypes(pt: Type) {
            if (isArray(pt) && pt.getTypeArguments().length > 0) {
              return {
                type: 'array',
                // this maybe should be mapped instead, for when we wanna handle dictionaries
                argTypes: pt.getTypeArguments().map(constructTypes)
              };
            }

            return {
              type: pt.getText(),
              argTypes: null
            };
          }

          const signature = signatures[0];
          const parameters = signature.getParameters().map(param => {
            const paramDeclaration = param.getValueDeclaration();
            const paramType = paramDeclaration.getType();
            return constructTypes(paramType);
          });
          const returnType = constructTypes(signature.getReturnType());
          return { name, parameters, returnType };
        });

      console.log(turboModuleInterfaceMethods[0].parameters[0].argTypes);
      assert(turboModuleInterfaceMethods.length > 0, 'No valid methods found');
      // const name = argv.name;
      // // these names should really belong to the templates
      // const outputs: ReadonlyArray<any> = [
      //   [`RCTNative${name}Spec.h`, ModuleSpec(name, data)],
      //   [`RCTNative${name}Spec.mm`, ModuleSpecMM(name, data)],
      //   [`RCT${name}.h`, RCTModuleH(name)],
      //   [`RCT${name}.mm`, RCTModule(name, data)]
      // ];

      // if (argv.output) {
      //   outputs.map(([n]) => console.log(n));
      // } else {
      //   outputs.map(([, o]) => console.log(o));
      // }
    }
  });
} catch (error) {
  console.error(error);
}

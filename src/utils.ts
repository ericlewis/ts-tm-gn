function getType(type, typeArg?: string) {
  switch (type) {
    case 'number':
      return 'double';
    case 'boolean':
      return 'BOOL';
    case 'string':
      return 'NSString *';
    case 'object':
      return 'NSDictionary *';
    case 'void':
      return 'void';
    case 'array':
      return `NSArray<${getType(typeArg)}> *`;

    default:
      return 'MISSINGNO_' + type;
  }
}

export function invokeReturnType(type) {
  switch (type) {
    case 'boolean':
      return 'BooleanKind';
    case 'number':
      return 'NumberKind';
    case 'string':
      return 'StringKind';
    case 'object':
      return 'ObjectKind';
    case 'void':
      return 'VoidKind';
    case 'array':
      return 'ArrayKind';

    default:
      return 'MISSINGNO_' + type;
  }
}

function makeParams(parameters) {
  if (parameters.length > 0) {
    return parameters
      .map(({ name, type, typeArg }, idx) => {
        if (idx === 0) {
          return `:(${getType(type, typeArg)})${name}`;
        } else {
          return ` ${name}:(${getType(type, typeArg)})${name}`;
        }
      })
      .join('');
  }

  return '';
}

export function makeSpecFunctions(functions) {
  return functions
    .map(({ returnType, returnTypeArg, methodName, parameters }) => {
      return `- (${getType(
        returnType,
        returnTypeArg
      )})${methodName}${makeParams(parameters)};\n`;
    })
    .join('');
}

export function makeSelectorParams(parameters) {
  return parameters
    .map(({ name }, idx) => {
      if (idx === 0) {
        return ':';
      } else {
        return `${name}:`;
      }
    })
    .join('');
}

export function makeMethodMap(name, functions) {
  return functions
    .map(({ methodName, parameters }) => {
      return `
    methodMap_["${methodName}"] = MethodMetadata {${
        parameters.length
      }, __hostFunction_Native${name}SpecJSI_${methodName}};\n`.substring(1);
    })
    .join('');
}

export function makeMethodScaffolding(functions) {
  return functions
    .map(({ methodName, parameters, returnType, returnTypeArg }) => {
      return `
${
  returnType === 'void'
    ? 'RCT_EXPORT_METHOD'
    : 'RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD'
}(${
        parameters.length > 0
          ? `${
              returnType === 'void'
                ? ''
                : `${getType(returnType, returnTypeArg)}, `
            }${methodName}:(${getType(
              parameters[0].type,
              parameters[0].typeArg
            )})arg${parameters
              .map(
                ({ name, type, typeArg }) =>
                  ` ${name}:(${getType(type, typeArg)})${name}`
              )
              .join('')}`
          : methodName
      })
{
  // Implement method
}
      `;
    })
    .join('');
}

export const createHostFunctions = (name: string) => ({
  methodName,
  returnType,
  parameters
}) => {
  return `
static facebook::jsi::Value __hostFunction_Native${name}SpecJSI_${methodName}(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
    return static_cast<ObjCTurboModule &>(turboModule)
        .invokeObjCMethod(rt, ${invokeReturnType(
          returnType
        )}, "${methodName}", @selector(${methodName}${makeSelectorParams(
    parameters
  )}), args, count);
}
    `;
};

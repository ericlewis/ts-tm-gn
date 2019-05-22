function getType(type) {
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
    default:
      return 'MISSINGNO';
  }
}

function makeParams(parameters) {
  if (parameters.length > 0) {
    return parameters
      .map(({ name, type }, idx) => {
        if (idx === 0) {
          return `:(${getType(type)})${name}`;
        } else {
          return ` ${name}:(${getType(type)})${name}`;
        }
      })
      .join('');
  }

  return '';
}

export function makeSpecFunctions(functions) {
  return functions
    .map(({ returnType, methodName, parameters }) => {
      return `- (${getType(returnType)})${methodName}${makeParams(
        parameters
      )};\n`;
    })
    .join('');
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

    default:
      return 'MISSINGNO';
  }
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
    .map(({ methodName, parameters, returnType }) => {
      return `
${
  returnType === 'void'
    ? 'RCT_EXPORT_METHOD'
    : 'RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD'
}(${
        parameters.length > 0
          ? `${
              returnType === 'void' ? '' : `${getType(returnType)}, `
            }${methodName}:(${getType(
              parameters.shift().type
            )})arg${parameters
              .map(({ name, type }) => ` ${name}:(${getType(type)})${name}`)
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

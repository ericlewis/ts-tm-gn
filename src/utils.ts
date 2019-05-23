function getType(type) {
  switch (type.type) {
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
      return `NSArray<${type.argTypes.map(getType)}> *`;

    default:
      console.error('missing type', type);
      return '';
  }
}

export function invokeReturnType(type) {
  switch (type.type) {
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
      console.error('missing type', type);
      return '';
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

export function makeMethodMap(moduleName, functions) {
  return functions
    .map(({ name, parameters }) => {
      return `
  methodMap_["${name}"] = MethodMetadata {${
        parameters.length
      }, __hostFunction_Native${moduleName}SpecJSI_${name}};`;
    })
    .join('')
    .slice(3); // <--- this just makes the output look nicer
}

function requiresReturnResult(o) {
  return o.type !== 'void' && o.type !== 'promise';
}

function EXPORT_METHOD(type) {
  return requiresReturnResult(type)
    ? 'RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD'
    : 'RCT_EXPORT_METHOD';
}

function CONSTRUCT_RETURN(type) {
  return requiresReturnResult(type) ? `${getType(type)}, ` : '';
}

function CONSTRUCT_PARAMS(params) {
  return params
    .map((type, idx) => {
      const { name } = type;
      if (idx === 0) {
        return `:(${getType(type)})${name}`;
      }

      return `${name}:(${getType(type)})${name}`;
    })
    .join(' ');
}

export function makeMethodScaffolding(functions) {
  return functions
    .map(({ name, returnType, parameters }) => {
      return `
${EXPORT_METHOD(returnType)}(${CONSTRUCT_RETURN(
        returnType
      )}${name}${CONSTRUCT_PARAMS(parameters)})
{
  // Implement method
}
      `;
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

export const createHostFunctions = (moduleName: string, methods) => {
  return methods
    .map(
      ({ name, returnType, parameters }) => `
static facebook::jsi::Value __hostFunction_Native${moduleName}SpecJSI_${name}(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ${invokeReturnType(
        returnType
      )}, "${name}", @selector(${name}${makeSelectorParams(
        parameters
      )}), args, count);
}
      `
    )
    .join('');
};

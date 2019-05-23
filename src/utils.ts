function getNativeType(type) {
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
    case 'promise':
      return 'void';
    case 'any':
      return 'id<NSObject>';
    case 'array':
      return `NSArray<${type.argTypes.map(getNativeType)}> *`;
    case 'callback':
      return 'RCTResponseSenderBlock';

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
    case 'any':
      return 'ObjectKind';
    case 'void':
    case 'callback':
      return 'VoidKind';
    case 'array':
      return 'ArrayKind';
    case 'promise':
      return 'PromiseKind';

    default:
      console.error('missing type', type);
      return '';
  }
}

export function makeSpecFunctions(functions) {
  return functions
    .map(({ returnType, name, parameters }) => {
      return `- (${getNativeType(returnType)})${CONSTRUCT_METHOD(
        name,
        parameters,
        returnType
      )};\n`;
    })
    .join('');
}

export function makeMethodMap(moduleName, functions) {
  return functions
    .map(({ name, returnType, parameters }) => {
      return `
  methodMap_["${name}"] = MethodMetadata {${parameters.length +
        (returnType.type === 'promise'
          ? 2
          : 0)}, __hostFunction_Native${moduleName}SpecJSI_${name}};`;
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
  return requiresReturnResult(type) ? `${getNativeType(type)}, ` : '';
}

function CONSTRUCT_PARAMS(params) {
  return params
    .map((type, idx) => {
      const { name } = type;
      if (idx === 0) {
        return `:(${getNativeType(type)})${name}`;
      }

      return `${name}:(${getNativeType(type)})${name}`;
    })
    .join(' ');
}

function CONSTRUCT_METHOD(name, parameters, returnType) {
  return `${name}${CONSTRUCT_PARAMS(parameters)}${
    returnType.type === 'promise'
      ? `${
          parameters.length > 0 ? ' resolve:' : ':'
        }(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject`
      : ''
  }`;
}

export function makeMethodScaffolding(functions) {
  return functions
    .map(({ name, returnType, parameters }) => {
      return `
${EXPORT_METHOD(returnType)}(${CONSTRUCT_RETURN(returnType)}${CONSTRUCT_METHOD(
        name,
        parameters,
        returnType
      )})
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

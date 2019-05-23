import {
  createHostFunctions,
  makeMethodMap,
  makeMethodScaffolding,
  makeSpecFunctions
} from './utils';

export const ModuleSpec = (name, functions) => `
/**
 * RCTNative${name}Spec.h
 * 
 * NOTE: This file is codegenerated.
 */

#import <vector>

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

#ifdef RN_TURBO_MODULE_ENABLED
#import <jsireact/RCTTurboModule.h>
#endif

/**
 * The ObjC protocol based on the Typescript type for ${name}.
 */
@protocol Native${name}Spec <
    RCTBridgeModule
#ifdef RN_TURBO_MODULE_ENABLED
    ,
    RCTTurboModule
#endif
    >

${makeSpecFunctions(functions)}

@end

#ifdef RN_TURBO_MODULE_ENABLED

namespace facebook {
namespace react {

/**
 * The iOS TurboModule impl specific to ${name}.
 */
class JSI_EXPORT Native${name}SpecJSI : public ObjCTurboModule {
public:
  Native${name}SpecJSI(id<RCTTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker);
};

} // namespace react
} // namespace facebook

#endif
`;

export const ModuleSpecMM = (name, methods) => `
/**
 * RCTNative${name}Spec.mm
 * 
 * NOTE: This file is codegenerated.
 */

#ifdef RN_TURBO_MODULE_ENABLED

#import "RCTNative${name}Spec.h"

namespace facebook {
namespace react {
${createHostFunctions(name, methods)}

Native${name}SpecJSI::Native${name}SpecJSI(id<RCTTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker)
    : ObjCTurboModule("${name}", instance, jsInvoker) {
  ${makeMethodMap(name, methods)}
}

} // namespace react
} // namespace facebook

#endif
`;

export const RCTModuleH = name => `
/**
 * RCT${name}.h
 * 
 * NOTE: This file is codegenerated.
 */

#import <Foundation/Foundation.h>

#import "RCTNative${name}Spec.h"

@interface RCT${name} : NSObject<Native${name}Spec>

@end
`;

export const RCTModule = (name, functions) => `
/**
 * RCT${name}.mm
 * 
 * NOTE: This file is codegenerated.
 */

#import "RCT${name}.h"

#import <UIKit/UIKit.h>

#ifdef RN_TURBO_MODULE_ENABLED
using namespace facebook::react;
#endif

@implementation RCT${name}

// Backward-compatible export
RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

#ifdef RN_TURBO_MODULE_ENABLED
@synthesize turboModuleLookupDelegate = _turboModuleLookupDelegate;
#endif

#ifdef RN_TURBO_MODULE_ENABLED

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<facebook::react::JSCallInvoker>)jsInvoker
{
  return std::make_shared<Native${name}SpecJSI>(self, jsInvoker);
}

#endif
${makeMethodScaffolding(functions)}

@end
`;

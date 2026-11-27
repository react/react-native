/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponentViewRegistry.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTMountingManager.h>
#import <React/RCTParagraphComponentView.h>
#import <React/RCTScheduler.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTUtils.h>
#import <XCTest/XCTest.h>
#import <objc/runtime.h>
#import <react/renderer/components/text/ParagraphShadowNode.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/utils/ContextContainer.h>

using namespace facebook::react;

@interface RCTTextDynamicTypeTests : XCTestCase
@end

@implementation RCTTextDynamicTypeTests

- (void)testSimulatedContentSizeCategoryNotificationRelayoutsMountedTextWithoutRemounting
{
  XCTAssertTrue([NSThread isMainThread]);
  UIApplication *application = RCTSharedApplication();
  XCTAssertNotNil(application);
  if (!application) {
    return;
  }

  Method categoryGetter = class_getInstanceMethod(application.class, @selector(preferredContentSizeCategory));
  XCTAssertNotEqual(categoryGetter, nullptr);
  if (!categoryGetter) {
    return;
  }

  RuntimeExecutor runtimeExecutor = [](std::function<void(facebook::jsi::Runtime &)> &&) {};
  auto runtimeScheduler = std::make_shared<RuntimeScheduler>(runtimeExecutor);
  auto contextContainer = std::make_shared<ContextContainer>();
  contextContainer->insert(RuntimeSchedulerKey, std::weak_ptr<RuntimeScheduler>(runtimeScheduler));
  RCTSurfacePresenter *presenter = [[RCTSurfacePresenter alloc] initWithContextContainer:contextContainer
                                                                         runtimeExecutor:runtimeExecutor
                                                              bridgelessBindingsExecutor:std::nullopt];
  __block RCTFabricSurface *surface = nil;
  __block UIContentSizeCategory category = UIContentSizeCategoryLarge;
  // Simulate the application's external category input, not OS Settings delivery or any renderer result.
  IMP simulatedCategoryGetter = imp_implementationWithBlock(^UIContentSizeCategory(id) {
    return category;
  });
  IMP originalCategoryGetter = method_setImplementation(categoryGetter, simulatedCategoryGetter);

  @try {
    UITraitCollection *largeTraits = [UITraitCollection traitCollectionWithTraitsFromCollections:@[
      UITraitCollection.currentTraitCollection,
      [UITraitCollection traitCollectionWithPreferredContentSizeCategory:UIContentSizeCategoryLarge]
    ]];
    [largeTraits performAsCurrentTraitCollection:^{
      surface = [[RCTFabricSurface alloc] initWithSurfacePresenter:presenter moduleName:@"" initialProperties:@{}];
      UIView *hostView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 240, 1000)];
      surface.view.frame = hostView.bounds;
      [hostView addSubview:surface.view];
      [surface setSize:hostView.bounds.size];
      [surface start];

      auto surfaceId = surface.surfaceHandler.getSurfaceId();
      auto uiManager = presenter.scheduler.uiManager;
      auto paragraphTag = surfaceId + 1;
      auto paragraph = uiManager->createNode(
          paragraphTag,
          "RCTText",
          surfaceId,
          RawProps(folly::dynamic::object("fontFamily", "Helvetica")("fontSize", 16)("allowFontScaling", true)),
          nullptr);
      auto rawText = uiManager->createNode(
          surfaceId + 2,
          "RCTRawText",
          surfaceId,
          RawProps(folly::dynamic::object("text", "Dynamic Type changes this paragraph without remounting.")),
          nullptr);
      uiManager->appendChild(paragraph, rawText);
      auto rootChildren = std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
      rootChildren->push_back(paragraph);
      uiManager->completeSurface(surfaceId, rootChildren, {});

      auto currentParagraph = [&] {
        return std::static_pointer_cast<const ParagraphShadowNode>(
            uiManager->findShadowNodeByTag_DEPRECATED(paragraphTag));
      };
      auto largeParagraph = currentParagraph();
      auto registry = presenter.mountingManager.componentViewRegistry;
      RCTParagraphComponentView *paragraphView =
          (RCTParagraphComponentView *)[registry findComponentViewWithTag:paragraphTag];
      XCTAssertNotEqual(largeParagraph.get(), nullptr);
      XCTAssertTrue([paragraphView isKindOfClass:RCTParagraphComponentView.class]);
      if (!largeParagraph || ![paragraphView isKindOfClass:RCTParagraphComponentView.class]) {
        return;
      }
      auto largeState = largeParagraph->getState();
      auto largeSize = largeParagraph->getStateData().layoutSize;
      auto constraints = surface.surfaceHandler.getLayoutConstraints();
      UIView *paragraphSuperview = paragraphView.superview;
      UIFont *largeFont = [paragraphView.attributedText attribute:NSFontAttributeName atIndex:0 effectiveRange:nil];
      XCTAssertEqualObjects(
          paragraphView.attributedText.string, @"Dynamic Type changes this paragraph without remounting.");
      XCTAssertEqualObjects(largeFont.fontName, @"Helvetica");
      XCTAssertEqualWithAccuracy(largeFont.pointSize, 16, 0.001);
      XCTAssertEqualWithAccuracy(surface.surfaceHandler.getLayoutContext().fontSizeMultiplier, 1, 0.0001);
      XCTAssertGreaterThan(largeSize.height, 0);
      XCTAssertEqualWithAccuracy(paragraphView.bounds.size.width, 240, 0.01);
      XCTAssertEqualWithAccuracy(paragraphView.bounds.size.height, largeSize.height, 0.01);

      UITraitCollection *accessibilityTraits = [UITraitCollection traitCollectionWithTraitsFromCollections:@[
        largeTraits,
        [UITraitCollection traitCollectionWithPreferredContentSizeCategory:UIContentSizeCategoryAccessibilityLarge]
      ]];
      __block State::Shared accessibilityState;
      [accessibilityTraits performAsCurrentTraitCollection:^{
        category = UIContentSizeCategoryAccessibilityLarge;
        [[NSNotificationCenter defaultCenter] postNotificationName:UIContentSizeCategoryDidChangeNotification
                                                            object:application
                                                          userInfo:@{UIContentSizeCategoryNewValueKey : category}];

        auto accessibilityParagraph = currentParagraph();
        XCTAssertNotEqual(accessibilityParagraph.get(), nullptr);
        if (!accessibilityParagraph) {
          return;
        }
        accessibilityState = accessibilityParagraph->getState();
        const auto &data = accessibilityParagraph->getStateData();
        UIFont *font = [paragraphView.attributedText attribute:NSFontAttributeName atIndex:0 effectiveRange:nil];
        XCTAssertEqualWithAccuracy(surface.surfaceHandler.getLayoutContext().fontSizeMultiplier, 2.143, 0.0001);
        XCTAssertTrue(surface.surfaceHandler.getLayoutConstraints() == constraints);
        XCTAssertEqual(&accessibilityParagraph->getFamily(), &largeParagraph->getFamily());
        XCTAssertEqual(accessibilityParagraph->getProps().get(), largeParagraph->getProps().get());
        XCTAssertNotEqual(accessibilityState.get(), largeState.get());
        XCTAssertFalse(data.attributedString.isContentEqual(largeParagraph->getStateData().attributedString));
        XCTAssertEqualWithAccuracy(data.attributedString.getBaseTextAttributes().fontSizeMultiplier, 2.143, 0.0001);
        XCTAssertEqualObjects(font.fontName, largeFont.fontName);
        XCTAssertEqualWithAccuracy(font.pointSize, 16 * 2.143, 0.001);
        XCTAssertGreaterThan(data.layoutSize.height, largeSize.height);
        XCTAssertEqual([registry findComponentViewWithTag:paragraphTag], paragraphView);
        XCTAssertEqual(paragraphView.superview, paragraphSuperview);
        XCTAssertEqualWithAccuracy(paragraphView.bounds.size.width, 240, 0.01);
        XCTAssertEqualWithAccuracy(paragraphView.bounds.size.height, data.layoutSize.height, 0.01);
      }];

      category = UIContentSizeCategoryLarge;
      [[NSNotificationCenter defaultCenter] postNotificationName:UIContentSizeCategoryDidChangeNotification
                                                          object:application
                                                        userInfo:@{UIContentSizeCategoryNewValueKey : category}];
      auto restoredParagraph = currentParagraph();
      XCTAssertNotEqual(restoredParagraph.get(), nullptr);
      if (!restoredParagraph) {
        return;
      }
      const auto &restoredData = restoredParagraph->getStateData();
      UIFont *restoredFont = [paragraphView.attributedText attribute:NSFontAttributeName atIndex:0 effectiveRange:nil];
      XCTAssertEqualWithAccuracy(surface.surfaceHandler.getLayoutContext().fontSizeMultiplier, 1, 0.0001);
      XCTAssertTrue(surface.surfaceHandler.getLayoutConstraints() == constraints);
      XCTAssertEqual(&restoredParagraph->getFamily(), &largeParagraph->getFamily());
      XCTAssertEqual(restoredParagraph->getProps().get(), largeParagraph->getProps().get());
      XCTAssertNotEqual(restoredParagraph->getState().get(), accessibilityState.get());
      XCTAssertTrue(restoredData.attributedString.isContentEqual(largeParagraph->getStateData().attributedString));
      XCTAssertEqualObjects(restoredFont.fontName, largeFont.fontName);
      XCTAssertEqualWithAccuracy(restoredFont.pointSize, largeFont.pointSize, 0.001);
      XCTAssertEqualWithAccuracy(restoredData.layoutSize.width, largeSize.width, 0.01);
      XCTAssertEqualWithAccuracy(restoredData.layoutSize.height, largeSize.height, 0.01);
      XCTAssertEqual([registry findComponentViewWithTag:paragraphTag], paragraphView);
      XCTAssertEqual(paragraphView.superview, paragraphSuperview);
      XCTAssertEqualWithAccuracy(paragraphView.bounds.size.width, 240, 0.01);
      XCTAssertEqualWithAccuracy(paragraphView.bounds.size.height, largeSize.height, 0.01);
    }];
  } @finally {
    method_setImplementation(categoryGetter, originalCategoryGetter);
    imp_removeBlock(simulatedCategoryGetter);
    [surface stop];
    [presenter suspend];
  }
}

@end

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTEnhancedScrollView.h>
#import <React/RCTScrollContentViewComponentView.h>
#import <React/RCTScrollViewComponentView.h>
#import <XCTest/XCTest.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#import <react/renderer/components/scrollview/ScrollContentViewComponentDescriptor.h>
#import <react/renderer/components/scrollview/ScrollContentViewState.h>
#import <react/renderer/components/scrollview/ScrollViewProps.h>
#import <react/renderer/components/scrollview/ScrollViewShadowNode.h>
#import <react/renderer/core/EventBeat.h>
#import <react/renderer/core/EventDispatcher.h>
#import <react/renderer/core/EventQueueProcessor.h>
#import <react/renderer/core/StateUpdate.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/utils/ContextContainer.h>

#import <functional>
#import <memory>
#import <utility>

using facebook::react::Props;
using facebook::react::ScrollViewProps;
using facebook::react::ScrollViewShadowNode;

#if TARGET_OS_IOS

static Props::Shared makeScrollViewProps(bool automaticallyAdjustKeyboardInsets)
{
  auto props = std::make_shared<ScrollViewProps>();
  props->automaticallyAdjustKeyboardInsets = automaticallyAdjustKeyboardInsets;
  return props;
}

namespace {

using facebook::react::ComponentDescriptorParameters;
using facebook::react::ContextContainer;
using facebook::react::EventBeat;
using facebook::react::EventDispatcher;
using facebook::react::EventLogger;
using facebook::react::EventQueue;
using facebook::react::EventQueueProcessor;
using facebook::react::ReactNativeFeatureFlags;
using facebook::react::ReactNativeFeatureFlagsDefaults;
using facebook::react::RuntimeScheduler;
using facebook::react::ScrollContentViewComponentDescriptor;
using facebook::react::ScrollContentViewShadowNode;
using facebook::react::ScrollContentViewState;
using facebook::react::ShadowNodeFamily;
using facebook::react::State;
using facebook::react::StateData;
using facebook::react::StatePipe;
using facebook::react::StateUpdate;

class ImmediateScrollContentFeatureFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableImmediateUpdateModeForScrollContentView() override
  {
    return true;
  }
};

class ScopedScrollContentFeatureFlags {
 public:
  explicit ScopedScrollContentFeatureFlags(bool enabled)
  {
    ReactNativeFeatureFlags::dangerouslyReset();
    if (enabled) {
      ReactNativeFeatureFlags::override(std::make_unique<ImmediateScrollContentFeatureFlags>());
    }
  }

  ~ScopedScrollContentFeatureFlags()
  {
    ReactNativeFeatureFlags::dangerouslyReset();
  }
};

class ScrollContentStateDispatch {
 public:
  ScrollContentStateDispatch() : runtimeScheduler_([](std::function<void(facebook::jsi::Runtime &)> && /*callback*/) {})
  {
    StatePipe statePipe = [this](const StateUpdate &update) {
      auto data = update.callback(initialData_);
      if (update.family == contentFamily_) {
        latestData = *std::static_pointer_cast<const ScrollContentViewState>(data);
        nativeStateChanges++;
      } else if (update.family == unrelatedFamily_) {
        latestUnrelatedData = *std::static_pointer_cast<const ScrollContentViewState>(data);
        unrelatedStateChanges++;
      }
    };
    auto ownerBox = std::make_shared<EventBeat::OwnerBox>();
    dispatcher_ = std::make_shared<EventDispatcher>(
        EventQueueProcessor({}, {}, statePipe, {}),
        std::make_unique<EventBeat>(ownerBox, runtimeScheduler_),
        statePipe,
        std::weak_ptr<EventLogger>{});
    ownerBox->owner = dispatcher_;
    descriptor_ = std::make_unique<ScrollContentViewComponentDescriptor>(ComponentDescriptorParameters{
        .eventDispatcher = dispatcher_, .contextContainer = std::make_shared<ContextContainer>(), .flavor = nullptr});
    contentFamily_ = descriptor_->createFamily({.tag = 1, .surfaceId = 1, .instanceHandle = nullptr});
    unrelatedFamily_ = descriptor_->createFamily({.tag = 2, .surfaceId = 1, .instanceHandle = nullptr});
    flushFamily_ = descriptor_->createFamily({.tag = 3, .surfaceId = 1, .instanceHandle = nullptr});
    state_ = descriptor_->createInitialState(ScrollContentViewShadowNode::defaultSharedProps(), contentFamily_);
  }

  const State::Shared &state() const
  {
    return state_;
  }

  void queueUnrelatedState()
  {
    auto data = ScrollContentViewState{};
    data.safeAreaPadding.top = 99;
    auto newData = std::make_shared<const ScrollContentViewState>(data);
    dispatcher_->dispatchStateUpdate(
        {.family = unrelatedFamily_,
         .callback = [newData](const StateData::Shared & /*oldData*/) -> StateData::Shared { return newData; }},
        EventQueue::UpdateMode::Asynchronous);
  }

  void flushQueuedState()
  {
    // A distinct-family legacy immediate update drains the dispatcher's private queue without a JavaScript runtime.
    dispatcher_->dispatchStateUpdate(
        {.family = flushFamily_,
         .callback = [data = initialData_](const StateData::Shared & /*oldData*/) -> StateData::Shared {
           return data;
         }},
        EventQueue::UpdateMode::unstable_Immediate);
  }

  ScrollContentViewState latestData{};
  ScrollContentViewState latestUnrelatedData{};
  unsigned nativeStateChanges{0};
  unsigned unrelatedStateChanges{0};

 private:
  RuntimeScheduler runtimeScheduler_;
  std::unique_ptr<ScrollContentViewComponentDescriptor> descriptor_;
  std::shared_ptr<EventDispatcher> dispatcher_;
  ShadowNodeFamily::Shared contentFamily_;
  ShadowNodeFamily::Shared unrelatedFamily_;
  ShadowNodeFamily::Shared flushFamily_;
  State::Shared state_;
  std::shared_ptr<const ScrollContentViewState> initialData_ = std::make_shared<const ScrollContentViewState>();
};

} // namespace

@interface RCTScrollViewComponentView (Tests)
- (void)_keyboardWillChangeFrame:(NSNotification *)notification;
@end

@interface RCTInsetTestScrollView : RCTEnhancedScrollView
@property (nonatomic, assign) UIEdgeInsets simulatedSafeAreaInsets;
@property (nonatomic, assign) BOOL notifiesInsetChangesSynchronously;
@property (nonatomic, assign) BOOL keepsContentOffsetOnInsetChange;
@end

@implementation RCTInsetTestScrollView

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  CGPoint offset = self.contentOffset;
  [super setContentInset:contentInset];
  if (_keepsContentOffsetOnInsetChange) {
    self.contentOffset = offset;
  }
  if (_notifiesInsetChangesSynchronously) {
    [self adjustedContentInsetDidChange];
  }
}

- (UIEdgeInsets)adjustedContentInset
{
  UIEdgeInsets inset = self.contentInset;
  inset.top += _simulatedSafeAreaInsets.top;
  inset.left += _simulatedSafeAreaInsets.left;
  inset.bottom += _simulatedSafeAreaInsets.bottom;
  inset.right += _simulatedSafeAreaInsets.right;
  return inset;
}

@end

@interface RCTScrollViewComponentViewTests : XCTestCase
@end

@implementation RCTScrollViewComponentViewTests

- (void)testAutomaticallyAdjustKeyboardInsetsAcrossRecycling
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  auto props = makeScrollViewProps(true);
  [view updateProps:props oldProps:ScrollViewShadowNode::defaultSharedProps()];

  NSNotification *notification = [NSNotification
      notificationWithName:UIKeyboardWillChangeFrameNotification
                    object:nil
                  userInfo:@{
                    UIKeyboardAnimationDurationUserInfoKey : @0,
                    UIKeyboardAnimationCurveUserInfoKey : @(UIViewAnimationCurveLinear),
                    UIKeyboardFrameBeginUserInfoKey : [NSValue valueWithCGRect:CGRectMake(0, 100, 100, 50)],
                    UIKeyboardFrameEndUserInfoKey : [NSValue valueWithCGRect:CGRectMake(0, 50, 100, 50)],
                  }];

  [view _keyboardWillChangeFrame:notification];
  XCTAssertEqual(view.scrollView.contentInset.bottom, 50);

  [view prepareForRecycle];
  UIEdgeInsets insetsAfterRecycle = view.scrollView.contentInset;
  [view _keyboardWillChangeFrame:notification];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.scrollView.contentInset, insetsAfterRecycle));

  [view updateProps:props oldProps:nullptr];
  [view _keyboardWillChangeFrame:notification];
  XCTAssertEqual(view.scrollView.contentInset.bottom, 50);
}

// XCTest assertion macros use variadic reporting and catch framework exceptions by value.
// NOLINTBEGIN(cppcoreguidelines-pro-type-vararg, misc-throw-by-value-catch-by-reference)
- (void)testSafeAreaCorrectionPreservesPullToRefreshInset
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.padsContentForSafeArea = YES;
  view.contentInset = UIEdgeInsetsMake(60, 0, 0, 0);

  [view adjustedContentInsetDidChange];
  view.horizontal = NO;
  [view adjustedContentInsetDidChange];
  XCTAssertEqual(view.contentInset.top, 60);

  UIEdgeInsets inset = view.contentInset;
  inset.top -= 60;
  view.contentInset = inset;
  [view adjustedContentInsetDidChange];
  XCTAssertEqual(view.contentInset.top, 0);
}

- (void)testSafeAreaCorrectionPreservesKeyboardInset
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.baseContentInset = UIEdgeInsetsMake(10, 20, 30, 40);
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 15, 0, 25);
  view.padsContentForSafeArea = YES;
  UIEdgeInsets inset = view.contentInset;
  inset.bottom += 300;
  view.contentInset = inset;

  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(10, 5, 330, 15)));
  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(10, 5, 330, 15)));
}

- (void)testSafeAreaChangesPreserveExternalInsets
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.baseContentInset = UIEdgeInsetsMake(10, 20, 30, 40);
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 15, 0, 25);
  view.padsContentForSafeArea = YES;
  UIEdgeInsets inset = view.contentInset;
  inset.top += 60;
  inset.left += 7;
  view.contentInset = inset;

  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 25, 0, 35);
  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(70, 2, 30, 5)));

  view.padsContentForSafeArea = NO;
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(70, 27, 30, 40)));
}

- (void)testHorizontalSafeAreaCorrectionPreservesExternalInsets
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.horizontal = YES;
  view.baseContentInset = UIEdgeInsetsMake(10, 20, 30, 40);
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(5, 0, 15, 0);
  view.padsContentForSafeArea = YES;
  UIEdgeInsets inset = view.contentInset;
  inset.left += 60;
  view.contentInset = inset;

  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(5, 80, 15, 40)));

  view.horizontal = NO;
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(10, 80, 30, 40)));
}

- (void)testBaseInsetReplacementKeepsContentPinnedAcrossTheScrollAxis
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.keepsContentOffsetOnInsetChange = YES;
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 15, 0, 25);
  view.padsContentForSafeArea = YES;
  view.contentOffset = CGPointZero;

  view.baseContentInset = UIEdgeInsetsMake(10, 20, 30, 40);
  XCTAssertEqual(view.contentOffset.x, -20);

  view.contentOffset = CGPointMake(100, 0);
  view.baseContentInset = UIEdgeInsetsMake(20, 30, 40, 50);
  XCTAssertEqual(view.contentOffset.x, 100);
}

- (void)testSynchronousInsetCallbacksPreserveFractionalInsets
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.notifiesInsetChangesSynchronously = YES;
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 15.5, 0, 25.25);
  view.padsContentForSafeArea = YES;
  view.contentInset = UIEdgeInsetsMake(60.5, -15.5, 0, -25.25);

  [view adjustedContentInsetDidChange];
  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(60.5, -15.5, 0, -25.25)));

  view.baseContentInset = UIEdgeInsetsZero;
  view.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
  view.padsContentForSafeArea = NO;
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsZero));

  view.baseContentInset = UIEdgeInsetsMake(1.25, 2.5, 3.75, 4.5);
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(1.25, 2.5, 3.75, 4.5)));
}

- (void)testBaseContentInsetReplacesPreviousInsetWithoutAccumulatingSafeAreaCorrection
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 15, 0, 25);
  view.padsContentForSafeArea = YES;
  view.baseContentInset = UIEdgeInsetsMake(10, 20, 30, 40);
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(10, 5, 30, 15)));

  view.baseContentInset = UIEdgeInsetsMake(20, 30, 40, 50);
  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(20, 15, 40, 25)));
}

- (void)testScrollContentSafeAreaSetterDefaultsToAsynchronousStateUpdate
{
  ScopedScrollContentFeatureFlags flags(false);
  ScrollContentStateDispatch stateDispatch;
  RCTScrollContentViewComponentView *view = [RCTScrollContentViewComponentView new];
  [view updateState:stateDispatch.state() oldState:nullptr];
  XCTAssertFalse(facebook::react::ReactNativeFeatureFlags::enableImmediateUpdateModeForScrollContentView());

  [view setSafeAreaPadding:UIEdgeInsetsMake(20, 0, 10, 0) contentInsetAdjustment:UIEdgeInsetsMake(7, 0, 3, 0)];

  XCTAssertEqual(stateDispatch.nativeStateChanges, 0u);
  stateDispatch.flushQueuedState();
  XCTAssertEqual(stateDispatch.nativeStateChanges, 1u);
  XCTAssertEqual(stateDispatch.latestData.safeAreaPadding.top, 20);
  XCTAssertEqual(stateDispatch.latestData.safeAreaPadding.bottom, 10);
  XCTAssertEqual(stateDispatch.latestData.contentInsetAdjustment.top, 7);
  XCTAssertEqual(stateDispatch.latestData.contentInsetAdjustment.bottom, 3);
}

- (void)testScrollContentSafeAreaSetterFlagUsesImmediateStateUpdate
{
  ScopedScrollContentFeatureFlags flags(true);
  ScrollContentStateDispatch stateDispatch;
  RCTScrollContentViewComponentView *view = [RCTScrollContentViewComponentView new];
  [view updateState:stateDispatch.state() oldState:nullptr];
  stateDispatch.queueUnrelatedState();
  XCTAssertTrue(facebook::react::ReactNativeFeatureFlags::enableImmediateUpdateModeForScrollContentView());

  [view setSafeAreaPadding:UIEdgeInsetsMake(20, 0, 10, 0) contentInsetAdjustment:UIEdgeInsetsMake(7, 0, 3, 0)];

  XCTAssertEqual(stateDispatch.nativeStateChanges, 1u);
  XCTAssertEqual(stateDispatch.unrelatedStateChanges, 1u);
  XCTAssertEqual(stateDispatch.latestUnrelatedData.safeAreaPadding.top, 99);
  XCTAssertEqual(stateDispatch.latestData.safeAreaPadding.top, 20);
  XCTAssertEqual(stateDispatch.latestData.contentInsetAdjustment.top, 7);

  [view setSafeAreaPadding:UIEdgeInsetsMake(30, 0, 12, 0) contentInsetAdjustment:UIEdgeInsetsMake(9, 0, 4, 0)];

  XCTAssertEqual(stateDispatch.nativeStateChanges, 2u);
  XCTAssertEqual(stateDispatch.unrelatedStateChanges, 1u);
  XCTAssertEqual(stateDispatch.latestData.safeAreaPadding.top, 30);
  XCTAssertEqual(stateDispatch.latestData.contentInsetAdjustment.top, 9);
  stateDispatch.flushQueuedState();
  XCTAssertEqual(stateDispatch.nativeStateChanges, 2u);
  XCTAssertEqual(stateDispatch.unrelatedStateChanges, 1u);
  XCTAssertEqual(stateDispatch.latestUnrelatedData.safeAreaPadding.top, 99);
}

- (void)testScrollContentFinalizeDefaultsToAsynchronousStateUpdate
{
  ScopedScrollContentFeatureFlags flags(false);
  ScrollContentStateDispatch stateDispatch;
  RCTScrollContentViewComponentView *view = [RCTScrollContentViewComponentView new];
  [view setSafeAreaPadding:UIEdgeInsetsMake(20, 0, 10, 0) contentInsetAdjustment:UIEdgeInsetsMake(7, 0, 3, 0)];
  [view updateState:stateDispatch.state() oldState:nullptr];
  XCTAssertEqual(stateDispatch.nativeStateChanges, 0u);
  XCTAssertFalse(facebook::react::ReactNativeFeatureFlags::enableImmediateUpdateModeForScrollContentView());

  [view finalizeUpdates:RNComponentViewUpdateMaskState];

  XCTAssertEqual(stateDispatch.nativeStateChanges, 0u);
  stateDispatch.flushQueuedState();
  XCTAssertEqual(stateDispatch.nativeStateChanges, 1u);
  XCTAssertEqual(stateDispatch.latestData.safeAreaPadding.top, 20);
  XCTAssertEqual(stateDispatch.latestData.contentInsetAdjustment.top, 7);
}

- (void)testScrollContentFinalizeFlagUsesImmediateStateUpdate
{
  ScopedScrollContentFeatureFlags flags(true);
  ScrollContentStateDispatch stateDispatch;
  RCTScrollContentViewComponentView *view = [RCTScrollContentViewComponentView new];
  [view setSafeAreaPadding:UIEdgeInsetsMake(20, 0, 10, 0) contentInsetAdjustment:UIEdgeInsetsMake(7, 0, 3, 0)];
  [view updateState:stateDispatch.state() oldState:nullptr];
  stateDispatch.queueUnrelatedState();
  XCTAssertEqual(stateDispatch.nativeStateChanges, 0u);
  XCTAssertTrue(facebook::react::ReactNativeFeatureFlags::enableImmediateUpdateModeForScrollContentView());

  [view finalizeUpdates:RNComponentViewUpdateMaskState];

  XCTAssertEqual(stateDispatch.nativeStateChanges, 1u);
  XCTAssertEqual(stateDispatch.unrelatedStateChanges, 1u);
  XCTAssertEqual(stateDispatch.latestUnrelatedData.safeAreaPadding.top, 99);
  XCTAssertEqual(stateDispatch.latestData.safeAreaPadding.top, 20);
  XCTAssertEqual(stateDispatch.latestData.contentInsetAdjustment.top, 7);
  stateDispatch.flushQueuedState();
  XCTAssertEqual(stateDispatch.nativeStateChanges, 1u);
  XCTAssertEqual(stateDispatch.unrelatedStateChanges, 1u);
  XCTAssertEqual(stateDispatch.latestUnrelatedData.safeAreaPadding.top, 99);
}
// NOLINTEND(cppcoreguidelines-pro-type-vararg, misc-throw-by-value-catch-by-reference)

@end

#endif

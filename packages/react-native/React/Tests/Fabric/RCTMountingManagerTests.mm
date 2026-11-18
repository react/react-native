/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTMountingManager.h>
#import <React/RCTMountingManagerDelegate.h>
#import <React/RCTViewComponentView.h>

#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#import <react/renderer/components/view/ConcreteViewShadowNode.h>
#import <react/renderer/core/ConcreteComponentDescriptor.h>
#import <react/renderer/core/LayoutConstraints.h>
#import <react/renderer/core/LayoutContext.h>
#import <react/renderer/core/PropsParserContext.h>
#import <react/renderer/mounting/MountingCoordinator.h>
#import <react/renderer/mounting/ShadowTree.h>
#import <react/renderer/mounting/ShadowTreeDelegate.h>
#import <react/utils/ContextContainer.h>

#import <map>
#import <memory>
#import <string>
#import <vector>

using namespace facebook::react;

namespace {

const char MountingManagerTestViewComponentName[] = "MountingManagerTestView";

using MountingManagerTestViewShadowNode = ConcreteViewShadowNode<MountingManagerTestViewComponentName>;
using MountingManagerTestViewComponentDescriptor = ConcreteComponentDescriptor<MountingManagerTestViewShadowNode>;

/*
 * Accepts every commit. The tests hand the mounting coordinator to the
 * mounting manager themselves, as the scheduler does in the "update the
 * rendering" step.
 */
class PassThroughShadowTreeDelegate : public ShadowTreeDelegate {
 public:
  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree & /*shadowTree*/,
      const RootShadowNode::Shared & /*oldRootShadowNode*/,
      const RootShadowNode::Unshared &newRootShadowNode,
      const ShadowTreeCommitOptions & /*commitOptions*/) const override
  {
    return newRootShadowNode;
  }

  void shadowTreeDidFinishTransaction(
      std::shared_ptr<const MountingCoordinator> /*mountingCoordinator*/,
      bool /*mountSynchronously*/) const override
  {
  }

  void shadowTreeDidFinishReactCommit(const ShadowTree & /*shadowTree*/) const override {}
};

class SameFrameMountFeatureFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableSameFrameMountForDiscreteEvents() override
  {
    return true;
  }
};

// The log the test views and the delegate write to; main thread only.
NSMutableArray<NSString *> *RCTMountingManagerTestLog;

constexpr SurfaceId kSurfaceId = 1;

/*
 * A child of the root view, with the rows (children) it should contain and the
 * `nativeID` it carries (standing in for the props a command depends on, such
 * as the text of an input).
 */
struct TestViewSpec {
  Tag tag;
  std::string nativeId;
  std::vector<Tag> rows;
};

} // namespace

/*
 * Logs each command it receives together with what the command can observe:
 * whether the view is mounted, its props and its children.
 */
@interface RCTMountingManagerTestView : RCTViewComponentView
@end

@implementation RCTMountingManagerTestView

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<MountingManagerTestViewComponentDescriptor>();
}

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  const auto &props = static_cast<const ViewProps &>(*self.props);
  [RCTMountingManagerTestLog addObject:[NSString stringWithFormat:@"%@ %ld mounted=%d nativeID=%s rows=%lu",
                                                                  commandName,
                                                                  (long)self.tag,
                                                                  self.superview != nil,
                                                                  props.nativeId.c_str(),
                                                                  (unsigned long)self.subviews.count]];
}

@end

@interface RCTMountingManagerTestDelegate : NSObject <RCTMountingManagerDelegate>
@property (nonatomic, copy) void (^onWillMount)(void);
@end

@implementation RCTMountingManagerTestDelegate

- (void)mountingManager:(RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ReactTag)rootTag
{
  if (self.onWillMount) {
    void (^onWillMount)(void) = self.onWillMount;
    self.onWillMount = nil;
    onWillMount();
  }
}

- (void)mountingManager:(RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ReactTag)rootTag
{
  [RCTMountingManagerTestLog addObject:@"mount"];
}

@end

@interface RCTMountingManagerTests : XCTestCase
@end

@implementation RCTMountingManagerTests {
  RCTMountingManager *_mountingManager;
  RCTMountingManagerTestDelegate *_delegate;
  UIView *_surfaceView;
  dispatch_queue_t _javaScriptQueue;
  std::shared_ptr<const ContextContainer> _contextContainer;
  std::unique_ptr<MountingManagerTestViewComponentDescriptor> _viewComponentDescriptor;
  std::map<Tag, ShadowNodeFamily::Shared> _families;
  PassThroughShadowTreeDelegate _shadowTreeDelegate;
  std::unique_ptr<ShadowTree> _shadowTree;
  std::shared_ptr<const MountingCoordinator> _mountingCoordinator;
}

- (void)setUp
{
  [super setUp];
  ReactNativeFeatureFlags::dangerouslyReset();
  ReactNativeFeatureFlags::override(std::make_unique<SameFrameMountFeatureFlags>());

  RCTMountingManagerTestLog = [NSMutableArray new];
  [[RCTComponentViewFactory currentComponentViewFactory] registerComponentViewClass:[RCTMountingManagerTestView class]];

  _contextContainer = std::make_shared<const ContextContainer>();
  auto parameters = ComponentDescriptorParameters{
      .eventDispatcher = EventDispatcher::Shared{}, .contextContainer = _contextContainer, .flavor = nullptr};
  _viewComponentDescriptor = std::make_unique<MountingManagerTestViewComponentDescriptor>(parameters);

  _mountingManager = [RCTMountingManager new];
  _mountingManager.contextContainer = _contextContainer;
  _delegate = [RCTMountingManagerTestDelegate new];
  _mountingManager.delegate = _delegate;
  _surfaceView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  [_mountingManager attachSurfaceToView:_surfaceView surfaceId:kSurfaceId];
  _javaScriptQueue = dispatch_queue_create("RCTMountingManagerTests.javascript", DISPATCH_QUEUE_SERIAL);

  _shadowTree = std::make_unique<ShadowTree>(
      kSurfaceId, LayoutConstraints{}, LayoutContext{}, _shadowTreeDelegate, *_contextContainer);
  _mountingCoordinator = _shadowTree->getMountingCoordinator();

  // Every test starts with view 2 ("old", one row) mounted.
  [self pushViews:{{2, "old", {20}}}];
  [_mountingManager scheduleTransaction:_mountingCoordinator];
  [RCTMountingManagerTestLog removeAllObjects];
}

- (void)tearDown
{
  _shadowTree.reset();
  ReactNativeFeatureFlags::dangerouslyReset();
  RCTMountingManagerTestLog = nil;
  [super tearDown];
}

#pragma mark - Helpers

- (ShadowNodeFamily::Shared)familyForTag:(Tag)tag descriptor:(const ComponentDescriptor &)descriptor
{
  auto &family = _families[tag];
  if (!family) {
    family = descriptor.createFamily(
        ShadowNodeFamilyFragment{.tag = tag, .surfaceId = kSurfaceId, .instanceHandle = nullptr});
  }
  return family;
}

- (std::shared_ptr<const ShadowNode>)viewWithTag:(Tag)tag
                                        nativeId:(const std::string &)nativeId
                                        children:(std::vector<std::shared_ptr<const ShadowNode>>)children
{
  auto rawProps = folly::dynamic::object("collapsable", false)("nativeID", nativeId);
  auto props = _viewComponentDescriptor->cloneProps(
      PropsParserContext{kSurfaceId, *_contextContainer}, nullptr, RawProps(std::move(rawProps)));
  return _viewComponentDescriptor->createShadowNode(
      ShadowNodeFragment{
          .props = props,
          .children = std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(std::move(children))},
      [self familyForTag:tag descriptor:*_viewComponentDescriptor]);
}

// What the JavaScript thread does when React commits: a new revision of the
// shadow tree with the given children.
- (void)pushViews:(const std::vector<TestViewSpec> &)views
{
  auto children = std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
  for (const auto &view : views) {
    std::vector<std::shared_ptr<const ShadowNode>> rows;
    for (auto row : view.rows) {
      rows.push_back([self viewWithTag:row nativeId:"row" children:{}]);
    }
    children->push_back([self viewWithTag:view.tag nativeId:view.nativeId children:std::move(rows)]);
  }
  std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>> newChildren = children;
  _shadowTree->commit(
      [&](const RootShadowNode &oldRootShadowNode) {
        return std::static_pointer_cast<RootShadowNode>(
            oldRootShadowNode.ShadowNode::clone(ShadowNodeFragment{.children = newChildren}));
      },
      {});
}

// Runs `block` on another thread (standing in for the JavaScript thread's
// "update the rendering" step) and returns once it has run, before the main
// queue gets to anything it scheduled.
- (void)onJavaScriptThread:(dispatch_block_t)block
{
  dispatch_sync(_javaScriptQueue, block);
}

- (void)spinMainQueueUntilLogCount:(NSUInteger)count
{
  NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:2];
  while (RCTMountingManagerTestLog.count < count && [deadline timeIntervalSinceNow] > 0) {
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.01]];
  }
  // Let anything stranded or duplicated show up too.
  [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.05]];
}

- (void)drainMainQueue
{
  [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
}

#pragma mark - A transaction followed by a command in the same tick

// A text input's layout effect sets the native text after React commits the
// new value: the command must see the committed props.
- (void)testSetTextAndSelectionAfterACommitSeesTheCommittedProps
{
  RCTMountingManager *mountingManager = _mountingManager;
  auto coordinator = _mountingCoordinator;
  [self onJavaScriptThread:^{
    [self pushViews:{{2, "new", {20}}}];
    [mountingManager scheduleTransaction:coordinator];
    [mountingManager dispatchCommand:2 commandName:@"setTextAndSelection" args:@[]];
  }];
  [self spinMainQueueUntilLogCount:2];

  NSArray *expected = @[ @"mount", @"setTextAndSelection 2 mounted=1 nativeID=new rows=1" ];
  XCTAssertEqualObjects(RCTMountingManagerTestLog, expected);
}

// `focus()` in an effect of a view that was just created: the command must
// find the view mounted.
- (void)testFocusAfterTheCommitThatCreatesTheViewFindsItMounted
{
  RCTMountingManager *mountingManager = _mountingManager;
  auto coordinator = _mountingCoordinator;
  [self onJavaScriptThread:^{
    [self pushViews:{{2, "old", {20}}, {3, "input", {}}}];
    [mountingManager scheduleTransaction:coordinator];
    [mountingManager dispatchCommand:3 commandName:@"focus" args:@[]];
  }];
  [self spinMainQueueUntilLogCount:2];

  NSArray *expected = @[ @"mount", @"focus 3 mounted=1 nativeID=input rows=0" ];
  XCTAssertEqualObjects(RCTMountingManagerTestLog, expected);
}

// `scrollToEnd()` after appending a row: the command must see the new row.
- (void)testScrollToEndAfterAppendingARowSeesTheRow
{
  RCTMountingManager *mountingManager = _mountingManager;
  auto coordinator = _mountingCoordinator;
  [self onJavaScriptThread:^{
    [self pushViews:{{2, "old", {20, 21}}}];
    [mountingManager scheduleTransaction:coordinator];
    [mountingManager dispatchCommand:2 commandName:@"scrollToEnd" args:@[]];
  }];
  [self spinMainQueueUntilLogCount:2];

  NSArray *expected = @[ @"mount", @"scrollToEnd 2 mounted=1 nativeID=old rows=2" ];
  XCTAssertEqualObjects(RCTMountingManagerTestLog, expected);
}

#pragma mark - Other orders

- (void)testCommandBeforeATransactionRunsFirst
{
  RCTMountingManager *mountingManager = _mountingManager;
  auto coordinator = _mountingCoordinator;
  [self onJavaScriptThread:^{
    [mountingManager dispatchCommand:2 commandName:@"focus" args:@[]];
    [self pushViews:{{2, "new", {20}}}];
    [mountingManager scheduleTransaction:coordinator];
  }];
  [self spinMainQueueUntilLogCount:2];

  NSArray *expected = @[ @"focus 2 mounted=1 nativeID=old rows=1", @"mount" ];
  XCTAssertEqualObjects(RCTMountingManagerTestLog, expected);
}

- (void)testCommandBetweenTwoTransactionsRunsAfterAMount
{
  RCTMountingManager *mountingManager = _mountingManager;
  auto coordinator = _mountingCoordinator;
  [self onJavaScriptThread:^{
    [self pushViews:{{2, "first", {20}}}];
    [mountingManager scheduleTransaction:coordinator];
    [mountingManager dispatchCommand:2 commandName:@"focus" args:@[]];
  }];
  [self onJavaScriptThread:^{
    [self pushViews:{{2, "second", {20}}}];
    [mountingManager scheduleTransaction:coordinator];
  }];
  [self spinMainQueueUntilLogCount:3];

  // The mounting coordinator hands out the latest committed revision, so the
  // first mount may already include the second commit. Either way the
  // command runs after a mount of a revision committed before it, never
  // against the old tree, and the last commit is not stranded.
  XCTAssertGreaterThanOrEqual(RCTMountingManagerTestLog.count, 2u);
  XCTAssertEqualObjects(RCTMountingManagerTestLog[0], @"mount");
  XCTAssertTrue(
      [RCTMountingManagerTestLog[1] isEqualToString:@"focus 2 mounted=1 nativeID=first rows=1"] ||
      [RCTMountingManagerTestLog[1] isEqualToString:@"focus 2 mounted=1 nativeID=second rows=1"]);
  [mountingManager dispatchCommand:2 commandName:@"blur" args:@[]];
  XCTAssertEqualObjects(RCTMountingManagerTestLog.lastObject, @"blur 2 mounted=1 nativeID=second rows=1");
}

#pragma mark - Running pending operations early

// What the event beat does from the display phase of the input's frame.
- (void)testPerformPendingOperationsRunsTransactionsAndCommandsInOrderRightAway
{
  RCTMountingManager *mountingManager = _mountingManager;
  auto coordinator = _mountingCoordinator;
  [self onJavaScriptThread:^{
    [self pushViews:{{2, "new", {20}}}];
    [mountingManager scheduleTransaction:coordinator];
    [mountingManager dispatchCommand:2 commandName:@"setTextAndSelection" args:@[]];
  }];

  [_mountingManager performPendingOperations];
  NSArray *expected = @[ @"mount", @"setTextAndSelection 2 mounted=1 nativeID=new rows=1" ];
  XCTAssertEqualObjects(RCTMountingManagerTestLog, expected);

  // The main queue blocks find nothing left to do.
  [self drainMainQueue];
  XCTAssertEqualObjects(RCTMountingManagerTestLog, expected);
}

- (void)testPerformPendingOperationsDuringATransactionRunsThemWhenItEnds
{
  RCTMountingManager *mountingManager = _mountingManager;
  __block BOOL commandRanInsideTheTransaction = NO;
  _delegate.onWillMount = ^{
    [self onJavaScriptThread:^{
      [mountingManager dispatchCommand:2 commandName:@"focus" args:@[]];
    }];
    [mountingManager performPendingOperations];
    commandRanInsideTheTransaction = RCTMountingManagerTestLog.count > 0;
  };

  // A transaction performed on the main thread (as a merge of a React
  // revision on the main thread does).
  [self pushViews:{{2, "new", {20}}}];
  [_mountingManager scheduleTransaction:_mountingCoordinator];

  XCTAssertFalse(commandRanInsideTheTransaction);
  // Without spinning the main queue: the transaction ran the deferred drain.
  NSArray *expected = @[ @"mount", @"focus 2 mounted=1 nativeID=new rows=1" ];
  XCTAssertEqualObjects(RCTMountingManagerTestLog, expected);
}

- (void)testTransactionOnTheMainThreadRunsAfterTheCommandsQueuedBeforeIt
{
  RCTMountingManager *mountingManager = _mountingManager;
  [self onJavaScriptThread:^{
    [mountingManager dispatchCommand:2 commandName:@"focus" args:@[]];
  }];

  [self pushViews:{{2, "new", {20}}}];
  [_mountingManager scheduleTransaction:_mountingCoordinator];

  NSArray *expected = @[ @"focus 2 mounted=1 nativeID=old rows=1", @"mount" ];
  XCTAssertEqualObjects(RCTMountingManagerTestLog, expected);
}

#pragma mark - Without the flag

- (void)testWithoutTheFlagACommandStillRunsAfterTheTransactionBeforeIt
{
  ReactNativeFeatureFlags::dangerouslyReset();
  RCTMountingManager *mountingManager = _mountingManager;
  auto coordinator = _mountingCoordinator;
  [self onJavaScriptThread:^{
    [self pushViews:{{2, "new", {20}}}];
    [mountingManager scheduleTransaction:coordinator];
    [mountingManager dispatchCommand:2 commandName:@"setTextAndSelection" args:@[]];
  }];
  [_mountingManager performPendingOperations];
  XCTAssertEqual(RCTMountingManagerTestLog.count, 0u, @"nothing is queued without the flag");

  [self spinMainQueueUntilLogCount:2];
  NSArray *expected = @[ @"mount", @"setTextAndSelection 2 mounted=1 nativeID=new rows=1" ];
  XCTAssertEqualObjects(RCTMountingManagerTestLog, expected);
}

@end

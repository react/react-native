/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBoxController+Internal.h"

#import <React/RCTDefines.h>
#import <React/RCTJSStackFrame.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTUtils.h>

#import <objc/runtime.h>

#if RCT_DEV_MENU

@interface UIButton (RCTRedBox)

@property (nonatomic) RCTRedBoxButtonPressHandler rct_handler;

- (void)rct_addBlock:(RCTRedBoxButtonPressHandler)handler forControlEvents:(UIControlEvents)controlEvents;

@end

@implementation UIButton (RCTRedBox)

- (RCTRedBoxButtonPressHandler)rct_handler
{
  return objc_getAssociatedObject(self, @selector(rct_handler));
}

- (void)setRct_handler:(RCTRedBoxButtonPressHandler)rct_handler
{
  objc_setAssociatedObject(self, @selector(rct_handler), rct_handler, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)rct_callBlock
{
  if (self.rct_handler) {
    self.rct_handler();
  }
}

- (void)rct_addBlock:(RCTRedBoxButtonPressHandler)handler forControlEvents:(UIControlEvents)controlEvents
{
  self.rct_handler = handler;
  [self addTarget:self action:@selector(rct_callBlock) forControlEvents:controlEvents];
}

@end

@implementation RCTRedBoxController {
  UITableView *_stackTraceTableView;
  NSString *_lastErrorMessage;
  NSArray<RCTJSStackFrame *> *_lastStackTrace;
  NSArray<NSString *> *_customButtonTitles;
  NSArray<RCTRedBoxButtonPressHandler> *_customButtonHandlers;
  int _lastErrorCookie;
}

- (instancetype)initWithCustomButtonTitles:(NSArray<NSString *> *)customButtonTitles
                      customButtonHandlers:(NSArray<RCTRedBoxButtonPressHandler> *)customButtonHandlers
{
  if (self = [super init]) {
    _lastErrorCookie = -1;
    _customButtonTitles = customButtonTitles;
    _customButtonHandlers = customButtonHandlers;
  }

  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor blackColor];

  const CGFloat buttonHeight = 60;

  CGRect detailsFrame = self.view.bounds;
  detailsFrame.size.height -= buttonHeight + (double)[self bottomSafeViewHeight];

  _stackTraceTableView = [[UITableView alloc] initWithFrame:detailsFrame style:UITableViewStylePlain];
  _stackTraceTableView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  _stackTraceTableView.delegate = self;
  _stackTraceTableView.dataSource = self;
  _stackTraceTableView.backgroundColor = [UIColor clearColor];
#if !TARGET_OS_TV
  _stackTraceTableView.separatorColor = [UIColor colorWithWhite:1 alpha:0.3];
  _stackTraceTableView.separatorStyle = UITableViewCellSeparatorStyleNone;
#endif
  _stackTraceTableView.indicatorStyle = UIScrollViewIndicatorStyleWhite;
  [self.view addSubview:_stackTraceTableView];

#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  NSString *reloadText = @"Reload\n(\u2318R)";
  NSString *dismissText = @"Dismiss\n(ESC)";
  NSString *copyText = @"Copy\n(\u2325\u2318C)";
  NSString *extraText = @"Extra Info\n(\u2318E)";
#else
  NSString *reloadText = @"Reload JS";
  NSString *dismissText = @"Dismiss";
  NSString *copyText = @"Copy";
  NSString *extraText = @"Extra Info";
#endif

  UIButton *dismissButton = [self redBoxButton:dismissText
                       accessibilityIdentifier:@"redbox-dismiss"
                                      selector:@selector(dismiss)
                                         block:nil];
  UIButton *reloadButton = [self redBoxButton:reloadText
                      accessibilityIdentifier:@"redbox-reload"
                                     selector:@selector(reload)
                                        block:nil];
  UIButton *copyButton = [self redBoxButton:copyText
                    accessibilityIdentifier:@"redbox-copy"
                                   selector:@selector(copyStack)
                                      block:nil];
  UIButton *extraButton = [self redBoxButton:extraText
                     accessibilityIdentifier:@"redbox-extra"
                                    selector:@selector(showExtraDataViewController)
                                       block:nil];

  [NSLayoutConstraint activateConstraints:@[
    [dismissButton.heightAnchor constraintEqualToConstant:buttonHeight],
    [reloadButton.heightAnchor constraintEqualToConstant:buttonHeight],
    [copyButton.heightAnchor constraintEqualToConstant:buttonHeight],
    [extraButton.heightAnchor constraintEqualToConstant:buttonHeight]
  ]];

  UIStackView *buttonStackView = [[UIStackView alloc] init];
  buttonStackView.translatesAutoresizingMaskIntoConstraints = NO;
  buttonStackView.axis = UILayoutConstraintAxisHorizontal;
  buttonStackView.distribution = UIStackViewDistributionFillEqually;
  buttonStackView.alignment = UIStackViewAlignmentTop;
  buttonStackView.backgroundColor = [UIColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1];

  [buttonStackView addArrangedSubview:dismissButton];
  [buttonStackView addArrangedSubview:reloadButton];
  [buttonStackView addArrangedSubview:copyButton];
  [buttonStackView addArrangedSubview:extraButton];

  [self.view addSubview:buttonStackView];

  [NSLayoutConstraint activateConstraints:@[
    [buttonStackView.heightAnchor constraintEqualToConstant:buttonHeight + [self bottomSafeViewHeight]],
    [buttonStackView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [buttonStackView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
    [buttonStackView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor]
  ]];

  for (NSUInteger i = 0; i < [_customButtonTitles count]; i++) {
    UIButton *button = [self redBoxButton:_customButtonTitles[i]
                  accessibilityIdentifier:@""
                                 selector:nil
                                    block:_customButtonHandlers[i]];
    [button.heightAnchor constraintEqualToConstant:buttonHeight].active = YES;
    [buttonStackView addArrangedSubview:button];
  }

  UIView *topBorder = [[UIView alloc] init];
  topBorder.translatesAutoresizingMaskIntoConstraints = NO;
  topBorder.backgroundColor = [UIColor colorWithRed:0.70 green:0.70 blue:0.70 alpha:1.0];
  [topBorder.heightAnchor constraintEqualToConstant:1].active = YES;

  [self.view addSubview:topBorder];

  [NSLayoutConstraint activateConstraints:@[
    [topBorder.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [topBorder.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
    [topBorder.bottomAnchor constraintEqualToAnchor:buttonStackView.topAnchor],
  ]];
}

- (UIButton *)redBoxButton:(NSString *)title
    accessibilityIdentifier:(NSString *)accessibilityIdentifier
                   selector:(SEL)selector
                      block:(RCTRedBoxButtonPressHandler)block
{
  UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
  button.autoresizingMask =
      UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleRightMargin;
  button.accessibilityIdentifier = accessibilityIdentifier;
  button.titleLabel.font = [UIFont systemFontOfSize:13];
  button.titleLabel.lineBreakMode = NSLineBreakByWordWrapping;
  button.titleLabel.textAlignment = NSTextAlignmentCenter;
  button.backgroundColor = [UIColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1];
  [button setTitle:title forState:UIControlStateNormal];
  [button setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
  [button setTitleColor:[UIColor colorWithWhite:1 alpha:0.5] forState:UIControlStateHighlighted];
  if (selector) {
    [button addTarget:self action:selector forControlEvents:UIControlEventTouchUpInside];
  } else if (block) {
    [button rct_addBlock:block forControlEvents:UIControlEventTouchUpInside];
  }
  return button;
}

- (NSInteger)bottomSafeViewHeight
{
#if TARGET_OS_MACCATALYST
  return 0;
#else
  return RCTKeyWindow().safeAreaInsets.bottom;
#endif
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (NSString *)stripAnsi:(NSString *)text
{
  NSError *error = nil;
  NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"\\x1b\\[[0-9;]*m"
                                                                         options:NSRegularExpressionCaseInsensitive
                                                                           error:&error];
  return [regex stringByReplacingMatchesInString:text options:0 range:NSMakeRange(0, [text length]) withTemplate:@""];
}

- (void)showErrorMessage:(NSString *)message
               withStack:(NSArray<RCTJSStackFrame *> *)stack
                isUpdate:(BOOL)isUpdate
             errorCookie:(int)errorCookie
{
  // Remove ANSI color codes from the message
  NSString *messageWithoutAnsi = [self stripAnsi:message];

  BOOL isRootViewControllerPresented = self.presentingViewController != nil;
  // Show if this is a new message, or if we're updating the previous message
  BOOL isNew = !isRootViewControllerPresented && !isUpdate;
  BOOL isUpdateForSameMessage = !isNew &&
      (isRootViewControllerPresented && isUpdate &&
       ((errorCookie == -1 && [_lastErrorMessage isEqualToString:messageWithoutAnsi]) ||
        (errorCookie == _lastErrorCookie)));
  if (isNew || isUpdateForSameMessage) {
    _lastStackTrace = stack;
    // message is displayed using UILabel, which is unable to render text of
    // unlimited length, so we truncate it
    _lastErrorMessage = [messageWithoutAnsi substringToIndex:MIN((NSUInteger)10000, messageWithoutAnsi.length)];
    _lastErrorCookie = errorCookie;

    [_stackTraceTableView reloadData];

    if (!isRootViewControllerPresented) {
      [_stackTraceTableView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]
                                  atScrollPosition:UITableViewScrollPositionTop
                                          animated:NO];
      [RCTKeyWindow().rootViewController presentViewController:self animated:YES completion:nil];
    }
  }
}

- (void)dismiss
{
  [self dismissViewControllerAnimated:YES completion:nil];
}

- (void)reload
{
  if (_actionDelegate != nil) {
    [_actionDelegate reloadFromRedBoxController:self];
  } else {
    // In bridgeless mode `RCTRedBox` gets deallocated, we need to notify listeners anyway.
    RCTTriggerReloadCommandListeners(@"Redbox");
    [self dismiss];
  }
}

- (void)showExtraDataViewController
{
  [_actionDelegate loadExtraDataViewController];
}

- (void)copyStack
{
  NSMutableString *fullStackTrace;

  if (_lastErrorMessage != nil) {
    fullStackTrace = [_lastErrorMessage mutableCopy];
    [fullStackTrace appendString:@"\n\n"];
  } else {
    fullStackTrace = [NSMutableString string];
  }

  for (RCTJSStackFrame *stackFrame in _lastStackTrace) {
    [fullStackTrace appendString:[NSString stringWithFormat:@"%@\n", stackFrame.methodName]];
    if (stackFrame.file) {
      [fullStackTrace appendFormat:@"    %@\n", [self formatFrameSource:stackFrame]];
    }
  }
#if !TARGET_OS_TV
  UIPasteboard *pb = [UIPasteboard generalPasteboard];
  [pb setString:fullStackTrace];
#endif
}

- (NSString *)formatFrameSource:(RCTJSStackFrame *)stackFrame
{
  NSString *fileName = RCTNilIfNull(stackFrame.file) ? [stackFrame.file lastPathComponent] : @"<unknown file>";
  NSString *lineInfo = [NSString stringWithFormat:@"%@:%lld", fileName, (long long)stackFrame.lineNumber];

  if (stackFrame.column != 0) {
    lineInfo = [lineInfo stringByAppendingFormat:@":%lld", (long long)stackFrame.column];
  }
  return lineInfo;
}

#pragma mark - TableView

- (NSInteger)numberOfSectionsInTableView:(__unused UITableView *)tableView
{
  return 2;
}

- (NSInteger)tableView:(__unused UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return section == 0 ? 1 : _lastStackTrace.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 0) {
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"msg-cell"];
    return [self reuseCell:cell forErrorMessage:_lastErrorMessage];
  }
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"cell"];
  NSUInteger index = indexPath.row;
  RCTJSStackFrame *stackFrame = _lastStackTrace[index];
  return [self reuseCell:cell forStackFrame:stackFrame];
}

- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forErrorMessage:(NSString *)message
{
  if (!cell) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"msg-cell"];
    cell.textLabel.accessibilityIdentifier = @"redbox-error";
    cell.textLabel.textColor = [UIColor whiteColor];

    // Prefer a monofont for formatting messages that were designed
    // to be displayed in a terminal.
    cell.textLabel.font = [UIFont monospacedSystemFontOfSize:14 weight:UIFontWeightBold];

    cell.textLabel.lineBreakMode = NSLineBreakByWordWrapping;
    cell.textLabel.numberOfLines = 0;
    cell.detailTextLabel.textColor = [UIColor whiteColor];
    cell.backgroundColor = [UIColor colorWithRed:0.82 green:0.10 blue:0.15 alpha:1.0];
    cell.selectionStyle = UITableViewCellSelectionStyleNone;
  }

  cell.textLabel.text = message;

  return cell;
}

- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forStackFrame:(RCTJSStackFrame *)stackFrame
{
  if (!cell) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:@"cell"];
    cell.textLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:14];
    cell.textLabel.lineBreakMode = NSLineBreakByCharWrapping;
    cell.textLabel.numberOfLines = 2;
    cell.detailTextLabel.textColor = [UIColor colorWithRed:0.70 green:0.70 blue:0.70 alpha:1.0];
    cell.detailTextLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:11];
    cell.detailTextLabel.lineBreakMode = NSLineBreakByTruncatingMiddle;
    cell.backgroundColor = [UIColor clearColor];
    cell.selectedBackgroundView = [UIView new];
    cell.selectedBackgroundView.backgroundColor = [UIColor colorWithWhite:0 alpha:0.2];
  }

  cell.textLabel.text = stackFrame.methodName ?: @"(unnamed method)";
  if (stackFrame.file) {
    cell.detailTextLabel.text = [self formatFrameSource:stackFrame];
  } else {
    cell.detailTextLabel.text = @"";
  }
  cell.textLabel.textColor = stackFrame.collapse ? [UIColor lightGrayColor] : [UIColor whiteColor];
  cell.detailTextLabel.textColor = stackFrame.collapse ? [UIColor colorWithRed:0.50 green:0.50 blue:0.50 alpha:1.0]
                                                       : [UIColor colorWithRed:0.70 green:0.70 blue:0.70 alpha:1.0];
  return cell;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 0) {
    NSMutableParagraphStyle *paragraphStyle = [[NSParagraphStyle defaultParagraphStyle] mutableCopy];
    paragraphStyle.lineBreakMode = NSLineBreakByWordWrapping;

    NSDictionary *attributes =
        @{NSFontAttributeName : [UIFont boldSystemFontOfSize:16], NSParagraphStyleAttributeName : paragraphStyle};
    CGRect boundingRect =
        [_lastErrorMessage boundingRectWithSize:CGSizeMake(tableView.frame.size.width - 30, CGFLOAT_MAX)
                                        options:NSStringDrawingUsesLineFragmentOrigin
                                     attributes:attributes
                                        context:nil];
    return ceil(boundingRect.size.height) + 40;
  } else {
    return 50;
  }
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 1) {
    NSUInteger row = indexPath.row;
    RCTJSStackFrame *stackFrame = _lastStackTrace[row];
    [_actionDelegate redBoxController:self openStackFrameInEditor:stackFrame];
  }
  [tableView deselectRowAtIndexPath:indexPath animated:YES];
}

#pragma mark - Key commands

- (NSArray<UIKeyCommand *> *)keyCommands
{
  // NOTE: We could use RCTKeyCommands for this, but since
  // we control this window, we can use the standard, non-hacky
  // mechanism instead

  return @[
    // Dismiss red box
    [UIKeyCommand keyCommandWithInput:UIKeyInputEscape modifierFlags:0 action:@selector(dismiss)],

    // Reload
    [UIKeyCommand keyCommandWithInput:@"r" modifierFlags:UIKeyModifierCommand action:@selector(reload)],

    // Copy = Cmd-Option C since Cmd-C in the simulator copies the pasteboard from
    // the simulator to the desktop pasteboard.
    [UIKeyCommand keyCommandWithInput:@"c"
                        modifierFlags:UIKeyModifierCommand | UIKeyModifierAlternate
                               action:@selector(copyStack)],

    // Extra data
    [UIKeyCommand keyCommandWithInput:@"e"
                        modifierFlags:UIKeyModifierCommand
                               action:@selector(showExtraDataViewController)]
  ];
}

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

@end

#endif

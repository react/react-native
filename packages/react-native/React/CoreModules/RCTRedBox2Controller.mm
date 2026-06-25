/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBox2Controller+Internal.h"

#import <React/RCTDefines.h>
#import <React/RCTJSStackFrame.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTUtils.h>

#include <array>

#import "RCTJscSafeUrl+Internal.h"
#import "RCTRedBox2AnsiParser+Internal.h"
#import "RCTRedBox2ErrorParser+Internal.h"
#import "RCTRedBoxHMRClient+Internal.h"

// @lint-ignore-every CLANGTIDY clang-diagnostic-switch-default
// NOTE: clang-diagnostic-switch-default conflicts with clang-diagnostic-switch-enum

#if RCT_DEV_MENU

#pragma mark - RCTRedBox2Controller

// Color Palette (matching LogBoxStyle.js)
static UIColor *RCTRedBox2BackgroundColor()
{
  return [UIColor colorWithRed:51.0 / 255 green:51.0 / 255 blue:51.0 / 255 alpha:1.0];
}

static UIColor *RCTRedBox2ErrorColor()
{
  return [UIColor colorWithRed:243.0 / 255 green:83.0 / 255 blue:105.0 / 255 alpha:1.0];
}

static UIColor *RCTRedBox2TextColor(CGFloat opacity)
{
  return [UIColor colorWithWhite:1.0 alpha:opacity];
}

enum class Section : uint8_t { Message, CodeFrame, CallStack, kMaxValue };
static constexpr size_t kSectionCount = static_cast<size_t>(Section::kMaxValue);

struct SectionState {
  bool visible = false;
};

static const NSTimeInterval kAutoRetryInterval = 20.0;

@implementation RCTRedBox2Controller {
  UITableView *_stackTraceTableView;
  UILabel *_headerTitleLabel;
  UILabel *_errorCategoryLabel;
  NSString *_lastErrorMessage;
  NSArray<RCTJSStackFrame *> *_lastStackTrace;
  NSArray<NSString *> *_customButtonTitles;
  NSArray<RCTRedBox2ButtonPressHandler> *_customButtonHandlers;
  int _lastErrorCookie;
  RCTRedBox2ErrorData *_errorData;
  std::array<SectionState, kSectionCount> _sectionStates;
  NSTimer *_autoRetryTimer;
  NSInteger _autoRetryCountdown;
  UIButton *_reloadButton;
  NSString *_reloadBaseText;
  RCTRedBoxHMRClient *_hmrClient;
}

- (instancetype)initWithCustomButtonTitles:(NSArray<NSString *> *)customButtonTitles
                      customButtonHandlers:(NSArray<RCTRedBox2ButtonPressHandler> *)customButtonHandlers
{
  self = [super init];
  if (self != nullptr) {
    _lastErrorCookie = -1;
    _customButtonTitles = customButtonTitles;
    _customButtonHandlers = customButtonHandlers;
    self.modalPresentationStyle = UIModalPresentationFullScreen;
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = RCTRedBox2BackgroundColor();

  // Header bar (adds itself to self.view)
  UIView *headerBar = [self createHeaderBar];

  // Footer button bar
  UIView *footerBar = [self createFooterBar];

  // Stack trace table
  _stackTraceTableView = [[UITableView alloc] initWithFrame:CGRectZero style:UITableViewStylePlain];
  _stackTraceTableView.translatesAutoresizingMaskIntoConstraints = NO;
  _stackTraceTableView.delegate = self;
  _stackTraceTableView.dataSource = self;
  _stackTraceTableView.backgroundColor = [UIColor clearColor];
#if !TARGET_OS_TV
  _stackTraceTableView.separatorStyle = UITableViewCellSeparatorStyleNone;
#endif
  _stackTraceTableView.indicatorStyle = UIScrollViewIndicatorStyleWhite;
  _stackTraceTableView.bounces = NO;
  [self.view addSubview:_stackTraceTableView];

  [NSLayoutConstraint activateConstraints:@[
    [_stackTraceTableView.topAnchor constraintEqualToAnchor:headerBar.bottomAnchor],
    [_stackTraceTableView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [_stackTraceTableView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
    [_stackTraceTableView.bottomAnchor constraintEqualToAnchor:footerBar.topAnchor],
  ]];
}

#pragma mark - Header Bar

- (UIView *)createHeaderBar
{
  UIView *headerContainer = [[UIView alloc] init];
  headerContainer.translatesAutoresizingMaskIntoConstraints = NO;
  headerContainer.backgroundColor = RCTRedBox2ErrorColor();

  _headerTitleLabel = [[UILabel alloc] init];
  _headerTitleLabel.translatesAutoresizingMaskIntoConstraints = NO;
  _headerTitleLabel.textColor = [UIColor whiteColor];
  _headerTitleLabel.font = [UIFont systemFontOfSize:16 weight:UIFontWeightSemibold];
  _headerTitleLabel.textAlignment = NSTextAlignmentCenter;
  [headerContainer addSubview:_headerTitleLabel];

  [self.view addSubview:headerContainer];

  [NSLayoutConstraint activateConstraints:@[
    [headerContainer.topAnchor constraintEqualToAnchor:self.view.topAnchor],
    [headerContainer.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [headerContainer.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],

    [_headerTitleLabel.leadingAnchor constraintEqualToAnchor:headerContainer.leadingAnchor constant:12],
    [_headerTitleLabel.trailingAnchor constraintEqualToAnchor:headerContainer.trailingAnchor constant:-12],
    [_headerTitleLabel.bottomAnchor constraintEqualToAnchor:headerContainer.bottomAnchor constant:-12],
    [_headerTitleLabel.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor constant:12],
  ]];

  return headerContainer;
}

#pragma mark - Footer Bar

- (UIView *)createFooterBar
{
  const CGFloat buttonHeight = 48;

  NSString *reloadText = @"Reload";
  NSString *dismissText = @"Dismiss";
  NSString *copyText = @"Copy";

  UIButton *dismissButton = [self footerButton:dismissText
                       accessibilityIdentifier:@"redbox-dismiss"
                                      selector:@selector(dismiss)];
  _reloadBaseText = reloadText;
  _reloadButton = [self footerButton:reloadText accessibilityIdentifier:@"redbox-reload" selector:@selector(reload)];
  UIButton *copyButton = [self footerButton:copyText
                    accessibilityIdentifier:@"redbox-copy"
                                   selector:@selector(copyStack)];

  UIStackView *buttonStackView = [[UIStackView alloc] init];
  buttonStackView.translatesAutoresizingMaskIntoConstraints = NO;
  buttonStackView.axis = UILayoutConstraintAxisHorizontal;
  buttonStackView.distribution = UIStackViewDistributionFillEqually;
  buttonStackView.alignment = UIStackViewAlignmentTop;
  buttonStackView.backgroundColor = RCTRedBox2BackgroundColor();

  [buttonStackView addArrangedSubview:dismissButton];
  [buttonStackView addArrangedSubview:_reloadButton];
  [buttonStackView addArrangedSubview:copyButton];

  for (NSUInteger i = 0; i < [_customButtonTitles count]; i++) {
    UIButton *button = [self footerButton:_customButtonTitles[i]
                  accessibilityIdentifier:@""
                                  handler:_customButtonHandlers[i]];
    [buttonStackView addArrangedSubview:button];
  }

  // Shadow layer above footer
  buttonStackView.layer.shadowColor = [UIColor blackColor].CGColor;
  buttonStackView.layer.shadowOffset = CGSizeMake(0, -2);
  buttonStackView.layer.shadowRadius = 2;
  buttonStackView.layer.shadowOpacity = 0.5;

  [self.view addSubview:buttonStackView];

  CGFloat bottomInset = [self bottomSafeViewHeight];

  [NSLayoutConstraint activateConstraints:@[
    [buttonStackView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [buttonStackView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
    [buttonStackView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor],
    [buttonStackView.heightAnchor constraintEqualToConstant:buttonHeight + bottomInset],
  ]];

  for (UIButton *btn in buttonStackView.arrangedSubviews) {
    [btn.heightAnchor constraintEqualToConstant:buttonHeight].active = YES;
  }

  return buttonStackView;
}

- (UIButton *)styledButton:(NSString *)title accessibilityIdentifier:(NSString *)accessibilityIdentifier
{
  UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
  button.accessibilityIdentifier = accessibilityIdentifier;
  button.titleLabel.font = [UIFont systemFontOfSize:14];
  button.titleLabel.textAlignment = NSTextAlignmentCenter;
  button.backgroundColor = RCTRedBox2BackgroundColor();
  [button setTitle:title forState:UIControlStateNormal];
  [button setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
  [button setTitleColor:RCTRedBox2TextColor(0.5) forState:UIControlStateHighlighted];
  return button;
}

- (UIButton *)footerButton:(NSString *)title
    accessibilityIdentifier:(NSString *)accessibilityIdentifier
                   selector:(SEL)selector
{
  UIButton *button = [self styledButton:title accessibilityIdentifier:accessibilityIdentifier];
  [button addTarget:self action:selector forControlEvents:UIControlEventTouchUpInside];
  return button;
}

- (UIButton *)footerButton:(NSString *)title
    accessibilityIdentifier:(NSString *)accessibilityIdentifier
                    handler:(RCTRedBox2ButtonPressHandler)handler
{
  UIButton *button = [self styledButton:title accessibilityIdentifier:accessibilityIdentifier];
  [button addAction:[UIAction actionWithHandler:^(__unused UIAction *action) {
            handler();
          }]
      forControlEvents:UIControlEventTouchUpInside];
  return button;
}

- (CGFloat)bottomSafeViewHeight
{
#if TARGET_OS_MACCATALYST
  return 0;
#else
  return RCTKeyWindow().safeAreaInsets.bottom;
#endif
}

#pragma mark - Error Display

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

    // Parse the message to extract structure (title, code frame, etc.)
    _errorData = [RCTRedBox2ErrorParser parseErrorMessage:message name:nil componentStack:nil isFatal:YES];
    [self updateSectionVisibility];

    [_stackTraceTableView reloadData];

    if (!isRootViewControllerPresented) {
      [RCTKeyWindow().rootViewController presentViewController:self animated:NO completion:nil];
    }

    // Update all UI from _errorData (view is now guaranteed to be loaded)
    _headerTitleLabel.text = _errorData.isCompileError ? @"Failed to compile" : @"Error";
    [_stackTraceTableView reloadData];
    [_stackTraceTableView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]
                                atScrollPosition:UITableViewScrollPositionTop
                                        animated:NO];

    [self startAutoRetryIfApplicable];
    [self _startHMRClient];
  }
}

- (void)dismiss
{
  [self stopAutoRetry];
  [self dismissViewControllerAnimated:NO completion:nil];
}

- (void)reload
{
  [self _stopHMRClient];
  [self stopAutoRetry];
  if (_actionDelegate != nil) {
    [_actionDelegate reloadFromRedBoxController:self];
  } else {
    // In bridgeless mode `RCTRedBox` gets deallocated, we need to notify listeners anyway.
    RCTTriggerReloadCommandListeners(@"Redbox");
    [self dismiss];
  }
}

#pragma mark - Native HMR Connection

- (void)_startHMRClient
{
  [self _stopHMRClient];
  if (!_bundleURL) {
    return;
  }
  __weak __typeof(self) weakSelf = self;
  _hmrClient = [[RCTRedBoxHMRClient alloc] initWithBundleURL:_bundleURL
                                                onFileChange:^{
                                                  [weakSelf reload];
                                                }];
  [_hmrClient start];
}

- (void)_stopHMRClient
{
  [_hmrClient stop];
  _hmrClient = nil;
}

#pragma mark - Auto-Retry

- (void)startAutoRetryIfApplicable
{
  [self stopAutoRetry];
  if (!_errorData.isRetryable) {
    return;
  }
  _autoRetryCountdown = (NSInteger)kAutoRetryInterval;
  [self updateReloadButtonTitle];
  _autoRetryTimer = [NSTimer scheduledTimerWithTimeInterval:1.0
                                                     target:self
                                                   selector:@selector(autoRetryTick)
                                                   userInfo:nil
                                                    repeats:YES];
}

- (void)stopAutoRetry
{
  [_autoRetryTimer invalidate];
  _autoRetryTimer = nil;
  if (_reloadButton) {
    [_reloadButton setTitle:_reloadBaseText forState:UIControlStateNormal];
  }
}

- (void)autoRetryTick
{
  _autoRetryCountdown--;
  if (_autoRetryCountdown <= 0) {
    [self stopAutoRetry];
    [self reload];
  } else {
    [self updateReloadButtonTitle];
  }
}

- (void)updateReloadButtonTitle
{
  NSString *title = [NSString stringWithFormat:@"%@ (%lds)", _reloadBaseText, (long)_autoRetryCountdown];
  [_reloadButton setTitle:title forState:UIControlStateNormal];
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
    if (stackFrame.file != nullptr) {
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
  NSString *file = [RCTJscSafeUrl normalUrlFromJscSafeUrl:stackFrame.file];
  // Strip query string (e.g. ?platform=ios&dev=true) before extracting the filename.
  NSRange queryRange = [file rangeOfString:@"?"];
  if (queryRange.location != NSNotFound) {
    file = [file substringToIndex:queryRange.location];
  }
  NSString *fileName = RCTNilIfNull(file) ? [file lastPathComponent] : @"<unknown file>";
  NSString *lineInfo = [NSString stringWithFormat:@"%@:%lld", fileName, (long long)stackFrame.lineNumber];

  if (stackFrame.column != 0) {
    lineInfo = [lineInfo stringByAppendingFormat:@":%lld", (long long)stackFrame.column];
  }
  return lineInfo;
}

#pragma mark - Section Helpers

- (void)updateSectionVisibility
{
  _sectionStates = {};
  _sectionStates[static_cast<size_t>(Section::Message)].visible = true;
  _sectionStates[static_cast<size_t>(Section::CodeFrame)].visible = _errorData.codeFrame.length > 0;
  _sectionStates[static_cast<size_t>(Section::CallStack)].visible =
      _lastStackTrace.count > 0 && _errorData.codeFrame.length == 0;
}

- (NSInteger)visibleSectionCount
{
  NSInteger count = 0;
  for (size_t i = 0; i < kSectionCount; i++) {
    if (_sectionStates[i].visible) {
      count++;
    }
  }
  return count;
}

- (Section)sectionForIndex:(NSInteger)index
{
  NSInteger visible = 0;
  for (size_t i = 0; i < kSectionCount; i++) {
    if (_sectionStates[i].visible) {
      if (visible == index) {
        return static_cast<Section>(i);
      }
      visible++;
    }
  }
  RCTAssert(NO, @"Invalid section index %ld", (long)index);
  return Section::kMaxValue;
}

- (NSString *)displayMessage
{
  return _errorData.message.length > 0 ? [self stripAnsi:_errorData.message] : _lastErrorMessage;
}

#pragma mark - TableView DataSource & Delegate

- (NSInteger)numberOfSectionsInTableView:(__unused UITableView *)tableView
{
  return [self visibleSectionCount];
}

- (NSInteger)tableView:(__unused UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  if ([self sectionForIndex:section] == Section::CallStack) {
    return static_cast<NSInteger>(_lastStackTrace.count);
  }
  return 1;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  switch ([self sectionForIndex:indexPath.section]) {
    case Section::Message: {
      UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"msg-cell"];
      return [self reuseCell:cell forErrorMessage:[self displayMessage]];
    }
    case Section::CodeFrame: {
      UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"code-cell"];
      return [self reuseCell:cell forCodeFrame:_errorData];
    }
    case Section::CallStack:
    case Section::kMaxValue:
      break;
  }
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"cell"];
  NSUInteger index = indexPath.row;
  RCTJSStackFrame *stackFrame = _lastStackTrace[index];
  return [self reuseCell:cell forStackFrame:stackFrame];
}

- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forErrorMessage:(NSString *)message
{
  if (cell == nullptr) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"msg-cell"];
    cell.backgroundColor = RCTRedBox2BackgroundColor();
    cell.selectionStyle = UITableViewCellSelectionStyleNone;

    // Error category label (e.g. "Syntax Error", "Uncaught Error")
    _errorCategoryLabel = [[UILabel alloc] init];
    _errorCategoryLabel.translatesAutoresizingMaskIntoConstraints = NO;
    _errorCategoryLabel.textColor = RCTRedBox2ErrorColor();
    _errorCategoryLabel.font = [UIFont systemFontOfSize:21 weight:UIFontWeightBold];
    _errorCategoryLabel.numberOfLines = 1;
    [cell.contentView addSubview:_errorCategoryLabel];

    // Error message label
    UILabel *messageLabel = [[UILabel alloc] init];
    messageLabel.translatesAutoresizingMaskIntoConstraints = NO;
    messageLabel.accessibilityIdentifier = @"redbox-error";
    messageLabel.textColor = [UIColor whiteColor];
    messageLabel.font = [UIFont systemFontOfSize:14 weight:UIFontWeightMedium];
    messageLabel.lineBreakMode = NSLineBreakByWordWrapping;
    messageLabel.numberOfLines = 0;
    messageLabel.tag = 100;
    [cell.contentView addSubview:messageLabel];

    [NSLayoutConstraint activateConstraints:@[
      [_errorCategoryLabel.topAnchor constraintEqualToAnchor:cell.contentView.topAnchor constant:15],
      [_errorCategoryLabel.leadingAnchor constraintEqualToAnchor:cell.contentView.leadingAnchor constant:12],
      [_errorCategoryLabel.trailingAnchor constraintEqualToAnchor:cell.contentView.trailingAnchor constant:-12],

      [messageLabel.topAnchor constraintEqualToAnchor:_errorCategoryLabel.bottomAnchor constant:10],
      [messageLabel.leadingAnchor constraintEqualToAnchor:cell.contentView.leadingAnchor constant:12],
      [messageLabel.trailingAnchor constraintEqualToAnchor:cell.contentView.trailingAnchor constant:-12],
      [messageLabel.bottomAnchor constraintEqualToAnchor:cell.contentView.bottomAnchor constant:-15],
    ]];
  }

  _errorCategoryLabel.text = _errorData.title;
  UILabel *messageLabel = [cell.contentView viewWithTag:100];
  messageLabel.text = message;

  return cell;
}

- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forStackFrame:(RCTJSStackFrame *)stackFrame
{
  if (cell == nullptr) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:@"cell"];
    cell.textLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:14];
    cell.textLabel.lineBreakMode = NSLineBreakByCharWrapping;
    cell.textLabel.numberOfLines = 2;
    cell.detailTextLabel.font = [UIFont systemFontOfSize:12 weight:UIFontWeightLight];
    cell.detailTextLabel.lineBreakMode = NSLineBreakByTruncatingMiddle;
    cell.backgroundColor = [UIColor clearColor];
    cell.selectedBackgroundView = [UIView new];
    cell.selectedBackgroundView.backgroundColor = RCTRedBox2BackgroundColor();
    cell.selectedBackgroundView.layer.cornerRadius = 5;
  }

  cell.textLabel.text = stackFrame.methodName ?: @"(unnamed method)";
  if (stackFrame.file != nullptr) {
    cell.detailTextLabel.text = [self formatFrameSource:stackFrame];
  } else {
    cell.detailTextLabel.text = @"";
  }

  if (stackFrame.collapse) {
    cell.textLabel.textColor = RCTRedBox2TextColor(0.4);
    cell.detailTextLabel.textColor = RCTRedBox2TextColor(0.3);
  } else {
    cell.textLabel.textColor = [UIColor whiteColor];
    cell.detailTextLabel.textColor = RCTRedBox2TextColor(0.8);
  }

  return cell;
}

- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forCodeFrame:(RCTRedBox2ErrorData *)errorData
{
  if (cell == nullptr) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"code-cell"];
    cell.backgroundColor = [UIColor clearColor];
    cell.selectionStyle = UITableViewCellSelectionStyleNone;
  }

  // Remove old subviews
  for (UIView *subview in cell.contentView.subviews) {
    [subview removeFromSuperview];
  }

  // Code frame container with rounded corners
  UIView *container = [[UIView alloc] init];
  container.translatesAutoresizingMaskIntoConstraints = NO;
  container.backgroundColor = RCTRedBox2BackgroundColor();
  container.layer.cornerRadius = 3;
  container.clipsToBounds = YES;
  [cell.contentView addSubview:container];

  // Render code frame with ANSI syntax highlighting
  UIFont *codeFont = [UIFont fontWithName:@"Menlo-Regular" size:12];
  NSAttributedString *highlighted = [RCTRedBox2AnsiParser attributedStringFromAnsiText:errorData.codeFrame
                                                                              baseFont:codeFont
                                                                             baseColor:[UIColor whiteColor]];

  UILabel *codeLabel = [[UILabel alloc] init];
  codeLabel.translatesAutoresizingMaskIntoConstraints = NO;
  codeLabel.attributedText = highlighted;
  codeLabel.numberOfLines = 0;
  codeLabel.lineBreakMode = NSLineBreakByClipping;

  UIScrollView *codeScrollView = [[UIScrollView alloc] init];
  codeScrollView.translatesAutoresizingMaskIntoConstraints = NO;
  codeScrollView.showsHorizontalScrollIndicator = YES;
  codeScrollView.showsVerticalScrollIndicator = NO;
  codeScrollView.bounces = NO;
  [codeScrollView addSubview:codeLabel];
  [container addSubview:codeScrollView];

  // File name label below the code frame
  UILabel *fileLabel = [[UILabel alloc] init];
  fileLabel.translatesAutoresizingMaskIntoConstraints = NO;
  NSString *fileName = errorData.codeFrameFileName.lastPathComponent ?: errorData.codeFrameFileName;
  if (errorData.codeFrameRow > 0) {
    fileLabel.text = [NSString
        stringWithFormat:@"%@ (%ld:%ld)", fileName, (long)errorData.codeFrameRow, (long)errorData.codeFrameColumn + 1];
  } else if (fileName.length > 0) {
    fileLabel.text = fileName;
  }
  fileLabel.textColor = RCTRedBox2TextColor(0.5);
  fileLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:12];
  fileLabel.textAlignment = NSTextAlignmentCenter;
  [cell.contentView addSubview:fileLabel];

  [NSLayoutConstraint activateConstraints:@[
    [container.topAnchor constraintEqualToAnchor:cell.contentView.topAnchor constant:5],
    [container.leadingAnchor constraintEqualToAnchor:cell.contentView.leadingAnchor constant:10],
    [container.trailingAnchor constraintEqualToAnchor:cell.contentView.trailingAnchor constant:-10],

    [codeScrollView.topAnchor constraintEqualToAnchor:container.topAnchor constant:10],
    [codeScrollView.leadingAnchor constraintEqualToAnchor:container.leadingAnchor constant:10],
    [codeScrollView.trailingAnchor constraintEqualToAnchor:container.trailingAnchor constant:-10],
    [codeScrollView.bottomAnchor constraintEqualToAnchor:container.bottomAnchor constant:-10],

    [codeLabel.topAnchor constraintEqualToAnchor:codeScrollView.topAnchor],
    [codeLabel.leadingAnchor constraintEqualToAnchor:codeScrollView.leadingAnchor],
    [codeLabel.trailingAnchor constraintEqualToAnchor:codeScrollView.trailingAnchor],
    [codeLabel.bottomAnchor constraintEqualToAnchor:codeScrollView.bottomAnchor],
    [codeLabel.heightAnchor constraintEqualToAnchor:codeScrollView.heightAnchor],

    [fileLabel.topAnchor constraintEqualToAnchor:container.bottomAnchor constant:10],
    [fileLabel.leadingAnchor constraintEqualToAnchor:cell.contentView.leadingAnchor constant:10],
    [fileLabel.trailingAnchor constraintEqualToAnchor:cell.contentView.trailingAnchor constant:-10],
    [fileLabel.bottomAnchor constraintEqualToAnchor:cell.contentView.bottomAnchor constant:-10],
  ]];

  return cell;
}

- (CGFloat)tableView:(__unused UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  auto section = [self sectionForIndex:indexPath.section];
  if (section == Section::Message || section == Section::CodeFrame) {
    return UITableViewAutomaticDimension;
  }
  return 50;
}

- (CGFloat)tableView:(__unused UITableView *)tableView estimatedHeightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  switch ([self sectionForIndex:indexPath.section]) {
    case Section::Message:
      return 100;
    case Section::CodeFrame:
      return 200;
    case Section::CallStack:
    case Section::kMaxValue:
      return 50;
  }
}

- (UIView *)sectionHeaderViewWithTitle:(NSString *)title
{
  UIView *headerView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 0, 38)];
  headerView.backgroundColor = [UIColor clearColor];

  UILabel *label = [[UILabel alloc] init];
  label.translatesAutoresizingMaskIntoConstraints = NO;
  label.text = title;
  label.textColor = [UIColor whiteColor];
  label.font = [UIFont systemFontOfSize:18 weight:UIFontWeightSemibold];
  [headerView addSubview:label];

  [NSLayoutConstraint activateConstraints:@[
    [label.leadingAnchor constraintEqualToAnchor:headerView.leadingAnchor constant:12],
    [label.trailingAnchor constraintEqualToAnchor:headerView.trailingAnchor constant:-12],
    [label.bottomAnchor constraintEqualToAnchor:headerView.bottomAnchor constant:-10],
  ]];

  return headerView;
}

- (UIView *)tableView:(__unused UITableView *)tableView viewForHeaderInSection:(NSInteger)section
{
  switch ([self sectionForIndex:section]) {
    case Section::CodeFrame:
      return [self sectionHeaderViewWithTitle:@"Source"];
    case Section::CallStack:
      return [self sectionHeaderViewWithTitle:@"Call Stack"];
    case Section::Message:
    case Section::kMaxValue:
      return nil;
  }
}

- (CGFloat)tableView:(__unused UITableView *)tableView heightForHeaderInSection:(NSInteger)section
{
  auto s = [self sectionForIndex:section];
  return (s == Section::CodeFrame || s == Section::CallStack) ? 38 : 0;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  if ([self sectionForIndex:indexPath.section] == Section::CallStack) {
    NSUInteger row = indexPath.row;
    RCTJSStackFrame *stackFrame = _lastStackTrace[row];
    [_actionDelegate redBoxController:self openStackFrameInEditor:stackFrame];
  }
  [tableView deselectRowAtIndexPath:indexPath animated:YES];
}

#pragma mark - Key Commands

- (NSArray<UIKeyCommand *> *)keyCommands
{
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
  ];
}

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

@end

#endif

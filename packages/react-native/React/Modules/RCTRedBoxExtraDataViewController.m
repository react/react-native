/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBoxExtraDataViewController.h"
#import "React/RCTUtils.h"

@interface RCTRedBoxExtraDataCell : UITableViewCell

@property (nonatomic, strong) UILabel *keyLabel;
@property (nonatomic, strong) UILabel *valueLabel;

@end

@implementation RCTRedBoxExtraDataCell

- (instancetype)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier
{
  if (self = [super initWithStyle:style reuseIdentifier:reuseIdentifier]) {
    self.backgroundColor = [UIColor colorWithRed:0.8 green:0 blue:0 alpha:1];
    UILayoutGuide *contentLayout = self.contentView.layoutMarginsGuide;

    self.keyLabel = [UILabel new];
    [self.contentView addSubview:self.keyLabel];
    self.keyLabel.translatesAutoresizingMaskIntoConstraints = NO;
    [NSLayoutConstraint activateConstraints:@[
      [self.keyLabel.leadingAnchor constraintEqualToAnchor:contentLayout.leadingAnchor],
      [self.keyLabel.topAnchor constraintEqualToAnchor:contentLayout.topAnchor],
      [self.keyLabel.bottomAnchor constraintEqualToAnchor:contentLayout.bottomAnchor],
      [self.keyLabel.widthAnchor constraintEqualToAnchor:contentLayout.widthAnchor multiplier:0.3]
    ]];
    self.keyLabel.textColor = [UIColor whiteColor];
    self.keyLabel.numberOfLines = 0;
    self.keyLabel.lineBreakMode = NSLineBreakByWordWrapping;
    self.keyLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:12.0f];

    self.valueLabel = [UILabel new];
    [self.contentView addSubview:self.valueLabel];
    self.valueLabel.translatesAutoresizingMaskIntoConstraints = NO;
    [NSLayoutConstraint activateConstraints:@[
      [self.valueLabel.leadingAnchor constraintEqualToAnchor:self.keyLabel.trailingAnchor constant:10.f],
      [self.valueLabel.trailingAnchor constraintEqualToAnchor:contentLayout.trailingAnchor],
      [self.valueLabel.topAnchor constraintEqualToAnchor:contentLayout.topAnchor],
      [self.valueLabel.bottomAnchor constraintEqualToAnchor:contentLayout.bottomAnchor]
    ]];
    self.valueLabel.textColor = [UIColor whiteColor];
    self.valueLabel.numberOfLines = 0;
    self.valueLabel.lineBreakMode = NSLineBreakByWordWrapping;
    self.valueLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:12.0f];
  }
  return self;
}

@end

@interface RCTRedBoxExtraDataViewController ()

@end

@implementation RCTRedBoxExtraDataViewController {
  UITableView *_tableView;
  NSMutableArray *_extraDataTitle;
  NSMutableArray *_extraData;
}

@synthesize actionDelegate = _actionDelegate;

- (instancetype)init
{
  if (self = [super init]) {
    _extraData = [NSMutableArray new];
    _extraDataTitle = [NSMutableArray new];
  }
  return self;
}

- (UIButton *)redBoxButtonWithTitle:(NSString *)title
            accessibilityIdentifier:(NSString *)accessibilityIdentifier
                             action:(SEL)action
{
  UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
  button.accessibilityIdentifier = accessibilityIdentifier;

  button.backgroundColor = [UIColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1];

  button.titleLabel.font = [UIFont systemFontOfSize:13];

  [button setTitle:title forState:UIControlStateNormal];
  [button setTitleColor:[UIColor colorWithWhite:1 alpha:1] forState:UIControlStateNormal];
  [button setTitleColor:[UIColor colorWithWhite:1 alpha:0.5] forState:UIControlStateHighlighted];

  [button addTarget:self action:action forControlEvents:UIControlEventTouchUpInside];
  return button;
}

- (void)viewDidLoad
{
  CGFloat bottomSafeAreaInset = RCTKeyWindow().safeAreaInsets.bottom;

  CGFloat buttonHeight = 60;
  CGFloat buttonWidth = self.view.bounds.size.width / 2;

  _tableView = [UITableView new];
  _tableView.translatesAutoresizingMaskIntoConstraints = NO;
  _tableView.delegate = self;
  _tableView.dataSource = self;
  _tableView.backgroundColor = [UIColor colorWithRed:0.8 green:0 blue:0 alpha:1];
#if !TARGET_OS_TV
  _tableView.separatorStyle = UITableViewCellSeparatorStyleNone;
#endif
  _tableView.indicatorStyle = UIScrollViewIndicatorStyleWhite;
  _tableView.allowsSelection = NO;
  [self.view addSubview:_tableView];

#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  NSString *reloadText = @"Reload JS (\u2318R)";
  NSString *dismissText = @"Dismiss (ESC)";
#else
  NSString *reloadText = @"Reload JS";
  NSString *dismissText = @"Dismiss";
#endif

  UIButton *dismissButton = [self redBoxButtonWithTitle:dismissText
                                accessibilityIdentifier:@"redbox-extra-data-dismiss"
                                                 action:@selector(dismiss)];
  UIButton *reloadButton = [self redBoxButtonWithTitle:reloadText
                               accessibilityIdentifier:@"redbox-reload"
                                                action:@selector(reload)];

  UIStackView *buttonStackView = [[UIStackView alloc] init];
  buttonStackView.translatesAutoresizingMaskIntoConstraints = NO;
  buttonStackView.axis = UILayoutConstraintAxisHorizontal;
  buttonStackView.distribution = UIStackViewDistributionFillEqually;
  buttonStackView.alignment = UIStackViewAlignmentTop;
  buttonStackView.backgroundColor = [UIColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1];

  [buttonStackView addArrangedSubview:dismissButton];
  [buttonStackView addArrangedSubview:reloadButton];

  [self.view addSubview:buttonStackView];

  [NSLayoutConstraint activateConstraints:@[
    [_tableView.topAnchor constraintEqualToAnchor:self.view.topAnchor],
    [_tableView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [_tableView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
    [_tableView.bottomAnchor constraintEqualToAnchor:buttonStackView.topAnchor],

    [dismissButton.heightAnchor constraintEqualToConstant:buttonHeight],
    [dismissButton.widthAnchor constraintEqualToConstant:buttonWidth],
    [reloadButton.heightAnchor constraintEqualToConstant:buttonHeight],
    [reloadButton.widthAnchor constraintEqualToConstant:buttonWidth],
    [buttonStackView.heightAnchor constraintEqualToConstant:buttonHeight + bottomSafeAreaInset],

    [buttonStackView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [buttonStackView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
    [buttonStackView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor],
  ]];
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  [_tableView reloadData];
}

- (NSInteger)tableView:(__unused UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return [[_extraData objectAtIndex:section] count];
}

- (CGFloat)tableView:(__unused UITableView *)tableView heightForHeaderInSection:(__unused NSInteger)section
{
  return 40;
}

- (UIView *)tableView:(__unused UITableView *)tableView viewForHeaderInSection:(NSInteger)section
{
  UIView *header = [UIView new];
  header.backgroundColor = [UIColor colorWithRed:1 green:0 blue:0 alpha:1];

  UILabel *headerLabel = [UILabel new];
  [header addSubview:headerLabel];

  headerLabel.translatesAutoresizingMaskIntoConstraints = NO;
  [NSLayoutConstraint activateConstraints:@[
    [headerLabel.leadingAnchor constraintEqualToAnchor:header.leadingAnchor constant:5],
    [headerLabel.trailingAnchor constraintEqualToAnchor:header.trailingAnchor],
    [headerLabel.topAnchor constraintEqualToAnchor:header.topAnchor],
    [headerLabel.bottomAnchor constraintEqualToAnchor:header.bottomAnchor],
  ]];

  headerLabel.textColor = [UIColor whiteColor];
  headerLabel.font = [UIFont fontWithName:@"Menlo-Bold" size:14.0f];
  headerLabel.text = [_extraDataTitle[section] uppercaseString];

  return header;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  static NSString *reuseIdentifier = @"RedBoxExtraData";

  RCTRedBoxExtraDataCell *cell =
      (RCTRedBoxExtraDataCell *)[tableView dequeueReusableCellWithIdentifier:reuseIdentifier];

  if (cell == nil) {
    cell = [[RCTRedBoxExtraDataCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:reuseIdentifier];
  }

  NSArray *dataKVPair = _extraData[indexPath.section][indexPath.row];
  cell.keyLabel.text = dataKVPair[0];
  cell.valueLabel.text = dataKVPair[1];

  return cell;
}

- (NSInteger)numberOfSectionsInTableView:(__unused UITableView *)tableView
{
  return _extraDataTitle.count;
}

- (void)addExtraData:(NSDictionary *)data forIdentifier:(NSString *)identifier
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSMutableArray *newData = [NSMutableArray new];
    for (id key in data) {
      [newData addObject:@[
        [NSString stringWithFormat:@"%@", key],
        [NSString stringWithFormat:@"%@", [data objectForKey:key]]
      ]];
    }

    NSInteger idx = [self->_extraDataTitle indexOfObject:identifier];
    if (idx == NSNotFound) {
      [self->_extraDataTitle addObject:identifier];
      [self->_extraData addObject:newData];
    } else {
      [self->_extraData replaceObjectAtIndex:idx withObject:newData];
    }

    [self->_tableView reloadData];
  });
}

- (void)dismiss
{
  [self dismissViewControllerAnimated:YES completion:nil];
}

- (void)reload
{
  [_actionDelegate reload];
}

#pragma mark - Key commands

- (NSArray<UIKeyCommand *> *)keyCommands
{
  return @[
    // Dismiss
    [UIKeyCommand keyCommandWithInput:UIKeyInputEscape modifierFlags:0 action:@selector(dismiss)],
    // Reload
    [UIKeyCommand keyCommandWithInput:@"r" modifierFlags:UIKeyModifierCommand action:@selector(reload)]
  ];
}

@end

source 'https://rubygems.org'

# You may use http://rbenv.org/ or https://rvm.io/ to install and use this version
ruby ">= 2.6.10"

# concurrent-ruby >= 1.3.5 no longer requires 'logger', and activesupport 6.1.x
# references Logger without requiring it, so `bundle exec pod` crashes with
# "uninitialized constant ActiveSupport::LoggerThreadSafeLevel::Logger". A bare
# `gem 'logger'` is not enough because bundler does not auto-require Gemfile gems;
# require it here so it is loaded before cocoapods loads active_support.
require 'logger'

gem 'cocoapods', '~> 1.13', '!= 1.15.0', '!= 1.15.1'
gem 'activesupport', '>= 6.1.7.5', '< 7.1.0'
gem 'xcodeproj', '< 1.26.0'
gem 'concurrent-ruby', '>= 1.3.7'

# Ruby 3.4.0 has removed some libraries from the standard library.
gem 'bigdecimal'
gem 'logger'
gem 'benchmark'
gem 'mutex_m'

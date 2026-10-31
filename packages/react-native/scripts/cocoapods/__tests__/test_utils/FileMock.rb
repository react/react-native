# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class FileMock < File
    @@exist_invocation_params = []
    @@mocked_existing_files = []

    @@delete_invocation_count = 0
    @@deleted_files = []

    @@open_files_with_mode = {}
    @@open_invocation_count = 0

    @@open_files = []

    @@files_to_read = {}
    @@written_files = {}
    attr_reader :collected_write
    attr_reader :fsync_invocation_count

    def initialize()
        @collected_write = []
        @fsync_invocation_count = 0
    end

    # Monkey patched exists? method.
    # It is used also by the test runner, so it can't start monkey patched
    # To use this, invoke the `is_testing` method before starting your test.
    # Remember to invoke `reset` after the test.
    def self.exist?(path)
        @@exist_invocation_params.push(path)
        return @@mocked_existing_files.include?(path)
    end

    def self.delete(path)
        @@delete_invocation_count += 1
        @@deleted_files.push(path)
    end

    def self.delete_invocation_count
        return @@delete_invocation_count
    end

    def self.deleted_files
        return @@deleted_files
    end

    # Getter for the `exist_invocation_params` to check that the exist method
    # is invoked the right number of times with the right parameters
    def self.exist_invocation_params()
        return @@exist_invocation_params
    end

    # Set the list of files the test must return as existing
    def self.mocked_existing_files(files)
        @@mocked_existing_files = files
    end

    def self.open(path, mode, &block)
        @@open_files_with_mode[path] = mode
        @@open_invocation_count += 1
        file = FileMock.new()
        @@open_files.push(file)
        yield(file)
    end

    def self.open_files_with_mode
        return @@open_files_with_mode
    end

    def self.open_invocation_count
        return @@open_invocation_count
    end

    def self.open_files
        return @@open_files
    end

    def self.file_invocation_params
        return @@file_invocation_params
    end

    def write(text)
        @collected_write.push(text.to_s)
    end

    def fsync()
        @fsync_invocation_count += 1
    end


    def self.files_to_read(files)
        @@files_to_read = files
    end

    def self.read(filepath)
        return @@files_to_read[filepath]
    end

    def self.write(filepath, content)
        @@written_files[filepath] = content
    end

    def self.written_files
        return @@written_files
    end

    # Resets all the settings for the File mock
    def self.reset()
        @@delete_invocation_count = 0
        @@deleted_files = []
        @@open_files = []
        @@open_files_with_mode = {}
        @@open_invocation_count = 0
        @@mocked_existing_files = []
        @@file_invocation_params = []
        @@exist_invocation_params = []
        @@files_to_read = {}
        @@written_files = {}
    end
end

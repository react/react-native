# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

include(ExternalProject)
find_package(Python3 REQUIRED COMPONENTS Interpreter)
find_package(Threads REQUIRED)

set(SKIA_SOURCE_DIR "${FANTOM_THIRD_PARTY_DIR}/skia")
set(SKIA_BUILD_DIR "${CMAKE_CURRENT_BINARY_DIR}/out")
set(SKIA_RASTER_PIPELINE_HEADER "${SKIA_SOURCE_DIR}/src/opts/SkRasterPipeline_opts.h")
file(READ "${SKIA_RASTER_PIPELINE_HEADER}" SKIA_RASTER_PIPELINE_SOURCE)
set(SKIA_SCALAR_SELECTION "#if defined(SK_RASTER_PIPELINE_FORCE_SCALAR) || !defined(__clang__)\n    #define JUMPER_IS_SCALAR")
string(FIND "${SKIA_RASTER_PIPELINE_SOURCE}" "${SKIA_SCALAR_SELECTION}" SKIA_SCALAR_SELECTION_INDEX)
if(SKIA_SCALAR_SELECTION_INDEX EQUAL -1)
  message(FATAL_ERROR "Fantom requires Skia's scalar raster pipeline patch from prepareSkiaSource")
endif()
set(BUILD_SHARED_LIBS OFF)
set(HB_BUILD_SUBSET OFF CACHE BOOL "Build only the HarfBuzz shaping library")
set(HB_HAVE_CORETEXT OFF CACHE BOOL "Use OpenType shaping on every platform")
add_subdirectory("${SKIA_SOURCE_DIR}/third_party/externals/harfbuzz" harfbuzz)
if(NOT FANTOM_NINJA)
  find_program(FANTOM_NINJA ninja REQUIRED)
endif()

set(SKIA_GN_ARGS
  "is_official_build=true is_debug=false is_component_build=false"
  "skia_enable_gpu=false skia_enable_graphite=false skia_enable_pdf=false"
  "skia_enable_tools=false skia_enable_skottie=false skia_enable_svg=false"
  "skia_use_fontconfig=false skia_use_fonthost_mac=false skia_use_freetype=true"
  "skia_enable_fontmgr_custom_directory=false skia_enable_fontmgr_custom_embedded=false"
  "skia_enable_fontmgr_custom_empty=true skia_enable_fontmgr_win=false"
  "skia_enable_fontmgr_win_gdi=false skia_use_harfbuzz=false skia_use_icu=false"
  "skia_use_fixed_gamma_text=false"
  "extra_cflags=[\"-DSK_GAMMA_EXPONENT=1.0\",\"-DSK_GAMMA_CONTRAST=0.0\",\"-DSK_DISABLE_LEGACY_SHADERCONTEXT\",\"-DSK_DISABLE_LOWP_RASTER_PIPELINE\",\"-DSK_FORCE_RASTER_PIPELINE_BLITTER\",\"-DSK_RASTER_PIPELINE_FORCE_SCALAR\",\"-ffp-contract=off\"]"
  "skia_use_expat=false skia_use_piex=false skia_use_dng_sdk=false"
  "skia_use_libjpeg_turbo_decode=false skia_use_libjpeg_turbo_encode=false"
  "skia_use_libwebp_decode=false skia_use_libwebp_encode=false skia_use_libgifcodec=false"
  "skia_use_system_freetype2=false skia_use_system_libpng=false skia_use_system_zlib=false"
  "cc=\"${CMAKE_C_COMPILER}\" cxx=\"${CMAKE_CXX_COMPILER}\""
)
if(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  list(APPEND SKIA_GN_ARGS "is_clang=true")
else()
  list(APPEND SKIA_GN_ARGS "is_clang=false")
endif()
string(JOIN " " SKIA_GN_ARGS ${SKIA_GN_ARGS})

ExternalProject_Add(fantom_skia_build
  SOURCE_DIR "${SKIA_SOURCE_DIR}"
  DOWNLOAD_COMMAND "${Python3_EXECUTABLE}" "${SKIA_SOURCE_DIR}/bin/fetch-gn"
  CONFIGURE_COMMAND "${SKIA_SOURCE_DIR}/bin/gn" gen "${SKIA_BUILD_DIR}" "--root=${SKIA_SOURCE_DIR}" "--args=${SKIA_GN_ARGS}"
  BUILD_COMMAND "${FANTOM_NINJA}" -C "${SKIA_BUILD_DIR}" skia
  INSTALL_COMMAND ""
  BUILD_BYPRODUCTS "${SKIA_BUILD_DIR}/libskia.a"
)
target_include_directories(harfbuzz INTERFACE "${SKIA_SOURCE_DIR}/third_party/externals/harfbuzz/src")
add_library(fantom_skia STATIC IMPORTED GLOBAL)
set_target_properties(fantom_skia PROPERTIES
  IMPORTED_LOCATION "${SKIA_BUILD_DIR}/libskia.a"
  INTERFACE_INCLUDE_DIRECTORIES "${SKIA_SOURCE_DIR}"
  INTERFACE_COMPILE_DEFINITIONS FANTOM_SKIA_FACTORY_PROVIDED
  INTERFACE_LINK_LIBRARIES "Threads::Threads;harfbuzz"
)
add_dependencies(fantom_skia fantom_skia_build)

# Node.js v22 Compatibility Report

Generated: 2026-03-11 | Runtime: 12261s | Engine: wasm-rquickjs (QuickJS)

## Summary (Public API Tests)

Tests that rely on Node.js internals (`--expose-internals`, `internalBinding`, `require('internal/...')`) are excluded from the primary counts (322 internals tests listed separately below).

| Result | Count | Percentage |
|--------|-------|------------|
| ✅ PASS | 984 | 28.8% |
| ⏭️ SKIP | 1927 | 56.5% |
| ❌ FAIL | 487 | 14.3% |
| 💥 ERROR | 15 | 0.4% |
| **Total** | **3413** | **100%** |

### All Tests (Public + Internals)

Including 322 tests that use Node.js internals (`--expose-internals`, `internalBinding`, `require('internal/...')`).

| Result | Count | Percentage |
|--------|-------|------------|
| ✅ PASS | 1024 | 27.4% |
| ⏭️ SKIP | 2199 | 58.9% |
| ❌ FAIL | 497 | 13.3% |
| 💥 ERROR | 15 | 0.4% |
| **Total** | **3735** | **100%** |

## Results by Module

| Module | Total | Pass | Fail | Error | Skip | Pass% |
|--------|-------|------|------|-------|------|-------|
| abort | 30 | 17 | 10 | 1 | 2 | 56.7% |
| assert | 105 | 92 | 13 | 0 | 0 | 87.6% |
| async_hooks | 36 | 4 | 11 | 0 | 21 | 11.1% |
| blob | 2 | 2 | 0 | 0 | 0 | 100.0% |
| buffer | 189 | 176 | 3 | 8 | 2 | 93.1% |
| child_process | 215 | 30 | 89 | 13 | 83 | 14.0% |
| cluster | 85 | 0 | 4 | 0 | 81 | 0.0% |
| console | 32 | 31 | 1 | 0 | 0 | 96.9% |
| crypto | 238 | 210 | 16 | 5 | 7 | 88.2% |
| dgram | 107 | 15 | 73 | 0 | 19 | 14.0% |
| diagnostics_channel | 34 | 19 | 4 | 0 | 11 | 55.9% |
| dns | 33 | 3 | 23 | 0 | 7 | 9.1% |
| domain | 63 | 25 | 16 | 0 | 22 | 39.7% |
| events | 67 | 62 | 3 | 0 | 2 | 92.5% |
| fetch | 1 | 1 | 0 | 0 | 0 | 100.0% |
| fs | 459 | 318 | 67 | 14 | 60 | 69.3% |
| http | 891 | 83 | 326 | 0 | 482 | 9.3% |
| inspector | 85 | 0 | 0 | 0 | 85 | 0.0% |
| module | 190 | 81 | 42 | 2 | 65 | 42.6% |
| net | 204 | 44 | 88 | 0 | 72 | 21.6% |
| os | 5 | 5 | 0 | 0 | 0 | 100.0% |
| other | 877 | 123 | 309 | 4 | 441 | 14.0% |
| path | 16 | 16 | 0 | 0 | 0 | 100.0% |
| perf_hooks | 42 | 3 | 27 | 0 | 12 | 7.1% |
| process | 97 | 40 | 11 | 2 | 44 | 41.2% |
| querystring | 15 | 15 | 0 | 0 | 0 | 100.0% |
| readline | 23 | 0 | 9 | 0 | 14 | 0.0% |
| repl | 78 | 0 | 13 | 0 | 65 | 0.0% |
| sqlite | 43 | 37 | 6 | 0 | 0 | 86.0% |
| stream | 820 | 736 | 77 | 0 | 7 | 89.8% |
| string_decoder | 3 | 3 | 0 | 0 | 0 | 100.0% |
| test_runner | 166 | 72 | 74 | 2 | 18 | 43.4% |
| timers | 64 | 32 | 16 | 2 | 14 | 50.0% |
| tls | 205 | 3 | 18 | 0 | 184 | 1.5% |
| trace_events | 30 | 4 | 0 | 0 | 26 | 13.3% |
| tty | 3 | 0 | 0 | 0 | 3 | 0.0% |
| url | 32 | 32 | 0 | 0 | 0 | 100.0% |
| util | 53 | 52 | 0 | 0 | 1 | 98.1% |
| v8 | 34 | 15 | 7 | 0 | 12 | 44.1% |
| vm | 127 | 23 | 26 | 9 | 69 | 18.1% |
| worker_threads | 195 | 17 | 120 | 7 | 51 | 8.7% |
| zlib | 67 | 57 | 10 | 0 | 0 | 85.1% |

## Passing Tests

- `es-module/test-cjs-prototype-pollution.js`
- `es-module/test-disable-require-module-with-detection.js`
- `es-module/test-esm-cjs-builtins.js`
- `es-module/test-esm-cjs-main.js`
- `es-module/test-esm-data-urls.js`
- `es-module/test-esm-dynamic-import-attribute.js`
- `es-module/test-esm-dynamic-import-commonjs.js`
- `es-module/test-esm-dynamic-import-mutating-fs.js`
- `es-module/test-esm-dynamic-import.js`
- `es-module/test-esm-encoded-path-native.js`
- `es-module/test-esm-error-cache.js`
- `es-module/test-esm-import-attributes-errors.js`
- `es-module/test-esm-invalid-data-urls.js`
- `es-module/test-esm-invalid-pjson.js`
- `es-module/test-esm-loader-cache-clearing.js`
- `es-module/test-esm-preserve-symlinks-main.js`
- `es-module/test-esm-symlink-type.js`
- `es-module/test-esm-type-field-errors-2.js`
- `es-module/test-esm-type-field-errors.js`
- `es-module/test-esm-unknown-extension.js`
- `es-module/test-esm-windows.js`
- `es-module/test-require-module-cycle-cjs-esm-esm.js`
- `es-module/test-require-module-default-extension.js`
- `es-module/test-require-module-defined-esmodule.js`
- `es-module/test-require-module-defined-esmodule.js#block_00_require_esm_should_allow_the_user_override`
- `es-module/test-require-module-defined-esmodule.js#block_01_block_01`
- `es-module/test-require-module-detect-entry-point-aou.js`
- `es-module/test-require-module-detect-entry-point.js`
- `es-module/test-require-module-dont-detect-cjs.js`
- `es-module/test-require-module-dynamic-import-3.js`
- `es-module/test-require-module-dynamic-import-4.js`
- `es-module/test-require-module-implicit.js`
- `es-module/test-require-module-transpiled.js`
- `es-module/test-require-module.js#block_00_test_named_exports`
- `es-module/test-require-module.js#block_01_test_esm_that_import_esm`
- `es-module/test-require-module.js#block_03_test_esm_that_require_cjs`
- `es-module/test-require-module.js#block_05_test_data_import`
- `es-module/test-vm-compile-function-leak.js`
- `es-module/test-vm-contextified-script-leak.js`
- `parallel/test-abortcontroller.js#test_00_abort_is_fired_with_the_correct_event_type_on_abortcontrolle`
- `parallel/test-abortcontroller.js#test_01_abort_events_are_trusted`
- `parallel/test-abortcontroller.js#test_02_abort_events_have_the_same_istrusted_reference`
- `parallel/test-abortcontroller.js#test_03_abortsignal_is_impossible_to_construct_manually`
- `parallel/test-abortcontroller.js#test_04_symbol_tostringtag_is_correct`
- `parallel/test-abortcontroller.js#test_05_abortsignal_abort_creates_an_already_aborted_signal`
- `parallel/test-abortcontroller.js#test_06_abortcontroller_properties_and_methods_valiate_the_receiver`
- `parallel/test-abortcontroller.js#test_07_abortsignal_properties_validate_the_receiver`
- `parallel/test-abortcontroller.js#test_08_abortcontroller_inspection_depth_1_or_null_works`
- `parallel/test-abortcontroller.js#test_09_abortsignal_reason_is_set_correctly`
- `parallel/test-abortcontroller.js#test_10_abortsignal_reasonable_is_set_correctly_with_abortsignal_abo`
- `parallel/test-abortcontroller.js#test_11_abortsignal_timeout_works_as_expected`
- `parallel/test-abortcontroller.js#test_14_setting_a_long_timeout_should_not_keep_the_process_open`
- `parallel/test-abortcontroller.js#test_15_abortsignal_reason_should_default`
- `parallel/test-abortcontroller.js#test_16_abortsignal_throwifaborted_works_as_expected`
- `parallel/test-abortcontroller.js#test_17_abortsignal_throwifaobrted_works_as_expected_2`
- `parallel/test-abortcontroller.js#test_18_abortsignal_throwifaobrted_works_as_expected_3`
- `parallel/test-arm-math-illegal-instruction.js`
- `parallel/test-assert-async.js`
- `parallel/test-assert-async.js#block_00_check_assert_rejects`
- `parallel/test-assert-async.js#block_01_block_01`
- `parallel/test-assert-async.js#block_02_block_02`
- `parallel/test-assert-async.js#block_03_block_03`
- `parallel/test-assert-async.js#block_04_check_assert_doesnotreject`
- `parallel/test-assert-builtins-not-read-from-filesystem.js`
- `parallel/test-assert-calltracker-calls.js`
- `parallel/test-assert-calltracker-calls.js#block_00_block_00`
- `parallel/test-assert-calltracker-calls.js#block_01_block_01`
- `parallel/test-assert-calltracker-calls.js#block_02_block_02`
- `parallel/test-assert-calltracker-calls.js#block_03_block_03`
- `parallel/test-assert-calltracker-calls.js#block_04_block_04`
- `parallel/test-assert-calltracker-calls.js#block_05_block_05`
- `parallel/test-assert-calltracker-getCalls.js`
- `parallel/test-assert-calltracker-getCalls.js#test_00_assert_calltracker_getcalls`
- `parallel/test-assert-calltracker-getCalls.js#test_01_assert_calltracker_reset`
- `parallel/test-assert-calltracker-report.js`
- `parallel/test-assert-calltracker-verify.js`
- `parallel/test-assert-checktag.js`
- `parallel/test-assert-deep.js#test_00_deepequal`
- `parallel/test-assert-deep.js#test_01_date`
- `parallel/test-assert-deep.js#test_02_regexp`
- `parallel/test-assert-deep.js#test_03_deepequal_should_pass_for_these_weird_cases`
- `parallel/test-assert-deep.js#test_04_es6_maps_and_sets`
- `parallel/test-assert-deep.js#test_05_gh_6416_make_sure_circular_refs_do_not_throw`
- `parallel/test-assert-deep.js#test_06_gh_14441_circular_structures_should_be_consistent`
- `parallel/test-assert-deep.js#test_07_ensure_reflexivity_of_deepequal_with_arguments_objects`
- `parallel/test-assert-deep.js#test_08_more_checking_that_arguments_objects_are_handled_correctly`
- `parallel/test-assert-deep.js#test_09_handle_sparse_arrays`
- `parallel/test-assert-deep.js#test_10_handle_different_error_messages`
- `parallel/test-assert-deep.js#test_11_handle_nan`
- `parallel/test-assert-deep.js#test_12_handle_boxed_primitives`
- `parallel/test-assert-deep.js#test_13_minus_zero`
- `parallel/test-assert-deep.js#test_14_handle_symbols_enumerable_only`
- `parallel/test-assert-deep.js#test_15_additional_tests`
- `parallel/test-assert-deep.js#test_16_having_the_same_number_of_owned_properties_the_same_set_of_k`
- `parallel/test-assert-deep.js#test_17_having_an_identical_prototype_property`
- `parallel/test-assert-deep.js#test_18_primitives`
- `parallel/test-assert-deep.js#test_19_additional_tests`
- `parallel/test-assert-deep.js#test_20_having_the_same_number_of_owned_properties_the_same_set_of_k`
- `parallel/test-assert-deep.js#test_21_prototype_check`
- `parallel/test-assert-deep.js#test_24_test_24`
- `parallel/test-assert-deep.js#test_25_basic_valueof_check`
- `parallel/test-assert-deep.js#test_26_basic_array_out_of_bounds_check`
- `parallel/test-assert-deep.js#test_27_test_27`
- `parallel/test-assert-deep.js#test_28_test_28`
- `parallel/test-assert-deep.js#test_29_verify_that_extra_keys_will_be_tested_for_when_using_fake_ar`
- `parallel/test-assert-deep.js#test_30_verify_that_changed_tags_will_still_check_for_the_error_mess`
- `parallel/test-assert-deep.js#test_31_check_for_non_native_errors`
- `parallel/test-assert-deep.js#test_32_check_for_errors_with_cause_property`
- `parallel/test-assert-deep.js#test_33_check_for_aggregateerror`
- `parallel/test-assert-deep.js#test_34_verify_that_valueof_is_not_called_for_boxed_primitives`
- `parallel/test-assert-deep.js#test_35_check_getters`
- `parallel/test-assert-deep.js#test_37_verify_commutativity`
- `parallel/test-assert-deep.js#test_38_crypto`
- `parallel/test-assert-esm-cjs-message-verify.js`
- `parallel/test-assert-fail-deprecation.js`
- `parallel/test-assert-fail-deprecation.js#test_00_two_args_only_operator_defaults_to`
- `parallel/test-assert-fail-deprecation.js#test_01_three_args`
- `parallel/test-assert-fail-deprecation.js#test_02_three_args_with_custom_error`
- `parallel/test-assert-fail-deprecation.js#test_03_no_third_arg_but_a_fourth_arg`
- `parallel/test-assert-fail-deprecation.js#test_04_the_stackframefunction_should_exclude_the_foo_frame`
- `parallel/test-assert-fail.js`
- `parallel/test-assert-fail.js#test_00_no_args`
- `parallel/test-assert-fail.js#test_01_one_arg_message`
- `parallel/test-assert-fail.js#test_02_one_arg_error`
- `parallel/test-assert-fail.js#test_03_object_prototype_get`
- `parallel/test-assert-if-error.js#test_01_general_iferror_tests`
- `parallel/test-assert-if-error.js#test_02_should_not_throw`
- `parallel/test-assert-if-error.js#test_03_https_github_com_nodejs_node_v0_x_archive_issues_2893`
- `parallel/test-assert-objects.js`
- `parallel/test-assert-typedarray-deepequal.js`
- `parallel/test-assert-typedarray-deepequal.js#test_00_equalarraypairs`
- `parallel/test-assert-typedarray-deepequal.js#test_01_looseequalarraypairs`
- `parallel/test-assert-typedarray-deepequal.js#test_02_notequalarraypairs`
- `parallel/test-assert.js#test_00_some_basics`
- `parallel/test-assert.js#test_01_throw_message_if_the_message_is_instanceof_error`
- `parallel/test-assert.js#test_02_errors_created_in_different_contexts_are_handled_as_any_othe`
- `parallel/test-assert.js#test_04_check_messages_from_assert_throws`
- `parallel/test-assert.js#test_05_test_assertion_messages`
- `parallel/test-assert.js#test_06_custom_errors`
- `parallel/test-assert.js#test_07_verify_that_throws_and_doesnotthrow_throw_on_non_functions`
- `parallel/test-assert.js#test_08_https_github_com_nodejs_node_issues_3275`
- `parallel/test-assert.js#test_09_long_values_should_be_truncated_for_display`
- `parallel/test-assert.js#test_10_output_that_extends_beyond_10_lines_should_also_be_truncated`
- `parallel/test-assert.js#test_11_bad_args_to_assertionerror_constructor_should_throw_typeerro`
- `parallel/test-assert.js#test_12_nan_is_handled_correctly`
- `parallel/test-assert.js#test_13_test_strict_assert`
- `parallel/test-assert.js#test_14_additional_asserts`
- `parallel/test-assert.js#test_16_additional_assert`
- `parallel/test-assert.js#test_17_assert_strict_exists`
- `parallel/test-async-hooks-run-in-async-scope-caught-exception.js`
- `parallel/test-async-hooks-run-in-async-scope-this-arg.js`
- `parallel/test-async-hooks-vm-gc.js`
- `parallel/test-async-local-storage-exit-does-not-leak.js`
- `parallel/test-async-wrap-trigger-id.js`
- `parallel/test-bad-unicode.js`
- `parallel/test-beforeexit-event-exit.js`
- `parallel/test-blob-createobjecturl.js`
- `parallel/test-blob-file-backed.js`
- `parallel/test-blocklist.js#block_13_block_13`
- `parallel/test-blocklist.js#block_14_block_14`
- `parallel/test-blocklist.js#block_15_block_15`
- `parallel/test-blocklist.js#block_16_block_16`
- `parallel/test-btoa-atob.js`
- `parallel/test-buffer-alloc.js`
- `parallel/test-buffer-alloc.js#block_00_test_offset_properties`
- `parallel/test-buffer-alloc.js#block_01_test_creating_a_buffer_from_a_uint8array`
- `parallel/test-buffer-alloc.js#block_02_test_creating_a_buffer_from_a_uint8array_old_constructor`
- `parallel/test-buffer-alloc.js#block_03_note_it_is_implicitly_interpreted_as_array_of_integers_modul`
- `parallel/test-buffer-alloc.js#block_04_note_it_is_implicitly_interpreted_as_array_of_integers_modul`
- `parallel/test-buffer-alloc.js#block_05_testing_for_smart_defaults_and_ability_to_pass_string_values`
- `parallel/test-buffer-alloc.js#block_06_ascii_slice_test`
- `parallel/test-buffer-alloc.js#block_07_block_07`
- `parallel/test-buffer-alloc.js#block_08_block_08`
- `parallel/test-buffer-alloc.js#block_09_utf_8_slice_test`
- `parallel/test-buffer-alloc.js#block_10_block_10`
- `parallel/test-buffer-alloc.js#block_11_block_11`
- `parallel/test-buffer-alloc.js#block_12_block_12`
- `parallel/test-buffer-alloc.js#block_13_block_13`
- `parallel/test-buffer-alloc.js#block_14_block_14`
- `parallel/test-buffer-alloc.js#block_15_block_15`
- `parallel/test-buffer-alloc.js#block_16_block_16`
- `parallel/test-buffer-alloc.js#block_17_block_17`
- `parallel/test-buffer-alloc.js#block_18_block_18`
- `parallel/test-buffer-alloc.js#block_19_test_construction_from_arrayish_object`
- `parallel/test-buffer-alloc.js#block_20_block_20`
- `parallel/test-buffer-alloc.js#block_21_block_21`
- `parallel/test-buffer-alloc.js#block_22_block_22`
- `parallel/test-buffer-alloc.js#block_23_block_23`
- `parallel/test-buffer-alloc.js#block_24_block_24`
- `parallel/test-buffer-alloc.js#block_25_block_25`
- `parallel/test-buffer-alloc.js#block_26_block_26`
- `parallel/test-buffer-alloc.js#block_27_block_27`
- `parallel/test-buffer-alloc.js#block_28_block_28`
- `parallel/test-buffer-alloc.js#block_29_block_29`
- `parallel/test-buffer-alloc.js#block_30_block_30`
- `parallel/test-buffer-alloc.js#block_31_block_31`
- `parallel/test-buffer-alloc.js#block_32_block_32`
- `parallel/test-buffer-alloc.js#block_33_block_33`
- `parallel/test-buffer-alloc.js#block_34_block_34`
- `parallel/test-buffer-alloc.js#block_35_block_35`
- `parallel/test-buffer-alloc.js#block_36_block_36`
- `parallel/test-buffer-alloc.js#block_37_block_37`
- `parallel/test-buffer-alloc.js#block_38_block_38`
- `parallel/test-buffer-alloc.js#block_39_block_39`
- `parallel/test-buffer-alloc.js#block_40_block_40`
- `parallel/test-buffer-alloc.js#block_41_block_41`
- `parallel/test-buffer-alloc.js#block_42_block_42`
- `parallel/test-buffer-alloc.js#block_43_block_43`
- `parallel/test-buffer-alloc.js#block_44_block_44`
- `parallel/test-buffer-alloc.js#block_45_block_45`
- `parallel/test-buffer-alloc.js#block_46_block_46`
- `parallel/test-buffer-alloc.js#block_47_test_for_common_write_u_intle_be`
- `parallel/test-buffer-alloc.js#block_48_the_source_buffer`
- `parallel/test-buffer-alloc.js#block_49_block_49`
- `parallel/test-buffer-alloc.js#block_50_test_that_parsearrayindex_handles_full_uint32`
- `parallel/test-buffer-alloc.js#block_51_unpooled_buffer_replaces_slowbuffer`
- `parallel/test-buffer-alloc.js#block_52_block_52`
- `parallel/test-buffer-arraybuffer.js`
- `parallel/test-buffer-arraybuffer.js#block_00_test_the_byteoffset_and_length_arguments`
- `parallel/test-buffer-arraybuffer.js#block_01_test_the_deprecated_buffer_version_also`
- `parallel/test-buffer-arraybuffer.js#block_02_block_02`
- `parallel/test-buffer-arraybuffer.js#block_03_block_03`
- `parallel/test-buffer-ascii.js`
- `parallel/test-buffer-badhex.js`
- `parallel/test-buffer-badhex.js#block_00_test_hex_strings_and_bad_hex_strings`
- `parallel/test-buffer-badhex.js#block_01_block_01`
- `parallel/test-buffer-badhex.js#block_02_block_02`
- `parallel/test-buffer-badhex.js#block_03_block_03`
- `parallel/test-buffer-bigint64.js`
- `parallel/test-buffer-bytelength.js`
- `parallel/test-buffer-compare-offset.js`
- `parallel/test-buffer-compare.js`
- `parallel/test-buffer-concat.js`
- `parallel/test-buffer-constants.js`
- `parallel/test-buffer-constructor-node-modules-paths.js`
- `parallel/test-buffer-constructor-node-modules.js`
- `parallel/test-buffer-copy.js`
- `parallel/test-buffer-copy.js#block_00_block_00`
- `parallel/test-buffer-copy.js#block_01_block_01`
- `parallel/test-buffer-copy.js#block_02_block_02`
- `parallel/test-buffer-copy.js#block_03_block_03`
- `parallel/test-buffer-copy.js#block_04_block_04`
- `parallel/test-buffer-copy.js#block_05_block_05`
- `parallel/test-buffer-copy.js#block_06_block_06`
- `parallel/test-buffer-copy.js#block_07_block_07`
- `parallel/test-buffer-copy.js#block_08_block_08`
- `parallel/test-buffer-copy.js#block_09_block_09`
- `parallel/test-buffer-copy.js#block_10_block_10`
- `parallel/test-buffer-copy.js#block_11_test_that_the_target_can_be_a_uint8array`
- `parallel/test-buffer-copy.js#block_12_test_that_the_source_can_be_a_uint8array_too`
- `parallel/test-buffer-copy.js#block_13_block_13`
- `parallel/test-buffer-equals.js`
- `parallel/test-buffer-failed-alloc-typed-arrays.js`
- `parallel/test-buffer-fakes.js`
- `parallel/test-buffer-from.js`
- `parallel/test-buffer-from.js#block_00_block_00`
- `parallel/test-buffer-from.js#block_01_block_01`
- `parallel/test-buffer-from.js#block_02_block_02`
- `parallel/test-buffer-includes.js`
- `parallel/test-buffer-inheritance.js`
- `parallel/test-buffer-inspect.js`
- `parallel/test-buffer-isascii.js`
- `parallel/test-buffer-isencoding.js`
- `parallel/test-buffer-isutf8.js`
- `parallel/test-buffer-iterator.js`
- `parallel/test-buffer-new.js`
- `parallel/test-buffer-no-negative-allocation.js`
- `parallel/test-buffer-nopendingdep-map.js`
- `parallel/test-buffer-of-no-deprecation.js`
- `parallel/test-buffer-over-max-length.js`
- `parallel/test-buffer-parent-property.js`
- `parallel/test-buffer-pool-untransferable.js`
- `parallel/test-buffer-prototype-inspect.js`
- `parallel/test-buffer-prototype-inspect.js#block_00_block_00`
- `parallel/test-buffer-prototype-inspect.js#block_01_block_01`
- `parallel/test-buffer-prototype-inspect.js#block_02_block_02`
- `parallel/test-buffer-read.js`
- `parallel/test-buffer-readdouble.js`
- `parallel/test-buffer-readfloat.js`
- `parallel/test-buffer-readint.js`
- `parallel/test-buffer-readint.js#block_00_test_oob`
- `parallel/test-buffer-readint.js#block_01_test_8_bit_signed_integers`
- `parallel/test-buffer-readint.js#block_02_test_16_bit_integers`
- `parallel/test-buffer-readint.js#block_03_test_32_bit_integers`
- `parallel/test-buffer-readint.js#block_04_test_int`
- `parallel/test-buffer-readuint.js`
- `parallel/test-buffer-readuint.js#block_00_test_oob`
- `parallel/test-buffer-readuint.js#block_01_test_8_bit_unsigned_integers`
- `parallel/test-buffer-readuint.js#block_02_test_16_bit_unsigned_integers`
- `parallel/test-buffer-readuint.js#block_03_test_32_bit_unsigned_integers`
- `parallel/test-buffer-readuint.js#block_04_test_uint`
- `parallel/test-buffer-resizable.js`
- `parallel/test-buffer-safe-unsafe.js`
- `parallel/test-buffer-set-inspect-max-bytes.js`
- `parallel/test-buffer-sharedarraybuffer.js`
- `parallel/test-buffer-slice.js`
- `parallel/test-buffer-slice.js#block_00_block_00`
- `parallel/test-buffer-slice.js#block_01_block_01`
- `parallel/test-buffer-slice.js#block_02_block_02`
- `parallel/test-buffer-slice.js#block_03_block_03`
- `parallel/test-buffer-slice.js#block_04_block_04`
- `parallel/test-buffer-slow.js`
- `parallel/test-buffer-swap.js`
- `parallel/test-buffer-swap.js#block_00_test_buffers_small_enough_to_use_the_js_implementation`
- `parallel/test-buffer-swap.js#block_01_operates_in_place`
- `parallel/test-buffer-swap.js#block_02_block_02`
- `parallel/test-buffer-swap.js#block_03_force_use_of_native_code_buffer_size_above_threshold_limit_f`
- `parallel/test-buffer-swap.js#block_04_block_04`
- `parallel/test-buffer-swap.js#block_05_block_05`
- `parallel/test-buffer-swap.js#block_06_test_native_code_with_buffers_that_are_not_memory_aligned`
- `parallel/test-buffer-swap.js#block_07_block_07`
- `parallel/test-buffer-swap.js#block_08_block_08`
- `parallel/test-buffer-tojson.js`
- `parallel/test-buffer-tojson.js#block_00_block_00`
- `parallel/test-buffer-tojson.js#block_01_issue_gh_7849`
- `parallel/test-buffer-tojson.js#block_02_gh_5110`
- `parallel/test-buffer-tostring-rangeerror.js`
- `parallel/test-buffer-tostring.js`
- `parallel/test-buffer-write.js`
- `parallel/test-buffer-write.js#block_00_block_00`
- `parallel/test-buffer-write.js#block_01_block_01`
- `parallel/test-buffer-writedouble.js`
- `parallel/test-buffer-writefloat.js`
- `parallel/test-buffer-writeint.js`
- `parallel/test-buffer-writeint.js#block_00_test_8_bit`
- `parallel/test-buffer-writeint.js#block_01_test_16_bit`
- `parallel/test-buffer-writeint.js#block_02_test_32_bit`
- `parallel/test-buffer-writeint.js#block_03_test_48_bit`
- `parallel/test-buffer-writeint.js#block_04_test_int`
- `parallel/test-buffer-writeuint.js`
- `parallel/test-buffer-writeuint.js#block_00_block_00`
- `parallel/test-buffer-writeuint.js#block_01_block_01`
- `parallel/test-buffer-writeuint.js#block_02_test_16_bit`
- `parallel/test-buffer-writeuint.js#block_03_test_32_bit`
- `parallel/test-buffer-writeuint.js#block_04_test_48_bit`
- `parallel/test-buffer-writeuint.js#block_05_test_uint`
- `parallel/test-buffer-zero-fill-cli.js`
- `parallel/test-buffer-zero-fill-reset.js`
- `parallel/test-buffer-zero-fill.js`
- `parallel/test-child-process-exec-maxbuf.js#block_00_default_value`
- `parallel/test-child-process-exec-maxbuf.js#block_01_default_value`
- `parallel/test-child-process-exec-maxbuf.js#block_02_block_02`
- `parallel/test-child-process-exec-maxbuf.js#block_03_block_03`
- `parallel/test-child-process-exec-maxbuf.js#block_04_default_value`
- `parallel/test-child-process-exec-maxbuf.js#block_05_default_value`
- `parallel/test-child-process-exec-maxbuf.js#block_06_block_06`
- `parallel/test-child-process-exec-maxbuf.js#block_07_block_07`
- `parallel/test-child-process-exec-maxbuf.js#block_10_block_10`
- `parallel/test-child-process-exec-timeout-not-expired.js`
- `parallel/test-child-process-execfile-maxbuf.js#block_00_default_value`
- `parallel/test-child-process-execfile-maxbuf.js#block_01_default_value`
- `parallel/test-child-process-execfile-maxbuf.js#block_02_block_02`
- `parallel/test-child-process-execfile-maxbuf.js#block_03_block_03`
- `parallel/test-child-process-execfile-maxbuf.js#block_04_block_04`
- `parallel/test-child-process-execfile-maxbuf.js#block_05_block_05`
- `parallel/test-child-process-execfile.js#block_00_block_00`
- `parallel/test-child-process-execfile.js#block_01_block_01`
- `parallel/test-child-process-execfile.js#block_03_block_03`
- `parallel/test-child-process-execfile.js#block_04_block_04`
- `parallel/test-child-process-execfile.js#block_06_block_06`
- `parallel/test-child-process-execfilesync-maxbuf.js#block_01_verify_that_a_maxbuffer_size_of_infinity_works`
- `parallel/test-child-process-fork-and-spawn.js`
- `parallel/test-child-process-fork-no-shell.js`
- `parallel/test-child-process-fork-ref.js`
- `parallel/test-child-process-fork3.js`
- `parallel/test-child-process-send-after-close.js`
- `parallel/test-child-process-spawnsync-maxbuf.js#block_01_verify_that_a_maxbuffer_size_of_infinity_works`
- `parallel/test-child-process-spawnsync-maxbuf.js#block_03_default_maxbuffer_size_is_1024_1024`
- `parallel/test-child-process-uid-gid.js`
- `parallel/test-cli-eval.js`
- `parallel/test-cli-eval.js#block_00_assert_that_module_loading_works`
- `parallel/test-cli-eval.js#block_01_regression_test_for_https_github_com_nodejs_node_issues_3574`
- `parallel/test-cli-eval.js#block_02_regression_test_for_https_github_com_nodejs_node_issues_8534`
- `parallel/test-cli-eval.js#block_03_regression_test_for_https_github_com_nodejs_node_issues_1194`
- `parallel/test-cli-eval.js#block_04_block_04`
- `parallel/test-cli-syntax-eval.js`
- `parallel/test-client-request-destroy.js`
- `parallel/test-common-gc.js#block_01_block_01`
- `parallel/test-console-assign-undefined.js`
- `parallel/test-console-async-write-error.js`
- `parallel/test-console-clear.js`
- `parallel/test-console-count.js`
- `parallel/test-console-group.js`
- `parallel/test-console-group.js#block_00_basic_group_functionality`
- `parallel/test-console-group.js#block_01_group_indentation_is_tracked_per_console_instance`
- `parallel/test-console-group.js#block_02_make_sure_labels_work`
- `parallel/test-console-group.js#block_03_check_that_console_groupcollapsed_is_an_alias_of_console_gro`
- `parallel/test-console-group.js#block_04_check_that_multiline_strings_and_object_output_are_indented_`
- `parallel/test-console-group.js#block_05_check_that_the_kgroupindent_symbol_property_is_not_enumerabl`
- `parallel/test-console-group.js#block_06_check_custom_groupindentation`
- `parallel/test-console-group.js#block_07_check_the_correctness_of_the_groupindentation_parameter`
- `parallel/test-console-instance.js`
- `parallel/test-console-instance.js#block_00_block_00`
- `parallel/test-console-instance.js#block_01_test_calling_console_without_the_new_keyword`
- `parallel/test-console-instance.js#block_02_test_extending_console`
- `parallel/test-console-instance.js#block_03_instance_that_does_not_ignore_the_stream_errors`
- `parallel/test-console-issue-43095.js`
- `parallel/test-console-log-stdio-broken-dest.js`
- `parallel/test-console-log-throw-primitive.js`
- `parallel/test-console-methods.js`
- `parallel/test-console-no-swallow-stack-overflow.js`
- `parallel/test-console-not-call-toString.js`
- `parallel/test-console-self-assign.js`
- `parallel/test-console-stdio-setters.js`
- `parallel/test-console-sync-write-error.js`
- `parallel/test-console-table.js`
- `parallel/test-console-tty-colors.js`
- `parallel/test-console-with-frozen-intrinsics.js`
- `parallel/test-console.js`
- `parallel/test-crypto-aes-wrap.js`
- `parallel/test-crypto-async-sign-verify.js`
- `parallel/test-crypto-authenticated-stream.js`
- `parallel/test-crypto-authenticated.js`
- `parallel/test-crypto-authenticated.js#block_00_non_authenticating_mode`
- `parallel/test-crypto-authenticated.js#block_01_throw`
- `parallel/test-crypto-authenticated.js#block_02_test_that_gcm_can_produce_shorter_authentication_tags_than_1`
- `parallel/test-crypto-authenticated.js#block_03_test_that_users_can_manually_restrict_the_gcm_tag_length_to_`
- `parallel/test-crypto-authenticated.js#block_04_authentication_tag_length_has_been_specified`
- `parallel/test-crypto-authenticated.js#block_05_authentication_tag_has_been_specified`
- `parallel/test-crypto-authenticated.js#block_06_test_that_setaad_throws_if_an_invalid_plaintext_length_has_b`
- `parallel/test-crypto-authenticated.js#block_07_test_that_setaad_and_update_throw_if_the_plaintext_is_too_lo`
- `parallel/test-crypto-authenticated.js#block_08_been_specified`
- `parallel/test-crypto-authenticated.js#block_09_test_that_final_throws_in_ccm_mode_when_no_authentication_ta`
- `parallel/test-crypto-authenticated.js#block_10_test_that_setauthtag_does_not_throw_in_gcm_mode_when_called_`
- `parallel/test-crypto-authenticated.js#block_11_test_that_an_iv_length_of_11_does_not_overflow_max_message_s`
- `parallel/test-crypto-authenticated.js#block_12_final_in_gcm_or_ocb_mode`
- `parallel/test-crypto-authenticated.js#block_13_test_that_setauthtag_can_only_be_called_once`
- `parallel/test-crypto-authenticated.js#block_14_https_www_openssl_org_news_secadv_20190306_txt`
- `parallel/test-crypto-authenticated.js#block_15_block_15`
- `parallel/test-crypto-authenticated.js#block_16_block_16`
- `parallel/test-crypto-authenticated.js#block_17_require_the_authentication_tag_before_calls_to_update_during`
- `parallel/test-crypto-authenticated.js#block_18_no_recommended_or_approved_authentication_tag_lengths_below_`
- `parallel/test-crypto-authenticated.js#block_19_https_github_com_nodejs_node_issues_45874`
- `parallel/test-crypto-certificate.js`
- `parallel/test-crypto-certificate.js#block_00_block_00`
- `parallel/test-crypto-certificate.js#block_01_block_01`
- `parallel/test-crypto-certificate.js#block_02_block_02`
- `parallel/test-crypto-cipheriv-decipheriv.js`
- `parallel/test-crypto-cipheriv-decipheriv.js#block_00_block_00`
- `parallel/test-crypto-cipheriv-decipheriv.js#block_01_block_01`
- `parallel/test-crypto-cipheriv-decipheriv.js#block_02_block_02`
- `parallel/test-crypto-cipheriv-decipheriv.js#block_03_block_03`
- `parallel/test-crypto-classes.js`
- `parallel/test-crypto-des3-wrap.js`
- `parallel/test-crypto-dh-constructor.js`
- `parallel/test-crypto-dh-constructor.js#block_00_block_00`
- `parallel/test-crypto-dh-constructor.js#block_01_block_01`
- `parallel/test-crypto-dh-constructor.js#block_02_block_02`
- `parallel/test-crypto-dh-curves.js`
- `parallel/test-crypto-dh-errors.js`
- `parallel/test-crypto-dh-generate-keys.js`
- `parallel/test-crypto-dh-group-setters.js`
- `parallel/test-crypto-dh-leak.js`
- `parallel/test-crypto-dh-modp2-views.js`
- `parallel/test-crypto-dh-modp2.js`
- `parallel/test-crypto-dh-modp2.js#block_00_block_00`
- `parallel/test-crypto-dh-odd-key.js`
- `parallel/test-crypto-dh-padding.js`
- `parallel/test-crypto-dh-shared.js`
- `parallel/test-crypto-dh-stateless.js`
- `parallel/test-crypto-dh.js`
- `parallel/test-crypto-dh.js#block_00_block_00`
- `parallel/test-crypto-dh.js#block_01_through_a_fluke_of_history_g_0_defaults_to_dh_generator_2`
- `parallel/test-crypto-dh.js#block_02_block_02`
- `parallel/test-crypto-domain.js`
- `parallel/test-crypto-ecb.js`
- `parallel/test-crypto-ecb.js#block_00_block_00`
- `parallel/test-crypto-ecb.js#block_01_block_01`
- `parallel/test-crypto-ecdh-convert-key.js`
- `parallel/test-crypto-encoding-validation-error.js`
- `parallel/test-crypto-encoding-validation-error.js#block_00_block_00`
- `parallel/test-crypto-encoding-validation-error.js#block_01_block_01`
- `parallel/test-crypto-encoding-validation-error.js#block_02_block_02`
- `parallel/test-crypto-encoding-validation-error.js#block_03_block_03`
- `parallel/test-crypto-from-binary.js`
- `parallel/test-crypto-gcm-explicit-short-tag.js`
- `parallel/test-crypto-gcm-explicit-short-tag.js#block_00_block_00`
- `parallel/test-crypto-gcm-explicit-short-tag.js#block_01_block_01`
- `parallel/test-crypto-gcm-explicit-short-tag.js#block_02_block_02`
- `parallel/test-crypto-gcm-implicit-short-tag.js`
- `parallel/test-crypto-getcipherinfo.js`
- `parallel/test-crypto-hash-stream-pipe.js`
- `parallel/test-crypto-hash.js`
- `parallel/test-crypto-hash.js#block_00_block_00`
- `parallel/test-crypto-hash.js#block_01_test_xof_hash_functions_and_the_outputlength_option`
- `parallel/test-crypto-hash.js#block_02_block_02`
- `parallel/test-crypto-hash.js#block_03_block_03`
- `parallel/test-crypto-hash.js#block_04_block_04`
- `parallel/test-crypto-hkdf.js`
- `parallel/test-crypto-hmac.js`
- `parallel/test-crypto-hmac.js#block_00_block_00`
- `parallel/test-crypto-hmac.js#block_01_block_01`
- `parallel/test-crypto-hmac.js#block_02_check_initialized_uninitialized_state_transition_after_calli`
- `parallel/test-crypto-hmac.js#block_03_calls_to_update_omitted_intentionally`
- `parallel/test-crypto-hmac.js#block_04_block_04`
- `parallel/test-crypto-hmac.js#block_05_block_05`
- `parallel/test-crypto-hmac.js#block_06_block_06`
- `parallel/test-crypto-key-objects-messageport.js`
- `parallel/test-crypto-key-objects-to-crypto-key.js`
- `parallel/test-crypto-key-objects-to-crypto-key.js#block_00_block_00`
- `parallel/test-crypto-key-objects-to-crypto-key.js#block_01_block_01`
- `parallel/test-crypto-key-objects-to-crypto-key.js#block_02_block_02`
- `parallel/test-crypto-key-objects-to-crypto-key.js#block_03_block_03`
- `parallel/test-crypto-key-objects-to-crypto-key.js#block_04_block_04`
- `parallel/test-crypto-key-objects-to-crypto-key.js#block_05_block_05`
- `parallel/test-crypto-key-objects.js#block_00_block_00`
- `parallel/test-crypto-key-objects.js#block_01_block_01`
- `parallel/test-crypto-key-objects.js#block_02_block_02`
- `parallel/test-crypto-key-objects.js#block_03_block_03`
- `parallel/test-crypto-key-objects.js#block_04_block_04`
- `parallel/test-crypto-key-objects.js#block_06_block_06`
- `parallel/test-crypto-key-objects.js#block_07_block_07`
- `parallel/test-crypto-key-objects.js#block_08_block_08`
- `parallel/test-crypto-key-objects.js#block_09_block_09`
- `parallel/test-crypto-key-objects.js#block_10_block_10`
- `parallel/test-crypto-key-objects.js#block_11_block_11`
- `parallel/test-crypto-key-objects.js#block_12_block_12`
- `parallel/test-crypto-key-objects.js#block_13_block_13`
- `parallel/test-crypto-key-objects.js#block_14_block_14`
- `parallel/test-crypto-key-objects.js#block_15_block_15`
- `parallel/test-crypto-key-objects.js#block_16_block_16`
- `parallel/test-crypto-key-objects.js#block_17_block_17`
- `parallel/test-crypto-keygen-async-elliptic-curve-jwk-rsa.js`
- `parallel/test-crypto-keygen-async-encrypted-private-key-der.js`
- `parallel/test-crypto-keygen-async-explicit-elliptic-curve-encrypted.js.js`
- `parallel/test-crypto-keygen-async-explicit-elliptic-curve.js`
- `parallel/test-crypto-keygen-async-named-elliptic-curve-encrypted.js`
- `parallel/test-crypto-keygen-async-named-elliptic-curve.js`
- `parallel/test-crypto-keygen-async-rsa.js`
- `parallel/test-crypto-keygen-bit-length.js`
- `parallel/test-crypto-keygen-deprecation.js`
- `parallel/test-crypto-keygen-dh-classic.js`
- `parallel/test-crypto-keygen-duplicate-deprecated-option.js`
- `parallel/test-crypto-keygen-eddsa.js`
- `parallel/test-crypto-keygen-empty-passphrase-no-error.js`
- `parallel/test-crypto-keygen-invalid-parameter-encoding-dsa.js`
- `parallel/test-crypto-keygen-invalid-parameter-encoding-ec.js`
- `parallel/test-crypto-keygen-key-object-without-encoding.js`
- `parallel/test-crypto-keygen-key-objects.js`
- `parallel/test-crypto-keygen-missing-oid.js`
- `parallel/test-crypto-keygen-no-rsassa-pss-params.js`
- `parallel/test-crypto-keygen-non-standard-public-exponent.js`
- `parallel/test-crypto-keygen-promisify.js`
- `parallel/test-crypto-keygen-rfc8017-9-1.js`
- `parallel/test-crypto-keygen-rfc8017-a-2-3.js`
- `parallel/test-crypto-keygen-rsa-pss.js`
- `parallel/test-crypto-keygen-sync.js`
- `parallel/test-crypto-keygen.js`
- `parallel/test-crypto-keygen.js#block_00_test_invalid_parameter_encoding`
- `parallel/test-crypto-keygen.js#block_01_block_01`
- `parallel/test-crypto-keygen.js#block_02_block_02`
- `parallel/test-crypto-keygen.js#block_03_block_03`
- `parallel/test-crypto-keygen.js#block_04_test_rsa_parameters`
- `parallel/test-crypto-keygen.js#block_05_test_dsa_parameters`
- `parallel/test-crypto-keygen.js#block_06_test_ec_parameters`
- `parallel/test-crypto-keygen.js#block_07_block_07`
- `parallel/test-crypto-keygen.js#block_08_test_invalid_key_encoding_types`
- `parallel/test-crypto-keygen.js#block_09_block_09`
- `parallel/test-crypto-keygen.js#block_10_block_10`
- `parallel/test-crypto-lazy-transform-writable.js`
- `parallel/test-crypto-oneshot-hash.js`
- `parallel/test-crypto-op-during-process-exit.js`
- `parallel/test-crypto-padding-aes256.js`
- `parallel/test-crypto-padding.js`
- `parallel/test-crypto-pbkdf2.js`
- `parallel/test-crypto-private-decrypt-gh32240.js`
- `parallel/test-crypto-psychic-signatures.js`
- `parallel/test-crypto-random.js`
- `parallel/test-crypto-random.js#block_00_block_00`
- `parallel/test-crypto-random.js#block_01_block_01`
- `parallel/test-crypto-random.js#block_02_block_02`
- `parallel/test-crypto-random.js#block_03_block_03`
- `parallel/test-crypto-random.js#block_04_block_04`
- `parallel/test-crypto-random.js#block_05_block_05`
- `parallel/test-crypto-random.js#block_06_block_06`
- `parallel/test-crypto-random.js#block_07_block_07`
- `parallel/test-crypto-random.js#block_08_block_08`
- `parallel/test-crypto-random.js#block_09_block_09`
- `parallel/test-crypto-random.js#block_10_block_10`
- `parallel/test-crypto-random.js#block_11_block_11`
- `parallel/test-crypto-random.js#block_12_block_12`
- `parallel/test-crypto-random.js#block_13_block_13`
- `parallel/test-crypto-random.js#block_14_block_14`
- `parallel/test-crypto-random.js#block_15_block_15`
- `parallel/test-crypto-random.js#block_16_block_16`
- `parallel/test-crypto-random.js#block_17_block_17`
- `parallel/test-crypto-random.js#block_18_block_18`
- `parallel/test-crypto-random.js#block_19_block_19`
- `parallel/test-crypto-random.js#block_20_block_20`
- `parallel/test-crypto-random.js#block_21_block_21`
- `parallel/test-crypto-randomfillsync-regression.js`
- `parallel/test-crypto-randomuuid.js`
- `parallel/test-crypto-rsa-dsa.js`
- `parallel/test-crypto-rsa-dsa.js#block_00_test_rsa_encryption_decryption`
- `parallel/test-crypto-rsa-dsa.js#block_01_ensure_compatibility_when_using_non_sha1_hash_functions`
- `parallel/test-crypto-rsa-dsa.js#block_02_block_02`
- `parallel/test-crypto-rsa-dsa.js#block_03_block_03`
- `parallel/test-crypto-rsa-dsa.js#block_04_block_04`
- `parallel/test-crypto-rsa-dsa.js#block_05_block_05`
- `parallel/test-crypto-rsa-dsa.js#block_06_block_06`
- `parallel/test-crypto-secret-keygen.js`
- `parallel/test-crypto-secret-keygen.js#block_00_block_00`
- `parallel/test-crypto-secret-keygen.js#block_01_block_01`
- `parallel/test-crypto-secret-keygen.js#block_02_block_02`
- `parallel/test-crypto-secure-heap.js`
- `parallel/test-crypto-sign-verify.js#block_00_block_00`
- `parallel/test-crypto-sign-verify.js#block_01_block_01`
- `parallel/test-crypto-sign-verify.js#block_02_test_handling_of_exceptional_conditions`
- `parallel/test-crypto-sign-verify.js#block_03_test_signing_and_verifying`
- `parallel/test-crypto-sign-verify.js#block_04_block_04`
- `parallel/test-crypto-sign-verify.js#block_05_block_05`
- `parallel/test-crypto-sign-verify.js#block_06_special_tests_for_rsa_pkcs1_pss_padding`
- `parallel/test-crypto-sign-verify.js#block_07_https_www_emc_com_emc_plus_rsa_labs_standards_initiatives_pk`
- `parallel/test-crypto-sign-verify.js#block_08_test_exceptions_for_invalid_padding_and_saltlength_values`
- `parallel/test-crypto-sign-verify.js#block_14_block_14`
- `parallel/test-crypto-sign-verify.js#block_16_block_16`
- `parallel/test-crypto-stream.js`
- `parallel/test-crypto-update-encoding.js`
- `parallel/test-crypto-worker-thread.js`
- `parallel/test-delayed-require.js`
- `parallel/test-destroy-socket-in-lookup.js`
- `parallel/test-dgram-abort-closed.js`
- `parallel/test-dgram-address.js#block_01_block_01`
- `parallel/test-dgram-bind-error-repeat.js`
- `parallel/test-dgram-bytes-length.js`
- `parallel/test-dgram-createSocket-type.js#block_01_block_01`
- `parallel/test-dgram-deprecation-error.js`
- `parallel/test-dgram-multicast-set-interface.js#block_05_block_05`
- `parallel/test-dgram-multicast-set-interface.js#block_06_block_06`
- `parallel/test-dgram-multicast-set-interface.js#block_07_block_07`
- `parallel/test-dgram-ref.js`
- `parallel/test-dgram-send-invalid-msg-type.js`
- `parallel/test-dgram-sendto.js`
- `parallel/test-dgram-unref.js`
- `parallel/test-dgram-unref.js#block_00_block_00`
- `parallel/test-dgram-unref.js#block_01_block_01`
- `parallel/test-diagnostics-channel-has-subscribers.js`
- `parallel/test-diagnostics-channel-object-channel-pub-sub.js`
- `parallel/test-diagnostics-channel-pub-sub.js`
- `parallel/test-diagnostics-channel-symbol-named.js`
- `parallel/test-diagnostics-channel-sync-unsubscribe.js`
- `parallel/test-diagnostics-channel-tracing-channel-callback-early-exit.js`
- `parallel/test-diagnostics-channel-tracing-channel-callback-error.js`
- `parallel/test-diagnostics-channel-tracing-channel-callback-run-stores.js`
- `parallel/test-diagnostics-channel-tracing-channel-callback.js`
- `parallel/test-diagnostics-channel-tracing-channel-has-subscribers.js`
- `parallel/test-diagnostics-channel-tracing-channel-has-subscribers.js#block_00_block_00`
- `parallel/test-diagnostics-channel-tracing-channel-has-subscribers.js#block_01_block_01`
- `parallel/test-diagnostics-channel-tracing-channel-promise-early-exit.js`
- `parallel/test-diagnostics-channel-tracing-channel-promise-error.js`
- `parallel/test-diagnostics-channel-tracing-channel-promise.js`
- `parallel/test-diagnostics-channel-tracing-channel-sync-early-exit.js`
- `parallel/test-diagnostics-channel-tracing-channel-sync-error.js`
- `parallel/test-diagnostics-channel-tracing-channel-sync-run-stores.js`
- `parallel/test-diagnostics-channel-tracing-channel-sync.js`
- `parallel/test-dns-perf_hooks.js`
- `parallel/test-dns-promises-exists.js`
- `parallel/test-dns-setlocaladdress.js#block_00_verifies_that_setlocaladdress_succeeds_with_ipv4_and_ipv6_ad`
- `parallel/test-domain-add-remove.js`
- `parallel/test-domain-bind-timeout.js`
- `parallel/test-domain-crypto.js`
- `parallel/test-domain-ee-error-listener.js`
- `parallel/test-domain-ee-implicit.js`
- `parallel/test-domain-emit-error-handler-stack.js`
- `parallel/test-domain-enter-exit.js`
- `parallel/test-domain-from-timer.js`
- `parallel/test-domain-fs-enoent-stream.js`
- `parallel/test-domain-intercept.js`
- `parallel/test-domain-intercept.js#block_00_block_00`
- `parallel/test-domain-intercept.js#block_01_block_01`
- `parallel/test-domain-intercept.js#block_02_block_02`
- `parallel/test-domain-nested.js`
- `parallel/test-domain-promise.js#block_02_block_02`
- `parallel/test-domain-promise.js#block_04_block_04`
- `parallel/test-domain-promise.js#block_07_block_07`
- `parallel/test-domain-run.js`
- `parallel/test-domain-safe-exit.js`
- `parallel/test-domain-stack.js`
- `parallel/test-domain-throw-error-then-throw-from-uncaught-exception-handler.js`
- `parallel/test-domain-thrown-error-handler-stack.js`
- `parallel/test-domain-top-level-error-handler-clears-stack.js`
- `parallel/test-domain-top-level-error-handler-throw.js`
- `parallel/test-domain-with-abort-on-uncaught-exception.js`
- `parallel/test-domexception-cause.js#block_00_block_00`
- `parallel/test-env-var-no-warnings.js`
- `parallel/test-eval-strict-referenceerror.js`
- `parallel/test-eval.js`
- `parallel/test-event-emitter-add-listeners.js`
- `parallel/test-event-emitter-add-listeners.js#block_00_block_00`
- `parallel/test-event-emitter-add-listeners.js#block_01_just_make_sure_that_this_doesn_t_throw`
- `parallel/test-event-emitter-add-listeners.js#block_02_block_02`
- `parallel/test-event-emitter-check-listener-leaks.js`
- `parallel/test-event-emitter-check-listener-leaks.js#block_00_default`
- `parallel/test-event-emitter-check-listener-leaks.js#block_01_process_wide`
- `parallel/test-event-emitter-check-listener-leaks.js#block_02_but_maxlisteners_still_has_precedence_over_defaultmaxlistene`
- `parallel/test-event-emitter-emit-context.js`
- `parallel/test-event-emitter-error-monitor.js`
- `parallel/test-event-emitter-errors.js`
- `parallel/test-event-emitter-get-max-listeners.js`
- `parallel/test-event-emitter-invalid-listener.js`
- `parallel/test-event-emitter-listener-count.js`
- `parallel/test-event-emitter-listeners-side-effects.js`
- `parallel/test-event-emitter-listeners.js`
- `parallel/test-event-emitter-listeners.js#block_00_block_00`
- `parallel/test-event-emitter-listeners.js#block_01_block_01`
- `parallel/test-event-emitter-listeners.js#block_02_block_02`
- `parallel/test-event-emitter-listeners.js#block_03_block_03`
- `parallel/test-event-emitter-listeners.js#block_04_block_04`
- `parallel/test-event-emitter-listeners.js#block_05_block_05`
- `parallel/test-event-emitter-listeners.js#block_06_block_06`
- `parallel/test-event-emitter-listeners.js#block_07_block_07`
- `parallel/test-event-emitter-listeners.js#block_08_block_08`
- `parallel/test-event-emitter-listeners.js#block_09_block_09`
- `parallel/test-event-emitter-max-listeners.js`
- `parallel/test-event-emitter-method-names.js`
- `parallel/test-event-emitter-modify-in-emit.js`
- `parallel/test-event-emitter-no-error-provided-to-error-event.js`
- `parallel/test-event-emitter-num-args.js`
- `parallel/test-event-emitter-once.js`
- `parallel/test-event-emitter-prepend.js`
- `parallel/test-event-emitter-remove-all-listeners.js`
- `parallel/test-event-emitter-remove-all-listeners.js#block_00_block_00`
- `parallel/test-event-emitter-remove-all-listeners.js#block_01_block_01`
- `parallel/test-event-emitter-remove-all-listeners.js#block_02_block_02`
- `parallel/test-event-emitter-remove-all-listeners.js#block_03_block_03`
- `parallel/test-event-emitter-remove-all-listeners.js#block_04_block_04`
- `parallel/test-event-emitter-remove-all-listeners.js#block_05_block_05`
- `parallel/test-event-emitter-remove-all-listeners.js#block_06_block_06`
- `parallel/test-event-emitter-remove-listeners.js`
- `parallel/test-event-emitter-remove-listeners.js#block_00_block_00`
- `parallel/test-event-emitter-remove-listeners.js#block_01_block_01`
- `parallel/test-event-emitter-remove-listeners.js#block_02_block_02`
- `parallel/test-event-emitter-remove-listeners.js#block_03_block_03`
- `parallel/test-event-emitter-remove-listeners.js#block_04_block_04`
- `parallel/test-event-emitter-remove-listeners.js#block_05_block_05`
- `parallel/test-event-emitter-remove-listeners.js#block_06_block_06`
- `parallel/test-event-emitter-remove-listeners.js#block_07_block_07`
- `parallel/test-event-emitter-remove-listeners.js#block_08_block_08`
- `parallel/test-event-emitter-remove-listeners.js#block_09_block_09`
- `parallel/test-event-emitter-set-max-listeners-side-effects.js`
- `parallel/test-event-emitter-special-event-names.js`
- `parallel/test-event-emitter-subclass.js`
- `parallel/test-event-emitter-symbols.js`
- `parallel/test-event-target.js`
- `parallel/test-events-getmaxlisteners.js`
- `parallel/test-events-getmaxlisteners.js#block_00_block_00`
- `parallel/test-events-getmaxlisteners.js#block_01_block_01`
- `parallel/test-events-list.js`
- `parallel/test-events-listener-count-with-listener.js`
- `parallel/test-eventsource-disabled.js`
- `parallel/test-fetch-mock.js`
- `parallel/test-file-read-noexist.js`
- `parallel/test-file-validate-mode-flag.js`
- `parallel/test-file-write-stream.js`
- `parallel/test-file-write-stream2.js`
- `parallel/test-file-write-stream4.js`
- `parallel/test-file-write-stream5.js`
- `parallel/test-file.js#block_01_block_01`
- `parallel/test-file.js#block_03_block_03`
- `parallel/test-file.js#block_04_block_04`
- `parallel/test-file.js#block_06_block_06`
- `parallel/test-file.js#block_08_block_08`
- `parallel/test-file.js#block_09_block_09`
- `parallel/test-file.js#block_11_block_11`
- `parallel/test-file.js#block_13_block_13`
- `parallel/test-file.js#block_15_block_15`
- `parallel/test-filehandle-close.js`
- `parallel/test-finalization-registry-shutdown.js`
- `parallel/test-fs-append-file-flush.js`
- `parallel/test-fs-append-file-flush.js#test_00_synchronous_version`
- `parallel/test-fs-append-file-flush.js#test_01_callback_version`
- `parallel/test-fs-append-file-flush.js#test_02_promise_based_version`
- `parallel/test-fs-append-file-sync.js`
- `parallel/test-fs-append-file.js`
- `parallel/test-fs-append-file.js#block_00_test_that_empty_file_will_be_created_and_have_content_added_`
- `parallel/test-fs-append-file.js#block_01_test_that_empty_file_will_be_created_and_have_content_added_`
- `parallel/test-fs-append-file.js#block_02_test_that_appends_data_to_a_non_empty_file_callback_api`
- `parallel/test-fs-append-file.js#block_03_test_that_appends_data_to_a_non_empty_file_promise_api`
- `parallel/test-fs-append-file.js#block_04_test_that_appendfile_accepts_buffers_callback_api`
- `parallel/test-fs-append-file.js#block_05_test_that_appendfile_accepts_buffers_promises_api`
- `parallel/test-fs-append-file.js#block_06_test_that_appendfile_accepts_file_descriptors_callback_api`
- `parallel/test-fs-append-file.js#block_07_test_that_appendfile_accepts_file_descriptors_promises_api`
- `parallel/test-fs-assert-encoding-error.js`
- `parallel/test-fs-buffer.js`
- `parallel/test-fs-buffertype-writesync.js`
- `parallel/test-fs-chmod-mask.js`
- `parallel/test-fs-chmod.js`
- `parallel/test-fs-chown-type-check.js`
- `parallel/test-fs-close-errors.js`
- `parallel/test-fs-close.js`
- `parallel/test-fs-constants.js`
- `parallel/test-fs-empty-readStream.js`
- `parallel/test-fs-exists.js`
- `parallel/test-fs-existssync-false.js`
- `parallel/test-fs-fchmod.js`
- `parallel/test-fs-fchown.js`
- `parallel/test-fs-filehandle-use-after-close.js`
- `parallel/test-fs-fmap.js`
- `parallel/test-fs-fsync.js`
- `parallel/test-fs-lchown.js`
- `parallel/test-fs-link.js`
- `parallel/test-fs-make-callback.js`
- `parallel/test-fs-makeStatsCallback.js`
- `parallel/test-fs-mkdir-mode-mask.js`
- `parallel/test-fs-mkdir-rmdir.js`
- `parallel/test-fs-mkdir.js`
- `parallel/test-fs-mkdir.js#block_00_fs_mkdir_creates_directory_using_assigned_path`
- `parallel/test-fs-mkdir.js#block_01_fs_mkdir_creates_directory_with_assigned_mode_value`
- `parallel/test-fs-mkdir.js#block_02_fs_mkdir_creates_directory_with_mode_passed_as_an_options_ob`
- `parallel/test-fs-mkdir.js#block_03_fs_mkdirsync_creates_directory_with_mode_passed_as_an_option`
- `parallel/test-fs-mkdir.js#block_04_mkdirsync_successfully_creates_directory_from_given_path`
- `parallel/test-fs-mkdir.js#block_05_mkdirpsync_when_both_top_level_and_sub_folders_do_not_exist`
- `parallel/test-fs-mkdir.js#block_06_mkdirpsync_when_folder_already_exists`
- `parallel/test-fs-mkdir.js#block_07_mkdirpsync`
- `parallel/test-fs-mkdir.js#block_08_mkdirpsync_when_path_is_a_file`
- `parallel/test-fs-mkdir.js#block_09_mkdirpsync_when_part_of_the_path_is_a_file`
- `parallel/test-fs-mkdir.js#block_10_mkdirp_when_folder_does_not_yet_exist`
- `parallel/test-fs-mkdir.js#block_11_mkdirp_when_path_is_a_file`
- `parallel/test-fs-mkdir.js#block_12_mkdirp_when_part_of_the_path_is_a_file`
- `parallel/test-fs-mkdir.js#block_13_anything_else_generates_an_error`
- `parallel/test-fs-mkdir.js#block_14_mkdirp_returns_first_folder_created_when_all_folders_are_new`
- `parallel/test-fs-mkdir.js#block_15_mkdirp_returns_first_folder_created_when_last_folder_is_new`
- `parallel/test-fs-mkdir.js#block_16_mkdirp_returns_undefined_when_no_new_folders_are_created`
- `parallel/test-fs-mkdir.js#block_17_mkdirp_sync_returns_first_folder_created_when_all_folders_ar`
- `parallel/test-fs-mkdir.js#block_18_mkdirp_sync_returns_first_folder_created_when_last_folder_is`
- `parallel/test-fs-mkdir.js#block_19_mkdirp_sync_returns_undefined_when_no_new_folders_are_create`
- `parallel/test-fs-mkdir.js#block_20_mkdirp_promises_returns_first_folder_created_when_all_folder`
- `parallel/test-fs-mkdtemp-prefix-check.js`
- `parallel/test-fs-mkdtemp.js`
- `parallel/test-fs-mkdtemp.js#block_00_test_with_plain_string`
- `parallel/test-fs-mkdtemp.js#block_01_test_with_url_object`
- `parallel/test-fs-mkdtemp.js#block_02_test_with_buffer`
- `parallel/test-fs-mkdtemp.js#block_03_test_with_uint8array`
- `parallel/test-fs-non-number-arguments-throw.js`
- `parallel/test-fs-null-bytes.js`
- `parallel/test-fs-open-mode-mask.js`
- `parallel/test-fs-open-numeric-flags.js`
- `parallel/test-fs-open.js`
- `parallel/test-fs-opendir.js`
- `parallel/test-fs-opendir.js#block_00_check_the_opendir_sync_version`
- `parallel/test-fs-opendir.js#block_01_check_that_passing_a_positive_integer_as_buffersize_works`
- `parallel/test-fs-opendir.js#block_02_check_read_throw_exceptions_on_invalid_callback`
- `parallel/test-fs-opendir.js#block_03_check_if_directory_already_closed_the_callback_should_pass_a`
- `parallel/test-fs-opendir.js#block_04_check_if_directory_already_closed_throw_an_promise_exception`
- `parallel/test-fs-operations-with-surrogate-pairs.js`
- `parallel/test-fs-options-immutable.js`
- `parallel/test-fs-options-immutable.js#block_00_block_00`
- `parallel/test-fs-options-immutable.js#block_01_block_01`
- `parallel/test-fs-options-immutable.js#block_02_block_02`
- `parallel/test-fs-options-immutable.js#block_03_block_03`
- `parallel/test-fs-options-immutable.js#block_04_block_04`
- `parallel/test-fs-options-immutable.js#block_05_block_05`
- `parallel/test-fs-promises-exists.js`
- `parallel/test-fs-promises-file-handle-append-file.js`
- `parallel/test-fs-promises-file-handle-chmod.js`
- `parallel/test-fs-promises-file-handle-close.js`
- `parallel/test-fs-promises-file-handle-dispose.js`
- `parallel/test-fs-promises-file-handle-read-worker.js`
- `parallel/test-fs-promises-file-handle-read.js`
- `parallel/test-fs-promises-file-handle-readFile.js`
- `parallel/test-fs-promises-file-handle-stat.js`
- `parallel/test-fs-promises-file-handle-stream.js`
- `parallel/test-fs-promises-file-handle-sync.js`
- `parallel/test-fs-promises-file-handle-truncate.js`
- `parallel/test-fs-promises-file-handle-write.js`
- `parallel/test-fs-promises-file-handle-writeFile.js`
- `parallel/test-fs-promises-readfile-empty.js`
- `parallel/test-fs-promises-readfile-with-fd.js`
- `parallel/test-fs-promises-watch.js`
- `parallel/test-fs-promises-write-optional-params.js`
- `parallel/test-fs-promises-writefile-typedarray.js`
- `parallel/test-fs-promises-writefile-with-fd.js`
- `parallel/test-fs-promises.js`
- `parallel/test-fs-promises.js#block_00_block_00`
- `parallel/test-fs-promises.js#block_01_block_01`
- `parallel/test-fs-promisified.js`
- `parallel/test-fs-promisified.js#block_00_block_00`
- `parallel/test-fs-promisified.js#block_01_block_01`
- `parallel/test-fs-promisified.js#block_02_block_02`
- `parallel/test-fs-read-empty-buffer.js`
- `parallel/test-fs-read-file-assert-encoding.js`
- `parallel/test-fs-read-file-sync.js`
- `parallel/test-fs-read-offset-null.js`
- `parallel/test-fs-read-optional-params.js`
- `parallel/test-fs-read-promises-optional-params.js`
- `parallel/test-fs-read-stream-autoClose.js`
- `parallel/test-fs-read-stream-concurrent-reads.js`
- `parallel/test-fs-read-stream-double-close.js`
- `parallel/test-fs-read-stream-double-close.js#block_00_block_00`
- `parallel/test-fs-read-stream-double-close.js#block_01_block_01`
- `parallel/test-fs-read-stream-encoding.js`
- `parallel/test-fs-read-stream-err.js`
- `parallel/test-fs-read-stream-fd-leak.js`
- `parallel/test-fs-read-stream-fd.js`
- `parallel/test-fs-read-stream-file-handle.js`
- `parallel/test-fs-read-stream-inherit.js`
- `parallel/test-fs-read-stream-inherit.js#block_00_block_00`
- `parallel/test-fs-read-stream-inherit.js#block_01_block_01`
- `parallel/test-fs-read-stream-inherit.js#block_02_block_02`
- `parallel/test-fs-read-stream-inherit.js#block_03_block_03`
- `parallel/test-fs-read-stream-inherit.js#block_04_https_github_com_joyent_node_issues_2320`
- `parallel/test-fs-read-stream-inherit.js#block_05_block_05`
- `parallel/test-fs-read-stream-inherit.js#block_06_block_06`
- `parallel/test-fs-read-stream-inherit.js#block_07_pause_and_then_resume_immediately`
- `parallel/test-fs-read-stream-inherit.js#block_08_block_08`
- `parallel/test-fs-read-stream-inherit.js#block_09_just_to_make_sure_autoclose_won_t_close_the_stream_because_o`
- `parallel/test-fs-read-stream-inherit.js#block_10_make_sure_stream_is_destroyed_when_file_does_not_exist`
- `parallel/test-fs-read-stream-resume.js`
- `parallel/test-fs-read-stream-throw-type-error.js`
- `parallel/test-fs-read-stream.js`
- `parallel/test-fs-read-stream.js#block_00_block_00`
- `parallel/test-fs-read-stream.js#block_01_block_01`
- `parallel/test-fs-read-stream.js#block_02_block_02`
- `parallel/test-fs-read-stream.js#block_03_block_03`
- `parallel/test-fs-read-stream.js#block_04_block_04`
- `parallel/test-fs-read-stream.js#block_05_block_05`
- `parallel/test-fs-read-stream.js#block_06_block_06`
- `parallel/test-fs-read-stream.js#block_07_block_07`
- `parallel/test-fs-read-stream.js#block_08_block_08`
- `parallel/test-fs-read-stream.js#block_09_block_09`
- `parallel/test-fs-read-type.js`
- `parallel/test-fs-read-zero-length.js`
- `parallel/test-fs-read.js`
- `parallel/test-fs-readSync-optional-params.js`
- `parallel/test-fs-readdir-stack-overflow.js`
- `parallel/test-fs-readdir.js`
- `parallel/test-fs-readfile-empty.js`
- `parallel/test-fs-readfile-eof.js`
- `parallel/test-fs-readfile-error.js`
- `parallel/test-fs-readfile-fd.js`
- `parallel/test-fs-readfile-flags.js`
- `parallel/test-fs-readfile-flags.js#block_00_block_00`
- `parallel/test-fs-readfile-flags.js#block_01_block_01`
- `parallel/test-fs-readfile-flags.js#block_02_block_02`
- `parallel/test-fs-readfile-pipe-large.js`
- `parallel/test-fs-readfile-unlink.js`
- `parallel/test-fs-readfile-zero-byte-liar.js`
- `parallel/test-fs-readlink-type-check.js`
- `parallel/test-fs-readv-promises.js`
- `parallel/test-fs-readv-promisify.js`
- `parallel/test-fs-readv-sync.js`
- `parallel/test-fs-readv-sync.js#block_00_fs_readvsync_with_array_of_buffers_with_all_parameters`
- `parallel/test-fs-readv-sync.js#block_01_fs_readvsync_with_array_of_buffers_without_position`
- `parallel/test-fs-readv-sync.js#block_02_block_02`
- `parallel/test-fs-readv-sync.js#block_03_block_03`
- `parallel/test-fs-readv.js`
- `parallel/test-fs-readv.js#block_00_fs_readv_with_array_of_buffers_with_all_parameters`
- `parallel/test-fs-readv.js#block_01_fs_readv_with_array_of_buffers_without_position`
- `parallel/test-fs-readv.js#block_02_block_02`
- `parallel/test-fs-readv.js#block_03_block_03`
- `parallel/test-fs-ready-event-stream.js`
- `parallel/test-fs-rename-type-check.js`
- `parallel/test-fs-rmdir-recursive-sync-warns-not-found.js`
- `parallel/test-fs-rmdir-recursive-sync-warns-on-file.js`
- `parallel/test-fs-rmdir-recursive-throws-not-found.js`
- `parallel/test-fs-rmdir-recursive-throws-not-found.js#block_00_block_00`
- `parallel/test-fs-rmdir-recursive-throws-not-found.js#block_01_block_01`
- `parallel/test-fs-rmdir-recursive-throws-not-found.js#block_02_block_02`
- `parallel/test-fs-rmdir-recursive-throws-on-file.js`
- `parallel/test-fs-rmdir-recursive-throws-on-file.js#block_00_block_00`
- `parallel/test-fs-rmdir-recursive-throws-on-file.js#block_01_block_01`
- `parallel/test-fs-rmdir-recursive-throws-on-file.js#block_02_block_02`
- `parallel/test-fs-rmdir-recursive-warns-not-found.js`
- `parallel/test-fs-rmdir-recursive-warns-on-file.js`
- `parallel/test-fs-rmdir-type-check.js`
- `parallel/test-fs-stat.js`
- `parallel/test-fs-stat.js#block_00_block_00`
- `parallel/test-fs-stat.js#block_01_block_01`
- `parallel/test-fs-stat.js#block_02_block_02`
- `parallel/test-fs-stream-construct-compat-error-write.js`
- `parallel/test-fs-stream-construct-compat-graceful-fs.js`
- `parallel/test-fs-stream-construct-compat-graceful-fs.js#block_00_block_00`
- `parallel/test-fs-stream-construct-compat-graceful-fs.js#block_01_block_01`
- `parallel/test-fs-stream-construct-compat-old-node.js`
- `parallel/test-fs-stream-construct-compat-old-node.js#block_00_block_00`
- `parallel/test-fs-stream-construct-compat-old-node.js#block_01_block_01`
- `parallel/test-fs-stream-destroy-emit-error.js`
- `parallel/test-fs-stream-destroy-emit-error.js#block_00_block_00`
- `parallel/test-fs-stream-destroy-emit-error.js#block_01_block_01`
- `parallel/test-fs-stream-destroy-emit-error.js#block_02_block_02`
- `parallel/test-fs-stream-destroy-emit-error.js#block_03_block_03`
- `parallel/test-fs-stream-double-close.js`
- `parallel/test-fs-symlink-dir-junction-relative.js`
- `parallel/test-fs-symlink-dir-junction.js`
- `parallel/test-fs-symlink-longpath.js`
- `parallel/test-fs-truncate-clear-file-zero.js`
- `parallel/test-fs-truncate-clear-file-zero.js#block_00_synchronous_test`
- `parallel/test-fs-truncate-clear-file-zero.js#block_01_asynchronous_test`
- `parallel/test-fs-truncate-fd.js`
- `parallel/test-fs-truncate-sync.js`
- `parallel/test-fs-unlink-type-check.js`
- `parallel/test-fs-watch-ref-unref.js`
- `parallel/test-fs-watch.js`
- `parallel/test-fs-watchfile-ref-unref.js`
- `parallel/test-fs-write-buffer.js`
- `parallel/test-fs-write-buffer.js#block_00_fs_write_with_all_parameters_provided`
- `parallel/test-fs-write-buffer.js#block_01_fs_write_with_a_buffer_without_the_length_parameter`
- `parallel/test-fs-write-buffer.js#block_02_fs_write_with_a_buffer_without_the_offset_and_length_paramet`
- `parallel/test-fs-write-buffer.js#block_03_fs_write_with_the_offset_passed_as_undefined_followed_by_the`
- `parallel/test-fs-write-buffer.js#block_04_fs_write_with_offset_and_length_passed_as_undefined_followed`
- `parallel/test-fs-write-buffer.js#block_05_fs_write_with_a_uint8array_without_the_offset_and_length_par`
- `parallel/test-fs-write-buffer.js#block_06_fs_write_with_invalid_offset_type`
- `parallel/test-fs-write-buffer.js#block_07_fs_write_with_a_dataview_without_the_offset_and_length_param`
- `parallel/test-fs-write-file-buffer.js`
- `parallel/test-fs-write-file-flush.js`
- `parallel/test-fs-write-file-flush.js#test_00_synchronous_version`
- `parallel/test-fs-write-file-flush.js#test_01_callback_version`
- `parallel/test-fs-write-file-flush.js#test_02_promise_based_version`
- `parallel/test-fs-write-file-typedarrays.js`
- `parallel/test-fs-write-file.js`
- `parallel/test-fs-write-file.js#block_00_block_00`
- `parallel/test-fs-write-file.js#block_01_block_01`
- `parallel/test-fs-write-file.js#block_02_block_02`
- `parallel/test-fs-write-negativeoffset.js`
- `parallel/test-fs-write-reuse-callback.js`
- `parallel/test-fs-write-stream-autoclose-option.js`
- `parallel/test-fs-write-stream-change-open.js`
- `parallel/test-fs-write-stream-close-without-callback.js`
- `parallel/test-fs-write-stream-double-close.js`
- `parallel/test-fs-write-stream-double-close.js#block_00_block_00`
- `parallel/test-fs-write-stream-double-close.js#block_01_block_01`
- `parallel/test-fs-write-stream-double-close.js#block_02_block_02`
- `parallel/test-fs-write-stream-encoding.js`
- `parallel/test-fs-write-stream-end.js`
- `parallel/test-fs-write-stream-end.js#block_00_block_00`
- `parallel/test-fs-write-stream-end.js#block_01_block_01`
- `parallel/test-fs-write-stream-end.js#block_02_block_02`
- `parallel/test-fs-write-stream-err.js`
- `parallel/test-fs-write-stream-file-handle-2.js`
- `parallel/test-fs-write-stream-file-handle.js`
- `parallel/test-fs-write-stream-flush.js`
- `parallel/test-fs-write-stream-flush.js#test_00_validation`
- `parallel/test-fs-write-stream-flush.js#test_01_performs_flush`
- `parallel/test-fs-write-stream-flush.js#test_02_does_not_perform_flush`
- `parallel/test-fs-write-stream-flush.js#test_03_works_with_file_handles`
- `parallel/test-fs-write-stream-fs.js`
- `parallel/test-fs-write-stream-fs.js#block_00_block_00`
- `parallel/test-fs-write-stream-fs.js#block_01_block_01`
- `parallel/test-fs-write-stream-throw-type-error.js`
- `parallel/test-fs-write-stream.js`
- `parallel/test-fs-write-stream.js#block_00_block_00`
- `parallel/test-fs-write-stream.js#block_01_block_01`
- `parallel/test-fs-write-stream.js#block_02_throws_if_data_is_not_of_type_buffer`
- `parallel/test-fs-write-sync.js`
- `parallel/test-fs-writestream-open-write.js`
- `parallel/test-fs-writev-promises.js`
- `parallel/test-fs-writev-sync.js`
- `parallel/test-fs-writev-sync.js#block_00_fs_writevsync_with_array_of_buffers_with_all_parameters`
- `parallel/test-fs-writev-sync.js#block_01_fs_writevsync_with_array_of_buffers_without_position`
- `parallel/test-fs-writev-sync.js#block_02_fs_writevsync_with_empty_array_of_buffers`
- `parallel/test-fs-writev-sync.js#block_03_block_03`
- `parallel/test-fs-writev.js`
- `parallel/test-fs-writev.js#block_00_fs_writev_with_array_of_buffers_with_all_parameters`
- `parallel/test-fs-writev.js#block_01_fs_writev_with_array_of_buffers_without_position`
- `parallel/test-fs-writev.js#block_02_fs_writev_with_empty_array_of_buffers`
- `parallel/test-fs-writev.js#block_03_block_03`
- `parallel/test-global-domexception.js`
- `parallel/test-global-encoder.js`
- `parallel/test-http-addrequest-localaddress.js`
- `parallel/test-http-agent-false.js`
- `parallel/test-http-agent-getname.js`
- `parallel/test-http-agent-timeout-option.js`
- `parallel/test-http-client-abort3.js`
- `parallel/test-http-client-abort3.js#block_00_block_00`
- `parallel/test-http-client-abort3.js#block_01_block_01`
- `parallel/test-http-client-defaults.js`
- `parallel/test-http-client-defaults.js#block_00_block_00`
- `parallel/test-http-client-defaults.js#block_01_block_01`
- `parallel/test-http-client-defaults.js#block_02_block_02`
- `parallel/test-http-client-headers-host-array.js`
- `parallel/test-http-client-insecure-http-parser-error.js`
- `parallel/test-http-client-invalid-path.js`
- `parallel/test-http-client-read-in-error.js`
- `parallel/test-http-client-readable.js`
- `parallel/test-http-client-timeout-option-with-agent.js`
- `parallel/test-http-client-unescaped-path.js`
- `parallel/test-http-common.js`
- `parallel/test-http-dns-error.js`
- `parallel/test-http-header-validators.js`
- `parallel/test-http-hostname-typechecking.js`
- `parallel/test-http-incoming-matchKnownFields.js`
- `parallel/test-http-incoming-message-connection-setter.js`
- `parallel/test-http-incoming-message-destroy.js`
- `parallel/test-http-insecure-parser-per-stream.js#block_00_test_1_the_server_sends_an_invalid_header`
- `parallel/test-http-insecure-parser-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-http-insecure-parser-per-stream.js#block_04_test_5_invalid_argument_type`
- `parallel/test-http-invalid-path-chars.js`
- `parallel/test-http-invalid-urls.js`
- `parallel/test-http-invalidheaderfield2.js`
- `parallel/test-http-max-header-size-per-stream.js#block_00_test_1_the_server_sends_larger_headers_than_what_would_other`
- `parallel/test-http-max-header-size-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-http-methods.js`
- `parallel/test-http-outgoing-destroy.js`
- `parallel/test-http-outgoing-internal-headernames-getter.js`
- `parallel/test-http-outgoing-internal-headernames-getter.js#block_00_block_00`
- `parallel/test-http-outgoing-internal-headernames-getter.js#block_01_block_01`
- `parallel/test-http-outgoing-internal-headernames-setter.js`
- `parallel/test-http-outgoing-message-inheritance.js`
- `parallel/test-http-outgoing-message-write-callback.js`
- `parallel/test-http-outgoing-properties.js#block_00_block_00`
- `parallel/test-http-outgoing-properties.js#block_01_block_01`
- `parallel/test-http-outgoing-properties.js#block_03_block_03`
- `parallel/test-http-outgoing-proto.js`
- `parallel/test-http-outgoing-proto.js#block_00_write`
- `parallel/test-http-outgoing-proto.js#block_01_block_01`
- `parallel/test-http-outgoing-settimeout.js`
- `parallel/test-http-outgoing-settimeout.js#block_00_block_00`
- `parallel/test-http-outgoing-settimeout.js#block_01_block_01`
- `parallel/test-http-parser-bad-ref.js`
- `parallel/test-http-parser.js`
- `parallel/test-http-parser.js#block_00_block_00`
- `parallel/test-http-parser.js#block_01_block_01`
- `parallel/test-http-parser.js#block_02_block_02`
- `parallel/test-http-parser.js#block_03_block_03`
- `parallel/test-http-parser.js#block_04_block_04`
- `parallel/test-http-parser.js#block_05_block_05`
- `parallel/test-http-parser.js#block_06_block_06`
- `parallel/test-http-parser.js#block_07_block_07`
- `parallel/test-http-parser.js#block_08_block_08`
- `parallel/test-http-parser.js#block_09_block_09`
- `parallel/test-http-parser.js#block_10_block_10`
- `parallel/test-http-parser.js#block_11_block_11`
- `parallel/test-http-request-invalid-method-error.js`
- `parallel/test-http-server-response-standalone.js`
- `parallel/test-http-server-timeouts-validation.js`
- `parallel/test-http-server-timeouts-validation.js#block_00_block_00`
- `parallel/test-http-server-timeouts-validation.js#block_01_block_01`
- `parallel/test-http-server-timeouts-validation.js#block_02_block_02`
- `parallel/test-http-server-timeouts-validation.js#block_03_block_03`
- `parallel/test-http-server-timeouts-validation.js#block_04_block_04`
- `parallel/test-http-server-timeouts-validation.js#block_05_block_05`
- `parallel/test-http-server-timeouts-validation.js#block_06_block_06`
- `parallel/test-http-url.parse-only-support-http-https-protocol.js`
- `parallel/test-http2-client-upload-reject.js`
- `parallel/test-http2-client-upload.js`
- `parallel/test-http2-request-response-proto.js`
- `parallel/test-https-insecure-parse-per-stream.js#block_00_test_1_the_server_sends_an_invalid_header`
- `parallel/test-https-insecure-parse-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-https-insecure-parse-per-stream.js#block_04_test_5_invalid_argument_type`
- `parallel/test-https-max-header-size-per-stream.js#block_00_test_1_the_server_sends_larger_headers_than_what_would_other`
- `parallel/test-https-max-header-size-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-instanceof.js`
- `parallel/test-memory-usage.js`
- `parallel/test-messagechannel.js`
- `parallel/test-microtask-queue-integration.js`
- `parallel/test-module-builtin.js`
- `parallel/test-module-cache.js`
- `parallel/test-module-children.js`
- `parallel/test-module-circular-dependency-warning.js`
- `parallel/test-module-circular-symlinks.js`
- `parallel/test-module-create-require-multibyte.js`
- `parallel/test-module-create-require-multibyte.js#block_00_block_00`
- `parallel/test-module-create-require-multibyte.js#block_01_block_01`
- `parallel/test-module-create-require.js`
- `parallel/test-module-globalpaths-nodepath.js`
- `parallel/test-module-isBuiltin.js`
- `parallel/test-module-loading-deprecated.js`
- `parallel/test-module-loading-error.js`
- `parallel/test-module-main-extension-lookup.js`
- `parallel/test-module-main-fail.js`
- `parallel/test-module-main-preserve-symlinks-fail.js`
- `parallel/test-module-multi-extensions.js`
- `parallel/test-module-multi-extensions.js#block_00_block_00`
- `parallel/test-module-multi-extensions.js#block_01_block_01`
- `parallel/test-module-multi-extensions.js#block_02_block_02`
- `parallel/test-module-multi-extensions.js#block_03_block_03`
- `parallel/test-module-multi-extensions.js#block_04_block_04`
- `parallel/test-module-multi-extensions.js#block_05_block_05`
- `parallel/test-module-multi-extensions.js#block_06_block_06`
- `parallel/test-module-nodemodulepaths.js`
- `parallel/test-module-parent-deprecation.js`
- `parallel/test-module-parent-setter-deprecation.js`
- `parallel/test-module-prototype-mutation.js`
- `parallel/test-module-relative-lookup.js`
- `parallel/test-module-run-main-monkey-patch.js`
- `parallel/test-module-setsourcemapssupport.js`
- `parallel/test-module-setsourcemapssupport.js#block_00_block_00`
- `parallel/test-module-setsourcemapssupport.js#block_01_block_01`
- `parallel/test-module-stat.js`
- `parallel/test-module-symlinked-peer-modules.js`
- `parallel/test-module-version.js`
- `parallel/test-module-wrap.js`
- `parallel/test-net-access-byteswritten.js`
- `parallel/test-net-autoselectfamily-attempt-timeout-cli-option.js`
- `parallel/test-net-autoselectfamily-attempt-timeout-default-value.js`
- `parallel/test-net-autoselectfamily-ipv4first.js`
- `parallel/test-net-autoselectfamily.js#block_02_test_that_when_all_errors_are_returned_when_no_connections_s`
- `parallel/test-net-better-error-messages-listen-path.js`
- `parallel/test-net-better-error-messages-listen.js`
- `parallel/test-net-better-error-messages-path.js`
- `parallel/test-net-better-error-messages-path.js#block_00_block_00`
- `parallel/test-net-better-error-messages-path.js#block_01_block_01`
- `parallel/test-net-better-error-messages-port-hostname.js`
- `parallel/test-net-blocklist.js`
- `parallel/test-net-blocklist.js#block_00_connect_without_calling_dns_lookup`
- `parallel/test-net-blocklist.js#block_01_connect_with_single_ip_returned_by_dns_lookup`
- `parallel/test-net-blocklist.js#block_02_connect_with_autoselectfamily_and_single_ip`
- `parallel/test-net-blocklist.js#block_03_connect_with_autoselectfamily_and_multiple_ips`
- `parallel/test-net-connect-after-destroy.js`
- `parallel/test-net-connect-destroy.js`
- `parallel/test-net-connect-immediate-finish.js`
- `parallel/test-net-connect-no-arg.js`
- `parallel/test-net-connect-options-invalid.js`
- `parallel/test-net-deprecated-setsimultaneousaccepts.js`
- `parallel/test-net-end-without-connect.js`
- `parallel/test-net-isip.js`
- `parallel/test-net-isipv4.js`
- `parallel/test-net-isipv6.js`
- `parallel/test-net-listen-error.js`
- `parallel/test-net-options-lookup.js`
- `parallel/test-net-pipe-connect-errors.js`
- `parallel/test-net-server-options.js`
- `parallel/test-net-server-simultaneous-accepts-produce-warning-once.js`
- `parallel/test-net-socket-connect-invalid-autoselectfamily.js`
- `parallel/test-net-socket-connect-invalid-autoselectfamilyattempttimeout.js`
- `parallel/test-net-socket-no-halfopen-enforcer.js`
- `parallel/test-net-timeout-no-handle.js`
- `parallel/test-net-write-arguments.js`
- `parallel/test-next-tick-doesnt-hang.js`
- `parallel/test-next-tick-domain.js`
- `parallel/test-next-tick-fixed-queue-regression.js`
- `parallel/test-next-tick-intentional-starvation.js`
- `parallel/test-next-tick-ordering2.js`
- `parallel/test-next-tick-when-exiting.js`
- `parallel/test-next-tick.js`
- `parallel/test-no-node-snapshot.js`
- `parallel/test-npm-install.js`
- `parallel/test-os-eol.js`
- `parallel/test-os-homedir-no-envvar.js`
- `parallel/test-os-process-priority.js`
- `parallel/test-os-userinfo-handles-getter-errors.js`
- `parallel/test-os.js`
- `parallel/test-outgoing-message-destroy.js`
- `parallel/test-path-basename.js`
- `parallel/test-path-dirname.js`
- `parallel/test-path-extname.js`
- `parallel/test-path-glob.js`
- `parallel/test-path-isabsolute.js`
- `parallel/test-path-join.js`
- `parallel/test-path-makelong.js`
- `parallel/test-path-normalize.js`
- `parallel/test-path-parse-format.js`
- `parallel/test-path-posix-exists.js`
- `parallel/test-path-posix-relative-on-windows.js`
- `parallel/test-path-relative.js`
- `parallel/test-path-resolve.js`
- `parallel/test-path-win32-exists.js`
- `parallel/test-path-zero-length-strings.js`
- `parallel/test-path.js`
- `parallel/test-perf-gc-crash.js`
- `parallel/test-performance-gc.js#block_01_gc_should_not_keep_the_event_loop_alive`
- `parallel/test-performanceobserver-gc.js`
- `parallel/test-permission-allow-worker-cli.js#block_01_to_spawn_unless_allow_worker_is_sent`
- `parallel/test-permission-fs-read.js#block_00_block_00`
- `parallel/test-permission-fs-read.js#block_02_block_02`
- `parallel/test-permission-fs-require.js#block_00_block_00`
- `parallel/test-permission-fs-require.js#block_02_block_02`
- `parallel/test-pipe-return-val.js`
- `parallel/test-process-abort.js`
- `parallel/test-process-available-memory.js`
- `parallel/test-process-chdir-errormessage.js`
- `parallel/test-process-constrained-memory.js`
- `parallel/test-process-cpuUsage.js`
- `parallel/test-process-default.js`
- `parallel/test-process-dlopen-undefined-exports.js`
- `parallel/test-process-domain-segfault.js`
- `parallel/test-process-emit.js`
- `parallel/test-process-emitwarning.js`
- `parallel/test-process-env-allowed-flags.js#block_01_assert_all_canonical_flags_begin_with_dash_es`
- `parallel/test-process-env-delete.js`
- `parallel/test-process-env-deprecation.js`
- `parallel/test-process-env-ignore-getter-setter.js`
- `parallel/test-process-env-symbols.js`
- `parallel/test-process-env-windows-error-reset.js`
- `parallel/test-process-env-windows-error-reset.js#block_00_block_00`
- `parallel/test-process-env-windows-error-reset.js#block_01_block_01`
- `parallel/test-process-env.js#block_01_block_01`
- `parallel/test-process-env.js#block_02_https_github_com_nodejs_node_issues_45380`
- `parallel/test-process-env.js#block_03_https_github_com_nodejs_node_issues_32920`
- `parallel/test-process-exception-capture-errors.js`
- `parallel/test-process-exit-handler.js`
- `parallel/test-process-exit-recursive.js`
- `parallel/test-process-exit.js`
- `parallel/test-process-features.js`
- `parallel/test-process-getgroups.js`
- `parallel/test-process-hrtime-bigint.js`
- `parallel/test-process-hrtime.js`
- `parallel/test-process-initgroups.js`
- `parallel/test-process-kill-pid.js`
- `parallel/test-process-next-tick.js`
- `parallel/test-process-no-deprecation.js`
- `parallel/test-process-release.js`
- `parallel/test-process-setgroups.js`
- `parallel/test-process-setsourcemapsenabled.js`
- `parallel/test-process-umask-mask.js`
- `parallel/test-process-umask.js`
- `parallel/test-process-uptime.js`
- `parallel/test-promise-unhandled-issue-43655.js`
- `parallel/test-querystring-escape.js`
- `parallel/test-querystring-maxKeys-non-finite.js`
- `parallel/test-querystring-multichar-separator.js`
- `parallel/test-querystring.js`
- `parallel/test-querystring.js#block_00_test_the_nested_qs_in_qs_case`
- `parallel/test-querystring.js#block_01_nested_in_colon`
- `parallel/test-querystring.js#block_02_nested`
- `parallel/test-querystring.js#block_03_nested_in_colon`
- `parallel/test-querystring.js#block_04_test_removing_limit`
- `parallel/test-querystring.js#block_05_block_05`
- `parallel/test-querystring.js#block_06_test_custom_decode`
- `parallel/test-querystring.js#block_07_test_querystring_unescape`
- `parallel/test-querystring.js#block_08_test_custom_encode`
- `parallel/test-querystring.js#block_09_test_custom_encode_for_different_types`
- `parallel/test-querystring.js#block_10_test_overriding_unescape`
- `parallel/test-readable-from-web-enqueue-then-close.js`
- `parallel/test-readable-from.js`
- `parallel/test-readable-large-hwm.js`
- `parallel/test-readable-single-end.js`
- `parallel/test-ref-unref-return.js`
- `parallel/test-regression-object-prototype.js`
- `parallel/test-require-cache.js#block_00_block_00`
- `parallel/test-require-empty-main.js`
- `parallel/test-require-enoent-dir.js`
- `parallel/test-require-invalid-main-no-exports.js`
- `parallel/test-require-invalid-package.js`
- `parallel/test-require-nul.js`
- `parallel/test-require-process.js`
- `parallel/test-runner-aliases.js`
- `parallel/test-runner-assert.js`
- `parallel/test-runner-assert.js#test_00_expected_methods_are_on_t_assert`
- `parallel/test-runner-assert.js#test_01_t_assert_ok_correctly_parses_the_stacktrace`
- `parallel/test-runner-coverage.js`
- `parallel/test-runner-coverage.js#test_00_test_coverage_report`
- `parallel/test-runner-coverage.js#test_01_test_tap_coverage_reporter`
- `parallel/test-runner-coverage.js#test_02_test_spec_coverage_reporter`
- `parallel/test-runner-coverage.js#test_03_single_process_coverage_is_the_same_with_test`
- `parallel/test-runner-coverage.js#test_04_coverage_is_combined_for_multiple_processes`
- `parallel/test-runner-coverage.js#test_05_coverage_reports_on_lines_functions_and_branches`
- `parallel/test-runner-coverage.js#test_06_coverage_with_esm_hook_source_irrelevant`
- `parallel/test-runner-coverage.js#test_07_coverage_with_esm_hook_source_transpiled`
- `parallel/test-runner-coverage.js#test_08_coverage_with_excluded_files`
- `parallel/test-runner-coverage.js#test_09_coverage_with_included_files`
- `parallel/test-runner-coverage.js#test_10_coverage_with_included_and_excluded_files`
- `parallel/test-runner-coverage.js#test_11_correctly_prints_the_coverage_report_of_files_contained_in_p`
- `parallel/test-runner-custom-assertions.js#test_00_throws_if_name_is_not_a_string`
- `parallel/test-runner-custom-assertions.js#test_01_throws_if_fn_is_not_a_function`
- `parallel/test-runner-custom-assertions.js#test_03_can_override_existing_assertions`
- `parallel/test-runner-custom-assertions.js#test_04_this_is_set_to_the_testcontext`
- `parallel/test-runner-enable-source-maps-issue.js`
- `parallel/test-runner-filter-warning.js`
- `parallel/test-runner-mocking.js#test_00_spies_on_a_function`
- `parallel/test-runner-mocking.js#test_01_spies_on_a_bound_function`
- `parallel/test-runner-mocking.js#test_02_spies_on_a_constructor`
- `parallel/test-runner-mocking.js#test_03_a_no_op_spy_function_is_created_by_default`
- `parallel/test-runner-mocking.js#test_04_internal_no_op_function_can_be_reused`
- `parallel/test-runner-mocking.js#test_05_functions_can_be_mocked_multiple_times_at_once`
- `parallel/test-runner-mocking.js#test_06_internal_no_op_function_can_be_reused_as_methods`
- `parallel/test-runner-mocking.js#test_07_methods_can_be_mocked_multiple_times_but_not_at_the_same_tim`
- `parallel/test-runner-mocking.js#test_08_spies_on_an_object_method`
- `parallel/test-runner-mocking.js#test_09_spies_on_a_getter`
- `parallel/test-runner-mocking.js#test_10_spies_on_a_setter`
- `parallel/test-runner-mocking.js#test_11_spy_functions_can_be_bound`
- `parallel/test-runner-mocking.js#test_12_mocks_prototype_methods_on_an_instance`
- `parallel/test-runner-mocking.js#test_13_spies_on_async_static_class_methods`
- `parallel/test-runner-mocking.js#test_16_spy_functions_can_be_used_on_classes_inheritance`
- `parallel/test-runner-mocking.js#test_18_mocked_functions_report_thrown_errors`
- `parallel/test-runner-mocking.js#test_19_mocked_constructors_report_thrown_errors`
- `parallel/test-runner-mocking.js#test_20_mocks_a_function`
- `parallel/test-runner-mocking.js#test_22_mocks_an_object_method`
- `parallel/test-runner-mocking.js#test_23_mocks_a_getter`
- `parallel/test-runner-mocking.js#test_24_mocks_a_setter`
- `parallel/test-runner-mocking.js#test_25_mocks_a_getter_with_syntax_sugar`
- `parallel/test-runner-mocking.js#test_26_mocks_a_setter_with_syntax_sugar`
- `parallel/test-runner-mocking.js#test_30_mocks_can_be_auto_restored`
- `parallel/test-runner-mocking.js#test_31_mock_implementation_can_be_changed_dynamically`
- `parallel/test-runner-mocking.js#test_32_local_mocks_are_auto_restored_after_the_test_finishes`
- `parallel/test-runner-mocking.js#test_33_reset_mock_calls`
- `parallel/test-runner-mocking.js#test_35_the_getter_and_setter_options_cannot_be_used_together`
- `parallel/test-runner-mocking.js#test_37_the_times_option_must_be_an_integer_1`
- `parallel/test-runner-mocking.js#test_38_spies_on_a_class_prototype_method`
- `parallel/test-runner-mocking.js#test_39_getter_fails_if_getter_options_set_to_false`
- `parallel/test-runner-mocking.js#test_40_setter_fails_if_setter_options_set_to_false`
- `parallel/test-runner-mocking.js#test_41_getter_fails_if_setter_options_is_true`
- `parallel/test-runner-mocking.js#test_42_setter_fails_if_getter_options_is_true`
- `parallel/test-runner-option-validation.js`
- `parallel/test-runner-source-maps-invalid-json.js`
- `parallel/test-runner-subtest-after-hook.js`
- `parallel/test-runner-test-filepath.js#test_00_suite`
- `parallel/test-runner-test-filepath.js#test_01_test_01`
- `parallel/test-runner-test-fullname.js`
- `parallel/test-runner-test-fullname.js#test_00_suite`
- `parallel/test-runner-test-fullname.js#test_01_test_01`
- `parallel/test-runner-typechecking.js`
- `parallel/test-runner-wait-for.js#test_00_input_validation`
- `parallel/test-runner-wait-for.js#test_01_returns_the_result_of_the_condition_function`
- `parallel/test-runner-wait-for.js#test_02_returns_the_result_of_an_async_condition_function`
- `parallel/test-runner-wait-for.js#test_03_errors_if_the_condition_times_out`
- `parallel/test-runner-wait-for.js#test_04_polls_until_the_condition_returns_successfully`
- `parallel/test-runner-wait-for.js#test_06_limits_polling_if_condition_takes_longer_than_interval`
- `parallel/test-set-incoming-message-header.js#block_00_headers_setter_function_set_a_header_correctly`
- `parallel/test-set-incoming-message-header.js#block_01_trailers_setter_function_set_a_header_correctly`
- `parallel/test-signal-handler-remove-on-exit.js`
- `parallel/test-source-map-enable.js`
- `parallel/test-source-map-enable.js#block_00_outputs_source_maps_when_event_loop_is_drained_with_no_async`
- `parallel/test-source-map-enable.js#block_01_outputs_source_maps_when_process_kill_process_pid_sigint_exi`
- `parallel/test-source-map-enable.js#block_02_outputs_source_maps_when_source_file_calls_process_exit_1`
- `parallel/test-source-map-enable.js#block_03_outputs_source_maps_for_esm_module`
- `parallel/test-source-map-enable.js#block_04_loads_source_maps_with_relative_path_from_map_file_on_disk`
- `parallel/test-source-map-enable.js#block_05_loads_source_maps_from_inline_data_url`
- `parallel/test-source-map-enable.js#block_06_base64_encoding_error_does_not_crash_application`
- `parallel/test-source-map-enable.js#block_07_json_error_does_not_crash_application`
- `parallel/test-source-map-enable.js#block_08_is_not_set`
- `parallel/test-source-map-enable.js#block_09_applies_source_maps_generated_by_uglifyjs_to_stack_trace`
- `parallel/test-source-map-enable.js#block_10_applies_source_maps_generated_by_tsc_to_stack_trace`
- `parallel/test-source-map-enable.js#block_11_applies_source_maps_generated_by_babel_to_stack_trace`
- `parallel/test-source-map-enable.js#block_12_applies_source_maps_generated_by_nyc_to_stack_trace`
- `parallel/test-source-map-enable.js#block_13_applies_source_maps_in_esm_modules_to_stack_trace`
- `parallel/test-source-map-enable.js#block_14_does_not_persist_url_parameter_if_source_map_has_been_parsed`
- `parallel/test-source-map-enable.js#block_15_persists_line_lengths_for_in_memory_representation_of_source`
- `parallel/test-source-map-enable.js#block_16_trace_length_0`
- `parallel/test-source-map-enable.js#block_17_refs_https_sourcemaps_info_spec_html_h_75yo6yoyk7x5`
- `parallel/test-source-map-enable.js#block_18_refs_https_github_com_typestrong_ts_node_issues_1769`
- `parallel/test-source-map-enable.js#block_19_being_required`
- `parallel/test-source-map-enable.js#block_20_does_not_throw_typeerror_when_primitive_value_is_thrown`
- `parallel/test-source-map-enable.js#block_21_export`
- `parallel/test-source-map-enable.js#block_22_refs_https_github_com_nodejs_node_issues_42417`
- `parallel/test-sqlite-custom-functions.js`
- `parallel/test-sqlite-data-types.js`
- `parallel/test-sqlite-database-sync.js`
- `parallel/test-sqlite-database-sync.js#test_00_databasesync_constructor`
- `parallel/test-sqlite-database-sync.js#test_01_databasesync_prototype_open`
- `parallel/test-sqlite-database-sync.js#test_02_databasesync_prototype_close`
- `parallel/test-sqlite-database-sync.js#test_03_databasesync_prototype_prepare`
- `parallel/test-sqlite-database-sync.js#test_04_databasesync_prototype_exec`
- `parallel/test-sqlite-named-parameters.js`
- `parallel/test-sqlite-session.js#test_00_creating_and_applying_a_changeset`
- `parallel/test-sqlite-session.js#test_01_database_createsession_closed_database_results_in_exception`
- `parallel/test-sqlite-session.js#test_02_session_changeset_closed_database_results_in_exception`
- `parallel/test-sqlite-session.js#test_03_database_applychangeset_closed_database_results_in_exception`
- `parallel/test-sqlite-session.js#test_04_database_createsession_use_table_option_to_track_specific_ta`
- `parallel/test-sqlite-session.js#test_06_database_createsession_filter_changes`
- `parallel/test-sqlite-session.js#test_07_database_createsession_specify_other_database`
- `parallel/test-sqlite-session.js#test_08_database_createsession_wrong_arguments`
- `parallel/test-sqlite-session.js#test_09_database_applychangeset_wrong_arguments`
- `parallel/test-sqlite-session.js#test_10_session_patchset`
- `parallel/test-sqlite-session.js#test_11_session_close_using_session_after_close_throws_exception`
- `parallel/test-sqlite-session.js#test_12_session_close_after_closing_database_throws_exception`
- `parallel/test-sqlite-session.js#test_13_session_close_closing_twice`
- `parallel/test-sqlite-statement-sync.js#test_00_statementsync_constructor`
- `parallel/test-sqlite-statement-sync.js#test_01_statementsync_prototype_get`
- `parallel/test-sqlite-statement-sync.js#test_02_statementsync_prototype_all`
- `parallel/test-sqlite-statement-sync.js#test_03_statementsync_prototype_iterate`
- `parallel/test-sqlite-statement-sync.js#test_04_statementsync_prototype_run`
- `parallel/test-sqlite-statement-sync.js#test_05_statementsync_prototype_sourcesql`
- `parallel/test-sqlite-statement-sync.js#test_07_statementsync_prototype_setreadbigints`
- `parallel/test-sqlite-statement-sync.js#test_08_statementsync_prototype_setallowbarenamedparameters`
- `parallel/test-sqlite-transactions.js`
- `parallel/test-sqlite-typed-array-and-data-view.js`
- `parallel/test-sqlite.js#test_01_err_sqlite_error_is_thrown_for_errors_originating_from_sqlit`
- `parallel/test-sqlite.js#test_02_in_memory_databases_are_supported`
- `parallel/test-sqlite.js#test_03_sqlite_constants_are_defined`
- `parallel/test-sqlite.js#test_04_pragmas_are_supported`
- `parallel/test-sqlite.js#test_05_math_functions_are_enabled`
- `parallel/test-stdin-from-file.js`
- `parallel/test-stdin-hang.js`
- `parallel/test-stdin-pause-resume-sync.js`
- `parallel/test-stdin-pause-resume.js`
- `parallel/test-stdin-resume-pause.js`
- `parallel/test-stdio-pipe-access.js`
- `parallel/test-stdio-pipe-stderr.js`
- `parallel/test-stdout-stderr-write.js`
- `parallel/test-stream-aliases-legacy.js`
- `parallel/test-stream-auto-destroy.js`
- `parallel/test-stream-auto-destroy.js#block_00_block_00`
- `parallel/test-stream-auto-destroy.js#block_01_block_01`
- `parallel/test-stream-auto-destroy.js#block_02_block_02`
- `parallel/test-stream-auto-destroy.js#block_03_block_03`
- `parallel/test-stream-auto-destroy.js#block_04_block_04`
- `parallel/test-stream-await-drain-writers-in-synchronously-recursion-write.js`
- `parallel/test-stream-backpressure.js`
- `parallel/test-stream-big-packet.js`
- `parallel/test-stream-big-push.js`
- `parallel/test-stream-catch-rejections.js`
- `parallel/test-stream-catch-rejections.js#block_00_block_00`
- `parallel/test-stream-catch-rejections.js#block_01_block_01`
- `parallel/test-stream-compose-operator.js`
- `parallel/test-stream-compose-operator.js#block_00_block_00`
- `parallel/test-stream-compose-operator.js#block_01_block_01`
- `parallel/test-stream-compose-operator.js#block_02_block_02`
- `parallel/test-stream-compose-operator.js#block_03_block_03`
- `parallel/test-stream-compose-operator.js#block_04_block_04`
- `parallel/test-stream-compose-operator.js#block_05_block_05`
- `parallel/test-stream-compose-operator.js#block_06_block_06`
- `parallel/test-stream-compose-operator.js#block_07_block_07`
- `parallel/test-stream-compose.js#block_00_block_00`
- `parallel/test-stream-compose.js#block_01_block_01`
- `parallel/test-stream-compose.js#block_02_block_02`
- `parallel/test-stream-compose.js#block_03_block_03`
- `parallel/test-stream-compose.js#block_04_block_04`
- `parallel/test-stream-compose.js#block_05_block_05`
- `parallel/test-stream-compose.js#block_06_block_06`
- `parallel/test-stream-compose.js#block_07_block_07`
- `parallel/test-stream-compose.js#block_08_block_08`
- `parallel/test-stream-compose.js#block_09_block_09`
- `parallel/test-stream-compose.js#block_10_block_10`
- `parallel/test-stream-compose.js#block_11_block_11`
- `parallel/test-stream-compose.js#block_12_block_12`
- `parallel/test-stream-compose.js#block_13_block_13`
- `parallel/test-stream-compose.js#block_14_block_14`
- `parallel/test-stream-compose.js#block_15_block_15`
- `parallel/test-stream-compose.js#block_16_block_16`
- `parallel/test-stream-compose.js#block_18_block_18`
- `parallel/test-stream-compose.js#block_19_block_19`
- `parallel/test-stream-compose.js#block_20_block_20`
- `parallel/test-stream-compose.js#block_21_block_21`
- `parallel/test-stream-construct.js`
- `parallel/test-stream-construct.js#block_00_block_00`
- `parallel/test-stream-construct.js#block_01_block_01`
- `parallel/test-stream-construct.js#block_02_block_02`
- `parallel/test-stream-construct.js#block_03_block_03`
- `parallel/test-stream-construct.js#block_04_block_04`
- `parallel/test-stream-construct.js#block_05_block_05`
- `parallel/test-stream-construct.js#block_06_block_06`
- `parallel/test-stream-construct.js#block_07_block_07`
- `parallel/test-stream-construct.js#block_08_block_08`
- `parallel/test-stream-construct.js#block_09_block_09`
- `parallel/test-stream-construct.js#block_10_block_10`
- `parallel/test-stream-construct.js#block_11_block_11`
- `parallel/test-stream-consumers.js`
- `parallel/test-stream-consumers.js#block_00_block_00`
- `parallel/test-stream-consumers.js#block_01_block_01`
- `parallel/test-stream-consumers.js#block_02_block_02`
- `parallel/test-stream-consumers.js#block_03_block_03`
- `parallel/test-stream-consumers.js#block_04_block_04`
- `parallel/test-stream-consumers.js#block_05_block_05`
- `parallel/test-stream-consumers.js#block_06_block_06`
- `parallel/test-stream-consumers.js#block_07_block_07`
- `parallel/test-stream-consumers.js#block_08_block_08`
- `parallel/test-stream-consumers.js#block_09_block_09`
- `parallel/test-stream-consumers.js#block_10_block_10`
- `parallel/test-stream-consumers.js#block_11_block_11`
- `parallel/test-stream-consumers.js#block_12_block_12`
- `parallel/test-stream-consumers.js#block_13_block_13`
- `parallel/test-stream-consumers.js#block_14_block_14`
- `parallel/test-stream-consumers.js#block_15_block_15`
- `parallel/test-stream-decoder-objectmode.js`
- `parallel/test-stream-destroy-event-order.js`
- `parallel/test-stream-destroy.js#block_01_block_01`
- `parallel/test-stream-destroy.js#block_03_block_03`
- `parallel/test-stream-drop-take.js#block_00_block_00`
- `parallel/test-stream-drop-take.js#block_02_block_02`
- `parallel/test-stream-drop-take.js#block_03_block_03`
- `parallel/test-stream-drop-take.js#block_04_block_04`
- `parallel/test-stream-drop-take.js#block_05_block_05`
- `parallel/test-stream-duplex-destroy.js#block_00_block_00`
- `parallel/test-stream-duplex-destroy.js#block_01_block_01`
- `parallel/test-stream-duplex-destroy.js#block_02_block_02`
- `parallel/test-stream-duplex-destroy.js#block_03_block_03`
- `parallel/test-stream-duplex-destroy.js#block_04_block_04`
- `parallel/test-stream-duplex-destroy.js#block_05_block_05`
- `parallel/test-stream-duplex-destroy.js#block_06_block_06`
- `parallel/test-stream-duplex-destroy.js#block_07_block_07`
- `parallel/test-stream-duplex-destroy.js#block_08_block_08`
- `parallel/test-stream-duplex-destroy.js#block_09_block_09`
- `parallel/test-stream-duplex-destroy.js#block_10_block_10`
- `parallel/test-stream-duplex-destroy.js#block_11_block_11`
- `parallel/test-stream-duplex-destroy.js#block_12_block_12`
- `parallel/test-stream-duplex-destroy.js#block_13_block_13`
- `parallel/test-stream-duplex-destroy.js#block_15_block_15`
- `parallel/test-stream-duplex-end.js`
- `parallel/test-stream-duplex-end.js#block_00_block_00`
- `parallel/test-stream-duplex-end.js#block_01_block_01`
- `parallel/test-stream-duplex-end.js#block_02_block_02`
- `parallel/test-stream-duplex-from.js#block_00_block_00`
- `parallel/test-stream-duplex-from.js#block_01_block_01`
- `parallel/test-stream-duplex-from.js#block_02_block_02`
- `parallel/test-stream-duplex-from.js#block_03_block_03`
- `parallel/test-stream-duplex-from.js#block_04_block_04`
- `parallel/test-stream-duplex-from.js#block_05_block_05`
- `parallel/test-stream-duplex-from.js#block_06_block_06`
- `parallel/test-stream-duplex-from.js#block_07_ensure_that_isduplexnodestream_was_called`
- `parallel/test-stream-duplex-from.js#block_08_ensure_that_duplex_from_works_for_blobs`
- `parallel/test-stream-duplex-from.js#block_09_ensure_that_given_a_promise_rejection_it_emits_an_error`
- `parallel/test-stream-duplex-from.js#block_10_ensure_that_given_a_promise_rejection_on_an_async_function_i`
- `parallel/test-stream-duplex-from.js#block_11_ensure_that_duplex_from_throws_an_invalid_return_value_when_`
- `parallel/test-stream-duplex-from.js#block_12_ensure_data_if_a_sub_object_has_a_readable_stream_it_s_duple`
- `parallel/test-stream-duplex-from.js#block_13_ensure_data_if_a_sub_object_has_a_writable_stream_it_s_duple`
- `parallel/test-stream-duplex-from.js#block_14_ensure_data_if_a_sub_object_has_a_writable_and_readable_stre`
- `parallel/test-stream-duplex-from.js#block_15_ensure_that_given_readable_stream_that_throws_an_error_it_ca`
- `parallel/test-stream-duplex-from.js#block_16_ensure_that_given_writable_stream_that_throws_an_error_it_ca`
- `parallel/test-stream-duplex-from.js#block_18_block_18`
- `parallel/test-stream-duplex-from.js#block_19_block_19`
- `parallel/test-stream-duplex-from.js#block_20_block_20`
- `parallel/test-stream-duplex-from.js#block_21_block_21`
- `parallel/test-stream-duplex-from.js#block_22_block_22`
- `parallel/test-stream-duplex-props.js`
- `parallel/test-stream-duplex-props.js#block_00_block_00`
- `parallel/test-stream-duplex-props.js#block_01_block_01`
- `parallel/test-stream-duplex-readable-end.js`
- `parallel/test-stream-duplex-readable-writable.js#block_00_block_00`
- `parallel/test-stream-duplex-readable-writable.js#block_01_block_01`
- `parallel/test-stream-duplex-writable-finished.js`
- `parallel/test-stream-duplex-writable-finished.js#block_00_basic`
- `parallel/test-stream-duplex-writable-finished.js#block_01_event`
- `parallel/test-stream-duplex.js`
- `parallel/test-stream-duplex.js#block_00_duplex_fromweb`
- `parallel/test-stream-duplex.js#block_01_duplex_fromweb_using_utf8_and_objectmode`
- `parallel/test-stream-duplex.js#block_02_duplex_toweb`
- `parallel/test-stream-duplexpair.js`
- `parallel/test-stream-duplexpair.js#block_00_block_00`
- `parallel/test-stream-duplexpair.js#block_01_block_01`
- `parallel/test-stream-duplexpair.js#block_02_block_02`
- `parallel/test-stream-duplexpair.js#block_03_block_03`
- `parallel/test-stream-duplexpair.js#block_04_because_a_zero_size_push_doesn_t_trigger_a_read`
- `parallel/test-stream-end-of-streams.js`
- `parallel/test-stream-end-paused.js`
- `parallel/test-stream-error-once.js`
- `parallel/test-stream-error-once.js#block_00_block_00`
- `parallel/test-stream-error-once.js#block_01_block_01`
- `parallel/test-stream-event-names.js`
- `parallel/test-stream-event-names.js#block_00_block_00`
- `parallel/test-stream-event-names.js#block_01_block_01`
- `parallel/test-stream-event-names.js#block_02_block_02`
- `parallel/test-stream-event-names.js#block_03_block_03`
- `parallel/test-stream-event-names.js#block_04_block_04`
- `parallel/test-stream-event-names.js#block_05_block_05`
- `parallel/test-stream-events-prepend.js`
- `parallel/test-stream-filter.js`
- `parallel/test-stream-filter.js#block_00_block_00`
- `parallel/test-stream-filter.js#block_01_block_01`
- `parallel/test-stream-filter.js#block_02_block_02`
- `parallel/test-stream-filter.js#block_03_block_03`
- `parallel/test-stream-filter.js#block_04_block_04`
- `parallel/test-stream-filter.js#block_05_block_05`
- `parallel/test-stream-filter.js#block_06_block_06`
- `parallel/test-stream-filter.js#block_07_block_07`
- `parallel/test-stream-filter.js#block_08_block_08`
- `parallel/test-stream-filter.js#block_09_block_09`
- `parallel/test-stream-filter.js#block_10_block_10`
- `parallel/test-stream-filter.js#block_11_block_11`
- `parallel/test-stream-finished.js#block_00_block_00`
- `parallel/test-stream-finished.js#block_01_block_01`
- `parallel/test-stream-finished.js#block_02_block_02`
- `parallel/test-stream-finished.js#block_03_block_03`
- `parallel/test-stream-finished.js#block_04_block_04`
- `parallel/test-stream-finished.js#block_05_block_05`
- `parallel/test-stream-finished.js#block_06_block_06`
- `parallel/test-stream-finished.js#block_07_block_07`
- `parallel/test-stream-finished.js#block_08_block_08`
- `parallel/test-stream-finished.js#block_09_block_09`
- `parallel/test-stream-finished.js#block_10_block_10`
- `parallel/test-stream-finished.js#block_11_block_11`
- `parallel/test-stream-finished.js#block_12_block_12`
- `parallel/test-stream-finished.js#block_13_block_13`
- `parallel/test-stream-finished.js#block_14_test_faulty_input_values_and_options`
- `parallel/test-stream-finished.js#block_15_test_that_calling_returned_function_removes_listeners`
- `parallel/test-stream-finished.js#block_16_block_16`
- `parallel/test-stream-finished.js#block_17_block_17`
- `parallel/test-stream-finished.js#block_18_block_18`
- `parallel/test-stream-finished.js#block_19_block_19`
- `parallel/test-stream-finished.js#block_20_block_20`
- `parallel/test-stream-finished.js#block_25_block_25`
- `parallel/test-stream-finished.js#block_26_block_26`
- `parallel/test-stream-finished.js#block_27_block_27`
- `parallel/test-stream-finished.js#block_28_block_28`
- `parallel/test-stream-finished.js#block_29_block_29`
- `parallel/test-stream-finished.js#block_30_block_30`
- `parallel/test-stream-finished.js#block_31_block_31`
- `parallel/test-stream-finished.js#block_32_block_32`
- `parallel/test-stream-finished.js#block_35_block_35`
- `parallel/test-stream-finished.js#block_36_block_36`
- `parallel/test-stream-finished.js#block_37_block_37`
- `parallel/test-stream-finished.js#block_38_block_38`
- `parallel/test-stream-finished.js#block_40_block_40`
- `parallel/test-stream-flatMap.js`
- `parallel/test-stream-flatMap.js#block_00_block_00`
- `parallel/test-stream-flatMap.js#block_01_block_01`
- `parallel/test-stream-flatMap.js#block_02_block_02`
- `parallel/test-stream-flatMap.js#block_03_block_03`
- `parallel/test-stream-flatMap.js#block_04_block_04`
- `parallel/test-stream-flatMap.js#block_05_block_05`
- `parallel/test-stream-flatMap.js#block_06_block_06`
- `parallel/test-stream-flatMap.js#block_07_block_07`
- `parallel/test-stream-forEach.js`
- `parallel/test-stream-forEach.js#block_00_block_00`
- `parallel/test-stream-forEach.js#block_01_block_01`
- `parallel/test-stream-forEach.js#block_02_block_02`
- `parallel/test-stream-forEach.js#block_03_block_03`
- `parallel/test-stream-forEach.js#block_04_block_04`
- `parallel/test-stream-forEach.js#block_05_block_05`
- `parallel/test-stream-forEach.js#block_06_block_06`
- `parallel/test-stream-forEach.js#block_07_block_07`
- `parallel/test-stream-forEach.js#block_08_block_08`
- `parallel/test-stream-forEach.js#block_09_block_09`
- `parallel/test-stream-forEach.js#block_10_block_10`
- `parallel/test-stream-inheritance.js`
- `parallel/test-stream-ispaused.js`
- `parallel/test-stream-map.js#block_00_block_00`
- `parallel/test-stream-map.js#block_01_block_01`
- `parallel/test-stream-map.js#block_02_block_02`
- `parallel/test-stream-map.js#block_04_block_04`
- `parallel/test-stream-map.js#block_05_block_05`
- `parallel/test-stream-map.js#block_06_block_06`
- `parallel/test-stream-map.js#block_07_block_07`
- `parallel/test-stream-map.js#block_08_block_08`
- `parallel/test-stream-map.js#block_10_block_10`
- `parallel/test-stream-map.js#block_11_block_11`
- `parallel/test-stream-map.js#block_12_block_12`
- `parallel/test-stream-map.js#block_13_block_13`
- `parallel/test-stream-map.js#block_14_block_14`
- `parallel/test-stream-map.js#block_15_block_15`
- `parallel/test-stream-map.js#block_16_block_16`
- `parallel/test-stream-objectmode-undefined.js`
- `parallel/test-stream-objectmode-undefined.js#block_00_block_00`
- `parallel/test-stream-objectmode-undefined.js#block_01_block_01`
- `parallel/test-stream-objectmode-undefined.js#block_02_block_02`
- `parallel/test-stream-once-readable-pipe.js`
- `parallel/test-stream-once-readable-pipe.js#block_00_block_00`
- `parallel/test-stream-once-readable-pipe.js#block_01_block_01`
- `parallel/test-stream-passthrough-drain.js`
- `parallel/test-stream-pipe-after-end.js`
- `parallel/test-stream-pipe-await-drain-manual-resume.js`
- `parallel/test-stream-pipe-await-drain-push-while-write.js`
- `parallel/test-stream-pipe-await-drain.js`
- `parallel/test-stream-pipe-cleanup-pause.js`
- `parallel/test-stream-pipe-cleanup.js`
- `parallel/test-stream-pipe-error-handling.js`
- `parallel/test-stream-pipe-error-handling.js#block_00_block_00`
- `parallel/test-stream-pipe-error-handling.js#block_01_block_01`
- `parallel/test-stream-pipe-error-handling.js#block_02_block_02`
- `parallel/test-stream-pipe-error-handling.js#block_03_block_03`
- `parallel/test-stream-pipe-error-handling.js#block_04_block_04`
- `parallel/test-stream-pipe-error-unhandled.js`
- `parallel/test-stream-pipe-event.js`
- `parallel/test-stream-pipe-flow-after-unpipe.js`
- `parallel/test-stream-pipe-flow.js`
- `parallel/test-stream-pipe-flow.js#block_00_block_00`
- `parallel/test-stream-pipe-flow.js#block_01_block_01`
- `parallel/test-stream-pipe-flow.js#block_02_block_02`
- `parallel/test-stream-pipe-manual-resume.js`
- `parallel/test-stream-pipe-multiple-pipes.js`
- `parallel/test-stream-pipe-needDrain.js`
- `parallel/test-stream-pipe-same-destination-twice.js`
- `parallel/test-stream-pipe-same-destination-twice.js#block_00_block_00`
- `parallel/test-stream-pipe-same-destination-twice.js#block_01_block_01`
- `parallel/test-stream-pipe-same-destination-twice.js#block_02_block_02`
- `parallel/test-stream-pipe-unpipe-streams.js`
- `parallel/test-stream-pipe-unpipe-streams.js#block_00_block_00`
- `parallel/test-stream-pipe-unpipe-streams.js#block_01_block_01`
- `parallel/test-stream-pipeline-async-iterator.js`
- `parallel/test-stream-pipeline-uncaught.js`
- `parallel/test-stream-pipeline-with-empty-string.js`
- `parallel/test-stream-pipeline.js#block_00_block_00`
- `parallel/test-stream-pipeline.js#block_01_block_01`
- `parallel/test-stream-pipeline.js#block_02_block_02`
- `parallel/test-stream-pipeline.js#block_03_block_03`
- `parallel/test-stream-pipeline.js#block_04_block_04`
- `parallel/test-stream-pipeline.js#block_09_block_09`
- `parallel/test-stream-pipeline.js#block_10_block_10`
- `parallel/test-stream-pipeline.js#block_11_block_11`
- `parallel/test-stream-pipeline.js#block_12_block_12`
- `parallel/test-stream-pipeline.js#block_13_block_13`
- `parallel/test-stream-pipeline.js#block_14_block_14`
- `parallel/test-stream-pipeline.js#block_15_block_15`
- `parallel/test-stream-pipeline.js#block_16_block_16`
- `parallel/test-stream-pipeline.js#block_18_block_18`
- `parallel/test-stream-pipeline.js#block_19_block_19`
- `parallel/test-stream-pipeline.js#block_20_block_20`
- `parallel/test-stream-pipeline.js#block_21_block_21`
- `parallel/test-stream-pipeline.js#block_22_block_22`
- `parallel/test-stream-pipeline.js#block_23_block_23`
- `parallel/test-stream-pipeline.js#block_24_block_24`
- `parallel/test-stream-pipeline.js#block_25_block_25`
- `parallel/test-stream-pipeline.js#block_26_block_26`
- `parallel/test-stream-pipeline.js#block_27_block_27`
- `parallel/test-stream-pipeline.js#block_28_block_28`
- `parallel/test-stream-pipeline.js#block_29_block_29`
- `parallel/test-stream-pipeline.js#block_30_block_30`
- `parallel/test-stream-pipeline.js#block_31_block_31`
- `parallel/test-stream-pipeline.js#block_32_block_32`
- `parallel/test-stream-pipeline.js#block_33_block_33`
- `parallel/test-stream-pipeline.js#block_34_block_34`
- `parallel/test-stream-pipeline.js#block_35_block_35`
- `parallel/test-stream-pipeline.js#block_36_block_36`
- `parallel/test-stream-pipeline.js#block_37_block_37`
- `parallel/test-stream-pipeline.js#block_38_block_38`
- `parallel/test-stream-pipeline.js#block_39_block_39`
- `parallel/test-stream-pipeline.js#block_40_block_40`
- `parallel/test-stream-pipeline.js#block_41_block_41`
- `parallel/test-stream-pipeline.js#block_42_block_42`
- `parallel/test-stream-pipeline.js#block_43_block_43`
- `parallel/test-stream-pipeline.js#block_44_block_44`
- `parallel/test-stream-pipeline.js#block_46_block_46`
- `parallel/test-stream-pipeline.js#block_47_block_47`
- `parallel/test-stream-pipeline.js#block_48_block_48`
- `parallel/test-stream-pipeline.js#block_50_block_50`
- `parallel/test-stream-pipeline.js#block_51_block_51`
- `parallel/test-stream-pipeline.js#block_52_block_52`
- `parallel/test-stream-pipeline.js#block_53_block_53`
- `parallel/test-stream-pipeline.js#block_54_block_54`
- `parallel/test-stream-pipeline.js#block_56_block_56`
- `parallel/test-stream-pipeline.js#block_58_block_58`
- `parallel/test-stream-pipeline.js#block_59_block_59`
- `parallel/test-stream-pipeline.js#block_60_block_60`
- `parallel/test-stream-pipeline.js#block_61_block_61`
- `parallel/test-stream-pipeline.js#block_62_block_62`
- `parallel/test-stream-pipeline.js#block_63_block_63`
- `parallel/test-stream-pipeline.js#block_64_block_64`
- `parallel/test-stream-pipeline.js#block_65_block_65`
- `parallel/test-stream-pipeline.js#block_66_block_66`
- `parallel/test-stream-pipeline.js#block_67_block_67`
- `parallel/test-stream-pipeline.js#block_68_block_68`
- `parallel/test-stream-pipeline.js#block_69_block_69`
- `parallel/test-stream-pipeline.js#block_70_block_70`
- `parallel/test-stream-pipeline.js#block_73_block_73`
- `parallel/test-stream-pipeline.js#block_74_block_74`
- `parallel/test-stream-pipeline.js#block_76_block_76`
- `parallel/test-stream-pipeline.js#block_77_block_77`
- `parallel/test-stream-pipeline.js#block_78_block_78`
- `parallel/test-stream-pipeline.js#block_79_block_79`
- `parallel/test-stream-preprocess.js`
- `parallel/test-stream-promises.js`
- `parallel/test-stream-promises.js#block_00_pipeline_success`
- `parallel/test-stream-promises.js#block_01_pipeline_error`
- `parallel/test-stream-promises.js#block_02_finished_success`
- `parallel/test-stream-promises.js#block_03_finished_error`
- `parallel/test-stream-promises.js#block_04_block_04`
- `parallel/test-stream-promises.js#block_05_streamobj_is_stream_and_cleanup_is_boolean`
- `parallel/test-stream-promises.js#block_06_listenercount_should_be_1_after_calling_finish`
- `parallel/test-stream-promises.js#block_07_listenercount_should_be_0_after_calling_finish`
- `parallel/test-stream-promises.js#block_08_listenercount_should_be_1_after_calling_finish`
- `parallel/test-stream-push-order.js`
- `parallel/test-stream-push-strings.js`
- `parallel/test-stream-readable-aborted.js`
- `parallel/test-stream-readable-aborted.js#block_00_block_00`
- `parallel/test-stream-readable-aborted.js#block_01_block_01`
- `parallel/test-stream-readable-aborted.js#block_02_block_02`
- `parallel/test-stream-readable-aborted.js#block_03_block_03`
- `parallel/test-stream-readable-aborted.js#block_04_block_04`
- `parallel/test-stream-readable-add-chunk-during-data.js`
- `parallel/test-stream-readable-async-iterators.js#block_00_block_00`
- `parallel/test-stream-readable-async-iterators.js#block_01_block_01`
- `parallel/test-stream-readable-async-iterators.js#block_02_block_02`
- `parallel/test-stream-readable-async-iterators.js#block_03_block_03`
- `parallel/test-stream-readable-async-iterators.js#block_04_asynciterator_non_destroying_iterator`
- `parallel/test-stream-readable-constructor-set-methods.js`
- `parallel/test-stream-readable-data.js`
- `parallel/test-stream-readable-default-encoding.js`
- `parallel/test-stream-readable-default-encoding.js#block_00_block_00`
- `parallel/test-stream-readable-default-encoding.js#block_01_block_01`
- `parallel/test-stream-readable-default-encoding.js#block_02_block_02`
- `parallel/test-stream-readable-destroy.js`
- `parallel/test-stream-readable-destroy.js#block_00_block_00`
- `parallel/test-stream-readable-destroy.js#block_01_block_01`
- `parallel/test-stream-readable-destroy.js#block_02_block_02`
- `parallel/test-stream-readable-destroy.js#block_03_block_03`
- `parallel/test-stream-readable-destroy.js#block_04_block_04`
- `parallel/test-stream-readable-destroy.js#block_05_block_05`
- `parallel/test-stream-readable-destroy.js#block_06_block_06`
- `parallel/test-stream-readable-destroy.js#block_07_block_07`
- `parallel/test-stream-readable-destroy.js#block_08_block_08`
- `parallel/test-stream-readable-destroy.js#block_09_block_09`
- `parallel/test-stream-readable-destroy.js#block_10_block_10`
- `parallel/test-stream-readable-destroy.js#block_11_block_11`
- `parallel/test-stream-readable-destroy.js#block_12_block_12`
- `parallel/test-stream-readable-destroy.js#block_13_block_13`
- `parallel/test-stream-readable-destroy.js#block_14_block_14`
- `parallel/test-stream-readable-destroy.js#block_15_block_15`
- `parallel/test-stream-readable-destroy.js#block_16_block_16`
- `parallel/test-stream-readable-destroy.js#block_17_block_17`
- `parallel/test-stream-readable-destroy.js#block_18_block_18`
- `parallel/test-stream-readable-destroy.js#block_19_block_19`
- `parallel/test-stream-readable-destroy.js#block_20_block_20`
- `parallel/test-stream-readable-destroy.js#block_21_block_21`
- `parallel/test-stream-readable-destroy.js#block_22_block_22`
- `parallel/test-stream-readable-didRead.js`
- `parallel/test-stream-readable-didRead.js#block_00_block_00`
- `parallel/test-stream-readable-didRead.js#block_01_block_01`
- `parallel/test-stream-readable-didRead.js#block_02_block_02`
- `parallel/test-stream-readable-didRead.js#block_03_block_03`
- `parallel/test-stream-readable-didRead.js#block_04_block_04`
- `parallel/test-stream-readable-didRead.js#block_05_block_05`
- `parallel/test-stream-readable-dispose.js`
- `parallel/test-stream-readable-emit-readable-short-stream.js`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_00_block_00`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_01_block_01`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_02_block_02`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_03_block_03`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_04_block_04`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_05_block_05`
- `parallel/test-stream-readable-end-destroyed.js`
- `parallel/test-stream-readable-ended.js`
- `parallel/test-stream-readable-ended.js#block_00_basic`
- `parallel/test-stream-readable-ended.js#block_01_event`
- `parallel/test-stream-readable-ended.js#block_02_verifies_no_error_triggered_on_multiple_push_null_invocation`
- `parallel/test-stream-readable-error-end.js`
- `parallel/test-stream-readable-event.js`
- `parallel/test-stream-readable-event.js#block_00_block_00`
- `parallel/test-stream-readable-event.js#block_01_block_01`
- `parallel/test-stream-readable-event.js#block_02_block_02`
- `parallel/test-stream-readable-event.js#block_03_block_03`
- `parallel/test-stream-readable-event.js#block_04_block_04`
- `parallel/test-stream-readable-flow-recursion.js`
- `parallel/test-stream-readable-from-web-termination.js`
- `parallel/test-stream-readable-hwm-0-async.js`
- `parallel/test-stream-readable-hwm-0.js`
- `parallel/test-stream-readable-infinite-read.js`
- `parallel/test-stream-readable-invalid-chunk.js`
- `parallel/test-stream-readable-next-no-null.js`
- `parallel/test-stream-readable-no-unneeded-readable.js`
- `parallel/test-stream-readable-no-unneeded-readable.js#block_00_block_00`
- `parallel/test-stream-readable-no-unneeded-readable.js#block_01_block_01`
- `parallel/test-stream-readable-object-multi-push-async.js#block_00_block_00`
- `parallel/test-stream-readable-object-multi-push-async.js#block_01_block_01`
- `parallel/test-stream-readable-object-multi-push-async.js#block_02_block_02`
- `parallel/test-stream-readable-object-multi-push-async.js#block_03_block_03`
- `parallel/test-stream-readable-pause-and-resume.js`
- `parallel/test-stream-readable-pause-and-resume.js#block_00_block_00`
- `parallel/test-stream-readable-pause-and-resume.js#block_01_block_01`
- `parallel/test-stream-readable-readable-then-resume.js`
- `parallel/test-stream-readable-readable.js`
- `parallel/test-stream-readable-readable.js#block_00_block_00`
- `parallel/test-stream-readable-readable.js#block_01_block_01`
- `parallel/test-stream-readable-readable.js#block_02_block_02`
- `parallel/test-stream-readable-reading-readingMore.js`
- `parallel/test-stream-readable-reading-readingMore.js#block_00_block_00`
- `parallel/test-stream-readable-reading-readingMore.js#block_01_block_01`
- `parallel/test-stream-readable-reading-readingMore.js#block_02_block_02`
- `parallel/test-stream-readable-resume-hwm.js`
- `parallel/test-stream-readable-resumeScheduled.js`
- `parallel/test-stream-readable-resumeScheduled.js#block_00_block_00`
- `parallel/test-stream-readable-resumeScheduled.js#block_01_block_01`
- `parallel/test-stream-readable-resumeScheduled.js#block_02_block_02`
- `parallel/test-stream-readable-setEncoding-existing-buffers.js`
- `parallel/test-stream-readable-setEncoding-existing-buffers.js#block_00_block_00`
- `parallel/test-stream-readable-setEncoding-existing-buffers.js#block_01_block_01`
- `parallel/test-stream-readable-setEncoding-existing-buffers.js#block_02_block_02`
- `parallel/test-stream-readable-setEncoding-null.js`
- `parallel/test-stream-readable-strategy-option.js`
- `parallel/test-stream-readable-strategy-option.js#block_00_block_00`
- `parallel/test-stream-readable-strategy-option.js#block_01_block_01`
- `parallel/test-stream-readable-strategy-option.js#block_02_block_02`
- `parallel/test-stream-readable-to-web-termination.js`
- `parallel/test-stream-readable-unshift.js`
- `parallel/test-stream-readable-unshift.js#block_00_block_00`
- `parallel/test-stream-readable-unshift.js#block_01_block_01`
- `parallel/test-stream-readable-unshift.js#block_02_block_02`
- `parallel/test-stream-readable-unshift.js#block_03_block_03`
- `parallel/test-stream-readable-unshift.js#block_04_block_04`
- `parallel/test-stream-readable-unshift.js#block_05_block_05`
- `parallel/test-stream-readable-unshift.js#block_06_block_06`
- `parallel/test-stream-readable-with-unimplemented-_read.js`
- `parallel/test-stream-readableListening-state.js`
- `parallel/test-stream-reduce.js#block_00_block_00`
- `parallel/test-stream-reduce.js#block_01_block_01`
- `parallel/test-stream-reduce.js#block_03_block_03`
- `parallel/test-stream-reduce.js#block_04_block_04`
- `parallel/test-stream-reduce.js#block_05_block_05`
- `parallel/test-stream-reduce.js#block_06_block_06`
- `parallel/test-stream-reduce.js#block_07_block_07`
- `parallel/test-stream-set-default-hwm.js`
- `parallel/test-stream-toArray.js`
- `parallel/test-stream-toArray.js#block_00_block_00`
- `parallel/test-stream-toArray.js#block_01_block_01`
- `parallel/test-stream-toArray.js#block_02_block_02`
- `parallel/test-stream-toArray.js#block_03_block_03`
- `parallel/test-stream-toArray.js#block_04_block_04`
- `parallel/test-stream-toArray.js#block_05_block_05`
- `parallel/test-stream-transform-callback-twice.js`
- `parallel/test-stream-transform-constructor-set-methods.js`
- `parallel/test-stream-transform-destroy.js`
- `parallel/test-stream-transform-destroy.js#block_00_block_00`
- `parallel/test-stream-transform-destroy.js#block_01_block_01`
- `parallel/test-stream-transform-destroy.js#block_02_block_02`
- `parallel/test-stream-transform-destroy.js#block_03_block_03`
- `parallel/test-stream-transform-destroy.js#block_04_block_04`
- `parallel/test-stream-transform-destroy.js#block_05_block_05`
- `parallel/test-stream-transform-destroy.js#block_06_block_06`
- `parallel/test-stream-transform-destroy.js#block_07_block_07`
- `parallel/test-stream-transform-final-sync.js`
- `parallel/test-stream-transform-final.js`
- `parallel/test-stream-transform-flush-data.js`
- `parallel/test-stream-transform-hwm0.js`
- `parallel/test-stream-transform-objectmode-falsey-value.js`
- `parallel/test-stream-transform-split-highwatermark.js`
- `parallel/test-stream-transform-split-highwatermark.js#block_00_test_nan`
- `parallel/test-stream-transform-split-highwatermark.js#block_01_test_non_duplex_streams_ignore_the_options`
- `parallel/test-stream-transform-split-objectmode.js`
- `parallel/test-stream-typedarray.js`
- `parallel/test-stream-typedarray.js#block_00_block_00`
- `parallel/test-stream-typedarray.js#block_01_block_01`
- `parallel/test-stream-typedarray.js#block_02_block_02`
- `parallel/test-stream-typedarray.js#block_03_block_03`
- `parallel/test-stream-typedarray.js#block_04_block_04`
- `parallel/test-stream-uint8array.js`
- `parallel/test-stream-uint8array.js#block_00_block_00`
- `parallel/test-stream-uint8array.js#block_01_block_01`
- `parallel/test-stream-uint8array.js#block_02_block_02`
- `parallel/test-stream-uint8array.js#block_03_block_03`
- `parallel/test-stream-uint8array.js#block_04_block_04`
- `parallel/test-stream-unpipe-event.js`
- `parallel/test-stream-unpipe-event.js#block_00_block_00`
- `parallel/test-stream-unpipe-event.js#block_01_block_01`
- `parallel/test-stream-unpipe-event.js#block_02_block_02`
- `parallel/test-stream-unpipe-event.js#block_03_block_03`
- `parallel/test-stream-unpipe-event.js#block_04_block_04`
- `parallel/test-stream-unpipe-event.js#block_05_block_05`
- `parallel/test-stream-unshift-empty-chunk.js`
- `parallel/test-stream-unshift-read-race.js`
- `parallel/test-stream-writable-aborted.js`
- `parallel/test-stream-writable-aborted.js#block_00_block_00`
- `parallel/test-stream-writable-aborted.js#block_01_block_01`
- `parallel/test-stream-writable-change-default-encoding.js`
- `parallel/test-stream-writable-clear-buffer.js`
- `parallel/test-stream-writable-constructor-set-methods.js`
- `parallel/test-stream-writable-decoded-encoding.js`
- `parallel/test-stream-writable-destroy.js#block_00_block_00`
- `parallel/test-stream-writable-destroy.js#block_01_block_01`
- `parallel/test-stream-writable-destroy.js#block_02_block_02`
- `parallel/test-stream-writable-destroy.js#block_03_block_03`
- `parallel/test-stream-writable-destroy.js#block_04_block_04`
- `parallel/test-stream-writable-destroy.js#block_05_block_05`
- `parallel/test-stream-writable-destroy.js#block_06_block_06`
- `parallel/test-stream-writable-destroy.js#block_07_block_07`
- `parallel/test-stream-writable-destroy.js#block_08_block_08`
- `parallel/test-stream-writable-destroy.js#block_09_block_09`
- `parallel/test-stream-writable-destroy.js#block_10_block_10`
- `parallel/test-stream-writable-destroy.js#block_11_block_11`
- `parallel/test-stream-writable-destroy.js#block_12_block_12`
- `parallel/test-stream-writable-destroy.js#block_13_block_13`
- `parallel/test-stream-writable-destroy.js#block_14_block_14`
- `parallel/test-stream-writable-destroy.js#block_15_block_15`
- `parallel/test-stream-writable-destroy.js#block_16_block_16`
- `parallel/test-stream-writable-destroy.js#block_17_block_17`
- `parallel/test-stream-writable-destroy.js#block_18_block_18`
- `parallel/test-stream-writable-destroy.js#block_20_block_20`
- `parallel/test-stream-writable-destroy.js#block_21_block_21`
- `parallel/test-stream-writable-destroy.js#block_22_block_22`
- `parallel/test-stream-writable-destroy.js#block_23_block_23`
- `parallel/test-stream-writable-destroy.js#block_24_block_24`
- `parallel/test-stream-writable-destroy.js#block_25_block_25`
- `parallel/test-stream-writable-destroy.js#block_26_block_26`
- `parallel/test-stream-writable-destroy.js#block_27_block_27`
- `parallel/test-stream-writable-end-multiple.js`
- `parallel/test-stream-writable-ended-state.js`
- `parallel/test-stream-writable-final-async.js`
- `parallel/test-stream-writable-final-destroy.js`
- `parallel/test-stream-writable-final-throw.js`
- `parallel/test-stream-writable-finish-destroyed.js`
- `parallel/test-stream-writable-finish-destroyed.js#block_00_block_00`
- `parallel/test-stream-writable-finish-destroyed.js#block_01_block_01`
- `parallel/test-stream-writable-finish-destroyed.js#block_02_block_02`
- `parallel/test-stream-writable-finished-state.js`
- `parallel/test-stream-writable-finished.js`
- `parallel/test-stream-writable-finished.js#block_00_basic`
- `parallel/test-stream-writable-finished.js#block_01_event`
- `parallel/test-stream-writable-finished.js#block_02_block_02`
- `parallel/test-stream-writable-finished.js#block_03_block_03`
- `parallel/test-stream-writable-finished.js#block_04_block_04`
- `parallel/test-stream-writable-finished.js#block_05_block_05`
- `parallel/test-stream-writable-invalid-chunk.js`
- `parallel/test-stream-writable-needdrain-state.js`
- `parallel/test-stream-writable-null.js`
- `parallel/test-stream-writable-null.js#block_00_block_00`
- `parallel/test-stream-writable-null.js#block_01_block_01`
- `parallel/test-stream-writable-null.js#block_02_block_02`
- `parallel/test-stream-writable-null.js#block_03_block_03`
- `parallel/test-stream-writable-properties.js`
- `parallel/test-stream-writable-writable.js`
- `parallel/test-stream-writable-writable.js#block_00_block_00`
- `parallel/test-stream-writable-writable.js#block_01_block_01`
- `parallel/test-stream-writable-writable.js#block_02_block_02`
- `parallel/test-stream-writable-writable.js#block_03_block_03`
- `parallel/test-stream-writable-write-cb-error.js`
- `parallel/test-stream-writable-write-cb-error.js#block_00_block_00`
- `parallel/test-stream-writable-write-cb-error.js#block_01_block_01`
- `parallel/test-stream-writable-write-cb-error.js#block_02_block_02`
- `parallel/test-stream-writable-write-cb-twice.js`
- `parallel/test-stream-writable-write-cb-twice.js#block_00_block_00`
- `parallel/test-stream-writable-write-cb-twice.js#block_01_block_01`
- `parallel/test-stream-writable-write-cb-twice.js#block_02_block_02`
- `parallel/test-stream-writable-write-error.js`
- `parallel/test-stream-writable-write-writev-finish.js`
- `parallel/test-stream-writable-write-writev-finish.js#block_00_block_00`
- `parallel/test-stream-writable-write-writev-finish.js#block_01_block_01`
- `parallel/test-stream-writable-write-writev-finish.js#block_02_block_02`
- `parallel/test-stream-writable-write-writev-finish.js#block_03_block_03`
- `parallel/test-stream-writable-write-writev-finish.js#block_04_block_04`
- `parallel/test-stream-writable-write-writev-finish.js#block_05_block_05`
- `parallel/test-stream-writable-write-writev-finish.js#block_06_block_06`
- `parallel/test-stream-writable-write-writev-finish.js#block_07_block_07`
- `parallel/test-stream-writableState-ending.js`
- `parallel/test-stream-writableState-uncorked-bufferedRequestCount.js`
- `parallel/test-stream-write-destroy.js`
- `parallel/test-stream-write-drain.js`
- `parallel/test-stream-write-final.js`
- `parallel/test-stream-writev.js`
- `parallel/test-stream2-base64-single-char-read-end.js`
- `parallel/test-stream2-basic.js`
- `parallel/test-stream2-basic.js#block_00_block_00`
- `parallel/test-stream2-basic.js#block_01_block_01`
- `parallel/test-stream2-basic.js#block_02_block_02`
- `parallel/test-stream2-basic.js#block_03_block_03`
- `parallel/test-stream2-basic.js#block_04_block_04`
- `parallel/test-stream2-basic.js#block_05_block_05`
- `parallel/test-stream2-basic.js#block_06_block_06`
- `parallel/test-stream2-basic.js#block_07_block_07`
- `parallel/test-stream2-basic.js#block_08_block_08`
- `parallel/test-stream2-basic.js#block_09_block_09`
- `parallel/test-stream2-basic.js#block_10_block_10`
- `parallel/test-stream2-decode-partial.js`
- `parallel/test-stream2-finish-pipe-error.js`
- `parallel/test-stream2-finish-pipe.js`
- `parallel/test-stream2-objects.js`
- `parallel/test-stream2-objects.js#block_00_block_00`
- `parallel/test-stream2-objects.js#block_01_block_01`
- `parallel/test-stream2-objects.js#block_02_block_02`
- `parallel/test-stream2-objects.js#block_03_block_03`
- `parallel/test-stream2-objects.js#block_04_block_04`
- `parallel/test-stream2-objects.js#block_05_block_05`
- `parallel/test-stream2-objects.js#block_06_block_06`
- `parallel/test-stream2-objects.js#block_07_block_07`
- `parallel/test-stream2-objects.js#block_08_block_08`
- `parallel/test-stream2-objects.js#block_09_block_09`
- `parallel/test-stream2-objects.js#block_10_block_10`
- `parallel/test-stream2-objects.js#block_11_block_11`
- `parallel/test-stream2-objects.js#block_12_block_12`
- `parallel/test-stream2-objects.js#block_13_block_13`
- `parallel/test-stream2-pipe-error-handling.js`
- `parallel/test-stream2-pipe-error-handling.js#block_00_block_00`
- `parallel/test-stream2-pipe-error-handling.js#block_01_block_01`
- `parallel/test-stream2-pipe-error-once-listener.js`
- `parallel/test-stream2-push.js`
- `parallel/test-stream2-read-sync-stack.js`
- `parallel/test-stream2-readable-empty-buffer-no-eof.js`
- `parallel/test-stream2-readable-legacy-drain.js`
- `parallel/test-stream2-readable-non-empty-end.js`
- `parallel/test-stream2-readable-wrap-destroy.js`
- `parallel/test-stream2-readable-wrap-destroy.js#block_00_block_00`
- `parallel/test-stream2-readable-wrap-destroy.js#block_01_block_01`
- `parallel/test-stream2-readable-wrap-empty.js`
- `parallel/test-stream2-readable-wrap-error.js`
- `parallel/test-stream2-readable-wrap-error.js#block_00_block_00`
- `parallel/test-stream2-readable-wrap-error.js#block_01_block_01`
- `parallel/test-stream2-readable-wrap.js`
- `parallel/test-stream2-set-encoding.js`
- `parallel/test-stream2-set-encoding.js#block_00_block_00`
- `parallel/test-stream2-set-encoding.js#block_01_block_01`
- `parallel/test-stream2-set-encoding.js#block_02_block_02`
- `parallel/test-stream2-set-encoding.js#block_03_block_03`
- `parallel/test-stream2-set-encoding.js#block_04_block_04`
- `parallel/test-stream2-set-encoding.js#block_05_block_05`
- `parallel/test-stream2-set-encoding.js#block_06_block_06`
- `parallel/test-stream2-set-encoding.js#block_07_block_07`
- `parallel/test-stream2-set-encoding.js#block_08_block_08`
- `parallel/test-stream2-transform.js#block_00_block_00`
- `parallel/test-stream2-transform.js#block_01_block_01`
- `parallel/test-stream2-transform.js#block_02_block_02`
- `parallel/test-stream2-transform.js#block_03_block_03`
- `parallel/test-stream2-transform.js#block_04_block_04`
- `parallel/test-stream2-transform.js#block_05_block_05`
- `parallel/test-stream2-transform.js#block_06_block_06`
- `parallel/test-stream2-transform.js#block_07_block_07`
- `parallel/test-stream2-transform.js#block_08_block_08`
- `parallel/test-stream2-transform.js#block_09_block_09`
- `parallel/test-stream2-transform.js#block_10_that_has_empty_transforms`
- `parallel/test-stream2-transform.js#block_11_block_11`
- `parallel/test-stream2-transform.js#block_12_block_12`
- `parallel/test-stream2-transform.js#block_13_block_13`
- `parallel/test-stream2-transform.js#block_14_block_14`
- `parallel/test-stream2-transform.js#block_15_block_15`
- `parallel/test-stream2-unpipe-drain.js`
- `parallel/test-stream2-unpipe-leak.js`
- `parallel/test-stream2-writable.js#block_00_block_00`
- `parallel/test-stream2-writable.js#block_02_block_02`
- `parallel/test-stream2-writable.js#block_03_block_03`
- `parallel/test-stream2-writable.js#block_04_block_04`
- `parallel/test-stream2-writable.js#block_06_block_06`
- `parallel/test-stream2-writable.js#block_07_block_07`
- `parallel/test-stream2-writable.js#block_08_block_08`
- `parallel/test-stream2-writable.js#block_09_block_09`
- `parallel/test-stream2-writable.js#block_10_block_10`
- `parallel/test-stream2-writable.js#block_11_block_11`
- `parallel/test-stream2-writable.js#block_12_block_12`
- `parallel/test-stream2-writable.js#block_14_block_14`
- `parallel/test-stream2-writable.js#block_15_block_15`
- `parallel/test-stream2-writable.js#block_16_block_16`
- `parallel/test-stream2-writable.js#block_17_block_17`
- `parallel/test-stream2-writable.js#block_18_block_18`
- `parallel/test-stream2-writable.js#block_19_block_19`
- `parallel/test-stream2-writable.js#block_20_block_20`
- `parallel/test-stream2-writable.js#block_21_block_21`
- `parallel/test-stream2-writable.js#block_22_block_22`
- `parallel/test-stream2-writable.js#block_23_block_23`
- `parallel/test-stream3-cork-end.js`
- `parallel/test-stream3-cork-uncork.js`
- `parallel/test-stream3-pause-then-read.js`
- `parallel/test-stream3-pipeline-async-iterator.js`
- `parallel/test-streams-highwatermark.js#block_01_block_01`
- `parallel/test-streams-highwatermark.js#block_02_block_02`
- `parallel/test-streams-highwatermark.js#block_03_block_03`
- `parallel/test-streams-highwatermark.js#block_05_block_05`
- `parallel/test-string-decoder-end.js`
- `parallel/test-string-decoder-fuzz.js`
- `parallel/test-string-decoder.js`
- `parallel/test-sync-fileread.js`
- `parallel/test-sys.js`
- `parallel/test-timers-args.js`
- `parallel/test-timers-clear-null-does-not-throw-error.js`
- `parallel/test-timers-clear-object-does-not-throw-error.js`
- `parallel/test-timers-clear-timeout-interval-equivalent.js`
- `parallel/test-timers-clearImmediate-als.js`
- `parallel/test-timers-clearImmediate.js`
- `parallel/test-timers-dispose.js`
- `parallel/test-timers-immediate-unref-nested-once.js`
- `parallel/test-timers-immediate-unref-simple.js`
- `parallel/test-timers-immediate-unref.js`
- `parallel/test-timers-immediate.js`
- `parallel/test-timers-non-integer-delay.js`
- `parallel/test-timers-process-tampering.js`
- `parallel/test-timers-promises.js`
- `parallel/test-timers-refresh-in-callback.js`
- `parallel/test-timers-reset-process-domain-on-throw.js`
- `parallel/test-timers-same-timeout-wrong-list-deleted.js`
- `parallel/test-timers-setimmediate-infinite-loop.js`
- `parallel/test-timers-this.js`
- `parallel/test-timers-throw-when-cb-not-function.js`
- `parallel/test-timers-timeout-with-non-integer.js`
- `parallel/test-timers-to-primitive.js`
- `parallel/test-timers-to-primitive.js#block_00_block_00`
- `parallel/test-timers-to-primitive.js#block_01_block_01`
- `parallel/test-timers-unenroll-unref-interval.js#block_00_block_00`
- `parallel/test-timers-unenroll-unref-interval.js#block_01_block_01`
- `parallel/test-timers-unref.js`
- `parallel/test-timers-unref.js#block_00_block_00`
- `parallel/test-timers-unref.js#block_01_block_01`
- `parallel/test-timers-unref.js#block_02_see_https_github_com_nodejs_node_v0_x_archive_issues_4261`
- `parallel/test-timers-unrefd-interval-still-fires.js`
- `parallel/test-timers-zero-timeout.js#block_00_https_github_com_joyent_node_issues_2079_zero_timeout_drops_`
- `parallel/test-tls-cli-min-max-conflict.js`
- `parallel/test-tls-enable-keylog-cli.js`
- `parallel/test-tls-env-extra-ca-no-crypto.js`
- `parallel/test-trace-events-api-worker-disabled.js`
- `parallel/test-trace-events-bootstrap.js`
- `parallel/test-trace-events-promises.js`
- `parallel/test-trace-events-vm.js`
- `parallel/test-url-domain-ascii-unicode.js`
- `parallel/test-url-fileurltopath.js`
- `parallel/test-url-fileurltopath.js#test_00_invalid_arguments`
- `parallel/test-url-fileurltopath.js#test_01_input_must_be_a_file_url`
- `parallel/test-url-fileurltopath.js#test_02_fileurltopath_with_host`
- `parallel/test-url-fileurltopath.js#test_03_fileurltopath_with_invalid_path`
- `parallel/test-url-fileurltopath.js#test_04_fileurltopath_with_windows_path`
- `parallel/test-url-fileurltopath.js#test_05_fileurltopath_with_posix_path`
- `parallel/test-url-fileurltopath.js#test_06_options_is_null`
- `parallel/test-url-fileurltopath.js#test_07_defaulttestcases`
- `parallel/test-url-format-invalid-input.js`
- `parallel/test-url-format-whatwg.js`
- `parallel/test-url-format-whatwg.js#test_00_should_format`
- `parallel/test-url-format-whatwg.js#test_01_handle_invalid_arguments`
- `parallel/test-url-format-whatwg.js#test_02_any_falsy_value_other_than_undefined_will_be_treated_as_fals`
- `parallel/test-url-format-whatwg.js#test_03_should_format_with_unicode_true`
- `parallel/test-url-format-whatwg.js#test_04_should_format_tel_prefix`
- `parallel/test-url-format.js`
- `parallel/test-url-parse-format.js`
- `parallel/test-url-parse-format.js#test_00_should_parse_and_format`
- `parallel/test-url-parse-format.js#test_01_parse_result_should_equal_new_url_url`
- `parallel/test-url-parse-invalid-input.js`
- `parallel/test-url-parse-query.js`
- `parallel/test-url-pathtofileurl.js`
- `parallel/test-url-pathtofileurl.js#block_00_block_00`
- `parallel/test-url-pathtofileurl.js#block_01_block_01`
- `parallel/test-url-pathtofileurl.js#block_02_block_02`
- `parallel/test-url-pathtofileurl.js#block_03_block_03`
- `parallel/test-url-pathtofileurl.js#block_04_test_for_non_string_parameter`
- `parallel/test-url-relative.js`
- `parallel/test-url-revokeobjecturl.js`
- `parallel/test-url-urltooptions.js`
- `parallel/test-utf8-scripts.js`
- `parallel/test-util-callbackify.js`
- `parallel/test-util-callbackify.js#block_00_block_00`
- `parallel/test-util-callbackify.js#block_01_block_01`
- `parallel/test-util-callbackify.js#block_02_block_02`
- `parallel/test-util-callbackify.js#block_03_block_03`
- `parallel/test-util-callbackify.js#block_04_block_04`
- `parallel/test-util-callbackify.js#block_05_block_05`
- `parallel/test-util-callbackify.js#block_06_block_06`
- `parallel/test-util-callbackify.js#block_07_block_07`
- `parallel/test-util-callbackify.js#block_08_block_08`
- `parallel/test-util-deprecate-invalid-code.js`
- `parallel/test-util-deprecate.js`
- `parallel/test-util-deprecate.js#block_00_emits_deprecation_only_once_if_same_function_is_called`
- `parallel/test-util-deprecate.js#block_01_emits_deprecation_twice_for_different_functions`
- `parallel/test-util-deprecate.js#block_02_functions`
- `parallel/test-util-format.js`
- `parallel/test-util-format.js#block_00_block_00`
- `parallel/test-util-format.js#block_01_string_format_specifier_including_tostring_properties_on_the`
- `parallel/test-util-format.js#block_02_symbol_toprimitive_handling_for_string_format_specifier`
- `parallel/test-util-format.js#block_03_block_03`
- `parallel/test-util-format.js#block_04_block_04`
- `parallel/test-util-getcallsite.js`
- `parallel/test-util-getcallsites.js`
- `parallel/test-util-getcallsites.js#block_00_block_00`
- `parallel/test-util-getcallsites.js#block_01_block_01`
- `parallel/test-util-getcallsites.js#block_02_guarantee_dot_left_numbers_are_ignored`
- `parallel/test-util-getcallsites.js#block_03_block_03`
- `parallel/test-util-getcallsites.js#block_04_block_04`
- `parallel/test-util-getcallsites.js#block_05_block_05`
- `parallel/test-util-getcallsites.js#block_06_scriptid_is_a_string`
- `parallel/test-util-getcallsites.js#block_07_guarantee_eval_will_appear_on_stacktraces_when_using_e`
- `parallel/test-util-getcallsites.js#block_08_guarantee_the_stacktrace_0_is_the_filename`
- `parallel/test-util-getcallsites.js#block_09_error_stacktracelimit_should_not_influence_callsite_size`
- `parallel/test-util-getcallsites.js#block_10_block_10`
- `parallel/test-util-getcallsites.js#block_11_block_11`
- `parallel/test-util-getcallsites.js#block_12_block_12`
- `parallel/test-util-inherits.js`
- `parallel/test-util-inspect-getters-accessing-this.js`
- `parallel/test-util-inspect-getters-accessing-this.js#block_00_block_00`
- `parallel/test-util-inspect-getters-accessing-this.js#block_01_regression_test_for_https_github_com_nodejs_node_issues_3705`
- `parallel/test-util-inspect-long-running.js`
- `parallel/test-util-inspect-namespace.js`
- `parallel/test-util-isDeepStrictEqual.js`
- `parallel/test-util-isDeepStrictEqual.js#block_00_handle_boxed_primitives`
- `parallel/test-util-isDeepStrictEqual.js#block_01_handle_symbols_enumerable_only`
- `parallel/test-util-log.js`
- `parallel/test-util-parse-env.js`
- `parallel/test-util-primordial-monkeypatching.js`
- `parallel/test-util-stripvtcontrolcharacters.js`
- `parallel/test-util-styletext.js`
- `parallel/test-util-text-decoder.js`
- `parallel/test-util-types-exists.js`
- `parallel/test-v8-coverage.js`
- `parallel/test-v8-coverage.js#block_00_outputs_coverage_when_event_loop_is_drained_with_no_async_lo`
- `parallel/test-v8-coverage.js#block_01_outputs_coverage_when_error_is_thrown_in_first_tick`
- `parallel/test-v8-coverage.js#block_02_outputs_coverage_when_process_exit_1_exits_process`
- `parallel/test-v8-coverage.js#block_03_outputs_coverage_when_process_kill_process_pid_sigint_exits_`
- `parallel/test-v8-coverage.js#block_04_outputs_coverage_from_subprocess`
- `parallel/test-v8-coverage.js#block_05_outputs_coverage_from_worker`
- `parallel/test-v8-coverage.js#block_06_does_not_output_coverage_if_node_v8_coverage_is_empty`
- `parallel/test-v8-coverage.js#block_07_disables_async_hooks_before_writing_coverage`
- `parallel/test-v8-coverage.js#block_08_outputs_coverage_when_the_coverage_directory_is_not_absolute`
- `parallel/test-v8-flag-pool-size-0.js`
- `parallel/test-v8-global-setter.js`
- `parallel/test-v8-stop-coverage.js`
- `parallel/test-v8-take-coverage-noop.js`
- `parallel/test-v8-take-coverage.js`
- `parallel/test-vm-api-handles-getter-errors.js`
- `parallel/test-vm-context-async-script.js`
- `parallel/test-vm-create-context-circular-reference.js`
- `parallel/test-vm-cross-context.js`
- `parallel/test-vm-data-property-writable.js`
- `parallel/test-vm-deleting-property.js`
- `parallel/test-vm-global-assignment.js`
- `parallel/test-vm-global-configurable-properties.js`
- `parallel/test-vm-global-get-own.js`
- `parallel/test-vm-module-reevaluate.js`
- `parallel/test-vm-new-script-new-context.js#block_00_block_00`
- `parallel/test-vm-new-script-new-context.js#block_01_block_01`
- `parallel/test-vm-new-script-new-context.js#block_02_block_02`
- `parallel/test-vm-new-script-new-context.js#block_03_block_03`
- `parallel/test-vm-new-script-new-context.js#block_05_block_05`
- `parallel/test-vm-new-script-new-context.js#block_06_block_06`
- `parallel/test-vm-new-script-this-context.js`
- `parallel/test-vm-parse-abort-on-uncaught-exception.js`
- `parallel/test-vm-script-throw-in-tostring.js`
- `parallel/test-vm-set-proto-null-on-globalthis.js`
- `parallel/test-vm-static-this.js`
- `parallel/test-weakref.js`
- `parallel/test-webcrypto-sign-verify.js#block_02_test_sign_verify_ecdsa`
- `parallel/test-webcrypto-sign-verify.js#block_03_test_sign_verify_hmac`
- `parallel/test-webcrypto-sign-verify.js#block_04_test_sign_verify_ed25519`
- `parallel/test-websocket-disabled.js`
- `parallel/test-webstorage.js#test_00_disabled_without_experimental_webstorage`
- `parallel/test-webstream-string-tag.js`
- `parallel/test-webstreams-compose.js#block_06_block_06`
- `parallel/test-webstreams-compose.js#block_16_block_16`
- `parallel/test-webstreams-compose.js#block_17_block_17`
- `parallel/test-webstreams-pipeline.js#block_05_block_05`
- `parallel/test-webstreams-pipeline.js#block_11_block_11`
- `parallel/test-webstreams-pipeline.js#block_12_block_12`
- `parallel/test-webstreams-pipeline.js#block_15_block_15`
- `parallel/test-webstreams-pipeline.js#block_16_block_16`
- `parallel/test-whatwg-encoding-custom-api-basics.js`
- `parallel/test-whatwg-encoding-custom-textdecoder-ignorebom.js`
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_00_block_00`
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_01_block_01`
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_02_block_02`
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_03_block_03`
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_04_block_04`
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_05_block_05`
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_07_block_07`
- `parallel/test-whatwg-events-customevent.js#block_00_block_00`
- `parallel/test-whatwg-events-customevent.js#block_02_block_02`
- `parallel/test-whatwg-readablebytestreambyob.js`
- `parallel/test-whatwg-url-custom-deepequal.js`
- `parallel/test-whatwg-url-override-hostname.js`
- `parallel/test-worker-cleanexit-with-moduleload.js`
- `parallel/test-worker-dns-terminate-during-query.js`
- `parallel/test-worker-load-file-with-extension-other-than-js.js`
- `parallel/test-worker-message-channel.js#block_00_block_00`
- `parallel/test-worker-message-port-close-while-receiving.js`
- `parallel/test-worker-message-port-close.js#block_03_refs_https_github_com_nodejs_node_issues_42296`
- `parallel/test-worker-message-port-multiple-sharedarraybuffers.js`
- `parallel/test-worker-message-port-transfer-terminate.js`
- `parallel/test-worker-nested-uncaught.js`
- `parallel/test-worker-on-process-exit.js`
- `parallel/test-worker-onmessage-not-a-function.js`
- `parallel/test-worker-ref-onexit.js`
- `parallel/test-worker-stack-overflow.js`
- `parallel/test-worker-terminate-http2-respond-with-file.js`
- `parallel/test-worker-workerdata-messageport.js#block_00_block_00`
- `parallel/test-worker-workerdata-messageport.js#block_01_block_01`
- `parallel/test-worker-workerdata-messageport.js#block_04_block_04`
- `parallel/test-zlib-brotli-flush.js`
- `parallel/test-zlib-brotli-from-brotli.js`
- `parallel/test-zlib-brotli-from-string.js`
- `parallel/test-zlib-brotli-kmaxlength-rangeerror.js`
- `parallel/test-zlib-brotli.js`
- `parallel/test-zlib-brotli.js#block_00_block_00`
- `parallel/test-zlib-brotli.js#block_01_block_01`
- `parallel/test-zlib-brotli.js#block_02_block_02`
- `parallel/test-zlib-close-after-write.js`
- `parallel/test-zlib-close-in-ondata.js`
- `parallel/test-zlib-const.js`
- `parallel/test-zlib-convenience-methods.js`
- `parallel/test-zlib-crc32.js`
- `parallel/test-zlib-create-raw.js`
- `parallel/test-zlib-create-raw.js#block_00_block_00`
- `parallel/test-zlib-create-raw.js#block_01_block_01`
- `parallel/test-zlib-deflate-constructors.js`
- `parallel/test-zlib-deflate-raw-inherits.js`
- `parallel/test-zlib-destroy.js#block_01_block_01`
- `parallel/test-zlib-dictionary-fail.js`
- `parallel/test-zlib-dictionary-fail.js#block_00_block_00`
- `parallel/test-zlib-dictionary-fail.js#block_01_block_01`
- `parallel/test-zlib-dictionary-fail.js#block_02_block_02`
- `parallel/test-zlib-dictionary.js`
- `parallel/test-zlib-empty-buffer.js`
- `parallel/test-zlib-failed-init.js`
- `parallel/test-zlib-failed-init.js#block_00_block_00`
- `parallel/test-zlib-failed-init.js#block_01_block_01`
- `parallel/test-zlib-flush-drain.js`
- `parallel/test-zlib-flush-flags.js`
- `parallel/test-zlib-flush-write-sync-interleaved.js`
- `parallel/test-zlib-flush.js`
- `parallel/test-zlib-from-concatenated-gzip.js`
- `parallel/test-zlib-from-gzip-with-trailing-garbage.js`
- `parallel/test-zlib-from-gzip.js`
- `parallel/test-zlib-from-string.js`
- `parallel/test-zlib-invalid-arg-value-brotli-compress.js`
- `parallel/test-zlib-kmaxlength-rangeerror.js`
- `parallel/test-zlib-maxOutputLength.js`
- `parallel/test-zlib-no-stream.js`
- `parallel/test-zlib-not-string-or-buffer.js`
- `parallel/test-zlib-object-write.js`
- `parallel/test-zlib-params.js`
- `parallel/test-zlib-random-byte-pipes.js`
- `parallel/test-zlib-reset-before-write.js`
- `parallel/test-zlib-sync-no-event.js`
- `parallel/test-zlib-truncated.js`
- `parallel/test-zlib-unused-weak.js`
- `parallel/test-zlib-unzip-one-byte-chunks.js`
- `parallel/test-zlib-write-after-close.js`
- `parallel/test-zlib-write-after-end.js`
- `parallel/test-zlib-write-after-flush.js`
- `parallel/test-zlib-zero-byte.js`
- `parallel/test-zlib-zero-windowBits.js`
- `parallel/test-zlib-zero-windowBits.js#test_00_zlib_should_support_zero_windowbits`
- `parallel/test-zlib-zero-windowBits.js#test_01_windowbits_should_be_valid`
- `parallel/test-zlib.js`
- `sequential/test-cli-syntax-bad.js`
- `sequential/test-cli-syntax-file-not-found.js`
- `sequential/test-cli-syntax-good.js`
- `sequential/test-deprecation-flags.js`
- `sequential/test-fs-opendir-recursive.js#block_01_block_01`
- `sequential/test-fs-opendir-recursive.js#block_02_block_02`
- `sequential/test-fs-opendir-recursive.js#block_03_block_03`
- `sequential/test-fs-opendir-recursive.js#block_06_block_06`
- `sequential/test-fs-readdir-recursive.js`
- `sequential/test-fs-readdir-recursive.js#block_00_readdirsync_recursive`
- `sequential/test-fs-readdir-recursive.js#block_01_readdirsync_recursive_withfiletypes`
- `sequential/test-fs-readdir-recursive.js#block_02_readdir_recursive_callback`
- `sequential/test-fs-readdir-recursive.js#block_03_readdir_recursive_withfiletypes_callback`
- `sequential/test-fs-readdir-recursive.js#block_04_fs_promises_readdir_recursive`
- `sequential/test-fs-readdir-recursive.js#block_05_fs_promises_readdir_recursive_withfiletypes`
- `sequential/test-fs-watch.js#block_03_not_block_the_event_loop`
- `sequential/test-fs-watch.js#block_04_https_github_com_joyent_node_issues_6690`
- `sequential/test-fs-watch.js#block_05_block_05`
- `sequential/test-net-better-error-messages-port.js`
- `sequential/test-net-connect-handle-econnrefused.js`
- `sequential/test-net-connect-local-error.js`
- `sequential/test-net-server-address.js#block_01_test_on_ipv6_server`
- `sequential/test-net-server-address.js#block_02_test_without_hostname_or_ip`
- `sequential/test-net-server-address.js#block_03_test_without_hostname_or_port`
- `sequential/test-net-server-address.js#block_04_test_without_hostname_but_with_a_false_y_port`
- `sequential/test-net-server-listen-ipv6-link-local.js`
- `sequential/test-process-warnings.js`
- `sequential/test-require-cache-without-stat.js`
- `sequential/test-stream2-fs.js`

## Failing Tests

### abort

- `parallel/test-abortcontroller.js#test_12_abortsignal_timeout_does_not_prevent_the_signal_from_being_c`: Expected values to be strictly equal: + actual - expected  + AbortSignal { +   _listeners: [Object: null prototype] {} + } - undefined  AssertionError: Expected values to be strictly equal: + actual -...
- `parallel/test-abortcontroller.js#test_13_abortsignal_with_a_timeout_is_not_collected_while_there_is_a`: Expected values to be strictly equal: + actual - expected  + AbortSignal { +   _listeners: [Object: null prototype] { +     abort: [] +   } + } - undefined  AssertionError: Expected values to be stric...
- `parallel/test-aborted-util.js#test_00_aborted_works_when_provided_a_resource`: not a function     at <anonymous> (/home/node/test/parallel/test-aborted-util.js:21:27)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymous> (/home/...
- `parallel/test-aborted-util.js#test_01_aborted_with_gc_cleanup`: not a function     at <anonymous> (/home/node/test/parallel/test-aborted-util.js:32:34)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymous> (/home/...
- `parallel/test-aborted-util.js#test_02_fails_with_error_if_not_provided_abortsignal`: not a function     at <anonymous> (/home/node/test/parallel/test-aborted-util.js:51:21)     at map (native)     at <anonymous> (/home/node/test/parallel/test-aborted-util.js:50:95)     at call (native...
- `parallel/test-aborted-util.js#test_03_fails_if_not_provided_a_resource`: not a function     at <anonymous> (/home/node/test/parallel/test-aborted-util.js:61:21)     at map (native)     at <anonymous> (/home/node/test/parallel/test-aborted-util.js:60:72)     at call (native...
- `parallel/test-aborted-util.js#test_04_does_not_hang_forever`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-abortsignal-cloneable.js#test_00_can_create_a_transferable_abort_controller`: not a function     at <anonymous> (/home/node/test/parallel/test-abortsignal-cloneable.js:17:14)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymous...
- `parallel/test-abortsignal-cloneable.js#test_01_can_create_a_transferable_abort_signal`: not a function     at <anonymous> (/home/node/test/parallel/test-abortsignal-cloneable.js:60:54)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymous...
- `parallel/test-abortsignal-cloneable.js#test_02_a_cloned_abortsignal_does_not_keep_the_event_loop_open`: not a function     at <anonymous> (/home/node/test/parallel/test-abortsignal-cloneable.js:77:14)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymous...

### assert

- `parallel/test-assert-deep-with-error.js`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' + +     '... Skipped lines\n'...
- `parallel/test-assert-deep-with-error.js#test_00_handle_error_causes`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' + +     '... Skipped lines\n'...
- `parallel/test-assert-deep-with-error.js#test_01_handle_undefined_causes`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' + +     '... Skipped lines\n'...
- `parallel/test-assert-deep.js`: Expected values to be strictly deep-equal: + actual - expected ... Skipped lines    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' +       '\n...
- `parallel/test-assert-deep.js#test_22_check_extra_properties_on_errors`: Expected values to be strictly deep-equal: + actual - expected ... Skipped lines    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' +       '\n...
- `parallel/test-assert-deep.js#test_23_check_proxies`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' +       '\n' + +     '+ Proxy...
- `parallel/test-assert-deep.js#test_36_verify_object_types_being_identical_on_both_sides`: not a TypedArray     at get length (native)     at formatTypedArray (__wasm_rquickjs_builtin/internal/util/inspect:1486:24)     at formatRaw (__wasm_rquickjs_builtin/internal/util/inspect:978:28)     ...
- `parallel/test-assert-first-line.js`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'The expression evaluated to a falsy value:\n\n  ässört(null)\n', -   message: "The expression evaluated t...
- `parallel/test-assert-if-error.js`: Expected values to be strictly equal: + actual - expected  + 'Error: test error\n' + +   '    at c (/home/node/test/parallel/test-assert-if-error.js:13:19)\n' + +   '    at b (/home/node/test/parallel...
- `parallel/test-assert-if-error.js#test_00_test_that_assert_iferror_has_the_correct_stack_trace_of_both`: Expected values to be strictly equal: + actual - expected  + 'Error: test error\n' + +   '    at c (/home/node/test/parallel/test-assert-if-error.js:14:19)\n' + +   '    at b (/home/node/test/parallel...
- `parallel/test-assert.js`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_ASSERTION',     message: 'Expected "actual" to be reference-equal to "expected":\n' +       '+ actual - ex...
- `parallel/test-assert.js#test_03_assert_throws`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_ASSERTION',     message: 'Expected "actual" to be reference-equal to "expected":\n' +       '+ actual - ex...
- `parallel/test-assert.js#test_15_throws_accepts_objects`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     message: 'The expression evaluated to a falsy value:\n' +       '\n' + +     "  assert.ok((() => Boolean('\\\\x01' ==...

### async_hooks

- `parallel/test-async-hooks-destroy-on-gc.js`: mustCall verification failed: mustCallAtLeast: expected at least 1 calls, got 0     at mustCallAtLeast (/home/node/test/common/index.js:516:28)     at <anonymous> (/home/node/test/parallel/test-async-...
- `parallel/test-async-hooks-disable-during-promise.js`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-async-hooks-disable...
- `parallel/test-async-hooks-disable-gc-tracking.js`: mustCall verification failed: mustCallAtLeast: expected at least 1 calls, got 0     at mustCallAtLeast (/home/node/test/common/index.js:516:28)     at <anonymous> (/home/node/test/parallel/test-async-...
- `parallel/test-async-hooks-enable-disable.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-async-hooks-enable-...
- `parallel/test-async-hooks-enable-during-promise.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-async-hooks-enable-...
- `parallel/test-async-hooks-enable-recursive.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-async-hooks-enable-...
- `parallel/test-async-hooks-prevent-double-destroy.js`: mustCall verification failed: mustCallAtLeast: expected at least 1 calls, got 0     at mustCallAtLeast (/home/node/test/common/index.js:516:28)     at <anonymous> (/home/node/test/parallel/test-async-...
- `parallel/test-async-hooks-worker-asyncfn-terminate-1.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-async-hooks-worker-...
- `parallel/test-async-hooks-worker-asyncfn-terminate-2.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-async-hooks-worker-...
- `parallel/test-async-hooks-worker-asyncfn-terminate-3.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-async-hooks-worker-...
- `parallel/test-async-hooks-worker-asyncfn-terminate-4.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-async-hooks-worker-...

### buffer

- `parallel/test-buffer-constructor-deprecation-error.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-buffer-constructor-...
- `parallel/test-buffer-constructor-outside-node-modules.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-buffer-constructor-...
- `parallel/test-buffer-pending-deprecation.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-buffer-pending-depr...

### child_process

- `parallel/test-child-process-constructor.js#block_00_block_00`: ChildProcess is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at ChildProcess (node:child_process:1056:15)     at <anonymous> (/home/node/test/...
- `parallel/test-child-process-constructor.js#block_01_block_01`: ChildProcess is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at ChildProcess (node:child_process:1056:15)     at <anonymous> (/home/node/test/...
- `parallel/test-child-process-constructor.js#block_02_block_02`: ChildProcess is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at ChildProcess (node:child_process:1056:15)     at <anonymous> (/home/node/test/...
- `parallel/test-child-process-constructor.js#block_03_block_03`: ChildProcess is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at ChildProcess (node:child_process:1056:15)     at <anonymous> (/home/node/test/...
- `parallel/test-child-process-cwd.js#block_00_assume_does_not_exist_doesn_t_exist_expect_exitcode_1_and_er`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at testCwd (/home/node/test/parallel/test-chil...
- `parallel/test-child-process-cwd.js#block_01_block_01`: The input did not match the regular expression /The URL must be of scheme file/. Input:  'Error: spawn is not supported in WebAssembly environment'  AssertionError: The input did not match the regular...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   cause: DOMException...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   cause: Error: boom ...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   cause: 'boom', -   ...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_03_block_03`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-child-process-exec-abortcontroller-promisified.js:25:1...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_04_block_04`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-child-process-exec-abortcontroller-promisified.js:28:1...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_05_block_05`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   name: 'AbortError' ...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_06_block_06`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   cause: Error: boom ...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_07_block_07`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   cause: 'boom', -   ...
- `parallel/test-child-process-exec-cwd.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-child-process-ex...
- `parallel/test-child-process-exec-maxbuf.js`: cannot read property 'setEncoding' of null     at <anonymous> (/home/node/test/parallel/test-child-process-exec-maxbuf.js:122:3)     at loadModule (node:module:866:32)     at localRequire (node:module...
- `parallel/test-child-process-exec-maxbuf.js#block_08_block_08`: cannot read property 'setEncoding' of null     at <anonymous> (/home/node/test/parallel/test-child-process-exec-maxbuf.js:61:3)     at loadModule (node:module:866:32)     at localRequire (node:module:...
- `parallel/test-child-process-exec-maxbuf.js#block_09_block_09`: cannot read property 'setEncoding' of null     at <anonymous> (/home/node/test/parallel/test-child-process-exec-maxbuf.js:63:3)     at loadModule (node:module:866:32)     at localRequire (node:module:...
- `parallel/test-child-process-execFile-promisified-abortController.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   name: 'AbortError' ...
- `parallel/test-child-process-execFile-promisified-abortController.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   name: 'AbortError' ...
- `parallel/test-child-process-execFile-promisified-abortController.js#block_02_block_02`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-child-process-execFile-promisified-abortController.js:...
- `parallel/test-child-process-execFile-promisified-abortController.js#block_03_block_03`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-child-process-execFile-promisified-abortController.js:...
- `parallel/test-child-process-execfile-maxbuf.js#block_06_block_06`: cannot read property 'setEncoding' of null     at <anonymous> (/home/node/test/parallel/test-child-process-execfile-maxbuf.js:38:3)     at loadModule (node:module:866:32)     at localRequire (node:mod...
- `parallel/test-child-process-execfile-maxbuf.js#block_07_block_07`: cannot read property 'setEncoding' of null     at <anonymous> (/home/node/test/parallel/test-child-process-execfile-maxbuf.js:40:3)     at loadModule (node:module:866:32)     at localRequire (node:mod...
- `parallel/test-child-process-execfile.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-child-process-ex...
- `parallel/test-child-process-execfile.js#block_05_block_05`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-child-process-execfile.js:28:10)     at loadModule (no...
- `parallel/test-child-process-execfile.js#block_07_verify_the_execfile_stdout_is_the_same_as_execfilesync`: Command failed: echo foo bar      at execFileSync (node:child_process:1262:112)     at <anonymous> (/home/node/test/parallel/test-child-process-execfile.js:39:45)     at forEach (native)     at <anony...
- `parallel/test-child-process-execfilesync-maxbuf.js#block_00_verify_that_an_error_is_returned_if_maxbuffer_is_surpassed`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-child-process-execfilesync-maxbuf.js:20:10)     at loadModule (node:module:866...
- `parallel/test-child-process-execfilesync-maxbuf.js#block_02_default_maxbuffer_size_is_1024_1024`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-child-process-execfilesync-maxbuf.js:26:10)     at loadModule (node:module:866...
- `parallel/test-child-process-execsync-maxbuf.js#block_00_verify_that_an_error_is_returned_if_maxbuffer_is_surpassed`: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^  AssertionError: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^    ...
- `parallel/test-child-process-execsync-maxbuf.js#block_01_verify_that_a_maxbuffer_size_of_infinity_works`: execSync is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at execSync (node:child_process:1281:11)     at <anonymous> (/home/node/test/parallel...
- `parallel/test-child-process-execsync-maxbuf.js#block_02_default_maxbuffer_size_is_1024_1024`: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^  AssertionError: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^    ...
- `parallel/test-child-process-execsync-maxbuf.js#block_03_default_maxbuffer_size_is_1024_1024`: execSync is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at execSync (node:child_process:1281:11)     at <anonymous> (/home/node/test/parallel...
- `parallel/test-child-process-fork-args.js#block_00_and_be_of_type_string`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-child-process-fork-args.js:25:12)     at forEach (nati...
- `parallel/test-child-process-fork-args.js#block_01_correctly_if_args_is_undefined_or_null`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   name: 'Error' -   code: 'ERR_INVALID_ARG_TYPE', -   name: 'TypeError'   }  AssertionError: Expect...
- `parallel/test-child-process-fork-args.js#block_02_ensure_that_the_third_argument_should_be_type_of_object_if_p`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-child-process-fork-args.js:30:7)     at forEach (nativ...
- `parallel/test-child-process-fork-close.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-child-process-fork-...
- `parallel/test-child-process-fork-net-server.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-child-process-fork-...
- `parallel/test-child-process-fork-net-socket.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-child-process-fork-...
- `parallel/test-child-process-fork-ref2.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-child-process-fork-...
- `parallel/test-child-process-internal.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-child-process-inter...
- `parallel/test-child-process-ipc-next-tick.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-child-process-ipc-n...
- `parallel/test-child-process-promisified.js#block_00_block_00`: The expression evaluated to a falsy value:    assert(promise.child instanceof child_process.ChildProcess)  AssertionError: The expression evaluated to a falsy value:    assert(promise.child instanceof...
- `parallel/test-child-process-promisified.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(promise.child instanceof child_process.ChildProcess)  AssertionError: The expression evaluated to a falsy value:    assert(promise.child instanceof...
- `parallel/test-child-process-promisified.js#block_02_block_02`: The expression evaluated to a falsy value:    assert(promise.child instanceof child_process.ChildProcess)  AssertionError: The expression evaluated to a falsy value:    assert(promise.child instanceof...
- `parallel/test-child-process-promisified.js#block_03_block_03`: The expression evaluated to a falsy value:    assert(promise.child instanceof child_process.ChildProcess)  AssertionError: The expression evaluated to a falsy value:    assert(promise.child instanceof...
- `parallel/test-child-process-promisified.js#block_04_block_04`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - '42\n'      at <anonymous> (/home/node/test/parallel/test-child-process-promisifie...
- `parallel/test-child-process-promisified.js#block_05_block_05`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - '42\n'      at <anonymous> (/home/node/test/parallel/test-child-process-promisifie...
- `parallel/test-child-process-send-cb.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-child-process-send-...
- `parallel/test-child-process-send-returns-boolean.js#block_01_block_01`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-send-utf8.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-child-process-send-...
- `parallel/test-child-process-server-close.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home/node/test/parallel/test-child-proc...
- `parallel/test-child-process-spawn-controller.js#block_00_block_00`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawn-controller.js#block_01_block_01`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawn-controller.js#block_02_block_02`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawn-controller.js#block_03_block_03`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawn-controller.js#block_04_block_04`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawn-controller.js#block_05_block_05`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawn-controller.js#block_06_block_06`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawn-controller.js#block_07_block_07`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawn-controller.js#block_08_block_08`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawn-timeout-kill-signal.js#block_00_block_00`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawn-timeout-kill-signal.js#block_01_block_01`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawn-timeout-kill-signal.js#block_02_block_02`: The input did not match the regular expression /ERR_OUT_OF_RANGE/. Input:  'Error: spawn is not supported in WebAssembly environment'  AssertionError: The input did not match the regular expression /E...
- `parallel/test-child-process-spawn-timeout-kill-signal.js#block_03_block_03`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-spawnsync-maxbuf.js#block_00_verify_that_an_error_is_returned_if_maxbuffer_is_surpassed`: maxBuffer should error AssertionError: maxBuffer should error     at <anonymous> (/home/node/test/parallel/test-child-process-spawnsync-maxbuf.js:22:13)     at loadModule (node:module:866:32)     at l...
- `parallel/test-child-process-spawnsync-maxbuf.js#block_02_default_maxbuffer_size_is_1024_1024`: maxBuffer should error AssertionError: maxBuffer should error     at <anonymous> (/home/node/test/parallel/test-child-process-spawnsync-maxbuf.js:29:13)     at loadModule (node:module:866:32)     at l...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_00_block_00`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (/home/node/test/parallel/test-child-process-spa...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_01_block_01`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (/home/node/test/parallel/test-child-process-spa...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_02_block_02`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (/home/node/test/parallel/test-child-process-spa...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_03_block_03`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (/home/node/test/parallel/test-child-process-spa...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_04_block_04`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (/home/node/test/parallel/test-child-process-spa...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_05_block_05`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (/home/node/test/parallel/test-child-process-spa...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_06_block_06`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (/home/node/test/parallel/test-child-process-spa...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_07_block_07`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (/home/node/test/parallel/test-child-process-spa...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_08_block_08`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (/home/node/test/parallel/test-child-process-spa...
- `parallel/test-child-process-spawnsync.js#block_00_block_00`: Expected values to be strictly equal:  null !== 0  AssertionError: Expected values to be strictly equal:  null !== 0      at <anonymous> (/home/node/test/parallel/test-child-process-spawnsync.js:34:20...
- `parallel/test-child-process-spawnsync.js#block_01_block_01`: Expected values to be strictly equal:  null !== 0  AssertionError: Expected values to be strictly equal:  null !== 0      at <anonymous> (/home/node/test/parallel/test-child-process-spawnsync.js:34:20...
- `parallel/test-child-process-stdio.js#block_00_test_stdio_piping`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-stdio.js#block_01_test_stdio_ignoring`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-stdio.js#block_02_asset_options_invariance`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-child-process-stdio.js#block_03_test_stdout_buffering`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `sequential/test-child-process-execsync.js#block_00_block_00`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_01_block_01`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_02_block_02`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_03_block_03`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_04_see_https_github_com_nodejs_node_v0_x_archive_issues_7824`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_05_see_https_github_com_nodejs_node_v0_x_archive_issues_7966`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_06_verify_the_execfilesync_behavior_when_the_child_exits_with_a`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...

### cluster

- `parallel/test-cluster-bind-twice.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-cluster-bind-twice....
- `parallel/test-cluster-dgram-2.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at primary (/home/node/test/parallel/test-cluster-dgram-2.js:45:3...
- `parallel/test-cluster-primary-error.js`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-cluster-primary-err...
- `parallel/test-cluster-uncaught-exception.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-cluster-uncaught-ex...

### console

- `parallel/test-console-diagnostics-channels.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-console-diagnostics...

### crypto

- `parallel/test-crypto-dh-modp2.js#block_01_block_01`: No private key set     at <anonymous> (__wasm_rquickjs_builtin/web_crypto:2281:25)     at <anonymous> (/home/node/test/parallel/test-crypto-dh-modp2.js:17:51)     at loadModule (node:module:866:32)   ...
- `parallel/test-crypto-dh-modp2.js#block_02_block_02`: No private key set     at <anonymous> (__wasm_rquickjs_builtin/web_crypto:2281:25)     at <anonymous> (/home/node/test/parallel/test-crypto-dh-modp2.js:19:51)     at loadModule (node:module:866:32)   ...
- `parallel/test-crypto-domains.js`: mustCall verification failed: mustCall: expected exactly 3 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-crypto-domains.js:3...
- `parallel/test-crypto-keygen-async-dsa-key-object.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-crypto-keygen-as...
- `parallel/test-crypto-keygen-async-dsa.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-crypto-keygen-as...
- `parallel/test-crypto-keygen-async-elliptic-curve-jwk-ec.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-crypto-keygen-as...
- `parallel/test-crypto-keygen-async-elliptic-curve-jwk.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-crypto-keygen-as...
- `parallel/test-crypto-keygen-async-encrypted-private-key.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-crypto-keygen-as...
- `parallel/test-crypto-sign-verify.js`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ERR_INVALID_ARG_TYPE', +   name: 'TypeError' -   code: 'ERR_CRYPTO_SIGN_KEY_REQUIRED', -   name: 'Error'   }  ...
- `parallel/test-crypto-sign-verify.js#block_09_test_throws_exception_when_key_options_is_null`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ERR_INVALID_ARG_TYPE', +   name: 'TypeError' -   code: 'ERR_CRYPTO_SIGN_KEY_REQUIRED', -   name: 'Error'   }  ...
- `parallel/test-crypto-sign-verify.js#block_10_block_10`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'not a function', -   code: 'ERR_INVALID_ARG_TYPE', -   message: 'The "algorithm" argument must be of type s...
- `parallel/test-crypto-sign-verify.js#block_11_block_11`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-crypto-sign-verify.js:74:5)     at loadModule (node:module:866:32)     at loca...
- `parallel/test-crypto-sign-verify.js#block_12_block_12`: Failed to parse private key     at createPrivateKeyParseError (__wasm_rquickjs_builtin/web_crypto:1602:21)     at createPrivateKeyFromData (__wasm_rquickjs_builtin/web_crypto:5126:15)     at createPri...
- `parallel/test-crypto-sign-verify.js#block_15_regression_test_for_https_github_com_nodejs_node_issues_4079`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ERR_CRYPTO_SIGN_KEY_REQUIRED', +   message: 'Sign failed' -   code: 'ERR_OSSL_RSA_DIGEST_TOO_BIG_FOR_RSA_KEY',...
- `parallel/test-crypto-sign-verify.js#block_17_block_17`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-crypto-sign-verify.js:175:12)     at loadModule (node:module:866:32)     at lo...
- `parallel/test-crypto-sign-verify.js#block_18_block_18`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ERR_CRYPTO_SIGN_KEY_REQUIRED', +   message: 'Sign key has no native handle (type=dh)' -   code: 'ERR_OSSL_EVP_...

### dgram

- `parallel/test-dgram-address.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Unexpected error on udp4 socket. Error: bind EACCES 127.0.0.1     at <anonymous> (/home/node/test/parallel/test-dgram-ad...
- `parallel/test-dgram-bind-default-address.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-bind-default-...
- `parallel/test-dgram-bind.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-bind.js:29:31...
- `parallel/test-dgram-blocklist.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-blocklist.js:...
- `parallel/test-dgram-blocklist.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-blocklist.js:...
- `parallel/test-dgram-blocklist.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-blocklist.js:...
- `parallel/test-dgram-blocklist.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-blocklist.js:...
- `parallel/test-dgram-close-in-listening.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-close-in-list...
- `parallel/test-dgram-close-is-not-callback.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-close-is-not-...
- `parallel/test-dgram-close-signal.js#block_00_block_00`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-dgram-close-signal.js:10:5)     at loadModule (node:mo...
- `parallel/test-dgram-close-signal.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-close-signal....
- `parallel/test-dgram-close-signal.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-close-signal....
- `parallel/test-dgram-connect-send-callback-buffer-length.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-dgram-connect-se...
- `parallel/test-dgram-connect-send-callback-buffer.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-dgram-connect-se...
- `parallel/test-dgram-connect-send-callback-multi-buffer.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-connect-send-...
- `parallel/test-dgram-connect-send-default-host.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-connect-send-...
- `parallel/test-dgram-connect-send-empty-array.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-connect-send-...
- `parallel/test-dgram-connect-send-empty-buffer.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-connect-send-...
- `parallel/test-dgram-connect-send-empty-packet.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-connect-send-...
- `parallel/test-dgram-connect-send-multi-buffer-copy.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-dgram-connect-se...
- `parallel/test-dgram-connect-send-multi-string-array.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-connect-send-...
- `parallel/test-dgram-connect.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-connect.js:10...
- `parallel/test-dgram-createSocket-type.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-createSocket-...
- `parallel/test-dgram-createSocket-type.js#block_00_ensure_buffer_sizes_can_be_set`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-createSocket-...
- `parallel/test-dgram-custom-lookup.js`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-dgram-custom-lookup.js:45:44)     at forEach (native) ...
- `parallel/test-dgram-custom-lookup.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-custom-lookup...
- `parallel/test-dgram-custom-lookup.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-custom-lookup...
- `parallel/test-dgram-custom-lookup.js#block_02_block_02`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-dgram-custom-lookup.js:20:44)     at forEach (native) ...
- `parallel/test-dgram-exclusive-implicit-bind.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-exclusive-imp...
- `parallel/test-dgram-implicit-bind.js`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-implicit-bind...
- `parallel/test-dgram-membership.js#block_00_addmembership_on_closed_socket_should_throw`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   message: 'addMembership ENOSYS', -   code: 'ERR_SOCK...
- `parallel/test-dgram-membership.js#block_01_dropmembership_on_closed_socket_should_throw`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   message: 'dropMembership ENOSYS', -   code: 'ERR_SOC...
- `parallel/test-dgram-membership.js#block_02_addmembership_with_no_argument_should_throw`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   message: 'addMembership ENOSYS', +   name: 'Error' -   code: 'ERR_MISSING_ARGS', -   message: /^T...
- `parallel/test-dgram-membership.js#block_03_dropmembership_with_no_argument_should_throw`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   message: 'dropMembership ENOSYS', +   name: 'Error' -   code: 'ERR_MISSING_ARGS', -   message: /^...
- `parallel/test-dgram-membership.js#block_04_addmembership_with_invalid_multicast_address_should_throw`: The input did not match the regular expression /^Error: addMembership EINVAL$/. Input:  'Error: addMembership ENOSYS'  AssertionError: The input did not match the regular expression /^Error: addMember...
- `parallel/test-dgram-membership.js#block_05_dropmembership_with_invalid_multicast_address_should_throw`: The input did not match the regular expression /^Error: dropMembership EINVAL$/. Input:  'Error: dropMembership ENOSYS'  AssertionError: The input did not match the regular expression /^Error: dropMem...
- `parallel/test-dgram-membership.js#block_06_addsourcespecificmembership_with_invalid_sourceaddress_shoul`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   message: 'addSourceSpecificMembership ENOSYS' -   code: 'ERR_INVALID_ARG_TYPE', -   message: 'The...
- `parallel/test-dgram-membership.js#block_07_addsourcespecificmembership_with_invalid_sourceaddress_shoul`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   message: 'addSourceSpecificMembership ENOSYS' -   code: 'ERR_INVALID_ARG_TYPE', -   message: 'The...
- `parallel/test-dgram-membership.js#block_08_addsourcespecificmembership_with_invalid_groupaddress_should`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   message: 'addSourceSpecificMembership ENOSYS' -   code: 'EINVAL', -   message: 'addSourceSpecific...
- `parallel/test-dgram-membership.js#block_09_dropsourcespecificmembership_with_invalid_sourceaddress_shou`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   message: 'dropSourceSpecificMembership ENOSYS' -   code: 'ERR_INVALID_ARG_TYPE', -   message: 'Th...
- `parallel/test-dgram-membership.js#block_10_dropsourcespecificmembership_with_invalid_groupaddress_shoul`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   message: 'dropSourceSpecificMembership ENOSYS' -   code: 'ERR_INVALID_ARG_TYPE', -   message: 'Th...
- `parallel/test-dgram-membership.js#block_11_dropsourcespecificmembership_with_invalid_udp_should_throw`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   message: 'dropSourceSpecificMembership ENOSYS' -   code: 'EINVAL', -   message: 'dropSourceSpecif...
- `parallel/test-dgram-msgsize.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-msgsize.js:31...
- `parallel/test-dgram-multicast-loopback.js#block_00_block_00`: The input did not match the regular expression /^Error: setMulticastLoopback EBADF$/. Input:  'Error: setMulticastLoopback ENOSYS'  AssertionError: The input did not match the regular expression /^Err...
- `parallel/test-dgram-multicast-loopback.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-multicast-loo...
- `parallel/test-dgram-multicast-set-interface.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-multicast-set...
- `parallel/test-dgram-multicast-set-interface.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-multicast-set...
- `parallel/test-dgram-multicast-set-interface.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-multicast-set...
- `parallel/test-dgram-multicast-set-interface.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-multicast-set...
- `parallel/test-dgram-multicast-set-interface.js#block_03_block_03`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-multicast-set...
- `parallel/test-dgram-multicast-set-interface.js#block_04_block_04`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-multicast-set...
- `parallel/test-dgram-multicast-setTTL.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-multicast-set...
- `parallel/test-dgram-oob-buffer.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-oob-buffer.js...
- `parallel/test-dgram-send-address-types.js`: mustCall verification failed: mustCall: expected exactly 4 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-addre...
- `parallel/test-dgram-send-bad-arguments.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-bad-argu...
- `parallel/test-dgram-send-callback-buffer-empty-address.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-callb...
- `parallel/test-dgram-send-callback-buffer-length-empty-address.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-callb...
- `parallel/test-dgram-send-callback-buffer-length.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-callb...
- `parallel/test-dgram-send-callback-buffer.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-callb...
- `parallel/test-dgram-send-callback-multi-buffer-empty-address.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-callb...
- `parallel/test-dgram-send-callback-multi-buffer.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-callback...
- `parallel/test-dgram-send-callback-recursive.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-callback...
- `parallel/test-dgram-send-default-host.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-default-...
- `parallel/test-dgram-send-empty-array.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-empty-ar...
- `parallel/test-dgram-send-empty-buffer.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-empty-bu...
- `parallel/test-dgram-send-empty-packet.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-empty-pa...
- `parallel/test-dgram-send-multi-buffer-copy.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-multi-bu...
- `parallel/test-dgram-send-multi-string-array.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-multi-st...
- `parallel/test-dgram-send-queue-info.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-send-queue-in...
- `parallel/test-dgram-setBroadcast.js#block_00_block_00`: The input did not match the regular expression /^Error: setBroadcast EBADF$/. Input:  'Error: setBroadcast ENOSYS'  AssertionError: The input did not match the regular expression /^Error: setBroadcast...
- `parallel/test-dgram-setBroadcast.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-setBroadcast....
- `parallel/test-dgram-setTTL.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-setTTL.js:8:3...
- `parallel/test-dgram-udp4.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dgram-udp4.js:29:29...

### diagnostics_channel

- `parallel/test-diagnostics-channel-bind-store.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-diagnostics-channel...
- `parallel/test-diagnostics-channel-safe-subscriber-errors.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-diagnostics-channel...
- `parallel/test-diagnostics-channel-udp.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-diagnostics-channel...
- `parallel/test-diagnostics-channel-worker-threads.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-diagnostics-channel...

### dns

- `parallel/test-dns-cancel-reverse-lookup.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dns-cancel-reverse-...
- `parallel/test-dns-channel-cancel-promise.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dns-channel-cancel-...
- `parallel/test-dns-channel-cancel.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dns-channel-cancel....
- `parallel/test-dns-multi-channel.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dns-multi-channel.j...
- `parallel/test-dns-resolveany-bad-ancount.js`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dns-resolveany-bad-...
- `parallel/test-dns-resolveany.js`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-dns-resolveany.js:3...
- `parallel/test-dns-setlocaladdress.js`: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at <anonymous> (/home/node/test/parallel/test-dns-setlocaladdress.js:19:10)     at loadModule (node:module:8...
- `parallel/test-dns-setlocaladdress.js#block_01_verify_that_setlocaladdress_throws_if_called_with_an_invalid`: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at <anonymous> (/home/node/test/parallel/test-dns-setlocaladdress.js:14:10)     at loadModule (node:module:8...
- `parallel/test-dns-setservers-type-check.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'servers must be an array', -   code: 'ERR_INVALID_ARG_TYPE', -   message: 'The "servers" argument must be a...
- `parallel/test-dns-setservers-type-check.js#block_01_block_01`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-dns-setservers-type-check.js:30:7)     at forEach (nat...
- `parallel/test-dns-setservers-type-check.js#block_02_this_test_for_dns_promises`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-dns-setservers-type-check.js:41:12)     at forEach (na...
- `parallel/test-dns.js#block_00_verify_that_setservers_handles_arrays_with_holes_and_other_o`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...
- `parallel/test-dns.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...
- `parallel/test-dns.js#block_02_block_02`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...
- `parallel/test-dns.js#block_03_block_03`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...
- `parallel/test-dns.js#block_04_block_04`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...
- `parallel/test-dns.js#block_05_dns_lookup_should_accept_only_falsey_and_string_values`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...
- `parallel/test-dns.js#block_06_dns_lookup_should_accept_falsey_values`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...
- `parallel/test-dns.js#block_07_block_07`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...
- `parallel/test-dns.js#block_08_block_08`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...
- `parallel/test-dns.js#block_09_block_09`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...
- `parallel/test-dns.js#block_10_block_10`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...
- `parallel/test-dns.js#block_11_block_11`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at <anonymous> (/home/node/tes...

### domain

- `parallel/test-domain-error-types.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-domain-error-types....
- `parallel/test-domain-implicit-binding.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-domain-implicit-bin...
- `parallel/test-domain-implicit-fs.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-domain-implicit-fs....
- `parallel/test-domain-multiple-errors.js`: mustCall verification failed: mustCall: expected exactly 7 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-domain-multiple-err...
- `parallel/test-domain-nexttick.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-domain-nexttick.js:...
- `parallel/test-domain-promise.js#block_00_block_00`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Domain { -   _captureRejections: false, -   _disposed: false, -   _events: [Object...
- `parallel/test-domain-promise.js#block_01_block_01`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Domain { -   _captureRejections: false, -   _disposed: false, -   _events: [Object...
- `parallel/test-domain-promise.js#block_03_block_03`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Domain { -   _captureRejections: false, -   _disposed: false, -   _events: [Object...
- `parallel/test-domain-promise.js#block_05_block_05`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Domain { -   _captureRejections: false, -   _disposed: false, -   _events: [Object...
- `parallel/test-domain-promise.js#block_06_block_06`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Domain { -   _captureRejections: false, -   _disposed: false, -   _events: [Object...
- `parallel/test-domain-promise.js#block_08_block_08`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 2     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-domain-promise.js:3...
- `parallel/test-domain-promise.js#block_09_block_09`: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (/home/node/test/parallel/test-domain-promise.js:34:24)     at apply (native)     at wrapper (/home/node/test/common/...
- `parallel/test-domain-timer.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-domain-timer.js:10:...
- `parallel/test-domain-timers-uncaught-exception.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-domain-timers-uncau...
- `parallel/test-domain-timers.js`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-domain-timers.js:29...
- `parallel/test-domain-uncaught-exception.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at doTest (/home/node/test/parallel/test-domain-uncaught-exceptio...

### events

- `parallel/test-event-emitter-max-listeners-warning-for-null.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-event-emitter-max-l...
- `parallel/test-event-emitter-max-listeners-warning-for-symbol.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-event-emitter-max-l...
- `parallel/test-event-emitter-max-listeners-warning.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-event-emitter-max-l...

### fs

- `parallel/test-file-write-stream3.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-file-write-stream3....
- `parallel/test-file.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected  + Blob { +   size: [Getter: <Inspection threw (private class field '#size' does not exist)>], - Object [Blob] { -   [Symbol(nodejs.util....
- `parallel/test-file.js#block_02_block_02`: Expected values to be strictly equal:  false !== true  AssertionError: Expected values to be strictly equal:  false !== true      at <anonymous> (/home/node/test/parallel/test-file.js:21:24)     at lo...
- `parallel/test-file.js#block_05_block_05`: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   'lastModified', -   'name' - ]  AssertionError: Expected values to be strictly deep-equal: + actual - expected  + [] - [ - ...
- `parallel/test-file.js#block_07_block_07`: Unhandled promise rejection (likely cause of mustCall failure):     at text (__wasm_rquickjs_builtin/http_blob:116:45)     at call (native)     at <anonymous> (/home/node/test/parallel/test-file.js:26...
- `parallel/test-file.js#block_10_block_10`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-file.js:41:12)     at loadModule (node:module:866:32) ...
- `parallel/test-file.js#block_12_block_12`: The expression evaluated to a falsy value:    assert(inspect(file).startsWith('File { size: 0, type: \'\', name: \'\', lastModified:'))  AssertionError: The expression evaluated to a falsy value:    a...
- `parallel/test-file.js#block_14_block_14`: Expected values to be strictly equal:  2 !== 1  AssertionError: Expected values to be strictly equal:  2 !== 1      at <anonymous> (/home/node/test/parallel/test-file.js:44:22)     at loadModule (node...
- `parallel/test-fs-open-no-close.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-fs-open-no-close.js...
- `parallel/test-fs-read-stream-patch-open.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-fs-read-stream-patc...
- `parallel/test-fs-readdir-recursive.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home...
- `parallel/test-fs-readfile-pipe.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-fs-readfile-pipe...
- `parallel/test-fs-readfilesync-pipe-large.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-fs-readfilesync-...
- `parallel/test-fs-realpath-native.js`: ENOENT: no such file or directory, realpath './test/parallel/test-fs-realpath-native.js'     at createSystemError (node:fs:186:21)     at realpathSyncImpl (node:fs:1378:33)     at realpathSyncNative (...
- `parallel/test-fs-stat-bigint.js#block_00_block_00`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at statSync (node:fs:1270:44)     at runSyncTest (/home/node/test/parallel/te...
- `parallel/test-fs-stat-bigint.js#block_01_block_01`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (/home/node/test/parallel/t...
- `parallel/test-fs-stat-bigint.js#block_02_block_02`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (/home/node/test/parallel/t...
- `parallel/test-fs-stat-bigint.js#block_03_block_03`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (/home/node/test/parallel/t...
- `parallel/test-fs-stat-bigint.js#block_04_block_04`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (/home/node/test/parallel/t...
- `parallel/test-fs-stat-bigint.js#block_05_block_05`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (/home/node/test/parallel/t...
- `parallel/test-fs-stat-bigint.js#block_06_block_06`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (/home/node/test/parallel/t...
- `parallel/test-fs-stat-bigint.js#block_07_block_07`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (/home/node/test/parallel/t...
- `parallel/test-fs-stat-bigint.js#block_08_block_08`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (/home/node/test/parallel/t...
- `parallel/test-fs-statfs.js#block_00_synchronous`: not a function     at <anonymous> (/home/node/test/parallel/test-fs-statfs.js:18:42)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-runner:...
- `parallel/test-fs-statfs.js#block_01_synchronous_bigint`: not a function     at <anonymous> (/home/node/test/parallel/test-fs-statfs.js:18:42)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-runner:...
- `parallel/test-fs-stream-construct-compat-error-read.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 2     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-fs-stream-construct...
- `parallel/test-fs-stream-fs-options.js#block_00_block_00`: Missing expected exception (TypeError): createWriteStream options.fs.open should throw if isn't a function AssertionError: Missing expected exception (TypeError): createWriteStream options.fs.open sho...
- `parallel/test-fs-stream-fs-options.js#block_01_block_01`: Missing expected exception (TypeError): createWriteStream options.fs.writev should throw if isn't a function AssertionError: Missing expected exception (TypeError): createWriteStream options.fs.writev...
- `parallel/test-fs-stream-fs-options.js#block_02_block_02`: Missing expected exception (TypeError): createReadStream options.fs.open should throw if isn't a function AssertionError: Missing expected exception (TypeError): createReadStream options.fs.open shoul...
- `parallel/test-fs-stream-options.js#block_00_block_00`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-fs-stream-options.js:11:5)     at loadModule (node:mod...
- `parallel/test-fs-stream-options.js#block_01_block_01`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-fs-stream-options.js:13:5)     at loadModule (node:mod...
- `parallel/test-fs-truncate.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_02_block_02`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_03_block_03`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_04_block_04`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-fs-truncate.js:155:7)     at forEach (native)     at <...
- `parallel/test-fs-truncate.js#block_05_block_05`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_06_block_06`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_07_block_07`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_08_block_08`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_09_block_09`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-utimes.js#block_00_utimes_only_error_cases`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-fs-utimes.js:186:5)     at forEach (native)     at <an...
- `parallel/test-fs-utimes.js#block_01_futimes_only_error_cases`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-fs-utimes.js:177:5)     at forEach (native)     at <an...
- `parallel/test-fs-watch-file-enoent-after-deletion.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-fs-watch-file-enoen...
- `parallel/test-fs-watch-recursive-delete.js`: mustCall verification failed: mustCallAtLeast: expected at least 1 calls, got 0     at mustCallAtLeast (/home/node/test/common/index.js:516:28)     at <anonymous> (/home/node/test/parallel/test-fs-wat...
- `parallel/test-fs-watch-recursive-update-file.js`: mustCall verification failed: mustCallAtLeast: expected at least 1 calls, got 0     at mustCallAtLeast (/home/node/test/common/index.js:516:28)     at <anonymous> (/home/node/test/parallel/test-fs-wat...
- `parallel/test-fs-write-file-sync.js#block_00_test_writefilesync`: Expected values to be strictly equal:  420 !== 493  AssertionError: Expected values to be strictly equal:  420 !== 493      at <anonymous> (/home/node/test/parallel/test-fs-write-file-sync.js:50:47)  ...
- `parallel/test-fs-write-file-sync.js#block_01_test_appendfilesync`: Expected values to be strictly equal:  420 !== 493  AssertionError: Expected values to be strictly equal:  420 !== 493      at <anonymous> (/home/node/test/parallel/test-fs-write-file-sync.js:53:47)  ...
- `parallel/test-fs-write-file-sync.js#block_02_test_writefilesync_with_file_descriptor`: Expected values to be strictly equal:  420 !== 493  AssertionError: Expected values to be strictly equal:  420 !== 493      at <anonymous> (/home/node/test/parallel/test-fs-write-file-sync.js:74:47)  ...
- `parallel/test-fs-write-file-sync.js#block_03_test_writefilesync_with_flags`: Expected values to be strictly equal: + actual - expected  + 'world!' - 'hello world!'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'world!' - 'hello world!'      at <...
- `parallel/test-fs-write-file-sync.js#block_04_test_writefilesync_with_no_flags`: Only 'utf8' encoding is supported     at writeFileSync (node:fs:1053:23)     at <anonymous> (/home/node/test/parallel/test-fs-write-file-sync.js:64:22)     at loadModule (node:module:866:32)     at lo...
- `parallel/test-fs-write-file-sync.js#block_05_test_writefilesync_with_an_invalid_input`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-fs-write-stream-patch-open.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-fs-write-stream-pat...
- `parallel/test-fs-write.js#block_00_block_00`: Expected "actual" to be strictly unequal to:  undefined AssertionError: Expected "actual" to be strictly unequal to:  undefined     at <anonymous> (/home/node/test/parallel/test-fs-write.js:44:23)    ...
- `parallel/test-fs-write.js#block_01_block_01`: Expected "actual" to be strictly unequal to:  undefined AssertionError: Expected "actual" to be strictly unequal to:  undefined     at <anonymous> (/home/node/test/parallel/test-fs-write.js:44:23)    ...
- `parallel/test-fs-write.js#block_02_block_02`: Expected "actual" to be strictly unequal to:  undefined AssertionError: Expected "actual" to be strictly unequal to:  undefined     at <anonymous> (/home/node/test/parallel/test-fs-write.js:44:23)    ...
- `parallel/test-fs-write.js#block_03_block_03`: Expected "actual" to be strictly unequal to:  undefined AssertionError: Expected "actual" to be strictly unequal to:  undefined     at <anonymous> (/home/node/test/parallel/test-fs-write.js:44:23)    ...
- `parallel/test-fs-write.js#block_04_block_04`: Expected "actual" to be strictly unequal to:  undefined AssertionError: Expected "actual" to be strictly unequal to:  undefined     at <anonymous> (/home/node/test/parallel/test-fs-write.js:44:23)    ...
- `parallel/test-fs-writefile-with-fd.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-fs-writefile-with-f...
- `parallel/test-fs-writefile-with-fd.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-fs-writefile-with-f...
- `parallel/test-fs-writefile-with-fd.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-fs-writefile-with-f...
- `parallel/test-fs-writefile-with-fd.js#block_02_test_read_only_file_descriptor`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-fs-writefile-with-f...
- `parallel/test-fs-writefile-with-fd.js#block_03_test_with_an_abortsignal`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-fs-writefile-with-f...
- `sequential/test-fs-opendir-recursive.js#block_00_block_00`: Expected values to be strictly equal:  54 !== 169  AssertionError: Expected values to be strictly equal:  54 !== 169      at assertDirents (/home/node/test/sequential/test-fs-opendir-recursive.js:135:...
- `sequential/test-fs-opendir-recursive.js#block_04_block_04`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly equal:  54 !== 169      at assertDirents (/home/node/test/sequential/test-fs-opendir-recu...
- `sequential/test-fs-opendir-recursive.js#block_05_this_test_asserts_that_the_buffer_size_option_is_respected`: Expected values to be strictly equal:  54 !== 169  AssertionError: Expected values to be strictly equal:  54 !== 169      at assertDirents (/home/node/test/sequential/test-fs-opendir-recursive.js:135:...
- `sequential/test-fs-watch.js#block_01_block_01`: ENOENT: no such file or directory, chdir '/' -> '/tmp/w'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/sequential/test-fs-watch.js:61:17)     at loadModule (node:module:866:3...

### http

- `parallel/test-http-1.0-keep-alive.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at check (/home/node/test/parallel/test-http-1.0-keep-aliv...
- `parallel/test-http-1.0.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at test (/home/node/test/parallel/test-http-1.0.js:36:10) ...
- `parallel/test-http-1.0.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at test (/home/node/test/parallel/test-http-1.0.js:36:10) ...
- `parallel/test-http-1.0.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at test (/home/node/test/parallel/test-http-1.0.js:36:10) ...
- `parallel/test-http-1.0.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at test (/home/node/test/parallel/test-http-1.0.js:36:10) ...
- `parallel/test-http-abort-before-end.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-abort-stream-end.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-aborted.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-aborted.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-aborted.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-close.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-agent-close.js...
- `parallel/test-http-agent-destroyed-socket.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-error-on-idle.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-maxsockets-respected.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-maxsockets.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-maxtotalsockets.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at start (/home/node/te...
- `parallel/test-http-agent-no-protocol.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-null.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-remove.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-timeout.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-timeout.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-timeout.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-timeout.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-agent-timeout.js#block_03_block_03`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-allow-content-length-304.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-allow-req-after-204-res.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-bind-twice.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-byteswritten.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-chunk-extensions-limit.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-chunk-e...
- `parallel/test-http-chunk-extensions-limit.js#block_00_verify_that_chunk_extensions_are_limited_in_size_when_sent_a`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-chunk-e...
- `parallel/test-http-chunk-extensions-limit.js#block_01_verify_that_chunk_extensions_are_limited_in_size_when_sent_i`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-chunk-e...
- `parallel/test-http-chunk-extensions-limit.js#block_02_verify_the_chunk_extensions_is_correctly_reset_after_a_chunk`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-chunk-e...
- `parallel/test-http-chunked-304.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at test (/home/node/tes...
- `parallel/test-http-chunked-smuggling.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-chunked.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-abort-destroy.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-abort-destroy.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-abort-destroy.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-abort-destroy.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-abort-destroy.js#block_03_block_03`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-abort-destroy.js#block_04_block_04`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-abort-destroy.js#block_05_block_05`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-abort-event.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-abort-no-agent.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-abort-response-event.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-abort2.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-aborted-event.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-aborted-event.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-aborted-event.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-agent-abort-close-event.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-agent.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-check-http-token.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-close-with-default-agent.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-encoding.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-get-url.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-input-function.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-keep-alive-hint.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-req-error-dont-double-fire.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-client-req-err...
- `parallel/test-http-client-request-options.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-res-destroyed.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-res-destroyed.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-response-timeout.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-timeout-connect-listener.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-upload-buf.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-client-upload.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-conn-reset.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-content-length-mismatch.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at shouldThrowOnMoreByt...
- `parallel/test-http-contentLength0.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-content...
- `parallel/test-http-date-header.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-date-he...
- `parallel/test-http-decoded-auth.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-decoded...
- `parallel/test-http-default-encoding.js`: Expected values to be strictly equal: + actual - expected  + '' - 'This is a unicode text: سلام'  AssertionError: Expected values to be strictly equal: + actual - expected  + '' - 'This is a unico...
- `parallel/test-http-double-content-length.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-dummy-characters-smuggling.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-dummy-characters-smuggling.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-early-hints.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-early-hints.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-early-hints.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-early-hints.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-early-hints.js#block_03_block_03`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-early-hints.js#block_04_block_04`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-early-hints.js#block_05_block_05`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-eof-on-connect.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-eof-on-...
- `parallel/test-http-extra-response.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-flush-response-headers.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-flush-r...
- `parallel/test-http-generic-streams.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-generic-stream...
- `parallel/test-http-generic-streams.js#block_00_test_1_simple_http_test_no_keep_alive`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-generic-stream...
- `parallel/test-http-generic-streams.js#block_01_test_2_keep_alive_for_2_requests`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-generic-stream...
- `parallel/test-http-generic-streams.js#block_02_test_3_connection_close_request_response_with_chunked`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-generic-stream...
- `parallel/test-http-generic-streams.js#block_03_the_same_as_test_3_but_with_content_length_headers`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-generic-stream...
- `parallel/test-http-generic-streams.js#block_04_test_5_the_client_sends_garbage`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-generic-stream...
- `parallel/test-http-get-pipeline-problem.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-head-request.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at test (/home/node/tes...
- `parallel/test-http-head-response-has-no-body-end-implicit-headers.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-head-response-has-no-body-end.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-head-response-has-no-body.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-head-throw-on-response-body-write.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-head-throw-on-response-body-write.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-head-throw-on-response-body-write.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-head-throw-on-response-body-write.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-header-obstext.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-header-owstext.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at check (/home/node/te...
- `parallel/test-http-header-read.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-header-...
- `parallel/test-http-hex-write.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-host-headers.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at testHttp (/home/node/test/parallel/test-http-host-heade...
- `parallel/test-http-incoming-pipelined-socket-destroy.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-insecure-parser-per-stream.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-insecure-parse...
- `parallel/test-http-insecure-parser-per-stream.js#block_02_test_3_the_client_sends_an_invalid_header`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-insecure-parse...
- `parallel/test-http-insecure-parser-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-insecure-parse...
- `parallel/test-http-insecure-parser.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-invalidheaderfield.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-invalid...
- `parallel/test-http-keep-alive-pipeline-max-requests.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-listening.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-localaddress-bind-error.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-malformed-request.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-max-header-size-per-stream.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-max-header-siz...
- `parallel/test-http-max-header-size-per-stream.js#block_02_test_3_the_client_sends_larger_headers_than_what_would_other`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-max-header-siz...
- `parallel/test-http-max-header-size-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-max-header-siz...
- `parallel/test-http-missing-header-separator-cr.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-missing-header-separator-cr.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-missing-header-separator-cr.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-missing-header-separator-lf.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-missing-header-separator-lf.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-missing-header-separator-lf.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-no-content-length.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-destroyed.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-destroyed.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-destroyed.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-destroyed.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-end-types.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-finish-writable.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-finish.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-outgoin...
- `parallel/test-http-outgoing-finished.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-outgoin...
- `parallel/test-http-outgoing-message-capture-rejection.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-message-capture-rejection.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-message-capture-rejection.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-properties.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-properties.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-properties.js#block_04_block_04`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-writableFinished.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-outgoing-write-types.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-parser-finish-error.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-parser-free.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-parser-multiple-execute.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-parser-multipl...
- `parallel/test-http-pause-no-dump.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-pause-resume-one-end.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-pipe-fs.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-pipeline-socket-parser-typeerror.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-pipelin...
- `parallel/test-http-readable-data-event.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-readabl...
- `parallel/test-http-req-res-close.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-req-res-close.js#block_00_after_res`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-req-res-close.js#block_01_req_should_emit_close_after_res`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-req-res-close.js#block_02_see_https_github_com_nodejs_node_pull_33035_issuecomment_751`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-arguments.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-dont-override-options.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-end-twice.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-request...
- `parallel/test-http-request-end.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-request...
- `parallel/test-http-request-host-header.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-host-header.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-host-header.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-join-authorization-headers.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-join-authorization-headers.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-join-authorization-headers.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-join-authorization-headers.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-large-payload.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-request...
- `parallel/test-http-request-method-delete-payload.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-methods.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-request-smuggling-content-length.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-res-write-end-dont-take-array.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-add-header-after-sent.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-respons...
- `parallel/test-http-response-close.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-close.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-close.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-close.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-cork.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-respons...
- `parallel/test-http-response-multi-content-length.js#block_00_test_adding_an_extra_content_length_header_using_setheader`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at test (/home/node/tes...
- `parallel/test-http-response-multi-content-length.js#block_01_test_adding_an_extra_content_length_header_using_writehead`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at test (/home/node/tes...
- `parallel/test-http-response-readable.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-respons...
- `parallel/test-http-response-remove-header-after-sent.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-respons...
- `parallel/test-http-response-setheaders.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-setheaders.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-setheaders.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-setheaders.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-setheaders.js#block_03_block_03`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-setheaders.js#block_04_block_04`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-setheaders.js#block_05_block_05`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-setheaders.js#block_06_block_06`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-statuscode.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-response-writehead-returns-this.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-respons...
- `parallel/test-http-server-capture-rejections.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-capture-rejections.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-capture-rejections.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-close-idle-wait-response.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-connection-list-when-close.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-connection-list-when-close.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-connections-checking-leak.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at Countdown (/home/node/test/common/countdown.js:13:39)     at <...
- `parallel/test-http-server-delete-parser.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-keep-alive-defaults.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-keep-alive-max-requests-null.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-keep-alive-timeout.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at serverTest (/home/no...
- `parallel/test-http-server-keepalive-end.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-multiple-client-error.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-non-utf8-header.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-non-utf8-header.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-non-utf8-header.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-reject-cr-no-lf.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-unconsume-consume.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-server-unconsume.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-server-...
- `parallel/test-http-server-write-end-after-end.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-set-cookies.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-status-message.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-status-...
- `parallel/test-http-sync-write-error-during-continue.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http-sync-write-err...
- `parallel/test-http-timeout-client-warning.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-timeout-overflow.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-timeout.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-transfer-encoding-repeated-chunked.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-transfer-encoding-smuggling.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-transfer-encoding-smuggling.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-transfer-encoding-smuggling.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-upgrade-server2.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-url.parse-auth-with-header-in-request.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-url.par...
- `parallel/test-http-url.parse-basic.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-url.par...
- `parallel/test-http-url.parse-path.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-url.par...
- `parallel/test-http-url.parse-post.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-url.par...
- `parallel/test-http-url.parse-search.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-http-url.par...
- `parallel/test-http-wget.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-write-empty-string.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-write-head-2.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-write-head-2.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-write-head-2.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-write-head-2.js#block_03_block_03`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http-zerolengthbuffer.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-http2-alpn.js#block_00_block_00`: The validation function is expected to return "true". Received false  Caught error:  Error: http2 is not supported in WebAssembly environment AssertionError: The validation function is expected to ret...
- `parallel/test-http2-alpn.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-capture-rejection.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-capture-rejection.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-capture-rejection.js#block_02_block_02`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-capture-rejection.js#block_03_block_03`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-client-setLocalWindowSize.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-client-setLocalWindowSize.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-client-setLocalWindowSize.js#block_02_block_02`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-client-upload-reject.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http2-compat-client...
- `parallel/test-http2-compat-expect-continue.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-expect-continue.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverrequest-headers.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverrequest-headers.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-end.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-end.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-end.js#block_02_block_02`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-end.js#block_03_block_03`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-end.js#block_04_block_04`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-end.js#block_05_block_05`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-end.js#block_06_block_06`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-end.js#block_07_block_07`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-end.js#block_08_block_08`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-end.js#block_09_block_09`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-write.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-write.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-write.js#block_02_block_02`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-writehead-array.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-writehead-array.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-serverresponse-writehead-array.js#block_02_block_02`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-write-early-hints.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-write-early-hints.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-compat-write-early-hints.js#block_02_block_02`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-connect.js#block_00_check_for_session_connect_callback_and_event`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-connect.js#block_01_check_for_session_connect_callback_on_already_connected_sock`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-connect.js#block_02_check_for_https_as_protocol`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-connect.js#block_03_check_for_session_connect_callback_on_already_connected_tls_`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-connect.js#block_04_check_for_error_for_init_settings_error`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-connect.js#block_05_check_for_error_for_an_invalid_protocol_not_http_or_https`: Expected values to be strictly deep-equal: + actual - expected    Comparison { -   code: 'ERR_HTTP2_UNSUPPORTED_PROTOCOL',     name: 'Error'   }  AssertionError: Expected values to be strictly deep-eq...
- `parallel/test-http2-connect.js#block_06_authority_host_and_authority_port`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-create-client-connect.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-create-client-connect.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-getpackedsettings.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-getpackedsettings.js#block_01_check_if_multiple_custom_settings_can_be_set`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-getpackedsettings.js#block_02_block_02`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-getpackedsettings.js#block_03_check_for_not_passing_settings`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-getpackedsettings.js#block_04_block_04`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-getpackedsettings.js#block_05_block_05`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-getpackedsettings.js#block_06_block_06`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-getpackedsettings.js#block_07_block_07`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-getpackedsettings.js#block_08_block_08`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-getpackedsettings.js#block_09_verify_that_passing_validate_true_does_not_throw`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-getpackedsettings.js#block_10_check_for_maxframesize_failing_the_max_number`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-https-fallback.js#block_00_http_2_http_1_1_server`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-http2-https-fallback.js#block_01_http_2_only_server`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-http2-invalidheaderfield.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-invalidheaderfield.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-invalidheaderfield.js#block_02_block_02`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-invalidheaderfield.js#block_03_block_03`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-origin.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-origin.js#block_01_test_automatically_sending_origin_on_connection_start`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-origin.js#block_02_originset`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-origin.js#block_03_send_them_but_client_will_ignore_them`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-perform-server-handshake.js#block_00_basic_test`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-perform-server-handshake.js#block_01_double_bind_should_fail`: not a function     at <anonymous> (/home/node/test/parallel/test-http2-perform-server-handshake.js:23:32)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest...
- `parallel/test-http2-reset-flood.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-http2-reset-flood.j...
- `parallel/test-http2-server-errors.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-server-errors.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-server-settimeout-no-callback.js#block_00_test_with_server`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-server-settimeout-no-callback.js#block_01_test_with_secure_server`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-server-startup.js#block_00_test_the_plaintext_server_socket_timeout`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-server-startup.js#block_01_test_that_http2_createserver_supports_net_server_options`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-server-startup.js#block_02_test_the_secure_server_socket_timeout`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-server-startup.js#block_03_test_that_http2_createsecureserver_supports_net_server_optio`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-too-many-settings.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-too-many-settings.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-https-agent-create-connection.js#block_00_use_option_connect`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-agent-create-connection.js#block_01_use_port_and_option_connect`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-agent-create-connection.js#block_02_use_port_and_host_and_option_connect`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-agent-create-connection.js#block_03_use_port_and_host_and_option_does_not_have_agentkey`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-agent-create-connection.js#block_04_options_is_null`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-agent-create-connection.js#block_05_options_is_undefined`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-agent-create-connection.js#block_06_options_should_not_be_modified`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-argument-of-creating.js#block_00_test_for_immutable_opts`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-argument-of-creating.js#block_01_validate_that_createserver_can_work_with_the_only_argument_r`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-argument-of-creating.js#block_02_validate_that_createserver_can_work_with_no_arguments`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-argument-of-creating.js#block_03_validate_that_createserver_only_uses_defaults_when_appropria`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-insecure-parse-per-stream.js`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-insecure-parse-per-stream.js#block_02_test_3_the_client_sends_an_invalid_header`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-insecure-parse-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-max-header-size-per-stream.js`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-max-header-size-per-stream.js#block_02_test_3_the_client_sends_larger_headers_than_what_would_other`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-max-header-size-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-set-timeout-server.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at test (/home/node/test/parallel/test-https-set-timeout-server.j...
- `sequential/test-https-server-keep-alive-timeout.js`: mustCall verification failed: mustCall: expected exactly 3 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at serverKeepAliveTimeoutWithPipeline (/home/node/test/sequential...

### module

- `es-module/test-require-module-conditional-exports.js#block_00_if_only_require_exports_are_defined_return_require_exports`: Cannot find module 'dep'     at localRequire (node:module:988:59)     at <anonymous> (/home/node/test/fixtures/es-modules/exports-require-only/load.cjs:1:79)     at loadModule (node:module:866:32)    ...
- `es-module/test-require-module-conditional-exports.js#block_01_if_both_are_defined_require_is_used`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'MODULE_NOT_FOUND' -   code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'   }  AssertionError: Expected values to be strictl...
- `es-module/test-require-module-conditional-exports.js#block_02_if_import_and_default_are_defined_default_is_used`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'MODULE_NOT_FOUND' -   code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'   }  AssertionError: Expected values to be strictl...
- `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_00_a_mjs_b_cjs_c_mjs_a_mjs`: - stderr did not match /Cannot import Module \.\/a\.mjs in a cycle\. \(from .*c\.mjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-cjs-esm-esm.js:13:16)     at loadMod...
- `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_01_b_cjs_c_mjs_a_mjs_b_cjs`: - stderr did not match /Cannot import CommonJS Module \.\/b\.cjs in a cycle\. \(from .*a\.mjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-cjs-esm-esm.js:16:16)     a...
- `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_02_c_mjs_a_mjs_b_cjs_c_mjs`: - stderr did not match /Cannot require\(\) ES Module .*c\.mjs in a cycle\. \(from .*b\.cjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-cjs-esm-esm.js:19:16)     at l...
- `es-module/test-require-module-cycle-esm-cjs-esm.js#block_00_require_a_cjs_a_mjs_b_cjs_a_mjs`: - stderr did not match /Cannot require\(\) ES Module .*a\.mjs in a cycle\. \(from .*require-a\.cjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-cjs-esm.js:13:16)     ...
- `es-module/test-require-module-cycle-esm-cjs-esm.js#block_01_require_b_cjs_b_cjs_a_mjs_b_cjs`: - stderr did not match /Cannot import CommonJS Module \.\/b\.cjs in a cycle\. \(from .*a\.mjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-cjs-esm.js:16:16)     at lo...
- `es-module/test-require-module-cycle-esm-cjs-esm.js#block_02_a_mjs_b_cjs_a_mjs`: - stderr did not match /Cannot require\(\) ES Module .*a\.mjs in a cycle\. \(from .*b\.cjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-cjs-esm.js:19:16)     at loadM...
- `es-module/test-require-module-cycle-esm-cjs-esm.js#block_03_b_cjs_a_mjs_b_cjs`: - stderr did not match /Cannot import CommonJS Module \.\/b\.cjs in a cycle\. \(from .*a\.mjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-cjs-esm.js:22:16)     at lo...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js#block_00_a_mjs_b_mjs_c_cjs_z_mjs_a_mjs`: - stderr did not match /Cannot import Module \.\/a\.mjs in a cycle\. \(from .*z\.mjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js:13:16)     at loa...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js#block_01_b_mjs_c_cjs_z_mjs_a_mjs_b_mjs`: - stderr did not match /Cannot import Module \.\/b\.mjs in a cycle\. \(from .*a\.mjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js:16:16)     at loa...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js#block_02_c_cjs_z_mjs_a_mjs_b_mjs_c_cjs`: - stderr did not match /Cannot import CommonJS Module \.\/c\.cjs in a cycle\. \(from .*b\.mjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js:19:16)  ...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js#block_03_z_mjs_a_mjs_b_mjs_c_cjs_z_mjs`: - stderr did not match /Cannot require\(\) ES Module .*z\.mjs in a cycle\. \(from .*c\.cjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js:23:16)     ...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_02_c_mjs_d_mjs_c_mjs`: - stderr did not match /Cannot import Module \.\/c\.mjs in a cycle\. \(from .*d\.mjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-esm-cjs-esm.js:20:16)     at loadMod...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_03_d_mjs_c_mjs_d_mjs`: - stderr did not match /Cannot require\(\) ES Module .*d\.mjs in a cycle\. \(from .*c\.mjs\)/     at <anonymous> (/home/node/test/es-module/test-require-module-cycle-esm-esm-cjs-esm.js:24:16)     at l...
- `es-module/test-require-module-tla.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'QuickJS library created a unknown error' -   code: 'ERR_REQUIRE_ASYNC_MODULE', -   message: /require\(\) ca...
- `es-module/test-require-module-tla.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'QuickJS library created a unknown error' -   code: 'ERR_REQUIRE_ASYNC_MODULE', -   message: /require\(\) ca...
- `es-module/test-require-module-with-detection.js#block_00_block_00`: Unexpected token 'export'     at /home/node/test/fixtures/es-modules/loose.js:4:10     at compileCjs (node:module:756:30)     at loadModule (node:module:832:41)     at localRequire (node:module:977:34...
- `es-module/test-require-module-with-detection.js#block_01_block_01`: Unexpected token 'export'     at /home/node/test/fixtures/es-modules/package-without-type/noext-esm:2:10     at compileCjs (node:module:756:30)     at loadModule (node:module:832:41)     at localRequi...
- `es-module/test-require-module.js#block_02_test_esm_that_import_cjs`: Could not find export 'π' in module 'home/node/test/fixtures/es-modules/exports-cases.js'     at loadModule (node:module:821:60)     at localRequire (node:module:977:34)     at <anonymous> (/home/nod...
- `es-module/test-require-module.js#block_04_also_test_default_export`: Cannot find module 'dep-without-package-json/dep.js'     at loadModule (node:module:821:60)     at localRequire (node:module:977:34)     at <anonymous> (/home/node/test/es-module/test-require-module.j...
- `parallel/test-require-cache.js`: Expected "actual" to be reference-equal to "expected": + actual - expected  + { - {} +   Dir: [class Dir], +   Dirent: [class Dirent], +   FSWatcher: [class FSWatcher], +   ReadStream: [Function: Read...
- `parallel/test-require-cache.js#block_01_block_01`: Expected "actual" to be reference-equal to "expected": + actual - expected  + { - {} +   Dir: [class Dir], +   Dirent: [class Dirent], +   FSWatcher: [class FSWatcher], +   ReadStream: [Function: Read...
- `parallel/test-require-node-prefix.js#block_00_all_kinds_of_specifiers_should_work_without_issue`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'MODULE_NOT_FOUND', +   message: "Cannot find module 'node:unknown'" -   code: 'ERR_UNKNOWN_BUILTIN_MODULE', - ...
- `parallel/test-require-node-prefix.js#block_01_node_prefixed_require_calls_bypass_the_require_cache`: Expected "actual" to be reference-equal to "expected": + actual - expected  + { - {} +   Dir: [class Dir], +   Dirent: [class Dirent], +   FSWatcher: [class FSWatcher], +   ReadStream: [Function: Read...
- `parallel/test-require-resolve-opts-paths-relative.js#block_00_parent_directory_paths_work_as_intended`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures/module-require/relative/subdir'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-require-...
- `parallel/test-require-resolve-opts-paths-relative.js#block_01_current_directory_paths_work_as_intended`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures/module-require/relative/subdir'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-require-...
- `parallel/test-require-resolve-opts-paths-relative.js#block_02_sub_directory_paths_work_as_intended`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures/module-require/relative/subdir'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-require-...
- `parallel/test-require-resolve.js#block_00_test_require_resolve_paths`: Expected values to be strictly equal: + actual - expected  + '/home/node/test/fixtures/resolve-paths/default/node_modules/dep/index.js' - '/home/node/test/fixtures/resolve-paths/defined/node_modules/d...
- `parallel/test-require-resolve.js#block_01_block_01`: Expected values to be strictly equal: + actual - expected  + '/home/node/test/fixtures/resolve-paths/default/node_modules/dep/index.js' - '/home/node/test/fixtures/resolve-paths/defined/node_modules/d...
- `sequential/test-module-loading.js#block_00_block_00`: Expected "actual" to be reference-equal to "expected": + actual - expected  + <ref *1> { - <ref *2> {     children: [ +     { -     <ref *1> {         children: [],         exports: {           PIPE: ...
- `sequential/test-module-loading.js#block_01_block_01`: Expected "actual" to be reference-equal to "expected": + actual - expected  + <ref *1> { - <ref *2> {     children: [ +     { -     <ref *1> {         children: [],         exports: {           PIPE: ...
- `sequential/test-module-loading.js#block_02_block_02`: Expected "actual" to be reference-equal to "expected": + actual - expected  + <ref *1> { - <ref *2> {     children: [ +     { -     <ref *1> {         children: [],         exports: {           PIPE: ...
- `sequential/test-module-loading.js#block_03_block_03`: Expected "actual" to be reference-equal to "expected": + actual - expected  + <ref *1> { - <ref *2> {     children: [ +     { -     <ref *1> {         children: [],         exports: {           PIPE: ...
- `sequential/test-module-loading.js#block_04_block_04`: Expected "actual" to be reference-equal to "expected": + actual - expected  + <ref *1> { - <ref *2> {     children: [ +     { -     <ref *1> {         children: [],         exports: {           PIPE: ...
- `sequential/test-module-loading.js#block_05_block_05`: Expected "actual" to be reference-equal to "expected": + actual - expected  + <ref *1> { - <ref *2> {     children: [ +     { -     <ref *1> {         children: [],         exports: {           PIPE: ...
- `sequential/test-module-loading.js#block_06_block_06`: Expected "actual" to be reference-equal to "expected": + actual - expected  + <ref *1> { - <ref *2> {     children: [ +     { -     <ref *1> {         children: [],         exports: {           PIPE: ...
- `sequential/test-module-loading.js#block_07_block_07`: Expected "actual" to be reference-equal to "expected": + actual - expected  + <ref *1> { - <ref *2> {     children: [ +     { -     <ref *1> {         children: [],         exports: {           PIPE: ...
- `sequential/test-module-loading.js#block_08_block_08`: Expected "actual" to be reference-equal to "expected": + actual - expected  + <ref *1> { - <ref *2> {     children: [ +     { -     <ref *1> {         children: [],         exports: {           PIPE: ...
- `sequential/test-module-loading.js#block_09_block_09`: Expected "actual" to be reference-equal to "expected": + actual - expected  + <ref *1> { - <ref *2> {     children: [ +     { -     <ref *1> {         children: [],         exports: {           PIPE: ...
- `sequential/test-module-loading.js#block_10_block_10`: Expected "actual" to be reference-equal to "expected": + actual - expected  + <ref *1> { - <ref *2> {     children: [ +     { -     <ref *1> {         children: [],         exports: {           PIPE: ...

### net

- `parallel/test-net-after-close.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-allow-half-open.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-allow-half-open.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-allow-half-open.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-autoselectfamily-commandline-option.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-autoselectfamily-default.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-autoselectfamily-default.js#block_00_test_that_ipv4_is_reached_by_default_if_ipv6_is_not_reachabl`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-autoselectfamily-default.js#block_01_test_that_ipv4_is_not_reached_by_default_if_ipv6_is_not_reac`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-autoselectfamily.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-autoselectfamily.js#block_00_test_that_ipv4_is_reached_if_ipv6_is_not_reachable`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-autoselectfamily.js#block_01_test_that_only_the_last_successful_connection_is_established`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-autoselectfamily.js#block_03_test_that_the_option_can_be_disabled`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-binary.js`: Expected values to be strictly equal:  0 !== 512  AssertionError: Expected values to be strictly equal:  0 !== 512      at <anonymous> (/home/node/test/parallel/test-net-binary.js:79:39)     at emit (...
- `parallel/test-net-bind-twice.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-buffersize.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-bytes-read.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-bytes-stats.js`: Expected values to be strictly equal:  0 !== 12  AssertionError: Expected values to be strictly equal:  0 !== 12      at <anonymous> (/home/node/test/parallel/test-net-bytes-stats.js:76:22)     at emi...
- `parallel/test-net-bytes-written-large.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-bytes-written-large.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-bytes-written-large.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-bytes-written-large.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-can-reset-timeout.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-client-bind-twice.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-connect-abort-controller.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-connect-buffer.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-connect-buffer2.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-connect-call-socket-connect.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-connect-immediate-destroy.js`: cannot read property 'port' of null     at <anonymous> (/home/node/test/parallel/test-net-connect-immediate-destroy.js:7:21)     at loadModule (node:module:866:32)     at localRequire (node:module:977...
- `parallel/test-net-connect-keepalive.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-connect-options-path.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home...
- `parallel/test-net-connect-options-port.js#block_00_test_wrong_type_of_ports`: Missing expected exception (TypeError): createConnectionWithCb(true) AssertionError: Missing expected exception (TypeError): createConnectionWithCb(true)     at syncFailToConnect (/home/node/test/para...
- `parallel/test-net-connect-options-port.js#block_01_test_out_of_range_ports`: Missing expected exception (RangeError): createConnectionWithCb() AssertionError: Missing expected exception (RangeError): createConnectionWithCb()     at syncFailToConnect (/home/node/test/parallel/t...
- `parallel/test-net-connect-options-port.js#block_02_test_invalid_hints`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-net-connect-options-port.js:41:19)     at loadModule (...
- `parallel/test-net-connect-options-port.js#block_03_test_valid_combinations_of_connect_port_and_connect_port_hos`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-connect-reset.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-net-connect-reset.j...
- `parallel/test-net-end-destroyed.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-listen-close-server-callback-is-not-function.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-net-listen-c...
- `parallel/test-net-listen-close-server.js`: Unhandled promise rejection:     at mustNotCall (/home/node/test/common/index.js:526:23)     at apply (native)     at emit (node:events:332:36)     at apply (native)     at emit (node:domain:103:32)  ...
- `parallel/test-net-listen-invalid-port.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-net-listen-i...
- `parallel/test-net-listening.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-perf_hooks.js#block_00_block_00`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-net-perf_hooks.js:38:22)     at emit (...
- `parallel/test-net-perf_hooks.js#block_01_block_01`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-net-perf_hooks.js:38:22)     at emit (...
- `parallel/test-net-pingpong.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at pingPongTest (/hom...
- `parallel/test-net-reconnect.js`: Expected values to be strictly equal:  0 !== 51  AssertionError: Expected values to be strictly equal:  0 !== 51      at <anonymous> (/home/node/test/parallel/test-net-reconnect.js:85:44)     at emit ...
- `parallel/test-net-remote-address-port.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-remote-address.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-server-call-listen-multiple-times.js#block_00_first_test_check_that_after_error_event_you_can_listen_right`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-server-call-listen-multiple-times.js#block_01_second_test_check_that_second_listen_call_throws_an_error`: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at <anonymous> (/home/node/test/parallel/test-net-server-call-listen-multiple-times.js:16:10)     at loadMod...
- `parallel/test-net-server-call-listen-multiple-times.js#block_02_check_that_after_the_close_call_you_can_run_listen_method_ju`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-server-close.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-server-listen-options-signal.js#block_00_block_00`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-net-server-listen-options-signal.js:10:5)     at loadM...
- `parallel/test-net-server-listen-options-signal.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-server-listen-options-signal.js#block_02_block_02`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-server-listen-options.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-server-listen-options.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at doListen (node:net:1060:36)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-net-server-listen-...
- `parallel/test-net-server-listen-options.js#block_02_block_02`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at shouldFailToListen (/home/node/test/parallel/test-net-server-listen-options.js:33:21)     at <ano...
- `parallel/test-net-server-listen-path.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home...
- `parallel/test-net-server-listen-path.js#block_00_test_listen_path`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home...
- `parallel/test-net-server-listen-path.js#block_01_test_listen_path`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home...
- `parallel/test-net-server-listen-path.js#block_02_test_listen_path_cb`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home...
- `parallel/test-net-server-listen-path.js#block_03_test_listen_path_cb`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home...
- `parallel/test-net-server-listen-path.js#block_04_test_pipe_chmod`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home...
- `parallel/test-net-server-listen-path.js#block_05_test_should_emit_error_events_when_listening_fails`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home/node/test/parallel/test-net-server...
- `parallel/test-net-server-nodelay.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-settimeout.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-socket-byteswritten.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-socket-close-after-end.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-socket-connect-without-cb.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-socket-connecting.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-net-socket-c...
- `parallel/test-net-socket-destroy-twice.js`: cannot read property 'port' of null     at <anonymous> (/home/node/test/parallel/test-net-socket-destroy-twice.js:28:21)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)...
- `parallel/test-net-socket-end-callback.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-socket-setnodelay.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-net-socket-setnodel...
- `parallel/test-net-socket-timeout.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-socket-write-after-close.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-socket-write-after-close.js#block_01_block_01`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-socket-write-error.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-net-socket-w...
- `parallel/test-net-stream.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-net-stream.j...
- `parallel/test-net-writable.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-net-write-after-close.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `sequential/test-net-connect-econnrefused.js`: Expected values to be strictly equal:  1 !== 5  AssertionError: Expected values to be strictly equal:  1 !== 5      at <anonymous> (/home/node/test/sequential/test-net-connect-econnrefused.js:66:22)  ...
- `sequential/test-net-reconnect-error.js`: mustCall verification failed: mustCall: expected exactly 21 call(s), got 1     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/sequential/test-net-reconnect-er...
- `sequential/test-net-server-address.js`: Unhandled promise rejection (likely cause of mustCall failure):     at mustNotCall (/home/node/test/common/index.js:526:23)     at apply (native)     at emit (node:events:332:36)     at apply (native)...
- `sequential/test-net-server-address.js#block_00_test_on_ipv4_server`: Unhandled promise rejection (likely cause of mustCall failure):     at mustNotCall (/home/node/test/common/index.js:526:23)     at apply (native)     at emit (node:events:332:36)     at apply (native)...
- `sequential/test-net-server-bind.js#block_00_with_only_a_callback_server_should_get_a_port_assigned_by_th`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `sequential/test-net-server-bind.js#block_01_no_callback_to_listen_assume_we_can_bind_in_100_ms`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/sequential/test-net-server...
- `sequential/test-net-server-bind.js#block_02_callback_to_listen`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `sequential/test-net-server-bind.js#block_03_backlog_argument`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `sequential/test-net-server-bind.js#block_04_backlog_argument_without_host_argument`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...

### other

- `es-module/test-dynamic-import-script-lifetime.js`: Unhandled promise rejection: Error: Cannot find module 'foo'
- `parallel/test-async-wrap-promise-after-enabled.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-async-wrap-promise-...
- `parallel/test-async-wrap-uncaughtexception.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-async-wrap-uncaught...
- `parallel/test-blocklist.js#block_00_block_00`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-blocklist.js:16:12)     at forEach (native)     at <anonymous> (/home/node/tes...
- `parallel/test-blocklist.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(!blockList.check('8592:757c:efae:4e45:fb5d:d62a:0d00:8e17'))  AssertionError: The expression evaluated to a falsy value:    assert(!blockList.check...
- `parallel/test-blocklist.js#block_02_block_02`: The expression evaluated to a falsy value:    assert(!blockList.check('8592:757c:efae:4e45:fb5d:d62a:0d00:8e17'))  AssertionError: The expression evaluated to a falsy value:    assert(!blockList.check...
- `parallel/test-blocklist.js#block_03_block_03`: ::1 check failed AssertionError: ::1 check failed     at <anonymous> (/home/node/test/parallel/test-blocklist.js:31:19)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34) ...
- `parallel/test-blocklist.js#block_04_block_04`: ::1 check failed AssertionError: ::1 check failed     at <anonymous> (/home/node/test/parallel/test-blocklist.js:38:19)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34) ...
- `parallel/test-blocklist.js#block_05_block_05`: The expression evaluated to a falsy value:    assert(blockList.check('::ffff:1.1.0.1', 'ipv6'))  AssertionError: The expression evaluated to a falsy value:    assert(blockList.check('::ffff:1.1.0.1', ...
- `parallel/test-blocklist.js#block_06_block_06`: The expression evaluated to a falsy value:    assert(blockList.check('::ffff:1.1.0.1', 'ipv6'))  AssertionError: The expression evaluated to a falsy value:    assert(blockList.check('::ffff:1.1.0.1', ...
- `parallel/test-blocklist.js#block_07_block_07`: Expected values to be strictly deep-equal: + actual - expected    [ +   'Address: ipv4 1.1.1.1', +   'Range: ipv4 10.0.0.1-10.0.0.10', +   'Subnet: IpV6 8592:757c:efae:4e45::/64' -   'Subnet: IPv6 859...
- `parallel/test-blocklist.js#block_08_block_08`: The expression evaluated to a falsy value:    assert(blockList.check('8592:757c:efaf:0:0:0:0:0', 'ipv6'))  AssertionError: The expression evaluated to a falsy value:    assert(blockList.check('8592:75...
- `parallel/test-blocklist.js#block_09_block_09`: The expression evaluated to a falsy value:    assert(blockList.check('::ffff:0a00:0002', 'ipv6'))  AssertionError: The expression evaluated to a falsy value:    assert(blockList.check('::ffff:0a00:000...
- `parallel/test-blocklist.js#block_10_block_10`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-blocklist.js:34:10)     at loadModule (node:module:866:32)     at localRequire...
- `parallel/test-blocklist.js#block_11_block_11`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-blocklist.js:36:10)     at loadModule (node:module:866:32)     at localRequire...
- `parallel/test-blocklist.js#block_12_block_12`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-blocklist.js:38:10)     at loadModule (node:module:866:32)     at localRequire...
- `parallel/test-broadcastchannel-custom-inspect.js#block_00_block_00`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at <anonymous> (/home/node/test/parallel/test-broadcastchannel-custom-inspect.js:11:...
- `parallel/test-broadcastchannel-custom-inspect.js#block_01_block_01`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at <anonymous> (/home/node/test/parallel/test-broadcastchannel-custom-inspect.js:13:...
- `parallel/test-broadcastchannel-custom-inspect.js#block_02_block_02`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at <anonymous> (/home/node/test/parallel/test-broadcastchannel-custom-inspect.js:15:...
- `parallel/test-broadcastchannel-custom-inspect.js#block_03_block_03`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at <anonymous> (/home/node/test/parallel/test-broadcastchannel-custom-inspect.js:17:...
- `parallel/test-cli-permission-deny-fs.js#block_00_block_00`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at <anonymous> (/home/node/test/parallel/test-cli-permission-deny-fs.j...
- `parallel/test-cli-permission-deny-fs.js#block_01_block_01`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at <anonymous> (/home/node/test/parallel/test-cli-permission-deny-fs.j...
- `parallel/test-cli-permission-deny-fs.js#block_02_block_02`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at <anonymous> (/home/node/test/parallel/test-cli-permission-deny-fs.j...
- `parallel/test-cli-permission-deny-fs.js#block_03_block_03`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at <anonymous> (/home/node/test/parallel/test-cli-permission-deny-fs.j...
- `parallel/test-cli-permission-deny-fs.js#block_04_block_04`: Error: fs is not defined     at anonymous (<input>:3:1)     at executeInlineSource (node:child_process:402:28)     at runInline (node:child_process:606:52)     at spawnSync (node:child_process:1290:22...
- `parallel/test-cli-permission-deny-fs.js#block_05_block_05`: Error: fs is not defined     at anonymous (<input>:3:1)     at executeInlineSource (node:child_process:402:28)     at runInline (node:child_process:606:52)     at spawnSync (node:child_process:1290:22...
- `parallel/test-cli-permission-deny-fs.js#block_06_block_06`: Error: fs is not defined     at anonymous (<input>:3:1)     at executeInlineSource (node:child_process:402:28)     at runInline (node:child_process:606:52)     at spawnSync (node:child_process:1290:22...
- `parallel/test-cli-permission-deny-fs.js#block_07_block_07`: The input did not match the regular expression /resource: '.*?[\\/](?:etc\|passwd)'/. Input:  "Error: ENOENT: no such file or directory, open '/etc/passwd'\n" +   '    at createSystemError (node:fs:186...
- `parallel/test-cli-permission-multiple-allow.js#block_00_block_00`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at <anonymous> (/home/node/test/parallel/test-cli-permission-multiple-...
- `parallel/test-cli-permission-multiple-allow.js#block_01_block_01`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at <anonymous> (/home/node/test/parallel/test-cli-permission-multiple-...
- `parallel/test-cli-permission-multiple-allow.js#block_02_block_02`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at <anonymous> (/home/node/test/parallel/test-cli-permission-multiple-...
- `parallel/test-common-countdown.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at Countdown (/home/node/test/common/countdown.js:13:39)     at <...
- `parallel/test-common-gc.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-common-gc.js:7:27) ...
- `parallel/test-common-gc.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-common-gc.js:7:27) ...
- `parallel/test-common.js#block_00_test_for_leaked_global_detection`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-common.js:44:15)     at loadModule (node:module:866:32)     at localRequire (n...
- `parallel/test-common.js#block_01_test_for_disabling_leaked_global_detection`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-common.js:46:15)     at loadModule (node:module:866:32)     at localRequire (n...
- `parallel/test-common.js#block_02_test_tmpdir`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-common.js:38:15)     at loadModule (node:module:866:32)     at localRequire (n...
- `parallel/test-common.js#block_03_must_be_last_since_it_uses_process_on_uncaughtexception`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-common.js:38:15)     at loadModule (node:module:866:32)     at localRequire (n...
- `parallel/test-domexception-cause.js`: Expected values to be strictly equal: + actual - expected  + { +   cause: undefined, +   name: 'abc' + } - 'abc'  AssertionError: Expected values to be strictly equal: + actual - expected  + { +   cau...
- `parallel/test-domexception-cause.js#block_01_block_01`: Expected values to be strictly equal: + actual - expected  + { +   cause: undefined, +   name: 'abc' + } - 'abc'  AssertionError: Expected values to be strictly equal: + actual - expected  + { +   cau...
- `parallel/test-domexception-cause.js#block_02_block_02`: Expected values to be strictly equal: + actual - expected  + { +   cause: 'foo', +   name: 'abc' + } - 'abc'  AssertionError: Expected values to be strictly equal: + actual - expected  + { +   cause: ...
- `parallel/test-domexception-cause.js#block_03_block_03`: Expected values to be strictly equal: + actual - expected  + { +   cause: { +     reason: 'foo' +   }, +   name: 'abc' + } - 'abc'  AssertionError: Expected values to be strictly equal: + actual - exp...
- `parallel/test-emit-after-uncaught-exception.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-emit-after-uncaught...
- `parallel/test-exception-handler.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-exception-handler.j...
- `parallel/test-freeze-intrinsics.js#block_00_ensure_we_can_extend_console`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-freeze-intrinsics.js:7:3)     at loadModule (node:modu...
- `parallel/test-freeze-intrinsics.js#block_01_ensure_we_can_write_override_object_prototype_properties_on_`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-freeze-intrinsics.js:7:3)     at loadModule (node:modu...
- `parallel/test-freeze-intrinsics.js#block_02_ensure_we_can_not_override_globalthis`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-freeze-intrinsics.js:7:3)     at loadModule (node:modu...
- `parallel/test-freeze-intrinsics.js#block_03_ensure_that_we_cannot_override_console_properties`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-freeze-intrinsics.js:7:3)     at loadModule (node:modu...
- `parallel/test-handle-wrap-close-abort.js`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-handle-wrap-close-a...
- `parallel/test-heapdump-async-hooks-init-promise.js`: mustCall verification failed: mustCall: expected exactly 8 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-heapdump-async-hook...
- `parallel/test-no-addons-resolution-condition.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-no-addons-resolutio...
- `parallel/test-permission-allow-child-process-cli.js#block_00_guarantee_the_initial_state`: cannot read property 'has' of undefined     at <anonymous> (/home/node/test/parallel/test-permission-allow-child-process-cli.js:28:13)     at loadModule (node:module:866:32)     at localRequire (node:...
- `parallel/test-permission-allow-child-process-cli.js#block_01_to_spawn_unless_allow_child_process_is_sent`: execSync is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at execSync (node:child_process:1281:11)     at <anonymous> (/home/node/test/parallel...
- `parallel/test-permission-allow-wasi-cli.js#block_00_guarantee_the_initial_state`: Cannot find module 'wasi'     at localRequire (node:module:988:59)     at <anonymous> (/home/node/test/parallel/test-permission-allow-wasi-cli.js:12:18)     at loadModule (node:module:866:32)     at l...
- `parallel/test-permission-allow-wasi-cli.js#block_01_to_create_wasi_instance_unless_allow_wasi_is_sent`: Cannot find module 'wasi'     at localRequire (node:module:988:59)     at <anonymous> (/home/node/test/parallel/test-permission-allow-wasi-cli.js:12:18)     at loadModule (node:module:866:32)     at l...
- `parallel/test-permission-allow-worker-cli.js#block_00_guarantee_the_initial_state`: cannot read property 'has' of undefined     at <anonymous> (/home/node/test/parallel/test-permission-allow-worker-cli.js:14:13)     at loadModule (node:module:866:32)     at localRequire (node:module:...
- `parallel/test-permission-child-process-cli.js#block_00_guarantee_the_initial_state`: cannot read property 'has' of undefined     at <anonymous> (/home/node/test/parallel/test-permission-child-process-cli.js:20:10)     at loadModule (node:module:866:32)     at localRequire (node:module...
- `parallel/test-permission-child-process-cli.js#block_01_to_spawn`: The validation function is expected to return "true". Received false  Caught error:  Error: spawn is not supported in WebAssembly environment AssertionError: The validation function is expected to ret...
- `parallel/test-permission-fs-read.js`: AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/fixtures/permission/fs-read.js:34:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)   ...
- `parallel/test-permission-fs-read.js#block_01_block_01`: AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/fixtures/permission/fs-read.js:34:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)   ...
- `parallel/test-permission-fs-require.js`: 0 !== 1  AssertionError:   0 !== 1      at <anonymous> (/home/node/test/parallel/test-permission-fs-require.js:46:40)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)   ...
- `parallel/test-permission-fs-require.js#block_01_block_01`: 0 !== 1  AssertionError:   0 !== 1      at <anonymous> (/home/node/test/parallel/test-permission-fs-require.js:31:40)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)   ...
- `parallel/test-permission-fs-require.js#block_03_block_03`: 0 !== 1  AssertionError:   0 !== 1      at <anonymous> (/home/node/test/parallel/test-permission-fs-require.js:35:40)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)   ...
- `parallel/test-permission-fs-wildcard.js#block_00_block_00`: Error: Cannot find module '/tmp/*' from '/'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at runMain (node:module:1202:23)     at runInline (node:child_proce...
- `parallel/test-permission-fs-wildcard.js#block_01_block_01`: Error: Cannot find module '/tmp/*' from '/'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at runMain (node:module:1202:23)     at runInline (node:child_proce...
- `parallel/test-permission-fs-write-report.js#block_00_block_00`: The validation function is expected to return "true". Received false  Caught error:  TypeError: cannot read property 'writeReport' of undefined AssertionError: The validation function is expected to r...
- `parallel/test-permission-fs-write-report.js#block_01_block_01`: The validation function is expected to return "true". Received false  Caught error:  TypeError: cannot read property 'writeReport' of undefined AssertionError: The validation function is expected to r...
- `parallel/test-permission-fs-write-v8.js#block_00_block_00`: The validation function is expected to return "true". Received false  Caught error:  Error: v8.writeHeapSnapshot is not supported in WASM environment AssertionError: The validation function is expecte...
- `parallel/test-permission-fs-write-v8.js#block_01_block_01`: The validation function is expected to return "true". Received false  Caught error:  Error: v8.writeHeapSnapshot is not supported in WASM environment AssertionError: The validation function is expecte...
- `parallel/test-permission-has.js#block_00_block_00`: cannot read property 'has' of undefined     at <anonymous> (/home/node/test/parallel/test-permission-has.js:9:13)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at...
- `parallel/test-permission-has.js#block_01_block_01`: cannot read property 'has' of undefined     at <anonymous> (/home/node/test/parallel/test-permission-has.js:11:10)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     a...
- `parallel/test-pipe-address.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home...
- `parallel/test-pipe-head.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-pipe-head.js:14:...
- `parallel/test-pipe-stream.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at test (/home/node/test/parallel/test-pipe-stream.js:53...
- `parallel/test-pipe-unref.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home/node/test/parallel/test-pipe-unref...
- `parallel/test-pipe-writev.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home/node/test/parallel/test-pipe-write...
- `parallel/test-preload-self-referential.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-preload-self-ref...
- `parallel/test-preload-worker.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-preload-worker.j...
- `parallel/test-promise-swallowed-event.js`: mustCall verification failed: mustCall: expected exactly 4 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-promise-swallowed-e...
- `parallel/test-queue-microtask.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-queue-microtask.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-release-changelog.js#block_00_check_changelog_v_md`: ENOENT: no such file or directory, open '/home/node/src/node_version.h'     at createSystemError (node:fs:186:21)     at openSync (node:fs:1135:33)     at readFileSync (node:fs:1004:25)     at <anonym...
- `parallel/test-release-changelog.js#block_01_main_changelog_md_checks`: ENOENT: no such file or directory, open '/home/node/src/node_version.h'     at createSystemError (node:fs:186:21)     at openSync (node:fs:1135:33)     at readFileSync (node:fs:1004:25)     at <anonym...
- `parallel/test-set-incoming-message-header.js#block_02_addheaderlines_function_set_a_header_correctly`: not a function     at <anonymous> (/home/node/test/parallel/test-set-incoming-message-header.js:17:6)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (no...
- `parallel/test-shadow-realm-preload-module.js`: Unhandled promise rejection (likely cause of mustCall failure):     at main (/home/node/test/parallel/test-shadow-realm-preload-module.js:16:14)     at <anonymous> (/home/node/test/parallel/test-shado...
- `parallel/test-shadow-realm-prepare-stack-trace.js#block_00_block_00`: ShadowRealm is not defined ReferenceError: ShadowRealm is not defined     at [object CallSite]     at [object CallSite]     at [object CallSite]     at [object CallSite]
- `parallel/test-shadow-realm-prepare-stack-trace.js#block_01_block_01`: ShadowRealm is not defined ReferenceError: ShadowRealm is not defined     at [object CallSite]     at [object CallSite]     at [object CallSite]     at [object CallSite]
- `parallel/test-single-executable-blob-config-errors.js#block_00_block_00`: The input did not match the regular expression /Cannot read single executable configuration from non-existent-relative\.json/. Input:  "Error: Cannot find module '/tmp/w/non-existent-relative.json' fr...
- `parallel/test-single-executable-blob-config-errors.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(     stderr.includes(       `Cannot read single executable configuration from ${config}`     )   )  AssertionError: The expression evaluated to a f...
- `parallel/test-single-executable-blob-config-errors.js#block_02_block_02`: The input did not match the regular expression /SyntaxError: Expected ':' after property name/. Input:  "Error: Cannot parse JSON module '/tmp/w/invalid.json': Expected ':' after property name in JSON...
- `parallel/test-single-executable-blob-config-errors.js#block_03_block_03`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-single-executable-blob-config-errors.j...
- `parallel/test-single-executable-blob-config-errors.js#block_04_block_04`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-single-executable-blob-config-errors.j...
- `parallel/test-single-executable-blob-config-errors.js#block_05_block_05`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-single-executable-blob-config-errors.j...
- `parallel/test-single-executable-blob-config-errors.js#block_06_block_06`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-single-executable-blob-config-errors.j...
- `parallel/test-single-executable-blob-config-errors.js#block_07_block_07`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-single-executable-blob-config-errors.j...
- `parallel/test-single-executable-blob-config-errors.js#block_08_block_08`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-single-executable-blob-config-errors.j...
- `parallel/test-single-executable-blob-config-errors.js#block_09_block_09`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-single-executable-blob-config-errors.j...
- `parallel/test-single-executable-blob-config-errors.js#block_10_block_10`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-single-executable-blob-config-errors.j...
- `parallel/test-single-executable-blob-config.js#block_00_block_00`: The expression evaluated to a falsy value:    assert(existsSync(output))  AssertionError: The expression evaluated to a falsy value:    assert(existsSync(output))      at <anonymous> (/home/node/test/...
- `parallel/test-single-executable-blob-config.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(existsSync(output))  AssertionError: The expression evaluated to a falsy value:    assert(existsSync(output))      at <anonymous> (/home/node/test/...
- `parallel/test-single-executable-blob-config.js#block_02_block_02`: The expression evaluated to a falsy value:    assert(existsSync(output))  AssertionError: The expression evaluated to a falsy value:    assert(existsSync(output))      at <anonymous> (/home/node/test/...
- `parallel/test-single-executable-blob-config.js#block_03_block_03`: The expression evaluated to a falsy value:    assert(existsSync(output))  AssertionError: The expression evaluated to a falsy value:    assert(existsSync(output))      at <anonymous> (/home/node/test/...
- `parallel/test-single-executable-blob-config.js#block_04_block_04`: The expression evaluated to a falsy value:    assert(existsSync(output))  AssertionError: The expression evaluated to a falsy value:    assert(existsSync(output))      at <anonymous> (/home/node/test/...
- `parallel/test-snapshot-api.js#block_00_block_00`: cannot read property 'isBuildingSnapshot' of undefined     at <anonymous> (/home/node/test/parallel/test-snapshot-api.js:16:1)     at loadModule (node:module:866:32)     at localRequire (node:module:9...
- `parallel/test-snapshot-api.js#block_01_block_01`: cannot read property 'isBuildingSnapshot' of undefined     at <anonymous> (/home/node/test/parallel/test-snapshot-api.js:16:1)     at loadModule (node:module:866:32)     at localRequire (node:module:9...
- `parallel/test-snapshot-argv1.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-argv1.js:31:24)     at loadMo...
- `parallel/test-snapshot-argv1.js#block_01_block_01`: Unexpected end of JSON input     at <input>:1:1     at parse (native)     at <anonymous> (/home/node/test/parallel/test-snapshot-argv1.js:33:53)     at loadModule (node:module:866:32)     at localRequ...
- `parallel/test-snapshot-basic.js#block_00_by_default_the_snapshot_blob_path_is_cwd_snapshot_blob`: - process terminated with status 1, expected 9     at <anonymous> (/home/node/test/parallel/test-snapshot-basic.js:24:20)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34...
- `parallel/test-snapshot-basic.js#block_01_block_01`: - process terminated with status 1, expected 9     at <anonymous> (/home/node/test/parallel/test-snapshot-basic.js:24:20)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34...
- `parallel/test-snapshot-basic.js#block_02_block_02`: - process terminated with status 1, expected 9     at <anonymous> (/home/node/test/parallel/test-snapshot-basic.js:24:20)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34...
- `parallel/test-snapshot-basic.js#block_03_block_03`: - process terminated with status 1, expected 9     at <anonymous> (/home/node/test/parallel/test-snapshot-basic.js:24:20)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34...
- `parallel/test-snapshot-child-process-sync.js#block_00_block_00`: - process terminated with status 1, expected 0     at <anonymous> (/home/node/test/parallel/test-snapshot-child-process-sync.js:23:22)     at loadModule (node:module:866:32)     at localRequire (node:...
- `parallel/test-snapshot-child-process-sync.js#block_01_block_01`: - process terminated with status 1, expected 0     at <anonymous> (/home/node/test/parallel/test-snapshot-child-process-sync.js:24:22)     at loadModule (node:module:866:32)     at localRequire (node:...
- `parallel/test-snapshot-cjs-main.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-cjs-main.js:31:24)     at loa...
- `parallel/test-snapshot-cjs-main.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-cjs-main.js:33:24)     at loa...
- `parallel/test-snapshot-config.js#block_00_block_00`: - stderr did not match /Cannot read snapshot configuration from snapshot\.json/     at <anonymous> (/home/node/test/parallel/test-snapshot-config.js:23:20)     at loadModule (node:module:866:32)     a...
- `parallel/test-snapshot-config.js#block_01_block_01`: - stderr did not match /"builder" field of .+snapshot\.json is not a non-empty string/     at <anonymous> (/home/node/test/parallel/test-snapshot-config.js:31:20)     at loadModule (node:module:866:32...
- `parallel/test-snapshot-config.js#block_02_block_02`: - process terminated with status 1, expected 0     at <anonymous> (/home/node/test/parallel/test-snapshot-config.js:34:32)     at loadModule (node:module:866:32)     at localRequire (node:module:977:3...
- `parallel/test-snapshot-config.js#block_03_block_03`: - process terminated with status 1, expected 0     at <anonymous> (/home/node/test/parallel/test-snapshot-config.js:37:32)     at loadModule (node:module:866:32)     at localRequire (node:module:977:3...
- `parallel/test-snapshot-cwd.js#block_00_block_00`: - process terminated with status 1, expected 0     at <anonymous> (/home/node/test/parallel/test-snapshot-cwd.js:21:22)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34) ...
- `parallel/test-snapshot-cwd.js#block_01_block_01`: - process terminated with status 1, expected 0     at <anonymous> (/home/node/test/parallel/test-snapshot-cwd.js:22:22)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34) ...
- `parallel/test-snapshot-dns-lookup-localhost-promise.js#block_00_block_00`: Cannot find module '../common/snapshot' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-snapshot-dns-lookup-localhost-promise.js#block_01_block_01`: Cannot find module '../common/snapshot' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-snapshot-dns-lookup-localhost.js#block_00_block_00`: Cannot find module '../common/snapshot' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-snapshot-dns-lookup-localhost.js#block_01_block_01`: Cannot find module '../common/snapshot' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-snapshot-dns-resolve-localhost-promise.js#block_00_block_00`: Cannot find module '../common/snapshot' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-snapshot-dns-resolve-localhost-promise.js#block_01_block_01`: Cannot find module '../common/snapshot' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-snapshot-dns-resolve-localhost.js#block_00_block_00`: Cannot find module '../common/snapshot' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-snapshot-dns-resolve-localhost.js#block_01_block_01`: Cannot find module '../common/snapshot' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-snapshot-error.js#block_00_build_snapshot_should_be_run_with_an_entry_point`: Expected values to be strictly equal:  1 !== 9  AssertionError: Expected values to be strictly equal:  1 !== 9      at <anonymous> (/home/node/test/parallel/test-snapshot-error.js:30:22)     at loadMo...
- `parallel/test-snapshot-error.js#block_01_loading_a_non_existent_snapshot_should_fail`: Expected values to be strictly equal:  1 !== 14  AssertionError: Expected values to be strictly equal:  1 !== 14      at <anonymous> (/home/node/test/parallel/test-snapshot-error.js:33:22)     at load...
- `parallel/test-snapshot-error.js#block_02_running_an_script_that_throws_an_error_should_result_in_an_e`: The input did not match the regular expression /error\.js:1/. Input:  "Error: Cannot find module '/tmp/w/snapshot.blob' from '/'\n" +   '    at resolveFilename (node:module:380:80)\n' +   '    at loca...
- `parallel/test-snapshot-eval.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-eval.js:30:24)     at loadMod...
- `parallel/test-snapshot-eval.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-eval.js:33:24)     at loadMod...
- `parallel/test-snapshot-eval.js#block_02_block_02`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-eval.js:35:24)     at loadMod...
- `parallel/test-snapshot-gzip.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-gzip.js:36:22)     at loadMod...
- `parallel/test-snapshot-gzip.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-gzip.js:36:22)     at loadMod...
- `parallel/test-snapshot-incompatible.js#block_00_is_chosen_here_because_it_s_stable_enough_and_makes_a_differ`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-incompatible.js:34:24)     at...
- `parallel/test-snapshot-incompatible.js#block_01_block_01`: The input did not match the regular expression /Failed to load the startup snapshot/. Input:  "Error: Cannot find module '/tmp/w/snapshot.blob' from '/'\n" +   '    at resolveFilename (node:module:380...
- `parallel/test-snapshot-incompatible.js#block_02_block_02`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-incompatible.js:40:24)     at...
- `parallel/test-snapshot-net.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-net.js:28:24)     at loadModu...
- `parallel/test-snapshot-net.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-net.js:33:22)     at loadModu...
- `parallel/test-snapshot-stack-trace-limit.js#block_00_block_00`: - process terminated with status 1, expected 0     at <anonymous> (/home/node/test/parallel/test-snapshot-stack-trace-limit.js:20:14)     at loadModule (node:module:866:32)     at localRequire (node:m...
- `parallel/test-snapshot-stack-trace-limit.js#block_01_block_01`: - process terminated with status 1, expected 0     at <anonymous> (/home/node/test/parallel/test-snapshot-stack-trace-limit.js:17:22)     at loadModule (node:module:866:32)     at localRequire (node:m...
- `parallel/test-snapshot-typescript.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-typescript.js:37:22)     at l...
- `parallel/test-snapshot-typescript.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-typescript.js:41:22)     at l...
- `parallel/test-snapshot-umd.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-umd.js:30:22)     at loadModu...
- `parallel/test-snapshot-umd.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-snapshot-umd.js:35:22)     at loadModu...
- `parallel/test-snapshot-warning.js#block_00_block_00`: - process terminated with status 1, expected 0     at <anonymous> (/home/node/test/parallel/test-snapshot-warning.js:22:32)     at loadModule (node:module:866:32)     at localRequire (node:module:977:...
- `parallel/test-snapshot-warning.js#block_01_block_01`: - process terminated with status 1, expected 0     at <anonymous> (/home/node/test/parallel/test-snapshot-warning.js:26:22)     at loadModule (node:module:866:32)     at localRequire (node:module:977:...
- `parallel/test-snapshot-warning.js#block_02_block_02`: - process terminated with status 1, expected 0     at <anonymous> (/home/node/test/parallel/test-snapshot-warning.js:31:22)     at loadModule (node:module:866:32)     at localRequire (node:module:977:...
- `parallel/test-source-map-api.js#block_00_it_should_throw_with_invalid_args`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'not a function', -   code: 'ERR_INVALID_ARG_TYPE', -   message: 'The "payload" argument must be of type obj...
- `parallel/test-source-map-api.js#block_01_findsourcemap_should_return_undefined_when_no_source_map_is_`: not a function     at <anonymous> (/home/node/test/parallel/test-source-map-api.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-ru...
- `parallel/test-source-map-api.js#block_02_non_exceptional_case`: not a function     at <anonymous> (/home/node/test/parallel/test-source-map-api.js:20:13)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-ru...
- `parallel/test-source-map-api.js#block_03_source_map_attached_to_error`: undefined == true AssertionError [ERR_ASSERTION]: undefined == true
- `parallel/test-source-map-api.js#block_04_sourcemap_can_be_instantiated_with_source_map_v3_object_as_p`: not a function     at <anonymous> (/home/node/test/parallel/test-source-map-api.js:31:25)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-ru...
- `parallel/test-source-map-api.js#block_05_error_when_receiving_a_malformed_mappings`: not a function     at <anonymous> (/home/node/test/parallel/test-source-map-api.js:34:25)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-ru...
- `parallel/test-source-map-api.js#block_06_sourcemap_can_be_instantiated_with_index_source_map_v3_objec`: not a function     at <anonymous> (/home/node/test/parallel/test-source-map-api.js:35:25)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-ru...
- `parallel/test-source-map-api.js#block_07_test_various_known_decodings_to_ensure_decodevlq_works_corre`: not a function     at <anonymous> (/home/node/test/parallel/test-source-map-api.js:69:52)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-ru...
- `parallel/test-source-map-api.js#block_08_observed_see_https_github_com_mozilla_source_map_pull_92`: not a function     at <anonymous> (/home/node/test/parallel/test-source-map-api.js:53:5)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-run...
- `parallel/test-startup-large-pages.js#block_00_block_00`: Expected values to be strictly equal:  'undefined' !== '42'  AssertionError: Expected values to be strictly equal:  'undefined' !== '42'      at <anonymous> (/home/node/test/parallel/test-startup-larg...
- `parallel/test-startup-large-pages.js#block_01_block_01`: Expected values to be strictly equal:  0 !== 9  AssertionError: Expected values to be strictly equal:  0 !== 9      at <anonymous> (/home/node/test/parallel/test-startup-large-pages.js:14:22)     at l...
- `parallel/test-stdout-to-file.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stdout-to-file.js:4...
- `parallel/test-webcrypto-constructors.js#block_00_test_cryptokey_constructor`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:13:10)     at loadModule (no...
- `parallel/test-webcrypto-constructors.js#block_01_test_subtlecrypto_constructor`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'SubtleCrypto is not defined', +   name: 'ReferenceError' -   code: 'ERR_ILLEGAL_CONSTRUCTOR', -   message: ...
- `parallel/test-webcrypto-constructors.js#block_02_test_crypto_constructor`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'Crypto is not defined', +   name: 'ReferenceError' -   code: 'ERR_ILLEGAL_CONSTRUCTOR', -   message: 'Illeg...
- `parallel/test-webcrypto-constructors.js#block_03_test_crypto_prototype_subtle`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_04_test_crypto_prototype_randomuuid`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_05_test_crypto_prototype_getrandomvalues`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_06_test_subtlecrypto_prototype_encrypt`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_07_test_subtlecrypto_prototype_decrypt`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_08_test_subtlecrypto_prototype_sign`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_09_test_subtlecrypto_prototype_verify`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_10_test_subtlecrypto_prototype_digest`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_11_test_subtlecrypto_prototype_generatekey`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_12_test_subtlecrypto_prototype_derivekey`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_13_test_subtlecrypto_prototype_derivebits`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_14_test_subtlecrypto_prototype_importkey`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_15_test_subtlecrypto_prototype_exportkey`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_16_test_subtlecrypto_prototype_wrapkey`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_17_test_subtlecrypto_prototype_unwrapkey`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-constructors.js#block_18_block_18`: Crypto is not defined     at <anonymous> (/home/node/test/parallel/test-webcrypto-constructors.js:20:37)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest ...
- `parallel/test-webcrypto-cryptokey-workers.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webcrypto-cryptokey...
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_00_test_aes_cbc_vectors`: Unhandled promise rejection (likely cause of mustCall failure):     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at testEncrypt (/home/node/test/parallel/test-webcrypto-encrypt-decryp...
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_01_test_aes_ctr_vectors`: Unhandled promise rejection (likely cause of mustCall failure):     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at testEncrypt (/home/node/test/parallel/test-webcrypto-encrypt-decryp...
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_02_test_aes_gcm_vectors`: Unhandled promise rejection (likely cause of mustCall failure):     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at testEncrypt (/home/node/test/parallel/test-webcrypto-encrypt-decryp...
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_03_block_03`: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (/home/node/test/parallel/test-webcrypto-encrypt-decrypt-aes.js:123:45)
- `parallel/test-webcrypto-encrypt-decrypt.js#block_00_test_encrypt_decrypt_rsa_oaep`: Unhandled promise rejection (likely cause of mustCall failure):     at generateKey (__wasm_rquickjs_builtin/web_crypto:7470:53)     at test (/home/node/test/parallel/test-webcrypto-encrypt-decrypt.js:...
- `parallel/test-webcrypto-encrypt-decrypt.js#block_01_test_encrypt_decrypt_aes_ctr`: Unhandled promise rejection (likely cause of mustCall failure):     at test (/home/node/test/parallel/test-webcrypto-encrypt-decrypt.js:29:7)
- `parallel/test-webcrypto-encrypt-decrypt.js#block_02_test_encrypt_decrypt_aes_cbc`: Unhandled promise rejection (likely cause of mustCall failure):     at test (/home/node/test/parallel/test-webcrypto-encrypt-decrypt.js:32:7)
- `parallel/test-webcrypto-encrypt-decrypt.js#block_03_test_encrypt_decrypt_aes_gcm`: Unhandled promise rejection (likely cause of mustCall failure):     at test (/home/node/test/parallel/test-webcrypto-encrypt-decrypt.js:35:7)
- `parallel/test-webcrypto-export-import-ec.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure):     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at <anonymous> (/home/node/test/parallel/test-webcrypto-export-import-...
- `parallel/test-webcrypto-export-import-ec.js#block_01_bad_private_keys`: Unhandled promise rejection (likely cause of mustCall failure):     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at <anonymous> (/home/node/test/parallel/test-webcrypto-export-import-...
- `parallel/test-webcrypto-export-import.js#block_00_block_00`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_AR...
- `parallel/test-webcrypto-export-import.js#block_01_import_export_hmac_secret_key`: Unhandled promise rejection (likely cause of mustCall failure):     at exportKey (__wasm_rquickjs_builtin/web_crypto:7596:57)     at test (/home/node/test/parallel/test-webcrypto-export-import.js:34:3...
- `parallel/test-webcrypto-export-import.js#block_02_import_export_aes_secret_key`: Unhandled promise rejection (likely cause of mustCall failure):     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at test (/home/node/test/parallel/test-webcrypto-export-import.js:21:7...
- `parallel/test-webcrypto-export-import.js#block_03_import_export_rsa_key_pairs`: Unhandled promise rejection (likely cause of mustCall failure):     at generateKey (__wasm_rquickjs_builtin/web_crypto:7470:53)     at test (/home/node/test/parallel/test-webcrypto-export-import.js:25...
- `parallel/test-webcrypto-export-import.js#block_04_import_export_ec_key_pairs`: Unhandled promise rejection (likely cause of mustCall failure):     at exportKey (__wasm_rquickjs_builtin/web_crypto:7596:57)     at test (/home/node/test/parallel/test-webcrypto-export-import.js:36:1...
- `parallel/test-webcrypto-random.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   code: 17, -   name: 'TypeMismatchError'   }  AssertionError: Expected values to be strictly dee...
- `parallel/test-webcrypto-random.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   code: 17, -   name: 'TypeMismatchError'   }  AssertionError: Expected values to be strictly dee...
- `parallel/test-webcrypto-random.js#block_02_block_02`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   code: 17, -   name: 'TypeMismatchError'   }  AssertionError: Expected values to be strictly dee...
- `parallel/test-webcrypto-random.js#block_03_block_03`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   code: 17, -   name: 'TypeMismatchError'   }  AssertionError: Expected values to be strictly dee...
- `parallel/test-webcrypto-sign-verify.js#block_00_test_sign_verify_rsassa_pkcs1_v1_5`: Unhandled promise rejection (likely cause of mustCall failure):     at generateKey (__wasm_rquickjs_builtin/web_crypto:7470:53)     at test (/home/node/test/parallel/test-webcrypto-sign-verify.js:21:2...
- `parallel/test-webcrypto-sign-verify.js#block_01_test_sign_verify_rsa_pss`: Unhandled promise rejection (likely cause of mustCall failure):     at generateKey (__wasm_rquickjs_builtin/web_crypto:7470:53)     at test (/home/node/test/parallel/test-webcrypto-sign-verify.js:24:2...
- `parallel/test-webcrypto-sign-verify.js#block_05_test_sign_verify_ed448`: Unhandled promise rejection (likely cause of mustCall failure):     at generateKey (__wasm_rquickjs_builtin/web_crypto:7470:53)     at test (/home/node/test/parallel/test-webcrypto-sign-verify.js:33:5...
- `parallel/test-webstorage.js#test_01_emits_a_warning_when_used`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-webstorage.js#test_02_storage_instances_cannot_be_created_in_userland`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-webstorage.js#test_03_sessionstorage_is_not_persisted`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-webstorage.js#test_04_localstorage_throws_without_localstorage_file`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-webstorage.js#test_05_localstorage_is_not_persisted_if_it_is_unused`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-webstorage.js#test_06_localstorage_is_persisted_if_it_is_used`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-webstorage.js#test_07_webstorage_quota_for_localstorage_and_sessionstorage`: 2 test(s) failed     at finalize (node:test:573:29)     at runNext (node:test:620:16)     at <anonymous> (node:test:610:36)     at apply (native)     at wrapped (node:async_hooks:141:34)     at _resto...
- `parallel/test-webstreams-abort-controller.js#block_00_block_00`: The "stream" argument must be an stream.Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-abort-controller.js#block_01_block_01`: The "stream" argument must be an stream.Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-abort-controller.js#block_02_block_02`: The "stream" argument must be an stream.Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-abort-controller.js#block_03_block_03`: The "stream" argument must be an stream.Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-abort-controller.js#block_04_block_04`: The "stream" argument must be an stream.Stream. Received an instance of WritableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-abort-controller.js#block_05_block_05`: The "stream" argument must be an stream.Stream. Received an instance of WritableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-compose.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_03_block_03`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_04_block_04`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_05_block_05`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_07_block_07`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_08_block_08`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_09_block_09`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_10_block_10`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_11_block_11`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_12_block_12`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_13_block_13`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_14_block_14`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_15_block_15`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_18_block_18`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-compose.js#block_19_block_19`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-compose....
- `parallel/test-webstreams-finished.js#block_00_block_00`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_01_block_01`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_02_block_02`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_03_block_03`: Unhandled promise rejection (likely cause of mustCall failure):     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:46)     at eos (__wasm_rquickjs_builtin/internal/streams/end-of...
- `parallel/test-webstreams-finished.js#block_04_block_04`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + 'The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Recei...
- `parallel/test-webstreams-finished.js#block_05_block_05`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + 'The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Recei...
- `parallel/test-webstreams-finished.js#block_06_block_06`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_07_block_07`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_08_block_08`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_09_block_09`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of WritableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_10_block_10`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of WritableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_11_block_11`: Unhandled promise rejection (likely cause of mustCall failure):     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:46)     at eos (__wasm_rquickjs_builtin/internal/streams/end-of...
- `parallel/test-webstreams-finished.js#block_12_block_12`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of WritableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_13_block_13`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + 'The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Recei...
- `parallel/test-webstreams-finished.js#block_14_block_14`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_15_block_15`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_16_block_16`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_17_block_17`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:442:...
- `parallel/test-webstreams-finished.js#block_18_block_18`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   name: 'AbortErr...
- `parallel/test-webstreams-finished.js#block_19_block_19`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   name: 'AbortErr...
- `parallel/test-webstreams-pipeline.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-webstreams-pipeline.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-pipel...
- `parallel/test-webstreams-pipeline.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-pipeline...
- `parallel/test-webstreams-pipeline.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-pipel...
- `parallel/test-webstreams-pipeline.js#block_03_block_03`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-pipeline...
- `parallel/test-webstreams-pipeline.js#block_04_block_04`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-pipel...
- `parallel/test-webstreams-pipeline.js#block_06_block_06`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-pipel...
- `parallel/test-webstreams-pipeline.js#block_07_block_07`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-webstreams-pipeline.js#block_08_block_08`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-webstreams-p...
- `parallel/test-webstreams-pipeline.js#block_09_block_09`: Unhandled promise rejection (likely cause of mustCall failure):     at ERR_MISSING_ARGS (__wasm_rquickjs_builtin/internal/errors:622:9)     at pipelineImpl (__wasm_rquickjs_builtin/internal/streams/pi...
- `parallel/test-webstreams-pipeline.js#block_10_block_10`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + 'The "streams" argument must be specified' - 'kaboom'      at <anonymous> (/home/node/test/par...
- `parallel/test-webstreams-pipeline.js#block_13_block_13`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-pipel...
- `parallel/test-webstreams-pipeline.js#block_14_block_14`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-webstreams-pipel...
- `parallel/test-whatwg-events-add-event-listener-options-passive.js#block_00_block_00`: The expression evaluated to a falsy value:    ok(supportsPassive)  AssertionError: The expression evaluated to a falsy value:    ok(supportsPassive)      at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-whatwg-events-add-event-listener-options-signal.js`: The listener was still removed  1 !== 0  AssertionError: The listener was still removed  1 !== 0      at <anonymous> (/home/node/test/parallel/test-whatwg-events-add-event-listener-options-signal.js:1...
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_06_block_06`: The listener was still removed  1 !== 0  AssertionError: The listener was still removed  1 !== 0      at <anonymous> (/home/node/test/parallel/test-whatwg-events-add-event-listener-options-signal.js:3...
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_09_block_09`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-whatwg-events-add-event-listener-options-signal.js:32:...
- `parallel/test-whatwg-events-customevent.js`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-whatwg-events-customevent.js:22:3)     at loadModule (...
- `parallel/test-whatwg-events-customevent.js#block_01_block_01`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-whatwg-events-customevent.js:13:3)     at loadModule (...
- `parallel/test-whatwg-readablebytestream-bad-buffers-and-views.js#block_00_block_00`: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (/home/node/test/parallel/test-whatwg-readablebytestream-bad-buffers-...
- `parallel/test-whatwg-readablebytestream-bad-buffers-and-views.js#block_01_block_01`: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (/home/node/test/parallel/test-whatwg-readablebytestream-bad-buffers-...
- `parallel/test-whatwg-readablebytestream-bad-buffers-and-views.js#block_02_block_02`: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (/home/node/test/parallel/test-whatwg-readablebytestream-bad-buffers-...
- `parallel/test-whatwg-readablebytestream-bad-buffers-and-views.js#block_03_block_03`: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (/home/node/test/parallel/test-whatwg-readablebytestream-bad-buffers-...
- `parallel/test-whatwg-url-custom-searchparams-constructor.js#block_00_block_00`: not a function     at parseToDict (__wasm_rquickjs_builtin/url:236:20)     at URLSearchParamsPolyfill (__wasm_rquickjs_builtin/url:21:46)     at <anonymous> (/home/node/test/parallel/test-whatwg-url-c...
- `parallel/test-whatwg-url-custom-searchparams-constructor.js#block_01_block_01`: The input did not match the regular expression /^TypeError: Cannot convert a Symbol value to a string$/. Input:  'TypeError: not a function'  AssertionError: The input did not match the regular expres...
- `parallel/test-whatwg-url-custom-searchparams-delete.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "cannot read property '__URLSearchParams__' of undefined", -   code: 'ERR_INVALID_THIS', -   message: 'Value...
- `parallel/test-whatwg-url-custom-searchparams-delete.js#block_01_emptying_searchparams_should_correctly_update_url_s_query`: Expected values to be strictly equal: + actual - expected  + 'var=1&var=2&var=3' - ''  AssertionError: Expected values to be strictly equal: + actual - expected  + 'var=1&var=2&var=3' - ''      at <an...
- `parallel/test-whatwg-url-custom-searchparams-stringifier.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "cannot read property '__URLSearchParams__' of undefined", -   code: 'ERR_INVALID_THIS', -   message: 'Value...
- `parallel/test-whatwg-url-custom-searchparams-stringifier.js#block_01_different_percent_encoding_rules_than_the_url_itself`: Expected values to be strictly equal: + actual - expected  + '?foo=~bar' - '?foo=%7Ebar'         ^  AssertionError: Expected values to be strictly equal: + actual - expected  + '?foo=~bar' - '?foo=%7E...
- `parallel/test-whatwg-url-properties.js#block_00_block_00`: Expected values to be strictly equal:  '' !== 'toString'  AssertionError: Expected values to be strictly equal:  '' !== 'toString'      at testMethod (/home/node/test/parallel/test-whatwg-url-properti...
- `parallel/test-whatwg-url-properties.js#block_01_block_01`: Expected values to be strictly equal:  '' !== 'toString'  AssertionError: Expected values to be strictly equal:  '' !== 'toString'      at testMethod (/home/node/test/parallel/test-whatwg-url-properti...
- `parallel/test-whatwg-webstreams-encoding.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_ENCODING_NOT_SUPPORTED' - }  AssertionError: Expected values to be strictly deep-equal: + ...
- `parallel/test-whatwg-webstreams-encoding.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_ENCODING_NOT_SUPPORTED' - }  AssertionError: Expected values to be strictly deep-equal: + ...
- `parallel/test-x509-escaping.js#block_00_test_that_all_certificate_chains_provided_by_the_reporter_ar`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-x509-escaping.js#block_01_test_escaping_rules_for_subject_alternative_names`: not a function     at <anonymous> (/home/node/test/parallel/test-x509-escaping.js:94:22)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-run...
- `parallel/test-x509-escaping.js#block_02_test_escaping_rules_for_authority_info_access`: not a function     at <anonymous> (/home/node/test/parallel/test-x509-escaping.js:102:22)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-ru...
- `parallel/test-x509-escaping.js#block_03_test_escaping_rules_for_the_subject_field`: not a function     at <anonymous> (/home/node/test/parallel/test-x509-escaping.js:100:22)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-ru...
- `parallel/test-x509-escaping.js#block_04_the_internal_parsing_logic_must_match_the_json_specification`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'tls is not supported in WebAssembly environment' -   code: 'ERR_TLS_CERT_ALTNAME_FORMAT', -   message: 'Inv...
- `parallel/test-x509-escaping.js#block_05_correctly_i_e_not_simply_split_at_commas`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-x509-escaping.js#block_06_the_subject_must_be_ignored_if_a_dnsname_subject_alternative`: not a function     at <anonymous> (/home/node/test/parallel/test-x509-escaping.js:41:24)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-run...
- `parallel/test-x509-escaping.js#block_07_exists_even_if_other_subject_alternative_names_exist`: not a function     at <anonymous> (/home/node/test/parallel/test-x509-escaping.js:45:24)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-run...
- `sequential/test-heapdump.js#block_00_block_00`: ENOENT: no such file or directory, chdir '/' -> '/tmp/w'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/sequential/test-heapdump.js:16:15)     at loadModule (node:module:866:3...
- `sequential/test-heapdump.js#block_01_block_01`: ENOENT: no such file or directory, chdir '/' -> '/tmp/w'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/sequential/test-heapdump.js:16:15)     at loadModule (node:module:866:3...
- `sequential/test-heapdump.js#block_02_block_02`: ENOENT: no such file or directory, chdir '/' -> '/tmp/w'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/sequential/test-heapdump.js:16:15)     at loadModule (node:module:866:3...
- `sequential/test-heapdump.js#block_03_block_03`: ENOENT: no such file or directory, chdir '/' -> '/tmp/w'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/sequential/test-heapdump.js:16:15)     at loadModule (node:module:866:3...
- `sequential/test-init.js#block_00_block_00`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/sequential'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/sequential/test-init.js:48:17)     at loadModule (n...
- `sequential/test-init.js#block_01_block_01`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/sequential/test-init.js:49:26)     at loadModule (nod...
- `sequential/test-init.js#block_02_block_02`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures/test-init-native'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/sequential/test-init.js:53:26)     a...
- `sequential/test-single-executable-application-assets.js#block_00_block_00`: Cannot find module '../common/sea' from '/home/node/test/sequential'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/sequential...
- `sequential/test-single-executable-application-assets.js#block_01_block_01`: Cannot find module '../common/sea' from '/home/node/test/sequential'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/sequential...
- `sequential/test-single-executable-application-assets.js#block_02_block_02`: Cannot find module '../common/sea' from '/home/node/test/sequential'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/sequential...
- `sequential/test-single-executable-application-snapshot.js#block_00_block_00`: Cannot find module '../common/sea' from '/home/node/test/sequential'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/sequential...
- `sequential/test-single-executable-application-snapshot.js#block_01_block_01`: Cannot find module '../common/sea' from '/home/node/test/sequential'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/sequential...

### perf_hooks

- `parallel/test-perf-hooks-histogram.js#block_00_block_00`: createHistogram is not supported in WebAssembly environment     at createHistogram (node:perf_hooks:174:15)     at <anonymous> (/home/node/test/parallel/test-perf-hooks-histogram.js:19:13)     at load...
- `parallel/test-perf-hooks-histogram.js#block_01_block_01`: monitorEventLoopDelay is not supported in WebAssembly environment     at monitorEventLoopDelay (node:perf_hooks:170:15)     at <anonymous> (/home/node/test/parallel/test-perf-hooks-histogram.js:21:13)...
- `parallel/test-perf-hooks-histogram.js#block_02_block_02`: createHistogram is not supported in WebAssembly environment     at createHistogram (node:perf_hooks:174:15)     at <anonymous> (/home/node/test/parallel/test-perf-hooks-histogram.js:23:13)     at load...
- `parallel/test-perf-hooks-histogram.js#block_03_block_03`: createHistogram is not supported in WebAssembly environment     at createHistogram (node:perf_hooks:174:15)     at <anonymous> (/home/node/test/parallel/test-perf-hooks-histogram.js:26:13)     at load...
- `parallel/test-perf-hooks-histogram.js#block_04_block_04`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-perf-hooks-histogram.js#block_05_block_05`: createHistogram is not supported in WebAssembly environment     at createHistogram (node:perf_hooks:174:15)     at <anonymous> (/home/node/test/parallel/test-perf-hooks-histogram.js:29:14)     at load...
- `parallel/test-perf-hooks-resourcetiming.js#block_00_performanceresourcetiming_should_not_be_initialized_external`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-perf-hooks-resourcetiming.js:15:8)     at loadModule (node:module:866:32)     ...
- `parallel/test-perf-hooks-resourcetiming.js#block_01_using_performance_getentries`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-perf-hooks-resourcetiming.js:15:8)     at loadModule (node:module:866:32)     ...
- `parallel/test-perf-hooks-resourcetiming.js#block_02_default_values`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-perf-hooks-resourcetiming.js:15:8)     at loadModule (node:module:866:32)     ...
- `parallel/test-perf-hooks-resourcetiming.js#block_03_custom_getters_math`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-perf-hooks-resourcetiming.js:15:8)     at loadModule (node:module:866:32)     ...
- `parallel/test-perf-hooks-resourcetiming.js#block_04_using_performanceobserver`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-perf-hooks-resourcetiming.js:15:8)     at loadModule (node:module:866:32)     ...
- `parallel/test-perf-hooks-usertiming.js#block_00_block_00`: The expression evaluated to a falsy value:    assert(PerformanceMark)  AssertionError: The expression evaluated to a falsy value:    assert(PerformanceMark)      at <anonymous> (/home/node/test/parall...
- `parallel/test-perf-hooks-usertiming.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(PerformanceMark)  AssertionError: The expression evaluated to a falsy value:    assert(PerformanceMark)      at <anonymous> (/home/node/test/parall...
- `parallel/test-perf-hooks-usertiming.js#block_02_block_02`: The expression evaluated to a falsy value:    assert(PerformanceMark)  AssertionError: The expression evaluated to a falsy value:    assert(PerformanceMark)      at <anonymous> (/home/node/test/parall...
- `parallel/test-perf-hooks-worker-timeorigin.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-perf-hooks-worker-t...
- `parallel/test-performance-function.js#block_00_block_00`: not a function     at <anonymous> (/home/node/test/parallel/test-performance-function.js:18:34)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-com...
- `parallel/test-performance-function.js#block_01_block_01`: not a function     at <anonymous> (/home/node/test/parallel/test-performance-function.js:23:25)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-com...
- `parallel/test-performance-function.js#block_02_block_02`: not a function     at <anonymous> (/home/node/test/parallel/test-performance-function.js:22:34)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-com...
- `parallel/test-performance-function.js#block_03_block_03`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'not a function', -   code: 'ERR_INVALID_ARG_TYPE', -   message: /The "fn" argument must be of type function...
- `parallel/test-performance-function.js#block_04_function_can_be_wrapped_many_times_also_check_length_and_nam`: not a function     at <anonymous> (/home/node/test/parallel/test-performance-function.js:27:34)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-com...
- `parallel/test-performance-function.js#block_05_regression_tests_for_https_github_com_nodejs_node_issues_406`: not a function     at <anonymous> (/home/node/test/parallel/test-performance-function.js:70:43)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-com...
- `parallel/test-performance-gc.js`: mustCall verification failed: mustCallAtLeast: expected at least 1 calls, got 0     at mustCallAtLeast (/home/node/test/common/index.js:516:28)     at <anonymous> (/home/node/test/parallel/test-perfor...
- `parallel/test-performance-gc.js#block_00_adding_an_observer_should_force_at_least_one_gc_to_appear`: mustCall verification failed: mustCallAtLeast: expected at least 1 calls, got 0     at mustCallAtLeast (/home/node/test/common/index.js:516:28)     at <anonymous> (/home/node/test/parallel/test-perfor...
- `parallel/test-performance-measure-detail.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-performance-measure...
- `parallel/test-performance-measure.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-performance-measure...
- `sequential/test-perf-hooks.js#block_00_block_00`: EBADF: bad file descriptor, write     at createSystemError (node:fs:186:21)     at writeSync (node:fs:1215:37)     at log (/home/node/test/sequential/test-perf-hooks.js:13:22)     at <anonymous> (/hom...
- `sequential/test-perf-hooks.js#block_01_block_01`: EBADF: bad file descriptor, write     at createSystemError (node:fs:186:21)     at writeSync (node:fs:1215:37)     at log (/home/node/test/sequential/test-perf-hooks.js:13:22)     at <anonymous> (/hom...

### process

- `parallel/test-process-beforeexit-throw-exit.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-process-beforeexit-...
- `parallel/test-process-beforeexit.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-process-beforeexit....
- `parallel/test-process-env-allowed-flags.js#block_00_assert_legit_flags_are_allowed_and_bogus_flags_are_disallowe`: flag should be in set: --perf_basic_prof  false !== true  AssertionError: flag should be in set: --perf_basic_prof  false !== true      at <anonymous> (/home/node/test/parallel/test-process-env-allowe...
- `parallel/test-process-env-allowed-flags.js#block_02_assert_immutability_of_process_allowednodeenvironmentflags`: Expected values to be strictly equal:  false !== true  AssertionError: Expected values to be strictly equal:  false !== true      at <anonymous> (/home/node/test/parallel/test-process-env-allowed-flag...
- `parallel/test-process-env.js#block_00_block_00`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1242:11)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-process-exit-from-before-exit.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-process-exit-from-b...
- `parallel/test-process-getactiveresources-track-timer-lifetime.js#block_00_block_00`: not a function     at <anonymous> (/home/node/test/parallel/test-process-getactiveresources-track-timer-lifetime.js:8:30)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34...
- `parallel/test-process-getactiveresources-track-timer-lifetime.js#block_01_block_01`: not a function     at <anonymous> (/home/node/test/parallel/test-process-getactiveresources-track-timer-lifetime.js:10:30)     at loadModule (node:module:866:32)     at localRequire (node:module:977:3...
- `parallel/test-process-redirect-warnings-env.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-process-redirect...
- `parallel/test-process-redirect-warnings.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-process-redirect...
- `parallel/test-process-warning.js`: Unhandled promise rejection: AssertionError: The input did not match the regular expression /^DeprecationWarning: test$/. Input:  'AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:...

### readline

- `parallel/test-readline-emit-keypress-events.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   'f', -   'o', -   'o' - ]  AssertionError: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   'f'...
- `parallel/test-readline-emit-keypress-events.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   'f', -   'o', -   'o' - ]  AssertionError: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   'f'...
- `parallel/test-readline-emit-keypress-events.js#block_02_block_02`: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   'f', -   'o', -   'o' - ]  AssertionError: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   'f'...
- `parallel/test-readline.js#block_00_block_00`: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-readline.js#block_01_block_01`: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-readline.js#block_02_block_02`: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-readline.js#block_03_block_03`: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-readline.js#block_04_block_04`: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-readline.js#block_05_block_05`: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)

### repl

- `parallel/test-repl-context.js#block_00_test_context_when_useglobal_is_false`: repl is not supported in WebAssembly environment     at start (node:repl:7:15)     at <anonymous> (/home/node/test/parallel/test-repl-context.js:13:18)     at loadModule (node:module:866:32)     at lo...
- `parallel/test-repl-context.js#block_01_test_for_context_side_effects`: repl is not supported in WebAssembly environment     at start (node:repl:7:15)     at <anonymous> (/home/node/test/parallel/test-repl-context.js:16:23)     at loadModule (node:module:866:32)     at lo...
- `parallel/test-repl-programmatic-history.js`: mustCall verification failed: mustCall: expected exactly 10 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-repl-programmatic-...
- `parallel/test-repl-require.js#block_00_block_00`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-repl-require.js:13:15)     at loadModul...
- `parallel/test-repl-require.js#block_01_in_repl_we_shouldn_t_look_up_relative_modules_from_node_modu`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-repl-require.js:13:15)     at loadModul...
- `parallel/test-repl-tab-complete-import.js#block_00_block_00`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-repl-tab-complete-import.js:19:15)     ...
- `parallel/test-repl-tab-complete-import.js#block_01_block_01`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-repl-tab-complete-import.js:19:15)     ...
- `parallel/test-repl-tab-complete-import.js#block_02_test_tab_completion_for_import_relative_to_the_current_direc`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-repl-tab-complete-import.js:19:15)     ...
- `parallel/test-repl-tab-complete.js#block_00_block_00`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-repl-tab-complete.js:46:15)     at load...
- `parallel/test-repl-tab-complete.js#block_01_block_01`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-repl-tab-complete.js:46:15)     at load...
- `parallel/test-repl-tab-complete.js#block_02_test_tab_completion_for_require_relative_to_the_current_dire`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-repl-tab-complete.js:46:15)     at load...
- `parallel/test-repl-tab-complete.js#block_03_tab_completion_for_files_directories`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-repl-tab-complete.js:46:15)     at load...
- `parallel/test-repl-tab-complete.js#block_04_block_04`: ENOENT: no such file or directory, chdir '/' -> '/home/node/test/fixtures'     at chdir (node:process:371:112)     at <anonymous> (/home/node/test/parallel/test-repl-tab-complete.js:46:15)     at load...

### sqlite

- `parallel/test-sqlite-session.js`: 2 test(s) failed     at finalize (node:test:573:29)     at runNext (node:test:620:16)     at executeSuite (node:test:623:25)     at runSuite (node:test:527:64)     at describe (node:test:731:29)     a...
- `parallel/test-sqlite-session.js#test_05_conflict_resolution`: 2 test(s) failed     at finalize (node:test:573:29)     at runNext (node:test:620:16)     at executeSuite (node:test:623:25)     at runSuite (node:test:527:64)     at describe (node:test:731:29)     a...
- `parallel/test-sqlite-statement-sync.js`: Cannot mix named parameters object with positional arguments     at #processParams (node:sqlite:435:33)     at run (node:sqlite:446:44)     at <anonymous> (/home/node/test/parallel/test-sqlite-stateme...
- `parallel/test-sqlite-statement-sync.js#test_06_statementsync_prototype_expandedsql`: Cannot mix named parameters object with positional arguments     at #processParams (node:sqlite:435:33)     at run (node:sqlite:446:44)     at <anonymous> (/home/node/test/parallel/test-sqlite-stateme...
- `parallel/test-sqlite.js`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-sqlite.js#test_00_accessing_the_node_sqlite_module`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...

### stream

- `parallel/test-readable-from-iterator-closing.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at asyncSupport (/home/node/test/parallel/test-readable-from-iter...
- `parallel/test-stream-base-typechecking.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-stream-compose.js`: Unhandled promise rejection:     at ERR_INVALID_RETURN_VALUE (__wasm_rquickjs_builtin/internal/errors:699:109)     at <anonymous> (__wasm_rquickjs_builtin/internal/streams/duplex:232:35)     at apply ...
- `parallel/test-stream-compose.js#block_17_block_17`: Unhandled promise rejection:     at ERR_INVALID_RETURN_VALUE (__wasm_rquickjs_builtin/internal/errors:699:109)     at <anonymous> (__wasm_rquickjs_builtin/internal/streams/duplex:232:35)     at apply ...
- `parallel/test-stream-destroy.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-stream-destroy.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-destroy.js:1...
- `parallel/test-stream-destroy.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-destroy.js:2...
- `parallel/test-stream-destroy.js#block_04_block_04`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-destr...
- `parallel/test-stream-destroy.js#block_05_block_05`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-destr...
- `parallel/test-stream-drop-take.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-drop-take.js...
- `parallel/test-stream-drop-take.js#block_01_don_t_wait_for_next_item_in_the_original_stream_when_already`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-drop-take.js...
- `parallel/test-stream-duplex-destroy.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-duplex-destr...
- `parallel/test-stream-duplex-destroy.js#block_14_block_14`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-duplex-destr...
- `parallel/test-stream-duplex-from.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-duplex-from....
- `parallel/test-stream-duplex-from.js#block_17_block_17`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-duplex-from....
- `parallel/test-stream-duplex-readable-writable.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-duplex-reada...
- `parallel/test-stream-duplex-readable-writable.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-duplex-reada...
- `parallel/test-stream-err-multiple-callback-construction.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-err-multiple...
- `parallel/test-stream-finished.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-stream-finished.js#block_21_block_21`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-finished.js:...
- `parallel/test-stream-finished.js#block_22_block_22`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-finished.js:...
- `parallel/test-stream-finished.js#block_23_block_23`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-finished.js:...
- `parallel/test-stream-finished.js#block_24_block_24`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-finished.js:...
- `parallel/test-stream-finished.js#block_33_block_33`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-stream-finished.js#block_34_block_34`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-stream-finished.js#block_39_block_39`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-stream-finished.js#block_41_block_41`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-finished.js:...
- `parallel/test-stream-map.js`: mustCall verification failed: mustCall: expected exactly 5 call(s), got 6     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-map.js:63:28...
- `parallel/test-stream-map.js#block_03_block_03`: mustCall verification failed: mustCall: expected exactly 5 call(s), got 6     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-map.js:40:28...
- `parallel/test-stream-map.js#block_09_block_09`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-map.js:53:44...
- `parallel/test-stream-pipe-deadlock.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-pipe-deadloc...
- `parallel/test-stream-pipe-without-listenerCount.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 2     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-pipe-without...
- `parallel/test-stream-pipeline-duplex.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-pipeline-dup...
- `parallel/test-stream-pipeline-listeners.js`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly equal: + actual - expected  + 'Expected values to be strictly equal:\n\n2 !== 0\n' - 'no ...
- `parallel/test-stream-pipeline-process.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-stream-pipeline-...
- `parallel/test-stream-pipeline-queued-end-in-destroy.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-pipeline-que...
- `parallel/test-stream-pipeline.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-stream-pipeline.js#block_05_block_05`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-pipel...
- `parallel/test-stream-pipeline.js#block_06_block_06`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-pipel...
- `parallel/test-stream-pipeline.js#block_07_block_07`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-pipel...
- `parallel/test-stream-pipeline.js#block_08_block_08`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-pipel...
- `parallel/test-stream-pipeline.js#block_17_block_17`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-pipel...
- `parallel/test-stream-pipeline.js#block_45_block_45`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-pipel...
- `parallel/test-stream-pipeline.js#block_49_block_49`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-pipel...
- `parallel/test-stream-pipeline.js#block_55_block_55`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-stream-pipeline.js#block_57_block_57`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-stream-pipeline.js#block_71_block_71`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-pipeline.js:...
- `parallel/test-stream-pipeline.js#block_72_block_72`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-pipeline.js:...
- `parallel/test-stream-pipeline.js#block_75_block_75`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:540:28)     at <anonymous> (/home/node/test/parallel/test-stream-pipeline....
- `parallel/test-stream-readable-async-iterators.js`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-reada...
- `parallel/test-stream-readable-async-iterators.js#block_05_block_05`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-reada...
- `parallel/test-stream-readable-async-iterators.js#block_06_block_06`: Unhandled promise rejection:     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/node/test/parallel/test-stream-reada...
- `parallel/test-stream-readable-emittedReadable.js`: mustCall verification failed: mustCall: expected exactly 3 call(s), got 2     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-readable-emi...
- `parallel/test-stream-readable-hwm-0-no-flow-data.js`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 1     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-readable-hwm...
- `parallel/test-stream-readable-needReadable.js`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-readable-nee...
- `parallel/test-stream-readable-object-multi-push-async.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-readable-obj...
- `parallel/test-stream-readable-object-multi-push-async.js#block_04_block_04`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-readable-obj...
- `parallel/test-stream-readable-unpipe-resume.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-readable-unp...
- `parallel/test-stream-reduce.js`: mustCall verification failed: mustCall: expected exactly 3 call(s), got 4     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-reduce.js:56...
- `parallel/test-stream-reduce.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 3 call(s), got 4     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-reduce.js:18...
- `parallel/test-stream-toWeb-allows-server-response.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doListen (node:net:1070:42)     at listen (node:net:1079:31)     at <anonymous> (/home/n...
- `parallel/test-stream-writable-destroy.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-writable-des...
- `parallel/test-stream-writable-destroy.js#block_19_block_19`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-writable-des...
- `parallel/test-stream-writable-end-cb-error.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-writable-end...
- `parallel/test-stream-writable-end-cb-error.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-writable-end...
- `parallel/test-stream-writable-end-cb-error.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-writable-end...
- `parallel/test-stream-writable-end-cb-error.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-writable-end...
- `parallel/test-stream-writable-end-cb-uncaught.js`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + 'Expected "actual" to be reference-equal to "expected":\n' + +   '+ actual - expected\n' + +  ...
- `parallel/test-stream-writable-samecb-singletick.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream-writable-sam...
- `parallel/test-stream2-transform.js`: mustCall verification failed: mustCall: expected exactly 3 call(s), got 2     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream2-transform.j...
- `parallel/test-stream2-transform.js#block_16_block_16`: mustCall verification failed: mustCall: expected exactly 3 call(s), got 2     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream2-transform.j...
- `parallel/test-stream2-writable.js`: not a function     at <anonymous> (__wasm_rquickjs_builtin/internal/streams/readable:704:10)     at <anonymous> (/home/node/test/parallel/test-stream2-writable.js:301:10)     at loadModule (node:modul...
- `parallel/test-stream2-writable.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream2-writable.js...
- `parallel/test-stream2-writable.js#block_05_block_05`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-stream2-writable.js...
- `parallel/test-stream2-writable.js#block_13_block_13`: not a function     at <anonymous> (__wasm_rquickjs_builtin/internal/streams/readable:704:10)     at <anonymous> (/home/node/test/parallel/test-stream2-writable.js:87:10)     at loadModule (node:module...
- `parallel/test-streams-highwatermark.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_VALUE', +   message: `The property 'options.highWaterMark' is invalid. Received "5"`, -   mess...
- `parallel/test-streams-highwatermark.js#block_04_block_04`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-streams-highwatermark.js:27:14)     at loadModule (node:module:866:32)     at ...

### test_runner

- `parallel/test-runner-cli-concurrency.js#test_00_default_concurrency`: The input did not match the regular expression /concurrency: true,/. Input:  ''  AssertionError: The input did not match the regular expression /concurrency: true,/. Input:  ''      at <anonymous> (/h...
- `parallel/test-runner-cli-concurrency.js#test_01_concurrency_of_one`: The input did not match the regular expression /concurrency: 1,/. Input:  ''  AssertionError: The input did not match the regular expression /concurrency: 1,/. Input:  ''      at <anonymous> (/home/no...
- `parallel/test-runner-cli-concurrency.js#test_02_concurrency_of_two`: The input did not match the regular expression /concurrency: 2,/. Input:  ''  AssertionError: The input did not match the regular expression /concurrency: 2,/. Input:  ''      at <anonymous> (/home/no...
- `parallel/test-runner-cli-concurrency.js#test_03_isolation_none_uses_a_concurrency_of_one`: The input did not match the regular expression /concurrency: 1,/. Input:  ''  AssertionError: The input did not match the regular expression /concurrency: 1,/. Input:  ''      at <anonymous> (/home/no...
- `parallel/test-runner-cli-concurrency.js#test_04_isolation_none_overrides_test_concurrency`: The input did not match the regular expression /concurrency: 1,/. Input:  ''  AssertionError: The input did not match the regular expression /concurrency: 1,/. Input:  ''      at <anonymous> (/home/no...
- `parallel/test-runner-cli-timeout.js#test_00_default_timeout_infinity`: The input did not match the regular expression /timeout: Infinity,/. Input:  ''  AssertionError: The input did not match the regular expression /timeout: Infinity,/. Input:  ''      at <anonymous> (/h...
- `parallel/test-runner-cli-timeout.js#test_01_timeout_of_10ms`: The input did not match the regular expression /timeout: 10,/. Input:  "Could not find '10'\n"  AssertionError: The input did not match the regular expression /timeout: 10,/. Input:  "Could not find '...
- `parallel/test-runner-cli-timeout.js#test_02_isolation_none_uses_the_test_timeout_flag`: The input did not match the regular expression /timeout: 10,/. Input:  ''  AssertionError: The input did not match the regular expression /timeout: 10,/. Input:  ''      at <anonymous> (/home/node/tes...
- `parallel/test-runner-cli.js`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-cli.js#block_00_block_00`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-cli.js#block_01_block_01`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-cli.js#block_02_block_02`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-cli.js#block_03_block_03`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-cli.js#block_04_block_04`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-cli.js#block_05_block_05`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-cli.js#block_06_block_06`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-cli.js#block_07_block_07`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-cli.js#block_08_block_08`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-cli.js#block_09_block_09`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-cli.js#block_10_block_10`: Expected values to be strictly equal:  null !== 1  AssertionError: Expected values to be strictly equal:  null !== 1      at <anonymous> (/home/node/test/parallel/test-runner-cli.js:33:24)     at load...
- `parallel/test-runner-concurrency.js`: Expected values to be strictly deep-equal: + actual - expected    [     'suite 1', -   'nested', -   'suite 2',     '1',     '2', +   'nested',     'nested 1',     'nested 2',     'test',     'test 1'...
- `parallel/test-runner-concurrency.js#test_00_concurrency_option_boolean_true`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-runner-concurrency....
- `parallel/test-runner-concurrency.js#test_01_concurrency_option_boolean_false`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-runner-concurrency....
- `parallel/test-runner-concurrency.js#test_02_concurrency_true_implies_infinity`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-runner-concurrency....
- `parallel/test-runner-concurrency.js#test_03_test_multiple_files`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-runner-concurrency....
- `parallel/test-runner-custom-assertions.js`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-custom-assertions.js:45:5)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymo...
- `parallel/test-runner-custom-assertions.js#test_02_invokes_a_custom_assertion_as_part_of_the_test_plan`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-custom-assertions.js:46:5)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymo...
- `parallel/test-runner-error-reporter.js#test_00_all_tests_failures_reported_without_fail_fast_flag`: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (/home/node/test/parallel/test-runner-error-reporter.js:20:22)     at...
- `parallel/test-runner-error-reporter.js#test_01_fail_fast_stops_test_execution_after_first_failure`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-runner-error-reporter.js:32:22)     at...
- `parallel/test-runner-extraneous-async-activity.js#block_00_block_00`: The input did not match the regular expression /Error: Test "extraneous async activity test" at .+extraneous_set_immediate_async\.mjs:3:1 generated asynchronous activity after the test ended/m. Input:...
- `parallel/test-runner-extraneous-async-activity.js#block_01_block_01`: The input did not match the regular expression /Error: Test "extraneous async activity test" at .+extraneous_set_timeout_async\.mjs:3:1 generated asynchronous activity after the test ended/m. Input:  ...
- `parallel/test-runner-extraneous-async-activity.js#block_02_block_02`: The input did not match the regular expression /Error: Test hook "before" at .+async-error-in-test-hook\.mjs:3:1 generated asynchronous activity after the test ended/m. Input:  ''  AssertionError: The...
- `parallel/test-runner-extraneous-async-activity.js#block_03_block_03`: The input did not match the regular expression /Error: Test hook "before" at .+async-error-in-test-hook\.mjs:3:1 generated asynchronous activity after the test ended/m. Input:  ''  AssertionError: The...
- `parallel/test-runner-filetest-location.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-runner-filetest-loc...
- `parallel/test-runner-force-exit-flush.js#test_00_junit_reporter`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at runWithReporter (/home/node/test/parallel/test-runner-force-exit-flush.js:22:15) ...
- `parallel/test-runner-force-exit-flush.js#test_01_spec_reporter`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at runWithReporter (/home/node/test/parallel/test-runner-force-exit-flush.js:22:15) ...
- `parallel/test-runner-force-exit-flush.js#test_02_tap_reporter`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at runWithReporter (/home/node/test/parallel/test-runner-force-exit-flush.js:22:15) ...
- `parallel/test-runner-mocking.js`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-runner-mocking.js#test_14_given_null_to_a_mock_method_it_throws_a_invalid_argument_err`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-runner-mocking.js#test_15_it_should_throw_given_an_inexistent_property_on_a_object_ins`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-runner-mocking.js:400:10)     at call (native)     at runTest (node:test:432:3...
- `parallel/test-runner-mocking.js#test_17_spy_functions_don_t_affect_the_prototype_chain`: The expression evaluated to a falsy value:    assert.ok(CAfterMockHasDescriptor)  AssertionError: The expression evaluated to a falsy value:    assert.ok(CAfterMockHasDescriptor)      at <anonymous> (...
- `parallel/test-runner-mocking.js#test_21_mocks_a_constructor`: The expression evaluated to a falsy value:    assert(!(instance instanceof MockClazz))  AssertionError: The expression evaluated to a falsy value:    assert(!(instance instanceof MockClazz))      at <...
- `parallel/test-runner-mocking.js#test_27_mocked_functions_match_name_and_length`: Expected values to be strictly deep-equal: + actual - expected ... Skipped lines    {     length: {       configurable: true,       enumerable: false,       value: 0, ...       enumerable: false, +   ...
- `parallel/test-runner-mocking.js#test_28_method_fails_if_method_cannot_be_redefined`: The input did not match the regular expression /Cannot redefine property: method/. Input:  "TypeError: 'method' is read-only"  AssertionError: The input did not match the regular expression /Cannot re...
- `parallel/test-runner-mocking.js#test_29_method_fails_if_field_is_a_property_instead_of_a_method`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-runner-mocking.js:816:10)     at call (native)     at runTest (node:test:432:3...
- `parallel/test-runner-mocking.js#test_34_uses_top_level_mock`: Expected values to be strictly equal:  -1 !== 7  AssertionError: Expected values to be strictly equal:  -1 !== 7      at <anonymous> (/home/node/test/parallel/test-runner-mocking.js:967:22)     at cal...
- `parallel/test-runner-mocking.js#test_36_method_names_must_be_strings_or_symbols`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-runner-mocking.js:987:10)     at call (native)     at runTest (node:test:432:3...
- `parallel/test-runner-module-mocking.js#test_00_input_validation`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-runner-module-mocking.js#test_01_core_module_mocking_with_namedexports_option`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:52:12)     at call (native)     at <anonymous> (node:test:168:32)     at <anonymous> (/home/node/test/parallel...
- `parallel/test-runner-module-mocking.js#test_02_cjs_mocking_with_namedexports_option`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:159:33)     at call (native)     at <anonymous> (node:test:168:32)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-runner-module-mocking.js#test_03_esm_mocking_with_namedexports_option`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:267:19)
- `parallel/test-runner-module-mocking.js#test_04_modules_cannot_be_mocked_multiple_times_at_once`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:374:19)     at call (native)     at <anonymous> (node:test:168:32)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-runner-module-mocking.js#test_05_mocks_are_automatically_restored`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:434:33)     at call (native)     at <anonymous> (node:test:168:32)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-runner-module-mocking.js#test_06_mocks_can_be_restored_independently`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:466:47)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymou...
- `parallel/test-runner-module-mocking.js#test_07_core_module_mocks_can_be_used_by_both_module_systems`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:494:27)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymou...
- `parallel/test-runner-module-mocking.js#test_08_node_core_module_mocks_can_be_used_by_both_module_systems`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:513:27)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymou...
- `parallel/test-runner-module-mocking.js#test_09_cjs_mocks_can_be_used_by_both_module_systems`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:534:33)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymou...
- `parallel/test-runner-module-mocking.js#test_10_relative_paths_can_be_used_by_both_module_systems`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:556:30)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymou...
- `parallel/test-runner-module-mocking.js#test_11_node_modules_can_be_used_by_both_module_systems`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-runner-module-mocking.js#test_12_file_imports_are_supported_in_esm_only`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:590:30)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymou...
- `parallel/test-runner-module-mocking.js#test_13_mocked_modules_do_not_impact_unmocked_modules`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:607:10)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymou...
- `parallel/test-runner-module-mocking.js#test_14_defaultexports_work_with_cjs_mocks_in_both_module_systems`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:625:17)     at call (native)     at runTest (node:test:432:32)     at test (node:test:663:28)     at <anonymou...
- `parallel/test-runner-module-mocking.js#test_15_defaultexports_work_with_esm_mocks_in_both_module_systems`: not a function     at <anonymous> (/home/node/test/parallel/test-runner-module-mocking.js:637:10)
- `parallel/test-runner-module-mocking.js#test_16_wrong_import_syntax_should_throw_error_after_module_mocking`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-runner-module-mocking.js#test_17_should_throw_err_access_denied_when_permission_model_is_enab`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-runner-module-mocking.js#test_18_should_work_when_allow_worker_is_passed_and_permission_model`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:118:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-runner-no-isolation-filtering.js#test_00_works_with_test_only`: The input did not match the regular expression /# tests 2/. Input:  ''  AssertionError: The input did not match the regular expression /# tests 2/. Input:  ''      at <anonymous> (/home/node/test/para...
- `parallel/test-runner-no-isolation-filtering.js#test_01_works_with_test_name_pattern`: The input did not match the regular expression /# tests 0/. Input:  ''  AssertionError: The input did not match the regular expression /# tests 0/. Input:  ''      at <anonymous> (/home/node/test/para...
- `parallel/test-runner-no-isolation-filtering.js#test_02_works_with_test_skip_pattern`: The input did not match the regular expression /# tests 1/. Input:  ''  AssertionError: The input did not match the regular expression /# tests 1/. Input:  ''      at <anonymous> (/home/node/test/para...
- `parallel/test-runner-root-after-with-refed-handles.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-runner-root-after-w...
- `parallel/test-runner-snapshot-file-tests.js#test_00_t_assert_filesnapshot_validation`: 4 test(s) failed     at finalize (node:test:573:29)     at runNext (node:test:620:16)     at executeSuite (node:test:623:25)     at runSuite (node:test:527:64)     at describe (node:test:731:29)     a...
- `parallel/test-runner-snapshot-file-tests.js#test_01_t_assert_filesnapshot_update_read_flow`: 3 test(s) failed     at finalize (node:test:573:29)     at runNext (node:test:620:16)     at <anonymous> (node:test:610:36)     at apply (native)     at wrapped (node:async_hooks:141:34)     at _resto...
- `parallel/test-runner-test-filepath.js`: Expected values to be strictly equal: + actual - expected  + '/tmp/w/temp.js' - '/home/node/test/parallel/test-runner-test-filepath.js'  AssertionError: Expected values to be strictly equal: + actual ...
- `parallel/test-runner-todo-skip-tests.js`: mustCall verification failed: mustCall: expected exactly 4 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-runner-todo-skip-te...

### timers

- `parallel/test-timers-immediate-queue-throw.js`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - 'uncaughtException'      at <anonymous> (/home/node/test/parallel/test-timers-imme...
- `parallel/test-timers-max-duration-warning.js`: mustCall verification failed: mustCall: expected exactly 6 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-max-duration...
- `parallel/test-timers-max-duration-warning.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 6 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-max-duration...
- `parallel/test-timers-max-duration-warning.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 6 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-max-duration...
- `parallel/test-timers-max-duration-warning.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 6 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-max-duration...
- `parallel/test-timers-timeout-to-interval.js`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 1     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-timeout-to-i...
- `parallel/test-timers-uncaught-exception.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-uncaught-exc...
- `parallel/test-timers-unenroll-unref-interval.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 223     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-unenroll-u...
- `parallel/test-timers-unenroll-unref-interval.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 221     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-unenroll-u...
- `parallel/test-timers-unenroll-unref-interval.js#block_03_block_03`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 226     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-unenroll-u...
- `parallel/test-timers-unenroll-unref-interval.js#block_04_block_04`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 220     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-unenroll-u...
- `parallel/test-timers-unref-throw-then-ref.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-unref-throw-...
- `parallel/test-timers-unrefed-in-beforeexit.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-unrefed-in-b...
- `parallel/test-timers-user-call.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 10 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-user-call.j...
- `parallel/test-timers-zero-timeout.js`: mustCall verification failed: mustCall: expected exactly 3 call(s), got 1     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-zero-timeout...
- `parallel/test-timers-zero-timeout.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 3 call(s), got 1     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-timers-zero-timeout...

### tls

- `parallel/test-tls-basic-validations.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'tls is not supported in WebAssembly environment', +   name: 'Error' -   code: 'ERR_INVALID_ARG_TYPE', -   m...
- `parallel/test-tls-basic-validations.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'tls is not supported in WebAssembly environment', +   name: 'Error' -   code: 'ERR_INVALID_ARG_TYPE', -   m...
- `parallel/test-tls-basic-validations.js#block_02_block_02`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'tls is not supported in WebAssembly environment', +   name: 'Error' -   code: 'ERR_INVALID_ARG_TYPE', -   m...
- `parallel/test-tls-connect-allow-half-open-option.js#block_00_block_00`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-connect-allow-half-open-option.js#block_01_block_01`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-external-accessor.js#block_00_ensure_accessing_external_doesn_t_hit_an_assert_in_the_acces`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-external-accessor.js#block_01_block_01`: not a function     at <anonymous> (/home/node/test/parallel/test-tls-external-accessor.js:13:20)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-co...
- `parallel/test-tls-server-parent-constructor-options.js#block_00_block_00`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-server-parent-constructor-options.js#block_01_block_01`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-socket-allow-half-open-option.js#block_00_block_00`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-socket-allow-half-open-option.js#block_01_block_01`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-socket-allow-half-open-option.js#block_02_block_02`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-socket-allow-half-open-option.js#block_03_block_03`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-translate-peer-certificate.js#block_00_block_00`: Cannot find module '_tls_common'     at localRequire (node:module:988:59)     at <anonymous> (/home/node/test/parallel/test-tls-translate-peer-certificate.js:9:38)     at loadModule (node:module:866:3...
- `parallel/test-tls-translate-peer-certificate.js#block_01_block_01`: Cannot find module '_tls_common'     at localRequire (node:module:988:59)     at <anonymous> (/home/node/test/parallel/test-tls-translate-peer-certificate.js:9:38)     at loadModule (node:module:866:3...
- `parallel/test-tls-wrap-econnreset-pipe.js`: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:net:77:25)     at doIpcListen (node:net:1032:46)     at listen (node:net:1037:9)     at <anonymous> (/home...
- `sequential/test-tls-connect.js#block_00_uncatchable_exception_on_tls_connection_error`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `sequential/test-tls-connect.js#block_01_ssl_accept_ssl_connect_error_handling`: The input did not match the regular expression /no cipher match/i. Input:  'Error: tls is not supported in WebAssembly environment'  AssertionError: The input did not match the regular expression /no ...

### v8

- `parallel/test-v8-collect-gc-profile-exit-before-stop.js#block_00_test_if_it_makes_the_process_crash`: not a function     at <anonymous> (/home/node/test/parallel/test-v8-collect-gc-profile-exit-before-stop.js:7:24)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at ...
- `parallel/test-v8-collect-gc-profile-exit-before-stop.js#block_01_block_01`: not a function     at <anonymous> (/home/node/test/parallel/test-v8-collect-gc-profile-exit-before-stop.js:8:24)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at ...
- `parallel/test-v8-query-objects.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-v8-query-objects.js#block_01_block_01`: not a function     at <anonymous> (/home/node/test/parallel/test-v8-query-objects.js:24:38)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-...
- `parallel/test-v8-query-objects.js#block_02_block_02`: not a function     at <anonymous> (/home/node/test/parallel/test-v8-query-objects.js:27:35)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-...
- `parallel/test-v8-query-objects.js#block_03_block_03`: not a function     at <anonymous> (/home/node/test/parallel/test-v8-query-objects.js:27:38)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-...
- `parallel/test-v8-query-objects.js#block_04_block_04`: not a function     at <anonymous> (/home/node/test/parallel/test-v8-query-objects.js:35:35)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compat-...

### vm

- `parallel/test-vm-basic.js#block_00_vm_runinnewcontext`: Expected values to be strictly deep-equal: + actual - expected  + {} - { -   foo: 'bar', -   typeofProcess: 'undefined' - }  AssertionError: Expected values to be strictly deep-equal: + actual - expec...
- `parallel/test-vm-basic.js#block_01_vm_runincontext`: Expected values to be strictly deep-equal: + actual - expected    { +   [Symbol(vm.context)]: 1, -   baz: 'bar',     foo: 'bar', -   typeofProcess: 'undefined'   }  AssertionError: Expected values to ...
- `parallel/test-vm-basic.js#block_02_vm_runinthiscontext`: Expected values to be strictly equal: + actual - expected  + '[object Object]' - '[object process]'            ^  AssertionError: Expected values to be strictly equal: + actual - expected  + '[object ...
- `parallel/test-vm-basic.js#block_03_vm_runinnewcontext`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-vm-basic.js:59:42)     at forEach (native)     at <ano...
- `parallel/test-vm-basic.js#block_04_vm_createcontext`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-vm-basic.js:57:42)     at forEach (native)     at <ano...
- `parallel/test-vm-basic.js#block_05_run_script_with_filename`: The "checkErr" validation function is expected to return "true". Received false  Caught error:  Error: boom AssertionError: The "checkErr" validation function is expected to return "true". Received fa...
- `parallel/test-vm-basic.js#block_06_vm_compilefunction`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-vm-basic.js:53:42)     at forEach (native)     at <ano...
- `parallel/test-vm-codegen.js#block_00_block_00`: WebAssembly is not defined     at <anonymous> (eval_script:1:19)     at <eval> (eval_script:1:64)     at runInContext (__wasm_rquickjs_builtin/vm:260:54)     at <anonymous> (/home/node/test/parallel/t...
- `parallel/test-vm-codegen.js#block_01_block_01`: The "EvalError" validation function is expected to return "true". Received EvalError: ReferenceError: x is not defined     at call (native)     at expectedException (node:assert:1943:31)     at expect...
- `parallel/test-vm-codegen.js#block_02_block_02`: WebAssembly is not defined     at <anonymous> (eval_script:1:19)     at <eval> (eval_script:1:64)     at runInContext (__wasm_rquickjs_builtin/vm:260:54)     at <anonymous> (/home/node/test/parallel/t...
- `parallel/test-vm-context-dont-contextify.js#block_00_block_00`: cannot read property 'DONT_CONTEXTIFY' of undefined     at <anonymous> (/home/node/test/parallel/test-vm-context-dont-contextify.js:13:36)     at loadModule (node:module:866:32)     at localRequire (n...
- `parallel/test-vm-context-dont-contextify.js#block_01_block_01`: cannot read property 'DONT_CONTEXTIFY' of undefined     at <anonymous> (/home/node/test/parallel/test-vm-context-dont-contextify.js:15:36)     at loadModule (node:module:866:32)     at localRequire (n...
- `parallel/test-vm-context-dont-contextify.js#block_02_block_02`: cannot read property 'DONT_CONTEXTIFY' of undefined     at <anonymous> (/home/node/test/parallel/test-vm-context-dont-contextify.js:17:36)     at loadModule (node:module:866:32)     at localRequire (n...
- `parallel/test-vm-context-dont-contextify.js#block_03_block_03`: cannot read property 'DONT_CONTEXTIFY' of undefined     at <anonymous> (/home/node/test/parallel/test-vm-context-dont-contextify.js:21:24)     at loadModule (node:module:866:32)     at localRequire (n...
- `parallel/test-vm-context-dont-contextify.js#block_04_block_04`: cannot read property 'DONT_CONTEXTIFY' of undefined     at <anonymous> (/home/node/test/parallel/test-vm-context-dont-contextify.js:22:5)     at loadModule (node:module:866:32)     at localRequire (no...
- `parallel/test-vm-context-dont-contextify.js#block_05_block_05`: cannot read property 'DONT_CONTEXTIFY' of undefined     at <anonymous> (/home/node/test/parallel/test-vm-context-dont-contextify.js:23:36)     at loadModule (node:module:866:32)     at localRequire (n...
- `parallel/test-vm-context-dont-contextify.js#block_06_block_06`: cannot read property 'DONT_CONTEXTIFY' of undefined     at <anonymous> (/home/node/test/parallel/test-vm-context-dont-contextify.js:76:36)     at loadModule (node:module:866:32)     at localRequire (n...
- `parallel/test-vm-context-dont-contextify.js#block_07_block_07`: cannot read property 'DONT_CONTEXTIFY' of undefined     at <anonymous> (/home/node/test/parallel/test-vm-context-dont-contextify.js:78:36)     at loadModule (node:module:866:32)     at localRequire (n...
- `parallel/test-vm-measure-memory-lazy.js#block_00_or_otherwise_these_may_not_resolve`: Cannot find module '../common/measure-memory' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/p...
- `parallel/test-vm-measure-memory-lazy.js#block_01_block_01`: Cannot find module '../common/measure-memory' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/p...
- `parallel/test-vm-measure-memory-lazy.js#block_02_block_02`: Cannot find module '../common/measure-memory' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/p...
- `parallel/test-vm-measure-memory-lazy.js#block_03_block_03`: Cannot find module '../common/measure-memory' from '/home/node/test/parallel'     at resolveFilename (node:module:380:80)     at localRequire (node:module:976:44)     at <anonymous> (/home/node/test/p...
- `parallel/test-vm-new-script-new-context.js`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-vm-new-script-new-context.js:71:22)   ...
- `parallel/test-vm-new-script-new-context.js#block_04_block_04`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-vm-new-script-new-context.js:47:22)   ...
- `parallel/test-vm-new-script-new-context.js#block_07_block_07`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-vm-new-script-new-context.js:45:10)     at loadModule (node:module:866:32)    ...
- `sequential/test-vm-break-on-sigint.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/sequential/test-vm-break-on-sigin...

### worker_threads

- `parallel/test-worker-abort-on-uncaught-exception-terminate.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-abort-on-unc...
- `parallel/test-worker-abort-on-uncaught-exception.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-abort-on-unc...
- `parallel/test-worker-arraybuffer-zerofill.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at Countdown (/home/node/test/common/countdown.js:13:39)     at <...
- `parallel/test-worker-beforeexit-throw-exit.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-beforeexit-t...
- `parallel/test-worker-broadcastchannel-wpt.js#block_00_block_00`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at <anonymous> (/home/node/test/parallel/test-worker-broadcastchannel-wpt.js:10:18) ...
- `parallel/test-worker-broadcastchannel-wpt.js#block_01_block_01`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at <anonymous> (/home/node/test/parallel/test-worker-broadcastchannel-wpt.js:35:18) ...
- `parallel/test-worker-broadcastchannel-wpt.js#block_02_block_02`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at <anonymous> (/home/node/test/parallel/test-worker-broadcastchannel-wpt.js:15:18) ...
- `parallel/test-worker-broadcastchannel-wpt.js#block_03_block_03`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at <anonymous> (/home/node/test/parallel/test-worker-broadcastchannel-wpt.js:17:18) ...
- `parallel/test-worker-broadcastchannel-wpt.js#block_04_block_04`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at <anonymous> (/home/node/test/parallel/test-worker-broadcastchannel-wpt.js:19:18) ...
- `parallel/test-worker-broadcastchannel-wpt.js#block_05_block_05`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at <anonymous> (/home/node/test/parallel/test-worker-broadcastchannel-wpt.js:24:20) ...
- `parallel/test-worker-broadcastchannel.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_02_block_02`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_03_block_03`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_04_block_04`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_05_block_05`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_06_block_06`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_07_block_07`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_08_block_08`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-cjs-workerdata.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-cjs-workerda...
- `parallel/test-worker-cleanexit-with-js.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-cleanexit-wi...
- `parallel/test-worker-cleanup-handles.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-cleanup-hand...
- `parallel/test-worker-console-listeners.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-console-list...
- `parallel/test-worker-crypto-sign-transfer-result.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-crypto-sign-...
- `parallel/test-worker-data-url.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-data-url.js:...
- `parallel/test-worker-dns-terminate.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-dns-terminat...
- `parallel/test-worker-error-stack-getter-throws.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-error-stack-...
- `parallel/test-worker-esm-exit.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-esm-exit.js:...
- `parallel/test-worker-esm-missing-main.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-esm-missing-...
- `parallel/test-worker-esmodule.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-esmodule.js:...
- `parallel/test-worker-event.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-event.js:10:...
- `parallel/test-worker-execargv-invalid.js#block_00_block_00`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-worker-execargv-invalid.js:13:10)     at loadModule (n...
- `parallel/test-worker-execargv-invalid.js#block_01_block_01`: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at <anonymous> (/home/node/test/parallel/test-worker-execargv-invalid.js:14:10)     at loadModule (node:modu...
- `parallel/test-worker-execargv-invalid.js#block_02_block_02`: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at <anonymous> (/home/node/test/parallel/test-worker-execargv-invalid.js:16:10)     at loadModule (node:modu...
- `parallel/test-worker-exit-event-error.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-exit-event-e...
- `parallel/test-worker-exit-from-uncaught-exception.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-exit-from-un...
- `parallel/test-worker-exit-heapsnapshot.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-exit-heapsna...
- `parallel/test-worker-fs-stat-watcher.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-fs-stat-watc...
- `parallel/test-worker-heap-snapshot.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-heap-snapsho...
- `parallel/test-worker-heapdump-failure.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-heapdump-fai...
- `parallel/test-worker-http2-generic-streams-terminate.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-http2-generi...
- `parallel/test-worker-http2-stream-terminate.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at spinWorker (/home/node/test/parallel/test-worker-http2-stream-...
- `parallel/test-worker-memory.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at run (/home/node/test/parallel/test-worker-memory.js:27:31)    ...
- `parallel/test-worker-message-channel.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-chan...
- `parallel/test-worker-message-channel.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-chan...
- `parallel/test-worker-message-channel.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-chan...
- `parallel/test-worker-message-event.js#block_00_block_00`: MessageEvent is not defined     at <anonymous> (/home/node/test/parallel/test-worker-message-event.js:52:20)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runT...
- `parallel/test-worker-message-event.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'MessageEvent is not defined', +   name: 'ReferenceError' -   message: /MessageEvent constructor: Expected e...
- `parallel/test-worker-message-event.js#block_02_block_02`: MessageEvent is not defined     at <anonymous> (/home/node/test/parallel/test-worker-message-event.js:12:14)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runT...
- `parallel/test-worker-message-mark-as-uncloneable.js#block_00_uncloneables_cannot_be_cloned_during_message_posting`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-mark-as-uncloneable.js:13:21)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at run...
- `parallel/test-worker-message-mark-as-uncloneable.js#block_01_uncloneables_cannot_be_cloned_during_structured_cloning`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-mark-as-uncloneable.js:23:21)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at run...
- `parallel/test-worker-message-mark-as-uncloneable.js#block_02_markasuncloneable_cannot_affect_arraybuffer`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-mark-as-uncloneable.js:20:21)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at run...
- `parallel/test-worker-message-mark-as-uncloneable.js#block_03_markasuncloneable_can_affect_node_js_built_in_object_like_bl`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-mark-as-uncloneable.js:30:21)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at run...
- `parallel/test-worker-message-port-arraybuffer.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-port...
- `parallel/test-worker-message-port-close.js#block_00_block_00`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-port-close.js:21:9)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node...
- `parallel/test-worker-message-port-close.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-port...
- `parallel/test-worker-message-port-close.js#block_02_block_02`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-worker-message-port-close.js:19:10)     at loadModule (node:module:866:32)    ...
- `parallel/test-worker-message-port-message-before-close.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-port...
- `parallel/test-worker-message-port-message-port-transferring.js`: Transfer list item is not transferable     at DOMException (__wasm_rquickjs_builtin/abort_controller:27:9)     at dataCloneError (__wasm_rquickjs_builtin/structured_clone:243:16)     at structuredClon...
- `parallel/test-worker-message-port-terminate-transfer-list.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-port...
- `parallel/test-worker-message-port-transfer-duplicate.js#block_00_block_00`: The input did not match the regular expression /^DataCloneError: Transfer list contains duplicate MessagePort$/. Input:  'DataCloneError: Transfer list item is not transferable'  AssertionError: The i...
- `parallel/test-worker-message-port-transfer-duplicate.js#block_01_block_01`: The input did not match the regular expression /^DataCloneError: Transfer list contains duplicate ArrayBuffer$/. Input:  'DataCloneError: ArrayBuffer occurs in transfer list more than once'  Assertion...
- `parallel/test-worker-message-port-wasm-threads.js#block_00_block_00`: WebAssembly is not defined     at <anonymous> (/home/node/test/parallel/test-worker-message-port-wasm-threads.js:11:24)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34) ...
- `parallel/test-worker-message-port-wasm-threads.js#block_01_block_01`: WebAssembly is not defined     at <anonymous> (/home/node/test/parallel/test-worker-message-port-wasm-threads.js:11:24)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34) ...
- `parallel/test-worker-message-port.js`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-port.js:22:40)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-comp...
- `parallel/test-worker-message-port.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-port...
- `parallel/test-worker-message-port.js#block_01_block_01`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-port.js:11:40)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-comp...
- `parallel/test-worker-message-port.js#block_02_block_02`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - <ref *1> MessagePort { -   _target: MessagePort { -     _target: [Circular *1] -  ...
- `parallel/test-worker-message-port.js#block_03_block_03`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-port...
- `parallel/test-worker-message-port.js#block_04_block_04`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-port.js:22:9)     at loadModule (node:module:866:32)     at localRequire (node:module:977:34)     at runTest (node-compa...
- `parallel/test-worker-message-port.js#block_05_block_05`: Expected values to be strictly deep-equal: + actual - expected    Comparison { -   code: 'ERR_INVALID_ARG_TYPE',     constructor: [Function: TypeError], +   message: 'value is not iterable' -   messag...
- `parallel/test-worker-message-port.js#block_06_block_06`: Expected values to be strictly equal:  10 !== 0  AssertionError: Expected values to be strictly equal:  10 !== 0      at <anonymous> (/home/node/test/parallel/test-worker-message-port.js:40:24)     at...
- `parallel/test-worker-message-port.js#block_07_block_07`: Transfer list item is not transferable     at DOMException (__wasm_rquickjs_builtin/abort_controller:27:9)     at dataCloneError (__wasm_rquickjs_builtin/structured_clone:243:16)     at structuredClon...
- `parallel/test-worker-message-port.js#block_08_block_08`: Expected values to be strictly deep-equal: + actual - expected    [ +   '_enqueueDelivery',     'close',     'constructor', +   'on', +   'once', -   'hasRef',     'onmessage',     'onmessageerror',  ...
- `parallel/test-worker-message-transfer-port-mark-as-untransferable.js#block_00_block_00`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-transfer-port-mark-as-untransferable.js:10:38)     at loadModule (node:module:866:32)     at localRequire (node:module:9...
- `parallel/test-worker-message-transfer-port-mark-as-untransferable.js#block_01_block_01`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-transfer-port-mark-as-untransferable.js:13:38)     at loadModule (node:module:866:32)     at localRequire (node:module:9...
- `parallel/test-worker-message-transfer-port-mark-as-untransferable.js#block_02_block_02`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-transfer-port-mark-as-untransferable.js:13:41)     at loadModule (node:module:866:32)     at localRequire (node:module:9...
- `parallel/test-worker-message-transfer-port-mark-as-untransferable.js#block_03_block_03`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-transfer-port-mark-as-untransferable.js:16:38)     at loadModule (node:module:866:32)     at localRequire (node:module:9...
- `parallel/test-worker-mjs-workerdata.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-mjs-workerda...
- `parallel/test-worker-nearheaplimit-deadlock.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-nearheaplimi...
- `parallel/test-worker-nested-on-process-exit.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-nested-on-pr...
- `parallel/test-worker-nexttick-terminate.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-nexttick-ter...
- `parallel/test-worker-no-sab.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-no-sab.js:16...
- `parallel/test-worker-non-fatal-uncaught-exception.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-non-fatal-un...
- `parallel/test-worker-onmessage.js`: mustCall verification failed: mustCall: expected exactly 3 call(s), got 1     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-onmessage.js...
- `parallel/test-worker-parent-port-ref.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-parent-port-...
- `parallel/test-worker-process-env-shared.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-process-env-...
- `parallel/test-worker-process-exit-async-module.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-process-exit...
- `parallel/test-worker-ref.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-ref.js:15:35...
- `parallel/test-worker-relative-path-double-dot.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-relative-pat...
- `parallel/test-worker-relative-path.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-relative-pat...
- `parallel/test-worker-safe-getters.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-safe-getters...
- `parallel/test-worker-sharedarraybuffer-from-worker-thread.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-sharedarrayb...
- `parallel/test-worker-stack-overflow-stack-size.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-stack-overfl...
- `parallel/test-worker-stdio-from-preload-module.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-stdio-from-p...
- `parallel/test-worker-syntax-error-file.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-syntax-error...
- `parallel/test-worker-syntax-error.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-syntax-error...
- `parallel/test-worker-terminate-microtask-loop.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-terminate-mi...
- `parallel/test-worker-terminate-nested.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-terminate-ne...
- `parallel/test-worker-terminate-null-handler.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-terminate-nu...
- `parallel/test-worker-terminate-ref-public-port.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-terminate-re...
- `parallel/test-worker-terminate-source-map.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-terminate-so...
- `parallel/test-worker-terminate-timers.js`: mustCall verification failed: mustCallAtLeast: expected at least 1 calls, got 0     at mustCallAtLeast (/home/node/test/common/index.js:516:28)     at <anonymous> (/home/node/test/parallel/test-worker...
- `parallel/test-worker-terminate-unrefed.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-terminate-un...
- `parallel/test-worker-track-unmanaged-fds.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-track-unmana...
- `parallel/test-worker-uncaught-exception-async.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-uncaught-exc...
- `parallel/test-worker-uncaught-exception.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-uncaught-exc...
- `parallel/test-worker-unsupported-path.js#block_00_block_00`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-worker-unsupported-path.js:14:10)     at loadModule (n...
- `parallel/test-worker-unsupported-path.js#block_01_block_01`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-worker-unsupported-path.js:12:5)     at loadModule (node:module:866:32)     at...
- `parallel/test-worker-unsupported-path.js#block_02_block_02`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-worker-unsupported-path.js:17:10)     at loadModule (n...
- `parallel/test-worker-unsupported-things.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-unsupported-...
- `parallel/test-worker-vm-context-terminate.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-vm-context-t...
- `parallel/test-worker-voluntarily-exit-followed-by-addition.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-voluntarily-...
- `parallel/test-worker-voluntarily-exit-followed-by-throw.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker-voluntarily-...
- `parallel/test-worker-workerdata-messageport.js`: Expected values to be strictly equal:  4 !== 0  AssertionError: Expected values to be strictly equal:  4 !== 0      at <anonymous> (/home/node/test/parallel/test-worker-workerdata-messageport.js:44:22...
- `parallel/test-worker-workerdata-messageport.js#block_02_block_02`: Expected values to be strictly equal:  4 !== 0  AssertionError: Expected values to be strictly equal:  4 !== 0      at <anonymous> (/home/node/test/parallel/test-worker-workerdata-messageport.js:34:22...
- `parallel/test-worker-workerdata-messageport.js#block_03_block_03`: Missing expected exception (DataCloneError). AssertionError: Missing expected exception (DataCloneError).     at <anonymous> (/home/node/test/parallel/test-worker-workerdata-messageport.js:35:14)     ...
- `parallel/test-worker.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-worker.js:10:26)   ...
- `sequential/test-worker-fshandles-error-on-termination.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at spinWorker (/home/node/test/sequential/test-worker-fshandles-e...
- `sequential/test-worker-fshandles-open-close-on-termination.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at spinWorker (/home/node/test/sequential/test-worker-fshandles-o...

### zlib

- `parallel/test-zlib-brotli-16GB.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-zlib-brotli-16GB.js...
- `parallel/test-zlib-bytes-read.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-zlib-bytes-read.js:...
- `parallel/test-zlib-close-after-error.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-zlib-close-after-er...
- `parallel/test-zlib-destroy-pipe.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 2     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-zlib-destroy-pipe.j...
- `parallel/test-zlib-destroy.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-zlib-destroy.js:17:...
- `parallel/test-zlib-destroy.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-zlib-destroy.js:17:...
- `parallel/test-zlib-flush-drain-longblock.js`: mustCall verification failed: mustCallAtLeast: expected at least 2 calls, got 1     at mustCallAtLeast (/home/node/test/common/index.js:516:28)     at <anonymous> (/home/node/test/parallel/test-zlib-f...
- `parallel/test-zlib-invalid-input-memory.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-zlib-invalid-input-...
- `parallel/test-zlib-invalid-input.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-zlib-invalid-input....
- `parallel/test-zlib-premature-end.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:501:28)     at <anonymous> (/home/node/test/parallel/test-zlib-premature-end....

## Error Tests (runtime/instantiation errors)

69 tests had runtime errors.

<details>
<summary>Click to expand</summary>

- `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_00_a_mjs_b_mjs_c_mjs_d_mjs_c_mjs`: error while executing at wasm backtrace:     0: 0xeeb146 - node_compat_runner.wasm!abort     1: 0xeecad2 - node_compat_runner.wasm!__assert_fail     2: 0xe26ce7 - node_compat_runner.wasm!js_inner_modu...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_01_b_mjs_c_mjs_d_mjs_c_mjs`: error while executing at wasm backtrace:     0: 0xeeb146 - node_compat_runner.wasm!abort     1: 0xeecad2 - node_compat_runner.wasm!__assert_fail     2: 0xe26ce7 - node_compat_runner.wasm!js_inner_modu...
- `parallel/test-abortcontroller.js`: error while executing at wasm backtrace:     0: 0xdaf28d - node_compat_runner.wasm!JS_CallInternal     1: 0xdb2474 - node_compat_runner.wasm!JS_CallInternal     2: 0xd83815 - node_compat_runner.wasm!J...
- `parallel/test-buffer-indexof.js`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_02_block_02`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_03_block_03`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_04_test_truncation_of_number_arguments_to_uint8`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_05_test_that_uint8array_arguments_are_okay`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_06_see_https_github_com_nodejs_node_issues_32753`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-exec-timeout-expire.js`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-child-process-exec-timeout-kill.js`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-child-process-fork-abort-signal.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-fork-abort-signal.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-fork-abort-signal.js#block_02_block_02`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-fork-abort-signal.js#block_03_block_03`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-fork-abort-signal.js#block_04_block_04`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-fork-abort-signal.js#block_05_block_05`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-fork-timeout-kill-signal.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-fork-timeout-kill-signal.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-fork-timeout-kill-signal.js#block_02_block_02`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-fork-timeout-kill-signal.js#block_03_block_03`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-send-returns-boolean.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-key-objects.js`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-key-objects.js#block_05_block_05`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-keygen-async-explicit-elliptic-curve-encrypted-p256.js`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-keygen-async-named-elliptic-curve-encrypted-p256.js`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-keygen-empty-passphrase-no-prompt.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-promises-writefile.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-read-stream-pos.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-readfile.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-readfile.js#block_00_readfile_and_readfilesync_should_fail_if_the_file_is_too_big`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-readfile.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-readfile.js#block_02_block_02`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-readfile.js#block_03_block_03`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-sir-writes-alot.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-watch-encoding.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-watch-encoding.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-watch-encoding.js#block_02_block_02`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-watch-recursive-sync-write.js`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-process-uncaught-exception-monitor.js#block_00_block_00`: Timeout
- `parallel/test-process-uncaught-exception-monitor.js#block_01_block_01`: Timeout
- `parallel/test-runner-wait-for.js`: Timeout (epoch deadline exceeded)
- `parallel/test-runner-wait-for.js#test_05_sets_last_failure_as_error_cause_on_timeouts`: Timeout (epoch deadline exceeded)
- `parallel/test-stringbytes-external.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `parallel/test-stringbytes-external.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-stringbytes-external.js#block_02_https_github_com_nodejs_node_issues_1024`: Timeout (epoch deadline exceeded)
- `parallel/test-timers-user-call.js`: Timeout (epoch deadline exceeded)
- `parallel/test-timers-user-call.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-vm-module-basic.js#block_00_check_inspection_of_the_instance`: Timeout (epoch deadline exceeded)
- `parallel/test-vm-module-basic.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-vm-module-basic.js#block_02_check_dependencies_getter_returns_same_object_every_time`: Timeout (epoch deadline exceeded)
- `parallel/test-vm-module-basic.js#block_03_check_the_impossibility_of_creating_an_abstract_instance_of_`: Timeout (epoch deadline exceeded)
- `parallel/test-vm-module-basic.js#block_04_check_to_throws_invalid_exportnames`: Timeout (epoch deadline exceeded)
- `parallel/test-vm-module-basic.js#block_05_https_github_com_nodejs_node_issues_32806`: Timeout (epoch deadline exceeded)
- `parallel/test-vm-module-basic.js#block_06_check_to_throws_invalid_evaluatecallback`: Timeout (epoch deadline exceeded)
- `parallel/test-vm-module-basic.js#block_07_check_to_throws_invalid_options`: Timeout (epoch deadline exceeded)
- `parallel/test-vm-module-basic.js#block_08_test_compilefunction_importmoduledynamically`: Timeout (epoch deadline exceeded)
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_08_block_08`: error while executing at wasm backtrace:     0: 0xdaee90 - node_compat_runner.wasm!JS_CallInternal     1: 0xdb2a45 - node_compat_runner.wasm!JS_CallInternal     2: 0xdb2474 - node_compat_runner.wasm!J...
- `parallel/test-worker-eval-typescript.js#test_00_worker_eval_module_typescript_without_input_type`: error while executing at wasm backtrace:     0: 0xeeb146 - node_compat_runner.wasm!abort     1: 0xee1cf1 - node_compat_runner.wasm!std::sys::pal::wasi::helpers::abort_internal::h55c751025c93bbd8     2...
- `parallel/test-worker-eval-typescript.js#test_01_worker_eval_module_typescript_with_input_type_module_typescr`: error while executing at wasm backtrace:     0: 0xeeb146 - node_compat_runner.wasm!abort     1: 0xee1cf1 - node_compat_runner.wasm!std::sys::pal::wasi::helpers::abort_internal::h55c751025c93bbd8     2...
- `parallel/test-worker-eval-typescript.js#test_02_worker_eval_module_typescript_with_input_type_commonjs_types`: error while executing at wasm backtrace:     0: 0xeeb146 - node_compat_runner.wasm!abort     1: 0xee1cf1 - node_compat_runner.wasm!std::sys::pal::wasi::helpers::abort_internal::h55c751025c93bbd8     2...
- `parallel/test-worker-eval-typescript.js#test_03_worker_eval_module_typescript_with_input_type_module`: error while executing at wasm backtrace:     0: 0xeeb146 - node_compat_runner.wasm!abort     1: 0xee1cf1 - node_compat_runner.wasm!std::sys::pal::wasi::helpers::abort_internal::h55c751025c93bbd8     2...
- `parallel/test-worker-eval-typescript.js#test_04_worker_eval_commonjs_typescript_without_input_type`: error while executing at wasm backtrace:     0: 0xeeb146 - node_compat_runner.wasm!abort     1: 0xee1cf1 - node_compat_runner.wasm!std::sys::pal::wasi::helpers::abort_internal::h55c751025c93bbd8     2...
- `parallel/test-worker-eval-typescript.js#test_05_worker_eval_commonjs_typescript_with_input_type_commonjs_typ`: error while executing at wasm backtrace:     0: 0xeeb146 - node_compat_runner.wasm!abort     1: 0xee1cf1 - node_compat_runner.wasm!std::sys::pal::wasi::helpers::abort_internal::h55c751025c93bbd8     2...
- `parallel/test-worker-eval-typescript.js#test_06_worker_eval_commonjs_typescript_with_input_type_module_types`: error while executing at wasm backtrace:     0: 0xeeb146 - node_compat_runner.wasm!abort     1: 0xee1cf1 - node_compat_runner.wasm!std::sys::pal::wasi::helpers::abort_internal::h55c751025c93bbd8     2...
- `sequential/test-fs-watch.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `sequential/test-fs-watch.js#block_02_block_02`: Timeout (epoch deadline exceeded)

</details>

## Skipped Tests

1982 tests were skipped.

<details>
<summary>Click to expand</summary>

- `es-module/test-cjs-esm-warn.js`: newly discovered, not yet evaluated
- `es-module/test-esm-assertionless-json-import.js`: [manual] This test requires Node.js `--experimental-loader` custom ESM loader hooks to allow JSON imports without `{ with: { type: 'json' } }`. Without that loader, Node.js itself rejects assertion...
- `es-module/test-esm-cjs-exports.js`: [manual] This test requires Node.js's native ESM-CJS interop, which cannot be replicated in WASM/QuickJS. Specifically:
- `es-module/test-esm-import-meta-resolve.mjs`: [manual] The test uses `spawn` from `child_process` and `spawnPromisified` (lines 61-119) to launch real Node.js child processes with CLI flags (`--input-type=module`, `--eval`, `--import`). Child ...
- `es-module/test-esm-preserve-symlinks.js`: [manual] The test requires `child_process.spawn()` to launch a new Node.js process with `--preserve-symlinks` CLI flag and verify its exit code. Spawning OS processes is fundamentally impossible in...
- `es-module/test-esm-repl-imports.js`: [manual] The test requires `child_process.spawn` to launch a Node.js REPL subprocess (`node --interactive`), send commands via stdin, and verify the exit code. Process spawning is fundamentally imp...
- `es-module/test-esm-repl.js`: [manual] The test uses `child_process.spawn(process.execPath, ['--interactive'])` to launch a Node.js REPL subprocess, send ESM import commands via stdin, and verify the exit code. Process spawning...
- `es-module/test-esm-symlink-main.js`: [manual] The test requires `child_process.spawn()` to launch a new Node.js subprocess with `--preserve-symlinks` flag and verify its exit code. Process spawning is fundamentally impossible in a Web...
- `es-module/test-esm-symlink.js`: [manual] The test requires `child_process.spawn()` to launch a child Node.js process that loads ESM modules through symlinks and verifies the exit code. Process spawning is fundamentally impossible...
- `es-module/test-esm-undefined-cjs-global-like-variables.js`: [manual] This test requires three fundamental features our runtime intentionally does not implement:
- `es-module/test-require-module-cached-tla.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-conditional-exports-module.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-conditional-exports.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-cycle-esm-cjs-esm-esm.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-cycle-esm-cjs-esm.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-cycle-esm-esm-cjs-esm.js`: QuickJS module system does not support ESM-CJS interop cycle detection
- `es-module/test-require-module-dynamic-import-1.js`: requires CJS named export analysis (cjs-module-lexer) for ESM import of CJS modules
- `es-module/test-require-module-dynamic-import-2.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-error-catching.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-errors.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-feature-detect.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-preload.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-retry-import-errored.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-retry-import-evaluating.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-synchronous-rejection-handling.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-tla-retry-import-2.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-tla-retry-import.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-tla-retry-require.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-tla.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-twice.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-warning.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-with-detection.js`: newly discovered, not yet evaluated
- `es-module/test-require-module.js`: newly discovered, not yet evaluated
- `es-module/test-require-node-modules-warning.js`: newly discovered, not yet evaluated
- `es-module/test-vm-compile-function-lineoffset.js`: newly discovered, not yet evaluated
- `es-module/test-vm-main-context-default-loader.js`: newly discovered, not yet evaluated
- `es-module/test-vm-source-text-module-leak.js`: newly discovered, not yet evaluated
- `es-module/test-vm-synthetic-module-leak.js`: newly discovered, not yet evaluated
- `es-module/test-wasm-memory-out-of-bound.js`: newly discovered, not yet evaluated
- `es-module/test-wasm-simple.js`: newly discovered, not yet evaluated
- `es-module/test-wasm-web-api.js`: newly discovered, not yet evaluated
- `parallel/test-aborted-util.js`: requires --expose-internals and internal/abort_controller
- `parallel/test-abortsignal-cloneable.js`: requires transferableAbortController and MessageChannel
- `parallel/test-async-hooks-async-await.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-asyncresource-constructor.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-close-during-destroy.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-constructor.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-correctly-switch-promise-hook.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-enable-before-promise-resolve.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-enable-disable-enable.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-execution-async-resource-await.js`: requires HTTP server functionality, we only support clients
- `parallel/test-async-hooks-execution-async-resource.js`: requires HTTP server functionality, we only support clients
- `parallel/test-async-hooks-fatal-error.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-http-parser-destroy.js`: requires HTTP server functionality, we only support clients
- `parallel/test-async-hooks-promise-enable-disable.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-promise-triggerid.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-promise.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-recursive-stack-runInAsyncScope.js`: newly discovered, not yet evaluated
- `parallel/test-async-hooks-top-level-clearimmediate.js`: newly discovered, not yet evaluated
- `parallel/test-async-local-storage-bind.js`: newly discovered, not yet evaluated
- `parallel/test-async-local-storage-contexts.js`: newly discovered, not yet evaluated
- `parallel/test-async-local-storage-deep-stack.js`: newly discovered, not yet evaluated
- `parallel/test-async-local-storage-http-multiclients.js`: requires AsyncLocalStorage context propagation across concurrent HTTP activity which is not implemented
- `parallel/test-async-local-storage-snapshot.js`: newly discovered, not yet evaluated
- `parallel/test-async-wrap-constructor.js`: newly discovered, not yet evaluated
- `parallel/test-async-wrap-pop-id-during-load.js`: newly discovered, not yet evaluated
- `parallel/test-async-wrap-tlssocket-asyncreset.js`: newly discovered, not yet evaluated
- `parallel/test-asyncresource-bind.js`: newly discovered, not yet evaluated
- `parallel/test-atomics-wake.js`: newly discovered, not yet evaluated
- `parallel/test-bash-completion.js`: newly discovered, not yet evaluated
- `parallel/test-benchmark-cli.js`: newly discovered, not yet evaluated
- `parallel/test-blocklist-clone.js`: newly discovered, not yet evaluated
- `parallel/test-blocklist.js`: newly discovered, not yet evaluated
- `parallel/test-bootstrap-modules.js`: newly discovered, not yet evaluated
- `parallel/test-broadcastchannel-custom-inspect.js`: newly discovered, not yet evaluated
- `parallel/test-buffer-tostring-range.js`: The tested feature is not available in 32bit builds
- `parallel/test-c-ares.js`: newly discovered, not yet evaluated
- `parallel/test-child-process-advanced-serialization-largebuffer.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-advanced-serialization-splitted-length-field.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-advanced-serialization.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-can-write-to-stdout.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-constructor.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-cwd.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-default-options.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-destroy.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-detached.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-dgram-reuseport.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-disconnect.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-double-pipe.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-env.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-exec-abortcontroller-promisified.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-exec-any-shells-windows.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-exec-encoding.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-exec-env.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-exec-error.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-exec-std-encoding.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-exec-stdout-stderr-data-string.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-execFile-promisified-abortController.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-execfile-maxbuf.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-execfile.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-execfilesync-maxbuf.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-execsync-maxbuf.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-exit-code.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-flush-stdio.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-abort-signal.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-args.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-closed-channel-segfault.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-detached.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-dgram.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-exec-argv.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-exec-path.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-getconnections.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-net.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-stdio-string-variant.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-stdio.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-timeout-kill-signal.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork-url.mjs`: requires child_process which is not available in WASM
- `parallel/test-child-process-fork.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-ipc.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-kill.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-net-reuseport.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-no-deprecation.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-pipe-dataflow.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-promisified.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-prototype-tampering.mjs`: requires child_process which is not available in WASM
- `parallel/test-child-process-reject-null-bytes.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-send-keep-open.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-send-returns-boolean.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-send-type-error.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-set-blocking.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-silent.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawn-args.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawn-argv0.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawn-controller.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawn-error.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawn-event.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawn-shell.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawn-timeout-kill-signal.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawn-typeerror.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawn-windows-batch-file.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawnsync-args.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawnsync-env.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawnsync-input.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawnsync-maxbuf.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawnsync-timeout.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawnsync-validation-errors.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-spawnsync.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-stdin-ipc.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-stdin.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-stdio-big-write-end.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-stdio-inherit.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-stdio-merge-stdouts-into-cat.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-stdio-overlapped.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-stdio-reuse-readable-stdio.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-stdio.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-stdout-flush-exit.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-stdout-flush.js`: requires child_process which is not available in WASM
- `parallel/test-child-process-stdout-ipc.js`: requires child_process which is not available in WASM
- `parallel/test-cli-bad-options.js`: newly discovered, not yet evaluated
- `parallel/test-cli-eval-event.js`: newly discovered, not yet evaluated
- `parallel/test-cli-node-options-docs.js`: newly discovered, not yet evaluated
- `parallel/test-cli-node-options.js`: newly discovered, not yet evaluated
- `parallel/test-cli-options-negation.js`: newly discovered, not yet evaluated
- `parallel/test-cli-options-precedence.js`: newly discovered, not yet evaluated
- `parallel/test-cli-permission-deny-fs.js`: newly discovered, not yet evaluated
- `parallel/test-cli-permission-multiple-allow.js`: newly discovered, not yet evaluated
- `parallel/test-cli-syntax-piped-bad.js`: newly discovered, not yet evaluated
- `parallel/test-cli-syntax-piped-good.js`: newly discovered, not yet evaluated
- `parallel/test-cluster-advanced-serialization.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-basic.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-bind-privileged-port.js`: newly discovered, not yet evaluated
- `parallel/test-cluster-call-and-destroy.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-child-index-dgram.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-child-index-net.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-concurrent-disconnect.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-cwd.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-dgram-1.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-dgram-ipv6only.js`: newly discovered, not yet evaluated
- `parallel/test-cluster-dgram-reuse.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-dgram-reuseport.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-disconnect-before-exit.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-disconnect-exitedAfterDisconnect-race.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-disconnect-idle-worker.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-disconnect-leak.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-disconnect-race.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-disconnect-unshared-tcp.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-disconnect-unshared-udp.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-disconnect-with-no-workers.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-disconnect.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-eaccess.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-eaddrinuse.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-fork-env.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-fork-stdio.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-fork-windowsHide.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-http-pipe.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-invalid-message.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-ipc-throw.js`: requires HTTP server functionality, we only support clients
- `parallel/test-cluster-kill-disconnect.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-kill-infinite-loop.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-listen-pipe-readable-writable.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-listening-port.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-message.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-net-listen-backlog.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-net-listen-ipv6only-false.js`: newly discovered, not yet evaluated
- `parallel/test-cluster-net-listen-relative-path.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-net-listen.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-net-reuseport.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-net-send.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-net-server-drop-connection.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-primary-kill.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-process-disconnect.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-rr-domain-listen.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-rr-handle-close.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-rr-handle-keep-loop-alive.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-rr-handle-ref-unref.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-rr-ref.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-send-deadlock.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-send-handle-twice.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-send-socket-to-worker-http-server.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-server-restart-none.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-server-restart-rr.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-setup-primary-argv.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-setup-primary-cumulative.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-setup-primary-emit.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-setup-primary-multiple.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-setup-primary.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-shared-handle-bind-error.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-shared-handle-bind-privileged-port.js`: newly discovered, not yet evaluated
- `parallel/test-cluster-shared-leak.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-constructor.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-death.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-destroy.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-disconnect-on-error.js`: requires HTTP server functionality, we only support clients
- `parallel/test-cluster-worker-disconnect.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-events.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-exit.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-forced-exit.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-handle-close.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-init.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-isconnected.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-isdead.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-kill-signal.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-kill.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-no-exit.js`: cluster is not supported in WebAssembly environment
- `parallel/test-cluster-worker-wait-server-close.js`: cluster is not supported in WebAssembly environment
- `parallel/test-common-expect-warning.js`: newly discovered, not yet evaluated
- `parallel/test-common-must-not-call.js`: newly discovered, not yet evaluated
- `parallel/test-common.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-api-env.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-api-error.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-api-flush.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-api-permission.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-api-success.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-api-tmpdir.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-bad-syntax.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-disable.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-dynamic-import.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-esm.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-existing-directory.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-permission-allowed.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-permission-disallowed.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-success.js`: newly discovered, not yet evaluated
- `parallel/test-compile-cache-updated-file.js`: newly discovered, not yet evaluated
- `parallel/test-corepack-version.js`: newly discovered, not yet evaluated
- `parallel/test-coverage-with-inspector-disabled.js`: newly discovered, not yet evaluated
- `parallel/test-crypto-no-algorithm.js`: this test requires OpenSSL 3.x
- `parallel/test-crypto-publicDecrypt-fails-first-time.js`: only openssl3
- `parallel/test-crypto-sign-verify.js#block_13_early_if_no_openssl_binary_is_found`: node compiled without OpenSSL CLI.
- `parallel/test-crypto-subtle-zero-length.js`: requires WebCrypto subtle with AES-CBC and zero-length input
- `parallel/test-crypto-verify-failure.js`: requires tls module which is not available in WASM
- `parallel/test-crypto-webcrypto-aes-decrypt-tag-too-small.js`: requires WebCrypto AES-GCM with specific tag length validation
- `parallel/test-crypto.js`: requires tls module which is not available in WASM
- `parallel/test-cwd-enoent-preload.js`: newly discovered, not yet evaluated
- `parallel/test-cwd-enoent-repl.js`: newly discovered, not yet evaluated
- `parallel/test-cwd-enoent.js`: newly discovered, not yet evaluated
- `parallel/test-datetime-change-notify.js`: newly discovered, not yet evaluated
- `parallel/test-debug-process.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-backtrace.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-break.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-breakpoint-exists.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-clear-breakpoints.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-exceptions.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-exec.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-heap-profiler.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-list.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-low-level.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-object-type-remote-object.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-pid.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-preserve-breaks.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-profile-command.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-profile.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-random-port-with-inspect-port.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-random-port.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-repeat-last.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-restart-message.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-run-after-quit-restart.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-sb-before-load.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-scripts.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-unavailable-port.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-use-strict.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-watch-validation.js`: newly discovered, not yet evaluated
- `parallel/test-debugger-websocket-secret-mismatch.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-address.js`: WASI runtime returns access-denied (EACCES) when binding to 127.0.0.1; wasmtime sandbox permissions issue
- `parallel/test-dgram-bind-socket-close-before-cluster-reply.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-bind-socket-close-before-lookup.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-close-signal.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-cluster-close-during-bind.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-cluster-close-in-listening.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-error-message-address.js`: WASI runtime maps binding to non-local IPs as access-denied (EACCES) instead of EADDRNOTAVAIL
- `parallel/test-dgram-ipv6only.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-listen-after-bind.js`: WASI async bind may not complete within the 100ms timeout race in this test; binding is asynchronous in WASI
- `parallel/test-dgram-membership.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-multicast-loopback.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-reuseport.js`: requires reusePort socket option not supported in WASI
- `parallel/test-dgram-send-cb-quelches-error.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-setBroadcast.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-udp6-link-local-address.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-udp6-send-default-host.js`: newly discovered, not yet evaluated
- `parallel/test-dgram-unref-in-cluster.js`: newly discovered, not yet evaluated
- `parallel/test-diagnostic-channel-http-request-created.js`: requires HTTP server functionality, we only support clients
- `parallel/test-diagnostic-channel-http-response-created.js`: requires HTTP server functionality, we only support clients
- `parallel/test-diagnostics-channel-http-server-start.js`: requires HTTP server functionality, we only support clients
- `parallel/test-diagnostics-channel-http.js`: newly discovered, not yet evaluated
- `parallel/test-diagnostics-channel-memory-leak.js`: requires v8.queryObjects (--expose-internals)
- `parallel/test-diagnostics-channel-module-import-error.js`: newly discovered, not yet evaluated
- `parallel/test-diagnostics-channel-module-import.js`: newly discovered, not yet evaluated
- `parallel/test-diagnostics-channel-module-require-error.js`: newly discovered, not yet evaluated
- `parallel/test-diagnostics-channel-module-require.js`: newly discovered, not yet evaluated
- `parallel/test-diagnostics-channel-net.js`: newly discovered, not yet evaluated
- `parallel/test-diagnostics-channel-process.js`: newly discovered, not yet evaluated
- `parallel/test-diagnostics-channel-tracing-channel-args-types.js`: error messages differ slightly from upstream Node.js for tracingChannel({}) case
- `parallel/test-diagnostics-channel-tracing-channel-promise-run-stores.js`: QuickJS await bypasses JS-visible Promise.prototype.then so ALS context is lost across await boundaries
- `parallel/test-directory-import.js`: newly discovered, not yet evaluated
- `parallel/test-disable-proto-delete.js`: newly discovered, not yet evaluated
- `parallel/test-disable-proto-throw.js`: newly discovered, not yet evaluated
- `parallel/test-disable-sigusr1.js`: newly discovered, not yet evaluated
- `parallel/test-dns-channel-timeout.js`: requires dgram and DNS protocol-level testing
- `parallel/test-dns-get-server.js`: accesses internal Resolver._handle property
- `parallel/test-dns-lookupService-promises.js`: requires dgram and DNS protocol-level testing
- `parallel/test-dns-resolvens-typeerror.js`: requires ERR_INVALID_ARG_TYPE validation on resolve methods (not yet implemented)
- `parallel/test-dns-setserver-when-querying.js`: requires dgram and DNS protocol-level testing
- `parallel/test-dns-setservers-type-check.js`: requires common/internet module and detailed ERR_INVALID_ARG_TYPE checks on setServers
- `parallel/test-dns.js`: requires dgram module, common/dns utilities, and detailed setServers validation (ERR_INVALID_IP_ADDRESS)
- `parallel/test-domain-abort-on-uncaught.js`: newly discovered, not yet evaluated
- `parallel/test-domain-async-id-map-leak.js`: requires --expose-gc flag
- `parallel/test-domain-dep0097.js`: newly discovered, not yet evaluated
- `parallel/test-domain-ee.js`: second block requires EventEmitter captureRejections constructor option which is not implemented
- `parallel/test-domain-http-server.js`: requires HTTP server functionality, we only support clients
- `parallel/test-domain-load-after-set-uncaught-exception-capture.js`: newly discovered, not yet evaluated
- `parallel/test-domain-multi.js`: requires HTTP server functionality, we only support clients
- `parallel/test-domain-nested-throw.js`: newly discovered, not yet evaluated
- `parallel/test-domain-no-error-handler-abort-on-uncaught-0.js`: newly discovered, not yet evaluated
- `parallel/test-domain-no-error-handler-abort-on-uncaught-1.js`: newly discovered, not yet evaluated
- `parallel/test-domain-no-error-handler-abort-on-uncaught-2.js`: newly discovered, not yet evaluated
- `parallel/test-domain-no-error-handler-abort-on-uncaught-3.js`: newly discovered, not yet evaluated
- `parallel/test-domain-no-error-handler-abort-on-uncaught-4.js`: newly discovered, not yet evaluated
- `parallel/test-domain-no-error-handler-abort-on-uncaught-5.js`: newly discovered, not yet evaluated
- `parallel/test-domain-no-error-handler-abort-on-uncaught-6.js`: newly discovered, not yet evaluated
- `parallel/test-domain-no-error-handler-abort-on-uncaught-7.js`: newly discovered, not yet evaluated
- `parallel/test-domain-no-error-handler-abort-on-uncaught-8.js`: newly discovered, not yet evaluated
- `parallel/test-domain-no-error-handler-abort-on-uncaught-9.js`: newly discovered, not yet evaluated
- `parallel/test-domain-promise.js`: newly discovered, not yet evaluated
- `parallel/test-domain-set-uncaught-exception-capture-after-load.js`: newly discovered, not yet evaluated
- `parallel/test-domain-stack-empty-in-process-uncaughtexception.js`: newly discovered, not yet evaluated
- `parallel/test-domain-vm-promise-isolation.js`: newly discovered, not yet evaluated
- `parallel/test-dotenv-edge-cases.js`: newly discovered, not yet evaluated
- `parallel/test-dotenv-node-options.js`: newly discovered, not yet evaluated
- `parallel/test-dotenv.js`: newly discovered, not yet evaluated
- `parallel/test-double-tls-client.js`: newly discovered, not yet evaluated
- `parallel/test-double-tls-server.js`: newly discovered, not yet evaluated
- `parallel/test-dsa-fips-invalid-key.js`: newly discovered, not yet evaluated
- `parallel/test-err-name-deprecation.js`: newly discovered, not yet evaluated
- `parallel/test-error-prepare-stack-trace.js`: newly discovered, not yet evaluated
- `parallel/test-error-reporting.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-alphabetize-primordials.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-async-iife-no-unused-result.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-avoid-prototype-pollution.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-documented-deprecation-codes.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-documented-errors.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-duplicate-requires.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-eslint-check.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-inspector-check.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-lowercase-name-for-primitive.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-no-array-destructuring.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-no-unescaped-regexp-dot.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-non-ascii-character.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-prefer-assert-iferror.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-prefer-assert-methods.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-prefer-common-mustnotcall.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-prefer-common-mustsucceed.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-prefer-optional-chaining.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-prefer-primordials.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-prefer-proto.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-prefer-util-format-errors.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-require-common-first.js`: newly discovered, not yet evaluated
- `parallel/test-eslint-required-modules.js`: newly discovered, not yet evaluated
- `parallel/test-esm-loader-hooks-inspect-brk.js`: Inspector not available in WASM
- `parallel/test-esm-loader-hooks-inspect-wait.js`: Inspector not available in WASM
- `parallel/test-eval-disallow-code-generation-from-strings.js`: newly discovered, not yet evaluated
- `parallel/test-event-capture-rejections.js`: newly discovered, not yet evaluated
- `parallel/test-eventemitter-asyncresource.js`: newly discovered, not yet evaluated
- `parallel/test-events-add-abort-listener.mjs`: addAbortListener lacks argument validation and already-aborted/stopImmediatePropagation handling
- `parallel/test-events-uncaught-exception-stack.js`: requires process.on('uncaughtException') hooks
- `parallel/test-eventsource.js`: requires --experimental-eventsource flag and EventSource global which is not implemented (needs HTTP streaming/SSE support)
- `parallel/test-eventtarget-once-twice.js`: requires --expose-internals and internal/event_target
- `parallel/test-exception-handler2.js`: newly discovered, not yet evaluated
- `parallel/test-experimental-shared-value-conveyor.js`: newly discovered, not yet evaluated
- `parallel/test-file.js`: newly discovered, not yet evaluated
- `parallel/test-filehandle-readablestream.js`: newly discovered, not yet evaluated
- `parallel/test-find-package-json.js`: newly discovered, not yet evaluated
- `parallel/test-force-repl-with-eval.js`: newly discovered, not yet evaluated
- `parallel/test-force-repl.js`: newly discovered, not yet evaluated
- `parallel/test-freeze-intrinsics.js`: newly discovered, not yet evaluated
- `parallel/test-fs-copyfile-respect-permissions.js`: as this test should not be run as `root`
- `parallel/test-fs-copyfile-respect-permissions.js#block_00_test_synchronous_api`: as this test should not be run as `root`
- `parallel/test-fs-copyfile-respect-permissions.js#block_01_test_promises_api`: as this test should not be run as `root`
- `parallel/test-fs-copyfile-respect-permissions.js#block_02_test_callback_api`: as this test should not be run as `root`
- `parallel/test-fs-lchmod.js`: lchmod is only available on macOS
- `parallel/test-fs-long-path.js`: this test is Windows-specific.
- `parallel/test-fs-mkdir-recursive-eaccess.js`: as this test should not be run as `root`
- `parallel/test-fs-mkdir-recursive-eaccess.js#block_00_synchronous_api_should_return_an_eaccess_error_with_path_pop`: as this test should not be run as `root`
- `parallel/test-fs-mkdir-recursive-eaccess.js#block_01_asynchronous_api_should_return_an_eaccess_error_with_path_po`: as this test should not be run as `root`
- `parallel/test-fs-read-file-sync-hostname.js`: Test is linux specific.
- `parallel/test-fs-readdir-buffer.js`: this tests works only on MacOS
- `parallel/test-fs-readdir-pipe.js`: This test is specific to Windows to test enumerate pipes
- `parallel/test-fs-readdir-types-symlinks.js`: insufficient privileges
- `parallel/test-fs-readdir-ucs2.js`: Test is linux specific.
- `parallel/test-fs-readfilesync-enoent.js`: Windows specific test.
- `parallel/test-fs-realpath-buffer-encoding.js`: realpath returns EIO on WASI-mounted paths
- `parallel/test-fs-realpath-on-substed-drive.js`: Test for Windows only
- `parallel/test-fs-realpath-pipe.js`: requires child_process which is not available in WASM
- `parallel/test-fs-realpath.js`: requires worker_threads which is not available in WASM
- `parallel/test-fs-stat-bigint.js`: statSync with bigint option returns undefined (bigint stat not implemented)
- `parallel/test-fs-statfs.js`: requires fs.statfs/statfsSync
- `parallel/test-fs-stream-fs-options.js`: requires validation of custom fs option methods
- `parallel/test-fs-stream-options.js`: requires validation of fd type and path type in stream constructors
- `parallel/test-fs-symlink-buffer-path.js`: insufficient privileges
- `parallel/test-fs-symlink-dir.js`: insufficient privileges
- `parallel/test-fs-symlink.js`: insufficient privileges
- `parallel/test-fs-timestamp-parsing-error.js`: assert.throws error mismatch: thrown error does not match expected ERR_INVALID_ARG_TYPE pattern
- `parallel/test-fs-truncate.js`: assert.throws fails: truncate with invalid args calls callback instead of throwing ERR_INVALID_ARG_TYPE
- `parallel/test-fs-utimes-y2K38.js`: File system appears to lack Y2K38 support (touch failed)
- `parallel/test-fs-utimes.js`: symlink returns EIO in WASI filesystem
- `parallel/test-fs-watch-close-when-destroyed.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-encoding.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-recursive-add-file-to-existing-subfolder.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-recursive-add-file-to-new-folder.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-recursive-add-file-with-url.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-recursive-add-file.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-recursive-add-folder.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-recursive-assert-leaks.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-recursive-linux-parallel-remove.js`: This test can run only on Linux
- `parallel/test-fs-watch-recursive-promise.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-recursive-symlink.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-recursive-validate.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-recursive-watch-file.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-stop-async.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watch-stop-sync.js`: requires fs.watch which is not supported in WASI
- `parallel/test-fs-watchfile.js`: requires fs.watchFile which is not supported in WASI
- `parallel/test-fs-whatwg-url.js`: requires fixtures module
- `parallel/test-fs-write-buffer-large.js`: The tested feature is not available in 32bit builds
- `parallel/test-fs-write-file-invalid-path.js`: This test is for Windows only.
- `parallel/test-fs-write-file-sync.js`: requires process.umask() and child_process
- `parallel/test-fs-write-no-fd.js`: assert.throws fails: fs.write with undefined fd calls callback instead of throwing ERR_INVALID_ARG_TYPE
- `parallel/test-fs-write-optional-params.js`: requires ERR_OUT_OF_RANGE and ERR_INVALID_ARG_TYPE validation
- `parallel/test-fs-write-sigxfsz.js`: requires child_process which is not available in WASM
- `parallel/test-fs-write-sync-optional-params.js`: requires ERR_INVALID_ARG_TYPE and ERR_OUT_OF_RANGE validation
- `parallel/test-fs-write.js`: requires child_process.exec and process.on('exit')
- `parallel/test-gc-http-client-connaborted.js`: newly discovered, not yet evaluated
- `parallel/test-gc-net-timeout.js`: newly discovered, not yet evaluated
- `parallel/test-gc-tls-external-memory.js`: newly discovered, not yet evaluated
- `parallel/test-global-console-exists.js`: newly discovered, not yet evaluated
- `parallel/test-global-customevent-disabled.js`: newly discovered, not yet evaluated
- `parallel/test-global-setters.js`: newly discovered, not yet evaluated
- `parallel/test-global-webcrypto-disbled.js`: newly discovered, not yet evaluated
- `parallel/test-global-webcrypto.js`: newly discovered, not yet evaluated
- `parallel/test-global-webstreams.js`: newly discovered, not yet evaluated
- `parallel/test-global.js`: newly discovered, not yet evaluated
- `parallel/test-h2-large-header-cause-client-to-hangup.js`: newly discovered, not yet evaluated
- `parallel/test-h2leak-destroy-session-on-socket-ended.js`: newly discovered, not yet evaluated
- `parallel/test-heap-prof-basic.js`: newly discovered, not yet evaluated
- `parallel/test-heap-prof-dir-absolute.js`: newly discovered, not yet evaluated
- `parallel/test-heap-prof-dir-name.js`: newly discovered, not yet evaluated
- `parallel/test-heap-prof-dir-relative.js`: newly discovered, not yet evaluated
- `parallel/test-heap-prof-exec-argv.js`: newly discovered, not yet evaluated
- `parallel/test-heap-prof-exit.js`: newly discovered, not yet evaluated
- `parallel/test-heap-prof-interval.js`: newly discovered, not yet evaluated
- `parallel/test-heap-prof-invalid-args.js`: newly discovered, not yet evaluated
- `parallel/test-heap-prof-invalid-args.js#block_00_tests_heap_prof_name_without_heap_prof`: Inspector not available in WASM
- `parallel/test-heap-prof-invalid-args.js#block_01_tests_heap_prof_dir_without_heap_prof`: Inspector not available in WASM
- `parallel/test-heap-prof-invalid-args.js#block_02_tests_heap_prof_interval_without_heap_prof`: Inspector not available in WASM
- `parallel/test-heap-prof-loop-drained.js`: newly discovered, not yet evaluated
- `parallel/test-heap-prof-name.js`: newly discovered, not yet evaluated
- `parallel/test-heap-prof-sigint.js`: newly discovered, not yet evaluated
- `parallel/test-heapsnapshot-near-heap-limit-by-api-in-worker.js`: newly discovered, not yet evaluated
- `parallel/test-heapsnapshot-near-heap-limit-worker.js`: newly discovered, not yet evaluated
- `parallel/test-http-abort-client.js`: [manual] amp fix caused regressions
- `parallel/test-http-abort-queued.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-after-connect.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-agent-abort-controller.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-agent-keepalive-delay.js`: requires createConnection to forward keepAlive/keepAliveInitialDelay options; wasi:http does not use Agent.createConnection for outbound requests
- `parallel/test-http-agent-keepalive.js`: requires remote server close detection on idle keep-alive sockets and socket hang up errors; wasi:http creates independent connections per request with no shared socket lifecycle
- `parallel/test-http-agent-reuse-drained-socket-only.js`: requires net.createServer with pauseOnConnect and socket.localPort; wasi:http does not expose socket-level properties
- `parallel/test-http-agent-scheduling.js`: requires actual TCP socket reuse with remotePort identity tracking via server; wasi:http creates new connections per request
- `parallel/test-http-agent-uninitialized-with-handle.js`: hangs: test relies on Agent._addSession and createConnection internals
- `parallel/test-http-agent-uninitialized.js`: hangs: test relies on Agent createConnection internals
- `parallel/test-http-agent.js`: [manual] amp fix caused regressions
- `parallel/test-http-automatic-headers.js`: [manual] The test asserts `res.headers.connection === 'keep-alive'`, but the `Connection` header is classified as a **forbidden hop-by-hop header** in wasmtime's wasi:http implementation (`wasmtime...
- `parallel/test-http-autoselectfamily.js`: times out after 120s
- `parallel/test-http-blank-header.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-buffer-sanity.js`: [manual] batch other-1: cannot fix
- `parallel/test-http-catch-uncaughtexception.js`: [manual] batch other-1: cannot fix
- `parallel/test-http-chunk-problem.js`: hangs: test spawns child_process and uses fixed port allocation
- `parallel/test-http-client-abort-keep-alive-destroy-res.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-client-abort-keep-alive-queued-tcp-socket.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-client-abort-keep-alive-queued-unix-socket.js`: hangs: requires unix socket support
- `parallel/test-http-client-abort-unix-socket.js`: hangs: requires unix socket support
- `parallel/test-http-client-abort.js`: [manual] amp fix caused regressions
- `parallel/test-http-client-agent-end-close-event.js`: hangs: relies on Agent connection lifecycle not fully implemented
- `parallel/test-http-client-close-event.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-client-default-headers-exist.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-client-error-rawbytes.js`: hangs: test sends raw TCP bytes and expects clientError events
- `parallel/test-http-client-finished.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-client-headers-array.js`: fails: request error when sending raw header pairs via wasi:http
- `parallel/test-http-client-incomingmessage-destroy.js`: hangs: server never ends response, destroy during active readBodyChunk cannot unblock native async poll
- `parallel/test-http-client-keep-alive-release-before-finish.js`: hangs: requires keep-alive socket reuse and res.connection.end()
- `parallel/test-http-client-override-global-agent.js`: hangs: relies on Agent createConnection not fully implemented
- `parallel/test-http-client-parse-error.js`: hangs: test sends raw TCP bytes and expects specific parser errors
- `parallel/test-http-client-pipe-end.js`: hangs: relies on keep-alive connection piping
- `parallel/test-http-client-race-2.js`: requires server.listen(0) which fails in WASM environment
- `parallel/test-http-client-race.js`: requires server.listen(0) which fails in WASM environment
- `parallel/test-http-client-reject-chunked-with-content-length.js`: hangs: test sends raw TCP bytes and expects specific parser errors
- `parallel/test-http-client-reject-cr-no-lf.js`: hangs: test sends raw TCP bytes and expects specific parser errors
- `parallel/test-http-client-reject-unexpected-agent.js`: requires server.listen(0) which fails in WASM environment
- `parallel/test-http-client-res-destroyed.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-response-domain.js`: hangs: requires domain module integration with HTTP client
- `parallel/test-http-client-set-timeout-after-end.js`: hangs: relies on ClientRequest.setTimeout not fully implemented
- `parallel/test-http-client-set-timeout.js`: hangs: relies on ClientRequest.setTimeout not fully implemented
- `parallel/test-http-client-spurious-aborted.js`: hangs: relies on request abort/timeout interaction not fully implemented
- `parallel/test-http-client-timeout-agent.js`: hangs: relies on Agent timeout behavior not fully implemented
- `parallel/test-http-client-timeout-event.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-client-timeout-option-listeners.js`: hangs: relies on ClientRequest timeout option not fully implemented
- `parallel/test-http-client-timeout-option.js`: hangs: relies on socket timeout event firing; wasi:http client has no real socket timeouts
- `parallel/test-http-client-timeout-with-data.js`: hangs: relies on ClientRequest timeout behavior not fully implemented
- `parallel/test-http-client-timeout.js`: [manual] amp fix caused regressions
- `parallel/test-http-client-with-create-connection.js`: hangs: relies on Agent.createConnection returning real sockets
- `parallel/test-http-connect-req-res.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-connect.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-content-length.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-createConnection.js`: [manual] batch other-1: cannot fix
- `parallel/test-http-debug.js`: [manual] batch other-1: cannot fix
- `parallel/test-http-default-port.js`: [manual] batch other-1: cannot fix
- `parallel/test-http-destroyed-socket-write2.js`: [manual] batch other-1: cannot fix
- `parallel/test-http-dont-set-default-headers-with-set-header.js`: [manual] batch other-1: cannot fix
- `parallel/test-http-dont-set-default-headers-with-setHost.js`: [manual] batch other-1: cannot fix
- `parallel/test-http-dont-set-default-headers.js`: [manual] batch other-1: cannot fix
- `parallel/test-http-dummy-characters-smuggling.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-dump-req-when-res-ends.js`: hangs: relies on response stream cleanup behavior
- `parallel/test-http-early-hints-invalid-argument.js`: hangs: test calls server.close() from server handler without consuming client response, causing WASM event loop to not drain
- `parallel/test-http-end-throw-socket-handling.js`: throws in end handler; requires uncaughtException to catch across 10 parallel requests
- `parallel/test-http-exceptions.js`: hangs: relies on uncaughtException handling in request callbacks
- `parallel/test-http-expect-continue.js`: hangs: Expect: 100-continue not fully implemented
- `parallel/test-http-expect-handling.js`: hangs: Expect header handling not fully implemented
- `parallel/test-http-flush-headers.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-full-response.js`: hangs: test uses raw TCP for full response verification
- `parallel/test-http-header-badrequest.js`: hangs: test sends raw TCP bytes for malformed headers
- `parallel/test-http-header-overflow.js`: hangs: test sends raw TCP bytes to trigger header overflow
- `parallel/test-http-highwatermark.js`: hangs: relies on socket highWaterMark / backpressure behavior
- `parallel/test-http-host-header-ipv6-fail.js`: hangs: relies on IPv6 connection failure behavior
- `parallel/test-http-import-websocket.js`: WebSocket global not implemented
- `parallel/test-http-incoming-message-options.js`: hangs: requires net.createConnection with custom readableHighWaterMark
- `parallel/test-http-information-headers.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-information-processing.js`: hangs: 1xx informational responses not supported via wasi:http
- `parallel/test-http-invalid-te.js`: hangs: test sends raw TCP bytes for invalid transfer-encoding
- `parallel/test-http-keep-alive-close-on-header.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-keep-alive-drop-requests.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-keep-alive-max-requests.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-keep-alive-timeout-custom.js`: [manual] wasmtime-wasi-http explicitly strips hop-by-hop headers (`Keep-Alive`, `Connection`) from HTTP responses via `DEFAULT_FORBIDDEN_HEADERS` / `remove_forbidden_headers()` before the WASM gues...
- `parallel/test-http-keep-alive-timeout-race-condition.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-keep-alive-timeout.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-keep-alive.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-keepalive-client.js`: [manual] The test requires TCP-level HTTP keep-alive where a single TCP connection is reused for multiple sequential requests. It asserts `assert.strictEqual(req.socket, serverSocket)` on the **ser...
- `parallel/test-http-keepalive-free.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-keepalive-override.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-keepalive-request.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-many-ended-pipelines.js`: fails: Readable stream error during pipelined server responses
- `parallel/test-http-max-header-size.js`: [manual] amp batch made no code changes
- `parallel/test-http-max-headers-count.js`: [manual] amp batch made no code changes
- `parallel/test-http-max-sockets.js`: [manual] amp batch made no code changes
- `parallel/test-http-missing-header-separator-cr.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-missing-header-separator-lf.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-multi-line-headers.js`: requires raw TCP response with obsolete HTTP line-folded headers; wasi:http rejects them
- `parallel/test-http-multiple-headers.js`: hangs: test uses raw TCP to verify multiple header handling
- `parallel/test-http-mutable-headers.js`: hangs: test uses raw TCP to verify mutable headers
- `parallel/test-http-no-read-no-dump.js`: hangs: relies on unconsumed request body behavior
- `parallel/test-http-nodelay.js`: hangs: relies on socket.setNoDelay verification
- `parallel/test-http-outgoing-end-cork.js`: relies on keepAlive socket reuse and backpressure which are not supported in WASI
- `parallel/test-http-outgoing-end-multiple.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-outgoing-first-chunk-singlebyte-encoding.js`: hangs: creates 4 concurrent server-client pairs with net.connect raw TCP
- `parallel/test-http-parser-freed-before-upgrade.js`: hangs: relies on HTTP parser lifecycle internals
- `parallel/test-http-parser-memory-retention.js`: relies on socket.parser lifecycle internals of HTTP server/client
- `parallel/test-http-parser-timeout-reset.js`: requires process.binding not available in WASM
- `parallel/test-http-pause.js`: hangs: relies on response pause/resume backpressure
- `parallel/test-http-perf_hooks.js`: requires PerformanceObserver with HTTP performance entries
- `parallel/test-http-pipeline-assertionerror-finish.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-pipeline-flood.js`: hangs: test sends raw TCP bytes for pipeline flooding
- `parallel/test-http-pipeline-requests-connection-leak.js`: sends 10000 pipelined requests which exceeds WASM resource limits
- `parallel/test-http-proxy.js`: [manual] amp fix caused regressions
- `parallel/test-http-raw-headers.js`: hangs: test uses raw TCP to verify header case preservation
- `parallel/test-http-remove-connection-header-persists-connection.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-remove-header-stays-removed.js`: hangs: test uses raw TCP for header removal verification
- `parallel/test-http-req-close-robust-from-tampering.js`: hangs: relies on close event tampering edge case
- `parallel/test-http-request-agent.js`: requires https.createServer not supported
- `parallel/test-http-res-write-after-end.js`: hangs: relies on write-after-end error handling
- `parallel/test-http-response-multi-content-length.js`: wasi:http does not produce HPE_UNEXPECTED_CONTENT_LENGTH error code for duplicate content-length headers
- `parallel/test-http-response-multiheaders.js`: [manual] wasmtime's `wasi:http` implementation strips `host` and `proxy-authorization` headers from HTTP responses (treating them as forbidden/hop-by-hop headers). The test asserts all 17 "norepeat...
- `parallel/test-http-response-no-headers.js`: test uses raw TCP (net.createServer) with HTTP/0.9 responses that wasi:http cannot parse
- `parallel/test-http-response-splitting.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-response-status-message.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-same-map.js`: test uses V8-specific percent-encoded module syntax
- `parallel/test-http-server-async-dispose.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-capture-rejections.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-clear-timer.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-client-error.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-close-all.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-close-destroy-timeout.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-close-idle.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-connection-list-when-close.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-consumed-timeout.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-de-chunked-trailer.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-destroy-socket-on-client-error.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-headers-timeout-delayed-headers.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-headers-timeout-interrupted-headers.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-headers-timeout-keepalive.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-headers-timeout-pipelining.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-incomingmessage-destroy.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-keepalive-req-gc.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-method.query.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-multiheaders.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-multiheaders2.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-non-utf8-header.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-options-incoming-message.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-options-server-response.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-reject-chunked-with-content-length.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-request-timeout-delayed-body.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-request-timeout-delayed-headers.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-request-timeout-interrupted-body.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-request-timeout-interrupted-headers.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-request-timeout-keepalive.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-request-timeout-pipelining.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-request-timeout-upgrade.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-stale-close.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-write-after-end.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-set-header-chain.js`: hangs: test uses raw TCP for header chain verification
- `parallel/test-http-set-max-idle-http-parser.js`: requires Node.js internal modules
- `parallel/test-http-set-timeout-server.js`: [manual] The test's sub-tests 1-4 use `http.get()` and `http.request()` to connect to a local HTTP server that intentionally never responds. In the WASM architecture, these client requests go throu...
- `parallel/test-http-set-timeout.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-set-trailers.js`: hangs: relies on trailer support not fully implemented
- `parallel/test-http-should-keep-alive.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-socket-encoding-error.js`: hangs: relies on socket encoding error handling
- `parallel/test-http-socket-error-listeners.js`: hangs: relies on socket error listener behavior
- `parallel/test-http-status-code.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-status-reason-invalid-chars.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-uncaught-from-request-callback.js`: [manual] amp batch made no code changes
- `parallel/test-http-unix-socket-keep-alive.js`: [manual] requires unix sockets / proxy / external tools unavailable in WASM
- `parallel/test-http-unix-socket.js`: [manual] requires unix sockets / proxy / external tools unavailable in WASM
- `parallel/test-http-upgrade-advertise.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-upgrade-agent.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-upgrade-binary.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-upgrade-client.js`: [manual] amp partial fix caused regressions
- `parallel/test-http-upgrade-client2.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-upgrade-reconsume-stream.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-upgrade-server.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-url.parse-auth.js`: [manual] amp batch made no code changes
- `parallel/test-http-url.parse-https.request.js`: [manual] amp batch made no code changes
- `parallel/test-http-writable-true-after-close.js`: [manual] amp batch made no code changes
- `parallel/test-http-write-callbacks.js`: [manual] amp batch made no code changes
- `parallel/test-http-write-head-2.js`: tests server-side HTTP behavior which requires TCP listen, not available in WASI
- `parallel/test-http-write-head-after-set-header.js`: [manual] the test currently deadlocks in the runtime pollable/executor path (same-component `node:http` client calling back into same-component server via `wasi:http`), and I could not resolve it f...
- `parallel/test-http-write-head.js`: [manual] The test asserts `response.rawHeaders.includes('Test')` (line 78) — requiring header name case preservation through the HTTP transport. In wasi:http, all header names are normalized to low...
- `parallel/test-http-zero-length-write.js`: [manual] amp batch made no code changes
- `parallel/test-http.js`: [manual] amp fix attempt failed verification
- `parallel/test-http2-allow-http1.js`: [manual] http2/https not implemented
- `parallel/test-http2-alpn.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-altsvc.js`: [manual] http2/https not implemented
- `parallel/test-http2-async-local-storage.js`: [manual] http2/https not implemented
- `parallel/test-http2-autoselect-protocol.js`: [manual] http2/https not implemented
- `parallel/test-http2-backpressure.js`: [manual] http2/https not implemented
- `parallel/test-http2-buffersize.js`: [manual] http2/https not implemented
- `parallel/test-http2-byteswritten-server.js`: [manual] http2/https not implemented
- `parallel/test-http2-cancel-while-client-reading.js`: [manual] http2/https not implemented
- `parallel/test-http2-capture-rejection.js`: requires HTTP2 server functionality
- `parallel/test-http2-clean-output.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-connection-tunnelling.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-data-end.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-jsstream-destroy.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-port-80.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-priority-before-connect.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-promisify-connect-error.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-promisify-connect.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-proxy-over-http2.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-request-listeners-warning.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-request-options-errors.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-rststream-before-connect.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-set-priority.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-setLocalWindowSize.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-setNextStreamID-errors.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-settings-before-connect.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-shutdown-before-connect.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-stream-destroy-before-connect.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-unescaped-path.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-write-before-connect.js`: [manual] http2/https not implemented
- `parallel/test-http2-client-write-empty-string.js`: [manual] http2/https not implemented
- `parallel/test-http2-close-while-writing.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-aborted.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-errors.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-expect-continue-check.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-expect-continue.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-expect-handling.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-method-connect.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverrequest-end.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverrequest-headers.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverrequest-host.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverrequest-pause.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverrequest-pipe.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverrequest-settimeout.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverrequest-trailers.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverrequest.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-close.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-createpushresponse.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-destroy.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-drain.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-end-after-statuses-without-body.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-end.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-finished.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-flushheaders.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-headers-after-destroy.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-headers-send-date.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-headers.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-settimeout.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-statuscode.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-statusmessage-property-set.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-statusmessage-property.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-statusmessage.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-trailers.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse-write.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-writehead-array.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-writehead.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-serverresponse.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-short-stream-client-server.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-socket-destroy-delayed.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-socket-set.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-write-early-hints-invalid-argument-type.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-write-early-hints-invalid-argument-value.js`: [manual] http2/https not implemented
- `parallel/test-http2-compat-write-early-hints.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-write-head-destroyed.js`: [manual] http2/https not implemented
- `parallel/test-http2-connect-method-extended-cant-turn-off.js`: [manual] http2/https not implemented
- `parallel/test-http2-connect-method-extended.js`: [manual] http2/https not implemented
- `parallel/test-http2-connect-method.js`: [manual] http2/https not implemented
- `parallel/test-http2-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-cookies.js`: [manual] http2/https not implemented
- `parallel/test-http2-create-client-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-create-client-session.js`: [manual] http2/https not implemented
- `parallel/test-http2-createsecureserver-options.js`: [manual] http2/https not implemented
- `parallel/test-http2-createserver-options.js`: [manual] http2/https not implemented
- `parallel/test-http2-createwritereq.js`: [manual] http2/https not implemented
- `parallel/test-http2-date-header.js`: [manual] http2/https not implemented
- `parallel/test-http2-debug.js`: [manual] http2/https not implemented
- `parallel/test-http2-destroy-after-write.js`: [manual] http2/https not implemented
- `parallel/test-http2-dont-lose-data.js`: [manual] http2/https not implemented
- `parallel/test-http2-dont-override.js`: [manual] http2/https not implemented
- `parallel/test-http2-empty-frame-without-eof.js`: [manual] http2/https not implemented
- `parallel/test-http2-endafterheaders.js`: [manual] http2/https not implemented
- `parallel/test-http2-error-order.js`: [manual] http2/https not implemented
- `parallel/test-http2-exceeds-server-trailer-size.js`: [manual] http2/https not implemented
- `parallel/test-http2-forget-closed-streams.js`: [manual] http2/https not implemented
- `parallel/test-http2-generic-streams-sendfile.js`: [manual] http2/https not implemented
- `parallel/test-http2-generic-streams.js`: [manual] http2/https not implemented
- `parallel/test-http2-getpackedsettings.js`: requires HTTP2 server functionality
- `parallel/test-http2-goaway-delayed-request.js`: [manual] http2/https not implemented
- `parallel/test-http2-goaway-opaquedata.js`: [manual] http2/https not implemented
- `parallel/test-http2-head-request.js`: [manual] http2/https not implemented
- `parallel/test-http2-https-fallback-http-server-options.js`: [manual] http2/https not implemented
- `parallel/test-http2-https-fallback.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-info-headers.js`: [manual] http2/https not implemented
- `parallel/test-http2-invalidargtypes-errors.js`: [manual] http2/https not implemented
- `parallel/test-http2-invalidheaderfield.js`: requires HTTP2 server functionality
- `parallel/test-http2-invalidheaderfields-client.js`: [manual] http2/https not implemented
- `parallel/test-http2-ip-address-host.js`: [manual] http2/https not implemented
- `parallel/test-http2-large-write-close.js`: [manual] http2/https not implemented
- `parallel/test-http2-large-write-destroy.js`: [manual] http2/https not implemented
- `parallel/test-http2-large-write-multiple-requests.js`: [manual] http2/https not implemented
- `parallel/test-http2-large-writes-session-memory-leak.js`: [manual] http2/https not implemented
- `parallel/test-http2-malformed-altsvc.js`: [manual] http2/https not implemented
- `parallel/test-http2-many-writes-and-destroy.js`: [manual] http2/https not implemented
- `parallel/test-http2-max-concurrent-streams.js`: [manual] http2/https not implemented
- `parallel/test-http2-max-invalid-frames.js`: [manual] http2/https not implemented
- `parallel/test-http2-max-session-memory-leak.js`: [manual] http2/https not implemented
- `parallel/test-http2-max-settings.js`: [manual] http2/https not implemented
- `parallel/test-http2-methods.js`: [manual] http2/https not implemented
- `parallel/test-http2-misbehaving-flow-control-paused.js`: [manual] http2/https not implemented
- `parallel/test-http2-misbehaving-flow-control.js`: [manual] http2/https not implemented
- `parallel/test-http2-misused-pseudoheaders.js`: [manual] http2/https not implemented
- `parallel/test-http2-multi-content-length.js`: [manual] http2/https not implemented
- `parallel/test-http2-multiheaders-raw.js`: [manual] http2/https not implemented
- `parallel/test-http2-multiheaders.js`: [manual] http2/https not implemented
- `parallel/test-http2-multiplex.js`: [manual] http2/https not implemented
- `parallel/test-http2-multistream-destroy-on-read-tls.js`: [manual] http2/https not implemented
- `parallel/test-http2-no-more-streams.js`: [manual] http2/https not implemented
- `parallel/test-http2-no-wanttrailers-listener.js`: [manual] http2/https not implemented
- `parallel/test-http2-onping.js`: [manual] http2/https not implemented
- `parallel/test-http2-options-max-headers-block-length.js`: [manual] http2/https not implemented
- `parallel/test-http2-options-max-reserved-streams.js`: [manual] http2/https not implemented
- `parallel/test-http2-options-server-request.js`: [manual] http2/https not implemented
- `parallel/test-http2-options-server-response.js`: [manual] http2/https not implemented
- `parallel/test-http2-origin.js`: requires HTTP2 server functionality
- `parallel/test-http2-pack-end-stream-flag.js`: [manual] http2/https not implemented
- `parallel/test-http2-padding-aligned.js`: [manual] http2/https not implemented
- `parallel/test-http2-perf_hooks.js`: [manual] http2/https not implemented
- `parallel/test-http2-perform-server-handshake.js`: requires HTTP2 server functionality
- `parallel/test-http2-ping-settings-heapdump.js`: [manual] http2/https not implemented
- `parallel/test-http2-ping-unsolicited-ack.js`: [manual] http2/https not implemented
- `parallel/test-http2-ping.js`: [manual] http2/https not implemented
- `parallel/test-http2-pipe-named-pipe.js`: [manual] http2/https not implemented
- `parallel/test-http2-pipe.js`: [manual] http2/https not implemented
- `parallel/test-http2-priority-cycle-.js`: [manual] http2/https not implemented
- `parallel/test-http2-priority-event.js`: [manual] http2/https not implemented
- `parallel/test-http2-propagate-session-destroy-code.js`: [manual] http2/https not implemented
- `parallel/test-http2-removed-header-stays-removed.js`: [manual] http2/https not implemented
- `parallel/test-http2-request-remove-connect-listener.js`: [manual] http2/https not implemented
- `parallel/test-http2-res-corked.js`: [manual] http2/https not implemented
- `parallel/test-http2-res-writable-properties.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-204.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-304.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-404.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-compat.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-error-dir.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-error-pipe-offset.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-errors.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-fd-errors.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-fd-invalid.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-fd-range.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-fd.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-filehandle.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-push.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-range.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file-with-pipe.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-file.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-no-data.js`: [manual] http2/https not implemented
- `parallel/test-http2-respond-with-file-connection-abort.js`: [manual] http2/https not implemented
- `parallel/test-http2-response-splitting.js`: [manual] http2/https not implemented
- `parallel/test-http2-sensitive-headers.js`: [manual] http2/https not implemented
- `parallel/test-http2-sent-headers.js`: [manual] http2/https not implemented
- `parallel/test-http2-serve-file.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-async-dispose.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-close-callback.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-errors.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-push-disabled.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-push-stream-errors-args.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-push-stream-head.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-push-stream.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-rst-before-respond.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-rst-stream.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-session-destroy.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-set-header.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-setLocalWindowSize.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-settimeout-no-callback.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-shutdown-before-respond.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-shutdown-options-errors.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-shutdown-redundant.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-startup.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-stream-session-destroy.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-timeout.js`: [manual] http2/https not implemented
- `parallel/test-http2-server-unknown-protocol.js`: [manual] http2/https not implemented
- `parallel/test-http2-session-gc-while-write-scheduled.js`: [manual] http2/https not implemented
- `parallel/test-http2-session-settings.js`: [manual] http2/https not implemented
- `parallel/test-http2-session-stream-state.js`: [manual] http2/https not implemented
- `parallel/test-http2-session-timeout.js`: [manual] http2/https not implemented
- `parallel/test-http2-session-unref.js`: [manual] http2/https not implemented
- `parallel/test-http2-settings-unsolicited-ack.js`: [manual] http2/https not implemented
- `parallel/test-http2-short-stream-client-server.js`: [manual] http2/https not implemented
- `parallel/test-http2-single-headers.js`: [manual] http2/https not implemented
- `parallel/test-http2-socket-close.js`: [manual] http2/https not implemented
- `parallel/test-http2-socket-proxy-handler-for-has.js`: [manual] http2/https not implemented
- `parallel/test-http2-status-code-invalid.js`: [manual] http2/https not implemented
- `parallel/test-http2-status-code.js`: [manual] http2/https not implemented
- `parallel/test-http2-stream-client.js`: [manual] http2/https not implemented
- `parallel/test-http2-stream-destroy-event-order.js`: [manual] http2/https not implemented
- `parallel/test-http2-stream-removelisteners-after-close.js`: [manual] http2/https not implemented
- `parallel/test-http2-timeouts.js`: [manual] http2/https not implemented
- `parallel/test-http2-tls-disconnect.js`: [manual] http2/https not implemented
- `parallel/test-http2-too-large-headers.js`: [manual] http2/https not implemented
- `parallel/test-http2-too-many-headers.js`: [manual] http2/https not implemented
- `parallel/test-http2-too-many-settings.js`: requires HTTP2 server functionality
- `parallel/test-http2-too-many-streams.js`: [manual] http2/https not implemented
- `parallel/test-http2-trailers-after-session-close.js`: [manual] http2/https not implemented
- `parallel/test-http2-trailers.js`: [manual] http2/https not implemented
- `parallel/test-http2-unbound-socket-proxy.js`: [manual] http2/https not implemented
- `parallel/test-http2-update-settings.js`: [manual] http2/https not implemented
- `parallel/test-http2-window-size.js`: [manual] http2/https not implemented
- `parallel/test-http2-write-callbacks.js`: [manual] http2/https not implemented
- `parallel/test-http2-write-empty-string.js`: [manual] http2/https not implemented
- `parallel/test-http2-write-finishes-after-stream-destroy.js`: [manual] http2/https not implemented
- `parallel/test-http2-zero-length-header.js`: [manual] http2/https not implemented
- `parallel/test-http2-zero-length-write.js`: [manual] http2/https not implemented
- `parallel/test-https-abortcontroller.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-abort-controller.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-additional-options.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-constructor.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-create-connection.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-disable-session-reuse.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-getname.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-keylog.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-servername.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-session-eviction.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-session-injection.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-session-reuse.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-sni.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-sockets-leak.js`: [manual] http2/https not implemented
- `parallel/test-https-agent-unref-socket.js`: [manual] http2/https not implemented
- `parallel/test-https-agent.js`: [manual] http2/https not implemented
- `parallel/test-https-argument-of-creating.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-autoselectfamily.js`: times out after 120s
- `parallel/test-https-byteswritten.js`: [manual] http2/https not implemented
- `parallel/test-https-client-checkServerIdentity.js`: [manual] http2/https not implemented
- `parallel/test-https-client-get-url.js`: [manual] http2/https not implemented
- `parallel/test-https-client-override-global-agent.js`: [manual] http2/https not implemented
- `parallel/test-https-client-reject.js`: [manual] http2/https not implemented
- `parallel/test-https-client-renegotiation-limit.js`: [manual] http2/https not implemented
- `parallel/test-https-client-resume.js`: [manual] http2/https not implemented
- `parallel/test-https-close.js`: [manual] http2/https not implemented
- `parallel/test-https-connect-address-family.js`: [manual] http2/https not implemented
- `parallel/test-https-connecting-to-http.js`: [manual] http2/https not implemented
- `parallel/test-https-drain.js`: [manual] http2/https not implemented
- `parallel/test-https-eof-for-eom.js`: [manual] http2/https not implemented
- `parallel/test-https-foafssl.js`: [manual] http2/https not implemented
- `parallel/test-https-host-headers.js`: [manual] http2/https not implemented
- `parallel/test-https-hwm.js`: [manual] http2/https not implemented
- `parallel/test-https-keep-alive-drop-requests.js`: [manual] http2/https not implemented
- `parallel/test-https-localaddress-bind-error.js`: [manual] http2/https not implemented
- `parallel/test-https-max-headers-count.js`: [manual] http2/https not implemented
- `parallel/test-https-options-boolean-check.js`: [manual] http2/https not implemented
- `parallel/test-https-pfx.js`: [manual] http2/https not implemented
- `parallel/test-https-request-arguments.js`: [manual] http2/https not implemented
- `parallel/test-https-resume-after-renew.js`: [manual] http2/https not implemented
- `parallel/test-https-selfsigned-no-keycertsign-no-crash.js`: [manual] http2/https not implemented
- `parallel/test-https-server-async-dispose.js`: [manual] http2/https not implemented
- `parallel/test-https-server-close-all.js`: [manual] http2/https not implemented
- `parallel/test-https-server-close-destroy-timeout.js`: [manual] http2/https not implemented
- `parallel/test-https-server-close-idle.js`: [manual] http2/https not implemented
- `parallel/test-https-server-connections-checking-leak.js`: [manual] http2/https not implemented
- `parallel/test-https-server-headers-timeout.js`: [manual] http2/https not implemented
- `parallel/test-https-server-options-incoming-message.js`: [manual] http2/https not implemented
- `parallel/test-https-server-options-server-response.js`: [manual] http2/https not implemented
- `parallel/test-https-server-request-timeout.js`: [manual] http2/https not implemented
- `parallel/test-https-simple.js`: [manual] http2/https not implemented
- `parallel/test-https-socket-options.js`: [manual] http2/https not implemented
- `parallel/test-https-strict.js`: [manual] http2/https not implemented
- `parallel/test-https-timeout-server-2.js`: [manual] http2/https not implemented
- `parallel/test-https-timeout-server.js`: [manual] http2/https not implemented
- `parallel/test-https-timeout.js`: [manual] http2/https not implemented
- `parallel/test-https-truncate.js`: [manual] http2/https not implemented
- `parallel/test-https-unix-socket-self-signed.js`: [manual] http2/https not implemented
- `parallel/test-icu-env.js`: newly discovered, not yet evaluated
- `parallel/test-icu-minimum-version.js`: newly discovered, not yet evaluated
- `parallel/test-icu-transcode.js`: newly discovered, not yet evaluated
- `parallel/test-icu-transcode.js#block_00_block_00`: missing Intl
- `parallel/test-icu-transcode.js#block_01_block_01`: missing Intl
- `parallel/test-icu-transcode.js#block_02_test_that_uint8array_arguments_are_okay`: missing Intl
- `parallel/test-icu-transcode.js#block_03_block_03`: missing Intl
- `parallel/test-icu-transcode.js#block_04_test_that_it_doesn_t_crash`: missing Intl
- `parallel/test-inspect-address-in-use.js`: newly discovered, not yet evaluated
- `parallel/test-inspect-async-hook-setup-at-inspect.js`: newly discovered, not yet evaluated
- `parallel/test-inspect-publish-uid.js`: newly discovered, not yet evaluated
- `parallel/test-inspect-support-for-node_options.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-already-activated-cli.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-async-context-brk.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-async-hook-after-done.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-async-hook-setup-at-inspect-brk.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-async-stack-traces-promise-then.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-async-stack-traces-set-interval.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-bindings.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-break-e.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-break-when-eval.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-close-worker.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-connect-main-thread.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-connect-to-main-thread.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-console-top-frame.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-console.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-contexts.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-debug-brk-flag.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-debug-end.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-emit-protocol-event.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-enabled.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-esm.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-exception.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-exit-worker-in-wait-for-connection.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-exit-worker-in-wait-for-connection2.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-has-idle.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-heap-allocation-tracker.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-heapdump.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-inspect-brk-node.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-invalid-args.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-ip-detection.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-module.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-multisession-js.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-multisession-ws.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-network-fetch.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-network-http.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-not-blocked-on-idle.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-open-coverage.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-open-port-integer-overflow.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-open.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-overwrite-config.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-port-zero-cluster.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-port-zero.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-promises.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-reported-host.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-resource-name-to-url.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-runtime-evaluate-with-timeout.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-stop-profile-after-done.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-stops-no-file.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-stress-http.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-strip-types.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-tracing-domain.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-vm-global-accessors-getter-sideeffect.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-vm-global-accessors-sideeffects.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-wait-for-connection.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-waiting-for-disconnect.js`: newly discovered, not yet evaluated
- `parallel/test-inspector-workers-flat-list.js`: newly discovered, not yet evaluated
- `parallel/test-inspector.js`: newly discovered, not yet evaluated
- `parallel/test-internal-process-binding.js`: newly discovered, not yet evaluated
- `parallel/test-intl-v8BreakIterator.js`: newly discovered, not yet evaluated
- `parallel/test-intl.js`: newly discovered, not yet evaluated
- `parallel/test-kill-segfault-freebsd.js`: newly discovered, not yet evaluated
- `parallel/test-listen-fd-cluster.js`: newly discovered, not yet evaluated
- `parallel/test-listen-fd-detached-inherit.js`: newly discovered, not yet evaluated
- `parallel/test-listen-fd-detached.js`: newly discovered, not yet evaluated
- `parallel/test-listen-fd-ebadf.js`: newly discovered, not yet evaluated
- `parallel/test-listen-fd-server.js`: newly discovered, not yet evaluated
- `parallel/test-macos-app-sandbox.js`: newly discovered, not yet evaluated
- `parallel/test-math-random.js`: newly discovered, not yet evaluated
- `parallel/test-memory-usage-emfile.js`: newly discovered, not yet evaluated
- `parallel/test-messageevent-brandcheck.js`: newly discovered, not yet evaluated
- `parallel/test-messageport-hasref.js`: newly discovered, not yet evaluated
- `parallel/test-microtask-queue-run-immediate.js`: newly discovered, not yet evaluated
- `parallel/test-microtask-queue-run.js`: newly discovered, not yet evaluated
- `parallel/test-mime-whatwg.js`: newly discovered, not yet evaluated
- `parallel/test-module-loading-globalpaths.js`: [manual] This test requires `child_process.execFileSync` to spawn real Node.js child processes from copied binaries, testing module resolution from global paths (`$HOME/.node_modules`, `$HOME/.node...
- `parallel/test-module-readonly.js`: test only runs on Windows
- `parallel/test-module-strip-types.js`: Requires Amaro
- `parallel/test-module-strip-types.js#test_00_striptypescripttypes`: Requires Amaro
- `parallel/test-module-strip-types.js#test_01_striptypescripttypes_explicit`: Requires Amaro
- `parallel/test-module-strip-types.js#test_02_striptypescripttypes_code_is_not_a_string`: Requires Amaro
- `parallel/test-module-strip-types.js#test_03_striptypescripttypes_invalid_mode`: Requires Amaro
- `parallel/test-module-strip-types.js#test_04_striptypescripttypes_sourcemap_throws_when_mode_is_strip`: Requires Amaro
- `parallel/test-module-strip-types.js#test_05_striptypescripttypes_sourceurl_throws_when_mode_is_strip`: Requires Amaro
- `parallel/test-module-strip-types.js#test_06_striptypescripttypes_source_map_when_mode_is_transform`: Requires Amaro
- `parallel/test-module-strip-types.js#test_07_striptypescripttypes_source_map_when_mode_is_transform_and_s`: Requires Amaro
- `parallel/test-module-strip-types.js#test_08_striptypescripttypes_source_map_when_mode_is_transform_and_s`: Requires Amaro
- `parallel/test-module-wrapper.js`: [manual] The test requires `child_process.execFileSync` to spawn a new Node.js subprocess (`execFileSync(node, [cjsModuleWrapTest])`). Process spawning is fundamentally impossible in a WASM compone...
- `parallel/test-net-child-process-connect-reset.js`: [manual] This test fundamentally requires `child_process.spawn()` with IPC communication and OS signal handling (`SIGKILL`), which are impossible in a WebAssembly sandbox. The entire test logic dep...
- `parallel/test-net-connect-memleak.js`: requires process.memoryUsage()
- `parallel/test-net-connect-nodelay.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-options-allowhalfopen.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-options-ipv6.js`: requires DNS lookup for IPv6
- `parallel/test-net-connect-options-port.js`: requires DNS lookup
- `parallel/test-net-connect-paused-connection.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-reset-after-destroy.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-reset-before-connected.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-reset-until-connected.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-dns-custom-lookup.js`: requires custom DNS lookup
- `parallel/test-net-dns-error.js`: requires DNS lookup
- `parallel/test-net-dns-lookup-skip.js`: requires DNS lookup
- `parallel/test-net-dns-lookup.js`: requires DNS lookup
- `parallel/test-net-during-close.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-eaddrinuse.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-error-twice.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-keepalive.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-large-string.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-listen-after-destroying-stdin.js`: requires process.stdin
- `parallel/test-net-listen-exclusive-random-ports.js`: requires cluster
- `parallel/test-net-listen-fd0.js`: requires fd option for listen
- `parallel/test-net-listen-handle-in-cluster-1.js`: requires cluster
- `parallel/test-net-listen-ipv6only.js`: requires IPv6 dual-stack and DNS resolution
- `parallel/test-net-listen-twice.js`: requires cluster
- `parallel/test-net-local-address-port.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-localerror.js`: requires DNS lookup
- `parallel/test-net-onread-static-buffer.js`: requires onread option with buffer/callback
- `parallel/test-net-pause-resume-connecting.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-perf_hooks.js`: requires perf_hooks.PerformanceObserver with net detail
- `parallel/test-net-persistent-keepalive.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-reuseport.js`: requires reusePort option and cluster
- `parallel/test-net-server-blocklist.js`: requires net.BlockList
- `parallel/test-net-server-call-listen-multiple-times.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-capture-rejection.js`: requires captureRejections option
- `parallel/test-net-server-close-before-calling-lookup-callback.js`: requires DNS lookup
- `parallel/test-net-server-close-before-ipc-response.js`: requires cluster
- `parallel/test-net-server-drop-connections-in-cluster.js`: requires cluster
- `parallel/test-net-server-drop-connections.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-keepalive.js`: requires internal/test/binding
- `parallel/test-net-server-listen-options-signal.js`: missing AbortSignal validation for listen
- `parallel/test-net-server-listen-options.js`: missing ERR_INVALID_ARG_TYPE validation for listen options
- `parallel/test-net-server-listen-remove-callback.js`: requires Unix domain sockets (IPC path)
- `parallel/test-net-server-max-connections-close-makes-more-available.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-max-connections.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-pause-on-connect.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-reset.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-try-ports.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-unref-persistent.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-unref.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-constructor.js`: requires cluster
- `parallel/test-net-socket-destroy-send.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-end-before-connect.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-local-address.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-ready-without-cb.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-reset-send.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-reset-twice.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-timeout-unref.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-write-after-close.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-sync-cork.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-throttle.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-write-after-end-nt.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-write-cb-on-destroy-before-connect.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-write-connect-write.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-write-fully-async-buffer.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-write-fully-async-hex-string.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-write-slow.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-next-tick-errors.js`: newly discovered, not yet evaluated
- `parallel/test-next-tick-ordering.js`: newly discovered, not yet evaluated
- `parallel/test-node-run.js`: newly discovered, not yet evaluated
- `parallel/test-npm-version.js`: newly discovered, not yet evaluated
- `parallel/test-openssl-ca-options.js`: newly discovered, not yet evaluated
- `parallel/test-outgoing-message-pipe.js`: newly discovered, not yet evaluated
- `parallel/test-perf-hooks-histogram.js`: newly discovered, not yet evaluated
- `parallel/test-perf-hooks-resourcetiming.js`: newly discovered, not yet evaluated
- `parallel/test-perf-hooks-usertiming.js`: newly discovered, not yet evaluated
- `parallel/test-performance-eventlooputil.js`: newly discovered, not yet evaluated
- `parallel/test-performance-function-async.js`: newly discovered, not yet evaluated
- `parallel/test-performance-function.js`: newly discovered, not yet evaluated
- `parallel/test-performance-global.js`: newly discovered, not yet evaluated
- `parallel/test-performance-nodetiming-uvmetricsinfo.js`: newly discovered, not yet evaluated
- `parallel/test-performance-nodetiming.js`: newly discovered, not yet evaluated
- `parallel/test-performance-resourcetimingbufferfull.js`: newly discovered, not yet evaluated
- `parallel/test-performance-resourcetimingbuffersize.js`: newly discovered, not yet evaluated
- `parallel/test-permission-allow-addons-cli.js`: newly discovered, not yet evaluated
- `parallel/test-permission-allow-child-process-cli.js`: newly discovered, not yet evaluated
- `parallel/test-permission-allow-wasi-cli.js`: newly discovered, not yet evaluated
- `parallel/test-permission-allow-worker-cli.js`: newly discovered, not yet evaluated
- `parallel/test-permission-child-process-cli.js`: newly discovered, not yet evaluated
- `parallel/test-permission-dc-worker-threads.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-absolute-path.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-relative-path.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-repeat-path.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-supported.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-symlink-relative.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-symlink-target-write.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-symlink-target-write.js#block_00_block_00`: insufficient privileges
- `parallel/test-permission-fs-symlink-target-write.js#block_01_block_01`: insufficient privileges
- `parallel/test-permission-fs-symlink.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-symlink.js#block_00_block_00`: insufficient privileges
- `parallel/test-permission-fs-symlink.js#block_01_block_01`: insufficient privileges
- `parallel/test-permission-fs-symlink.js#block_02_block_02`: insufficient privileges
- `parallel/test-permission-fs-symlink.js#block_03_block_03`: insufficient privileges
- `parallel/test-permission-fs-traversal-path.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-traversal-path.js#block_00_block_00`: insufficient privileges
- `parallel/test-permission-fs-traversal-path.js#block_01_block_01`: insufficient privileges
- `parallel/test-permission-fs-traversal-path.js#block_02_block_02`: insufficient privileges
- `parallel/test-permission-fs-wildcard.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-windows-path.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-windows-path.js#block_00_block_00`: windows UNC path test
- `parallel/test-permission-fs-windows-path.js#block_01_block_01`: windows UNC path test
- `parallel/test-permission-fs-windows-path.js#block_02_block_02`: windows UNC path test
- `parallel/test-permission-fs-windows-path.js#block_03_block_03`: windows UNC path test
- `parallel/test-permission-fs-write-report.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-write-v8.js`: newly discovered, not yet evaluated
- `parallel/test-permission-fs-write.js`: newly discovered, not yet evaluated
- `parallel/test-permission-has.js`: newly discovered, not yet evaluated
- `parallel/test-permission-inspector-brk.js`: newly discovered, not yet evaluated
- `parallel/test-permission-inspector-brk.js#block_00_see_https_github_com_nodejs_node_issues_53385`: Inspector not available in WASM
- `parallel/test-permission-inspector-brk.js#block_01_block_01`: Inspector not available in WASM
- `parallel/test-permission-inspector.js`: newly discovered, not yet evaluated
- `parallel/test-permission-inspector.js#block_00_block_00`: Inspector not available in WASM
- `parallel/test-permission-inspector.js#block_01_block_01`: Inspector not available in WASM
- `parallel/test-permission-no-addons.js`: newly discovered, not yet evaluated
- `parallel/test-permission-processbinding.js`: newly discovered, not yet evaluated
- `parallel/test-permission-sqlite-load-extension.js`: uses spawnPromisified and permission model, not applicable in WASM
- `parallel/test-permission-warning-flags.js`: newly discovered, not yet evaluated
- `parallel/test-permission-wasi.js`: newly discovered, not yet evaluated
- `parallel/test-permission-worker-threads-cli.js`: newly discovered, not yet evaluated
- `parallel/test-pipe-abstract-socket-http.js`: newly discovered, not yet evaluated
- `parallel/test-pipe-abstract-socket.js`: newly discovered, not yet evaluated
- `parallel/test-pipe-file-to-http.js`: requires HTTP server functionality, we only support clients
- `parallel/test-pipe-outgoing-message-data-emitted-after-ended.js`: requires HTTP server functionality, we only support clients
- `parallel/test-preload-print-process-argv.js`: newly discovered, not yet evaluated
- `parallel/test-preload.js`: newly discovered, not yet evaluated
- `parallel/test-primitive-timer-leak.js`: requires --expose-gc flag
- `parallel/test-process-argv-0.js`: newly discovered, not yet evaluated
- `parallel/test-process-assert.js`: newly discovered, not yet evaluated
- `parallel/test-process-binding-internalbinding-allowlist.js`: newly discovered, not yet evaluated
- `parallel/test-process-binding-util.js`: newly discovered, not yet evaluated
- `parallel/test-process-chdir.js`: newly discovered, not yet evaluated
- `parallel/test-process-config.js`: config.gypi does not exist.
- `parallel/test-process-constants-noatime.js`: newly discovered, not yet evaluated
- `parallel/test-process-dlopen-error-message-crash.js`: requires test/addons/ directory and common/tmpdir fixtures
- `parallel/test-process-env-allowed-flags-are-documented.js`: newly discovered, not yet evaluated
- `parallel/test-process-env-allowed-flags.js`: newly discovered, not yet evaluated
- `parallel/test-process-env-sideeffects.js`: newly discovered, not yet evaluated
- `parallel/test-process-env-tz.js`: newly discovered, not yet evaluated
- `parallel/test-process-env.js`: requires child_process.spawn for child env verification
- `parallel/test-process-euid-egid.js`: process.getuid() returns 0 (root) in WASM but seteuid/setegid cannot actually change credentials
- `parallel/test-process-exception-capture-should-abort-on-uncaught-setflagsfromstring.js`: newly discovered, not yet evaluated
- `parallel/test-process-exception-capture-should-abort-on-uncaught.js`: newly discovered, not yet evaluated
- `parallel/test-process-exception-capture.js`: newly discovered, not yet evaluated
- `parallel/test-process-exec-argv.js`: newly discovered, not yet evaluated
- `parallel/test-process-execpath.js`: newly discovered, not yet evaluated
- `parallel/test-process-exit-code-validation.js`: newly discovered, not yet evaluated
- `parallel/test-process-exit-code.js`: newly discovered, not yet evaluated
- `parallel/test-process-external-stdio-close-spawn.js`: newly discovered, not yet evaluated
- `parallel/test-process-external-stdio-close.js`: newly discovered, not yet evaluated
- `parallel/test-process-getactivehandles.js`: newly discovered, not yet evaluated
- `parallel/test-process-getactiverequests.js`: newly discovered, not yet evaluated
- `parallel/test-process-getactiveresources-track-active-handles.js`: newly discovered, not yet evaluated
- `parallel/test-process-getactiveresources-track-active-requests.js`: newly discovered, not yet evaluated
- `parallel/test-process-getactiveresources-track-interval-lifetime.js`: newly discovered, not yet evaluated
- `parallel/test-process-getactiveresources-track-multiple-timers.js`: newly discovered, not yet evaluated
- `parallel/test-process-getactiveresources-track-timer-lifetime.js`: newly discovered, not yet evaluated
- `parallel/test-process-getactiveresources.js`: newly discovered, not yet evaluated
- `parallel/test-process-kill-null.js`: newly discovered, not yet evaluated
- `parallel/test-process-load-env-file.js`: newly discovered, not yet evaluated
- `parallel/test-process-ppid.js`: newly discovered, not yet evaluated
- `parallel/test-process-prototype.js`: process is constructed as new EventEmitter() but prototype chain not fully compatible with Node.js expectations
- `parallel/test-process-raw-debug.js`: newly discovered, not yet evaluated
- `parallel/test-process-really-exit.js`: newly discovered, not yet evaluated
- `parallel/test-process-ref-unref.js`: newly discovered, not yet evaluated
- `parallel/test-process-remove-all-signal-listeners.js`: newly discovered, not yet evaluated
- `parallel/test-process-title-cli.js`: newly discovered, not yet evaluated
- `parallel/test-process-uid-gid.js`: process.getuid() returns 0 (root) in WASM but setgid/setuid cannot actually change credentials
- `parallel/test-process-uncaught-exception-monitor.js`: newly discovered, not yet evaluated
- `parallel/test-process-versions.js`: newly discovered, not yet evaluated
- `parallel/test-promise-handled-rejection-no-warning.js`: newly discovered, not yet evaluated
- `parallel/test-promise-hook-create-hook.js`: newly discovered, not yet evaluated
- `parallel/test-promise-hook-exceptions.js`: newly discovered, not yet evaluated
- `parallel/test-promise-hook-on-after.js`: newly discovered, not yet evaluated
- `parallel/test-promise-hook-on-before.js`: newly discovered, not yet evaluated
- `parallel/test-promise-hook-on-init.js`: newly discovered, not yet evaluated
- `parallel/test-promise-hook-on-resolve.js`: newly discovered, not yet evaluated
- `parallel/test-promise-reject-callback-exception.js`: newly discovered, not yet evaluated
- `parallel/test-promise-unhandled-default.js`: requires process.on('uncaughtException') and unhandledRejection handling
- `parallel/test-promise-unhandled-error.js`: requires --unhandled-rejections=strict flag
- `parallel/test-promise-unhandled-flag.js`: newly discovered, not yet evaluated
- `parallel/test-promise-unhandled-silent-no-hook.js`: newly discovered, not yet evaluated
- `parallel/test-promise-unhandled-silent.js`: newly discovered, not yet evaluated
- `parallel/test-promise-unhandled-throw-handler.js`: requires --unhandled-rejections=throw flag
- `parallel/test-promise-unhandled-throw.js`: requires --unhandled-rejections=throw flag
- `parallel/test-promise-unhandled-warn-no-hook.js`: newly discovered, not yet evaluated
- `parallel/test-promise-unhandled-warn.js`: newly discovered, not yet evaluated
- `parallel/test-promises-unhandled-proxy-rejections.js`: newly discovered, not yet evaluated
- `parallel/test-promises-unhandled-rejections.js`: newly discovered, not yet evaluated
- `parallel/test-promises-unhandled-symbol-rejections.js`: newly discovered, not yet evaluated
- `parallel/test-promises-warning-on-unhandled-rejection.js`: newly discovered, not yet evaluated
- `parallel/test-punycode.js`: newly discovered, not yet evaluated
- `parallel/test-queue-microtask-uncaught-asynchooks.js`: newly discovered, not yet evaluated
- `parallel/test-queue-microtask.js`: newly discovered, not yet evaluated
- `parallel/test-readline-async-iterators-backpressure.js`: newly discovered, not yet evaluated
- `parallel/test-readline-async-iterators-destroy.js`: newly discovered, not yet evaluated
- `parallel/test-readline-async-iterators.js`: newly discovered, not yet evaluated
- `parallel/test-readline-carriage-return-between-chunks.js`: newly discovered, not yet evaluated
- `parallel/test-readline-emit-keypress-events.js`: newly discovered, not yet evaluated
- `parallel/test-readline-input-onerror.js`: newly discovered, not yet evaluated
- `parallel/test-readline-interface-escapecodetimeout.js`: newly discovered, not yet evaluated
- `parallel/test-readline-interface-no-trailing-newline.js`: repl is not supported in WASM
- `parallel/test-readline-interface-recursive-writes.js`: repl is not supported in WASM
- `parallel/test-readline-keys.js`: newly discovered, not yet evaluated
- `parallel/test-readline-reopen.js`: newly discovered, not yet evaluated
- `parallel/test-readline-set-raw-mode.js`: newly discovered, not yet evaluated
- `parallel/test-readline-undefined-columns.js`: newly discovered, not yet evaluated
- `parallel/test-readline.js`: newly discovered, not yet evaluated
- `parallel/test-release-changelog.js`: newly discovered, not yet evaluated
- `parallel/test-release-npm.js`: newly discovered, not yet evaluated
- `parallel/test-repl-array-prototype-tempering.js`: newly discovered, not yet evaluated
- `parallel/test-repl-autolibs.js`: repl is not supported in WASM
- `parallel/test-repl-clear-immediate-crash.js`: newly discovered, not yet evaluated
- `parallel/test-repl-cli-eval.js`: newly discovered, not yet evaluated
- `parallel/test-repl-colors.js`: newly discovered, not yet evaluated
- `parallel/test-repl-context.js`: repl is not supported in WASM
- `parallel/test-repl-definecommand.js`: newly discovered, not yet evaluated
- `parallel/test-repl-domain.js`: repl is not supported in WASM
- `parallel/test-repl-dynamic-import.js`: newly discovered, not yet evaluated
- `parallel/test-repl-editor.js`: repl is not supported in WASM
- `parallel/test-repl-empty.js`: newly discovered, not yet evaluated
- `parallel/test-repl-end-emits-exit.js`: repl is not supported in WASM
- `parallel/test-repl-eval.js`: newly discovered, not yet evaluated
- `parallel/test-repl-function-definition-edge-case.js`: newly discovered, not yet evaluated
- `parallel/test-repl-harmony.js`: newly discovered, not yet evaluated
- `parallel/test-repl-import-referrer.js`: newly discovered, not yet evaluated
- `parallel/test-repl-inspect-defaults.js`: newly discovered, not yet evaluated
- `parallel/test-repl-inspector.js`: repl is not supported in WASM
- `parallel/test-repl-let-process.js`: repl is not supported in WASM
- `parallel/test-repl-load-multiline-no-trailing-newline.js`: repl is not supported in WASM
- `parallel/test-repl-load-multiline.js`: repl is not supported in WASM
- `parallel/test-repl-mode.js`: newly discovered, not yet evaluated
- `parallel/test-repl-multiline.js`: repl is not supported in WASM
- `parallel/test-repl-no-terminal.js`: newly discovered, not yet evaluated
- `parallel/test-repl-null-thrown.js`: newly discovered, not yet evaluated
- `parallel/test-repl-null.js`: newly discovered, not yet evaluated
- `parallel/test-repl-options.js`: newly discovered, not yet evaluated
- `parallel/test-repl-pretty-custom-stack.js`: repl is not supported in WASM
- `parallel/test-repl-pretty-stack-custom-writer.js`: newly discovered, not yet evaluated
- `parallel/test-repl-pretty-stack.js`: repl is not supported in WASM
- `parallel/test-repl-preview-newlines.js`: repl is not supported in WASM
- `parallel/test-repl-preview-without-inspector.js`: newly discovered, not yet evaluated
- `parallel/test-repl-preview.js`: newly discovered, not yet evaluated
- `parallel/test-repl-recoverable.js`: repl is not supported in WASM
- `parallel/test-repl-require-after-write.js`: newly discovered, not yet evaluated
- `parallel/test-repl-require-cache.js`: newly discovered, not yet evaluated
- `parallel/test-repl-require-context.js`: newly discovered, not yet evaluated
- `parallel/test-repl-require-self-referential.js`: newly discovered, not yet evaluated
- `parallel/test-repl-require.js`: newly discovered, not yet evaluated
- `parallel/test-repl-reset-event.js`: repl is not supported in WASM
- `parallel/test-repl-save-load.js`: repl is not supported in WASM
- `parallel/test-repl-setprompt.js`: newly discovered, not yet evaluated
- `parallel/test-repl-sigint-nested-eval.js`: newly discovered, not yet evaluated
- `parallel/test-repl-sigint.js`: newly discovered, not yet evaluated
- `parallel/test-repl-stdin-push-null.js`: newly discovered, not yet evaluated
- `parallel/test-repl-strict-mode-previews.js`: newly discovered, not yet evaluated
- `parallel/test-repl-syntax-error-handling.js`: newly discovered, not yet evaluated
- `parallel/test-repl-syntax-error-stack.js`: repl is not supported in WASM
- `parallel/test-repl-tab-complete-crash.js`: repl is not supported in WASM
- `parallel/test-repl-tab-complete-import.js`: repl is not supported in WASM
- `parallel/test-repl-tab-complete-nested-repls.js`: newly discovered, not yet evaluated
- `parallel/test-repl-tab-complete-no-warn.js`: repl is not supported in WASM
- `parallel/test-repl-tab-complete-on-editor-mode.js`: repl is not supported in WASM
- `parallel/test-repl-tab-complete.js`: newly discovered, not yet evaluated
- `parallel/test-repl-tab.js`: newly discovered, not yet evaluated
- `parallel/test-repl-throw-null-or-undefined.js`: newly discovered, not yet evaluated
- `parallel/test-repl-uncaught-exception-async.js`: repl is not supported in WASM
- `parallel/test-repl-uncaught-exception-evalcallback.js`: newly discovered, not yet evaluated
- `parallel/test-repl-uncaught-exception-standalone.js`: newly discovered, not yet evaluated
- `parallel/test-repl-uncaught-exception.js`: repl is not supported in WASM
- `parallel/test-repl-underscore.js`: newly discovered, not yet evaluated
- `parallel/test-repl-unexpected-token-recoverable.js`: newly discovered, not yet evaluated
- `parallel/test-repl-unsafe-array-iteration.js`: newly discovered, not yet evaluated
- `parallel/test-repl-unsupported-option.js`: newly discovered, not yet evaluated
- `parallel/test-require-delete-array-iterator.js`: newly discovered, not yet evaluated
- `parallel/test-require-dot.js`: newly discovered, not yet evaluated
- `parallel/test-require-exceptions.js`: newly discovered, not yet evaluated
- `parallel/test-require-extension-over-directory.js`: regression: was enabled but started failing
- `parallel/test-require-extensions-main.js`: newly discovered, not yet evaluated
- `parallel/test-require-extensions-same-filename-as-dir-trailing-slash.js`: newly discovered, not yet evaluated
- `parallel/test-require-extensions-same-filename-as-dir.js`: newly discovered, not yet evaluated
- `parallel/test-require-json.js`: newly discovered, not yet evaluated
- `parallel/test-require-long-path.js`: newly discovered, not yet evaluated
- `parallel/test-require-mjs.js`: newly discovered, not yet evaluated
- `parallel/test-require-node-prefix.js`: newly discovered, not yet evaluated
- `parallel/test-require-resolve-opts-paths-relative.js`: newly discovered, not yet evaluated
- `parallel/test-require-resolve.js`: newly discovered, not yet evaluated
- `parallel/test-require-symlink.js`: newly discovered, not yet evaluated
- `parallel/test-require-unicode.js`: newly discovered, not yet evaluated
- `parallel/test-resource-usage.js`: newly discovered, not yet evaluated
- `parallel/test-runner-cli-concurrency.js`: newly discovered, not yet evaluated
- `parallel/test-runner-cli-timeout.js`: newly discovered, not yet evaluated
- `parallel/test-runner-coverage-source-map.js`: Inspector not available in WASM
- `parallel/test-runner-coverage-thresholds.js`: Inspector not available in WASM
- `parallel/test-runner-error-reporter.js`: newly discovered, not yet evaluated
- `parallel/test-runner-exit-code.js`: newly discovered, not yet evaluated
- `parallel/test-runner-extraneous-async-activity.js`: newly discovered, not yet evaluated
- `parallel/test-runner-force-exit-failure.js`: newly discovered, not yet evaluated
- `parallel/test-runner-force-exit-flush.js`: newly discovered, not yet evaluated
- `parallel/test-runner-import-no-scheme.js`: newly discovered, not yet evaluated
- `parallel/test-runner-misc.js`: [manual] amp fix attempt failed verification
- `parallel/test-runner-mock-timers-date.js`: newly discovered, not yet evaluated
- `parallel/test-runner-mock-timers-scheduler.js`: newly discovered, not yet evaluated
- `parallel/test-runner-module-mocking.js`: newly discovered, not yet evaluated
- `parallel/test-runner-no-isolation-filtering.js`: newly discovered, not yet evaluated
- `parallel/test-runner-reporters.js`: newly discovered, not yet evaluated
- `parallel/test-runner-root-duration.js`: newly discovered, not yet evaluated
- `parallel/test-runner-snapshot-file-tests.js`: newly discovered, not yet evaluated
- `parallel/test-security-revert-unknown.js`: newly discovered, not yet evaluated
- `parallel/test-set-incoming-message-header.js`: newly discovered, not yet evaluated
- `parallel/test-set-process-debug-port.js`: newly discovered, not yet evaluated
- `parallel/test-setproctitle.js`: newly discovered, not yet evaluated
- `parallel/test-shadow-realm-allowed-builtin-modules.js`: newly discovered, not yet evaluated
- `parallel/test-shadow-realm-custom-loaders.js`: newly discovered, not yet evaluated
- `parallel/test-shadow-realm-gc-module.js`: newly discovered, not yet evaluated
- `parallel/test-shadow-realm-gc.js`: newly discovered, not yet evaluated
- `parallel/test-shadow-realm-globals.js`: newly discovered, not yet evaluated
- `parallel/test-shadow-realm-import-value-resolve.js`: newly discovered, not yet evaluated
- `parallel/test-shadow-realm-module.js`: newly discovered, not yet evaluated
- `parallel/test-shadow-realm-prepare-stack-trace.js`: newly discovered, not yet evaluated
- `parallel/test-shadow-realm.js`: newly discovered, not yet evaluated
- `parallel/test-sigint-infinite-loop.js`: newly discovered, not yet evaluated
- `parallel/test-signal-args.js`: newly discovered, not yet evaluated
- `parallel/test-signal-handler.js`: newly discovered, not yet evaluated
- `parallel/test-signal-unregister.js`: newly discovered, not yet evaluated
- `parallel/test-single-executable-blob-config-errors.js`: newly discovered, not yet evaluated
- `parallel/test-single-executable-blob-config.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-api.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-argv1.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-basic.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-child-process-sync.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-cjs-main.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-config.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-console.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-console.js#block_00_block_00`: Inspector not available in WASM
- `parallel/test-snapshot-console.js#block_01_block_01`: Inspector not available in WASM
- `parallel/test-snapshot-coverage.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-coverage.js#block_00_block_00`: Inspector not available in WASM
- `parallel/test-snapshot-coverage.js#block_01_block_01`: Inspector not available in WASM
- `parallel/test-snapshot-cwd.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-dns-lookup-localhost-promise.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-dns-lookup-localhost.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-dns-resolve-localhost-promise.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-dns-resolve-localhost.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-error.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-eval.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-gzip.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-incompatible.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-namespaced-builtin.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-net.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-reproducible.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-stack-trace-limit-mutation.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-stack-trace-limit.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-typescript.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-umd.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-warning.js`: newly discovered, not yet evaluated
- `parallel/test-snapshot-worker.js`: newly discovered, not yet evaluated
- `parallel/test-socket-address.js`: newly discovered, not yet evaluated
- `parallel/test-socket-options-invalid.js`: newly discovered, not yet evaluated
- `parallel/test-socket-write-after-fin-error.js`: newly discovered, not yet evaluated
- `parallel/test-socket-write-after-fin.js`: newly discovered, not yet evaluated
- `parallel/test-socket-writes-before-passed-to-tls-socket.js`: newly discovered, not yet evaluated
- `parallel/test-source-map-api.js`: newly discovered, not yet evaluated
- `parallel/test-source-map-cjs-require-cache.js`: newly discovered, not yet evaluated
- `parallel/test-spawn-cmd-named-pipe.js`: newly discovered, not yet evaluated
- `parallel/test-stack-size-limit.js`: newly discovered, not yet evaluated
- `parallel/test-startup-large-pages.js`: newly discovered, not yet evaluated
- `parallel/test-stdin-child-proc.js`: newly discovered, not yet evaluated
- `parallel/test-stdin-from-file-spawn.js`: newly discovered, not yet evaluated
- `parallel/test-stdin-pipe-large.js`: newly discovered, not yet evaluated
- `parallel/test-stdin-pipe-resume.js`: newly discovered, not yet evaluated
- `parallel/test-stdin-script-child-option.js`: newly discovered, not yet evaluated
- `parallel/test-stdin-script-child.js`: newly discovered, not yet evaluated
- `parallel/test-stdio-closed.js`: newly discovered, not yet evaluated
- `parallel/test-stdio-pipe-redirect.js`: newly discovered, not yet evaluated
- `parallel/test-stdio-undestroy.js`: newly discovered, not yet evaluated
- `parallel/test-stdout-cannot-be-closed-child-process-pipe.js`: newly discovered, not yet evaluated
- `parallel/test-stdout-close-catch.js`: newly discovered, not yet evaluated
- `parallel/test-stdout-close-unref.js`: newly discovered, not yet evaluated
- `parallel/test-stdout-pipeline-destroy.js`: newly discovered, not yet evaluated
- `parallel/test-stdout-stderr-reading.js`: newly discovered, not yet evaluated
- `parallel/test-strace-openat-openssl.js`: newly discovered, not yet evaluated
- `parallel/test-stream-pipeline-http2.js`: [manual] This test requires `http2.createServer()` (TCP server listening on a port) and `http2.connect()` (full HTTP/2 protocol client), neither of which are available in the WebAssembly/WASI envir...
- `parallel/test-stream-readable-to-web.js`: [manual] amp fix caused regressions
- `parallel/test-stream2-compatibility.js`: newly discovered, not yet evaluated
- `parallel/test-stream2-httpclient-response-end.js`: requires HTTP server functionality, we only support clients
- `parallel/test-stream2-large-read-stall.js`: hangs forever - test execution never completes
- `parallel/test-streams-highwatermark.js`: newly discovered, not yet evaluated
- `parallel/test-stringbytes-external.js`: newly discovered, not yet evaluated
- `parallel/test-structuredClone-global.js`: newly discovered, not yet evaluated
- `parallel/test-sync-io-option.js`: newly discovered, not yet evaluated
- `parallel/test-tick-processor-arguments.js`: newly discovered, not yet evaluated
- `parallel/test-timers-active.js`: requires timer._idleTimeout, _onTimeout, and other internal timer properties
- `parallel/test-timers-api-refs.js`: requires timers module to export setTimeout/setInterval/setImmediate directly
- `parallel/test-timers-destroyed.js`: requires process.on('exit') and functional timer.unref() to prevent event loop from waiting
- `parallel/test-timers-enroll-invalid-msecs.js`: requires timers.enroll which is not implemented
- `parallel/test-timers-enroll-second-time.js`: requires timers.enroll which is not implemented
- `parallel/test-timers-immediate-queue.js`: requires process.on('exit') hooks
- `parallel/test-timers-interval-throw.js`: requires process.on('uncaughtException') hooks
- `parallel/test-timers-promises-scheduler.js`: requires scheduler.yield, scheduler.wait, and ERR_ILLEGAL_CONSTRUCTOR
- `parallel/test-timers-socket-timeout-removes-other-socket-unref-timer.js`: requires net.createServer and socket operations
- `parallel/test-timers-unref-active.js`: requires timer.unref() and _unrefActive
- `parallel/test-timers-unref-remove-other-unref-timers-only-one-fires.js`: requires timer.unref() which is not implemented
- `parallel/test-timers-unref-remove-other-unref-timers.js`: requires timer.unref() which is not implemented
- `parallel/test-timers-unrefed-in-callback.js`: requires timer.unref() and process.on('exit')
- `parallel/test-timers.js`: newly discovered, not yet evaluated
- `parallel/test-tls-0-dns-altname.js`: newly discovered, not yet evaluated
- `parallel/test-tls-add-context.js`: newly discovered, not yet evaluated
- `parallel/test-tls-addca.js`: newly discovered, not yet evaluated
- `parallel/test-tls-alert-handling.js`: newly discovered, not yet evaluated
- `parallel/test-tls-alert.js`: newly discovered, not yet evaluated
- `parallel/test-tls-alpn-server-client.js`: newly discovered, not yet evaluated
- `parallel/test-tls-async-cb-after-socket-end.js`: newly discovered, not yet evaluated
- `parallel/test-tls-basic-validations.js`: newly discovered, not yet evaluated
- `parallel/test-tls-buffersize.js`: newly discovered, not yet evaluated
- `parallel/test-tls-ca-concat.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cert-chains-concat.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cert-chains-in-ca.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cert-ext-encoding.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cert-regression.js`: newly discovered, not yet evaluated
- `parallel/test-tls-check-server-identity.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cipher-list.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cli-max-version-1.2.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cli-max-version-1.3.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cli-min-version-1.0.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cli-min-version-1.1.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cli-min-version-1.2.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cli-min-version-1.3.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-abort.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-abort2.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-allow-partial-trust-chain.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-auth.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-default-ciphers.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-destroy-soon.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-getephemeralkeyinfo.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-mindhsize.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-reject-12.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-reject.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-renegotiation-13.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-renegotiation-limit.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-resume-12.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-resume.js`: newly discovered, not yet evaluated
- `parallel/test-tls-client-verify.js`: newly discovered, not yet evaluated
- `parallel/test-tls-clientcertengine-invalid-arg-type.js`: newly discovered, not yet evaluated
- `parallel/test-tls-close-error.js`: newly discovered, not yet evaluated
- `parallel/test-tls-close-event-after-write.js`: newly discovered, not yet evaluated
- `parallel/test-tls-cnnic-whitelist.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-abort-controller.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-address-family.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-allow-half-open-option.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-given-socket.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-hints-option.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-hwm-option.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-memleak.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-no-host.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-pipe.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-secure-context.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-simple.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-stream-writes.js`: newly discovered, not yet evaluated
- `parallel/test-tls-connect-timeout-option.js`: newly discovered, not yet evaluated
- `parallel/test-tls-delayed-attach-error.js`: newly discovered, not yet evaluated
- `parallel/test-tls-delayed-attach.js`: newly discovered, not yet evaluated
- `parallel/test-tls-destroy-stream-12.js`: newly discovered, not yet evaluated
- `parallel/test-tls-destroy-stream.js`: newly discovered, not yet evaluated
- `parallel/test-tls-destroy-whilst-write.js`: newly discovered, not yet evaluated
- `parallel/test-tls-dhe.js`: newly discovered, not yet evaluated
- `parallel/test-tls-disable-renegotiation.js`: newly discovered, not yet evaluated
- `parallel/test-tls-ecdh-auto.js`: newly discovered, not yet evaluated
- `parallel/test-tls-ecdh-multiple.js`: newly discovered, not yet evaluated
- `parallel/test-tls-ecdh.js`: newly discovered, not yet evaluated
- `parallel/test-tls-econnreset.js`: newly discovered, not yet evaluated
- `parallel/test-tls-empty-sni-context.js`: newly discovered, not yet evaluated
- `parallel/test-tls-env-bad-extra-ca.js`: newly discovered, not yet evaluated
- `parallel/test-tls-env-extra-ca-with-options.js`: newly discovered, not yet evaluated
- `parallel/test-tls-env-extra-ca.js`: newly discovered, not yet evaluated
- `parallel/test-tls-error-servername.js`: newly discovered, not yet evaluated
- `parallel/test-tls-error-stack.js`: newly discovered, not yet evaluated
- `parallel/test-tls-exportkeyingmaterial.js`: newly discovered, not yet evaluated
- `parallel/test-tls-external-accessor.js`: newly discovered, not yet evaluated
- `parallel/test-tls-fast-writing.js`: newly discovered, not yet evaluated
- `parallel/test-tls-finished.js`: newly discovered, not yet evaluated
- `parallel/test-tls-friendly-error-message.js`: newly discovered, not yet evaluated
- `parallel/test-tls-generic-stream.js`: newly discovered, not yet evaluated
- `parallel/test-tls-getcertificate-x509.js`: newly discovered, not yet evaluated
- `parallel/test-tls-getcipher.js`: newly discovered, not yet evaluated
- `parallel/test-tls-getprotocol.js`: newly discovered, not yet evaluated
- `parallel/test-tls-handshake-error.js`: newly discovered, not yet evaluated
- `parallel/test-tls-handshake-exception.js`: newly discovered, not yet evaluated
- `parallel/test-tls-handshake-nohang.js`: newly discovered, not yet evaluated
- `parallel/test-tls-hello-parser-failure.js`: newly discovered, not yet evaluated
- `parallel/test-tls-honorcipherorder.js`: newly discovered, not yet evaluated
- `parallel/test-tls-inception.js`: newly discovered, not yet evaluated
- `parallel/test-tls-interleave.js`: newly discovered, not yet evaluated
- `parallel/test-tls-invalid-pfx.js`: newly discovered, not yet evaluated
- `parallel/test-tls-invoke-queued.js`: newly discovered, not yet evaluated
- `parallel/test-tls-ip-servername-deprecation.js`: newly discovered, not yet evaluated
- `parallel/test-tls-js-stream.js`: newly discovered, not yet evaluated
- `parallel/test-tls-junk-closes-server.js`: newly discovered, not yet evaluated
- `parallel/test-tls-junk-server.js`: newly discovered, not yet evaluated
- `parallel/test-tls-key-mismatch.js`: newly discovered, not yet evaluated
- `parallel/test-tls-keyengine-invalid-arg-type.js`: newly discovered, not yet evaluated
- `parallel/test-tls-keylog-tlsv13.js`: newly discovered, not yet evaluated
- `parallel/test-tls-legacy-deprecated.js`: newly discovered, not yet evaluated
- `parallel/test-tls-legacy-pfx.js`: newly discovered, not yet evaluated
- `parallel/test-tls-max-send-fragment.js`: newly discovered, not yet evaluated
- `parallel/test-tls-min-max-version.js`: newly discovered, not yet evaluated
- `parallel/test-tls-multi-key.js`: newly discovered, not yet evaluated
- `parallel/test-tls-multi-pfx.js`: newly discovered, not yet evaluated
- `parallel/test-tls-multiple-cas-as-string.js`: newly discovered, not yet evaluated
- `parallel/test-tls-net-connect-prefer-path.js`: newly discovered, not yet evaluated
- `parallel/test-tls-net-socket-keepalive-12.js`: newly discovered, not yet evaluated
- `parallel/test-tls-net-socket-keepalive.js`: newly discovered, not yet evaluated
- `parallel/test-tls-no-cert-required.js`: newly discovered, not yet evaluated
- `parallel/test-tls-no-rsa-key.js`: newly discovered, not yet evaluated
- `parallel/test-tls-no-sslv23.js`: newly discovered, not yet evaluated
- `parallel/test-tls-no-sslv3.js`: newly discovered, not yet evaluated
- `parallel/test-tls-ocsp-callback.js`: newly discovered, not yet evaluated
- `parallel/test-tls-on-empty-socket.js`: newly discovered, not yet evaluated
- `parallel/test-tls-onread-static-buffer.js`: newly discovered, not yet evaluated
- `parallel/test-tls-options-boolean-check.js`: newly discovered, not yet evaluated
- `parallel/test-tls-over-http-tunnel.js`: newly discovered, not yet evaluated
- `parallel/test-tls-passphrase.js`: newly discovered, not yet evaluated
- `parallel/test-tls-pause.js`: newly discovered, not yet evaluated
- `parallel/test-tls-peer-certificate-encoding.js`: newly discovered, not yet evaluated
- `parallel/test-tls-peer-certificate-multi-keys.js`: newly discovered, not yet evaluated
- `parallel/test-tls-peer-certificate.js`: newly discovered, not yet evaluated
- `parallel/test-tls-pfx-authorizationerror.js`: newly discovered, not yet evaluated
- `parallel/test-tls-psk-circuit.js`: newly discovered, not yet evaluated
- `parallel/test-tls-psk-errors.js`: newly discovered, not yet evaluated
- `parallel/test-tls-psk-server.js`: newly discovered, not yet evaluated
- `parallel/test-tls-reduced-SECLEVEL-in-cipher.js`: newly discovered, not yet evaluated
- `parallel/test-tls-request-timeout.js`: newly discovered, not yet evaluated
- `parallel/test-tls-retain-handle-no-abort.js`: newly discovered, not yet evaluated
- `parallel/test-tls-reuse-host-from-socket.js`: newly discovered, not yet evaluated
- `parallel/test-tls-root-certificates.js`: newly discovered, not yet evaluated
- `parallel/test-tls-secure-context-usage-order.js`: newly discovered, not yet evaluated
- `parallel/test-tls-secure-session.js`: newly discovered, not yet evaluated
- `parallel/test-tls-securepair-fiftharg.js`: newly discovered, not yet evaluated
- `parallel/test-tls-securepair-leak.js`: newly discovered, not yet evaluated
- `parallel/test-tls-securepair-server.js`: newly discovered, not yet evaluated
- `parallel/test-tls-server-capture-rejection.js`: newly discovered, not yet evaluated
- `parallel/test-tls-server-connection-server.js`: newly discovered, not yet evaluated
- `parallel/test-tls-server-failed-handshake-emits-clienterror.js`: newly discovered, not yet evaluated
- `parallel/test-tls-server-parent-constructor-options.js`: newly discovered, not yet evaluated
- `parallel/test-tls-server-setkeycert.js`: newly discovered, not yet evaluated
- `parallel/test-tls-server-setoptions-clientcertengine.js`: newly discovered, not yet evaluated
- `parallel/test-tls-server-verify.js`: newly discovered, not yet evaluated
- `parallel/test-tls-session-cache.js`: newly discovered, not yet evaluated
- `parallel/test-tls-set-ciphers-error.js`: newly discovered, not yet evaluated
- `parallel/test-tls-set-ciphers.js`: newly discovered, not yet evaluated
- `parallel/test-tls-set-encoding.js`: newly discovered, not yet evaluated
- `parallel/test-tls-set-secure-context.js`: newly discovered, not yet evaluated
- `parallel/test-tls-set-sigalgs.js`: newly discovered, not yet evaluated
- `parallel/test-tls-sni-option.js`: newly discovered, not yet evaluated
- `parallel/test-tls-sni-server-client.js`: newly discovered, not yet evaluated
- `parallel/test-tls-sni-servername.js`: newly discovered, not yet evaluated
- `parallel/test-tls-snicallback-error.js`: newly discovered, not yet evaluated
- `parallel/test-tls-socket-allow-half-open-option.js`: newly discovered, not yet evaluated
- `parallel/test-tls-socket-close.js`: requires TLS server functionality
- `parallel/test-tls-socket-constructor-alpn-options-parsing.js`: newly discovered, not yet evaluated
- `parallel/test-tls-socket-default-options.js`: newly discovered, not yet evaluated
- `parallel/test-tls-socket-destroy.js`: newly discovered, not yet evaluated
- `parallel/test-tls-socket-failed-handshake-emits-error.js`: newly discovered, not yet evaluated
- `parallel/test-tls-socket-snicallback-without-server.js`: newly discovered, not yet evaluated
- `parallel/test-tls-startcom-wosign-whitelist.js`: newly discovered, not yet evaluated
- `parallel/test-tls-starttls-server.js`: newly discovered, not yet evaluated
- `parallel/test-tls-streamwrap-buffersize.js`: newly discovered, not yet evaluated
- `parallel/test-tls-ticket-12.js`: newly discovered, not yet evaluated
- `parallel/test-tls-ticket-cluster.js`: newly discovered, not yet evaluated
- `parallel/test-tls-ticket-invalid-arg.js`: newly discovered, not yet evaluated
- `parallel/test-tls-ticket.js`: newly discovered, not yet evaluated
- `parallel/test-tls-timeout-server-2.js`: newly discovered, not yet evaluated
- `parallel/test-tls-timeout-server.js`: newly discovered, not yet evaluated
- `parallel/test-tls-tlswrap-segfault-2.js`: newly discovered, not yet evaluated
- `parallel/test-tls-tlswrap-segfault.js`: newly discovered, not yet evaluated
- `parallel/test-tls-translate-peer-certificate.js`: newly discovered, not yet evaluated
- `parallel/test-tls-transport-destroy-after-own-gc.js`: newly discovered, not yet evaluated
- `parallel/test-tls-use-after-free-regression.js`: newly discovered, not yet evaluated
- `parallel/test-tls-wrap-econnreset-localaddress.js`: newly discovered, not yet evaluated
- `parallel/test-tls-wrap-econnreset-socket.js`: newly discovered, not yet evaluated
- `parallel/test-tls-wrap-econnreset.js`: newly discovered, not yet evaluated
- `parallel/test-tls-wrap-event-emmiter.js`: newly discovered, not yet evaluated
- `parallel/test-tls-write-error.js`: newly discovered, not yet evaluated
- `parallel/test-tls-writewrap-leak.js`: newly discovered, not yet evaluated
- `parallel/test-tls-zero-clear-in.js`: newly discovered, not yet evaluated
- `parallel/test-tojson-perf_hooks.js`: newly discovered, not yet evaluated
- `parallel/test-trace-atomic-deprecation.js`: newly discovered, not yet evaluated
- `parallel/test-trace-atomics-wait.js`: newly discovered, not yet evaluated
- `parallel/test-trace-env-stack.js`: newly discovered, not yet evaluated
- `parallel/test-trace-env.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-all.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-async-hooks-dynamic.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-async-hooks-worker.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-async-hooks.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-console.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-dynamic-enable-workers-disabled.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-environment.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-file-pattern.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-fs-async.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-fs-sync.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-http.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-metadata.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-net-abstract-socket.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-net.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-none.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-process-exit.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-threadpool.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-v8.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-worker-metadata-with-name.js`: newly discovered, not yet evaluated
- `parallel/test-trace-events-worker-metadata.js`: newly discovered, not yet evaluated
- `parallel/test-trace-exit-stack-limit.js`: newly discovered, not yet evaluated
- `parallel/test-trace-exit.js`: newly discovered, not yet evaluated
- `parallel/test-tracing-no-crash.js`: newly discovered, not yet evaluated
- `parallel/test-tty-stdin-end.js`: newly discovered, not yet evaluated
- `parallel/test-tty-stdin-pipe.js`: newly discovered, not yet evaluated
- `parallel/test-ttywrap-stack.js`: newly discovered, not yet evaluated
- `parallel/test-tz-version.js`: newly discovered, not yet evaluated
- `parallel/test-unhandled-exception-rethrow-error.js`: newly discovered, not yet evaluated
- `parallel/test-unhandled-exception-with-worker-inuse.js`: newly discovered, not yet evaluated
- `parallel/test-v8-collect-gc-profile-exit-before-stop.js`: newly discovered, not yet evaluated
- `parallel/test-v8-collect-gc-profile-in-worker.js`: newly discovered, not yet evaluated
- `parallel/test-v8-collect-gc-profile.js`: newly discovered, not yet evaluated
- `parallel/test-v8-deserialize-buffer.js`: newly discovered, not yet evaluated
- `parallel/test-v8-flag-type-check.js`: newly discovered, not yet evaluated
- `parallel/test-v8-flags.js`: newly discovered, not yet evaluated
- `parallel/test-v8-getheapsnapshot-twice.js`: newly discovered, not yet evaluated
- `parallel/test-v8-query-objects.js`: newly discovered, not yet evaluated
- `parallel/test-v8-serialize-leak.js`: newly discovered, not yet evaluated
- `parallel/test-v8-startup-snapshot-api.js`: newly discovered, not yet evaluated
- `parallel/test-v8-stats.js`: newly discovered, not yet evaluated
- `parallel/test-v8-version-tag.js`: newly discovered, not yet evaluated
- `parallel/test-vfs.js`: newly discovered, not yet evaluated
- `parallel/test-vm-access-process-env.js`: newly discovered, not yet evaluated
- `parallel/test-vm-attributes-property-not-on-sandbox.js`: newly discovered, not yet evaluated
- `parallel/test-vm-basic.js`: newly discovered, not yet evaluated
- `parallel/test-vm-cached-data.js`: newly discovered, not yet evaluated
- `parallel/test-vm-codegen.js`: newly discovered, not yet evaluated
- `parallel/test-vm-context-dont-contextify.js`: newly discovered, not yet evaluated
- `parallel/test-vm-context-property-forwarding.js`: newly discovered, not yet evaluated
- `parallel/test-vm-context.js`: newly discovered, not yet evaluated
- `parallel/test-vm-create-and-run-in-context.js`: newly discovered, not yet evaluated
- `parallel/test-vm-create-context-accessors.js`: newly discovered, not yet evaluated
- `parallel/test-vm-create-context-arg.js`: newly discovered, not yet evaluated
- `parallel/test-vm-createcacheddata.js`: newly discovered, not yet evaluated
- `parallel/test-vm-dynamic-import-callback-missing-flag.js`: newly discovered, not yet evaluated
- `parallel/test-vm-function-declaration.js`: newly discovered, not yet evaluated
- `parallel/test-vm-function-redefinition.js`: newly discovered, not yet evaluated
- `parallel/test-vm-getters.js`: newly discovered, not yet evaluated
- `parallel/test-vm-global-define-property.js`: newly discovered, not yet evaluated
- `parallel/test-vm-global-identity.js`: newly discovered, not yet evaluated
- `parallel/test-vm-global-non-writable-properties.js`: newly discovered, not yet evaluated
- `parallel/test-vm-global-property-enumerator.js`: newly discovered, not yet evaluated
- `parallel/test-vm-global-property-interceptors.js`: newly discovered, not yet evaluated
- `parallel/test-vm-global-property-prototype.js`: newly discovered, not yet evaluated
- `parallel/test-vm-global-setter.js`: newly discovered, not yet evaluated
- `parallel/test-vm-harmony-symbols.js`: newly discovered, not yet evaluated
- `parallel/test-vm-indexed-properties.js`: newly discovered, not yet evaluated
- `parallel/test-vm-inherited_properties.js`: newly discovered, not yet evaluated
- `parallel/test-vm-is-context.js`: newly discovered, not yet evaluated
- `parallel/test-vm-low-stack-space.js`: newly discovered, not yet evaluated
- `parallel/test-vm-measure-memory-lazy.js`: newly discovered, not yet evaluated
- `parallel/test-vm-measure-memory-multi-context.js`: newly discovered, not yet evaluated
- `parallel/test-vm-measure-memory.js`: newly discovered, not yet evaluated
- `parallel/test-vm-module-basic.js`: newly discovered, not yet evaluated
- `parallel/test-vm-module-cached-data.js`: newly discovered, not yet evaluated
- `parallel/test-vm-module-dynamic-import.js`: newly discovered, not yet evaluated
- `parallel/test-vm-module-dynamic-namespace.js`: newly discovered, not yet evaluated
- `parallel/test-vm-module-errors.js`: newly discovered, not yet evaluated
- `parallel/test-vm-module-import-meta.js`: newly discovered, not yet evaluated
- `parallel/test-vm-module-link.js`: newly discovered, not yet evaluated
- `parallel/test-vm-module-synthetic.js`: newly discovered, not yet evaluated
- `parallel/test-vm-no-dynamic-import-callback.js`: newly discovered, not yet evaluated
- `parallel/test-vm-not-strict.js`: newly discovered, not yet evaluated
- `parallel/test-vm-options-validation.js`: newly discovered, not yet evaluated
- `parallel/test-vm-ownkeys.js`: newly discovered, not yet evaluated
- `parallel/test-vm-ownpropertynames.js`: newly discovered, not yet evaluated
- `parallel/test-vm-ownpropertysymbols.js`: newly discovered, not yet evaluated
- `parallel/test-vm-preserves-property.js`: newly discovered, not yet evaluated
- `parallel/test-vm-property-not-on-sandbox.js`: newly discovered, not yet evaluated
- `parallel/test-vm-proxies.js`: newly discovered, not yet evaluated
- `parallel/test-vm-proxy-failure-CP.js`: newly discovered, not yet evaluated
- `parallel/test-vm-run-in-new-context.js`: newly discovered, not yet evaluated
- `parallel/test-vm-set-property-proxy.js`: newly discovered, not yet evaluated
- `parallel/test-vm-sigint-existing-handler.js`: newly discovered, not yet evaluated
- `parallel/test-vm-sigint.js`: newly discovered, not yet evaluated
- `parallel/test-vm-source-map-url.js`: newly discovered, not yet evaluated
- `parallel/test-vm-strict-assign.js`: newly discovered, not yet evaluated
- `parallel/test-vm-strict-mode.js`: newly discovered, not yet evaluated
- `parallel/test-vm-symbols.js`: newly discovered, not yet evaluated
- `parallel/test-vm-syntax-error-message.js`: newly discovered, not yet evaluated
- `parallel/test-vm-syntax-error-stderr.js`: newly discovered, not yet evaluated
- `parallel/test-vm-timeout-escape-promise-2.js`: newly discovered, not yet evaluated
- `parallel/test-vm-timeout-escape-promise-module.js`: newly discovered, not yet evaluated
- `parallel/test-vm-timeout-escape-promise.js`: newly discovered, not yet evaluated
- `parallel/test-vm-timeout.js`: newly discovered, not yet evaluated
- `parallel/test-warn-sigprof.js`: newly discovered, not yet evaluated
- `parallel/test-warn-stream-wrap.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-constructors.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-derivebits-cfrg.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-derivebits-ecdh.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-derivebits-hkdf.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-derivekey-cfrg.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-derivekey-ecdh.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-digest.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-encrypt-decrypt-aes.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-encrypt-decrypt-rsa.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-encrypt-decrypt.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-export-import-cfrg.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-export-import-ec.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-export-import-rsa.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-export-import.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-getRandomValues.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-random.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-sign-verify-ecdsa.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-sign-verify-eddsa.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-sign-verify-hmac.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-sign-verify-rsa.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-sign-verify.js`: newly discovered, not yet evaluated
- `parallel/test-webcrypto-wrap-unwrap.js`: newly discovered, not yet evaluated
- `parallel/test-websocket.js`: newly discovered, not yet evaluated
- `parallel/test-webstorage.js`: newly discovered, not yet evaluated
- `parallel/test-webstream-encoding-inspect.js`: newly discovered, not yet evaluated
- `parallel/test-webstream-readable-from.js`: newly discovered, not yet evaluated
- `parallel/test-webstreams-abort-controller.js`: newly discovered, not yet evaluated
- `parallel/test-webstreams-clone-unref.js`: newly discovered, not yet evaluated
- `parallel/test-webstreams-finished.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-encoding-custom-fatal-streaming.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-encoding-custom-fatal-streaming.js#block_00_block_00`: missing Intl
- `parallel/test-whatwg-encoding-custom-fatal-streaming.js#block_01_block_01`: missing Intl
- `parallel/test-whatwg-encoding-custom-textdecoder-api-invalid-label.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-encoding-custom-textdecoder-fatal.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-encoding-custom-textdecoder-invalid-arg.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-encoding-custom-textdecoder-streaming.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-encoding-custom-textdecoder-utf16-surrogates.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-events-add-event-listener-options-passive.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-events-add-event-listener-options-passive.js#block_01_block_01`: TODO: passive listeners is still broken
- `parallel/test-whatwg-events-event-constructors.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-events-eventtarget-this-of-listener.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-readablebytestream-bad-buffers-and-views.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-global.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-href-side-effect.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-inspect.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-parsing.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-append.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-constructor.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-delete.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-entries.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-foreach.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-get.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-getall.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-has.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-inspect.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-keys.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-set.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-sort.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-stringifier.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams-values.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-searchparams.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-setters.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-custom-setters.js#block_00_block_00`: missing Intl
- `parallel/test-whatwg-url-custom-setters.js#block_01_block_01`: missing Intl
- `parallel/test-whatwg-url-custom-tostringtag.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-invalidthis.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-url-properties.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-webstreams-compression.js`: newly discovered, not yet evaluated
- `parallel/test-whatwg-webstreams-encoding.js`: newly discovered, not yet evaluated
- `parallel/test-windows-abort-exitcode.js`: newly discovered, not yet evaluated
- `parallel/test-windows-failed-heap-allocation.js`: newly discovered, not yet evaluated
- `parallel/test-worker-broadcastchannel-wpt.js`: newly discovered, not yet evaluated
- `parallel/test-worker-broadcastchannel.js`: newly discovered, not yet evaluated
- `parallel/test-worker-debug.js`: newly discovered, not yet evaluated
- `parallel/test-worker-eval-typescript.js`: newly discovered, not yet evaluated
- `parallel/test-worker-execargv-invalid.js`: newly discovered, not yet evaluated
- `parallel/test-worker-execargv.js`: newly discovered, not yet evaluated
- `parallel/test-worker-exit-code.js`: newly discovered, not yet evaluated
- `parallel/test-worker-hasref.js`: newly discovered, not yet evaluated
- `parallel/test-worker-init-failure.js`: newly discovered, not yet evaluated
- `parallel/test-worker-invalid-workerdata.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-channel-sharedarraybuffer.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-event.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-mark-as-uncloneable.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-close.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-constructor.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-drain.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-infinite-message-loop.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-inspect-during-init-hook.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-move.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-receive-message.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-transfer-closed.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-transfer-duplicate.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-transfer-fake-js-transferable-internal.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-transfer-fake-js-transferable.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-transfer-filehandle.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-transfer-self.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-transfer-target.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-wasm-module.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-port-wasm-threads.js`: newly discovered, not yet evaluated
- `parallel/test-worker-message-transfer-port-mark-as-untransferable.js`: newly discovered, not yet evaluated
- `parallel/test-worker-messageport-hasref.js`: newly discovered, not yet evaluated
- `parallel/test-worker-messaging-errors-handler.js`: newly discovered, not yet evaluated
- `parallel/test-worker-messaging-errors-invalid.js`: newly discovered, not yet evaluated
- `parallel/test-worker-messaging-errors-timeout.js`: newly discovered, not yet evaluated
- `parallel/test-worker-messaging.js`: requires worker_threads
- `parallel/test-worker-name.js`: newly discovered, not yet evaluated
- `parallel/test-worker-no-stdin-stdout-interaction.js`: newly discovered, not yet evaluated
- `parallel/test-worker-node-options.js`: newly discovered, not yet evaluated
- `parallel/test-worker-process-argv.js`: newly discovered, not yet evaluated
- `parallel/test-worker-process-cwd.js`: newly discovered, not yet evaluated
- `parallel/test-worker-process-env.js`: newly discovered, not yet evaluated
- `parallel/test-worker-resource-limits.js`: newly discovered, not yet evaluated
- `parallel/test-worker-stdio-flush-inflight.js`: newly discovered, not yet evaluated
- `parallel/test-worker-stdio-flush.js`: newly discovered, not yet evaluated
- `parallel/test-worker-stdio.js`: newly discovered, not yet evaluated
- `parallel/test-worker-type-check.js`: newly discovered, not yet evaluated
- `parallel/test-worker-unref-from-message-during-exit.js`: newly discovered, not yet evaluated
- `parallel/test-worker-unsupported-path.js`: newly discovered, not yet evaluated
- `parallel/test-worker-workerdata-sharedarraybuffer.js`: newly discovered, not yet evaluated
- `parallel/test-x509-escaping.js`: newly discovered, not yet evaluated
- `sequential/test-buffer-creation-regression.js`: QuickJS error message casing mismatch prevents graceful skip; WASM cannot allocate 4GB ArrayBuffer anyway
- `sequential/test-child-process-emfile.js`: child_process is not supported in WebAssembly environment
- `sequential/test-child-process-execsync.js`: child_process is not supported in WebAssembly environment
- `sequential/test-child-process-exit.js`: child_process is not supported in WebAssembly environment
- `sequential/test-child-process-pass-fd.js`: child_process is not supported in WebAssembly environment
- `sequential/test-cli-syntax-require.js`: newly discovered, not yet evaluated
- `sequential/test-cluster-inspect-brk.js`: newly discovered, not yet evaluated
- `sequential/test-cluster-net-listen-ipv6only-none.js`: newly discovered, not yet evaluated
- `sequential/test-cluster-net-listen-ipv6only-rr.js`: newly discovered, not yet evaluated
- `sequential/test-cluster-send-handle-large-payload.js`: cluster is not supported in WebAssembly environment
- `sequential/test-cpu-prof-default.js`: newly discovered, not yet evaluated
- `sequential/test-cpu-prof-dir-absolute.js`: newly discovered, not yet evaluated
- `sequential/test-cpu-prof-dir-and-name.js`: newly discovered, not yet evaluated
- `sequential/test-cpu-prof-dir-relative.js`: newly discovered, not yet evaluated
- `sequential/test-cpu-prof-dir-worker.js`: newly discovered, not yet evaluated
- `sequential/test-cpu-prof-drained.js`: newly discovered, not yet evaluated
- `sequential/test-cpu-prof-exit.js`: newly discovered, not yet evaluated
- `sequential/test-cpu-prof-invalid-options.js`: newly discovered, not yet evaluated
- `sequential/test-cpu-prof-invalid-options.js#block_00_cpu_prof_name_without_cpu_prof`: Inspector not available in WASM
- `sequential/test-cpu-prof-invalid-options.js#block_01_cpu_prof_dir_without_cpu_prof`: Inspector not available in WASM
- `sequential/test-cpu-prof-kill.js`: newly discovered, not yet evaluated
- `sequential/test-cpu-prof-name.js`: newly discovered, not yet evaluated
- `sequential/test-cpu-prof-worker-argv.js`: newly discovered, not yet evaluated
- `sequential/test-debug-prompt.js`: newly discovered, not yet evaluated
- `sequential/test-debugger-custom-port.js`: newly discovered, not yet evaluated
- `sequential/test-debugger-debug-brk.js`: newly discovered, not yet evaluated
- `sequential/test-debugger-invalid-args.js`: newly discovered, not yet evaluated
- `sequential/test-debugger-pid.js`: newly discovered, not yet evaluated
- `sequential/test-dgram-bind-shared-ports.js`: newly discovered, not yet evaluated
- `sequential/test-dgram-pingpong.js`: newly discovered, not yet evaluated
- `sequential/test-diagnostic-dir-cpu-prof.js`: newly discovered, not yet evaluated
- `sequential/test-diagnostic-dir-cpu-prof.js#block_00_block_00`: Inspector not available in WASM
- `sequential/test-diagnostic-dir-cpu-prof.js#block_01_block_01`: Inspector not available in WASM
- `sequential/test-diagnostic-dir-heap-prof.js`: newly discovered, not yet evaluated
- `sequential/test-diagnostic-dir-heap-prof.js#block_00_test_diagnostic_dir_changes_the_default_for_cpu_prof`: Inspector not available in WASM
- `sequential/test-diagnostic-dir-heap-prof.js#block_01_test_heap_prof_dir_overwrites_diagnostic_dir`: Inspector not available in WASM
- `sequential/test-fs-opendir-recursive.js`: newly discovered, not yet evaluated
- `sequential/test-fs-stat-sync-overflow.js`: newly discovered, not yet evaluated
- `sequential/test-fs-watch.js`: newly discovered, not yet evaluated
- `sequential/test-gc-http-client-onerror.js`: newly discovered, not yet evaluated
- `sequential/test-gc-http-client-timeout.js`: newly discovered, not yet evaluated
- `sequential/test-gc-http-client.js`: newly discovered, not yet evaluated
- `sequential/test-heapdump-flag-custom-dir.js`: newly discovered, not yet evaluated
- `sequential/test-heapdump-flag.js`: newly discovered, not yet evaluated
- `sequential/test-heapdump.js`: newly discovered, not yet evaluated
- `sequential/test-http-econnrefused.js`: requires HTTP server functionality
- `sequential/test-http-keep-alive-large-write.js`: requires HTTP server functionality
- `sequential/test-http-keepalive-maxsockets.js`: requires HTTP server functionality
- `sequential/test-http-regr-gh-2928.js`: requires HTTP server functionality
- `sequential/test-http-server-keep-alive-timeout-slow-client-headers.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `sequential/test-http-server-keep-alive-timeout-slow-server.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `sequential/test-http-server-request-timeouts-mixed.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `sequential/test-http2-large-file.js`: [manual] http2/https not implemented
- `sequential/test-http2-max-session-memory.js`: [manual] http2/https not implemented
- `sequential/test-http2-ping-flood.js`: [manual] http2/https not implemented
- `sequential/test-http2-settings-flood.js`: [manual] http2/https not implemented
- `sequential/test-http2-timeout-large-write-file.js`: [manual] http2/https not implemented
- `sequential/test-http2-timeout-large-write.js`: [manual] http2/https not implemented
- `sequential/test-https-connect-localport.js`: [manual] http2/https not implemented
- `sequential/test-init.js`: newly discovered, not yet evaluated
- `sequential/test-module-loading.js`: newly discovered, not yet evaluated
- `sequential/test-net-GH-5504.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `sequential/test-net-listen-shared-ports.js`: requires cluster
- `sequential/test-net-localport.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `sequential/test-net-response-size.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `sequential/test-net-server-bind.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `sequential/test-next-tick-error-spin.js`: newly discovered, not yet evaluated
- `sequential/test-perf-hooks.js`: newly discovered, not yet evaluated
- `sequential/test-pipe.js`: newly discovered, not yet evaluated
- `sequential/test-process-title.js`: newly discovered, not yet evaluated
- `sequential/test-repl-timeout-throw.js`: newly discovered, not yet evaluated
- `sequential/test-resolution-inspect-brk.js`: newly discovered, not yet evaluated
- `sequential/test-single-executable-application-assets-raw.js`: newly discovered, not yet evaluated
- `sequential/test-single-executable-application-assets.js`: newly discovered, not yet evaluated
- `sequential/test-single-executable-application-disable-experimental-sea-warning.js`: newly discovered, not yet evaluated
- `sequential/test-single-executable-application-empty.js`: newly discovered, not yet evaluated
- `sequential/test-single-executable-application-snapshot-and-code-cache.js`: newly discovered, not yet evaluated
- `sequential/test-single-executable-application-snapshot-worker.js`: newly discovered, not yet evaluated
- `sequential/test-single-executable-application-snapshot.js`: newly discovered, not yet evaluated
- `sequential/test-single-executable-application-use-code-cache.js`: newly discovered, not yet evaluated
- `sequential/test-single-executable-application.js`: newly discovered, not yet evaluated
- `sequential/test-stream2-stderr-sync.js`: newly discovered, not yet evaluated
- `sequential/test-tls-connect.js`: newly discovered, not yet evaluated
- `sequential/test-tls-lookup.js`: newly discovered, not yet evaluated
- `sequential/test-tls-psk-client.js`: newly discovered, not yet evaluated
- `sequential/test-tls-securepair-client.js`: newly discovered, not yet evaluated
- `sequential/test-tls-session-timeout.js`: newly discovered, not yet evaluated
- `sequential/test-util-debug.js`: newly discovered, not yet evaluated
- `sequential/test-vm-timeout-escape-promise-module-2.js`: newly discovered, not yet evaluated
- `sequential/test-vm-timeout-rethrow.js`: newly discovered, not yet evaluated
- `sequential/test-worker-eventlooputil.js`: newly discovered, not yet evaluated
- `sequential/test-worker-prof.js`: newly discovered, not yet evaluated

</details>

## Split Test Summary

| File | Subtests | Pass | Fail | Error | Skip |
|------|----------|------|------|-------|------|
| test-esm-loader-modulemap.js | 5 | 0 | 5 | 0 | 0 |
| test-require-module-conditional-exports.js | 3 | 0 | 3 | 0 | 0 |
| test-require-module-cycle-esm-cjs-esm-esm.js | 3 | 0 | 3 | 0 | 0 |
| test-require-module-cycle-esm-cjs-esm.js | 4 | 0 | 4 | 0 | 0 |
| test-require-module-cycle-esm-esm-cjs-esm-esm.js | 4 | 0 | 4 | 0 | 0 |
| test-require-module-cycle-esm-esm-cjs-esm.js | 4 | 0 | 2 | 2 | 0 |
| test-require-module-defined-esmodule.js | 2 | 2 | 0 | 0 | 0 |
| test-require-module-tla.js | 2 | 0 | 2 | 0 | 0 |
| test-require-module-with-detection.js | 2 | 0 | 2 | 0 | 0 |
| test-require-module.js | 6 | 4 | 2 | 0 | 0 |
| test-abortcontroller.js | 19 | 17 | 2 | 0 | 0 |
| test-aborted-util.js | 5 | 0 | 5 | 0 | 0 |
| test-abortsignal-cloneable.js | 3 | 0 | 3 | 0 | 0 |
| test-accessor-properties.js | 2 | 0 | 2 | 0 | 0 |
| test-assert-async.js | 5 | 5 | 0 | 0 | 0 |
| test-assert-calltracker-calls.js | 6 | 6 | 0 | 0 | 0 |
| test-assert-calltracker-getCalls.js | 2 | 2 | 0 | 0 | 0 |
| test-assert-deep-with-error.js | 2 | 0 | 2 | 0 | 0 |
| test-assert-deep.js | 39 | 36 | 3 | 0 | 0 |
| test-assert-fail-deprecation.js | 5 | 5 | 0 | 0 | 0 |
| test-assert-fail.js | 4 | 4 | 0 | 0 | 0 |
| test-assert-if-error.js | 4 | 3 | 1 | 0 | 0 |
| test-assert-typedarray-deepequal.js | 3 | 3 | 0 | 0 | 0 |
| test-assert.js | 18 | 16 | 2 | 0 | 0 |
| test-blob.js | 22 | 0 | 22 | 0 | 0 |
| test-blocklist.js | 17 | 4 | 13 | 0 | 0 |
| test-broadcastchannel-custom-inspect.js | 4 | 0 | 4 | 0 | 0 |
| test-buffer-alloc.js | 53 | 53 | 0 | 0 | 0 |
| test-buffer-arraybuffer.js | 4 | 4 | 0 | 0 | 0 |
| test-buffer-badhex.js | 4 | 4 | 0 | 0 | 0 |
| test-buffer-copy.js | 14 | 14 | 0 | 0 | 0 |
| test-buffer-fill.js | 4 | 4 | 0 | 0 | 0 |
| test-buffer-from.js | 3 | 3 | 0 | 0 | 0 |
| test-buffer-indexof.js | 7 | 0 | 0 | 7 | 0 |
| test-buffer-prototype-inspect.js | 3 | 3 | 0 | 0 | 0 |
| test-buffer-readint.js | 5 | 5 | 0 | 0 | 0 |
| test-buffer-readuint.js | 5 | 5 | 0 | 0 | 0 |
| test-buffer-slice.js | 5 | 5 | 0 | 0 | 0 |
| test-buffer-swap.js | 9 | 9 | 0 | 0 | 0 |
| test-buffer-tojson.js | 3 | 3 | 0 | 0 | 0 |
| test-buffer-write.js | 2 | 2 | 0 | 0 | 0 |
| test-buffer-writeint.js | 5 | 5 | 0 | 0 | 0 |
| test-buffer-writeuint.js | 6 | 6 | 0 | 0 | 0 |
| test-child-process-bad-stdio.js | 3 | 0 | 3 | 0 | 0 |
| test-child-process-constructor.js | 4 | 0 | 4 | 0 | 0 |
| test-child-process-cwd.js | 2 | 0 | 2 | 0 | 0 |
| test-child-process-exec-abortcontroller-promisified.js | 8 | 0 | 8 | 0 | 0 |
| test-child-process-exec-maxbuf.js | 11 | 9 | 2 | 0 | 0 |
| test-child-process-execFile-promisified-abortController.js | 4 | 0 | 4 | 0 | 0 |
| test-child-process-execfile-maxbuf.js | 8 | 6 | 2 | 0 | 0 |
| test-child-process-execfile.js | 8 | 5 | 3 | 0 | 0 |
| test-child-process-execfilesync-maxbuf.js | 3 | 1 | 2 | 0 | 0 |
| test-child-process-execsync-maxbuf.js | 4 | 0 | 4 | 0 | 0 |
| test-child-process-fork-abort-signal.js | 6 | 0 | 0 | 6 | 0 |
| test-child-process-fork-args.js | 3 | 0 | 3 | 0 | 0 |
| test-child-process-fork-timeout-kill-signal.js | 4 | 0 | 0 | 4 | 0 |
| test-child-process-promisified.js | 6 | 0 | 6 | 0 | 0 |
| test-child-process-send-returns-boolean.js | 2 | 0 | 1 | 1 | 0 |
| test-child-process-spawn-controller.js | 9 | 0 | 9 | 0 | 0 |
| test-child-process-spawn-timeout-kill-signal.js | 4 | 0 | 4 | 0 | 0 |
| test-child-process-spawnsync-maxbuf.js | 4 | 2 | 2 | 0 | 0 |
| test-child-process-spawnsync-validation-errors.js | 9 | 0 | 9 | 0 | 0 |
| test-child-process-spawnsync.js | 2 | 0 | 2 | 0 | 0 |
| test-child-process-stdio.js | 4 | 0 | 4 | 0 | 0 |
| test-child-process-validate-stdio.js | 3 | 0 | 3 | 0 | 0 |
| test-child-process-windows-hide.js | 3 | 0 | 3 | 0 | 0 |
| test-cli-eval.js | 5 | 5 | 0 | 0 | 0 |
| test-cli-permission-deny-fs.js | 8 | 0 | 8 | 0 | 0 |
| test-cli-permission-multiple-allow.js | 3 | 0 | 3 | 0 | 0 |
| test-common-gc.js | 2 | 1 | 1 | 0 | 0 |
| test-common.js | 4 | 0 | 4 | 0 | 0 |
| test-compression-decompression-stream.js | 2 | 0 | 2 | 0 | 0 |
| test-console-group.js | 8 | 8 | 0 | 0 | 0 |
| test-console-instance.js | 4 | 4 | 0 | 0 | 0 |
| test-crypto-authenticated.js | 20 | 20 | 0 | 0 | 0 |
| test-crypto-certificate.js | 3 | 3 | 0 | 0 | 0 |
| test-crypto-cipheriv-decipheriv.js | 4 | 4 | 0 | 0 | 0 |
| test-crypto-dh-constructor.js | 3 | 3 | 0 | 0 | 0 |
| test-crypto-dh-modp2.js | 3 | 1 | 2 | 0 | 0 |
| test-crypto-dh.js | 3 | 3 | 0 | 0 | 0 |
| test-crypto-ecb.js | 2 | 2 | 0 | 0 | 0 |
| test-crypto-encoding-validation-error.js | 4 | 4 | 0 | 0 | 0 |
| test-crypto-gcm-explicit-short-tag.js | 3 | 3 | 0 | 0 | 0 |
| test-crypto-hash.js | 5 | 5 | 0 | 0 | 0 |
| test-crypto-hmac.js | 7 | 7 | 0 | 0 | 0 |
| test-crypto-key-objects-to-crypto-key.js | 6 | 6 | 0 | 0 | 0 |
| test-crypto-key-objects.js | 18 | 17 | 0 | 1 | 0 |
| test-crypto-keygen.js | 11 | 11 | 0 | 0 | 0 |
| test-crypto-prime.js | 10 | 9 | 1 | 0 | 0 |
| test-crypto-random.js | 22 | 22 | 0 | 0 | 0 |
| test-crypto-rsa-dsa.js | 7 | 7 | 0 | 0 | 0 |
| test-crypto-scrypt.js | 4 | 0 | 0 | 0 | 4 |
| test-crypto-secret-keygen.js | 3 | 3 | 0 | 0 | 0 |
| test-crypto-sign-verify.js | 19 | 11 | 7 | 0 | 1 |
| test-crypto-x509.js | 3 | 0 | 3 | 0 | 0 |
| test-dgram-address.js | 2 | 1 | 1 | 0 | 0 |
| test-dgram-bind-fd-error.js | 2 | 0 | 2 | 0 | 0 |
| test-dgram-blocklist.js | 3 | 0 | 3 | 0 | 0 |
| test-dgram-close-signal.js | 3 | 0 | 3 | 0 | 0 |
| test-dgram-create-socket-handle-fd.js | 3 | 0 | 3 | 0 | 0 |
| test-dgram-create-socket-handle.js | 3 | 0 | 3 | 0 | 0 |
| test-dgram-createSocket-type.js | 2 | 1 | 1 | 0 | 0 |
| test-dgram-custom-lookup.js | 3 | 0 | 3 | 0 | 0 |
| test-dgram-membership.js | 12 | 0 | 12 | 0 | 0 |
| test-dgram-multicast-loopback.js | 2 | 0 | 2 | 0 | 0 |
| test-dgram-multicast-set-interface.js | 8 | 3 | 5 | 0 | 0 |
| test-dgram-setBroadcast.js | 2 | 0 | 2 | 0 | 0 |
| test-dgram-socket-buffer-size.js | 6 | 0 | 6 | 0 | 0 |
| test-dgram-unref.js | 2 | 2 | 0 | 0 | 0 |
| test-diagnostics-channel-tracing-channel-has-subscribers.js | 2 | 2 | 0 | 0 | 0 |
| test-dns-lookup.js | 3 | 0 | 3 | 0 | 0 |
| test-dns-setlocaladdress.js | 2 | 1 | 1 | 0 | 0 |
| test-dns-setservers-type-check.js | 3 | 0 | 3 | 0 | 0 |
| test-dns.js | 12 | 0 | 12 | 0 | 0 |
| test-domain-intercept.js | 3 | 3 | 0 | 0 | 0 |
| test-domain-promise.js | 10 | 3 | 7 | 0 | 0 |
| test-domexception-cause.js | 4 | 1 | 3 | 0 | 0 |
| test-error-aggregateTwoErrors.js | 6 | 2 | 4 | 0 | 0 |
| test-errors-aborterror.js | 3 | 1 | 2 | 0 | 0 |
| test-errors-hide-stack-frames.js | 11 | 0 | 11 | 0 | 0 |
| test-errors-systemerror.js | 15 | 0 | 15 | 0 | 0 |
| test-event-emitter-add-listeners.js | 3 | 3 | 0 | 0 | 0 |
| test-event-emitter-check-listener-leaks.js | 3 | 3 | 0 | 0 | 0 |
| test-event-emitter-listeners.js | 10 | 10 | 0 | 0 | 0 |
| test-event-emitter-remove-all-listeners.js | 7 | 7 | 0 | 0 | 0 |
| test-event-emitter-remove-listeners.js | 10 | 10 | 0 | 0 | 0 |
| test-events-customevent.js | 26 | 0 | 26 | 0 | 0 |
| test-events-getmaxlisteners.js | 2 | 2 | 0 | 0 | 0 |
| test-events-static-geteventlisteners.js | 4 | 0 | 4 | 0 | 0 |
| test-eventtarget-memoryleakwarning.js | 8 | 0 | 8 | 0 | 0 |
| test-eventtarget.js | 61 | 0 | 61 | 0 | 0 |
| test-file.js | 16 | 9 | 7 | 0 | 0 |
| test-fixed-queue.js | 3 | 0 | 3 | 0 | 0 |
| test-freeze-intrinsics.js | 4 | 0 | 4 | 0 | 0 |
| test-fs-access.js | 3 | 0 | 0 | 0 | 3 |
| test-fs-append-file-flush.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-append-file.js | 8 | 8 | 0 | 0 | 0 |
| test-fs-copyfile-respect-permissions.js | 3 | 0 | 0 | 0 | 3 |
| test-fs-error-messages.js | 31 | 31 | 0 | 0 | 0 |
| test-fs-mkdir-recursive-eaccess.js | 2 | 0 | 0 | 0 | 2 |
| test-fs-mkdir.js | 21 | 21 | 0 | 0 | 0 |
| test-fs-mkdtemp.js | 4 | 4 | 0 | 0 | 0 |
| test-fs-opendir.js | 5 | 5 | 0 | 0 | 0 |
| test-fs-options-immutable.js | 6 | 6 | 0 | 0 | 0 |
| test-fs-promises.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-promisified.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-read-stream-double-close.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-read-stream-inherit.js | 11 | 11 | 0 | 0 | 0 |
| test-fs-read-stream.js | 10 | 10 | 0 | 0 | 0 |
| test-fs-readfile-flags.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-readfile.js | 4 | 0 | 0 | 4 | 0 |
| test-fs-readv-sync.js | 4 | 4 | 0 | 0 | 0 |
| test-fs-readv.js | 4 | 4 | 0 | 0 | 0 |
| test-fs-rm.js | 4 | 0 | 4 | 0 | 0 |
| test-fs-rmdir-recursive-throws-not-found.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-rmdir-recursive-throws-on-file.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-rmdir-recursive.js | 4 | 2 | 2 | 0 | 0 |
| test-fs-stat-bigint.js | 9 | 0 | 9 | 0 | 0 |
| test-fs-stat.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-statfs.js | 2 | 0 | 2 | 0 | 0 |
| test-fs-stream-construct-compat-graceful-fs.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-stream-construct-compat-old-node.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-stream-destroy-emit-error.js | 4 | 4 | 0 | 0 | 0 |
| test-fs-stream-fs-options.js | 3 | 0 | 3 | 0 | 0 |
| test-fs-stream-options.js | 2 | 0 | 2 | 0 | 0 |
| test-fs-truncate-clear-file-zero.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-truncate.js | 10 | 0 | 10 | 0 | 0 |
| test-fs-util-validateoffsetlength.js | 5 | 0 | 5 | 0 | 0 |
| test-fs-utils-get-dirents.js | 9 | 0 | 9 | 0 | 0 |
| test-fs-utimes.js | 2 | 0 | 2 | 0 | 0 |
| test-fs-watch-abort-signal.js | 2 | 0 | 2 | 0 | 0 |
| test-fs-watch-encoding.js | 3 | 0 | 0 | 3 | 0 |
| test-fs-watch-enoent.js | 2 | 1 | 1 | 0 | 0 |
| test-fs-write-buffer.js | 8 | 8 | 0 | 0 | 0 |
| test-fs-write-file-flush.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-write-file-sync.js | 6 | 0 | 6 | 0 | 0 |
| test-fs-write-file.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-write-stream-double-close.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-write-stream-end.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-write-stream-flush.js | 4 | 4 | 0 | 0 | 0 |
| test-fs-write-stream-fs.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-write-stream.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-write.js | 5 | 0 | 5 | 0 | 0 |
| test-fs-writefile-with-fd.js | 4 | 0 | 4 | 0 | 0 |
| test-fs-writev-sync.js | 4 | 4 | 0 | 0 | 0 |
| test-fs-writev.js | 4 | 4 | 0 | 0 | 0 |
| test-handle-wrap-hasref.js | 6 | 0 | 6 | 0 | 0 |
| test-heap-prof-invalid-args.js | 3 | 0 | 0 | 0 | 3 |
| test-http-1.0.js | 3 | 0 | 3 | 0 | 0 |
| test-http-aborted.js | 2 | 0 | 2 | 0 | 0 |
| test-http-agent-timeout.js | 4 | 0 | 4 | 0 | 0 |
| test-http-chunk-extensions-limit.js | 3 | 0 | 3 | 0 | 0 |
| test-http-client-abort-destroy.js | 6 | 0 | 6 | 0 | 0 |
| test-http-client-abort3.js | 2 | 2 | 0 | 0 | 0 |
| test-http-client-aborted-event.js | 2 | 0 | 2 | 0 | 0 |
| test-http-client-defaults.js | 3 | 3 | 0 | 0 | 0 |
| test-http-client-res-destroyed.js | 2 | 0 | 2 | 0 | 0 |
| test-http-dummy-characters-smuggling.js | 2 | 0 | 2 | 0 | 0 |
| test-http-early-hints.js | 6 | 0 | 6 | 0 | 0 |
| test-http-generic-streams.js | 5 | 0 | 5 | 0 | 0 |
| test-http-head-throw-on-response-body-write.js | 3 | 0 | 3 | 0 | 0 |
| test-http-insecure-parser-per-stream.js | 5 | 3 | 2 | 0 | 0 |
| test-http-max-header-size-per-stream.js | 4 | 2 | 2 | 0 | 0 |
| test-http-missing-header-separator-cr.js | 3 | 0 | 3 | 0 | 0 |
| test-http-missing-header-separator-lf.js | 3 | 0 | 3 | 0 | 0 |
| test-http-outgoing-destroyed.js | 3 | 0 | 3 | 0 | 0 |
| test-http-outgoing-internal-headernames-getter.js | 2 | 2 | 0 | 0 | 0 |
| test-http-outgoing-internal-headers.js | 3 | 3 | 0 | 0 | 0 |
| test-http-outgoing-message-capture-rejection.js | 2 | 0 | 2 | 0 | 0 |
| test-http-outgoing-properties.js | 5 | 3 | 2 | 0 | 0 |
| test-http-outgoing-proto.js | 2 | 2 | 0 | 0 | 0 |
| test-http-outgoing-renderHeaders.js | 4 | 4 | 0 | 0 | 0 |
| test-http-outgoing-settimeout.js | 2 | 2 | 0 | 0 | 0 |
| test-http-parser.js | 12 | 12 | 0 | 0 | 0 |
| test-http-req-res-close.js | 3 | 0 | 3 | 0 | 0 |
| test-http-request-host-header.js | 2 | 0 | 2 | 0 | 0 |
| test-http-request-join-authorization-headers.js | 3 | 0 | 3 | 0 | 0 |
| test-http-response-close.js | 3 | 0 | 3 | 0 | 0 |
| test-http-response-multi-content-length.js | 2 | 0 | 2 | 0 | 0 |
| test-http-response-setheaders.js | 7 | 0 | 7 | 0 | 0 |
| test-http-server-capture-rejections.js | 3 | 0 | 3 | 0 | 0 |
| test-http-server-connection-list-when-close.js | 2 | 0 | 2 | 0 | 0 |
| test-http-server-non-utf8-header.js | 3 | 0 | 3 | 0 | 0 |
| test-http-server-options-highwatermark.js | 2 | 0 | 2 | 0 | 0 |
| test-http-server-timeouts-validation.js | 7 | 7 | 0 | 0 | 0 |
| test-http-transfer-encoding-smuggling.js | 2 | 0 | 2 | 0 | 0 |
| test-http-write-head-2.js | 4 | 0 | 4 | 0 | 0 |
| test-http2-alpn.js | 2 | 0 | 2 | 0 | 0 |
| test-http2-capture-rejection.js | 4 | 0 | 4 | 0 | 0 |
| test-http2-client-destroy.js | 9 | 0 | 9 | 0 | 0 |
| test-http2-client-setLocalWindowSize.js | 3 | 0 | 3 | 0 | 0 |
| test-http2-compat-expect-continue.js | 2 | 0 | 2 | 0 | 0 |
| test-http2-compat-serverrequest-headers.js | 2 | 0 | 2 | 0 | 0 |
| test-http2-compat-serverresponse-end.js | 10 | 0 | 10 | 0 | 0 |
| test-http2-compat-serverresponse-write.js | 3 | 0 | 3 | 0 | 0 |
| test-http2-compat-serverresponse-writehead-array.js | 3 | 0 | 3 | 0 | 0 |
| test-http2-compat-write-early-hints.js | 3 | 0 | 3 | 0 | 0 |
| test-http2-connect.js | 7 | 0 | 7 | 0 | 0 |
| test-http2-create-client-connect.js | 2 | 0 | 2 | 0 | 0 |
| test-http2-getpackedsettings.js | 11 | 0 | 11 | 0 | 0 |
| test-http2-https-fallback.js | 2 | 0 | 2 | 0 | 0 |
| test-http2-invalidheaderfield.js | 4 | 0 | 4 | 0 | 0 |
| test-http2-origin.js | 4 | 0 | 4 | 0 | 0 |
| test-http2-perform-server-handshake.js | 2 | 0 | 2 | 0 | 0 |
| test-http2-server-errors.js | 2 | 0 | 2 | 0 | 0 |
| test-http2-server-settimeout-no-callback.js | 2 | 0 | 2 | 0 | 0 |
| test-http2-server-startup.js | 4 | 0 | 4 | 0 | 0 |
| test-http2-too-many-settings.js | 2 | 0 | 2 | 0 | 0 |
| test-http2-util-headers-list.js | 9 | 0 | 9 | 0 | 0 |
| test-http2-util-update-options-buffer.js | 2 | 0 | 2 | 0 | 0 |
| test-https-agent-create-connection.js | 7 | 0 | 7 | 0 | 0 |
| test-https-argument-of-creating.js | 4 | 0 | 4 | 0 | 0 |
| test-https-insecure-parse-per-stream.js | 5 | 3 | 2 | 0 | 0 |
| test-https-max-header-size-per-stream.js | 4 | 2 | 2 | 0 | 0 |
| test-icu-data-dir.js | 2 | 0 | 2 | 0 | 0 |
| test-icu-transcode.js | 5 | 0 | 0 | 0 | 5 |
| test-internal-error-original-names.js | 3 | 0 | 3 | 0 | 0 |
| test-internal-errors.js | 8 | 0 | 8 | 0 | 0 |
| test-internal-fs-syncwritestream.js | 8 | 0 | 8 | 0 | 0 |
| test-internal-fs.js | 2 | 0 | 2 | 0 | 0 |
| test-internal-socket-list-receive.js | 4 | 0 | 4 | 0 | 0 |
| test-internal-socket-list-send.js | 6 | 0 | 6 | 0 | 0 |
| test-internal-util-objects.js | 2 | 1 | 1 | 0 | 0 |
| test-internal-validators-validateoneof.js | 6 | 0 | 6 | 0 | 0 |
| test-module-create-require-multibyte.js | 2 | 2 | 0 | 0 | 0 |
| test-module-multi-extensions.js | 7 | 7 | 0 | 0 | 0 |
| test-module-setsourcemapssupport.js | 2 | 2 | 0 | 0 | 0 |
| test-module-strip-types.js | 9 | 0 | 0 | 0 | 9 |
| test-net-allow-half-open.js | 2 | 0 | 2 | 0 | 0 |
| test-net-autoselectfamily-default.js | 2 | 0 | 2 | 0 | 0 |
| test-net-autoselectfamily.js | 4 | 1 | 3 | 0 | 0 |
| test-net-better-error-messages-path.js | 2 | 2 | 0 | 0 | 0 |
| test-net-blocklist.js | 4 | 4 | 0 | 0 | 0 |
| test-net-bytes-written-large.js | 3 | 0 | 3 | 0 | 0 |
| test-net-connect-options-port.js | 4 | 0 | 4 | 0 | 0 |
| test-net-normalize-args.js | 2 | 0 | 2 | 0 | 0 |
| test-net-perf_hooks.js | 2 | 0 | 2 | 0 | 0 |
| test-net-server-call-listen-multiple-times.js | 3 | 0 | 3 | 0 | 0 |
| test-net-server-listen-handle.js | 2 | 0 | 2 | 0 | 0 |
| test-net-server-listen-options-signal.js | 3 | 0 | 3 | 0 | 0 |
| test-net-server-listen-options.js | 3 | 0 | 3 | 0 | 0 |
| test-net-server-listen-path.js | 6 | 0 | 6 | 0 | 0 |
| test-net-socket-write-after-close.js | 2 | 0 | 2 | 0 | 0 |
| test-nodeeventtarget.js | 7 | 0 | 7 | 0 | 0 |
| test-perf-hooks-histogram.js | 6 | 0 | 6 | 0 | 0 |
| test-perf-hooks-resourcetiming.js | 5 | 0 | 5 | 0 | 0 |
| test-perf-hooks-usertiming.js | 3 | 0 | 3 | 0 | 0 |
| test-performance-function.js | 6 | 0 | 6 | 0 | 0 |
| test-performance-gc.js | 2 | 1 | 1 | 0 | 0 |
| test-performanceobserver.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-allow-child-process-cli.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-allow-wasi-cli.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-allow-worker-cli.js | 2 | 1 | 1 | 0 | 0 |
| test-permission-child-process-cli.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-fs-read.js | 3 | 2 | 1 | 0 | 0 |
| test-permission-fs-require.js | 4 | 2 | 2 | 0 | 0 |
| test-permission-fs-symlink-target-write.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-fs-symlink.js | 4 | 0 | 0 | 0 | 4 |
| test-permission-fs-traversal-path.js | 3 | 0 | 0 | 0 | 3 |
| test-permission-fs-wildcard.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-fs-windows-path.js | 4 | 0 | 0 | 0 | 4 |
| test-permission-fs-write-report.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-fs-write-v8.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-has.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-inspector-brk.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-inspector.js | 2 | 0 | 0 | 0 | 2 |
| test-primordials-apply.js | 6 | 0 | 6 | 0 | 0 |
| test-primordials-promise.js | 2 | 0 | 2 | 0 | 0 |
| test-primordials-regexp.js | 11 | 0 | 11 | 0 | 0 |
| test-priority-queue.js | 6 | 0 | 6 | 0 | 0 |
| test-process-env-allowed-flags.js | 3 | 1 | 2 | 0 | 0 |
| test-process-env-windows-error-reset.js | 2 | 2 | 0 | 0 | 0 |
| test-process-env.js | 4 | 3 | 1 | 0 | 0 |
| test-process-getactiveresources-track-timer-lifetime.js | 2 | 0 | 2 | 0 | 0 |
| test-process-uncaught-exception-monitor.js | 2 | 0 | 0 | 2 | 0 |
| test-querystring.js | 11 | 11 | 0 | 0 | 0 |
| test-queue-microtask.js | 2 | 0 | 2 | 0 | 0 |
| test-readline-emit-keypress-events.js | 3 | 0 | 3 | 0 | 0 |
| test-readline-interface.js | 42 | 0 | 42 | 0 | 0 |
| test-readline-promises-interface.js | 33 | 0 | 33 | 0 | 0 |
| test-readline-tab-complete.js | 2 | 0 | 2 | 0 | 0 |
| test-readline.js | 6 | 0 | 6 | 0 | 0 |
| test-release-changelog.js | 2 | 0 | 2 | 0 | 0 |
| test-repl-context.js | 2 | 0 | 2 | 0 | 0 |
| test-repl-require.js | 2 | 0 | 2 | 0 | 0 |
| test-repl-tab-complete-import.js | 3 | 0 | 3 | 0 | 0 |
| test-repl-tab-complete.js | 5 | 0 | 5 | 0 | 0 |
| test-require-cache.js | 2 | 1 | 1 | 0 | 0 |
| test-require-node-prefix.js | 2 | 0 | 2 | 0 | 0 |
| test-require-resolve-opts-paths-relative.js | 3 | 0 | 3 | 0 | 0 |
| test-require-resolve.js | 2 | 0 | 2 | 0 | 0 |
| test-runner-assert.js | 2 | 2 | 0 | 0 | 0 |
| test-runner-cli-concurrency.js | 5 | 0 | 5 | 0 | 0 |
| test-runner-cli-timeout.js | 3 | 0 | 3 | 0 | 0 |
| test-runner-cli.js | 11 | 0 | 11 | 0 | 0 |
| test-runner-concurrency.js | 4 | 0 | 4 | 0 | 0 |
| test-runner-coverage.js | 12 | 12 | 0 | 0 | 0 |
| test-runner-custom-assertions.js | 5 | 4 | 1 | 0 | 0 |
| test-runner-error-reporter.js | 2 | 0 | 2 | 0 | 0 |
| test-runner-extraneous-async-activity.js | 4 | 0 | 4 | 0 | 0 |
| test-runner-force-exit-flush.js | 3 | 0 | 3 | 0 | 0 |
| test-runner-mocking.js | 43 | 34 | 9 | 0 | 0 |
| test-runner-module-mocking.js | 19 | 0 | 19 | 0 | 0 |
| test-runner-no-isolation-filtering.js | 3 | 0 | 3 | 0 | 0 |
| test-runner-snapshot-file-tests.js | 2 | 0 | 2 | 0 | 0 |
| test-runner-snapshot-tests.js | 6 | 0 | 6 | 0 | 0 |
| test-runner-test-filepath.js | 2 | 2 | 0 | 0 | 0 |
| test-runner-test-fullname.js | 2 | 2 | 0 | 0 | 0 |
| test-runner-wait-for.js | 7 | 6 | 0 | 1 | 0 |
| test-set-http-max-http-headers.js | 3 | 0 | 3 | 0 | 0 |
| test-set-incoming-message-header.js | 3 | 2 | 1 | 0 | 0 |
| test-shadow-realm-prepare-stack-trace.js | 2 | 0 | 2 | 0 | 0 |
| test-single-executable-blob-config-errors.js | 11 | 0 | 11 | 0 | 0 |
| test-single-executable-blob-config.js | 5 | 0 | 5 | 0 | 0 |
| test-snapshot-api.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-argv1.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-basic.js | 4 | 0 | 4 | 0 | 0 |
| test-snapshot-child-process-sync.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-cjs-main.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-config.js | 4 | 0 | 4 | 0 | 0 |
| test-snapshot-console.js | 2 | 0 | 0 | 0 | 2 |
| test-snapshot-coverage.js | 2 | 0 | 0 | 0 | 2 |
| test-snapshot-cwd.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-dns-lookup-localhost-promise.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-dns-lookup-localhost.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-dns-resolve-localhost-promise.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-dns-resolve-localhost.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-error.js | 3 | 0 | 3 | 0 | 0 |
| test-snapshot-eval.js | 3 | 0 | 3 | 0 | 0 |
| test-snapshot-gzip.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-incompatible.js | 3 | 0 | 3 | 0 | 0 |
| test-snapshot-net.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-stack-trace-limit.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-typescript.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-umd.js | 2 | 0 | 2 | 0 | 0 |
| test-snapshot-warning.js | 3 | 0 | 3 | 0 | 0 |
| test-source-map-api.js | 9 | 0 | 9 | 0 | 0 |
| test-source-map-enable.js | 23 | 23 | 0 | 0 | 0 |
| test-sqlite-database-sync.js | 5 | 5 | 0 | 0 | 0 |
| test-sqlite-session.js | 14 | 13 | 1 | 0 | 0 |
| test-sqlite-statement-sync.js | 9 | 8 | 1 | 0 | 0 |
| test-sqlite.js | 6 | 5 | 1 | 0 | 0 |
| test-startup-empty-regexp-statics.js | 3 | 0 | 3 | 0 | 0 |
| test-startup-large-pages.js | 2 | 0 | 2 | 0 | 0 |
| test-stream-add-abort-signal.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-auto-destroy.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-catch-rejections.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-compose-operator.js | 8 | 8 | 0 | 0 | 0 |
| test-stream-compose.js | 22 | 21 | 1 | 0 | 0 |
| test-stream-construct.js | 12 | 12 | 0 | 0 | 0 |
| test-stream-consumers.js | 16 | 16 | 0 | 0 | 0 |
| test-stream-destroy.js | 6 | 2 | 4 | 0 | 0 |
| test-stream-drop-take.js | 6 | 5 | 1 | 0 | 0 |
| test-stream-duplex-destroy.js | 16 | 15 | 1 | 0 | 0 |
| test-stream-duplex-end.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-duplex-from.js | 23 | 22 | 1 | 0 | 0 |
| test-stream-duplex-props.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-duplex-readable-writable.js | 3 | 2 | 1 | 0 | 0 |
| test-stream-duplex-writable-finished.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-duplex.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-duplexpair.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-error-once.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-event-names.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-filter.js | 12 | 12 | 0 | 0 | 0 |
| test-stream-finished.js | 42 | 34 | 8 | 0 | 0 |
| test-stream-flatMap.js | 8 | 8 | 0 | 0 | 0 |
| test-stream-forEach.js | 11 | 11 | 0 | 0 | 0 |
| test-stream-map.js | 17 | 15 | 2 | 0 | 0 |
| test-stream-objectmode-undefined.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-once-readable-pipe.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-pipe-error-handling.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-pipe-flow.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-pipe-same-destination-twice.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-pipe-unpipe-streams.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-pipeline.js | 80 | 68 | 12 | 0 | 0 |
| test-stream-promises.js | 9 | 9 | 0 | 0 | 0 |
| test-stream-readable-aborted.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-readable-async-iterators.js | 7 | 5 | 2 | 0 | 0 |
| test-stream-readable-default-encoding.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-destroy.js | 23 | 23 | 0 | 0 | 0 |
| test-stream-readable-didRead.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-readable-emit-readable-short-stream.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-readable-ended.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-event.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-readable-no-unneeded-readable.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-readable-object-multi-push-async.js | 5 | 4 | 1 | 0 | 0 |
| test-stream-readable-pause-and-resume.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-readable-readable.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-reading-readingMore.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-resumeScheduled.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-setEncoding-existing-buffers.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-strategy-option.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-unshift.js | 7 | 7 | 0 | 0 | 0 |
| test-stream-reduce.js | 8 | 7 | 1 | 0 | 0 |
| test-stream-toArray.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-transform-destroy.js | 8 | 8 | 0 | 0 | 0 |
| test-stream-transform-split-highwatermark.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-typedarray.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-uint8array.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-unpipe-event.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-wrap-encoding.js | 2 | 0 | 2 | 0 | 0 |
| test-stream-writable-aborted.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-writable-destroy.js | 28 | 27 | 1 | 0 | 0 |
| test-stream-writable-end-cb-error.js | 3 | 0 | 3 | 0 | 0 |
| test-stream-writable-finish-destroyed.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-writable-finished.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-writable-null.js | 4 | 4 | 0 | 0 | 0 |
| test-stream-writable-writable.js | 4 | 4 | 0 | 0 | 0 |
| test-stream-writable-write-cb-error.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-writable-write-cb-twice.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-writable-write-writev-finish.js | 8 | 8 | 0 | 0 | 0 |
| test-stream2-basic.js | 11 | 11 | 0 | 0 | 0 |
| test-stream2-objects.js | 14 | 14 | 0 | 0 | 0 |
| test-stream2-pipe-error-handling.js | 2 | 2 | 0 | 0 | 0 |
| test-stream2-readable-wrap-destroy.js | 2 | 2 | 0 | 0 | 0 |
| test-stream2-readable-wrap-error.js | 2 | 2 | 0 | 0 | 0 |
| test-stream2-set-encoding.js | 9 | 9 | 0 | 0 | 0 |
| test-stream2-transform.js | 17 | 16 | 1 | 0 | 0 |
| test-stream2-writable.js | 24 | 21 | 3 | 0 | 0 |
| test-streams-highwatermark.js | 6 | 4 | 2 | 0 | 0 |
| test-stringbytes-external.js | 3 | 0 | 0 | 3 | 0 |
| test-tick-processor-version-check.js | 2 | 0 | 2 | 0 | 0 |
| test-timers-immediate-promisified.js | 8 | 0 | 8 | 0 | 0 |
| test-timers-interval-promisified.js | 12 | 0 | 12 | 0 | 0 |
| test-timers-max-duration-warning.js | 3 | 0 | 3 | 0 | 0 |
| test-timers-refresh.js | 6 | 0 | 6 | 0 | 0 |
| test-timers-timeout-promisified.js | 8 | 0 | 8 | 0 | 0 |
| test-timers-to-primitive.js | 2 | 2 | 0 | 0 | 0 |
| test-timers-unenroll-unref-interval.js | 5 | 2 | 3 | 0 | 0 |
| test-timers-unref.js | 3 | 3 | 0 | 0 | 0 |
| test-timers-user-call.js | 2 | 0 | 1 | 1 | 0 |
| test-timers-zero-timeout.js | 2 | 1 | 1 | 0 | 0 |
| test-tls-basic-validations.js | 3 | 0 | 3 | 0 | 0 |
| test-tls-connect-allow-half-open-option.js | 2 | 0 | 2 | 0 | 0 |
| test-tls-external-accessor.js | 2 | 0 | 2 | 0 | 0 |
| test-tls-server-parent-constructor-options.js | 2 | 0 | 2 | 0 | 0 |
| test-tls-socket-allow-half-open-option.js | 4 | 0 | 4 | 0 | 0 |
| test-tls-translate-peer-certificate.js | 2 | 0 | 2 | 0 | 0 |
| test-url-fileurltopath.js | 8 | 8 | 0 | 0 | 0 |
| test-url-format-whatwg.js | 5 | 5 | 0 | 0 | 0 |
| test-url-parse-format.js | 2 | 2 | 0 | 0 | 0 |
| test-url-pathtofileurl.js | 5 | 5 | 0 | 0 | 0 |
| test-util-callbackify.js | 9 | 9 | 0 | 0 | 0 |
| test-util-deprecate.js | 3 | 3 | 0 | 0 | 0 |
| test-util-format.js | 5 | 5 | 0 | 0 | 0 |
| test-util-getcallsites.js | 13 | 13 | 0 | 0 | 0 |
| test-util-inspect-getters-accessing-this.js | 2 | 2 | 0 | 0 | 0 |
| test-util-inspect.js | 99 | 98 | 1 | 0 | 0 |
| test-util-isDeepStrictEqual.js | 2 | 2 | 0 | 0 | 0 |
| test-util-promisify.js | 19 | 19 | 0 | 0 | 0 |
| test-util-types.js | 3 | 3 | 0 | 0 | 0 |
| test-uv-unmapped-exception.js | 2 | 0 | 2 | 0 | 0 |
| test-v8-collect-gc-profile-exit-before-stop.js | 2 | 0 | 2 | 0 | 0 |
| test-v8-coverage.js | 9 | 9 | 0 | 0 | 0 |
| test-v8-query-objects.js | 5 | 0 | 5 | 0 | 0 |
| test-v8-serdes.js | 14 | 0 | 14 | 0 | 0 |
| test-validators.js | 7 | 0 | 7 | 0 | 0 |
| test-vm-basic.js | 7 | 0 | 7 | 0 | 0 |
| test-vm-codegen.js | 3 | 0 | 3 | 0 | 0 |
| test-vm-context-dont-contextify.js | 8 | 0 | 8 | 0 | 0 |
| test-vm-measure-memory-lazy.js | 4 | 0 | 4 | 0 | 0 |
| test-vm-module-basic.js | 9 | 0 | 0 | 9 | 0 |
| test-vm-new-script-new-context.js | 8 | 6 | 2 | 0 | 0 |
| test-webcrypto-constructors.js | 19 | 0 | 19 | 0 | 0 |
| test-webcrypto-derivebits.js | 4 | 0 | 4 | 0 | 0 |
| test-webcrypto-derivekey.js | 6 | 0 | 6 | 0 | 0 |
| test-webcrypto-encrypt-decrypt-aes.js | 4 | 0 | 4 | 0 | 0 |
| test-webcrypto-encrypt-decrypt.js | 4 | 0 | 4 | 0 | 0 |
| test-webcrypto-export-import-ec.js | 2 | 0 | 2 | 0 | 0 |
| test-webcrypto-export-import.js | 5 | 0 | 5 | 0 | 0 |
| test-webcrypto-keygen.js | 8 | 0 | 8 | 0 | 0 |
| test-webcrypto-random.js | 4 | 0 | 4 | 0 | 0 |
| test-webcrypto-sign-verify.js | 6 | 3 | 3 | 0 | 0 |
| test-webcrypto-webidl.js | 28 | 0 | 28 | 0 | 0 |
| test-webstorage.js | 8 | 1 | 7 | 0 | 0 |
| test-webstreams-abort-controller.js | 6 | 0 | 6 | 0 | 0 |
| test-webstreams-compose.js | 20 | 3 | 17 | 0 | 0 |
| test-webstreams-finished.js | 20 | 0 | 20 | 0 | 0 |
| test-webstreams-pipeline.js | 17 | 5 | 12 | 0 | 0 |
| test-whatwg-encoding-custom-fatal-streaming.js | 2 | 0 | 0 | 0 | 2 |
| test-whatwg-encoding-custom-interop.js | 4 | 1 | 3 | 0 | 0 |
| test-whatwg-encoding-custom-textdecoder.js | 12 | 0 | 12 | 0 | 0 |
| test-whatwg-events-add-event-listener-options-passive.js | 2 | 0 | 1 | 0 | 1 |
| test-whatwg-events-add-event-listener-options-signal.js | 10 | 7 | 2 | 1 | 0 |
| test-whatwg-events-customevent.js | 3 | 2 | 1 | 0 | 0 |
| test-whatwg-readablebytestream-bad-buffers-and-views.js | 4 | 0 | 4 | 0 | 0 |
| test-whatwg-readablebytestream.js | 11 | 2 | 9 | 0 | 0 |
| test-whatwg-readablestream.js | 82 | 0 | 82 | 0 | 0 |
| test-whatwg-transformstream.js | 7 | 0 | 7 | 0 | 0 |
| test-whatwg-url-custom-searchparams-constructor.js | 2 | 0 | 2 | 0 | 0 |
| test-whatwg-url-custom-searchparams-delete.js | 2 | 0 | 2 | 0 | 0 |
| test-whatwg-url-custom-searchparams-stringifier.js | 2 | 0 | 2 | 0 | 0 |
| test-whatwg-url-custom-setters.js | 2 | 0 | 0 | 0 | 2 |
| test-whatwg-url-properties.js | 2 | 0 | 2 | 0 | 0 |
| test-whatwg-webstreams-adapters-streambase.js | 4 | 0 | 4 | 0 | 0 |
| test-whatwg-webstreams-adapters-to-readablestream.js | 8 | 0 | 8 | 0 | 0 |
| test-whatwg-webstreams-adapters-to-readablewritablepair.js | 12 | 0 | 12 | 0 | 0 |
| test-whatwg-webstreams-adapters-to-streamduplex.js | 9 | 0 | 9 | 0 | 0 |
| test-whatwg-webstreams-adapters-to-streamreadable.js | 9 | 0 | 9 | 0 | 0 |
| test-whatwg-webstreams-adapters-to-streamwritable.js | 9 | 0 | 9 | 0 | 0 |
| test-whatwg-webstreams-adapters-to-writablestream.js | 9 | 0 | 9 | 0 | 0 |
| test-whatwg-webstreams-encoding.js | 2 | 0 | 2 | 0 | 0 |
| test-whatwg-webstreams-transfer.js | 13 | 0 | 13 | 0 | 0 |
| test-whatwg-writablestream.js | 7 | 0 | 7 | 0 | 0 |
| test-worker-broadcastchannel-wpt.js | 6 | 0 | 6 | 0 | 0 |
| test-worker-broadcastchannel.js | 9 | 0 | 9 | 0 | 0 |
| test-worker-eval-typescript.js | 7 | 0 | 0 | 7 | 0 |
| test-worker-execargv-invalid.js | 3 | 0 | 3 | 0 | 0 |
| test-worker-message-channel.js | 3 | 1 | 2 | 0 | 0 |
| test-worker-message-event.js | 3 | 0 | 3 | 0 | 0 |
| test-worker-message-mark-as-uncloneable.js | 4 | 0 | 4 | 0 | 0 |
| test-worker-message-port-close.js | 4 | 1 | 3 | 0 | 0 |
| test-worker-message-port-transfer-duplicate.js | 2 | 0 | 2 | 0 | 0 |
| test-worker-message-port-transfer-native.js | 2 | 0 | 2 | 0 | 0 |
| test-worker-message-port-wasm-threads.js | 2 | 0 | 2 | 0 | 0 |
| test-worker-message-port.js | 9 | 0 | 9 | 0 | 0 |
| test-worker-message-transfer-port-mark-as-untransferable.js | 4 | 0 | 4 | 0 | 0 |
| test-worker-unsupported-path.js | 3 | 0 | 3 | 0 | 0 |
| test-worker-workerdata-messageport.js | 5 | 3 | 2 | 0 | 0 |
| test-wrap-js-stream-destroy.js | 3 | 0 | 3 | 0 | 0 |
| test-wrap-js-stream-duplex.js | 2 | 0 | 2 | 0 | 0 |
| test-x509-escaping.js | 8 | 0 | 8 | 0 | 0 |
| test-zlib-brotli.js | 3 | 3 | 0 | 0 | 0 |
| test-zlib-create-raw.js | 2 | 2 | 0 | 0 | 0 |
| test-zlib-destroy.js | 2 | 1 | 1 | 0 | 0 |
| test-zlib-dictionary-fail.js | 3 | 3 | 0 | 0 | 0 |
| test-zlib-failed-init.js | 2 | 2 | 0 | 0 | 0 |
| test-zlib-zero-windowBits.js | 2 | 2 | 0 | 0 | 0 |
| test-async-wrap-getasyncid.js | 18 | 0 | 18 | 0 | 0 |
| test-child-process-execsync.js | 7 | 0 | 7 | 0 | 0 |
| test-cpu-prof-invalid-options.js | 2 | 0 | 0 | 0 | 2 |
| test-crypto-timing-safe-equal.js | 3 | 3 | 0 | 0 | 0 |
| test-diagnostic-dir-cpu-prof.js | 2 | 0 | 0 | 0 | 2 |
| test-diagnostic-dir-heap-prof.js | 2 | 0 | 0 | 0 | 2 |
| test-error-serdes.js | 2 | 0 | 2 | 0 | 0 |
| test-fs-opendir-recursive.js | 7 | 4 | 3 | 0 | 0 |
| test-fs-readdir-recursive.js | 6 | 6 | 0 | 0 | 0 |
| test-fs-watch.js | 6 | 3 | 1 | 2 | 0 |
| test-heapdump.js | 4 | 0 | 4 | 0 | 0 |
| test-init.js | 3 | 0 | 3 | 0 | 0 |
| test-module-loading.js | 11 | 0 | 11 | 0 | 0 |
| test-net-server-address.js | 5 | 4 | 1 | 0 | 0 |
| test-net-server-bind.js | 5 | 0 | 5 | 0 | 0 |
| test-perf-hooks.js | 2 | 0 | 2 | 0 | 0 |
| test-performance-eventloopdelay.js | 3 | 0 | 3 | 0 | 0 |
| test-single-executable-application-assets.js | 3 | 0 | 3 | 0 | 0 |
| test-single-executable-application-snapshot.js | 2 | 0 | 2 | 0 | 0 |
| test-tls-connect.js | 2 | 0 | 2 | 0 | 0 |

## Tests That Should Not Be Skipped

These tests are marked with `"skip": true` in `config.jsonc` but actually pass.
Consider removing the `skip` flag.

14 test(s) should be unskipped:

- `es-module/test-cjs-prototype-pollution.js`
- `es-module/test-disable-require-module-with-detection.js`
- `es-module/test-require-module-cycle-cjs-esm-esm.js`
- `es-module/test-require-module-dynamic-import-3.js`
- `es-module/test-require-module-dynamic-import-4.js`
- `es-module/test-require-module-implicit.js`
- `es-module/test-require-module-transpiled.js`
- `parallel/test-module-main-extension-lookup.js`
- `es-module/test-require-module.js#block_00_test_named_exports`
- `es-module/test-require-module.js#block_01_test_esm_that_import_esm`
- `es-module/test-require-module.js#block_03_test_esm_that_require_cjs`
- `es-module/test-require-module.js#block_05_test_data_import`
- `parallel/test-permission-fs-require.js#block_02_block_02`
- `parallel/test-webstorage.js#test_00_disabled_without_experimental_webstorage`

## Passing Tests Not in Config

These tests pass but are not listed in `config.jsonc`.
Consider adding them.

_All passing tests are already in config.jsonc._

## All Results by Module (Public + Internals)

| Module | Total | Pass | Fail | Error | Skip | Pass% |
|--------|-------|------|------|-------|------|-------|
| abort | 31 | 17 | 10 | 1 | 3 | 54.8% |
| assert | 105 | 92 | 13 | 0 | 0 | 87.6% |
| async_hooks | 38 | 4 | 11 | 0 | 23 | 10.5% |
| blob | 25 | 2 | 22 | 0 | 1 | 8.0% |
| buffer | 196 | 183 | 3 | 8 | 2 | 93.4% |
| child_process | 232 | 30 | 98 | 13 | 91 | 12.9% |
| cluster | 87 | 0 | 4 | 0 | 83 | 0.0% |
| console | 33 | 32 | 1 | 0 | 0 | 97.0% |
| crypto | 263 | 224 | 21 | 5 | 13 | 85.2% |
| dgram | 132 | 15 | 87 | 0 | 30 | 11.4% |
| diagnostics_channel | 34 | 19 | 4 | 0 | 11 | 55.9% |
| dns | 46 | 3 | 26 | 0 | 17 | 6.5% |
| domain | 63 | 25 | 16 | 0 | 22 | 39.7% |
| events | 101 | 62 | 33 | 0 | 6 | 61.4% |
| fetch | 1 | 1 | 0 | 0 | 0 | 100.0% |
| fs | 538 | 359 | 94 | 14 | 71 | 66.7% |
| http | 960 | 93 | 348 | 0 | 519 | 9.7% |
| inspector | 91 | 0 | 0 | 0 | 91 | 0.0% |
| module | 203 | 81 | 47 | 2 | 73 | 39.9% |
| net | 215 | 44 | 92 | 0 | 79 | 20.5% |
| os | 6 | 6 | 0 | 0 | 0 | 100.0% |
| other | 1471 | 140 | 778 | 4 | 549 | 9.5% |
| path | 16 | 16 | 0 | 0 | 0 | 100.0% |
| perf_hooks | 49 | 3 | 32 | 0 | 14 | 6.1% |
| process | 98 | 40 | 11 | 2 | 45 | 40.8% |
| querystring | 15 | 15 | 0 | 0 | 0 | 100.0% |
| readline | 106 | 0 | 86 | 0 | 20 | 0.0% |
| repl | 89 | 0 | 14 | 0 | 75 | 0.0% |
| sqlite | 43 | 37 | 6 | 0 | 0 | 86.0% |
| stream | 829 | 739 | 79 | 0 | 11 | 89.1% |
| string_decoder | 3 | 3 | 0 | 0 | 0 | 100.0% |
| test_runner | 175 | 72 | 80 | 2 | 21 | 41.1% |
| timers | 109 | 35 | 50 | 2 | 22 | 32.1% |
| tls | 214 | 3 | 18 | 0 | 193 | 1.4% |
| trace_events | 35 | 4 | 0 | 0 | 31 | 11.4% |
| tty | 5 | 0 | 0 | 0 | 5 | 0.0% |
| url | 33 | 33 | 0 | 0 | 0 | 100.0% |
| util | 183 | 180 | 2 | 0 | 1 | 98.4% |
| v8 | 49 | 15 | 21 | 0 | 13 | 30.6% |
| vm | 127 | 23 | 26 | 9 | 69 | 18.1% |
| worker_threads | 204 | 17 | 123 | 7 | 57 | 8.3% |
| zlib | 67 | 57 | 10 | 0 | 0 | 85.1% |


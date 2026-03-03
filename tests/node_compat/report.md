# Node.js v22 Compatibility Report

Generated: 2026-03-03 | Runtime: 10852s | Engine: wasm-rquickjs (QuickJS)

## Summary (Public API Tests)

Tests that rely on Node.js internals (`--expose-internals`, `internalBinding`, `require('internal/...')`) are excluded from the primary counts (322 internals tests listed separately below).

| Result | Count | Percentage |
|--------|-------|------------|
| ✅ PASS | 1156 | 33.9% |
| ⏭️ SKIP | 2101 | 61.6% |
| ❌ FAIL | 142 | 4.2% |
| 💥 ERROR | 13 | 0.4% |
| **Total** | **3412** | **100%** |

### All Tests (Public + Internals)

Including 322 tests that use Node.js internals (`--expose-internals`, `internalBinding`, `require('internal/...')`).

| Result | Count | Percentage |
|--------|-------|------------|
| ✅ PASS | 1200 | 32.1% |
| ⏭️ SKIP | 2375 | 63.6% |
| ❌ FAIL | 146 | 3.9% |
| 💥 ERROR | 13 | 0.3% |
| **Total** | **3734** | **100%** |

## Results by Module

| Module | Total | Pass | Fail | Error | Skip | Pass% |
|--------|-------|------|------|-------|------|-------|
| abort | 30 | 17 | 11 | 0 | 2 | 56.7% |
| assert | 105 | 94 | 11 | 0 | 0 | 89.5% |
| async_hooks | 36 | 15 | 0 | 0 | 21 | 41.7% |
| blob | 2 | 2 | 0 | 0 | 0 | 100.0% |
| buffer | 189 | 179 | 0 | 8 | 2 | 94.7% |
| child_process | 215 | 40 | 79 | 13 | 83 | 18.6% |
| cluster | 85 | 4 | 0 | 0 | 81 | 4.7% |
| console | 32 | 32 | 0 | 0 | 0 | 100.0% |
| crypto | 238 | 216 | 10 | 5 | 7 | 90.8% |
| dgram | 107 | 70 | 18 | 0 | 19 | 65.4% |
| diagnostics_channel | 34 | 23 | 0 | 0 | 11 | 67.6% |
| dns | 33 | 9 | 17 | 0 | 7 | 27.3% |
| domain | 63 | 35 | 6 | 0 | 22 | 55.6% |
| events | 67 | 65 | 0 | 0 | 2 | 97.0% |
| fetch | 1 | 1 | 0 | 0 | 0 | 100.0% |
| fs | 459 | 336 | 51 | 11 | 61 | 73.2% |
| http | 891 | 80 | 281 | 0 | 530 | 9.0% |
| inspector | 85 | 0 | 0 | 0 | 85 | 0.0% |
| module | 190 | 15 | 61 | 0 | 114 | 7.9% |
| net | 204 | 50 | 48 | 0 | 106 | 24.5% |
| os | 5 | 2 | 0 | 0 | 3 | 40.0% |
| other | 919 | 165 | 307 | 4 | 443 | 18.0% |
| path | 16 | 16 | 0 | 0 | 0 | 100.0% |
| perf_hooks | 42 | 8 | 22 | 0 | 12 | 19.0% |
| process | 97 | 46 | 5 | 2 | 44 | 47.4% |
| querystring | 15 | 15 | 0 | 0 | 0 | 100.0% |
| readline | 23 | 0 | 9 | 0 | 14 | 0.0% |
| repl | 78 | 1 | 12 | 0 | 65 | 1.3% |
| stream | 820 | 787 | 26 | 0 | 7 | 96.0% |
| string_decoder | 3 | 0 | 0 | 0 | 3 | 0.0% |
| test_runner | 166 | 29 | 107 | 0 | 30 | 17.5% |
| timers | 64 | 48 | 0 | 2 | 14 | 75.0% |
| tls | 205 | 4 | 17 | 0 | 184 | 2.0% |
| trace_events | 30 | 4 | 0 | 0 | 26 | 13.3% |
| tty | 3 | 0 | 0 | 0 | 3 | 0.0% |
| url | 32 | 32 | 0 | 0 | 0 | 100.0% |
| util | 53 | 52 | 0 | 0 | 1 | 98.1% |
| v8 | 34 | 15 | 7 | 0 | 12 | 44.1% |
| vm | 127 | 24 | 25 | 9 | 69 | 18.9% |
| worker_threads | 195 | 87 | 50 | 7 | 51 | 44.6% |
| zlib | 67 | 41 | 4 | 0 | 22 | 61.2% |

## Passing Tests

- `es-module/test-esm-loader-cache-clearing.js`
- `es-module/test-esm-symlink-type.js`
- `es-module/test-esm-type-field-errors.js`
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
- `parallel/test-assert-first-line.js`
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
- `parallel/test-assert.js#test_15_throws_accepts_objects`
- `parallel/test-assert.js#test_16_additional_assert`
- `parallel/test-assert.js#test_17_assert_strict_exists`
- `parallel/test-async-hooks-destroy-on-gc.js`
- `parallel/test-async-hooks-disable-during-promise.js`
- `parallel/test-async-hooks-disable-gc-tracking.js`
- `parallel/test-async-hooks-enable-disable.js`
- `parallel/test-async-hooks-enable-during-promise.js`
- `parallel/test-async-hooks-enable-recursive.js`
- `parallel/test-async-hooks-prevent-double-destroy.js`
- `parallel/test-async-hooks-run-in-async-scope-caught-exception.js`
- `parallel/test-async-hooks-run-in-async-scope-this-arg.js`
- `parallel/test-async-hooks-vm-gc.js`
- `parallel/test-async-hooks-worker-asyncfn-terminate-1.js`
- `parallel/test-async-hooks-worker-asyncfn-terminate-2.js`
- `parallel/test-async-hooks-worker-asyncfn-terminate-3.js`
- `parallel/test-async-hooks-worker-asyncfn-terminate-4.js`
- `parallel/test-async-local-storage-exit-does-not-leak.js`
- `parallel/test-async-wrap-promise-after-enabled.js`
- `parallel/test-async-wrap-trigger-id.js`
- `parallel/test-async-wrap-uncaughtexception.js`
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
- `parallel/test-buffer-constructor-deprecation-error.js`
- `parallel/test-buffer-constructor-node-modules-paths.js`
- `parallel/test-buffer-constructor-node-modules.js`
- `parallel/test-buffer-constructor-outside-node-modules.js`
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
- `parallel/test-buffer-pending-deprecation.js`
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
- `parallel/test-child-process-exec-cwd.js`
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
- `parallel/test-child-process-execfile.js#block_02_block_02`
- `parallel/test-child-process-execfile.js#block_03_block_03`
- `parallel/test-child-process-execfile.js#block_04_block_04`
- `parallel/test-child-process-execfile.js#block_06_block_06`
- `parallel/test-child-process-fork-and-spawn.js`
- `parallel/test-child-process-fork-close.js`
- `parallel/test-child-process-fork-net-server.js`
- `parallel/test-child-process-fork-net-socket.js`
- `parallel/test-child-process-fork-no-shell.js`
- `parallel/test-child-process-fork-ref.js`
- `parallel/test-child-process-fork-ref2.js`
- `parallel/test-child-process-fork3.js`
- `parallel/test-child-process-internal.js`
- `parallel/test-child-process-ipc-next-tick.js`
- `parallel/test-child-process-send-after-close.js`
- `parallel/test-child-process-send-cb.js`
- `parallel/test-child-process-send-utf8.js`
- `parallel/test-child-process-server-close.js`
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
- `parallel/test-cluster-bind-twice.js`
- `parallel/test-cluster-dgram-2.js`
- `parallel/test-cluster-primary-error.js`
- `parallel/test-cluster-uncaught-exception.js`
- `parallel/test-common-countdown.js`
- `parallel/test-common-gc.js`
- `parallel/test-common-gc.js#block_00_block_00`
- `parallel/test-common-gc.js#block_01_block_01`
- `parallel/test-console-assign-undefined.js`
- `parallel/test-console-async-write-error.js`
- `parallel/test-console-clear.js`
- `parallel/test-console-count.js`
- `parallel/test-console-diagnostics-channels.js`
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
- `parallel/test-crypto-domains.js`
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
- `parallel/test-crypto-keygen-async-dsa-key-object.js`
- `parallel/test-crypto-keygen-async-dsa.js`
- `parallel/test-crypto-keygen-async-elliptic-curve-jwk-ec.js`
- `parallel/test-crypto-keygen-async-elliptic-curve-jwk-rsa.js`
- `parallel/test-crypto-keygen-async-elliptic-curve-jwk.js`
- `parallel/test-crypto-keygen-async-encrypted-private-key-der.js`
- `parallel/test-crypto-keygen-async-encrypted-private-key.js`
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
- `parallel/test-dgram-bind-default-address.js`
- `parallel/test-dgram-bind-error-repeat.js`
- `parallel/test-dgram-bind.js`
- `parallel/test-dgram-blocklist.js`
- `parallel/test-dgram-blocklist.js#block_00_block_00`
- `parallel/test-dgram-blocklist.js#block_01_block_01`
- `parallel/test-dgram-blocklist.js#block_02_block_02`
- `parallel/test-dgram-bytes-length.js`
- `parallel/test-dgram-close-in-listening.js`
- `parallel/test-dgram-close-is-not-callback.js`
- `parallel/test-dgram-close-signal.js#block_01_block_01`
- `parallel/test-dgram-close-signal.js#block_02_block_02`
- `parallel/test-dgram-connect-send-callback-buffer-length.js`
- `parallel/test-dgram-connect-send-callback-buffer.js`
- `parallel/test-dgram-connect-send-callback-multi-buffer.js`
- `parallel/test-dgram-connect-send-default-host.js`
- `parallel/test-dgram-connect-send-empty-array.js`
- `parallel/test-dgram-connect-send-empty-buffer.js`
- `parallel/test-dgram-connect-send-empty-packet.js`
- `parallel/test-dgram-connect-send-multi-buffer-copy.js`
- `parallel/test-dgram-connect-send-multi-string-array.js`
- `parallel/test-dgram-connect.js`
- `parallel/test-dgram-createSocket-type.js`
- `parallel/test-dgram-createSocket-type.js#block_00_ensure_buffer_sizes_can_be_set`
- `parallel/test-dgram-createSocket-type.js#block_01_block_01`
- `parallel/test-dgram-custom-lookup.js#block_00_block_00`
- `parallel/test-dgram-custom-lookup.js#block_01_block_01`
- `parallel/test-dgram-deprecation-error.js`
- `parallel/test-dgram-exclusive-implicit-bind.js`
- `parallel/test-dgram-implicit-bind.js`
- `parallel/test-dgram-msgsize.js`
- `parallel/test-dgram-multicast-loopback.js#block_01_block_01`
- `parallel/test-dgram-multicast-set-interface.js`
- `parallel/test-dgram-multicast-set-interface.js#block_00_block_00`
- `parallel/test-dgram-multicast-set-interface.js#block_01_block_01`
- `parallel/test-dgram-multicast-set-interface.js#block_02_block_02`
- `parallel/test-dgram-multicast-set-interface.js#block_03_block_03`
- `parallel/test-dgram-multicast-set-interface.js#block_04_block_04`
- `parallel/test-dgram-multicast-set-interface.js#block_05_block_05`
- `parallel/test-dgram-multicast-set-interface.js#block_06_block_06`
- `parallel/test-dgram-multicast-set-interface.js#block_07_block_07`
- `parallel/test-dgram-multicast-setTTL.js`
- `parallel/test-dgram-oob-buffer.js`
- `parallel/test-dgram-ref.js`
- `parallel/test-dgram-send-address-types.js`
- `parallel/test-dgram-send-bad-arguments.js`
- `parallel/test-dgram-send-callback-buffer-empty-address.js`
- `parallel/test-dgram-send-callback-buffer-length-empty-address.js`
- `parallel/test-dgram-send-callback-buffer-length.js`
- `parallel/test-dgram-send-callback-buffer.js`
- `parallel/test-dgram-send-callback-multi-buffer-empty-address.js`
- `parallel/test-dgram-send-callback-multi-buffer.js`
- `parallel/test-dgram-send-callback-recursive.js`
- `parallel/test-dgram-send-default-host.js`
- `parallel/test-dgram-send-empty-array.js`
- `parallel/test-dgram-send-empty-buffer.js`
- `parallel/test-dgram-send-empty-packet.js`
- `parallel/test-dgram-send-invalid-msg-type.js`
- `parallel/test-dgram-send-multi-buffer-copy.js`
- `parallel/test-dgram-send-multi-string-array.js`
- `parallel/test-dgram-send-queue-info.js`
- `parallel/test-dgram-sendto.js`
- `parallel/test-dgram-setBroadcast.js#block_01_block_01`
- `parallel/test-dgram-setTTL.js`
- `parallel/test-dgram-udp4.js`
- `parallel/test-dgram-unref.js`
- `parallel/test-dgram-unref.js#block_00_block_00`
- `parallel/test-dgram-unref.js#block_01_block_01`
- `parallel/test-diagnostics-channel-bind-store.js`
- `parallel/test-diagnostics-channel-has-subscribers.js`
- `parallel/test-diagnostics-channel-object-channel-pub-sub.js`
- `parallel/test-diagnostics-channel-pub-sub.js`
- `parallel/test-diagnostics-channel-safe-subscriber-errors.js`
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
- `parallel/test-diagnostics-channel-udp.js`
- `parallel/test-diagnostics-channel-worker-threads.js`
- `parallel/test-dns-cancel-reverse-lookup.js`
- `parallel/test-dns-channel-cancel-promise.js`
- `parallel/test-dns-channel-cancel.js`
- `parallel/test-dns-multi-channel.js`
- `parallel/test-dns-perf_hooks.js`
- `parallel/test-dns-promises-exists.js`
- `parallel/test-dns-resolveany-bad-ancount.js`
- `parallel/test-dns-resolveany.js`
- `parallel/test-dns-setlocaladdress.js#block_00_verifies_that_setlocaladdress_succeeds_with_ipv4_and_ipv6_ad`
- `parallel/test-domain-add-remove.js`
- `parallel/test-domain-bind-timeout.js`
- `parallel/test-domain-crypto.js`
- `parallel/test-domain-ee-error-listener.js`
- `parallel/test-domain-ee-implicit.js`
- `parallel/test-domain-emit-error-handler-stack.js`
- `parallel/test-domain-enter-exit.js`
- `parallel/test-domain-error-types.js`
- `parallel/test-domain-from-timer.js`
- `parallel/test-domain-fs-enoent-stream.js`
- `parallel/test-domain-implicit-binding.js`
- `parallel/test-domain-implicit-fs.js`
- `parallel/test-domain-intercept.js`
- `parallel/test-domain-intercept.js#block_00_block_00`
- `parallel/test-domain-intercept.js#block_01_block_01`
- `parallel/test-domain-intercept.js#block_02_block_02`
- `parallel/test-domain-multiple-errors.js`
- `parallel/test-domain-nested.js`
- `parallel/test-domain-nexttick.js`
- `parallel/test-domain-promise.js#block_02_block_02`
- `parallel/test-domain-promise.js#block_04_block_04`
- `parallel/test-domain-promise.js#block_07_block_07`
- `parallel/test-domain-promise.js#block_08_block_08`
- `parallel/test-domain-run.js`
- `parallel/test-domain-safe-exit.js`
- `parallel/test-domain-stack.js`
- `parallel/test-domain-throw-error-then-throw-from-uncaught-exception-handler.js`
- `parallel/test-domain-thrown-error-handler-stack.js`
- `parallel/test-domain-timer.js`
- `parallel/test-domain-timers-uncaught-exception.js`
- `parallel/test-domain-timers.js`
- `parallel/test-domain-top-level-error-handler-clears-stack.js`
- `parallel/test-domain-top-level-error-handler-throw.js`
- `parallel/test-domain-uncaught-exception.js`
- `parallel/test-domain-with-abort-on-uncaught-exception.js`
- `parallel/test-domexception-cause.js#block_00_block_00`
- `parallel/test-emit-after-uncaught-exception.js`
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
- `parallel/test-event-emitter-max-listeners-warning-for-null.js`
- `parallel/test-event-emitter-max-listeners-warning-for-symbol.js`
- `parallel/test-event-emitter-max-listeners-warning.js`
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
- `parallel/test-exception-handler.js`
- `parallel/test-fetch-mock.js`
- `parallel/test-file-read-noexist.js`
- `parallel/test-file-validate-mode-flag.js`
- `parallel/test-file-write-stream.js`
- `parallel/test-file-write-stream2.js`
- `parallel/test-file-write-stream3.js`
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
- `parallel/test-fs-open-no-close.js`
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
- `parallel/test-fs-read-stream-patch-open.js`
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
- `parallel/test-fs-readdir-recursive.js`
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
- `parallel/test-fs-readfile-pipe.js`
- `parallel/test-fs-readfile-unlink.js`
- `parallel/test-fs-readfile-zero-byte-liar.js`
- `parallel/test-fs-readfile.js#block_01_block_01`
- `parallel/test-fs-readfile.js#block_02_block_02`
- `parallel/test-fs-readfilesync-pipe-large.js`
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
- `parallel/test-fs-realpath-native.js`
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
- `parallel/test-fs-stream-construct-compat-error-read.js`
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
- `parallel/test-fs-symlink-dir-junction.js`
- `parallel/test-fs-symlink-longpath.js`
- `parallel/test-fs-truncate-clear-file-zero.js`
- `parallel/test-fs-truncate-clear-file-zero.js#block_00_synchronous_test`
- `parallel/test-fs-truncate-clear-file-zero.js#block_01_asynchronous_test`
- `parallel/test-fs-truncate-fd.js`
- `parallel/test-fs-truncate-sync.js`
- `parallel/test-fs-unlink-type-check.js`
- `parallel/test-fs-watch-file-enoent-after-deletion.js`
- `parallel/test-fs-watch-recursive-delete.js`
- `parallel/test-fs-watch-recursive-update-file.js`
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
- `parallel/test-fs-write-stream-patch-open.js`
- `parallel/test-fs-write-stream-throw-type-error.js`
- `parallel/test-fs-write-stream.js`
- `parallel/test-fs-write-stream.js#block_00_block_00`
- `parallel/test-fs-write-stream.js#block_01_block_01`
- `parallel/test-fs-write-stream.js#block_02_throws_if_data_is_not_of_type_buffer`
- `parallel/test-fs-write-sync.js`
- `parallel/test-fs-writefile-with-fd.js`
- `parallel/test-fs-writefile-with-fd.js#block_00_block_00`
- `parallel/test-fs-writefile-with-fd.js#block_01_block_01`
- `parallel/test-fs-writefile-with-fd.js#block_02_test_read_only_file_descriptor`
- `parallel/test-fs-writefile-with-fd.js#block_03_test_with_an_abortsignal`
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
- `parallel/test-handle-wrap-close-abort.js`
- `parallel/test-heapdump-async-hooks-init-promise.js`
- `parallel/test-http-addrequest-localaddress.js`
- `parallel/test-http-agent-close.js`
- `parallel/test-http-agent-false.js`
- `parallel/test-http-agent-getname.js`
- `parallel/test-http-autoselectfamily.js`
- `parallel/test-http-client-abort-keep-alive-queued-unix-socket.js`
- `parallel/test-http-client-abort-unix-socket.js`
- `parallel/test-http-client-abort3.js`
- `parallel/test-http-client-abort3.js#block_00_block_00`
- `parallel/test-http-client-abort3.js#block_01_block_01`
- `parallel/test-http-client-defaults.js`
- `parallel/test-http-client-defaults.js#block_00_block_00`
- `parallel/test-http-client-defaults.js#block_01_block_01`
- `parallel/test-http-client-defaults.js#block_02_block_02`
- `parallel/test-http-client-invalid-path.js`
- `parallel/test-http-client-pipe-end.js`
- `parallel/test-http-client-read-in-error.js`
- `parallel/test-http-client-readable.js`
- `parallel/test-http-client-response-domain.js`
- `parallel/test-http-client-unescaped-path.js`
- `parallel/test-http-client-with-create-connection.js`
- `parallel/test-http-common.js`
- `parallel/test-http-generic-streams.js`
- `parallel/test-http-generic-streams.js#block_00_test_1_simple_http_test_no_keep_alive`
- `parallel/test-http-generic-streams.js#block_01_test_2_keep_alive_for_2_requests`
- `parallel/test-http-generic-streams.js#block_02_test_3_connection_close_request_response_with_chunked`
- `parallel/test-http-generic-streams.js#block_03_the_same_as_test_3_but_with_content_length_headers`
- `parallel/test-http-generic-streams.js#block_04_test_5_the_client_sends_garbage`
- `parallel/test-http-header-validators.js`
- `parallel/test-http-hostname-typechecking.js`
- `parallel/test-http-incoming-message-connection-setter.js`
- `parallel/test-http-incoming-message-destroy.js`
- `parallel/test-http-insecure-parser-per-stream.js#block_00_test_1_the_server_sends_an_invalid_header`
- `parallel/test-http-insecure-parser-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-http-insecure-parser-per-stream.js#block_02_test_3_the_client_sends_an_invalid_header`
- `parallel/test-http-insecure-parser-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`
- `parallel/test-http-invalid-path-chars.js`
- `parallel/test-http-invalid-urls.js`
- `parallel/test-http-invalidheaderfield2.js`
- `parallel/test-http-max-header-size-per-stream.js`
- `parallel/test-http-max-header-size-per-stream.js#block_00_test_1_the_server_sends_larger_headers_than_what_would_other`
- `parallel/test-http-max-header-size-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-http-max-header-size-per-stream.js#block_02_test_3_the_client_sends_larger_headers_than_what_would_other`
- `parallel/test-http-max-header-size-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`
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
- `parallel/test-http-parser-multiple-execute.js`
- `parallel/test-http-request-invalid-method-error.js`
- `parallel/test-http-server-connections-checking-leak.js`
- `parallel/test-http-server-response-standalone.js`
- `parallel/test-http-sync-write-error-during-continue.js`
- `parallel/test-http-unix-socket-keep-alive.js`
- `parallel/test-http-unix-socket.js`
- `parallel/test-http2-client-upload-reject.js`
- `parallel/test-http2-client-upload.js`
- `parallel/test-http2-compat-client-upload-reject.js`
- `parallel/test-http2-request-response-proto.js`
- `parallel/test-http2-reset-flood.js`
- `parallel/test-https-autoselectfamily.js`
- `parallel/test-https-insecure-parse-per-stream.js#block_00_test_1_the_server_sends_an_invalid_header`
- `parallel/test-https-insecure-parse-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-https-max-header-size-per-stream.js#block_00_test_1_the_server_sends_larger_headers_than_what_would_other`
- `parallel/test-https-max-header-size-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-https-set-timeout-server.js`
- `parallel/test-instanceof.js`
- `parallel/test-messagechannel.js`
- `parallel/test-microtask-queue-integration.js`
- `parallel/test-module-cache.js`
- `parallel/test-module-circular-dependency-warning.js`
- `parallel/test-module-loading-deprecated.js`
- `parallel/test-module-multi-extensions.js#block_02_block_02`
- `parallel/test-module-parent-setter-deprecation.js`
- `parallel/test-net-access-byteswritten.js`
- `parallel/test-net-autoselectfamily-attempt-timeout-cli-option.js`
- `parallel/test-net-autoselectfamily-attempt-timeout-default-value.js`
- `parallel/test-net-autoselectfamily-ipv4first.js`
- `parallel/test-net-autoselectfamily.js#block_02_test_that_when_all_errors_are_returned_when_no_connections_s`
- `parallel/test-net-better-error-messages-listen-path.js`
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
- `parallel/test-net-connect-options-path.js`
- `parallel/test-net-connect-reset.js`
- `parallel/test-net-deprecated-setsimultaneousaccepts.js`
- `parallel/test-net-end-without-connect.js`
- `parallel/test-net-isip.js`
- `parallel/test-net-isipv4.js`
- `parallel/test-net-isipv6.js`
- `parallel/test-net-listen-error.js`
- `parallel/test-net-options-lookup.js`
- `parallel/test-net-server-listen-path.js`
- `parallel/test-net-server-listen-path.js#block_00_test_listen_path`
- `parallel/test-net-server-listen-path.js#block_01_test_listen_path`
- `parallel/test-net-server-listen-path.js#block_02_test_listen_path_cb`
- `parallel/test-net-server-listen-path.js#block_03_test_listen_path_cb`
- `parallel/test-net-server-listen-path.js#block_04_test_pipe_chmod`
- `parallel/test-net-server-listen-path.js#block_05_test_should_emit_error_events_when_listening_fails`
- `parallel/test-net-server-options.js`
- `parallel/test-net-server-simultaneous-accepts-produce-warning-once.js`
- `parallel/test-net-socket-connect-invalid-autoselectfamily.js`
- `parallel/test-net-socket-connect-invalid-autoselectfamilyattempttimeout.js`
- `parallel/test-net-socket-no-halfopen-enforcer.js`
- `parallel/test-net-socket-setnodelay.js`
- `parallel/test-net-timeout-no-handle.js`
- `parallel/test-net-write-arguments.js`
- `parallel/test-next-tick-doesnt-hang.js`
- `parallel/test-next-tick-domain.js`
- `parallel/test-next-tick-fixed-queue-regression.js`
- `parallel/test-next-tick-intentional-starvation.js`
- `parallel/test-next-tick-ordering2.js`
- `parallel/test-next-tick-when-exiting.js`
- `parallel/test-next-tick.js`
- `parallel/test-no-addons-resolution-condition.js`
- `parallel/test-no-node-snapshot.js`
- `parallel/test-npm-install.js`
- `parallel/test-os-homedir-no-envvar.js`
- `parallel/test-os-userinfo-handles-getter-errors.js`
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
- `parallel/test-perf-hooks-worker-timeorigin.js`
- `parallel/test-performance-gc.js`
- `parallel/test-performance-gc.js#block_00_adding_an_observer_should_force_at_least_one_gc_to_appear`
- `parallel/test-performance-gc.js#block_01_gc_should_not_keep_the_event_loop_alive`
- `parallel/test-performance-measure-detail.js`
- `parallel/test-performance-measure.js`
- `parallel/test-performanceobserver-gc.js`
- `parallel/test-permission-allow-worker-cli.js#block_01_to_spawn_unless_allow_worker_is_sent`
- `parallel/test-permission-fs-read.js#block_00_block_00`
- `parallel/test-permission-fs-read.js#block_02_block_02`
- `parallel/test-permission-fs-require.js#block_00_block_00`
- `parallel/test-pipe-address.js`
- `parallel/test-pipe-head.js`
- `parallel/test-pipe-return-val.js`
- `parallel/test-pipe-stream.js`
- `parallel/test-pipe-unref.js`
- `parallel/test-pipe-writev.js`
- `parallel/test-preload-self-referential.js`
- `parallel/test-preload-worker.js`
- `parallel/test-process-abort.js`
- `parallel/test-process-available-memory.js`
- `parallel/test-process-beforeexit-throw-exit.js`
- `parallel/test-process-beforeexit.js`
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
- `parallel/test-process-exit-from-before-exit.js`
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
- `parallel/test-process-redirect-warnings-env.js`
- `parallel/test-process-redirect-warnings.js`
- `parallel/test-process-release.js`
- `parallel/test-process-setgroups.js`
- `parallel/test-process-setsourcemapsenabled.js`
- `parallel/test-process-umask-mask.js`
- `parallel/test-process-umask.js`
- `parallel/test-process-uptime.js`
- `parallel/test-process-warning.js`
- `parallel/test-promise-swallowed-event.js`
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
- `parallel/test-readable-from-iterator-closing.js`
- `parallel/test-readable-from-web-enqueue-then-close.js`
- `parallel/test-readable-from.js`
- `parallel/test-readable-large-hwm.js`
- `parallel/test-readable-single-end.js`
- `parallel/test-ref-unref-return.js`
- `parallel/test-regression-object-prototype.js`
- `parallel/test-repl-programmatic-history.js`
- `parallel/test-require-cache.js#block_00_block_00`
- `parallel/test-require-empty-main.js`
- `parallel/test-require-enoent-dir.js`
- `parallel/test-require-invalid-package.js`
- `parallel/test-require-nul.js`
- `parallel/test-require-process.js`
- `parallel/test-runner-aliases.js`
- `parallel/test-runner-assert.js#test_01_t_assert_ok_correctly_parses_the_stacktrace`
- `parallel/test-runner-concurrency.js#test_00_concurrency_option_boolean_true`
- `parallel/test-runner-concurrency.js#test_02_concurrency_true_implies_infinity`
- `parallel/test-runner-concurrency.js#test_03_test_multiple_files`
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
- `parallel/test-runner-enable-source-maps-issue.js`
- `parallel/test-runner-filetest-location.js`
- `parallel/test-runner-filter-warning.js`
- `parallel/test-runner-mocking.js#test_01_spies_on_a_bound_function`
- `parallel/test-runner-mocking.js#test_03_a_no_op_spy_function_is_created_by_default`
- `parallel/test-runner-mocking.js#test_04_internal_no_op_function_can_be_reused`
- `parallel/test-runner-mocking.js#test_06_internal_no_op_function_can_be_reused_as_methods`
- `parallel/test-runner-mocking.js#test_18_mocked_functions_report_thrown_errors`
- `parallel/test-runner-mocking.js#test_32_local_mocks_are_auto_restored_after_the_test_finishes`
- `parallel/test-runner-root-after-with-refed-handles.js`
- `parallel/test-runner-source-maps-invalid-json.js`
- `parallel/test-runner-test-fullname.js#test_01_test_01`
- `parallel/test-runner-todo-skip-tests.js`
- `parallel/test-set-incoming-message-header.js#block_00_headers_setter_function_set_a_header_correctly`
- `parallel/test-set-incoming-message-header.js#block_01_trailers_setter_function_set_a_header_correctly`
- `parallel/test-shadow-realm-preload-module.js`
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
- `parallel/test-stdin-from-file.js`
- `parallel/test-stdin-hang.js`
- `parallel/test-stdin-pause-resume-sync.js`
- `parallel/test-stdin-pause-resume.js`
- `parallel/test-stdin-resume-pause.js`
- `parallel/test-stdio-pipe-access.js`
- `parallel/test-stdio-pipe-stderr.js`
- `parallel/test-stdout-stderr-write.js`
- `parallel/test-stdout-to-file.js`
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
- `parallel/test-stream-compose.js`
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
- `parallel/test-stream-compose.js#block_17_block_17`
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
- `parallel/test-stream-destroy.js#block_00_block_00`
- `parallel/test-stream-destroy.js#block_01_block_01`
- `parallel/test-stream-destroy.js#block_02_block_02`
- `parallel/test-stream-destroy.js#block_03_block_03`
- `parallel/test-stream-drop-take.js`
- `parallel/test-stream-drop-take.js#block_00_block_00`
- `parallel/test-stream-drop-take.js#block_01_don_t_wait_for_next_item_in_the_original_stream_when_already`
- `parallel/test-stream-drop-take.js#block_02_block_02`
- `parallel/test-stream-drop-take.js#block_03_block_03`
- `parallel/test-stream-drop-take.js#block_04_block_04`
- `parallel/test-stream-drop-take.js#block_05_block_05`
- `parallel/test-stream-duplex-destroy.js`
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
- `parallel/test-stream-duplex-destroy.js#block_14_block_14`
- `parallel/test-stream-duplex-destroy.js#block_15_block_15`
- `parallel/test-stream-duplex-end.js`
- `parallel/test-stream-duplex-end.js#block_00_block_00`
- `parallel/test-stream-duplex-end.js#block_01_block_01`
- `parallel/test-stream-duplex-end.js#block_02_block_02`
- `parallel/test-stream-duplex-from.js`
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
- `parallel/test-stream-duplex-from.js#block_17_block_17`
- `parallel/test-stream-duplex-from.js#block_18_block_18`
- `parallel/test-stream-duplex-from.js#block_19_block_19`
- `parallel/test-stream-duplex-from.js#block_20_block_20`
- `parallel/test-stream-duplex-from.js#block_21_block_21`
- `parallel/test-stream-duplex-from.js#block_22_block_22`
- `parallel/test-stream-duplex-props.js`
- `parallel/test-stream-duplex-props.js#block_00_block_00`
- `parallel/test-stream-duplex-props.js#block_01_block_01`
- `parallel/test-stream-duplex-readable-end.js`
- `parallel/test-stream-duplex-readable-writable.js`
- `parallel/test-stream-duplex-readable-writable.js#block_00_block_00`
- `parallel/test-stream-duplex-readable-writable.js#block_01_block_01`
- `parallel/test-stream-duplex-readable-writable.js#block_02_block_02`
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
- `parallel/test-stream-err-multiple-callback-construction.js`
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
- `parallel/test-stream-finished.js#block_21_block_21`
- `parallel/test-stream-finished.js#block_22_block_22`
- `parallel/test-stream-finished.js#block_23_block_23`
- `parallel/test-stream-finished.js#block_24_block_24`
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
- `parallel/test-stream-finished.js#block_41_block_41`
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
- `parallel/test-stream-map.js`
- `parallel/test-stream-map.js#block_00_block_00`
- `parallel/test-stream-map.js#block_01_block_01`
- `parallel/test-stream-map.js#block_02_block_02`
- `parallel/test-stream-map.js#block_03_block_03`
- `parallel/test-stream-map.js#block_04_block_04`
- `parallel/test-stream-map.js#block_05_block_05`
- `parallel/test-stream-map.js#block_06_block_06`
- `parallel/test-stream-map.js#block_07_block_07`
- `parallel/test-stream-map.js#block_08_block_08`
- `parallel/test-stream-map.js#block_09_block_09`
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
- `parallel/test-stream-pipe-deadlock.js`
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
- `parallel/test-stream-pipe-without-listenerCount.js`
- `parallel/test-stream-pipeline-async-iterator.js`
- `parallel/test-stream-pipeline-duplex.js`
- `parallel/test-stream-pipeline-listeners.js`
- `parallel/test-stream-pipeline-process.js`
- `parallel/test-stream-pipeline-queued-end-in-destroy.js`
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
- `parallel/test-stream-pipeline.js#block_71_block_71`
- `parallel/test-stream-pipeline.js#block_72_block_72`
- `parallel/test-stream-pipeline.js#block_73_block_73`
- `parallel/test-stream-pipeline.js#block_74_block_74`
- `parallel/test-stream-pipeline.js#block_75_block_75`
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
- `parallel/test-stream-readable-emittedReadable.js`
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
- `parallel/test-stream-readable-hwm-0-no-flow-data.js`
- `parallel/test-stream-readable-hwm-0.js`
- `parallel/test-stream-readable-infinite-read.js`
- `parallel/test-stream-readable-invalid-chunk.js`
- `parallel/test-stream-readable-needReadable.js`
- `parallel/test-stream-readable-next-no-null.js`
- `parallel/test-stream-readable-no-unneeded-readable.js`
- `parallel/test-stream-readable-no-unneeded-readable.js#block_00_block_00`
- `parallel/test-stream-readable-no-unneeded-readable.js#block_01_block_01`
- `parallel/test-stream-readable-object-multi-push-async.js`
- `parallel/test-stream-readable-object-multi-push-async.js#block_00_block_00`
- `parallel/test-stream-readable-object-multi-push-async.js#block_01_block_01`
- `parallel/test-stream-readable-object-multi-push-async.js#block_02_block_02`
- `parallel/test-stream-readable-object-multi-push-async.js#block_03_block_03`
- `parallel/test-stream-readable-object-multi-push-async.js#block_04_block_04`
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
- `parallel/test-stream-readable-unpipe-resume.js`
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
- `parallel/test-stream-reduce.js`
- `parallel/test-stream-reduce.js#block_00_block_00`
- `parallel/test-stream-reduce.js#block_01_block_01`
- `parallel/test-stream-reduce.js#block_02_block_02`
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
- `parallel/test-stream-writable-destroy.js`
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
- `parallel/test-stream-writable-destroy.js#block_19_block_19`
- `parallel/test-stream-writable-destroy.js#block_20_block_20`
- `parallel/test-stream-writable-destroy.js#block_21_block_21`
- `parallel/test-stream-writable-destroy.js#block_22_block_22`
- `parallel/test-stream-writable-destroy.js#block_23_block_23`
- `parallel/test-stream-writable-destroy.js#block_24_block_24`
- `parallel/test-stream-writable-destroy.js#block_25_block_25`
- `parallel/test-stream-writable-destroy.js#block_26_block_26`
- `parallel/test-stream-writable-destroy.js#block_27_block_27`
- `parallel/test-stream-writable-end-cb-error.js`
- `parallel/test-stream-writable-end-cb-error.js#block_00_block_00`
- `parallel/test-stream-writable-end-cb-error.js#block_01_block_01`
- `parallel/test-stream-writable-end-cb-error.js#block_02_block_02`
- `parallel/test-stream-writable-end-cb-uncaught.js`
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
- `parallel/test-stream-writable-samecb-singletick.js`
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
- `parallel/test-stream2-transform.js`
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
- `parallel/test-stream2-transform.js#block_16_block_16`
- `parallel/test-stream2-unpipe-drain.js`
- `parallel/test-stream2-unpipe-leak.js`
- `parallel/test-stream2-writable.js#block_00_block_00`
- `parallel/test-stream2-writable.js#block_01_block_01`
- `parallel/test-stream2-writable.js#block_02_block_02`
- `parallel/test-stream2-writable.js#block_03_block_03`
- `parallel/test-stream2-writable.js#block_04_block_04`
- `parallel/test-stream2-writable.js#block_05_block_05`
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
- `parallel/test-sync-fileread.js`
- `parallel/test-timers-args.js`
- `parallel/test-timers-clear-null-does-not-throw-error.js`
- `parallel/test-timers-clear-object-does-not-throw-error.js`
- `parallel/test-timers-clear-timeout-interval-equivalent.js`
- `parallel/test-timers-clearImmediate-als.js`
- `parallel/test-timers-clearImmediate.js`
- `parallel/test-timers-dispose.js`
- `parallel/test-timers-immediate-queue-throw.js`
- `parallel/test-timers-immediate-unref-nested-once.js`
- `parallel/test-timers-immediate-unref-simple.js`
- `parallel/test-timers-immediate-unref.js`
- `parallel/test-timers-immediate.js`
- `parallel/test-timers-max-duration-warning.js`
- `parallel/test-timers-max-duration-warning.js#block_00_block_00`
- `parallel/test-timers-max-duration-warning.js#block_01_block_01`
- `parallel/test-timers-max-duration-warning.js#block_02_block_02`
- `parallel/test-timers-non-integer-delay.js`
- `parallel/test-timers-process-tampering.js`
- `parallel/test-timers-promises.js`
- `parallel/test-timers-refresh-in-callback.js`
- `parallel/test-timers-reset-process-domain-on-throw.js`
- `parallel/test-timers-same-timeout-wrong-list-deleted.js`
- `parallel/test-timers-setimmediate-infinite-loop.js`
- `parallel/test-timers-this.js`
- `parallel/test-timers-throw-when-cb-not-function.js`
- `parallel/test-timers-timeout-to-interval.js`
- `parallel/test-timers-timeout-with-non-integer.js`
- `parallel/test-timers-to-primitive.js`
- `parallel/test-timers-to-primitive.js#block_00_block_00`
- `parallel/test-timers-to-primitive.js#block_01_block_01`
- `parallel/test-timers-uncaught-exception.js`
- `parallel/test-timers-unenroll-unref-interval.js`
- `parallel/test-timers-unenroll-unref-interval.js#block_00_block_00`
- `parallel/test-timers-unenroll-unref-interval.js#block_01_block_01`
- `parallel/test-timers-unenroll-unref-interval.js#block_02_block_02`
- `parallel/test-timers-unenroll-unref-interval.js#block_03_block_03`
- `parallel/test-timers-unenroll-unref-interval.js#block_04_block_04`
- `parallel/test-timers-unref-throw-then-ref.js`
- `parallel/test-timers-unref.js`
- `parallel/test-timers-unref.js#block_00_block_00`
- `parallel/test-timers-unref.js#block_01_block_01`
- `parallel/test-timers-unref.js#block_02_see_https_github_com_nodejs_node_v0_x_archive_issues_4261`
- `parallel/test-timers-unrefd-interval-still-fires.js`
- `parallel/test-timers-unrefed-in-beforeexit.js`
- `parallel/test-timers-user-call.js#block_00_block_00`
- `parallel/test-timers-zero-timeout.js`
- `parallel/test-timers-zero-timeout.js#block_00_https_github_com_joyent_node_issues_2079_zero_timeout_drops_`
- `parallel/test-timers-zero-timeout.js#block_01_block_01`
- `parallel/test-tls-cli-min-max-conflict.js`
- `parallel/test-tls-enable-keylog-cli.js`
- `parallel/test-tls-env-extra-ca-no-crypto.js`
- `parallel/test-tls-wrap-econnreset-pipe.js`
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
- `parallel/test-webcrypto-cryptokey-workers.js`
- `parallel/test-webcrypto-sign-verify.js#block_02_test_sign_verify_ecdsa`
- `parallel/test-webcrypto-sign-verify.js#block_03_test_sign_verify_hmac`
- `parallel/test-webcrypto-sign-verify.js#block_04_test_sign_verify_ed25519`
- `parallel/test-websocket-disabled.js`
- `parallel/test-webstream-string-tag.js`
- `parallel/test-webstreams-compose.js`
- `parallel/test-webstreams-compose.js#block_00_block_00`
- `parallel/test-webstreams-compose.js#block_01_block_01`
- `parallel/test-webstreams-compose.js#block_02_block_02`
- `parallel/test-webstreams-compose.js#block_03_block_03`
- `parallel/test-webstreams-compose.js#block_04_block_04`
- `parallel/test-webstreams-compose.js#block_05_block_05`
- `parallel/test-webstreams-compose.js#block_06_block_06`
- `parallel/test-webstreams-compose.js#block_07_block_07`
- `parallel/test-webstreams-compose.js#block_08_block_08`
- `parallel/test-webstreams-compose.js#block_09_block_09`
- `parallel/test-webstreams-compose.js#block_10_block_10`
- `parallel/test-webstreams-compose.js#block_11_block_11`
- `parallel/test-webstreams-compose.js#block_12_block_12`
- `parallel/test-webstreams-compose.js#block_13_block_13`
- `parallel/test-webstreams-compose.js#block_14_block_14`
- `parallel/test-webstreams-compose.js#block_15_block_15`
- `parallel/test-webstreams-compose.js#block_16_block_16`
- `parallel/test-webstreams-compose.js#block_17_block_17`
- `parallel/test-webstreams-compose.js#block_18_block_18`
- `parallel/test-webstreams-compose.js#block_19_block_19`
- `parallel/test-webstreams-pipeline.js#block_00_block_00`
- `parallel/test-webstreams-pipeline.js#block_01_block_01`
- `parallel/test-webstreams-pipeline.js#block_02_block_02`
- `parallel/test-webstreams-pipeline.js#block_03_block_03`
- `parallel/test-webstreams-pipeline.js#block_04_block_04`
- `parallel/test-webstreams-pipeline.js#block_05_block_05`
- `parallel/test-webstreams-pipeline.js#block_06_block_06`
- `parallel/test-webstreams-pipeline.js#block_11_block_11`
- `parallel/test-webstreams-pipeline.js#block_12_block_12`
- `parallel/test-webstreams-pipeline.js#block_13_block_13`
- `parallel/test-webstreams-pipeline.js#block_14_block_14`
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
- `parallel/test-worker-abort-on-uncaught-exception-terminate.js`
- `parallel/test-worker-abort-on-uncaught-exception.js`
- `parallel/test-worker-arraybuffer-zerofill.js`
- `parallel/test-worker-beforeexit-throw-exit.js`
- `parallel/test-worker-cjs-workerdata.js`
- `parallel/test-worker-cleanexit-with-js.js`
- `parallel/test-worker-cleanexit-with-moduleload.js`
- `parallel/test-worker-cleanup-handles.js`
- `parallel/test-worker-console-listeners.js`
- `parallel/test-worker-crypto-sign-transfer-result.js`
- `parallel/test-worker-data-url.js`
- `parallel/test-worker-dns-terminate-during-query.js`
- `parallel/test-worker-dns-terminate.js`
- `parallel/test-worker-error-stack-getter-throws.js`
- `parallel/test-worker-esm-exit.js`
- `parallel/test-worker-esm-missing-main.js`
- `parallel/test-worker-esmodule.js`
- `parallel/test-worker-event.js`
- `parallel/test-worker-exit-event-error.js`
- `parallel/test-worker-exit-from-uncaught-exception.js`
- `parallel/test-worker-exit-heapsnapshot.js`
- `parallel/test-worker-fs-stat-watcher.js`
- `parallel/test-worker-heap-snapshot.js`
- `parallel/test-worker-heapdump-failure.js`
- `parallel/test-worker-http2-generic-streams-terminate.js`
- `parallel/test-worker-http2-stream-terminate.js`
- `parallel/test-worker-load-file-with-extension-other-than-js.js`
- `parallel/test-worker-memory.js`
- `parallel/test-worker-message-channel.js`
- `parallel/test-worker-message-channel.js#block_00_block_00`
- `parallel/test-worker-message-channel.js#block_01_block_01`
- `parallel/test-worker-message-channel.js#block_02_block_02`
- `parallel/test-worker-message-port-arraybuffer.js`
- `parallel/test-worker-message-port-close-while-receiving.js`
- `parallel/test-worker-message-port-close.js#block_01_block_01`
- `parallel/test-worker-message-port-close.js#block_03_refs_https_github_com_nodejs_node_issues_42296`
- `parallel/test-worker-message-port-message-before-close.js`
- `parallel/test-worker-message-port-multiple-sharedarraybuffers.js`
- `parallel/test-worker-message-port-terminate-transfer-list.js`
- `parallel/test-worker-message-port-transfer-terminate.js`
- `parallel/test-worker-message-port.js#block_00_block_00`
- `parallel/test-worker-message-port.js#block_03_block_03`
- `parallel/test-worker-mjs-workerdata.js`
- `parallel/test-worker-nearheaplimit-deadlock.js`
- `parallel/test-worker-nested-on-process-exit.js`
- `parallel/test-worker-nested-uncaught.js`
- `parallel/test-worker-nexttick-terminate.js`
- `parallel/test-worker-no-sab.js`
- `parallel/test-worker-non-fatal-uncaught-exception.js`
- `parallel/test-worker-on-process-exit.js`
- `parallel/test-worker-onmessage-not-a-function.js`
- `parallel/test-worker-onmessage.js`
- `parallel/test-worker-parent-port-ref.js`
- `parallel/test-worker-process-env-shared.js`
- `parallel/test-worker-process-exit-async-module.js`
- `parallel/test-worker-ref-onexit.js`
- `parallel/test-worker-ref.js`
- `parallel/test-worker-relative-path-double-dot.js`
- `parallel/test-worker-relative-path.js`
- `parallel/test-worker-safe-getters.js`
- `parallel/test-worker-sharedarraybuffer-from-worker-thread.js`
- `parallel/test-worker-stack-overflow-stack-size.js`
- `parallel/test-worker-stack-overflow.js`
- `parallel/test-worker-stdio-from-preload-module.js`
- `parallel/test-worker-syntax-error-file.js`
- `parallel/test-worker-syntax-error.js`
- `parallel/test-worker-terminate-http2-respond-with-file.js`
- `parallel/test-worker-terminate-microtask-loop.js`
- `parallel/test-worker-terminate-nested.js`
- `parallel/test-worker-terminate-null-handler.js`
- `parallel/test-worker-terminate-ref-public-port.js`
- `parallel/test-worker-terminate-source-map.js`
- `parallel/test-worker-terminate-timers.js`
- `parallel/test-worker-terminate-unrefed.js`
- `parallel/test-worker-track-unmanaged-fds.js`
- `parallel/test-worker-uncaught-exception-async.js`
- `parallel/test-worker-uncaught-exception.js`
- `parallel/test-worker-unsupported-things.js`
- `parallel/test-worker-vm-context-terminate.js`
- `parallel/test-worker-voluntarily-exit-followed-by-addition.js`
- `parallel/test-worker-voluntarily-exit-followed-by-throw.js`
- `parallel/test-worker-workerdata-messageport.js#block_00_block_00`
- `parallel/test-worker-workerdata-messageport.js#block_01_block_01`
- `parallel/test-worker-workerdata-messageport.js#block_04_block_04`
- `parallel/test-worker.js`
- `parallel/test-zlib-brotli-from-brotli.js`
- `parallel/test-zlib-brotli-from-string.js`
- `parallel/test-zlib-brotli.js`
- `parallel/test-zlib-brotli.js#block_00_block_00`
- `parallel/test-zlib-brotli.js#block_01_block_01`
- `parallel/test-zlib-brotli.js#block_02_block_02`
- `parallel/test-zlib-close-after-error.js`
- `parallel/test-zlib-close-after-write.js`
- `parallel/test-zlib-close-in-ondata.js`
- `parallel/test-zlib-const.js`
- `parallel/test-zlib-convenience-methods.js`
- `parallel/test-zlib-crc32.js`
- `parallel/test-zlib-create-raw.js`
- `parallel/test-zlib-create-raw.js#block_00_block_00`
- `parallel/test-zlib-create-raw.js#block_01_block_01`
- `parallel/test-zlib-deflate-constructors.js`
- `parallel/test-zlib-destroy-pipe.js`
- `parallel/test-zlib-destroy.js`
- `parallel/test-zlib-destroy.js#block_00_block_00`
- `parallel/test-zlib-destroy.js#block_01_block_01`
- `parallel/test-zlib-dictionary-fail.js`
- `parallel/test-zlib-dictionary-fail.js#block_00_block_00`
- `parallel/test-zlib-dictionary-fail.js#block_01_block_01`
- `parallel/test-zlib-dictionary-fail.js#block_02_block_02`
- `parallel/test-zlib-empty-buffer.js`
- `parallel/test-zlib-flush-drain.js`
- `parallel/test-zlib-flush-flags.js`
- `parallel/test-zlib-from-gzip.js`
- `parallel/test-zlib-from-string.js`
- `parallel/test-zlib-invalid-arg-value-brotli-compress.js`
- `parallel/test-zlib-invalid-input-memory.js`
- `parallel/test-zlib-invalid-input.js`
- `parallel/test-zlib-no-stream.js`
- `parallel/test-zlib-not-string-or-buffer.js`
- `parallel/test-zlib-premature-end.js`
- `parallel/test-zlib-random-byte-pipes.js`
- `parallel/test-zlib-reset-before-write.js`
- `parallel/test-zlib-sync-no-event.js`
- `parallel/test-zlib-truncated.js`
- `parallel/test-zlib-write-after-flush.js`
- `parallel/test-zlib-zero-byte.js`
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
- `sequential/test-https-server-keep-alive-timeout.js`
- `sequential/test-net-better-error-messages-port.js`
- `sequential/test-net-connect-handle-econnrefused.js`
- `sequential/test-net-connect-local-error.js`
- `sequential/test-net-reconnect-error.js`
- `sequential/test-net-server-address.js#block_01_test_on_ipv6_server`
- `sequential/test-net-server-address.js#block_02_test_without_hostname_or_ip`
- `sequential/test-net-server-address.js#block_03_test_without_hostname_or_port`
- `sequential/test-net-server-address.js#block_04_test_without_hostname_but_with_a_false_y_port`
- `sequential/test-net-server-listen-ipv6-link-local.js`
- `sequential/test-process-warnings.js`
- `sequential/test-require-cache-without-stat.js`
- `sequential/test-stream2-fs.js`
- `sequential/test-vm-break-on-sigint.js`
- `sequential/test-worker-fshandles-error-on-termination.js`
- `sequential/test-worker-fshandles-open-close-on-termination.js`

## Failing Tests

### abort

- `parallel/test-abortcontroller.js`: Expected values to be strictly equal: + actual - expected  + AbortSignal {} - undefined  AssertionError: Expected values to be strictly equal: + actual - expected  + AbortSignal {} - undefined      at...
- `parallel/test-abortcontroller.js#test_12_abortsignal_timeout_does_not_prevent_the_signal_from_being_c`: Expected values to be strictly equal: + actual - expected  + AbortSignal {} - undefined  AssertionError: Expected values to be strictly equal: + actual - expected  + AbortSignal {} - undefined      at...
- `parallel/test-abortcontroller.js#test_13_abortsignal_with_a_timeout_is_not_collected_while_there_is_a`: Expected values to be strictly equal: + actual - expected  + AbortSignal {} - undefined  AssertionError: Expected values to be strictly equal: + actual - expected  + AbortSignal {} - undefined      at...
- `parallel/test-aborted-util.js#test_00_aborted_works_when_provided_a_resource`: not a function     at <anonymous> (<input>:23:27)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:21:1)     at loadModule (node:module:5...
- `parallel/test-aborted-util.js#test_01_aborted_with_gc_cleanup`: not a function     at <anonymous> (<input>:34:34)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:30:1)     at loadModule (node:module:5...
- `parallel/test-aborted-util.js#test_02_fails_with_error_if_not_provided_abortsignal`: not a function     at <anonymous> (<input>:53:21)     at map (native)     at <anonymous> (<input>:52:95)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at an...
- `parallel/test-aborted-util.js#test_03_fails_if_not_provided_a_resource`: not a function     at <anonymous> (<input>:63:21)     at map (native)     at <anonymous> (<input>:62:72)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at an...
- `parallel/test-aborted-util.js#test_04_does_not_hang_forever`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at <anonymous> (<input>:87:30)     at call (na...
- `parallel/test-abortsignal-cloneable.js#test_00_can_create_a_transferable_abort_controller`: not a function     at <anonymous> (<input>:19:14)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:18:1)     at loadModule (node:module:5...
- `parallel/test-abortsignal-cloneable.js#test_01_can_create_a_transferable_abort_signal`: not a function     at <anonymous> (<input>:62:54)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:61:1)     at loadModule (node:module:5...
- `parallel/test-abortsignal-cloneable.js#test_02_a_cloned_abortsignal_does_not_keep_the_event_loop_open`: not a function     at <anonymous> (<input>:79:14)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:78:1)     at loadModule (node:module:5...

### assert

- `parallel/test-assert-deep-with-error.js`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' + +     '... Skipped lines\n'...
- `parallel/test-assert-deep-with-error.js#test_00_handle_error_causes`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' + +     '... Skipped lines\n'...
- `parallel/test-assert-deep-with-error.js#test_01_handle_undefined_causes`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' + +     '... Skipped lines\n'...
- `parallel/test-assert-deep.js`: Expected values to be strictly deep-equal: + actual - expected ... Skipped lines    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' +       '\n...
- `parallel/test-assert-deep.js#test_22_check_extra_properties_on_errors`: Expected values to be strictly deep-equal: + actual - expected ... Skipped lines    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' +       '\n...
- `parallel/test-assert-deep.js#test_23_check_proxies`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     message: 'Expected values to be strictly deep-equal:\n' +       '+ actual - expected\n' +       '\n' + +     '+ Proxy...
- `parallel/test-assert-deep.js#test_36_verify_object_types_being_identical_on_both_sides`: not a TypedArray     at get length (native)     at formatTypedArray (__wasm_rquickjs_builtin/internal/util/inspect:1486:24)     at formatRaw (__wasm_rquickjs_builtin/internal/util/inspect:978:28)     ...
- `parallel/test-assert-if-error.js`: Expected values to be strictly equal: + actual - expected  + 'Error: test error\n' + +   '    at c (<input>:15:19)\n' + +   '    at b (<input>:16:7)\n' + +   '    at a (<input>:17:5)\n' + +   '    at ...
- `parallel/test-assert-if-error.js#test_00_test_that_assert_iferror_has_the_correct_stack_trace_of_both`: Expected values to be strictly equal: + actual - expected  + 'Error: test error\n' + +   '    at c (<input>:16:19)\n' + +   '    at b (<input>:17:7)\n' + +   '    at a (<input>:18:5)\n' + +   '    at ...
- `parallel/test-assert.js`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_ASSERTION',     message: 'Expected "actual" to be reference-equal to "expected":\n' +       '+ actual - ex...
- `parallel/test-assert.js#test_03_assert_throws`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_ASSERTION',     message: 'Expected "actual" to be reference-equal to "expected":\n' +       '+ actual - ex...

### child_process

- `parallel/test-child-process-constructor.js#block_00_block_00`: ChildProcess is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at ChildProcess (node:child_process:989:15)     at anonymous (<input>:12:21)     ...
- `parallel/test-child-process-constructor.js#block_01_block_01`: ChildProcess is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at ChildProcess (node:child_process:989:15)     at anonymous (<input>:14:21)     ...
- `parallel/test-child-process-constructor.js#block_02_block_02`: ChildProcess is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at ChildProcess (node:child_process:989:15)     at anonymous (<input>:16:21)     ...
- `parallel/test-child-process-constructor.js#block_03_block_03`: ChildProcess is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at ChildProcess (node:child_process:989:15)     at anonymous (<input>:18:21)     ...
- `parallel/test-child-process-cwd.js#block_00_assume_does_not_exist_doesn_t_exist_expect_exitcode_1_and_er`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at testCwd (<input>:38:17)     at anonymous (<...
- `parallel/test-child-process-cwd.js#block_01_block_01`: The input did not match the regular expression /The URL must be of scheme file/. Input:  'Error: spawn is not supported in WebAssembly environment'  AssertionError: The input did not match the regular...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_00_block_00`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   cause: DOMException [AbortError]: This operation was a...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_01_block_01`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   cause: Error: boom -       at anonymous (<input>:23:19...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_02_block_02`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   cause: 'boom', -   name: 'AbortError'   }       at rej...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_03_block_03`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:27:10)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_04_block_04`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:30:10)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_05_block_05`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   name: 'AbortError'   }       at rejects (native)
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_06_block_06`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   cause: Error: boom -       at anonymous (<input>:33:19...
- `parallel/test-child-process-exec-abortcontroller-promisified.js#block_07_block_07`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   cause: 'boom', -   name: 'AbortError'   }       at rej...
- `parallel/test-child-process-exec-maxbuf.js`: cannot read property 'setEncoding' of null     at anonymous (<input>:124:3)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-child-process-exec-maxbuf.js#block_08_block_08`: cannot read property 'setEncoding' of null     at anonymous (<input>:63:3)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at ru...
- `parallel/test-child-process-exec-maxbuf.js#block_09_block_09`: cannot read property 'setEncoding' of null     at anonymous (<input>:65:3)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at ru...
- `parallel/test-child-process-execFile-promisified-abortController.js#block_00_block_00`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   name: 'AbortError'   }       at rejects (native)
- `parallel/test-child-process-execFile-promisified-abortController.js#block_01_block_01`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   name: 'AbortError'   }       at rejects (native)
- `parallel/test-child-process-execFile-promisified-abortController.js#block_02_block_02`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:26:10)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-child-process-execFile-promisified-abortController.js#block_03_block_03`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:28:10)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-child-process-execfile-maxbuf.js#block_06_block_06`: cannot read property 'setEncoding' of null     at anonymous (<input>:40:3)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at ru...
- `parallel/test-child-process-execfile-maxbuf.js#block_07_block_07`: cannot read property 'setEncoding' of null     at anonymous (<input>:42:3)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at ru...
- `parallel/test-child-process-execfile.js#block_05_block_05`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:30:10)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-child-process-execfile.js#block_07_verify_the_execfile_stdout_is_the_same_as_execfilesync`: execFileSync is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at execFileSync (node:child_process:1180:11)     at <anonymous> (<input>:41:45)  ...
- `parallel/test-child-process-execfilesync-maxbuf.js#block_00_verify_that_an_error_is_returned_if_maxbuffer_is_surpassed`: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^  AssertionError: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^    ...
- `parallel/test-child-process-execfilesync-maxbuf.js#block_01_verify_that_a_maxbuffer_size_of_infinity_works`: execFileSync is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at execFileSync (node:child_process:1180:11)     at anonymous (<input>:25:28)    ...
- `parallel/test-child-process-execfilesync-maxbuf.js#block_02_default_maxbuffer_size_is_1024_1024`: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^  AssertionError: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^    ...
- `parallel/test-child-process-execsync-maxbuf.js#block_00_verify_that_an_error_is_returned_if_maxbuffer_is_surpassed`: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^  AssertionError: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^    ...
- `parallel/test-child-process-execsync-maxbuf.js#block_01_verify_that_a_maxbuffer_size_of_infinity_works`: execSync is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at execSync (node:child_process:1184:11)     at anonymous (<input>:23:5)     at loadM...
- `parallel/test-child-process-execsync-maxbuf.js#block_02_default_maxbuffer_size_is_1024_1024`: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^  AssertionError: Expected values to be strictly equal: + actual - expected  + 'ENOSYS' - 'ENOBUFS'       ^    ...
- `parallel/test-child-process-execsync-maxbuf.js#block_03_default_maxbuffer_size_is_1024_1024`: execSync is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at execSync (node:child_process:1184:11)     at anonymous (<input>:28:27)     at load...
- `parallel/test-child-process-fork-args.js#block_00_and_be_of_type_string`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:27:12)     at forEach (native)     at anonymous (<input>:26:21)     at loadM...
- `parallel/test-child-process-fork-args.js#block_01_correctly_if_args_is_undefined_or_null`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ENOSYS', +   name: 'Error' -   code: 'ERR_INVALID_ARG_TYPE', -   name: 'TypeError'   }  AssertionError: Expect...
- `parallel/test-child-process-fork-args.js#block_02_ensure_that_the_third_argument_should_be_type_of_object_if_p`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:32:7)     at forEach (native)     at anonymous (<input>:30:20)     at loadMo...
- `parallel/test-child-process-promisified.js#block_00_block_00`: The expression evaluated to a falsy value:    assert(promise.child instanceof child_process.ChildProcess)  AssertionError: The expression evaluated to a falsy value:    assert(promise.child instanceof...
- `parallel/test-child-process-promisified.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(promise.child instanceof child_process.ChildProcess)  AssertionError: The expression evaluated to a falsy value:    assert(promise.child instanceof...
- `parallel/test-child-process-promisified.js#block_02_block_02`: The expression evaluated to a falsy value:    assert(err.message.includes('doesntexist'))  AssertionError: The expression evaluated to a falsy value:    assert(err.message.includes('doesntexist'))    ...
- `parallel/test-child-process-promisified.js#block_03_block_03`: The expression evaluated to a falsy value:    assert(err.message.includes('doesntexist'))  AssertionError: The expression evaluated to a falsy value:    assert(err.message.includes('doesntexist'))    ...
- `parallel/test-child-process-promisified.js#block_04_block_04`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - '42\n'      at <anonymous> (<input>:25:26)     at wrapper (<input>:379:34)     at ...
- `parallel/test-child-process-promisified.js#block_05_block_05`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - '42\n'      at <anonymous> (<input>:27:26)     at wrapper (<input>:379:34)     at ...
- `parallel/test-child-process-send-returns-boolean.js#block_01_block_01`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:24:19)     at loadModule...
- `parallel/test-child-process-spawn-controller.js#block_00_block_00`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:16:20)     at loadModule...
- `parallel/test-child-process-spawn-controller.js#block_01_block_01`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:17:20)     at loadModule...
- `parallel/test-child-process-spawn-controller.js#block_02_block_02`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:18:20)     at loadModule...
- `parallel/test-child-process-spawn-controller.js#block_03_block_03`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:21:20)     at loadModule...
- `parallel/test-child-process-spawn-controller.js#block_04_block_04`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:23:20)     at loadModule...
- `parallel/test-child-process-spawn-controller.js#block_05_block_05`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:23:20)     at loadModule...
- `parallel/test-child-process-spawn-controller.js#block_06_block_06`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:28:20)     at loadModule...
- `parallel/test-child-process-spawn-controller.js#block_07_block_07`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:30:20)     at loadModule...
- `parallel/test-child-process-spawn-controller.js#block_08_block_08`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:32:20)     at loadModule...
- `parallel/test-child-process-spawn-timeout-kill-signal.js#block_00_block_00`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:14:53)     at loadModule...
- `parallel/test-child-process-spawn-timeout-kill-signal.js#block_01_block_01`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:16:53)     at loadModule...
- `parallel/test-child-process-spawn-timeout-kill-signal.js#block_02_block_02`: The input did not match the regular expression /ERR_OUT_OF_RANGE/. Input:  'Error: spawn is not supported in WebAssembly environment'  AssertionError: The input did not match the regular expression /E...
- `parallel/test-child-process-spawn-timeout-kill-signal.js#block_03_block_03`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:22:53)     at loadModule...
- `parallel/test-child-process-spawnsync-maxbuf.js#block_00_verify_that_an_error_is_returned_if_maxbuffer_is_surpassed`: maxBuffer should error AssertionError: maxBuffer should error     at anonymous (<input>:24:13)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:modu...
- `parallel/test-child-process-spawnsync-maxbuf.js#block_02_default_maxbuffer_size_is_1024_1024`: maxBuffer should error AssertionError: maxBuffer should error     at anonymous (<input>:31:13)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:modu...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_00_block_00`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (<input>:19:22)     at anonymous (<input>:30:3) ...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_01_block_01`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (<input>:19:22)     at anonymous (<input>:32:3) ...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_02_block_02`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (<input>:19:22)     at anonymous (<input>:74:3) ...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_03_block_03`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (<input>:19:22)     at anonymous (<input>:76:3) ...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_04_block_04`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (<input>:19:22)     at anonymous (<input>:78:3) ...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_05_block_05`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (<input>:19:22)     at anonymous (<input>:80:3) ...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_06_block_06`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (<input>:19:22)     at anonymous (<input>:82:3) ...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_07_block_07`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (<input>:19:22)     at anonymous (<input>:84:3) ...
- `parallel/test-child-process-spawnsync-validation-errors.js#block_08_block_08`: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'  AssertionError: Expected values to be strictly equal:  'ENOSYS' !== 'ENOENT'      at pass (<input>:19:22)     at anonymous (<input>:88:3) ...
- `parallel/test-child-process-spawnsync.js#block_00_block_00`: Expected values to be strictly equal:  null !== 0  AssertionError: Expected values to be strictly equal:  null !== 0      at anonymous (<input>:36:20)     at loadModule (node:module:551:24)     at loc...
- `parallel/test-child-process-spawnsync.js#block_01_block_01`: Expected values to be strictly equal:  null !== 0  AssertionError: Expected values to be strictly equal:  null !== 0      at anonymous (<input>:36:20)     at loadModule (node:module:551:24)     at loc...
- `parallel/test-child-process-stdio.js#block_00_test_stdio_piping`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:31:17)     at loadModule...
- `parallel/test-child-process-stdio.js#block_01_test_stdio_ignoring`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:34:17)     at loadModule...
- `parallel/test-child-process-stdio.js#block_02_asset_options_invariance`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:38:3)     at loadModule ...
- `parallel/test-child-process-stdio.js#block_03_test_stdout_buffering`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:41:17)     at loadModule...
- `sequential/test-child-process-execsync.js#block_00_block_00`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_01_block_01`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_02_block_02`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_03_block_03`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_04_see_https_github_com_nodejs_node_v0_x_archive_issues_7824`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_05_see_https_github_com_nodejs_node_v0_x_archive_issues_7966`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...
- `sequential/test-child-process-execsync.js#block_06_verify_the_execfilesync_behavior_when_the_child_exits_with_a`: The input did not match the regular expression /spawnSync bad_shell ENOENT/. Input:  'Error: execSync is not supported in WebAssembly environment'  AssertionError: The input did not match the regular ...

### crypto

- `parallel/test-crypto-dh-modp2.js#block_01_block_01`: No private key set     at <anonymous> (__wasm_rquickjs_builtin/web_crypto:2281:25)     at anonymous (<input>:19:51)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     ...
- `parallel/test-crypto-dh-modp2.js#block_02_block_02`: No private key set     at <anonymous> (__wasm_rquickjs_builtin/web_crypto:2281:25)     at anonymous (<input>:21:51)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     ...
- `parallel/test-crypto-sign-verify.js`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ERR_INVALID_ARG_TYPE', +   name: 'TypeError' -   code: 'ERR_CRYPTO_SIGN_KEY_REQUIRED', -   name: 'Error'   }  ...
- `parallel/test-crypto-sign-verify.js#block_09_test_throws_exception_when_key_options_is_null`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ERR_INVALID_ARG_TYPE', +   name: 'TypeError' -   code: 'ERR_CRYPTO_SIGN_KEY_REQUIRED', -   name: 'Error'   }  ...
- `parallel/test-crypto-sign-verify.js#block_10_block_10`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'not a function', -   code: 'ERR_INVALID_ARG_TYPE', -   message: 'The "algorithm" argument must be of type s...
- `parallel/test-crypto-sign-verify.js#block_11_block_11`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:76:5)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (...
- `parallel/test-crypto-sign-verify.js#block_12_block_12`: Failed to parse private key     at createPrivateKeyParseError (__wasm_rquickjs_builtin/web_crypto:1602:21)     at createPrivateKeyFromData (__wasm_rquickjs_builtin/web_crypto:5126:15)     at createPri...
- `parallel/test-crypto-sign-verify.js#block_15_regression_test_for_https_github_com_nodejs_node_issues_4079`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ERR_CRYPTO_SIGN_KEY_REQUIRED', +   message: 'Sign failed' -   code: 'ERR_OSSL_RSA_DIGEST_TOO_BIG_FOR_RSA_KEY',...
- `parallel/test-crypto-sign-verify.js#block_17_block_17`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:177:12)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require...
- `parallel/test-crypto-sign-verify.js#block_18_block_18`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ERR_CRYPTO_SIGN_KEY_REQUIRED', +   message: 'Sign key has no native handle (type=dh)' -   code: 'ERR_OSSL_EVP_...

### dgram

- `parallel/test-dgram-address.js#block_00_block_00`: Unhandled promise rejection: AssertionError: Unexpected error on udp4 socket. Error: bind EACCES 127.0.0.1     at <anonymous> (<input>:46:57)     at emit (node:events:332:36)     at emit (node:domain:...
- `parallel/test-dgram-close-signal.js#block_00_block_00`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:12:5)     at loadModule (node:module:551:24)     at localRequire (node:module:...
- `parallel/test-dgram-custom-lookup.js`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:47:44)     at forEach (native)     at anonymous (<input>:40:59)     at loadM...
- `parallel/test-dgram-custom-lookup.js#block_02_block_02`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:22:44)     at forEach (native)     at anonymous (<input>:15:59)     at loadM...
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
- `parallel/test-dgram-multicast-loopback.js#block_00_block_00`: The input did not match the regular expression /^Error: setMulticastLoopback EBADF$/. Input:  'Error: setMulticastLoopback ENOSYS'  AssertionError: The input did not match the regular expression /^Err...
- `parallel/test-dgram-setBroadcast.js#block_00_block_00`: The input did not match the regular expression /^Error: setBroadcast EBADF$/. Input:  'Error: setBroadcast ENOSYS'  AssertionError: The input did not match the regular expression /^Error: setBroadcast...

### dns

- `parallel/test-dns-setlocaladdress.js`: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at anonymous (<input>:21:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)...
- `parallel/test-dns-setlocaladdress.js#block_01_verify_that_setlocaladdress_throws_if_called_with_an_invalid`: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at anonymous (<input>:16:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)...
- `parallel/test-dns-setservers-type-check.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'servers must be an array', -   code: 'ERR_INVALID_ARG_TYPE', -   message: 'The "servers" argument must be a...
- `parallel/test-dns-setservers-type-check.js#block_01_block_01`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:32:7)     at forEach (native)     at anonymous (<input>:24:5)     at loadMod...
- `parallel/test-dns-setservers-type-check.js#block_02_this_test_for_dns_promises`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:43:12)     at forEach (native)     at anonymous (<input>:36:5)     at loadMo...
- `parallel/test-dns.js#block_00_verify_that_setservers_handles_arrays_with_holes_and_other_o`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...
- `parallel/test-dns.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...
- `parallel/test-dns.js#block_02_block_02`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...
- `parallel/test-dns.js#block_03_block_03`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...
- `parallel/test-dns.js#block_04_block_04`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...
- `parallel/test-dns.js#block_05_dns_lookup_should_accept_only_falsey_and_string_values`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...
- `parallel/test-dns.js#block_06_dns_lookup_should_accept_falsey_values`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...
- `parallel/test-dns.js#block_07_block_07`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...
- `parallel/test-dns.js#block_08_block_08`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...
- `parallel/test-dns.js#block_09_block_09`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...
- `parallel/test-dns.js#block_10_block_10`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...
- `parallel/test-dns.js#block_11_block_11`: The expression evaluated to a falsy value:    assert(existing.length > 0)  AssertionError: The expression evaluated to a falsy value:    assert(existing.length > 0)      at anonymous (<input>:34:26)  ...

### domain

- `parallel/test-domain-promise.js#block_00_block_00`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Domain { -   _captureRejections: false, -   _disposed: false, -   _events: [Object...
- `parallel/test-domain-promise.js#block_01_block_01`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Domain { -   _captureRejections: false, -   _disposed: false, -   _events: [Object...
- `parallel/test-domain-promise.js#block_03_block_03`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Domain { -   _captureRejections: false, -   _disposed: false, -   _events: [Object...
- `parallel/test-domain-promise.js#block_05_block_05`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Domain { -   _captureRejections: false, -   _disposed: false, -   _events: [Object...
- `parallel/test-domain-promise.js#block_06_block_06`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Domain { -   _captureRejections: false, -   _disposed: false, -   _events: [Object...
- `parallel/test-domain-promise.js#block_09_block_09`: Unhandled promise rejection:     at <anonymous> (<input>:36:24)     at apply (native)     at wrapper (<input>:379:34)     at apply (native)     at run (node:domain:170:29)     at anonymous (<input>:35...

### fs

- `parallel/test-file.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected  + Blob { +   size: [Getter: <Inspection threw (private class field '#size' does not exist)>], - Object [Blob] { -   [Symbol(nodejs.util....
- `parallel/test-file.js#block_02_block_02`: Expected values to be strictly equal:  false !== true  AssertionError: Expected values to be strictly equal:  false !== true      at anonymous (<input>:23:24)     at loadModule (node:module:551:24)   ...
- `parallel/test-file.js#block_05_block_05`: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   'lastModified', -   'name' - ]  AssertionError: Expected values to be strictly deep-equal: + actual - expected  + [] - [ - ...
- `parallel/test-file.js#block_07_block_07`: Unhandled promise rejection:     at text (__wasm_rquickjs_builtin/http_blob:116:45)     at call (native)     at anonymous (<input>:28:23)     at loadModule (node:module:551:24)     at localRequire (no...
- `parallel/test-file.js#block_10_block_10`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:43:12)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-file.js#block_12_block_12`: The expression evaluated to a falsy value:    assert(inspect(file).startsWith('File { size: 0, type: \'\', name: \'\', lastModified:'))  AssertionError: The expression evaluated to a falsy value:    a...
- `parallel/test-file.js#block_14_block_14`: Expected values to be strictly equal:  2 !== 1  AssertionError: Expected values to be strictly equal:  2 !== 1      at anonymous (<input>:46:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-fs-readfile.js#block_03_block_03`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:65:10)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-fs-stat-bigint.js#block_00_block_00`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at statSync (node:fs:1270:44)     at runSyncTest (<input>:100:40)     at anon...
- `parallel/test-fs-stat-bigint.js#block_01_block_01`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (<input>:100:40)     at ano...
- `parallel/test-fs-stat-bigint.js#block_02_block_02`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (<input>:100:40)     at ano...
- `parallel/test-fs-stat-bigint.js#block_03_block_03`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (<input>:100:40)     at ano...
- `parallel/test-fs-stat-bigint.js#block_04_block_04`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (<input>:100:40)     at ano...
- `parallel/test-fs-stat-bigint.js#block_05_block_05`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (<input>:100:40)     at ano...
- `parallel/test-fs-stat-bigint.js#block_06_block_06`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (<input>:100:40)     at ano...
- `parallel/test-fs-stat-bigint.js#block_07_block_07`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (<input>:100:40)     at ano...
- `parallel/test-fs-stat-bigint.js#block_08_block_08`: cannot convert BigInt to number     at Date (native)     at Stats (node:fs:731:22)     at <anonymous> (node:fs:755:40)     at lstatSync (node:fs:1283:44)     at runSyncTest (<input>:100:40)     at ano...
- `parallel/test-fs-statfs.js#block_00_synchronous`: not a function     at anonymous (<input>:20:42)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-fs-statfs.js#block_01_synchronous_bigint`: not a function     at anonymous (<input>:20:42)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-fs-stream-fs-options.js#block_00_block_00`: Missing expected exception (TypeError): createWriteStream options.fs.open should throw if isn't a function AssertionError: Missing expected exception (TypeError): createWriteStream options.fs.open sho...
- `parallel/test-fs-stream-fs-options.js#block_01_block_01`: Missing expected exception (TypeError): createWriteStream options.fs.writev should throw if isn't a function AssertionError: Missing expected exception (TypeError): createWriteStream options.fs.writev...
- `parallel/test-fs-stream-fs-options.js#block_02_block_02`: Missing expected exception (TypeError): createReadStream options.fs.open should throw if isn't a function AssertionError: Missing expected exception (TypeError): createReadStream options.fs.open shoul...
- `parallel/test-fs-stream-options.js#block_00_block_00`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:13:5)     at loadModule (node:module:551:24)     at localRequire (node:module:...
- `parallel/test-fs-stream-options.js#block_01_block_01`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:15:5)     at loadModule (node:module:551:24)     at localRequire (node:module:...
- `parallel/test-fs-truncate.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_02_block_02`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_03_block_03`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_04_block_04`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:157:7)     at forEach (native)     at anonymous (<input>:154:29)     at load...
- `parallel/test-fs-truncate.js#block_05_block_05`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_06_block_06`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_07_block_07`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_08_block_08`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-truncate.js#block_09_block_09`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_TYPE', +   message: 'The "callback" argument must be of type function. Received undefined', - ...
- `parallel/test-fs-utimes.js#block_00_utimes_only_error_cases`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:188:5)     at forEach (native)     at anonymous (<input>:178:34)     at load...
- `parallel/test-fs-utimes.js#block_01_futimes_only_error_cases`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:179:5)     at forEach (native)     at anonymous (<input>:169:34)     at load...
- `parallel/test-fs-write-file-sync.js#block_00_test_writefilesync`: Expected values to be strictly equal:  420 !== 493  AssertionError: Expected values to be strictly equal:  420 !== 493      at anonymous (<input>:52:47)     at loadModule (node:module:551:24)     at l...
- `parallel/test-fs-write-file-sync.js#block_01_test_appendfilesync`: Expected values to be strictly equal:  420 !== 493  AssertionError: Expected values to be strictly equal:  420 !== 493      at anonymous (<input>:55:47)     at loadModule (node:module:551:24)     at l...
- `parallel/test-fs-write-file-sync.js#block_02_test_writefilesync_with_file_descriptor`: Expected values to be strictly equal:  420 !== 493  AssertionError: Expected values to be strictly equal:  420 !== 493      at anonymous (<input>:76:47)     at loadModule (node:module:551:24)     at l...
- `parallel/test-fs-write-file-sync.js#block_03_test_writefilesync_with_flags`: Expected values to be strictly equal: + actual - expected  + 'world!' - 'hello world!'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'world!' - 'hello world!'      at a...
- `parallel/test-fs-write-file-sync.js#block_04_test_writefilesync_with_no_flags`: Only 'utf8' encoding is supported     at writeFileSync (node:fs:1053:23)     at anonymous (<input>:66:22)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require...
- `parallel/test-fs-write-file-sync.js#block_05_test_writefilesync_with_an_invalid_input`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-fs-write.js#block_00_block_00`: Expected "actual" to be strictly unequal to:  undefined AssertionError: Expected "actual" to be strictly unequal to:  undefined     at anonymous (<input>:46:23)     at loadModule (node:module:551:24) ...
- `parallel/test-fs-write.js#block_01_block_01`: Expected "actual" to be strictly unequal to:  undefined AssertionError: Expected "actual" to be strictly unequal to:  undefined     at anonymous (<input>:46:23)     at loadModule (node:module:551:24) ...
- `parallel/test-fs-write.js#block_02_block_02`: Expected "actual" to be strictly unequal to:  undefined AssertionError: Expected "actual" to be strictly unequal to:  undefined     at anonymous (<input>:46:23)     at loadModule (node:module:551:24) ...
- `parallel/test-fs-write.js#block_03_block_03`: Expected "actual" to be strictly unequal to:  undefined AssertionError: Expected "actual" to be strictly unequal to:  undefined     at anonymous (<input>:46:23)     at loadModule (node:module:551:24) ...
- `parallel/test-fs-write.js#block_04_block_04`: Expected "actual" to be strictly unequal to:  undefined AssertionError: Expected "actual" to be strictly unequal to:  undefined     at anonymous (<input>:46:23)     at loadModule (node:module:551:24) ...
- `sequential/test-fs-opendir-recursive.js#block_00_block_00`: Expected values to be strictly equal:  54 !== 169  AssertionError: Expected values to be strictly equal:  54 !== 169      at assertDirents (<input>:137:22)     at processDirSync (<input>:155:17)     a...
- `sequential/test-fs-opendir-recursive.js#block_04_block_04`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal:  54 !== 169      at assertDirents (<input>:137:22)     at test (<input>:200:19)
- `sequential/test-fs-opendir-recursive.js#block_05_this_test_asserts_that_the_buffer_size_option_is_respected`: Expected values to be strictly equal:  54 !== 169  AssertionError: Expected values to be strictly equal:  54 !== 169      at assertDirents (<input>:137:22)     at processDirSync (<input>:155:17)     a...
- `sequential/test-fs-watch.js#block_01_block_01`: ENOENT: no such file or directory, chdir '/' -> '/tmp/w'     at chdir (node:process:319:112)     at anonymous (<input>:63:17)     at loadModule (node:module:551:24)     at localRequire (node:module:59...

### http

- `parallel/test-http-1.0-keep-alive.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-1.0.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-1.0.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-1.0.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-1.0.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-abort-before-end.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-abort-stream-end.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-aborted.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-aborted.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-aborted.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-agent-no-protocol.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-agent-null.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-agent-timeout.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-agent-timeout.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-agent-timeout.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-agent-timeout.js#block_03_block_03`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-allow-content-length-304.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-allow-req-after-204-res.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-bind-twice.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-chunk-extensions-limit.js#block_00_verify_that_chunk_extensions_are_limited_in_size_when_sent_a`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-chunk-extensions-limit.js#block_01_verify_that_chunk_extensions_are_limited_in_size_when_sent_i`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-chunk-extensions-limit.js#block_02_verify_the_chunk_extensions_is_correctly_reset_after_a_chunk`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-chunked-304.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-chunked-smuggling.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-chunked.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-abort-destroy.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-abort-destroy.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-abort-destroy.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-abort-destroy.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-abort-destroy.js#block_03_block_03`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-abort-destroy.js#block_04_block_04`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-abort-destroy.js#block_05_block_05`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-abort-event.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-abort2.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-aborted-event.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-aborted-event.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-agent.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-check-http-token.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-close-with-default-agent.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-encoding.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-get-url.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-input-function.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-keep-alive-hint.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-race-2.js`: Expected values to be strictly equal: + actual - expected  + '1111111111111111' - ''  AssertionError: Expected values to be strictly equal: + actual - expected  + '1111111111111111' - ''      at <anon...
- `parallel/test-http-client-race.js`: Expected values to be strictly equal: + actual - expected  + '1111111111111111' - ''  AssertionError: Expected values to be strictly equal: + actual - expected  + '1111111111111111' - ''      at <anon...
- `parallel/test-http-client-reject-unexpected-agent.js`: Expected values to be strictly equal:  0 !== 4  AssertionError: Expected values to be strictly equal:  0 !== 4      at <anonymous> (<input>:70:22)     at emit (node:events:332:36)     at emit (node:do...
- `parallel/test-http-client-request-options.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-res-destroyed.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-res-destroyed.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-timeout-connect-listener.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-upload-buf.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-client-upload.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-contentLength0.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-date-header.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-double-content-length.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-dummy-characters-smuggling.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-dummy-characters-smuggling.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-early-hints.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-early-hints.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-early-hints.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-early-hints.js#block_03_block_03`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-early-hints.js#block_04_block_04`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-early-hints.js#block_05_block_05`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-eof-on-connect.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-extra-response.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-head-request.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-head-response-has-no-body-end-implicit-headers.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-head-response-has-no-body-end.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-head-response-has-no-body.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-head-throw-on-response-body-write.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-head-throw-on-response-body-write.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-head-throw-on-response-body-write.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-head-throw-on-response-body-write.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-header-obstext.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-header-owstext.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-header-read.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-hex-write.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-highwatermark.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-host-headers.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-incoming-message-options.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-incoming-pipelined-socket-destroy.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-insecure-parser-per-stream.js#block_04_test_5_invalid_argument_type`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:30:7)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (...
- `parallel/test-http-insecure-parser.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-invalidheaderfield.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-listening.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-localaddress-bind-error.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-malformed-request.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-missing-header-separator-cr.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-missing-header-separator-cr.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-missing-header-separator-cr.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-missing-header-separator-lf.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-missing-header-separator-lf.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-missing-header-separator-lf.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-no-content-length.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-destroyed.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-destroyed.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-destroyed.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-destroyed.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-end-types.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-finish.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-finished.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-message-capture-rejection.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-message-capture-rejection.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-properties.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-properties.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-properties.js#block_04_block_04`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-writableFinished.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-outgoing-write-types.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-parser-finish-error.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-parser-free.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-parser.js#block_00_block_00`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-parser.js#block_01_block_01`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-parser.js#block_02_block_02`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-parser.js#block_03_block_03`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-parser.js#block_04_block_04`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-parser.js#block_05_block_05`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-parser.js#block_06_block_06`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-parser.js#block_07_block_07`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-parser.js#block_08_block_08`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-parser.js#block_09_block_09`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-parser.js#block_10_block_10`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-parser.js#block_11_block_11`: Cannot convert undefined or null to object     at anonymous (<input>:28:33)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-http-pause-no-dump.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-pipe-fs.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-req-res-close.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-req-res-close.js#block_00_after_res`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-req-res-close.js#block_01_req_should_emit_close_after_res`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-req-res-close.js#block_02_see_https_github_com_nodejs_node_pull_33035_issuecomment_751`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-request-arguments.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-request-end-twice.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-request-end.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-request-host-header.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-request-host-header.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-request-join-authorization-headers.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-request-join-authorization-headers.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-request-join-authorization-headers.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-request-large-payload.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-request-methods.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-close.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-close.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-close.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-multi-content-length.js#block_00_test_adding_an_extra_content_length_header_using_setheader`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-multi-content-length.js#block_01_test_adding_an_extra_content_length_header_using_writehead`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-setheaders.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-setheaders.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-setheaders.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-setheaders.js#block_03_block_03`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-setheaders.js#block_04_block_04`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-setheaders.js#block_05_block_05`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-setheaders.js#block_06_block_06`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-statuscode.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-response-writehead-returns-this.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-capture-rejections.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-capture-rejections.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-capture-rejections.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-close-idle-wait-response.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-connection-list-when-close.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-connection-list-when-close.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-keep-alive-timeout.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-multiple-client-error.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-non-utf8-header.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-non-utf8-header.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-non-utf8-header.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-reject-cr-no-lf.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-timeouts-validation.js#block_00_block_00`: Expected values to be strictly equal:  0 !== 300000  AssertionError: Expected values to be strictly equal:  0 !== 300000      at anonymous (<input>:14:22)     at loadModule (node:module:551:24)     at...
- `parallel/test-http-server-timeouts-validation.js#block_01_block_01`: Expected values to be strictly equal:  60000 !== 10000  AssertionError: Expected values to be strictly equal:  60000 !== 10000      at anonymous (<input>:15:22)     at loadModule (node:module:551:24) ...
- `parallel/test-http-server-timeouts-validation.js#block_02_block_02`: Expected values to be strictly equal:  60000 !== 10000  AssertionError: Expected values to be strictly equal:  60000 !== 10000      at anonymous (<input>:17:22)     at loadModule (node:module:551:24) ...
- `parallel/test-http-server-timeouts-validation.js#block_03_block_03`: Expected values to be strictly equal:  60000 !== 10000  AssertionError: Expected values to be strictly equal:  60000 !== 10000      at anonymous (<input>:19:22)     at loadModule (node:module:551:24) ...
- `parallel/test-http-server-timeouts-validation.js#block_04_block_04`: Expected values to be strictly equal:  60000 !== 20000  AssertionError: Expected values to be strictly equal:  60000 !== 20000      at anonymous (<input>:21:22)     at loadModule (node:module:551:24) ...
- `parallel/test-http-server-timeouts-validation.js#block_05_block_05`: Expected values to be strictly equal:  0 !== 100000  AssertionError: Expected values to be strictly equal:  0 !== 100000      at anonymous (<input>:24:22)     at loadModule (node:module:551:24)     at...
- `parallel/test-http-server-timeouts-validation.js#block_06_block_06`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:25:5)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (...
- `parallel/test-http-server-unconsume.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-server-write-end-after-end.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-set-cookies.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-status-message.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-timeout.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-transfer-encoding-smuggling.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-transfer-encoding-smuggling.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-upgrade-server2.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-url.parse-auth-with-header-in-request.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-url.parse-basic.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-url.parse-path.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-url.parse-post.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-url.parse-search.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-wget.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-write-head-2.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-write-head-2.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-write-head-2.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-write-head-2.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-write-head-2.js#block_03_block_03`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http-zerolengthbuffer.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-http2-alpn.js#block_00_block_00`: The validation function is expected to return "true". Received false  Caught error:  Error: http2 is not supported in WebAssembly environment AssertionError: The validation function is expected to ret...
- `parallel/test-http2-alpn.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-capture-rejection.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-capture-rejection.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-capture-rejection.js#block_02_block_02`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-capture-rejection.js#block_03_block_03`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-client-setLocalWindowSize.js#block_00_block_00`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-client-setLocalWindowSize.js#block_01_block_01`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
- `parallel/test-http2-client-setLocalWindowSize.js#block_02_block_02`: http2 is not supported in WebAssembly environment     at <anonymous> (node:http2:4:33)
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
- `parallel/test-http2-perform-server-handshake.js#block_01_double_bind_should_fail`: not a function     at anonymous (<input>:25:32)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
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
- `parallel/test-https-insecure-parse-per-stream.js#block_02_test_3_the_client_sends_an_invalid_header`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-insecure-parse-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-insecure-parse-per-stream.js#block_04_test_5_invalid_argument_type`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:43:7)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (...
- `parallel/test-https-max-header-size-per-stream.js#block_02_test_3_the_client_sends_larger_headers_than_what_would_other`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)
- `parallel/test-https-max-header-size-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`: https.createServer is not supported in WebAssembly environment     at <anonymous> (node:https:6:33)

### module

- `es-module/test-require-module-conditional-exports.js#block_00_if_only_require_exports_are_defined_return_require_exports`: Cannot find module 'dep'     at localRequire (node:module:594:59)     at anonymous (<input>:3:18)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at anonymous (<inp...
- `es-module/test-require-module-conditional-exports.js#block_01_if_both_are_defined_require_is_used`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'MODULE_NOT_FOUND' -   code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'   }  AssertionError: Expected values to be strictl...
- `es-module/test-require-module-conditional-exports.js#block_02_if_import_and_default_are_defined_default_is_used`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'MODULE_NOT_FOUND' -   code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'   }  AssertionError: Expected values to be strictl...
- `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_00_a_mjs_b_cjs_c_mjs_a_mjs`: - stderr did not match /Cannot import Module \.\/a\.mjs in a cycle\. \(from .*c\.mjs\)/     at anonymous (<input>:15:16)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)...
- `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_01_b_cjs_c_mjs_a_mjs_b_cjs`: - stderr did not match /Cannot import CommonJS Module \.\/b\.cjs in a cycle\. \(from .*a\.mjs\)/     at anonymous (<input>:18:16)     at loadModule (node:module:551:24)     at localRequire (node:modul...
- `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_02_c_mjs_a_mjs_b_cjs_c_mjs`: - stderr did not match /Cannot require\(\) ES Module .*c\.mjs in a cycle\. \(from .*b\.cjs\)/     at anonymous (<input>:21:16)     at loadModule (node:module:551:24)     at localRequire (node:module:5...
- `es-module/test-require-module-cycle-esm-cjs-esm.js#block_00_require_a_cjs_a_mjs_b_cjs_a_mjs`: - stderr did not match /Cannot require\(\) ES Module .*a\.mjs in a cycle\. \(from .*require-a\.cjs\)/     at anonymous (<input>:15:16)     at loadModule (node:module:551:24)     at localRequire (node:...
- `es-module/test-require-module-cycle-esm-cjs-esm.js#block_01_require_b_cjs_b_cjs_a_mjs_b_cjs`: - stderr did not match /Cannot import CommonJS Module \.\/b\.cjs in a cycle\. \(from .*a\.mjs\)/     at anonymous (<input>:18:16)     at loadModule (node:module:551:24)     at localRequire (node:modul...
- `es-module/test-require-module-cycle-esm-cjs-esm.js#block_02_a_mjs_b_cjs_a_mjs`: - stderr did not match /Cannot require\(\) ES Module .*a\.mjs in a cycle\. \(from .*b\.cjs\)/     at anonymous (<input>:21:16)     at loadModule (node:module:551:24)     at localRequire (node:module:5...
- `es-module/test-require-module-cycle-esm-cjs-esm.js#block_03_b_cjs_a_mjs_b_cjs`: - stderr did not match /Cannot import CommonJS Module \.\/b\.cjs in a cycle\. \(from .*a\.mjs\)/     at anonymous (<input>:24:16)     at loadModule (node:module:551:24)     at localRequire (node:modul...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js#block_00_a_mjs_b_mjs_c_cjs_z_mjs_a_mjs`: - stderr did not match /Cannot import Module \.\/a\.mjs in a cycle\. \(from .*z\.mjs\)/     at anonymous (<input>:15:16)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js#block_01_b_mjs_c_cjs_z_mjs_a_mjs_b_mjs`: - stderr did not match /Cannot import Module \.\/b\.mjs in a cycle\. \(from .*a\.mjs\)/     at anonymous (<input>:18:16)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js#block_02_c_cjs_z_mjs_a_mjs_b_mjs_c_cjs`: - stderr did not match /Cannot import CommonJS Module \.\/c\.cjs in a cycle\. \(from .*b\.mjs\)/     at anonymous (<input>:21:16)     at loadModule (node:module:551:24)     at localRequire (node:modul...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js#block_03_z_mjs_a_mjs_b_mjs_c_cjs_z_mjs`: - stderr did not match /Cannot require\(\) ES Module .*z\.mjs in a cycle\. \(from .*c\.cjs\)/     at anonymous (<input>:25:16)     at loadModule (node:module:551:24)     at localRequire (node:module:5...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_00_a_mjs_b_mjs_c_mjs_d_mjs_c_mjs`: - process terminated with status 1, expected 0     at anonymous (<input>:16:16)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_01_b_mjs_c_mjs_d_mjs_c_mjs`: - stderr did not match /Cannot import Module \.\/c\.mjs in a cycle\. \(from .*d\.mjs\)/ - stdout did not match /Start c/     at anonymous (<input>:19:16)     at loadModule (node:module:551:24)     at ...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_02_c_mjs_d_mjs_c_mjs`: - stderr did not match /Cannot import Module \.\/c\.mjs in a cycle\. \(from .*d\.mjs\)/ - stdout did not match /Start c/     at anonymous (<input>:22:16)     at loadModule (node:module:551:24)     at ...
- `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_03_d_mjs_c_mjs_d_mjs`: - stderr did not match /Cannot require\(\) ES Module .*d\.mjs in a cycle\. \(from .*c\.mjs\)/ - stdout did not match /Start c/     at anonymous (<input>:26:16)     at loadModule (node:module:551:24)  ...
- `es-module/test-require-module-defined-esmodule.js#block_00_require_esm_should_allow_the_user_override`: unsupported keyword: export     at <input>:3:10     at Function (native)     at compileCjs (node:module:499:50)     at loadModule (node:module:539:37)     at localRequire (node:module:590:34)     at a...
- `es-module/test-require-module-defined-esmodule.js#block_01_block_01`: unsupported keyword: export     at <input>:3:10     at Function (native)     at compileCjs (node:module:499:50)     at loadModule (node:module:539:37)     at localRequire (node:module:590:34)     at a...
- `es-module/test-require-module-tla.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "expecting ';'" -   code: 'ERR_REQUIRE_ASYNC_MODULE', -   message: /require\(\) cannot be used on an ESM gra...
- `es-module/test-require-module-tla.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "expecting ';'" -   code: 'ERR_REQUIRE_ASYNC_MODULE', -   message: /require\(\) cannot be used on an ESM gra...
- `es-module/test-require-module-with-detection.js#block_00_block_00`: unsupported keyword: export     at <input>:6:10     at Function (native)     at compileCjs (node:module:499:50)     at loadModule (node:module:539:37)     at localRequire (node:module:590:34)     at a...
- `es-module/test-require-module-with-detection.js#block_01_block_01`: unsupported keyword: export     at <input>:4:10     at Function (native)     at compileCjs (node:module:499:50)     at loadModule (node:module:539:37)     at localRequire (node:module:590:34)     at a...
- `es-module/test-require-module.js#block_00_test_named_exports`: unsupported keyword: export     at <input>:3:10     at Function (native)     at compileCjs (node:module:499:50)     at loadModule (node:module:539:37)     at localRequire (node:module:590:34)     at a...
- `es-module/test-require-module.js#block_01_test_esm_that_import_esm`: Unexpected token '{'     at <input>:3:10     at Function (native)     at compileCjs (node:module:499:50)     at loadModule (node:module:539:37)     at localRequire (node:module:590:34)     at anonymou...
- `es-module/test-require-module.js#block_02_test_esm_that_import_cjs`: Unexpected token '{'     at <input>:3:10     at Function (native)     at compileCjs (node:module:499:50)     at loadModule (node:module:539:37)     at localRequire (node:module:590:34)     at anonymou...
- `es-module/test-require-module.js#block_03_test_esm_that_require_cjs`: unsupported keyword: export     at <input>:65:7     at Function (native)     at compileCjs (node:module:499:50)     at loadModule (node:module:539:37)     at localRequire (node:module:590:34)     at a...
- `es-module/test-require-module.js#block_04_also_test_default_export`: Unexpected string     at <input>:3:10     at Function (native)     at compileCjs (node:module:499:50)     at loadModule (node:module:539:37)     at localRequire (node:module:590:34)     at anonymous (...
- `es-module/test-require-module.js#block_05_test_data_import`: unsupported keyword: export     at <input>:3:10     at Function (native)     at compileCjs (node:module:499:50)     at loadModule (node:module:539:37)     at localRequire (node:module:590:34)     at a...
- `parallel/test-module-create-require-multibyte.js#block_00_block_00`: Cannot find module './experimental' from 'file:///test/fixtures'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:18:26)     at loadModule...
- `parallel/test-module-create-require-multibyte.js#block_01_block_01`: Cannot find module './experimental' from 'file:///test/fixtures/copy/utf/%E6%96%B0%E5%BB%BA%E6%96%87%E4%BB%B6%E5%A4%B9'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589...
- `parallel/test-module-multi-extensions.js#block_00_block_00`: cannot set property '.bar' of undefined     at anonymous (<input>:22:39)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runT...
- `parallel/test-module-multi-extensions.js#block_01_block_01`: cannot set property '.foo.bar' of undefined     at anonymous (<input>:24:43)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at ...
- `parallel/test-module-multi-extensions.js#block_03_block_03`: cannot set property '.bar' of undefined     at anonymous (<input>:28:39)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runT...
- `parallel/test-module-multi-extensions.js#block_04_block_04`: cannot set property '.foo.bar' of undefined     at anonymous (<input>:30:43)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at ...
- `parallel/test-module-multi-extensions.js#block_05_block_05`: cannot set property '.bar' of undefined     at anonymous (<input>:32:39)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runT...
- `parallel/test-module-multi-extensions.js#block_06_block_06`: cannot set property '.bar' of undefined     at anonymous (<input>:34:39)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runT...
- `parallel/test-module-setsourcemapssupport.js#block_00_block_00`: The input did not match the regular expression /ERR_INVALID_ARG_TYPE/. Input:  'TypeError: not a function'  AssertionError: The input did not match the regular expression /ERR_INVALID_ARG_TYPE/. Input...
- `parallel/test-module-setsourcemapssupport.js#block_01_block_01`: The input did not match the regular expression /ERR_INVALID_ARG_TYPE/. Input:  'TypeError: not a function'  AssertionError: The input did not match the regular expression /ERR_INVALID_ARG_TYPE/. Input...
- `parallel/test-require-cache.js`: Expected "actual" to be reference-equal to "expected": + actual - expected  + { - {} +   Dir: [class Dir], +   Dirent: [class Dirent], +   FSWatcher: [class FSWatcher], +   ReadStream: [Function: Read...
- `parallel/test-require-cache.js#block_01_block_01`: Expected "actual" to be reference-equal to "expected": + actual - expected  + { - {} +   Dir: [class Dir], +   Dirent: [class Dirent], +   FSWatcher: [class FSWatcher], +   ReadStream: [Function: Read...
- `parallel/test-require-extension-over-directory.js`: Cannot find module '/test/fixtures/module-extension-over-directory/inner/' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (...
- `parallel/test-require-node-prefix.js#block_00_all_kinds_of_specifiers_should_work_without_issue`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'MODULE_NOT_FOUND', +   message: "Cannot find module 'node:unknown'" -   code: 'ERR_UNKNOWN_BUILTIN_MODULE', - ...
- `parallel/test-require-node-prefix.js#block_01_node_prefixed_require_calls_bypass_the_require_cache`: Expected "actual" to be reference-equal to "expected": + actual - expected  + { - {} +   Dir: [class Dir], +   Dirent: [class Dirent], +   FSWatcher: [class FSWatcher], +   ReadStream: [Function: Read...
- `parallel/test-require-resolve-opts-paths-relative.js#block_00_parent_directory_paths_work_as_intended`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures/module-require/relative/subdir'     at chdir (node:process:319:112)     at anonymous (<input>:15:15)     at loadModule (node:module:551:...
- `parallel/test-require-resolve-opts-paths-relative.js#block_01_current_directory_paths_work_as_intended`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures/module-require/relative/subdir'     at chdir (node:process:319:112)     at anonymous (<input>:15:15)     at loadModule (node:module:551:...
- `parallel/test-require-resolve-opts-paths-relative.js#block_02_sub_directory_paths_work_as_intended`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures/module-require/relative/subdir'     at chdir (node:process:319:112)     at anonymous (<input>:15:15)     at loadModule (node:module:551:...
- `parallel/test-require-resolve.js#block_00_test_require_resolve_paths`: Cannot find module 'bar'     at resolve (node:module:609:59)     at anonymous (<input>:13:11)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at anonymous (<input>:...
- `parallel/test-require-resolve.js#block_01_block_01`: Cannot find module 'bar'     at resolve (node:module:609:59)     at anonymous (<input>:13:11)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at anonymous (<input>:...
- `sequential/test-module-loading.js#block_00_block_00`: Expected "actual" to be reference-equal to "expected": + actual - expected    <ref *1> {     children: [ +     <ref *2> { -     { +       children: [ -       children: [], +         { -       exports:...
- `sequential/test-module-loading.js#block_01_block_01`: Expected "actual" to be reference-equal to "expected": + actual - expected    <ref *1> {     children: [ +     <ref *2> { -     { +       children: [ -       children: [], +         { -       exports:...
- `sequential/test-module-loading.js#block_02_block_02`: Expected "actual" to be reference-equal to "expected": + actual - expected    <ref *1> {     children: [ +     <ref *2> { -     { +       children: [ -       children: [], +         { -       exports:...
- `sequential/test-module-loading.js#block_03_block_03`: Expected "actual" to be reference-equal to "expected": + actual - expected    <ref *1> {     children: [ +     <ref *2> { -     { +       children: [ -       children: [], +         { -       exports:...
- `sequential/test-module-loading.js#block_04_block_04`: Expected "actual" to be reference-equal to "expected": + actual - expected    <ref *1> {     children: [ +     <ref *2> { -     { +       children: [ -       children: [], +         { -       exports:...
- `sequential/test-module-loading.js#block_05_block_05`: Expected "actual" to be reference-equal to "expected": + actual - expected    <ref *1> {     children: [ +     <ref *2> { -     { +       children: [ -       children: [], +         { -       exports:...
- `sequential/test-module-loading.js#block_06_block_06`: Expected "actual" to be reference-equal to "expected": + actual - expected    <ref *1> {     children: [ +     <ref *2> { -     { +       children: [ -       children: [], +         { -       exports:...
- `sequential/test-module-loading.js#block_07_block_07`: Expected "actual" to be reference-equal to "expected": + actual - expected    <ref *1> {     children: [ +     <ref *2> { -     { +       children: [ -       children: [], +         { -       exports:...
- `sequential/test-module-loading.js#block_08_block_08`: Expected "actual" to be reference-equal to "expected": + actual - expected    <ref *1> {     children: [ +     <ref *2> { -     { +       children: [ -       children: [], +         { -       exports:...
- `sequential/test-module-loading.js#block_09_block_09`: Expected "actual" to be reference-equal to "expected": + actual - expected    <ref *1> {     children: [ +     <ref *2> { -     { +       children: [ -       children: [], +         { -       exports:...
- `sequential/test-module-loading.js#block_10_block_10`: Expected "actual" to be reference-equal to "expected": + actual - expected    <ref *1> {     children: [ +     <ref *2> { -     { +       children: [ -       children: [], +         { -       exports:...

### net

- `parallel/test-net-after-close.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-allow-half-open.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-allow-half-open.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-allow-half-open.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-autoselectfamily-commandline-option.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-autoselectfamily-default.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-autoselectfamily-default.js#block_00_test_that_ipv4_is_reached_by_default_if_ipv6_is_not_reachabl`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-autoselectfamily-default.js#block_01_test_that_ipv4_is_not_reached_by_default_if_ipv6_is_not_reac`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-autoselectfamily.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-autoselectfamily.js#block_00_test_that_ipv4_is_reached_if_ipv6_is_not_reachable`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-autoselectfamily.js#block_01_test_that_only_the_last_successful_connection_is_established`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-autoselectfamily.js#block_03_test_that_the_option_can_be_disabled`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-better-error-messages-path.js#block_00_block_00`: IPC sockets are not supported in WebAssembly     at makeError (node:net:67:21)     at connect (node:net:232:15)     at createConnection (node:net:1144:19)     at anonymous (<input>:10:25)     at loadM...
- `parallel/test-net-better-error-messages-path.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ERR_SOCKET_BAD_TYPE' -   code: 'ERR_INVALID_ARG_TYPE'   }  AssertionError: Expected values to be strictly deep...
- `parallel/test-net-bytes-written-large.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-bytes-written-large.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-bytes-written-large.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-connect-options-port.js#block_00_test_wrong_type_of_ports`: Missing expected exception (TypeError): createConnectionWithCb(true) AssertionError: Missing expected exception (TypeError): createConnectionWithCb(true)     at syncFailToConnect (<input>:94:21)     a...
- `parallel/test-net-connect-options-port.js#block_01_test_out_of_range_ports`: Missing expected exception (RangeError): createConnectionWithCb() AssertionError: Missing expected exception (RangeError): createConnectionWithCb()     at syncFailToConnect (<input>:97:21)     at anon...
- `parallel/test-net-connect-options-port.js#block_02_test_invalid_hints`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:43:19)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-net-connect-options-port.js#block_03_test_valid_combinations_of_connect_port_and_connect_port_hos`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-listen-invalid-port.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-listening.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-perf_hooks.js#block_00_block_00`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (<input>:40:22)     at emit (node:events:332:36)     at emit (node:do...
- `parallel/test-net-perf_hooks.js#block_01_block_01`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (<input>:40:22)     at emit (node:events:332:36)     at emit (node:do...
- `parallel/test-net-server-call-listen-multiple-times.js#block_00_first_test_check_that_after_error_event_you_can_listen_right`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-server-call-listen-multiple-times.js#block_01_second_test_check_that_second_listen_call_throws_an_error`: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at anonymous (<input>:18:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)...
- `parallel/test-net-server-call-listen-multiple-times.js#block_02_check_that_after_the_close_call_you_can_run_listen_method_ju`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-server-listen-options-signal.js#block_00_block_00`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:12:5)     at loadModule (node:module:551:24)     at localRequire (node:module:...
- `parallel/test-net-server-listen-options-signal.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-server-listen-options-signal.js#block_02_block_02`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-server-listen-options.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-server-listen-options.js#block_01_block_01`: Unhandled promise rejection:     at <anonymous> (node:net:829:41)     at doListen (node:net:844:9)     at listen (node:net:848:31)     at <anonymous> (<input>:14:36)     at anonymous (<input>:28:33)  ...
- `parallel/test-net-server-listen-options.js#block_02_block_02`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at shouldFailToListen (<input>:35:21)     at anonymous (<input>:44:22)     at loadModule (node:modul...
- `parallel/test-net-server-nodelay.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-socket-connect-without-cb.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-socket-write-after-close.js#block_00_block_00`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-socket-write-after-close.js#block_01_block_01`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-socket-write-error.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-net-writable.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `sequential/test-net-connect-econnrefused.js`: Expected values to be strictly equal:  1 !== 5  AssertionError: Expected values to be strictly equal:  1 !== 5      at <anonymous> (<input>:68:22)     at emit (node:events:332:36)     at emit (node:do...
- `sequential/test-net-server-address.js`: Unhandled promise rejection:     at mustNotCall (<input>:398:23)     at apply (native)     at emit (node:events:332:36)     at apply (native)     at emit (node:domain:103:32)     at <anonymous> (node:...
- `sequential/test-net-server-address.js#block_00_test_on_ipv4_server`: Unhandled promise rejection:     at mustNotCall (<input>:398:23)     at apply (native)     at emit (node:events:332:36)     at apply (native)     at emit (node:domain:103:32)     at <anonymous> (node:...
- `sequential/test-net-server-bind.js#block_00_with_only_a_callback_server_should_get_a_port_assigned_by_th`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `sequential/test-net-server-bind.js#block_01_no_callback_to_listen_assume_we_can_bind_in_100_ms`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `sequential/test-net-server-bind.js#block_02_callback_to_listen`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `sequential/test-net-server-bind.js#block_03_backlog_argument`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `sequential/test-net-server-bind.js#block_04_backlog_argument_without_host_argument`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)

### other

- `es-module/test-dynamic-import-script-lifetime.js`: Unhandled promise rejection: ReferenceError: Error resolving module 'foo' from '<input>'
- `parallel/test-blocklist.js#block_00_block_00`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (<input>:18:12)     at forEach (native)     at anonymous (<input>:17:42)     at loadModule (node:module:551:2...
- `parallel/test-blocklist.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(blockList.check('::ffff:1.1.1.1', 'ipv6'))  AssertionError: The expression evaluated to a falsy value:    assert(blockList.check('::ffff:1.1.1.1', ...
- `parallel/test-blocklist.js#block_02_block_02`: The expression evaluated to a falsy value:    assert(blockList.check(sa2))  AssertionError: The expression evaluated to a falsy value:    assert(blockList.check(sa2))      at anonymous (<input>:34:21)...
- `parallel/test-blocklist.js#block_03_block_03`: ::1 check failed AssertionError: ::1 check failed     at anonymous (<input>:33:19)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)  ...
- `parallel/test-blocklist.js#block_04_block_04`: ::1 check failed AssertionError: ::1 check failed     at anonymous (<input>:40:19)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)  ...
- `parallel/test-blocklist.js#block_05_block_05`: The expression evaluated to a falsy value:    assert(blockList.check('8592:757c:efae:4e45:f::', 'ipv6'))  AssertionError: The expression evaluated to a falsy value:    assert(blockList.check('8592:757...
- `parallel/test-blocklist.js#block_06_block_06`: The expression evaluated to a falsy value:    assert(blockList.check('8592:757c:efae:4e45:f::', 'ipv6'))  AssertionError: The expression evaluated to a falsy value:    assert(blockList.check('8592:757...
- `parallel/test-blocklist.js#block_07_block_07`: Expected values to be strictly deep-equal: + actual - expected    [ +   'Address: ipv4 1.1.1.1', +   'Range: ipv4 10.0.0.1-10.0.0.10', +   'Subnet: IpV6 8592:757c:efae:4e45::/64' -   'Subnet: IPv6 859...
- `parallel/test-blocklist.js#block_08_block_08`: The expression evaluated to a falsy value:    assert(!blockList.check('8592:757c:efaf:2fff:ffff:ffff:ffff:ffff', 'ipv6'))  AssertionError: The expression evaluated to a falsy value:    assert(!blockLi...
- `parallel/test-blocklist.js#block_09_block_09`: The expression evaluated to a falsy value:    assert(!blockList.check('::ffff:c0a8:0003', 'ipv6'))  AssertionError: The expression evaluated to a falsy value:    assert(!blockList.check('::ffff:c0a8:0...
- `parallel/test-blocklist.js#block_10_block_10`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:36:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require ...
- `parallel/test-blocklist.js#block_11_block_11`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:38:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require ...
- `parallel/test-blocklist.js#block_12_block_12`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:40:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require ...
- `parallel/test-broadcastchannel-custom-inspect.js#block_00_block_00`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at anonymous (<input>:13:18)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-broadcastchannel-custom-inspect.js#block_01_block_01`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at anonymous (<input>:15:18)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-broadcastchannel-custom-inspect.js#block_02_block_02`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at anonymous (<input>:17:18)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-broadcastchannel-custom-inspect.js#block_03_block_03`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at anonymous (<input>:19:18)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-cli-permission-deny-fs.js#block_00_block_00`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at anonymous (<input>:25:22)     at loadModule (node:module:551:24)   ...
- `parallel/test-cli-permission-deny-fs.js#block_01_block_01`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at anonymous (<input>:29:22)     at loadModule (node:module:551:24)   ...
- `parallel/test-cli-permission-deny-fs.js#block_02_block_02`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at anonymous (<input>:30:22)     at loadModule (node:module:551:24)   ...
- `parallel/test-cli-permission-deny-fs.js#block_03_block_03`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at anonymous (<input>:32:22)     at loadModule (node:module:551:24)   ...
- `parallel/test-cli-permission-deny-fs.js#block_04_block_04`: Error: fs is not defined     at anonymous (<input>:3:1)     at executeInlineSource (node:child_process:398:28)     at runInline (node:child_process:553:52)     at spawnSync (node:child_process:1193:22...
- `parallel/test-cli-permission-deny-fs.js#block_05_block_05`: Error: fs is not defined     at anonymous (<input>:3:1)     at executeInlineSource (node:child_process:398:28)     at runInline (node:child_process:553:52)     at spawnSync (node:child_process:1193:22...
- `parallel/test-cli-permission-deny-fs.js#block_06_block_06`: Error: fs is not defined     at anonymous (<input>:3:1)     at executeInlineSource (node:child_process:398:28)     at runInline (node:child_process:553:52)     at spawnSync (node:child_process:1193:22...
- `parallel/test-cli-permission-deny-fs.js#block_07_block_07`: The input did not match the regular expression /resource: '.*?[\\/](?:etc\|passwd)'/. Input:  "Error: ENOENT: no such file or directory, open '/etc/passwd'\n" +   '    at createSystemError (node:fs:186...
- `parallel/test-cli-permission-multiple-allow.js#block_00_block_00`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at anonymous (<input>:27:22)     at loadModule (node:module:551:24)   ...
- `parallel/test-cli-permission-multiple-allow.js#block_01_block_01`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at anonymous (<input>:33:22)     at loadModule (node:module:551:24)   ...
- `parallel/test-cli-permission-multiple-allow.js#block_02_block_02`: Expected values to be strictly equal:  '' !== 'false'  AssertionError: Expected values to be strictly equal:  '' !== 'false'      at anonymous (<input>:31:22)     at loadModule (node:module:551:24)   ...
- `parallel/test-common.js#block_00_test_for_leaked_global_detection`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:46:15)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require ...
- `parallel/test-common.js#block_01_test_for_disabling_leaked_global_detection`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:48:15)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require ...
- `parallel/test-common.js#block_02_test_tmpdir`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:40:15)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require ...
- `parallel/test-common.js#block_03_must_be_last_since_it_uses_process_on_uncaughtexception`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:40:15)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require ...
- `parallel/test-domexception-cause.js`: Expected values to be strictly equal: + actual - expected  + { +   cause: undefined, +   name: 'abc' + } - 'abc'  AssertionError: Expected values to be strictly equal: + actual - expected  + { +   cau...
- `parallel/test-domexception-cause.js#block_01_block_01`: Expected values to be strictly equal: + actual - expected  + { +   cause: undefined, +   name: 'abc' + } - 'abc'  AssertionError: Expected values to be strictly equal: + actual - expected  + { +   cau...
- `parallel/test-domexception-cause.js#block_02_block_02`: Expected values to be strictly equal: + actual - expected  + { +   cause: 'foo', +   name: 'abc' + } - 'abc'  AssertionError: Expected values to be strictly equal: + actual - expected  + { +   cause: ...
- `parallel/test-domexception-cause.js#block_03_block_03`: Expected values to be strictly equal: + actual - expected  + { +   cause: { +     reason: 'foo' +   }, +   name: 'abc' + } - 'abc'  AssertionError: Expected values to be strictly equal: + actual - exp...
- `parallel/test-freeze-intrinsics.js#block_00_ensure_we_can_extend_console`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:9:3)     at loadModule (node:module:551:24)     at localRequire (node:module:5...
- `parallel/test-freeze-intrinsics.js#block_01_ensure_we_can_write_override_object_prototype_properties_on_`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:9:3)     at loadModule (node:module:551:24)     at localRequire (node:module:5...
- `parallel/test-freeze-intrinsics.js#block_02_ensure_we_can_not_override_globalthis`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:9:3)     at loadModule (node:module:551:24)     at localRequire (node:module:5...
- `parallel/test-freeze-intrinsics.js#block_03_ensure_that_we_cannot_override_console_properties`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:9:3)     at loadModule (node:module:551:24)     at localRequire (node:module:5...
- `parallel/test-permission-allow-child-process-cli.js#block_00_guarantee_the_initial_state`: cannot read property 'has' of undefined     at anonymous (<input>:30:13)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runT...
- `parallel/test-permission-allow-child-process-cli.js#block_01_to_spawn_unless_allow_child_process_is_sent`: execSync is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at execSync (node:child_process:1184:11)     at anonymous (<input>:36:35)     at load...
- `parallel/test-permission-allow-wasi-cli.js#block_00_guarantee_the_initial_state`: Cannot find module 'wasi'     at localRequire (node:module:594:59)     at anonymous (<input>:14:18)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node...
- `parallel/test-permission-allow-wasi-cli.js#block_01_to_create_wasi_instance_unless_allow_wasi_is_sent`: Cannot find module 'wasi'     at localRequire (node:module:594:59)     at anonymous (<input>:14:18)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node...
- `parallel/test-permission-allow-worker-cli.js#block_00_guarantee_the_initial_state`: cannot read property 'has' of undefined     at anonymous (<input>:16:13)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runT...
- `parallel/test-permission-child-process-cli.js#block_00_guarantee_the_initial_state`: cannot read property 'has' of undefined     at anonymous (<input>:22:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runT...
- `parallel/test-permission-child-process-cli.js#block_01_to_spawn`: The validation function is expected to return "true". Received false  Caught error:  Error: spawn is not supported in WebAssembly environment AssertionError: The validation function is expected to ret...
- `parallel/test-permission-fs-read.js`: AssertionError: Missing expected exception.     at anonymous (<input>:36:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at runInline (node:child_process:586:28...
- `parallel/test-permission-fs-read.js#block_01_block_01`: AssertionError: Missing expected exception.     at anonymous (<input>:36:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at runInline (node:child_process:586:28...
- `parallel/test-permission-fs-require.js`: 0 !== 1  AssertionError:   0 !== 1      at anonymous (<input>:48:40)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest ...
- `parallel/test-permission-fs-require.js#block_01_block_01`: 0 !== 1  AssertionError:   0 !== 1      at anonymous (<input>:33:40)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest ...
- `parallel/test-permission-fs-require.js#block_02_block_02`: Error: Unexpected string     at <input>:3:10     at Function (native)     at compileCjs (node:module:499:50)     at loadModule (node:module:539:37)     at localRequire (node:module:590:34)     at runI...
- `parallel/test-permission-fs-require.js#block_03_block_03`: The input did not match the regular expression /Error: Access to this API has been restricted/. Input:  'Error: Unexpected string\n' +   '    at <input>:3:10\n' +   '    at Function (native)\n' +   ' ...
- `parallel/test-permission-fs-wildcard.js#block_00_block_00`: Error: Cannot find module '/tmp/*' from '/'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at runInline (node:child_process:586:28)     at spawnSync (node:chi...
- `parallel/test-permission-fs-wildcard.js#block_01_block_01`: Error: Cannot find module '/tmp/*' from '/'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at runInline (node:child_process:586:28)     at spawnSync (node:chi...
- `parallel/test-permission-fs-write-report.js#block_00_block_00`: The validation function is expected to return "true". Received false  Caught error:  TypeError: cannot read property 'writeReport' of undefined AssertionError: The validation function is expected to r...
- `parallel/test-permission-fs-write-report.js#block_01_block_01`: The validation function is expected to return "true". Received false  Caught error:  TypeError: cannot read property 'writeReport' of undefined AssertionError: The validation function is expected to r...
- `parallel/test-permission-fs-write-v8.js#block_00_block_00`: The validation function is expected to return "true". Received false  Caught error:  Error: v8.writeHeapSnapshot is not supported in WASM environment AssertionError: The validation function is expecte...
- `parallel/test-permission-fs-write-v8.js#block_01_block_01`: The validation function is expected to return "true". Received false  Caught error:  Error: v8.writeHeapSnapshot is not supported in WASM environment AssertionError: The validation function is expecte...
- `parallel/test-permission-has.js#block_00_block_00`: cannot read property 'has' of undefined     at anonymous (<input>:11:13)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runT...
- `parallel/test-permission-has.js#block_01_block_01`: cannot read property 'has' of undefined     at anonymous (<input>:13:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runT...
- `parallel/test-queue-microtask.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-queue-microtask.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-release-changelog.js#block_00_check_changelog_v_md`: ENOENT: no such file or directory, open '/src/node_version.h'     at createSystemError (node:fs:186:21)     at openSync (node:fs:1135:33)     at readFileSync (node:fs:1004:25)     at anonymous (<input...
- `parallel/test-release-changelog.js#block_01_main_changelog_md_checks`: ENOENT: no such file or directory, open '/src/node_version.h'     at createSystemError (node:fs:186:21)     at openSync (node:fs:1135:33)     at readFileSync (node:fs:1004:25)     at anonymous (<input...
- `parallel/test-set-incoming-message-header.js#block_02_addheaderlines_function_set_a_header_correctly`: not a function     at anonymous (<input>:19:6)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:14...
- `parallel/test-shadow-realm-prepare-stack-trace.js#block_00_block_00`: ShadowRealm is not defined ReferenceError: ShadowRealm is not defined     at [object CallSite]     at [object CallSite]     at [object CallSite]     at [object CallSite]     at [object CallSite]
- `parallel/test-shadow-realm-prepare-stack-trace.js#block_01_block_01`: ShadowRealm is not defined ReferenceError: ShadowRealm is not defined     at [object CallSite]     at [object CallSite]     at [object CallSite]     at [object CallSite]     at [object CallSite]
- `parallel/test-single-executable-blob-config-errors.js#block_00_block_00`: The input did not match the regular expression /Cannot read single executable configuration from non-existent-relative\.json/. Input:  "Error: Cannot find module '/tmp/w/non-existent-relative.json' fr...
- `parallel/test-single-executable-blob-config-errors.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(     stderr.includes(       `Cannot read single executable configuration from ${config}`     )   )  AssertionError: The expression evaluated to a f...
- `parallel/test-single-executable-blob-config-errors.js#block_02_block_02`: The input did not match the regular expression /SyntaxError: Expected ':' after property name/. Input:  "Error: Cannot parse JSON module '/tmp/w/invalid.json': Expected ':' after property name in JSON...
- `parallel/test-single-executable-blob-config-errors.js#block_03_block_03`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at anonymous (<input>:29:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-single-executable-blob-config-errors.js#block_04_block_04`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at anonymous (<input>:31:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-single-executable-blob-config-errors.js#block_05_block_05`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at anonymous (<input>:33:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-single-executable-blob-config-errors.js#block_06_block_06`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at anonymous (<input>:41:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-single-executable-blob-config-errors.js#block_07_block_07`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at anonymous (<input>:37:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-single-executable-blob-config-errors.js#block_08_block_08`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at anonymous (<input>:45:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-single-executable-blob-config-errors.js#block_09_block_09`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at anonymous (<input>:50:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-single-executable-blob-config-errors.js#block_10_block_10`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at anonymous (<input>:52:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-single-executable-blob-config.js#block_00_block_00`: The expression evaluated to a falsy value:    assert(existsSync(output))  AssertionError: The expression evaluated to a falsy value:    assert(existsSync(output))      at anonymous (<input>:29:21)    ...
- `parallel/test-single-executable-blob-config.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(existsSync(output))  AssertionError: The expression evaluated to a falsy value:    assert(existsSync(output))      at anonymous (<input>:32:21)    ...
- `parallel/test-single-executable-blob-config.js#block_02_block_02`: The expression evaluated to a falsy value:    assert(existsSync(output))  AssertionError: The expression evaluated to a falsy value:    assert(existsSync(output))      at anonymous (<input>:34:21)    ...
- `parallel/test-single-executable-blob-config.js#block_03_block_03`: The expression evaluated to a falsy value:    assert(existsSync(output))  AssertionError: The expression evaluated to a falsy value:    assert(existsSync(output))      at anonymous (<input>:37:21)    ...
- `parallel/test-single-executable-blob-config.js#block_04_block_04`: The expression evaluated to a falsy value:    assert(existsSync(output))  AssertionError: The expression evaluated to a falsy value:    assert(existsSync(output))      at anonymous (<input>:39:21)    ...
- `parallel/test-snapshot-api.js#block_00_block_00`: cannot read property 'isBuildingSnapshot' of undefined     at anonymous (<input>:18:1)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:2...
- `parallel/test-snapshot-api.js#block_01_block_01`: cannot read property 'isBuildingSnapshot' of undefined     at anonymous (<input>:18:1)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:2...
- `parallel/test-snapshot-argv1.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:33:24)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-argv1.js#block_01_block_01`: Unexpected end of JSON input     at <input>:1:1     at parse (native)     at anonymous (<input>:35:53)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (n...
- `parallel/test-snapshot-basic.js#block_00_by_default_the_snapshot_blob_path_is_cwd_snapshot_blob`: - process terminated with status 1, expected 9     at anonymous (<input>:26:20)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-basic.js#block_01_block_01`: - process terminated with status 1, expected 9     at anonymous (<input>:26:20)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-basic.js#block_02_block_02`: - process terminated with status 1, expected 9     at anonymous (<input>:26:20)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-basic.js#block_03_block_03`: - process terminated with status 1, expected 9     at anonymous (<input>:26:20)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-child-process-sync.js#block_00_block_00`: - process terminated with status 1, expected 0     at anonymous (<input>:25:22)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-child-process-sync.js#block_01_block_01`: - process terminated with status 1, expected 0     at anonymous (<input>:26:22)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-cjs-main.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:33:24)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-cjs-main.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:35:24)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-config.js#block_00_block_00`: - stderr did not match /Cannot read snapshot configuration from snapshot\.json/     at anonymous (<input>:25:20)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at ...
- `parallel/test-snapshot-config.js#block_01_block_01`: - stderr did not match /"builder" field of .+snapshot\.json is not a non-empty string/     at anonymous (<input>:33:20)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34) ...
- `parallel/test-snapshot-config.js#block_02_block_02`: - process terminated with status 1, expected 0     at anonymous (<input>:36:32)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-config.js#block_03_block_03`: - process terminated with status 1, expected 0     at anonymous (<input>:39:32)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-cwd.js#block_00_block_00`: - process terminated with status 1, expected 0     at anonymous (<input>:23:22)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-cwd.js#block_01_block_01`: - process terminated with status 1, expected 0     at anonymous (<input>:24:22)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-dns-lookup-localhost-promise.js#block_00_block_00`: Cannot find module '../common/snapshot' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:11:44)     at loadModule (n...
- `parallel/test-snapshot-dns-lookup-localhost-promise.js#block_01_block_01`: Cannot find module '../common/snapshot' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:11:44)     at loadModule (n...
- `parallel/test-snapshot-dns-lookup-localhost.js#block_00_block_00`: Cannot find module '../common/snapshot' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:11:44)     at loadModule (n...
- `parallel/test-snapshot-dns-lookup-localhost.js#block_01_block_01`: Cannot find module '../common/snapshot' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:11:44)     at loadModule (n...
- `parallel/test-snapshot-dns-resolve-localhost-promise.js#block_00_block_00`: Cannot find module '../common/snapshot' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:11:44)     at loadModule (n...
- `parallel/test-snapshot-dns-resolve-localhost-promise.js#block_01_block_01`: Cannot find module '../common/snapshot' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:11:44)     at loadModule (n...
- `parallel/test-snapshot-dns-resolve-localhost.js#block_00_block_00`: Cannot find module '../common/snapshot' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:11:44)     at loadModule (n...
- `parallel/test-snapshot-dns-resolve-localhost.js#block_01_block_01`: Cannot find module '../common/snapshot' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:11:44)     at loadModule (n...
- `parallel/test-snapshot-error.js#block_00_build_snapshot_should_be_run_with_an_entry_point`: Expected values to be strictly equal:  1 !== 9  AssertionError: Expected values to be strictly equal:  1 !== 9      at anonymous (<input>:32:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-error.js#block_01_loading_a_non_existent_snapshot_should_fail`: Expected values to be strictly equal:  1 !== 14  AssertionError: Expected values to be strictly equal:  1 !== 14      at anonymous (<input>:35:22)     at loadModule (node:module:551:24)     at localRe...
- `parallel/test-snapshot-error.js#block_02_running_an_script_that_throws_an_error_should_result_in_an_e`: The input did not match the regular expression /error\.js:1/. Input:  "Error: Cannot find module '/tmp/w/snapshot.blob' from '/'\n" +   '    at resolveFilename (node:module:270:80)\n' +   '    at loca...
- `parallel/test-snapshot-eval.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:32:24)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-eval.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:35:24)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-eval.js#block_02_block_02`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:37:24)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-gzip.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:38:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-gzip.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:38:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-incompatible.js#block_00_is_chosen_here_because_it_s_stable_enough_and_makes_a_differ`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:36:24)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-incompatible.js#block_01_block_01`: The input did not match the regular expression /Failed to load the startup snapshot/. Input:  "Error: Cannot find module '/tmp/w/snapshot.blob' from '/'\n" +   '    at resolveFilename (node:module:270...
- `parallel/test-snapshot-incompatible.js#block_02_block_02`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:42:24)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-net.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:30:24)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-net.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:35:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-stack-trace-limit.js#block_00_block_00`: - process terminated with status 1, expected 0     at anonymous (<input>:22:14)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-stack-trace-limit.js#block_01_block_01`: - process terminated with status 1, expected 0     at anonymous (<input>:19:22)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-typescript.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:39:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-typescript.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:43:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-umd.js#block_00_block_00`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:32:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-umd.js#block_01_block_01`: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at anonymous (<input>:37:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-snapshot-warning.js#block_00_block_00`: - process terminated with status 1, expected 0     at anonymous (<input>:24:32)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-warning.js#block_01_block_01`: - process terminated with status 1, expected 0     at anonymous (<input>:28:22)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-snapshot-warning.js#block_02_block_02`: - process terminated with status 1, expected 0     at anonymous (<input>:33:22)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     ...
- `parallel/test-source-map-api.js#block_00_it_should_throw_with_invalid_args`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'not a function', -   code: 'ERR_INVALID_ARG_TYPE', -   message: 'The "payload" argument must be of type obj...
- `parallel/test-source-map-api.js#block_01_findsourcemap_should_return_undefined_when_no_source_map_is_`: not a function     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-source-map-api.js#block_02_non_exceptional_case`: not a function     at anonymous (<input>:22:13)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-source-map-api.js#block_03_source_map_attached_to_error`: undefined == true AssertionError [ERR_ASSERTION]: undefined == true
- `parallel/test-source-map-api.js#block_04_sourcemap_can_be_instantiated_with_source_map_v3_object_as_p`: not a function     at anonymous (<input>:33:25)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-source-map-api.js#block_05_error_when_receiving_a_malformed_mappings`: not a function     at anonymous (<input>:36:25)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-source-map-api.js#block_06_sourcemap_can_be_instantiated_with_index_source_map_v3_objec`: not a function     at anonymous (<input>:37:25)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-source-map-api.js#block_07_test_various_known_decodings_to_ensure_decodevlq_works_corre`: not a function     at anonymous (<input>:71:52)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-source-map-api.js#block_08_observed_see_https_github_com_mozilla_source_map_pull_92`: not a function     at anonymous (<input>:55:5)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:14...
- `parallel/test-sqlite-custom-functions.js`: 9 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:9:1)     at loadModule (node:module:551:24)     ...
- `parallel/test-sqlite-data-types.js`: 4 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:17:1)     at loadModule (node:module:551:24)    ...
- `parallel/test-sqlite-database-sync.js`: 13 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:18:1)     at loadModule (node:module:551:24)   ...
- `parallel/test-sqlite-database-sync.js#test_00_databasesync_constructor`: 13 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:19:1)     at loadModule (node:module:551:24)   ...
- `parallel/test-sqlite-database-sync.js#test_01_databasesync_prototype_open`: 2 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:154:1)     at loadModule (node:module:551:24)   ...
- `parallel/test-sqlite-database-sync.js#test_02_databasesync_prototype_close`: 2 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:179:1)     at loadModule (node:module:551:24)   ...
- `parallel/test-sqlite-database-sync.js#test_03_databasesync_prototype_prepare`: 3 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:198:1)     at loadModule (node:module:551:24)   ...
- `parallel/test-sqlite-database-sync.js#test_04_databasesync_prototype_exec`: 4 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:230:1)     at loadModule (node:module:551:24)   ...
- `parallel/test-sqlite-named-parameters.js`: 4 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:17:1)     at loadModule (node:module:551:24)    ...
- `parallel/test-sqlite-session.js`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at createDatabase (<input>:35:26)     at <anonymous> (<input>:40:24)     at call (native)     at...
- `parallel/test-sqlite-session.js#test_00_creating_and_applying_a_changeset`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at createDatabase (<input>:36:26)     at <anonymous> (<input>:41:24)     at call (native)     at...
- `parallel/test-sqlite-session.js#test_01_database_createsession_closed_database_results_in_exception`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:60:24)     at call (native)     at runTest (node:test:286:30)     at tes...
- `parallel/test-sqlite-session.js#test_02_session_changeset_closed_database_results_in_exception`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:71:24)     at call (native)     at runTest (node:test:286:30)     at tes...
- `parallel/test-sqlite-session.js#test_03_database_applychangeset_closed_database_results_in_exception`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:83:24)     at call (native)     at runTest (node:test:286:30)     at tes...
- `parallel/test-sqlite-session.js#test_04_database_createsession_use_table_option_to_track_specific_ta`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:96:25)     at call (native)     at runTest (node:test:286:30)     at tes...
- `parallel/test-sqlite-session.js#test_05_conflict_resolution`: 8 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:133:1)     at loadModule (node:module:551:24)   ...
- `parallel/test-sqlite-session.js#test_06_database_createsession_filter_changes`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:368:25)     at call (native)     at runTest (node:test:286:30)     at te...
- `parallel/test-sqlite-session.js#test_07_database_createsession_specify_other_database`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:393:24)     at call (native)     at runTest (node:test:286:30)     at te...
- `parallel/test-sqlite-session.js#test_08_database_createsession_wrong_arguments`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:410:24)     at call (native)     at runTest (node:test:286:30)     at te...
- `parallel/test-sqlite-session.js#test_09_database_applychangeset_wrong_arguments`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:438:24)     at call (native)     at runTest (node:test:286:30)     at te...
- `parallel/test-sqlite-session.js#test_10_session_patchset`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:474:24)     at call (native)     at runTest (node:test:286:30)     at te...
- `parallel/test-sqlite-session.js#test_11_session_close_using_session_after_close_throws_exception`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:497:24)     at call (native)     at runTest (node:test:286:30)     at te...
- `parallel/test-sqlite-session.js#test_12_session_close_after_closing_database_throws_exception`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:516:24)     at call (native)     at runTest (node:test:286:30)     at te...
- `parallel/test-sqlite-session.js#test_13_session_close_closing_twice`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:533:24)     at call (native)     at runTest (node:test:286:30)     at te...
- `parallel/test-sqlite-statement-sync.js`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'node:sqlite is not available (sqlite feature is not enabled)' -   code: 'ERR_ILLEGAL_CONSTRUCTOR', -   mess...
- `parallel/test-sqlite-statement-sync.js#test_00_statementsync_constructor`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'node:sqlite is not available (sqlite feature is not enabled)' -   code: 'ERR_ILLEGAL_CONSTRUCTOR', -   mess...
- `parallel/test-sqlite-statement-sync.js#test_01_statementsync_prototype_get`: 3 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:29:1)     at loadModule (node:module:551:24)    ...
- `parallel/test-sqlite-statement-sync.js#test_02_statementsync_prototype_all`: 2 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:60:1)     at loadModule (node:module:551:24)    ...
- `parallel/test-sqlite-statement-sync.js#test_03_statementsync_prototype_iterate`: 2 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:90:1)     at loadModule (node:module:551:24)    ...
- `parallel/test-sqlite-statement-sync.js#test_04_statementsync_prototype_run`: 3 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:126:1)     at loadModule (node:module:551:24)   ...
- `parallel/test-sqlite-statement-sync.js#test_05_statementsync_prototype_sourcesql`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:178:33)     at call (native)     at runTest (node:test:286:30)     at ex...
- `parallel/test-sqlite-statement-sync.js#test_06_statementsync_prototype_expandedsql`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:192:33)     at call (native)     at runTest (node:test:286:30)     at ex...
- `parallel/test-sqlite-statement-sync.js#test_07_statementsync_prototype_setreadbigints`: 3 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:209:1)     at loadModule (node:module:551:24)   ...
- `parallel/test-sqlite-statement-sync.js#test_08_statementsync_prototype_setallowbarenamedparameters`: 2 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:278:1)     at loadModule (node:module:551:24)   ...
- `parallel/test-sqlite-transactions.js`: 2 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:17:1)     at loadModule (node:module:551:24)    ...
- `parallel/test-sqlite-typed-array-and-data-view.js`: 12 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:33:1)     at loadModule (node:module:551:24)   ...
- `parallel/test-sqlite.js`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:47:31)     at call (native)     at runTest (node:test:286:30)     at tes...
- `parallel/test-sqlite.js#test_00_accessing_the_node_sqlite_module`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-sqlite.js#test_01_err_sqlite_error_is_thrown_for_errors_originating_from_sqlit`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:48:31)     at call (native)     at runTest (node:test:286:30)     at tes...
- `parallel/test-sqlite.js#test_02_in_memory_databases_are_supported`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:69:19)     at call (native)     at runTest (node:test:286:30)     at tes...
- `parallel/test-sqlite.js#test_03_sqlite_constants_are_defined`: Expected values to be strictly equal:  undefined !== 0  AssertionError: Expected values to be strictly equal:  undefined !== 0      at <anonymous> (<input>:92:24)     at call (native)     at runTest (...
- `parallel/test-sqlite.js#test_04_pragmas_are_supported`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:98:31)     at call (native)     at runTest (node:test:286:30)     at tes...
- `parallel/test-sqlite.js#test_05_math_functions_are_enabled`: node:sqlite is not available (sqlite feature is not enabled)     at DatabaseSync (node:sqlite:3:48)     at <anonymous> (<input>:111:18)     at call (native)     at runTest (node:test:286:30)     at te...
- `parallel/test-startup-large-pages.js#block_00_block_00`: Expected values to be strictly equal:  'undefined' !== '42'  AssertionError: Expected values to be strictly equal:  'undefined' !== '42'      at anonymous (<input>:19:22)     at loadModule (node:modul...
- `parallel/test-startup-large-pages.js#block_01_block_01`: Expected values to be strictly equal:  0 !== 9  AssertionError: Expected values to be strictly equal:  0 !== 9      at anonymous (<input>:16:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-webcrypto-constructors.js#block_00_test_cryptokey_constructor`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:15:10)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-webcrypto-constructors.js#block_01_test_subtlecrypto_constructor`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'SubtleCrypto is not defined', +   name: 'ReferenceError' -   code: 'ERR_ILLEGAL_CONSTRUCTOR', -   message: ...
- `parallel/test-webcrypto-constructors.js#block_02_test_crypto_constructor`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'Crypto is not defined', +   name: 'ReferenceError' -   code: 'ERR_ILLEGAL_CONSTRUCTOR', -   message: 'Illeg...
- `parallel/test-webcrypto-constructors.js#block_03_test_crypto_prototype_subtle`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_04_test_crypto_prototype_randomuuid`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_05_test_crypto_prototype_getrandomvalues`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_06_test_subtlecrypto_prototype_encrypt`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_07_test_subtlecrypto_prototype_decrypt`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_08_test_subtlecrypto_prototype_sign`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_09_test_subtlecrypto_prototype_verify`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_10_test_subtlecrypto_prototype_digest`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_11_test_subtlecrypto_prototype_generatekey`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_12_test_subtlecrypto_prototype_derivekey`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_13_test_subtlecrypto_prototype_derivebits`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_14_test_subtlecrypto_prototype_importkey`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_15_test_subtlecrypto_prototype_exportkey`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_16_test_subtlecrypto_prototype_wrapkey`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_17_test_subtlecrypto_prototype_unwrapkey`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-constructors.js#block_18_block_18`: Crypto is not defined     at anonymous (<input>:22:37)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-r...
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_00_test_aes_cbc_vectors`: Unhandled promise rejection:     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at testEncrypt (<input>:18:5)     at <anonymous> (<input>:106:35)     at forEach (native)     at <anonymo...
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_01_test_aes_ctr_vectors`: Unhandled promise rejection:     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at testEncrypt (<input>:18:5)     at <anonymous> (<input>:109:35)     at forEach (native)     at <anonymo...
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_02_test_aes_gcm_vectors`: Unhandled promise rejection:     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at testEncrypt (<input>:18:5)     at <anonymous> (<input>:112:35)     at forEach (native)     at <anonymo...
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_03_block_03`: Unhandled promise rejection:     at <anonymous> (<input>:125:45)
- `parallel/test-webcrypto-encrypt-decrypt.js#block_00_test_encrypt_decrypt_rsa_oaep`: Unhandled promise rejection:     at generateKey (__wasm_rquickjs_builtin/web_crypto:7470:53)     at test (<input>:25:27)     at anonymous (<input>:44:3)     at loadModule (node:module:551:24)     at l...
- `parallel/test-webcrypto-encrypt-decrypt.js#block_01_test_encrypt_decrypt_aes_ctr`: Unhandled promise rejection:     at test (<input>:31:7)
- `parallel/test-webcrypto-encrypt-decrypt.js#block_02_test_encrypt_decrypt_aes_cbc`: Unhandled promise rejection:     at test (<input>:34:7)
- `parallel/test-webcrypto-encrypt-decrypt.js#block_03_test_encrypt_decrypt_aes_gcm`: Unhandled promise rejection:     at test (<input>:37:7)
- `parallel/test-webcrypto-export-import-ec.js#block_00_block_00`: Unhandled promise rejection:     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at <anonymous> (<input>:408:30)     at anonymous (<input>:412:1)     at loadModule (node:module:551:24)  ...
- `parallel/test-webcrypto-export-import-ec.js#block_01_bad_private_keys`: Unhandled promise rejection:     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at <anonymous> (<input>:408:30)     at anonymous (<input>:412:1)     at loadModule (node:module:551:24)  ...
- `parallel/test-webcrypto-export-import.js#block_00_block_00`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_VALUE' - }       at rejects (nati...
- `parallel/test-webcrypto-export-import.js#block_01_import_export_hmac_secret_key`: Unhandled promise rejection:     at exportKey (__wasm_rquickjs_builtin/web_crypto:7596:57)     at test (<input>:36:30)
- `parallel/test-webcrypto-export-import.js#block_02_import_export_aes_secret_key`: Unhandled promise rejection:     at importKey (__wasm_rquickjs_builtin/web_crypto:7586:82)     at test (<input>:23:7)     at anonymous (<input>:59:3)     at loadModule (node:module:551:24)     at loca...
- `parallel/test-webcrypto-export-import.js#block_03_import_export_rsa_key_pairs`: Unhandled promise rejection:     at generateKey (__wasm_rquickjs_builtin/web_crypto:7470:53)     at test (<input>:27:27)     at anonymous (<input>:78:3)     at loadModule (node:module:551:24)     at l...
- `parallel/test-webcrypto-export-import.js#block_04_import_export_ec_key_pairs`: Unhandled promise rejection:     at exportKey (__wasm_rquickjs_builtin/web_crypto:7596:57)     at test (<input>:38:14)
- `parallel/test-webcrypto-random.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   code: 17, -   name: 'TypeMismatchError'   }  AssertionError: Expected values to be strictly dee...
- `parallel/test-webcrypto-random.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   code: 17, -   name: 'TypeMismatchError'   }  AssertionError: Expected values to be strictly dee...
- `parallel/test-webcrypto-random.js#block_02_block_02`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   code: 17, -   name: 'TypeMismatchError'   }  AssertionError: Expected values to be strictly dee...
- `parallel/test-webcrypto-random.js#block_03_block_03`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   code: 17, -   name: 'TypeMismatchError'   }  AssertionError: Expected values to be strictly dee...
- `parallel/test-webcrypto-sign-verify.js#block_00_test_sign_verify_rsassa_pkcs1_v1_5`: Unhandled promise rejection:     at generateKey (__wasm_rquickjs_builtin/web_crypto:7470:53)     at test (<input>:23:27)     at anonymous (<input>:36:3)     at loadModule (node:module:551:24)     at l...
- `parallel/test-webcrypto-sign-verify.js#block_01_test_sign_verify_rsa_pss`: Unhandled promise rejection:     at generateKey (__wasm_rquickjs_builtin/web_crypto:7470:53)     at test (<input>:26:27)     at anonymous (<input>:41:3)     at loadModule (node:module:551:24)     at l...
- `parallel/test-webcrypto-sign-verify.js#block_05_test_sign_verify_ed448`: Unhandled promise rejection:     at generateKey (__wasm_rquickjs_builtin/web_crypto:7470:53)     at test (<input>:35:52)     at anonymous (<input>:48:3)     at loadModule (node:module:551:24)     at l...
- `parallel/test-webstorage.js#test_00_disabled_without_experimental_webstorage`: false == true AssertionError: false == true     at <anonymous> (<input>:27:22)
- `parallel/test-webstorage.js#test_01_emits_a_warning_when_used`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-webstorage.js#test_02_storage_instances_cannot_be_created_in_userland`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-webstorage.js#test_03_sessionstorage_is_not_persisted`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-webstorage.js#test_04_localstorage_throws_without_localstorage_file`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-webstorage.js#test_05_localstorage_is_not_persisted_if_it_is_unused`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-webstorage.js#test_06_localstorage_is_persisted_if_it_is_used`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-webstorage.js#test_07_webstorage_quota_for_localstorage_and_sessionstorage`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-webstreams-abort-controller.js#block_00_block_00`: The "stream" argument must be an stream.Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-abort-controller.js#block_01_block_01`: The "stream" argument must be an stream.Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-abort-controller.js#block_02_block_02`: The "stream" argument must be an stream.Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-abort-controller.js#block_03_block_03`: The "stream" argument must be an stream.Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-abort-controller.js#block_04_block_04`: The "stream" argument must be an stream.Stream. Received an instance of WritableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-abort-controller.js#block_05_block_05`: The "stream" argument must be an stream.Stream. Received an instance of WritableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:46)     at addAbortSignal (__wasm_rquick...
- `parallel/test-webstreams-finished.js#block_00_block_00`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_01_block_01`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_02_block_02`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_03_block_03`: Unhandled promise rejection:     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:46)     at eos (__wasm_rquickjs_builtin/internal/streams/end-of-stream:59:19)     at <anonymous> (...
- `parallel/test-webstreams-finished.js#block_04_block_04`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + 'The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Recei...
- `parallel/test-webstreams-finished.js#block_05_block_05`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + 'The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Recei...
- `parallel/test-webstreams-finished.js#block_06_block_06`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_07_block_07`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_08_block_08`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_09_block_09`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of WritableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_10_block_10`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of WritableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_11_block_11`: Unhandled promise rejection:     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:46)     at eos (__wasm_rquickjs_builtin/internal/streams/end-of-stream:59:19)     at <anonymous> (...
- `parallel/test-webstreams-finished.js#block_12_block_12`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of WritableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_13_block_13`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + 'The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Recei...
- `parallel/test-webstreams-finished.js#block_14_block_14`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_15_block_15`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_16_block_16`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_17_block_17`: The "stream" argument must be an instance of ReadableStream, WritableStream, or Stream. Received an instance of ReadableStream     at ERR_INVALID_ARG_TYPE (__wasm_rquickjs_builtin/internal/errors:424:...
- `parallel/test-webstreams-finished.js#block_18_block_18`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   name: 'AbortError'   }       at rejects (native)
- `parallel/test-webstreams-finished.js#block_19_block_19`: Unhandled promise rejection: AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'TypeError' -   name: 'AbortError'   }       at rejects (native)
- `parallel/test-webstreams-pipeline.js`: Unhandled promise rejection:     at ERR_MISSING_ARGS (__wasm_rquickjs_builtin/internal/errors:604:9)     at pipelineImpl (__wasm_rquickjs_builtin/internal/streams/pipeline:178:19)     at <anonymous> (...
- `parallel/test-webstreams-pipeline.js#block_07_block_07`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-webstreams-pipeline.js#block_08_block_08`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-webstreams-pipeline.js#block_09_block_09`: Unhandled promise rejection:     at ERR_MISSING_ARGS (__wasm_rquickjs_builtin/internal/errors:604:9)     at pipelineImpl (__wasm_rquickjs_builtin/internal/streams/pipeline:178:19)     at <anonymous> (...
- `parallel/test-webstreams-pipeline.js#block_10_block_10`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + 'The "streams" argument must be specified' - 'kaboom'      at <anonymous> (<input>:45:24)     ...
- `parallel/test-whatwg-events-add-event-listener-options-passive.js#block_00_block_00`: The expression evaluated to a falsy value:    ok(supportsPassive)  AssertionError: The expression evaluated to a falsy value:    ok(supportsPassive)      at anonymous (<input>:31:6)     at loadModule ...
- `parallel/test-whatwg-events-add-event-listener-options-signal.js`: The listener was still removed  1 !== 0  AssertionError: The listener was still removed  1 !== 0      at anonymous (<input>:129:15)     at loadModule (node:module:551:24)     at localRequire (node:mod...
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_06_block_06`: The listener was still removed  1 !== 0  AssertionError: The listener was still removed  1 !== 0      at anonymous (<input>:40:15)     at loadModule (node:module:551:24)     at localRequire (node:modu...
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_09_block_09`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:34:5)     at forEach (native)     at anonymous (<input>:33:57)     at loadMo...
- `parallel/test-whatwg-events-customevent.js`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:24:3)     at loadModule (node:module:551:24)     at localRequire (node:module:...
- `parallel/test-whatwg-events-customevent.js#block_01_block_01`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:15:3)     at loadModule (node:module:551:24)     at localRequire (node:module:...
- `parallel/test-whatwg-readablebytestream-bad-buffers-and-views.js#block_00_block_00`: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (<input>:38:45)     at emit (node:events:332:36)     at emit (node:do...
- `parallel/test-whatwg-readablebytestream-bad-buffers-and-views.js#block_01_block_01`: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (<input>:40:45)     at emit (node:events:332:36)     at emit (node:do...
- `parallel/test-whatwg-readablebytestream-bad-buffers-and-views.js#block_02_block_02`: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (<input>:33:45)     at emit (node:events:332:36)     at emit (node:do...
- `parallel/test-whatwg-readablebytestream-bad-buffers-and-views.js#block_03_block_03`: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (<input>:33:45)     at emit (node:events:332:36)     at emit (node:do...
- `parallel/test-whatwg-url-custom-searchparams-constructor.js#block_00_block_00`: not a function     at parseToDict (__wasm_rquickjs_builtin/url:236:20)     at URLSearchParamsPolyfill (__wasm_rquickjs_builtin/url:21:46)     at anonymous (<input>:36:5)     at loadModule (node:module...
- `parallel/test-whatwg-url-custom-searchparams-constructor.js#block_01_block_01`: The input did not match the regular expression /^TypeError: Cannot convert a Symbol value to a string$/. Input:  'TypeError: not a function'  AssertionError: The input did not match the regular expres...
- `parallel/test-whatwg-url-custom-searchparams-delete.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "cannot read property '__URLSearchParams__' of undefined", -   code: 'ERR_INVALID_THIS', -   message: 'Value...
- `parallel/test-whatwg-url-custom-searchparams-delete.js#block_01_emptying_searchparams_should_correctly_update_url_s_query`: Expected values to be strictly equal: + actual - expected  + 'var=1&var=2&var=3' - ''  AssertionError: Expected values to be strictly equal: + actual - expected  + 'var=1&var=2&var=3' - ''      at ano...
- `parallel/test-whatwg-url-custom-searchparams-stringifier.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "cannot read property '__URLSearchParams__' of undefined", -   code: 'ERR_INVALID_THIS', -   message: 'Value...
- `parallel/test-whatwg-url-custom-searchparams-stringifier.js#block_01_different_percent_encoding_rules_than_the_url_itself`: Expected values to be strictly equal: + actual - expected  + '?foo=~bar' - '?foo=%7Ebar'         ^  AssertionError: Expected values to be strictly equal: + actual - expected  + '?foo=~bar' - '?foo=%7E...
- `parallel/test-whatwg-url-properties.js#block_00_block_00`: Expected values to be strictly equal:  '' !== 'toString'  AssertionError: Expected values to be strictly equal:  '' !== 'toString'      at testMethod (<input>:99:22)     at <anonymous> (<input>:13:14)...
- `parallel/test-whatwg-url-properties.js#block_01_block_01`: Expected values to be strictly equal:  '' !== 'toString'  AssertionError: Expected values to be strictly equal:  '' !== 'toString'      at testMethod (<input>:98:22)     at <anonymous> (<input>:13:14)...
- `parallel/test-whatwg-webstreams-encoding.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_ENCODING_NOT_SUPPORTED' - }  AssertionError: Expected values to be strictly deep-equal: + ...
- `parallel/test-whatwg-webstreams-encoding.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_ENCODING_NOT_SUPPORTED' - }  AssertionError: Expected values to be strictly deep-equal: + ...
- `parallel/test-x509-escaping.js#block_00_test_that_all_certificate_chains_provided_by_the_reporter_ar`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-x509-escaping.js#block_01_test_escaping_rules_for_subject_alternative_names`: not a function     at anonymous (<input>:96:22)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-x509-escaping.js#block_02_test_escaping_rules_for_authority_info_access`: not a function     at anonymous (<input>:104:22)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:...
- `parallel/test-x509-escaping.js#block_03_test_escaping_rules_for_the_subject_field`: not a function     at anonymous (<input>:102:22)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:...
- `parallel/test-x509-escaping.js#block_04_the_internal_parsing_logic_must_match_the_json_specification`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'tls is not supported in WebAssembly environment' -   code: 'ERR_TLS_CERT_ALTNAME_FORMAT', -   message: 'Inv...
- `parallel/test-x509-escaping.js#block_05_correctly_i_e_not_simply_split_at_commas`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-x509-escaping.js#block_06_the_subject_must_be_ignored_if_a_dnsname_subject_alternative`: not a function     at anonymous (<input>:43:24)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-x509-escaping.js#block_07_exists_even_if_other_subject_alternative_names_exist`: not a function     at anonymous (<input>:47:24)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `sequential/test-heapdump.js#block_00_block_00`: ENOENT: no such file or directory, chdir '/' -> '/tmp/w'     at chdir (node:process:319:112)     at anonymous (<input>:18:15)     at loadModule (node:module:551:24)     at localRequire (node:module:59...
- `sequential/test-heapdump.js#block_01_block_01`: ENOENT: no such file or directory, chdir '/' -> '/tmp/w'     at chdir (node:process:319:112)     at anonymous (<input>:18:15)     at loadModule (node:module:551:24)     at localRequire (node:module:59...
- `sequential/test-heapdump.js#block_02_block_02`: ENOENT: no such file or directory, chdir '/' -> '/tmp/w'     at chdir (node:process:319:112)     at anonymous (<input>:18:15)     at loadModule (node:module:551:24)     at localRequire (node:module:59...
- `sequential/test-heapdump.js#block_03_block_03`: ENOENT: no such file or directory, chdir '/' -> '/tmp/w'     at chdir (node:process:319:112)     at anonymous (<input>:18:15)     at loadModule (node:module:551:24)     at localRequire (node:module:59...
- `sequential/test-init.js#block_00_block_00`: ENOENT: no such file or directory, chdir '/' -> '/test/sequential'     at chdir (node:process:319:112)     at anonymous (<input>:50:17)     at loadModule (node:module:551:24)     at localRequire (node...
- `sequential/test-init.js#block_01_block_01`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures'     at chdir (node:process:319:112)     at anonymous (<input>:51:26)     at loadModule (node:module:551:24)     at localRequire (node:m...
- `sequential/test-init.js#block_02_block_02`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures/test-init-native'     at chdir (node:process:319:112)     at anonymous (<input>:55:26)     at loadModule (node:module:551:24)     at loc...
- `sequential/test-single-executable-application-assets.js#block_00_block_00`: Cannot find module '../common/sea' from '/test/sequential'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:10:5)     at loadModule (node:...
- `sequential/test-single-executable-application-assets.js#block_01_block_01`: Cannot find module '../common/sea' from '/test/sequential'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:10:5)     at loadModule (node:...
- `sequential/test-single-executable-application-assets.js#block_02_block_02`: Cannot find module '../common/sea' from '/test/sequential'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:10:5)     at loadModule (node:...
- `sequential/test-single-executable-application-snapshot.js#block_00_block_00`: Cannot find module '../common/sea' from '/test/sequential'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:10:5)     at loadModule (node:...
- `sequential/test-single-executable-application-snapshot.js#block_01_block_01`: Cannot find module '../common/sea' from '/test/sequential'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:10:5)     at loadModule (node:...

### perf_hooks

- `parallel/test-perf-hooks-histogram.js#block_00_block_00`: createHistogram is not supported in WebAssembly environment     at createHistogram (node:perf_hooks:174:15)     at anonymous (<input>:21:13)     at loadModule (node:module:551:24)     at localRequire ...
- `parallel/test-perf-hooks-histogram.js#block_01_block_01`: monitorEventLoopDelay is not supported in WebAssembly environment     at monitorEventLoopDelay (node:perf_hooks:170:15)     at anonymous (<input>:23:13)     at loadModule (node:module:551:24)     at l...
- `parallel/test-perf-hooks-histogram.js#block_02_block_02`: createHistogram is not supported in WebAssembly environment     at createHistogram (node:perf_hooks:174:15)     at anonymous (<input>:25:13)     at loadModule (node:module:551:24)     at localRequire ...
- `parallel/test-perf-hooks-histogram.js#block_03_block_03`: createHistogram is not supported in WebAssembly environment     at createHistogram (node:perf_hooks:174:15)     at anonymous (<input>:28:13)     at loadModule (node:module:551:24)     at localRequire ...
- `parallel/test-perf-hooks-histogram.js#block_04_block_04`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-perf-hooks-histogram.js#block_05_block_05`: createHistogram is not supported in WebAssembly environment     at createHistogram (node:perf_hooks:174:15)     at anonymous (<input>:31:14)     at loadModule (node:module:551:24)     at localRequire ...
- `parallel/test-perf-hooks-resourcetiming.js#block_00_performanceresourcetiming_should_not_be_initialized_external`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:17:8)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (...
- `parallel/test-perf-hooks-resourcetiming.js#block_01_using_performance_getentries`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:17:8)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (...
- `parallel/test-perf-hooks-resourcetiming.js#block_02_default_values`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:17:8)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (...
- `parallel/test-perf-hooks-resourcetiming.js#block_03_custom_getters_math`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:17:8)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (...
- `parallel/test-perf-hooks-resourcetiming.js#block_04_using_performanceobserver`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:17:8)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (...
- `parallel/test-perf-hooks-usertiming.js#block_00_block_00`: The expression evaluated to a falsy value:    assert(performance.measure)  AssertionError: The expression evaluated to a falsy value:    assert(performance.measure)      at anonymous (<input>:20:8)   ...
- `parallel/test-perf-hooks-usertiming.js#block_01_block_01`: The expression evaluated to a falsy value:    assert(performance.measure)  AssertionError: The expression evaluated to a falsy value:    assert(performance.measure)      at anonymous (<input>:20:8)   ...
- `parallel/test-perf-hooks-usertiming.js#block_02_block_02`: The expression evaluated to a falsy value:    assert(performance.measure)  AssertionError: The expression evaluated to a falsy value:    assert(performance.measure)      at anonymous (<input>:20:8)   ...
- `parallel/test-performance-function.js#block_00_block_00`: not a function     at anonymous (<input>:20:34)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-performance-function.js#block_01_block_01`: not a function     at anonymous (<input>:25:25)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-performance-function.js#block_02_block_02`: not a function     at anonymous (<input>:24:34)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-performance-function.js#block_03_block_03`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'not a function', -   code: 'ERR_INVALID_ARG_TYPE', -   message: /The "fn" argument must be of type function...
- `parallel/test-performance-function.js#block_04_function_can_be_wrapped_many_times_also_check_length_and_nam`: not a function     at anonymous (<input>:29:34)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-performance-function.js#block_05_regression_tests_for_https_github_com_nodejs_node_issues_406`: not a function     at anonymous (<input>:72:43)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `sequential/test-perf-hooks.js#block_00_block_00`: EBADF: bad file descriptor, write     at createSystemError (node:fs:186:21)     at writeSync (node:fs:1215:37)     at log (<input>:15:22)     at anonymous (<input>:77:1)     at loadModule (node:module...
- `sequential/test-perf-hooks.js#block_01_block_01`: EBADF: bad file descriptor, write     at createSystemError (node:fs:186:21)     at writeSync (node:fs:1215:37)     at log (<input>:15:22)     at anonymous (<input>:65:1)     at loadModule (node:module...

### process

- `parallel/test-process-env-allowed-flags.js#block_00_assert_legit_flags_are_allowed_and_bogus_flags_are_disallowe`: flag should be in set: --perf_basic_prof  false !== true  AssertionError: flag should be in set: --perf_basic_prof  false !== true      at <anonymous> (<input>:38:47)     at forEach (native)     at an...
- `parallel/test-process-env-allowed-flags.js#block_02_assert_immutability_of_process_allowednodeenvironmentflags`: Expected values to be strictly equal:  false !== true  AssertionError: Expected values to be strictly equal:  false !== true      at anonymous (<input>:16:38)     at loadModule (node:module:551:24)   ...
- `parallel/test-process-env.js#block_00_block_00`: spawn is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at spawn (node:child_process:1175:11)     at anonymous (<input>:58:23)     at loadModule...
- `parallel/test-process-getactiveresources-track-timer-lifetime.js#block_00_block_00`: not a function     at anonymous (<input>:10:30)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-process-getactiveresources-track-timer-lifetime.js#block_01_block_01`: not a function     at anonymous (<input>:12:30)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...

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

- `parallel/test-repl-context.js#block_00_test_context_when_useglobal_is_false`: repl is not supported in WebAssembly environment     at start (node:repl:7:15)     at anonymous (<input>:15:18)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at r...
- `parallel/test-repl-context.js#block_01_test_for_context_side_effects`: repl is not supported in WebAssembly environment     at start (node:repl:7:15)     at anonymous (<input>:18:23)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at r...
- `parallel/test-repl-require.js#block_00_block_00`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures'     at chdir (node:process:319:112)     at anonymous (<input>:15:15)     at loadModule (node:module:551:24)     at localRequire (node:m...
- `parallel/test-repl-require.js#block_01_in_repl_we_shouldn_t_look_up_relative_modules_from_node_modu`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures'     at chdir (node:process:319:112)     at anonymous (<input>:15:15)     at loadModule (node:module:551:24)     at localRequire (node:m...
- `parallel/test-repl-tab-complete-import.js#block_00_block_00`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures'     at chdir (node:process:319:112)     at anonymous (<input>:21:15)     at loadModule (node:module:551:24)     at localRequire (node:m...
- `parallel/test-repl-tab-complete-import.js#block_01_block_01`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures'     at chdir (node:process:319:112)     at anonymous (<input>:21:15)     at loadModule (node:module:551:24)     at localRequire (node:m...
- `parallel/test-repl-tab-complete-import.js#block_02_test_tab_completion_for_import_relative_to_the_current_direc`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures'     at chdir (node:process:319:112)     at anonymous (<input>:21:15)     at loadModule (node:module:551:24)     at localRequire (node:m...
- `parallel/test-repl-tab-complete.js#block_00_block_00`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures'     at chdir (node:process:319:112)     at anonymous (<input>:48:15)     at loadModule (node:module:551:24)     at localRequire (node:m...
- `parallel/test-repl-tab-complete.js#block_01_block_01`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures'     at chdir (node:process:319:112)     at anonymous (<input>:48:15)     at loadModule (node:module:551:24)     at localRequire (node:m...
- `parallel/test-repl-tab-complete.js#block_02_test_tab_completion_for_require_relative_to_the_current_dire`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures'     at chdir (node:process:319:112)     at anonymous (<input>:48:15)     at loadModule (node:module:551:24)     at localRequire (node:m...
- `parallel/test-repl-tab-complete.js#block_03_tab_completion_for_files_directories`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures'     at chdir (node:process:319:112)     at anonymous (<input>:48:15)     at loadModule (node:module:551:24)     at localRequire (node:m...
- `parallel/test-repl-tab-complete.js#block_04_block_04`: ENOENT: no such file or directory, chdir '/' -> '/test/fixtures'     at chdir (node:process:319:112)     at anonymous (<input>:48:15)     at loadModule (node:module:551:24)     at localRequire (node:m...

### stream

- `parallel/test-stream-base-typechecking.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-destroy.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-destroy.js#block_04_block_04`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-destroy.js#block_05_block_05`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-finished.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-finished.js#block_33_block_33`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-finished.js#block_34_block_34`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-finished.js#block_39_block_39`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-pipeline.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-pipeline.js#block_05_block_05`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-pipeline.js#block_06_block_06`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-pipeline.js#block_07_block_07`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-pipeline.js#block_08_block_08`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-pipeline.js#block_17_block_17`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-pipeline.js#block_45_block_45`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-pipeline.js#block_49_block_49`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-pipeline.js#block_55_block_55`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-pipeline.js#block_57_block_57`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-readable-async-iterators.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-readable-async-iterators.js#block_05_block_05`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-readable-async-iterators.js#block_06_block_06`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream-toWeb-allows-server-response.js`: Unhandled promise rejection:     at parseNativeError (node:net:75:25)     at <anonymous> (node:net:839:46)
- `parallel/test-stream2-writable.js`: not a function     at <anonymous> (__wasm_rquickjs_builtin/internal/streams/readable:704:10)     at anonymous (<input>:303:10)     at loadModule (node:module:551:24)     at localRequire (node:module:5...
- `parallel/test-stream2-writable.js#block_13_block_13`: not a function     at <anonymous> (__wasm_rquickjs_builtin/internal/streams/readable:704:10)     at anonymous (<input>:89:10)     at loadModule (node:module:551:24)     at localRequire (node:module:59...
- `parallel/test-streams-highwatermark.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_INVALID_ARG_VALUE', +   message: `The property 'options.highWaterMark' is invalid. Received "5"`, -   mess...
- `parallel/test-streams-highwatermark.js#block_04_block_04`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:29:14)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require ...

### test_runner

- `parallel/test-runner-assert.js#test_00_expected_methods_are_on_t_assert`: Expected values to be strictly deep-equal: + actual - expected ... Skipped lines    [ +   'AssertionError', +   'CallTracker',     'deepEqual',     'deepStrictEqual',     'doesNotMatch',     'doesNotR...
- `parallel/test-runner-cli-concurrency.js#test_00_default_concurrency`: cannot read property 'toString' of undefined     at <anonymous> (<input>:16:16)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:13:1)   ...
- `parallel/test-runner-cli-concurrency.js#test_01_concurrency_of_one`: cannot read property 'toString' of undefined     at <anonymous> (<input>:22:16)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:19:1)   ...
- `parallel/test-runner-cli-concurrency.js#test_02_concurrency_of_two`: cannot read property 'toString' of undefined     at <anonymous> (<input>:28:16)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:25:1)   ...
- `parallel/test-runner-cli-concurrency.js#test_03_isolation_none_uses_a_concurrency_of_one`: cannot read property 'toString' of undefined     at <anonymous> (<input>:34:16)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:31:1)   ...
- `parallel/test-runner-cli-concurrency.js#test_04_isolation_none_overrides_test_concurrency`: cannot read property 'toString' of undefined     at <anonymous> (<input>:42:16)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:37:1)   ...
- `parallel/test-runner-cli-timeout.js#test_00_default_timeout_infinity`: cannot read property 'toString' of undefined     at <anonymous> (<input>:16:16)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:13:1)   ...
- `parallel/test-runner-cli-timeout.js#test_01_timeout_of_10ms`: The input did not match the regular expression /timeout: 10,/. Input:  "Error: Cannot find module '/test/fixtures/test-runner/default-behavior/10' from '/'\n" +   '    at resolveFilename (node:module:...
- `parallel/test-runner-cli-timeout.js#test_02_isolation_none_uses_the_test_timeout_flag`: cannot read property 'toString' of undefined     at <anonymous> (<input>:30:16)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:25:1)   ...
- `parallel/test-runner-cli.js#block_00_block_00`: The input did not match the regular expression /^Could not find/. Input:  "Error: Cannot find module '/a-random-file-that-does-not-exist.js' from '/'\n" +   '    at resolveFilename (node:module:270:80...
- `parallel/test-runner-cli.js#block_01_block_01`: The input did not match the regular expression /^Could not find/. Input:  "Error: Cannot find module '/a-random-file-that-does-not-exist.js' from '/'\n" +   '    at resolveFilename (node:module:270:80...
- `parallel/test-runner-cli.js#block_02_block_02`: The input did not match the regular expression /^Could not find/. Input:  "Error: Cannot find module '/a-random-file-that-does-not-exist.js' from '/'\n" +   '    at resolveFilename (node:module:270:80...
- `parallel/test-runner-cli.js#block_03_block_03`: The input did not match the regular expression /^Could not find/. Input:  "Error: Cannot find module '/a-random-file-that-does-not-exist.js' from '/'\n" +   '    at resolveFilename (node:module:270:80...
- `parallel/test-runner-cli.js#block_04_block_04`: The input did not match the regular expression /^Could not find/. Input:  "Error: Cannot find module '/a-random-file-that-does-not-exist.js' from '/'\n" +   '    at resolveFilename (node:module:270:80...
- `parallel/test-runner-cli.js#block_05_block_05`: The input did not match the regular expression /^Could not find/. Input:  "Error: Cannot find module '/a-random-file-that-does-not-exist.js' from '/'\n" +   '    at resolveFilename (node:module:270:80...
- `parallel/test-runner-cli.js#block_06_block_06`: The input did not match the regular expression /^Could not find/. Input:  "Error: Cannot find module '/a-random-file-that-does-not-exist.js' from '/'\n" +   '    at resolveFilename (node:module:270:80...
- `parallel/test-runner-cli.js#block_07_block_07`: The input did not match the regular expression /^Could not find/. Input:  "Error: Cannot find module '/a-random-file-that-does-not-exist.js' from '/'\n" +   '    at resolveFilename (node:module:270:80...
- `parallel/test-runner-cli.js#block_08_block_08`: The input did not match the regular expression /^Could not find/. Input:  "Error: Cannot find module '/a-random-file-that-does-not-exist.js' from '/'\n" +   '    at resolveFilename (node:module:270:80...
- `parallel/test-runner-cli.js#block_09_block_09`: The input did not match the regular expression /^Could not find/. Input:  "Error: Cannot find module '/a-random-file-that-does-not-exist.js' from '/'\n" +   '    at resolveFilename (node:module:270:80...
- `parallel/test-runner-cli.js#block_10_block_10`: The input did not match the regular expression /^Could not find/. Input:  "Error: Cannot find module '/a-random-file-that-does-not-exist.js' from '/'\n" +   '    at resolveFilename (node:module:270:80...
- `parallel/test-runner-concurrency.js#test_01_concurrency_option_boolean_false`: Expected values to be strictly equal:  false !== true  AssertionError: Expected values to be strictly equal:  false !== true      at <anonymous> (<input>:36:26)     at call (native)     at runTest (no...
- `parallel/test-runner-coverage.js#test_00_test_coverage_report`: The expression evaluated to a falsy value:    assert(!findCoverageFileForPid(result.pid))  AssertionError: The expression evaluated to a falsy value:    assert(!findCoverageFileForPid(result.pid))    ...
- `parallel/test-runner-custom-assertions.js#test_00_throws_if_name_is_not_a_string`: cannot read property 'register' of undefined     at anonymous (<input>:9:1)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-runner-custom-assertions.js#test_01_throws_if_fn_is_not_a_function`: cannot read property 'register' of undefined     at anonymous (<input>:9:1)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-runner-custom-assertions.js#test_02_invokes_a_custom_assertion_as_part_of_the_test_plan`: cannot read property 'register' of undefined     at anonymous (<input>:9:1)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-runner-custom-assertions.js#test_03_can_override_existing_assertions`: cannot read property 'register' of undefined     at anonymous (<input>:9:1)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-runner-custom-assertions.js#test_04_this_is_set_to_the_testcontext`: cannot read property 'register' of undefined     at anonymous (<input>:9:1)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at r...
- `parallel/test-runner-error-reporter.js#test_00_all_tests_failures_reported_without_fail_fast_flag`: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (<input>:22:22)     at call (native)     at runTest (node:test:286:30...
- `parallel/test-runner-error-reporter.js#test_01_fail_fast_stops_test_execution_after_first_failure`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (<input>:34:22)     at call (native)     at runTest (node:test:286:30...
- `parallel/test-runner-extraneous-async-activity.js#block_00_block_00`: The input did not match the regular expression /Error: Test "extraneous async activity test" at .+extraneous_set_immediate_async\.mjs:3:1 generated asynchronous activity after the test ended/m. Input:...
- `parallel/test-runner-extraneous-async-activity.js#block_01_block_01`: The input did not match the regular expression /Error: Test "extraneous async activity test" at .+extraneous_set_timeout_async\.mjs:3:1 generated asynchronous activity after the test ended/m. Input:  ...
- `parallel/test-runner-extraneous-async-activity.js#block_02_block_02`: The input did not match the regular expression /Error: Test hook "before" at .+async-error-in-test-hook\.mjs:3:1 generated asynchronous activity after the test ended/m. Input:  ''  AssertionError: The...
- `parallel/test-runner-extraneous-async-activity.js#block_03_block_03`: The input did not match the regular expression /Error: Test hook "before" at .+async-error-in-test-hook\.mjs:3:1 generated asynchronous activity after the test ended/m. Input:  ''  AssertionError: The...
- `parallel/test-runner-force-exit-flush.js#test_00_junit_reporter`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at runWithReporter (<input>:24:15)     at <anonymous> (<input>:31:31)     at call (n...
- `parallel/test-runner-force-exit-flush.js#test_01_spec_reporter`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at runWithReporter (<input>:24:15)     at <anonymous> (<input>:40:31)     at call (n...
- `parallel/test-runner-force-exit-flush.js#test_02_tap_reporter`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at runWithReporter (<input>:24:15)     at <anonymous> (<input>:47:31)     at call (n...
- `parallel/test-runner-mocking.js#test_00_spies_on_a_function`: Expected values to be strictly equal: + actual - expected  + undefined - 1000  AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - 1000      at <anonymous> (<input...
- `parallel/test-runner-mocking.js#test_02_spies_on_a_constructor`: class constructors must be invoked with 'new'     at Clazz (<input>:67:5)     at apply (native)     at wrapper (node:test:777:35)     at <anonymous> (<input>:79:24)     at call (native)     at runTest...
- `parallel/test-runner-mocking.js#test_05_functions_can_be_mocked_multiple_times_at_once`: Expected values to be strictly equal:  8 !== 2  AssertionError: Expected values to be strictly equal:  8 !== 2      at <anonymous> (<input>:143:22)     at call (native)     at runTest (node:test:286:3...
- `parallel/test-runner-mocking.js#test_07_methods_can_be_mocked_multiple_times_but_not_at_the_same_tim`: not a function     at <anonymous> (<input>:214:16)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:179:1)     at loadModule (node:module...
- `parallel/test-runner-mocking.js#test_08_spies_on_an_object_method`: Expected values to be strictly equal: + actual - expected  + undefined - { -   method: [Function: wrapper] { -     mock: { -       calls: [ -         { -           arguments: [ -             1, -     ...
- `parallel/test-runner-mocking.js#test_09_spies_on_a_getter`: no setter for property     at <anonymous> (node:test:762:5)     at <anonymous> (<input>:256:32)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (...
- `parallel/test-runner-mocking.js#test_10_spies_on_a_setter`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (<input>:290:22)     at call (native)     at runTest (node:test:286:3...
- `parallel/test-runner-mocking.js#test_11_spy_functions_can_be_bound`: Expected values to be strictly equal: + actual - expected  + undefined - 1000  AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - 1000      at <anonymous> (<input...
- `parallel/test-runner-mocking.js#test_12_mocks_prototype_methods_on_an_instance`: Expected values to be strictly equal: + actual - expected  + undefined - Runner { -   someTask: [Function: wrapper] { -     mock: { -       calls: [ -         { -           arguments: [ -             ...
- `parallel/test-runner-mocking.js#test_13_spies_on_async_static_class_methods`: Expected values to be strictly equal: + actual - expected  + undefined - [class Runner]  AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - [class Runner]      at...
- `parallel/test-runner-mocking.js#test_14_given_null_to_a_mock_method_it_throws_a_invalid_argument_err`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-runner-mocking.js#test_15_it_should_throw_given_an_inexistent_property_on_a_object_ins`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (<input>:402:10)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at...
- `parallel/test-runner-mocking.js#test_16_spy_functions_can_be_used_on_classes_inheritance`: Expected values to be strictly equal: + actual - expected  + undefined - [class C extends B] { -   someTask: [Function: wrapper] { -     mock: { -       calls: [ -         { -           arguments: [ -...
- `parallel/test-runner-mocking.js#test_17_spy_functions_don_t_affect_the_prototype_chain`: The expression evaluated to a falsy value:    assert.ok(CAfterMockHasDescriptor)  AssertionError: The expression evaluated to a falsy value:    assert.ok(CAfterMockHasDescriptor)      at <anonymous> (...
- `parallel/test-runner-mocking.js#test_19_mocked_constructors_report_thrown_errors`: The input did not match the regular expression /test error/. Input:  "TypeError: class constructors must be invoked with 'new'"  AssertionError: The input did not match the regular expression /test er...
- `parallel/test-runner-mocking.js#test_20_mocks_a_function`: Expected values to be strictly equal:  7 !== -1  AssertionError: Expected values to be strictly equal:  7 !== -1      at <anonymous> (<input>:523:22)     at call (native)     at runTest (node:test:286...
- `parallel/test-runner-mocking.js#test_21_mocks_a_constructor`: class constructors must be invoked with 'new'     at Clazz (<input>:553:5)     at apply (native)     at wrapper (node:test:777:35)     at <anonymous> (<input>:574:24)     at call (native)     at runTe...
- `parallel/test-runner-mocking.js#test_22_mocks_an_object_method`: Expected values to be strictly equal: + actual - expected  + undefined - { -   method: [Function: wrapper] { -     mock: { -       calls: [ -         { -           arguments: [ -             1, -     ...
- `parallel/test-runner-mocking.js#test_23_mocks_a_getter`: no setter for property     at <anonymous> (node:test:762:5)     at <anonymous> (<input>:638:32)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (...
- `parallel/test-runner-mocking.js#test_24_mocks_a_setter`: Expected values to be strictly equal:  77 !== -77  AssertionError: Expected values to be strictly equal:  77 !== -77      at <anonymous> (<input>:675:22)     at call (native)     at runTest (node:test...
- `parallel/test-runner-mocking.js#test_25_mocks_a_getter_with_syntax_sugar`: cannot read property 'mock' of undefined     at <anonymous> (<input>:703:22)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:691:1)     ...
- `parallel/test-runner-mocking.js#test_26_mocks_a_setter_with_syntax_sugar`: cannot read property 'mock' of undefined     at <anonymous> (<input>:736:22)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:717:1)     ...
- `parallel/test-runner-mocking.js#test_27_mocked_functions_match_name_and_length`: Expected values to be strictly deep-equal: + actual - expected ... Skipped lines    {     length: {       configurable: true,       enumerable: false,       value: 0, ...       enumerable: false, +   ...
- `parallel/test-runner-mocking.js#test_28_method_fails_if_method_cannot_be_redefined`: The input did not match the regular expression /Cannot redefine property: method/. Input:  "TypeError: 'method' is read-only"  AssertionError: The input did not match the regular expression /Cannot re...
- `parallel/test-runner-mocking.js#test_29_method_fails_if_field_is_a_property_instead_of_a_method`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (<input>:818:10)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at...
- `parallel/test-runner-mocking.js#test_30_mocks_can_be_auto_restored`: Expected values to be strictly equal:  1 !== 2  AssertionError: Expected values to be strictly equal:  1 !== 2      at <anonymous> (<input>:840:22)     at call (native)     at runTest (node:test:286:3...
- `parallel/test-runner-mocking.js#test_31_mock_implementation_can_be_changed_dynamically`: not a function     at <anonymous> (<input>:866:30)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:846:1)     at loadModule (node:module...
- `parallel/test-runner-mocking.js#test_33_reset_mock_calls`: Expected values to be strictly equal:  3 !== -1  AssertionError: Expected values to be strictly equal:  3 !== -1      at <anonymous> (<input>:942:22)     at call (native)     at runTest (node:test:286...
- `parallel/test-runner-mocking.js#test_34_uses_top_level_mock`: Expected values to be strictly equal:  7 !== -1  AssertionError: Expected values to be strictly equal:  7 !== -1      at <anonymous> (<input>:966:22)     at call (native)     at runTest (node:test:286...
- `parallel/test-runner-mocking.js#test_35_the_getter_and_setter_options_cannot_be_used_together`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (<input>:974:10)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at...
- `parallel/test-runner-mocking.js#test_36_method_names_must_be_strings_or_symbols`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (<input>:989:10)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at...
- `parallel/test-runner-mocking.js#test_37_the_times_option_must_be_an_integer_1`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (<input>:995:10)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at...
- `parallel/test-runner-mocking.js#test_38_spies_on_a_class_prototype_method`: Expected values to be strictly equal: + actual - expected  + undefined - Clazz { -   c: 85 - }  AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Clazz { -   c: ...
- `parallel/test-runner-mocking.js#test_39_getter_fails_if_getter_options_set_to_false`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (<input>:1038:10)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     a...
- `parallel/test-runner-mocking.js#test_40_setter_fails_if_setter_options_set_to_false`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (<input>:1044:10)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     a...
- `parallel/test-runner-mocking.js#test_41_getter_fails_if_setter_options_is_true`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (<input>:1050:10)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     a...
- `parallel/test-runner-mocking.js#test_42_setter_fails_if_getter_options_is_true`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (<input>:1056:10)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     a...
- `parallel/test-runner-module-mocking.js#test_00_input_validation`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-runner-module-mocking.js#test_01_core_module_mocking_with_namedexports_option`: not a function     at <anonymous> (<input>:54:12)     at call (native)     at runSubtest (node:test:125:30)     at <anonymous> (node:test:145:12)     at <anonymous> (<input>:48:11)     at call (native...
- `parallel/test-runner-module-mocking.js#test_02_cjs_mocking_with_namedexports_option`: not a function     at <anonymous> (<input>:161:33)     at call (native)     at runSubtest (node:test:125:30)     at <anonymous> (node:test:145:12)     at <anonymous> (<input>:154:11)     at call (nati...
- `parallel/test-runner-module-mocking.js#test_03_esm_mocking_with_namedexports_option`: Error resolving module 'file:///test/fixtures/module-mocking/basic-esm.mjs' from '<input>' ReferenceError: Error resolving module 'file:///test/fixtures/module-mocking/basic-esm.mjs' from '<input>'
- `parallel/test-runner-module-mocking.js#test_04_modules_cannot_be_mocked_multiple_times_at_once`: not a function     at <anonymous> (<input>:376:19)     at call (native)     at runSubtest (node:test:125:30)     at <anonymous> (node:test:145:12)     at <anonymous> (<input>:372:11)     at call (nati...
- `parallel/test-runner-module-mocking.js#test_05_mocks_are_automatically_restored`: not a function     at <anonymous> (<input>:436:33)     at call (native)     at runSubtest (node:test:125:30)     at <anonymous> (node:test:145:12)     at <anonymous> (<input>:435:11)     at call (nati...
- `parallel/test-runner-module-mocking.js#test_06_mocks_can_be_restored_independently`: not a function     at <anonymous> (<input>:468:47)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:464:1)     at loadModule (node:module...
- `parallel/test-runner-module-mocking.js#test_07_core_module_mocks_can_be_used_by_both_module_systems`: not a function     at <anonymous> (<input>:496:27)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:495:1)     at loadModule (node:module...
- `parallel/test-runner-module-mocking.js#test_08_node_core_module_mocks_can_be_used_by_both_module_systems`: not a function     at <anonymous> (<input>:515:27)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:514:1)     at loadModule (node:module...
- `parallel/test-runner-module-mocking.js#test_09_cjs_mocks_can_be_used_by_both_module_systems`: not a function     at <anonymous> (<input>:536:33)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:533:1)     at loadModule (node:module...
- `parallel/test-runner-module-mocking.js#test_10_relative_paths_can_be_used_by_both_module_systems`: not a function     at <anonymous> (<input>:558:30)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:554:1)     at loadModule (node:module...
- `parallel/test-runner-module-mocking.js#test_11_node_modules_can_be_used_by_both_module_systems`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-runner-module-mocking.js#test_12_file_imports_are_supported_in_esm_only`: not a function     at <anonymous> (<input>:592:30)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:590:1)     at loadModule (node:module...
- `parallel/test-runner-module-mocking.js#test_13_mocked_modules_do_not_impact_unmocked_modules`: not a function     at <anonymous> (<input>:609:10)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:606:1)     at loadModule (node:module...
- `parallel/test-runner-module-mocking.js#test_14_defaultexports_work_with_cjs_mocks_in_both_module_systems`: not a function     at <anonymous> (<input>:627:17)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:620:1)     at loadModule (node:module...
- `parallel/test-runner-module-mocking.js#test_15_defaultexports_work_with_esm_mocks_in_both_module_systems`: Error resolving module 'file:///test/fixtures/module-mocking/basic-esm.mjs' from '<input>' ReferenceError: Error resolving module 'file:///test/fixtures/module-mocking/basic-esm.mjs' from '<input>'
- `parallel/test-runner-module-mocking.js#test_16_wrong_import_syntax_should_throw_error_after_module_mocking`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-runner-module-mocking.js#test_17_should_throw_err_access_denied_when_permission_model_is_enab`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-runner-module-mocking.js#test_18_should_work_when_allow_worker_is_passed_and_permission_model`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-runner-no-isolation-filtering.js#test_00_works_with_test_only`: The input did not match the regular expression /# tests 2/. Input:  ''  AssertionError: The input did not match the regular expression /# tests 2/. Input:  ''      at <anonymous> (<input>:28:16)     a...
- `parallel/test-runner-no-isolation-filtering.js#test_01_works_with_test_name_pattern`: The input did not match the regular expression /# tests 0/. Input:  ''  AssertionError: The input did not match the regular expression /# tests 0/. Input:  ''      at <anonymous> (<input>:51:16)     a...
- `parallel/test-runner-no-isolation-filtering.js#test_02_works_with_test_skip_pattern`: The input did not match the regular expression /# tests 1/. Input:  ''  AssertionError: The input did not match the regular expression /# tests 1/. Input:  ''      at <anonymous> (<input>:69:16)     a...
- `parallel/test-runner-snapshot-file-tests.js#test_00_t_assert_filesnapshot_validation`: 4 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:12:1)     at loadModule (node:module:551:24)    ...
- `parallel/test-runner-snapshot-file-tests.js#test_01_t_assert_filesnapshot_update_read_flow`: Only --eval/-e and --input-type are supported in WASM child emulation     at parseInlineEvalArgs (<input>:90:19)     at runInlineEval (<input>:124:38)     at spawnPromisified (<input>:520:50)     at <...
- `parallel/test-runner-test-filepath.js#test_00_suite`: cannot read property 'filePath' of undefined     at <anonymous> (<input>:14:15)     at runSuite (node:test:404:22)     at describe (node:test:644:27)     at anonymous (<input>:13:1)     at loadModule ...
- `parallel/test-runner-test-filepath.js#test_01_test_01`: Expected values to be strictly equal: + actual - expected  + undefined - '/test/parallel/test-runner-test-filepath.js'  AssertionError: Expected values to be strictly equal: + actual - expected  + und...
- `parallel/test-runner-test-fullname.js#test_00_suite`: cannot read property 'fullName' of undefined     at <anonymous> (<input>:10:15)     at runSuite (node:test:404:22)     at describe (node:test:644:27)     at anonymous (<input>:9:1)     at loadModule (...
- `parallel/test-runner-wait-for.js#test_00_input_validation`: 4 test(s) failed     at executeSuite (node:test:492:59)     at runSuite (node:test:426:25)     at describe (node:test:644:27)     at anonymous (<input>:8:1)     at loadModule (node:module:551:24)     ...
- `parallel/test-runner-wait-for.js#test_01_returns_the_result_of_the_condition_function`: not a function     at <anonymous> (<input>:47:26)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:46:1)     at loadModule (node:module:5...
- `parallel/test-runner-wait-for.js#test_02_returns_the_result_of_an_async_condition_function`: not a function     at <anonymous> (<input>:55:34)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:54:1)     at loadModule (node:module:5...
- `parallel/test-runner-wait-for.js#test_03_errors_if_the_condition_times_out`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'not a function' -   message: /waitFor\(\) timed out/   }  AssertionError: Expected values to be strictly de...
- `parallel/test-runner-wait-for.js#test_04_polls_until_the_condition_returns_successfully`: not a function     at <anonymous> (<input>:77:26)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:75:1)     at loadModule (node:module:5...
- `parallel/test-runner-wait-for.js#test_05_sets_last_failure_as_error_cause_on_timeouts`: The input did not match the regular expression /timed out/. Input:  'not a function'  AssertionError: The input did not match the regular expression /timed out/. Input:  'not a function'      at <anon...
- `parallel/test-runner-wait-for.js#test_06_limits_polling_if_condition_takes_longer_than_interval`: not a function     at <anonymous> (<input>:120:34)     at call (native)     at runTest (node:test:286:30)     at test (node:test:575:26)     at anonymous (<input>:108:1)     at loadModule (node:module...

### tls

- `parallel/test-tls-basic-validations.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'tls is not supported in WebAssembly environment', +   name: 'Error' -   code: 'ERR_INVALID_ARG_TYPE', -   m...
- `parallel/test-tls-basic-validations.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'tls is not supported in WebAssembly environment', +   name: 'Error' -   code: 'ERR_INVALID_ARG_TYPE', -   m...
- `parallel/test-tls-basic-validations.js#block_02_block_02`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'tls is not supported in WebAssembly environment', +   name: 'Error' -   code: 'ERR_INVALID_ARG_TYPE', -   m...
- `parallel/test-tls-connect-allow-half-open-option.js#block_00_block_00`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-connect-allow-half-open-option.js#block_01_block_01`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-external-accessor.js#block_00_ensure_accessing_external_doesn_t_hit_an_assert_in_the_acces`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-external-accessor.js#block_01_block_01`: not a function     at anonymous (<input>:15:20)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-tls-server-parent-constructor-options.js#block_00_block_00`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-server-parent-constructor-options.js#block_01_block_01`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-socket-allow-half-open-option.js#block_00_block_00`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-socket-allow-half-open-option.js#block_01_block_01`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-socket-allow-half-open-option.js#block_02_block_02`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-socket-allow-half-open-option.js#block_03_block_03`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `parallel/test-tls-translate-peer-certificate.js#block_00_block_00`: Cannot find module '_tls_common'     at localRequire (node:module:594:59)     at anonymous (<input>:11:38)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at requir...
- `parallel/test-tls-translate-peer-certificate.js#block_01_block_01`: Cannot find module '_tls_common'     at localRequire (node:module:594:59)     at anonymous (<input>:11:38)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at requir...
- `sequential/test-tls-connect.js#block_00_uncatchable_exception_on_tls_connection_error`: tls is not supported in WebAssembly environment     at <anonymous> (node:tls:6:33)
- `sequential/test-tls-connect.js#block_01_ssl_accept_ssl_connect_error_handling`: The input did not match the regular expression /no cipher match/i. Input:  'Error: tls is not supported in WebAssembly environment'  AssertionError: The input did not match the regular expression /no ...

### v8

- `parallel/test-v8-collect-gc-profile-exit-before-stop.js#block_00_test_if_it_makes_the_process_crash`: not a function     at anonymous (<input>:9:24)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:14...
- `parallel/test-v8-collect-gc-profile-exit-before-stop.js#block_01_block_01`: not a function     at anonymous (<input>:10:24)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-v8-query-objects.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_TYPE' - }  AssertionError: Expected values to be strictly deep-equal: + actual...
- `parallel/test-v8-query-objects.js#block_01_block_01`: not a function     at anonymous (<input>:26:38)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-v8-query-objects.js#block_02_block_02`: not a function     at anonymous (<input>:29:35)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-v8-query-objects.js#block_03_block_03`: not a function     at anonymous (<input>:29:38)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-v8-query-objects.js#block_04_block_04`: not a function     at anonymous (<input>:37:35)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...

### vm

- `parallel/test-vm-basic.js#block_00_vm_runinnewcontext`: Expected values to be strictly deep-equal: + actual - expected  + {} - { -   foo: 'bar', -   typeofProcess: 'undefined' - }  AssertionError: Expected values to be strictly deep-equal: + actual - expec...
- `parallel/test-vm-basic.js#block_01_vm_runincontext`: Expected values to be strictly deep-equal: + actual - expected    { +   [Symbol(vm.context)]: 1, -   baz: 'bar',     foo: 'bar', -   typeofProcess: 'undefined'   }  AssertionError: Expected values to ...
- `parallel/test-vm-basic.js#block_02_vm_runinthiscontext`: Expected values to be strictly equal: + actual - expected  + '[object Object]' - '[object process]'            ^  AssertionError: Expected values to be strictly equal: + actual - expected  + '[object ...
- `parallel/test-vm-basic.js#block_03_vm_runinnewcontext`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:61:42)     at forEach (native)     at anonymous (<input>:54:18)     at loadM...
- `parallel/test-vm-basic.js#block_04_vm_createcontext`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:59:42)     at forEach (native)     at anonymous (<input>:52:18)     at loadM...
- `parallel/test-vm-basic.js#block_05_run_script_with_filename`: The "checkErr" validation function is expected to return "true". Received false  Caught error:  Error: boom AssertionError: The "checkErr" validation function is expected to return "true". Received fa...
- `parallel/test-vm-basic.js#block_06_vm_compilefunction`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (<input>:55:42)     at forEach (native)     at anonymous (<input>:48:18)     at loadM...
- `parallel/test-vm-codegen.js#block_00_block_00`: WebAssembly is not defined     at <anonymous> (eval_script:1:19)     at <eval> (eval_script:1:64)     at runInContext (__wasm_rquickjs_builtin/vm:260:54)     at anonymous (<input>:16:16)     at loadMo...
- `parallel/test-vm-codegen.js#block_01_block_01`: The "EvalError" validation function is expected to return "true". Received EvalError: ReferenceError: x is not defined     at call (native)     at expectedException (node:assert:1943:31)     at expect...
- `parallel/test-vm-codegen.js#block_02_block_02`: WebAssembly is not defined     at <anonymous> (eval_script:1:19)     at <eval> (eval_script:1:64)     at runInContext (__wasm_rquickjs_builtin/vm:260:54)     at anonymous (<input>:24:24)     at loadMo...
- `parallel/test-vm-context-dont-contextify.js#block_00_block_00`: cannot read property 'DONT_CONTEXTIFY' of undefined     at anonymous (<input>:15:36)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)...
- `parallel/test-vm-context-dont-contextify.js#block_01_block_01`: cannot read property 'DONT_CONTEXTIFY' of undefined     at anonymous (<input>:17:36)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)...
- `parallel/test-vm-context-dont-contextify.js#block_02_block_02`: cannot read property 'DONT_CONTEXTIFY' of undefined     at anonymous (<input>:19:36)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)...
- `parallel/test-vm-context-dont-contextify.js#block_03_block_03`: cannot read property 'DONT_CONTEXTIFY' of undefined     at anonymous (<input>:23:24)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)...
- `parallel/test-vm-context-dont-contextify.js#block_04_block_04`: cannot read property 'DONT_CONTEXTIFY' of undefined     at anonymous (<input>:24:5)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26) ...
- `parallel/test-vm-context-dont-contextify.js#block_05_block_05`: cannot read property 'DONT_CONTEXTIFY' of undefined     at anonymous (<input>:25:36)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)...
- `parallel/test-vm-context-dont-contextify.js#block_06_block_06`: cannot read property 'DONT_CONTEXTIFY' of undefined     at anonymous (<input>:78:36)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)...
- `parallel/test-vm-context-dont-contextify.js#block_07_block_07`: cannot read property 'DONT_CONTEXTIFY' of undefined     at anonymous (<input>:80:36)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)...
- `parallel/test-vm-measure-memory-lazy.js#block_00_or_otherwise_these_may_not_resolve`: Cannot find module '../common/measure-memory' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:10:5)     at loadModu...
- `parallel/test-vm-measure-memory-lazy.js#block_01_block_01`: Cannot find module '../common/measure-memory' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:10:5)     at loadModu...
- `parallel/test-vm-measure-memory-lazy.js#block_02_block_02`: Cannot find module '../common/measure-memory' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:10:5)     at loadModu...
- `parallel/test-vm-measure-memory-lazy.js#block_03_block_03`: Cannot find module '../common/measure-memory' from '/test/parallel'     at resolveFilename (node:module:270:80)     at localRequire (node:module:589:44)     at anonymous (<input>:10:5)     at loadModu...
- `parallel/test-vm-new-script-new-context.js`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at anonymous (<input>:73:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-vm-new-script-new-context.js#block_04_block_04`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at anonymous (<input>:49:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-vm-new-script-new-context.js#block_07_block_07`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:47:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require ...

### worker_threads

- `parallel/test-worker-broadcastchannel-wpt.js#block_00_block_00`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at anonymous (<input>:12:18)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-worker-broadcastchannel-wpt.js#block_01_block_01`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at anonymous (<input>:37:18)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-worker-broadcastchannel-wpt.js#block_02_block_02`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at anonymous (<input>:17:18)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-worker-broadcastchannel-wpt.js#block_03_block_03`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at anonymous (<input>:19:18)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-worker-broadcastchannel-wpt.js#block_04_block_04`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at anonymous (<input>:21:18)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-worker-broadcastchannel-wpt.js#block_05_block_05`: worker_threads is not supported in WebAssembly environment     at BroadcastChannel (node:worker_threads:234:19)     at anonymous (<input>:26:20)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-worker-broadcastchannel.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_02_block_02`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_03_block_03`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_04_block_04`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_05_block_05`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_06_block_06`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_07_block_07`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-broadcastchannel.js#block_08_block_08`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'worker_threads is not supported in WebAssembly environment' -   message: /Cannot convert a Symbol value to ...
- `parallel/test-worker-execargv-invalid.js#block_00_block_00`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:15:10)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-worker-execargv-invalid.js#block_01_block_01`: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at anonymous (<input>:16:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)...
- `parallel/test-worker-execargv-invalid.js#block_02_block_02`: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at anonymous (<input>:18:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)...
- `parallel/test-worker-message-event.js#block_00_block_00`: MessageEvent is not defined     at anonymous (<input>:54:20)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-co...
- `parallel/test-worker-message-event.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'MessageEvent is not defined', +   name: 'ReferenceError' -   message: /MessageEvent constructor: Expected e...
- `parallel/test-worker-message-event.js#block_02_block_02`: MessageEvent is not defined     at anonymous (<input>:14:14)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-co...
- `parallel/test-worker-message-mark-as-uncloneable.js#block_00_uncloneables_cannot_be_cloned_during_message_posting`: not a function     at anonymous (<input>:15:21)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-worker-message-mark-as-uncloneable.js#block_01_uncloneables_cannot_be_cloned_during_structured_cloning`: not a function     at anonymous (<input>:25:21)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-worker-message-mark-as-uncloneable.js#block_02_markasuncloneable_cannot_affect_arraybuffer`: not a function     at anonymous (<input>:22:21)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-worker-message-mark-as-uncloneable.js#block_03_markasuncloneable_can_affect_node_js_built_in_object_like_bl`: not a function     at anonymous (<input>:32:21)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-worker-message-port-close.js#block_00_block_00`: not a function     at anonymous (<input>:23:9)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:14...
- `parallel/test-worker-message-port-close.js#block_02_block_02`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:21:10)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require ...
- `parallel/test-worker-message-port-message-port-transferring.js`: Transfer list item is not transferable     at DOMException (__wasm_rquickjs_builtin/abort_controller:27:9)     at dataCloneError (__wasm_rquickjs_builtin/structured_clone:243:16)     at structuredClon...
- `parallel/test-worker-message-port-transfer-duplicate.js#block_00_block_00`: The input did not match the regular expression /^DataCloneError: Transfer list contains duplicate MessagePort$/. Input:  'DataCloneError: Transfer list item is not transferable'  AssertionError: The i...
- `parallel/test-worker-message-port-transfer-duplicate.js#block_01_block_01`: The input did not match the regular expression /^DataCloneError: Transfer list contains duplicate ArrayBuffer$/. Input:  'DataCloneError: ArrayBuffer occurs in transfer list more than once'  Assertion...
- `parallel/test-worker-message-port-wasm-threads.js#block_00_block_00`: WebAssembly is not defined     at anonymous (<input>:13:24)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-com...
- `parallel/test-worker-message-port-wasm-threads.js#block_01_block_01`: WebAssembly is not defined     at anonymous (<input>:13:24)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-com...
- `parallel/test-worker-message-port.js`: not a function     at anonymous (<input>:24:40)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-worker-message-port.js#block_01_block_01`: not a function     at anonymous (<input>:13:40)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-worker-message-port.js#block_02_block_02`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - <ref *1> MessagePort { -   _target: MessagePort { -     _target: [Circular *1] -  ...
- `parallel/test-worker-message-port.js#block_04_block_04`: not a function     at anonymous (<input>:24:9)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:14...
- `parallel/test-worker-message-port.js#block_05_block_05`: Expected values to be strictly deep-equal: + actual - expected    Comparison { -   code: 'ERR_INVALID_ARG_TYPE',     constructor: [Function: TypeError], +   message: 'value is not iterable' -   messag...
- `parallel/test-worker-message-port.js#block_06_block_06`: Expected values to be strictly equal:  10 !== 0  AssertionError: Expected values to be strictly equal:  10 !== 0      at anonymous (<input>:42:24)     at loadModule (node:module:551:24)     at localRe...
- `parallel/test-worker-message-port.js#block_07_block_07`: Transfer list item is not transferable     at DOMException (__wasm_rquickjs_builtin/abort_controller:27:9)     at dataCloneError (__wasm_rquickjs_builtin/structured_clone:243:16)     at structuredClon...
- `parallel/test-worker-message-port.js#block_08_block_08`: Expected values to be strictly deep-equal: + actual - expected    [ +   '_enqueueDelivery',     'close',     'constructor', +   'on', +   'once', -   'hasRef',     'onmessage',     'onmessageerror',  ...
- `parallel/test-worker-message-transfer-port-mark-as-untransferable.js#block_00_block_00`: not a function     at anonymous (<input>:12:38)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-worker-message-transfer-port-mark-as-untransferable.js#block_01_block_01`: not a function     at anonymous (<input>:15:38)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-worker-message-transfer-port-mark-as-untransferable.js#block_02_block_02`: not a function     at anonymous (<input>:15:41)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-worker-message-transfer-port-mark-as-untransferable.js#block_03_block_03`: not a function     at anonymous (<input>:18:38)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (node:module:623:26)     at runTest (node-compat-runner:1...
- `parallel/test-worker-unsupported-path.js#block_00_block_00`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:16:10)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-worker-unsupported-path.js#block_01_block_01`: Missing expected exception. AssertionError: Missing expected exception.     at anonymous (<input>:14:5)     at loadModule (node:module:551:24)     at localRequire (node:module:590:34)     at require (...
- `parallel/test-worker-unsupported-path.js#block_02_block_02`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at anonymous (<input>:19:10)     at loadModule (node:module:551:24)     at localRequire (node:module...
- `parallel/test-worker-workerdata-messageport.js`: Expected values to be strictly equal:  4 !== 0  AssertionError: Expected values to be strictly equal:  4 !== 0      at anonymous (<input>:46:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-worker-workerdata-messageport.js#block_02_block_02`: Expected values to be strictly equal:  4 !== 0  AssertionError: Expected values to be strictly equal:  4 !== 0      at anonymous (<input>:36:22)     at loadModule (node:module:551:24)     at localRequ...
- `parallel/test-worker-workerdata-messageport.js#block_03_block_03`: Missing expected exception (DataCloneError). AssertionError: Missing expected exception (DataCloneError).     at anonymous (<input>:37:14)     at loadModule (node:module:551:24)     at localRequire (n...

### zlib

- `parallel/test-zlib-failed-init.js#block_00_block_00`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_OUT_OF_RANGE', +   message: 'The value of "options.windowBits" is out of range. It must be >= 8 and <= 15....
- `parallel/test-zlib-failed-init.js#block_01_block_01`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_OUT_OF_RANGE', +   message: 'The value of "options.windowBits" is out of range. It must be >= 8 and <= 15....
- `parallel/test-zlib-zero-windowBits.js#test_00_zlib_should_support_zero_windowbits`: The value of "options.windowBits" is out of range. It must be >= 8 and <= 15. Received 0     at makeRangeError (node:zlib:275:19)     at validateRangeInt (node:zlib:321:11)     at validateZlibOptions ...
- `parallel/test-zlib-zero-windowBits.js#test_01_windowbits_should_be_valid`: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_OUT_OF_RANGE', +   message: 'The value of "options.windowBits" is out of range. It must be >= 8 and <= 15....

## Error Tests (runtime/instantiation errors)

61 tests had runtime errors.

<details>
<summary>Click to expand</summary>

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
- `parallel/test-fs-sir-writes-alot.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-watch-encoding.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-watch-encoding.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-watch-encoding.js#block_02_block_02`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-watch-recursive-sync-write.js`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-process-uncaught-exception-monitor.js#block_00_block_00`: Timeout
- `parallel/test-process-uncaught-exception-monitor.js#block_01_block_01`: Timeout
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
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_08_block_08`: error while executing at wasm backtrace:     0: 0x9bf9bf - node_compat_runner.wasm!JS_CallInternal     1: 0x9c3574 - node_compat_runner.wasm!JS_CallInternal     2: 0x9c2fa3 - node_compat_runner.wasm!J...
- `parallel/test-worker-eval-typescript.js#test_00_worker_eval_module_typescript_without_input_type`: error while executing at wasm backtrace:     0: 0xafa4bc - node_compat_runner.wasm!abort     1: 0xaf203b - node_compat_runner.wasm!std::sys::pal::wasip1::helpers::abort_internal::h74119267dbd11bee    ...
- `parallel/test-worker-eval-typescript.js#test_01_worker_eval_module_typescript_with_input_type_module_typescr`: error while executing at wasm backtrace:     0: 0xafa4bc - node_compat_runner.wasm!abort     1: 0xaf203b - node_compat_runner.wasm!std::sys::pal::wasip1::helpers::abort_internal::h74119267dbd11bee    ...
- `parallel/test-worker-eval-typescript.js#test_02_worker_eval_module_typescript_with_input_type_commonjs_types`: error while executing at wasm backtrace:     0: 0xafa4bc - node_compat_runner.wasm!abort     1: 0xaf203b - node_compat_runner.wasm!std::sys::pal::wasip1::helpers::abort_internal::h74119267dbd11bee    ...
- `parallel/test-worker-eval-typescript.js#test_03_worker_eval_module_typescript_with_input_type_module`: error while executing at wasm backtrace:     0: 0xafa4bc - node_compat_runner.wasm!abort     1: 0xaf203b - node_compat_runner.wasm!std::sys::pal::wasip1::helpers::abort_internal::h74119267dbd11bee    ...
- `parallel/test-worker-eval-typescript.js#test_04_worker_eval_commonjs_typescript_without_input_type`: error while executing at wasm backtrace:     0: 0xafa4bc - node_compat_runner.wasm!abort     1: 0xaf203b - node_compat_runner.wasm!std::sys::pal::wasip1::helpers::abort_internal::h74119267dbd11bee    ...
- `parallel/test-worker-eval-typescript.js#test_05_worker_eval_commonjs_typescript_with_input_type_commonjs_typ`: error while executing at wasm backtrace:     0: 0xafa4bc - node_compat_runner.wasm!abort     1: 0xaf203b - node_compat_runner.wasm!std::sys::pal::wasip1::helpers::abort_internal::h74119267dbd11bee    ...
- `parallel/test-worker-eval-typescript.js#test_06_worker_eval_commonjs_typescript_with_input_type_module_types`: error while executing at wasm backtrace:     0: 0xafa4bc - node_compat_runner.wasm!abort     1: 0xaf203b - node_compat_runner.wasm!std::sys::pal::wasip1::helpers::abort_internal::h74119267dbd11bee    ...
- `sequential/test-fs-watch.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `sequential/test-fs-watch.js#block_02_block_02`: Timeout (epoch deadline exceeded)

</details>

## Skipped Tests

2156 tests were skipped.

<details>
<summary>Click to expand</summary>

- `es-module/test-cjs-esm-warn.js`: newly discovered, not yet evaluated
- `es-module/test-cjs-prototype-pollution.js`: newly discovered, not yet evaluated
- `es-module/test-disable-require-module-with-detection.js`: newly discovered, not yet evaluated
- `es-module/test-esm-assertionless-json-import.js`: newly discovered, not yet evaluated
- `es-module/test-esm-cjs-builtins.js`: newly discovered, not yet evaluated
- `es-module/test-esm-cjs-exports.js`: newly discovered, not yet evaluated
- `es-module/test-esm-cjs-main.js`: newly discovered, not yet evaluated
- `es-module/test-esm-data-urls.js`: newly discovered, not yet evaluated
- `es-module/test-esm-dynamic-import-attribute.js`: newly discovered, not yet evaluated
- `es-module/test-esm-dynamic-import-commonjs.js`: newly discovered, not yet evaluated
- `es-module/test-esm-dynamic-import-mutating-fs.js`: newly discovered, not yet evaluated
- `es-module/test-esm-dynamic-import.js`: newly discovered, not yet evaluated
- `es-module/test-esm-encoded-path-native.js`: newly discovered, not yet evaluated
- `es-module/test-esm-error-cache.js`: newly discovered, not yet evaluated
- `es-module/test-esm-import-attributes-errors.js`: newly discovered, not yet evaluated
- `es-module/test-esm-invalid-data-urls.js`: newly discovered, not yet evaluated
- `es-module/test-esm-invalid-pjson.js`: newly discovered, not yet evaluated
- `es-module/test-esm-preserve-symlinks-main.js`: newly discovered, not yet evaluated
- `es-module/test-esm-preserve-symlinks.js`: newly discovered, not yet evaluated
- `es-module/test-esm-repl-imports.js`: newly discovered, not yet evaluated
- `es-module/test-esm-repl.js`: newly discovered, not yet evaluated
- `es-module/test-esm-symlink-main.js`: newly discovered, not yet evaluated
- `es-module/test-esm-symlink.js`: newly discovered, not yet evaluated
- `es-module/test-esm-type-field-errors-2.js`: newly discovered, not yet evaluated
- `es-module/test-esm-undefined-cjs-global-like-variables.js`: newly discovered, not yet evaluated
- `es-module/test-esm-unknown-extension.js`: newly discovered, not yet evaluated
- `es-module/test-esm-windows.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-cached-tla.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-conditional-exports-module.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-conditional-exports.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-cycle-cjs-esm-esm.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-cycle-esm-cjs-esm-esm.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-cycle-esm-cjs-esm.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-cycle-esm-esm-cjs-esm-esm.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-cycle-esm-esm-cjs-esm.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-default-extension.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-defined-esmodule.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-detect-entry-point-aou.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-detect-entry-point.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-dont-detect-cjs.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-dynamic-import-1.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-dynamic-import-2.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-dynamic-import-3.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-dynamic-import-4.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-error-catching.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-errors.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-feature-detect.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-implicit.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-preload.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-retry-import-errored.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-retry-import-evaluating.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-synchronous-rejection-handling.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-tla-retry-import-2.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-tla-retry-import.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-tla-retry-require.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-tla.js`: newly discovered, not yet evaluated
- `es-module/test-require-module-transpiled.js`: newly discovered, not yet evaluated
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
- `parallel/test-esm-loader-hooks-inspect-brk.js`: newly discovered, not yet evaluated
- `parallel/test-esm-loader-hooks-inspect-wait.js`: newly discovered, not yet evaluated
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
- `parallel/test-fs-symlink-dir-junction-relative.js`: symlink returns EIO in WASI filesystem
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
- `parallel/test-http-after-connect.js`: requires HTTP server functionality
- `parallel/test-http-agent-abort-controller.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-agent-destroyed-socket.js`: requires HTTP server functionality
- `parallel/test-http-agent-error-on-idle.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-agent-keepalive-delay.js`: requires HTTP server functionality
- `parallel/test-http-agent-keepalive.js`: requires HTTP server functionality
- `parallel/test-http-agent-maxsockets-respected.js`: requires HTTP server functionality
- `parallel/test-http-agent-maxsockets.js`: requires HTTP server functionality
- `parallel/test-http-agent-maxtotalsockets.js`: requires HTTP server functionality
- `parallel/test-http-agent-remove.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-agent-reuse-drained-socket-only.js`: requires HTTP server functionality
- `parallel/test-http-agent-scheduling.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-agent-timeout-option.js`: requires HTTP server functionality
- `parallel/test-http-agent-timeout.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-agent-uninitialized-with-handle.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-agent-uninitialized.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-agent.js`: [manual] amp fix caused regressions
- `parallel/test-http-automatic-headers.js`: [manual] The test asserts `res.headers.connection === 'keep-alive'`, but the `Connection` header is classified as a **forbidden hop-by-hop header** in wasmtime's wasi:http implementation (`wasmtime...
- `parallel/test-http-blank-header.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-buffer-sanity.js`: requires HTTP server functionality
- `parallel/test-http-byteswritten.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-catch-uncaughtexception.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-chunk-extensions-limit.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-chunk-problem.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-abort-keep-alive-destroy-res.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-abort-keep-alive-queued-tcp-socket.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-abort-no-agent.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-abort-response-event.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-abort.js`: [manual] amp fix caused regressions
- `parallel/test-http-client-aborted-event.js`: requires HTTP server functionality
- `parallel/test-http-client-agent-abort-close-event.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-agent-end-close-event.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-close-event.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-client-default-headers-exist.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-client-error-rawbytes.js`: requires HTTP server functionality
- `parallel/test-http-client-finished.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-client-headers-array.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-headers-host-array.js`: requires HTTP server functionality
- `parallel/test-http-client-incomingmessage-destroy.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-insecure-http-parser-error.js`: requires HTTP server functionality
- `parallel/test-http-client-keep-alive-release-before-finish.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-override-global-agent.js`: requires HTTP server functionality
- `parallel/test-http-client-parse-error.js`: requires HTTP server functionality
- `parallel/test-http-client-reject-chunked-with-content-length.js`: requires HTTP server functionality
- `parallel/test-http-client-reject-cr-no-lf.js`: requires HTTP server functionality
- `parallel/test-http-client-req-error-dont-double-fire.js`: requires HTTP server functionality
- `parallel/test-http-client-res-destroyed.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-response-timeout.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-set-timeout-after-end.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-set-timeout.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-spurious-aborted.js`: requires HTTP server functionality
- `parallel/test-http-client-timeout-agent.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-timeout-event.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-client-timeout-option-listeners.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-timeout-option-with-agent.js`: requires HTTP server functionality
- `parallel/test-http-client-timeout-option.js`: requires HTTP server functionality
- `parallel/test-http-client-timeout-with-data.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-client-timeout.js`: [manual] amp fix caused regressions
- `parallel/test-http-conn-reset.js`: requires HTTP server functionality
- `parallel/test-http-connect-req-res.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-connect.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-content-length-mismatch.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-content-length.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-createConnection.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-debug.js`: requires child_process which is not available in WASM
- `parallel/test-http-decoded-auth.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-default-encoding.js`: requires HTTP server functionality
- `parallel/test-http-default-port.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-destroyed-socket-write2.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-dns-error.js`: requires HTTP server functionality
- `parallel/test-http-dont-set-default-headers-with-set-header.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-dont-set-default-headers-with-setHost.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-dont-set-default-headers.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-dummy-characters-smuggling.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-dump-req-when-res-ends.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-early-hints-invalid-argument.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-early-hints.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-end-throw-socket-handling.js`: requires HTTP server functionality
- `parallel/test-http-exceptions.js`: requires HTTP server functionality
- `parallel/test-http-expect-continue.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-expect-handling.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-flush-headers.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-flush-response-headers.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-full-response.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-get-pipeline-problem.js`: requires HTTP server functionality
- `parallel/test-http-header-badrequest.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-header-overflow.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-host-header-ipv6-fail.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-import-websocket.js`: requires HTTP server functionality
- `parallel/test-http-incoming-matchKnownFields.js`: [manual] amp partial fix caused regressions
- `parallel/test-http-information-headers.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-information-processing.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-insecure-parser-per-stream.js`: requires HTTP server functionality
- `parallel/test-http-invalid-te.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-keep-alive-close-on-header.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-keep-alive-drop-requests.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-keep-alive-max-requests.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-keep-alive-pipeline-max-requests.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-keep-alive-timeout-custom.js`: [manual] wasmtime-wasi-http explicitly strips hop-by-hop headers (`Keep-Alive`, `Connection`) from HTTP responses via `DEFAULT_FORBIDDEN_HEADERS` / `remove_forbidden_headers()` before the WASM gues...
- `parallel/test-http-keep-alive-timeout-race-condition.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-keep-alive-timeout.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-keep-alive.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-keepalive-client.js`: [manual] The test requires TCP-level HTTP keep-alive where a single TCP connection is reused for multiple sequential requests. It asserts `assert.strictEqual(req.socket, serverSocket)` on the **ser...
- `parallel/test-http-keepalive-free.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-keepalive-override.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-keepalive-request.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-many-ended-pipelines.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-max-header-size.js`: requires child_process which is not available in WASM
- `parallel/test-http-max-headers-count.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-max-sockets.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-missing-header-separator-cr.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-missing-header-separator-lf.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-multi-line-headers.js`: requires HTTP server functionality
- `parallel/test-http-multiple-headers.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-mutable-headers.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-no-read-no-dump.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-nodelay.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-outgoing-end-cork.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-outgoing-end-multiple.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-outgoing-finish-writable.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-outgoing-first-chunk-singlebyte-encoding.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-outgoing-message-capture-rejection.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-parser-bad-ref.js`: requires Node.js internal modules
- `parallel/test-http-parser-freed-before-upgrade.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-parser-memory-retention.js`: requires Node.js internal modules
- `parallel/test-http-parser-timeout-reset.js`: requires HTTP server functionality
- `parallel/test-http-parser.js`: requires Node.js internal modules
- `parallel/test-http-pause-resume-one-end.js`: requires HTTP server functionality
- `parallel/test-http-pause.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-perf_hooks.js`: requires HTTP server functionality
- `parallel/test-http-pipeline-assertionerror-finish.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-pipeline-flood.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-pipeline-requests-connection-leak.js`: sends 10000 pipelined requests which exceeds WASM resource limits
- `parallel/test-http-pipeline-socket-parser-typeerror.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-proxy.js`: [manual] amp fix caused regressions
- `parallel/test-http-raw-headers.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-readable-data-event.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-remove-connection-header-persists-connection.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-remove-header-stays-removed.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-req-close-robust-from-tampering.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-request-agent.js`: requires HTTP server functionality
- `parallel/test-http-request-dont-override-options.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-request-host-header.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-request-join-authorization-headers.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-request-method-delete-payload.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-request-smuggling-content-length.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-res-write-after-end.js`: requires HTTP server functionality
- `parallel/test-http-res-write-end-dont-take-array.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-response-add-header-after-sent.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-response-close.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-response-cork.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-response-multi-content-length.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-response-multiheaders.js`: [manual] wasmtime's `wasi:http` implementation strips `host` and `proxy-authorization` headers from HTTP responses (treating them as forbidden/hop-by-hop headers). The test asserts all 17 "norepeat...
- `parallel/test-http-response-no-headers.js`: requires HTTP server functionality
- `parallel/test-http-response-readable.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-response-remove-header-after-sent.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-response-setheaders.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-response-splitting.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-response-status-message.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-same-map.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-async-dispose.js`: requires HTTP server functionality
- `parallel/test-http-server-capture-rejections.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-clear-timer.js`: requires HTTP server functionality
- `parallel/test-http-server-client-error.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-close-all.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-close-destroy-timeout.js`: requires HTTP server functionality
- `parallel/test-http-server-close-idle.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-connection-list-when-close.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-consumed-timeout.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-de-chunked-trailer.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-delete-parser.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-destroy-socket-on-client-error.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-headers-timeout-delayed-headers.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-headers-timeout-interrupted-headers.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-headers-timeout-keepalive.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-headers-timeout-pipelining.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-incomingmessage-destroy.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-keep-alive-defaults.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-keep-alive-max-requests-null.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-keepalive-end.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-keepalive-req-gc.js`: requires HTTP server functionality
- `parallel/test-http-server-method.query.js`: requires HTTP server functionality
- `parallel/test-http-server-multiheaders.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-multiheaders2.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-non-utf8-header.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-options-incoming-message.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-options-server-response.js`: requires HTTP server functionality
- `parallel/test-http-server-reject-chunked-with-content-length.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-request-timeout-delayed-body.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-request-timeout-delayed-headers.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-request-timeout-interrupted-body.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-request-timeout-interrupted-headers.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-request-timeout-keepalive.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-request-timeout-pipelining.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-request-timeout-upgrade.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-stale-close.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-timeouts-validation.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-unconsume-consume.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server-write-after-end.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-server.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-set-header-chain.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-set-max-idle-http-parser.js`: requires Node.js internal modules
- `parallel/test-http-set-timeout-server.js`: [manual] The test's sub-tests 1-4 use `http.get()` and `http.request()` to connect to a local HTTP server that intentionally never responds. In the WASM architecture, these client requests go throu...
- `parallel/test-http-set-timeout.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-set-trailers.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-should-keep-alive.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-socket-encoding-error.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-socket-error-listeners.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-status-code.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-status-reason-invalid-chars.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-timeout-client-warning.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-timeout-overflow.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-transfer-encoding-repeated-chunked.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-transfer-encoding-smuggling.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-uncaught-from-request-callback.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-upgrade-advertise.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-upgrade-agent.js`: requires HTTP server functionality
- `parallel/test-http-upgrade-binary.js`: requires HTTP server functionality
- `parallel/test-http-upgrade-client.js`: [manual] amp partial fix caused regressions
- `parallel/test-http-upgrade-client2.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-upgrade-reconsume-stream.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-upgrade-server.js`: requires HTTP server functionality
- `parallel/test-http-url.parse-auth.js`: requires HTTP server functionality
- `parallel/test-http-url.parse-https.request.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http-url.parse-only-support-http-https-protocol.js`: requires HTTP server functionality
- `parallel/test-http-writable-true-after-close.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-write-callbacks.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-write-empty-string.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http-write-head-after-set-header.js`: [manual] the test currently deadlocks in the runtime pollable/executor path (same-component `node:http` client calling back into same-component server via `wasi:http`), and I could not resolve it f...
- `parallel/test-http-write-head.js`: [manual] The test asserts `response.rawHeaders.includes('Test')` (line 78) — requiring header name case preservation through the HTTP transport. In wasi:http, all header names are normalized to low...
- `parallel/test-http-zero-length-write.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http.js`: [manual] amp fix attempt failed verification
- `parallel/test-http2-allow-http1.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-alpn.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-altsvc.js`: requires HTTP2 server functionality
- `parallel/test-http2-async-local-storage.js`: requires HTTP2 server functionality
- `parallel/test-http2-autoselect-protocol.js`: requires HTTP server functionality, we only support clients
- `parallel/test-http2-backpressure.js`: requires HTTP2 server functionality
- `parallel/test-http2-buffersize.js`: requires HTTP2 server functionality
- `parallel/test-http2-byteswritten-server.js`: requires HTTP2 server functionality
- `parallel/test-http2-cancel-while-client-reading.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-capture-rejection.js`: requires HTTP2 server functionality
- `parallel/test-http2-clean-output.js`: requires child_process which is not available in WASM
- `parallel/test-http2-client-connection-tunnelling.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-client-data-end.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-jsstream-destroy.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-client-port-80.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-priority-before-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-promisify-connect-error.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-promisify-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-proxy-over-http2.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-request-listeners-warning.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-request-options-errors.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-rststream-before-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-set-priority.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-setLocalWindowSize.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-setNextStreamID-errors.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-settings-before-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-shutdown-before-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-stream-destroy-before-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-unescaped-path.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-write-before-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-client-write-empty-string.js`: requires HTTP2 server functionality
- `parallel/test-http2-close-while-writing.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-compat-aborted.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-errors.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-expect-continue-check.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-expect-continue.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-expect-handling.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-method-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverrequest-end.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverrequest-headers.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverrequest-host.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverrequest-pause.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverrequest-pipe.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverrequest-settimeout.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverrequest-trailers.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverrequest.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-close.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-createpushresponse.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-destroy.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-drain.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-end-after-statuses-without-body.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-end.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-finished.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-flushheaders.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-headers-after-destroy.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-headers-send-date.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-headers.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-settimeout.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-statuscode.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-statusmessage-property-set.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-statusmessage-property.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-statusmessage.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-trailers.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-write.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-writehead-array.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse-writehead.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-serverresponse.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-short-stream-client-server.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-socket-destroy-delayed.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-socket-set.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-write-early-hints-invalid-argument-type.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-write-early-hints-invalid-argument-value.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-write-early-hints.js`: requires HTTP2 server functionality
- `parallel/test-http2-compat-write-head-destroyed.js`: requires HTTP2 server functionality
- `parallel/test-http2-connect-method-extended-cant-turn-off.js`: requires HTTP2 server functionality
- `parallel/test-http2-connect-method-extended.js`: requires HTTP2 server functionality
- `parallel/test-http2-connect-method.js`: requires HTTP2 server functionality
- `parallel/test-http2-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-cookies.js`: requires HTTP2 server functionality
- `parallel/test-http2-create-client-connect.js`: requires HTTP2 server functionality
- `parallel/test-http2-create-client-session.js`: requires HTTP2 server functionality
- `parallel/test-http2-createsecureserver-options.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-createserver-options.js`: requires HTTP2 server functionality
- `parallel/test-http2-createwritereq.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-date-header.js`: requires HTTP2 server functionality
- `parallel/test-http2-debug.js`: requires child_process which is not available in WASM
- `parallel/test-http2-destroy-after-write.js`: requires HTTP2 server functionality
- `parallel/test-http2-dont-lose-data.js`: requires HTTP2 server functionality
- `parallel/test-http2-dont-override.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-empty-frame-without-eof.js`: requires HTTP2 server functionality
- `parallel/test-http2-endafterheaders.js`: requires HTTP2 server functionality
- `parallel/test-http2-error-order.js`: requires HTTP2 server functionality
- `parallel/test-http2-exceeds-server-trailer-size.js`: requires HTTP2 server functionality
- `parallel/test-http2-forget-closed-streams.js`: requires HTTP2 server functionality
- `parallel/test-http2-generic-streams-sendfile.js`: requires HTTP2 server functionality
- `parallel/test-http2-generic-streams.js`: requires HTTP2 server functionality
- `parallel/test-http2-getpackedsettings.js`: requires HTTP2 server functionality
- `parallel/test-http2-goaway-delayed-request.js`: requires HTTP2 server functionality
- `parallel/test-http2-goaway-opaquedata.js`: requires HTTP2 server functionality
- `parallel/test-http2-head-request.js`: requires HTTP2 server functionality
- `parallel/test-http2-https-fallback-http-server-options.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-https-fallback.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-info-headers.js`: requires HTTP2 server functionality
- `parallel/test-http2-invalidargtypes-errors.js`: requires HTTP2 server functionality
- `parallel/test-http2-invalidheaderfield.js`: requires HTTP2 server functionality
- `parallel/test-http2-invalidheaderfields-client.js`: requires HTTP2 server functionality
- `parallel/test-http2-ip-address-host.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-large-write-close.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-large-write-destroy.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-large-write-multiple-requests.js`: requires HTTP2 server functionality
- `parallel/test-http2-large-writes-session-memory-leak.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-malformed-altsvc.js`: requires HTTP2 server functionality
- `parallel/test-http2-many-writes-and-destroy.js`: requires HTTP2 server functionality
- `parallel/test-http2-max-concurrent-streams.js`: requires HTTP2 server functionality
- `parallel/test-http2-max-invalid-frames.js`: requires HTTP2 server functionality
- `parallel/test-http2-max-session-memory-leak.js`: requires HTTP2 server functionality
- `parallel/test-http2-max-settings.js`: requires HTTP2 server functionality
- `parallel/test-http2-methods.js`: requires HTTP2 server functionality
- `parallel/test-http2-misbehaving-flow-control-paused.js`: requires HTTP2 server functionality
- `parallel/test-http2-misbehaving-flow-control.js`: requires HTTP2 server functionality
- `parallel/test-http2-misused-pseudoheaders.js`: requires HTTP2 server functionality
- `parallel/test-http2-multi-content-length.js`: requires HTTP2 server functionality
- `parallel/test-http2-multiheaders-raw.js`: requires HTTP2 server functionality
- `parallel/test-http2-multiheaders.js`: requires HTTP2 server functionality
- `parallel/test-http2-multiplex.js`: requires HTTP2 server functionality
- `parallel/test-http2-multistream-destroy-on-read-tls.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-no-more-streams.js`: requires HTTP2 server functionality
- `parallel/test-http2-no-wanttrailers-listener.js`: requires HTTP2 server functionality
- `parallel/test-http2-onping.js`: requires HTTP2 server functionality
- `parallel/test-http2-options-max-headers-block-length.js`: requires HTTP2 server functionality
- `parallel/test-http2-options-max-reserved-streams.js`: requires HTTP2 server functionality
- `parallel/test-http2-options-server-request.js`: requires HTTP2 server functionality
- `parallel/test-http2-options-server-response.js`: requires HTTP2 server functionality
- `parallel/test-http2-origin.js`: requires HTTP2 server functionality
- `parallel/test-http2-pack-end-stream-flag.js`: requires HTTP2 server functionality
- `parallel/test-http2-padding-aligned.js`: requires HTTP2 server functionality
- `parallel/test-http2-perf_hooks.js`: requires HTTP2 server functionality
- `parallel/test-http2-perform-server-handshake.js`: requires HTTP2 server functionality
- `parallel/test-http2-ping-settings-heapdump.js`: requires HTTP2 server functionality
- `parallel/test-http2-ping-unsolicited-ack.js`: requires HTTP2 server functionality
- `parallel/test-http2-ping.js`: requires HTTP2 server functionality
- `parallel/test-http2-pipe-named-pipe.js`: requires HTTP2 server functionality
- `parallel/test-http2-pipe.js`: requires HTTP2 server functionality
- `parallel/test-http2-priority-cycle-.js`: requires HTTP2 server functionality
- `parallel/test-http2-priority-event.js`: requires HTTP2 server functionality
- `parallel/test-http2-propagate-session-destroy-code.js`: requires HTTP2 server functionality
- `parallel/test-http2-removed-header-stays-removed.js`: requires HTTP2 server functionality
- `parallel/test-http2-request-remove-connect-listener.js`: requires HTTP2 server functionality
- `parallel/test-http2-res-corked.js`: requires HTTP2 server functionality
- `parallel/test-http2-res-writable-properties.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-204.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-304.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-404.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-compat.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-error-dir.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-error-pipe-offset.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-errors.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-fd-errors.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-fd-invalid.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-fd-range.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-fd.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-filehandle.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-push.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-range.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file-with-pipe.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-file.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-no-data.js`: requires HTTP2 server functionality
- `parallel/test-http2-respond-with-file-connection-abort.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-response-splitting.js`: requires HTTP2 server functionality
- `parallel/test-http2-sensitive-headers.js`: requires HTTP2 server functionality
- `parallel/test-http2-sent-headers.js`: requires HTTP2 server functionality
- `parallel/test-http2-serve-file.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-async-dispose.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-close-callback.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-errors.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-push-disabled.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-push-stream-errors-args.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-push-stream-head.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-push-stream.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-rst-before-respond.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-rst-stream.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-session-destroy.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-set-header.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-setLocalWindowSize.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-settimeout-no-callback.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-shutdown-before-respond.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-shutdown-options-errors.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-shutdown-redundant.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-startup.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-stream-session-destroy.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-timeout.js`: requires HTTP2 server functionality
- `parallel/test-http2-server-unknown-protocol.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-session-gc-while-write-scheduled.js`: requires HTTP2 server functionality
- `parallel/test-http2-session-settings.js`: requires HTTP2 server functionality
- `parallel/test-http2-session-stream-state.js`: requires HTTP2 server functionality
- `parallel/test-http2-session-timeout.js`: requires HTTP2 server functionality
- `parallel/test-http2-session-unref.js`: requires HTTP2 server functionality
- `parallel/test-http2-settings-unsolicited-ack.js`: requires HTTP2 server functionality
- `parallel/test-http2-short-stream-client-server.js`: requires HTTP2 server functionality
- `parallel/test-http2-single-headers.js`: requires HTTP2 server functionality
- `parallel/test-http2-socket-close.js`: requires HTTP2 server functionality
- `parallel/test-http2-socket-proxy-handler-for-has.js`: requires HTTP2 server functionality
- `parallel/test-http2-status-code-invalid.js`: requires HTTP2 server functionality
- `parallel/test-http2-status-code.js`: requires HTTP2 server functionality
- `parallel/test-http2-stream-client.js`: requires HTTP2 server functionality
- `parallel/test-http2-stream-destroy-event-order.js`: requires HTTP2 server functionality
- `parallel/test-http2-stream-removelisteners-after-close.js`: requires HTTP2 server functionality
- `parallel/test-http2-timeouts.js`: requires HTTP2 server functionality
- `parallel/test-http2-tls-disconnect.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-http2-too-large-headers.js`: requires HTTP2 server functionality
- `parallel/test-http2-too-many-headers.js`: requires HTTP2 server functionality
- `parallel/test-http2-too-many-settings.js`: requires HTTP2 server functionality
- `parallel/test-http2-too-many-streams.js`: requires HTTP2 server functionality
- `parallel/test-http2-trailers-after-session-close.js`: requires HTTP2 server functionality
- `parallel/test-http2-trailers.js`: requires HTTP2 server functionality
- `parallel/test-http2-unbound-socket-proxy.js`: requires HTTP2 server functionality
- `parallel/test-http2-update-settings.js`: requires HTTP2 server functionality
- `parallel/test-http2-window-size.js`: requires HTTP2 server functionality
- `parallel/test-http2-write-callbacks.js`: requires HTTP2 server functionality
- `parallel/test-http2-write-empty-string.js`: requires HTTP2 server functionality
- `parallel/test-http2-write-finishes-after-stream-destroy.js`: requires HTTP2 server functionality
- `parallel/test-http2-zero-length-header.js`: requires HTTP2 server functionality
- `parallel/test-http2-zero-length-write.js`: requires HTTP2 server functionality
- `parallel/test-https-abortcontroller.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-abort-controller.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-additional-options.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-constructor.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-create-connection.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-disable-session-reuse.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-getname.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-keylog.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-servername.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-session-eviction.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-session-injection.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-session-reuse.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-sni.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-sockets-leak.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent-unref-socket.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-agent.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-argument-of-creating.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-byteswritten.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-client-checkServerIdentity.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-client-get-url.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-client-override-global-agent.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-client-reject.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-client-renegotiation-limit.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-client-resume.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-close.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-connect-address-family.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-connecting-to-http.js`: requires HTTP server functionality, we only support clients
- `parallel/test-https-drain.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-eof-for-eom.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-foafssl.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-host-headers.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-hwm.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-insecure-parse-per-stream.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-keep-alive-drop-requests.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-localaddress-bind-error.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-max-header-size-per-stream.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-max-headers-count.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-options-boolean-check.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-pfx.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-request-arguments.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-resume-after-renew.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-selfsigned-no-keycertsign-no-crash.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-server-async-dispose.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-server-close-all.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-server-close-destroy-timeout.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-server-close-idle.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-server-connections-checking-leak.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-server-headers-timeout.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-server-options-incoming-message.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-server-options-server-response.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-server-request-timeout.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-simple.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-socket-options.js`: requires HTTP server functionality, we only support clients
- `parallel/test-https-strict.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-timeout-server-2.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-timeout-server.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-timeout.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-truncate.js`: requires TLS/HTTPS which is not supported in WASM
- `parallel/test-https-unix-socket-self-signed.js`: requires TLS/HTTPS which is not supported in WASM
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
- `parallel/test-memory-usage.js`: newly discovered, not yet evaluated
- `parallel/test-messageevent-brandcheck.js`: newly discovered, not yet evaluated
- `parallel/test-messageport-hasref.js`: newly discovered, not yet evaluated
- `parallel/test-microtask-queue-run-immediate.js`: newly discovered, not yet evaluated
- `parallel/test-microtask-queue-run.js`: newly discovered, not yet evaluated
- `parallel/test-mime-whatwg.js`: newly discovered, not yet evaluated
- `parallel/test-module-builtin.js`: newly discovered, not yet evaluated
- `parallel/test-module-children.js`: newly discovered, not yet evaluated
- `parallel/test-module-circular-symlinks.js`: newly discovered, not yet evaluated
- `parallel/test-module-create-require-multibyte.js`: newly discovered, not yet evaluated
- `parallel/test-module-create-require.js`: newly discovered, not yet evaluated
- `parallel/test-module-globalpaths-nodepath.js`: newly discovered, not yet evaluated
- `parallel/test-module-isBuiltin.js`: newly discovered, not yet evaluated
- `parallel/test-module-loading-error.js`: newly discovered, not yet evaluated
- `parallel/test-module-loading-globalpaths.js`: newly discovered, not yet evaluated
- `parallel/test-module-main-extension-lookup.js`: newly discovered, not yet evaluated
- `parallel/test-module-main-fail.js`: newly discovered, not yet evaluated
- `parallel/test-module-main-preserve-symlinks-fail.js`: newly discovered, not yet evaluated
- `parallel/test-module-multi-extensions.js`: newly discovered, not yet evaluated
- `parallel/test-module-nodemodulepaths.js`: newly discovered, not yet evaluated
- `parallel/test-module-parent-deprecation.js`: newly discovered, not yet evaluated
- `parallel/test-module-prototype-mutation.js`: newly discovered, not yet evaluated
- `parallel/test-module-readonly.js`: newly discovered, not yet evaluated
- `parallel/test-module-relative-lookup.js`: newly discovered, not yet evaluated
- `parallel/test-module-run-main-monkey-patch.js`: newly discovered, not yet evaluated
- `parallel/test-module-setsourcemapssupport.js`: newly discovered, not yet evaluated
- `parallel/test-module-stat.js`: newly discovered, not yet evaluated
- `parallel/test-module-strip-types.js`: newly discovered, not yet evaluated
- `parallel/test-module-strip-types.js#test_00_striptypescripttypes`: Requires Amaro
- `parallel/test-module-strip-types.js#test_01_striptypescripttypes_explicit`: Requires Amaro
- `parallel/test-module-strip-types.js#test_02_striptypescripttypes_code_is_not_a_string`: Requires Amaro
- `parallel/test-module-strip-types.js#test_03_striptypescripttypes_invalid_mode`: Requires Amaro
- `parallel/test-module-strip-types.js#test_04_striptypescripttypes_sourcemap_throws_when_mode_is_strip`: Requires Amaro
- `parallel/test-module-strip-types.js#test_05_striptypescripttypes_sourceurl_throws_when_mode_is_strip`: Requires Amaro
- `parallel/test-module-strip-types.js#test_06_striptypescripttypes_source_map_when_mode_is_transform`: Requires Amaro
- `parallel/test-module-strip-types.js#test_07_striptypescripttypes_source_map_when_mode_is_transform_and_s`: Requires Amaro
- `parallel/test-module-strip-types.js#test_08_striptypescripttypes_source_map_when_mode_is_transform_and_s`: Requires Amaro
- `parallel/test-module-symlinked-peer-modules.js`: newly discovered, not yet evaluated
- `parallel/test-module-version.js`: newly discovered, not yet evaluated
- `parallel/test-module-wrap.js`: newly discovered, not yet evaluated
- `parallel/test-module-wrapper.js`: newly discovered, not yet evaluated
- `parallel/test-net-better-error-messages-listen.js`: error message format mismatch
- `parallel/test-net-better-error-messages-path.js`: requires Unix domain sockets (IPC path)
- `parallel/test-net-binary.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-bind-twice.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-buffersize.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-bytes-read.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-bytes-stats.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-bytes-written-large.js`: requires child_process
- `parallel/test-net-can-reset-timeout.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-child-process-connect-reset.js`: requires child_process
- `parallel/test-net-client-bind-twice.js`: requires socket.connect with localAddress/localPort binding
- `parallel/test-net-connect-abort-controller.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-buffer.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-buffer2.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-call-socket-connect.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-immediate-destroy.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-keepalive.js`: net.js TCP implementation incomplete - needs event handling and API fixes
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
- `parallel/test-net-end-destroyed.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-error-twice.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-keepalive.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-large-string.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-listen-after-destroying-stdin.js`: requires process.stdin
- `parallel/test-net-listen-close-server-callback-is-not-function.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-listen-close-server.js`: net.js TCP implementation incomplete - needs event handling and API fixes
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
- `parallel/test-net-pingpong.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-pipe-connect-errors.js`: requires Unix domain sockets (IPC path)
- `parallel/test-net-reconnect.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-remote-address-port.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-remote-address.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-reuseport.js`: requires reusePort option and cluster
- `parallel/test-net-server-blocklist.js`: requires net.BlockList
- `parallel/test-net-server-call-listen-multiple-times.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-capture-rejection.js`: requires captureRejections option
- `parallel/test-net-server-close-before-calling-lookup-callback.js`: requires DNS lookup
- `parallel/test-net-server-close-before-ipc-response.js`: requires cluster
- `parallel/test-net-server-close.js`: net.js TCP implementation incomplete - needs event handling and API fixes
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
- `parallel/test-net-settimeout.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-byteswritten.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-close-after-end.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-connecting.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-constructor.js`: requires cluster
- `parallel/test-net-socket-destroy-send.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-destroy-twice.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-end-before-connect.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-end-callback.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-local-address.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-ready-without-cb.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-reset-send.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-reset-twice.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-timeout-unref.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-timeout.js`: setTimeout validation works but test crashes in TCP server close (WASI resource drop issue)
- `parallel/test-net-socket-write-after-close.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-stream.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-sync-cork.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-throttle.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-write-after-close.js`: net.js TCP implementation incomplete - needs event handling and API fixes
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
- `parallel/test-os-eol.js`: newly discovered, not yet evaluated
- `parallel/test-os-process-priority.js`: newly discovered, not yet evaluated
- `parallel/test-os.js`: newly discovered, not yet evaluated
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
- `parallel/test-require-extensions-main.js`: newly discovered, not yet evaluated
- `parallel/test-require-extensions-same-filename-as-dir-trailing-slash.js`: newly discovered, not yet evaluated
- `parallel/test-require-extensions-same-filename-as-dir.js`: newly discovered, not yet evaluated
- `parallel/test-require-invalid-main-no-exports.js`: newly discovered, not yet evaluated
- `parallel/test-require-json.js`: newly discovered, not yet evaluated
- `parallel/test-require-long-path.js`: newly discovered, not yet evaluated
- `parallel/test-require-mjs.js`: newly discovered, not yet evaluated
- `parallel/test-require-node-prefix.js`: newly discovered, not yet evaluated
- `parallel/test-require-resolve-opts-paths-relative.js`: newly discovered, not yet evaluated
- `parallel/test-require-resolve.js`: newly discovered, not yet evaluated
- `parallel/test-require-symlink.js`: newly discovered, not yet evaluated
- `parallel/test-require-unicode.js`: newly discovered, not yet evaluated
- `parallel/test-resource-usage.js`: newly discovered, not yet evaluated
- `parallel/test-runner-assert.js`: newly discovered, not yet evaluated
- `parallel/test-runner-cli-concurrency.js`: newly discovered, not yet evaluated
- `parallel/test-runner-cli-timeout.js`: newly discovered, not yet evaluated
- `parallel/test-runner-cli.js`: newly discovered, not yet evaluated
- `parallel/test-runner-concurrency.js`: newly discovered, not yet evaluated
- `parallel/test-runner-coverage-source-map.js`: newly discovered, not yet evaluated
- `parallel/test-runner-coverage-thresholds.js`: newly discovered, not yet evaluated
- `parallel/test-runner-coverage.js`: newly discovered, not yet evaluated
- `parallel/test-runner-custom-assertions.js`: newly discovered, not yet evaluated
- `parallel/test-runner-error-reporter.js`: newly discovered, not yet evaluated
- `parallel/test-runner-exit-code.js`: newly discovered, not yet evaluated
- `parallel/test-runner-extraneous-async-activity.js`: newly discovered, not yet evaluated
- `parallel/test-runner-force-exit-failure.js`: newly discovered, not yet evaluated
- `parallel/test-runner-force-exit-flush.js`: newly discovered, not yet evaluated
- `parallel/test-runner-import-no-scheme.js`: newly discovered, not yet evaluated
- `parallel/test-runner-misc.js`: newly discovered, not yet evaluated
- `parallel/test-runner-mock-timers-date.js`: newly discovered, not yet evaluated
- `parallel/test-runner-mock-timers-scheduler.js`: newly discovered, not yet evaluated
- `parallel/test-runner-mocking.js`: newly discovered, not yet evaluated
- `parallel/test-runner-module-mocking.js`: newly discovered, not yet evaluated
- `parallel/test-runner-no-isolation-filtering.js`: newly discovered, not yet evaluated
- `parallel/test-runner-option-validation.js`: newly discovered, not yet evaluated
- `parallel/test-runner-reporters.js`: newly discovered, not yet evaluated
- `parallel/test-runner-root-duration.js`: newly discovered, not yet evaluated
- `parallel/test-runner-snapshot-file-tests.js`: newly discovered, not yet evaluated
- `parallel/test-runner-subtest-after-hook.js`: newly discovered, not yet evaluated
- `parallel/test-runner-test-filepath.js`: newly discovered, not yet evaluated
- `parallel/test-runner-test-fullname.js`: newly discovered, not yet evaluated
- `parallel/test-runner-typechecking.js`: newly discovered, not yet evaluated
- `parallel/test-runner-wait-for.js`: newly discovered, not yet evaluated
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
- `parallel/test-string-decoder-end.js`: newly discovered, not yet evaluated
- `parallel/test-string-decoder-fuzz.js`: newly discovered, not yet evaluated
- `parallel/test-string-decoder.js`: newly discovered, not yet evaluated
- `parallel/test-stringbytes-external.js`: newly discovered, not yet evaluated
- `parallel/test-structuredClone-global.js`: newly discovered, not yet evaluated
- `parallel/test-sync-io-option.js`: newly discovered, not yet evaluated
- `parallel/test-sys.js`: newly discovered, not yet evaluated
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
- `parallel/test-zlib-brotli-16GB.js`: Requires 16GB memory allocation; not feasible in WASM
- `parallel/test-zlib-brotli-flush.js`: Requires precise brotli flush byte output comparison
- `parallel/test-zlib-brotli-kmaxlength-rangeerror.js`: Modifies buffer.kMaxLength at runtime before requiring zlib
- `parallel/test-zlib-bytes-read.js`: Byte-by-byte streaming with flush hangs due to buffered gzip/brotli streaming implementation
- `parallel/test-zlib-deflate-raw-inherits.js`: Requires Constructor.call(this) inheritance pattern which doesn't work with ES6 class-based internals
- `parallel/test-zlib-dictionary.js`: Dictionary support not available in flate2 rust_backend
- `parallel/test-zlib-failed-init.js`: Tests internal _level/_strategy properties with NaN
- `parallel/test-zlib-flush-drain-longblock.js`: Complex flush/drain/pipe interaction
- `parallel/test-zlib-flush-write-sync-interleaved.js`: Tests precise ordering of write+flush+read interleaving
- `parallel/test-zlib-flush.js`: Tests precise byte-level flush output comparison
- `parallel/test-zlib-from-concatenated-gzip.js`: Multi-member gzip with fs.createReadStream + pipe + tmpdir
- `parallel/test-zlib-from-gzip-with-trailing-garbage.js`: Tests precise error code handling for trailing garbage
- `parallel/test-zlib-kmaxlength-rangeerror.js`: Modifies buffer.kMaxLength at runtime before requiring zlib
- `parallel/test-zlib-maxOutputLength.js`: maxOutputLength not implemented in native layer
- `parallel/test-zlib-object-write.js`: process.nextTick arg count panic when Transform write validation triggers error propagation
- `parallel/test-zlib-params.js`: Actual params() level change mid-stream not supported
- `parallel/test-zlib-unused-weak.js`: Requires --expose-gc and process.memoryUsage().external
- `parallel/test-zlib-unzip-one-byte-chunks.js`: Tests one-byte streaming unzip of concatenated gzip
- `parallel/test-zlib-write-after-close.js`: Uses t.mock.fn() with mock.callCount() assertion
- `parallel/test-zlib-write-after-end.js`: Uses t.mock.fn() with mock.callCount() assertion
- `parallel/test-zlib-zero-windowBits.js`: newly discovered, not yet evaluated
- `parallel/test-zlib.js`: newly discovered, not yet evaluated
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
- `sequential/test-http-server-keep-alive-timeout-slow-client-headers.js`: requires server-side headersTimeout enforcement which is not yet implemented
- `sequential/test-http-server-keep-alive-timeout-slow-server.js`: requires server-side keepAliveTimeout enforcement which is not yet implemented
- `sequential/test-http-server-request-timeouts-mixed.js`: requires HTTP server functionality
- `sequential/test-http2-large-file.js`: requires HTTP2 server functionality
- `sequential/test-http2-max-session-memory.js`: requires HTTP2 server functionality
- `sequential/test-http2-ping-flood.js`: requires HTTP2 server functionality
- `sequential/test-http2-settings-flood.js`: requires HTTP2 server functionality
- `sequential/test-http2-timeout-large-write-file.js`: requires HTTP2 server functionality
- `sequential/test-http2-timeout-large-write.js`: requires HTTP2 server functionality
- `sequential/test-https-connect-localport.js`: requires TLS/HTTPS which is not supported in WASM
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
| test-require-module-cycle-esm-esm-cjs-esm.js | 4 | 0 | 4 | 0 | 0 |
| test-require-module-defined-esmodule.js | 2 | 0 | 2 | 0 | 0 |
| test-require-module-tla.js | 2 | 0 | 2 | 0 | 0 |
| test-require-module-with-detection.js | 2 | 0 | 2 | 0 | 0 |
| test-require-module.js | 6 | 0 | 6 | 0 | 0 |
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
| test-assert.js | 18 | 17 | 1 | 0 | 0 |
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
| test-child-process-execfile.js | 8 | 6 | 2 | 0 | 0 |
| test-child-process-execfilesync-maxbuf.js | 3 | 0 | 3 | 0 | 0 |
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
| test-common-gc.js | 2 | 2 | 0 | 0 | 0 |
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
| test-crypto-prime.js | 10 | 10 | 0 | 0 | 0 |
| test-crypto-random.js | 22 | 22 | 0 | 0 | 0 |
| test-crypto-rsa-dsa.js | 7 | 7 | 0 | 0 | 0 |
| test-crypto-scrypt.js | 4 | 0 | 0 | 0 | 4 |
| test-crypto-secret-keygen.js | 3 | 3 | 0 | 0 | 0 |
| test-crypto-sign-verify.js | 19 | 11 | 7 | 0 | 1 |
| test-crypto-x509.js | 3 | 0 | 3 | 0 | 0 |
| test-dgram-address.js | 2 | 1 | 1 | 0 | 0 |
| test-dgram-bind-fd-error.js | 2 | 0 | 2 | 0 | 0 |
| test-dgram-blocklist.js | 3 | 3 | 0 | 0 | 0 |
| test-dgram-close-signal.js | 3 | 2 | 1 | 0 | 0 |
| test-dgram-create-socket-handle-fd.js | 3 | 0 | 3 | 0 | 0 |
| test-dgram-create-socket-handle.js | 3 | 0 | 3 | 0 | 0 |
| test-dgram-createSocket-type.js | 2 | 2 | 0 | 0 | 0 |
| test-dgram-custom-lookup.js | 3 | 2 | 1 | 0 | 0 |
| test-dgram-membership.js | 12 | 0 | 12 | 0 | 0 |
| test-dgram-multicast-loopback.js | 2 | 1 | 1 | 0 | 0 |
| test-dgram-multicast-set-interface.js | 8 | 8 | 0 | 0 | 0 |
| test-dgram-setBroadcast.js | 2 | 1 | 1 | 0 | 0 |
| test-dgram-socket-buffer-size.js | 6 | 4 | 2 | 0 | 0 |
| test-dgram-unref.js | 2 | 2 | 0 | 0 | 0 |
| test-diagnostics-channel-tracing-channel-has-subscribers.js | 2 | 2 | 0 | 0 | 0 |
| test-dns-lookup.js | 3 | 0 | 3 | 0 | 0 |
| test-dns-setlocaladdress.js | 2 | 1 | 1 | 0 | 0 |
| test-dns-setservers-type-check.js | 3 | 0 | 3 | 0 | 0 |
| test-dns.js | 12 | 0 | 12 | 0 | 0 |
| test-domain-intercept.js | 3 | 3 | 0 | 0 | 0 |
| test-domain-promise.js | 10 | 4 | 6 | 0 | 0 |
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
| test-fs-readfile.js | 4 | 2 | 1 | 1 | 0 |
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
| test-fs-writefile-with-fd.js | 4 | 4 | 0 | 0 | 0 |
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
| test-http-generic-streams.js | 5 | 5 | 0 | 0 | 0 |
| test-http-head-throw-on-response-body-write.js | 3 | 0 | 3 | 0 | 0 |
| test-http-insecure-parser-per-stream.js | 5 | 4 | 1 | 0 | 0 |
| test-http-max-header-size-per-stream.js | 4 | 4 | 0 | 0 | 0 |
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
| test-http-parser.js | 12 | 0 | 12 | 0 | 0 |
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
| test-http-server-timeouts-validation.js | 7 | 0 | 7 | 0 | 0 |
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
| test-https-insecure-parse-per-stream.js | 5 | 2 | 3 | 0 | 0 |
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
| test-module-create-require-multibyte.js | 2 | 0 | 2 | 0 | 0 |
| test-module-multi-extensions.js | 7 | 1 | 6 | 0 | 0 |
| test-module-setsourcemapssupport.js | 2 | 0 | 2 | 0 | 0 |
| test-module-strip-types.js | 9 | 0 | 0 | 0 | 9 |
| test-net-allow-half-open.js | 2 | 0 | 2 | 0 | 0 |
| test-net-autoselectfamily-default.js | 2 | 0 | 2 | 0 | 0 |
| test-net-autoselectfamily.js | 4 | 1 | 3 | 0 | 0 |
| test-net-better-error-messages-path.js | 2 | 0 | 2 | 0 | 0 |
| test-net-blocklist.js | 4 | 4 | 0 | 0 | 0 |
| test-net-bytes-written-large.js | 3 | 0 | 3 | 0 | 0 |
| test-net-connect-options-port.js | 4 | 0 | 4 | 0 | 0 |
| test-net-normalize-args.js | 2 | 0 | 2 | 0 | 0 |
| test-net-perf_hooks.js | 2 | 0 | 2 | 0 | 0 |
| test-net-server-call-listen-multiple-times.js | 3 | 0 | 3 | 0 | 0 |
| test-net-server-listen-handle.js | 2 | 0 | 2 | 0 | 0 |
| test-net-server-listen-options-signal.js | 3 | 0 | 3 | 0 | 0 |
| test-net-server-listen-options.js | 3 | 0 | 3 | 0 | 0 |
| test-net-server-listen-path.js | 6 | 6 | 0 | 0 | 0 |
| test-net-socket-write-after-close.js | 2 | 0 | 2 | 0 | 0 |
| test-nodeeventtarget.js | 7 | 0 | 7 | 0 | 0 |
| test-perf-hooks-histogram.js | 6 | 0 | 6 | 0 | 0 |
| test-perf-hooks-resourcetiming.js | 5 | 0 | 5 | 0 | 0 |
| test-perf-hooks-usertiming.js | 3 | 0 | 3 | 0 | 0 |
| test-performance-function.js | 6 | 0 | 6 | 0 | 0 |
| test-performance-gc.js | 2 | 2 | 0 | 0 | 0 |
| test-performanceobserver.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-allow-child-process-cli.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-allow-wasi-cli.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-allow-worker-cli.js | 2 | 1 | 1 | 0 | 0 |
| test-permission-child-process-cli.js | 2 | 0 | 2 | 0 | 0 |
| test-permission-fs-read.js | 3 | 2 | 1 | 0 | 0 |
| test-permission-fs-require.js | 4 | 1 | 3 | 0 | 0 |
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
| test-runner-assert.js | 2 | 1 | 1 | 0 | 0 |
| test-runner-cli-concurrency.js | 5 | 0 | 5 | 0 | 0 |
| test-runner-cli-timeout.js | 3 | 0 | 3 | 0 | 0 |
| test-runner-cli.js | 11 | 0 | 11 | 0 | 0 |
| test-runner-concurrency.js | 4 | 3 | 1 | 0 | 0 |
| test-runner-coverage.js | 12 | 11 | 1 | 0 | 0 |
| test-runner-custom-assertions.js | 5 | 0 | 5 | 0 | 0 |
| test-runner-error-reporter.js | 2 | 0 | 2 | 0 | 0 |
| test-runner-extraneous-async-activity.js | 4 | 0 | 4 | 0 | 0 |
| test-runner-force-exit-flush.js | 3 | 0 | 3 | 0 | 0 |
| test-runner-mocking.js | 43 | 6 | 37 | 0 | 0 |
| test-runner-module-mocking.js | 19 | 0 | 19 | 0 | 0 |
| test-runner-no-isolation-filtering.js | 3 | 0 | 3 | 0 | 0 |
| test-runner-snapshot-file-tests.js | 2 | 0 | 2 | 0 | 0 |
| test-runner-snapshot-tests.js | 6 | 0 | 6 | 0 | 0 |
| test-runner-test-filepath.js | 2 | 0 | 2 | 0 | 0 |
| test-runner-test-fullname.js | 2 | 1 | 1 | 0 | 0 |
| test-runner-wait-for.js | 7 | 0 | 7 | 0 | 0 |
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
| test-sqlite-database-sync.js | 5 | 0 | 5 | 0 | 0 |
| test-sqlite-session.js | 14 | 0 | 14 | 0 | 0 |
| test-sqlite-statement-sync.js | 9 | 0 | 9 | 0 | 0 |
| test-sqlite.js | 6 | 0 | 6 | 0 | 0 |
| test-startup-empty-regexp-statics.js | 3 | 0 | 3 | 0 | 0 |
| test-startup-large-pages.js | 2 | 0 | 2 | 0 | 0 |
| test-stream-add-abort-signal.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-auto-destroy.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-catch-rejections.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-compose-operator.js | 8 | 8 | 0 | 0 | 0 |
| test-stream-compose.js | 22 | 22 | 0 | 0 | 0 |
| test-stream-construct.js | 12 | 12 | 0 | 0 | 0 |
| test-stream-consumers.js | 16 | 16 | 0 | 0 | 0 |
| test-stream-destroy.js | 6 | 4 | 2 | 0 | 0 |
| test-stream-drop-take.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-duplex-destroy.js | 16 | 16 | 0 | 0 | 0 |
| test-stream-duplex-end.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-duplex-from.js | 23 | 23 | 0 | 0 | 0 |
| test-stream-duplex-props.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-duplex-readable-writable.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-duplex-writable-finished.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-duplex.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-duplexpair.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-error-once.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-event-names.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-filter.js | 12 | 12 | 0 | 0 | 0 |
| test-stream-finished.js | 42 | 39 | 3 | 0 | 0 |
| test-stream-flatMap.js | 8 | 8 | 0 | 0 | 0 |
| test-stream-forEach.js | 11 | 11 | 0 | 0 | 0 |
| test-stream-map.js | 17 | 17 | 0 | 0 | 0 |
| test-stream-objectmode-undefined.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-once-readable-pipe.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-pipe-error-handling.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-pipe-flow.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-pipe-same-destination-twice.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-pipe-unpipe-streams.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-pipeline.js | 80 | 71 | 9 | 0 | 0 |
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
| test-stream-readable-object-multi-push-async.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-readable-pause-and-resume.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-readable-readable.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-reading-readingMore.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-resumeScheduled.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-setEncoding-existing-buffers.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-strategy-option.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-readable-unshift.js | 7 | 7 | 0 | 0 | 0 |
| test-stream-reduce.js | 8 | 8 | 0 | 0 | 0 |
| test-stream-toArray.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-transform-destroy.js | 8 | 8 | 0 | 0 | 0 |
| test-stream-transform-split-highwatermark.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-typedarray.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-uint8array.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-unpipe-event.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-wrap-encoding.js | 2 | 0 | 2 | 0 | 0 |
| test-stream-writable-aborted.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-writable-destroy.js | 28 | 28 | 0 | 0 | 0 |
| test-stream-writable-end-cb-error.js | 3 | 3 | 0 | 0 | 0 |
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
| test-stream2-transform.js | 17 | 17 | 0 | 0 | 0 |
| test-stream2-writable.js | 24 | 23 | 1 | 0 | 0 |
| test-streams-highwatermark.js | 6 | 4 | 2 | 0 | 0 |
| test-stringbytes-external.js | 3 | 0 | 0 | 3 | 0 |
| test-tick-processor-version-check.js | 2 | 0 | 2 | 0 | 0 |
| test-timers-immediate-promisified.js | 8 | 0 | 8 | 0 | 0 |
| test-timers-interval-promisified.js | 12 | 0 | 12 | 0 | 0 |
| test-timers-max-duration-warning.js | 3 | 3 | 0 | 0 | 0 |
| test-timers-refresh.js | 6 | 0 | 6 | 0 | 0 |
| test-timers-timeout-promisified.js | 8 | 0 | 8 | 0 | 0 |
| test-timers-to-primitive.js | 2 | 2 | 0 | 0 | 0 |
| test-timers-unenroll-unref-interval.js | 5 | 5 | 0 | 0 | 0 |
| test-timers-unref.js | 3 | 3 | 0 | 0 | 0 |
| test-timers-user-call.js | 2 | 1 | 0 | 1 | 0 |
| test-timers-zero-timeout.js | 2 | 2 | 0 | 0 | 0 |
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
| test-util-inspect.js | 99 | 99 | 0 | 0 | 0 |
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
| test-webstorage.js | 8 | 0 | 8 | 0 | 0 |
| test-webstreams-abort-controller.js | 6 | 0 | 6 | 0 | 0 |
| test-webstreams-compose.js | 20 | 20 | 0 | 0 | 0 |
| test-webstreams-finished.js | 20 | 0 | 20 | 0 | 0 |
| test-webstreams-pipeline.js | 17 | 13 | 4 | 0 | 0 |
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
| test-worker-message-channel.js | 3 | 3 | 0 | 0 | 0 |
| test-worker-message-event.js | 3 | 0 | 3 | 0 | 0 |
| test-worker-message-mark-as-uncloneable.js | 4 | 0 | 4 | 0 | 0 |
| test-worker-message-port-close.js | 4 | 2 | 2 | 0 | 0 |
| test-worker-message-port-transfer-duplicate.js | 2 | 0 | 2 | 0 | 0 |
| test-worker-message-port-transfer-native.js | 2 | 0 | 2 | 0 | 0 |
| test-worker-message-port-wasm-threads.js | 2 | 0 | 2 | 0 | 0 |
| test-worker-message-port.js | 9 | 2 | 7 | 0 | 0 |
| test-worker-message-transfer-port-mark-as-untransferable.js | 4 | 0 | 4 | 0 | 0 |
| test-worker-unsupported-path.js | 3 | 0 | 3 | 0 | 0 |
| test-worker-workerdata-messageport.js | 5 | 3 | 2 | 0 | 0 |
| test-wrap-js-stream-destroy.js | 3 | 0 | 3 | 0 | 0 |
| test-wrap-js-stream-duplex.js | 2 | 0 | 2 | 0 | 0 |
| test-x509-escaping.js | 8 | 0 | 8 | 0 | 0 |
| test-zlib-brotli.js | 3 | 3 | 0 | 0 | 0 |
| test-zlib-create-raw.js | 2 | 2 | 0 | 0 | 0 |
| test-zlib-destroy.js | 2 | 2 | 0 | 0 | 0 |
| test-zlib-dictionary-fail.js | 3 | 3 | 0 | 0 | 0 |
| test-zlib-failed-init.js | 2 | 0 | 2 | 0 | 0 |
| test-zlib-zero-windowBits.js | 2 | 0 | 2 | 0 | 0 |
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

190 test(s) should be unskipped:

- `es-module/test-esm-symlink-type.js`
- `es-module/test-esm-type-field-errors.js`
- `parallel/test-cli-node-options-disallowed.js`
- `parallel/test-common-countdown.js`
- `parallel/test-http-autoselectfamily.js`
- `parallel/test-http-generic-streams.js`
- `parallel/test-http-header-validators.js`
- `parallel/test-http-hostname-typechecking.js`
- `parallel/test-http-incoming-message-destroy.js`
- `parallel/test-http-invalid-path-chars.js`
- `parallel/test-http-invalid-urls.js`
- `parallel/test-http-invalidheaderfield2.js`
- `parallel/test-http-max-header-size-per-stream.js`
- `parallel/test-http-outgoing-message-inheritance.js`
- `parallel/test-http-outgoing-message-write-callback.js`
- `parallel/test-http-parser-multiple-execute.js`
- `parallel/test-http-request-invalid-method-error.js`
- `parallel/test-http-sync-write-error-during-continue.js`
- `parallel/test-https-autoselectfamily.js`
- `parallel/test-internal-util-normalizeencoding.js`
- `parallel/test-js-stream-call-properties.js`
- `parallel/test-os-userinfo-handles-getter-errors.js`
- `parallel/test-outgoing-message-destroy.js`
- `parallel/test-stream2-unpipe-leak.js`
- `parallel/test-timers-nested.js`
- `parallel/test-timers-next-tick.js`
- `parallel/test-tls-cli-min-max-conflict.js`
- `parallel/test-util.js`
- `parallel/test-vm-api-handles-getter-errors.js`
- `parallel/test-vm-module-reevaluate.js`
- `parallel/test-worker-message-channel.js`
- `parallel/test-worker-message-port-arraybuffer.js`
- `sequential/test-cli-syntax-bad.js`
- `sequential/test-deprecation-flags.js`
- `sequential/test-process-warnings.js`
- `sequential/test-timers-block-eventloop.js`
- `parallel/test-blocklist.js#block_13_block_13`
- `parallel/test-blocklist.js#block_14_block_14`
- `parallel/test-blocklist.js#block_15_block_15`
- `parallel/test-blocklist.js#block_16_block_16`
- `parallel/test-child-process-exec-maxbuf.js#block_10_block_10`
- `parallel/test-child-process-execfile-maxbuf.js#block_00_default_value`
- `parallel/test-child-process-execfile-maxbuf.js#block_01_default_value`
- `parallel/test-child-process-execfile-maxbuf.js#block_02_block_02`
- `parallel/test-child-process-execfile-maxbuf.js#block_03_block_03`
- `parallel/test-child-process-execfile-maxbuf.js#block_04_block_04`
- `parallel/test-child-process-execfile-maxbuf.js#block_05_block_05`
- `parallel/test-child-process-execfile.js#block_00_block_00`
- `parallel/test-child-process-execfile.js#block_01_block_01`
- `parallel/test-child-process-execfile.js#block_02_block_02`
- `parallel/test-child-process-execfile.js#block_03_block_03`
- `parallel/test-child-process-execfile.js#block_04_block_04`
- `parallel/test-child-process-execfile.js#block_06_block_06`
- `parallel/test-child-process-spawnsync-maxbuf.js#block_01_verify_that_a_maxbuffer_size_of_infinity_works`
- `parallel/test-child-process-spawnsync-maxbuf.js#block_03_default_maxbuffer_size_is_1024_1024`
- `parallel/test-crypto-sign-verify.js#block_14_block_14`
- `parallel/test-crypto-sign-verify.js#block_16_block_16`
- `parallel/test-dgram-address.js#block_01_block_01`
- `parallel/test-dgram-close-signal.js#block_01_block_01`
- `parallel/test-dgram-close-signal.js#block_02_block_02`
- `parallel/test-dgram-multicast-loopback.js#block_01_block_01`
- `parallel/test-dgram-setBroadcast.js#block_01_block_01`
- `parallel/test-dgram-socket-buffer-size.js#block_02_block_02`
- `parallel/test-dgram-socket-buffer-size.js#block_03_block_03`
- `parallel/test-dgram-socket-buffer-size.js#block_04_block_04`
- `parallel/test-dgram-socket-buffer-size.js#block_05_block_05`
- `parallel/test-domain-promise.js#block_02_block_02`
- `parallel/test-domain-promise.js#block_04_block_04`
- `parallel/test-domain-promise.js#block_07_block_07`
- `parallel/test-domain-promise.js#block_08_block_08`
- `parallel/test-file.js#block_01_block_01`
- `parallel/test-file.js#block_03_block_03`
- `parallel/test-file.js#block_04_block_04`
- `parallel/test-file.js#block_06_block_06`
- `parallel/test-file.js#block_08_block_08`
- `parallel/test-file.js#block_09_block_09`
- `parallel/test-file.js#block_11_block_11`
- `parallel/test-file.js#block_13_block_13`
- `parallel/test-file.js#block_15_block_15`
- `parallel/test-http-client-abort3.js#block_00_block_00`
- `parallel/test-http-generic-streams.js#block_00_test_1_simple_http_test_no_keep_alive`
- `parallel/test-http-generic-streams.js#block_01_test_2_keep_alive_for_2_requests`
- `parallel/test-http-generic-streams.js#block_02_test_3_connection_close_request_response_with_chunked`
- `parallel/test-http-generic-streams.js#block_03_the_same_as_test_3_but_with_content_length_headers`
- `parallel/test-http-generic-streams.js#block_04_test_5_the_client_sends_garbage`
- `parallel/test-http-insecure-parser-per-stream.js#block_00_test_1_the_server_sends_an_invalid_header`
- `parallel/test-http-insecure-parser-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-http-insecure-parser-per-stream.js#block_02_test_3_the_client_sends_an_invalid_header`
- `parallel/test-http-insecure-parser-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`
- `parallel/test-http-max-header-size-per-stream.js#block_00_test_1_the_server_sends_larger_headers_than_what_would_other`
- `parallel/test-http-max-header-size-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-http-max-header-size-per-stream.js#block_02_test_3_the_client_sends_larger_headers_than_what_would_other`
- `parallel/test-http-max-header-size-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`
- `parallel/test-http-outgoing-renderHeaders.js#block_00_block_00`
- `parallel/test-http-outgoing-settimeout.js#block_01_block_01`
- `parallel/test-https-insecure-parse-per-stream.js#block_00_test_1_the_server_sends_an_invalid_header`
- `parallel/test-https-insecure-parse-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-https-max-header-size-per-stream.js#block_00_test_1_the_server_sends_larger_headers_than_what_would_other`
- `parallel/test-https-max-header-size-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-internal-util-objects.js#block_01_block_01`
- `parallel/test-module-multi-extensions.js#block_02_block_02`
- `parallel/test-permission-allow-worker-cli.js#block_01_to_spawn_unless_allow_worker_is_sent`
- `parallel/test-permission-fs-read.js#block_02_block_02`
- `parallel/test-process-env-allowed-flags.js#block_01_assert_all_canonical_flags_begin_with_dash_es`
- `parallel/test-process-env.js#block_01_block_01`
- `parallel/test-process-env.js#block_02_https_github_com_nodejs_node_issues_45380`
- `parallel/test-process-env.js#block_03_https_github_com_nodejs_node_issues_32920`
- `parallel/test-runner-assert.js#test_01_t_assert_ok_correctly_parses_the_stacktrace`
- `parallel/test-runner-concurrency.js#test_00_concurrency_option_boolean_true`
- `parallel/test-runner-concurrency.js#test_02_concurrency_true_implies_infinity`
- `parallel/test-runner-concurrency.js#test_03_test_multiple_files`
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
- `parallel/test-runner-mocking.js#test_01_spies_on_a_bound_function`
- `parallel/test-runner-mocking.js#test_03_a_no_op_spy_function_is_created_by_default`
- `parallel/test-runner-mocking.js#test_04_internal_no_op_function_can_be_reused`
- `parallel/test-runner-mocking.js#test_06_internal_no_op_function_can_be_reused_as_methods`
- `parallel/test-runner-mocking.js#test_18_mocked_functions_report_thrown_errors`
- `parallel/test-runner-mocking.js#test_32_local_mocks_are_auto_restored_after_the_test_finishes`
- `parallel/test-runner-test-fullname.js#test_01_test_01`
- `parallel/test-set-incoming-message-header.js#block_00_headers_setter_function_set_a_header_correctly`
- `parallel/test-set-incoming-message-header.js#block_01_trailers_setter_function_set_a_header_correctly`
- `parallel/test-stream-add-abort-signal.js#block_00_block_00`
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
- `parallel/test-streams-highwatermark.js#block_01_block_01`
- `parallel/test-streams-highwatermark.js#block_02_block_02`
- `parallel/test-streams-highwatermark.js#block_03_block_03`
- `parallel/test-streams-highwatermark.js#block_05_block_05`
- `parallel/test-util-inspect.js#block_00_special_function_inspection`
- `parallel/test-util-inspect.js#block_33_new_api_accepts_an_options_object`
- `parallel/test-util-inspect.js#block_39_test_set`
- `parallel/test-util-inspect.js#block_41_test_map`
- `parallel/test-util-inspect.js#block_44_test_promise`
- `parallel/test-util-inspect.js#block_73_manipulate_the_prototype_in_weird_ways`
- `parallel/test-util-inspect.js#block_74_check_that_the_fallback_always_works`
- `parallel/test-util-inspect.js#block_77_block_77`
- `parallel/test-util-inspect.js#block_78_block_78`
- `parallel/test-util-inspect.js#block_79_block_79`
- `parallel/test-util-inspect.js#block_83_https_github_com_nodejs_node_issues_31889`
- `parallel/test-util-inspect.js#block_91_block_91`
- `parallel/test-util-promisify.js#block_00_block_00`
- `parallel/test-vm-new-script-new-context.js#block_03_block_03`
- `parallel/test-vm-new-script-new-context.js#block_05_block_05`
- `parallel/test-vm-new-script-new-context.js#block_06_block_06`
- `parallel/test-webcrypto-sign-verify.js#block_02_test_sign_verify_ecdsa`
- `parallel/test-webcrypto-sign-verify.js#block_03_test_sign_verify_hmac`
- `parallel/test-webcrypto-sign-verify.js#block_04_test_sign_verify_ed25519`
- `parallel/test-webstreams-pipeline.js#block_11_block_11`
- `parallel/test-webstreams-pipeline.js#block_12_block_12`
- `parallel/test-webstreams-pipeline.js#block_13_block_13`
- `parallel/test-webstreams-pipeline.js#block_14_block_14`
- `parallel/test-webstreams-pipeline.js#block_15_block_15`
- `parallel/test-webstreams-pipeline.js#block_16_block_16`
- `parallel/test-whatwg-encoding-custom-interop.js#block_00_test_textencoder`
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_07_block_07`
- `parallel/test-whatwg-events-customevent.js#block_02_block_02`
- `parallel/test-whatwg-readablebytestream.js#block_09_block_09`
- `parallel/test-whatwg-readablebytestream.js#block_10_block_10`
- `parallel/test-worker-message-channel.js#block_00_block_00`
- `parallel/test-worker-message-channel.js#block_01_block_01`
- `parallel/test-worker-message-channel.js#block_02_block_02`
- `parallel/test-worker-message-port-close.js#block_01_block_01`
- `parallel/test-worker-message-port-close.js#block_03_refs_https_github_com_nodejs_node_issues_42296`
- `parallel/test-worker-message-port.js#block_03_block_03`
- `parallel/test-worker-workerdata-messageport.js#block_04_block_04`
- `sequential/test-fs-opendir-recursive.js#block_01_block_01`
- `sequential/test-fs-opendir-recursive.js#block_02_block_02`
- `sequential/test-fs-opendir-recursive.js#block_03_block_03`
- `sequential/test-fs-opendir-recursive.js#block_06_block_06`
- `sequential/test-fs-watch.js#block_03_not_block_the_event_loop`
- `sequential/test-fs-watch.js#block_04_https_github_com_joyent_node_issues_6690`
- `sequential/test-fs-watch.js#block_05_block_05`

## Passing Tests Not in Config

These tests pass but are not listed in `config.jsonc`.
Consider adding them.

_All passing tests are already in config.jsonc._

## All Results by Module (Public + Internals)

| Module | Total | Pass | Fail | Error | Skip | Pass% |
|--------|-------|------|------|-------|------|-------|
| abort | 31 | 17 | 11 | 0 | 3 | 54.8% |
| assert | 105 | 94 | 11 | 0 | 0 | 89.5% |
| async_hooks | 38 | 15 | 0 | 0 | 23 | 39.5% |
| blob | 25 | 2 | 22 | 0 | 1 | 8.0% |
| buffer | 196 | 186 | 0 | 8 | 2 | 94.9% |
| child_process | 232 | 40 | 88 | 13 | 91 | 17.2% |
| cluster | 87 | 4 | 0 | 0 | 83 | 4.6% |
| console | 33 | 33 | 0 | 0 | 0 | 100.0% |
| crypto | 263 | 232 | 13 | 5 | 13 | 88.2% |
| dgram | 132 | 74 | 28 | 0 | 30 | 56.1% |
| diagnostics_channel | 34 | 23 | 0 | 0 | 11 | 67.6% |
| dns | 46 | 9 | 20 | 0 | 17 | 19.6% |
| domain | 63 | 35 | 6 | 0 | 22 | 55.6% |
| events | 101 | 65 | 30 | 0 | 6 | 64.4% |
| fetch | 1 | 1 | 0 | 0 | 0 | 100.0% |
| fs | 538 | 379 | 76 | 11 | 72 | 70.4% |
| http | 960 | 90 | 303 | 0 | 567 | 9.4% |
| inspector | 91 | 0 | 0 | 0 | 91 | 0.0% |
| module | 203 | 15 | 66 | 0 | 122 | 7.4% |
| net | 215 | 50 | 52 | 0 | 113 | 23.3% |
| os | 6 | 2 | 0 | 0 | 4 | 33.3% |
| other | 1513 | 181 | 776 | 4 | 552 | 12.0% |
| path | 16 | 16 | 0 | 0 | 0 | 100.0% |
| perf_hooks | 49 | 8 | 27 | 0 | 14 | 16.3% |
| process | 98 | 46 | 5 | 2 | 45 | 46.9% |
| querystring | 15 | 15 | 0 | 0 | 0 | 100.0% |
| readline | 106 | 0 | 86 | 0 | 20 | 0.0% |
| repl | 89 | 2 | 12 | 0 | 75 | 2.2% |
| stream | 829 | 790 | 28 | 0 | 11 | 95.3% |
| string_decoder | 3 | 0 | 0 | 0 | 3 | 0.0% |
| test_runner | 175 | 29 | 113 | 0 | 33 | 16.6% |
| timers | 109 | 51 | 34 | 2 | 22 | 46.8% |
| tls | 214 | 4 | 17 | 0 | 193 | 1.9% |
| trace_events | 35 | 4 | 0 | 0 | 31 | 11.4% |
| tty | 5 | 0 | 0 | 0 | 5 | 0.0% |
| url | 33 | 33 | 0 | 0 | 0 | 100.0% |
| util | 183 | 182 | 0 | 0 | 1 | 99.5% |
| v8 | 49 | 15 | 21 | 0 | 13 | 30.6% |
| vm | 127 | 24 | 25 | 9 | 69 | 18.9% |
| worker_threads | 204 | 88 | 52 | 7 | 57 | 43.1% |
| zlib | 67 | 41 | 4 | 0 | 22 | 61.2% |


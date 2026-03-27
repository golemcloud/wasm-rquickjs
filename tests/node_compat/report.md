# Node.js v22 Compatibility Report

Generated: 2026-03-20 | Runtime: 3923s | Engine: wasm-rquickjs (QuickJS)

## Summary (Public API Tests)

Tests that rely on Node.js internals (`--expose-internals`, `internalBinding`, `require('internal/...')`) are excluded from the primary counts (1128 internals tests listed separately below).

| Result | Count | Percentage |
|--------|-------|------------|
| ✅ PASS | 2889 | 54.4% |
| ⏭️ SKIP | 1180 | 22.2% |
| 🚫 IMPOSSIBLE | 1085 | 20.4% |
| ❌ FAIL | 96 | 1.8% |
| 💥 ERROR | 57 | 1.1% |
| **Total** | **5307** | **100%** |

### All Tests (Public + Internals)

Including 1128 tests that use Node.js internals (`--expose-internals`, `internalBinding`, `require('internal/...')`).

| Result | Count | Percentage |
|--------|-------|------------|
| ✅ PASS | 3046 | 47.3% |
| ⏭️ SKIP | 2062 | 32.0% |
| 🚫 IMPOSSIBLE | 1162 | 18.1% |
| ❌ FAIL | 108 | 1.7% |
| 💥 ERROR | 57 | 0.9% |
| **Total** | **6435** | **100%** |

## Results by Module

| Module | Total | Pass | Fail | Error | Skip | Impossible | Pass% |
|--------|-------|------|------|-------|------|------------|-------|
| abort | 27 | 26 | 1 | 0 | 0 | 0 | 96.3% |
| assert | 95 | 94 | 0 | 1 | 0 | 0 | 98.9% |
| async_hooks | 36 | 4 | 0 | 0 | 32 | 0 | 11.1% |
| blob | 2 | 2 | 0 | 0 | 0 | 0 | 100.0% |
| buffer | 174 | 164 | 0 | 8 | 2 | 0 | 94.3% |
| child_process | 113 | 16 | 2 | 2 | 0 | 93 | 14.2% |
| cli | 30 | 11 | 0 | 0 | 19 | 0 | 36.7% |
| cluster | 85 | 0 | 0 | 0 | 0 | 85 | 0.0% |
| common | 9 | 1 | 1 | 0 | 7 | 0 | 11.1% |
| compile | 15 | 0 | 0 | 0 | 0 | 15 | 0.0% |
| console | 30 | 29 | 0 | 0 | 1 | 0 | 96.7% |
| crypto | 218 | 199 | 2 | 8 | 9 | 0 | 91.3% |
| dgram | 97 | 19 | 4 | 4 | 65 | 5 | 19.6% |
| diagnostics_channel | 33 | 18 | 0 | 0 | 14 | 1 | 54.5% |
| dns | 30 | 2 | 1 | 0 | 27 | 0 | 6.7% |
| domain | 61 | 28 | 0 | 0 | 32 | 1 | 45.9% |
| encoding | 1 | 1 | 0 | 0 | 0 | 0 | 100.0% |
| errors | 2 | 0 | 0 | 0 | 2 | 0 | 0.0% |
| eslint | 22 | 0 | 0 | 0 | 0 | 22 | 0.0% |
| events | 61 | 59 | 0 | 0 | 2 | 0 | 96.7% |
| fetch | 1 | 1 | 0 | 0 | 0 | 0 | 100.0% |
| fs | 407 | 364 | 4 | 12 | 26 | 1 | 89.4% |
| global | 9 | 3 | 0 | 0 | 6 | 0 | 33.3% |
| heap | 19 | 0 | 0 | 0 | 0 | 19 | 0.0% |
| http | 761 | 250 | 11 | 7 | 197 | 296 | 32.9% |
| inspector | 89 | 1 | 0 | 0 | 0 | 88 | 1.1% |
| internal | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% |
| module | 172 | 84 | 1 | 0 | 80 | 7 | 48.8% |
| net | 210 | 137 | 2 | 6 | 64 | 1 | 65.2% |
| node | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% |
| os | 5 | 5 | 0 | 0 | 0 | 0 | 100.0% |
| other | 270 | 74 | 3 | 0 | 146 | 47 | 27.4% |
| path | 16 | 16 | 0 | 0 | 0 | 0 | 100.0% |
| perf_hooks | 36 | 3 | 1 | 0 | 31 | 1 | 8.3% |
| permission | 54 | 5 | 3 | 0 | 41 | 5 | 9.3% |
| process | 89 | 40 | 0 | 0 | 47 | 2 | 44.9% |
| promises | 23 | 1 | 0 | 0 | 22 | 0 | 4.3% |
| querystring | 14 | 14 | 0 | 0 | 0 | 0 | 100.0% |
| readline | 21 | 0 | 0 | 0 | 19 | 2 | 0.0% |
| repl | 66 | 1 | 0 | 0 | 0 | 65 | 1.5% |
| shadow_realm | 11 | 0 | 0 | 0 | 10 | 1 | 0.0% |
| signal | 4 | 1 | 0 | 0 | 3 | 0 | 25.0% |
| snapshot | 26 | 0 | 0 | 0 | 0 | 26 | 0.0% |
| sqlite | 39 | 36 | 3 | 0 | 0 | 0 | 92.3% |
| stdio | 23 | 14 | 0 | 0 | 9 | 0 | 60.9% |
| stream | 746 | 709 | 21 | 4 | 11 | 1 | 95.0% |
| string_decoder | 3 | 3 | 0 | 0 | 0 | 0 | 100.0% |
| test_runner | 149 | 92 | 17 | 1 | 39 | 0 | 61.7% |
| timers | 56 | 47 | 0 | 0 | 9 | 0 | 83.9% |
| tls | 188 | 4 | 0 | 0 | 0 | 184 | 2.1% |
| trace_events | 30 | 15 | 0 | 0 | 14 | 1 | 50.0% |
| tty | 3 | 0 | 0 | 0 | 3 | 0 | 0.0% |
| url | 28 | 28 | 0 | 0 | 0 | 0 | 100.0% |
| util | 47 | 40 | 0 | 1 | 6 | 0 | 85.1% |
| v8 | 31 | 14 | 0 | 0 | 17 | 0 | 45.2% |
| vm | 121 | 25 | 2 | 0 | 93 | 1 | 20.7% |
| webcrypto | 60 | 41 | 0 | 2 | 16 | 1 | 68.3% |
| webstreams | 67 | 65 | 0 | 0 | 2 | 0 | 97.0% |
| whatwg | 64 | 13 | 3 | 1 | 47 | 0 | 20.3% |
| worker_threads | 145 | 18 | 13 | 0 | 0 | 114 | 12.4% |
| zlib | 61 | 52 | 1 | 0 | 8 | 0 | 85.2% |

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
- `es-module/test-require-module-cached-tla.js`
- `es-module/test-require-module-cycle-cjs-esm-esm.js`
- `es-module/test-require-module-default-extension.js`
- `es-module/test-require-module-defined-esmodule.js#block_00_require_esm_should_allow_the_user_override`
- `es-module/test-require-module-defined-esmodule.js#block_01_block_01`
- `es-module/test-require-module-detect-entry-point-aou.js`
- `es-module/test-require-module-detect-entry-point.js`
- `es-module/test-require-module-dont-detect-cjs.js`
- `es-module/test-require-module-dynamic-import-3.js`
- `es-module/test-require-module-dynamic-import-4.js`
- `es-module/test-require-module-implicit.js`
- `es-module/test-require-module-tla-retry-require.js`
- `es-module/test-require-module-tla.js#block_00_block_00`
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
- `parallel/test-abortcontroller.js#test_12_abortsignal_timeout_does_not_prevent_the_signal_from_being_c`
- `parallel/test-abortcontroller.js#test_13_abortsignal_with_a_timeout_is_not_collected_while_there_is_a`
- `parallel/test-abortcontroller.js#test_14_setting_a_long_timeout_should_not_keep_the_process_open`
- `parallel/test-abortcontroller.js#test_15_abortsignal_reason_should_default`
- `parallel/test-abortcontroller.js#test_16_abortsignal_throwifaborted_works_as_expected`
- `parallel/test-abortcontroller.js#test_17_abortsignal_throwifaobrted_works_as_expected_2`
- `parallel/test-abortcontroller.js#test_18_abortsignal_throwifaobrted_works_as_expected_3`
- `parallel/test-aborted-util.js#test_00_aborted_works_when_provided_a_resource`
- `parallel/test-aborted-util.js#test_01_aborted_with_gc_cleanup`
- `parallel/test-aborted-util.js#test_02_fails_with_error_if_not_provided_abortsignal`
- `parallel/test-aborted-util.js#test_03_fails_if_not_provided_a_resource`
- `parallel/test-abortsignal-cloneable.js#test_00_can_create_a_transferable_abort_controller`
- `parallel/test-abortsignal-cloneable.js#test_01_can_create_a_transferable_abort_signal`
- `parallel/test-abortsignal-cloneable.js#test_02_a_cloned_abortsignal_does_not_keep_the_event_loop_open`
- `parallel/test-arm-math-illegal-instruction.js`
- `parallel/test-assert-async.js#block_00_check_assert_rejects`
- `parallel/test-assert-async.js#block_01_block_01`
- `parallel/test-assert-async.js#block_02_block_02`
- `parallel/test-assert-async.js#block_03_block_03`
- `parallel/test-assert-async.js#block_04_check_assert_doesnotreject`
- `parallel/test-assert-builtins-not-read-from-filesystem.js`
- `parallel/test-assert-calltracker-calls.js#block_00_block_00`
- `parallel/test-assert-calltracker-calls.js#block_01_block_01`
- `parallel/test-assert-calltracker-calls.js#block_02_block_02`
- `parallel/test-assert-calltracker-calls.js#block_03_block_03`
- `parallel/test-assert-calltracker-calls.js#block_04_block_04`
- `parallel/test-assert-calltracker-calls.js#block_05_block_05`
- `parallel/test-assert-calltracker-getCalls.js#test_00_assert_calltracker_getcalls`
- `parallel/test-assert-calltracker-getCalls.js#test_01_assert_calltracker_reset`
- `parallel/test-assert-calltracker-report.js`
- `parallel/test-assert-calltracker-verify.js`
- `parallel/test-assert-checktag.js`
- `parallel/test-assert-deep-with-error.js#test_00_handle_error_causes`
- `parallel/test-assert-deep-with-error.js#test_01_handle_undefined_causes`
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
- `parallel/test-assert-deep.js#test_22_check_extra_properties_on_errors`
- `parallel/test-assert-deep.js#test_23_check_proxies`
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
- `parallel/test-assert-deep.js#test_36_verify_object_types_being_identical_on_both_sides`
- `parallel/test-assert-deep.js#test_37_verify_commutativity`
- `parallel/test-assert-deep.js#test_38_crypto`
- `parallel/test-assert-esm-cjs-message-verify.js`
- `parallel/test-assert-fail-deprecation.js#test_00_two_args_only_operator_defaults_to`
- `parallel/test-assert-fail-deprecation.js#test_01_three_args`
- `parallel/test-assert-fail-deprecation.js#test_02_three_args_with_custom_error`
- `parallel/test-assert-fail-deprecation.js#test_03_no_third_arg_but_a_fourth_arg`
- `parallel/test-assert-fail-deprecation.js#test_04_the_stackframefunction_should_exclude_the_foo_frame`
- `parallel/test-assert-fail.js#test_00_no_args`
- `parallel/test-assert-fail.js#test_01_one_arg_message`
- `parallel/test-assert-fail.js#test_02_one_arg_error`
- `parallel/test-assert-fail.js#test_03_object_prototype_get`
- `parallel/test-assert-first-line.js`
- `parallel/test-assert-if-error.js#test_00_test_that_assert_iferror_has_the_correct_stack_trace_of_both`
- `parallel/test-assert-if-error.js#test_01_general_iferror_tests`
- `parallel/test-assert-if-error.js#test_02_should_not_throw`
- `parallel/test-assert-if-error.js#test_03_https_github_com_nodejs_node_v0_x_archive_issues_2893`
- `parallel/test-assert-objects.js`
- `parallel/test-assert-typedarray-deepequal.js#test_01_looseequalarraypairs`
- `parallel/test-assert-typedarray-deepequal.js#test_02_notequalarraypairs`
- `parallel/test-assert.js#test_00_some_basics`
- `parallel/test-assert.js#test_01_throw_message_if_the_message_is_instanceof_error`
- `parallel/test-assert.js#test_02_errors_created_in_different_contexts_are_handled_as_any_othe`
- `parallel/test-assert.js#test_03_assert_throws`
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
- `parallel/test-buffer-arraybuffer.js#block_00_test_the_byteoffset_and_length_arguments`
- `parallel/test-buffer-arraybuffer.js#block_01_test_the_deprecated_buffer_version_also`
- `parallel/test-buffer-arraybuffer.js#block_02_block_02`
- `parallel/test-buffer-arraybuffer.js#block_03_block_03`
- `parallel/test-buffer-ascii.js`
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
- `parallel/test-buffer-from.js#block_00_block_00`
- `parallel/test-buffer-from.js#block_01_block_01`
- `parallel/test-buffer-from.js#block_02_block_02`
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
- `parallel/test-buffer-prototype-inspect.js#block_00_block_00`
- `parallel/test-buffer-prototype-inspect.js#block_01_block_01`
- `parallel/test-buffer-prototype-inspect.js#block_02_block_02`
- `parallel/test-buffer-read.js`
- `parallel/test-buffer-readdouble.js`
- `parallel/test-buffer-readfloat.js`
- `parallel/test-buffer-readint.js#block_00_test_oob`
- `parallel/test-buffer-readint.js#block_01_test_8_bit_signed_integers`
- `parallel/test-buffer-readint.js#block_02_test_16_bit_integers`
- `parallel/test-buffer-readint.js#block_03_test_32_bit_integers`
- `parallel/test-buffer-readint.js#block_04_test_int`
- `parallel/test-buffer-readuint.js#block_00_test_oob`
- `parallel/test-buffer-readuint.js#block_01_test_8_bit_unsigned_integers`
- `parallel/test-buffer-readuint.js#block_02_test_16_bit_unsigned_integers`
- `parallel/test-buffer-readuint.js#block_03_test_32_bit_unsigned_integers`
- `parallel/test-buffer-readuint.js#block_04_test_uint`
- `parallel/test-buffer-resizable.js`
- `parallel/test-buffer-safe-unsafe.js`
- `parallel/test-buffer-set-inspect-max-bytes.js`
- `parallel/test-buffer-sharedarraybuffer.js`
- `parallel/test-buffer-slice.js#block_00_block_00`
- `parallel/test-buffer-slice.js#block_01_block_01`
- `parallel/test-buffer-slice.js#block_02_block_02`
- `parallel/test-buffer-slice.js#block_03_block_03`
- `parallel/test-buffer-slice.js#block_04_block_04`
- `parallel/test-buffer-slow.js`
- `parallel/test-buffer-swap.js#block_00_test_buffers_small_enough_to_use_the_js_implementation`
- `parallel/test-buffer-swap.js#block_01_operates_in_place`
- `parallel/test-buffer-swap.js#block_02_block_02`
- `parallel/test-buffer-swap.js#block_03_force_use_of_native_code_buffer_size_above_threshold_limit_f`
- `parallel/test-buffer-swap.js#block_04_block_04`
- `parallel/test-buffer-swap.js#block_05_block_05`
- `parallel/test-buffer-swap.js#block_06_test_native_code_with_buffers_that_are_not_memory_aligned`
- `parallel/test-buffer-swap.js#block_07_block_07`
- `parallel/test-buffer-swap.js#block_08_block_08`
- `parallel/test-buffer-tojson.js#block_00_block_00`
- `parallel/test-buffer-tojson.js#block_01_issue_gh_7849`
- `parallel/test-buffer-tojson.js#block_02_gh_5110`
- `parallel/test-buffer-tostring-rangeerror.js`
- `parallel/test-buffer-tostring.js`
- `parallel/test-buffer-write.js#block_00_block_00`
- `parallel/test-buffer-write.js#block_01_block_01`
- `parallel/test-buffer-writedouble.js`
- `parallel/test-buffer-writefloat.js`
- `parallel/test-buffer-writeint.js#block_00_test_8_bit`
- `parallel/test-buffer-writeint.js#block_01_test_16_bit`
- `parallel/test-buffer-writeint.js#block_02_test_32_bit`
- `parallel/test-buffer-writeint.js#block_03_test_48_bit`
- `parallel/test-buffer-writeint.js#block_04_test_int`
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
- `parallel/test-child-process-fork-and-spawn.js`
- `parallel/test-child-process-fork-no-shell.js`
- `parallel/test-child-process-fork-ref.js`
- `parallel/test-child-process-fork3.js`
- `parallel/test-child-process-send-after-close.js`
- `parallel/test-child-process-uid-gid.js`
- `parallel/test-cli-eval-event.js`
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
- `parallel/test-console-group.js#block_00_basic_group_functionality`
- `parallel/test-console-group.js#block_01_group_indentation_is_tracked_per_console_instance`
- `parallel/test-console-group.js#block_02_make_sure_labels_work`
- `parallel/test-console-group.js#block_03_check_that_console_groupcollapsed_is_an_alias_of_console_gro`
- `parallel/test-console-group.js#block_04_check_that_multiline_strings_and_object_output_are_indented_`
- `parallel/test-console-group.js#block_05_check_that_the_kgroupindent_symbol_property_is_not_enumerabl`
- `parallel/test-console-group.js#block_06_check_custom_groupindentation`
- `parallel/test-console-group.js#block_07_check_the_correctness_of_the_groupindentation_parameter`
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
- `parallel/test-crypto-authenticated.js#block_00_non_authenticating_mode`
- `parallel/test-crypto-authenticated.js#block_01_throw`
- `parallel/test-crypto-authenticated.js#block_02_test_that_gcm_can_produce_shorter_authentication_tags_than_1`
- `parallel/test-crypto-authenticated.js#block_03_test_that_users_can_manually_restrict_the_gcm_tag_length_to_`
- `parallel/test-crypto-authenticated.js#block_04_authentication_tag_length_has_been_specified`
- `parallel/test-crypto-authenticated.js#block_05_authentication_tag_has_been_specified`
- `parallel/test-crypto-authenticated.js#block_06_test_that_setaad_throws_if_an_invalid_plaintext_length_has_b`
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
- `parallel/test-crypto-certificate.js#block_00_block_00`
- `parallel/test-crypto-certificate.js#block_01_block_01`
- `parallel/test-crypto-certificate.js#block_02_block_02`
- `parallel/test-crypto-cipheriv-decipheriv.js#block_00_block_00`
- `parallel/test-crypto-cipheriv-decipheriv.js#block_01_block_01`
- `parallel/test-crypto-cipheriv-decipheriv.js#block_02_block_02`
- `parallel/test-crypto-cipheriv-decipheriv.js#block_03_block_03`
- `parallel/test-crypto-classes.js`
- `parallel/test-crypto-des3-wrap.js`
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
- `parallel/test-crypto-dh-odd-key.js`
- `parallel/test-crypto-dh-padding.js`
- `parallel/test-crypto-dh-shared.js`
- `parallel/test-crypto-dh.js#block_00_block_00`
- `parallel/test-crypto-dh.js#block_01_through_a_fluke_of_history_g_0_defaults_to_dh_generator_2`
- `parallel/test-crypto-dh.js#block_02_block_02`
- `parallel/test-crypto-domain.js`
- `parallel/test-crypto-domains.js`
- `parallel/test-crypto-ecb.js#block_00_block_00`
- `parallel/test-crypto-ecb.js#block_01_block_01`
- `parallel/test-crypto-ecdh-convert-key.js`
- `parallel/test-crypto-encoding-validation-error.js#block_00_block_00`
- `parallel/test-crypto-encoding-validation-error.js#block_01_block_01`
- `parallel/test-crypto-encoding-validation-error.js#block_02_block_02`
- `parallel/test-crypto-encoding-validation-error.js#block_03_block_03`
- `parallel/test-crypto-gcm-explicit-short-tag.js#block_00_block_00`
- `parallel/test-crypto-gcm-explicit-short-tag.js#block_01_block_01`
- `parallel/test-crypto-gcm-explicit-short-tag.js#block_02_block_02`
- `parallel/test-crypto-gcm-implicit-short-tag.js`
- `parallel/test-crypto-getcipherinfo.js`
- `parallel/test-crypto-hash-stream-pipe.js`
- `parallel/test-crypto-hash.js#block_00_block_00`
- `parallel/test-crypto-hash.js#block_01_test_xof_hash_functions_and_the_outputlength_option`
- `parallel/test-crypto-hash.js#block_02_block_02`
- `parallel/test-crypto-hash.js#block_03_block_03`
- `parallel/test-crypto-hash.js#block_04_block_04`
- `parallel/test-crypto-hkdf.js`
- `parallel/test-crypto-hmac.js#block_00_block_00`
- `parallel/test-crypto-hmac.js#block_01_block_01`
- `parallel/test-crypto-hmac.js#block_02_check_initialized_uninitialized_state_transition_after_calli`
- `parallel/test-crypto-hmac.js#block_03_calls_to_update_omitted_intentionally`
- `parallel/test-crypto-hmac.js#block_04_block_04`
- `parallel/test-crypto-hmac.js#block_05_block_05`
- `parallel/test-crypto-hmac.js#block_06_block_06`
- `parallel/test-crypto-key-objects-messageport.js`
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
- `parallel/test-crypto-keygen-async-elliptic-curve-jwk-ec.js`
- `parallel/test-crypto-keygen-async-elliptic-curve-jwk-rsa.js`
- `parallel/test-crypto-keygen-async-elliptic-curve-jwk.js`
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
- `parallel/test-crypto-rsa-dsa.js#block_00_test_rsa_encryption_decryption`
- `parallel/test-crypto-rsa-dsa.js#block_01_ensure_compatibility_when_using_non_sha1_hash_functions`
- `parallel/test-crypto-rsa-dsa.js#block_02_block_02`
- `parallel/test-crypto-rsa-dsa.js#block_03_block_03`
- `parallel/test-crypto-rsa-dsa.js#block_04_block_04`
- `parallel/test-crypto-rsa-dsa.js#block_05_block_05`
- `parallel/test-crypto-rsa-dsa.js#block_06_block_06`
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
- `parallel/test-crypto-sign-verify.js#block_09_test_throws_exception_when_key_options_is_null`
- `parallel/test-crypto-sign-verify.js#block_10_block_10`
- `parallel/test-crypto-sign-verify.js#block_11_block_11`
- `parallel/test-crypto-sign-verify.js#block_14_block_14`
- `parallel/test-crypto-sign-verify.js#block_15_regression_test_for_https_github_com_nodejs_node_issues_4079`
- `parallel/test-crypto-sign-verify.js#block_16_block_16`
- `parallel/test-crypto-sign-verify.js#block_17_block_17`
- `parallel/test-crypto-stream.js`
- `parallel/test-crypto-subtle-zero-length.js`
- `parallel/test-crypto-update-encoding.js`
- `parallel/test-crypto-worker-thread.js`
- `parallel/test-delayed-require.js`
- `parallel/test-destroy-socket-in-lookup.js`
- `parallel/test-dgram-abort-closed.js`
- `parallel/test-dgram-address.js#block_00_block_00`
- `parallel/test-dgram-address.js#block_01_block_01`
- `parallel/test-dgram-bind-default-address.js`
- `parallel/test-dgram-bind.js`
- `parallel/test-dgram-createSocket-type.js#block_00_ensure_buffer_sizes_can_be_set`
- `parallel/test-dgram-createSocket-type.js#block_01_block_01`
- `parallel/test-dgram-deprecation-error.js`
- `parallel/test-dgram-error-message-address.js`
- `parallel/test-dgram-listen-after-bind.js`
- `parallel/test-dgram-multicast-set-interface.js#block_04_block_04`
- `parallel/test-dgram-multicast-set-interface.js#block_05_block_05`
- `parallel/test-dgram-multicast-set-interface.js#block_06_block_06`
- `parallel/test-dgram-multicast-set-interface.js#block_07_block_07`
- `parallel/test-dgram-ref.js`
- `parallel/test-dgram-send-invalid-msg-type.js`
- `parallel/test-dgram-sendto.js`
- `parallel/test-dgram-setTTL.js`
- `parallel/test-dgram-unref.js#block_01_block_01`
- `parallel/test-diagnostic-channel-http-request-created.js`
- `parallel/test-diagnostics-channel-has-subscribers.js`
- `parallel/test-diagnostics-channel-object-channel-pub-sub.js`
- `parallel/test-diagnostics-channel-pub-sub.js`
- `parallel/test-diagnostics-channel-symbol-named.js`
- `parallel/test-diagnostics-channel-sync-unsubscribe.js`
- `parallel/test-diagnostics-channel-tracing-channel-callback-early-exit.js`
- `parallel/test-diagnostics-channel-tracing-channel-callback-error.js`
- `parallel/test-diagnostics-channel-tracing-channel-callback-run-stores.js`
- `parallel/test-diagnostics-channel-tracing-channel-callback.js`
- `parallel/test-diagnostics-channel-tracing-channel-has-subscribers.js#block_00_block_00`
- `parallel/test-diagnostics-channel-tracing-channel-has-subscribers.js#block_01_block_01`
- `parallel/test-diagnostics-channel-tracing-channel-promise-early-exit.js`
- `parallel/test-diagnostics-channel-tracing-channel-promise-error.js`
- `parallel/test-diagnostics-channel-tracing-channel-promise.js`
- `parallel/test-diagnostics-channel-tracing-channel-sync-early-exit.js`
- `parallel/test-diagnostics-channel-tracing-channel-sync-error.js`
- `parallel/test-diagnostics-channel-tracing-channel-sync-run-stores.js`
- `parallel/test-diagnostics-channel-tracing-channel-sync.js`
- `parallel/test-dns-promises-exists.js`
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
- `parallel/test-domain-intercept.js#block_00_block_00`
- `parallel/test-domain-intercept.js#block_01_block_01`
- `parallel/test-domain-intercept.js#block_02_block_02`
- `parallel/test-domain-multiple-errors.js`
- `parallel/test-domain-nested-throw.js`
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
- `parallel/test-domain-top-level-error-handler-clears-stack.js`
- `parallel/test-domain-with-abort-on-uncaught-exception.js`
- `parallel/test-domexception-cause.js#block_00_block_00`
- `parallel/test-emit-after-uncaught-exception.js`
- `parallel/test-env-var-no-warnings.js`
- `parallel/test-eval-strict-referenceerror.js`
- `parallel/test-eval.js`
- `parallel/test-event-emitter-add-listeners.js#block_00_block_00`
- `parallel/test-event-emitter-add-listeners.js#block_01_just_make_sure_that_this_doesn_t_throw`
- `parallel/test-event-emitter-add-listeners.js#block_02_block_02`
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
- `parallel/test-event-emitter-remove-all-listeners.js#block_00_block_00`
- `parallel/test-event-emitter-remove-all-listeners.js#block_01_block_01`
- `parallel/test-event-emitter-remove-all-listeners.js#block_02_block_02`
- `parallel/test-event-emitter-remove-all-listeners.js#block_03_block_03`
- `parallel/test-event-emitter-remove-all-listeners.js#block_04_block_04`
- `parallel/test-event-emitter-remove-all-listeners.js#block_05_block_05`
- `parallel/test-event-emitter-remove-all-listeners.js#block_06_block_06`
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
- `parallel/test-file.js#block_00_block_00`
- `parallel/test-file.js#block_01_block_01`
- `parallel/test-file.js#block_02_block_02`
- `parallel/test-file.js#block_03_block_03`
- `parallel/test-file.js#block_04_block_04`
- `parallel/test-file.js#block_05_block_05`
- `parallel/test-file.js#block_06_block_06`
- `parallel/test-file.js#block_07_block_07`
- `parallel/test-file.js#block_08_block_08`
- `parallel/test-file.js#block_09_block_09`
- `parallel/test-file.js#block_10_block_10`
- `parallel/test-file.js#block_11_block_11`
- `parallel/test-file.js#block_12_block_12`
- `parallel/test-file.js#block_13_block_13`
- `parallel/test-file.js#block_14_block_14`
- `parallel/test-file.js#block_15_block_15`
- `parallel/test-filehandle-close.js`
- `parallel/test-finalization-registry-shutdown.js`
- `parallel/test-fs-append-file-flush.js#test_00_synchronous_version`
- `parallel/test-fs-append-file-flush.js#test_01_callback_version`
- `parallel/test-fs-append-file-flush.js#test_02_promise_based_version`
- `parallel/test-fs-append-file-sync.js`
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
- `parallel/test-fs-opendir.js#block_00_check_the_opendir_sync_version`
- `parallel/test-fs-opendir.js#block_01_check_that_passing_a_positive_integer_as_buffersize_works`
- `parallel/test-fs-opendir.js#block_02_check_read_throw_exceptions_on_invalid_callback`
- `parallel/test-fs-opendir.js#block_03_check_if_directory_already_closed_the_callback_should_pass_a`
- `parallel/test-fs-opendir.js#block_04_check_if_directory_already_closed_throw_an_promise_exception`
- `parallel/test-fs-operations-with-surrogate-pairs.js`
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
- `parallel/test-fs-promises-readfile-empty.js`
- `parallel/test-fs-promises-readfile-with-fd.js`
- `parallel/test-fs-promises-watch.js`
- `parallel/test-fs-promises-write-optional-params.js`
- `parallel/test-fs-promises-writefile-typedarray.js`
- `parallel/test-fs-promises-writefile-with-fd.js`
- `parallel/test-fs-promises.js#block_00_block_00`
- `parallel/test-fs-promises.js#block_01_block_01`
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
- `parallel/test-fs-read-stream-double-close.js#block_00_block_00`
- `parallel/test-fs-read-stream-double-close.js#block_01_block_01`
- `parallel/test-fs-read-stream-encoding.js`
- `parallel/test-fs-read-stream-err.js`
- `parallel/test-fs-read-stream-fd-leak.js`
- `parallel/test-fs-read-stream-fd.js`
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
- `parallel/test-fs-readfile-flags.js#block_00_block_00`
- `parallel/test-fs-readfile-flags.js#block_01_block_01`
- `parallel/test-fs-readfile-flags.js#block_02_block_02`
- `parallel/test-fs-readfile-pipe.js`
- `parallel/test-fs-readfile-unlink.js`
- `parallel/test-fs-readfile-zero-byte-liar.js`
- `parallel/test-fs-readlink-type-check.js`
- `parallel/test-fs-readv-promises.js`
- `parallel/test-fs-readv-promisify.js`
- `parallel/test-fs-readv-sync.js#block_00_fs_readvsync_with_array_of_buffers_with_all_parameters`
- `parallel/test-fs-readv-sync.js#block_01_fs_readvsync_with_array_of_buffers_without_position`
- `parallel/test-fs-readv-sync.js#block_02_block_02`
- `parallel/test-fs-readv-sync.js#block_03_block_03`
- `parallel/test-fs-readv.js#block_00_fs_readv_with_array_of_buffers_with_all_parameters`
- `parallel/test-fs-readv.js#block_01_fs_readv_with_array_of_buffers_without_position`
- `parallel/test-fs-readv.js#block_02_block_02`
- `parallel/test-fs-readv.js#block_03_block_03`
- `parallel/test-fs-ready-event-stream.js`
- `parallel/test-fs-realpath-buffer-encoding.js`
- `parallel/test-fs-realpath-native.js`
- `parallel/test-fs-realpath-pipe.js`
- `parallel/test-fs-realpath.js`
- `parallel/test-fs-rename-type-check.js`
- `parallel/test-fs-rmdir-recursive-sync-warns-not-found.js`
- `parallel/test-fs-rmdir-recursive-sync-warns-on-file.js`
- `parallel/test-fs-rmdir-recursive-throws-not-found.js#block_00_block_00`
- `parallel/test-fs-rmdir-recursive-throws-not-found.js#block_01_block_01`
- `parallel/test-fs-rmdir-recursive-throws-not-found.js#block_02_block_02`
- `parallel/test-fs-rmdir-recursive-throws-on-file.js#block_00_block_00`
- `parallel/test-fs-rmdir-recursive-throws-on-file.js#block_01_block_01`
- `parallel/test-fs-rmdir-recursive-throws-on-file.js#block_02_block_02`
- `parallel/test-fs-rmdir-recursive-warns-not-found.js`
- `parallel/test-fs-rmdir-recursive-warns-on-file.js`
- `parallel/test-fs-rmdir-type-check.js`
- `parallel/test-fs-stat-bigint.js#block_00_block_00`
- `parallel/test-fs-stat-bigint.js#block_01_block_01`
- `parallel/test-fs-stat-bigint.js#block_02_block_02`
- `parallel/test-fs-stat-bigint.js#block_03_block_03`
- `parallel/test-fs-stat-bigint.js#block_04_block_04`
- `parallel/test-fs-stat-bigint.js#block_05_block_05`
- `parallel/test-fs-stat-bigint.js#block_06_block_06`
- `parallel/test-fs-stat-bigint.js#block_07_block_07`
- `parallel/test-fs-stat-bigint.js#block_08_block_08`
- `parallel/test-fs-stat.js#block_00_block_00`
- `parallel/test-fs-stat.js#block_01_block_01`
- `parallel/test-fs-stat.js#block_02_block_02`
- `parallel/test-fs-statfs.js#block_00_synchronous`
- `parallel/test-fs-statfs.js#block_01_synchronous_bigint`
- `parallel/test-fs-stream-construct-compat-error-read.js`
- `parallel/test-fs-stream-construct-compat-error-write.js`
- `parallel/test-fs-stream-construct-compat-graceful-fs.js#block_00_block_00`
- `parallel/test-fs-stream-construct-compat-graceful-fs.js#block_01_block_01`
- `parallel/test-fs-stream-construct-compat-old-node.js#block_00_block_00`
- `parallel/test-fs-stream-construct-compat-old-node.js#block_01_block_01`
- `parallel/test-fs-stream-destroy-emit-error.js#block_00_block_00`
- `parallel/test-fs-stream-destroy-emit-error.js#block_01_block_01`
- `parallel/test-fs-stream-destroy-emit-error.js#block_02_block_02`
- `parallel/test-fs-stream-destroy-emit-error.js#block_03_block_03`
- `parallel/test-fs-stream-double-close.js`
- `parallel/test-fs-stream-fs-options.js#block_00_block_00`
- `parallel/test-fs-stream-fs-options.js#block_01_block_01`
- `parallel/test-fs-stream-fs-options.js#block_02_block_02`
- `parallel/test-fs-stream-options.js#block_00_block_00`
- `parallel/test-fs-stream-options.js#block_01_block_01`
- `parallel/test-fs-symlink-dir-junction-relative.js`
- `parallel/test-fs-symlink-dir-junction.js`
- `parallel/test-fs-symlink-longpath.js`
- `parallel/test-fs-timestamp-parsing-error.js`
- `parallel/test-fs-truncate-clear-file-zero.js#block_00_synchronous_test`
- `parallel/test-fs-truncate-clear-file-zero.js#block_01_asynchronous_test`
- `parallel/test-fs-truncate-fd.js`
- `parallel/test-fs-truncate-sync.js`
- `parallel/test-fs-truncate.js#block_00_block_00`
- `parallel/test-fs-truncate.js#block_01_block_01`
- `parallel/test-fs-truncate.js#block_02_block_02`
- `parallel/test-fs-truncate.js#block_03_block_03`
- `parallel/test-fs-truncate.js#block_04_block_04`
- `parallel/test-fs-truncate.js#block_05_block_05`
- `parallel/test-fs-truncate.js#block_06_block_06`
- `parallel/test-fs-truncate.js#block_07_block_07`
- `parallel/test-fs-truncate.js#block_08_block_08`
- `parallel/test-fs-truncate.js#block_09_block_09`
- `parallel/test-fs-unlink-type-check.js`
- `parallel/test-fs-utimes.js#block_00_utimes_only_error_cases`
- `parallel/test-fs-utimes.js#block_01_futimes_only_error_cases`
- `parallel/test-fs-watch-close-when-destroyed.js`
- `parallel/test-fs-watch-encoding.js#block_00_block_00`
- `parallel/test-fs-watch-encoding.js#block_01_block_01`
- `parallel/test-fs-watch-encoding.js#block_02_block_02`
- `parallel/test-fs-watch-file-enoent-after-deletion.js`
- `parallel/test-fs-watch-recursive-add-file-to-existing-subfolder.js`
- `parallel/test-fs-watch-recursive-add-file-to-new-folder.js`
- `parallel/test-fs-watch-recursive-add-file-with-url.js`
- `parallel/test-fs-watch-recursive-add-file.js`
- `parallel/test-fs-watch-recursive-add-folder.js`
- `parallel/test-fs-watch-recursive-assert-leaks.js`
- `parallel/test-fs-watch-recursive-delete.js`
- `parallel/test-fs-watch-recursive-promise.js`
- `parallel/test-fs-watch-recursive-symlink.js`
- `parallel/test-fs-watch-recursive-sync-write.js`
- `parallel/test-fs-watch-recursive-update-file.js`
- `parallel/test-fs-watch-recursive-validate.js`
- `parallel/test-fs-watch-recursive-watch-file.js`
- `parallel/test-fs-watch-ref-unref.js`
- `parallel/test-fs-watch-stop-async.js`
- `parallel/test-fs-watch-stop-sync.js`
- `parallel/test-fs-watch.js`
- `parallel/test-fs-watchfile-ref-unref.js`
- `parallel/test-fs-whatwg-url.js`
- `parallel/test-fs-write-buffer.js#block_00_fs_write_with_all_parameters_provided`
- `parallel/test-fs-write-buffer.js#block_01_fs_write_with_a_buffer_without_the_length_parameter`
- `parallel/test-fs-write-buffer.js#block_02_fs_write_with_a_buffer_without_the_offset_and_length_paramet`
- `parallel/test-fs-write-buffer.js#block_03_fs_write_with_the_offset_passed_as_undefined_followed_by_the`
- `parallel/test-fs-write-buffer.js#block_04_fs_write_with_offset_and_length_passed_as_undefined_followed`
- `parallel/test-fs-write-buffer.js#block_05_fs_write_with_a_uint8array_without_the_offset_and_length_par`
- `parallel/test-fs-write-buffer.js#block_06_fs_write_with_invalid_offset_type`
- `parallel/test-fs-write-buffer.js#block_07_fs_write_with_a_dataview_without_the_offset_and_length_param`
- `parallel/test-fs-write-file-buffer.js`
- `parallel/test-fs-write-file-flush.js#test_00_synchronous_version`
- `parallel/test-fs-write-file-flush.js#test_01_callback_version`
- `parallel/test-fs-write-file-flush.js#test_02_promise_based_version`
- `parallel/test-fs-write-file-sync.js#block_00_test_writefilesync`
- `parallel/test-fs-write-file-sync.js#block_01_test_appendfilesync`
- `parallel/test-fs-write-file-sync.js#block_02_test_writefilesync_with_file_descriptor`
- `parallel/test-fs-write-file-sync.js#block_03_test_writefilesync_with_flags`
- `parallel/test-fs-write-file-sync.js#block_04_test_writefilesync_with_no_flags`
- `parallel/test-fs-write-file-typedarrays.js`
- `parallel/test-fs-write-file.js#block_00_block_00`
- `parallel/test-fs-write-file.js#block_01_block_01`
- `parallel/test-fs-write-file.js#block_02_block_02`
- `parallel/test-fs-write-negativeoffset.js`
- `parallel/test-fs-write-no-fd.js`
- `parallel/test-fs-write-optional-params.js`
- `parallel/test-fs-write-reuse-callback.js`
- `parallel/test-fs-write-stream-autoclose-option.js`
- `parallel/test-fs-write-stream-change-open.js`
- `parallel/test-fs-write-stream-close-without-callback.js`
- `parallel/test-fs-write-stream-double-close.js#block_00_block_00`
- `parallel/test-fs-write-stream-double-close.js#block_01_block_01`
- `parallel/test-fs-write-stream-double-close.js#block_02_block_02`
- `parallel/test-fs-write-stream-encoding.js`
- `parallel/test-fs-write-stream-end.js#block_00_block_00`
- `parallel/test-fs-write-stream-end.js#block_01_block_01`
- `parallel/test-fs-write-stream-end.js#block_02_block_02`
- `parallel/test-fs-write-stream-err.js`
- `parallel/test-fs-write-stream-file-handle-2.js`
- `parallel/test-fs-write-stream-file-handle.js`
- `parallel/test-fs-write-stream-flush.js#test_00_validation`
- `parallel/test-fs-write-stream-flush.js#test_01_performs_flush`
- `parallel/test-fs-write-stream-flush.js#test_02_does_not_perform_flush`
- `parallel/test-fs-write-stream-flush.js#test_03_works_with_file_handles`
- `parallel/test-fs-write-stream-fs.js#block_00_block_00`
- `parallel/test-fs-write-stream-fs.js#block_01_block_01`
- `parallel/test-fs-write-stream-patch-open.js`
- `parallel/test-fs-write-stream-throw-type-error.js`
- `parallel/test-fs-write-stream.js#block_00_block_00`
- `parallel/test-fs-write-stream.js#block_01_block_01`
- `parallel/test-fs-write-stream.js#block_02_throws_if_data_is_not_of_type_buffer`
- `parallel/test-fs-write-sync-optional-params.js`
- `parallel/test-fs-write-sync.js`
- `parallel/test-fs-writefile-with-fd.js#block_00_block_00`
- `parallel/test-fs-writefile-with-fd.js#block_01_block_01`
- `parallel/test-fs-writefile-with-fd.js#block_03_test_with_an_abortsignal`
- `parallel/test-fs-writestream-open-write.js`
- `parallel/test-fs-writev-promises.js`
- `parallel/test-fs-writev-sync.js#block_00_fs_writevsync_with_array_of_buffers_with_all_parameters`
- `parallel/test-fs-writev-sync.js#block_01_fs_writevsync_with_array_of_buffers_without_position`
- `parallel/test-fs-writev-sync.js#block_02_fs_writevsync_with_empty_array_of_buffers`
- `parallel/test-fs-writev-sync.js#block_03_block_03`
- `parallel/test-fs-writev.js#block_00_fs_writev_with_array_of_buffers_with_all_parameters`
- `parallel/test-fs-writev.js#block_01_fs_writev_with_array_of_buffers_without_position`
- `parallel/test-fs-writev.js#block_02_fs_writev_with_empty_array_of_buffers`
- `parallel/test-fs-writev.js#block_03_block_03`
- `parallel/test-global-domexception.js`
- `parallel/test-global-encoder.js`
- `parallel/test-global-webcrypto.js`
- `parallel/test-handle-wrap-close-abort.js`
- `parallel/test-http-1.0-keep-alive.js`
- `parallel/test-http-1.0.js#block_00_block_00`
- `parallel/test-http-1.0.js#block_01_block_01`
- `parallel/test-http-1.0.js#block_02_block_02`
- `parallel/test-http-abort-before-end.js`
- `parallel/test-http-abort-stream-end.js`
- `parallel/test-http-aborted.js#block_00_block_00`
- `parallel/test-http-aborted.js#block_01_block_01`
- `parallel/test-http-addrequest-localaddress.js`
- `parallel/test-http-after-connect.js`
- `parallel/test-http-agent-error-on-idle.js`
- `parallel/test-http-agent-false.js`
- `parallel/test-http-agent-getname.js`
- `parallel/test-http-agent-maxsockets-respected.js`
- `parallel/test-http-agent-maxsockets.js`
- `parallel/test-http-agent-maxtotalsockets.js`
- `parallel/test-http-agent-no-protocol.js`
- `parallel/test-http-agent-null.js`
- `parallel/test-http-agent-remove.js`
- `parallel/test-http-agent-timeout-option.js`
- `parallel/test-http-agent-timeout.js#block_00_block_00`
- `parallel/test-http-agent-timeout.js#block_01_block_01`
- `parallel/test-http-agent-timeout.js#block_02_block_02`
- `parallel/test-http-agent-timeout.js#block_03_block_03`
- `parallel/test-http-allow-content-length-304.js`
- `parallel/test-http-allow-req-after-204-res.js`
- `parallel/test-http-bind-twice.js`
- `parallel/test-http-buffer-sanity.js`
- `parallel/test-http-byteswritten.js`
- `parallel/test-http-chunk-extensions-limit.js#block_00_verify_that_chunk_extensions_are_limited_in_size_when_sent_a`
- `parallel/test-http-chunk-extensions-limit.js#block_01_verify_that_chunk_extensions_are_limited_in_size_when_sent_i`
- `parallel/test-http-chunk-extensions-limit.js#block_02_verify_the_chunk_extensions_is_correctly_reset_after_a_chunk`
- `parallel/test-http-chunked.js`
- `parallel/test-http-client-abort-destroy.js#block_00_block_00`
- `parallel/test-http-client-abort-destroy.js#block_01_block_01`
- `parallel/test-http-client-abort-destroy.js#block_02_block_02`
- `parallel/test-http-client-abort-destroy.js#block_03_block_03`
- `parallel/test-http-client-abort-destroy.js#block_04_block_04`
- `parallel/test-http-client-abort-destroy.js#block_05_block_05`
- `parallel/test-http-client-abort-event.js`
- `parallel/test-http-client-abort-no-agent.js`
- `parallel/test-http-client-abort-response-event.js`
- `parallel/test-http-client-abort.js`
- `parallel/test-http-client-abort2.js`
- `parallel/test-http-client-abort3.js#block_00_block_00`
- `parallel/test-http-client-abort3.js#block_01_block_01`
- `parallel/test-http-client-agent-abort-close-event.js`
- `parallel/test-http-client-agent.js`
- `parallel/test-http-client-check-http-token.js`
- `parallel/test-http-client-close-event.js`
- `parallel/test-http-client-close-with-default-agent.js`
- `parallel/test-http-client-defaults.js#block_00_block_00`
- `parallel/test-http-client-defaults.js#block_01_block_01`
- `parallel/test-http-client-defaults.js#block_02_block_02`
- `parallel/test-http-client-encoding.js`
- `parallel/test-http-client-get-url.js`
- `parallel/test-http-client-headers-host-array.js`
- `parallel/test-http-client-input-function.js`
- `parallel/test-http-client-insecure-http-parser-error.js`
- `parallel/test-http-client-invalid-path.js`
- `parallel/test-http-client-keep-alive-hint.js`
- `parallel/test-http-client-race-2.js`
- `parallel/test-http-client-race.js`
- `parallel/test-http-client-read-in-error.js`
- `parallel/test-http-client-readable.js`
- `parallel/test-http-client-reject-unexpected-agent.js`
- `parallel/test-http-client-request-options.js`
- `parallel/test-http-client-res-destroyed.js#block_00_block_00`
- `parallel/test-http-client-res-destroyed.js#block_01_block_01`
- `parallel/test-http-client-set-timeout-after-end.js`
- `parallel/test-http-client-timeout-connect-listener.js`
- `parallel/test-http-client-timeout-option-with-agent.js`
- `parallel/test-http-client-unescaped-path.js`
- `parallel/test-http-client-upload-buf.js`
- `parallel/test-http-client-upload.js`
- `parallel/test-http-common.js`
- `parallel/test-http-conn-reset.js`
- `parallel/test-http-content-length-mismatch.js`
- `parallel/test-http-contentLength0.js`
- `parallel/test-http-date-header.js`
- `parallel/test-http-decoded-auth.js`
- `parallel/test-http-default-encoding.js`
- `parallel/test-http-dns-error.js`
- `parallel/test-http-dummy-characters-smuggling.js#block_00_block_00`
- `parallel/test-http-early-hints.js#block_02_block_02`
- `parallel/test-http-early-hints.js#block_05_block_05`
- `parallel/test-http-eof-on-connect.js`
- `parallel/test-http-extra-response.js`
- `parallel/test-http-flush-response-headers.js`
- `parallel/test-http-get-pipeline-problem.js`
- `parallel/test-http-head-request.js`
- `parallel/test-http-head-response-has-no-body-end-implicit-headers.js`
- `parallel/test-http-head-response-has-no-body-end.js`
- `parallel/test-http-head-response-has-no-body.js`
- `parallel/test-http-head-throw-on-response-body-write.js#block_00_block_00`
- `parallel/test-http-head-throw-on-response-body-write.js#block_01_block_01`
- `parallel/test-http-head-throw-on-response-body-write.js#block_02_block_02`
- `parallel/test-http-header-obstext.js`
- `parallel/test-http-header-owstext.js`
- `parallel/test-http-header-read.js`
- `parallel/test-http-header-validators.js`
- `parallel/test-http-hex-write.js`
- `parallel/test-http-highwatermark.js`
- `parallel/test-http-host-headers.js`
- `parallel/test-http-hostname-typechecking.js`
- `parallel/test-http-incoming-matchKnownFields.js`
- `parallel/test-http-incoming-message-connection-setter.js`
- `parallel/test-http-incoming-message-destroy.js`
- `parallel/test-http-incoming-message-options.js`
- `parallel/test-http-incoming-pipelined-socket-destroy.js`
- `parallel/test-http-insecure-parser-per-stream.js#block_00_test_1_the_server_sends_an_invalid_header`
- `parallel/test-http-insecure-parser-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-http-insecure-parser-per-stream.js#block_04_test_5_invalid_argument_type`
- `parallel/test-http-invalid-path-chars.js`
- `parallel/test-http-invalid-urls.js`
- `parallel/test-http-invalidheaderfield.js`
- `parallel/test-http-invalidheaderfield2.js`
- `parallel/test-http-keep-alive-pipeline-max-requests.js`
- `parallel/test-http-listening.js`
- `parallel/test-http-localaddress-bind-error.js`
- `parallel/test-http-malformed-request.js`
- `parallel/test-http-max-header-size-per-stream.js#block_00_test_1_the_server_sends_larger_headers_than_what_would_other`
- `parallel/test-http-max-header-size-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`
- `parallel/test-http-methods.js`
- `parallel/test-http-no-content-length.js`
- `parallel/test-http-outgoing-destroy.js`
- `parallel/test-http-outgoing-destroyed.js#block_02_block_02`
- `parallel/test-http-outgoing-end-types.js`
- `parallel/test-http-outgoing-finish-writable.js`
- `parallel/test-http-outgoing-finish.js`
- `parallel/test-http-outgoing-finished.js`
- `parallel/test-http-outgoing-internal-headernames-getter.js#block_00_block_00`
- `parallel/test-http-outgoing-internal-headernames-getter.js#block_01_block_01`
- `parallel/test-http-outgoing-internal-headernames-setter.js`
- `parallel/test-http-outgoing-message-inheritance.js`
- `parallel/test-http-outgoing-message-write-callback.js`
- `parallel/test-http-outgoing-properties.js#block_00_block_00`
- `parallel/test-http-outgoing-properties.js#block_01_block_01`
- `parallel/test-http-outgoing-properties.js#block_03_block_03`
- `parallel/test-http-outgoing-properties.js#block_04_block_04`
- `parallel/test-http-outgoing-proto.js#block_00_write`
- `parallel/test-http-outgoing-proto.js#block_01_block_01`
- `parallel/test-http-outgoing-settimeout.js#block_00_block_00`
- `parallel/test-http-outgoing-settimeout.js#block_01_block_01`
- `parallel/test-http-outgoing-writableFinished.js`
- `parallel/test-http-outgoing-write-types.js`
- `parallel/test-http-parser-bad-ref.js`
- `parallel/test-http-parser-free.js`
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
- `parallel/test-http-pause-resume-one-end.js`
- `parallel/test-http-pipe-fs.js`
- `parallel/test-http-pipeline-assertionerror-finish.js`
- `parallel/test-http-pipeline-socket-parser-typeerror.js`
- `parallel/test-http-proxy.js`
- `parallel/test-http-readable-data-event.js`
- `parallel/test-http-remove-connection-header-persists-connection.js`
- `parallel/test-http-req-res-close.js#block_02_see_https_github_com_nodejs_node_pull_33035_issuecomment_751`
- `parallel/test-http-request-arguments.js`
- `parallel/test-http-request-dont-override-options.js`
- `parallel/test-http-request-end-twice.js`
- `parallel/test-http-request-end.js`
- `parallel/test-http-request-host-header.js#block_01_block_01`
- `parallel/test-http-request-invalid-method-error.js`
- `parallel/test-http-request-join-authorization-headers.js#block_00_block_00`
- `parallel/test-http-request-join-authorization-headers.js#block_01_block_01`
- `parallel/test-http-request-join-authorization-headers.js#block_02_block_02`
- `parallel/test-http-request-large-payload.js`
- `parallel/test-http-request-method-delete-payload.js`
- `parallel/test-http-request-methods.js`
- `parallel/test-http-request-smuggling-content-length.js`
- `parallel/test-http-res-write-end-dont-take-array.js`
- `parallel/test-http-response-add-header-after-sent.js`
- `parallel/test-http-response-close.js#block_00_block_00`
- `parallel/test-http-response-close.js#block_01_block_01`
- `parallel/test-http-response-close.js#block_02_block_02`
- `parallel/test-http-response-cork.js`
- `parallel/test-http-response-readable.js`
- `parallel/test-http-response-remove-header-after-sent.js`
- `parallel/test-http-response-setheaders.js#block_00_block_00`
- `parallel/test-http-response-setheaders.js#block_01_block_01`
- `parallel/test-http-response-setheaders.js#block_02_block_02`
- `parallel/test-http-response-setheaders.js#block_03_block_03`
- `parallel/test-http-response-setheaders.js#block_04_block_04`
- `parallel/test-http-response-setheaders.js#block_05_block_05`
- `parallel/test-http-response-setheaders.js#block_06_block_06`
- `parallel/test-http-response-splitting.js`
- `parallel/test-http-response-statuscode.js`
- `parallel/test-http-response-writehead-returns-this.js`
- `parallel/test-http-server-delete-parser.js`
- `parallel/test-http-server-keep-alive-defaults.js`
- `parallel/test-http-server-keep-alive-max-requests-null.js`
- `parallel/test-http-server-keep-alive-timeout.js`
- `parallel/test-http-server-method.query.js`
- `parallel/test-http-server-multiple-client-error.js`
- `parallel/test-http-server-non-utf8-header.js#block_00_block_00`
- `parallel/test-http-server-non-utf8-header.js#block_01_block_01`
- `parallel/test-http-server-non-utf8-header.js#block_02_block_02`
- `parallel/test-http-server-reject-cr-no-lf.js`
- `parallel/test-http-server-response-standalone.js`
- `parallel/test-http-server-timeouts-validation.js#block_00_block_00`
- `parallel/test-http-server-timeouts-validation.js#block_01_block_01`
- `parallel/test-http-server-timeouts-validation.js#block_02_block_02`
- `parallel/test-http-server-timeouts-validation.js#block_03_block_03`
- `parallel/test-http-server-timeouts-validation.js#block_04_block_04`
- `parallel/test-http-server-timeouts-validation.js#block_05_block_05`
- `parallel/test-http-server-timeouts-validation.js#block_06_block_06`
- `parallel/test-http-server-unconsume-consume.js`
- `parallel/test-http-server-unconsume.js`
- `parallel/test-http-server-write-end-after-end.js`
- `parallel/test-http-set-cookies.js`
- `parallel/test-http-status-code.js`
- `parallel/test-http-status-message.js`
- `parallel/test-http-status-reason-invalid-chars.js`
- `parallel/test-http-timeout-client-warning.js`
- `parallel/test-http-timeout-overflow.js`
- `parallel/test-http-timeout.js`
- `parallel/test-http-transfer-encoding-smuggling.js#block_00_block_00`
- `parallel/test-http-transfer-encoding-smuggling.js#block_01_block_01`
- `parallel/test-http-upgrade-server.js`
- `parallel/test-http-url.parse-auth-with-header-in-request.js`
- `parallel/test-http-url.parse-auth.js`
- `parallel/test-http-url.parse-basic.js`
- `parallel/test-http-url.parse-only-support-http-https-protocol.js`
- `parallel/test-http-url.parse-path.js`
- `parallel/test-http-url.parse-post.js`
- `parallel/test-http-url.parse-search.js`
- `parallel/test-http-write-empty-string.js`
- `parallel/test-http-write-head-2.js#block_00_block_00`
- `parallel/test-http-write-head-2.js#block_01_block_01`
- `parallel/test-http-write-head-2.js#block_02_block_02`
- `parallel/test-http-write-head-2.js#block_03_block_03`
- `parallel/test-http-zero-length-write.js`
- `parallel/test-http-zerolengthbuffer.js`
- `parallel/test-http2-client-upload-reject.js`
- `parallel/test-http2-client-upload.js`
- `parallel/test-http2-request-response-proto.js`
- `parallel/test-inspector-stops-no-file.js`
- `parallel/test-instanceof.js`
- `parallel/test-kill-segfault-freebsd.js`
- `parallel/test-memory-usage.js`
- `parallel/test-messagechannel.js`
- `parallel/test-microtask-queue-integration.js`
- `parallel/test-module-builtin.js`
- `parallel/test-module-cache.js`
- `parallel/test-module-children.js`
- `parallel/test-module-circular-dependency-warning.js`
- `parallel/test-module-create-require-multibyte.js#block_00_block_00`
- `parallel/test-module-create-require-multibyte.js#block_01_block_01`
- `parallel/test-module-create-require.js`
- `parallel/test-module-globalpaths-nodepath.js`
- `parallel/test-module-isBuiltin.js`
- `parallel/test-module-loading-deprecated.js`
- `parallel/test-module-loading-error.js`
- `parallel/test-module-main-fail.js`
- `parallel/test-module-main-preserve-symlinks-fail.js`
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
- `parallel/test-module-setsourcemapssupport.js#block_00_block_00`
- `parallel/test-module-setsourcemapssupport.js#block_01_block_01`
- `parallel/test-module-stat.js`
- `parallel/test-module-symlinked-peer-modules.js`
- `parallel/test-module-version.js`
- `parallel/test-module-wrap.js`
- `parallel/test-net-access-byteswritten.js`
- `parallel/test-net-after-close.js`
- `parallel/test-net-allow-half-open.js#block_00_block_00`
- `parallel/test-net-allow-half-open.js#block_01_block_01`
- `parallel/test-net-autoselectfamily-attempt-timeout-cli-option.js`
- `parallel/test-net-autoselectfamily-attempt-timeout-default-value.js`
- `parallel/test-net-autoselectfamily-commandline-option.js`
- `parallel/test-net-autoselectfamily-default.js#block_00_test_that_ipv4_is_reached_by_default_if_ipv6_is_not_reachabl`
- `parallel/test-net-autoselectfamily-default.js#block_01_test_that_ipv4_is_not_reached_by_default_if_ipv6_is_not_reac`
- `parallel/test-net-autoselectfamily-ipv4first.js`
- `parallel/test-net-autoselectfamily.js#block_00_test_that_ipv4_is_reached_if_ipv6_is_not_reachable`
- `parallel/test-net-autoselectfamily.js#block_02_test_that_when_all_errors_are_returned_when_no_connections_s`
- `parallel/test-net-autoselectfamily.js#block_03_test_that_the_option_can_be_disabled`
- `parallel/test-net-better-error-messages-listen-path.js`
- `parallel/test-net-better-error-messages-listen.js`
- `parallel/test-net-better-error-messages-path.js#block_00_block_00`
- `parallel/test-net-better-error-messages-path.js#block_01_block_01`
- `parallel/test-net-better-error-messages-port-hostname.js`
- `parallel/test-net-binary.js`
- `parallel/test-net-bind-twice.js`
- `parallel/test-net-blocklist.js#block_00_connect_without_calling_dns_lookup`
- `parallel/test-net-blocklist.js#block_01_connect_with_single_ip_returned_by_dns_lookup`
- `parallel/test-net-blocklist.js#block_02_connect_with_autoselectfamily_and_single_ip`
- `parallel/test-net-buffersize.js`
- `parallel/test-net-bytes-read.js`
- `parallel/test-net-bytes-stats.js`
- `parallel/test-net-can-reset-timeout.js`
- `parallel/test-net-client-bind-twice.js`
- `parallel/test-net-connect-abort-controller.js`
- `parallel/test-net-connect-after-destroy.js`
- `parallel/test-net-connect-buffer.js`
- `parallel/test-net-connect-buffer2.js`
- `parallel/test-net-connect-call-socket-connect.js`
- `parallel/test-net-connect-destroy.js`
- `parallel/test-net-connect-immediate-destroy.js`
- `parallel/test-net-connect-immediate-finish.js`
- `parallel/test-net-connect-keepalive.js`
- `parallel/test-net-connect-no-arg.js`
- `parallel/test-net-connect-options-allowhalfopen.js`
- `parallel/test-net-connect-options-invalid.js`
- `parallel/test-net-connect-options-path.js`
- `parallel/test-net-connect-reset-after-destroy.js`
- `parallel/test-net-connect-reset-before-connected.js`
- `parallel/test-net-connect-reset-until-connected.js`
- `parallel/test-net-deprecated-setsimultaneousaccepts.js`
- `parallel/test-net-dns-custom-lookup.js`
- `parallel/test-net-dns-error.js`
- `parallel/test-net-dns-lookup-skip.js`
- `parallel/test-net-dns-lookup.js`
- `parallel/test-net-end-destroyed.js`
- `parallel/test-net-end-without-connect.js`
- `parallel/test-net-isip.js`
- `parallel/test-net-isipv4.js`
- `parallel/test-net-isipv6.js`
- `parallel/test-net-keepalive.js`
- `parallel/test-net-large-string.js`
- `parallel/test-net-listen-close-server-callback-is-not-function.js`
- `parallel/test-net-listen-close-server.js`
- `parallel/test-net-listen-error.js`
- `parallel/test-net-listen-invalid-port.js`
- `parallel/test-net-listening.js`
- `parallel/test-net-local-address-port.js`
- `parallel/test-net-options-lookup.js`
- `parallel/test-net-pause-resume-connecting.js`
- `parallel/test-net-persistent-keepalive.js`
- `parallel/test-net-pipe-connect-errors.js`
- `parallel/test-net-remote-address-port.js`
- `parallel/test-net-remote-address.js`
- `parallel/test-net-server-call-listen-multiple-times.js#block_00_first_test_check_that_after_error_event_you_can_listen_right`
- `parallel/test-net-server-call-listen-multiple-times.js#block_01_second_test_check_that_second_listen_call_throws_an_error`
- `parallel/test-net-server-call-listen-multiple-times.js#block_02_check_that_after_the_close_call_you_can_run_listen_method_ju`
- `parallel/test-net-server-close.js`
- `parallel/test-net-server-listen-options.js#block_00_block_00`
- `parallel/test-net-server-listen-path.js#block_00_test_listen_path`
- `parallel/test-net-server-listen-path.js#block_01_test_listen_path`
- `parallel/test-net-server-listen-path.js#block_02_test_listen_path_cb`
- `parallel/test-net-server-listen-path.js#block_03_test_listen_path_cb`
- `parallel/test-net-server-listen-path.js#block_04_test_pipe_chmod`
- `parallel/test-net-server-listen-path.js#block_05_test_should_emit_error_events_when_listening_fails`
- `parallel/test-net-server-listen-remove-callback.js`
- `parallel/test-net-server-max-connections.js`
- `parallel/test-net-server-options.js`
- `parallel/test-net-server-pause-on-connect.js`
- `parallel/test-net-server-simultaneous-accepts-produce-warning-once.js`
- `parallel/test-net-server-try-ports.js`
- `parallel/test-net-settimeout.js`
- `parallel/test-net-socket-byteswritten.js`
- `parallel/test-net-socket-close-after-end.js`
- `parallel/test-net-socket-connect-invalid-autoselectfamily.js`
- `parallel/test-net-socket-connect-invalid-autoselectfamilyattempttimeout.js`
- `parallel/test-net-socket-connect-without-cb.js`
- `parallel/test-net-socket-connecting.js`
- `parallel/test-net-socket-destroy-send.js`
- `parallel/test-net-socket-destroy-twice.js`
- `parallel/test-net-socket-end-before-connect.js`
- `parallel/test-net-socket-end-callback.js`
- `parallel/test-net-socket-local-address.js`
- `parallel/test-net-socket-no-halfopen-enforcer.js`
- `parallel/test-net-socket-reset-send.js`
- `parallel/test-net-socket-reset-twice.js`
- `parallel/test-net-socket-timeout-unref.js`
- `parallel/test-net-socket-timeout.js`
- `parallel/test-net-socket-write-after-close.js#block_00_block_00`
- `parallel/test-net-socket-write-after-close.js#block_01_block_01`
- `parallel/test-net-socket-write-error.js`
- `parallel/test-net-stream.js`
- `parallel/test-net-sync-cork.js`
- `parallel/test-net-throttle.js`
- `parallel/test-net-timeout-no-handle.js`
- `parallel/test-net-writable.js`
- `parallel/test-net-write-after-close.js`
- `parallel/test-net-write-after-end-nt.js`
- `parallel/test-net-write-arguments.js`
- `parallel/test-net-write-cb-on-destroy-before-connect.js`
- `parallel/test-net-write-connect-write.js`
- `parallel/test-next-tick-doesnt-hang.js`
- `parallel/test-next-tick-domain.js`
- `parallel/test-next-tick-fixed-queue-regression.js`
- `parallel/test-next-tick-intentional-starvation.js`
- `parallel/test-next-tick-ordering.js`
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
- `parallel/test-pipe-address.js`
- `parallel/test-pipe-outgoing-message-data-emitted-after-ended.js`
- `parallel/test-pipe-return-val.js`
- `parallel/test-pipe-stream.js`
- `parallel/test-process-abort.js`
- `parallel/test-process-argv-0.js`
- `parallel/test-process-available-memory.js`
- `parallel/test-process-chdir.js`
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
- `parallel/test-process-env-windows-error-reset.js#block_00_block_00`
- `parallel/test-process-env-windows-error-reset.js#block_01_block_01`
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
- `parallel/test-process-release.js`
- `parallel/test-process-remove-all-signal-listeners.js`
- `parallel/test-process-setgroups.js`
- `parallel/test-process-setsourcemapsenabled.js`
- `parallel/test-process-umask-mask.js`
- `parallel/test-process-umask.js`
- `parallel/test-process-uptime.js`
- `parallel/test-process-warning.js`
- `parallel/test-promise-unhandled-issue-43655.js`
- `parallel/test-querystring-escape.js`
- `parallel/test-querystring-maxKeys-non-finite.js`
- `parallel/test-querystring-multichar-separator.js`
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
- `parallel/test-repl-syntax-error-handling.js`
- `parallel/test-require-cache.js#block_00_block_00`
- `parallel/test-require-cache.js#block_01_block_01`
- `parallel/test-require-empty-main.js`
- `parallel/test-require-enoent-dir.js`
- `parallel/test-require-invalid-main-no-exports.js`
- `parallel/test-require-invalid-package.js`
- `parallel/test-require-node-prefix.js#block_00_all_kinds_of_specifiers_should_work_without_issue`
- `parallel/test-require-node-prefix.js#block_01_node_prefixed_require_calls_bypass_the_require_cache`
- `parallel/test-require-nul.js`
- `parallel/test-require-process.js`
- `parallel/test-require-resolve-opts-paths-relative.js#block_00_parent_directory_paths_work_as_intended`
- `parallel/test-require-resolve-opts-paths-relative.js#block_01_current_directory_paths_work_as_intended`
- `parallel/test-require-resolve-opts-paths-relative.js#block_02_sub_directory_paths_work_as_intended`
- `parallel/test-runner-aliases.js`
- `parallel/test-runner-assert.js#test_00_expected_methods_are_on_t_assert`
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
- `parallel/test-runner-custom-assertions.js#test_02_invokes_a_custom_assertion_as_part_of_the_test_plan`
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
- `parallel/test-runner-mocking.js#test_14_given_null_to_a_mock_method_it_throws_a_invalid_argument_err`
- `parallel/test-runner-mocking.js#test_15_it_should_throw_given_an_inexistent_property_on_a_object_ins`
- `parallel/test-runner-mocking.js#test_16_spy_functions_can_be_used_on_classes_inheritance`
- `parallel/test-runner-mocking.js#test_17_spy_functions_don_t_affect_the_prototype_chain`
- `parallel/test-runner-mocking.js#test_18_mocked_functions_report_thrown_errors`
- `parallel/test-runner-mocking.js#test_19_mocked_constructors_report_thrown_errors`
- `parallel/test-runner-mocking.js#test_20_mocks_a_function`
- `parallel/test-runner-mocking.js#test_22_mocks_an_object_method`
- `parallel/test-runner-mocking.js#test_23_mocks_a_getter`
- `parallel/test-runner-mocking.js#test_24_mocks_a_setter`
- `parallel/test-runner-mocking.js#test_25_mocks_a_getter_with_syntax_sugar`
- `parallel/test-runner-mocking.js#test_26_mocks_a_setter_with_syntax_sugar`
- `parallel/test-runner-mocking.js#test_27_mocked_functions_match_name_and_length`
- `parallel/test-runner-mocking.js#test_28_method_fails_if_method_cannot_be_redefined`
- `parallel/test-runner-mocking.js#test_29_method_fails_if_field_is_a_property_instead_of_a_method`
- `parallel/test-runner-mocking.js#test_30_mocks_can_be_auto_restored`
- `parallel/test-runner-mocking.js#test_31_mock_implementation_can_be_changed_dynamically`
- `parallel/test-runner-mocking.js#test_32_local_mocks_are_auto_restored_after_the_test_finishes`
- `parallel/test-runner-mocking.js#test_33_reset_mock_calls`
- `parallel/test-runner-mocking.js#test_34_uses_top_level_mock`
- `parallel/test-runner-mocking.js#test_35_the_getter_and_setter_options_cannot_be_used_together`
- `parallel/test-runner-mocking.js#test_36_method_names_must_be_strings_or_symbols`
- `parallel/test-runner-mocking.js#test_37_the_times_option_must_be_an_integer_1`
- `parallel/test-runner-mocking.js#test_38_spies_on_a_class_prototype_method`
- `parallel/test-runner-mocking.js#test_39_getter_fails_if_getter_options_set_to_false`
- `parallel/test-runner-mocking.js#test_40_setter_fails_if_setter_options_set_to_false`
- `parallel/test-runner-mocking.js#test_41_getter_fails_if_setter_options_is_true`
- `parallel/test-runner-mocking.js#test_42_setter_fails_if_getter_options_is_true`
- `parallel/test-runner-module-mocking.js#test_00_input_validation`
- `parallel/test-runner-module-mocking.js#test_01_core_module_mocking_with_namedexports_option`
- `parallel/test-runner-module-mocking.js#test_02_cjs_mocking_with_namedexports_option`
- `parallel/test-runner-module-mocking.js#test_03_esm_mocking_with_namedexports_option`
- `parallel/test-runner-module-mocking.js#test_04_modules_cannot_be_mocked_multiple_times_at_once`
- `parallel/test-runner-module-mocking.js#test_05_mocks_are_automatically_restored`
- `parallel/test-runner-module-mocking.js#test_06_mocks_can_be_restored_independently`
- `parallel/test-runner-module-mocking.js#test_07_core_module_mocks_can_be_used_by_both_module_systems`
- `parallel/test-runner-module-mocking.js#test_08_node_core_module_mocks_can_be_used_by_both_module_systems`
- `parallel/test-runner-module-mocking.js#test_09_cjs_mocks_can_be_used_by_both_module_systems`
- `parallel/test-runner-module-mocking.js#test_10_relative_paths_can_be_used_by_both_module_systems`
- `parallel/test-runner-module-mocking.js#test_12_file_imports_are_supported_in_esm_only`
- `parallel/test-runner-module-mocking.js#test_13_mocked_modules_do_not_impact_unmocked_modules`
- `parallel/test-runner-module-mocking.js#test_14_defaultexports_work_with_cjs_mocks_in_both_module_systems`
- `parallel/test-runner-module-mocking.js#test_15_defaultexports_work_with_esm_mocks_in_both_module_systems`
- `parallel/test-runner-option-validation.js`
- `parallel/test-runner-source-maps-invalid-json.js`
- `parallel/test-runner-subtest-after-hook.js`
- `parallel/test-runner-test-filepath.js#test_00_suite`
- `parallel/test-runner-test-filepath.js#test_01_test_01`
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
- `parallel/test-socket-write-after-fin-error.js`
- `parallel/test-socket-write-after-fin.js`
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
- `parallel/test-stdin-child-proc.js`
- `parallel/test-stdin-from-file.js`
- `parallel/test-stdin-hang.js`
- `parallel/test-stdin-pause-resume-sync.js`
- `parallel/test-stdin-pause-resume.js`
- `parallel/test-stdin-resume-pause.js`
- `parallel/test-stdin-script-child.js`
- `parallel/test-stdio-closed.js`
- `parallel/test-stdio-pipe-access.js`
- `parallel/test-stdio-pipe-redirect.js`
- `parallel/test-stdio-pipe-stderr.js`
- `parallel/test-stdout-cannot-be-closed-child-process-pipe.js`
- `parallel/test-stdout-stderr-reading.js`
- `parallel/test-stdout-stderr-write.js`
- `parallel/test-stream-aliases-legacy.js`
- `parallel/test-stream-auto-destroy.js#block_00_block_00`
- `parallel/test-stream-auto-destroy.js#block_01_block_01`
- `parallel/test-stream-auto-destroy.js#block_02_block_02`
- `parallel/test-stream-auto-destroy.js#block_03_block_03`
- `parallel/test-stream-auto-destroy.js#block_04_block_04`
- `parallel/test-stream-await-drain-writers-in-synchronously-recursion-write.js`
- `parallel/test-stream-backpressure.js`
- `parallel/test-stream-base-typechecking.js`
- `parallel/test-stream-big-packet.js`
- `parallel/test-stream-big-push.js`
- `parallel/test-stream-catch-rejections.js#block_00_block_00`
- `parallel/test-stream-catch-rejections.js#block_01_block_01`
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
- `parallel/test-stream-destroy.js#block_04_block_04`
- `parallel/test-stream-destroy.js#block_05_block_05`
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
- `parallel/test-stream-duplex-destroy.js#block_14_block_14`
- `parallel/test-stream-duplex-destroy.js#block_15_block_15`
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
- `parallel/test-stream-duplex-props.js#block_00_block_00`
- `parallel/test-stream-duplex-props.js#block_01_block_01`
- `parallel/test-stream-duplex-readable-end.js`
- `parallel/test-stream-duplex-readable-writable.js#block_00_block_00`
- `parallel/test-stream-duplex-readable-writable.js#block_01_block_01`
- `parallel/test-stream-duplex-writable-finished.js#block_00_basic`
- `parallel/test-stream-duplex-writable-finished.js#block_01_event`
- `parallel/test-stream-duplex.js#block_00_duplex_fromweb`
- `parallel/test-stream-duplex.js#block_01_duplex_fromweb_using_utf8_and_objectmode`
- `parallel/test-stream-duplex.js#block_02_duplex_toweb`
- `parallel/test-stream-duplexpair.js#block_00_block_00`
- `parallel/test-stream-duplexpair.js#block_01_block_01`
- `parallel/test-stream-duplexpair.js#block_02_block_02`
- `parallel/test-stream-duplexpair.js#block_03_block_03`
- `parallel/test-stream-duplexpair.js#block_04_because_a_zero_size_push_doesn_t_trigger_a_read`
- `parallel/test-stream-end-of-streams.js`
- `parallel/test-stream-end-paused.js`
- `parallel/test-stream-error-once.js#block_00_block_00`
- `parallel/test-stream-error-once.js#block_01_block_01`
- `parallel/test-stream-event-names.js#block_00_block_00`
- `parallel/test-stream-event-names.js#block_01_block_01`
- `parallel/test-stream-event-names.js#block_02_block_02`
- `parallel/test-stream-event-names.js#block_03_block_03`
- `parallel/test-stream-event-names.js#block_04_block_04`
- `parallel/test-stream-event-names.js#block_05_block_05`
- `parallel/test-stream-events-prepend.js`
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
- `parallel/test-stream-finished.js#block_33_block_33`
- `parallel/test-stream-finished.js#block_35_block_35`
- `parallel/test-stream-finished.js#block_36_block_36`
- `parallel/test-stream-finished.js#block_37_block_37`
- `parallel/test-stream-finished.js#block_38_block_38`
- `parallel/test-stream-finished.js#block_39_block_39`
- `parallel/test-stream-finished.js#block_40_block_40`
- `parallel/test-stream-flatMap.js#block_00_block_00`
- `parallel/test-stream-flatMap.js#block_01_block_01`
- `parallel/test-stream-flatMap.js#block_02_block_02`
- `parallel/test-stream-flatMap.js#block_03_block_03`
- `parallel/test-stream-flatMap.js#block_04_block_04`
- `parallel/test-stream-flatMap.js#block_05_block_05`
- `parallel/test-stream-flatMap.js#block_06_block_06`
- `parallel/test-stream-flatMap.js#block_07_block_07`
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
- `parallel/test-stream-objectmode-undefined.js#block_00_block_00`
- `parallel/test-stream-objectmode-undefined.js#block_01_block_01`
- `parallel/test-stream-objectmode-undefined.js#block_02_block_02`
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
- `parallel/test-stream-pipe-error-handling.js#block_00_block_00`
- `parallel/test-stream-pipe-error-handling.js#block_01_block_01`
- `parallel/test-stream-pipe-error-handling.js#block_02_block_02`
- `parallel/test-stream-pipe-error-handling.js#block_03_block_03`
- `parallel/test-stream-pipe-error-handling.js#block_04_block_04`
- `parallel/test-stream-pipe-error-unhandled.js`
- `parallel/test-stream-pipe-event.js`
- `parallel/test-stream-pipe-flow-after-unpipe.js`
- `parallel/test-stream-pipe-flow.js#block_00_block_00`
- `parallel/test-stream-pipe-flow.js#block_01_block_01`
- `parallel/test-stream-pipe-flow.js#block_02_block_02`
- `parallel/test-stream-pipe-manual-resume.js`
- `parallel/test-stream-pipe-multiple-pipes.js`
- `parallel/test-stream-pipe-needDrain.js`
- `parallel/test-stream-pipe-same-destination-twice.js#block_00_block_00`
- `parallel/test-stream-pipe-same-destination-twice.js#block_01_block_01`
- `parallel/test-stream-pipe-same-destination-twice.js#block_02_block_02`
- `parallel/test-stream-pipe-unpipe-streams.js#block_00_block_00`
- `parallel/test-stream-pipe-unpipe-streams.js#block_01_block_01`
- `parallel/test-stream-pipeline-async-iterator.js`
- `parallel/test-stream-pipeline-duplex.js`
- `parallel/test-stream-pipeline-queued-end-in-destroy.js`
- `parallel/test-stream-pipeline-uncaught.js`
- `parallel/test-stream-pipeline-with-empty-string.js`
- `parallel/test-stream-pipeline.js#block_00_block_00`
- `parallel/test-stream-pipeline.js#block_01_block_01`
- `parallel/test-stream-pipeline.js#block_02_block_02`
- `parallel/test-stream-pipeline.js#block_03_block_03`
- `parallel/test-stream-pipeline.js#block_04_block_04`
- `parallel/test-stream-pipeline.js#block_05_block_05`
- `parallel/test-stream-pipeline.js#block_06_block_06`
- `parallel/test-stream-pipeline.js#block_07_block_07`
- `parallel/test-stream-pipeline.js#block_10_block_10`
- `parallel/test-stream-pipeline.js#block_11_block_11`
- `parallel/test-stream-pipeline.js#block_12_block_12`
- `parallel/test-stream-pipeline.js#block_13_block_13`
- `parallel/test-stream-pipeline.js#block_14_block_14`
- `parallel/test-stream-pipeline.js#block_15_block_15`
- `parallel/test-stream-pipeline.js#block_16_block_16`
- `parallel/test-stream-pipeline.js#block_17_block_17`
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
- `parallel/test-stream-pipeline.js#block_45_block_45`
- `parallel/test-stream-pipeline.js#block_46_block_46`
- `parallel/test-stream-pipeline.js#block_47_block_47`
- `parallel/test-stream-pipeline.js#block_48_block_48`
- `parallel/test-stream-pipeline.js#block_49_block_49`
- `parallel/test-stream-pipeline.js#block_50_block_50`
- `parallel/test-stream-pipeline.js#block_51_block_51`
- `parallel/test-stream-pipeline.js#block_52_block_52`
- `parallel/test-stream-pipeline.js#block_53_block_53`
- `parallel/test-stream-pipeline.js#block_54_block_54`
- `parallel/test-stream-pipeline.js#block_55_block_55`
- `parallel/test-stream-pipeline.js#block_56_block_56`
- `parallel/test-stream-pipeline.js#block_57_block_57`
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
- `parallel/test-stream-pipeline.js#block_76_block_76`
- `parallel/test-stream-pipeline.js#block_77_block_77`
- `parallel/test-stream-pipeline.js#block_78_block_78`
- `parallel/test-stream-pipeline.js#block_79_block_79`
- `parallel/test-stream-preprocess.js`
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
- `parallel/test-stream-readable-aborted.js#block_00_block_00`
- `parallel/test-stream-readable-aborted.js#block_01_block_01`
- `parallel/test-stream-readable-aborted.js#block_02_block_02`
- `parallel/test-stream-readable-aborted.js#block_03_block_03`
- `parallel/test-stream-readable-aborted.js#block_04_block_04`
- `parallel/test-stream-readable-add-chunk-during-data.js`
- `parallel/test-stream-readable-constructor-set-methods.js`
- `parallel/test-stream-readable-data.js`
- `parallel/test-stream-readable-default-encoding.js#block_00_block_00`
- `parallel/test-stream-readable-default-encoding.js#block_01_block_01`
- `parallel/test-stream-readable-default-encoding.js#block_02_block_02`
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
- `parallel/test-stream-readable-didRead.js#block_00_block_00`
- `parallel/test-stream-readable-didRead.js#block_01_block_01`
- `parallel/test-stream-readable-didRead.js#block_02_block_02`
- `parallel/test-stream-readable-didRead.js#block_03_block_03`
- `parallel/test-stream-readable-didRead.js#block_04_block_04`
- `parallel/test-stream-readable-didRead.js#block_05_block_05`
- `parallel/test-stream-readable-dispose.js`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_00_block_00`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_01_block_01`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_02_block_02`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_03_block_03`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_04_block_04`
- `parallel/test-stream-readable-emit-readable-short-stream.js#block_05_block_05`
- `parallel/test-stream-readable-emittedReadable.js`
- `parallel/test-stream-readable-end-destroyed.js`
- `parallel/test-stream-readable-ended.js#block_00_basic`
- `parallel/test-stream-readable-ended.js#block_01_event`
- `parallel/test-stream-readable-ended.js#block_02_verifies_no_error_triggered_on_multiple_push_null_invocation`
- `parallel/test-stream-readable-error-end.js`
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
- `parallel/test-stream-readable-no-unneeded-readable.js#block_00_block_00`
- `parallel/test-stream-readable-no-unneeded-readable.js#block_01_block_01`
- `parallel/test-stream-readable-object-multi-push-async.js#block_00_block_00`
- `parallel/test-stream-readable-object-multi-push-async.js#block_01_block_01`
- `parallel/test-stream-readable-object-multi-push-async.js#block_02_block_02`
- `parallel/test-stream-readable-object-multi-push-async.js#block_03_block_03`
- `parallel/test-stream-readable-object-multi-push-async.js#block_04_block_04`
- `parallel/test-stream-readable-pause-and-resume.js#block_00_block_00`
- `parallel/test-stream-readable-pause-and-resume.js#block_01_block_01`
- `parallel/test-stream-readable-readable-then-resume.js`
- `parallel/test-stream-readable-readable.js#block_00_block_00`
- `parallel/test-stream-readable-readable.js#block_01_block_01`
- `parallel/test-stream-readable-readable.js#block_02_block_02`
- `parallel/test-stream-readable-reading-readingMore.js#block_00_block_00`
- `parallel/test-stream-readable-reading-readingMore.js#block_01_block_01`
- `parallel/test-stream-readable-reading-readingMore.js#block_02_block_02`
- `parallel/test-stream-readable-resume-hwm.js`
- `parallel/test-stream-readable-resumeScheduled.js#block_00_block_00`
- `parallel/test-stream-readable-resumeScheduled.js#block_01_block_01`
- `parallel/test-stream-readable-resumeScheduled.js#block_02_block_02`
- `parallel/test-stream-readable-setEncoding-existing-buffers.js#block_00_block_00`
- `parallel/test-stream-readable-setEncoding-existing-buffers.js#block_01_block_01`
- `parallel/test-stream-readable-setEncoding-existing-buffers.js#block_02_block_02`
- `parallel/test-stream-readable-setEncoding-null.js`
- `parallel/test-stream-readable-strategy-option.js#block_00_block_00`
- `parallel/test-stream-readable-strategy-option.js#block_01_block_01`
- `parallel/test-stream-readable-strategy-option.js#block_02_block_02`
- `parallel/test-stream-readable-to-web-termination.js`
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
- `parallel/test-stream-toArray.js#block_00_block_00`
- `parallel/test-stream-toArray.js#block_01_block_01`
- `parallel/test-stream-toArray.js#block_02_block_02`
- `parallel/test-stream-toArray.js#block_03_block_03`
- `parallel/test-stream-toArray.js#block_04_block_04`
- `parallel/test-stream-toArray.js#block_05_block_05`
- `parallel/test-stream-toWeb-allows-server-response.js`
- `parallel/test-stream-transform-callback-twice.js`
- `parallel/test-stream-transform-constructor-set-methods.js`
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
- `parallel/test-stream-transform-split-highwatermark.js#block_00_test_nan`
- `parallel/test-stream-transform-split-highwatermark.js#block_01_test_non_duplex_streams_ignore_the_options`
- `parallel/test-stream-transform-split-objectmode.js`
- `parallel/test-stream-typedarray.js#block_00_block_00`
- `parallel/test-stream-typedarray.js#block_01_block_01`
- `parallel/test-stream-typedarray.js#block_02_block_02`
- `parallel/test-stream-typedarray.js#block_03_block_03`
- `parallel/test-stream-typedarray.js#block_04_block_04`
- `parallel/test-stream-uint8array.js#block_00_block_00`
- `parallel/test-stream-uint8array.js#block_01_block_01`
- `parallel/test-stream-uint8array.js#block_02_block_02`
- `parallel/test-stream-uint8array.js#block_03_block_03`
- `parallel/test-stream-uint8array.js#block_04_block_04`
- `parallel/test-stream-unpipe-event.js#block_00_block_00`
- `parallel/test-stream-unpipe-event.js#block_01_block_01`
- `parallel/test-stream-unpipe-event.js#block_02_block_02`
- `parallel/test-stream-unpipe-event.js#block_03_block_03`
- `parallel/test-stream-unpipe-event.js#block_04_block_04`
- `parallel/test-stream-unpipe-event.js#block_05_block_05`
- `parallel/test-stream-unshift-empty-chunk.js`
- `parallel/test-stream-unshift-read-race.js`
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
- `parallel/test-stream-writable-destroy.js#block_19_block_19`
- `parallel/test-stream-writable-destroy.js#block_20_block_20`
- `parallel/test-stream-writable-destroy.js#block_21_block_21`
- `parallel/test-stream-writable-destroy.js#block_22_block_22`
- `parallel/test-stream-writable-destroy.js#block_23_block_23`
- `parallel/test-stream-writable-destroy.js#block_24_block_24`
- `parallel/test-stream-writable-destroy.js#block_25_block_25`
- `parallel/test-stream-writable-destroy.js#block_26_block_26`
- `parallel/test-stream-writable-destroy.js#block_27_block_27`
- `parallel/test-stream-writable-end-cb-error.js#block_00_block_00`
- `parallel/test-stream-writable-end-cb-error.js#block_01_block_01`
- `parallel/test-stream-writable-end-cb-error.js#block_02_block_02`
- `parallel/test-stream-writable-end-cb-uncaught.js`
- `parallel/test-stream-writable-end-multiple.js`
- `parallel/test-stream-writable-ended-state.js`
- `parallel/test-stream-writable-final-async.js`
- `parallel/test-stream-writable-final-destroy.js`
- `parallel/test-stream-writable-final-throw.js`
- `parallel/test-stream-writable-finish-destroyed.js#block_00_block_00`
- `parallel/test-stream-writable-finish-destroyed.js#block_01_block_01`
- `parallel/test-stream-writable-finish-destroyed.js#block_02_block_02`
- `parallel/test-stream-writable-finished-state.js`
- `parallel/test-stream-writable-finished.js#block_00_basic`
- `parallel/test-stream-writable-finished.js#block_01_event`
- `parallel/test-stream-writable-finished.js#block_02_block_02`
- `parallel/test-stream-writable-finished.js#block_03_block_03`
- `parallel/test-stream-writable-finished.js#block_04_block_04`
- `parallel/test-stream-writable-finished.js#block_05_block_05`
- `parallel/test-stream-writable-invalid-chunk.js`
- `parallel/test-stream-writable-needdrain-state.js`
- `parallel/test-stream-writable-null.js#block_00_block_00`
- `parallel/test-stream-writable-null.js#block_01_block_01`
- `parallel/test-stream-writable-null.js#block_02_block_02`
- `parallel/test-stream-writable-null.js#block_03_block_03`
- `parallel/test-stream-writable-properties.js`
- `parallel/test-stream-writable-writable.js#block_00_block_00`
- `parallel/test-stream-writable-writable.js#block_01_block_01`
- `parallel/test-stream-writable-writable.js#block_02_block_02`
- `parallel/test-stream-writable-writable.js#block_03_block_03`
- `parallel/test-stream-writable-write-cb-error.js#block_00_block_00`
- `parallel/test-stream-writable-write-cb-error.js#block_01_block_01`
- `parallel/test-stream-writable-write-cb-error.js#block_02_block_02`
- `parallel/test-stream-writable-write-cb-twice.js#block_00_block_00`
- `parallel/test-stream-writable-write-cb-twice.js#block_01_block_01`
- `parallel/test-stream-writable-write-cb-twice.js#block_02_block_02`
- `parallel/test-stream-writable-write-error.js`
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
- `parallel/test-stream2-compatibility.js`
- `parallel/test-stream2-decode-partial.js`
- `parallel/test-stream2-finish-pipe-error.js`
- `parallel/test-stream2-finish-pipe.js`
- `parallel/test-stream2-large-read-stall.js`
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
- `parallel/test-stream2-pipe-error-handling.js#block_00_block_00`
- `parallel/test-stream2-pipe-error-handling.js#block_01_block_01`
- `parallel/test-stream2-pipe-error-once-listener.js`
- `parallel/test-stream2-push.js`
- `parallel/test-stream2-read-sync-stack.js`
- `parallel/test-stream2-readable-empty-buffer-no-eof.js`
- `parallel/test-stream2-readable-legacy-drain.js`
- `parallel/test-stream2-readable-non-empty-end.js`
- `parallel/test-stream2-readable-wrap-destroy.js#block_00_block_00`
- `parallel/test-stream2-readable-wrap-destroy.js#block_01_block_01`
- `parallel/test-stream2-readable-wrap-empty.js`
- `parallel/test-stream2-readable-wrap-error.js#block_00_block_00`
- `parallel/test-stream2-readable-wrap-error.js#block_01_block_01`
- `parallel/test-stream2-readable-wrap.js`
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
- `parallel/test-timers-enroll-second-time.js`
- `parallel/test-timers-immediate-queue-throw.js`
- `parallel/test-timers-immediate-unref-nested-once.js`
- `parallel/test-timers-immediate-unref-simple.js`
- `parallel/test-timers-immediate-unref.js`
- `parallel/test-timers-immediate.js`
- `parallel/test-timers-interval-throw.js`
- `parallel/test-timers-max-duration-warning.js`
- `parallel/test-timers-non-integer-delay.js`
- `parallel/test-timers-process-tampering.js`
- `parallel/test-timers-promises.js`
- `parallel/test-timers-refresh-in-callback.js`
- `parallel/test-timers-reset-process-domain-on-throw.js`
- `parallel/test-timers-same-timeout-wrong-list-deleted.js`
- `parallel/test-timers-setimmediate-infinite-loop.js`
- `parallel/test-timers-socket-timeout-removes-other-socket-unref-timer.js`
- `parallel/test-timers-this.js`
- `parallel/test-timers-throw-when-cb-not-function.js`
- `parallel/test-timers-timeout-to-interval.js`
- `parallel/test-timers-timeout-with-non-integer.js`
- `parallel/test-timers-to-primitive.js#block_00_block_00`
- `parallel/test-timers-to-primitive.js#block_01_block_01`
- `parallel/test-timers-uncaught-exception.js`
- `parallel/test-timers-unenroll-unref-interval.js#block_00_block_00`
- `parallel/test-timers-unenroll-unref-interval.js#block_01_block_01`
- `parallel/test-timers-unenroll-unref-interval.js#block_02_block_02`
- `parallel/test-timers-unenroll-unref-interval.js#block_03_block_03`
- `parallel/test-timers-unenroll-unref-interval.js#block_04_block_04`
- `parallel/test-timers-unref-throw-then-ref.js`
- `parallel/test-timers-unref.js#block_00_block_00`
- `parallel/test-timers-unref.js#block_01_block_01`
- `parallel/test-timers-unref.js#block_02_see_https_github_com_nodejs_node_v0_x_archive_issues_4261`
- `parallel/test-timers-unrefd-interval-still-fires.js`
- `parallel/test-timers-unrefed-in-beforeexit.js`
- `parallel/test-timers-unrefed-in-callback.js`
- `parallel/test-timers-user-call.js#block_00_block_00`
- `parallel/test-timers-user-call.js#block_01_block_01`
- `parallel/test-timers-zero-timeout.js#block_00_https_github_com_joyent_node_issues_2079_zero_timeout_drops_`
- `parallel/test-timers-zero-timeout.js#block_01_block_01`
- `parallel/test-timers.js`
- `parallel/test-tls-cipher-list.js`
- `parallel/test-tls-cli-min-max-conflict.js`
- `parallel/test-tls-enable-keylog-cli.js`
- `parallel/test-tls-env-extra-ca-no-crypto.js`
- `parallel/test-trace-events-all.js`
- `parallel/test-trace-events-api-worker-disabled.js`
- `parallel/test-trace-events-async-hooks.js`
- `parallel/test-trace-events-bootstrap.js`
- `parallel/test-trace-events-file-pattern.js`
- `parallel/test-trace-events-http.js`
- `parallel/test-trace-events-metadata.js`
- `parallel/test-trace-events-net.js`
- `parallel/test-trace-events-none.js`
- `parallel/test-trace-events-process-exit.js`
- `parallel/test-trace-events-promises.js`
- `parallel/test-trace-events-v8.js`
- `parallel/test-trace-events-vm.js`
- `parallel/test-trace-events-worker-metadata-with-name.js`
- `parallel/test-trace-events-worker-metadata.js`
- `parallel/test-url-domain-ascii-unicode.js`
- `parallel/test-url-fileurltopath.js#test_00_invalid_arguments`
- `parallel/test-url-fileurltopath.js#test_01_input_must_be_a_file_url`
- `parallel/test-url-fileurltopath.js#test_02_fileurltopath_with_host`
- `parallel/test-url-fileurltopath.js#test_03_fileurltopath_with_invalid_path`
- `parallel/test-url-fileurltopath.js#test_04_fileurltopath_with_windows_path`
- `parallel/test-url-fileurltopath.js#test_05_fileurltopath_with_posix_path`
- `parallel/test-url-fileurltopath.js#test_06_options_is_null`
- `parallel/test-url-fileurltopath.js#test_07_defaulttestcases`
- `parallel/test-url-format-invalid-input.js`
- `parallel/test-url-format-whatwg.js#test_00_should_format`
- `parallel/test-url-format-whatwg.js#test_01_handle_invalid_arguments`
- `parallel/test-url-format-whatwg.js#test_02_any_falsy_value_other_than_undefined_will_be_treated_as_fals`
- `parallel/test-url-format-whatwg.js#test_03_should_format_with_unicode_true`
- `parallel/test-url-format-whatwg.js#test_04_should_format_tel_prefix`
- `parallel/test-url-format.js`
- `parallel/test-url-parse-format.js#test_00_should_parse_and_format`
- `parallel/test-url-parse-format.js#test_01_parse_result_should_equal_new_url_url`
- `parallel/test-url-parse-invalid-input.js`
- `parallel/test-url-parse-query.js`
- `parallel/test-url-pathtofileurl.js#block_00_block_00`
- `parallel/test-url-pathtofileurl.js#block_01_block_01`
- `parallel/test-url-pathtofileurl.js#block_02_block_02`
- `parallel/test-url-pathtofileurl.js#block_03_block_03`
- `parallel/test-url-pathtofileurl.js#block_04_test_for_non_string_parameter`
- `parallel/test-url-relative.js`
- `parallel/test-url-revokeobjecturl.js`
- `parallel/test-url-urltooptions.js`
- `parallel/test-utf8-scripts.js`
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
- `parallel/test-util-deprecate.js#block_00_emits_deprecation_only_once_if_same_function_is_called`
- `parallel/test-util-deprecate.js#block_01_emits_deprecation_twice_for_different_functions`
- `parallel/test-util-deprecate.js#block_02_functions`
- `parallel/test-util-getcallsite.js`
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
- `parallel/test-util-inspect-getters-accessing-this.js#block_00_block_00`
- `parallel/test-util-inspect-getters-accessing-this.js#block_01_regression_test_for_https_github_com_nodejs_node_issues_3705`
- `parallel/test-util-inspect-namespace.js`
- `parallel/test-util-isDeepStrictEqual.js#block_00_handle_boxed_primitives`
- `parallel/test-util-isDeepStrictEqual.js#block_01_handle_symbols_enumerable_only`
- `parallel/test-util-log.js`
- `parallel/test-util-parse-env.js`
- `parallel/test-util-primordial-monkeypatching.js`
- `parallel/test-util-stripvtcontrolcharacters.js`
- `parallel/test-util-styletext.js`
- `parallel/test-util-text-decoder.js`
- `parallel/test-util-types-exists.js`
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
- `parallel/test-vm-syntax-error-message.js`
- `parallel/test-vm-syntax-error-stderr.js`
- `parallel/test-weakref.js`
- `parallel/test-webcrypto-constructors.js#block_00_test_cryptokey_constructor`
- `parallel/test-webcrypto-constructors.js#block_01_test_subtlecrypto_constructor`
- `parallel/test-webcrypto-constructors.js#block_02_test_crypto_constructor`
- `parallel/test-webcrypto-constructors.js#block_03_test_crypto_prototype_subtle`
- `parallel/test-webcrypto-constructors.js#block_04_test_crypto_prototype_randomuuid`
- `parallel/test-webcrypto-constructors.js#block_05_test_crypto_prototype_getrandomvalues`
- `parallel/test-webcrypto-constructors.js#block_06_test_subtlecrypto_prototype_encrypt`
- `parallel/test-webcrypto-constructors.js#block_07_test_subtlecrypto_prototype_decrypt`
- `parallel/test-webcrypto-constructors.js#block_08_test_subtlecrypto_prototype_sign`
- `parallel/test-webcrypto-constructors.js#block_09_test_subtlecrypto_prototype_verify`
- `parallel/test-webcrypto-constructors.js#block_10_test_subtlecrypto_prototype_digest`
- `parallel/test-webcrypto-constructors.js#block_11_test_subtlecrypto_prototype_generatekey`
- `parallel/test-webcrypto-constructors.js#block_12_test_subtlecrypto_prototype_derivekey`
- `parallel/test-webcrypto-constructors.js#block_13_test_subtlecrypto_prototype_derivebits`
- `parallel/test-webcrypto-constructors.js#block_14_test_subtlecrypto_prototype_importkey`
- `parallel/test-webcrypto-constructors.js#block_15_test_subtlecrypto_prototype_exportkey`
- `parallel/test-webcrypto-constructors.js#block_16_test_subtlecrypto_prototype_wrapkey`
- `parallel/test-webcrypto-constructors.js#block_17_test_subtlecrypto_prototype_unwrapkey`
- `parallel/test-webcrypto-constructors.js#block_18_block_18`
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_00_test_aes_cbc_vectors`
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_01_test_aes_ctr_vectors`
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_02_test_aes_gcm_vectors`
- `parallel/test-webcrypto-encrypt-decrypt-aes.js#block_03_block_03`
- `parallel/test-webcrypto-encrypt-decrypt.js#block_01_test_encrypt_decrypt_aes_ctr`
- `parallel/test-webcrypto-encrypt-decrypt.js#block_02_test_encrypt_decrypt_aes_cbc`
- `parallel/test-webcrypto-encrypt-decrypt.js#block_03_test_encrypt_decrypt_aes_gcm`
- `parallel/test-webcrypto-export-import.js#block_00_block_00`
- `parallel/test-webcrypto-export-import.js#block_01_import_export_hmac_secret_key`
- `parallel/test-webcrypto-export-import.js#block_02_import_export_aes_secret_key`
- `parallel/test-webcrypto-export-import.js#block_03_import_export_rsa_key_pairs`
- `parallel/test-webcrypto-export-import.js#block_04_import_export_ec_key_pairs`
- `parallel/test-webcrypto-getRandomValues.js`
- `parallel/test-webcrypto-random.js#block_00_block_00`
- `parallel/test-webcrypto-random.js#block_01_block_01`
- `parallel/test-webcrypto-random.js#block_02_block_02`
- `parallel/test-webcrypto-random.js#block_03_block_03`
- `parallel/test-webcrypto-sign-verify.js#block_00_test_sign_verify_rsassa_pkcs1_v1_5`
- `parallel/test-webcrypto-sign-verify.js#block_02_test_sign_verify_ecdsa`
- `parallel/test-webcrypto-sign-verify.js#block_03_test_sign_verify_hmac`
- `parallel/test-webcrypto-sign-verify.js#block_04_test_sign_verify_ed25519`
- `parallel/test-webcrypto-sign-verify.js#block_05_test_sign_verify_ed448`
- `parallel/test-websocket-disabled.js`
- `parallel/test-webstorage.js#test_00_disabled_without_experimental_webstorage`
- `parallel/test-webstream-string-tag.js`
- `parallel/test-webstreams-abort-controller.js#block_00_block_00`
- `parallel/test-webstreams-abort-controller.js#block_01_block_01`
- `parallel/test-webstreams-abort-controller.js#block_02_block_02`
- `parallel/test-webstreams-abort-controller.js#block_03_block_03`
- `parallel/test-webstreams-abort-controller.js#block_04_block_04`
- `parallel/test-webstreams-abort-controller.js#block_05_block_05`
- `parallel/test-webstreams-clone-unref.js`
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
- `parallel/test-webstreams-finished.js#block_00_block_00`
- `parallel/test-webstreams-finished.js#block_01_block_01`
- `parallel/test-webstreams-finished.js#block_02_block_02`
- `parallel/test-webstreams-finished.js#block_03_block_03`
- `parallel/test-webstreams-finished.js#block_04_block_04`
- `parallel/test-webstreams-finished.js#block_05_block_05`
- `parallel/test-webstreams-finished.js#block_06_block_06`
- `parallel/test-webstreams-finished.js#block_07_block_07`
- `parallel/test-webstreams-finished.js#block_08_block_08`
- `parallel/test-webstreams-finished.js#block_09_block_09`
- `parallel/test-webstreams-finished.js#block_10_block_10`
- `parallel/test-webstreams-finished.js#block_11_block_11`
- `parallel/test-webstreams-finished.js#block_12_block_12`
- `parallel/test-webstreams-finished.js#block_13_block_13`
- `parallel/test-webstreams-finished.js#block_14_block_14`
- `parallel/test-webstreams-finished.js#block_15_block_15`
- `parallel/test-webstreams-finished.js#block_16_block_16`
- `parallel/test-webstreams-finished.js#block_17_block_17`
- `parallel/test-webstreams-finished.js#block_18_block_18`
- `parallel/test-webstreams-finished.js#block_19_block_19`
- `parallel/test-webstreams-pipeline.js#block_00_block_00`
- `parallel/test-webstreams-pipeline.js#block_01_block_01`
- `parallel/test-webstreams-pipeline.js#block_02_block_02`
- `parallel/test-webstreams-pipeline.js#block_03_block_03`
- `parallel/test-webstreams-pipeline.js#block_04_block_04`
- `parallel/test-webstreams-pipeline.js#block_05_block_05`
- `parallel/test-webstreams-pipeline.js#block_06_block_06`
- `parallel/test-webstreams-pipeline.js#block_07_block_07`
- `parallel/test-webstreams-pipeline.js#block_08_block_08`
- `parallel/test-webstreams-pipeline.js#block_09_block_09`
- `parallel/test-webstreams-pipeline.js#block_10_block_10`
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
- `parallel/test-whatwg-url-custom-deepequal.js`
- `parallel/test-whatwg-url-override-hostname.js`
- `parallel/test-worker-cleanexit-with-moduleload.js`
- `parallel/test-worker-dns-terminate-during-query.js`
- `parallel/test-worker-load-file-with-extension-other-than-js.js`
- `parallel/test-worker-message-channel.js#block_00_block_00`
- `parallel/test-worker-message-port-close-while-receiving.js`
- `parallel/test-worker-message-port-multiple-sharedarraybuffers.js`
- `parallel/test-worker-message-port-transfer-terminate.js`
- `parallel/test-worker-nested-uncaught.js`
- `parallel/test-worker-on-process-exit.js`
- `parallel/test-worker-onmessage-not-a-function.js`
- `parallel/test-worker-ref-onexit.js`
- `parallel/test-worker-stack-overflow.js`
- `parallel/test-worker-terminate-http2-respond-with-file.js`
- `parallel/test-worker-voluntarily-exit-followed-by-addition.js`
- `parallel/test-worker-voluntarily-exit-followed-by-throw.js`
- `parallel/test-worker-workerdata-messageport.js#block_00_block_00`
- `parallel/test-worker-workerdata-messageport.js#block_01_block_01`
- `parallel/test-worker-workerdata-messageport.js#block_04_block_04`
- `parallel/test-zlib-brotli-16GB.js`
- `parallel/test-zlib-brotli-flush.js`
- `parallel/test-zlib-brotli-from-brotli.js`
- `parallel/test-zlib-brotli-from-string.js`
- `parallel/test-zlib-brotli-kmaxlength-rangeerror.js`
- `parallel/test-zlib-brotli.js#block_00_block_00`
- `parallel/test-zlib-brotli.js#block_01_block_01`
- `parallel/test-zlib-brotli.js#block_02_block_02`
- `parallel/test-zlib-close-after-write.js`
- `parallel/test-zlib-close-in-ondata.js`
- `parallel/test-zlib-const.js`
- `parallel/test-zlib-convenience-methods.js`
- `parallel/test-zlib-crc32.js`
- `parallel/test-zlib-create-raw.js#block_00_block_00`
- `parallel/test-zlib-create-raw.js#block_01_block_01`
- `parallel/test-zlib-deflate-constructors.js`
- `parallel/test-zlib-deflate-raw-inherits.js`
- `parallel/test-zlib-destroy.js#block_01_block_01`
- `parallel/test-zlib-dictionary-fail.js#block_00_block_00`
- `parallel/test-zlib-dictionary-fail.js#block_01_block_01`
- `parallel/test-zlib-dictionary-fail.js#block_02_block_02`
- `parallel/test-zlib-dictionary.js`
- `parallel/test-zlib-empty-buffer.js`
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
- `parallel/test-zlib-unzip-one-byte-chunks.js`
- `parallel/test-zlib-write-after-close.js`
- `parallel/test-zlib-write-after-end.js`
- `parallel/test-zlib-write-after-flush.js`
- `parallel/test-zlib-zero-byte.js`
- `parallel/test-zlib-zero-windowBits.js#test_00_zlib_should_support_zero_windowbits`
- `parallel/test-zlib-zero-windowBits.js#test_01_windowbits_should_be_valid`
- `parallel/test-zlib.js`
- `sequential/test-cli-syntax-bad.js`
- `sequential/test-cli-syntax-file-not-found.js`
- `sequential/test-cli-syntax-good.js`
- `sequential/test-deprecation-flags.js`
- `sequential/test-fs-opendir-recursive.js#block_00_block_00`
- `sequential/test-fs-opendir-recursive.js#block_01_block_01`
- `sequential/test-fs-opendir-recursive.js#block_02_block_02`
- `sequential/test-fs-opendir-recursive.js#block_03_block_03`
- `sequential/test-fs-opendir-recursive.js#block_04_block_04`
- `sequential/test-fs-opendir-recursive.js#block_05_this_test_asserts_that_the_buffer_size_option_is_respected`
- `sequential/test-fs-opendir-recursive.js#block_06_block_06`
- `sequential/test-fs-readdir-recursive.js#block_00_readdirsync_recursive`
- `sequential/test-fs-readdir-recursive.js#block_01_readdirsync_recursive_withfiletypes`
- `sequential/test-fs-readdir-recursive.js#block_02_readdir_recursive_callback`
- `sequential/test-fs-readdir-recursive.js#block_03_readdir_recursive_withfiletypes_callback`
- `sequential/test-fs-readdir-recursive.js#block_04_fs_promises_readdir_recursive`
- `sequential/test-fs-readdir-recursive.js#block_05_fs_promises_readdir_recursive_withfiletypes`
- `sequential/test-fs-watch.js#block_03_not_block_the_event_loop`
- `sequential/test-fs-watch.js#block_04_https_github_com_joyent_node_issues_6690`
- `sequential/test-fs-watch.js#block_05_block_05`
- `sequential/test-http-keep-alive-large-write.js`
- `sequential/test-http-server-keep-alive-timeout-slow-client-headers.js`
- `sequential/test-http-server-keep-alive-timeout-slow-server.js`
- `sequential/test-init.js#block_00_block_00`
- `sequential/test-init.js#block_01_block_01`
- `sequential/test-init.js#block_02_block_02`
- `sequential/test-net-better-error-messages-port.js`
- `sequential/test-net-connect-econnrefused.js`
- `sequential/test-net-connect-handle-econnrefused.js`
- `sequential/test-net-connect-local-error.js`
- `sequential/test-net-localport.js`
- `sequential/test-net-server-address.js#block_00_test_on_ipv4_server`
- `sequential/test-net-server-address.js#block_01_test_on_ipv6_server`
- `sequential/test-net-server-address.js#block_02_test_without_hostname_or_ip`
- `sequential/test-net-server-address.js#block_03_test_without_hostname_or_port`
- `sequential/test-net-server-address.js#block_04_test_without_hostname_but_with_a_false_y_port`
- `sequential/test-net-server-bind.js#block_00_with_only_a_callback_server_should_get_a_port_assigned_by_th`
- `sequential/test-net-server-bind.js#block_01_no_callback_to_listen_assume_we_can_bind_in_100_ms`
- `sequential/test-net-server-bind.js#block_02_callback_to_listen`
- `sequential/test-net-server-bind.js#block_03_backlog_argument`
- `sequential/test-net-server-bind.js#block_04_backlog_argument_without_host_argument`
- `sequential/test-net-server-listen-ipv6-link-local.js`
- `sequential/test-process-warnings.js`
- `sequential/test-require-cache-without-stat.js`
- `sequential/test-stream2-fs.js`
- `sequential/test-stream2-stderr-sync.js`

## Failing Tests

### abort

- `parallel/test-aborted-util.js#test_04_does_not_hang_forever`: cannot read property 'end' of null     at <anonymous> (/home/node/test/parallel/test-aborted-util.js:90:3)     at call (native)     at runTest (node:test:498:32)     at test (node:test:731:28)     at ...

### child_process

- `parallel/test-child-process-exec-maxbuf.js#block_08_block_08`: cannot read property 'setEncoding' of null     at <anonymous> (/home/node/test/parallel/test-child-process-exec-maxbuf.js:61:3)     at loadModule (node:module:1088:32)     at localRequire (node:module...
- `parallel/test-child-process-exec-maxbuf.js#block_09_block_09`: cannot read property 'setEncoding' of null     at <anonymous> (/home/node/test/parallel/test-child-process-exec-maxbuf.js:63:3)     at loadModule (node:module:1088:32)     at localRequire (node:module...

### common

- `parallel/test-common-gc.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-common-gc.js:7:27) ...

### crypto

- `parallel/test-crypto-sign-verify.js#block_12_block_12`: Failed to parse private key     at createPrivateKeyParseError (__wasm_rquickjs_builtin/web_crypto:1620:21)     at createPrivateKeyFromData (__wasm_rquickjs_builtin/web_crypto:5343:15)     at createPri...
- `parallel/test-crypto-sign-verify.js#block_18_block_18`: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ERR_CRYPTO_INVALID_KEYTYPE', +   message: 'Failed to parse public key' -   code: 'ERR_OSSL_EVP_OPERATION_NOT_S...

### dgram

- `parallel/test-dgram-custom-lookup.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-dgram-custom-lookup...
- `parallel/test-dgram-custom-lookup.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-dgram-custom-lookup...
- `parallel/test-dgram-custom-lookup.js#block_02_block_02`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-dgram-custom-lookup.js:20:44)     at forEach (native) ...
- `parallel/test-dgram-multicast-set-interface.js#block_01_block_01`: Unhandled promise rejection: AssertionError: The input did not match the regular expression /Not running/. Input:  'Error: setMulticastInterface ENOSYS'      at <anonymous> (/home/node/test/parallel/t...

### dns

- `parallel/test-dns-setlocaladdress.js#block_01_verify_that_setlocaladdress_throws_if_called_with_an_invalid`: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at <anonymous> (/home/node/test/parallel/test-dns-setlocaladdress.js:14:10)     at loadModule (node:module:1...

### fs

- `parallel/test-fs-write-file-sync.js#block_05_test_writefilesync_with_an_invalid_input`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-fs-write-file-sync.js:70:7)     at loadModule (node:module:1088:32)     at loc...
- `parallel/test-fs-writefile-with-fd.js#block_02_test_read_only_file_descriptor`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:545:28)     at <anonymous> (/home/node/test/parallel/test-fs-writefile-wit...
- `sequential/test-fs-watch.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 2     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/sequential/test-fs-watch.js:62:40...
- `sequential/test-fs-watch.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 2     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/sequential/test-fs-watch.js:66:48...

### http

- `parallel/test-http-early-hints.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-http-early-hints.js...
- `parallel/test-http-early-hints.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-http-early-hints.js...
- `parallel/test-http-early-hints.js#block_03_block_03`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-http-early-hints.js...
- `parallel/test-http-early-hints.js#block_04_block_04`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-http-early-hints.js...
- `parallel/test-http-insecure-parser-per-stream.js#block_02_test_3_the_client_sends_an_invalid_header`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-http-insecure-parse...
- `parallel/test-http-insecure-parser-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-http-insecure-parse...
- `parallel/test-http-max-header-size-per-stream.js#block_02_test_3_the_client_sends_larger_headers_than_what_would_other`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-http-max-header-siz...
- `parallel/test-http-max-header-size-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-http-max-header-siz...
- `parallel/test-http-req-res-close.js#block_00_after_res`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-http-req-res-close....
- `parallel/test-http-req-res-close.js#block_01_req_should_emit_close_after_res`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-http-req-res-close....
- `parallel/test-http-server-close-idle-wait-response.js`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-http-server-close-i...

### module

- `es-module/test-require-module-tla.js#block_01_block_01`: - stderr did not match expectation, checker throws: AssertionError: The input did not match the regular expression /I am executed/. Input:  'Error: require() cannot be used on an ESM graph with top-le...

### net

- `parallel/test-net-reconnect.js`: Expected values to be strictly equal:  42 !== 51  AssertionError: Expected values to be strictly equal:  42 !== 51      at <anonymous> (/home/node/test/parallel/test-net-reconnect.js:85:44)     at emi...
- `sequential/test-net-reconnect-error.js`: mustCall verification failed: mustCall: expected exactly 21 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/sequential/test-net-reconnect-er...

### other

- `parallel/test-domexception-cause.js#block_01_block_01`: Expected values to be strictly equal: + actual - expected  + { +   cause: undefined, +   name: 'abc' + } - 'abc'  AssertionError: Expected values to be strictly equal: + actual - expected  + { +   cau...
- `parallel/test-domexception-cause.js#block_02_block_02`: Expected values to be strictly equal: + actual - expected  + { +   cause: 'foo', +   name: 'abc' + } - 'abc'  AssertionError: Expected values to be strictly equal: + actual - expected  + { +   cause: ...
- `parallel/test-domexception-cause.js#block_03_block_03`: Expected values to be strictly equal: + actual - expected  + { +   cause: { +     reason: 'foo' +   }, +   name: 'abc' + } - 'abc'  AssertionError: Expected values to be strictly equal: + actual - exp...

### perf_hooks

- `parallel/test-performance-gc.js#block_00_adding_an_observer_should_force_at_least_one_gc_to_appear`: mustCall verification failed: mustCallAtLeast: expected at least 1 calls, got 0     at mustCallAtLeast (/home/node/test/common/index.js:521:28)     at <anonymous> (/home/node/test/parallel/test-perfor...

### permission

- `parallel/test-permission-fs-read.js#block_01_block_01`: AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/fixtures/permission/fs-read.js:34:37)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34) ...
- `parallel/test-permission-fs-require.js#block_01_block_01`: 0 !== 1  AssertionError:   0 !== 1      at <anonymous> (/home/node/test/parallel/test-permission-fs-require.js:31:40)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34) ...
- `parallel/test-permission-fs-require.js#block_03_block_03`: 0 !== 1  AssertionError:   0 !== 1      at <anonymous> (/home/node/test/parallel/test-permission-fs-require.js:35:40)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34) ...

### sqlite

- `parallel/test-sqlite-session.js#test_05_conflict_resolution`: 2 test(s) failed     at finalize (node:test:641:29)     at runNext (node:test:688:16)     at executeSuite (node:test:691:25)     at runSuite (node:test:595:64)     at describe (node:test:799:29)     a...
- `parallel/test-sqlite-statement-sync.js#test_06_statementsync_prototype_expandedsql`: Cannot mix named parameters object with positional arguments     at #processParams (node:sqlite:435:33)     at run (node:sqlite:446:44)     at <anonymous> (/home/node/test/parallel/test-sqlite-stateme...
- `parallel/test-sqlite.js#test_00_accessing_the_node_sqlite_module`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:123:19)     at runInlineEval (/home/node/test/common/in...

### stream

- `parallel/test-stream-compose.js#block_17_block_17`: Unhandled promise rejection:     at ERR_INVALID_RETURN_VALUE (__wasm_rquickjs_builtin/internal/errors:840:109)     at <anonymous> (__wasm_rquickjs_builtin/internal/streams/duplex:237:35)     at apply ...
- `parallel/test-stream-drop-take.js#block_01_don_t_wait_for_next_item_in_the_original_stream_when_already`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-stream-drop-take.js...
- `parallel/test-stream-duplex-from.js#block_17_block_17`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-stream-duplex-from....
- `parallel/test-stream-duplex-readable-writable.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-stream-duplex-reada...
- `parallel/test-stream-finished.js#block_08_block_08`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:545:28)     at <anonymous> (/home/node/test/parallel/test-stream-finished....
- `parallel/test-stream-finished.js#block_21_block_21`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-stream-finished.js:...
- `parallel/test-stream-finished.js#block_22_block_22`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-stream-finished.js:...
- `parallel/test-stream-finished.js#block_23_block_23`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-stream-finished.js:...
- `parallel/test-stream-finished.js#block_24_block_24`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-stream-finished.js:...
- `parallel/test-stream-finished.js#block_41_block_41`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-stream-finished.js:...
- `parallel/test-stream-map.js#block_03_block_03`: mustCall verification failed: mustCall: expected exactly 5 call(s), got 6     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-stream-map.js:40:28...
- `parallel/test-stream-map.js#block_09_block_09`: mustCall verification failed: mustCall: expected exactly 2 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-stream-map.js:53:44...
- `parallel/test-stream-pipeline.js#block_75_block_75`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustSucceed (/home/node/test/common/index.js:545:28)     at <anonymous> (/home/node/test/parallel/test-stream-pipeline....
- `parallel/test-stream-readable-async-iterators.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at tests (/home/node/test/parallel/test-stream-readable-async-ite...
- `parallel/test-stream-readable-async-iterators.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at tests (/home/node/test/parallel/test-stream-readable-async-ite...
- `parallel/test-stream-readable-async-iterators.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at tests (/home/node/test/parallel/test-stream-readable-async-ite...
- `parallel/test-stream-readable-async-iterators.js#block_03_block_03`: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly equal: + actual - expected  + 'ERR_ASSERTION' - 'ERR_STREAM_PREMATURE_CLOSE'        ^    ...
- `parallel/test-stream-readable-async-iterators.js#block_04_asynciterator_non_destroying_iterator`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at tests (/home/node/test/parallel/test-stream-readable-async-ite...
- `parallel/test-stream-readable-async-iterators.js#block_06_block_06`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at tests (/home/node/test/parallel/test-stream-readable-async-ite...
- `parallel/test-stream-reduce.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 3 call(s), got 4     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-stream-reduce.js:18...
- `parallel/test-stream2-writable.js#block_13_block_13`: not a function     at <anonymous> (__wasm_rquickjs_builtin/internal/streams/readable:704:10)     at <anonymous> (/home/node/test/parallel/test-stream2-writable.js:87:10)     at loadModule (node:module...

### test_runner

- `parallel/test-runner-assert.js#test_01_t_assert_ok_correctly_parses_the_stacktrace`: The input did not match the regular expression /t\.assert\.ok\(1 === 2\)/. Input:  'AssertionError [ERR_ASSERTION]: false == true'  AssertionError: The input did not match the regular expression /t\.a...
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
- `parallel/test-runner-mocking.js#test_21_mocks_a_constructor`: The input did not match the regular expression /TypeError: Cannot read private member #privateValue /. Input:  "TypeError: private class field '#privateValue' does not exist"  AssertionError: The inpu...
- `parallel/test-runner-module-mocking.js#test_11_node_modules_can_be_used_by_both_module_systems`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:123:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-runner-module-mocking.js#test_16_wrong_import_syntax_should_throw_error_after_module_mocking`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:123:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-runner-module-mocking.js#test_17_should_throw_err_access_denied_when_permission_model_is_enab`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:123:19)     at runInlineEval (/home/node/test/common/in...
- `parallel/test-runner-module-mocking.js#test_18_should_work_when_allow_worker_is_passed_and_permission_model`: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:123:19)     at runInlineEval (/home/node/test/common/in...

### vm

- `parallel/test-vm-new-script-new-context.js#block_04_block_04`: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-vm-new-script-new-context.js:47:22)   ...
- `parallel/test-vm-new-script-new-context.js#block_07_block_07`: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-vm-new-script-new-context.js:45:10)     at loadModule (node:module:1088:32)   ...

### whatwg

- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_06_block_06`: The listener was still removed  1 !== 0  AssertionError: The listener was still removed  1 !== 0      at <anonymous> (/home/node/test/parallel/test-whatwg-events-add-event-listener-options-signal.js:3...
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_09_block_09`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-whatwg-events-add-event-listener-options-signal.js:32:...
- `parallel/test-whatwg-events-customevent.js#block_01_block_01`: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-whatwg-events-customevent.js:13:3)     at loadModule (...

### worker_threads

- `parallel/test-worker-message-channel.js#block_01_block_01`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-chan...
- `parallel/test-worker-message-channel.js#block_02_block_02`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-chan...
- `parallel/test-worker-message-port.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-port...
- `parallel/test-worker-message-port.js#block_01_block_01`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-port.js:11:40)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (node-co...
- `parallel/test-worker-message-port.js#block_02_block_02`: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - <ref *1> MessagePort { -   _target: MessagePort { -     _target: [Circular *1] -  ...
- `parallel/test-worker-message-port.js#block_03_block_03`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-worker-message-port...
- `parallel/test-worker-message-port.js#block_04_block_04`: not a function     at <anonymous> (/home/node/test/parallel/test-worker-message-port.js:22:9)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (node-com...
- `parallel/test-worker-message-port.js#block_05_block_05`: Expected values to be strictly deep-equal: + actual - expected    Comparison { -   code: 'ERR_INVALID_ARG_TYPE',     constructor: [Function: TypeError], +   message: 'value is not iterable' -   messag...
- `parallel/test-worker-message-port.js#block_06_block_06`: Expected values to be strictly equal:  10 !== 0  AssertionError: Expected values to be strictly equal:  10 !== 0      at <anonymous> (/home/node/test/parallel/test-worker-message-port.js:40:24)     at...
- `parallel/test-worker-message-port.js#block_07_block_07`: Transfer list item is not transferable     at DOMException (__wasm_rquickjs_builtin/abort_controller:27:9)     at dataCloneError (__wasm_rquickjs_builtin/structured_clone:243:16)     at structuredClon...
- `parallel/test-worker-message-port.js#block_08_block_08`: Expected values to be strictly deep-equal: + actual - expected    [ +   '_enqueueDelivery',     'close',     'constructor', +   'on', +   'once', -   'hasRef',     'onmessage',     'onmessageerror',  ...
- `parallel/test-worker-workerdata-messageport.js#block_02_block_02`: Expected values to be strictly equal:  4 !== 0  AssertionError: Expected values to be strictly equal:  4 !== 0      at <anonymous> (/home/node/test/parallel/test-worker-workerdata-messageport.js:34:22...
- `parallel/test-worker-workerdata-messageport.js#block_03_block_03`: Missing expected exception (DataCloneError). AssertionError: Missing expected exception (DataCloneError).     at <anonymous> (/home/node/test/parallel/test-worker-workerdata-messageport.js:35:14)     ...

### zlib

- `parallel/test-zlib-destroy.js#block_00_block_00`: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-zlib-destroy.js:17:...

## Error Tests (runtime/instantiation errors)

57 tests had runtime errors.

<details>
<summary>Click to expand</summary>

- `parallel/test-assert-typedarray-deepequal.js#test_00_equalarraypairs`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-includes.js`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_02_block_02`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_03_block_03`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_04_test_truncation_of_number_arguments_to_uint8`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_05_test_that_uint8array_arguments_are_okay`: Timeout (epoch deadline exceeded)
- `parallel/test-buffer-indexof.js#block_06_see_https_github_com_nodejs_node_issues_32753`: Timeout (epoch deadline exceeded)
- `parallel/test-child-process-exec-timeout-expire.js`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-child-process-exec-timeout-kill.js`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-crypto-authenticated.js#block_07_test_that_setaad_and_update_throw_if_the_plaintext_is_too_lo`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-dh-stateless.js`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-from-binary.js`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-key-objects.js#block_05_block_05`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-keygen-async-encrypted-private-key.js`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-keygen-async-explicit-elliptic-curve-encrypted-p256.js`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-keygen-async-named-elliptic-curve-encrypted-p256.js`: Timeout (epoch deadline exceeded)
- `parallel/test-crypto-keygen-empty-passphrase-no-error.js`: Timeout (epoch deadline exceeded)
- `parallel/test-dgram-multicast-set-interface.js#block_00_block_00`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-dgram-multicast-set-interface.js#block_02_block_02`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-dgram-multicast-set-interface.js#block_03_block_03`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-dgram-unref.js#block_00_block_00`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-fs-promises-file-handle-writeFile.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-promises-writefile.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-read-stream-concurrent-reads.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-read-stream-pos.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-readfile-pipe-large.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-readfile.js#block_00_readfile_and_readfilesync_should_fail_if_the_file_is_too_big`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-readfile.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-readfile.js#block_02_block_02`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-readfile.js#block_03_block_03`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-readfilesync-pipe-large.js`: Timeout (epoch deadline exceeded)
- `parallel/test-fs-sir-writes-alot.js`: Timeout (epoch deadline exceeded)
- `parallel/test-http-end-throw-socket-handling.js`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-http-outgoing-destroyed.js#block_00_block_00`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-http-outgoing-destroyed.js#block_01_block_01`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-http-outgoing-message-capture-rejection.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `parallel/test-http-outgoing-message-capture-rejection.js#block_01_block_01`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-http-outgoing-properties.js#block_02_block_02`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-http-request-host-header.js#block_00_block_00`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-net-autoselectfamily.js#block_01_test_that_only_the_last_successful_connection_is_established`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-net-blocklist.js#block_03_connect_with_autoselectfamily_and_multiple_ips`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-net-bytes-written-large.js#block_00_block_00`: Timeout (epoch deadline exceeded)
- `parallel/test-net-bytes-written-large.js#block_01_block_01`: Timeout (epoch deadline exceeded)
- `parallel/test-net-bytes-written-large.js#block_02_block_02`: Timeout (epoch deadline exceeded)
- `parallel/test-net-server-max-connections-close-makes-more-available.js`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-runner-wait-for.js#test_05_sets_last_failure_as_error_cause_on_timeouts`: Timeout (epoch deadline exceeded)
- `parallel/test-stream-finished.js#block_34_block_34`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-stream-pipeline.js#block_08_block_08`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-stream-pipeline.js#block_09_block_09`: Timeout (epoch deadline exceeded)
- `parallel/test-stream-readable-async-iterators.js#block_05_block_05`: Timeout (tokio 60s deadline exceeded)
- `parallel/test-util-inspect-long-running.js`: Timeout (epoch deadline exceeded)
- `parallel/test-webcrypto-encrypt-decrypt.js#block_00_test_encrypt_decrypt_rsa_oaep`: Timeout (epoch deadline exceeded)
- `parallel/test-webcrypto-sign-verify.js#block_01_test_sign_verify_rsa_pss`: Timeout (epoch deadline exceeded)
- `parallel/test-whatwg-events-add-event-listener-options-signal.js#block_08_block_08`: error while executing at wasm backtrace:     0: 0xe12c09 - node_compat_runner.wasm!JS_CallInternal     1: 0xde758e - node_compat_runner.wasm!JS_Call     2: 0xf0c990 - node_compat_runner.wasm!js_array_...
- `sequential/test-fs-watch.js#block_02_block_02`: Timeout (epoch deadline exceeded)

</details>

## Unevaluated Tests (newly discovered, with actual errors)

These tests were added by `migrate_config_split` but have not been manually evaluated.
The report ran each test and captured the actual error. Tests are grouped by error pattern.

### Auto-classified as impossible (50 tests)

These tests fail with errors indicating features fundamentally unavailable in WASM.
They are counted as IMPOSSIBLE in the summary.

| Reason | Count | Example tests |
|--------|-------|---------------|
| cluster not available in WASM | 6 | `test-dgram-bind-socket-close-before-cluster-reply.js`, `test-dgram-cluster-close-during-bind.js`, `test-dgram-cluster-close-in-listening.js`, ... (+3) |
| http2 not available in WASM | 2 | `test-h2-large-header-cause-client-to-hangup.js`, `test-h2leak-destroy-session-on-socket-ended.js` |
| https server not available in WASM | 1 | `test-async-wrap-tlssocket-asyncreset.js` |
| inspector not available in WASM | 33 | `test-disable-sigusr1.js`, `test-domain-dep0097.js`, `test-heap-prof-basic.js`, ... (+30) |
| tls not available in WASM | 4 | `test-double-tls-client.js`, `test-gc-tls-external-memory.js`, `test-x509-escaping.js#block_00_test_that_all_certificate_chains_provided_by_the_reporter_ar`, ... (+1) |
| worker_threads not available in WASM | 4 | `test-broadcastchannel-custom-inspect.js#block_00_block_00`, `test-broadcastchannel-custom-inspect.js#block_01_block_01`, `test-broadcastchannel-custom-inspect.js#block_02_block_02`, ... (+1) |

### Needs investigation (419 tests)

These unevaluated tests fail with errors that may be fixable.

| Error Pattern | Count | Example tests |
|---------------|-------|---------------|
| Expected values to be strictly equal: | 53 | `test-async-hooks-close-during-destroy.js`, `test-async-hooks-promise-enable-disable.js`, `test-async-hooks-recursive-stack-runInAsyncScope.js`, ... (+50) |
| not a function | 36 | `test-async-local-storage-snapshot.js`, `test-cli-syntax-piped-bad.js`, `test-cwd-enoent-preload.js`, ... (+33) |
| Expected values to be strictly deep-equal: | 33 | `test-require-module-error-catching.js`, `test-async-hooks-correctly-switch-promise-hook.js`, `test-c-ares.js`, ... (+30) |
| Unhandled promise rejection (likely cause of mustCall failure): | 26 | `test-require-module-dynamic-import-2.js`, `test-vm-source-text-module-leak.js`, `test-filehandle-readablestream.js`, ... (+23) |
| Timeout (epoch deadline exceeded) | 16 | `test-require-module-retry-import-errored.js`, `test-require-module-retry-import-evaluating.js`, `test-gc-http-client-connaborted.js`, ... (+13) |
| Missing expected exception (TypeError). | 12 | `test-async-hooks-asyncresource-constructor.js`, `test-async-hooks-constructor.js`, `test-async-wrap-constructor.js`, ... (+9) |
| Unhandled promise rejection: | 12 | `test-require-module-tla-retry-import-2.js`, `test-require-module-tla-retry-import.js`, `test-vm-synthetic-module-leak.js`, ... (+9) |
| Missing expected exception. | 10 | `test-async-local-storage-bind.js`, `test-asyncresource-bind.js`, `test-disable-proto-throw.js`, ... (+7) |
| The expression evaluated to a falsy value: | 9 | `test-cli-options-negation.js`, `test-common-must-not-call.js`, `test-math-random.js`, ... (+6) |
| Timeout (tokio 60s deadline exceeded) | 9 | `test-double-tls-server.js`, `test-listen-fd-detached-inherit.js`, `test-listen-fd-detached.js`, ... (+6) |
| error while executing at wasm backtrace: | 9 | `test-async-local-storage-deep-stack.js`, `test-async-wrap-pop-id-during-load.js`, `test-cli-node-options.js`, ... (+6) |
| mustCall verification failed: | 9 | `test-common-expect-warning.js`, `test-diagnostics-channel-http.js`, `test-diagnostics-channel-net.js`, ... (+6) |
| readline is not yet supported in WebAssembly environment | 7 | `test-readline-carriage-return-between-chunks.js`, `test-readline-interface-escapecodetimeout.js`, `test-readline-keys.js`, ... (+4) |
| Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equa... | 6 | `test-diagnostics-channel-module-import-error.js`, `test-diagnostics-channel-module-import.js`, `test-webcrypto-derivebits-hkdf.js`, ... (+3) |
| Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly equal: | 6 | `test-async-hooks-promise-triggerid.js`, `test-sync-io-option.js`, `test-trace-exit.js`, ... (+3) |
| missing Intl | 6 | `test-intl-v8BreakIterator.js`, `test-tz-version.js`, `test-whatwg-encoding-custom-textdecoder-fatal.js`, ... (+3) |
| - stderr did not match expectation, checker throws: | 4 | `test-require-module-errors.js`, `test-require-module-warning.js`, `test-trace-env.js`, ... (+1) |
| cannot read property 'end' of null | 4 | `test-force-repl.js`, `test-preload.js`, `test-stdin-pipe-large.js`, ... (+1) |
| Cannot convert undefined or null to object | 3 | `test-vm-main-context-default-loader.js`, `test-v8-startup-snapshot-api.js`, `test-vm-getters.js` |
| Cannot find module '../common/wpt' from '<path> | 3 | `test-whatwg-events-event-constructors.js`, `test-whatwg-events-eventtarget-this-of-listener.js`, `test-whatwg-url-custom-searchparams-sort.js` |
| Expected "actual" to be strictly unequal to: | 3 | `test-require-extensions-same-filename-as-dir-trailing-slash.js`, `test-require-extensions-same-filename-as-dir.js`, `test-vm-access-process-env.js` |
| Only --eval/-e, --input-type, and script files are supported in WASM child emulation | 3 | `test-cjs-esm-warn.js`, `test-runner-root-duration.js`, `test-trace-atomic-deprecation.js` |
| WebAssembly is not defined | 3 | `test-wasm-memory-out-of-bound.js`, `test-wasm-simple.js`, `test-wasm-web-api.js` |
| foo | 3 | `test-process-exception-capture-should-abort-on-uncaught-setflagsfromstring.js`, `test-process-exception-capture-should-abort-on-uncaught.js`, `test-process-exception-capture.js` |
| no IPv6 support | 3 | `test-dgram-ipv6only.js`, `test-dgram-udp6-link-local-address.js`, `test-dgram-udp6-send-default-host.js` |
| process.binding is not supported in WASM environment | 3 | `test-err-name-deprecation.js`, `test-process-binding-internalbinding-allowlist.js`, `test-process-binding-util.js` |
| undefined | 3 | `test-pipe-abstract-socket-http.js`, `test-pipe-abstract-socket.js`, `test-trace-events-net-abstract-socket.js` |
| 9 test(s) failed | 2 | `test-find-package-json.js`, `test-runner-mock-timers-date.js` |
| Cannot find module '../common/measure-memory' from '<path> | 2 | `test-vm-measure-memory-multi-context.js`, `test-vm-measure-memory.js` |
| Cannot find module '../common/v8' from '<path> | 2 | `test-v8-collect-gc-profile-in-worker.js`, `test-v8-collect-gc-profile.js` |
| Cannot find module '<path> from '<path> | 2 | `test-icu-minimum-version.js`, `test-require-unicode.js` |
| Cannot find module 'pkgexports/no-addons' | 2 | `test-permission-allow-addons-cli.js`, `test-permission-no-addons.js` |
| ENOENT: no such file or directory, open '<path> | 2 | `test-cli-node-options-docs.js`, `test-process-env-allowed-flags-are-documented.js` |
| Expected "actual" to be reference-equal to "expected": | 2 | `test-performance-global.js`, `test-vm-global-identity.js` |
| Expected values to be loosely deep-equal: | 2 | `test-vm-global-property-interceptors.js`, `test-vm-global-property-prototype.js` |
| ShadowRealm is not defined | 2 | `test-shadow-realm-globals.js`, `test-shadow-realm.js` |
| The input did not match the regular expression /The "initHook" argument must be of type function/. Input: | 2 | `test-promise-hook-create-hook.js`, `test-promise-hook-on-init.js` |
| Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected "actual" to be strictly unequal... | 2 | `test-async-hooks-enable-before-promise-resolve.js`, `test-async-hooks-enable-disable-enable.js` |
| Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Missing expected rejection. | 2 | `test-vm-dynamic-import-callback-missing-flag.js`, `test-vm-no-dynamic-import-callback.js` |
| Unhandled promise rejection: AssertionError: false == true | 2 | `test-trace-events-console.js`, `test-trace-events-environment.js` |
| cannot read property 'get' of undefined | 2 | `test-vm-attributes-property-not-on-sandbox.js`, `test-vm-global-setter.js` |
| process.kill is not supported in WASI environment | 2 | `test-process-kill-null.js`, `test-signal-args.js` |
| this test is Windows-specific. | 2 | `test-require-long-path.js`, `test-spawn-cmd-named-pipe.js` |
| v8.serialize is not supported in WASM environment | 2 | `test-v8-deserialize-buffer.js`, `test-v8-serialize-leak.js` |
| - process terminated with status 0, expected 1 | 1 | `test-cli-syntax-require.js` |
| - process terminated with status 1, expected 0 | 1 | `test-require-module-preload.js` |
| - stderr did not match /Support for loading ES Module in require\(\)/ | 1 | `test-require-node-modules-warning.js` |
| - stderr did not match /internal\/process\/pre_execution/ | 1 | `test-trace-env-stack.js` |
| - stdout did not match 'true' | 1 | `test-require-module-feature-detect.js` |
| 10 test(s) failed | 1 | `test-dotenv-edge-cases.js` |
| 11 test(s) failed | 1 | `test-node-run.js` |
| 2 test(s) failed | 1 | `test-dotenv-node-options.js` |
| 6 test(s) failed | 1 | `test-process-load-env-file.js` |
| 7 test(s) failed | 1 | `test-runner-mock-timers-scheduler.js` |
| App Sandbox is only available on Darwin | 1 | `test-macos-app-sandbox.js` |
| AssertionError: The validation function is expected to return "true". Received false | 1 | `test-permission-processbinding.js` |
| Atomics is not defined | 1 | `test-atomics-wake.js` |
| Cannot find module '.' | 1 | `test-require-dot.js` |
| Cannot find module '../' from '<path> | 1 | `test-require-extensions-main.js` |
| Cannot find module '../../benchmark/_cli.js' from '<path> | 1 | `test-benchmark-cli.js` |
| Cannot find module '../../deps/acorn/acorn/package.json' from '<path> | 1 | `test-process-versions.js` |
| Cannot find module '../common/fixtures' from '<path> | 1 | `test-require-delete-array-iterator.js` |
| Cannot find module '../common/process-exit-code-cases' from '<path> | 1 | `test-process-exit-code.js` |
| Cannot find module '/usr/local/bin/node/file.js' from '<path> | 1 | `test-vfs.js` |
| Cannot find module '_http_outgoing' | 1 | `test-outgoing-message-pipe.js` |
| Cannot find module '_stream_wrap' | 1 | `test-warn-stream-wrap.js` |
| Cannot find module 'import-module-require' | 1 | `test-require-module-conditional-exports-module.js` |
| Cannot find module 'punycode' | 1 | `test-punycode.js` |
| Cannot find module 'wasi' | 1 | `test-permission-wasi.js` |
| Case 0 failed: Object.keys | 1 | `test-vm-global-property-enumerator.js` |
| Could not find export 'π' in module 'home/node/test/fixtures/es-modules/exports-cases.js | 1 | `test-require-module-twice.js` |
| EIO: input/output error, open '<path> | 1 | `test-memory-usage-emfile.js` |
| Error from proxy | 1 | `test-promises-unhandled-proxy-rejections.js` |
| Error: cannot read property 'has' of undefined | 1 | `test-permission-fs-write.js` |
| Error: cannot read property 'loopCount' of undefined | 1 | `test-performance-nodetiming-uvmetricsinfo.js` |
| Error: invalid redefinition of parameter name | 1 | `test-vm-cached-data.js` |
| Intl not present. | 1 | `test-datetime-change-notify.js` |
| Intl tests because Intl object not present. | 1 | `test-intl.js` |
| Missing expected exception (Error). | 1 | `test-domain-load-after-set-uncaught-exception-capture.js` |
| Missing expected exception (EvalError). | 1 | `test-eval-disallow-code-generation-from-strings.js` |
| Missing expected exception (RangeError). | 1 | `test-vm-compile-function-lineoffset.js` |
| Test index 0 failed: Error: execSync is not supported in WebAssembly environment | 1 | `test-domain-abort-on-uncaught.js` |
| The "body" argument must be of type function or an instance of Blob, Stream, Iterable, AsyncIterable, or Promise or { re... | 1 | `test-stdout-pipeline-destroy.js` |
| The error is expected to be an instance of "TypeError". Received "ReferenceError" | 1 | `test-messageevent-brandcheck.js` |
| The input did not match the regular expression /No such module/. Input: | 1 | `test-internal-process-binding.js` |
| The input did not match the regular expression /SecurityWarning: The flag --allow-addons must be used with extreme cauti... | 1 | `test-permission-warning-flags.js` |
| The input did not match the regular expression /TAP version 13/. Input: | 1 | `test-runner-reporters.js` |
| The input did not match the regular expression /The "afterHook" argument must be of type function/. Input: | 1 | `test-promise-hook-on-after.js` |
| The input did not match the regular expression /The "beforeHook" argument must be of type function/. Input: | 1 | `test-promise-hook-on-before.js` |
| The input did not match the regular expression /The "settledHook" argument must be of type function/. Input: | 1 | `test-promise-hook-on-resolve.js` |
| The input did not match the regular expression /^Sat Apr 14 2018 14:34:56 GMT\+0200 \(.+\)$/. Input: | 1 | `test-process-env-tz.js` |
| The input did not match the regular expression /tests3/. Input: | 1 | `test-runner-exit-code.js` |
| This is test exists only on Linux/Win32/macOS | 1 | `test-stdin-from-file-spawn.js` |
| This test is specific to Windows to test winapi_strerror | 1 | `test-debug-process.js` |
| Unhandled promise rejection (likely cause of mustCall failure): 42 | 1 | `test-promises-warning-on-unhandled-rejection.js` |
| Unhandled promise rejection (likely cause of mustCall failure): AssertionError: The input did not match the regular expr... | 1 | `test-directory-import.js` |
| Unhandled promise rejection (likely cause of mustCall failure): Error: Cannot find module '' | 1 | `test-vm-module-dynamic-namespace.js` |
| Unhandled promise rejection: AssertionError: Expected "actual" not to be reference-equal to "expected": | 1 | `test-blocklist-clone.js` |
| Unhandled promise rejection: AssertionError: Expected values to be strictly equal: | 1 | `test-domain-vm-promise-isolation.js` |
| Unhandled promise rejection: Symbol() | 1 | `test-promises-unhandled-symbol-rejections.js` |
| Unhandled promise rejection: reject! | 1 | `test-require-module-synchronous-rejection-handling.js` |
| Windows-only | 1 | `test-windows-failed-heap-allocation.js` |
| access: | 1 | `test-trace-events-fs-async.js` |
| b is not defined | 1 | `test-vm-not-strict.js` |
| boom | 1 | `test-domain-stack-empty-in-process-uncaughtexception.js` |
| cannot read property 'has' of undefined | 1 | `test-permission-worker-threads-cli.js` |
| cannot read property 'on' of null | 1 | `test-stdout-close-catch.js` |
| cannot read property 'onInit' of undefined | 1 | `test-promise-hook-exceptions.js` |
| cannot read property 'setEncoding' of undefined | 1 | `test-process-exec-argv.js` |
| cannot read property 'slice' of undefined | 1 | `test-bootstrap-modules.js` |
| cannot read property 'triggerId' of undefined | 1 | `test-async-hooks-promise.js` |
| cannot read property 'write' of null | 1 | `test-stdin-pipe-resume.js` |
| execSync is not supported in WebAssembly environment | 1 | `test-setproctitle.js` |
| expecting surrogate pair | 1 | `test-whatwg-url-custom-searchparams.js` |
| false == true | 1 | `test-force-repl-with-eval.js` |
| fs.FSWatcher was exposed but is neither on the supported list of the permission model nor on the ignore list. | 1 | `test-permission-fs-supported.js` |
| fs.sync.access: | 1 | `test-trace-events-fs-sync.js` |
| getter is not defined | 1 | `test-vm-create-context-accessors.js` |
| ifError got unwanted exception: spawnSync(/usr/local/bin/node) is not supported in WebAssembly environment | 1 | `test-bash-completion.js` |
| init | 1 | `test-async-hooks-fatal-error.js` |
| insufficient privileges | 1 | `test-require-symlink.js` |
| linux only | 1 | `test-strace-openat-openssl.js` |
| node compiled without FIPS OpenSSL. | 1 | `test-dsa-fips-invalid-key.js` |
| nonexistentFunc is not defined | 1 | `test-exception-handler2.js` |
| npm is not ready for this release and is going to print warnings to users: | 1 | `test-release-npm.js` |
| skipped due to memory requirements | 1 | `test-tick-processor-arguments.js` |
| stdout: <> | 1 | `test-promise-reject-callback-exception.js` |
| test is not defined | 1 | `test-vm-function-redefinition.js` |
| test is windows specific | 1 | `test-windows-abort-exitcode.js` |
| undefined !== URL | 1 | `test-whatwg-url-custom-tostringtag.js` |
| undefined == true | 1 | `test-listen-fd-cluster.js` |
| unexpected token in expression: '%' | 1 | `test-v8-flags.js` |
| v8.getHeapSnapshot is not supported in WASM environment | 1 | `test-v8-getheapsnapshot-twice.js` |
| whoops | 1 | `test-vm-proxy-failure-CP.js` |
| x is not defined | 1 | `test-vm-global-non-writable-properties.js` |

<details>
<summary>Full list of unevaluated tests with actual errors</summary>

- `es-module/test-cjs-esm-warn.js`: FAIL: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:123:19)     at runInlineEval (/home/node/test/com...
- `es-module/test-require-module-conditional-exports-module.js`: FAIL: Cannot find module 'import-module-require'     at localRequire (node:module:1283:59)     at <anonymous> (/home/node/test/es-module/test-require-module-conditional-exports-module.js:9:27)     at ...
- `es-module/test-require-module-dynamic-import-2.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at loadModule (node:module:1043:60)     at localRequire (node:module:1272:34)     at <anonymous> (/home/node/test/es-module/te...
- `es-module/test-require-module-error-catching.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'Unexpected string' -   message: 'hello'   }  AssertionError: Expected values to be strictly deep-equa...
- `es-module/test-require-module-errors.js`: FAIL: - stderr did not match expectation, checker throws: AssertionError: The input did not match the regular expression /var foo bar;/. Input:  "Error: expecting ';'\n" +   '    at /home/node/test/fi...
- `es-module/test-require-module-feature-detect.js`: FAIL: - stdout did not match 'true'     at <anonymous> (/home/node/test/es-module/test-require-module-feature-detect.js:9:20)     at loadModule (node:module:1088:32)     at localRequire (node:module:1...
- `es-module/test-require-module-preload.js`: FAIL: - process terminated with status 1, expected 0     at testPreload (/home/node/test/es-module/test-require-module-preload.js:51:7)     at <anonymous> (/home/node/test/es-module/test-require-modul...
- `es-module/test-require-module-retry-import-errored.js`: ERROR: Timeout (epoch deadline exceeded)
- `es-module/test-require-module-retry-import-evaluating.js`: ERROR: Timeout (epoch deadline exceeded)
- `es-module/test-require-module-synchronous-rejection-handling.js`: FAIL: Unhandled promise rejection: reject!
- `es-module/test-require-module-tla-retry-import-2.js`: FAIL: Unhandled promise rejection:     at mustNotCall (/home/node/test/common/index.js:531:23)     at apply (native)     at call (native)     at wrapped (node:async_hooks:143:53)     at _restoreContex...
- `es-module/test-require-module-tla-retry-import.js`: FAIL: Unhandled promise rejection:     at mustNotCall (/home/node/test/common/index.js:531:23)     at apply (native)     at call (native)     at wrapped (node:async_hooks:143:53)     at _restoreContex...
- `es-module/test-require-module-twice.js`: FAIL: Could not find export 'π' in module 'home/node/test/fixtures/es-modules/exports-cases.js'     at loadModule (node:module:1043:60)     at localRequire (node:module:1272:34)     at <anonymous> (/...
- `es-module/test-require-module-warning.js`: FAIL: - stderr did not match expectation, checker throws: AssertionError: The input did not match the regular expression /ExperimentalWarning: CommonJS module .*require-module\.js is loading ES Module...
- `es-module/test-require-node-modules-warning.js`: FAIL: - stderr did not match /Support for loading ES Module in require\(\)/     at <anonymous> (/home/node/test/es-module/test-require-node-modules-warning.js:19:14)     at loadModule (node:module:108...
- `es-module/test-vm-compile-function-lineoffset.js`: FAIL: Missing expected exception (RangeError). AssertionError: Missing expected exception (RangeError).     at <anonymous> (/home/node/test/es-module/test-vm-compile-function-lineoffset.js:15:3)     a...
- `es-module/test-vm-main-context-default-loader.js`: FAIL: Cannot convert undefined or null to object     at <anonymous> (/home/node/test/es-module/test-vm-main-context-default-loader.js:15:12)     at loadModule (node:module:1088:32)     at localRequire...
- `es-module/test-vm-source-text-module-leak.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at checkIfCollectableByCounting (/home/node/test/common/gc.js:40:13)     at <anonymous> (/home/node/test/es-module/test-vm-sou...
- `es-module/test-vm-synthetic-module-leak.js`: FAIL: Unhandled promise rejection:     at createSyntheticModule (/home/node/test/es-module/test-vm-synthetic-module-leak.js:11:17)     at checkIfCollectable (/home/node/test/common/gc.js:26:11)     at...
- `es-module/test-wasm-memory-out-of-bound.js`: FAIL: WebAssembly is not defined     at <anonymous> (/home/node/test/es-module/test-wasm-memory-out-of-bound.js:8:1)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)  ...
- `es-module/test-wasm-simple.js`: FAIL: WebAssembly is not defined     at <anonymous> (/home/node/test/es-module/test-wasm-simple.js:9:11)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTes...
- `es-module/test-wasm-web-api.js`: FAIL: WebAssembly is not defined     at <anonymous> (/home/node/test/es-module/test-wasm-web-api.js:11:20)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runT...
- `parallel/test-async-hooks-async-await.js`: FAIL: Unhandled promise rejection:     at <anonymous> (/home/node/test/parallel/test-async-hooks-async-await.js:23:22)     at apply (native)     at call (native)     at wrapped (node:async_hooks:143:5...
- `parallel/test-async-hooks-asyncresource-constructor.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-async-hooks-asyncresource-constructor.js:15:8)  ...
- `parallel/test-async-hooks-close-during-destroy.js`: FAIL: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (/home/node/test/parallel/test-async-hooks-close-during-destroy...
- `parallel/test-async-hooks-constructor.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-async-hooks-constructor.js:13:14)     at forEach...
- `parallel/test-async-hooks-correctly-switch-promise-hook.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   { -     after: true, -     before: true, -     init: true, -     promiseResolve: true, -     type: 'PROMISE' -   }, -...
- `parallel/test-async-hooks-enable-before-promise-resolve.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected "actual" to be strictly unequal to: 1     at <anonymous> (/home/node/test/parallel/test-async-hooks-enabl...
- `parallel/test-async-hooks-enable-disable-enable.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected "actual" to be strictly unequal to: 1     at main (/home/node/test/parallel/test-async-hooks-enable-disab...
- `parallel/test-async-hooks-fatal-error.js`: FAIL: init  0 !== 1  AssertionError: init  0 !== 1      at main (/home/node/test/parallel/test-async-hooks-fatal-error.js:49:26)     at <anonymous> (/home/node/test/parallel/test-async-hooks-fatal-err...
- `parallel/test-async-hooks-promise-enable-disable.js`: FAIL: Expected values to be strictly equal:  0 !== 2  AssertionError: Expected values to be strictly equal:  0 !== 2      at <anonymous> (/home/node/test/parallel/test-async-hooks-promise-enable-disab...
- `parallel/test-async-hooks-promise-triggerid.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly equal:  1 !== undefined      at <anonymous> (/home/node/test/parallel/test-async-ho...
- `parallel/test-async-hooks-promise.js`: FAIL: cannot read property 'triggerId' of undefined     at <anonymous> (/home/node/test/parallel/test-async-hooks-promise.js:28:20)     at loadModule (node:module:1088:32)     at localRequire (node:mo...
- `parallel/test-async-hooks-recursive-stack-runInAsyncScope.js`: FAIL: Expected values to be strictly equal:  2 !== 1  AssertionError: Expected values to be strictly equal:  2 !== 1      at <anonymous> (/home/node/test/parallel/test-async-hooks-recursive-stack-runI...
- `parallel/test-async-hooks-top-level-clearimmediate.js`: FAIL: Expected values to be strictly equal: + actual - expected  + Timeout { +   __idleTimeout: 0, +   __onTimeout: [Function: wrapped], +   _args: [], +   _bound: [Function: bound wrapped], +   _call...
- `parallel/test-async-local-storage-bind.js`: FAIL: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-async-local-storage-bind.js:8:10)     at forEach (native)     at <anonym...
- `parallel/test-async-local-storage-contexts.js`: FAIL: Unhandled promise rejection:     at <anonymous> (<input>:7:34)
- `parallel/test-async-local-storage-deep-stack.js`: ERROR: error while executing at wasm backtrace:     0: 0xe328bb - node_compat_runner.wasm!js_strict_eq2     1: 0xe6e91f - node_compat_runner.wasm!js_same_value_zero     2: 0xe90d33 - node_compat_runne...
- `parallel/test-async-local-storage-snapshot.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-async-local-storage-snapshot.js:9:70)     at apply (native)     at wrapper (/home/node/test/common/index.js:512:34)     at run (n...
- `parallel/test-async-wrap-constructor.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-async-wrap-constructor.js:13:12)     at loadModu...
- `parallel/test-async-wrap-pop-id-during-load.js`: ERROR: error while executing at wasm backtrace:     0: 0xe12c09 - node_compat_runner.wasm!JS_CallInternal     1: 0xe161ed - node_compat_runner.wasm!JS_CallInternal     2: 0xde7bee - node_compat_runner...
- `parallel/test-asyncresource-bind.js`: FAIL: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-asyncresource-bind.js:19:10)     at forEach (native)     at <anonymous> ...
- `parallel/test-atomics-wake.js`: FAIL: Atomics is not defined     at <anonymous> (/home/node/test/parallel/test-atomics-wake.js:7:20)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (n...
- `parallel/test-bash-completion.js`: FAIL: ifError got unwanted exception: spawnSync(/usr/local/bin/node) is not supported in WebAssembly environment AssertionError: ifError got unwanted exception: spawnSync(/usr/local/bin/node) is not s...
- `parallel/test-benchmark-cli.js`: FAIL: Cannot find module '../../benchmark/_cli.js' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/node/...
- `parallel/test-blocklist-clone.js`: FAIL: Unhandled promise rejection: AssertionError: Expected "actual" not to be reference-equal to "expected":  BlockList {   _rules: [     {       address: '123.123.123.123',       family: 'ipv4',    ...
- `parallel/test-bootstrap-modules.js`: FAIL: cannot read property 'slice' of undefined     at <anonymous> (/home/node/test/parallel/test-bootstrap-modules.js:1:62)     at loadModule (node:module:1088:32)     at localRequire (node:module:12...
- `parallel/test-c-ares.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'callback must be a function', -   code: 'ERR_INVALID_ARG_VALUE', -   message: "The argument 'rrtype' ...
- `parallel/test-cli-bad-options.js`: FAIL: Expected values to be strictly equal:  1 !== 9  AssertionError: Expected values to be strictly equal:  1 !== 9      at requiresArgument (/home/node/test/parallel/test-cli-bad-options.js:31:22)  ...
- `parallel/test-cli-node-options-docs.js`: FAIL: ENOENT: no such file or directory, open '/home/node/doc/api/cli.md'     at createSystemError (__wasm_rquickjs_builtin/internal/fs/shared:42:21)     at openSync (node:fs:1028:33)     at readFileS...
- `parallel/test-cli-node-options.js`: ERROR: error while executing at wasm backtrace:     0: 0xe12c09 - node_compat_runner.wasm!JS_CallInternal     1: 0xe161ed - node_compat_runner.wasm!JS_CallInternal     2: 0xe161ed - node_compat_runner...
- `parallel/test-cli-options-negation.js`: FAIL: The expression evaluated to a falsy value:    assert(proc.stderr.toString().includes('Buffer() is deprecated'))  AssertionError: The expression evaluated to a falsy value:    assert(proc.stderr....
- `parallel/test-cli-options-precedence.js`: FAIL: Expected values to be strictly equal:  '' !== '5678'  AssertionError: Expected values to be strictly equal:  '' !== '5678'      at <anonymous> (/home/node/test/parallel/test-cli-options-preceden...
- `parallel/test-cli-syntax-piped-bad.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-cli-syntax-piped-bad.js:26:19)     at forEach (native)     at <anonymous> (/home/node/test/parallel/test-cli-syntax-piped-bad.js:...
- `parallel/test-cli-syntax-piped-good.js`: FAIL: Expected values to be strictly equal: + actual - expected  + Buffer(0) [Uint8Array] [] - ''  AssertionError: Expected values to be strictly equal: + actual - expected  + Buffer(0) [Uint8Array] [...
- `parallel/test-common-expect-warning.js`: FAIL: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-common-expect...
- `parallel/test-common-must-not-call.js`: FAIL: The expression evaluated to a falsy value:    assert.ok(e.message.startsWith(prefix))  AssertionError: The expression evaluated to a falsy value:    assert.ok(e.message.startsWith(prefix))      ...
- `parallel/test-coverage-with-inspector-disabled.js`: FAIL: Expected values to be strictly equal:  false !== true  AssertionError: Expected values to be strictly equal:  false !== true      at <anonymous> (/home/node/test/parallel/test-coverage-with-insp...
- `parallel/test-cwd-enoent-preload.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-cwd-enoent-preload.js:29:18)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (no...
- `parallel/test-cwd-enoent-repl.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-cwd-enoent-repl.js:27:18)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (node-...
- `parallel/test-cwd-enoent.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-cwd-enoent.js:27:18)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (node-compa...
- `parallel/test-datetime-change-notify.js`: SKIP: Intl not present.
- `parallel/test-debug-process.js`: SKIP: This test is specific to Windows to test winapi_strerror
- `parallel/test-dgram-bind-socket-close-before-lookup.js`: FAIL: Unhandled promise rejection:     at mustNotCall (/home/node/test/common/index.js:531:23)     at apply (native)     at emit (node:events:332:36)     at apply (native)     at emit (node:domain:103...
- `parallel/test-dgram-ipv6only.js`: SKIP: no IPv6 support
- `parallel/test-dgram-send-cb-quelches-error.js`: ERROR: error while executing at wasm backtrace:     0: 0x635483 - node_compat_runner.wasm!<wasip2::imports::wasi::sockets::udp::IncomingDatagramStream as wasip2::imports::_rt::WasmResource>::drop::hf9...
- `parallel/test-dgram-udp6-link-local-address.js`: SKIP: no IPv6 support
- `parallel/test-dgram-udp6-send-default-host.js`: SKIP: no IPv6 support
- `parallel/test-diagnostics-channel-http.js`: FAIL: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-diagnostics-c...
- `parallel/test-diagnostics-channel-module-import-error.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   { -     name: 'start', -     parentUR...
- `parallel/test-diagnostics-channel-module-import.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   { -     name: 'start', -     parentUR...
- `parallel/test-diagnostics-channel-module-require-error.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   { -     id: 'does-not-exist', -     name: 'start', -     parentFilename: '/home/node/test/parallel/test-diagnostics-c...
- `parallel/test-diagnostics-channel-module-require.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   { -     id: 'http', -     name: 'start', -     parentFilename: '/home/node/test/parallel/test-diagnostics-channel-mod...
- `parallel/test-diagnostics-channel-net.js`: FAIL: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-diagnostics-c...
- `parallel/test-directory-import.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: The input did not match the regular expression /ERR_UNSUPPORTED_DIR_IMPORT/. Input:  "Error: Cannot find module '....
- `parallel/test-disable-proto-delete.js`: FAIL: Expected values to be strictly equal: + actual - expected  + null - undefined  AssertionError: Expected values to be strictly equal: + actual - expected  + null - undefined      at <anonymous> (...
- `parallel/test-disable-proto-throw.js`: FAIL: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-disable-proto-throw.js:12:8)     at loadModule (node:module:1088:32)    ...
- `parallel/test-domain-abort-on-uncaught.js`: FAIL: Test index 0 failed: Error: execSync is not supported in WebAssembly environment AssertionError: Test index 0 failed: Error: execSync is not supported in WebAssembly environment     at <anonymou...
- `parallel/test-domain-load-after-set-uncaught-exception-capture.js`: FAIL: Missing expected exception (Error). AssertionError: Missing expected exception (Error).     at <anonymous> (/home/node/test/parallel/test-domain-load-after-set-uncaught-exception-capture.js:8:3)...
- `parallel/test-domain-no-error-handler-abort-on-uncaught-0.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-domain-no-error-handler-abort-on-uncaught-0.js:17:10)     at loadModule (node:module:1088:32)     at localRequire (node:module:12...
- `parallel/test-domain-no-error-handler-abort-on-uncaught-1.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-domain-no-error-handler-abort-on-uncaught-1.js:20:10)     at loadModule (node:module:1088:32)     at localRequire (node:module:12...
- `parallel/test-domain-no-error-handler-abort-on-uncaught-2.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-domain-no-error-handler-abort-on-uncaught-2.js:19:10)     at loadModule (node:module:1088:32)     at localRequire (node:module:12...
- `parallel/test-domain-no-error-handler-abort-on-uncaught-3.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-domain-no-error-handler-abort-on-uncaught-3.js:19:10)     at loadModule (node:module:1088:32)     at localRequire (node:module:12...
- `parallel/test-domain-no-error-handler-abort-on-uncaught-4.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-domain-no-error-handler-abort-on-uncaught-4.js:19:10)     at loadModule (node:module:1088:32)     at localRequire (node:module:12...
- `parallel/test-domain-no-error-handler-abort-on-uncaught-5.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-domain-no-error-handler-abort-on-uncaught-5.js:20:10)     at loadModule (node:module:1088:32)     at localRequire (node:module:12...
- `parallel/test-domain-no-error-handler-abort-on-uncaught-6.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-domain-no-error-handler-abort-on-uncaught-6.js:25:10)     at loadModule (node:module:1088:32)     at localRequire (node:module:12...
- `parallel/test-domain-no-error-handler-abort-on-uncaught-7.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-domain-no-error-handler-abort-on-uncaught-7.js:25:10)     at loadModule (node:module:1088:32)     at localRequire (node:module:12...
- `parallel/test-domain-no-error-handler-abort-on-uncaught-8.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-domain-no-error-handler-abort-on-uncaught-8.js:25:10)     at loadModule (node:module:1088:32)     at localRequire (node:module:12...
- `parallel/test-domain-no-error-handler-abort-on-uncaught-9.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-domain-no-error-handler-abort-on-uncaught-9.js:26:10)     at loadModule (node:module:1088:32)     at localRequire (node:module:12...
- `parallel/test-domain-set-uncaught-exception-capture-after-load.js`: FAIL: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-domain-set-uncaught-exception-capture-after-load.js:12:3)     at loadMod...
- `parallel/test-domain-stack-empty-in-process-uncaughtexception.js`: FAIL: boom     at <anonymous> (/home/node/test/parallel/test-domain-stack-empty-in-process-uncaughtexception.js:24:13)     at apply (native)     at run (node:domain:167:29)     at <anonymous> (/home/n...
- `parallel/test-domain-vm-promise-isolation.js`: FAIL: Unhandled promise rejection: AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - Domain { -   _captureRejections: false, -   _disposed: false, -   _events: [...
- `parallel/test-dotenv-edge-cases.js`: FAIL: 10 test(s) failed     at finalize (node:test:641:29)     at runNext (node:test:688:16)     at <anonymous> (node:test:678:36)     at apply (native)     at call (native)     at wrapped (node:async...
- `parallel/test-dotenv-node-options.js`: FAIL: 2 test(s) failed     at finalize (node:test:641:29)     at runNext (node:test:688:16)     at <anonymous> (node:test:678:36)     at apply (native)     at call (native)     at wrapped (node:async_...
- `parallel/test-dotenv.js`: FAIL: Expected values to be strictly equal: + actual - expected  + undefined - 'basic'  AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - 'basic'      at <anonym...
- `parallel/test-double-tls-server.js`: ERROR: Timeout (tokio 60s deadline exceeded)
- `parallel/test-dsa-fips-invalid-key.js`: SKIP: node compiled without FIPS OpenSSL.
- `parallel/test-err-name-deprecation.js`: FAIL: process.binding is not supported in WASM environment     at binding (node:process:227:15)     at <anonymous> (/home/node/test/parallel/test-err-name-deprecation.js:16:9)     at loadModule (node:...
- `parallel/test-error-prepare-stack-trace.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'function'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'function'      ...
- `parallel/test-error-reporting.js`: ERROR: error while executing at wasm backtrace:     0: 0xf4ebe7 - node_compat_runner.wasm!abort     1: 0xf45886 - node_compat_runner.wasm!std::sys::pal::wasi::helpers::abort_internal::h55c751025c93bbd...
- `parallel/test-eval-disallow-code-generation-from-strings.js`: FAIL: Missing expected exception (EvalError). AssertionError: Missing expected exception (EvalError).     at <anonymous> (/home/node/test/parallel/test-eval-disallow-code-generation-from-strings.js:9:...
- `parallel/test-event-capture-rejections.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-event-capture-rejections.js:21:46)     at forEac...
- `parallel/test-eventemitter-asyncresource.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_THIS' - }  AssertionError: Expected values to be strictly deep-equal: + actu...
- `parallel/test-exception-handler2.js`: FAIL: nonexistentFunc is not defined     at <anonymous> (/home/node/test/parallel/test-exception-handler2.js:35:1)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)    ...
- `parallel/test-experimental-shared-value-conveyor.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'Error: not a function\n' + +   '    at <anonymous> (/home/node/test/parallel/test-experimental-shared-value-conveyor.js:11:19)\n' + ...
- `parallel/test-filehandle-readablestream.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (/home/node/test/parallel/test-filehandle-readablestream.js:21:34)
- `parallel/test-find-package-json.js`: FAIL: 9 test(s) failed     at finalize (node:test:641:29)     at runNext (node:test:688:16)     at <anonymous> (node:test:678:36)     at apply (native)     at call (native)     at wrapped (node:async_...
- `parallel/test-force-repl-with-eval.js`: FAIL: false == true AssertionError: false == true     at <anonymous> (/home/node/test/parallel/test-force-repl-with-eval.js:22:10)     at emit (node:events:332:36)     at emit (node:domain:103:32)    ...
- `parallel/test-force-repl.js`: FAIL: cannot read property 'end' of null     at <anonymous> (/home/node/test/parallel/test-force-repl.js:22:1)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at ...
- `parallel/test-gc-http-client-connaborted.js`: ERROR: Timeout (epoch deadline exceeded)
- `parallel/test-gc-net-timeout.js`: ERROR: Timeout (epoch deadline exceeded)
- `parallel/test-global-console-exists.js`: FAIL: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-global-console-exists.js:26:22) ...
- `parallel/test-global-customevent-disabled.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'function' - 'undefined'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'function' - 'undefined'      ...
- `parallel/test-global-setters.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'function'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'function'      ...
- `parallel/test-global-webcrypto-disbled.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'object' - 'undefined'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'object' - 'undefined'      at <...
- `parallel/test-global-webstreams.js`: FAIL: Expected values to be strictly equal: + actual - expected  + [class TextEncoderStream extends TransformStream] - undefined  AssertionError: Expected values to be strictly equal: + actual - expec...
- `parallel/test-global.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected  + Set(85) { +   'AbortController', +   'AbortSignal', +   'Blob', +   'Buffer', +   'ByteLengthQueuingStrategy', +   'CountQueuing...
- `parallel/test-icu-env.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-icu-env.js:28:29)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (node-compat-r...
- `parallel/test-icu-minimum-version.js`: FAIL: Cannot find module '/home/node/tools/icu/icu_versions.json' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymou...
- `parallel/test-internal-process-binding.js`: FAIL: The input did not match the regular expression /No such module/. Input:  'Error: process.binding is not supported in WASM environment'  AssertionError: The input did not match the regular expres...
- `parallel/test-intl-v8BreakIterator.js`: SKIP: missing Intl
- `parallel/test-intl.js`: SKIP: Intl tests because Intl object not present.
- `parallel/test-listen-fd-cluster.js`: FAIL: undefined == true AssertionError: undefined == true     at <anonymous> (/home/node/test/parallel/test-listen-fd-cluster.js:47:13)     at emit (node:events:332:36)     at emit (node:domain:103:32...
- `parallel/test-listen-fd-detached-inherit.js`: ERROR: Timeout (tokio 60s deadline exceeded)
- `parallel/test-listen-fd-detached.js`: ERROR: Timeout (tokio 60s deadline exceeded)
- `parallel/test-listen-fd-ebadf.js`: ERROR: Timeout (tokio 60s deadline exceeded)
- `parallel/test-listen-fd-server.js`: ERROR: Timeout (tokio 60s deadline exceeded)
- `parallel/test-macos-app-sandbox.js`: SKIP: App Sandbox is only available on Darwin
- `parallel/test-math-random.js`: FAIL: The expression evaluated to a falsy value:    assert(results.size > 1)  AssertionError: The expression evaluated to a falsy value:    assert(results.size > 1)      at <anonymous> (/home/node/tes...
- `parallel/test-memory-usage-emfile.js`: FAIL: EIO: input/output error, open '/home/node/test/parallel/test-memory-usage-emfile.js'     at createSystemError (__wasm_rquickjs_builtin/internal/fs/shared:42:21)     at openSync (node:fs:1028:33)...
- `parallel/test-messageevent-brandcheck.js`: FAIL: The error is expected to be an instance of "TypeError". Received "ReferenceError"  Error message:  MessageEvent is not defined AssertionError: The error is expected to be an instance of "TypeErr...
- `parallel/test-messageport-hasref.js`: FAIL: Expected values to be strictly equal: + actual - expected  + undefined - <ref *1> MessagePort { -   _target: MessagePort { -     _target: [Circular *1] -   } - }  AssertionError: Expected values...
- `parallel/test-microtask-queue-run-immediate.js`: FAIL: Expected values to be strictly equal:  1 !== 2  AssertionError: Expected values to be strictly equal:  1 !== 2      at <anonymous> (/home/node/test/parallel/test-microtask-queue-run-immediate.js...
- `parallel/test-microtask-queue-run.js`: FAIL: Expected values to be strictly equal:  1 !== 2  AssertionError: Expected values to be strictly equal:  1 !== 2      at <anonymous> (/home/node/test/parallel/test-microtask-queue-run.js:33:22)   ...
- `parallel/test-mime-whatwg.js`: FAIL: not a function     at test (/home/node/test/parallel/test-mime-whatwg.js:15:26)     at <anonymous> (/home/node/test/parallel/test-mime-whatwg.js:22:23)     at loadModule (node:module:1088:32)   ...
- `parallel/test-next-tick-errors.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    [     'A', -   'B',     'C'   ]  AssertionError: Expected values to be strictly deep-equal: + actual - expected    [     'A', - ...
- `parallel/test-node-run.js`: FAIL: 11 test(s) failed     at finalize (node:test:641:29)     at runNext (node:test:688:16)     at <anonymous> (node:test:678:36)     at apply (native)     at call (native)     at wrapped (node:async...
- `parallel/test-openssl-ca-options.js`: FAIL: Expected values to be strictly equal: + actual - expected  + '' - '/usr/local/bin/node: either --use-openssl-ca or --use-bundled-ca can be used, not both\n'  AssertionError: Expected values to b...
- `parallel/test-outgoing-message-pipe.js`: FAIL: Cannot find module '_http_outgoing'     at localRequire (node:module:1283:59)     at <anonymous> (/home/node/test/parallel/test-outgoing-message-pipe.js:4:25)     at loadModule (node:module:1088...
- `parallel/test-performance-eventlooputil.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-performance-eventlooputil.js:13:13)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runT...
- `parallel/test-performance-function-async.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-performance-function-async.js:35:29)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at run...
- `parallel/test-performance-global.js`: FAIL: Expected "actual" to be reference-equal to "expected": + actual - expected    { +   now: [Function: now], -   clearMarks: [Function: clearMarks], +   timeOrigin: 1.302333 -   clearMeasures: [Fun...
- `parallel/test-performance-nodetiming-uvmetricsinfo.js`: FAIL: Error: cannot read property 'loopCount' of undefined     at <anonymous> (/home/node/test/fixtures/test-nodetiming-uvmetricsinfo.js:18:22)     at loadModule (node:module:1088:32)     at localRequ...
- `parallel/test-performance-nodetiming.js`: FAIL: The expression evaluated to a falsy value:    assert.ok(nodeTiming.duration >= now)  AssertionError: The expression evaluated to a falsy value:    assert.ok(nodeTiming.duration >= now)      at <...
- `parallel/test-performance-resourcetimingbufferfull.js`: FAIL: Unhandled promise rejection:     at main (/home/node/test/parallel/test-performance-resourcetimingbufferfull.js:36:15)     at <anonymous> (/home/node/test/parallel/test-performance-resourcetimin...
- `parallel/test-performance-resourcetimingbuffersize.js`: FAIL: Unhandled promise rejection:     at main (/home/node/test/parallel/test-performance-resourcetimingbuffersize.js:43:45)     at <anonymous> (/home/node/test/parallel/test-performance-resourcetimin...
- `parallel/test-permission-allow-addons-cli.js`: FAIL: Cannot find module 'pkgexports/no-addons'     at localRequire (node:module:1283:59)     at <anonymous> (/home/node/test/parallel/test-permission-allow-addons-cli.js:19:15)     at loadModule (nod...
- `parallel/test-permission-dc-worker-threads.js`: FAIL: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-permission-dc-worker-threads.js:15:13)     at loadModule (node:module:10...
- `parallel/test-permission-fs-absolute-path.js`: FAIL: Expected values to be strictly equal:  '' !== 'true'  AssertionError: Expected values to be strictly equal:  '' !== 'true'      at <anonymous> (/home/node/test/parallel/test-permission-fs-absolu...
- `parallel/test-permission-fs-relative-path.js`: FAIL: Expected values to be strictly equal:  '' !== 'true'  AssertionError: Expected values to be strictly equal:  '' !== 'true'      at <anonymous> (/home/node/test/parallel/test-permission-fs-relati...
- `parallel/test-permission-fs-repeat-path.js`: FAIL: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-permission-fs-repeat-path.js:39:...
- `parallel/test-permission-fs-supported.js`: FAIL: fs.FSWatcher was exposed but is neither on the supported list of the permission model nor on the ignore list. AssertionError: fs.FSWatcher was exposed but is neither on the supported list of the...
- `parallel/test-permission-fs-symlink-relative.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'EEXIST', +   message: "EEXIST: file already exists, symlink 'a' -> '/home/node/test/parallel/test-permis...
- `parallel/test-permission-fs-write.js`: FAIL: Error: cannot read property 'has' of undefined     at <anonymous> (/home/node/test/fixtures/permission/fs-write.js:24:10)     at loadModule (node:module:1088:32)     at localRequire (node:module...
- `parallel/test-permission-no-addons.js`: FAIL: Cannot find module 'pkgexports/no-addons'     at localRequire (node:module:1283:59)     at <anonymous> (/home/node/test/parallel/test-permission-no-addons.js:19:15)     at loadModule (node:modul...
- `parallel/test-permission-processbinding.js`: FAIL: AssertionError: The validation function is expected to return "true". Received false  Caught error:  Error: process.binding is not supported in WASM environment     at <anonymous> (/home/node/te...
- `parallel/test-permission-warning-flags.js`: FAIL: The input did not match the regular expression /SecurityWarning: The flag --allow-addons must be used with extreme caution/. Input:  ''  AssertionError: The input did not match the regular expre...
- `parallel/test-permission-wasi.js`: FAIL: Cannot find module 'wasi'     at localRequire (node:module:1283:59)     at <anonymous> (/home/node/test/parallel/test-permission-wasi.js:7:18)     at loadModule (node:module:1088:32)     at loca...
- `parallel/test-permission-worker-threads-cli.js`: FAIL: cannot read property 'has' of undefined     at <anonymous> (/home/node/test/parallel/test-permission-worker-threads-cli.js:18:10)     at loadModule (node:module:1088:32)     at localRequire (nod...
- `parallel/test-pipe-abstract-socket-http.js`: SKIP: undefined
- `parallel/test-pipe-abstract-socket.js`: SKIP: undefined
- `parallel/test-preload-print-process-argv.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    [     '/usr/local/bin/node', +   'main.js' -   '/tmp/w/main.js'   ]  AssertionError: Expected values to be strictly deep-equal: ...
- `parallel/test-preload.js`: FAIL: cannot read property 'end' of null     at <anonymous> (/home/node/test/parallel/test-preload.js:86:1)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at run...
- `parallel/test-process-assert.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-process-assert.js:11:28)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (node-c...
- `parallel/test-process-binding-internalbinding-allowlist.js`: FAIL: process.binding is not supported in WASM environment     at binding (node:process:227:15)     at <anonymous> (/home/node/test/parallel/test-process-binding-internalbinding-allowlist.js:9:16)    ...
- `parallel/test-process-binding-util.js`: FAIL: process.binding is not supported in WASM environment     at binding (node:process:227:15)     at <anonymous> (/home/node/test/parallel/test-process-binding-util.js:6:29)     at loadModule (node:...
- `parallel/test-process-constants-noatime.js`: FAIL: The expression evaluated to a falsy value:    assert(!('O_NOATIME' in constants))  AssertionError: The expression evaluated to a falsy value:    assert(!('O_NOATIME' in constants))      at <anon...
- `parallel/test-process-env-allowed-flags-are-documented.js`: FAIL: ENOENT: no such file or directory, open '/home/node/doc/api/cli.md'     at createSystemError (__wasm_rquickjs_builtin/internal/fs/shared:42:21)     at openSync (node:fs:1028:33)     at readFileS...
- `parallel/test-process-env-tz.js`: FAIL: The input did not match the regular expression /^Sat Apr 14 2018 14:34:56 GMT\+0200 \(.+\)$/. Input:  'Sat Apr 14 2018 12:34:56 GMT+0000'  AssertionError: The input did not match the regular exp...
- `parallel/test-process-exception-capture-should-abort-on-uncaught-setflagsfromstring.js`: FAIL: foo     at <anonymous> (/home/node/test/parallel/test-process-exception-capture-should-abort-on-uncaught-setflagsfromstring.js:13:11)     at loadModule (node:module:1088:32)     at localRequire ...
- `parallel/test-process-exception-capture-should-abort-on-uncaught.js`: FAIL: foo     at <anonymous> (/home/node/test/parallel/test-process-exception-capture-should-abort-on-uncaught.js:12:11)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:3...
- `parallel/test-process-exception-capture.js`: FAIL: foo     at <anonymous> (/home/node/test/parallel/test-process-exception-capture.js:13:11)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (node-c...
- `parallel/test-process-exec-argv.js`: FAIL: cannot read property 'setEncoding' of undefined     at <anonymous> (/home/node/test/parallel/test-process-exec-argv.js:55:7)     at loadModule (node:module:1088:32)     at localRequire (node:mod...
- `parallel/test-process-execpath.js`: FAIL: Expected values to be strictly equal: + actual - expected  + '' - '/usr/local/bin/node\n'  AssertionError: Expected values to be strictly equal: + actual - expected  + '' - '/usr/local/bin/node\...
- `parallel/test-process-exit-code-validation.js`: FAIL: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-process-exit-code-validation.js:114:53)     at loadModule (node:module:1...
- `parallel/test-process-exit-code.js`: FAIL: Cannot find module '../common/process-exit-code-cases' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/...
- `parallel/test-process-external-stdio-close-spawn.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-process-external-stdio-close-spawn.js:29:16)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)   ...
- `parallel/test-process-external-stdio-close.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-process-external-stdio-close.js:24:16)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at r...
- `parallel/test-process-getactivehandles.js`: ERROR: Timeout (tokio 60s deadline exceeded)
- `parallel/test-process-getactiverequests.js`: FAIL: Expected values to be strictly equal:  0 !== 12  AssertionError: Expected values to be strictly equal:  0 !== 12      at <anonymous> (/home/node/test/parallel/test-process-getactiverequests.js:1...
- `parallel/test-process-getactiveresources-track-active-handles.js`: ERROR: Timeout (tokio 60s deadline exceeded)
- `parallel/test-process-getactiveresources-track-active-requests.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-process-getactiveresources-track-active-requests.js:11:28)     at loadModule (node:module:1088:32)     at localRequire (node:modu...
- `parallel/test-process-getactiveresources-track-interval-lifetime.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-process-getactiveresources-track-interval-lifetime.js:7:28)     at loadModule (node:module:1088:32)     at localRequire (node:mod...
- `parallel/test-process-getactiveresources-track-multiple-timers.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-process-getactiveresources-track-multiple-timers.js:12:28)     at loadModule (node:module:1088:32)     at localRequire (node:modu...
- `parallel/test-process-getactiveresources.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-process-getactiveresources.js:9:32)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runT...
- `parallel/test-process-kill-null.js`: FAIL: process.kill is not supported in WASI environment     at _makeError (node:process:47:19)     at kill (node:process:566:15)     at <anonymous> (/home/node/test/parallel/test-process-kill-null.js:...
- `parallel/test-process-load-env-file.js`: FAIL: 6 test(s) failed     at finalize (node:test:641:29)     at runNext (node:test:688:16)     at <anonymous> (node:test:678:36)     at apply (native)     at call (native)     at wrapped (node:async_...
- `parallel/test-process-ppid.js`: FAIL: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-process-ppid.js:14:47)     at lo...
- `parallel/test-process-raw-debug.js`: FAIL: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at parent (/home/node/test/parallel/test-process-raw-debug....
- `parallel/test-process-really-exit.js`: FAIL: Expected values to be strictly equal: + actual - expected  + '' - 'really exited'  AssertionError: Expected values to be strictly equal: + actual - expected  + '' - 'really exited'      at <anon...
- `parallel/test-process-ref-unref.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-process-ref-unref.js:42:17)     at call (native)     at runTest (node:test:498:32)     at runNext (node:test:658:34)     at execu...
- `parallel/test-process-title-cli.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'wasm-rquickjs' - 'foo'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'wasm-rquickjs' - 'foo'      at...
- `parallel/test-process-versions.js`: FAIL: Cannot find module '../../deps/acorn/acorn/package.json' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> ...
- `parallel/test-promise-handled-rejection-no-warning.js`: FAIL: Unhandled promise rejection:     at <anonymous> (/home/node/test/parallel/test-promise-handled-rejection-no-warning.js:7:20)     at loadModule (node:module:1088:32)     at localRequire (node:mod...
- `parallel/test-promise-hook-create-hook.js`: FAIL: The input did not match the regular expression /The "initHook" argument must be of type function/. Input:  "TypeError: cannot read property 'createHook' of undefined"  AssertionError: The input ...
- `parallel/test-promise-hook-exceptions.js`: FAIL: cannot read property 'onInit' of undefined     at testHook (/home/node/test/parallel/test-promise-hook-exceptions.js:8:1)     at <anonymous> (/home/node/test/parallel/test-promise-hook-exception...
- `parallel/test-promise-hook-on-after.js`: FAIL: The input did not match the regular expression /The "afterHook" argument must be of type function/. Input:  "TypeError: cannot read property 'onAfter' of undefined"  AssertionError: The input di...
- `parallel/test-promise-hook-on-before.js`: FAIL: The input did not match the regular expression /The "beforeHook" argument must be of type function/. Input:  "TypeError: cannot read property 'onBefore' of undefined"  AssertionError: The input ...
- `parallel/test-promise-hook-on-init.js`: FAIL: The input did not match the regular expression /The "initHook" argument must be of type function/. Input:  "TypeError: cannot read property 'onInit' of undefined"  AssertionError: The input did ...
- `parallel/test-promise-hook-on-resolve.js`: FAIL: The input did not match the regular expression /The "settledHook" argument must be of type function/. Input:  "TypeError: cannot read property 'onSettled' of undefined"  AssertionError: The inpu...
- `parallel/test-promise-reject-callback-exception.js`: FAIL: stdout: <> AssertionError: stdout: <>     at <anonymous> (/home/node/test/parallel/test-promise-reject-callback-exception.js:28:11)     at loadModule (node:module:1088:32)     at localRequire (n...
- `parallel/test-promise-unhandled-flag.js`: ERROR: error while executing at wasm backtrace:     0: 0xe10d9c - node_compat_runner.wasm!get_proxy_method     1: 0xea13bc - node_compat_runner.wasm!js_proxy_get     2: 0xe0895f - node_compat_runner.w...
- `parallel/test-promise-unhandled-silent-no-hook.js`: FAIL: Unhandled promise rejection:     at <anonymous> (/home/node/test/parallel/test-promise-unhandled-silent-no-hook.js:11:13)     at Promise (native)     at <anonymous> (/home/node/test/parallel/tes...
- `parallel/test-promise-unhandled-silent.js`: FAIL: Unhandled promise rejection:     at <anonymous> (/home/node/test/parallel/test-promise-unhandled-silent.js:10:13)     at Promise (native)     at <anonymous> (/home/node/test/parallel/test-promis...
- `parallel/test-promise-unhandled-warn-no-hook.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (/home/node/test/parallel/test-promise-unhandled-warn-no-hook.js:9:13)     at Promise (native)     at <anonymou...
- `parallel/test-promise-unhandled-warn.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (/home/node/test/parallel/test-promise-unhandled-warn.js:11:13)     at Promise (native)     at <anonymous> (/ho...
- `parallel/test-promises-unhandled-proxy-rejections.js`: FAIL: Error from proxy     at throwErr (/home/node/test/parallel/test-promises-unhandled-proxy-rejections.js:6:13)     at runTest (node-compat-runner:175:37)
- `parallel/test-promises-unhandled-rejections.js`: ERROR: Timeout (epoch deadline exceeded)
- `parallel/test-promises-unhandled-symbol-rejections.js`: FAIL: Unhandled promise rejection: Symbol()
- `parallel/test-promises-warning-on-unhandled-rejection.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): 42
- `parallel/test-punycode.js`: FAIL: Cannot find module 'punycode'     at localRequire (node:module:1283:59)     at <anonymous> (/home/node/test/parallel/test-punycode.js:32:18)     at loadModule (node:module:1088:32)     at localR...
- `parallel/test-queue-microtask-uncaught-asynchooks.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   'init', -   'after', -   'before', -   'destroy' - ]  AssertionError: Expected values to be strictly deep-equal: + ac...
- `parallel/test-readline-async-iterators-backpressure.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (node:readline:4:33)
- `parallel/test-readline-async-iterators-destroy.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (node:readline:4:33)
- `parallel/test-readline-async-iterators.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (node:readline:4:33)
- `parallel/test-readline-carriage-return-between-chunks.js`: FAIL: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-readline-input-onerror.js`: FAIL: Unhandled promise rejection:     at <anonymous> (node:readline:4:33)
- `parallel/test-readline-interface-escapecodetimeout.js`: FAIL: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-readline-keys.js`: FAIL: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-readline-reopen.js`: FAIL: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-readline-set-raw-mode.js`: FAIL: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-readline-undefined-columns.js`: FAIL: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-release-npm.js`: FAIL: npm is not ready for this release and is going to print warnings to users: Error: Cannot find module '/home/node/deps/npm/bin/npm-cli.js' from '/'     at resolveFilename (node:module:602:80)    ...
- `parallel/test-require-delete-array-iterator.js`: FAIL: Cannot find module '../common/fixtures' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/node/test/...
- `parallel/test-require-dot.js`: FAIL: Cannot find module '.'     at localRequire (node:module:1283:59)     at <anonymous> (/home/node/test/fixtures/module-require/relative/dot.js:1:79)     at loadModule (node:module:1088:32)     at ...
- `parallel/test-require-exceptions.js`: FAIL: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-require-exceptions.js:34:8)     at loadModule (node:module:1088:32)     ...
- `parallel/test-require-extensions-main.js`: FAIL: Cannot find module '../' from '/home/node/test/fixtures/require-bin/bin'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/node/test...
- `parallel/test-require-extensions-same-filename-as-dir-trailing-slash.js`: FAIL: Expected "actual" to be strictly unequal to:  'artischocko' AssertionError: Expected "actual" to be strictly unequal to:  'artischocko'     at <anonymous> (/home/node/test/parallel/test-require-...
- `parallel/test-require-extensions-same-filename-as-dir.js`: FAIL: Expected "actual" to be strictly unequal to:  'artischocko' AssertionError: Expected "actual" to be strictly unequal to:  'artischocko'     at <anonymous> (/home/node/test/parallel/test-require-...
- `parallel/test-require-json.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "Cannot parse JSON module '/home/node/test/fixtures/invalid.json': Expected ',' or '}' after property ...
- `parallel/test-require-long-path.js`: SKIP: this test is Windows-specific.
- `parallel/test-require-mjs.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison {     code: 'ERR_REQUIRE_ESM', +   message: 'require() of ES Module /home/node/test/fixtures/es-modules/test-esm-ok.m...
- `parallel/test-require-symlink.js`: SKIP: insufficient privileges
- `parallel/test-require-unicode.js`: FAIL: Cannot find module '/tmp/w/中文目录' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/node/test...
- `parallel/test-resource-usage.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-resource-usage.js:5:24)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (node-co...
- `parallel/test-runner-exit-code.js`: FAIL: The input did not match the regular expression /tests 3/. Input:  ''  AssertionError: The input did not match the regular expression /tests 3/. Input:  ''      at <anonymous> (/home/node/test/pa...
- `parallel/test-runner-force-exit-failure.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'Error: fails\n' + +   '    at <anonymous> (/home/node/test/fixtures/test-runner/throws_sync_and_async.js:9:13)\n' + +   '    at call...
- `parallel/test-runner-import-no-scheme.js`: FAIL: Expected values to be strictly equal: + actual - expected  + '<ref *1> [Function: test] {\n' + +   '  skip: [Function (anonymous)],\n' + +   '  todo: [Function (anonymous)],\n' + +   '  only: [F...
- `parallel/test-runner-mock-timers-date.js`: FAIL: 9 test(s) failed     at finalize (node:test:641:29)     at runNext (node:test:688:16)     at executeSuite (node:test:691:25)     at runSuite (node:test:595:64)     at describe (node:test:799:29)...
- `parallel/test-runner-mock-timers-scheduler.js`: FAIL: 7 test(s) failed     at finalize (node:test:641:29)     at runNext (node:test:688:16)     at <anonymous> (node:test:678:36)     at apply (native)     at call (native)     at wrapped (node:async_...
- `parallel/test-runner-reporters.js`: FAIL: The input did not match the regular expression /TAP version 13/. Input:  ''  AssertionError: The input did not match the regular expression /TAP version 13/. Input:  ''      at <anonymous> (/hom...
- `parallel/test-runner-root-duration.js`: FAIL: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:123:19)     at runInlineEval (/home/node/test/com...
- `parallel/test-security-revert-unknown.js`: FAIL: Expected values to be strictly equal:  null !== 12  AssertionError: Expected values to be strictly equal:  null !== 12      at <anonymous> (/home/node/test/parallel/test-security-revert-unknown....
- `parallel/test-setproctitle.js`: FAIL: execSync is not supported in WebAssembly environment     at createNotSupportedError (node:child_process:18:34)     at execSync (node:child_process:1431:11)     at <anonymous> (/home/node/test/pa...
- `parallel/test-shadow-realm-allowed-builtin-modules.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at main (/home/node/test/parallel/test-shadow-realm-allowed-builtin-modules.js:8:21)     at <anonymous> (/home/node/test/paral...
- `parallel/test-shadow-realm-custom-loaders.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at parseInlineEvalArgs (/home/node/test/common/index.js:123:19)     at runInlineEval (/home/node/test/common/index.js:205:38) ...
- `parallel/test-shadow-realm-gc-module.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (/home/node/test/parallel/test-shadow-realm-gc-module.js:16:21)     at runAndBreathe (/home/node/test/common/gc...
- `parallel/test-shadow-realm-gc.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (/home/node/test/parallel/test-shadow-realm-gc.js:14:21)     at runAndBreathe (/home/node/test/common/gc.js:33:...
- `parallel/test-shadow-realm-globals.js`: FAIL: ShadowRealm is not defined     at <anonymous> (/home/node/test/parallel/test-shadow-realm-globals.js:9:25)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     a...
- `parallel/test-shadow-realm-import-value-resolve.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at main (/home/node/test/parallel/test-shadow-realm-import-value-resolve.js:13:21)     at <anonymous> (/home/node/test/paralle...
- `parallel/test-shadow-realm-module.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at main (/home/node/test/parallel/test-shadow-realm-module.js:8:21)     at <anonymous> (/home/node/test/parallel/test-shadow-r...
- `parallel/test-shadow-realm.js`: FAIL: ShadowRealm is not defined     at <anonymous> (/home/node/test/parallel/test-shadow-realm.js:8:25)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTes...
- `parallel/test-sigint-infinite-loop.js`: ERROR: Timeout (epoch deadline exceeded)
- `parallel/test-signal-args.js`: FAIL: process.kill is not supported in WASI environment     at _makeError (node:process:47:19)     at kill (node:process:566:15)     at <anonymous> (/home/node/test/parallel/test-signal-args.js:20:14)...
- `parallel/test-signal-handler.js`: ERROR: Timeout (epoch deadline exceeded)
- `parallel/test-signal-unregister.js`: ERROR: Timeout (epoch deadline exceeded)
- `parallel/test-socket-address.js`: ERROR: Timeout (tokio 60s deadline exceeded)
- `parallel/test-socket-options-invalid.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-socket-options-invalid.js:24:20)     at forEach ...
- `parallel/test-socket-writes-before-passed-to-tls-socket.js`: ERROR: Timeout (tokio 60s deadline exceeded)
- `parallel/test-source-map-cjs-require-cache.js`: FAIL: not a function     at run (/home/node/test/parallel/test-source-map-cjs-require-cache.js:25:39)     at <anonymous> (/home/node/test/parallel/test-source-map-cjs-require-cache.js:29:5)     at loa...
- `parallel/test-spawn-cmd-named-pipe.js`: SKIP: this test is Windows-specific.
- `parallel/test-stack-size-limit.js`: ERROR: error while executing at wasm backtrace:     0: 0xe12c09 - node_compat_runner.wasm!JS_CallInternal     1: 0xe161ed - node_compat_runner.wasm!JS_CallInternal     2: 0xe161ed - node_compat_runner...
- `parallel/test-stdin-from-file-spawn.js`: SKIP: This is test exists only on Linux/Win32/macOS
- `parallel/test-stdin-pipe-large.js`: FAIL: cannot read property 'end' of null     at <anonymous> (/home/node/test/parallel/test-stdin-pipe-large.js:18:1)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)  ...
- `parallel/test-stdin-pipe-resume.js`: FAIL: cannot read property 'write' of null     at <anonymous> (/home/node/test/parallel/test-stdin-pipe-resume.js:20:3)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34...
- `parallel/test-stdin-script-child-option.js`: FAIL: cannot read property 'end' of null     at <anonymous> (/home/node/test/parallel/test-stdin-script-child-option.js:10:1)     at loadModule (node:module:1088:32)     at localRequire (node:module:1...
- `parallel/test-stdio-undestroy.js`: FAIL: mustCall verification failed: mustCallAtLeast: expected at least 1 calls, got 0     at mustCallAtLeast (/home/node/test/common/index.js:521:28)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-stdout-close-catch.js`: FAIL: cannot read property 'on' of null     at <anonymous> (/home/node/test/parallel/test-stdout-close-catch.js:15:1)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34) ...
- `parallel/test-stdout-close-unref.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-stdout-close-unref.js:38:18)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (no...
- `parallel/test-stdout-pipeline-destroy.js`: FAIL: The "body" argument must be of type function or an instance of Blob, Stream, Iterable, AsyncIterable, or Promise or { readable, writable } pair. Received an instance of Object     at ERR_INVALID...
- `parallel/test-strace-openat-openssl.js`: SKIP: linux only
- `parallel/test-structuredClone-global.js`: FAIL: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-structuredClone-global.js:12:8)     at loadModule (node:module:1088:32) ...
- `parallel/test-sync-io-option.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly equal:  undefined !== ''      at <anonymous> (/home/node/test/parallel/test-sync-io...
- `parallel/test-tick-processor-arguments.js`: SKIP: skipped due to memory requirements
- `parallel/test-tojson-perf_hooks.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'object'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'object'      at <...
- `parallel/test-trace-atomic-deprecation.js`: FAIL: Only --eval/-e, --input-type, and script files are supported in WASM child emulation     at parseInlineEvalArgs (/home/node/test/common/index.js:123:19)     at runInlineEval (/home/node/test/com...
- `parallel/test-trace-atomics-wait.js`: FAIL: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-trace-atomics-wait.js:32:20)    ...
- `parallel/test-trace-env-stack.js`: FAIL: - stderr did not match /internal\/process\/pre_execution/     at <anonymous> (/home/node/test/parallel/test-trace-env-stack.js:25:72)     at loadModule (node:module:1088:32)     at localRequire ...
- `parallel/test-trace-env.js`: FAIL: - stderr did not match expectation, checker throws: AssertionError: The input did not match the regular expression /get "NODE_EXTRA_CA_CERTS"/. Input:  ''      at stderr (/home/node/test/paralle...
- `parallel/test-trace-events-async-hooks-dynamic.js`: FAIL: The expression evaluated to a falsy value:    assert(fs.existsSync(filename))  AssertionError: The expression evaluated to a falsy value:    assert(fs.existsSync(filename))      at <anonymous> (...
- `parallel/test-trace-events-async-hooks-worker.js`: FAIL: Expected values to be strictly equal:  1 !== 0  AssertionError: Expected values to be strictly equal:  1 !== 0      at <anonymous> (/home/node/test/parallel/test-trace-events-async-hooks-worker....
- `parallel/test-trace-events-console.js`: FAIL: Unhandled promise rejection: AssertionError: false == true     at <anonymous> (/home/node/test/parallel/test-trace-events-console.js:49:26)     at wrapper (/home/node/test/common/index.js:512:34...
- `parallel/test-trace-events-environment.js`: FAIL: Unhandled promise rejection: AssertionError: false == true     at <anonymous> (/home/node/test/parallel/test-trace-events-environment.js:47:26)     at wrapper (/home/node/test/common/index.js:51...
- `parallel/test-trace-events-fs-async.js`: FAIL: access: {   pid: 1,   output: [     null,     '',     "Error: Cannot find module '/tmp/w/node.fs_dir.async,node.fs.async' from '/'\n" +       '    at resolveFilename (node:module:602:80)\n' +   ...
- `parallel/test-trace-events-fs-sync.js`: FAIL: fs.sync.access: {   pid: 1,   output: [     null,     '',     "Error: Cannot find module '/tmp/w/node.fs.sync' from '/'\n" +       '    at resolveFilename (node:module:602:80)\n' +       '    at...
- `parallel/test-trace-events-net-abstract-socket.js`: SKIP: undefined
- `parallel/test-trace-events-threadpool.js`: FAIL: The expression evaluated to a falsy value:    assert(fs.existsSync(FILE_NAME))  AssertionError: The expression evaluated to a falsy value:    assert(fs.existsSync(FILE_NAME))      at <anonymous>...
- `parallel/test-trace-exit-stack-limit.js`: FAIL: - stderr did not match expectation, checker throws: AssertionError: Expected values to be strictly equal:  0 !== 30      at stderr (/home/node/test/parallel/test-trace-exit-stack-limit.js:22:26)...
- `parallel/test-trace-exit.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly equal:  undefined !== ''      at <anonymous> (/home/node/test/parallel/test-trace-e...
- `parallel/test-tracing-no-crash.js`: FAIL: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-tracing-no-cr...
- `parallel/test-tty-stdin-end.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-tty-stdin-end.js:7:15)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (node-com...
- `parallel/test-tty-stdin-pipe.js`: FAIL: readline is not yet supported in WebAssembly environment     at <anonymous> (node:readline:4:33)
- `parallel/test-ttywrap-stack.js`: ERROR: error while executing at wasm backtrace:     0: 0xe096bd - node_compat_runner.wasm!shape_initial_hash     1: 0xe08d8c - node_compat_runner.wasm!find_hashed_shape_proto     2: 0xdec791 - node_co...
- `parallel/test-tz-version.js`: SKIP: missing Intl
- `parallel/test-unhandled-exception-rethrow-error.js`: FAIL: Expected values to be strictly equal:  1 !== 7  AssertionError: Expected values to be strictly equal:  1 !== 7      at <anonymous> (/home/node/test/parallel/test-unhandled-exception-rethrow-erro...
- `parallel/test-unhandled-exception-with-worker-inuse.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-unhandled-exception-with-worker-inuse.js:31:37)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)...
- `parallel/test-v8-collect-gc-profile-in-worker.js`: FAIL: Cannot find module '../common/v8' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/node/test/parall...
- `parallel/test-v8-collect-gc-profile.js`: FAIL: Cannot find module '../common/v8' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/node/test/parall...
- `parallel/test-v8-deserialize-buffer.js`: FAIL: v8.serialize is not supported in WASM environment     at serialize (node:v8:116:15)     at <anonymous> (/home/node/test/parallel/test-v8-deserialize-buffer.js:7:36)     at loadModule (node:modul...
- `parallel/test-v8-flag-type-check.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'The "flags" argument must be of type string', -   code: 'ERR_INVALID_ARG_TYPE', -   message: 'The "fl...
- `parallel/test-v8-flags.js`: FAIL: unexpected token in expression: '%'     at <input>:1:1     at <anonymous> (/home/node/test/parallel/test-v8-flags.js:11:8)     at loadModule (node:module:1088:32)     at localRequire (node:modul...
- `parallel/test-v8-getheapsnapshot-twice.js`: FAIL: v8.getHeapSnapshot is not supported in WASM environment     at getHeapSnapshot (node:v8:65:15)     at <anonymous> (/home/node/test/parallel/test-v8-getheapsnapshot-twice.js:8:4)     at loadModul...
- `parallel/test-v8-serialize-leak.js`: FAIL: v8.serialize is not supported in WASM environment     at serialize (node:v8:116:15)     at <anonymous> (/home/node/test/parallel/test-v8-serialize-leak.js:16:6)     at loadModule (node:module:10...
- `parallel/test-v8-startup-snapshot-api.js`: FAIL: Cannot convert undefined or null to object     at <anonymous> (/home/node/test/parallel/test-v8-startup-snapshot-api.js:4:16)     at loadModule (node:module:1088:32)     at localRequire (node:mo...
- `parallel/test-v8-stats.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected  + [] - [ -   'code_large_object_space', -   'code_space', -   'large_object_space', -   'new_large_object_space', -   'new_space',...
- `parallel/test-v8-version-tag.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-v8-version-tag.js:6:24)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest (node-co...
- `parallel/test-vfs.js`: FAIL: Cannot find module '/usr/local/bin/node/file.js' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/n...
- `parallel/test-vm-access-process-env.js`: FAIL: Expected "actual" to be strictly unequal to:  undefined AssertionError: Expected "actual" to be strictly unequal to:  undefined     at <anonymous> (/home/node/test/parallel/test-vm-access-proces...
- `parallel/test-vm-attributes-property-not-on-sandbox.js`: FAIL: cannot read property 'get' of undefined     at <anonymous> (/home/node/test/parallel/test-vm-attributes-property-not-on-sandbox.js:18:20)     at loadModule (node:module:1088:32)     at localRequ...
- `parallel/test-vm-cached-data.js`: FAIL: Error: invalid redefinition of parameter name     at <input>:6:5     at Function (native)     at executeInlineSource (node:child_process:401:74)     at runInline (node:child_process:687:52)     ...
- `parallel/test-vm-context-property-forwarding.js`: FAIL: Expected values to be strictly equal:  undefined !== 4  AssertionError: Expected values to be strictly equal:  undefined !== 4      at <anonymous> (/home/node/test/parallel/test-vm-context-prope...
- `parallel/test-vm-context.js`: FAIL: Expected values to be strictly equal:  'bar' !== 3  AssertionError: Expected values to be strictly equal:  'bar' !== 3      at <anonymous> (/home/node/test/parallel/test-vm-context.js:42:20)    ...
- `parallel/test-vm-create-and-run-in-context.js`: FAIL: Expected values to be strictly equal:  'bar' !== 3  AssertionError: Expected values to be strictly equal:  'bar' !== 3      at <anonymous> (/home/node/test/parallel/test-vm-create-and-run-in-con...
- `parallel/test-vm-create-context-accessors.js`: FAIL: getter is not defined     at <anonymous> (eval_script:1:19)     at <eval> (eval_script:1:59)     at runInContext (__wasm_rquickjs_builtin/vm:260:54)     at <anonymous> (/home/node/test/parallel/...
- `parallel/test-vm-create-context-arg.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { -   code: 'ERR_INVALID_ARG_TYPE',     name: 'TypeError'   }  AssertionError: Expected values to be strictly deep-eq...
- `parallel/test-vm-createcacheddata.js`: FAIL: The expression evaluated to a falsy value:    assert(cachedData instanceof Buffer)  AssertionError: The expression evaluated to a falsy value:    assert(cachedData instanceof Buffer)      at <an...
- `parallel/test-vm-dynamic-import-callback-missing-flag.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Missing expected rejection.      at rejects (native)
- `parallel/test-vm-function-declaration.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'function'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'function'      ...
- `parallel/test-vm-function-redefinition.js`: FAIL: test is not defined     at <anonymous> (eval_script:1:19)     at <eval> (eval_script:1:57)     at runInContext (__wasm_rquickjs_builtin/vm:260:54)     at <anonymous> (/home/node/test/parallel/te...
- `parallel/test-vm-getters.js`: FAIL: Cannot convert undefined or null to object     at keys (native)     at <anonymous> (/home/node/test/parallel/test-vm-getters.js:21:36)     at loadModule (node:module:1088:32)     at localRequire...
- `parallel/test-vm-global-define-property.js`: FAIL: Expected values to be strictly equal:  undefined !== {}  AssertionError: Expected values to be strictly equal:  undefined !== {}      at <anonymous> (/home/node/test/parallel/test-vm-global-defi...
- `parallel/test-vm-global-identity.js`: FAIL: Expected "actual" to be reference-equal to "expected": + actual - expected  + Object [global] { - <ref *1> { +   performance: { -   [Symbol(vm.context)]: 1, +     now: [Function: now], -   windo...
- `parallel/test-vm-global-non-writable-properties.js`: FAIL: x is not defined     at <anonymous> (eval_script:1:19)     at <eval> (eval_script:1:54)     at runInContext (__wasm_rquickjs_builtin/vm:260:54)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-vm-global-property-enumerator.js`: FAIL: Case 0 failed: Object.keys + actual - expected    [     '1', +   'performance',     'key'   ]  AssertionError: Case 0 failed: Object.keys + actual - expected    [     '1', +   'performance',    ...
- `parallel/test-vm-global-property-interceptors.js`: FAIL: Expected values to be loosely deep-equal:  {   a: {     configurable: true,     enumerable: true,     value: 'a',     writable: true   },   b: undefined,   c: {     configurable: true,     enume...
- `parallel/test-vm-global-property-prototype.js`: FAIL: Expected values to be loosely deep-equal:  {   resultDesc: {     bothProto: undefined,     bothProtoGetter: undefined,     bothProtoIndexed: undefined,     onInnerProto: undefined,     onInnerPr...
- `parallel/test-vm-global-setter.js`: FAIL: cannot read property 'get' of undefined     at <anonymous> (/home/node/test/parallel/test-vm-global-setter.js:17:20)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272...
- `parallel/test-vm-harmony-symbols.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'function'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'function'      ...
- `parallel/test-vm-indexed-properties.js`: FAIL: Expected values to be strictly equal:  undefined !== 20  AssertionError: Expected values to be strictly equal:  undefined !== 20      at <anonymous> (/home/node/test/parallel/test-vm-indexed-pro...
- `parallel/test-vm-inherited_properties.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    [     'z', -   'x'   ]  AssertionError: Expected values to be strictly deep-equal: + actual - expected    [     'z', -   'x'   ]...
- `parallel/test-vm-is-context.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-vm-is-context.js:30:10)     at loadModule (node:...
- `parallel/test-vm-low-stack-space.js`: ERROR: error while executing at wasm backtrace:     0: 0xe12c09 - node_compat_runner.wasm!JS_CallInternal     1: 0xe161ed - node_compat_runner.wasm!JS_CallInternal     2: 0xe161ed - node_compat_runner...
- `parallel/test-vm-measure-memory-multi-context.js`: FAIL: Cannot find module '../common/measure-memory' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/node...
- `parallel/test-vm-measure-memory.js`: FAIL: Cannot find module '../common/measure-memory' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/node...
- `parallel/test-vm-module-cached-data.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-vm-module-cached-data.js:12:24)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runTest ...
- `parallel/test-vm-module-dynamic-import.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly equal: + actual - expected  + 'ERR_MODULE_NOT_FOUND' - 'ERR_VM_DYNAMIC_IMPORT_CALLB...
- `parallel/test-vm-module-dynamic-namespace.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): Error: Cannot find module ''
- `parallel/test-vm-module-errors.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-vm-module-errors.js:172:5)     at loadModule (no...
- `parallel/test-vm-module-import-meta.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <input>:4:1     at Function (native)     at compileSourceTextModuleEvaluator (__wasm_rquickjs_builtin/vm:143:102)     at So...
- `parallel/test-vm-module-link.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at parseSourceTextModuleBindings (__wasm_rquickjs_builtin/vm:131:19)     at SourceTextModule (__wasm_rquickjs_builtin/vm:307:6...
- `parallel/test-vm-module-synthetic.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (/home/node/test/parallel/test-vm-module-synthetic.js:11:19)     at <anonymous> (/home/node/test/parallel/test-...
- `parallel/test-vm-no-dynamic-import-callback.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Missing expected rejection.      at rejects (native)
- `parallel/test-vm-not-strict.js`: FAIL: b is not defined     at <eval> (<input>:6:11)     at eval (native)     at runInThisContext (__wasm_rquickjs_builtin/vm:272:22)     at <anonymous> (/home/node/test/parallel/test-vm-not-strict.js:...
- `parallel/test-vm-options-validation.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-vm-options-validation.js:17:8)     at loadModule...
- `parallel/test-vm-ownkeys.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    [     'a',     'b',     Symbol(1),     Symbol(2), +   Symbol(vm.context)   ]  AssertionError: Expected values to be strictly dee...
- `parallel/test-vm-ownpropertynames.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    [     'a',     'b',     Symbol(1),     Symbol(2), +   Symbol(vm.context)   ]  AssertionError: Expected values to be strictly dee...
- `parallel/test-vm-ownpropertysymbols.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    [     'a',     'b',     Symbol(1),     Symbol(2), +   Symbol(vm.context)   ]  AssertionError: Expected values to be strictly dee...
- `parallel/test-vm-preserves-property.js`: FAIL: The expression evaluated to a falsy value:    assert(res)  AssertionError: The expression evaluated to a falsy value:    assert(res)      at <anonymous> (/home/node/test/parallel/test-vm-preserv...
- `parallel/test-vm-property-not-on-sandbox.js`: FAIL: Expected values to be strictly equal: + actual - expected  + undefined - true  AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - true      at <anonymous> (...
- `parallel/test-vm-proxies.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'function'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'undefined' - 'function'      ...
- `parallel/test-vm-proxy-failure-CP.js`: FAIL: whoops     at getOwnPropertyDescriptor (/home/node/test/parallel/test-vm-proxy-failure-CP.js:9:15)     at createContext (__wasm_rquickjs_builtin/vm:242:5)     at <anonymous> (/home/node/test/par...
- `parallel/test-vm-run-in-new-context.js`: FAIL: Expected values to be strictly equal:  0 !== 1  AssertionError: Expected values to be strictly equal:  0 !== 1      at <anonymous> (/home/node/test/parallel/test-vm-run-in-new-context.js:55:20) ...
- `parallel/test-vm-set-property-proxy.js`: FAIL: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-vm-set-property-proxy.js:15:8)     at loadModule (node:module:1088:32)  ...
- `parallel/test-vm-sigint-existing-handler.js`: FAIL: mustCall verification failed: mustCall: expected exactly 3 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-vm-sigint-exi...
- `parallel/test-vm-sigint.js`: FAIL: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at <anonymous> (/home/node/test/parallel/test-vm-sigint.js:...
- `parallel/test-vm-source-map-url.js`: FAIL: Expected values to be strictly equal: + actual - expected  + undefined - 'sourcemap.json'  AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - 'sourcemap.jso...
- `parallel/test-vm-strict-assign.js`: FAIL: Expected values to be strictly equal:  undefined !== 42  AssertionError: Expected values to be strictly equal:  undefined !== 42      at <anonymous> (/home/node/test/parallel/test-vm-strict-assi...
- `parallel/test-vm-strict-mode.js`: FAIL: Expected values to be strictly equal:  42 !== 1  AssertionError: Expected values to be strictly equal:  42 !== 1      at <anonymous> (/home/node/test/parallel/test-vm-strict-mode.js:14:20)     a...
- `parallel/test-vm-symbols.js`: FAIL: not a function     at <anonymous> (eval_script:1:19)     at <eval> (eval_script:1:47)     at runInContext (__wasm_rquickjs_builtin/vm:260:54)     at <anonymous> (/home/node/test/parallel/test-vm...
- `parallel/test-vm-timeout-escape-promise-2.js`: FAIL: Missing expected exception. AssertionError: Missing expected exception.     at <anonymous> (/home/node/test/parallel/test-vm-timeout-escape-promise-2.js:26:8)     at loadModule (node:module:1088...
- `parallel/test-vm-timeout-escape-promise-module.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (<input>:4:19)     at apply (native)     at call (native)     at wrapped (node:async_hooks:143:53)     at _rest...
- `parallel/test-vm-timeout-escape-promise.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'escaped timeout at 2000 milliseconds!' -   code: 'ERR_SCRIPT_EXECUTION_TIMEOUT', -   message: 'Script...
- `parallel/test-vm-timeout.js`: ERROR: Timeout (epoch deadline exceeded)
- `parallel/test-warn-stream-wrap.js`: FAIL: Cannot find module '_stream_wrap'     at localRequire (node:module:1283:59)     at <anonymous> (/home/node/test/parallel/test-warn-stream-wrap.js:10:1)     at loadModule (node:module:1088:32)   ...
- `parallel/test-webcrypto-derivebits-cfrg.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at deriveBits (__wasm_rquickjs_builtin/web_crypto:8506:135)     at <anonymous> (/home/node/test/parallel/test-webcrypto-derive...
- `parallel/test-webcrypto-derivebits-ecdh.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at createDataError (__wasm_rquickjs_builtin/web_crypto:3186:21)     at toCryptoKey (__wasm_rquickjs_builtin/web_crypto:3151:27...
- `parallel/test-webcrypto-derivebits-hkdf.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   code: 'ERR_INVALID_ARG_TYPE' - ...
- `parallel/test-webcrypto-derivekey-cfrg.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at deriveBits (__wasm_rquickjs_builtin/web_crypto:8506:135)     at call (native)     at deriveKey (__wasm_rquickjs_builtin/web...
- `parallel/test-webcrypto-derivekey-ecdh.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at createDataError (__wasm_rquickjs_builtin/web_crypto:3186:21)     at toCryptoKey (__wasm_rquickjs_builtin/web_crypto:3151:27...
- `parallel/test-webcrypto-digest.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'Digest method not sup...
- `parallel/test-webcrypto-encrypt-decrypt-rsa.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly equal: + actual - expected  + 2048 - undefined      at testEncryption (/home/node/t...
- `parallel/test-webcrypto-export-import-cfrg.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at importKey (__wasm_rquickjs_builtin/web_crypto:8252:82)     at testImportRaw (/home/node/test/parallel/test-webcrypto-export...
- `parallel/test-webcrypto-export-import-rsa.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly equal: + actual - expected  + undefined - 1024      at testImportSpki (/home/node/t...
- `parallel/test-webcrypto-sign-verify-ecdsa.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at createDataError (__wasm_rquickjs_builtin/web_crypto:3186:21)     at toCryptoKey (__wasm_rquickjs_builtin/web_crypto:3151:27...
- `parallel/test-webcrypto-sign-verify-eddsa.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Buffer(114) [Uint8Array] [ +   237, +   96, +   ...
- `parallel/test-webcrypto-sign-verify-hmac.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure): AssertionError: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: 'The requested operati...
- `parallel/test-webcrypto-sign-verify-rsa.js`: ERROR: Timeout (epoch deadline exceeded)
- `parallel/test-websocket.js`: skipped (requires golem:websocket WIT import)
- `parallel/test-webstream-encoding-inspect.js`: FAIL: not a function     at <anonymous> (/home/node/test/parallel/test-webstream-encoding-inspect.js:9:31)     at loadModule (node:module:1088:32)     at localRequire (node:module:1272:34)     at runT...
- `parallel/test-webstream-readable-from.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { -   code: 'ERR_ARG_NOT_ITERABLE',     name: 'TypeError'   }  AssertionError: Expected values to be strictly deep-eq...
- `parallel/test-whatwg-encoding-custom-textdecoder-api-invalid-label.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { -   code: 'ERR_ENCODING_NOT_SUPPORTED',     name: 'RangeError'   }  AssertionError: Expected values to be strictly ...
- `parallel/test-whatwg-encoding-custom-textdecoder-fatal.js`: SKIP: missing Intl
- `parallel/test-whatwg-encoding-custom-textdecoder-invalid-arg.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-whatwg-encoding-custom-textdecoder-invalid-arg.j...
- `parallel/test-whatwg-encoding-custom-textdecoder-streaming.js`: FAIL: Expected values to be strictly equal: + actual - expected  + '\x00123ABCabc��������������������' - '\x00123ABCabc\x80ÿĀက�𐀀􏿿'                 ^...
- `parallel/test-whatwg-encoding-custom-textdecoder-utf16-surrogates.js`: SKIP: missing Intl
- `parallel/test-whatwg-events-event-constructors.js`: FAIL: Cannot find module '../common/wpt' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/node/test/paral...
- `parallel/test-whatwg-events-eventtarget-this-of-listener.js`: FAIL: Cannot find module '../common/wpt' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/node/test/paral...
- `parallel/test-whatwg-url-custom-global.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected ... Skipped lines    {     configurable: true, +   enumerable: true, -   enumerable: false,     value: [Function: URL] {       canP...
- `parallel/test-whatwg-url-custom-href-side-effect.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   name: 'Error' -   name: 'TypeError'   }  AssertionError: Expected values to be strictly deep-equal: + actual - ...
- `parallel/test-whatwg-url-custom-inspect.js`: SKIP: missing Intl
- `parallel/test-whatwg-url-custom-parsing.js`: SKIP: missing Intl
- `parallel/test-whatwg-url-custom-searchparams-append.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "cannot read property '__URLSearchParams__' of undefined", -   code: 'ERR_INVALID_THIS', -   message: ...
- `parallel/test-whatwg-url-custom-searchparams-entries.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-whatwg-url-custom-searchparams-entries.js:28:8) ...
- `parallel/test-whatwg-url-custom-searchparams-foreach.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "cannot read property 'toString' of undefined", -   code: 'ERR_INVALID_THIS', -   message: 'Value of "...
- `parallel/test-whatwg-url-custom-searchparams-get.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "cannot read property '__URLSearchParams__' of undefined", -   code: 'ERR_INVALID_THIS', -   message: ...
- `parallel/test-whatwg-url-custom-searchparams-getall.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "cannot read property '__URLSearchParams__' of undefined", -   code: 'ERR_INVALID_THIS', -   message: ...
- `parallel/test-whatwg-url-custom-searchparams-has.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "cannot read property '__URLSearchParams__' of undefined", -   code: 'ERR_INVALID_THIS', -   message: ...
- `parallel/test-whatwg-url-custom-searchparams-inspect.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'URLSearchParamsPolyfill [URLSearchParams] {\n' + +   "  __URLSearchParams__: { a: [ 'a' ], b: [ 'b', 'c' ] }\n" + +   '}' - "URLSear...
- `parallel/test-whatwg-url-custom-searchparams-keys.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-whatwg-url-custom-searchparams-keys.js:30:8)    ...
- `parallel/test-whatwg-url-custom-searchparams-set.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "cannot read property '__URLSearchParams__' of undefined", -   code: 'ERR_INVALID_THIS', -   message: ...
- `parallel/test-whatwg-url-custom-searchparams-sort.js`: FAIL: Cannot find module '../common/wpt' from '/home/node/test/parallel'     at resolveFilename (node:module:602:80)     at localRequire (node:module:1271:44)     at <anonymous> (/home/node/test/paral...
- `parallel/test-whatwg-url-custom-searchparams-values.js`: FAIL: Missing expected exception (TypeError). AssertionError: Missing expected exception (TypeError).     at <anonymous> (/home/node/test/parallel/test-whatwg-url-custom-searchparams-values.js:30:8)  ...
- `parallel/test-whatwg-url-custom-searchparams.js`: FAIL: expecting surrogate pair     at encodeURIComponent (native)     at encode (node:url:187:31)     at <anonymous> (node:url:71:44)     at <anonymous> (/home/node/test/parallel/test-whatwg-url-custo...
- `parallel/test-whatwg-url-custom-tostringtag.js`: FAIL: undefined !== URL  undefined !== 'URL'  AssertionError: undefined !== URL  undefined !== 'URL'      at <anonymous> (/home/node/test/parallel/test-whatwg-url-custom-tostringtag.js:27:22)     at f...
- `parallel/test-whatwg-url-invalidthis.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected    Comparison { +   message: "Error converting from js 'array' into type 'URL'", -   message: /Receiver must be an instance of clas...
- `parallel/test-whatwg-webstreams-compression.js`: FAIL: Expected values to be strictly deep-equal: + actual - expected  + Comparison {} - Comparison { -   code: 'ERR_INVALID_ARG_VALUE' - }  AssertionError: Expected values to be strictly deep-equal: +...
- `parallel/test-windows-abort-exitcode.js`: SKIP: test is windows specific
- `parallel/test-windows-failed-heap-allocation.js`: SKIP: Windows-only
- `sequential/test-cli-syntax-require.js`: FAIL: - process terminated with status 0, expected 1     at <anonymous> (/home/node/test/sequential/test-cli-syntax-require.js:20:22)     at forEach (native)     at <anonymous> (/home/node/test/sequen...
- `sequential/test-dgram-pingpong.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at parseNativeError (node:dgram:50:25)     at <anonymous> (node:dgram:214:46)
- `sequential/test-gc-http-client-onerror.js`: ERROR: Timeout (epoch deadline exceeded)
- `sequential/test-gc-http-client-timeout.js`: ERROR: Timeout (epoch deadline exceeded)
- `sequential/test-gc-http-client.js`: ERROR: Timeout (epoch deadline exceeded)
- `sequential/test-next-tick-error-spin.js`: ERROR: Timeout (epoch deadline exceeded)
- `sequential/test-pipe.js`: ERROR: Timeout (epoch deadline exceeded)
- `sequential/test-process-title.js`: FAIL: Expected values to be strictly equal: + actual - expected  + 'undefined' - '/usr/local/bin/node'  AssertionError: Expected values to be strictly equal: + actual - expected  + 'undefined' - '/usr...
- `sequential/test-util-debug.js`: FAIL: mustCall verification failed: mustCall: expected exactly 1 call(s), got 0     at mustCall (/home/node/test/common/index.js:506:28)     at child (/home/node/test/sequential/test-util-debug.js:121...
- `sequential/test-vm-timeout-escape-promise-module-2.js`: FAIL: Unhandled promise rejection (likely cause of mustCall failure):     at <anonymous> (<input>:4:19)     at apply (native)     at call (native)     at wrapped (node:async_hooks:143:53)     at _rest...
- `sequential/test-vm-timeout-rethrow.js`: ERROR: Timeout (epoch deadline exceeded)

</details>

## Skipped Tests

407 tests are manually skipped with known reasons.

<details>
<summary>Click to expand</summary>

- `es-module/test-dynamic-import-script-lifetime.js`: ESM lifecycle edge case
- `es-module/test-esm-assertionless-json-import.js`: [manual] This test requires Node.js `--experimental-loader` custom ESM loader hooks to allow JSON imports without `{ with: { type: 'json' } }`. Without that loader, Node.js itself rejects assertion...
- `es-module/test-esm-cjs-exports.js`: [manual] This test requires Node.js's native ESM-CJS interop, which cannot be replicated in WASM/QuickJS. Specifically:
- `es-module/test-esm-import-meta-resolve.mjs`: [manual] The test uses `spawn` from `child_process` and `spawnPromisified` (lines 61-119) to launch real Node.js child processes with CLI flags (`--input-type=module`, `--eval`, `--import`). Child ...
- `es-module/test-esm-undefined-cjs-global-like-variables.js`: [manual] This test requires three fundamental features our runtime intentionally does not implement:
- `es-module/test-require-module-dynamic-import-1.js`: requires CJS named export analysis (cjs-module-lexer) for ESM import of CJS modules
- `parallel/test-async-hooks-destroy-on-gc.js`: async_hooks not fully implemented
- `parallel/test-async-hooks-disable-during-promise.js`: async_hooks not fully implemented
- `parallel/test-async-hooks-disable-gc-tracking.js`: async_hooks not fully implemented
- `parallel/test-async-hooks-enable-disable.js`: async_hooks not fully implemented
- `parallel/test-async-hooks-enable-during-promise.js`: async_hooks not fully implemented
- `parallel/test-async-hooks-enable-recursive.js`: async_hooks not fully implemented
- `parallel/test-async-hooks-execution-async-resource-await.js`: requires HTTP server functionality, we only support clients
- `parallel/test-async-hooks-execution-async-resource.js`: requires HTTP server functionality, we only support clients
- `parallel/test-async-hooks-http-parser-destroy.js`: requires HTTP server functionality, we only support clients
- `parallel/test-async-hooks-prevent-double-destroy.js`: async_hooks not fully implemented
- `parallel/test-async-hooks-worker-asyncfn-terminate-1.js`: async_hooks not fully implemented
- `parallel/test-async-hooks-worker-asyncfn-terminate-2.js`: async_hooks not fully implemented
- `parallel/test-async-hooks-worker-asyncfn-terminate-3.js`: async_hooks not fully implemented
- `parallel/test-async-hooks-worker-asyncfn-terminate-4.js`: async_hooks not fully implemented
- `parallel/test-async-local-storage-http-multiclients.js`: requires AsyncLocalStorage context propagation across concurrent HTTP activity which is not implemented
- `parallel/test-async-wrap-promise-after-enabled.js`: async_hooks not fully implemented
- `parallel/test-async-wrap-uncaughtexception.js`: async_hooks not fully implemented
- `parallel/test-buffer-tostring-range.js`: The tested feature is not available in 32bit builds
- `parallel/test-common-countdown.js`: GC/common test infrastructure not fully compatible
- `parallel/test-console-diagnostics-channels.js`: diagnostics_channel integration
- `parallel/test-crypto-keygen-async-dsa-key-object.js`: DSA key generation requires 2048+ bit modulus; test uses 512-bit when hasOpenSSL3 is false
- `parallel/test-crypto-keygen-async-dsa.js`: DSA key generation requires 2048+ bit modulus; test uses 512-bit when hasOpenSSL3 is false
- `parallel/test-crypto-keygen-empty-passphrase-no-prompt.js`: crypto edge case
- `parallel/test-crypto-no-algorithm.js`: this test requires OpenSSL 3.x
- `parallel/test-crypto-publicDecrypt-fails-first-time.js`: only openssl3
- `parallel/test-crypto-verify-failure.js`: requires tls module which is not available in WASM
- `parallel/test-crypto-webcrypto-aes-decrypt-tag-too-small.js`: requires WebCrypto AES-GCM with specific tag length validation
- `parallel/test-crypto.js`: requires tls module which is not available in WASM
- `parallel/test-dgram-bind-error-repeat.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-bytes-length.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-close-in-listening.js`: dgram implementation incomplete
- `parallel/test-dgram-close-is-not-callback.js`: dgram implementation incomplete
- `parallel/test-dgram-connect-send-callback-buffer-length.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-connect-send-callback-buffer.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-connect-send-callback-multi-buffer.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-connect-send-default-host.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-connect-send-empty-array.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-connect-send-empty-buffer.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-connect-send-empty-packet.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-connect-send-multi-buffer-copy.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-connect-send-multi-string-array.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-connect.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-exclusive-implicit-bind.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-implicit-bind.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-msgsize.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-multicast-setTTL.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-oob-buffer.js`: dgram implementation incomplete
- `parallel/test-dgram-reuseport.js`: requires reusePort socket option not supported in WASI
- `parallel/test-dgram-send-address-types.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-send-bad-arguments.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-send-callback-buffer-empty-address.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-send-callback-buffer-length-empty-address.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-send-callback-buffer-length.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-send-callback-buffer.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-send-callback-multi-buffer-empty-address.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-send-callback-multi-buffer.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-send-callback-recursive.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-send-default-host.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-send-empty-array.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-send-empty-buffer.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-send-empty-packet.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-send-multi-buffer-copy.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-send-multi-string-array.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-dgram-send-queue-info.js`: wasi:sockets UDP implementation crashes in wasmtime
- `parallel/test-dgram-udp4.js`: wasi:sockets UDP implementation hangs in wasmtime
- `parallel/test-diagnostic-channel-http-response-created.js`: requires HTTP server functionality, we only support clients
- `parallel/test-diagnostics-channel-bind-store.js`: diagnostics_channel incomplete
- `parallel/test-diagnostics-channel-http-server-start.js`: requires HTTP server functionality, we only support clients
- `parallel/test-diagnostics-channel-memory-leak.js`: requires v8.queryObjects (--expose-internals)
- `parallel/test-diagnostics-channel-safe-subscriber-errors.js`: diagnostics_channel incomplete
- `parallel/test-diagnostics-channel-tracing-channel-args-types.js`: error messages differ slightly from upstream Node.js for tracingChannel({}) case
- `parallel/test-diagnostics-channel-tracing-channel-promise-run-stores.js`: QuickJS await bypasses JS-visible Promise.prototype.then so ALS context is lost across await boundaries
- `parallel/test-diagnostics-channel-udp.js`: diagnostics_channel incomplete
- `parallel/test-diagnostics-channel-worker-threads.js`: diagnostics_channel incomplete
- `parallel/test-dns-cancel-reverse-lookup.js`: dns resolver implementation incomplete
- `parallel/test-dns-channel-cancel-promise.js`: dns resolver implementation incomplete
- `parallel/test-dns-channel-cancel.js`: dns resolver implementation incomplete
- `parallel/test-dns-channel-timeout.js`: requires dgram and DNS protocol-level testing
- `parallel/test-dns-get-server.js`: accesses internal Resolver._handle property
- `parallel/test-dns-lookupService-promises.js`: requires dgram and DNS protocol-level testing
- `parallel/test-dns-multi-channel.js`: dns resolver implementation incomplete
- `parallel/test-dns-perf_hooks.js`: dns perf_hooks integration not implemented
- `parallel/test-dns-resolveany-bad-ancount.js`: dns resolver implementation incomplete
- `parallel/test-dns-resolveany.js`: dns resolver implementation incomplete
- `parallel/test-dns-resolvens-typeerror.js`: requires ERR_INVALID_ARG_TYPE validation on resolve methods (not yet implemented)
- `parallel/test-dns-setserver-when-querying.js`: requires dgram and DNS protocol-level testing
- `parallel/test-domain-async-id-map-leak.js`: requires --expose-gc flag
- `parallel/test-domain-ee.js`: second block requires EventEmitter captureRejections constructor option which is not implemented
- `parallel/test-domain-http-server.js`: requires HTTP server functionality, we only support clients
- `parallel/test-domain-implicit-binding.js`: domain module depends on async_hooks, not fully working
- `parallel/test-domain-implicit-fs.js`: domain module depends on async_hooks, not fully working
- `parallel/test-domain-multi.js`: requires HTTP server functionality, we only support clients
- `parallel/test-domain-timer.js`: domain module depends on async_hooks, not fully working
- `parallel/test-domain-timers-uncaught-exception.js`: domain module depends on async_hooks, not fully working
- `parallel/test-domain-timers.js`: domain module depends on async_hooks, not fully working
- `parallel/test-domain-top-level-error-handler-throw.js`: domain module depends on async_hooks, not fully working
- `parallel/test-domain-uncaught-exception.js`: domain module depends on async_hooks, not fully working
- `parallel/test-esm-loader-hooks-inspect-brk.js`: Inspector not available in WASM
- `parallel/test-esm-loader-hooks-inspect-wait.js`: Inspector not available in WASM
- `parallel/test-events-add-abort-listener.mjs`: addAbortListener lacks argument validation and already-aborted/stopImmediatePropagation handling
- `parallel/test-events-uncaught-exception-stack.js`: requires process.on('uncaughtException') hooks
- `parallel/test-eventsource.js`: requires --experimental-eventsource flag and EventSource global which is not implemented (needs HTTP streaming/SSE support)
- `parallel/test-eventtarget-once-twice.js`: requires --expose-internals and internal/event_target
- `parallel/test-fs-lchmod.js`: lchmod is only available on macOS
- `parallel/test-fs-long-path.js`: this test is Windows-specific.
- `parallel/test-fs-read-file-sync-hostname.js`: Test is linux specific.
- `parallel/test-fs-read-stream-file-handle.js`: fs edge case
- `parallel/test-fs-readdir-buffer.js`: this tests works only on MacOS
- `parallel/test-fs-readdir-pipe.js`: This test is specific to Windows to test enumerate pipes
- `parallel/test-fs-readdir-types-symlinks.js`: insufficient privileges
- `parallel/test-fs-readdir-ucs2.js`: Test is linux specific.
- `parallel/test-fs-readfilesync-enoent.js`: Windows specific test.
- `parallel/test-fs-realpath-on-substed-drive.js`: Test for Windows only
- `parallel/test-fs-symlink-buffer-path.js`: insufficient privileges
- `parallel/test-fs-symlink-dir.js`: insufficient privileges
- `parallel/test-fs-symlink.js`: insufficient privileges
- `parallel/test-fs-utimes-y2K38.js`: File system appears to lack Y2K38 support (touch failed)
- `parallel/test-fs-watch-recursive-linux-parallel-remove.js`: This test can run only on Linux
- `parallel/test-fs-watchfile.js`: [manual] amp made no code changes
- `parallel/test-fs-write-buffer-large.js`: The tested feature is not available in 32bit builds
- `parallel/test-fs-write-file-invalid-path.js`: This test is for Windows only.
- `parallel/test-fs-write-sigxfsz.js`: [manual] amp made no code changes
- `parallel/test-http-abort-client.js`: [manual] amp fix caused regressions
- `parallel/test-http-abort-queued.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-agent-abort-controller.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-agent-close.js`: http edge case not yet handled
- `parallel/test-http-agent-destroyed-socket.js`: http edge case not yet handled
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
- `parallel/test-http-catch-uncaughtexception.js`: [manual] batch other-1: cannot fix
- `parallel/test-http-chunk-problem.js`: hangs: test spawns child_process and uses fixed port allocation
- `parallel/test-http-chunked-304.js`: http edge case not yet handled
- `parallel/test-http-chunked-smuggling.js`: http edge case not yet handled
- `parallel/test-http-client-abort-keep-alive-destroy-res.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-client-abort-keep-alive-queued-tcp-socket.js`: hangs: relies on keep-alive connection reuse not fully implemented
- `parallel/test-http-client-abort-keep-alive-queued-unix-socket.js`: hangs: requires unix socket support
- `parallel/test-http-client-abort-unix-socket.js`: hangs: requires unix socket support
- `parallel/test-http-client-agent-end-close-event.js`: hangs: relies on Agent connection lifecycle not fully implemented
- `parallel/test-http-client-default-headers-exist.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-client-error-rawbytes.js`: hangs: test sends raw TCP bytes and expects clientError events
- `parallel/test-http-client-finished.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-client-headers-array.js`: fails: request error when sending raw header pairs via wasi:http
- `parallel/test-http-client-incomingmessage-destroy.js`: hangs: server never ends response, destroy during active readBodyChunk cannot unblock native async poll
- `parallel/test-http-client-keep-alive-release-before-finish.js`: hangs: requires keep-alive socket reuse and res.connection.end()
- `parallel/test-http-client-override-global-agent.js`: hangs: relies on Agent createConnection not fully implemented
- `parallel/test-http-client-parse-error.js`: hangs: test sends raw TCP bytes and expects specific parser errors
- `parallel/test-http-client-pipe-end.js`: hangs: relies on keep-alive connection piping
- `parallel/test-http-client-reject-chunked-with-content-length.js`: hangs: test sends raw TCP bytes and expects specific parser errors
- `parallel/test-http-client-reject-cr-no-lf.js`: hangs: test sends raw TCP bytes and expects specific parser errors
- `parallel/test-http-client-req-error-dont-double-fire.js`: http edge case not yet handled
- `parallel/test-http-client-response-domain.js`: hangs: requires domain module integration with HTTP client
- `parallel/test-http-client-response-timeout.js`: http edge case not yet handled
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
- `parallel/test-http-double-content-length.js`: http edge case not yet handled
- `parallel/test-http-dump-req-when-res-ends.js`: hangs: relies on response stream cleanup behavior
- `parallel/test-http-early-hints-invalid-argument.js`: hangs: test calls server.close() from server handler without consuming client response, causing WASM event loop to not drain
- `parallel/test-http-exceptions.js`: hangs: relies on uncaughtException handling in request callbacks
- `parallel/test-http-expect-continue.js`: hangs: Expect: 100-continue not fully implemented
- `parallel/test-http-expect-handling.js`: hangs: Expect header handling not fully implemented
- `parallel/test-http-flush-headers.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-full-response.js`: hangs: test uses raw TCP for full response verification
- `parallel/test-http-header-badrequest.js`: hangs: test sends raw TCP bytes for malformed headers
- `parallel/test-http-header-overflow.js`: hangs: test sends raw TCP bytes to trigger header overflow
- `parallel/test-http-host-header-ipv6-fail.js`: hangs: relies on IPv6 connection failure behavior
- `parallel/test-http-import-websocket.js`: skipped (requires golem:websocket WIT import)
- `parallel/test-http-information-headers.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-information-processing.js`: hangs: 1xx informational responses not supported via wasi:http
- `parallel/test-http-insecure-parser.js`: http edge case not yet handled
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
- `parallel/test-http-multi-line-headers.js`: requires raw TCP response with obsolete HTTP line-folded headers; wasi:http rejects them
- `parallel/test-http-multiple-headers.js`: hangs: test uses raw TCP to verify multiple header handling
- `parallel/test-http-mutable-headers.js`: hangs: test uses raw TCP to verify mutable headers
- `parallel/test-http-no-read-no-dump.js`: hangs: relies on unconsumed request body behavior
- `parallel/test-http-nodelay.js`: hangs: relies on socket.setNoDelay verification
- `parallel/test-http-outgoing-end-cork.js`: relies on keepAlive socket reuse and backpressure which are not supported in WASI
- `parallel/test-http-outgoing-end-multiple.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-outgoing-first-chunk-singlebyte-encoding.js`: hangs: creates 4 concurrent server-client pairs with net.connect raw TCP
- `parallel/test-http-parser-finish-error.js`: http edge case not yet handled
- `parallel/test-http-parser-freed-before-upgrade.js`: hangs: relies on HTTP parser lifecycle internals
- `parallel/test-http-parser-memory-retention.js`: relies on socket.parser lifecycle internals of HTTP server/client
- `parallel/test-http-parser-multiple-execute.js`: http edge case not yet handled
- `parallel/test-http-pause-no-dump.js`: http edge case not yet handled
- `parallel/test-http-pause.js`: hangs: relies on response pause/resume backpressure
- `parallel/test-http-perf_hooks.js`: requires PerformanceObserver with HTTP performance entries
- `parallel/test-http-pipeline-flood.js`: hangs: test sends raw TCP bytes for pipeline flooding
- `parallel/test-http-pipeline-requests-connection-leak.js`: sends 10000 pipelined requests which exceeds WASM resource limits
- `parallel/test-http-raw-headers.js`: hangs: test uses raw TCP to verify header case preservation
- `parallel/test-http-remove-header-stays-removed.js`: hangs: test uses raw TCP for header removal verification
- `parallel/test-http-req-close-robust-from-tampering.js`: hangs: relies on close event tampering edge case
- `parallel/test-http-res-write-after-end.js`: hangs: relies on write-after-end error handling
- `parallel/test-http-response-multiheaders.js`: [manual] wasmtime's `wasi:http` implementation strips `host` and `proxy-authorization` headers from HTTP responses (treating them as forbidden/hop-by-hop headers). The test asserts all 17 "norepeat...
- `parallel/test-http-response-no-headers.js`: test uses raw TCP (net.createServer) with HTTP/0.9 responses that wasi:http cannot parse
- `parallel/test-http-response-status-message.js`: [manual] amp fix attempt failed verification
- `parallel/test-http-same-map.js`: test uses V8-specific percent-encoded module syntax
- `parallel/test-http-server-async-dispose.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-clear-timer.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-client-error.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-close-all.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-close-destroy-timeout.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-close-idle.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-connections-checking-leak.js`: http edge case not yet handled
- `parallel/test-http-server-consumed-timeout.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-de-chunked-trailer.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-destroy-socket-on-client-error.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-headers-timeout-delayed-headers.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-headers-timeout-interrupted-headers.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-headers-timeout-keepalive.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-headers-timeout-pipelining.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-incomingmessage-destroy.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-keepalive-end.js`: http edge case not yet handled
- `parallel/test-http-server-keepalive-req-gc.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-multiheaders.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `parallel/test-http-server-multiheaders2.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
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
- `parallel/test-http-sync-write-error-during-continue.js`: http edge case not yet handled
- `parallel/test-http-transfer-encoding-repeated-chunked.js`: http edge case not yet handled
- `parallel/test-http-uncaught-from-request-callback.js`: [manual] amp batch made no code changes
- `parallel/test-http-unix-socket-keep-alive.js`: [manual] requires unix sockets / proxy / external tools unavailable in WASM
- `parallel/test-http-unix-socket.js`: [manual] requires unix sockets / proxy / external tools unavailable in WASM
- `parallel/test-http-upgrade-advertise.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-upgrade-agent.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-upgrade-binary.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-upgrade-client.js`: [manual] amp partial fix caused regressions
- `parallel/test-http-upgrade-client2.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-upgrade-reconsume-stream.js`: [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http
- `parallel/test-http-upgrade-server2.js`: http edge case not yet handled
- `parallel/test-http-url.parse-https.request.js`: [manual] amp batch made no code changes
- `parallel/test-http-wget.js`: http edge case not yet handled
- `parallel/test-http-writable-true-after-close.js`: [manual] amp batch made no code changes
- `parallel/test-http-write-callbacks.js`: [manual] amp batch made no code changes
- `parallel/test-http-write-head-after-set-header.js`: [manual] the test currently deadlocks in the runtime pollable/executor path (same-component `node:http` client calling back into same-component server via `wasi:http`), and I could not resolve it f...
- `parallel/test-http-write-head.js`: [manual] The test asserts `response.rawHeaders.includes('Test')` (line 78) — requiring header name case preservation through the HTTP transport. In wasi:http, all header names are normalized to low...
- `parallel/test-http.js`: [manual] amp fix attempt failed verification
- `parallel/test-module-circular-symlinks.js`: module resolution edge case
- `parallel/test-module-loading-globalpaths.js`: [manual] This test requires `child_process.execFileSync` to spawn real Node.js child processes from copied binaries, testing module resolution from global paths (`$HOME/.node_modules`, `$HOME/.node...
- `parallel/test-module-readonly.js`: test only runs on Windows
- `parallel/test-net-connect-memleak.js`: requires process.memoryUsage()
- `parallel/test-net-connect-nodelay.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-options-ipv6.js`: requires DNS lookup for IPv6
- `parallel/test-net-connect-paused-connection.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-connect-reset.js`: net edge case not yet handled
- `parallel/test-net-during-close.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-eaddrinuse.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-error-twice.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-listen-after-destroying-stdin.js`: requires process.stdin
- `parallel/test-net-listen-exclusive-random-ports.js`: requires cluster
- `parallel/test-net-listen-fd0.js`: requires fd option for listen
- `parallel/test-net-listen-handle-in-cluster-1.js`: requires cluster
- `parallel/test-net-listen-ipv6only.js`: requires IPv6 dual-stack and DNS resolution
- `parallel/test-net-listen-twice.js`: requires cluster
- `parallel/test-net-localerror.js`: requires DNS lookup
- `parallel/test-net-onread-static-buffer.js`: requires onread option with buffer/callback
- `parallel/test-net-pingpong.js`: net edge case not yet handled
- `parallel/test-net-reuseport.js`: requires reusePort option and cluster
- `parallel/test-net-server-blocklist.js`: requires net.BlockList
- `parallel/test-net-server-capture-rejection.js`: requires captureRejections option
- `parallel/test-net-server-close-before-calling-lookup-callback.js`: requires DNS lookup
- `parallel/test-net-server-close-before-ipc-response.js`: requires cluster
- `parallel/test-net-server-drop-connections-in-cluster.js`: requires cluster
- `parallel/test-net-server-drop-connections.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-keepalive.js`: requires internal/test/binding
- `parallel/test-net-server-nodelay.js`: net edge case not yet handled
- `parallel/test-net-server-reset.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-unref-persistent.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-server-unref.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-constructor.js`: requires cluster
- `parallel/test-net-socket-ready-without-cb.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-socket-setnodelay.js`: net edge case not yet handled
- `parallel/test-net-write-fully-async-buffer.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-write-fully-async-hex-string.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-net-write-slow.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `parallel/test-no-addons-resolution-condition.js`: addon resolution condition not applicable
- `parallel/test-performance-measure-detail.js`: perf_hooks incomplete
- `parallel/test-performance-measure.js`: perf_hooks incomplete
- `parallel/test-pipe-file-to-http.js`: requires HTTP server functionality, we only support clients
- `parallel/test-pipe-head.js`: pipe/net edge case
- `parallel/test-pipe-unref.js`: pipe/net edge case
- `parallel/test-pipe-writev.js`: pipe/net edge case
- `parallel/test-preload-self-referential.js`: preload module handling edge case
- `parallel/test-primitive-timer-leak.js`: requires --expose-gc flag
- `parallel/test-process-beforeexit-throw-exit.js`: process API incomplete
- `parallel/test-process-beforeexit.js`: process API incomplete
- `parallel/test-process-chdir-errormessage.js`: process API incomplete
- `parallel/test-process-config.js`: config.gypi does not exist.
- `parallel/test-process-dlopen-error-message-crash.js`: requires test/addons/ directory and common/tmpdir fixtures
- `parallel/test-process-euid-egid.js`: process.getuid() returns 0 (root) in WASM but seteuid/setegid cannot actually change credentials
- `parallel/test-process-prototype.js`: process is constructed as new EventEmitter() but prototype chain not fully compatible with Node.js expectations
- `parallel/test-process-redirect-warnings-env.js`: process API incomplete
- `parallel/test-process-redirect-warnings.js`: process API incomplete
- `parallel/test-process-uid-gid.js`: process.getuid() returns 0 (root) in WASM but setgid/setuid cannot actually change credentials
- `parallel/test-promise-swallowed-event.js`: promise rejection tracking incomplete
- `parallel/test-promise-unhandled-default.js`: requires process.on('uncaughtException') and unhandledRejection handling
- `parallel/test-promise-unhandled-error.js`: requires --unhandled-rejections=strict flag
- `parallel/test-promise-unhandled-throw-handler.js`: requires --unhandled-rejections=throw flag
- `parallel/test-promise-unhandled-throw.js`: requires --unhandled-rejections=throw flag
- `parallel/test-readable-from-iterator-closing.js`: stream edge case
- `parallel/test-require-extension-over-directory.js`: regression: was enabled but started failing
- `parallel/test-runner-coverage-source-map.js`: Inspector not available in WASM
- `parallel/test-runner-coverage-thresholds.js`: Inspector not available in WASM
- `parallel/test-runner-filetest-location.js`: test runner edge case
- `parallel/test-runner-misc.js`: [manual] amp fix attempt failed verification
- `parallel/test-runner-root-after-with-refed-handles.js`: test runner edge case
- `parallel/test-runner-todo-skip-tests.js`: test runner edge case
- `parallel/test-stdout-to-file.js`: stdout redirection to file not implemented
- `parallel/test-stream-err-multiple-callback-construction.js`: stream edge case not yet handled
- `parallel/test-stream-pipe-without-listenerCount.js`: stream edge case not yet handled
- `parallel/test-stream-pipeline-listeners.js`: stream edge case not yet handled
- `parallel/test-stream-pipeline-process.js`: stream edge case not yet handled
- `parallel/test-stream-readable-to-web.js`: [manual] amp fix caused regressions
- `parallel/test-stream-readable-unpipe-resume.js`: stream edge case not yet handled
- `parallel/test-stream-writable-samecb-singletick.js`: stream edge case not yet handled
- `parallel/test-stream2-httpclient-response-end.js`: requires HTTP server functionality, we only support clients
- `parallel/test-timers-active.js`: requires timer._idleTimeout, _onTimeout, and other internal timer properties
- `parallel/test-timers-api-refs.js`: requires timers module to export setTimeout/setInterval/setImmediate directly
- `parallel/test-timers-destroyed.js`: requires process.on('exit') and functional timer.unref() to prevent event loop from waiting
- `parallel/test-timers-enroll-invalid-msecs.js`: requires timers.enroll which is not implemented
- `parallel/test-timers-immediate-queue.js`: requires process.on('exit') hooks
- `parallel/test-timers-promises-scheduler.js`: requires scheduler.yield, scheduler.wait, and ERR_ILLEGAL_CONSTRUCTOR
- `parallel/test-timers-unref-active.js`: requires timer.unref() and _unrefActive
- `parallel/test-timers-unref-remove-other-unref-timers-only-one-fires.js`: requires timer.unref() which is not implemented
- `parallel/test-timers-unref-remove-other-unref-timers.js`: requires timer.unref() which is not implemented
- `parallel/test-webcrypto-wrap-unwrap.js`: requires CFRG key (Ed448/X25519/X448) DER export support
- `parallel/test-whatwg-readablebytestreambyob.js`: WHATWG streams edge case
- `parallel/test-zlib-bytes-read.js`: zlib edge case not yet handled
- `parallel/test-zlib-close-after-error.js`: zlib edge case not yet handled
- `parallel/test-zlib-destroy-pipe.js`: zlib edge case not yet handled
- `parallel/test-zlib-flush-drain-longblock.js`: zlib edge case not yet handled
- `parallel/test-zlib-invalid-input-memory.js`: zlib edge case not yet handled
- `parallel/test-zlib-invalid-input.js`: zlib edge case not yet handled
- `parallel/test-zlib-premature-end.js`: zlib edge case not yet handled
- `parallel/test-zlib-unused-weak.js`: zlib edge case not yet handled
- `sequential/test-buffer-creation-regression.js`: [manual] amp fix attempt failed verification
- `sequential/test-fs-stat-sync-overflow.js`: fs edge case
- `sequential/test-http-econnrefused.js`: requires HTTP server functionality
- `sequential/test-http-keepalive-maxsockets.js`: requires HTTP server functionality
- `sequential/test-http-regr-gh-2928.js`: requires HTTP server functionality
- `sequential/test-http-server-request-timeouts-mixed.js`: [manual] requires HTTP server (net.listen) which is unavailable in WASM
- `sequential/test-net-GH-5504.js`: net.js TCP implementation incomplete - needs event handling and API fixes
- `sequential/test-net-listen-shared-ports.js`: requires cluster
- `sequential/test-net-response-size.js`: net.js TCP implementation incomplete - needs event handling and API fixes

</details>

## Split Test Summary

| File | Subtests | Pass | Fail | Error | Skip |
|------|----------|------|------|-------|------|
| test-esm-loader-modulemap.js | 5 | 0 | 0 | 0 | 5 |
| test-require-module-conditional-exports.js | 3 | 0 | 0 | 0 | 3 |
| test-require-module-cycle-esm-cjs-esm-esm.js | 3 | 0 | 0 | 0 | 3 |
| test-require-module-cycle-esm-cjs-esm.js | 4 | 0 | 0 | 0 | 4 |
| test-require-module-cycle-esm-esm-cjs-esm-esm.js | 4 | 0 | 0 | 0 | 4 |
| test-require-module-cycle-esm-esm-cjs-esm.js | 4 | 0 | 0 | 0 | 4 |
| test-require-module-defined-esmodule.js | 2 | 2 | 0 | 0 | 0 |
| test-require-module-tla.js | 2 | 1 | 1 | 0 | 0 |
| test-require-module-with-detection.js | 2 | 0 | 0 | 0 | 2 |
| test-require-module.js | 6 | 4 | 0 | 0 | 2 |
| test-abortcontroller.js | 19 | 19 | 0 | 0 | 0 |
| test-aborted-util.js | 5 | 4 | 1 | 0 | 0 |
| test-abortsignal-cloneable.js | 3 | 3 | 0 | 0 | 0 |
| test-accessor-properties.js | 2 | 0 | 0 | 0 | 2 |
| test-assert-async.js | 5 | 5 | 0 | 0 | 0 |
| test-assert-calltracker-calls.js | 6 | 6 | 0 | 0 | 0 |
| test-assert-calltracker-getCalls.js | 2 | 2 | 0 | 0 | 0 |
| test-assert-deep-with-error.js | 2 | 2 | 0 | 0 | 0 |
| test-assert-deep.js | 39 | 39 | 0 | 0 | 0 |
| test-assert-fail-deprecation.js | 5 | 5 | 0 | 0 | 0 |
| test-assert-fail.js | 4 | 4 | 0 | 0 | 0 |
| test-assert-if-error.js | 4 | 4 | 0 | 0 | 0 |
| test-assert-typedarray-deepequal.js | 3 | 2 | 0 | 1 | 0 |
| test-assert.js | 18 | 18 | 0 | 0 | 0 |
| test-blob.js | 22 | 0 | 0 | 0 | 22 |
| test-blocklist.js | 17 | 4 | 0 | 0 | 13 |
| test-broadcastchannel-custom-inspect.js | 4 | 0 | 0 | 0 | 4 |
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
| test-child-process-exec-maxbuf.js | 11 | 9 | 2 | 0 | 0 |
| test-cli-eval.js | 5 | 5 | 0 | 0 | 0 |
| test-cli-permission-deny-fs.js | 8 | 0 | 0 | 0 | 8 |
| test-cli-permission-multiple-allow.js | 3 | 0 | 0 | 0 | 3 |
| test-common-gc.js | 2 | 1 | 1 | 0 | 0 |
| test-common.js | 4 | 0 | 0 | 0 | 4 |
| test-compression-decompression-stream.js | 2 | 0 | 0 | 0 | 2 |
| test-console-group.js | 8 | 8 | 0 | 0 | 0 |
| test-console-instance.js | 4 | 4 | 0 | 0 | 0 |
| test-crypto-authenticated.js | 20 | 19 | 0 | 1 | 0 |
| test-crypto-certificate.js | 3 | 3 | 0 | 0 | 0 |
| test-crypto-cipheriv-decipheriv.js | 4 | 4 | 0 | 0 | 0 |
| test-crypto-dh-constructor.js | 3 | 3 | 0 | 0 | 0 |
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
| test-crypto-sign-verify.js | 19 | 16 | 2 | 0 | 1 |
| test-crypto-x509.js | 3 | 0 | 0 | 0 | 3 |
| test-dgram-address.js | 2 | 2 | 0 | 0 | 0 |
| test-dgram-bind-fd-error.js | 2 | 0 | 0 | 0 | 2 |
| test-dgram-blocklist.js | 3 | 0 | 0 | 0 | 3 |
| test-dgram-close-signal.js | 3 | 0 | 0 | 0 | 3 |
| test-dgram-create-socket-handle-fd.js | 3 | 0 | 0 | 0 | 3 |
| test-dgram-create-socket-handle.js | 3 | 0 | 0 | 0 | 3 |
| test-dgram-createSocket-type.js | 2 | 2 | 0 | 0 | 0 |
| test-dgram-custom-lookup.js | 3 | 0 | 3 | 0 | 0 |
| test-dgram-membership.js | 12 | 0 | 0 | 0 | 12 |
| test-dgram-multicast-loopback.js | 2 | 0 | 0 | 0 | 2 |
| test-dgram-multicast-set-interface.js | 8 | 4 | 1 | 3 | 0 |
| test-dgram-setBroadcast.js | 2 | 0 | 0 | 0 | 2 |
| test-dgram-socket-buffer-size.js | 6 | 1 | 0 | 0 | 5 |
| test-dgram-unref.js | 2 | 1 | 0 | 1 | 0 |
| test-diagnostics-channel-tracing-channel-has-subscribers.js | 2 | 2 | 0 | 0 | 0 |
| test-dns-lookup.js | 3 | 0 | 0 | 0 | 3 |
| test-dns-setlocaladdress.js | 2 | 1 | 1 | 0 | 0 |
| test-dns-setservers-type-check.js | 3 | 0 | 0 | 0 | 3 |
| test-dns.js | 12 | 0 | 0 | 0 | 12 |
| test-domain-intercept.js | 3 | 3 | 0 | 0 | 0 |
| test-domain-promise.js | 10 | 4 | 0 | 0 | 6 |
| test-domexception-cause.js | 4 | 1 | 3 | 0 | 0 |
| test-error-aggregateTwoErrors.js | 6 | 2 | 4 | 0 | 0 |
| test-errors-aborterror.js | 3 | 1 | 2 | 0 | 0 |
| test-errors-hide-stack-frames.js | 11 | 0 | 0 | 0 | 11 |
| test-errors-systemerror.js | 15 | 0 | 0 | 0 | 15 |
| test-event-emitter-add-listeners.js | 3 | 3 | 0 | 0 | 0 |
| test-event-emitter-check-listener-leaks.js | 3 | 3 | 0 | 0 | 0 |
| test-event-emitter-listeners.js | 10 | 10 | 0 | 0 | 0 |
| test-event-emitter-remove-all-listeners.js | 7 | 7 | 0 | 0 | 0 |
| test-event-emitter-remove-listeners.js | 10 | 10 | 0 | 0 | 0 |
| test-events-customevent.js | 26 | 0 | 0 | 0 | 26 |
| test-events-getmaxlisteners.js | 2 | 2 | 0 | 0 | 0 |
| test-events-static-geteventlisteners.js | 4 | 0 | 0 | 0 | 4 |
| test-eventtarget-memoryleakwarning.js | 8 | 0 | 0 | 0 | 8 |
| test-eventtarget.js | 61 | 0 | 0 | 0 | 61 |
| test-file.js | 16 | 16 | 0 | 0 | 0 |
| test-fixed-queue.js | 3 | 0 | 0 | 0 | 3 |
| test-freeze-intrinsics.js | 4 | 0 | 0 | 0 | 4 |
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
| test-fs-rm.js | 4 | 4 | 0 | 0 | 0 |
| test-fs-rmdir-recursive-throws-not-found.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-rmdir-recursive-throws-on-file.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-rmdir-recursive.js | 4 | 4 | 0 | 0 | 0 |
| test-fs-stat-bigint.js | 9 | 9 | 0 | 0 | 0 |
| test-fs-stat.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-statfs.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-stream-construct-compat-graceful-fs.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-stream-construct-compat-old-node.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-stream-destroy-emit-error.js | 4 | 4 | 0 | 0 | 0 |
| test-fs-stream-fs-options.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-stream-options.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-truncate-clear-file-zero.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-truncate.js | 10 | 10 | 0 | 0 | 0 |
| test-fs-util-validateoffsetlength.js | 5 | 5 | 0 | 0 | 0 |
| test-fs-utils-get-dirents.js | 9 | 9 | 0 | 0 | 0 |
| test-fs-utimes.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-watch-abort-signal.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-watch-encoding.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-watch-enoent.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-write-buffer.js | 8 | 8 | 0 | 0 | 0 |
| test-fs-write-file-flush.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-write-file-sync.js | 6 | 5 | 1 | 0 | 0 |
| test-fs-write-file.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-write-stream-double-close.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-write-stream-end.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-write-stream-flush.js | 4 | 4 | 0 | 0 | 0 |
| test-fs-write-stream-fs.js | 2 | 2 | 0 | 0 | 0 |
| test-fs-write-stream.js | 3 | 3 | 0 | 0 | 0 |
| test-fs-writefile-with-fd.js | 4 | 3 | 1 | 0 | 0 |
| test-fs-writev-sync.js | 4 | 4 | 0 | 0 | 0 |
| test-fs-writev.js | 4 | 4 | 0 | 0 | 0 |
| test-handle-wrap-hasref.js | 6 | 0 | 0 | 0 | 6 |
| test-heap-prof-invalid-args.js | 3 | 0 | 0 | 0 | 3 |
| test-http-1.0.js | 3 | 3 | 0 | 0 | 0 |
| test-http-aborted.js | 2 | 2 | 0 | 0 | 0 |
| test-http-agent-timeout.js | 4 | 4 | 0 | 0 | 0 |
| test-http-chunk-extensions-limit.js | 3 | 3 | 0 | 0 | 0 |
| test-http-client-abort-destroy.js | 6 | 6 | 0 | 0 | 0 |
| test-http-client-abort3.js | 2 | 2 | 0 | 0 | 0 |
| test-http-client-aborted-event.js | 2 | 0 | 0 | 0 | 2 |
| test-http-client-defaults.js | 3 | 3 | 0 | 0 | 0 |
| test-http-client-res-destroyed.js | 2 | 2 | 0 | 0 | 0 |
| test-http-dummy-characters-smuggling.js | 2 | 1 | 0 | 0 | 1 |
| test-http-early-hints.js | 6 | 2 | 4 | 0 | 0 |
| test-http-generic-streams.js | 5 | 0 | 0 | 0 | 5 |
| test-http-head-throw-on-response-body-write.js | 3 | 3 | 0 | 0 | 0 |
| test-http-insecure-parser-per-stream.js | 5 | 3 | 2 | 0 | 0 |
| test-http-max-header-size-per-stream.js | 4 | 2 | 2 | 0 | 0 |
| test-http-missing-header-separator-cr.js | 3 | 0 | 0 | 0 | 3 |
| test-http-missing-header-separator-lf.js | 3 | 0 | 0 | 0 | 3 |
| test-http-outgoing-destroyed.js | 3 | 1 | 0 | 2 | 0 |
| test-http-outgoing-internal-headernames-getter.js | 2 | 2 | 0 | 0 | 0 |
| test-http-outgoing-internal-headers.js | 3 | 3 | 0 | 0 | 0 |
| test-http-outgoing-message-capture-rejection.js | 2 | 0 | 0 | 2 | 0 |
| test-http-outgoing-properties.js | 5 | 4 | 0 | 1 | 0 |
| test-http-outgoing-proto.js | 2 | 2 | 0 | 0 | 0 |
| test-http-outgoing-renderHeaders.js | 4 | 4 | 0 | 0 | 0 |
| test-http-outgoing-settimeout.js | 2 | 2 | 0 | 0 | 0 |
| test-http-parser.js | 12 | 12 | 0 | 0 | 0 |
| test-http-req-res-close.js | 3 | 1 | 2 | 0 | 0 |
| test-http-request-host-header.js | 2 | 1 | 0 | 1 | 0 |
| test-http-request-join-authorization-headers.js | 3 | 3 | 0 | 0 | 0 |
| test-http-response-close.js | 3 | 3 | 0 | 0 | 0 |
| test-http-response-multi-content-length.js | 2 | 0 | 0 | 0 | 2 |
| test-http-response-setheaders.js | 7 | 7 | 0 | 0 | 0 |
| test-http-server-capture-rejections.js | 3 | 0 | 0 | 0 | 3 |
| test-http-server-connection-list-when-close.js | 2 | 0 | 0 | 0 | 2 |
| test-http-server-non-utf8-header.js | 3 | 3 | 0 | 0 | 0 |
| test-http-server-options-highwatermark.js | 2 | 0 | 0 | 0 | 2 |
| test-http-server-timeouts-validation.js | 7 | 7 | 0 | 0 | 0 |
| test-http-transfer-encoding-smuggling.js | 2 | 2 | 0 | 0 | 0 |
| test-http-write-head-2.js | 4 | 4 | 0 | 0 | 0 |
| test-icu-data-dir.js | 2 | 0 | 0 | 0 | 2 |
| test-icu-transcode.js | 5 | 0 | 0 | 0 | 5 |
| test-internal-error-original-names.js | 3 | 0 | 0 | 0 | 3 |
| test-internal-errors.js | 8 | 0 | 0 | 0 | 8 |
| test-internal-fs-syncwritestream.js | 8 | 0 | 0 | 0 | 8 |
| test-internal-fs.js | 2 | 0 | 0 | 0 | 2 |
| test-internal-socket-list-receive.js | 4 | 0 | 0 | 0 | 4 |
| test-internal-socket-list-send.js | 6 | 0 | 0 | 0 | 6 |
| test-internal-util-objects.js | 2 | 1 | 0 | 0 | 1 |
| test-internal-validators-validateoneof.js | 6 | 0 | 0 | 0 | 6 |
| test-module-create-require-multibyte.js | 2 | 2 | 0 | 0 | 0 |
| test-module-multi-extensions.js | 7 | 7 | 0 | 0 | 0 |
| test-module-setsourcemapssupport.js | 2 | 2 | 0 | 0 | 0 |
| test-module-strip-types.js | 9 | 0 | 0 | 0 | 9 |
| test-net-allow-half-open.js | 2 | 2 | 0 | 0 | 0 |
| test-net-autoselectfamily-default.js | 2 | 2 | 0 | 0 | 0 |
| test-net-autoselectfamily.js | 4 | 3 | 0 | 1 | 0 |
| test-net-better-error-messages-path.js | 2 | 2 | 0 | 0 | 0 |
| test-net-blocklist.js | 4 | 3 | 0 | 1 | 0 |
| test-net-bytes-written-large.js | 3 | 0 | 0 | 3 | 0 |
| test-net-connect-options-port.js | 4 | 0 | 0 | 0 | 4 |
| test-net-normalize-args.js | 2 | 0 | 0 | 0 | 2 |
| test-net-perf_hooks.js | 2 | 0 | 0 | 0 | 2 |
| test-net-server-call-listen-multiple-times.js | 3 | 3 | 0 | 0 | 0 |
| test-net-server-listen-handle.js | 2 | 0 | 0 | 0 | 2 |
| test-net-server-listen-options-signal.js | 3 | 0 | 0 | 0 | 3 |
| test-net-server-listen-options.js | 3 | 1 | 0 | 0 | 2 |
| test-net-server-listen-path.js | 6 | 6 | 0 | 0 | 0 |
| test-net-socket-write-after-close.js | 2 | 2 | 0 | 0 | 0 |
| test-nodeeventtarget.js | 7 | 0 | 0 | 0 | 7 |
| test-perf-hooks-histogram.js | 6 | 0 | 0 | 0 | 6 |
| test-perf-hooks-resourcetiming.js | 5 | 0 | 0 | 0 | 5 |
| test-perf-hooks-usertiming.js | 3 | 0 | 0 | 0 | 3 |
| test-performance-function.js | 6 | 0 | 0 | 0 | 6 |
| test-performance-gc.js | 2 | 1 | 1 | 0 | 0 |
| test-performanceobserver.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-allow-child-process-cli.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-allow-wasi-cli.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-allow-worker-cli.js | 2 | 1 | 0 | 0 | 1 |
| test-permission-child-process-cli.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-fs-read.js | 3 | 2 | 1 | 0 | 0 |
| test-permission-fs-require.js | 4 | 2 | 2 | 0 | 0 |
| test-permission-fs-symlink-target-write.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-fs-symlink.js | 4 | 0 | 0 | 0 | 4 |
| test-permission-fs-traversal-path.js | 3 | 0 | 0 | 0 | 3 |
| test-permission-fs-wildcard.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-fs-windows-path.js | 4 | 0 | 0 | 0 | 4 |
| test-permission-fs-write-report.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-fs-write-v8.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-has.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-inspector-brk.js | 2 | 0 | 0 | 0 | 2 |
| test-permission-inspector.js | 2 | 0 | 0 | 0 | 2 |
| test-primordials-apply.js | 6 | 0 | 0 | 0 | 6 |
| test-primordials-promise.js | 2 | 0 | 0 | 0 | 2 |
| test-primordials-regexp.js | 11 | 0 | 0 | 0 | 11 |
| test-priority-queue.js | 6 | 0 | 0 | 0 | 6 |
| test-process-env-allowed-flags.js | 3 | 1 | 0 | 0 | 2 |
| test-process-env-windows-error-reset.js | 2 | 2 | 0 | 0 | 0 |
| test-process-getactiveresources-track-timer-lifetime.js | 2 | 0 | 0 | 0 | 2 |
| test-process-uncaught-exception-monitor.js | 2 | 0 | 0 | 0 | 2 |
| test-querystring.js | 11 | 11 | 0 | 0 | 0 |
| test-queue-microtask.js | 2 | 0 | 0 | 0 | 2 |
| test-readline-emit-keypress-events.js | 3 | 0 | 0 | 0 | 3 |
| test-readline-interface.js | 42 | 0 | 0 | 0 | 42 |
| test-readline-promises-interface.js | 33 | 0 | 0 | 0 | 33 |
| test-readline-tab-complete.js | 2 | 0 | 0 | 0 | 2 |
| test-readline.js | 6 | 0 | 0 | 0 | 6 |
| test-release-changelog.js | 2 | 0 | 0 | 0 | 2 |
| test-require-cache.js | 2 | 2 | 0 | 0 | 0 |
| test-require-node-prefix.js | 2 | 2 | 0 | 0 | 0 |
| test-require-resolve-opts-paths-relative.js | 3 | 3 | 0 | 0 | 0 |
| test-require-resolve.js | 2 | 0 | 0 | 0 | 2 |
| test-runner-assert.js | 2 | 1 | 1 | 0 | 0 |
| test-runner-cli-concurrency.js | 5 | 0 | 0 | 0 | 5 |
| test-runner-cli-timeout.js | 3 | 0 | 0 | 0 | 3 |
| test-runner-cli.js | 11 | 0 | 11 | 0 | 0 |
| test-runner-concurrency.js | 4 | 0 | 0 | 0 | 4 |
| test-runner-coverage.js | 12 | 12 | 0 | 0 | 0 |
| test-runner-custom-assertions.js | 5 | 5 | 0 | 0 | 0 |
| test-runner-error-reporter.js | 2 | 0 | 0 | 0 | 2 |
| test-runner-extraneous-async-activity.js | 4 | 0 | 0 | 0 | 4 |
| test-runner-force-exit-flush.js | 3 | 0 | 0 | 0 | 3 |
| test-runner-mocking.js | 43 | 42 | 1 | 0 | 0 |
| test-runner-module-mocking.js | 19 | 15 | 4 | 0 | 0 |
| test-runner-no-isolation-filtering.js | 3 | 0 | 0 | 0 | 3 |
| test-runner-snapshot-file-tests.js | 2 | 0 | 0 | 0 | 2 |
| test-runner-snapshot-tests.js | 6 | 0 | 0 | 0 | 6 |
| test-runner-test-filepath.js | 2 | 2 | 0 | 0 | 0 |
| test-runner-test-fullname.js | 2 | 2 | 0 | 0 | 0 |
| test-runner-wait-for.js | 7 | 6 | 0 | 1 | 0 |
| test-set-http-max-http-headers.js | 3 | 1 | 0 | 0 | 2 |
| test-set-incoming-message-header.js | 3 | 2 | 0 | 0 | 1 |
| test-shadow-realm-prepare-stack-trace.js | 2 | 0 | 0 | 0 | 2 |
| test-source-map-api.js | 9 | 0 | 0 | 0 | 9 |
| test-source-map-enable.js | 23 | 23 | 0 | 0 | 0 |
| test-sqlite-database-sync.js | 5 | 5 | 0 | 0 | 0 |
| test-sqlite-session.js | 14 | 13 | 1 | 0 | 0 |
| test-sqlite-statement-sync.js | 9 | 8 | 1 | 0 | 0 |
| test-sqlite.js | 6 | 5 | 1 | 0 | 0 |
| test-startup-empty-regexp-statics.js | 3 | 0 | 0 | 0 | 3 |
| test-startup-large-pages.js | 2 | 0 | 0 | 0 | 2 |
| test-stream-add-abort-signal.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-auto-destroy.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-catch-rejections.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-compose-operator.js | 8 | 8 | 0 | 0 | 0 |
| test-stream-compose.js | 22 | 21 | 1 | 0 | 0 |
| test-stream-construct.js | 12 | 12 | 0 | 0 | 0 |
| test-stream-consumers.js | 16 | 16 | 0 | 0 | 0 |
| test-stream-destroy.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-drop-take.js | 6 | 5 | 1 | 0 | 0 |
| test-stream-duplex-destroy.js | 16 | 16 | 0 | 0 | 0 |
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
| test-stream-finished.js | 42 | 35 | 6 | 1 | 0 |
| test-stream-flatMap.js | 8 | 8 | 0 | 0 | 0 |
| test-stream-forEach.js | 11 | 11 | 0 | 0 | 0 |
| test-stream-map.js | 17 | 15 | 2 | 0 | 0 |
| test-stream-objectmode-undefined.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-once-readable-pipe.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-pipe-error-handling.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-pipe-flow.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-pipe-same-destination-twice.js | 3 | 3 | 0 | 0 | 0 |
| test-stream-pipe-unpipe-streams.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-pipeline.js | 80 | 77 | 1 | 2 | 0 |
| test-stream-promises.js | 9 | 9 | 0 | 0 | 0 |
| test-stream-readable-aborted.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-readable-async-iterators.js | 7 | 0 | 6 | 1 | 0 |
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
| test-stream-reduce.js | 8 | 7 | 1 | 0 | 0 |
| test-stream-toArray.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-transform-destroy.js | 8 | 8 | 0 | 0 | 0 |
| test-stream-transform-split-highwatermark.js | 2 | 2 | 0 | 0 | 0 |
| test-stream-typedarray.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-uint8array.js | 5 | 5 | 0 | 0 | 0 |
| test-stream-unpipe-event.js | 6 | 6 | 0 | 0 | 0 |
| test-stream-wrap-encoding.js | 2 | 0 | 0 | 0 | 2 |
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
| test-streams-highwatermark.js | 6 | 4 | 0 | 0 | 2 |
| test-stringbytes-external.js | 3 | 0 | 0 | 0 | 3 |
| test-tick-processor-version-check.js | 2 | 0 | 0 | 0 | 2 |
| test-timers-immediate-promisified.js | 8 | 0 | 0 | 0 | 8 |
| test-timers-interval-promisified.js | 12 | 0 | 0 | 0 | 12 |
| test-timers-refresh.js | 6 | 0 | 0 | 0 | 6 |
| test-timers-timeout-promisified.js | 8 | 0 | 0 | 0 | 8 |
| test-timers-to-primitive.js | 2 | 2 | 0 | 0 | 0 |
| test-timers-unenroll-unref-interval.js | 5 | 5 | 0 | 0 | 0 |
| test-timers-unref.js | 3 | 3 | 0 | 0 | 0 |
| test-timers-user-call.js | 2 | 2 | 0 | 0 | 0 |
| test-timers-zero-timeout.js | 2 | 2 | 0 | 0 | 0 |
| test-url-fileurltopath.js | 8 | 8 | 0 | 0 | 0 |
| test-url-format-whatwg.js | 5 | 5 | 0 | 0 | 0 |
| test-url-parse-format.js | 2 | 2 | 0 | 0 | 0 |
| test-url-pathtofileurl.js | 5 | 5 | 0 | 0 | 0 |
| test-util-callbackify.js | 9 | 9 | 0 | 0 | 0 |
| test-util-deprecate.js | 3 | 3 | 0 | 0 | 0 |
| test-util-format.js | 5 | 0 | 0 | 0 | 5 |
| test-util-getcallsites.js | 13 | 13 | 0 | 0 | 0 |
| test-util-inspect-getters-accessing-this.js | 2 | 2 | 0 | 0 | 0 |
| test-util-inspect.js | 99 | 0 | 0 | 0 | 99 |
| test-util-isDeepStrictEqual.js | 2 | 2 | 0 | 0 | 0 |
| test-util-promisify.js | 19 | 19 | 0 | 0 | 0 |
| test-util-types.js | 3 | 3 | 0 | 0 | 0 |
| test-uv-unmapped-exception.js | 2 | 0 | 0 | 0 | 2 |
| test-v8-collect-gc-profile-exit-before-stop.js | 2 | 0 | 0 | 0 | 2 |
| test-v8-coverage.js | 9 | 9 | 0 | 0 | 0 |
| test-v8-query-objects.js | 5 | 0 | 0 | 0 | 5 |
| test-v8-serdes.js | 14 | 0 | 0 | 0 | 14 |
| test-validators.js | 7 | 0 | 0 | 0 | 7 |
| test-vm-basic.js | 7 | 0 | 0 | 0 | 7 |
| test-vm-codegen.js | 3 | 0 | 0 | 0 | 3 |
| test-vm-context-dont-contextify.js | 8 | 0 | 0 | 0 | 8 |
| test-vm-measure-memory-lazy.js | 4 | 0 | 0 | 0 | 4 |
| test-vm-module-basic.js | 9 | 0 | 0 | 0 | 9 |
| test-vm-new-script-new-context.js | 8 | 6 | 2 | 0 | 0 |
| test-webcrypto-constructors.js | 19 | 19 | 0 | 0 | 0 |
| test-webcrypto-derivebits.js | 4 | 2 | 2 | 0 | 0 |
| test-webcrypto-derivekey.js | 6 | 3 | 3 | 0 | 0 |
| test-webcrypto-encrypt-decrypt-aes.js | 4 | 4 | 0 | 0 | 0 |
| test-webcrypto-encrypt-decrypt.js | 4 | 3 | 0 | 1 | 0 |
| test-webcrypto-export-import-ec.js | 2 | 0 | 0 | 0 | 2 |
| test-webcrypto-export-import.js | 5 | 5 | 0 | 0 | 0 |
| test-webcrypto-random.js | 4 | 4 | 0 | 0 | 0 |
| test-webcrypto-sign-verify.js | 6 | 5 | 0 | 1 | 0 |
| test-webcrypto-webidl.js | 28 | 0 | 0 | 0 | 28 |
| test-webstorage.js | 8 | 1 | 0 | 0 | 7 |
| test-webstreams-abort-controller.js | 6 | 6 | 0 | 0 | 0 |
| test-webstreams-compose.js | 20 | 20 | 0 | 0 | 0 |
| test-webstreams-finished.js | 20 | 20 | 0 | 0 | 0 |
| test-webstreams-pipeline.js | 17 | 17 | 0 | 0 | 0 |
| test-whatwg-encoding-custom-fatal-streaming.js | 2 | 0 | 0 | 0 | 2 |
| test-whatwg-encoding-custom-interop.js | 4 | 3 | 0 | 0 | 1 |
| test-whatwg-encoding-custom-textdecoder.js | 12 | 0 | 0 | 0 | 12 |
| test-whatwg-events-add-event-listener-options-passive.js | 2 | 0 | 0 | 0 | 2 |
| test-whatwg-events-add-event-listener-options-signal.js | 10 | 7 | 2 | 1 | 0 |
| test-whatwg-events-customevent.js | 3 | 2 | 1 | 0 | 0 |
| test-whatwg-readablebytestream-bad-buffers-and-views.js | 4 | 0 | 0 | 0 | 4 |
| test-whatwg-readablebytestream.js | 11 | 2 | 0 | 0 | 9 |
| test-whatwg-readablestream.js | 82 | 0 | 0 | 0 | 82 |
| test-whatwg-transformstream.js | 7 | 0 | 0 | 0 | 7 |
| test-whatwg-url-custom-searchparams-constructor.js | 2 | 0 | 0 | 0 | 2 |
| test-whatwg-url-custom-searchparams-delete.js | 2 | 0 | 0 | 0 | 2 |
| test-whatwg-url-custom-searchparams-stringifier.js | 2 | 0 | 0 | 0 | 2 |
| test-whatwg-url-custom-setters.js | 2 | 0 | 0 | 0 | 2 |
| test-whatwg-url-properties.js | 2 | 0 | 0 | 0 | 2 |
| test-whatwg-webstreams-adapters-streambase.js | 4 | 0 | 0 | 0 | 4 |
| test-whatwg-webstreams-adapters-to-readablestream.js | 8 | 0 | 0 | 0 | 8 |
| test-whatwg-webstreams-adapters-to-readablewritablepair.js | 12 | 0 | 0 | 0 | 12 |
| test-whatwg-webstreams-adapters-to-streamduplex.js | 9 | 0 | 0 | 0 | 9 |
| test-whatwg-webstreams-adapters-to-streamreadable.js | 9 | 0 | 0 | 0 | 9 |
| test-whatwg-webstreams-adapters-to-streamwritable.js | 9 | 0 | 0 | 0 | 9 |
| test-whatwg-webstreams-adapters-to-writablestream.js | 9 | 0 | 0 | 0 | 9 |
| test-whatwg-webstreams-encoding.js | 2 | 0 | 0 | 0 | 2 |
| test-whatwg-webstreams-transfer.js | 13 | 0 | 0 | 0 | 13 |
| test-whatwg-writablestream.js | 7 | 0 | 0 | 0 | 7 |
| test-worker-message-channel.js | 3 | 1 | 2 | 0 | 0 |
| test-worker-message-port-transfer-native.js | 2 | 0 | 0 | 0 | 2 |
| test-worker-message-port.js | 9 | 0 | 9 | 0 | 0 |
| test-worker-workerdata-messageport.js | 5 | 3 | 2 | 0 | 0 |
| test-wrap-js-stream-destroy.js | 3 | 0 | 0 | 0 | 3 |
| test-wrap-js-stream-duplex.js | 2 | 0 | 0 | 0 | 2 |
| test-x509-escaping.js | 8 | 0 | 0 | 0 | 8 |
| test-zlib-brotli.js | 3 | 3 | 0 | 0 | 0 |
| test-zlib-create-raw.js | 2 | 2 | 0 | 0 | 0 |
| test-zlib-destroy.js | 2 | 1 | 1 | 0 | 0 |
| test-zlib-dictionary-fail.js | 3 | 3 | 0 | 0 | 0 |
| test-zlib-failed-init.js | 2 | 2 | 0 | 0 | 0 |
| test-zlib-zero-windowBits.js | 2 | 2 | 0 | 0 | 0 |
| test-async-wrap-getasyncid.js | 18 | 0 | 0 | 0 | 18 |
| test-crypto-timing-safe-equal.js | 3 | 3 | 0 | 0 | 0 |
| test-diagnostic-dir-cpu-prof.js | 2 | 0 | 0 | 0 | 2 |
| test-diagnostic-dir-heap-prof.js | 2 | 0 | 0 | 0 | 2 |
| test-error-serdes.js | 2 | 0 | 0 | 0 | 2 |
| test-fs-opendir-recursive.js | 7 | 7 | 0 | 0 | 0 |
| test-fs-readdir-recursive.js | 6 | 6 | 0 | 0 | 0 |
| test-fs-watch.js | 6 | 3 | 2 | 1 | 0 |
| test-init.js | 3 | 3 | 0 | 0 | 0 |
| test-module-loading.js | 11 | 0 | 0 | 0 | 11 |
| test-net-server-address.js | 5 | 5 | 0 | 0 | 0 |
| test-net-server-bind.js | 5 | 5 | 0 | 0 | 0 |
| test-perf-hooks.js | 2 | 0 | 0 | 0 | 2 |
| test-performance-eventloopdelay.js | 3 | 0 | 0 | 0 | 3 |

## Tests That Were Auto-Enabled

These tests were marked with `"skip": true` in `config.jsonc` but actually pass.
The report has automatically removed the skip flag.

32 test(s) were auto-enabled:

- `parallel/test-blocklist.js#block_13_block_13`
- `parallel/test-blocklist.js#block_14_block_14`
- `parallel/test-blocklist.js#block_15_block_15`
- `parallel/test-blocklist.js#block_16_block_16`
- `parallel/test-dgram-socket-buffer-size.js#block_03_block_03`
- `parallel/test-domain-promise.js#block_02_block_02`
- `parallel/test-domain-promise.js#block_04_block_04`
- `parallel/test-domain-promise.js#block_07_block_07`
- `parallel/test-domain-promise.js#block_08_block_08`
- `es-module/test-require-module.js#block_03_test_esm_that_require_cjs`
- `es-module/test-require-module.js#block_05_test_data_import`
- `parallel/test-internal-util-objects.js#block_01_block_01`
- `parallel/test-process-env-allowed-flags.js#block_01_assert_all_canonical_flags_begin_with_dash_es`
- `parallel/test-net-server-listen-options.js#block_00_block_00`
- `parallel/test-set-http-max-http-headers.js#test_00_test_00`
- `parallel/test-set-incoming-message-header.js#block_00_headers_setter_function_set_a_header_correctly`
- `parallel/test-set-incoming-message-header.js#block_01_trailers_setter_function_set_a_header_correctly`
- `parallel/test-streams-highwatermark.js#block_03_block_03`
- `parallel/test-streams-highwatermark.js#block_05_block_05`
- `parallel/test-streams-highwatermark.js#block_01_block_01`
- `parallel/test-streams-highwatermark.js#block_02_block_02`
- `parallel/test-http-dummy-characters-smuggling.js#block_00_block_00`
- `parallel/test-permission-allow-worker-cli.js#block_01_to_spawn_unless_allow_worker_is_sent`
- `parallel/test-whatwg-encoding-custom-interop.js#block_00_test_textencoder`
- `parallel/test-whatwg-encoding-custom-interop.js#block_01_block_01`
- `parallel/test-whatwg-encoding-custom-interop.js#block_02_block_02`
- `parallel/test-whatwg-readablebytestream.js#block_09_block_09`
- `parallel/test-whatwg-readablebytestream.js#block_10_block_10`
- `parallel/test-webstorage.js#test_00_disabled_without_experimental_webstorage`
- `es-module/test-require-module.js#block_00_test_named_exports`
- `es-module/test-require-module.js#block_01_test_esm_that_import_esm`
- `parallel/test-stream-pipeline.js#block_06_block_06`

## Passing Tests Auto-Added to Config

These tests pass but were not listed in `config.jsonc`.
The report has automatically added them.

_All passing tests are already in config.jsonc._

## All Results by Module (Public + Internals)

| Module | Total | Pass | Fail | Error | Skip | Impossible | Pass% |
|--------|-------|------|------|-------|------|------------|-------|
| abort | 28 | 26 | 1 | 0 | 1 | 0 | 92.9% |
| assert | 95 | 94 | 0 | 1 | 0 | 0 | 98.9% |
| async_hooks | 38 | 4 | 0 | 0 | 34 | 0 | 10.5% |
| blob | 24 | 2 | 0 | 0 | 22 | 0 | 8.3% |
| buffer | 180 | 170 | 0 | 8 | 2 | 0 | 94.4% |
| child_process | 121 | 16 | 2 | 2 | 0 | 101 | 13.2% |
| cli | 32 | 12 | 0 | 0 | 20 | 0 | 37.5% |
| cluster | 87 | 0 | 0 | 0 | 0 | 87 | 0.0% |
| common | 9 | 1 | 1 | 0 | 7 | 0 | 11.1% |
| compile | 15 | 0 | 0 | 0 | 0 | 15 | 0.0% |
| console | 31 | 30 | 0 | 0 | 1 | 0 | 96.8% |
| crypto | 239 | 212 | 3 | 8 | 16 | 0 | 88.7% |
| dgram | 118 | 20 | 4 | 4 | 84 | 6 | 16.9% |
| diagnostics_channel | 33 | 18 | 0 | 0 | 14 | 1 | 54.5% |
| dns | 42 | 2 | 1 | 0 | 39 | 0 | 4.8% |
| domain | 61 | 28 | 0 | 0 | 32 | 1 | 45.9% |
| encoding | 1 | 1 | 0 | 0 | 0 | 0 | 100.0% |
| errors | 46 | 3 | 6 | 0 | 37 | 0 | 6.5% |
| eslint | 24 | 0 | 0 | 0 | 0 | 24 | 0.0% |
| events | 93 | 59 | 0 | 0 | 34 | 0 | 63.4% |
| fetch | 1 | 1 | 0 | 0 | 0 | 0 | 100.0% |
| fs | 478 | 431 | 4 | 12 | 30 | 1 | 90.2% |
| global | 11 | 3 | 0 | 0 | 8 | 0 | 27.3% |
| heap | 19 | 0 | 0 | 0 | 0 | 19 | 0.0% |
| http | 807 | 258 | 11 | 7 | 206 | 325 | 32.0% |
| inspector | 95 | 1 | 0 | 0 | 0 | 94 | 1.1% |
| internal | 53 | 3 | 0 | 0 | 50 | 0 | 5.7% |
| module | 184 | 84 | 1 | 0 | 92 | 7 | 45.7% |
| net | 223 | 137 | 2 | 6 | 77 | 1 | 61.4% |
| node | 8 | 0 | 0 | 0 | 8 | 0 | 0.0% |
| os | 6 | 6 | 0 | 0 | 0 | 0 | 100.0% |
| other | 449 | 82 | 3 | 0 | 317 | 47 | 18.3% |
| path | 16 | 16 | 0 | 0 | 0 | 0 | 100.0% |
| perf_hooks | 41 | 3 | 1 | 0 | 36 | 1 | 7.3% |
| permission | 55 | 5 | 3 | 0 | 42 | 5 | 9.1% |
| process | 90 | 40 | 0 | 0 | 48 | 2 | 44.4% |
| promises | 23 | 1 | 0 | 0 | 22 | 0 | 4.3% |
| querystring | 14 | 14 | 0 | 0 | 0 | 0 | 100.0% |
| readline | 101 | 0 | 0 | 0 | 99 | 2 | 0.0% |
| repl | 77 | 1 | 0 | 0 | 0 | 76 | 1.3% |
| shadow_realm | 11 | 0 | 0 | 0 | 10 | 1 | 0.0% |
| signal | 5 | 1 | 0 | 0 | 4 | 0 | 20.0% |
| snapshot | 27 | 0 | 0 | 0 | 0 | 27 | 0.0% |
| sqlite | 39 | 36 | 3 | 0 | 0 | 0 | 92.3% |
| stdio | 23 | 14 | 0 | 0 | 9 | 0 | 60.9% |
| stream | 753 | 711 | 21 | 4 | 16 | 1 | 94.4% |
| string_decoder | 3 | 3 | 0 | 0 | 0 | 0 | 100.0% |
| test_runner | 157 | 92 | 17 | 1 | 47 | 0 | 58.6% |
| timers | 97 | 50 | 0 | 0 | 47 | 0 | 51.5% |
| tls | 197 | 4 | 0 | 0 | 0 | 193 | 2.0% |
| trace_events | 35 | 16 | 0 | 0 | 17 | 2 | 45.7% |
| tty | 5 | 0 | 0 | 0 | 5 | 0 | 0.0% |
| url | 29 | 29 | 0 | 0 | 0 | 0 | 100.0% |
| util | 174 | 68 | 0 | 1 | 105 | 0 | 39.1% |
| v8 | 45 | 14 | 0 | 0 | 31 | 0 | 31.1% |
| vm | 121 | 25 | 2 | 0 | 93 | 1 | 20.7% |
| webcrypto | 100 | 46 | 5 | 2 | 45 | 2 | 46.0% |
| webstreams | 68 | 65 | 0 | 0 | 3 | 0 | 95.6% |
| whatwg | 264 | 18 | 3 | 1 | 242 | 0 | 6.8% |
| worker_threads | 153 | 18 | 13 | 0 | 2 | 120 | 11.8% |
| zlib | 61 | 52 | 1 | 0 | 8 | 0 | 85.2% |


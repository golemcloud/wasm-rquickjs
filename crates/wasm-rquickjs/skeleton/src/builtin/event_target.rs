// JS functions for the Event/EventTarget/CustomEvent implementation
pub const EVENT_TARGET_JS: &str = include_str!("event_target.js");

// JS code wiring the event_target module into the global context
pub const WIRE_JS: &str = r#"
        import { Event, EventTarget, CustomEvent } from '__wasm_rquickjs_builtin/event_target';
        globalThis.Event = Event;
        globalThis.EventTarget = EventTarget;
        globalThis.CustomEvent = CustomEvent;
    "#;

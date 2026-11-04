// JS functions for the structuredClone implementation
// Based on @ungap/structured-clone v1.3.0
pub const STRUCTURED_CLONE_JS: &str = include_str!("structured_clone.js");

// Engine facts, a shallow primitive-data copy, and buffer detach live here.
// Graph traversal, clone policy, transfer validation and public errors stay in JS.
#[rquickjs::module]
pub mod native_module {
    use rquickjs::{Array, Ctx, Error, Object, Result, Value, object::Property, qjs};

    struct OwnKeys<'a, 'js> {
        ctx: &'a Ctx<'js>,
        entries: *mut qjs::JSPropertyEnum,
        len: u32,
    }

    impl Drop for OwnKeys<'_, '_> {
        fn drop(&mut self) {
            if !self.entries.is_null() {
                unsafe {
                    qjs::JS_FreePropertyEnum(self.ctx.as_raw().as_ptr(), self.entries, self.len);
                }
            }
        }
    }

    fn define_property(
        ctx: &Ctx<'_>,
        array: &Array<'_>,
        atom: qjs::JSAtom,
        value: &Value<'_>,
    ) -> Result<()> {
        // Define an own data property, never an inherited array setter. The
        // engine consumes the duplicated value on both success and failure.
        let result = unsafe {
            let raw_ctx = ctx.as_raw().as_ptr();
            qjs::JS_DefinePropertyValue(
                raw_ctx,
                array.as_value().as_raw(),
                atom,
                qjs::JS_DupValue(raw_ctx, value.as_raw()),
                qjs::JS_PROP_C_W_E as i32,
            )
        };
        if result < 0 {
            return Err(Error::Exception);
        }
        Ok(())
    }

    #[rquickjs::function]
    pub fn copy_array_data<'js>(
        ctx: Ctx<'js>,
        value: Value<'js>,
        length: u32,
    ) -> Result<Option<Object<'js>>> {
        // The JS owner has already established a non-Proxy intrinsic array.
        // Copy only a primitive prefix, without invoking getters or recursing.
        // At the first accessor/object, JS resumes with the remaining snapshotted
        // keys and reads live values in graph traversal order.
        let mut names = OwnKeys {
            ctx: &ctx,
            entries: std::ptr::null_mut(),
            len: 0,
        };
        let status = unsafe {
            qjs::JS_GetOwnPropertyNames(
                ctx.as_raw().as_ptr(),
                &mut names.entries,
                &mut names.len,
                value.as_raw(),
                (qjs::JS_GPN_STRING_MASK | qjs::JS_GPN_ENUM_ONLY) as i32,
            )
        };
        if status < 0 {
            return Err(Error::Exception);
        }
        let copied = Array::new(ctx.clone())?;
        let mut first_symbol = None;
        let mut prefix_len = names.len;
        for index in 0..names.len {
            let atom = unsafe { (*names.entries.add(index as usize)).atom };
            let mut descriptor = qjs::JSPropertyDescriptor {
                flags: 0,
                value: qjs::JS_UNDEFINED,
                getter: qjs::JS_UNDEFINED,
                setter: qjs::JS_UNDEFINED,
            };
            let present = unsafe {
                qjs::JS_GetOwnProperty(ctx.as_raw().as_ptr(), &mut descriptor, value.as_raw(), atom)
            };
            // All descriptor references are owned, including the unused
            // accessor functions. Release them on every fallback/error path.
            let property = unsafe { Value::from_raw(ctx.clone(), descriptor.value) };
            let _getter = unsafe { Value::from_raw(ctx.clone(), descriptor.getter) };
            let _setter = unsafe { Value::from_raw(ctx.clone(), descriptor.setter) };
            if present < 0 {
                return Err(Error::Exception);
            }
            if present == 0
                || descriptor.flags & qjs::JS_PROP_GETSET as i32 != 0
                || property.is_object()
            {
                // A zero-length prefix avoids materializing a second key
                // snapshot for arrays whose first value needs JS traversal.
                if index == 0 {
                    return Ok(None);
                }
                prefix_len = index;
                break;
            }
            if property.is_symbol() && first_symbol.is_none() {
                first_symbol = Some(property.clone());
            }
            define_property(&ctx, &copied, atom, &property)?;
        }
        // Array lengths span the full u32 range. Widen to a JS number instead
        // of letting the binding's small-integer conversion wrap to signed i32.
        // Keep the intrinsic non-enumerable, non-configurable length property.
        copied.prop("length", Property::from(f64::from(length)).writable())?;
        let remaining = if prefix_len < names.len {
            let remaining = Array::new(ctx.clone())?;
            for index in prefix_len..names.len {
                let atom = unsafe { (*names.entries.add(index as usize)).atom };
                let key = unsafe {
                    Value::from_raw(
                        ctx.clone(),
                        qjs::JS_AtomToValue(ctx.as_raw().as_ptr(), atom),
                    )
                };
                if key.is_exception() {
                    return Err(Error::Exception);
                }
                remaining.prop(
                    (index - prefix_len).to_string(),
                    Property::from(key).writable().enumerable().configurable(),
                )?;
            }
            Some(remaining)
        } else {
            None
        };
        let snapshot = Object::new(ctx.clone())?;
        snapshot.prop(
            "array",
            Property::from(copied)
                .writable()
                .enumerable()
                .configurable(),
        )?;
        snapshot.prop(
            "remaining",
            Property::from(remaining)
                .writable()
                .enumerable()
                .configurable(),
        )?;
        snapshot.prop(
            "symbol",
            Property::from(first_symbol)
                .writable()
                .enumerable()
                .configurable(),
        )?;
        Ok(Some(snapshot))
    }

    #[rquickjs::function]
    pub fn class_id(value: Value<'_>) -> u32 {
        unsafe { qjs::JS_GetClassID(value.as_raw()) }
    }

    #[rquickjs::function]
    pub fn detach_buffer(ctx: Ctx<'_>, value: Value<'_>) {
        // JS validates the complete list and graph before this commit step.
        // The engine ignores non-ArrayBuffers; no application callback runs.
        unsafe { qjs::JS_DetachArrayBuffer(ctx.as_raw().as_ptr(), value.as_raw()) };
    }
}

// JS code wiring the structuredClone function into the global context
pub const WIRE_JS: &str = r#"
        import __wasm_rquickjs_structured_clone from '__wasm_rquickjs_builtin/structured_clone';
        globalThis.structuredClone = __wasm_rquickjs_structured_clone;
    "#;

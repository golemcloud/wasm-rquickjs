//! Binding facade for the upstream macros' public `crate` option. The macros
//! retain their argument/borrow handling; only their Promise adapter changes.
pub use rquickjs::*;

pub mod promise {
    // The facade must preserve the upstream module's public namespace.
    #[allow(unused_imports)]
    pub use rquickjs::promise::*;

    pub struct Promised<F>(pub F);

    impl<'js, F, R> rquickjs::IntoJs<'js> for Promised<F>
    where
        F: std::future::Future<Output = R> + 'js,
        R: rquickjs::IntoJs<'js> + 'js,
    {
        fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
            let signal = ctx
                .userdata::<super::super::terminal_process::SignalHandle>()
                .map(|handle| (*handle).clone());
            match signal {
                Some(signal) => {
                    super::super::terminal_process::promise(ctx, self.0, signal).into_js(ctx)
                }
                None => rquickjs::promise::Promised(self.0).into_js(ctx),
            }
        }
    }
}

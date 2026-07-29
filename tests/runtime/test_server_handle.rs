use crate::common::test_server::TestServerHandle;
use std::future::pending;
use std::time::Duration;
use test_r::test;
use tokio::sync::oneshot;

struct NotifyOnDrop(Option<oneshot::Sender<()>>);

impl Drop for NotifyOnDrop {
    fn drop(&mut self) {
        if let Some(notify) = self.0.take() {
            let _ = notify.send(());
        }
    }
}

#[test]
async fn test_server_handle_aborts_owned_task_on_drop() {
    let (started_tx, started_rx) = oneshot::channel();
    let (dropped_tx, dropped_rx) = oneshot::channel();
    let task = tokio::spawn(async move {
        let _notify_on_drop = NotifyOnDrop(Some(dropped_tx));
        let _ = started_tx.send(());
        pending::<()>().await;
    });
    let server = TestServerHandle::new(task);

    started_rx.await.expect("server task did not start");
    drop(server);

    tokio::time::timeout(Duration::from_secs(1), dropped_rx)
        .await
        .expect("server task was not aborted")
        .expect("server task dropped without notifying");
}

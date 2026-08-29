use axum::body::Body;
use axum::extract::{Multipart, Path};
use axum::http::HeaderMap;
use axum::response::{AppendHeaders, IntoResponse};
use axum::routing::{get, post};
use axum::{Json, Router};
use bytes::Bytes;
use http::{StatusCode, header};
use indoc::formatdoc;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::sync::{Mutex, mpsc, watch};
use tokio::task::JoinHandle;
use tokio_util::io::ReaderStream;

pub struct TestServerHandle(JoinHandle<()>);

impl TestServerHandle {
    pub(crate) fn new(handle: JoinHandle<()>) -> Self {
        Self(handle)
    }
}

impl Drop for TestServerHandle {
    fn drop(&mut self) {
        self.0.abort();
    }
}

pub async fn start_test_server() -> (u16, TestServerHandle) {
    let listener = tokio::net::TcpListener::bind("0.0.0.0:0").await.unwrap();
    let host_http_port = listener.local_addr().unwrap().port();

    let handle = tokio::spawn(async move {
        let state_mutex = Arc::new(Mutex::new(State::default()));

        let state_mutex_1 = state_mutex.clone();
        let state_mutex_2 = state_mutex.clone();
        let state_mutex_3 = state_mutex.clone();

        let router = Router::new()
            .route(
                "/todos",
                post(async move |body: Bytes| {
                    let mut state = state_mutex_1.lock().await;

                    let req = serde_json::from_slice::<NewTodo>(&body).unwrap();

                    let todo_id = state.current_todo_id;
                    let todo = Todo {
                        id: todo_id,
                        user_id: req.user_id,
                        title: req.title,
                        body: req.body,
                        completed: false,
                    };

                    let response = (StatusCode::CREATED, Json(&todo)).into_response();

                    state.todos.push(todo);
                    state.current_todo_id += 1;

                    response
                }),
            )
            .route(
                "/todos",
                get(async move || {
                    let state = state_mutex_2.lock().await;

                    Json(&state.todos).into_response()
                }),
            )
            .route(
                "/todos/{todo_id}",
                get(async move |Path((todo_id,)): Path<(usize,)>| {
                    let state = state_mutex_3.lock().await;

                    let todo = state.todos.get(todo_id);

                    if let Some(todo) = todo {
                        Json(todo).into_response()
                    } else {
                        StatusCode::NOT_FOUND.into_response()
                    }
                }),
            )
            .route(
                "/todos-stream",
                get(async move || {
                    let mut todos = Vec::new();
                    for i in 0..100 {
                        todos.push(Todo {
                            id: i,
                            user_id: 1,
                            title: format!("todo_title_{i}"),
                            body: format!("todo_body_{i}"),
                            completed: i % 2 == 0,
                        });
                    }

                    let json_bytes = serde_json::to_vec(&todos).unwrap();

                    let body_stream = ReaderStream::with_capacity(Cursor::new(json_bytes), 100);

                    (
                        AppendHeaders([(header::CONTENT_TYPE, "application/json")]),
                        Body::from_stream(body_stream),
                    )
                }),
            )
            .route(
                "/echo",
                post(async move |body: Body| {
                    (
                        AppendHeaders([(header::CONTENT_TYPE, "application/octet-stream")]),
                        body,
                    )
                }),
            )
            .route(
                "/echo-form",
                post(async move |mut multipart: Multipart| {
                    let mut parts = Vec::new();

                    while let Some(field) = multipart.next_field().await.unwrap() {
                        let name = field.name().unwrap().to_string();
                        let data = field.bytes().await.unwrap();

                        parts.push(MultiPartPart {
                            name,
                            data: data.to_vec(),
                        });
                    }

                    Json(parts)
                }),
            )
            .route(
                "/form-echo",
                post(async move |body: Bytes| {
                    let body_str = String::from_utf8(body.to_vec()).unwrap_or_default();
                    Json(serde_json::json!({
                        "body": body_str,
                        "type": "application/x-www-form-urlencoded"
                    }))
                }),
            )
            .route(
                "/echo-referer",
                post(async move |headers: HeaderMap| {
                    let referer = headers
                        .get("referer")
                        .and_then(|h| h.to_str().ok())
                        .unwrap_or("")
                        .to_string();
                    Json(serde_json::json!({
                        "referer": referer
                    }))
                }),
            )
            .route(
                "/echo-credentials",
                post(async move |headers: HeaderMap| {
                    let authorization = headers
                        .get("authorization")
                        .and_then(|h| h.to_str().ok())
                        .unwrap_or("")
                        .to_string();
                    let cookie = headers
                        .get("cookie")
                        .and_then(|h| h.to_str().ok())
                        .unwrap_or("")
                        .to_string();
                    (
                        AppendHeaders([(header::SET_COOKIE, "test-cookie=test-value")]),
                        Json(serde_json::json!({
                            "authorization": authorization,
                            "cookie": cookie
                        })),
                    )
                }),
            )
            .route(
                "/redirect-to",
                axum::routing::any(async move |query: axum::extract::Query<RedirectParams>| {
                    if query.delay_ms > 0 {
                        tokio::time::sleep(std::time::Duration::from_millis(query.delay_ms)).await;
                    }
                    let status = StatusCode::from_u16(query.status).unwrap_or(StatusCode::FOUND);
                    (status, [("Location", query.url.clone())]).into_response()
                }),
            )
            .route(
                "/redirect-loop",
                get(async move || {
                    (StatusCode::FOUND, [("Location", "/redirect-loop")]).into_response()
                }),
            )
            .route(
                "/form-response",
                get(|| async {
                    let boundary = "WebKitFormBoundary7MA4YWxkTrZu0gW";
                    let body = formatdoc! {
                    "--{boundary}
                     Content-Disposition: form-data; name=\"username\"

                     john_doe
                     --{boundary}
                     Content-Disposition: form-data; name=\"email\"

                     john@example.com
                     --{boundary}
                     Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"
                     Content-Type: text/plain

                     Hello World
                     --{boundary}--"};
                    (
                        [(
                            "Content-Type",
                            format!("multipart/form-data; boundary={}", boundary),
                        )],
                        body,
                    )
                        .into_response()
                }),
            );

        axum::serve(listener, router).await.unwrap();
    });

    (host_http_port, TestServerHandle::new(handle))
}

pub async fn start_abort_test_server() -> (u16, TestServerHandle, mpsc::UnboundedReceiver<()>) {
    let listener = tokio::net::TcpListener::bind("0.0.0.0:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    let (arrived_tx, arrived_rx) = mpsc::unbounded_channel();
    let (ready_tx, ready_rx) = watch::channel(false);

    let handle = tokio::spawn(async move {
        let slow_ready = ready_tx.clone();
        let slow = axum::routing::any(async move || {
            let _ = arrived_tx.send(());
            let _ = slow_ready.send(true);
            std::future::pending::<&'static str>().await
        });
        let ready = axum::routing::get(async move || {
            let mut ready_rx = ready_rx;
            while !*ready_rx.borrow() {
                if ready_rx.changed().await.is_err() {
                    break;
                }
            }
            "ready"
        });
        let router = Router::new()
            .route("/slow-response", slow)
            .route(
                "/redirect-to-slow",
                axum::routing::any(async || (StatusCode::FOUND, [("Location", "/slow-response")])),
            )
            .route("/abort-ready", ready);
        axum::serve(listener, router).await.unwrap();
    });

    (port, TestServerHandle::new(handle), arrived_rx)
}

/// Lifecycle events emitted by the pending response-body fixture.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResponseBodyServerEvent {
    Connected,
    HeadSent,
    Released,
}

/// Starts an endpoint that sends its response head and one chunk, then leaves the body pending.
/// Dropping the client-side body closes the raw connection and reports through `released_rx`.
pub async fn start_response_body_abort_test_server() -> (
    u16,
    TestServerHandle,
    mpsc::UnboundedReceiver<ResponseBodyServerEvent>,
) {
    let listener = tokio::net::TcpListener::bind("0.0.0.0:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    let (released_tx, released_rx) = mpsc::unbounded_channel();

    let handle = tokio::spawn(async move {
        loop {
            let (mut socket, _) = listener.accept().await.unwrap();
            let released_tx = released_tx.clone();
            tokio::spawn(async move {
                let mut request = Vec::new();
                let mut buf = [0u8; 1024];
                while !request.windows(4).any(|window| window == b"\r\n\r\n") {
                    let read = socket.read(&mut buf).await.unwrap_or(0);
                    if read == 0 {
                        return;
                    }
                    request.extend_from_slice(&buf[..read]);
                }

                let _ = released_tx.send(ResponseBodyServerEvent::Connected);

                let truncated = request
                    .windows(b"/truncated-response-body".len())
                    .any(|window| window == b"/truncated-response-body");
                let response = if truncated {
                    b"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 100\r\nConnection: close\r\n\r\npartial".as_slice()
                } else {
                    b"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 1000000\r\nConnection: close\r\n\r\nfirst chunk".as_slice()
                };
                socket.write_all(response).await.unwrap();
                socket.flush().await.unwrap();
                let _ = released_tx.send(ResponseBodyServerEvent::HeadSent);

                if truncated {
                    let _ = socket.shutdown().await;
                } else {
                    while socket.read(&mut buf).await.unwrap_or(0) != 0 {}
                }
                let _ = released_tx.send(ResponseBodyServerEvent::Released);
            });
        }
    });

    (port, TestServerHandle::new(handle), released_rx)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Todo {
    id: usize,
    user_id: u64,
    title: String,
    body: String,
    completed: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NewTodo {
    user_id: u64,
    title: String,
    body: String,
}

#[derive(Debug, Deserialize)]
struct RedirectParams {
    url: String,
    status: u16,
    #[serde(default)]
    delay_ms: u64,
}

#[derive(Default)]
struct State {
    current_todo_id: usize,
    todos: Vec<Todo>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct MultiPartPart {
    name: String,
    data: Vec<u8>,
}

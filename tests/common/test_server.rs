use axum::body::Body;
use axum::extract::Request;
use axum::extract::{ConnectInfo, Multipart, Path};
use axum::http::HeaderMap;
use axum::middleware::Next;
use axum::response::{AppendHeaders, IntoResponse};
use axum::routing::{get, post};
use axum::{Json, Router};
use bytes::Bytes;
use http::{StatusCode, header};
use indoc::formatdoc;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::sync::Arc;
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

fn trace_http_lifecycle(router: Router, port: u16) -> Router {
    router.layer(axum::middleware::from_fn(
        move |request: Request, next: Next| async move {
            let request_id = super::test_server_http_correlation(request.headers());
            let connection = request
                .extensions()
                .get::<ConnectInfo<super::TracedTestServerConnection>>()
                .map(|connection| connection.0.clone());
            let trace_response_write = request.version() == http::Version::HTTP_11;
            super::record_test_server_arrival(request_id, port, request.uri());
            super::record_test_server_connection(request_id, connection.as_ref());
            let (parts, body) = request.into_parts();
            let request = Request::from_parts(
                parts,
                Body::new(super::traced_test_server_body(
                    body,
                    request_id,
                    "server-request",
                )),
            );
            let response = next.run(request).await;
            super::record_test_server_response_head(request_id, response.status());
            let (parts, body) = response.into_parts();
            axum::response::Response::from_parts(
                parts,
                Body::new(super::traced_test_server_response_body(
                    body,
                    request_id,
                    trace_response_write.then_some(connection).flatten(),
                )),
            )
        },
    ))
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
        let router = trace_http_lifecycle(router, host_http_port);

        let listener = super::traced_test_server_listener(listener);
        axum::serve(
            listener,
            router.into_make_service_with_connect_info::<super::TracedTestServerConnection>(),
        )
        .await
        .unwrap();
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
        let router = trace_http_lifecycle(router, port);
        let listener = super::traced_test_server_listener(listener);
        axum::serve(
            listener,
            router.into_make_service_with_connect_info::<super::TracedTestServerConnection>(),
        )
        .await
        .unwrap();
    });

    (port, TestServerHandle::new(handle), arrived_rx)
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
